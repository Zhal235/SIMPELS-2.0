import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { bindRFID } from '../../api/wallet';
import { listSantri } from '../../api/santri';
import toast from 'react-hot-toast';
export default function RFID() {
    const [santriList, setSantriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRFIDModal, setShowRFIDModal] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [rfidUID, setRfidUID] = useState('');
    const [rfidLabel, setRfidLabel] = useState('');
    useEffect(() => { load(); }, []);
    async function load() {
        try {
            setLoading(true);
            // Load santri dengan status aktif
            const res = await listSantri(1, 9999, '');
            if (res.status === 'success') {
                // Filter hanya santri aktif
                const aktivSantri = (res.data || []).filter((s) => s.status === 'aktif');
                setSantriList(aktivSantri);
            }
        }
        catch (err) {
            console.error(err);
            toast.error('Gagal memuat data santri');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleSetRFID() {
        if (!rfidUID.trim()) {
            toast.error('UID RFID harus diisi');
            return;
        }
        try {
            const res = await bindRFID(rfidUID, selectedSantri.id);
            if (res.success) {
                toast.success('RFID berhasil ditetapkan');
                setShowRFIDModal(false);
                setRfidUID('');
                setRfidLabel('');
                setSelectedSantri(null);
                load();
            }
            else {
                toast.error(res.message || 'Gagal menetapkan RFID');
            }
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal menetapkan RFID');
        }
    }
    const columns = [
        { key: 'no', header: 'No', render: (_v, _r, idx) => idx + 1 },
        { key: 'nis', header: 'NIS' },
        { key: 'nama_santri', header: 'Nama Santri' },
        { key: 'kelas_nama', header: 'Kelas' },
        { key: 'rfid', header: 'RFID', render: (_v, r) => r.rfid_tag?.uid || '-' },
        { key: 'actions', header: 'Aksi', render: (_v, r) => (_jsx("button", { onClick: () => {
                    setSelectedSantri(r);
                    setRfidUID(r.rfid_tag?.uid || '');
                    setShowRFIDModal(true);
                }, className: "px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm", children: "Set RFID" })) }
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "RFID Santri" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Kelola kartu/UID RFID untuk setiap santri aktif" })] }) }), _jsx(Card, { children: loading ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Memuat..." })) : santriList.length === 0 ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Tidak ada santri aktif" })) : (_jsx(Table, { columns: columns, data: santriList, getRowKey: (r) => r.id })) }), _jsx(Modal, { open: showRFIDModal, title: `Set RFID - ${selectedSantri?.nama_santri || ''}`, onClose: () => {
                    setShowRFIDModal(false);
                    setSelectedSantri(null);
                    setRfidUID('');
                    setRfidLabel('');
                }, footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setShowRFIDModal(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: handleSetRFID, children: "Simpan" })] })), children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium", children: "NIS" }), _jsx("input", { disabled: true, value: selectedSantri?.nis || '', className: "rounded-md border px-3 py-2 w-full bg-gray-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium", children: "Nama Santri" }), _jsx("input", { disabled: true, value: selectedSantri?.nama_santri || '', className: "rounded-md border px-3 py-2 w-full bg-gray-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium", children: "UID RFID" }), _jsx("input", { value: rfidUID, onChange: (e) => setRfidUID(e.target.value), placeholder: "Masukkan UID kartu RFID", className: "rounded-md border px-3 py-2 w-full" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium", children: "Label (opsional)" }), _jsx("input", { value: rfidLabel, onChange: (e) => setRfidLabel(e.target.value), placeholder: "Contoh: Kartu Utama", className: "rounded-md border px-3 py-2 w-full" })] })] }) })] }));
}
