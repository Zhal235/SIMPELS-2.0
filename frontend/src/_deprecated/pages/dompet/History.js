import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { listWalletTransactions, listWallets, createWithdrawal, listCashWithdrawals } from '../../api/wallet';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
export default function History() {
    const [mode, setMode] = useState('history');
    const [transactions, setTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawNote, setWithdrawNote] = useState('');
    const location = useLocation();
    useEffect(() => { load(); }, [location.search, mode]);
    async function load() {
        try {
            setLoading(true);
            if (mode === 'history') {
                const query = new URLSearchParams(location.search);
                const params = {};
                if (query.get('santri_id'))
                    params.santri_id = query.get('santri_id');
                const res = await listWalletTransactions(params);
                if (res.success)
                    setTransactions(res.data || []);
            }
            else {
                // Laporan mode: fetch all wallets and cash withdrawals
                const [walletsRes, cashWithdrawalsRes] = await Promise.all([
                    listWallets(),
                    listCashWithdrawals({ status: 'done' })
                ]);
                if (walletsRes.success) {
                    setWallets(walletsRes.data || []);
                }
                if (cashWithdrawalsRes.success) {
                    setWithdrawals(cashWithdrawalsRes.data || []);
                }
            }
        }
        catch (err) {
            console.error(err);
            toast.error('Gagal memuat data');
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
    const historyColumns = [
        { key: 'id', header: 'ID', render: (v) => _jsx("div", { className: "text-xs font-mono", children: String(v).substring(0, 8) }) },
        { key: 'santri_name', header: 'Santri', render: (v, r) => _jsx("div", { children: r.wallet?.santri?.nama_santri || '-' }) },
        { key: 'type', header: 'Tipe', render: (v) => _jsx("span", { className: `px-2 py-1 rounded text-xs ${v === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`, children: v === 'credit' ? 'Topup' : 'Debit' }) },
        { key: 'amount', header: 'Nominal', render: (v) => _jsx("div", { children: `Rp ${parseFloat(v || 0).toLocaleString('id-ID')}` }) },
        { key: 'balance_after', header: 'Saldo Setelah', render: (v) => _jsx("div", { children: `Rp ${parseFloat(v || 0).toLocaleString('id-ID')}` }) },
        { key: 'description', header: 'Keterangan' },
        { key: 'method', header: 'Metode', render: (v) => _jsx("span", { className: "text-xs capitalize", children: v || 'cash' }) },
        { key: 'created_at', header: 'Waktu', render: (v) => _jsx("div", { className: "text-xs", children: new Date(v).toLocaleString('id-ID') }) },
    ];
    const laporanColumns = [
        { key: 'nis', header: 'NIS', render: (v, r) => _jsx("div", { children: r.santri?.nis || '-' }) },
        { key: 'nama_santri', header: 'Nama Santri', render: (v, r) => _jsx("div", { children: r.santri?.nama_santri || '-' }) },
        { key: 'balance', header: 'Saldo', render: (v) => _jsx("div", { className: "font-semibold", children: `Rp ${parseFloat(v || 0).toLocaleString('id-ID')}` }) },
        { key: 'total_credit', header: 'Total Credit', render: (v) => _jsx("div", { className: "text-green-600", children: `Rp ${parseFloat(v || 0).toLocaleString('id-ID')}` }) },
        { key: 'total_debit', header: 'Total Debit', render: (v) => _jsx("div", { className: "text-red-600", children: `Rp ${parseFloat(v || 0).toLocaleString('id-ID')}` }) },
    ];
    // Calculate totals for Laporan mode
    // Total Saldo Keseluruhan = jumlah balance semua santri
    const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);
    const totalCreditCash = wallets.reduce((sum, w) => sum + parseFloat(w.total_credit_cash || 0), 0);
    const totalCreditTransfer = wallets.reduce((sum, w) => sum + parseFloat(w.total_credit_transfer || 0), 0);
    const totalDebitCash = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit_cash || 0), 0);
    const totalDebitTransfer = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit_transfer || 0), 0);
    const totalDebitEpos = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit_epos || 0), 0);
    // Calculate total withdrawals (dana yang sudah ditarik dari transfer ke cash)
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
    // Saldo Cash = credit cash - debit cash - debit epos + withdrawals (karena withdrawal adalah pemindahan dari transfer ke cash)
    const totalCashBalance = (totalCreditCash - totalDebitCash - totalDebitEpos) + totalWithdrawals;
    // Saldo Bank = credit transfer - debit transfer - withdrawals (karena withdrawal mengurangi transfer)
    const totalBankBalance = (totalCreditTransfer - totalDebitTransfer) - totalWithdrawals;
    const totalCredit = totalCreditCash + totalCreditTransfer;
    const totalDebit = totalDebitCash + totalDebitTransfer + totalDebitEpos;
    async function handleWithdraw() {
        if (!withdrawAmount || withdrawAmount <= 0) {
            toast.error('Masukkan nominal yang valid');
            return;
        }
        const bankBalance = totalBankBalance;
        if (withdrawAmount > bankBalance) {
            toast.error(`Saldo transfer tidak mencukupi (tersedia: Rp ${bankBalance.toLocaleString('id-ID')})`);
            return;
        }
        try {
            const res = await createWithdrawal(Number(withdrawAmount), withdrawNote);
            if (res.success) {
                toast.success(`Tarik dana Rp ${parseFloat(String(withdrawAmount)).toLocaleString('id-ID')} berhasil`);
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                setWithdrawNote('');
                load();
            }
            else {
                toast.error(res.message || 'Gagal tarik dana');
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal tarik dana');
        }
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold", children: "History & Laporan Dompet" }), mode === 'history' && _jsx("button", { className: "btn btn-primary", onClick: exportCSV, children: "Export CSV" })] }), _jsxs("div", { className: "flex gap-2 border-b", children: [_jsx("button", { className: `px-4 py-2 font-medium ${mode === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`, onClick: () => setMode('history'), children: "History Transaksi" }), _jsx("button", { className: `px-4 py-2 font-medium ${mode === 'laporan' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`, onClick: () => setMode('laporan'), children: "Laporan Saldo" })] }), loading ? (_jsx(Card, { children: _jsx("div", { className: "p-6 text-center text-gray-500", children: "Memuat..." }) })) : mode === 'history' ? (_jsxs(Card, { children: [_jsx("div", { className: "mb-3", children: _jsxs("p", { className: "text-sm text-gray-500", children: ["Menampilkan ", transactions.length, " transaksi"] }) }), transactions.length === 0 ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Belum ada transaksi" })) : (_jsx(Table, { columns: historyColumns, data: transactions, getRowKey: (r) => r.id }))] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: [_jsxs(Card, { children: [_jsx("div", { className: "text-sm text-gray-500 mb-1", children: "Total Saldo Keseluruhan" }), _jsxs("div", { className: "text-2xl font-bold text-blue-600", children: ["Rp ", totalBalance.toLocaleString('id-ID')] })] }), _jsxs(Card, { children: [_jsx("div", { className: "text-sm text-gray-500 mb-1", children: "Saldo Cash" }), _jsxs("div", { className: "text-2xl font-bold text-gray-700", children: ["Rp ", totalCashBalance.toLocaleString('id-ID')] }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["Masuk: Rp ", totalCreditCash.toLocaleString('id-ID')] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Keluar: Rp ", totalDebitCash.toLocaleString('id-ID')] })] }), _jsxs(Card, { children: [_jsxs("div", { className: "text-sm text-gray-500 mb-1 flex items-center justify-between", children: [_jsx("span", { children: "Saldo Bank/Transfer" }), _jsx("button", { className: "text-blue-600 text-xs hover:underline", onClick: () => setShowWithdrawModal(true), children: "Tarik Dana" })] }), _jsxs("div", { className: "text-2xl font-bold text-purple-600", children: ["Rp ", totalBankBalance.toLocaleString('id-ID')] }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["Masuk: Rp ", totalCreditTransfer.toLocaleString('id-ID')] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Keluar: Rp ", totalDebitTransfer.toLocaleString('id-ID')] })] }), _jsxs(Card, { children: [_jsx("div", { className: "text-sm text-gray-500 mb-1", children: "Total Credit" }), _jsxs("div", { className: "text-2xl font-bold text-green-600", children: ["Rp ", totalCredit.toLocaleString('id-ID')] })] }), _jsxs(Card, { children: [_jsx("div", { className: "text-sm text-gray-500 mb-1", children: "Total Debit" }), _jsxs("div", { className: "text-2xl font-bold text-red-600", children: ["Rp ", totalDebit.toLocaleString('id-ID')] })] })] }), _jsxs(Card, { children: [_jsxs("div", { className: "mb-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Rincian per Santri" }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Daftar ", wallets.length, " santri dengan saldo dan transaksi"] })] }), wallets.length === 0 ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Belum ada data dompet" })) : (_jsx(Table, { columns: laporanColumns, data: wallets, getRowKey: (r) => r.id }))] })] })), _jsx(Modal, { open: showWithdrawModal, title: "Tarik Dana dari Bank ke Cash", onClose: () => { setShowWithdrawModal(false); setWithdrawAmount(''); setWithdrawNote(''); }, footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => { setShowWithdrawModal(false); setWithdrawAmount(''); setWithdrawNote(''); }, children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: handleWithdraw, children: "Tarik Dana" })] })), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-500 mb-2", children: "Saldo Bank/Transfer tersedia:" }), _jsxs("div", { className: "text-2xl font-bold text-purple-600", children: ["Rp ", totalBankBalance.toLocaleString('id-ID')] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Nominal Tarik Dana (Rp)" }), _jsx("input", { type: "number", value: withdrawAmount, onChange: (e) => setWithdrawAmount(e.target.value ? parseFloat(e.target.value) : ''), min: "0", step: "1000", className: "rounded-md border px-3 py-2 w-full", placeholder: "Masukkan nominal" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Catatan (opsional)" }), _jsx("textarea", { value: withdrawNote, onChange: (e) => setWithdrawNote(e.target.value), rows: 3, className: "rounded-md border px-3 py-2 w-full", placeholder: "Catatan tarik dana..." })] }), _jsx("div", { className: "text-xs text-gray-500", children: "Dana akan dipindahkan dari saldo transfer ke cash untuk operasional." })] }) })] }));
}
