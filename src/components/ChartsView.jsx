import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, BarChart, Bar, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend } from 'recharts';

const ChartsView = ({ dataList }) => {
    // Dati ordinati per timestamp decrescente → crescente
    const sortedData = [...dataList].reverse();

    const formatTimestamp = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat("it-IT", {
            dateStyle: "short",
            timeStyle: "medium",
        }).format(date);
    };

    const CustomDot = ({ cx, cy, payload }) => {
        const colorMap = {
            verde: "green",
            giallo: "gold",
            rosso: "red"
        };
        const color = colorMap[payload.classificazione] || "gray";

        return (
            <circle cx={cx} cy={cy} r={4} stroke="black" strokeWidth={1} fill={color} />
        );
    };

    const getClassificazioneCounts = (dataList) => {
        const counts = { verde: 0, giallo: 0, rosso: 0 };
        dataList.forEach(d => {
            if (counts[d.classificazione] !== undefined) {
                counts[d.classificazione]++;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const COLORS = {
        verde: "green",
        giallo: "gold",
        rosso: "red"
    };

    const groupByMinuteAndClassificazione = (dataList) => {
        const grouped = {};

        dataList.forEach((item) => {
            const date = new Date(item.timestamp);
            const minuteKey = date.toISOString().substring(0, 16); // es: "2025-08-08T14:37"

            if (!grouped[minuteKey]) {
                grouped[minuteKey] = { timestamp: minuteKey, verde: 0, giallo: 0, rosso: 0 };
            }

            if (grouped[minuteKey][item.classificazione] !== undefined) {
                grouped[minuteKey][item.classificazione]++;
            }
        });

        return Object.values(grouped).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    };



    return (
        <div style={{ padding: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Line Chart - Velocità */}
                <div style={{ width: "100%", height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sortedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip labelFormatter={formatTimestamp}/>
                            <Legend />
                            <Line type="monotone" dataKey="velocita" stroke="#8884d8" name="Velocità (nodi)" dot={<CustomDot />}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Line Chart - Accelerazioni */}
                <div style={{ width: "100%", height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sortedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip labelFormatter={formatTimestamp}/>
                            <Legend />
                            <Line type="monotone" dataKey="accelX" stroke="#ff7300" name="Accel X" dot={<CustomDot />}/>
                            <Line type="monotone" dataKey="accelY" stroke="#387908" name="Accel Y" dot={<CustomDot />}/>
                            <Line type="monotone" dataKey="accelZ" stroke="#007bff" name="Accel Z" dot={<CustomDot />}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart Classificazioni */}
                {/* RIGA: PieChart + BarChart */}
                <div style={{ display: "flex", gap: "2rem", width: "100%" }}>
                    {/* Pie Chart */}
                    <div style={{ flex: 1, height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={getClassificazioneCounts(sortedData)}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {getClassificazioneCounts(sortedData).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                                    ))}
                                </Pie>
                                <PieTooltip />
                                <PieLegend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart */}
                    <div style={{ flex: 2, height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupByMinuteAndClassificazione(sortedData)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(v) => {
                                        const date = new Date(v);
                                        return new Intl.DateTimeFormat("it-IT", {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }).format(date);
                                    }}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    labelFormatter={(v) => {
                                        const date = new Date(v);
                                        return new Intl.DateTimeFormat("it-IT", {
                                            dateStyle: "short",
                                            timeStyle: "short"
                                        }).format(date);
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="verde" stackId="a" fill="green" name="Verde" />
                                <Bar dataKey="giallo" stackId="a" fill="gold" name="Giallo" />
                                <Bar dataKey="rosso" stackId="a" fill="red" name="Rosso" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default ChartsView;
