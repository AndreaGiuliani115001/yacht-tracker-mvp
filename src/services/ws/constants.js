/** Eventi supportati dal servizio WS (pubblici) */
export const EVENT_TYPES = Object.freeze([
    "data",
    "status",
    "historicalData",
    "error",
    "open",
    "close",
]);

/** Delimitatori accettati per linee CSV/TSV */
export const DELIMS = Object.freeze([";", "\t", ","]);

/** Header standard per CSV compatibile con la tua pipeline */
export const CSV_FIELDS = Object.freeze([
    "DateTime",
    "PacketIdx",
    "AccelX",
    "AccelY",
    "AccelZ",
    "AccelSum",
    "Pitch",
    "Roll",
    "Yaw",
    "Speed",
    "Latitude",
    "Longitude",
    "EventClass",
    "EventClassText",
]);

/** Backoff e riconnessione */
export const RECONNECT = Object.freeze({
    BASE_MS: 3000,
    MAX_MS: 30000,
    MAX_EXP: 4, // 2^4 = 16x
    JITTER_MS: 500,
});
