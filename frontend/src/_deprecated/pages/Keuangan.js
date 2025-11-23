import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import { apiFetch } from '../api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
export default function Keuangan() {
    const [items, setItems] = useState([]);
    const [saldo, setSaldo] = useState(null);
    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch('/keuangan', 'GET');
                setItems(data);
                const s = await apiFetch('/keuangan/saldo', 'GET');
                setSaldo(s);
            }
            catch (e) {
                console.error('Failed to fetch keuangan', e);
            }
        };
        load();
    }, []);
    const columns = [
        { key: 'tanggal', header: 'Tanggal' },
        { key: 'jenis', header: 'Jenis' },
        { key: 'nominal', header: 'Nominal' },
        { key: 'keterangan', header: 'Keterangan' },
    ];
    const chartData = items.map((i, idx) => ({ x: idx + 1, y: i.nominal * (i.jenis === 'debit' ? 1 : -1) }));
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Keuangan" }), _jsxs("div", { className: "text-brand font-semibold", children: ["Total Saldo: ", saldo?.total ?? '-'] })] }), _jsx(Card, { title: "Grafik Keuangan", children: _jsx("div", { className: "h-56", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: chartData, children: [_jsx(XAxis, { dataKey: "x", hide: true }), _jsx(YAxis, { hide: true }), _jsx(Area, { type: "monotone", dataKey: "y", stroke: "#1ABC9C", fill: "#1ABC9C", fillOpacity: 0.2 })] }) }) }) }), _jsx(Card, { children: _jsx(Table, { columns: columns, data: items }) })] }));
}
