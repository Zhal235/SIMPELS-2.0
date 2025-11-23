import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import { apiFetch } from '../api';
export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await apiFetch('/dashboard', 'GET');
                setSummary(data);
            }
            catch (e) {
                console.error('Failed to fetch dashboard', e);
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    return (_jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [_jsx(Card, { title: "Total Santri", children: _jsx("div", { className: "text-3xl font-bold text-brand", children: loading ? '...' : summary?.totalSantri ?? '-' }) }), _jsx(Card, { title: "Total Saldo Keuangan", children: _jsx("div", { className: "text-3xl font-bold text-brand", children: loading ? '...' : summary?.totalSaldo ?? '-' }) }), _jsx(Card, { title: "Grafik Absensi (mingguan)", children: _jsx("div", { className: "flex items-end gap-1 h-24", children: (summary?.absensiSeries ?? [10, 20, 12, 30, 18, 25, 22]).map((v, i) => (_jsx("div", { className: "w-6 bg-brand", style: { height: `${v}px` } }, i))) }) })] }));
}
