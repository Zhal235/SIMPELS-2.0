import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import { apiFetch } from '../api';
export default function Absensi() {
    const [rows, setRows] = useState([]);
    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch('/absensi', 'GET');
                setRows(data);
            }
            catch (e) {
                console.error('Failed to fetch absensi', e);
            }
        };
        load();
    }, []);
    const columns = [
        { key: 'nama', header: 'Nama' },
        { key: 'tanggal', header: 'Tanggal' },
        { key: 'status', header: 'Status' },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Absensi" }), _jsx("button", { className: "btn btn-primary", children: "Rekam Kehadiran (QR Dummy)" })] }), _jsx(Card, { children: _jsx(Table, { columns: columns, data: rows }) })] }));
}
