import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { apiFetch } from '../api';
export default function Santri() {
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch('/santri', 'GET');
                setRows(data);
            }
            catch (e) {
                console.error('Failed to fetch santri', e);
            }
        };
        load();
    }, []);
    const columns = [
        { key: 'nama', header: 'Nama' },
        { key: 'nis', header: 'NIS' },
        { key: 'kelas', header: 'Kelas' },
        { key: 'dompet', header: 'Dompet (saldo)' },
        { key: 'status', header: 'Status' },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Data Santri" }), _jsx("button", { className: "btn btn-primary", onClick: () => setOpen(true), children: "Tambah Santri" })] }), _jsx(Card, { children: _jsx(Table, { columns: columns, data: rows }) }), _jsx(Modal, { open: open, title: "Tambah Santri", onClose: () => setOpen(false), children: _jsxs("div", { className: "grid grid-cols-1 gap-2 md:grid-cols-2", children: [_jsx("input", { className: "rounded-md border px-3 py-2", placeholder: "Nama" }), _jsx("input", { className: "rounded-md border px-3 py-2", placeholder: "NIS" }), _jsx("input", { className: "rounded-md border px-3 py-2", placeholder: "Kelas" }), _jsx("input", { className: "rounded-md border px-3 py-2", placeholder: "Dompet" })] }) })] }));
}
