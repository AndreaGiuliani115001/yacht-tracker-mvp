import { useState, useEffect } from "react";
import { Box, Toolbar } from "@mui/material";
import MockDataService from "../services/MockDataService.js";
import WebSocketService from "../services/WebSocketService.js";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import DataTable from "../components/DataTable.jsx";
import MapView from "../components/MapView.jsx";
import ChartsView from "../components/ChartsView.jsx";

const USE_MOCK = true;
const dataService = USE_MOCK
    ? new MockDataService()
    : new WebSocketService("ws://192.168.4.1:8080/ws");

function LiveDashboard() {
    const [dataList, setDataList] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("Disconnesso");
    const [view, setView] = useState("map"); // valore iniziale

    useEffect(() => {
        dataService.connect();
        dataService.on("open", () => setConnectionStatus("Connesso"));
        dataService.on("close", () => setConnectionStatus("Disconnesso"));
        dataService.on("data", (msg) => {
            setDataList(prev => [msg, ...prev].slice(0, 20));
        });

        return () => dataService.close();
    }, []);

    return (
        <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
            {/* Sidebar */}
            <Sidebar onSelectView={setView}/>

            {/* Contenuto principale */}
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Navbar connectionStatus={connectionStatus} />
                <Toolbar />
                <Box sx={{ flexGrow: 1, overflow: "auto"}}>
                    {view === "map" && <MapView dataList={dataList} />}
                    {view === "table" && <DataTable dataList={dataList} />}
                    {view === "charts" && <ChartsView dataList={dataList} />}
                </Box>
            </Box>
        </Box>
    );
}

export default LiveDashboard;
