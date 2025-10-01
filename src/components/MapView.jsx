import React, {useMemo, useState, useEffect} from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const classificazioneColori = {
    verde: "green",
    giallo: "yellow",
    rosso: "red",
};

const iconUltimaPosizione = L.divIcon({
    className: "ultima-pos-icon",
    html: `
    <div style="
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #2e7d32;
      border: 3px solid white;
      box-shadow: 0 0 6px rgba(0,0,0,0.4);
    "></div>
  `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
});


// ---------------- helpers (senza rinominare chiavi) ----------------
function sanitizeNumberLike(v) {
    if (v === null || v === undefined) return NaN;
    let s = String(v).trim();
    // rimuovi + iniziale
    s = s.replace(/^\+/, "");
    // rimuovi leading zeros solo se non è un decimale tipo 0.123
    if (/^0\d/.test(s)) s = s.replace(/^0+(\d)/, "$1");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
}

function toLatLngFromRaw(item) {
    // usa esattamente Lat/Lon
    const lat = sanitizeNumberLike(item.Lat);
    const lon = sanitizeNumberLike(item.Lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return [lat, lon];
}

function AggiornaPosizione({posizione, isFirstLoad, setFirstLoad}) {
    const map = useMap();
    useEffect(() => {
        if (isFirstLoad && posizione) {
            map.setView(posizione, 13);
            setFirstLoad(false);
        }
    }, [posizione, isFirstLoad, map, setFirstLoad]);
    return null;
}

// -------------------------------------------------------------------

export default function MapView({dataList}) {
    const [popupOpenKey, setPopupOpenKey] = useState(null);
    const [isFirstLoad, setFirstLoad] = useState(true);
    const online = typeof navigator !== "undefined" && navigator.onLine;

    const points = useMemo(() => {
        if (!Array.isArray(dataList)) return [];
        return dataList
            .map((d, i) => {
                const ll = toLatLngFromRaw(d);
                if (!ll) return null;
                return {
                    latlng: ll,
                    data: d, // contiene esattamente le chiavi del device
                    key: d.timestamp || i, // chiave stabile (se hai PacketIdx usalo qui)
                };
            })
            .filter(Boolean);
    }, [dataList]);

    if (!points.length) return <p>Caricamento dati posizione...</p>;

    const ultima = points[0];
    const ultimaPosizione = ultima.latlng;
    const traccia = points.map((p) => p.latlng);

    return (
        <MapContainer
            center={ultimaPosizione ?? [43.2094, 13.1455]}
            zoom={13}
            style={{height: "100%", width: "100%"}}
        >
            <AggiornaPosizione
                posizione={ultimaPosizione}
                isFirstLoad={isFirstLoad}
                setFirstLoad={setFirstLoad}
            />

            {online && (
                <>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    <TileLayer
                        url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                        attribution="Map data © OpenSeaMap contributors"
                    />
                </>
            )}

            <Polyline positions={traccia} color="blue" weight={3}/>

            {points.slice(1).map((p, idx) => {
                const d = p.data;
                const k = `pt-${p.key}-${idx}`;
                const cls = typeof d.classificazione === "string" ? d.classificazione.toLowerCase() : null;

                return (
                    <Marker
                        key={k}
                        position={p.latlng}
                        icon={L.divIcon({
                            className: "custom-icon",
                            html: `<div style="
                background-color: ${classificazioneColori[cls] || "gray"};
                width: 10px; height: 10px; border-radius: 50%;
                border: 1px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.5);
              "></div>`,
                            iconSize: [10, 10],
                            iconAnchor: [5, 5],
                        })}
                        eventHandlers={{click: () => setPopupOpenKey(k)}}
                    >
                        <Popup
                            autoClose={false}
                            closeOnClick={false}
                            open={popupOpenKey === k}
                            onClose={() => setPopupOpenKey(null)}
                        >
                            <strong>Posizione</strong>
                            <br/>
                            Velocità: {d.Speed ?? "—"}
                            <br/>
                            AccelX: {d.accelX ?? "—"}
                            <br/>
                            AccelY: {d.accelY ?? "—"}
                            <br/>
                            AccelZ: {d.accelZ ?? "—"}
                            <br/>
                            Classificazione: {d.classificazione ?? "—"}
                            <br/>
                            Orario: {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : "—"}
                        </Popup>
                    </Marker>
                );
            })}

            <Marker
                position={ultimaPosizione}
                icon={iconUltimaPosizione}
                eventHandlers={{click: () => setPopupOpenKey("ultima")}}
            >
                <Popup
                    autoClose={false}
                    closeOnClick={false}
                    open={popupOpenKey === "ultima"}
                    onClose={() => setPopupOpenKey(null)}
                >
                    <strong>ULTIMA POSIZIONE</strong>
                    <br/>
                    Velocità: {ultima.data.Speed ?? "—"}
                    <br/>
                    AccelX: {ultima.data.accelX ?? "—"}
                    <br/>
                    AccelY: {ultima.data.accelY ?? "—"}
                    <br/>
                    AccelZ: {ultima.data.accelZ ?? "—"}
                    <br/>
                    Classificazione: {ultima.data.classificazione ?? "—"}
                    <br/>
                    Orario: {ultima.data.timestamp ? new Date(ultima.data.timestamp).toLocaleTimeString() : "—"}
                </Popup>
            </Marker>
        </MapContainer>
    );
}
