import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { getEposPool, listEposWithdrawals, createEposWithdrawal, approveEposWithdrawal, rejectEposWithdrawal } from '../../api/wallet';
import toast from 'react-hot-toast';
export default function Withdrawals() {
    const [pool, setPool] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [requestedBy, setRequestedBy] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);
    useEffect(() => { load(); }, []);
    async function load() {
        try {
            setLoading(true);
            const [pRes, wRes] = await Promise.all([getEposPool(), listEposWithdrawals()]);
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
        if (!requestedBy.trim()) {
            toast.error('Nama yang meminta tidak boleh kosong');
            return;
        }
        try {
            const res = await createEposWithdrawal(amt, note, requestedBy);
            if (res.success) {
                toast.success('Permintaan penarikan dibuat');
                setShowModal(false);
                setAmount('');
                setNote('');
                setRequestedBy('');
                load();
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal membuat penarikan');
        }
    }
    async function handleApprove(withdrawal) {
        if (!window.confirm(`Setujui penarikan ${withdrawal.withdrawal_number} sebesar Rp ${parseFloat(withdrawal.amount || 0).toLocaleString('id-ID')}?`)) {
            return;
        }
        try {
            setProcessing(true);
            const res = await approveEposWithdrawal(withdrawal.id);
            if (res.success) {
                toast.success('Penarikan berhasil disetujui');
                load();
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal menyetujui penarikan');
        }
        finally {
            setProcessing(false);
        }
    }
    function openRejectModal(withdrawal) {
        setSelectedWithdrawal(withdrawal);
        setRejectReason('');
        setShowRejectModal(true);
    }
    async function handleReject(e) {
        e?.preventDefault();
        if (!rejectReason.trim() || rejectReason.trim().length < 5) {
            toast.error('Alasan penolakan minimal 5 karakter');
            return;
        }
        try {
            setProcessing(true);
            const res = await rejectEposWithdrawal(selectedWithdrawal.id, rejectReason);
            if (res.success) {
                toast.success('Penarikan berhasil ditolak');
                setShowRejectModal(false);
                setSelectedWithdrawal(null);
                setRejectReason('');
                load();
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal menolak penarikan');
        }
        finally {
            setProcessing(false);
        }
    }
    const columns = [
        { key: 'withdrawal_number', header: 'Nomor', render: (v) => _jsx("div", { className: "text-sm font-mono", children: v }) },
        { key: 'amount', header: 'Nominal', render: (v) => _jsx("div", { className: "font-semibold", children: `Rp ${parseFloat(v || 0).toLocaleString('id-ID')}` }) },
        {
            key: 'status',
            header: 'Status',
            render: (v, row) => (_jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${v === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    v === 'approved' ? 'bg-green-100 text-green-700' :
                        v === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'}`, children: row.status_label || v }))
        },
        {
            key: 'requested_by',
            header: 'Diminta oleh',
            render: (v) => _jsx("div", { className: "text-sm", children: v || '-' })
        },
        {
            key: 'period_start',
            header: 'Periode',
            render: (v, row) => (_jsx("div", { className: "text-xs", children: v && row.period_end ? `${new Date(v).toLocaleDateString('id-ID')} - ${new Date(row.period_end).toLocaleDateString('id-ID')}` : '-' }))
        },
        {
            key: 'created_at',
            header: 'Waktu Pengajuan',
            render: (v) => _jsx("div", { className: "text-xs", children: new Date(v).toLocaleString('id-ID') })
        },
        {
            key: 'id',
            header: 'Aksi',
            render: (_, row) => (_jsxs("div", { className: "flex gap-2", children: [row.status === 'pending' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => handleApprove(row), disabled: processing, className: "px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50", children: "Setujui" }), _jsx("button", { onClick: () => openRejectModal(row), disabled: processing, className: "px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50", children: "Tolak" })] })), row.status !== 'pending' && (_jsx("span", { className: "text-xs text-gray-400", children: row.status === 'approved' ? 'Disetujui' :
                            row.status === 'completed' ? 'Selesai' :
                                'Ditolak' }))] }))
        }
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Penarikan ePOS" }), _jsx("div", { className: "flex gap-2", children: _jsxs("button", { className: "btn btn-secondary", onClick: () => load(), children: [_jsx("span", { className: "mr-2", children: "\uD83D\uDD04" }), " Refresh"] }) })] }), _jsx(Card, { children: loading ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Memuat..." })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx("div", { className: "p-4 bg-white border rounded shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-500", children: "Saldo Pool ePOS" }), _jsxs("div", { className: "text-xl font-bold text-brand", children: ["Rp ", Number(pool?.balance || 0).toLocaleString('id-ID')] })] }), _jsx("div", { className: "text-3xl", children: "\uD83D\uDCB0" })] }) }), _jsx("div", { className: "p-4 bg-yellow-50 border border-yellow-200 rounded shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-yellow-700", children: "Pending Approval" }), _jsxs("div", { className: "text-xl font-bold text-yellow-800", children: [withdrawals.filter(w => w.status === 'pending').length, " permintaan"] })] }), _jsx("div", { className: "text-3xl", children: "\u23F3" })] }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm text-gray-700 mb-2 font-semibold", children: "Daftar Permintaan Penarikan" }), _jsx(Table, { columns: columns, data: withdrawals, getRowKey: (r) => r.id })] })] })) }), _jsx(Modal, { open: showRejectModal, title: "Tolak Penarikan", onClose: () => {
                    setShowRejectModal(false);
                    setSelectedWithdrawal(null);
                    setRejectReason('');
                }, footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => {
                                setShowRejectModal(false);
                                setSelectedWithdrawal(null);
                                setRejectReason('');
                            }, disabled: processing, children: "Batal" }), _jsx("button", { className: "btn btn-danger", onClick: (e) => handleReject(e), disabled: processing || !rejectReason.trim() || rejectReason.trim().length < 5, children: processing ? 'Memproses...' : 'Tolak' })] })), children: _jsxs("form", { onSubmit: handleReject, className: "space-y-3", children: [selectedWithdrawal && (_jsxs("div", { className: "p-3 bg-gray-50 rounded", children: [_jsx("div", { className: "text-xs text-gray-500", children: "Nomor Penarikan" }), _jsx("div", { className: "font-mono font-semibold", children: selectedWithdrawal.withdrawal_number }), _jsx("div", { className: "text-xs text-gray-500 mt-2", children: "Nominal" }), _jsxs("div", { className: "font-bold text-red-600", children: ["Rp ", parseFloat(selectedWithdrawal.amount || 0).toLocaleString('id-ID')] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Alasan Penolakan *" }), _jsx("textarea", { value: rejectReason, onChange: (e) => setRejectReason(e.target.value), className: "rounded-md border px-3 py-2 w-full", placeholder: "Jelaskan alasan penolakan (minimal 5 karakter)", rows: 4, required: true }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: [rejectReason.trim().length, " / 5 karakter minimum"] })] })] }) })] }));
}
