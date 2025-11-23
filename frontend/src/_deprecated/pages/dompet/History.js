import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import { listWalletTransactions } from '../../api/wallet';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
export default function History() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    useEffect(() => { load(); }, [location.search]);
    async function load() {
        try {
            setLoading(true);
            const query = new URLSearchParams(location.search);
            const params = {};
            if (query.get('santri_id'))
                params.santri_id = query.get('santri_id');
            const res = await listWalletTransactions(params);
            if (res.success)
                setTransactions(res.data || []);
        }
        catch (err) {
            console.error(err);
            toast.error('Gagal memuat transaksi');
        }
        finally {
            setLoading(false);
        }
    }
    function exportCSV() {
        if (!transactions.length) {
            toast.error('Tidak ada data untuk diexport');
            return;
        }
        const headers = ['id', 'wallet_id', 'type', 'amount', 'balance_after', 'description', 'reference', 'created_at'];
        const csvRows = [headers.join(',')];
        transactions.forEach((t) => {
            csvRows.push(headers.map(h => JSON.stringify(t[h] ?? '')).join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dompet_transactions_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'wallet_id', header: 'Wallet ID' },
        { key: 'type', header: 'Tipe' },
        { key: 'amount', header: 'Nominal' },
        { key: 'balance_after', header: 'Saldo Setelah' },
        { key: 'description', header: 'Keterangan' },
        { key: 'reference', header: 'Referensi' },
        { key: 'created_at', header: 'Waktu' },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "History & Laporan Dompet" }), _jsx("div", { className: "flex gap-2", children: _jsx("button", { className: "btn btn-primary", onClick: exportCSV, children: "Export CSV" }) })] }), _jsx(Card, { children: loading ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Memuat..." })) : (_jsx(Table, { columns: columns, data: transactions, getRowKey: (r) => r.id })) })] }));
}
