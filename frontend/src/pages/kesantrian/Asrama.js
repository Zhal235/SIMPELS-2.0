import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { Edit2, Trash2, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/api';
import { listAsrama, createAsrama, updateAsrama, deleteAsrama, tambahAnggotaAsrama, keluarkanAnggotaAsrama } from '@/api/asrama';
export default function KesantrianAsrama() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [membersOpen, setMembersOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [memberAsrama, setMemberAsrama] = useState(null);
    const [namaAsrama, setNamaAsrama] = useState('');
    const [waliAsrama, setWaliAsrama] = useState('');
    const [availableSantri, setAvailableSantri] = useState([]);
    const [selectedSantriId, setSelectedSantriId] = useState('');
    async function fetchAsrama() {
        try {
            setLoading(true);
            const res = await listAsrama();
            const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
            setItems(list);
        }
        catch (err) {
            console.error('Gagal memuat asrama', err);
            toast.error('Gagal memuat daftar asrama');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { fetchAsrama(); }, []);
    const columns = useMemo(() => ([
        { key: 'no', header: 'No', render: (_, __, idx) => String(idx + 1) },
        { key: 'nama_asrama', header: 'Nama Asrama' },
        { key: 'santri_count', header: 'Jumlah Anggota', render: (v) => String(v ?? 0) },
        { key: 'wali_asrama', header: 'Wali Asrama', render: (v) => v || '—' },
        {
            key: 'aksi',
            header: 'Aksi',
            render: (_, row) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", title: "Edit", className: "border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white", onClick: () => { setEditItem(row); setNamaAsrama(row.nama_asrama); setWaliAsrama(row.wali_asrama || ''); setModalOpen(true); }, children: _jsx(Edit2, { size: 16 }) }), _jsx(Button, { variant: "outline", size: "icon", title: "Tambah Anggota", className: "border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white", onClick: () => openMembers(row), children: _jsx(UserRoundPlus, { size: 16 }) }), _jsx(Button, { variant: "outline", size: "icon", title: "Hapus", className: "border-gray-200 text-gray-700 hover:text-red-500 hover:border-red-300 transition-all duration-150 rounded-lg shadow-sm bg-white", onClick: () => deleteRow(row), children: _jsx(Trash2, { size: 16 }) })] })),
        },
    ]), []);
    async function deleteRow(item) {
        const ok = confirm(`Hapus asrama "${item.nama_asrama}"?`);
        if (!ok)
            return;
        try {
            await deleteAsrama(item.id);
            await fetchAsrama();
            toast.success('Asrama dihapus');
        }
        catch (err) {
            console.error('Gagal hapus asrama', err);
            toast.error('Gagal menghapus asrama');
        }
    }
    async function saveRow() {
        try {
            const payload = { nama_asrama: namaAsrama.trim(), wali_asrama: waliAsrama.trim() || null };
            if (!payload.nama_asrama) {
                toast.error('Nama asrama wajib diisi');
                return;
            }
            if (editItem?.id) {
                await updateAsrama(editItem.id, payload);
                toast.success('Asrama diperbarui');
            }
            else {
                await createAsrama(payload);
                toast.success('Asrama ditambahkan');
            }
            setModalOpen(false);
            setEditItem(null);
            setNamaAsrama('');
            setWaliAsrama('');
            await fetchAsrama();
        }
        catch (err) {
            console.error('Simpan asrama gagal', err);
            toast.error('Gagal menyimpan asrama');
        }
    }
    async function openMembers(row) {
        try {
            setMemberAsrama(row);
            setMembersOpen(true);
            setSelectedSantriId('');
            // ambil santri tanpa asrama
            const res = await api.get('/v1/kesantrian/santri', { params: { page: 1, perPage: 1000, withoutAsrama: 1 } });
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            const mapped = list.map((s) => ({ id: s.id, nama_santri: s.nama_santri, asrama: s.asrama || s.asrama_nama || null }));
            setAvailableSantri(mapped);
        }
        catch (err) {
            console.error('Gagal memuat santri tanpa asrama', err);
            toast.error('Tidak bisa memuat santri tanpa asrama');
        }
    }
    async function addMember() {
        if (!memberAsrama?.id || !selectedSantriId) {
            toast.error('Pilih santri terlebih dahulu');
            return;
        }
        try {
            await tambahAnggotaAsrama(memberAsrama.id, selectedSantriId);
            toast.success('Anggota asrama ditambahkan');
            await fetchAsrama();
            // refresh available santri list
            await openMembers(memberAsrama);
        }
        catch (err) {
            const message = err?.response?.data?.message || 'Gagal menambah anggota';
            toast.error(message);
        }
    }
    async function removeMember(s) {
        if (!memberAsrama?.id || !s?.id)
            return;
        try {
            await keluarkanAnggotaAsrama(memberAsrama.id, s.id);
            toast.success('Anggota asrama dikeluarkan');
            await fetchAsrama();
            // refresh available santri list
            await openMembers(memberAsrama);
        }
        catch (err) {
            console.error('Gagal keluarkan anggota', err);
            toast.error('Gagal mengeluarkan anggota');
        }
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Asrama" }), _jsx("button", { className: "btn btn-primary", onClick: () => { setEditItem(null); setNamaAsrama(''); setWaliAsrama(''); setModalOpen(true); }, children: "Tambah Asrama" })] }), _jsx(Card, { children: loading && items.length === 0 ? (_jsx("div", { className: "p-4 text-sm text-gray-500", children: "Memuat data\u2026" })) : items.length === 0 ? (_jsx("div", { className: "p-4 text-sm text-gray-500", children: "Belum ada data asrama." })) : (_jsx(Table, { columns: columns, data: items, getRowKey: (row, idx) => String(row?.id ?? idx) })) }), _jsx(Modal, { open: modalOpen, title: editItem?.id ? 'Edit Asrama' : 'Tambah Asrama', onClose: () => setModalOpen(false), footer: null, children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Nama Asrama" }), _jsx("input", { className: "mt-1 w-full rounded-md border px-3 py-2", value: namaAsrama, onChange: (e) => setNamaAsrama(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Wali Asrama" }), _jsx("input", { className: "mt-1 w-full rounded-md border px-3 py-2", value: waliAsrama, onChange: (e) => setWaliAsrama(e.target.value) })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { className: "btn", onClick: () => setModalOpen(false), children: "Batal" }), _jsx("button", { className: "btn btn-primary", onClick: saveRow, children: "Simpan" })] })] }) }), _jsx(Modal, { open: membersOpen, title: `Anggota Asrama${memberAsrama ? `: ${memberAsrama.nama_asrama}` : ''}`, onClose: () => setMembersOpen(false), footer: _jsx("button", { className: "btn", onClick: () => setMembersOpen(false), children: "Tutup" }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-end gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Tambah Anggota" }), _jsxs("select", { className: "mt-1 w-full rounded-md border px-3 py-2", value: selectedSantriId, onChange: (e) => setSelectedSantriId(e.target.value), children: [_jsx("option", { value: "", children: "Pilih santri tanpa asrama" }), availableSantri.map((s) => (_jsx("option", { value: s.id, children: s.nama_santri }, s.id)))] })] }), _jsx("button", { className: "btn btn-primary", onClick: addMember, disabled: !selectedSantriId, children: "Tambah Anggota" })] }), _jsx(Card, { title: "Daftar Anggota", children: _jsx(MembersTable, { asrama: memberAsrama, onRemove: removeMember }) })] }) })] }));
}
function MembersTable({ asrama, onRemove }) {
    const [members, setMembers] = useState([]);
    useEffect(() => {
        async function fetchMembers() {
            try {
                const res = await api.get(`/v1/kesantrian/asrama/${asrama.id}`);
                const list = Array.isArray(res?.data?.data?.santri) ? res.data.data.santri : [];
                const mapped = list.map((s) => ({ id: s.id, nama_santri: s.nama_santri, asrama: s.asrama || s.asrama_nama || null }));
                setMembers(mapped);
            }
            catch (err) {
                console.error('Gagal memuat anggota asrama', err);
                toast.error('Gagal memuat anggota asrama');
            }
        }
        fetchMembers();
    }, [asrama?.id]);
    // Tiru UI anggota kelas: gunakan Table dengan tombol "Keluarkan"
    return (_jsx(Table, { columns: [
            { key: 'no', header: 'No', render: (_v, _row, idx) => idx + 1 },
            { key: 'nama_santri', header: 'Nama Santri' },
            { key: 'asrama', header: 'Asrama', render: () => asrama?.nama_asrama ?? '—' },
            { key: 'aksi', header: 'Aksi', render: (_v, row) => (_jsx("button", { className: "btn btn-danger", onClick: () => onRemove(row), children: "Keluarkan" })) },
        ], data: Array.isArray(members) ? members : [], getRowKey: (row, idx) => row?.id ?? idx }));
}
