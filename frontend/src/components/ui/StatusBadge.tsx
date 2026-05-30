import { Ban, CheckCircle2, CircleDot, Package, ShieldOff, Truck } from "lucide-react";
import { Badge } from "./Badge";
import { STATUS_LABELS_RU } from "../../lib/validation";
import type { ExtendedProductStatus } from "../../types/product";

type Tone = "neutral" | "emerald" | "sky" | "amber" | "red" | "violet" | "slate";

const STATUS_PRESET: Record<ExtendedProductStatus, { tone: Tone; icon: React.ReactNode }> = {
  0: { tone: "sky",     icon: <Package size={12} /> },     // Manufactured
  1: { tone: "amber",   icon: <Truck size={12} /> },       // InTransit
  2: { tone: "violet",  icon: <CircleDot size={12} /> },   // Delivered
  3: { tone: "emerald", icon: <CheckCircle2 size={12} /> },// Sold
  4: { tone: "red",     icon: <Ban size={12} /> }          // Recalled
};

interface Props {
  status: ExtendedProductStatus;
  blocked?: boolean;
  className?: string;
}

/**
 * Renders the product status as a coloured pill.  When the product is
 * additionally `blocked` (per-unit block or batch-level recall),
 * overrides the visual to a red shield so the consumer sees the block
 * before they see the status.
 */
export function StatusBadge({ status, blocked, className }: Props) {
  if (blocked) {
    return (
      <Badge tone="red" icon={<ShieldOff size={12} />} className={className}>
        Заблокирован
      </Badge>
    );
  }
  const preset = STATUS_PRESET[status] ?? { tone: "neutral" as Tone, icon: null };
  return (
    <Badge tone={preset.tone} icon={preset.icon} className={className}>
      {STATUS_LABELS_RU[status]}
    </Badge>
  );
}
