/**
 * Превращает технические ошибки (ethers revert, fetch failure, MetaMask
 * rejection, OpenZeppelin AccessControl error) в короткое понятное сообщение
 * для пользователя на русском языке.
 *
 *   humanizeError(e)  →  "Эта операция уже была выполнена"
 *   humanizeError(e)  →  "Транзакция отклонена в кошельке"
 *   humanizeError(e)  →  "У этого кошелька нет роли производителя"
 *
 * Если паттерн не распознан — возвращает общее сообщение. Не показываем
 * пользователю CALL_EXCEPTION, JSON-RPC, stack-trace и т.п.
 */

interface MaybeEthersError {
  code?: string;
  shortMessage?: string;
  reason?: string | null;
  info?: { error?: { message?: string }; code?: number };
  message?: string;
  data?: string;
}

const ROLE_HASH_TO_NAME: Record<string, string> = {
  // keccak256("MANUFACTURER_ROLE")
  "0xeefb95e842a3287179d933b4460be539a1d5af11aa8b325bb45c5c8dc92de4ed": "производителя",
  // keccak256("DISTRIBUTOR_ROLE")
  "0xfbd454f36a7e1a388bd6fc3ab10d434aa4578f811acbbcf33afb1c697486313c": "дистрибьютора",
  // keccak256("PHARMACY_ROLE")
  "0x4636b9b8b30dac8e26e1f17adba7d1f8bb6b97a08a719ecaa9bc1e23a4d1bc6e": "аптеки",
  // keccak256("REGULATOR_ROLE")
  "0x14e87a4cb95cd1c5460c4925deeb1eaff9aae8c75bdc8e1d2f4f3c00f7bb88e3": "регулятора",
  // keccak256("ADMIN_ROLE")
  "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775": "администратора"
};

/** AccessControlUnauthorizedAccount(address account, bytes32 neededRole). */
const ACCESS_CONTROL_SELECTOR = "0xe2517d3f";

/** Mapping smart-contract revert strings → пользовательский текст. */
const REVERT_MESSAGES: Array<{ test: (m: string) => boolean; ru: string }> = [
  { test: m => /Operation id already used/i.test(m),
    ru: "Эта операция уже была выполнена. Обновите страницу и повторите." },
  { test: m => /Operation id is required/i.test(m),
    ru: "Не передан идентификатор операции." },
  { test: m => /Serial number already exists/i.test(m),
    ru: "Продукт с таким серийным номером уже зарегистрирован." },
  { test: m => /Serial number is required/i.test(m),
    ru: "Укажите серийный номер." },
  { test: m => /Product name is required/i.test(m),
    ru: "Укажите название препарата." },
  { test: m => /Product does not exist/i.test(m),
    ru: "Продукт не найден в реестре." },
  { test: m => /Batch does not exist/i.test(m),
    ru: "Партия не найдена в реестре." },
  { test: m => /Only batch manufacturer can add products/i.test(m),
    ru: "Только создатель партии может добавлять в неё продукты." },
  { test: m => /Batch is recalled/i.test(m),
    ru: "Партия отозвана — добавлять продукты нельзя." },
  { test: m => /Batch already recalled/i.test(m),
    ru: "Партия уже отозвана." },
  { test: m => /Batch is not recalled/i.test(m),
    ru: "Партия не была отозвана — восстанавливать нечего." },
  { test: m => /New owner is not an authorized supply actor/i.test(m),
    ru: "Адрес получателя не зарегистрирован как производитель, дистрибьютор или аптека." },
  { test: m => /Sender is not an authorized supply actor/i.test(m),
    ru: "Ваш кошелёк не зарегистрирован в цепочке поставок." },
  { test: m => /New owner cannot be zero address/i.test(m),
    ru: "Нельзя передать продукт нулевому адресу." },
  { test: m => /New owner must be different/i.test(m),
    ru: "Адрес получателя совпадает с текущим владельцем." },
  { test: m => /Only current owner can perform this action/i.test(m),
    ru: "Только текущий владелец продукта может выполнить это действие." },
  { test: m => /Sold product cannot be transferred/i.test(m),
    ru: "Проданный продукт нельзя передавать дальше." },
  { test: m => /Sold product status is final/i.test(m),
    ru: "Статус «Продан» — окончательный, изменить нельзя." },
  { test: m => /Product is blocked/i.test(m),
    ru: "Продукт заблокирован из-за отзыва партии." },
  { test: m => /Product batch is recalled/i.test(m),
    ru: "Партия продукта отозвана — операции запрещены." },
  { test: m => /Only pharmacy can mark sold/i.test(m),
    ru: "Только аптека может отметить продукт как проданный." },
  { test: m => /Product must be delivered before sold/i.test(m),
    ru: "Сначала продукт должен получить статус «Доставлен», только потом «Продан»." },
  { test: m => /Use recallBatch for recalls/i.test(m),
    ru: "Используйте отзыв партии вместо ручной смены статуса." },
  { test: m => /Invalid status transition/i.test(m),
    ru: "Невозможный переход статуса (допустимо: Произведён → В пути → Доставлен → Продан)." },
  { test: m => /Status is already set/i.test(m),
    ru: "Этот статус уже установлен — изменения не требуются." },
  { test: m => /Actor is not authorized/i.test(m),
    ru: "У вашего кошелька нет нужной роли в цепочке." },
  { test: m => /Recall reason is required/i.test(m),
    ru: "Укажите причину отзыва." },
  { test: m => /Unrecall reason is required/i.test(m),
    ru: "Укажите причину восстановления партии." },
  { test: m => /Production date is required/i.test(m),
    ru: "Не указана дата производства." },
  { test: m => /Expiration date must be after production date/i.test(m),
    ru: "Срок годности должен быть позже даты производства." },
  { test: m => /Expiration date must be in the future/i.test(m),
    ru: "Срок годности уже истёк — введите дату в будущем." },
  { test: m => /Metadata hash is required/i.test(m),
    ru: "Не передан хеш метаданных." },
  { test: m => /Temperature hash is required/i.test(m),
    ru: "Не передан хеш температурного журнала." }
];

/** HTTP-статусы → читаемый текст. */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: "Некорректные данные в запросе.",
  401: "Требуется авторизация. Войдите на странице «Вход».",
  403: "Недостаточно прав для этой операции.",
  404: "Запись не найдена.",
  409: "Конфликт: запись с такими параметрами уже существует.",
  500: "Сервер вернул ошибку. Повторите позже.",
  502: "Сервер недоступен. Проверьте, что backend запущен.",
  503: "Сервис временно недоступен."
};

export function httpErrorMessage(status: number, fallback?: string): string {
  return HTTP_STATUS_MESSAGES[status]
      ?? fallback
      ?? `Сервер вернул ошибку (${status}).`;
}

export function humanizeError(error: unknown, fallback = "Не удалось выполнить операцию"): string {
  if (!error) return fallback;
  if (typeof error === "string") return matchAgainstRevertList(error) ?? error;

  const err = error as MaybeEthersError;

  // 1. MetaMask user rejection
  if (err.code === "ACTION_REJECTED" || err.info?.code === 4001) {
    return "Транзакция отклонена в кошельке.";
  }

  // 2. Сеть недоступна
  if (err.code === "NETWORK_ERROR" || err.code === "TIMEOUT") {
    return "Нет соединения с блокчейн-нодой. Проверьте, что Hardhat / RPC запущены.";
  }

  // 3. Insufficient funds for gas
  if (err.code === "INSUFFICIENT_FUNDS"
      || /insufficient funds/i.test(err.message ?? "")
      || /insufficient funds/i.test(err.shortMessage ?? "")) {
    return "На вашем кошельке недостаточно ETH для оплаты газа.";
  }

  // 4. AccessControl revert: 0xe2517d3f + address(32) + role(32)
  const data = err.data
      ?? (err as { transaction?: { data?: string } }).transaction?.data
      ?? "";
  const allText = combinedText(err);
  if (typeof data === "string" && data.toLowerCase().startsWith(ACCESS_CONTROL_SELECTOR)) {
    const ac = decodeAccessControlData(data);
    if (ac) {
      const roleName = ROLE_HASH_TO_NAME[ac.role.toLowerCase()] ?? "необходимую";
      return `У вашего кошелька нет роли ${roleName}. Обратитесь к администратору для назначения роли.`;
    }
  }
  // also matches when the selector is embedded in the error message
  if (allText.toLowerCase().includes(ACCESS_CONTROL_SELECTOR)) {
    return "У вашего кошелька нет нужной роли для этой операции.";
  }

  // 5. Smart-contract revert reason
  const reason = err.reason ?? err.shortMessage ?? "";
  const revertMatch = matchAgainstRevertList(reason) ?? matchAgainstRevertList(allText);
  if (revertMatch) return revertMatch;

  // 6. Stripped revert string in nested cause.  Only trust short, clean
  // extracts — long blobs are technical noise and shouldn't be shown.
  const stripped = extractRevertString(allText);
  if (stripped) {
    const matched = matchAgainstRevertList(stripped);
    if (matched) return matched;
    if (stripped.length <= 120 && !/execution reverted/i.test(stripped) && !/0x[0-9a-fA-F]{8,}/.test(stripped)) {
      return stripped;
    }
  }

  // 7. Backend API errors that we throw with friendly Russian — pass through if reasonable
  if (typeof err.message === "string") {
    if (err.message.length <= 200 && !/^[\{<\[]/.test(err.message) && !/0x[0-9a-fA-F]{8,}/.test(err.message)) {
      return err.message;
    }
  }

  return fallback;
}

function matchAgainstRevertList(text: string | undefined | null): string | null {
  if (!text) return null;
  for (const entry of REVERT_MESSAGES) {
    if (entry.test(text)) return entry.ru;
  }
  return null;
}

function combinedText(err: MaybeEthersError): string {
  return [err.message, err.reason, err.shortMessage, err.info?.error?.message]
      .filter(Boolean)
      .join(" | ");
}

/** Extracts revert string from messages like `execution reverted: "Foo"` or `... reason="Foo"`. */
function extractRevertString(text: string): string | null {
  const candidates = [
    /execution reverted:?\s*"?([^"\n]+?)"?\s*$/i,
    /reason="([^"]+)"/i,
    /VM Exception while processing transaction: revert\s+(.+)/i
  ];
  for (const pattern of candidates) {
    const match = pattern.exec(text);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function decodeAccessControlData(data: string): { account: string; role: string } | null {
  // 4 + 32 + 32 = 68 bytes = 136 hex chars + "0x" = 138
  if (data.length < 138) return null;
  const accountHex = "0x" + data.slice(34, 74);       // last 20 bytes of first 32-byte arg
  const roleHex = "0x" + data.slice(74, 138);          // 32-byte role
  return { account: accountHex, role: roleHex };
}
