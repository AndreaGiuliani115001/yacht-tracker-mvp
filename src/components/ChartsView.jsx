// src/components/ChartsView.jsx
import React, {useMemo, useCallback} from "react";
import PropTypes from "prop-types";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    BarChart,
    Bar,
    Pie,
    Cell,
} from "recharts";

/** =========================
 * Helpers coerenti con il device
 * ========================= */
const COLORS = {verde: "green", giallo: "gold", rosso: "red"};

const toISOts = (item) => item?.timestamp || item?.DateTime || null;

// Sanitizza numeri tipo "+013.301" o stringhe numeriche
const toNum = (v) => {
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim().replace(/^\+/, "");
    const s2 = /^0\d/.test(s) ? s.replace(/^0+(\d)/, "$1") : s;
    const n = Number(s2);
    return Number.isFinite(n) ? n : NaN;
};

const formatTs = (isoLike) => {
    if (!isoLike) return "—";
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("it-IT", {
        dateStyle: "short",
        timeStyle: "medium",
    }).format(d);
};

/** Dot colorato in base alla classificazione */
const CustomDot = React.memo(function CustomDot({cx, cy, payload}) {
    const color = COLORS[(payload?.classificazione || "").toLowerCase()] || "gray";
    return <circle cx={cx} cy={cy} r={4} stroke="black" strokeWidth={1} fill={color}/>;
});

/** =========================
 * Componente principale
 * ========================= */
function ChartsView({dataList}) {
    // Ordine cronologico crescente per l’asse X
    const sorted = useMemo(() => [...(dataList || [])].reverse(), [dataList]);

    // Normalizzo SOLO ciò che serve ai grafici (senza rinominare chiavi del device)
    const chartData = useMemo(() => {
        return sorted
            .map((it) => {
                const ts = toISOts(it);
                return {
                    ts,
                    classificazione: (it?.classificazione || "").toLowerCase(),
                    Speed: toNum(it?.Speed),
                    accelX: toNum(it?.accelX),
                    accelY: toNum(it?.accelY),
                    accelZ: toNum(it?.accelZ),
                    // opzionali (se vuoi usarli più avanti):
                    accelSum: toNum(it?.accelSum),
                    pitch: toNum(it?.pitch),
                    roll: toNum(it?.roll),
                    yaw: toNum(it?.yaw),
                };
            })
            .filter((r) => !!r.ts); // serve un timestamp per i grafici temporali
    }, [sorted]);

    // Conta classificazioni per il Pie
    const pieData = useMemo(() => {
        const counts = {verde: 0, giallo: 0, rosso: 0};
        for (const r of chartData) {
            if (counts[r.classificazione] !== undefined) counts[r.classificazione]++;
        }
        return Object.entries(counts).map(([name, value]) => ({name, value}));
    }, [chartData]);

    // Raggruppo per minuto per il BarChart (stack rosso/giallo/verde)
    const perMinute = useMemo(() => {
        const acc = new Map(); // key: "YYYY-MM-DDTHH:MM"
        for (const r of chartData) {
            const d = new Date(r.ts);
            if (Number.isNaN(d.getTime())) continue;
            const key = d.toISOString().slice(0, 16); // minuto
            if (!acc.has(key)) acc.set(key, {timestamp: key, verde: 0, giallo: 0, rosso: 0});
            const bucket = acc.get(key);
            if (bucket[r.classificazione] !== undefined) bucket[r.classificazione]++;
        }
        return [...acc.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }, [chartData]);

    // Formatter stabili per gli assi/tooltip
    const xTickFormatter = useCallback((v) => formatTs(v), []);
    const barXAxisTickFormatter = useCallback((v) => {
        const d = new Date(v);
        return Number.isNaN(d.getTime())
            ? v
            : new Intl.DateTimeFormat("it-IT", {hour: "2-digit", minute: "2-digit"}).format(d);
    }, []);
    const barTooltipLabelFormatter = useCallback((v) => {
        const d = new Date(v);
        return Number.isNaN(d.getTime())
            ? v
            : new Intl.DateTimeFormat("it-IT", {dateStyle: "short", timeStyle: "short"}).format(d);
    }, []);

    return (
        <div style={{padding: "1rem"}}>
            <div style={{display: "flex", flexDirection: "column", gap: "2rem"}}>
                {/* Line Chart - Velocità (Speed) */}
                <div style={{width: "100%", height: 300}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="ts" tickFormatter={xTickFormatter} tick={{fontSize: 10}}/>
                            <YAxis/>
                            <Tooltip labelFormatter={xTickFormatter}/>
                            <Legend/>
                            <Line type="monotone" dataKey="Speed" name="Velocità (nodi)" dot={<CustomDot/>}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Line Chart - Accelerazioni */}
                <div style={{width: "100%", height: 300}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="ts" tickFormatter={xTickFormatter} tick={{fontSize: 10}}/>
                            <YAxis/>
                            <Tooltip labelFormatter={xTickFormatter}/>
                            <Legend/>
                            <Line type="monotone" dataKey="accelX" name="accelX" dot={<CustomDot/>}/>
                            <Line type="monotone" dataKey="accelY" name="accelY" dot={<CustomDot/>}/>
                            <Line type="monotone" dataKey="accelZ" name="accelZ" dot={<CustomDot/>}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* RIGA: Pie (totale classificazioni) + Bar (stack per minuto) */}
                <div style={{display: "flex", gap: "2rem", width: "100%", flexWrap: "wrap"}}>
                    {/* Pie Chart */}
                    <div style={{flex: 1, minWidth: 260, height: 300}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                                     label>
                                    {pieData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={COLORS[entry.name]}/>
                                    ))}
                                </Pie>
                                <Tooltip/>
                                <Legend/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart per minuto */}
                    <div style={{flex: 2, minWidth: 360, height: 300}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={perMinute}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={barXAxisTickFormatter}
                                    tick={{fontSize: 10}}
                                />
                                <YAxis allowDecimals={false}/>
                                <Tooltip labelFormatter={barTooltipLabelFormatter}/>
                                <Legend/>
                                <Bar dataKey="verde" stackId="a" name="Verde" fill={COLORS.verde}/>
                                <Bar dataKey="giallo" stackId="a" name="Giallo" fill={COLORS.giallo}/>
                                <Bar dataKey="rosso" stackId="a" name="Rosso" fill={COLORS.rosso}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

ChartsView.propTypes = {
    dataList: PropTypes.arrayOf(PropTypes.object),
};

ChartsView.defaultProps = {
    dataList: [],
};

export default React.memo(ChartsView);
