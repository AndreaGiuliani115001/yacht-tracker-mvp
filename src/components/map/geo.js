import {toNum} from "@/utils/data.js";

/** Estrae [lat, lon] rispettando i nomi esatti del device (Lat, Lon). */
export function toLatLngFromRaw(item) {
    const lat = toNum(item.Lat);
    const lon = toNum(item.Lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return [lat, lon];
}
