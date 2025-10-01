// src/services/MockDataService.js

/**
 * @class MockDataService
 * @classdesc Simula la ricezione di dati sensoriali come se provenissero dalla centralina via WebSocket.
 * - Stessa interfaccia di WebSocketService: on/off, connect/close, sendCommand, sendStartOnce
 * - Emette eventi: "open", "close", "status", "error", "data"
 * - Campi compatibili con la normalizzazione di WebSocketService:
 *   timestamp -> DateTime, Lat/Lon -> Latitude/Longitude, Speed, accelX/Y/Z, accelSum, pitch/roll/yaw, classificazione
 */
class MockDataService {
    /**
     * @param {object} [options]
     * @param {number} [options.defaultFreq=1]   Frequenza invio (Hz) predefinita quando non arriva setConfig
     */
    constructor(options = {}) {
        /** @private */ this.intervalId = null;
        /** @private */ this.isConnected = false;
        /** @private */ this.freqHz = Number.isFinite(options.defaultFreq) ? options.defaultFreq : 1;

        /** @private */
        this.listeners = {
            data: [],
            status: [],
            historicalData: [],
            error: [],
            open: [],
            close: [],
        };

        // percorso fittizio (mare largo Ancona)
        /** @private */
        this.path = [
            {lat: 43.7000, lon: 13.5000},
            {lat: 43.7200, lon: 13.5200},
            {lat: 43.7400, lon: 13.5400},
            {lat: 43.7600, lon: 13.5600},
            {lat: 43.7800, lon: 13.5800},
            {lat: 43.8000, lon: 13.6000},
            {lat: 43.8200, lon: 13.6200},
            {lat: 43.8400, lon: 13.6400},
        ];
        /** @private */ this.pathIdx = 0;
    }

    // ============== API pubblica (compatibile con WebSocketService) ==============

    /**
     * Registra un listener.
     * @param {"data"|"status"|"historicalData"|"error"|"open"|"close"} eventType
     * @param {(payload:any)=>void} callback
     */
    on(eventType, callback) {
        if (!this.listeners[eventType]) return;
        if (typeof callback !== "function") return;
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
        this.listeners[eventType] = this.listeners[eventType].filter((cb) => cb !== callback);
    }

    /**
     * Simula l'apertura della connessione ed avvia la generazione dei dati.
     * Idempotente: se già connesso, non fa nulla.
     */
    connect() {
        if (this.isConnected) {
            console.log("ℹ️ MOCK già connesso");
            return;
        }

        this.isConnected = true;
        console.log("🧪 Modalità MOCK: simulazione dati avviata");

        this._emit("open");
        this._emit("status", {state: "connected"});

        this._startTickLoop();
    }

    /**
     * Invia un "comando" al mock (per compatibilità). Logga e non genera errori.
     * @param {string} command
     * @param {object} [params={}]
     */
    sendCommand(command, params = {}) {
        // Compat: stesso shape inviato dal WS reale.
        console.log("MOCK ➡️  Comando ricevuto:", {command, params});
        // Puoi opzionalmente reagire ad alcuni comandi qui se serve.
    }

    /**
     * Applica la configurazione iniziale una sola volta per "sessione" (compat WS).
     * Supporta { freq } per regolare la frequenza di invio in Hz.
     * @param {{freq?:number, threshold?:any}} params
     */
    sendStartOnce(params = {}) {
        if (params && Number.isFinite(params.freq) && params.freq > 0) {
            this.freqHz = params.freq;
            // Riavvia il loop con la nuova frequenza, se già connesso
            if (this.isConnected) {
                this._restartTickLoop();
            }
        }
        console.log("MOCK ⚙️  setConfig:", params);
    }

    /**
     * Ferma la simulazione e segnala chiusura.
     */
    close() {
        if (!this.isConnected) return;
        this.isConnected = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this._emit("close");
        this._emit("status", {state: "closed"});
        console.log("🛑 Modalità MOCK: simulazione interrotta");
    }

    // ============================ Helper privati ============================

    /** @private */
    _emit(eventType, payload) {
        const cbs = this.listeners[eventType];
        if (!cbs || cbs.length === 0) return;
        for (const cb of cbs) {
            try {
                cb(payload);
            } catch (err) {
                console.error(`[MockDataService] Listener error on "${eventType}"`, err);
            }
        }
    }

    /** Avvia il loop di tick in base a freqHz. @private */
    _startTickLoop() {
        const periodMs = Math.max(50, Math.round(1000 / this.freqHz)); // cap min 20Hz
        this.intervalId = setInterval(() => this._tick(), periodMs);
    }

    /** Riavvia il loop di tick (usato quando cambia freq). @private */
    _restartTickLoop() {
        if (this.intervalId) clearInterval(this.intervalId);
        this._startTickLoop();
    }

    /** Un singolo "tick": genera un dato coerente con quello reale. @private */
    _tick() {
        try {
            const pos = this._nextPosition();

            // Velocità (nodi) plausibile 10–35, con piccole oscillazioni
            const baseSpeed = 22;
            const speedJitter = (Math.random() - 0.5) * 10;
            const speed = Math.max(10, Math.min(35, baseSpeed + speedJitter));

            // Accelerometri (g) con rumore
            const accelX = this._rndGaussian(0, 0.8);
            const accelY = this._rndGaussian(0, 0.8);
            const accelZ = 1 + this._rndGaussian(0, 0.15); // gravità ~1g con piccole variazioni
            const accelSum = Math.sqrt(accelX ** 2 + accelY ** 2 + accelZ ** 2);

            // Assetto (gradi) con variazioni lievi
            const pitch = this._rndGaussian(0, 3); // beccheggio
            const roll = this._rndGaussian(0, 4); // rollio
            const yaw = (Date.now() / 3000) % 360; // virata lenta e continua

            // Classificazione eventi in base ad accelerazione risultante
            const classificazione = this._classify(accelSum);

            // 🔑 Campi scelti per combaciare con la normalizzazione in WebSocketService:
            // - timestamp -> DateTime
            // - Lat/Lon -> Latitude/Longitude (gestiti da normalizzazione)
            // - Speed (stesso nome/caso)
            // - accelX/Y/Z, accelSum, pitch/roll/yaw, classificazione
            const mockMessage = {
                // type: "data", // opzionale: se omesso, WS dispatcher la invia su "data"
                timestamp: new Date().toISOString(),
                Lat: pos.lat,
                Lon: pos.lon,
                Speed: Number(speed.toFixed(2)),

                accelX: Number(accelX.toFixed(3)),
                accelY: Number(accelY.toFixed(3)),
                accelZ: Number(accelZ.toFixed(3)),
                accelSum: Number(accelSum.toFixed(3)),

                pitch: Number(pitch.toFixed(2)),
                roll: Number(roll.toFixed(2)),
                yaw: Number(yaw.toFixed(2)),

                classificazione,
            };

            this._emit("data", mockMessage);
        } catch (err) {
            console.error("Mock tick error:", err);
            this._emit("error", err);
            this._emit("status", {state: "error", detail: err?.message || "mock error"});
        }
    }

    /** Calcola la prossima posizione lungo il percorso (loop). @private */
    _nextPosition() {
        const p = this.path[this.pathIdx];
        this.pathIdx = (this.pathIdx + 1) % this.path.length;

        // Piccolo jitter per sembrare più naturale
        const jitter = () => (Math.random() - 0.5) * 0.002; // ~200 m
        return {lat: p.lat + jitter(), lon: p.lon + jitter()};
    }

    /**
     * Estrae da Gaussiana con media e deviazione standard.
     * @param {number} mean
     * @param {number} std
     * @returns {number}
     * @private
     */
    _rndGaussian(mean, std) {
        // Box–Muller transform
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + z * std;
    }

    /**
     * Regole semplici per classificare l'intensità evento in base all'accelerazione risultante.
     * @param {number} aSum
     * @returns {"verde"|"giallo"|"rosso"}
     * @private
     */
    _classify(aSum) {
        if (aSum >= 1.6) return "rosso";
        if (aSum >= 1.25) return "giallo";
        return "verde";
    }
}

export default MockDataService;
