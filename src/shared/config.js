// src/shared/config.js
const USE_MOCK = String(import.meta.env?.VITE_USE_MOCK ?? "false").toLowerCase() === "true";
const WS_URL = import.meta.env?.VITE_WS_URL ?? "ws://192.168.4.1/ws";
// Se vuoi per default le etichette ORIGINALI della centralina, lascia false.
const WS_NORMALIZE = String(import.meta.env?.VITE_WS_NORMALIZE ?? "false").toLowerCase() === "true";

export const CONFIG = Object.freeze({
    USE_MOCK,
    WS_URL,
    WS_NORMALIZE,
    DEBUG_WS: String(import.meta.env?.VITE_DEBUG_WS ?? "true").toLowerCase() === "true",
});
