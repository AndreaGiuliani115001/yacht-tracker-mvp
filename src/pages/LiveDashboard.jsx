// src/pages/LiveDashboard.jsx
import {useEffect, useRef, useState} from "react";
import {Box, Toolbar} from "@mui/material";

import Navbar from "@/components/Navbar.jsx";
import Sidebar from "@/components/Sidebar.jsx";
import DataTable from "@/components/DataTable.jsx";
import MapView from "@/components/map/MapView.jsx";
import ChartsView from "@/components/charts/ChartsView.jsx";
import {CONFIG} from "@/shared/config.js";
import {createDataService} from "@/services/dataServiceFactory.js";

/** Manteniamo gli ultimi N elementi (nuovi in testa) */
const MAX_ROWS = 20;

/**
 * LiveDashboard
 * - Istanzia un data service singleton (WS o Mock) per il ciclo di vita della pagina.
 * - Registra i listener PRIMA della connect() e gestisce cleanup completo.
 * - Aggiorna lo stato connessione e il buffer dati (ultimi 20).
 */
export default function LiveDashboard() {
    /** @type {ReturnType<typeof useState<"map"|"table"|"charts">>} */
    const [view, setView] = useState("map");
    const [dataList, setDataList] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("Disconnesso");

    // Istanzia il service UNA SOLA VOLTA per il ciclo di vita del componente
    const serviceRef = useRef(null);
    if (!serviceRef.current) {

        // Con factory + config centralizzata:
        serviceRef.current = createDataService(CONFIG);
    }
    const dataService = serviceRef.current;

    useEffect(() => {
        let isMounted = true;

        // --- Handlers ---
        const onOpen = () => {
            if (!isMounted) return;
            setConnectionStatus("Connesso");
            // Safe-start: anche se chiamato prima di open, viene accodato dal service
            dataService.sendStartOnce({
                freq: 10,
                threshold: {giallo: 2.0, rosso: 3.0},
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

        // --- Registra i listener PRIMA di connect() usando unsubscribe ergonomico ---
        const unsubs = [
            dataService.on("open", onOpen),
            dataService.on("close", onClose),
            dataService.on("status", onStatus),
            dataService.on("error", onError),
            dataService.on("data", onData),
        ].filter(Boolean);

        // --- Connetti (idempotente) ---
        dataService.connect();

        // --- Cleanup ---
        return () => {
            isMounted = false;
            // esegui tutti gli unsubscribe se presenti
            for (const u of unsubs) try {
                u && u();
            } catch { /* noop */
            }
            // pulizia totale del service (chiude ws, svuota listener, cancella timer)
            dataService.destroy?.() ?? dataService.close?.();
        };
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
