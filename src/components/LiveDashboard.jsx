import { useState, useEffect } from "react";
import { Box, Toolbar } from "@mui/material";
import MockDataService from "../services/MockDataService";
import WebSocketService from "../services/WebSocketService";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import DataTable from "./DataTable";

const USE_MOCK = true;
const dataService = USE_MOCK
    ? new MockDataService()
    : new WebSocketService("ws://192.168.4.1:8080/ws");

function LiveDashboard() {
    const [dataList, setDataList] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("Disconnesso");

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
            <Sidebar />

            {/* Contenuto principale */}
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Navbar connectionStatus={connectionStatus} />
                <Toolbar />
                <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
                    <DataTable dataList={dataList} />
                </Box>
            </Box>
        </Box>
    );
}

export default LiveDashboard;
