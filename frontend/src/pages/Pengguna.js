import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Table from '../components/Table';
import { apiFetch } from '../api';
export default function Pengguna() {
    const [rows, setRows] = useState([]);
    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch('/user', 'GET');
                setRows(data);
            }
            catch (e) {
                console.error('Failed to fetch users', e);
            }
        };
        load();
    }, []);
    const columns = [
        { key: 'name', header: 'Nama' },
        { key: 'role', header: 'Role' },
        { key: 'email', header: 'Email' },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Pengguna" }), _jsx(Card, { children: _jsx(Table, { columns: columns, data: rows }) })] }));
}
