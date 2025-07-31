/**
 * @class WebSocketService
 * @classdesc Gestisce la connessione WebSocket con la centralina di bordo.
 * Fornisce metodi per connettersi, inviare comandi e registrare listener per i messaggi ricevuti.
 */
class WebSocketService {
    /**
     * Crea una nuova istanza del servizio WebSocket.
     * @param {string} url - URL del server WebSocket (es: ws://192.168.4.1:8080/ws)
     */
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.reconnectInterval = 3000; // millisecondi tra tentativi di riconnessione
        this.isManuallyClosed = false;
        this.listeners = {
            data: [],
            status: [],
            historicalData: [],
            error: [],
            open: [],
            close: [],
        };
    }

    /**
     * Apre una connessione WebSocket e imposta i listener di sistema (onopen, onmessage, onerror, onclose).
     * Se la connessione viene chiusa inaspettatamente, tenta di riconnettersi automaticamente.
     * @returns {void}
     */
    connect() {
        console.log("🔌 Connessione WebSocket a:", this.url);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log("✅ WebSocket connesso");
            this.listeners.open.forEach(cb => cb());
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type && this.listeners[message.type]) {
                    this.listeners[message.type].forEach(cb => cb(message));
                } else {
                    console.warn("Messaggio non gestito:", message);
                }
            } catch (err) {
                console.error("Errore parsing WS:", err);
            }
        };

        this.ws.onerror = (err) => {
            console.error("Errore WebSocket:", err);
            this.listeners.error.forEach(cb => cb(err));
        };

        this.ws.onclose = () => {
            console.warn("⚠️ WebSocket chiuso");
            this.listeners.close.forEach(cb => cb());
            if (!this.isManuallyClosed) {
                setTimeout(() => this.connect(), this.reconnectInterval);
            }
        };
    }

    /**
     * Invia un comando al server WebSocket se la connessione è attiva.
     * @param {string} command - Nome del comando (es: "getHistory", "resetBuffer", "start")
     * @param {object} [params={}] - Eventuali parametri aggiuntivi per il comando
     * @returns {void}
     */
    sendCommand(command, params = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = { type: "command", command, params };
            this.ws.send(JSON.stringify(msg));
        } else {
            console.warn("Impossibile inviare comando, WS non connesso");
        }
    }

    /**
     * Registra una funzione callback da eseguire quando arriva un determinato tipo di evento.
     * @param {"data"|"status"|"historicalData"|"error"|"open"|"close"} eventType - Tipo di evento da ascoltare
     * @param {function} callback - Funzione da richiamare alla ricezione dell'evento
     * @returns {void}
     */
    on(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        } else {
            console.warn("Evento non supportato:", eventType);
        }
    }

    /**
     * Chiude la connessione WebSocket e disattiva la riconnessione automatica.
     * @returns {void}
     */
    close() {
        this.isManuallyClosed = true;
        if (this.ws) {
            this.ws.close();
        }
    }
}

export default WebSocketService;
