import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { Pencil, Eye, Shuffle, Trash } from 'lucide-react';
import SantriForm from './components/SantriForm';
import { listSantri, deleteSantri } from '@/api/santri';
import { toast } from 'sonner';
export default function KesantrianSantri() {
    // Mulai dengan data kosong; sebelumnya ada data dummy untuk demo yang membuat tabel menampilkan 3 baris saat reload
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState('create');
    const [current, setCurrent] = useState(null);
    async function fetchData() {
        try {
            setLoading(true);
            const res = await listSantri(currentPage, pageSize);
            const raw = res;
            const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.data?.data) ? raw.data.data : []));
            setItems(list);
        }
        catch (e) {
            console.error('Failed to fetch santri list', e);
            if (String(e?.message || '').includes('CORS')) {
                toast.error('CORS terblokir. Pastikan backend mengizinkan origin localhost:*');
            }
            else if (e?.response?.status === 419) {
                toast.error('419 (CSRF) terdeteksi. Pastikan API stateless / tidak pakai CSRF.');
            }
            else if (String(e?.message || '').toLowerCase().includes('network')) {
                toast.error('Gagal konek API. Cek CORS/URL backend.');
            }
            else {
                toast.error('Gagal memuat data santri.');
            }
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchData();
    }, []);
    useEffect(() => {
        // when modal closes after create/edit, refresh table
        if (!modalOpen && (mode === 'create' || mode === 'edit')) {
            fetchData();
        }
    }, [modalOpen]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const columns = useMemo(() => ([
        {
            key: 'no',
            header: 'No',
            render: (_, __, idx) => {
                const hasPagination = typeof currentPage === 'number' && typeof pageSize === 'number';
                const base = hasPagination ? (currentPage - 1) * pageSize : 0;
                const display = typeof idx === 'number' ? base + idx + 1 : base + 1;
                return String(display);
            },
        },
        {
            key: 'nama_santri',
            header: 'Nama Santri',
            render: (_, row) => {
                const src = getFotoSrc(row?.foto);
                const initial = (row?.nama_santri ?? '').trim().charAt(0) || '?';
                return (_jsxs("div", { className: "flex items-center gap-2", children: [src ? (_jsx("img", { src: src, alt: row?.nama_santri ?? 'Foto', className: "h-8 w-8 rounded-full object-cover border" })) : (_jsx("div", { className: "h-8 w-8 rounded-full bg-gray-200 border flex items-center justify-center text-xs text-gray-600", children: initial })), _jsx("span", { children: row?.nama_santri })] }));
            },
        },
        { key: 'nis', header: 'NIS' },
        { key: 'nisn', header: 'NISN' },
        { key: 'jenis_kelamin', header: 'Jenis Kelamin', render: (v) => (v === 'L' ? 'Laki-laki' : 'Perempuan') },
        {
            key: 'aksi',
            header: 'Aksi',
            render: (_, row) => (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn", onClick: () => { setMode('edit'); setCurrent(row); setModalOpen(true); }, title: "Edit", children: _jsx(Pencil, { className: "w-4 h-4" }) }), _jsx("button", { className: "btn", onClick: () => { setMode('preview'); setCurrent(row); setModalOpen(true); }, title: "Preview", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { className: "btn", onClick: () => {
                            toast.info('Segera hadir: Fitur Mutasi akan ditambahkan.');
                        }, title: "Mutasi", children: _jsx(Shuffle, { className: "w-4 h-4" }) }), _jsx("button", { className: "btn", onClick: async () => {
                            const ok = confirm('Yakin ingin hapus data santri ini?');
                            if (!ok)
                                return;
                            try {
                                if (row.id) {
                                    await deleteSantri(row.id);
                                    await fetchData();
                                    toast.success('✅ Data santri dihapus.');
                                }
                                else {
                                    // local-only fallback
                                    setItems((prev) => prev.filter((it) => it.id !== row.id));
                                }
                            }
                            catch (err) {
                                console.error('Gagal menghapus santri', err);
                                const isNetwork = String(err?.message || '').toLowerCase().includes('network');
                                if (isNetwork) {
                                    toast.error('🌐 Tidak dapat terhubung ke server backend.');
                                }
                                else {
                                    toast.error('⚠️ Terjadi kesalahan server saat menghapus.');
                                }
                            }
                        }, title: "Hapus", children: _jsx(Trash, { className: "w-4 h-4" }) })] })),
        },
    ]), [currentPage, pageSize]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Data Santri" }), _jsx("button", { className: "btn btn-primary", onClick: () => { setMode('create'); setCurrent(null); setModalOpen(true); }, children: "Tambah Santri" })] }), _jsx(Card, { children: loading && items.length === 0 ? (_jsx("div", { className: "p-4 text-sm text-gray-500", children: "Memuat data\u2026" })) : (_jsx(Table, { columns: columns, data: items })) }), _jsx(Modal, { open: modalOpen, title: mode === 'create' ? 'Tambah Santri' : mode === 'edit' ? 'Edit Santri' : 'Preview Santri', onClose: () => setModalOpen(false), footer: null, children: _jsx(SantriForm, { mode: mode, initial: current ?? undefined, onCancel: () => setModalOpen(false), onSubmit: () => { fetchData(); } }) })] }));
}
// Helpers to resolve foto URL to backend origin
function getFotoSrc(foto) {
    try {
        if (!foto)
            return null;
        if (foto instanceof Blob)
            return URL.createObjectURL(foto);
        const s = String(foto || '');
        if (!s)
            return null;
        if (/^data:/i.test(s))
            return s;
        if (/^https?:\/\//i.test(s))
            return s;
        const origin = getBackendOrigin();
        if (s.startsWith('/'))
            return origin + s;
        if (s.startsWith('storage') || s.startsWith('uploads'))
            return `${origin}/${s}`;
        return s;
    }
    catch {
        return null;
    }
}
function getBackendOrigin() {
    const fallback = 'http://127.0.0.1:8000';
    try {
        const base = import.meta?.env?.VITE_API_BASE || '';
        if (base) {
            const u = new URL(base);
            return u.origin;
        }
    }
    catch { }
    try {
        const loc = window.location.origin;
        if (loc.includes(':5173'))
            return loc.replace(':5173', ':8000');
        if (loc.includes(':5174'))
            return loc.replace(':5174', ':8000');
        if (loc.includes(':5175'))
            return loc.replace(':5175', ':8000');
        if (loc.includes(':5176'))
            return loc.replace(':5176', ':8000');
    }
    catch { }
    return fallback;
}
