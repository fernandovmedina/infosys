"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { COLUMN_LABELS, TABLES } from "@/lib/runs/schema";
import type { SourceTable } from "@/lib/runs/types";

// ---------------------------------------------------------------------
// Iconos (SVG en línea, heredan el color del texto)
// ---------------------------------------------------------------------

const ICON_PATHS = {
  check: "m4.5 12.75 6 6 9-13.5",
  checkCircle: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  xCircle: "m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  minusCircle: "M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  alert: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z",
  info: "m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z",
  copy: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75",
  external: "M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25",
  close: "M6 18 18 6M6 6l12 12",
  search: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
  chevronDown: "m19.5 8.25-7.5 7.5-7.5-7.5",
  chevronRight: "m8.25 4.5 7.5 7.5-7.5 7.5",
  download: "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3",
  arrowDown: "M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3",
  arrowRight: "M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3",
  shield: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  swords: "M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z",
  refresh: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99",
  fit: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
  plus: "M12 4.5v15m7.5-7.5h-15",
  minus: "M5 12h14",
  chat: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z",
  send: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5",
  stop: "M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  compose: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
  trash: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0",
  arrowLeft: "M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18",
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={`shrink-0 ${className}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[name]} />
    </svg>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`animate-spin ${className}`}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={3} />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------
// Tooltip (en portal, para que no lo recorten los contenedores con scroll)
// ---------------------------------------------------------------------

export function Tooltip({
  content,
  children,
  className = "",
  focusable = false,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  /** Hace enfocable el disparador cuando no contiene un elemento interactivo. */
  focusable?: boolean;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; above: boolean } | null>(null);

  function show() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const half = Math.min(160, window.innerWidth / 2 - 8);
    const center = rect.left + rect.width / 2;
    const above = rect.top > 96;
    setPosition({
      left: Math.min(Math.max(center, half + 8), window.innerWidth - half - 8),
      top: above ? rect.top : rect.bottom,
      above,
    });
  }

  const hide = () => setPosition(null);

  return (
    <span
      ref={triggerRef}
      className={`inline-flex min-w-0 ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(event) => {
        if (event.key === "Escape" && position) {
          event.stopPropagation();
          hide();
        }
      }}
      tabIndex={focusable ? 0 : undefined}
      aria-describedby={position ? id : undefined}
    >
      {children}
      {position &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              transform: position.above ? "translate(-50%, calc(-100% - 6px))" : "translate(-50%, 6px)",
            }}
            className="pointer-events-none z-[100] w-max max-w-[min(20rem,calc(100vw-16px))] rounded-md bg-zinc-900 px-2.5 py-1.5 text-left text-xs font-normal leading-snug text-white shadow-lg"
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  );
}

/** Icono ⓘ con explicación. */
export function InfoTip({ content, label = "More information" }: { content: ReactNode; label?: string }) {
  return (
    <Tooltip content={content}>
      <button type="button" aria-label={label} className="rounded-full text-zinc-400 outline-none hover:text-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900">
        <Icon name="info" className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------
// Nombres del schema con traducción
// ---------------------------------------------------------------------

export function TableName({ table, className = "" }: { table: SourceTable; className?: string }) {
  return (
    <Tooltip content={`${TABLES[table].label}: ${TABLES[table].description}`} focusable className="rounded outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
      <code className={`cursor-help font-mono text-[0.8125rem] text-zinc-700 underline decoration-zinc-300 decoration-dotted underline-offset-4 ${className}`}>
        {table}
      </code>
    </Tooltip>
  );
}

export function ColumnName({ column, className = "" }: { column: string; className?: string }) {
  const label = COLUMN_LABELS[column];
  if (!label) return <code className={`font-mono text-xs text-zinc-600 ${className}`}>{column}</code>;
  return (
    <Tooltip content={label} focusable className="rounded outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
      <code className={`cursor-help font-mono text-xs text-zinc-600 underline decoration-zinc-300 decoration-dotted underline-offset-4 ${className}`}>
        {column}
      </code>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------
// Botones y bloques
// ---------------------------------------------------------------------

export function CopyButton({ value, label = "Copy", className = "" }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // El portapapeles puede estar bloqueado; no hay nada que hacer.
        }
      }}
      aria-label={copied ? "Copied" : `${label}: ${value}`}
      className={`inline-flex items-center gap-1 rounded px-1 text-zinc-400 outline-none transition-colors hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 ${className}`}
    >
      <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
      <span className="sr-only" aria-live="polite">{copied ? "Copied" : ""}</span>
    </button>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-700",
  secondary: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
    />
  );
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h4 className={`text-xs font-semibold uppercase tracking-wide text-zinc-500 ${className}`}>{children}</h4>
  );
}

export function Notice({
  tone,
  title,
  children,
  className = "",
}: {
  tone: "error" | "warning" | "info" | "success";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const styles = {
    error: { box: "border-red-200 bg-red-50 text-red-800", icon: "xCircle" as const },
    warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: "alert" as const },
    info: { box: "border-zinc-200 bg-zinc-50 text-zinc-700", icon: "info" as const },
    success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: "checkCircle" as const },
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} className={`flex gap-2.5 rounded-md border px-3 py-2.5 text-sm ${styles.box} ${className}`}>
      <Icon name={styles.icon} className="mt-0.5 h-4 w-4" />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-zinc-500" role="status">
      <Spinner /> {label}
    </p>
  );
}

// ---------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------

/** `true` si el media query coincide. En el servidor asume escritorio. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Atrapa el foco dentro de `ref` mientras `active`, cierra con Escape y devuelve el foco al salir. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const items = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.getClientRects().length > 0,
      );
    (items()[0] ?? container).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !container) return;
      const focusables = items();
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [active, ref]);
}

// ---------------------------------------------------------------------
// Drawer y modal
// ---------------------------------------------------------------------

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div aria-hidden className="absolute inset-0 bg-zinc-900/30 dark:bg-black/60" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-xl outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-zinc-900">{title}</h2>
            {subtitle && <div className="mt-1 text-sm text-zinc-600">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-500 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Modal({
  open,
  onClose,
  label,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]">
      <div aria-hidden className="absolute inset-0 bg-zinc-900/30 dark:bg-black/60" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl outline-none ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
