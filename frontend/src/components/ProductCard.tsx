import { formatAddress, formatBlockchainDate, statusLabels } from "../lib/status";
import type { Product, ProductMetadata } from "../types/product";

export function ProductCard({ product, metadata }: { product: Product; metadata?: ProductMetadata | null }) {
  return (
    <div className="panel">
      <div className="mb-4 flex flex-col gap-2 border-b border-stone-200 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <p className="text-sm text-stone-600">ID в блокчейне: {product.id.toString()}</p>
        </div>
        <span className="w-fit rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-primary">
          {statusLabels[product.status]}
        </span>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <Info label="Производитель" value={formatAddress(product.manufacturer)} />
        <Info label="Текущий владелец" value={formatAddress(product.currentOwner)} />
        <Info label="Дата создания" value={formatBlockchainDate(product.createdAt)} />
        <Info label="Подлинность" value={product.exists ? "Подтверждена контрактом" : "Не подтверждена"} />
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
