/**
 * Канонические on-chain роли из SupplyChain.sol.
 *
 *   contract:  string label in WalletConnector.getWalletRoles()
 *   navKey:    used by the layout to filter visible links
 *   ru:        пользовательский текст
 *
 * Frontend role check is а UX-удобство — реальная защита всегда лежит:
 *   1) в on-chain modifier'ах onlyRole(...) у smart contract
 *   2) в @PreAuthorize у backend controller'ах
 *
 * Frontend guard просто скрывает то, что недоступно, и редиректит
 * пользователя в адекватное место, если он попробовал зайти напрямую.
 */
export type Role =
  | "ADMIN"
  | "MANUFACTURER"
  | "DISTRIBUTOR"
  | "PHARMACY"
  | "REGULATOR"
  | "CONSUMER";

/** Mapping from the Russian labels returned by getWalletRoles() to canonical roles. */
const RU_TO_ROLE: Record<string, Role> = {
  "Администратор": "ADMIN",
  "Производитель": "MANUFACTURER",
  "Дистрибьютор":  "DISTRIBUTOR",
  "Аптека":        "PHARMACY",
  "Регулятор":     "REGULATOR"
};

export function normalizeRoles(labels: string[]): Role[] {
  const result = new Set<Role>();
  for (const label of labels) {
    const role = RU_TO_ROLE[label];
    if (role) result.add(role);
  }
  return Array.from(result);
}

export function hasAnyRole(userRoles: Role[], required: Role[]): boolean {
  if (required.length === 0) return true;
  return required.some((role) => userRoles.includes(role));
}

export const ROLE_LABEL_RU: Record<Role, string> = {
  ADMIN:        "Администратор",
  MANUFACTURER: "Производитель",
  DISTRIBUTOR:  "Дистрибьютор",
  PHARMACY:     "Аптека",
  REGULATOR:    "Регулятор",
  CONSUMER:     "Потребитель"
};
