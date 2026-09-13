import { STATUS_LABELS } from "@/lib/runs/labels";
import type { EntityStatus } from "@/lib/runs/types";
import { Icon, type IconName } from "./ui";

/** Semáforo de entidades (EXAMPLE §7.3): siempre color + icono + texto. */
export const STATUS_STYLES: Record<EntityStatus, { badge: string; icon: IconName; border: string; dot: string; text: string }> = {
  accused: {
    badge: "bg-red-50 text-red-700 ring-red-200",
    icon: "xCircle",
    border: "border-red-500",
    dot: "bg-red-500",
    text: "text-red-700",
  },
  declined: {
    badge: "bg-amber-50 text-amber-800 ring-amber-300",
    icon: "minusCircle",
    border: "border-amber-500",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  clear: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: "checkCircle",
    border: "border-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
};

export function EntityStatusBadge({
  status,
  size = "md",
  className = "",
}: {
  status: EntityStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  const label = STATUS_LABELS[status];
  return (
    <span
      title={label.description}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-medium ring-1 ring-inset ${style.badge} ${
        size === "sm" ? "px-1.5 py-0.5 text-[0.6875rem]" : "px-2 py-0.5 text-xs"
      } ${className}`}
    >
      <Icon name={style.icon} className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label.label}
    </span>
  );
}
