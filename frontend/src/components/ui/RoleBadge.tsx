import { Crown, Factory, ScanSearch, ShieldCheck, Store, Truck, User } from "lucide-react";
import { Badge } from "./Badge";
import { ROLE_LABEL_RU, type Role } from "../../lib/roles";

type Tone = "neutral" | "emerald" | "sky" | "amber" | "red" | "violet" | "slate";

const ROLE_PRESET: Record<Role, { tone: Tone; icon: React.ReactNode }> = {
  ADMIN:        { tone: "violet",  icon: <Crown size={12} /> },
  MANUFACTURER: { tone: "emerald", icon: <Factory size={12} /> },
  DISTRIBUTOR:  { tone: "sky",     icon: <Truck size={12} /> },
  PHARMACY:     { tone: "amber",   icon: <Store size={12} /> },
  REGULATOR:    { tone: "red",     icon: <ShieldCheck size={12} /> },
  CONSUMER:     { tone: "slate",   icon: <ScanSearch size={12} /> }
};

interface Props {
  role: Role;
  /** Show the icon only — useful for tight rows. */
  compact?: boolean;
  className?: string;
}

/**
 * Visual marker for a user / wallet role.  Uses a unique colour token per
 * role so a dashboard hits ‘role recognition’ at a glance.
 */
export function RoleBadge({ role, compact, className = "" }: Props) {
  const preset = ROLE_PRESET[role] ?? { tone: "neutral" as Tone, icon: <User size={12} /> };
  return (
    <Badge tone={preset.tone} icon={preset.icon} className={className}>
      {compact ? "" : ROLE_LABEL_RU[role]}
    </Badge>
  );
}
