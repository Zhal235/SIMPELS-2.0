import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { Edit2, Eye, Shuffle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import SantriForm from './components/SantriForm';
import { listSantri, deleteSantri, updateSantri, getSantri } from '@/api/santri';
import { getTagihanBySantri } from '@/api/pembayaran';
import { deleteTagihanSantri } from '@/api/tagihanSantri';
import { toast } from 'sonner';
export default function KesantrianSantri() {
    // Mulai dengan data kosong; sebelumnya ada data dummy untuk demo yang membuat tabel menampilkan 3 baris saat reload
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState('create');
    const [current, setCurrent] = useState(null);
    const [mutasiModalOpen, setMutasiModalOpen] = useState(false);
    const [mutasiTarget, setMutasiTarget] = useState(null);
    const [tanggalKeluar, setTanggalKeluar] = useState('');
    const [alasan, setAlasan] = useState('');
    const [tujuanMutasi, setTujuanMutasi] = useState('');
    const [tagihanPreview, setTagihanPreview] = useState([]);
    const [previewDelete, setPreviewDelete] = useState([]);
    const [previewKeep, setPreviewKeep] = useState([]);
    const totalDelete = useMemo(() => previewDelete.reduce((s, t) => s + Number(t?.nominal ?? t?.sisa ?? 0), 0), [previewDelete]);
    const totalKeep = useMemo(() => previewKeep.reduce((s, t) => s + Number(t?.nominal ?? t?.sisa ?? 0), 0), [previewKeep]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const navigate = useNavigate();
    async function fetchData() {
        try {
            setLoading(true);
            const res = await listSantri(currentPage, pageSize);
            const raw = res;
            const applyMutasiKeluarFilter = (arr) => {
                return (arr || []).filter((it) => String(it?.status || 'aktif').toLowerCase() !== 'keluar');
            };
            // Handle different response structures
            if (raw?.data?.data) {
                // Laravel pagination format
                const arr = applyMutasiKeluarFilter(raw.data.data);
                setItems(arr);
                setTotalItems(arr.length);
            }
            else if (raw?.data) {
                const dataArray = Array.isArray(raw.data) ? raw.data : [];
                const arr = applyMutasiKeluarFilter(dataArray);
                setItems(arr);
                // Jika tidak ada total, asumsikan ada lebih banyak data jika hasil = pageSize
                setTotalItems(arr.length);
                console.log('Items:', dataArray.length, 'Total estimate:', totalItems);
            }
            else {
                const dataArray = Array.isArray(raw) ? raw : [];
                const arr = applyMutasiKeluarFilter(dataArray);
                setItems(arr);
                setTotalItems(arr.length);
            }
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
    }, [currentPage, pageSize]);
    useEffect(() => {
        // when modal closes after create/edit, refresh table
        if (!modalOpen && (mode === 'create' || mode === 'edit')) {
            fetchData();
        }
    }, [modalOpen]);
    useEffect(() => {
        const fetchTagihan = async () => {
            if (!mutasiTarget)
                return;
            try {
                const res = await getTagihanBySantri(mutasiTarget.id);
                const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
                setTagihanPreview(list);
            }
            catch (e) {
                console.error('Gagal mengambil tagihan santri', e);
                setTagihanPreview([]);
            }
        };
        if (mutasiModalOpen)
            fetchTagihan();
    }, [mutasiModalOpen, mutasiTarget]);
    function bulanToNum(b) {
        const map = {
            Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
            Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12,
        };
        return map[b] || 1;
    }
    useEffect(() => {
        if (!tanggalKeluar || tagihanPreview.length === 0) {
            setPreviewDelete([]);
            setPreviewKeep(tagihanPreview);
            return;
        }
        const dt = new Date(tanggalKeluar);
        const outY = dt.getFullYear();
        const outM = dt.getMonth() + 1;
        const del = [];
        const keep = [];
        tagihanPreview.forEach((t) => {
            const tY = Number(t?.tahun || 0);
            const tM = bulanToNum(String(t?.bulan || ''));
            const shouldDelete = tY > outY || (tY === outY && tM > outM);
            if (shouldDelete)
                del.push(t);
            else
                keep.push(t);
        });
        setPreviewDelete(del);
        setPreviewKeep(keep);
    }, [tanggalKeluar, tagihanPreview]);
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
            render: (_, row) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", title: "Edit", className: "border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white", onClick: () => { setMode('edit'); setCurrent(row); setModalOpen(true); }, children: _jsx(Edit2, { size: 16 }) }), _jsx(Button, { variant: "outline", size: "icon", title: "Lihat Detail", className: "border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white", onClick: () => { setMode('preview'); setCurrent(row); setModalOpen(true); }, children: _jsx(Eye, { size: 16 }) }), _jsx(Button, { variant: "outline", size: "icon", title: "Mutasi", className: "border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white", onClick: () => {
                            if (row.id) {
                                setMutasiTarget(row);
                                setTanggalKeluar('');
                                setAlasan('');
                                setMutasiModalOpen(true);
                            }
                            else {
                                toast.info('ID santri tidak ditemukan');
                            }
                        }, children: _jsx(Shuffle, { size: 16 }) }), _jsx(Button, { variant: "outline", size: "icon", title: "Hapus", className: "border-gray-200 text-gray-700 hover:text-red-500 hover:border-red-300 transition-all duration-150 rounded-lg shadow-sm bg-white", onClick: async () => {
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
                        }, children: _jsx(Trash2, { size: 16 }) })] })),
        },
    ]), [currentPage, pageSize]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Data Santri" }), _jsx("button", { className: "btn btn-primary", onClick: () => { setMode('create'); setCurrent(null); setModalOpen(true); }, children: "Tambah Santri" })] }), _jsx(Card, { children: loading && items.length === 0 ? (_jsx("div", { className: "p-4 text-sm text-gray-500", children: "Memuat data\u2026" })) : !items || items.length === 0 ? (_jsx("div", { className: "p-4 text-sm text-gray-500", children: "Belum ada data santri." })) : (_jsxs(_Fragment, { children: [_jsx(Table, { columns: columns, data: items, getRowKey: (row, idx) => String(row?.id ?? idx) }), _jsxs("div", { className: "px-6 py-4 border-t flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-sm text-gray-700", children: ["Menampilkan ", ((currentPage - 1) * pageSize) + 1, " - ", Math.min(currentPage * pageSize, totalItems), " dari ", totalItems, " data"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm text-gray-600", children: "Per halaman:" }), _jsxs("select", { value: pageSize, onChange: (e) => {
                                                        setPageSize(Number(e.target.value));
                                                        setCurrentPage(1); // Reset ke halaman 1 saat ganti page size
                                                    }, className: "px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: 10, children: "10" }), _jsx("option", { value: 25, children: "25" }), _jsx("option", { value: 50, children: "50" }), _jsx("option", { value: 100, children: "100" })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, className: "px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed", children: "\u2190 Prev" }), _jsx("div", { className: "flex items-center gap-1", children: Array.from({ length: Math.ceil(totalItems / pageSize) }, (_, i) => i + 1)
                                                .filter(page => {
                                                // Show first, last, current, and adjacent pages
                                                const totalPages = Math.ceil(totalItems / pageSize);
                                                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                                            })
                                                .map((page, idx, arr) => (_jsxs("div", { children: [idx > 0 && arr[idx - 1] !== page - 1 && (_jsx("span", { className: "px-2 text-gray-400", children: "..." })), _jsx("button", { onClick: () => setCurrentPage(page), className: `px-3 py-1 border rounded ${currentPage === page
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'border-gray-300 hover:bg-gray-50'}`, children: page })] }, page))) }), _jsx("button", { onClick: () => setCurrentPage(Math.min(Math.ceil(totalItems / pageSize), currentPage + 1)), disabled: currentPage >= Math.ceil(totalItems / pageSize), className: "px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed", children: "Next \u2192" })] })] })] })) }), _jsx(Modal, { open: modalOpen, title: mode === 'create' ? 'Tambah Santri' : mode === 'edit' ? 'Edit Santri' : 'Preview Santri', onClose: () => setModalOpen(false), footer: null, children: _jsx(SantriForm, { mode: mode, initial: current ?? undefined, onCancel: () => setModalOpen(false), onSubmit: () => { fetchData(); } }) }), mutasiModalOpen && mutasiTarget && (_jsx("div", { className: "fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col", children: [_jsxs("div", { className: "p-4 border-b", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Konfirmasi Mutasi Keluar" }), _jsx("p", { className: "text-sm text-gray-600", children: mutasiTarget.nama_santri })] }), _jsxs("div", { className: "p-4 space-y-3 overflow-y-auto", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-sm text-gray-700", children: "Tanggal Keluar" }), _jsx("input", { type: "date", className: "w-full border rounded px-3 py-2", value: tanggalKeluar, onChange: (e) => setTanggalKeluar(e.target.value) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-sm text-gray-700", children: "Alasan" }), _jsx("textarea", { className: "w-full border rounded px-3 py-2", rows: 3, value: alasan, onChange: (e) => setAlasan(e.target.value) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-sm text-gray-700", children: "Tujuan Mutasi" }), _jsx("input", { type: "text", className: "w-full border rounded px-3 py-2", placeholder: "Nama sekolah/pesantren tujuan", value: tujuanMutasi, onChange: (e) => setTujuanMutasi(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900", children: "Preview Tagihan Setelah Mutasi" }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "font-medium", children: ["Total Dihapus: ", totalDelete.toLocaleString('id-ID')] }), _jsxs("div", { className: "font-medium", children: ["Total Tunggakan: ", totalKeep.toLocaleString('id-ID')] })] }), !tanggalKeluar ? (_jsx("p", { className: "text-xs text-gray-500", children: "Pilih tanggal keluar untuk melihat preview perubahan tagihan." })) : (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { className: "border rounded p-2", children: [_jsx("div", { className: "font-medium text-sm text-gray-800 mb-1", children: "Dihapus (setelah bulan keluar)" }), previewDelete.length === 0 ? (_jsx("div", { className: "text-xs text-gray-500", children: "Tidak ada tagihan yang akan dihapus." })) : (_jsx("ul", { className: "space-y-1 max-h-[40vh] overflow-auto pr-1", children: previewDelete.map((t) => (_jsxs("li", { className: "text-xs flex justify-between", children: [_jsxs("span", { children: [t.jenis_tagihan?.nama_tagihan ?? t.jenis_tagihan, " \u2014 ", t.bulan, " ", t.tahun] }), _jsx("span", { className: "font-medium", children: Number(t.nominal ?? t.sisa ?? 0).toLocaleString('id-ID') })] }, `del-${t.id}`))) })), _jsxs("div", { className: "pt-2 mt-2 border-t text-xs font-semibold flex justify-between", children: [_jsx("span", { children: "Total" }), _jsx("span", { children: totalDelete.toLocaleString('id-ID') })] })] }), _jsxs("div", { className: "border rounded p-2", children: [_jsx("div", { className: "font-medium text-sm text-gray-800 mb-1", children: "Tetap (sebagai tunggakan)" }), previewKeep.length === 0 ? (_jsx("div", { className: "text-xs text-gray-500", children: "Tidak ada tagihan tersisa." })) : (_jsx("ul", { className: "space-y-1 max-h-[40vh] overflow-auto pr-1", children: previewKeep.map((t) => (_jsxs("li", { className: "text-xs flex justify-between", children: [_jsxs("span", { children: [t.jenis_tagihan?.nama_tagihan ?? t.jenis_tagihan, " \u2014 ", t.bulan, " ", t.tahun] }), _jsx("span", { className: "font-medium", children: Number(t.nominal ?? t.sisa ?? 0).toLocaleString('id-ID') })] }, `keep-${t.id}`))) })), _jsxs("div", { className: "pt-2 mt-2 border-t text-xs font-semibold flex justify-between", children: [_jsx("span", { children: "Total" }), _jsx("span", { children: totalKeep.toLocaleString('id-ID') })] })] })] }))] })] }), _jsxs("div", { className: "p-4 border-t flex justify-end gap-2", children: [_jsx("button", { className: "px-4 py-2 rounded border", onClick: () => { setMutasiModalOpen(false); setMutasiTarget(null); setTanggalKeluar(''); setAlasan(''); }, children: "Batal" }), _jsx("button", { className: "px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50", disabled: !tanggalKeluar, onClick: async () => {
                                        if (!mutasiTarget)
                                            return;
                                        try {
                                            let detail = mutasiTarget;
                                            // Pastikan field wajib tersedia; jika tidak, ambil dari endpoint detail
                                            const needDetail = !detail?.tempat_lahir || !detail?.tanggal_lahir || !detail?.alamat || !detail?.nama_ayah || !detail?.nama_ibu;
                                            if (needDetail && mutasiTarget.id) {
                                                try {
                                                    const resp = await getSantri(mutasiTarget.id);
                                                    detail = resp?.data || detail;
                                                }
                                                catch (err) {
                                                    console.warn('Gagal memuat detail santri untuk validasi update');
                                                }
                                            }
                                            const fd = new FormData();
                                            fd.append('nis', String(detail?.nis || mutasiTarget.nis || ''));
                                            fd.append('nama_santri', String(detail?.nama_santri || mutasiTarget.nama_santri || ''));
                                            fd.append('tempat_lahir', String(detail?.tempat_lahir || ''));
                                            fd.append('tanggal_lahir', String(detail?.tanggal_lahir || ''));
                                            fd.append('jenis_kelamin', String(detail?.jenis_kelamin || mutasiTarget.jenis_kelamin || 'L'));
                                            fd.append('alamat', String(detail?.alamat || ''));
                                            fd.append('nama_ayah', String(detail?.nama_ayah || ''));
                                            fd.append('nama_ibu', String(detail?.nama_ibu || ''));
                                            fd.append('kelas_id', '');
                                            fd.append('asrama_id', '');
                                            fd.append('kelas_nama', '');
                                            fd.append('asrama_nama', '');
                                            fd.append('status', 'keluar');
                                            if (tanggalKeluar)
                                                fd.append('tanggal_keluar', tanggalKeluar);
                                            if (tujuanMutasi)
                                                fd.append('tujuan_mutasi', tujuanMutasi);
                                            if (alasan)
                                                fd.append('alasan_mutasi', alasan);
                                            await updateSantri(mutasiTarget.id, fd);
                                            const deletable = (previewDelete || []).filter((t) => t && t.id);
                                            for (const t of deletable) {
                                                try {
                                                    await deleteTagihanSantri(t.id);
                                                }
                                                catch (err) {
                                                    console.error('Gagal hapus tagihan', t?.id, err);
                                                }
                                            }
                                            const info = {
                                                tanggalKeluar,
                                                alasan,
                                                kelasTertinggal: mutasiTarget.kelas ?? mutasiTarget.kelas_nama ?? null,
                                                tujuanMutasi: tujuanMutasi || '-',
                                            };
                                            try {
                                                localStorage.setItem(`mutasi_keluar:${mutasiTarget.id}`, JSON.stringify(info));
                                            }
                                            catch { }
                                            toast.success('Mutasi keluar berhasil diproses');
                                            setMutasiModalOpen(false);
                                            setMutasiTarget(null);
                                            setTanggalKeluar('');
                                            setAlasan('');
                                            setTujuanMutasi('');
                                            fetchData();
                                        }
                                        catch (e) {
                                            if (e?.response?.status === 422) {
                                                toast.error('Validasi gagal. Lengkapi data profil santri sebelum mutasi.');
                                            }
                                            else {
                                                console.error(e);
                                            }
                                        }
                                    }, children: "Konfirmasi Mutasi" })] })] }) }))] }));
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
        const origin = getBackendOrigin();
        if (/^https?:\/\//i.test(s)) {
            // Jika URL absolut mengarah ke localhost:8000, ubah ke origin backend saat ini (mis. 8001)
            try {
                const u = new URL(s);
                const o = new URL(origin);
                const isLocalHost = ['localhost', '127.0.0.1'].includes(u.hostname);
                if (isLocalHost && u.port && o.port && u.port !== o.port) {
                    u.protocol = o.protocol;
                    u.hostname = o.hostname;
                    u.port = o.port;
                    return u.toString();
                }
            }
            catch { }
            return s;
        }
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
    const fallback = window.location.origin;
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
            return loc.replace(':5173', ':8001');
        if (loc.includes(':5174'))
            return loc.replace(':5174', ':8001');
        if (loc.includes(':5175'))
            return loc.replace(':5175', ':8001');
        if (loc.includes(':5176'))
            return loc.replace(':5176', ':8001');
    }
    catch { }
    return fallback;
}
