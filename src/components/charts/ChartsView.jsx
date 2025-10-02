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

import {CLASS_COLORS} from "@/shared/constants.js";
import {CHART_DEFAULTS, CHART_ANIM} from "@/components/charts/constants.js";
import {
    toISOts,
    toNum,
    formatTs,
    formatHourMinute,
    formatShort,
    groupCountsPerMinute,
} from "@/utils/data.js";

/** Dot colorato in base alla classificazione */
const CustomDot = React.memo(function CustomDot({cx, cy, payload}) {
    const color = CLASS_COLORS[(payload?.classificazione || "").toLowerCase()] || "gray";
    return <circle cx={cx} cy={cy} r={4} stroke="black" strokeWidth={1} fill={color}/>;
});

/** Stato vuoto semplice */
function EmptyState() {
    return (
        <div style={{padding: "1rem", opacity: 0.7}}>
            Nessun dato disponibile al momento.
        </div>
    );
}

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
                    // opzionali per usi futuri:
                    accelSum: toNum(it?.accelSum),
                    pitch: toNum(it?.pitch),
                    roll: toNum(it?.roll),
                    yaw: toNum(it?.yaw),
                };
            })
            .filter((r) => !!r.ts); // serve un timestamp per i grafici temporali
    }, [sorted]);

    // Pie: conteggi per classificazione
    const pieData = useMemo(() => {
        const counts = {verde: 0, giallo: 0, rosso: 0};
        for (const r of chartData) {
            if (counts[r.classificazione] !== undefined) counts[r.classificazione]++;
        }
        return Object.entries(counts).map(([name, value]) => ({name, value}));
    }, [chartData]);

    // Bar stack per minuto
    const perMinute = useMemo(() => groupCountsPerMinute(chartData), [chartData]);

    // Formatter stabili per gli assi/tooltip
    const xTickFormatter = useCallback((v) => formatTs(v), []);
    const barXAxisTickFormatter = useCallback((v) => formatHourMinute(v), []);
    const barTooltipLabelFormatter = useCallback((v) => formatShort(v), []);

    // No data guard
    const hasData =
        chartData.length > 0 ||
        pieData.some((p) => p.value > 0) ||
        perMinute.length > 0;

    if (!hasData) return <EmptyState/>;

    const H = CHART_DEFAULTS.HEIGHT;

    return (
        <div style={{padding: "1rem"}}>
            <div style={{display: "flex", flexDirection: "column", gap: "2rem"}}>
                {/* Line Chart - Velocità (Speed) */}
                <div style={{width: "100%", height: H}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray={CHART_DEFAULTS.GRID_DASH}/>
                            <XAxis dataKey="ts" tickFormatter={xTickFormatter} tick={{fontSize: 10}}/>
                            <YAxis/>
                            <Tooltip labelFormatter={xTickFormatter}/>
                            <Legend/>
                            <Line
                                type="monotone"
                                dataKey="Speed"
                                name="Velocità (nodi)"
                                dot={<CustomDot/>}
                                activeDot={false}
                                isAnimationActive={CHART_ANIM.ENABLED}
                                animationDuration={CHART_ANIM.DURATION}
                                animationEasing={CHART_ANIM.EASING}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Line Chart - Accelerazioni */}
                <div style={{width: "100%", height: H}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray={CHART_DEFAULTS.GRID_DASH}/>
                            <XAxis dataKey="ts" tickFormatter={xTickFormatter} tick={{fontSize: 10}}/>
                            <YAxis/>
                            <Tooltip labelFormatter={xTickFormatter}/>
                            <Legend/>
                            <Line
                                type="monotone"
                                dataKey="accelX"
                                name="accelX"
                                dot={<CustomDot/>}
                                activeDot={false}
                                isAnimationActive={CHART_ANIM.ENABLED}
                                animationDuration={CHART_ANIM.DURATION}
                                animationEasing={CHART_ANIM.EASING}
                                connectNulls
                            />
                            <Line
                                type="monotone"
                                dataKey="accelY"
                                name="accelY"
                                dot={<CustomDot/>}
                                activeDot={false}
                                isAnimationActive={CHART_ANIM.ENABLED}
                                animationDuration={CHART_ANIM.DURATION}
                                animationEasing={CHART_ANIM.EASING}
                                connectNulls
                            />
                            <Line
                                type="monotone"
                                dataKey="accelZ"
                                name="accelZ"
                                dot={<CustomDot/>}
                                activeDot={false}
                                isAnimationActive={CHART_ANIM.ENABLED}
                                animationDuration={CHART_ANIM.DURATION}
                                animationEasing={CHART_ANIM.EASING}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* RIGA: Pie (totale classificazioni) + Bar (stack per minuto) */}
                <div style={{display: "flex", gap: "2rem", width: "100%", flexWrap: "wrap"}}>
                    {/* Pie Chart */}
                    <div style={{flex: 1, minWidth: 260, height: H}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                    isAnimationActive={CHART_ANIM.ENABLED}
                                    animationDuration={CHART_ANIM.DURATION}
                                    animationEasing={CHART_ANIM.EASING}
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={CLASS_COLORS[entry.name] || "gray"}/>
                                    ))}
                                </Pie>
                                <Tooltip/>
                                <Legend/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart per minuto */}
                    <div style={{flex: 2, minWidth: 360, height: H}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={perMinute}>
                                <CartesianGrid strokeDasharray={CHART_DEFAULTS.GRID_DASH}/>
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={barXAxisTickFormatter}
                                    tick={{fontSize: 10}}
                                />
                                <YAxis allowDecimals={false}/>
                                <Tooltip labelFormatter={barTooltipLabelFormatter}/>
                                <Legend/>
                                <Bar dataKey="verde" stackId="a" name="Verde" fill={CLASS_COLORS.verde}
                                     isAnimationActive={CHART_ANIM.ENABLED}
                                     animationDuration={CHART_ANIM.DURATION}
                                     animationEasing={CHART_ANIM.EASING}/>
                                <Bar dataKey="giallo" stackId="a" name="Giallo" fill={CLASS_COLORS.giallo}
                                     isAnimationActive={CHART_ANIM.ENABLED}
                                     animationDuration={CHART_ANIM.DURATION}
                                     animationEasing={CHART_ANIM.EASING}/>
                                <Bar dataKey="rosso" stackId="a" name="Rosso" fill={CLASS_COLORS.rosso}
                                     isAnimationActive={CHART_ANIM.ENABLED}
                                     animationDuration={CHART_ANIM.DURATION}
                                     animationEasing={CHART_ANIM.EASING}/>
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
