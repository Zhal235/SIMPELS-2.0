import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Card from '../../components/Card';
import { useEffect, useState } from 'react';
import { listMutasiKeluar } from '../../api/mutasiKeluar';
export default function MutasiKeluar() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await listMutasiKeluar();
                const data = Array.isArray(res) ? res : (res?.data || []);
                setItems(data);
            }
            catch (e) {
                console.error(e);
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Mutasi Keluar" }), _jsx(Card, { title: "Daftar Mutasi Keluar", children: loading ? (_jsx("div", { children: "Memuat..." })) : items.length === 0 ? (_jsx("div", { children: "Tidak ada mutasi keluar" })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "No" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Nama" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Tanggal Mutasi" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Tujuan" })] }) }), _jsx("tbody", { children: items.map((m, idx) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: idx + 1 }), _jsx("td", { className: "px-6 py-4", children: m.santri?.nama_santri }), _jsx("td", { className: "px-6 py-4", children: m.tanggal_mutasi }), _jsx("td", { className: "px-6 py-4", children: m.tujuan })] }, m.id))) })] }) })) })] }));
}
