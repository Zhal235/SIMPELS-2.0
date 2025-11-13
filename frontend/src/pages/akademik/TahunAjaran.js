import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, CheckCircle } from 'lucide-react';
import { listTahunAjaran, createTahunAjaran, updateTahunAjaran, deleteTahunAjaran } from '../../api/tahunAjaran';
import toast from 'react-hot-toast';
export default function TahunAjaran() {
    const [dataTahunAjaran, setDataTahunAjaran] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await listTahunAjaran();
            setDataTahunAjaran(res.data || res || []);
        }
        catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Gagal memuat data tahun ajaran');
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = (tahunAjaran) => {
        setSelectedTahunAjaran(tahunAjaran);
        setShowConfirmModal(true);
    };
    const handleConfirmDelete = async () => {
        if (!selectedTahunAjaran)
            return;
        try {
            await deleteTahunAjaran(selectedTahunAjaran.id);
            setDataTahunAjaran(dataTahunAjaran.filter(item => item.id !== selectedTahunAjaran.id));
            toast.success('Tahun ajaran berhasil dihapus!');
            setShowConfirmModal(false);
            setSelectedTahunAjaran(null);
        }
        catch (error) {
            console.error('Error deleting:', error);
            toast.error('Gagal menghapus tahun ajaran');
        }
    };
    const handleEdit = (tahunAjaran) => {
        setSelectedTahunAjaran(tahunAjaran);
        setShowModal(true);
    };
    const handleAktifkan = async (tahunAjaran) => {
        try {
            // Update tahun ajaran menjadi aktif
            const updatedData = { ...tahunAjaran, status: 'aktif' };
            const response = await updateTahunAjaran(tahunAjaran.id, updatedData);
            // Update state: set semua jadi tidak aktif, kecuali yang baru diaktifkan
            setDataTahunAjaran(dataTahunAjaran.map(item => ({
                ...item,
                status: item.id === tahunAjaran.id ? 'aktif' : 'tidak_aktif'
            })));
            toast.success(`Tahun ajaran "${tahunAjaran.nama_tahun_ajaran}" berhasil diaktifkan!`);
            // Refresh data untuk memastikan sinkron dengan backend
            fetchData();
        }
        catch (error) {
            console.error('Error mengaktifkan:', error);
            const errorMessage = error.response?.data?.message || 'Gagal mengaktifkan tahun ajaran';
            toast.error(errorMessage);
        }
    };
    const handleAdd = () => {
        setSelectedTahunAjaran(null);
        setShowModal(true);
    };
    const handleSave = async (data) => {
        try {
            if (selectedTahunAjaran) {
                // Edit
                const response = await updateTahunAjaran(selectedTahunAjaran.id, data);
                setDataTahunAjaran(dataTahunAjaran.map(item => item.id === selectedTahunAjaran.id ? response.data : item));
                toast.success('Tahun ajaran berhasil diperbarui!');
            }
            else {
                // Add new
                const response = await createTahunAjaran(data);
                setDataTahunAjaran([...dataTahunAjaran, response.data]);
                toast.success('Tahun ajaran berhasil ditambahkan!');
            }
            setShowModal(false);
            setSelectedTahunAjaran(null);
        }
        catch (error) {
            console.error('Error saving:', error);
            const errorMessage = error.response?.data?.message || 'Gagal menyimpan tahun ajaran';
            toast.error(errorMessage);
        }
    };
    const getBulanNama = (nomorBulan) => {
        const bulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const index = parseInt(nomorBulan) - 1;
        return bulan[index] || nomorBulan;
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Tahun Ajaran" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Kelola data tahun ajaran sekolah" })] }), _jsxs("button", { onClick: handleAdd, className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium", children: [_jsx(Plus, { className: "w-5 h-5" }), "Tambah Tahun Ajaran"] })] }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "No" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Nama Tahun Ajaran" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Tanggal Mulai" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Tanggal Akhir" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Aksi" })] }) }), _jsx("tbody", { className: "divide-y", children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-500", children: "Memuat data..." }) })) : dataTahunAjaran.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-500", children: "Belum ada data tahun ajaran" }) })) : (dataTahunAjaran.map((item, idx) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-gray-900 font-medium", children: idx + 1 }), _jsx("td", { className: "px-6 py-4 text-gray-900 font-medium", children: item.nama_tahun_ajaran }), _jsxs("td", { className: "px-6 py-4 text-gray-600", children: [item.tanggal_mulai, " ", getBulanNama(item.bulan_mulai), " ", item.tahun_mulai] }), _jsxs("td", { className: "px-6 py-4 text-gray-600", children: [item.tanggal_akhir, " ", getBulanNama(item.bulan_akhir), " ", item.tahun_akhir] }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium ${item.status === 'aktif'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'}`, children: item.status === 'aktif' ? 'Aktif' : 'Tidak Aktif' }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [item.status === 'tidak_aktif' && (_jsxs("button", { onClick: () => handleAktifkan(item), className: "px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1", title: "Aktifkan tahun ajaran ini", children: [_jsx(CheckCircle, { className: "w-3.5 h-3.5" }), "Aktifkan"] })), _jsx("button", { onClick: () => handleEdit(item), className: "p-2 hover:bg-blue-100 text-blue-600 rounded-lg", title: "Edit", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(item), className: "p-2 hover:bg-red-100 text-red-600 rounded-lg", title: "Hapus", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, item.id)))) })] }) }) }), showModal && (_jsx(ModalFormTahunAjaran, { tahunAjaran: selectedTahunAjaran, onSave: handleSave, onClose: () => {
                    setShowModal(false);
                    setSelectedTahunAjaran(null);
                } })), showConfirmModal && selectedTahunAjaran && (_jsx(ModalConfirmDelete, { nama: selectedTahunAjaran.nama_tahun_ajaran, onConfirm: handleConfirmDelete, onCancel: () => {
                    setShowConfirmModal(false);
                    setSelectedTahunAjaran(null);
                } }))] }));
}
// Modal Form
function ModalFormTahunAjaran({ tahunAjaran, onSave, onClose }) {
    const [namaTahunAjaran, setNamaTahunAjaran] = useState(tahunAjaran?.nama_tahun_ajaran || '');
    const [tanggalMulai, setTanggalMulai] = useState(tahunAjaran?.tanggal_mulai || '');
    const [bulanMulai, setBulanMulai] = useState(tahunAjaran?.bulan_mulai || '');
    const [tahunMulai, setTahunMulai] = useState(tahunAjaran?.tahun_mulai || new Date().getFullYear());
    const [tanggalAkhir, setTanggalAkhir] = useState(tahunAjaran?.tanggal_akhir || '');
    const [bulanAkhir, setBulanAkhir] = useState(tahunAjaran?.bulan_akhir || '');
    const [tahunAkhir, setTahunAkhir] = useState(tahunAjaran?.tahun_akhir || new Date().getFullYear());
    const [status, setStatus] = useState(tahunAjaran?.status || 'tidak_aktif');
    // Convert dari tanggal/bulan/tahun ke format YYYY-MM-DD untuk date input
    const getDateInputValue = (tanggal, bulan, tahun) => {
        if (!tanggal || !bulan || !tahun)
            return '';
        const paddedBulan = String(bulan).padStart(2, '0');
        const paddedTanggal = String(tanggal).padStart(2, '0');
        return `${tahun}-${paddedBulan}-${paddedTanggal}`;
    };
    // Convert dari format YYYY-MM-DD ke tanggal/bulan/tahun
    const parseDateInput = (dateString) => {
        if (!dateString)
            return { tanggal: '', bulan: '', tahun: 0 };
        const [tahun, bulan, tanggal] = dateString.split('-');
        return {
            tanggal: String(Number(tanggal)),
            bulan: String(Number(bulan)),
            tahun: Number(tahun)
        };
    };
    const handleTanggalMulaiChange = (e) => {
        const parsed = parseDateInput(e.target.value);
        setTanggalMulai(parsed.tanggal);
        setBulanMulai(parsed.bulan);
        setTahunMulai(parsed.tahun);
    };
    const handleTanggalAkhirChange = (e) => {
        const parsed = parseDateInput(e.target.value);
        setTanggalAkhir(parsed.tanggal);
        setBulanAkhir(parsed.bulan);
        setTahunAkhir(parsed.tahun);
    };
    const bulanOptions = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' }
    ];
    const handleSubmit = () => {
        if (!namaTahunAjaran || !tanggalMulai || !bulanMulai || !tanggalAkhir || !bulanAkhir) {
            toast.error('Semua field harus diisi');
            return;
        }
        const data = {
            id: tahunAjaran?.id || 0,
            nama_tahun_ajaran: namaTahunAjaran,
            tanggal_mulai: tanggalMulai,
            bulan_mulai: bulanMulai,
            tahun_mulai: tahunMulai,
            tanggal_akhir: tanggalAkhir,
            bulan_akhir: bulanAkhir,
            tahun_akhir: tahunAkhir,
            status
        };
        onSave(data);
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b flex justify-between items-center sticky top-0 bg-white", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: tahunAjaran ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru' }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nama Tahun Ajaran *" }), _jsx("input", { type: "text", placeholder: "Contoh: 2024/2025", value: namaTahunAjaran, onChange: (e) => setNamaTahunAjaran(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Tanggal Mulai *" }), _jsx("input", { type: "date", value: getDateInputValue(tanggalMulai, bulanMulai, tahunMulai), onChange: handleTanggalMulaiChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Tanggal Akhir *" }), _jsx("input", { type: "date", value: getDateInputValue(tanggalAkhir, bulanAkhir, tahunAkhir), onChange: handleTanggalAkhirChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status *" }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "status", value: "aktif", checked: status === 'aktif', onChange: (e) => setStatus(e.target.value), className: "mr-2" }), "Aktif"] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "status", value: "tidak_aktif", checked: status === 'tidak_aktif', onChange: (e) => setStatus(e.target.value), className: "mr-2" }), "Tidak Aktif"] })] })] })] }), _jsxs("div", { className: "p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white", children: [_jsx("button", { onClick: onClose, className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Batal" }), _jsx("button", { onClick: handleSubmit, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: tahunAjaran ? 'Simpan Perubahan' : 'Tambah Tahun Ajaran' })] })] }) }));
}
// Modal Konfirmasi Delete
function ModalConfirmDelete({ nama, onConfirm, onCancel }) {
    return (_jsx("div", { className: "fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-sm w-full", children: [_jsx("div", { className: "p-6 border-b", children: _jsx("h3", { className: "font-bold text-gray-900 text-lg", children: "Hapus Tahun Ajaran" }) }), _jsx("div", { className: "p-6 space-y-3", children: _jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "w-6 h-6 text-red-600", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }) }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-900 font-medium", children: "Anda yakin ingin menghapus?" }), _jsxs("p", { className: "text-gray-600 text-sm mt-1", children: ["Tahun ajaran ", _jsxs("strong", { children: ["\"", nama, "\""] }), " akan dihapus secara permanen dan tidak dapat dipulihkan."] })] })] }) }), _jsxs("div", { className: "p-6 border-t flex gap-3 justify-end", children: [_jsx("button", { onClick: onCancel, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700", children: "Batal" }), _jsx("button", { onClick: onConfirm, className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium", children: "Hapus" })] })] }) }));
}
