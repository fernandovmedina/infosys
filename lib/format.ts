/**
 * Formato de moneda, fechas y cantidades en `en-US` (montos en MXN).
 *
 * Solo presenta valores que ya vienen calculados del backend: aquí no se
 * suma ni se redondea nada que afecte a un veredicto.
 */

const LOCALE = "en-US";

const currency = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "MXN",
  currencyDisplay: "narrowSymbol",
});

const currencyNoCents = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "MXN",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat(LOCALE);

const percent = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const shortDate = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dayMonth = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
});

const monthName = new Intl.DateTimeFormat(LOCALE, { month: "short" });

const dateTime = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const time = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** `$139,200.00` */
export function formatMoney(amount: number): string {
  return currency.format(amount);
}

/** `$139,200.00 MXN` */
export function formatMoneyMXN(amount: number): string {
  return `${currency.format(amount)} MXN`;
}

/** `$92,800` (sin centavos si el monto es entero; para etiquetas de aristas). */
export function formatMoneyShort(amount: number): string {
  return Number.isInteger(amount) ? currencyNoCents.format(amount) : currency.format(amount);
}

/** Diferencia con signo: `-$2,300.00`, `+$15.00`, `$0.00`. */
export function formatSignedMoney(amount: number): string {
  if (amount === 0) return currency.format(0);
  return `${amount > 0 ? "+" : "−"}${currency.format(Math.abs(amount))}`;
}

/** Costo de la corrida: `$3.10 MXN`. */
export function formatCost(amount: number): string {
  return formatMoneyMXN(amount);
}

/** `10,016` */
export function formatNumber(value: number): string {
  return integer.format(value);
}

/** Porcentaje que ya viene en puntos porcentuales: `-0.40` → `−0.40 %`. */
export function formatPercent(value: number): string {
  const abs = percent.format(Math.abs(value));
  if (value === 0) return `${abs}%`;
  return `${value < 0 ? "−" : ""}${abs}%`;
}

/** `81 s` o `2 min 14 s`. */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  if (total < 60) return `${total} s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

/** Cronómetro `00:47` / `1:02:03`. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Convierte `2026-03-29` o un ISO completo en `Date`. Las fechas sin hora se
 * interpretan en horario local para que no se recorran un día por la zona.
 */
export function parseDate(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  return new Date(value);
}

/** `29 mar 2026` */
export function formatDate(value: string): string {
  return shortDate.format(parseDate(value));
}

/** `29 mar` */
export function formatDayMonth(value: string): string {
  return dayMonth.format(parseDate(value));
}

/** `12 sept 2026, 06:04 p.m.` */
export function formatDateTime(value: string): string {
  return dateTime.format(parseDate(value));
}

/** `18:04:52` */
export function formatTime(value: string): string {
  return time.format(parseDate(value));
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Periodo auditado: `Ene–Jun 2026`, o `Nov 2025–Feb 2026`. */
export function formatPeriod(from: string, to: string): string {
  const start = parseDate(from);
  const end = parseDate(to);
  const startMonth = capitalize(monthName.format(start).replace(".", ""));
  const endMonth = capitalize(monthName.format(end).replace(".", ""));
  if (start.getFullYear() === end.getFullYear()) {
    return `${startMonth}–${endMonth} ${end.getFullYear()}`;
  }
  return `${startMonth} ${start.getFullYear()}–${endMonth} ${end.getFullYear()}`;
}

/** Mes corto para ejes: `mar`. */
export function formatMonthShort(date: Date): string {
  return monthName.format(date).replace(".", "");
}

/** CLABE abreviada: `0121…7890`. Acepta `CLABE:…` o los 18 dígitos. */
export function formatClabe(value: string): string {
  const digits = value.replace(/^CLABE:/, "");
  if (digits.length < 9) return digits;
  return `${digits.slice(0, 4)}…${digits.slice(-4)}`;
}

/** Tamaño de archivo: `12.4 MB`. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Valor crudo de un registro para mostrarlo en tablas y drawers. */
export function formatCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
