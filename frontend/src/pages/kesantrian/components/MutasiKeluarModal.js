import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { createMutasiKeluar } from '@/api/mutasiKeluar';
import { listTagihanBySantri } from '@/api/tagihanSantri';
import toast from 'react-hot-toast';
export default function MutasiKeluarModal({ santri, onClose, onSuccess }) {
    const [tujuan, setTujuan] = useState('');
    const [alasan, setAlasan] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
    const [tagihan, setTagihan] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const loadTagihan = async () => {
            try {
                const res = await listTagihanBySantri(santri.id);
                const data = Array.isArray(res) ? res : (res?.data || []);
                setTagihan(data);
            }
            catch (err) {
                console.error('Error load tagihan', err);
            }
        };
        loadTagihan();
    }, [santri]);
    const handleSubmit = async () => {
        try {
            setLoading(true);
            await createMutasiKeluar({ santri_id: santri.id, tujuan, alasan, tanggal_mutasi: tanggal });
            toast.success('Mutasi keluar berhasil disimpan');
            onSuccess();
            onClose();
        }
        catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Gagal menyimpan mutasi keluar');
        }
        finally {
            setLoading(false);
        }
    };
    const bulanMap = {
        'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
        'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8, 'September': 9,
        'Oktober': 10, 'November': 11, 'Desember': 12
    };
    const isAfterMutasi = (tBulan, tTahun) => {
        try {
            const mut = new Date(tanggal);
            const bulanNum = bulanMap[tBulan] ?? 1;
            const tagDate = new Date(Number(tTahun), bulanNum - 1, 1);
            // if tagDate strictly greater than month of mutasi
            return tagDate.getFullYear() > mut.getFullYear() || (tagDate.getFullYear() === mut.getFullYear() && tagDate.getMonth() > mut.getMonth());
        }
        catch {
            return false;
        }
    };
    const isTunggakan = (tBulan, tTahun, sisa) => {
        try {
            const today = new Date();
            const bulanNum = bulanMap[tBulan] ?? 1;
            const tagDate = new Date(Number(tTahun), bulanNum - 1, 1);
            return (tagDate.getTime() <= today.getTime()) && (Number(sisa) > 0);
        }
        catch {
            return false;
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-2", children: "Konfirmasi Mutasi Keluar" }), _jsxs("div", { className: "text-sm text-gray-600 mb-4", children: ["Santri: ", _jsx("strong", { children: santri.nama_santri })] }), _jsxs("div", { className: "grid grid-cols-1 gap-3 mb-4", children: [_jsx("input", { type: "text", className: "px-3 py-2 border rounded", placeholder: "Tujuan mutasi", value: tujuan, onChange: (e) => setTujuan(e.target.value) }), _jsx("textarea", { className: "px-3 py-2 border rounded", placeholder: "Alasan mutasi", value: alasan, onChange: (e) => setAlasan(e.target.value) }), _jsx("input", { type: "date", className: "px-3 py-2 border rounded", value: tanggal, onChange: (e) => setTanggal(e.target.value) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "font-semibold", children: "Tagihan Santri" }), _jsx("div", { className: "max-h-64 overflow-y-auto mt-2", children: tagihan.length === 0 ? (_jsx("div", { className: "text-xs text-gray-500", children: "Tidak ada tagihan" })) : (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "text-left", children: "Jenis" }), _jsx("th", { className: "text-left", children: "Periode" }), _jsx("th", { className: "text-right", children: "Nominal" }), _jsx("th", { className: "text-right", children: "Status" })] }) }), _jsx("tbody", { children: tagihan.map((t) => {
                                        const jenisObj = t.jenisTagihan || t.jenis_tagihan;
                                        const jenisNama = typeof jenisObj === 'object'
                                            ? (jenisObj?.nama_tagihan || jenisObj?.namaTagihan || '')
                                            : (t.jenis_tagihan || t.jenisTagihan?.nama_tagihan || '');
                                        return (_jsxs("tr", { className: "border-t", children: [_jsx("td", { children: jenisNama }), _jsxs("td", { children: [t.bulan, " ", t.tahun] }), _jsx("td", { className: "text-right", children: Number(t.nominal).toLocaleString('id-ID') }), _jsxs("td", { className: "text-right", children: [t.status, ' ', isTunggakan(t.bulan, t.tahun, t.sisa) && (_jsx("span", { className: "text-xs text-yellow-700", children: "(tunggakan)" })), isAfterMutasi(t.bulan, t.tahun) && (_jsx("span", { className: "text-xs text-red-600", children: "(akan dihapus)" }))] })] }, t.id));
                                    }) })] })) })] }), _jsxs("div", { className: "flex gap-3 justify-end mt-4", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 border rounded hover:bg-gray-50", children: "Batal" }), _jsx("button", { onClick: handleSubmit, className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed", disabled: loading || !tanggal, children: loading ? 'Menyimpan...' : 'Simpan' })] })] }));
}
