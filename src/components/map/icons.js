import L from "leaflet";
import { CLASS_COLORS } from "@/shared/constants";

// SRP: ogni funzione crea 1 icona; memoization semplice per performance
const cache = new Map();

/** Icona puntino colorato in base alla classificazione. */
export function getClassificationIcon(classe) {
    const key = `cls:${classe}`;
    if (cache.has(key)) return cache.get(key);
    const color = CLASS_COLORS[classe?.toLowerCase?.()] || "gray";
    const icon = L.divIcon({
        className: "custom-icon",
        html: `<div style="
      background-color:${color};
      width:10px;height:10px;border-radius:50%;
      border:1px solid white;box-shadow:0 0 3px rgba(0,0,0,.5);
    "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
    });
    cache.set(key, icon);
    return icon;
}

/** Icona per l’ultima posizione. */
export const iconUltimaPosizione = (() => {
    const key = "ultima";
    if (cache.has(key)) return cache.get(key);
    const icon = L.divIcon({
        className: "ultima-pos-icon",
        html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:#2e7d32;border:3px solid white;
      box-shadow:0 0 6px rgba(0,0,0,.4);
    "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10],
    });
    cache.set(key, icon);
    return icon;
})();
