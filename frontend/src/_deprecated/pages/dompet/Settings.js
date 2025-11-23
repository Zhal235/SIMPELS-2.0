import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { getWalletSettings, updateGlobalMinBalance, getAllSantriWithLimits, bulkUpdateSantriLimits } from '../../api/walletSettings';
import toast from 'react-hot-toast';
export default function Settings() {
    const [globalMinBalance, setGlobalMinBalance] = useState(0);
    const [tempGlobalMinBalance, setTempGlobalMinBalance] = useState(0);
    const [santriLimits, setSantriLimits] = useState([]);
    const [tempSantriLimits, setTempSantriLimits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditGlobal, setShowEditGlobal] = useState(false);
    useEffect(() => { load(); }, []);
    async function load() {
        setLoading(true);
        const results = await Promise.allSettled([getWalletSettings(), getAllSantriWithLimits()]);
        const settingsRes = results[0];
        const santriRes = results[1];
        if (settingsRes.status === 'fulfilled' && settingsRes.value?.success) {
            setGlobalMinBalance(settingsRes.value.data?.global_settings?.min_balance || 0);
            setTempGlobalMinBalance(settingsRes.value.data?.global_settings?.min_balance || 0);
        }
        if (santriRes.status === 'fulfilled' && santriRes.value?.success) {
            const data = (santriRes.value.data || []).map((s) => ({ ...s, tempLimit: s.daily_limit }));
            setSantriLimits(data);
            setTempSantriLimits(JSON.parse(JSON.stringify(data)));
        }
        if (results.some((r) => r.status === 'rejected')) {
            toast.error('Sebagian data gagal dimuat');
        }
        setLoading(false);
    }
    async function handleSaveGlobalMinBalance() {
        try {
            const res = await updateGlobalMinBalance(parseFloat(tempGlobalMinBalance.toString()));
            if (res.success) {
                toast.success('Saldo minimal global berhasil diperbarui');
                setGlobalMinBalance(tempGlobalMinBalance);
                setShowEditGlobal(false);
                load();
            }
            else {
                toast.error(res.message || 'Gagal memperbarui saldo minimal');
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal memperbarui saldo minimal');
        }
    }
    async function handleBulkSave() {
        try {
            const limits = tempSantriLimits.map((s) => ({
                santri_id: s.id,
                daily_limit: parseFloat(s.tempLimit || 0)
            }));
            const res = await bulkUpdateSantriLimits(limits);
            if (res.success) {
                toast.success('Limit transaksi berhasil diperbarui');
                setSantriLimits(JSON.parse(JSON.stringify(tempSantriLimits)));
                load();
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
    const limitsColumns = [
        { key: 'nis', header: 'NIS' },
        { key: 'nama_santri', header: 'Nama Santri' },
        { key: 'tempLimit', header: 'Limit Harian (Rp)', render: (v, r) => (_jsx("input", { type: "number", value: r.tempLimit || 0, onChange: (e) => {
                    const updated = tempSantriLimits.map((s) => s.id === r.id ? { ...s, tempLimit: e.target.value } : s);
                    setTempSantriLimits(updated);
                }, min: "0", step: "1000", className: "rounded-md border px-2 py-1 w-full" })) }
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Setting Dompet Digital" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Atur saldo minimal global dan limit transaksi per santri untuk kontrol RFID" })] }), loading ? (_jsx(Card, { children: _jsx("div", { className: "p-6 text-center text-gray-500", children: "Memuat..." }) })) : (_jsxs(_Fragment, { children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: "Saldo Minimal Global" }), _jsx("p", { className: "text-sm text-gray-500", children: "Mencegah santri belanja/jajan jika saldo kurang dari nilai ini" })] }), _jsx("button", { className: "btn btn-primary", onClick: () => { setTempGlobalMinBalance(globalMinBalance); setShowEditGlobal(true); }, children: "Ubah" })] }), _jsxs("div", { className: "text-3xl font-bold text-blue-600", children: ["Rp ", parseFloat(globalMinBalance.toString()).toLocaleString('id-ID')] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: "Limit Transaksi per Santri" }), _jsx("p", { className: "text-sm text-gray-500", children: "Edit limit harian untuk setiap santri aktif (jika 0, gunakan saldo minimal global)" })] }), _jsx("button", { className: "btn btn-primary", onClick: handleBulkSave, children: "Simpan Semua" })] }), _jsx(Card, { children: tempSantriLimits.length === 0 ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Belum ada santri aktif" })) : (_jsx(Table, { columns: limitsColumns, data: tempSantriLimits, getRowKey: (r) => r.id })) })] })] })), _jsx(Modal, { open: showEditGlobal, title: "Ubah Saldo Minimal Global", onClose: () => setShowEditGlobal(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowEditGlobal(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: handleSaveGlobalMinBalance, children: "Simpan" })] })), children: _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium", children: "Saldo Minimal (Rp)" }), _jsx("input", { type: "number", value: tempGlobalMinBalance, onChange: (e) => setTempGlobalMinBalance(parseFloat(e.target.value) || 0), min: "0", step: "1000", className: "rounded-md border px-3 py-2 w-full" }), _jsx("p", { className: "text-xs text-gray-500", children: "Masukkan jumlah minimal saldo dalam Rupiah" })] }) })] }));
}
