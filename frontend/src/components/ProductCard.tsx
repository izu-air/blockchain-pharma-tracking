import { formatAddress, formatBlockchainDate, statusClasses, statusLabels } from "../lib/status";
import type { Product, ProductBatch, ProductMetadata, VerificationResult } from "../types/product";

export function ProductCard({
  product,
  metadata,
  batch,
  verification
}: {
  product: Product;
  metadata?: ProductMetadata | null;
  batch?: ProductBatch | null;
  verification?: VerificationResult | null;
}) {
  return (
    <div className="panel">
      {(verification?.recalled || product.blocked) && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          Продукт относится к отозванной партии. Продажа и дальнейшее движение заблокированы.
        </div>
      )}
      {verification?.expired && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          Срок годности продукта истек. Покупателю следует отказаться от использования.
        </div>
      )}
      <div className="mb-4 flex flex-col gap-2 border-b border-stone-200 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <p className="text-sm text-stone-600">ID в блокчейне: {product.id.toString()}</p>
          <p className="text-sm text-stone-600">Партия: {product.batchId.toString()}</p>
        </div>
        <span className={`w-fit rounded-md px-3 py-1 text-sm font-medium ${statusClasses[product.status]}`}>
          {statusLabels[product.status]}
        </span>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <Info label="Производитель" value={formatAddress(product.manufacturer)} />
        <Info label="Текущий владелец" value={formatAddress(product.currentOwner)} />
        <Info label="Дата создания" value={formatBlockchainDate(product.createdAt)} />
        <Info label="Подлинность" value={product.exists ? "Подтверждена контрактом" : "Не подтверждена"} />
        <Info label="Блокировка" value={product.blocked ? "Заблокирован" : "Нет"} />
        {batch && (
          <>
            <Info label="Дата производства" value={formatBlockchainDate(batch.productionDate)} />
            <Info label="Срок годности партии" value={formatBlockchainDate(batch.expirationDate)} />
            <Info label="Отзыв партии" value={batch.recalled ? "Да" : "Нет"} />
            <Info label="Hash метаданных" value={`${batch.metadataHash.slice(0, 10)}...`} />
          </>
        )}
        {metadata && (
          <>
            <Info label="Номер партии" value={metadata.batchNumber} />
            <Info label="Срок годности" value={new Date(metadata.expirationDate).toLocaleDateString("ru-RU")} />
          </>
        )}
      </div>
      {metadata?.description && <p className="mt-4 text-sm text-stone-700">{metadata.description}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-stone-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
