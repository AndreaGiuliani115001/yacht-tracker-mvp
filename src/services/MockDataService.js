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

        const percorsoMare = [
            { lat: 43.7000, lon: 13.5000 },  // circa 15 km a est di Ancona
            { lat: 43.7200, lon: 13.5200 },
            { lat: 43.7400, lon: 13.5400 },
            { lat: 43.7600, lon: 13.5600 },
            { lat: 43.7800, lon: 13.5800 },
            { lat: 43.8000, lon: 13.6000 },
            { lat: 43.8200, lon: 13.6200 },
            { lat: 43.8400, lon: 13.6400 },
        ];



        let percorsoIndex = 0;


        console.log("🧪 Modalità MOCK: simulazione dati avviata");
        this.listeners.open.forEach(cb => cb());

        this.intervalId = setInterval(() => {
            // Prendo la posizione dal percorso
            const posizione = percorsoMare[percorsoIndex];

            // Creo il messaggio simulato
            const mockMessage = {
                type: "data",
                timestamp: new Date().toISOString(),
                velocita: Math.floor(Math.random() * (50 - 10 + 1)) + 10,
                accelX: (Math.random() * 5).toFixed(2),
                accelY: (Math.random() * 5).toFixed(2),
                accelZ: (Math.random() * 5).toFixed(2),
                posizioneLat: posizione.lat,
                posizioneLon: posizione.lon,
                classificazione: this.getRandomClassificazione()
            };

            this.listeners.data.forEach(cb => cb(mockMessage));

            // Incrementa indice e torna a 0 se finito percorso
            percorsoIndex++;
            if (percorsoIndex >= percorsoMare.length) {
                percorsoIndex = 0;
            }
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
