import {
    Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper
} from "@mui/material";

// helper: sanitizza numeri tipo "+013.30112"
function sanitizeNumberLike(v) {
    if (v === null || v === undefined) return NaN;
    let s = String(v).trim().replace(/^\+/, "");
    if (/^0\d/.test(s)) s = s.replace(/^0+(\d)/, "$1");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
}

function DataTable({dataList}) {
    const getRowStyle = (classificazione) => {
        switch ((classificazione || "").toLowerCase()) {
            case "verde":
                return {backgroundColor: "#e6f4ea"};
            case "giallo":
                return {backgroundColor: "#fff8e1"};
            case "rosso":
                return {backgroundColor: "#fdecea"};
            default:
                return {};
        }
    };

    const formatTimestamp = (isoLike) => {
        const val = isoLike || null;
        if (!val) return "—";
        const d = new Date(val);
        if (isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("it-IT", {
            dateStyle: "short",
            timeStyle: "medium",
        }).format(d);
    };

    return (
        <TableContainer component={Paper} sx={{width: "100%", height: "100%", boxShadow: 3, borderRadius: 2}}>
            <Table stickyHeader sx={{width: "100%", tableLayout: "fixed"}}>
                <TableHead>
                    <TableRow sx={{backgroundColor: "#eeeeee"}}>
                        <TableCell>Data e ora</TableCell>
                        <TableCell>Velocità</TableCell>
                        <TableCell>accelX</TableCell>
                        <TableCell>accelY</TableCell>
                        <TableCell>accelZ</TableCell>
                        <TableCell>accelSum</TableCell>
                        <TableCell>pitch</TableCell>
                        <TableCell>roll</TableCell>
                        <TableCell>yaw</TableCell>
                        <TableCell>Latitudine</TableCell>
                        <TableCell>Longitudine</TableCell>
                        <TableCell>Classificazione</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {dataList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={12} align="center">Nessun dato</TableCell>
                        </TableRow>
                    ) : (
                        dataList.map((item, idx) => {
                            const ts = item.timestamp || item.DateTime || null;

                            // campi numerici esatti dal device
                            const speed = Number(item.Speed);
                            const ax = Number(item.accelX);
                            const ay = Number(item.accelY);
                            const az = Number(item.accelZ);
                            const asum = Number(item.accelSum);

                            const pitch = Number(item.pitch);
                            const roll = Number(item.roll);
                            const yaw = Number(item.yaw);

                            // Lat/Lon come arrivano (Lat/Lon), con sanitize per + e zeri
                            const lat = sanitizeNumberLike(item.Lat);
                            const lon = sanitizeNumberLike(item.Lon);

                            const cls = item.classificazione || "—";

                            return (
                                <TableRow key={idx} sx={getRowStyle(cls)}>
                                    <TableCell>{formatTimestamp(ts)}</TableCell>
                                    <TableCell>{Number.isFinite(speed) ? `${speed.toFixed(2)} kn` : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(ax) ? ax.toFixed(3) : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(ay) ? ay.toFixed(3) : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(az) ? az.toFixed(3) : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(asum) ? asum.toFixed(3) : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(pitch) ? pitch.toFixed(2) : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(roll) ? roll.toFixed(2) : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(yaw) ? yaw.toFixed(2) : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(lat) ? lat.toFixed(5) : "—"}</TableCell>
                                    <TableCell>{Number.isFinite(lon) ? lon.toFixed(5) : "—"}</TableCell>
                                    <TableCell>{cls}</TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default DataTable;
