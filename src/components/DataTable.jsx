import React, { useMemo } from "react";
import {
    Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper
} from "@mui/material";

import { CLASS_COLORS } from "@/shared/constants.js";
import { toISOts, toNum, formatTs, parseDate } from "@/utils/data.js";

/** Colori “light” per le righe */
const ROW_BG = {
    verde: "#e6f4ea",
    giallo: "#fff8e1",
    rosso: "#fdecea",
};

/** Limite locale di righe (indipendente dal MAX_ROWS del dashboard) */
const MAX_ROWS_TABLE = 100;

/** Formatter numerico: n (Number|null) → stringa con unità opzionale */
function formatNum(n, digits = 2, unit = "") {
    if (n === null || !Number.isFinite(n)) return "—";
    return unit ? `${n.toFixed(digits)} ${unit}` : n.toFixed(digits);
}

function DataTable({ dataList }) {
    const rows = useMemo(() => {
        const mapped = (dataList || []).map((item, idx) => {
            const ts = toISOts(item);

            // valori numerici (toNum → null se non valido)
            const speed = toNum(item.Speed);
            const ax = toNum(item.accelX);
            const ay = toNum(item.accelY);
            const az = toNum(item.accelZ);
            const aSum = toNum(item.accelSum);

            const pitch = toNum(item.pitch);
            const roll = toNum(item.roll);
            const yaw = toNum(item.yaw);

            // Lat/Lon: etichette originali o alias normalizzati
            const lat = toNum(item.Lat ?? item.Latitude);
            const lon = toNum(item.Lon ?? item.Longitude);

            const clsRaw = item.classificazione ?? "—";
            const cls = typeof clsRaw === "string" ? clsRaw.toLowerCase() : String(clsRaw);

            return {
                id: ts ? `ts-${ts}-${idx}` : `row-${idx}`, // key stabile anche con ts uguali
                ts,
                tsDate: parseDate(ts), // per ordinamento robusto
                speed, ax, ay, az, aSum,
                pitch, roll, yaw,
                lat, lon,
                cls,
            };
        });

        // Ordina: più recente prima (DESC). I null vanno in fondo.
        mapped.sort((a, b) => {
            if (!a.tsDate && !b.tsDate) return 0;
            if (!a.tsDate) return 1;
            if (!b.tsDate) return -1;
            return b.tsDate - a.tsDate;
        });

        // Cap locale per sicurezza (evita tabella infinita)
        return mapped.slice(0, MAX_ROWS_TABLE);
    }, [dataList]);

    const getRowStyle = (classificazione) => {
        const key = (classificazione || "").toLowerCase();
        if (key in ROW_BG) return { backgroundColor: ROW_BG[key] };
        return {};
    };

    return (
        <TableContainer component={Paper} sx={{ width: "100%", height: "100%", boxShadow: 3, borderRadius: 2 }}>
            <Table stickyHeader sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: "#eeeeee" }}>
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
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={12} align="center">Nessun dato</TableCell>
                        </TableRow>
                    ) : (
                        rows.map((r) => (
                            <TableRow key={r.id} sx={getRowStyle(r.cls)}>
                                <TableCell>{formatTs(r.ts)}</TableCell>
                                <TableCell>{formatNum(r.speed, 2, "kn")}</TableCell>
                                <TableCell>{formatNum(r.ax, 3)}</TableCell>
                                <TableCell>{formatNum(r.ay, 3)}</TableCell>
                                <TableCell>{formatNum(r.az, 3)}</TableCell>
                                <TableCell>{formatNum(r.aSum, 3)}</TableCell>
                                <TableCell>{formatNum(r.pitch, 2)}</TableCell>
                                <TableCell>{formatNum(r.roll, 2)}</TableCell>
                                <TableCell>{formatNum(r.yaw, 2)}</TableCell>
                                <TableCell>{formatNum(r.lat, 5)}</TableCell>
                                <TableCell>{formatNum(r.lon, 5)}</TableCell>
                                <TableCell style={{ color: CLASS_COLORS[r.cls] || "inherit", fontWeight: 600 }}>
                                    {r.cls || "—"}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default React.memo(DataTable);
