/**
 * @class WebSocketService
 * Gestisce connessione WS, invio comandi e dispatch eventi.
 * - Idempotenza connect()
 * - on/off per i listener
 * - "start" (setConfig) inviato una sola volta per socket
 * - parsing: JSON (con/senza type) o CSV/TSV -> dispatch su "data"
 */
class WebSocketService {
    /** @type {const} */
    static EVENT_TYPES = /** @type {const} */ ([
        "data",
        "status",
        "historicalData",
        "error",
        "open",
        "close",
    ]);

    /** @type {const} */
    static DELIMS = /** @type {const} */ ([";", "\t", ","]);

    /** @type {const} */
    static CSV_FIELDS = /** @type {const} */ ([
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

    /**
     * @param {string} url - Es. "ws://192.168.4.1/ws"
     */
    constructor(url) {
        /** @private */ this.url = url;
        /** @private */ this.ws = null;
        /** @private */ this.reconnectInterval = 3000;
        /** @private */ this.isManuallyClosed = false;
        /** @private */ this._startSentForThisSocket = false;

        /** @private */
        this.listeners = {
            data: [],
            status: [],
            historicalData: [],
            error: [],
            open: [],
            close: [],
        };
    }

    // ======================
    // Pubbliche API
    // ======================

    /**
     * Registra callback per un evento.
     * @param {"data"|"status"|"historicalData"|"error"|"open"|"close"} eventType
     * @param {(payload:any)=>void} callback
     */
    on(eventType, callback) {
        if (!WebSocketService.EVENT_TYPES.includes(eventType)) {
            console.warn("[WebSocketService] Evento non supportato:", eventType);
            return;
        }
        if (typeof callback !== "function") {
            console.warn("[WebSocketService] Callback non valida per", eventType);
            return;
        }
        this.listeners[eventType].push(callback);
    }

    /**
     * Deregistra callback (se passato) o TUTTI i callback di un tipo.
     * @param {"data"|"status"|"historicalData"|"error"|"open"|"close"} eventType
     * @param {(payload:any)=>void} [callback]
     */
    off(eventType, callback) {
        if (!this.listeners[eventType]) return;

        if (!callback) {
            this.listeners[eventType] = [];
            return;
        }

        this.listeners[eventType] = this.listeners[eventType].filter(
            (cb) => cb !== callback,
        );
    }

    /**
     * Connessione idempotente:
     * se esiste già una ws OPEN o CONNECTING, non fa nulla.
     */
    connect() {
        if (
            this.ws &&
            (this.ws.readyState === WebSocket.OPEN ||
                this.ws.readyState === WebSocket.CONNECTING)
        ) {
            console.log("ℹ️ WebSocket già connesso/connecting:", this.url);
            return;
        }

        console.log("🔌 Connessione WebSocket a:", this.url);
        this.isManuallyClosed = false;
        this._startSentForThisSocket = false;

        const ws = new WebSocket(this.url);
        this.ws = ws;

        ws.onopen = () => {
            console.log("✅ WebSocket connesso");
            this._emit("open");
            this._emit("status", {state: "connected"});
        };

        ws.onmessage = (event) => {
            const raw = String(event.data);

            // 1) Prova JSON diretto
            const asJSON = this._tryParseJSON(raw);
            if (asJSON.ok) {
                this._dispatchNormalized(asJSON.value);
                return;
            }

            // 2) Prova JSON "ripulito" da + e zeri iniziali
            const fixed = this._cleanupPlusAndLeadingZeros(raw);
            if (fixed !== raw) {
                const asJSONFixed = this._tryParseJSON(fixed);
                if (asJSONFixed.ok) {
                    this._dispatchNormalized(asJSONFixed.value);
                    return;
                }
            }

            // 3) Prova CSV/TSV/CSV con virgola
            const line = raw.trim();
            if (!line) return;

            const obj = this._parseDelimitedLine(line);
            if (obj) {
                this._emit("data", obj);
            }
        };

        ws.onerror = (err) => {
            console.error("Errore WebSocket:", err);
            this._emit("error", err);
            this._emit("status", {state: "error", detail: err?.message || "ws error"});
        };

        ws.onclose = () => {
            console.warn("⚠️ WebSocket chiuso");
            this._emit("close");
            this._emit("status", {state: "closed"});

            // Se non è chiusura manuale, tenta reconnect
            if (!this.isManuallyClosed) {
                setTimeout(() => this.connect(), this.reconnectInterval);
            }
        };
    }

    /**
     * Invia un comando se OPEN.
     * @param {string} command
     * @param {object} [params={}]
     */
    sendCommand(command, params = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = {type: "command", command, params};
            try {
                this.ws.send(JSON.stringify(msg));
                console.log("➡️  Comando inviato:", command);
            } catch (err) {
                console.error("❌ Errore invio comando:", err);
                this._emit("error", err);
            }
        } else {
            console.warn("Impossibile inviare comando, WS non connesso");
        }
    }

    /**
     * Invia "start" (qui: setConfig) una sola volta per ciascuna connessione aperta.
     * Puoi passarci i tuoi params (freq, soglie, ecc.).
     * @param {object} params
     */
    sendStartOnce(params = {}) {
        if (this._startSentForThisSocket) return;
        this._startSentForThisSocket = true;
        this.sendCommand("setConfig", params);
    }

    /**
     * Chiude la connessione e disattiva la riconnessione.
     * (I listener restano registrati: usa off() se vuoi pulirli).
     */
    close() {
        this.isManuallyClosed = true;

        if (this.ws) {
            try {
                this.ws.onopen = this.ws.onmessage = this.ws.onerror = this.ws.onclose = null;
                this.ws.close();
            } catch {
                /* noop */
            }
            this.ws = null;
        }

        this._startSentForThisSocket = false;
    }

    // ======================
    // Helper privati
    // ======================

    /**
     * @param {"data"|"status"|"historicalData"|"error"|"open"|"close"} eventType
     * @param {*} payload
     * @private
     */
    _emit(eventType, payload) {
        const cbs = this.listeners[eventType];
        if (!cbs || cbs.length === 0) return;
        for (const cb of cbs) {
            try {
                cb(payload);
            } catch (err) {
                // Non rompiamo la catena se un listener va in errore
                console.error(`[WebSocketService] Listener error on "${eventType}"`, err);
            }
        }
    }

    /**
     * Tenta JSON.parse sicuro.
     * @param {string} raw
     * @returns {{ok:true,value:any}|{ok:false}}
     * @private
     */
    _tryParseJSON(raw) {
        try {
            return {ok: true, value: JSON.parse(raw)};
        } catch {
            return {ok: false};
        }
    }

    /**
     * Rimuove "+" dopo i due punti e zeri non significativi prima di una cifra.
     * Mantiene ESATTAMENTE la logica originale.
     * @param {string} s
     * @returns {string}
     * @private
     */
    _cleanupPlusAndLeadingZeros(s) {
        let fixed = s;
        fixed = fixed.replace(/:\s*\+(\d)/g, ": $1");
        fixed = fixed.replace(/:\s*0+(\d)(?=[\d]*\.|\d*(?:[^0-9]|$))/g, ": $1");
        return fixed;
    }

    /**
     * Parsing da riga delimitata (CSV/TSV/";")
     * Mantiene la mappatura fedele alla versione originale.
     * @param {string} line
     * @returns {Record<string, string|number>|null}
     * @private
     */
    _parseDelimitedLine(line) {
        const delim = WebSocketService.DELIMS.find((d) => line.includes(d)) ?? ",";
        const cells = line.split(delim);

        const obj = {};
        const limit = Math.min(WebSocketService.CSV_FIELDS.length, cells.length);
        for (let i = 0; i < limit; i++) {
            const k = WebSocketService.CSV_FIELDS[i];
            const v = cells[i];
            const n = Number(v);
            obj[k] = Number.isFinite(n) ? n : v;
        }
        return obj;
    }

    /**
     * Normalizza/sincronizza i nomi dei campi secondo la logica esistente
     * e dispatcha sull’evento giusto (type o "data").
     * @param {any} p
     * @private
     */
    _dispatchNormalized(p) {
        let msg = p;
        if (p && typeof p === "object") {
            msg = {...p};

            // Alias timestamp -> DateTime
            if (p.timestamp && !p.DateTime) msg.DateTime = p.timestamp;

            // Lat -> Latitude (rimuove "+", Number)
            if (p.Lat !== undefined && msg.Latitude === undefined) {
                const val =
                    typeof p.Lat === "string" ? Number(p.Lat.replace("+", "")) : p.Lat;
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
            if (p.accelX !== undefined && msg.AccelX === undefined)
                msg.AccelX = Number(p.accelX);
            if (p.accelY !== undefined && msg.AccelY === undefined)
                msg.AccelY = Number(p.accelY);
            if (p.accelZ !== undefined && msg.AccelZ === undefined)
                msg.AccelZ = Number(p.accelZ);
            if (p.accelSum !== undefined && msg.AccelSum === undefined)
                msg.AccelSum = Number(p.accelSum);

            if (p.pitch !== undefined && msg.Pitch === undefined) msg.Pitch = Number(p.pitch);
            if (p.roll !== undefined && msg.Roll === undefined) msg.Roll = Number(p.roll);
            if (p.yaw !== undefined && msg.Yaw === undefined) msg.Yaw = Number(p.yaw);

            if (p.Speed !== undefined && msg.Speed === undefined) msg.Speed = Number(p.Speed);
        }

        // Dispatch: se c'è type e l'evento esiste, usa quello; altrimenti "data"
        if (msg?.type && msg.type !== "data" && this.listeners[msg.type]) {
            this._emit(msg.type, msg);
        } else {
            this._emit("data", msg);
        }
    }
}

export default WebSocketService;
