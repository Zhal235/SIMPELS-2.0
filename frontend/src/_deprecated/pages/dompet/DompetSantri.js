import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { topupWallet, getWallet, getWalletTransactions, debitWallet, updateTransaction, voidTransaction } from '../../api/wallet';
import { listSantri } from '../../api/santri';
import { Search } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import toast from 'react-hot-toast';
export default function DompetSantri() {
    // wallets list is no longer shown globally — we only load wallet per selected santri
    const [loading, setLoading] = useState(true);
    const [santriList, setSantriList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [walletDetail, setWalletDetail] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTxn, setEditingTxn] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editMethod, setEditMethod] = useState('cash');
    const [showVoidConfirm, setShowVoidConfirm] = useState(false);
    // Topup / Tarik states
    const [showTopup, setShowTopup] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [method, setMethod] = useState('cash');
    const currentUser = useAuthStore((s) => s.user);
    const roles = useAuthStore((s) => s.roles);
    const currentRole = roles?.find((r) => (r.slug === (currentUser?.role)));
    useEffect(() => { loadInitial(); }, []);
    async function loadInitial() {
        try {
            setLoading(true);
            const santriRes = await listSantri(1, 200);
            if (santriRes?.status === 'success')
                setSantriList(santriRes.data || []);
        }
        catch (err) {
            console.error(err);
            toast.error('Gagal memuat data');
        }
        finally {
            setLoading(false);
        }
    }
    // openTopup not used after removing global wallet list
    async function submitTopup(e) {
        e?.preventDefault();
        if (!selectedSantri)
            return;
        const amt = Number(amount);
        if (!amt || amt <= 0) {
            toast.error('Masukkan nominal top-up yang valid');
            return;
        }
        try {
            const id = selectedSantri?.id || selectedSantri?.santri_id || selectedSantri?.santri_id;
            const res = await topupWallet(id, amt, note || undefined, method);
            if (res.success) {
                toast.success('Top-up berhasil');
                // refresh wallet detail and transactions
                const updated = await getWallet(id);
                if (updated.success)
                    setWalletDetail(updated.data);
                // refresh transactions for selected santri
                const txn = await getWalletTransactions(id);
                if (txn.success)
                    setTransactions(txn.data || []);
                setShowTopup(false);
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal melakukan top-up');
        }
    }
    async function handleSelectSantri(santri) {
        setSelectedSantri(santri);
        setSearchQuery(santri.nama_santri);
        setShowSearchResults(false);
        try {
            const [wRes, tRes] = await Promise.all([getWallet(santri.id), getWalletTransactions(santri.id)]);
            if (wRes.success)
                setWalletDetail(wRes.data);
            if (tRes.success)
                setTransactions(tRes.data || []);
        }
        catch (err) {
            console.error(err);
            toast.error('Gagal memuat data dompet/riwayat');
        }
    }
    async function submitWithdraw(e) {
        e?.preventDefault();
        if (!selectedSantri)
            return;
        const amt = Number(amount);
        if (!amt || amt <= 0) {
            toast.error('Masukkan nominal yang valid');
            return;
        }
        try {
            const id = selectedSantri?.id || selectedSantri?.santri_id || selectedSantri?.santri_id;
            const res = await debitWallet(id, amt, note || undefined, method);
            if (res.success) {
                toast.success('Penarikan berhasil');
                const updated = await getWallet(id);
                if (updated.success)
                    setWalletDetail(updated.data);
                setShowWithdraw(false);
                // reload transactions
                const txn = await getWalletTransactions(id);
                if (txn.success)
                    setTransactions(txn.data || []);
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal melakukan penarikan');
        }
    }
    async function submitEditTransaction(e) {
        e?.preventDefault();
        if (!editingTxn || !selectedSantri)
            return;
        const id = editingTxn.id;
        const amt = Number(editAmount);
        if (!amt || amt <= 0) {
            toast.error('Masukkan nominal yang valid');
            return;
        }
        try {
            const res = await updateTransaction(id, { amount: amt, description: editDesc || undefined, method: editMethod || undefined });
            if (res.success) {
                toast.success('Transaksi berhasil diubah');
                // refresh wallet + transactions
                const w = await getWallet(selectedSantri.id);
                if (w.success)
                    setWalletDetail(w.data);
                const t = await getWalletTransactions(selectedSantri.id);
                if (t.success)
                    setTransactions(t.data || []);
                setShowEditModal(false);
                setEditingTxn(null);
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal mengubah transaksi');
        }
    }
    async function confirmVoidTransaction() {
        if (!editingTxn || !selectedSantri)
            return;
        try {
            const res = await voidTransaction(editingTxn.id);
            if (res.success) {
                toast.success('Transaksi berhasil dihapus (void)');
                const w = await getWallet(selectedSantri.id);
                if (w.success)
                    setWalletDetail(w.data);
                const t = await getWalletTransactions(selectedSantri.id);
                if (t.success)
                    setTransactions(t.data || []);
                setShowVoidConfirm(false);
                setEditingTxn(null);
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal menghapus transaksi');
        }
    }
    // No global wallet table — we only show per-santri wallet after search selection
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Dompet Santri" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Kelola saldo dan top-up santri" })] }), _jsx("div", { className: "w-96", children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", placeholder: "Cari nama santri atau NIS...", value: searchQuery, onChange: (e) => { setSearchQuery(e.target.value); setShowSearchResults(e.target.value.length >= 2); }, onFocus: () => searchQuery.length >= 2 && setShowSearchResults(true), className: "w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsx(Search, { className: "absolute left-3 top-2.5 h-5 w-5 text-gray-400" }), searchQuery && (_jsx("button", { onClick: () => { setSearchQuery(''); setShowSearchResults(false); setSelectedSantri(null); }, className: "absolute right-3 top-2.5 text-gray-400", children: "\u2715" })), showSearchResults && searchQuery.length >= 2 && (_jsx("div", { className: "absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto", children: santriList.filter(s => (s.nama_santri || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.nis || '').includes(searchQuery)).map(s => (_jsxs("button", { onClick: () => handleSelectSantri(s), className: "w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-3", children: [_jsx("img", { src: s.foto ? (s.foto.startsWith('http') ? s.foto : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${s.foto}`) : `https://api.dicebear.com/7.x/identicon/svg?seed=${s.nama_santri}`, alt: s.nama_santri, className: "w-10 h-10 rounded-full object-cover" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-gray-900 truncate", children: s.nama_santri }), _jsxs("p", { className: "text-xs text-gray-500", children: ["NIS: ", s.nis, " \u2022 ", s.kelas || 'N/A'] })] })] }, s.id))) }))] }) })] }), !selectedSantri && (_jsxs("div", { className: "bg-white rounded-lg shadow p-12 text-center", children: [_jsx(Search, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-700 mb-2", children: "Cari Santri" }), _jsx("p", { className: "text-gray-500", children: "Gunakan kotak pencarian di sebelah kanan untuk mencari dan memilih santri" })] })), selectedSantri && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-2 flex items-start gap-6", children: [_jsx("img", { src: (selectedSantri.foto && (selectedSantri.foto.startsWith('http') ? selectedSantri.foto : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${selectedSantri.foto}`)) || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedSantri.nama_santri}`, alt: selectedSantri.nama_santri, className: "w-24 h-24 rounded-lg object-cover border-2 border-gray-200" }), _jsxs("div", { className: "flex-1 grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Nama Santri" }), _jsx("p", { className: "font-semibold text-gray-900", children: selectedSantri.nama_santri }), _jsxs("p", { className: "text-xs text-gray-500 mt-2", children: ["NIS: ", selectedSantri.nis] }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Kelas: ", selectedSantri.kelas || 'N/A'] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-500", children: "Saldo Saat Ini" }), _jsxs("div", { className: "text-2xl font-bold text-brand", children: ["Rp ", Number(walletDetail?.balance ?? 0).toLocaleString('id-ID')] }), _jsx("div", { className: "text-xs text-gray-400 mt-1", children: walletDetail ? `Terakhir diupdate: ${new Date(walletDetail.updated_at).toLocaleString('id-ID')}` : '' })] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => { setMethod('cash'); setAmount(''); setNote(''); setShowTopup(true); }, className: "px-4 py-2 bg-green-600 text-white rounded-lg", children: "Setor" }), _jsx("button", { onClick: () => { setMethod('cash'); setAmount(''); setNote(''); setShowWithdraw(true); }, className: "px-4 py-2 bg-red-600 text-white rounded-lg", children: "Tarik" })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-base font-semibold", children: "Riwayat Transaksi" }), _jsxs("div", { className: "text-sm text-gray-500", children: [transactions.length, " catatan"] })] }), _jsx(Table, { columns: [
                                    { key: 'reference', header: 'No Ref' },
                                    { key: 'created_at', header: 'Tanggal / Jam', render: (_v, r) => new Date(r.created_at).toLocaleString('id-ID') },
                                    { key: 'description', header: 'Keterangan', render: (v) => String(v ?? '-'), },
                                    { key: 'type', header: 'Tipe' },
                                    { key: 'method', header: 'Metode', render: (_v, r) => (r?.method ?? '-') },
                                    { key: 'amount', header: 'Nominal', render: (v) => `Rp ${Number(v).toLocaleString('id-ID')}` },
                                    { key: 'author', header: 'Admin', render: (_v, r) => r?.author?.name ?? (r.created_by && currentUser && r.created_by === currentUser.id ? currentUser.name : '-') },
                                    // show actions only for admin
                                    ...((currentUser?.role === 'admin') || (currentRole?.menus && currentRole?.menus.includes('dompet.manage')) ? [{ key: 'actions', header: 'Aksi', render: (_v, r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { disabled: r.voided, onClick: () => { setEditingTxn(r); setEditAmount(String(r.amount)); setEditDesc(r.description ?? ''); setEditMethod(r.method || 'cash'); setShowEditModal(true); }, className: "px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm", children: "Edit" }), _jsx("button", { disabled: r.voided, onClick: () => { setEditingTxn(r); setShowVoidConfirm(true); }, className: "px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm", children: "Hapus" })] })) }] : [])
                                ], data: transactions, getRowKey: (r) => r.id })] })] })), _jsx(Modal, { open: showTopup, title: `Setor: ${selectedSantri?.nama_santri ?? ''}`, onClose: () => setShowTopup(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowTopup(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: (e) => submitTopup(e), children: "Top-up" })] })), children: _jsxs("form", { onSubmit: submitTopup, className: "grid grid-cols-1 gap-3", children: [_jsx("label", { className: "block text-sm", children: "Nominal (Rp)" }), _jsx("input", { value: amount, onChange: (e) => setAmount(e.target.value.replace(/\D/g, '')), className: "rounded-md border px-3 py-2", placeholder: "Contoh: 50000" }), _jsx("label", { className: "block text-sm", children: "Metode" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("button", { type: "button", onClick: () => setMethod('cash'), className: `px-3 py-2 rounded-lg border ${method === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`, children: "Cash" }), _jsx("button", { type: "button", onClick: () => setMethod('transfer'), className: `px-3 py-2 rounded-lg border ${method === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`, children: "Transfer" })] }), _jsx("label", { className: "block text-sm", children: "Deskripsi (opsional)" }), _jsx("input", { value: note, onChange: (e) => setNote(e.target.value), className: "rounded-md border px-3 py-2", placeholder: "Catatan top-up" })] }) }), _jsx(Modal, { open: showWithdraw, title: `Tarik: ${selectedSantri?.nama_santri ?? ''}`, onClose: () => setShowWithdraw(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowWithdraw(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: (e) => submitWithdraw(e), children: "Konfirmasi Tarik" })] })), children: _jsxs("form", { onSubmit: submitWithdraw, className: "grid grid-cols-1 gap-3", children: [_jsx("label", { className: "block text-sm", children: "Nominal (Rp)" }), _jsx("input", { value: amount, onChange: (e) => setAmount(e.target.value.replace(/\D/g, '')), className: "rounded-md border px-3 py-2", placeholder: "Contoh: 50000" }), _jsx("label", { className: "block text-sm", children: "Metode" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("button", { type: "button", onClick: () => setMethod('cash'), className: `px-3 py-2 rounded-lg border ${method === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`, children: "Cash" }), _jsx("button", { type: "button", onClick: () => setMethod('transfer'), className: `px-3 py-2 rounded-lg border ${method === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`, children: "Transfer" })] }), _jsx("label", { className: "block text-sm", children: "Catatan (opsional)" }), _jsx("input", { value: note, onChange: (e) => setNote(e.target.value), className: "rounded-md border px-3 py-2", placeholder: "Alasan penarikan" })] }) }), _jsx(Modal, { open: showEditModal, title: `Edit Transaksi: ${editingTxn?.reference ?? ''}`, onClose: () => { setShowEditModal(false); setEditingTxn(null); }, footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => { setShowEditModal(false); setEditingTxn(null); }, children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: (e) => submitEditTransaction(e), children: "Simpan Perubahan" })] })), children: _jsxs("form", { onSubmit: submitEditTransaction, className: "grid grid-cols-1 gap-3", children: [_jsx("label", { className: "block text-sm", children: "Nominal (Rp)" }), _jsx("input", { value: editAmount, onChange: (e) => setEditAmount(e.target.value.replace(/\D/g, '')), className: "rounded-md border px-3 py-2" }), _jsx("label", { className: "block text-sm", children: "Metode" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("button", { type: "button", onClick: () => setEditMethod('cash'), className: `px-3 py-2 rounded-lg border ${editMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`, children: "Cash" }), _jsx("button", { type: "button", onClick: () => setEditMethod('transfer'), className: `px-3 py-2 rounded-lg border ${editMethod === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`, children: "Transfer" }), _jsx("button", { type: "button", onClick: () => setEditMethod('epos'), className: `px-3 py-2 rounded-lg border ${editMethod === 'epos' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`, children: "ePOS" })] }), _jsx("label", { className: "block text-sm", children: "Keterangan" }), _jsx("input", { value: editDesc, onChange: (e) => setEditDesc(e.target.value), className: "rounded-md border px-3 py-2" })] }) }), _jsx(Modal, { open: showVoidConfirm, title: `Hapus Transaksi: ${editingTxn?.reference ?? ''}`, onClose: () => setShowVoidConfirm(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowVoidConfirm(false), children: "Batal" }), _jsx("button", { className: "btn btn-danger", onClick: confirmVoidTransaction, children: "Konfirmasi Hapus" })] })), children: _jsx("div", { children: "Anda yakin akan menghapus (void) transaksi ini? Aksi ini akan membuat transaksi pembalikan dan menandai transaksi asli sebagai voided." }) })] }));
}
