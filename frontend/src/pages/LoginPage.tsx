import { WalletConnector } from "../components/WalletConnector";

export default function LoginPage() {
  return (
    <div className="panel max-w-2xl">
      <h2 className="text-xl font-semibold">Вход в систему</h2>
      <p className="mt-2 text-sm text-stone-600">
        Для дипломного прототипа основная идентичность участника связана с MetaMask wallet. Backend также умеет выдавать JWT по зарегистрированному адресу.
      </p>
      <div className="mt-5 flex justify-start">
        <WalletConnector />
      </div>
    </div>
  );
}
