// src/utils/data.js
import { DATETIME_LOCALE } from "@/shared/constants.js";

/**
 * Estrae un timestamp ISO-like da un record proveniente dal device.
 * Mantiene la priorità: `timestamp` → `DateTime` → null
 */
export function toISOts(item) {
    return item?.timestamp || item?.DateTime || null;
}

/**
 * Converte input “numerici” a Number o `null` se non parsabile.
 * - rimuove "+" iniziale
 * - rimuove leading zero singolo (es. "013.3" -> "13.3")
 * - ritorna `null` (NON NaN) per buchi, così Recharts disegna meglio
 */
export function toNum(v) {
    if (v === null || v === undefined) return null;
    const s = String(v).trim().replace(/^\+/, "");
    const s2 = /^0\d/.test(s) ? s.replace(/^0+(\d)/, "$1") : s;
    const n = Number(s2);
    return Number.isFinite(n) ? n : null;
}

/**
 * Format date generic (date+time)
 */
export function formatTs(isoLike) {
    const d = parseDate(isoLike);
    if (!d) return "—";
    return new Intl.DateTimeFormat(DATETIME_LOCALE, {
        dateStyle: "short",
        timeStyle: "medium",
    }).format(d);
}

/**
 * Format solo ora:minuto (per assi compatti delle barre)
 */
export function formatHourMinute(isoLike) {
    const d = parseDate(isoLike);
    if (!d) return "—";
    return new Intl.DateTimeFormat(DATETIME_LOCALE, {
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

/**
 * Format date+time short (per tooltip bar)
 */
export function formatShort(isoLike) {
    const d = parseDate(isoLike);
    if (!d) return "—";
    return new Intl.DateTimeFormat(DATETIME_LOCALE, {
        dateStyle: "short",
        timeStyle: "short",
    }).format(d);
}

/**
 * parseDate: ritorna Date valida o null
 */
export function parseDate(isoLike) {
    if (!isoLike) return null;
    const d = new Date(isoLike);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Aggrega per minuto e conta le classificazioni.
 * Ritorna array ordinato per timestamp crescente.
 * @param {Array<{ ts: string, classificazione: string }>} rows
 */
export function groupCountsPerMinute(rows) {
    const acc = new Map(); // key: "YYYY-MM-DDTHH:MM"
    for (const r of rows) {
        const d = parseDate(r.ts);
        if (!d) continue;
        const key = d.toISOString().slice(0, 16); // minuto
        if (!acc.has(key)) acc.set(key, { timestamp: key, verde: 0, giallo: 0, rosso: 0 });
        const bucket = acc.get(key);
        if (r.classificazione in bucket) bucket[r.classificazione]++;
    }
    return [...acc.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
