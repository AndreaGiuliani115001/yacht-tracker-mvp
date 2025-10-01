import {useState} from "react";
import {
    Drawer,
    Typography,
    Button,
    Divider,
    Box,
    Stack,
} from "@mui/material";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import {it} from "date-fns/locale";

function Sidebar({onSelectView, onCommand}) {

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [onlyCritical, setOnlyCritical] = useState(false);

    const handleGetHistory = () => {
        const isoDate = selectedDate?.toISOString?.();
        if (!isoDate) return;
        if (onCommand) onCommand("getHistory", {since: isoDate, onlyCritical});
        else console.warn("onCommand non fornito: getHistory", {since: isoDate, onlyCritical});
    };

    const handleCommand = (cmd, params = {}) => {
        if (onCommand) onCommand(cmd, params);
        else console.warn("onCommand non fornito:", cmd, params);
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 250,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: 250,
                    boxSizing: "border-box",
                    backgroundColor: "#eeeeee",
                    p: 2,
                    mt: "64px",               // sotto la navbar
                    height: "calc(100% - 64px)",
                },
            }}
        >
            {/* GET HISTORY */}
            <Box sx={{p: 1}}>
                <Typography variant="body2" sx={{fontWeight: "bold", mb: 1}}>
                    Get History
                </Typography>

                <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    locale={it}
                >
                    <DateTimePicker
                        label="Data e ora"
                        value={selectedDate}
                        onChange={(newValue) => setSelectedDate(newValue)}
                        slotProps={{
                            textField: {
                                size: "small",
                                fullWidth: true,
                            },
                        }}
                    />
                </LocalizationProvider>

                <Stack direction="row" spacing={1} sx={{mt: 1, mb: 1}}>
                    <Button
                        variant={onlyCritical ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setOnlyCritical((v) => !v)}
                        fullWidth
                    >
                        {onlyCritical ? "Solo Critici: ON" : "Solo Critici: OFF"}
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleGetHistory}
                        fullWidth
                    >
                        Invia
                    </Button>
                </Stack>
            </Box>

            <Divider sx={{my: 1}}/>

            {/* PING */}
            <Box sx={{p: 1}}>
                <Typography variant="body2" sx={{fontWeight: "bold", mb: 1}}>
                    Ping
                </Typography>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleCommand("ping")}
                >
                    Ping
                </Button>
            </Box>

            <Divider sx={{my: 1}}/>

            {/* VISTE */}
            <Box sx={{p: 1}}>
                <Typography variant="body2" sx={{fontWeight: "bold", mb: 1}}>
                    Viste
                </Typography>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                        onSelectView?.("map");
                    }}
                >
                    Mappa
                </Button>
                <Divider sx={{my: 1}}/>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                        onSelectView?.("table");
                    }}
                >
                    Tabella
                </Button>
                <Divider sx={{my: 1}}/>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                        onSelectView?.("charts");
                    }}
                >
                    Grafici
                </Button>
            </Box>
        </Drawer>
    );
}

export default Sidebar;
