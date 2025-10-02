import React from "react";
import { TileLayer } from "react-leaflet";

/** Rende una lista di TileLayer in base alla selezione fatta dall’hook. */
export default function OfflineAwareTileLayer({ layers }) {
    return (
        <>
            {layers.map((l) => (
                <TileLayer
                    key={l.id}
                    url={l.url}
                    attribution={l.attribution}
                    opacity={l.overlay ? 0.85 : 1}
                />
            ))}
        </>
    );
}
