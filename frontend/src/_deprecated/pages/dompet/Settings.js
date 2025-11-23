import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { getWalletSettings, updateGlobalMinBalance, getAllSantriWithLimits, setSantriDailyLimit, bulkUpdateSantriLimits } from '../../api/walletSettings';
import toast from 'react-hot-toast';
export default function Settings() {
    const [globalMinBalance, setGlobalMinBalance] = useState(0);
    const [tempGlobalMinBalance, setTempGlobalMinBalance] = useState(0);
    const [santriLimits, setSantriLimits] = useState([]);
    const [searchQ, setSearchQ] = useState('');
    const [editingSantri, setEditingSantri] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEditGlobal, setShowEditGlobal] = useState(false);
    useEffect(() => { load(); }, []);
    async function load() {
        setLoading(true);
        try {
            const [settingsRes, santriRes] = await Promise.all([getWalletSettings(), getAllSantriWithLimits()]);
            if (settingsRes?.success) {
                setGlobalMinBalance(settingsRes.data?.global_settings?.min_balance || 0);
                setTempGlobalMinBalance(settingsRes.data?.global_settings?.min_balance || 0);
            }
            if (santriRes?.success)
                setSantriLimits((santriRes.data || []).map((s) => ({ ...s })));
        }
        catch (err) {
            console.error(err);
            toast.error('Gagal memuat data settings');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleSaveGlobalMinBalance() {
        try {
            const res = await updateGlobalMinBalance(parseFloat(String(tempGlobalMinBalance || 0)));
            if (res.success) {
                toast.success('Saldo minimal global berhasil diperbarui');
                setGlobalMinBalance(tempGlobalMinBalance);
                setShowEditGlobal(false);
                load();
            }
            else
                toast.error(res.message || 'Gagal memperbarui saldo minimal');
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal memperbarui saldo minimal');
        }
    }
    async function handleSaveSingle() {
        if (!editingSantri)
            return;
        try {
            const res = await setSantriDailyLimit(editingSantri.id, Number(editingValue || 0));
            if (res.success) {
                toast.success('Limit transaksi santri berhasil diperbarui');
                setEditingSantri(null);
                setEditingValue('');
                await load();
            }
            else {
                toast.error(res.message || 'Gagal memperbarui limit');
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal memperbarui limit');
        }
    }
    async function handleSetDefaultAll() {
        if (!confirm('Tetapkan limit harian Rp 15.000 untuk semua santri?'))
            return;
        try {
            const limits = santriLimits.map((s) => ({ santri_id: s.id, daily_limit: 15000 }));
            const res = await bulkUpdateSantriLimits(limits);
            if (res.success) {
                toast.success('Berhasil menetapkan limit default untuk semua santri');
                await load();
            }
            else {
                toast.error(res.message || 'Gagal menetapkan limit default');
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal menetapkan limit default');
        }
    }
    const limitsColumns = [
        { key: 'nis', header: 'NIS' },
        { key: 'nama_santri', header: 'Nama Santri' },
        { key: 'daily_limit', header: 'Limit Harian (Rp)', render: (v) => (_jsx("div", { children: `Rp ${parseFloat(String(v || 0)).toLocaleString('id-ID')}` })) },
        { key: 'actions', header: 'Aksi', render: (_v, r) => (_jsx("div", { className: "flex gap-2", children: _jsx("button", { className: "px-3 py-1 rounded bg-yellow-500 text-white text-sm", onClick: () => { setEditingSantri(r); setEditingValue(r.daily_limit || 0); }, children: "Edit" }) })) }
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Setting Dompet Digital" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Atur saldo minimal global dan limit transaksi per santri untuk kontrol RFID" })] }), loading ? (_jsx(Card, { children: _jsx("div", { className: "p-6 text-center text-gray-500", children: "Memuat..." }) })) : (_jsxs(_Fragment, { children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: "Saldo Minimal Global" }), _jsx("p", { className: "text-sm text-gray-500", children: "Mencegah santri belanja/jajan jika saldo kurang dari nilai ini" })] }), _jsx("button", { className: "btn btn-primary", onClick: () => { setTempGlobalMinBalance(globalMinBalance); setShowEditGlobal(true); }, children: "Ubah" })] }), _jsxs("div", { className: "text-3xl font-bold text-blue-600", children: ["Rp ", parseFloat(globalMinBalance.toString()).toLocaleString('id-ID')] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: "Limit Transaksi per Santri" }), _jsx("p", { className: "text-sm text-gray-500", children: "Limit harian read-only \u2014 gunakan kolom Aksi untuk mengubah nilai per santri" })] }), _jsx("div", { className: "ml-4", children: _jsx("input", { placeholder: "Cari santri (nama/NIS)", value: searchQ, onChange: (e) => setSearchQ(e.target.value), className: "rounded border px-3 py-2" }) })] }), _jsx(Card, { children: santriLimits.length === 0 ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Belum ada santri aktif" })) : (_jsx(Table, { columns: limitsColumns, data: santriLimits.filter(s => {
                                        if (!searchQ || searchQ.trim().length < 2)
                                            return true;
                                        const q = searchQ.toLowerCase();
                                        return String(s.nama_santri).toLowerCase().includes(q) || String(s.nis).toLowerCase().includes(q);
                                    }), getRowKey: (r) => r.id, renderExpandedRow: (row) => (editingSantri?.id === row.id ? (_jsx("div", { className: "p-3", children: _jsxs("div", { className: "grid md:grid-cols-3 gap-4 items-end", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium", children: "NIS" }), _jsx("input", { disabled: true, value: row.nis, className: "rounded border px-3 py-2 w-full bg-gray-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium", children: "Nama Santri" }), _jsx("input", { disabled: true, value: row.nama_santri, className: "rounded border px-3 py-2 w-full bg-gray-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium", children: "Limit Harian (Rp)" }), _jsx("input", { type: "number", value: editingValue, onChange: (e) => setEditingValue(e.target.value ? parseFloat(e.target.value) : ''), className: "rounded border px-3 py-2 w-full" })] }), _jsxs("div", { className: "md:col-span-3 flex justify-end gap-2", children: [_jsx("button", { className: "btn", onClick: () => { setEditingSantri(null); setEditingValue(''); }, children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: handleSaveSingle, children: "Simpan" })] })] }) })) : null) })) })] })] })), _jsx(Modal, { open: showEditGlobal, title: "Ubah Saldo Minimal Global", onClose: () => setShowEditGlobal(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowEditGlobal(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: handleSaveGlobalMinBalance, children: "Simpan" })] })), children: _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium", children: "Saldo Minimal (Rp)" }), _jsx("input", { type: "number", value: tempGlobalMinBalance, onChange: (e) => setTempGlobalMinBalance(parseFloat(e.target.value) || 0), min: "0", step: "1000", className: "rounded-md border px-3 py-2 w-full" }), _jsx("p", { className: "text-xs text-gray-500", children: "Masukkan jumlah minimal saldo dalam Rupiah" })] }) })] }));
}
