/**
 * @class MockDataService
 * @classdesc Simula la ricezione di dati sensoriali come se provenissero dalla centralina via WebSocket.
 * Utile per testare l'app senza hardware collegato.
 */
class MockDataService {
    constructor() {
        this.intervalId = null;
        this.listeners = { data: [], open: [], close: [] };
    }


    /**
     * Simula l'apertura di una connessione e avvia la generazione dei dati.
     */
    connect() {
        console.log("🧪 Modalità MOCK: simulazione dati avviata");
        this.listeners.open.forEach(cb => cb());

        // Genera dati ogni 1 secondo
        this.intervalId = setInterval(() => {
            const mockMessage = {
                type: "data",
                timestamp: new Date().toISOString(),
                forzaX: (Math.random() * 5).toFixed(2),
                forzaY: (Math.random() * 5).toFixed(2),
                forzaZ: (Math.random() * 5).toFixed(2),
                posizioneLat: 43.6100 + Math.random() * 0.01,
                posizioneLon: 13.5100 + Math.random() * 0.01,
                classificazione: this.getRandomClassificazione()
            };
            this.listeners.data.forEach(cb => cb(mockMessage));
        }, 1000);
    }

    /**
     * Restituisce un colore casuale (verde, giallo, rosso) per simulazione eventi.
     */
    getRandomClassificazione() {
        const valori = ["verde", "giallo", "rosso"];
        return valori[Math.floor(Math.random() * valori.length)];
    }

    /**
     * Permette di registrare callback per eventi (solo "data", "open", "close").
     * @param {"data"|"open"|"close"} eventType
     * @param {function} callback
     */
    on(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        }
    }

    /**
     * Ferma la simulazione.
     */
    close() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.listeners.close.forEach(cb => cb());
            console.log("🛑 Modalità MOCK: simulazione interrotta");
        }
    }
}

export default MockDataService;
