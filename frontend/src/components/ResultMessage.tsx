export function ResultMessage({ error, txHash }: { error?: string; txHash?: string }) {
  if (!error && !txHash) return null;

  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        error ? "border-red-500/40 bg-red-950/40 text-red-200" : "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
      }`}
    >
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
