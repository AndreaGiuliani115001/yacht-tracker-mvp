// useTileSource.js
import { useEffect, useMemo, useState } from "react";
import { TILE_SOURCES } from "./constants";

// helper: espande {s},{z},{x},{y} e gestisce {-y} se mai servisse
function expandTemplate(url, { s = "a", z = 2, x = 2, y = 2 } = {}) {
    return url
        .replace("{s}", s)
        .replace("{z}", String(z))
        .replace("{x}", String(x))
        .replace("{y}", String(y))
        .replace("{-y}", String((1 << z) - 1 - y)); // tms compat
}

export function useTileSource() {
    // ⚠️ parti pessimista: niente offline di default, così da preferire OSM se disponibile
    const [offlineOk, setOfflineOk] = useState(false);
    const [onlineOk, setOnlineOk] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const testImage = (expandedUrl) =>
            new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = expandedUrl;
            });

        (async () => {
            // Prova OFFLINE solo se stai veramente servendo /tiles/
            const offlineProbe = expandTemplate(TILE_SOURCES.OFFLINE_XYZ.url, { z: 2, x: 2, y: 2 });
            const offline = await testImage(offlineProbe);
            if (!cancelled) setOfflineOk(offline);

            // Prova OSM (sostituendo {s})
            const onlineProbe = expandTemplate(TILE_SOURCES.ONLINE_OSM.url, { s: "a", z: 2, x: 2, y: 2 });
            const online = await testImage(onlineProbe);
            if (!cancelled) setOnlineOk(online);
        })();

        return () => { cancelled = true; };
    }, []);

    // 🔁 Decisione: se internet funziona, usa OSM; altrimenti prova l’offline
    const baseLayers = useMemo(() => {
        if (onlineOk) return [TILE_SOURCES.ONLINE_OSM];
        if (offlineOk) return [TILE_SOURCES.OFFLINE_XYZ];
        // Fallback “comunque qualcosa”: OSM, così quando torna la rete parte
        return [TILE_SOURCES.ONLINE_OSM];
    }, [onlineOk, offlineOk]);

    const overlays = useMemo(() => (onlineOk ? [TILE_SOURCES.ONLINE_OPENSEA] : []), [onlineOk]);

    return { baseLayers, overlays, status: { offlineOk, onlineOk } };
}
