import {EVENT_TYPES, RECONNECT} from "./constants.js";
import {tryParseJSON, cleanupPlusAndLeadingZeros, parseDelimitedLine} from "./parsers.js";
import {normalizeMessage} from "./normalize.js";

/**
 * @class WebSocketService
 * Gestisce connessione WS, invio comandi e dispatch eventi.
 * - Idempotenza connect()
 * - on/off con unsubscribe ergonomico
 * - "start" (setConfig) inviato una sola volta per socket (anche se chiamato prima dell’open)
 * - parsing: JSON (con/senza type) o CSV/TSV -> dispatch su "data"
 * - riconnessione con exponential backoff + jitter
 * - opzionale: normalizzazione chiavi (disattivabile)
 */
class WebSocketService {
    /**
     * @param {string} url - Es. "ws://192.168.4.1/ws"
     * @param {{ normalize?: boolean, debug?: boolean }} [options]
     */
    constructor(url, {normalize = true, debug = true} = {}) {
        /** @private */ this.url = url;
        /** @private */ this.ws = null;
        /** @private */ this.isManuallyClosed = false;
        /** @private */ this._startSentForThisSocket = false;
        /** @private */ this._pendingStartParams = null;

        /** @private */ this._normalize = normalize;
        /** @private */ this._debug = debug;

        /** @private */ this._retryCount = 0;
        /** @private */ this._reconnectTimer = null;

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
     * Registra callback per un evento. Ritorna una funzione di unsubscribe.
     * @param {"data"|"status"|"historicalData"|"error"|"open"|"close"} eventType
     * @param {(payload:any)=>void} callback
     * @returns {() => void | undefined}
     */
    on(eventType, callback) {
        if (!EVENT_TYPES.includes(eventType)) {
            this._logWarn("Evento non supportato:", eventType);
            return;
        }
        if (typeof callback !== "function") {
            this._logWarn("Callback non valida per", eventType);
            return;
        }
        this.listeners[eventType].push(callback);
        return () => this.off(eventType, callback);
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
        this.listeners[eventType] = this.listeners[eventType].filter((cb) => cb !== callback);
    }

    /**
     * Connessione idempotente:
     * se esiste già una ws OPEN o CONNECTING, non fa nulla.
     */
    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            this._logInfo("WebSocket già connesso/connecting:", this.url);
            return;
        }

        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        this._retryCount = 0;

        this._logInfo("Connessione WebSocket a:", this.url);
        this.isManuallyClosed = false;
        this._startSentForThisSocket = false;

        const ws = new WebSocket(this.url);
        this.ws = ws;

        ws.onopen = () => {
            this._logInfo("WebSocket connesso");
            this._emit("open");
            this._emit("status", {state: "connected"});

            // se c’è uno start pendente, invialo ora
            if (this._startSentForThisSocket && this._pendingStartParams) {
                const params = this._pendingStartParams;
                this._pendingStartParams = null;
                this.sendCommand("setConfig", params);
            }
        };

        ws.onmessage = (event) => {
            const raw = String(event.data);

            // 1) Prova JSON diretto
            const asJSON = tryParseJSON(raw);
            if (asJSON.ok) {
                this._handleJSON(asJSON.value);
                return;
            }

            // 2) Prova JSON "ripulito" da + e zeri iniziali
            const fixed = cleanupPlusAndLeadingZeros(raw);
            if (fixed !== raw) {
                const asJSONFixed = tryParseJSON(fixed);
                if (asJSONFixed.ok) {
                    this._handleJSON(asJSONFixed.value);
                    return;
                }
            }

            // 3) Prova CSV/TSV/CSV con virgola
            const line = raw.trim();
            if (!line) return;
            const obj = parseDelimitedLine(line);
            if (obj) this._emit("data", obj);
        };

        ws.onerror = (err) => {
            this._logError("Errore WebSocket:", err);
            this._emit("error", err);
            this._emit("status", {state: "error", detail: err?.message || "ws error"});
        };

        ws.onclose = () => {
            this._logWarn("WebSocket chiuso");
            this._emit("close");
            this._emit("status", {state: "closed"});

            if (!this.isManuallyClosed) {
                // exponential backoff con jitter, max ~30s
                const base = RECONNECT.BASE_MS * Math.pow(2, Math.min(this._retryCount, RECONNECT.MAX_EXP));
                const jitter = Math.floor(Math.random() * RECONNECT.JITTER_MS);
                const delay = Math.min(base + jitter, RECONNECT.MAX_MS);

                if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
                this._reconnectTimer = setTimeout(() => {
                    this._reconnectTimer = null;
                    this.connect();
                }, delay);
                this._retryCount++;
            } else {
                this._retryCount = 0;
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
                this._logInfo("Comando inviato:", command);
            } catch (err) {
                this._logError("Errore invio comando:", err);
                this._emit("error", err);
            }
        } else {
            this._logWarn("Impossibile inviare comando, WS non connesso");
        }
    }

    /**
     * Invia "start" (qui: setConfig) una sola volta per ciascuna connessione aperta.
     * Se chiamato prima dell’open, mette in coda i params.
     * @param {object} params
     */
    sendStartOnce(params = {}) {
        if (this._startSentForThisSocket) return;
        this._startSentForThisSocket = true;

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this._pendingStartParams = params;
            return;
        }
        this._pendingStartParams = null;
        this.sendCommand("setConfig", params);
    }

    /**
     * Chiude la connessione e disattiva la riconnessione.
     * (I listener restano registrati: usa off() o destroy() se vuoi pulirli).
     */
    close() {
        this.isManuallyClosed = true;

        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }

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
        this._pendingStartParams = null;
    }

    /**
     * Chiude e rimuove tutti i listener (pulizia totale).
     */
    destroy() {
        this.close();
        for (const k of Object.keys(this.listeners)) this.listeners[k] = [];
    }

    // ======================
    // Helper privati
    // ======================

    /**
     * Gestisce un payload JSON: normalizza (se abilitato) e dispatcha su type o data.
     * @param {any} payload
     * @private
     */
    _handleJSON(payload) {
        const msg = this._normalize ? normalizeMessage(payload) : payload;

        if (msg?.type && msg.type !== "data" && this.listeners[msg.type]) {
            this._emit(msg.type, msg);
        } else {
            this._emit("data", msg);
        }
    }

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
                this._logError(`[WebSocketService] Listener error on "${eventType}"`, err);
            }
        }
    }

    _logInfo(...args) {
        if (this._debug) console.log("🔌[WS]", ...args);
    }

    _logWarn(...args) {
        if (this._debug) console.warn("🔌[WS]", ...args);
    }

    _logError(...args) {
        if (this._debug) console.error("🔌[WS]", ...args);
    }
}

export default WebSocketService;
