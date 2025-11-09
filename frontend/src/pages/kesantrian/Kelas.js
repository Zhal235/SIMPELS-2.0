import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import api from '../../api';
import { handleError } from '../../utils/handleError';
import { toast } from 'react-hot-toast';
const TINGKAT_OPTIONS = [7, 8, 9, 10, 11, 12];
export default function KesantrianKelas() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nama_kelas: '', tingkat: '', wali_kelas_id: null });
    const [memberOpen, setMemberOpen] = useState(false);
    const [memberKelas, setMemberKelas] = useState(null);
    const [santriList, setSantriList] = useState([]);
    const [santriLoading, setSantriLoading] = useState(false);
    const [selectedSantriId, setSelectedSantriId] = useState('');
    const santriInKelas = useMemo(() => santriList.filter(s => s.kelas_id === memberKelas?.id), [santriList, memberKelas]);
    const santriTanpaKelas = useMemo(() => santriList.filter(s => !s.kelas_id), [santriList]);
    useEffect(() => {
        fetchData();
    }, []);
    async function fetchData() {
        setLoading(true);
        try {
            const res = await api.get('/v1/kesantrian/kelas');
            const raw = res?.data;
            // Aman: jika res.data punya properti data ambil itu; jika tidak, cek apakah array langsung; selain itu fallback []
            const hasil = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.data)
                    ? raw.data
                    : [];
            setItems(hasil);
        }
        catch (err) {
            handleError(err);
            // Pastikan state tetap array ketika gagal fetch
            setItems([]);
        }
        finally {
            setLoading(false);
        }
    }
    function openCreate() {
        setEditItem(null);
        setForm({ nama_kelas: '', tingkat: '', wali_kelas_id: null });
        setModalOpen(true);
    }
    function openEdit(item) {
        setEditItem(item);
        setForm({ nama_kelas: item.nama_kelas ?? '', tingkat: item.tingkat ?? '', wali_kelas_id: item.wali_kelas_id ?? null });
        setModalOpen(true);
    }
    async function saveKelas() {
        // Validasi
        if (!form.nama_kelas || form.nama_kelas.trim() === '') {
            toast.error('Nama kelas wajib diisi');
            return;
        }
        if (!form.tingkat || typeof form.tingkat !== 'number') {
            toast.error('Tingkat wajib diisi');
            return;
        }
        try {
            const payload = { nama_kelas: form.nama_kelas.trim(), tingkat: form.tingkat, wali_kelas_id: form.wali_kelas_id || null };
            if (editItem) {
                await api.put(`/v1/kesantrian/kelas/${editItem.id}`, payload);
                toast.success('Kelas berhasil diperbarui');
            }
            else {
                await api.post('/v1/kesantrian/kelas', payload);
                toast.success('Kelas berhasil dibuat');
            }
            setModalOpen(false);
            await fetchData();
        }
        catch (err) {
            handleError(err);
        }
    }
    async function deleteKelas(item) {
        if (!window.confirm('Apakah Anda yakin?'))
            return;
        try {
            await api.delete(`/v1/kesantrian/kelas/${item.id}`);
            toast.success('Kelas berhasil dihapus');
            await fetchData();
        }
        catch (err) {
            handleError(err);
        }
    }
    async function openMembers(item) {
        setMemberKelas(item);
        setMemberOpen(true);
        setSantriLoading(true);
        try {
            // Ambil santri (gunakan perPage besar agar cukup)
            const res = await api.get('/v1/kesantrian/santri', { params: { page: 1, perPage: 1000 } });
            const raw = res?.data;
            const dataArr = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.data)
                    ? raw.data
                    : [];
            setSantriList(dataArr);
        }
        catch (err) {
            handleError(err);
        }
        finally {
            setSantriLoading(false);
        }
    }
    async function addMember() {
        if (!memberKelas || !selectedSantriId)
            return;
        // Validasi di frontend: cegah jika santri sudah punya kelas (double safety)
        const selectedSantri = santriList.find(s => s.id === selectedSantriId);
        if (selectedSantri && selectedSantri.kelas_id && selectedSantri.kelas_id !== memberKelas.id) {
            toast.error('Santri sudah terdaftar di kelas lain.');
            return;
        }
        try {
            await api.post(`/v1/kesantrian/kelas/${memberKelas.id}/anggota`, { santri_id: selectedSantriId });
            toast.success('Anggota kelas berhasil diperbarui');
            // Refresh santri list & kelas table
            await openMembers(memberKelas);
            await fetchData();
        }
        catch (err) {
            handleError(err);
        }
    }
    async function removeMember(s) {
        if (!memberKelas)
            return;
        if (!window.confirm('Apakah Anda yakin?'))
            return;
        try {
            await api.delete(`/v1/kesantrian/kelas/${memberKelas.id}/anggota/${s.id}`);
            toast.success('Anggota kelas berhasil diperbarui');
            await openMembers(memberKelas);
            await fetchData();
        }
        catch (err) {
            handleError(err);
        }
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Kelas" }), _jsx("button", { className: "btn btn-primary", onClick: openCreate, children: "+ Tambah Kelas" })] }), _jsx(Card, { children: loading ? (_jsx("div", { className: "p-4 text-gray-600", children: "Memuat data..." })) : items.length === 0 ? (_jsx("div", { className: "p-4 text-gray-600", children: "Belum ada data kelas." })) : (_jsx(Table, { columns: [
                        { key: 'no', header: 'No', render: (_v, _row, idx) => idx + 1 },
                        { key: 'nama_kelas', header: 'Nama Kelas' },
                        { key: 'tingkat', header: 'Tingkat' },
                        { key: 'santri_count', header: 'Jumlah Santri', render: (v) => v ?? 0 },
                        { key: 'wali_kelas_id', header: 'Wali Kelas', render: (_v, row) => {
                                const nm = row.wali_kelas?.nama_pegawai ?? row.wali_kelas?.nama ?? row.wali_kelas?.name;
                                return nm ? nm : (row.wali_kelas_id ? `#${row.wali_kelas_id}` : '—');
                            } },
                        {
                            key: 'actions',
                            header: 'Aksi',
                            render: (_v, row) => (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn", onClick: () => openEdit(row), children: "\u270F\uFE0F Edit" }), _jsx("button", { className: "btn", onClick: () => openMembers(row), children: "\uD83D\uDC65 Anggota" }), _jsx("button", { className: "btn btn-danger", onClick: () => deleteKelas(row), children: "\uD83D\uDDD1\uFE0F Hapus" })] })),
                        },
                    ], data: Array.isArray(items) ? items : [], getRowKey: (row, idx) => row?.id ?? idx })) }), _jsx(Modal, { open: modalOpen, title: editItem ? 'Edit Kelas' : 'Tambah Kelas', onClose: () => setModalOpen(false), footer: (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: () => setModalOpen(false), children: "Tutup" }), _jsx("button", { className: "btn btn-primary", onClick: saveKelas, children: "Simpan" })] })), children: _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Nama Kelas" }), _jsx("input", { type: "text", className: "mt-1 w-full rounded-md border px-3 py-2", value: form.nama_kelas, onChange: (e) => setForm((f) => ({ ...f, nama_kelas: e.target.value })), placeholder: "Misal: VII A" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Tingkat" }), _jsxs("select", { className: "mt-1 w-full rounded-md border px-3 py-2", value: form.tingkat === '' ? '' : String(form.tingkat), onChange: (e) => setForm((f) => ({ ...f, tingkat: e.target.value ? Number(e.target.value) : '' })), children: [_jsx("option", { value: "", children: "Pilih tingkat" }), TINGKAT_OPTIONS.map((opt) => (_jsx("option", { value: opt, children: opt }, opt)))] })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Wali Kelas (opsional)" }), _jsx("input", { type: "number", className: "mt-1 w-full rounded-md border px-3 py-2", value: form.wali_kelas_id === null ? '' : String(form.wali_kelas_id), onChange: (e) => {
                                        const v = e.target.value;
                                        setForm((f) => ({ ...f, wali_kelas_id: v === '' ? null : Number(v) }));
                                    }, placeholder: "ID pegawai wali kelas" })] })] }) }), _jsx(Modal, { open: memberOpen, title: `Anggota Kelas ${memberKelas?.nama_kelas ?? ''}`, onClose: () => setMemberOpen(false), footer: (_jsx("button", { className: "btn", onClick: () => setMemberOpen(false), children: "Tutup" })), children: santriLoading ? (_jsx("div", { className: "p-4 text-gray-600", children: "Memuat data santri..." })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-end gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Tambah Anggota" }), _jsxs("select", { className: "mt-1 w-full rounded-md border px-3 py-2", value: selectedSantriId, onChange: (e) => setSelectedSantriId(e.target.value), children: [_jsx("option", { value: "", children: "Pilih santri tanpa kelas" }), santriTanpaKelas.map((s) => (_jsx("option", { value: s.id, children: s.nama_santri }, s.id)))] })] }), _jsx("button", { className: "btn btn-primary", onClick: addMember, disabled: !selectedSantriId, children: "Tambah Anggota" })] }), _jsx(Card, { title: "Daftar Anggota", children: _jsx(Table, { columns: [
                                    { key: 'no', header: 'No', render: (_v, _row, idx) => idx + 1 },
                                    { key: 'nama_santri', header: 'Nama Santri' },
                                    { key: 'kelas_id', header: 'Kelas', render: () => memberKelas?.nama_kelas ?? '—' },
                                    {
                                        key: 'actions', header: 'Aksi', render: (_v, row) => (_jsx("button", { className: "btn btn-danger", onClick: () => removeMember(row), children: "Keluarkan" }))
                                    }
                                ], data: Array.isArray(santriInKelas) ? santriInKelas : [], getRowKey: (row, idx) => row?.id ?? idx }) })] })) })] }));
}
