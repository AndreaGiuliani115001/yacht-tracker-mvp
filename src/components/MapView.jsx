import React, { useState, useEffect } from "react";
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

const AggiornaPosizione = ({ posizione, isFirstLoad, setFirstLoad }) => {
    const map = useMap();

    useEffect(() => {
        if (isFirstLoad && posizione) {
            map.setView(posizione, map.getZoom());
            setFirstLoad(false);
        }
    }, [posizione, isFirstLoad, map, setFirstLoad]);

    return null;
};

const iconUltimaPosizione = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const getSmallColoredIcon = (classificazione) =>
    L.divIcon({
        className: "custom-icon",
        html: `<div style="
            background-color: ${classificazioneColori[classificazione] || "gray"};
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 1px solid white;
            box-shadow: 0 0 3px rgba(0,0,0,0.5);
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
    });

export default function MapView({ dataList }) {
    // Hooks SEMPRE qui, prima di qualsiasi return
    const [popupOpenIndex, setPopupOpenIndex] = useState(null);
    const [isFirstLoad, setFirstLoad] = useState(true);

    if (!dataList || dataList.length === 0)
        return <p>Caricamento dati posizione...</p>;

    const ultima = dataList[0];
    const ultimaPosizione = [ultima.posizioneLat, ultima.posizioneLon];

    const polylinePositions = dataList.map((d) => [
        d.posizioneLat,
        d.posizioneLon,
    ]);

    return (
        <MapContainer
            center={[43.2094, 13.1455]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
        >
            <AggiornaPosizione
                posizione={ultimaPosizione}
                isFirstLoad={isFirstLoad}
                setFirstLoad={setFirstLoad}
            />

            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            <TileLayer
                url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                attribution="Map data © OpenSeaMap contributors"
            />

            <Polyline positions={polylinePositions} color="blue" weight={3} />

            {dataList.slice(1).map((dato, idx) => (
                <Marker
                    key={idx}
                    position={[dato.posizioneLat, dato.posizioneLon]}
                    icon={getSmallColoredIcon(dato.classificazione)}
                    eventHandlers={{
                        click: () => setPopupOpenIndex(idx),
                    }}
                >
                    <Popup
                        autoClose={false}
                        closeOnClick={false}
                        open={popupOpenIndex === idx}
                        onClose={() => setPopupOpenIndex(null)}
                    >
                        <strong>Posizione:</strong>
                        <br />
                        Velocità: {dato.velocita} nodi
                        <br />
                        AccelX: {ultima.accelX}
                        <br />
                        AccelY: {ultima.accelY}
                        <br/>
                        AccelZ: {ultima.accelZ}
                        <br/>
                        Classificazione: {dato.classificazione}
                        <br />
                        Orario: {new Date(dato.timestamp).toLocaleTimeString()}
                    </Popup>
                </Marker>
            ))}

            <Marker
                position={ultimaPosizione}
                icon={iconUltimaPosizione}
                eventHandlers={{
                    click: () => setPopupOpenIndex("ultima"),
                }}
            >
                <Popup
                    autoClose={false}
                    closeOnClick={false}
                    open={popupOpenIndex === "ultima"}
                    onClose={() => setPopupOpenIndex(null)}
                >
                    <strong>ULTIMA POSIZIONE</strong>
                    <br />
                    Velocità: {ultima.velocita} nodi
                    <br />
                    AccelX: {ultima.accelX}
                    <br />
                    AccelY: {ultima.accelY}
                    <br/>
                    AccelZ: {ultima.accelZ}
                    <br/>
                    Classificazione: {ultima.classificazione}
                    <br />
                    Orario: {new Date(ultima.timestamp).toLocaleTimeString()}
                </Popup>
            </Marker>
        </MapContainer>
    );
}
