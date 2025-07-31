import {useState} from "react";
import {
    Drawer,
    Toolbar,
    Typography,
    TextField,
    Button,
    Divider,
    Box
} from "@mui/material";
import WebSocketService from "../services/WebSocketService";

const USE_MOCK = true;
const wsClient = USE_MOCK
    ? {sendCommand: (cmd, params) => console.log("MOCK COMMAND:", cmd, params)}
    : new WebSocketService("ws://192.168.4.1:8080/ws");

function Sidebar() {
    // Stato per form getHistory
    const [since, setSince] = useState("");
    const [onlyCritical, setOnlyCritical] = useState(false);

    // Stato per form setConfig
    const [freq, setFreq] = useState(1);
    const [threshold1, setThreshold1] = useState(3.0);
    const [threshold2, setThreshold2] = useState(2.0);

    // Funzione generica invio comando
    const handleCommand = (cmd, params = {}) => {
        wsClient.sendCommand(cmd, params);
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 250,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 250,
                    boxSizing: 'border-box',
                    backgroundColor: "#eeeeee",
                    padding: 2,
                    marginTop: '64px',      // <-- offset sotto la navbar
                    height: 'calc(100% - 64px)' // <-- evita scroll oltre navbar
                },
            }}
        >
            {/* GET HISTORY */}
            <Box sx={{p: 1}}>
                <Typography variant="body2" sx={{fontWeight: "bold", mb: 1}}>Get History</Typography>
                <TextField
                    label="Since (ISO8601)"
                    value={since}
                    onChange={(e) => setSince(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{mb: 1}}
                />
                <Button
                    variant={onlyCritical ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setOnlyCritical(!onlyCritical)}
                    sx={{mb: 1}}
                >
                    {onlyCritical ? "Solo Critici: ON" : "Solo Critici: OFF"}
                </Button>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleCommand("getHistory", {since, onlyCritical})}
                >
                    Invia
                </Button>
            </Box>

            <Divider sx={{my: 1}}/>

            {/* SET CONFIG */}
            <Box sx={{p: 1}}>
                <Typography variant="body2" sx={{fontWeight: "bold", mb: 1}}>Set Config</Typography>
                <TextField
                    label="Frequenza (sec)"
                    type="number"
                    value={freq}
                    onChange={(e) => setFreq(Number(e.target.value))}
                    size="small"
                    fullWidth
                    sx={{mb: 1}}
                />
                <TextField
                    label="Soglia 1 (verde-giallo)"
                    type="number"
                    value={threshold1}
                    onChange={(e) => setThreshold1(Number(e.target.value))}
                    size="small"
                    fullWidth
                    sx={{mb: 1}}
                />
                <TextField
                    label="Soglia 2 (giallo-rosso)"
                    type="number"
                    value={threshold2}
                    onChange={(e) => setThreshold2(Number(e.target.value))}
                    size="small"
                    fullWidth
                    sx={{mb: 1}}
                />
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleCommand("setConfig", {
                        freq,
                        threshold: {1: threshold1, 2: threshold2}
                    })}
                >
                    Invia
                </Button>
            </Box>

            <Divider sx={{my: 1}}/>

            {/* PING */}
            <Box sx={{p: 1}}>
                <Typography variant="body2" sx={{fontWeight: "bold", mb: 1}}>Ping</Typography>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleCommand("ping")}
                >
                    Ping
                </Button>
            </Box>

            <Divider sx={{my: 1}}/>

            {/* RESET BUFFER */}
            <Box sx={{p: 1}}>
                <Typography variant="body2" sx={{fontWeight: "bold", mb: 1}}>Reset Buffer</Typography>
                <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={() => handleCommand("resetBuffer")}
                >
                    Reset
                </Button>
            </Box>

        </Drawer>
    );
}

export default Sidebar;
