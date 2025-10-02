import {CSV_FIELDS, DELIMS} from "./constants.js";

/**
 * Tenta JSON.parse sicuro.
 * @param {string} raw
 * @returns {{ok:true,value:any}|{ok:false}}
 */
export function tryParseJSON(raw) {
    try {
        return {ok: true, value: JSON.parse(raw)};
    } catch {
        return {ok: false};
    }
}

/**
 * Rimuove "+" dopo i ":" e leading zeros singoli dopo ":".
 * @param {string} s
 * @returns {string}
 */
export function cleanupPlusAndLeadingZeros(s) {
    let fixed = s;
    fixed = fixed.replace(/:\s*\+(\d)/g, ": $1");
    fixed = fixed.replace(/:\s*0+(\d)(?=[\d]*\.|\d*(?:[^0-9]|$))/g, ": $1");
    return fixed;
}

/**
 * Parsing da riga delimitata (CSV/TSV/";" o ",")
 * Ritorna oggetto mappato su CSV_FIELDS con numeri coerenti.
 * @param {string} line
 * @returns {Record<string, string|number>|null}
 */
export function parseDelimitedLine(line) {
    const delim = DELIMS.find((d) => line.includes(d)) ?? ",";
    const cells = line.split(delim);

    const obj = {};
    const limit = Math.min(CSV_FIELDS.length, cells.length);
    for (let i = 0; i < limit; i++) {
        const k = CSV_FIELDS[i];
        const v = cells[i];
        const n = Number(v);
        obj[k] = Number.isFinite(n) ? n : v;
    }
    return obj;
}
