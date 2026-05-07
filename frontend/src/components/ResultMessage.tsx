export function ResultMessage({ error, txHash }: { error?: string; txHash?: string }) {
  if (!error && !txHash) return null;

  return (
    <div className={`rounded-md border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800"}`}>
      {error ? (
        error
      ) : (
        <span>
          Транзакция отправлена: <span className="font-mono">{txHash}</span>
        </span>
      )}
    </div>
  );
}
