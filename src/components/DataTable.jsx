import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper
} from "@mui/material";

function DataTable({ dataList }) {

    const getRowStyle = (classificazione) => {
        switch (classificazione) {
            case "verde": return { backgroundColor: "#e6f4ea" };
            case "giallo": return { backgroundColor: "#fff8e1" };
            case "rosso": return { backgroundColor: "#fdecea" };
            default: return {};
        }
    };

    const formatTimestamp = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat("it-IT", {
            dateStyle: "short",
            timeStyle: "medium",
        }).format(date);
    };


    return (
        <TableContainer
            component={Paper}
            sx={{ width: "100%", height: "100%", boxShadow: 3, borderRadius: 2 }}
        >
            <Table stickyHeader sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: "#eeeeee" }}>
                        <TableCell>Data e ora</TableCell>
                        <TableCell>Velocità</TableCell>
                        <TableCell>accellerazione X</TableCell>
                        <TableCell>accellerazione Y</TableCell>
                        <TableCell>accellerazione Z</TableCell>
                        <TableCell>Latitudine</TableCell>
                        <TableCell>Longitudine</TableCell>
                        <TableCell>Classificazione</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {dataList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center">Nessun dato</TableCell>
                        </TableRow>
                    ) : (
                        dataList.map((item, index) => (
                            <TableRow key={index} sx={getRowStyle(item.classificazione)}>
                                <TableCell>{formatTimestamp(item.timestamp)}</TableCell>
                                <TableCell>{item.velocita} nodi</TableCell>
                                <TableCell>{item.accelX}</TableCell>
                                <TableCell>{item.accelY}</TableCell>
                                <TableCell>{item.accelZ}</TableCell>
                                <TableCell>{item.posizioneLat.toFixed(5)}</TableCell>
                                <TableCell>{item.posizioneLon.toFixed(5)}</TableCell>
                                <TableCell>{item.classificazione}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default DataTable;
