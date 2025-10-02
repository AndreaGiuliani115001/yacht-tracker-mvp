import React, { useMemo, useState, useEffect } from "react";
import {
    MapContainer, Marker, Popup, Polyline, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { DEFAULT_CENTER, DEFAULT_ZOOM } from "./constants";
import { toLatLngFromRaw } from "./geo";
import { getClassificationIcon, iconUltimaPosizione } from "./icons";
import { useTileSource } from "./useTileSource";
import OfflineAwareTileLayer from "./OfflineAwareTileLayer";

/** Sposta la mappa sulla prima posizione valida al primo render. */
function FirstFitView({ position, enabled, onDone }) {
    const map = useMap();
    useEffect(() => {
        if (enabled && position) {
            map.setView(position, DEFAULT_ZOOM);
            onDone?.();
        }
    }, [enabled, position, map, onDone]);
    return null;
}

/**
 * MapView
 * - SRP: mostra posizioni e traccia.
 * - Non conosce da dove arrivino i tiles: delega a useTileSource.
 * - Non rinomina le chiavi del device; usa Lat/Lon/Speed/accelX/accelY/accelZ/classificazione/timestamp così come sono.
 */
export default function MapView({ dataList }) {
    const [isFirstLoad, setFirstLoad] = useState(true);
    const [setPopupOpenKey] = useState(null);

    const { baseLayers, overlays } = useTileSource();

    // Punti normalizzati
    const points = useMemo(() => {
        if (!Array.isArray(dataList)) return [];
        return dataList
            .map((d, i) => {
                const ll = toLatLngFromRaw(d);
                if (!ll) return null;
                return {
                    latlng: ll,
                    data: d,
                    key: d.timestamp ?? i,
                };
            })
            .filter(Boolean);
    }, [dataList]);

    if (!points.length) return <p>Caricamento dati posizione…</p>;

    const last = points[0];
    const lastPos = last.latlng;
    const track = points.map((p) => p.latlng);

    return (
        <MapContainer
            center={lastPos ?? DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
        >
            {/* BASE LAYER sempre presente → niente schermo grigio offline */}
            <OfflineAwareTileLayer layers={baseLayers} />
            {/* Overlay online (es. OpenSeaMap) solo se disponibile */}
            <OfflineAwareTileLayer layers={overlays} />

            <FirstFitView
                position={lastPos}
                enabled={isFirstLoad}
                onDone={() => setFirstLoad(false)}
            />

            <Polyline positions={track} weight={3} />

            {points.slice(1).map((p, idx) => {
                const d = p.data;
                const k = `pt-${p.key}-${idx}`;
                return (
                    <Marker
                        key={k}
                        position={p.latlng}
                        icon={getClassificationIcon(d.classificazione)}
                        eventHandlers={{ click: () => setPopupOpenKey(k) }}
                    >
                        <Popup
                            autoClose={false}
                            closeOnClick={false}
                            // Nota: react-leaflet non espone un prop "open"; gestiamo con click handlers
                            onClose={() => setPopupOpenKey(null)}
                        >
                            <strong>Posizione</strong><br />
                            Velocità: {d.Speed ?? "—"}<br />
                            AccelX: {d.accelX ?? "—"}<br />
                            AccelY: {d.accelY ?? "—"}<br />
                            AccelZ: {d.accelZ ?? "—"}<br />
                            Classificazione: {d.classificazione ?? "—"}<br />
                            Orario: {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : "—"}
                        </Popup>
                    </Marker>
                );
            })}

            <Marker
                position={lastPos}
                icon={iconUltimaPosizione}
                eventHandlers={{ click: () => setPopupOpenKey("ultima") }}
            >
                <Popup
                    autoClose={false}
                    closeOnClick={false}
                    onClose={() => setPopupOpenKey(null)}
                >
                    <strong>ULTIMA POSIZIONE</strong><br />
                    Velocità: {last.data.Speed ?? "—"}<br />
                    AccelX: {last.data.accelX ?? "—"}<br />
                    AccelY: {last.data.accelY ?? "—"}<br />
                    AccelZ: {last.data.accelZ ?? "—"}<br />
                    Classificazione: {last.data.classificazione ?? "—"}<br />
                    Orario: {last.data.timestamp ? new Date(last.data.timestamp).toLocaleTimeString() : "—"}
                </Popup>
            </Marker>

            {/* (Facoltativo) badge diagnostico non intrusivo */}
            {/* <Control position="bottomleft">Offline:{String(status.offlineOk)} Online:{String(status.onlineOk)}</Control> */}
        </MapContainer>
    );
}
