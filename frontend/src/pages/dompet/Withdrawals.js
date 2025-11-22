import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { getEposPool, listWithdrawals, createWithdrawal } from '../../api/wallet';
import toast from 'react-hot-toast';
export default function Withdrawals() {
    const [pool, setPool] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    useEffect(() => { load(); }, []);
    async function load() {
        try {
            setLoading(true);
            const [pRes, wRes] = await Promise.all([getEposPool(), listWithdrawals()]);
            if (pRes.success)
                setPool(pRes.data);
            if (wRes.success)
                setWithdrawals(wRes.data || []);
        }
        catch (err) {
            console.error(err);
            toast.error('Gagal memuat data');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleCreate(e) {
        e?.preventDefault();
        const amt = Number(amount);
        if (!amt || amt <= 0) {
            toast.error('Nominal tidak valid');
            return;
        }
        try {
            const res = await createWithdrawal(amt, note);
            if (res.success) {
                toast.success('Permintaan penarikan dibuat');
                setShowModal(false);
                load();
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal membuat penarikan');
        }
    }
    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'amount', header: 'Nominal' },
        { key: 'status', header: 'Status' },
        { key: 'requested_by', header: 'Diminta oleh' },
        { key: 'processed_by', header: 'Diproses oleh' },
        { key: 'created_at', header: 'Waktu' },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Penarikan (ePOS)" }), _jsx("div", { className: "flex gap-2", children: _jsx("button", { className: "btn btn-primary", onClick: () => setShowModal(true), children: "Buat Penarikan" }) })] }), _jsx(Card, { children: loading ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Memuat..." })) : (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "p-4 bg-white border rounded shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-500", children: "Saldo Pool ePOS" }), _jsxs("div", { className: "text-xl font-bold text-brand", children: ["Rp ", Number(pool?.balance || 0).toLocaleString('id-ID')] })] }), _jsxs("div", { className: "text-sm text-gray-400", children: ["Pool name: ", pool?.name] })] }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm text-gray-700 mb-2", children: "Daftar penarikan" }), _jsx(Table, { columns: columns, data: withdrawals, getRowKey: (r) => r.id })] })] })) }), _jsx(Modal, { open: showModal, title: "Buat Penarikan", onClose: () => setShowModal(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowModal(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: (e) => handleCreate(e), children: "Buat" })] })), children: _jsxs("form", { onSubmit: handleCreate, className: "space-y-3", children: [_jsx("label", { className: "block text-sm", children: "Nominal (Rp)" }), _jsx("input", { value: amount, onChange: (e) => setAmount(e.target.value), className: "rounded-md border px-3 py-2 w-full" }), _jsx("label", { className: "block text-sm", children: "Catatan (opsional)" }), _jsx("input", { value: note, onChange: (e) => setNote(e.target.value), className: "rounded-md border px-3 py-2 w-full" })] }) })] }));
}
