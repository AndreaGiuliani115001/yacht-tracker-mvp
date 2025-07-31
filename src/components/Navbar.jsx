import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

function Navbar({ connectionStatus }) {
    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: "#1976d2",
            }}
        >
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    YachtTracker
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SignalCellularAltIcon />
                    <Typography variant="subtitle1">{connectionStatus}</Typography>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;
