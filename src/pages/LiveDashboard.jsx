// src/pages/LiveDashboard.jsx
import {useEffect, useRef, useState} from "react";
import {Box, Toolbar} from "@mui/material";

import MockDataService from "../services/MockDataService.js";
import WebSocketService from "../services/WebSocketService.js";

import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import DataTable from "../components/DataTable.jsx";
import MapView from "../components/MapView.jsx";
import ChartsView from "../components/ChartsView.jsx";

/**
 * Config runtime (non cambia la logica: default invariati).
 * VITE_USE_MOCK: "true" | "false"
 * VITE_WS_URL: string (es. ws://192.168.4.1/ws)
 */
const USE_MOCK =
    String(import.meta.env?.VITE_USE_MOCK ?? "false").toLowerCase() === "true";
const WS_URL = import.meta.env?.VITE_WS_URL ?? "ws://192.168.4.1/ws";

/** Manteniamo gli ultimi N elementi (nuovi in testa), come da logica originale. */
const MAX_ROWS = 20;

/**
 * LiveDashboard
 * - Istanzia un data service singleton (WS o Mock) per il ciclo di vita della pagina.
 * - Registra i listener PRIMA della connect() e gestisce cleanup completo.
 * - Aggiorna lo stato connessione e il buffer dati (ultimi 20).
 */
function LiveDashboard() {
    /** @type {ReturnType<typeof useState<"map"|"table"|"charts">>} */
    const [view, setView] = useState("map");
    const [dataList, setDataList] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("Disconnesso");

    // Istanzia il service UNA SOLA VOLTA per il ciclo di vita del componente
    const serviceRef = useRef(null);
    if (!serviceRef.current) {
        serviceRef.current = USE_MOCK ? new MockDataService() : new WebSocketService(WS_URL);
    }
    const dataService = serviceRef.current;

    useEffect(() => {
        let isMounted = true; // micro-guard contro setState dopo unmount

        // --- Handlers ---
        const onOpen = () => {
            if (!isMounted) return;
            setConnectionStatus("Connesso");
            dataService.sendStartOnce({
                freq: 1,
                threshold: {giallo: 2.5, rosso: 5},
            });
        };

        const onClose = () => {
            if (!isMounted) return;
            setConnectionStatus("Disconnesso");
        };

        const onStatus = (s) => {
            if (!isMounted) return;
            if (s?.state === "connected") setConnectionStatus("Connesso");
            if (s?.state === "closed" || s?.state === "error") setConnectionStatus("Disconnesso");
        };

        const onError = () => {
            if (!isMounted) return;
            setConnectionStatus("Disconnesso");
        };

        const onData = (msg) => {
            if (!isMounted) return;
            // Mantieni ultimi 20 (nuovi in testa).
            setDataList((prev) => [msg, ...prev].slice(0, MAX_ROWS));
        };

        // --- Registra i listener PRIMA di connect() ---
        dataService.on("open", onOpen);
        dataService.on("close", onClose);
        dataService.on("status", onStatus);
        dataService.on("error", onError);
        dataService.on("data", onData);

        // --- Connetti (idempotente) ---
        dataService.connect();

        // --- Cleanup ---
        return () => {
            isMounted = false;
            dataService.off("open", onOpen);
            dataService.off("close", onClose);
            dataService.off("status", onStatus);
            dataService.off("error", onError);
            dataService.off("data", onData);
            dataService.close();
        };
        // Notare: usiamo direttamente serviceRef.current, niente deps -> effetto una volta sola.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intenzionale: esegui una sola volta al mount

    return (
        <Box sx={{display: "flex", height: "100vh", width: "100vw"}}>
            <Sidebar onSelectView={setView} onCommand={(cmd, params) => dataService.sendCommand(cmd, params)}/>
            <Box sx={{flexGrow: 1, display: "flex", flexDirection: "column"}}>
                <Navbar connectionStatus={connectionStatus}/>
                <Toolbar/>
                <Box sx={{flexGrow: 1, overflow: "auto"}}>
                    {view === "map" && <MapView dataList={dataList}/>}
                    {view === "table" && <DataTable dataList={dataList}/>}
                    {view === "charts" && <ChartsView dataList={dataList}/>}
                </Box>
            </Box>
        </Box>
    );
}

export default LiveDashboard;
