/**
 * Applica la normalizzazione “storica” ai payload JSON.
 * @param {any} p
 * @returns {any} messaggio normalizzato
 */
export function normalizeMessage(p) {
    if (!p || typeof p !== "object") return p;
    const msg = {...p};

    // Alias timestamp -> DateTime
    if (p.timestamp && !p.DateTime) msg.DateTime = p.timestamp;

    // Lat -> Latitude (rimuove "+", Number)
    if (p.Lat !== undefined && msg.Latitude === undefined) {
        const val = typeof p.Lat === "string" ? Number(p.Lat.replace("+", "")) : p.Lat;
        msg.Latitude = Number(val);
    }

    // Lon -> Longitude (rimuove "+", toglie leading zero singolo)
    if (p.Lon !== undefined && msg.Longitude === undefined) {
        const s = String(p.Lon).replace("+", "");
        const s2 = s.match(/^0\d/) ? s.replace(/^0+(\d)/, "$1") : s;
        msg.Longitude = Number(s2);
    }

    // classificazione -> EventClassText
    if (p.classificazione && !p.EventClassText) msg.EventClassText = p.classificazione;

    // accelerazioni e assetti (lower camel -> PascalCase)
    if (p.accelX !== undefined && msg.AccelX === undefined) msg.AccelX = Number(p.accelX);
    if (p.accelY !== undefined && msg.AccelY === undefined) msg.AccelY = Number(p.accelY);
    if (p.accelZ !== undefined && msg.AccelZ === undefined) msg.AccelZ = Number(p.accelZ);
    if (p.accelSum !== undefined && msg.AccelSum === undefined)
        msg.AccelSum = Number(p.accelSum);

    if (p.pitch !== undefined && msg.Pitch === undefined) msg.Pitch = Number(p.pitch);
    if (p.roll !== undefined && msg.Roll === undefined) msg.Roll = Number(p.roll);
    if (p.yaw !== undefined && msg.Yaw === undefined) msg.Yaw = Number(p.yaw);

    if (p.Speed !== undefined && msg.Speed === undefined) msg.Speed = Number(p.Speed);

    return msg;
}
