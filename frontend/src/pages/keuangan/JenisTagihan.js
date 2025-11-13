import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Play, X, Search } from 'lucide-react';
import { listSantri } from '../../api/santri';
import { listKelas } from '../../api/kelas';
import { listJenisTagihan, createJenisTagihan, updateJenisTagihan, deleteJenisTagihan } from '../../api/jenisTagihan';
import { listTahunAjaran } from '../../api/tahunAjaran';
import { generateTagihanSantri } from '../../api/tagihanSantri';
import { listBukuKas } from '../../api/bukuKas';
import toast from 'react-hot-toast';
export default function JenisTagihan() {
    const [showModal, setShowModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedTagihan, setSelectedTagihan] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [kelasList, setKelasList] = useState([]);
    const [santriList, setSantriList] = useState([]);
    const [bukuKasList, setBukuKasList] = useState([]);
    const [dataTagihan, setDataTagihan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tahunAjaranAktif, setTahunAjaranAktif] = useState(null);
    const [bulanList, setBulanList] = useState([]);
    // Fetch data kelas, santri, dan jenis tagihan dari API
    useEffect(() => {
        fetchAllData();
    }, []);
    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [kelasRes, santriRes, tagihanRes, tahunAjaranRes, bukuKasRes] = await Promise.all([
                listKelas(),
                listSantri(1, 1000),
                listJenisTagihan(),
                listTahunAjaran(),
                listBukuKas()
            ]);
            setKelasList(kelasRes.data || kelasRes || []);
            setSantriList(santriRes.data || santriRes || []);
            setDataTagihan(tagihanRes.data || tagihanRes || []);
            setBukuKasList(bukuKasRes.data || bukuKasRes || []);
            // Cari tahun ajaran aktif
            const tahunsAjaran = tahunAjaranRes.data || tahunAjaranRes || [];
            const aktif = tahunsAjaran.find((t) => t.status === 'aktif');
            if (aktif) {
                setTahunAjaranAktif(aktif);
                // Generate bulan dari bulan_mulai hingga bulan_akhir
                const bulanNama = [
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ];
                let bulan = [];
                const mulai = aktif.bulan_mulai;
                const akhir = aktif.bulan_akhir;
                if (mulai <= akhir) {
                    // Bulan dalam tahun yang sama (contoh: Juli-Desember)
                    for (let i = mulai; i <= akhir; i++) {
                        bulan.push(bulanNama[i - 1]);
                    }
                }
                else {
                    // Bulan melewati tahun baru (contoh: November 2024 - Juni 2025)
                    for (let i = mulai; i <= 12; i++) {
                        bulan.push(bulanNama[i - 1]);
                    }
                    for (let i = 1; i <= akhir; i++) {
                        bulan.push(bulanNama[i - 1]);
                    }
                }
                setBulanList(bulan);
            }
            else {
                // Jika tidak ada tahun ajaran aktif, tampilkan semua bulan
                setBulanList([
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ]);
            }
        }
        catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Gagal memuat data');
        }
        finally {
            setLoading(false);
        }
    };
    const filteredData = dataTagihan.filter(item => item.namaTagihan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchTerm.toLowerCase()));
    const handleDelete = async (id) => {
        // Temukan tagihan yang akan dihapus
        const tagihanToDelete = dataTagihan.find(t => t.id === id);
        setSelectedTagihan(tagihanToDelete || null);
        setShowConfirmModal(true);
    };
    const handleConfirmDelete = async () => {
        if (!selectedTagihan)
            return;
        try {
            await deleteJenisTagihan(selectedTagihan.id);
            setDataTagihan(dataTagihan.filter(item => item.id !== selectedTagihan.id));
            toast.success('Tagihan berhasil dihapus!');
            setShowConfirmModal(false);
            setSelectedTagihan(null);
        }
        catch (error) {
            console.error('Error deleting:', error);
            toast.error('Gagal menghapus tagihan');
        }
    };
    const handleSave = async (data) => {
        try {
            if (selectedTagihan) {
                // Edit existing
                const response = await updateJenisTagihan(selectedTagihan.id, data);
                setDataTagihan(dataTagihan.map(item => item.id === selectedTagihan.id ? response.data : item));
                toast.success('Tagihan berhasil diperbarui!');
            }
            else {
                // Add new
                const response = await createJenisTagihan(data);
                setDataTagihan([...dataTagihan, response.data]);
                toast.success('Tagihan berhasil ditambahkan!');
            }
            setShowModal(false);
            setSelectedTagihan(null);
        }
        catch (error) {
            console.error('Error saving:', error);
            const errorMessage = error.response?.data?.message || 'Gagal menyimpan tagihan';
            toast.error(errorMessage);
        }
    };
    const handleGenerate = (tagihan) => {
        setSelectedTagihan(tagihan);
        setShowPreviewModal(true);
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Jenis Tagihan" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Kelola jenis-jenis tagihan untuk santri" })] }), _jsx("div", { className: "bg-white rounded-lg shadow mb-6 p-4", children: _jsxs("div", { className: "flex justify-between items-center gap-4", children: [_jsx("div", { className: "flex-1 max-w-md", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Cari tagihan...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }) }), _jsxs("button", { onClick: () => setShowModal(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(Plus, { className: "w-5 h-5" }), "Tambah Tagihan"] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "No" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Nama Tagihan" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Kategori" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Bulan" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Nominal Default" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Jatuh Tempo" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Buku Kas" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Aksi" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredData.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "px-6 py-8 text-center text-gray-500", children: "Tidak ada data tagihan" }) })) : (filteredData.map((item, index) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: index + 1 }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: item.namaTagihan }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.kategori === 'Rutin'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'}`, children: item.kategori }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("div", { className: "text-sm text-gray-900", children: item.bulan.length > 3
                                                    ? `${item.bulan.slice(0, 3).join(', ')}... (+${item.bulan.length - 3})`
                                                    : item.bulan.join(', ') }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm text-gray-900", children: [item.tipeNominal === 'sama' && item.nominalSama && (`Rp ${item.nominalSama.toLocaleString('id-ID')}`), item.tipeNominal === 'per_kelas' && (_jsx("span", { className: "text-orange-600 font-medium", children: "Berbeda per Kelas" })), item.tipeNominal === 'per_individu' && (_jsx("span", { className: "text-purple-600 font-medium", children: "Berbeda per Individu" }))] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("div", { className: "text-sm text-gray-900", children: item.jatuhTempo }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-900", children: item.bukuKas }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => handleGenerate(item), className: "text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded", title: "Generate Tagihan", children: _jsx(Play, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => {
                                                            setSelectedTagihan(item);
                                                            setShowModal(true);
                                                        }, className: "text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded", title: "Edit", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(item.id), className: "text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded", title: "Hapus", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, item.id)))) })] }) }) }), showModal && (_jsx(ModalFormTagihan, { onClose: () => {
                    setShowModal(false);
                    setSelectedTagihan(null);
                }, onSave: handleSave, tagihan: selectedTagihan, kelasList: kelasList, santriList: santriList, bukuKasList: bukuKasList, bulanAvailable: bulanList, tahunAjaranAktif: tahunAjaranAktif })), showPreviewModal && selectedTagihan && (_jsx(ModalPreviewGenerate, { tagihan: selectedTagihan, santriList: santriList, onClose: () => {
                    setShowPreviewModal(false);
                    setSelectedTagihan(null);
                } })), showConfirmModal && selectedTagihan && (_jsx(ModalConfirmDelete, { tagihanNama: selectedTagihan.namaTagihan, onConfirm: handleConfirmDelete, onCancel: () => {
                    setShowConfirmModal(false);
                    setSelectedTagihan(null);
                } }))] }));
}
// Modal Form Tagihan
function ModalFormTagihan({ onClose, onSave, tagihan, kelasList, santriList, bukuKasList, bulanAvailable, tahunAjaranAktif }) {
    const [namaTagihan, setNamaTagihan] = useState(tagihan?.namaTagihan || '');
    const [kategori, setKategori] = useState(tagihan?.kategori || 'Rutin');
    const [bulanTerpilih, setBulanTerpilih] = useState(tagihan?.bulan || []);
    const [tipeNominal, setTipeNominal] = useState(tagihan?.tipeNominal || 'sama');
    const [nominalSama, setNominalSama] = useState(tagihan?.nominalSama || 0);
    const [nominalPerKelas, setNominalPerKelas] = useState(tagihan?.nominalPerKelas || []);
    const [nominalPerIndividu, setNominalPerIndividu] = useState(tagihan?.nominalPerIndividu || []);
    const [jatuhTempo, setJatuhTempo] = useState(tagihan?.jatuhTempo || '');
    const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('');
    const [bukuKasId, setBukuKasId] = useState(tagihan?.bukuKasId || '');
    const [searchSantri, setSearchSantri] = useState('');
    const [showAddSantriModal, setShowAddSantriModal] = useState(false);
    // Gunakan bulan dari tahun ajaran aktif, atau semua bulan jika tidak ada
    const bulanList = bulanAvailable.length > 0 ? bulanAvailable : [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    // Helper untuk mendapatkan tahun dari bulan
    const getBulanWithYear = (bulan) => {
        if (!tahunAjaranAktif)
            return bulan;
        const bulanMap = {
            'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
            'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8,
            'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
        };
        const bulanAngka = bulanMap[bulan];
        const tahun = bulanAngka >= tahunAjaranAktif.bulan_mulai
            ? tahunAjaranAktif.tahun_mulai
            : tahunAjaranAktif.tahun_akhir;
        return `${bulan} ${tahun}`;
    };
    // Filter santri based on search
    const filteredSantri = santriList.filter(s => s.nama_santri?.toLowerCase().includes(searchSantri.toLowerCase()) ||
        s.nis?.toLowerCase().includes(searchSantri.toLowerCase()));
    // Handle perubahan nominal per kelas
    const handleKelasNominalChange = (kelas, nominal) => {
        const existing = nominalPerKelas.find(n => n.kelas === kelas);
        if (existing) {
            setNominalPerKelas(nominalPerKelas.map(n => n.kelas === kelas ? { ...n, nominal } : n));
        }
        else if (nominal > 0) {
            setNominalPerKelas([...nominalPerKelas, { kelas, nominal }]);
        }
    };
    // Handle toggle kelas
    const handleToggleKelas = (kelas, checked) => {
        if (!checked) {
            setNominalPerKelas(nominalPerKelas.filter(n => n.kelas !== kelas));
        }
        else if (!nominalPerKelas.find(n => n.kelas === kelas)) {
            setNominalPerKelas([...nominalPerKelas, { kelas, nominal: 0 }]);
        }
    };
    // Handle add santri individu (bisa multiple)
    const handleAddSantri = (santriList, nominal) => {
        const newSantri = santriList.map(s => ({
            santriId: s.id,
            santriNama: s.nama,
            nominal
        }));
        const existingIds = new Set(nominalPerIndividu.map(n => n.santriId));
        const toAdd = newSantri.filter(s => !existingIds.has(s.santriId));
        if (toAdd.length > 0) {
            setNominalPerIndividu([...nominalPerIndividu, ...toAdd]);
            toast.success(`${toAdd.length} santri berhasil ditambahkan`);
        }
        else {
            toast.error('Semua santri sudah ada dalam daftar');
        }
        setShowAddSantriModal(false);
        setSearchSantri('');
    };
    // Handle remove santri individu
    const handleRemoveSantri = (santriId) => {
        const santriNama = nominalPerIndividu.find(n => n.santriId === santriId)?.santriNama;
        setNominalPerIndividu(nominalPerIndividu.filter(n => n.santriId !== santriId));
        toast.success(`${santriNama} berhasil dihapus`);
    };
    // Handle edit nominal santri
    const handleEditNominalSantri = (santriId, nominal) => {
        setNominalPerIndividu(nominalPerIndividu.map(n => n.santriId === santriId ? { ...n, nominal } : n));
    };
    // Handle save
    const handleSubmit = () => {
        // Validasi
        if (!namaTagihan.trim()) {
            alert('Nama tagihan harus diisi');
            return;
        }
        if (bulanTerpilih.length === 0) {
            alert('Pilih minimal satu bulan');
            return;
        }
        if (!jatuhTempo && !tanggalJatuhTempo) {
            alert('Jatuh tempo harus diisi');
            return;
        }
        if (!bukuKasId) {
            alert('Buku kas harus dipilih');
            return;
        }
        // Validasi nominal
        if (tipeNominal === 'sama' && nominalSama <= 0) {
            alert('Nominal harus lebih dari 0');
            return;
        }
        if (tipeNominal === 'per_kelas' && nominalPerKelas.length === 0) {
            alert('Pilih minimal satu kelas dan isi nominalnya');
            return;
        }
        if (tipeNominal === 'per_individu' && nominalPerIndividu.length === 0) {
            alert('Pilih minimal satu santri dan isi nominalnya');
            return;
        }
        // Build data
        const data = {
            id: 0, // Will be set by parent
            namaTagihan,
            kategori,
            bulan: bulanTerpilih,
            tipeNominal,
            jatuhTempo: kategori === 'Rutin' ? jatuhTempo : tanggalJatuhTempo,
            bukuKasId: Number(bukuKasId)
        };
        if (tipeNominal === 'sama') {
            data.nominalSama = nominalSama;
        }
        else if (tipeNominal === 'per_kelas') {
            data.nominalPerKelas = nominalPerKelas;
        }
        else if (tipeNominal === 'per_individu') {
            data.nominalPerIndividu = nominalPerIndividu;
        }
        onSave(data);
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: tagihan ? 'Edit Tagihan' : 'Tambah Tagihan Baru' }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nama Tagihan *" }), _jsx("input", { type: "text", placeholder: "Contoh: SPP, Makan, Ujian", value: namaTagihan, onChange: (e) => setNamaTagihan(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Kategori *" }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "kategori", value: "Rutin", checked: kategori === 'Rutin', onChange: (e) => setKategori(e.target.value), className: "mr-2" }), "Rutin"] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "kategori", value: "Non Rutin", checked: kategori === 'Non Rutin', onChange: (e) => setKategori(e.target.value), className: "mr-2" }), "Non Rutin"] })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Bulan Tagihan *", _jsx("span", { className: "text-xs text-gray-500 ml-2", children: tahunAjaranAktif
                                                    ? `(Tahun Ajaran ${tahunAjaranAktif.tahun_mulai}/${tahunAjaranAktif.tahun_akhir})`
                                                    : '(Tidak ada tahun ajaran aktif)' })] }), !tahunAjaranAktif && (_jsx("div", { className: "mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800", children: "\u26A0\uFE0F Belum ada tahun ajaran aktif. Silakan aktifkan tahun ajaran terlebih dahulu." })), tahunAjaranAktif && (_jsxs("div", { className: "mb-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800", children: ["\u2139\uFE0F Tagihan akan digenerate sesuai periode tahun ajaran aktif:", _jsxs("div", { className: "mt-1 font-semibold", children: [getBulanWithYear(bulanList[0]), " s/d ", getBulanWithYear(bulanList[bulanList.length - 1])] })] })), _jsxs("div", { className: "mb-3 flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setBulanTerpilih([...bulanList]), className: "px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200", children: "\u2713 Pilih Semua" }), _jsx("button", { type: "button", onClick: () => setBulanTerpilih([]), className: "px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200", children: "\u2717 Batal Semua" }), bulanTerpilih.length > 0 && (_jsxs("span", { className: "px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded", children: [bulanTerpilih.length, "/", bulanList.length, " terpilih"] }))] }), _jsx("div", { className: "grid grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3", children: bulanList.map((bulan) => (_jsxs("label", { className: "flex items-center p-2 hover:bg-gray-50 rounded", children: [_jsx("input", { type: "checkbox", checked: bulanTerpilih.includes(bulan), onChange: (e) => {
                                                        if (e.target.checked) {
                                                            setBulanTerpilih([...bulanTerpilih, bulan]);
                                                        }
                                                        else {
                                                            setBulanTerpilih(bulanTerpilih.filter(b => b !== bulan));
                                                        }
                                                    }, className: "mr-2" }), _jsx("span", { className: "text-sm", children: tahunAjaranAktif ? getBulanWithYear(bulan) : bulan })] }, bulan))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tipe Nominal *" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50", children: [_jsx("input", { type: "radio", name: "tipeNominal", value: "sama", checked: tipeNominal === 'sama', onChange: () => setTipeNominal('sama'), className: "mr-3" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: "Nominal Sama untuk Semua Santri" }), _jsx("div", { className: "text-xs text-gray-500", children: "Otomatis untuk semua santri aktif" })] })] }), tipeNominal === 'sama' && (_jsx("div", { className: "ml-6", children: _jsx("input", { type: "number", placeholder: "Masukkan nominal", value: nominalSama || '', onChange: (e) => setNominalSama(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }) })), _jsxs("label", { className: "flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50", children: [_jsx("input", { type: "radio", name: "tipeNominal", value: "per_kelas", checked: tipeNominal === 'per_kelas', onChange: () => setTipeNominal('per_kelas'), className: "mr-3" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: "Nominal Berbeda Per Kelas" }), _jsx("div", { className: "text-xs text-gray-500", children: "Centang kelas & isi nominal = otomatis jadi target" })] })] }), tipeNominal === 'per_kelas' && (_jsxs("div", { className: "ml-6 space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-3", children: [_jsxs("div", { className: "grid grid-cols-12 gap-2 text-sm font-semibold mb-2", children: [_jsx("div", { className: "col-span-1" }), _jsx("div", { className: "col-span-5", children: "Kelas" }), _jsx("div", { className: "col-span-6", children: "Nominal" })] }), kelasList.map((kelas) => {
                                                        const kelasNama = kelas.nama_kelas || kelas.id;
                                                        const isChecked = nominalPerKelas.some(n => n.kelas === kelasNama);
                                                        const nominalValue = nominalPerKelas.find(n => n.kelas === kelasNama)?.nominal || 0;
                                                        return (_jsxs("div", { className: "grid grid-cols-12 gap-2 items-center", children: [_jsx("div", { className: "col-span-1", children: _jsx("input", { type: "checkbox", checked: isChecked, onChange: (e) => handleToggleKelas(kelasNama, e.target.checked) }) }), _jsx("div", { className: "col-span-5 text-sm", children: kelasNama }), _jsx("div", { className: "col-span-6", children: _jsx("input", { type: "number", placeholder: "0", value: nominalValue || '', onChange: (e) => handleKelasNominalChange(kelasNama, Number(e.target.value)), disabled: !isChecked, className: "w-full px-3 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100" }) })] }, kelas.id));
                                                    })] })), _jsxs("label", { className: "flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50", children: [_jsx("input", { type: "radio", name: "tipeNominal", value: "per_individu", checked: tipeNominal === 'per_individu', onChange: () => setTipeNominal('per_individu'), className: "mr-3" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: "Nominal Berbeda Per Individu" }), _jsx("div", { className: "text-xs text-gray-500", children: "Pilih santri & isi nominal per santri" })] })] }), tipeNominal === 'per_individu' && (_jsxs("div", { className: "ml-6 space-y-2", children: [nominalPerIndividu.length > 0 && (_jsx("div", { className: "border border-gray-200 rounded p-3 max-h-48 overflow-y-auto space-y-2", children: nominalPerIndividu.map((item) => (_jsxs("div", { className: "flex items-center gap-2 p-2 bg-gray-50 rounded", children: [_jsx("div", { className: "flex-1", children: _jsx("div", { className: "text-sm font-medium", children: item.santriNama }) }), _jsx("input", { type: "number", placeholder: "Nominal", value: item.nominal || '', onChange: (e) => handleEditNominalSantri(item.santriId, Number(e.target.value)), className: "w-32 px-3 py-1 border border-gray-300 rounded text-sm" }), _jsx("button", { onClick: () => handleRemoveSantri(item.santriId), className: "text-red-600 hover:text-red-800 p-1", children: _jsx(X, { className: "w-4 h-4" }) })] }, item.santriId))) })), _jsxs("button", { onClick: () => setShowAddSantriModal(true), className: "w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Tambah Santri"] })] }))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Jatuh Tempo *", _jsxs("span", { className: "text-xs text-gray-500 ml-2", children: ["(", kategori === 'Rutin' ? 'Contoh: Tanggal 10 setiap bulan' : 'Pilih tanggal spesifik', ")"] })] }), kategori === 'Rutin' ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Tanggal" }), _jsx("input", { type: "number", min: "1", max: "31", placeholder: "10", value: jatuhTempo.replace(/\D/g, ''), onChange: (e) => setJatuhTempo(`Tanggal ${e.target.value} setiap bulan`), className: "w-20 px-3 py-2 border border-gray-300 rounded-lg" }), _jsx("span", { children: "setiap bulan" })] })) : (_jsx("input", { type: "date", value: tanggalJatuhTempo, onChange: (e) => setTanggalJatuhTempo(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Buku Kas *" }), _jsxs("select", { value: bukuKasId, onChange: (e) => setBukuKasId(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Pilih Buku Kas" }), bukuKasList.map((kas) => (_jsx("option", { value: kas.id, children: kas.nama_kas }, kas.id)))] })] })] }), _jsxs("div", { className: "p-6 border-t flex gap-3 justify-end", children: [_jsx("button", { onClick: onClose, className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Batal" }), _jsx("button", { onClick: handleSubmit, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: tagihan ? 'Simpan Perubahan' : 'Tambah Tagihan' })] })] }), showAddSantriModal && (_jsx(ModalTambahSantri, { santriList: filteredSantri, onAdd: handleAddSantri, onClose: () => {
                    setShowAddSantriModal(false);
                    setSearchSantri('');
                }, searchTerm: searchSantri, onSearch: setSearchSantri }))] }));
}
// Modal Tambah Santri (Multiple Selection)
function ModalTambahSantri({ santriList, onAdd, onClose, searchTerm, onSearch }) {
    const [santriTerpilih, setSantriTerpilih] = useState([]);
    const [nominal, setNominal] = useState(0);
    const [localSearch, setLocalSearch] = useState('');
    // Filter santri yang belum dipilih
    const availableSantri = santriList.filter(s => !santriTerpilih.find(st => st.id === String(s.id)));
    // Filter hasil pencarian
    const filteredSantri = availableSantri.filter(s => (s.nama_santri?.toLowerCase().includes(localSearch.toLowerCase()) ||
        s.nis?.toLowerCase().includes(localSearch.toLowerCase())) &&
        localSearch.length >= 2);
    const handleToggleSantri = (santri) => {
        const santriId = String(santri.id);
        if (santriTerpilih.find(s => s.id === santriId)) {
            setSantriTerpilih(santriTerpilih.filter(s => s.id !== santriId));
        }
        else {
            setSantriTerpilih([...santriTerpilih, {
                    id: santriId,
                    nama: santri.nama_santri
                }]);
        }
    };
    const handleAdd = () => {
        if (santriTerpilih.length === 0 || nominal <= 0) {
            toast.error('Pilih minimal 1 santri dan isi nominal');
            return;
        }
        onAdd(santriTerpilih, nominal);
        setSantriTerpilih([]);
        setNominal(0);
        setLocalSearch('');
    };
    return (_jsx("div", { className: "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto", children: [_jsxs("div", { className: "p-4 border-b flex justify-between items-center sticky top-0 bg-white", children: [_jsx("h3", { className: "font-bold text-gray-900", children: "Tambah Santri (Nominal Sama)" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Cari Santri (min 2 huruf)" }), _jsx("input", { type: "text", placeholder: "Nama atau NIS...", value: localSearch, onChange: (e) => setLocalSearch(e.target.value), autoFocus: true, className: "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" })] }), localSearch.length >= 2 && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Hasil Pencarian (", filteredSantri.length, ")"] }), _jsx("div", { className: "border rounded-lg max-h-48 overflow-y-auto", children: filteredSantri.length > 0 ? (_jsx("div", { className: "divide-y", children: filteredSantri.map((santri) => (_jsxs("div", { onClick: () => handleToggleSantri(santri), className: `p-3 cursor-pointer flex items-center gap-3 ${santriTerpilih.find(s => s.id === String(santri.id))
                                                ? 'bg-blue-50'
                                                : 'hover:bg-gray-50'}`, children: [_jsx("input", { type: "checkbox", checked: !!santriTerpilih.find(s => s.id === String(santri.id)), onChange: () => { }, className: "cursor-pointer" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-sm", children: santri.nama_santri }), _jsxs("div", { className: "text-xs text-gray-500", children: [santri.nis, " \u2022 ", santri.kelas_nama] })] })] }, santri.id))) })) : (_jsx("div", { className: "p-4 text-center text-gray-500 text-sm", children: "Santri tidak ditemukan" })) })] })), santriTerpilih.length > 0 && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Santri Terpilih (", santriTerpilih.length, ")"] }), _jsx("div", { className: "border rounded-lg p-3 bg-blue-50 space-y-2", children: santriTerpilih.map((santri) => (_jsxs("div", { className: "flex items-center justify-between bg-white p-2 rounded", children: [_jsx("span", { className: "text-sm font-medium", children: santri.nama }), _jsx("button", { onClick: () => setSantriTerpilih(santriTerpilih.filter(s => s.id !== santri.id)), className: "text-red-600 hover:text-red-800 p-1", children: _jsx(X, { className: "w-4 h-4" }) })] }, santri.id))) })] })), santriTerpilih.length > 0 && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Nominal untuk ", santriTerpilih.length, " santri"] }), _jsx("input", { type: "number", placeholder: "Masukkan nominal", value: nominal || '', onChange: (e) => setNominal(Number(e.target.value)), className: "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" }), nominal > 0 && (_jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Total: ", santriTerpilih.length, " \u00D7 Rp ", nominal.toLocaleString('id-ID'), " = ", _jsxs("strong", { children: ["Rp ", (santriTerpilih.length * nominal).toLocaleString('id-ID')] })] }))] }))] }), _jsxs("div", { className: "p-4 border-t flex gap-2 justify-end sticky bottom-0 bg-white", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm", children: "Batal" }), _jsxs("button", { onClick: handleAdd, disabled: santriTerpilih.length === 0 || nominal <= 0, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm", children: ["Tambah (", santriTerpilih.length, ")"] })] })] }) }));
}
// Modal Konfirmasi Delete
function ModalConfirmDelete({ tagihanNama, onConfirm, onCancel }) {
    return (_jsx("div", { className: "fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-sm w-full", children: [_jsx("div", { className: "p-6 border-b", children: _jsx("h3", { className: "font-bold text-gray-900 text-lg", children: "Hapus Tagihan" }) }), _jsx("div", { className: "p-6 space-y-3", children: _jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "w-6 h-6 text-red-600", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }) }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-900 font-medium", children: "Anda yakin ingin menghapus?" }), _jsxs("p", { className: "text-gray-600 text-sm mt-1", children: ["Tagihan ", _jsxs("strong", { children: ["\"", tagihanNama, "\""] }), " akan dihapus secara permanen dan tidak dapat dipulihkan."] })] })] }) }), _jsxs("div", { className: "p-6 border-t flex gap-3 justify-end", children: [_jsx("button", { onClick: onCancel, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700", children: "Batal" }), _jsx("button", { onClick: onConfirm, className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium", children: "Hapus" })] })] }) }));
}
// Modal Success Generate
function ModalSuccessGenerate({ totalTagihan, totalSantri, onClose }) {
    return (_jsx("div", { className: "fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full", children: _jsxs("div", { className: "p-6 text-center", children: [_jsx("div", { className: "mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4", children: _jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h3", { className: "font-bold text-xl text-gray-900 mb-2", children: "Generate Tagihan Berhasil!" }), _jsxs("div", { className: "text-gray-600 space-y-1 mb-6", children: [_jsxs("p", { children: ["Berhasil men-generate ", _jsxs("strong", { className: "text-green-600", children: [totalTagihan, " tagihan"] })] }), _jsxs("p", { children: ["untuk ", _jsxs("strong", { className: "text-green-600", children: [totalSantri, " santri"] })] })] }), _jsx("button", { onClick: onClose, className: "w-full px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium", children: "OK" })] }) }) }));
}
// Modal Preview Generate
function ModalPreviewGenerate({ tagihan, santriList, onClose }) {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedCount, setGeneratedCount] = useState(0);
    const [generatedSantri, setGeneratedSantri] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    // Data santri berdasarkan tipe nominal
    const getDaftarSantri = () => {
        if (tagihan.tipeNominal === 'sama') {
            // Semua santri
            return santriList.map(s => ({
                nama: s.nama_santri,
                kelas: s.kelas_nama || s.kelas?.nama_kelas || 'Belum ada kelas',
                nominal: tagihan.nominalSama || 0
            }));
        }
        else if (tagihan.tipeNominal === 'per_kelas') {
            // Filter berdasarkan kelas yang ada di nominalPerKelas
            const kelasTarget = tagihan.nominalPerKelas?.map(n => n.kelas) || [];
            console.log('Kelas Target:', kelasTarget);
            console.log('Santri List Sample:', santriList.slice(0, 3));
            return santriList
                .filter(s => {
                // Cek kelas_nama field langsung atau dari relasi
                const kelasNama = s.kelas_nama || s.kelas?.nama_kelas;
                console.log(`Santri: ${s.nama_santri}, Kelas: ${kelasNama}, Match: ${kelasNama && kelasTarget.includes(kelasNama)}`);
                // Cek apakah kelas santri ada di target
                return kelasNama && kelasTarget.includes(kelasNama);
            })
                .map(s => {
                const kelasNama = s.kelas_nama || s.kelas?.nama_kelas;
                const nominalKelas = tagihan.nominalPerKelas?.find(n => n.kelas === kelasNama);
                return {
                    nama: s.nama_santri,
                    kelas: kelasNama || 'Belum ada kelas',
                    nominal: nominalKelas?.nominal || 0
                };
            });
        }
        else if (tagihan.tipeNominal === 'per_individu') {
            // Hanya santri yang ada di nominalPerIndividu
            const santriIds = tagihan.nominalPerIndividu?.map(n => n.santriId) || [];
            console.log('Santri IDs untuk per_individu:', santriIds);
            console.log('Santri List:', santriList);
            return santriList
                .filter(s => {
                const match = santriIds.includes(String(s.id));
                console.log(`Filter santri ${s.nama_santri} (ID: ${s.id}): ${match}`);
                return match;
            })
                .map(s => {
                const nominalIndividu = tagihan.nominalPerIndividu?.find(n => n.santriId === String(s.id));
                return {
                    nama: s.nama_santri,
                    kelas: s.kelas_nama || s.kelas?.nama_kelas || 'Belum ada kelas',
                    nominal: nominalIndividu?.nominal || 0
                };
            });
        }
        return [];
    };
    const daftarSantri = getDaftarSantri();
    const totalTagihan = daftarSantri.length * tagihan.bulan.length;
    // Informasi target
    const getTargetInfo = () => {
        if (tagihan.tipeNominal === 'sama') {
            return {
                tipe: 'Semua Santri',
                detail: `Nominal: Rp ${tagihan.nominalSama?.toLocaleString('id-ID')}`
            };
        }
        else if (tagihan.tipeNominal === 'per_kelas') {
            // Filter hanya kelas yang punya santri
            const kelasWithSantri = tagihan.nominalPerKelas?.filter(item => {
                const jumlahSantri = santriList.filter(s => (s.kelas_nama || s.kelas?.nama_kelas) === item.kelas).length;
                return jumlahSantri > 0;
            }) || [];
            const kelasInfo = kelasWithSantri.map(n => `${n.kelas}: Rp ${n.nominal.toLocaleString('id-ID')}`).join(', ') || 'Tidak ada santri ditemukan';
            return {
                tipe: 'Berdasarkan Kelas',
                detail: kelasInfo,
                showDetailList: true,
                kelasWithSantri
            };
        }
        else {
            const santriCount = tagihan.nominalPerIndividu?.length || 0;
            return {
                tipe: 'Santri Individu',
                detail: `${santriCount} santri terpilih`,
                showDetailList: false
            };
        }
    };
    const targetInfo = getTargetInfo();
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Preview Generate Tagihan" }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Tagihan: ", _jsx("strong", { children: tagihan.namaTagihan })] })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsx("div", { className: "bg-gray-50 rounded-lg p-4 space-y-2 text-sm", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Kategori:" }), " ", tagihan.kategori] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Tipe Nominal:" }), " ", targetInfo.tipe] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Bulan:" }), " ", tagihan.bulan.length, " bulan (", tagihan.bulan.slice(0, 3).join(', '), tagihan.bulan.length > 3 ? '...' : '', ")"] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Jatuh Tempo:" }), " ", tagihan.jatuhTempo] })] }) }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-blue-900 mb-2", children: "Target Generate" }), _jsxs("div", { className: "text-sm text-blue-800", children: [_jsxs("p", { children: ["\u2713 ", targetInfo.tipe] }), targetInfo.showDetailList && (targetInfo.kelasWithSantri?.length ?? 0) > 0 ? (_jsx("div", { className: "ml-4 mt-2 space-y-1", children: targetInfo.kelasWithSantri?.map((item, idx) => (_jsxs("div", { className: "flex justify-between items-center bg-white px-3 py-1.5 rounded", children: [_jsx("span", { className: "font-medium", children: item.kelas }), _jsxs("span", { className: "text-blue-900 font-semibold", children: ["Rp ", item.nominal.toLocaleString('id-ID')] })] }, idx))) })) : (_jsx("p", { className: "ml-4 text-xs mt-1", children: targetInfo.detail }))] })] }), tagihan.tipeNominal !== 'per_kelas' && (_jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-gray-900 mb-3", children: ["Daftar Santri (", daftarSantri.length, " Santri)"] }), _jsx("div", { className: "max-h-64 overflow-y-auto border rounded-lg", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left", children: "No" }), _jsx("th", { className: "px-4 py-2 text-left", children: "Nama Santri" }), _jsx("th", { className: "px-4 py-2 text-left", children: "Kelas" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Nominal/Bulan" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Jumlah Bulan" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Total Tagihan" })] }) }), _jsx("tbody", { className: "divide-y", children: daftarSantri.map((santri, idx) => {
                                                        const total = santri.nominal * tagihan.bulan.length;
                                                        return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2", children: idx + 1 }), _jsx("td", { className: "px-4 py-2 font-medium", children: santri.nama }), _jsx("td", { className: "px-4 py-2", children: santri.kelas }), _jsxs("td", { className: "px-4 py-2 text-right", children: ["Rp ", santri.nominal.toLocaleString('id-ID')] }), _jsx("td", { className: "px-4 py-2 text-right", children: tagihan.bulan.length }), _jsxs("td", { className: "px-4 py-2 text-right font-semibold", children: ["Rp ", total.toLocaleString('id-ID')] })] }, idx));
                                                    }) })] }) })] })), tagihan.tipeNominal === 'per_kelas' && tagihan.nominalPerKelas && (_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "Ringkasan Per Kelas" }), _jsx("div", { className: "border rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left", children: "Kelas" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Nominal/Bulan" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Jumlah Santri" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Jumlah Bulan" }), _jsx("th", { className: "px-4 py-2 text-right", children: "Total Tagihan" })] }) }), _jsx("tbody", { className: "divide-y", children: tagihan.nominalPerKelas
                                                        ?.filter(item => {
                                                        // Hanya tampilkan kelas yang punya santri
                                                        const jumlahSantri = santriList.filter(s => (s.kelas_nama || s.kelas?.nama_kelas) === item.kelas).length;
                                                        return jumlahSantri > 0;
                                                    })
                                                        .map((item, idx) => {
                                                        const jumlahSantri = santriList.filter(s => (s.kelas_nama || s.kelas?.nama_kelas) === item.kelas).length;
                                                        const totalPerKelas = item.nominal * tagihan.bulan.length * jumlahSantri;
                                                        return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2 font-medium", children: item.kelas }), _jsxs("td", { className: "px-4 py-2 text-right", children: ["Rp ", item.nominal.toLocaleString('id-ID')] }), _jsxs("td", { className: "px-4 py-2 text-right", children: [jumlahSantri, " santri"] }), _jsx("td", { className: "px-4 py-2 text-right", children: tagihan.bulan.length }), _jsxs("td", { className: "px-4 py-2 text-right font-semibold", children: ["Rp ", totalPerKelas.toLocaleString('id-ID')] })] }, idx));
                                                    }) })] }) })] })), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-green-900 mb-2", children: "Ringkasan Generate" }), _jsxs("div", { className: "text-sm text-green-800 space-y-1", children: [tagihan.tipeNominal === 'per_kelas' ? (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["\u2022 Total kelas: ", _jsxs("strong", { children: [tagihan.nominalPerKelas?.length || 0, " kelas"] })] }), _jsxs("p", { children: ["\u2022 Total santri: ", _jsxs("strong", { children: [daftarSantri.length, " santri"] })] }), _jsxs("p", { children: ["\u2022 Total bulan: ", _jsxs("strong", { children: [tagihan.bulan.length, " bulan"] })] }), _jsxs("p", { children: ["\u2022 Total tagihan yang akan dibuat: ", _jsxs("strong", { children: [totalTagihan, " tagihan"] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["\u2022 Total santri: ", _jsxs("strong", { children: [daftarSantri.length, " santri"] })] }), _jsxs("p", { children: ["\u2022 Total bulan: ", _jsxs("strong", { children: [tagihan.bulan.length, " bulan"] })] }), _jsxs("p", { children: ["\u2022 Total tagihan yang akan dibuat: ", _jsxs("strong", { children: [totalTagihan, " tagihan"] })] })] })), _jsxs("p", { children: ["\u2022 Buku Kas: ", _jsx("strong", { children: tagihan.bukuKas })] })] })] }), _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: [_jsxs("h3", { className: "font-semibold text-yellow-900 mb-2 flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }), "Catatan Penting - Tagihan Permanen"] }), _jsxs("div", { className: "text-sm text-yellow-800 space-y-2", children: [_jsxs("p", { children: ["\u2022 Tagihan yang sudah di-generate akan ", _jsx("strong", { children: "DISIMPAN PERMANEN" }), " dengan kelas & nominal saat generate"] }), _jsxs("p", { children: ["\u2022 Jika santri ", _jsx("strong", { children: "pindah kelas" }), ", tagihan lama ", _jsx("strong", { children: "TETAP TIDAK BERUBAH" })] }), _jsxs("p", { children: ["\u2022 Nominal tagihan selalu mengikuti kelas santri ", _jsx("strong", { children: "saat tagihan dibuat" }), ", tidak berubah meski santri pindah kelas kemudian"] }), _jsx("p", { className: "pt-1 italic text-yellow-700", children: "Contoh: Santri di kelas IXA bayar Rp 350.000 saat dibuat tagihan, jika pindah ke kelas X tahun depan, tagihan lama tetap Rp 350.000" })] })] })] }), _jsxs("div", { className: "p-6 border-t flex gap-3 justify-end", children: [_jsx("button", { onClick: onClose, className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Batal" }), _jsxs("button", { onClick: async () => {
                                    setIsGenerating(true);
                                    try {
                                        const response = await generateTagihanSantri(tagihan.id);
                                        setGeneratedCount(response.data.total_tagihan);
                                        setGeneratedSantri(response.data.total_santri);
                                        setShowSuccessModal(true);
                                    }
                                    catch (error) {
                                        console.error('Error generating:', error);
                                        const errorMessage = error.response?.data?.message || 'Gagal generate tagihan';
                                        toast.error(errorMessage);
                                    }
                                    finally {
                                        setIsGenerating(false);
                                    }
                                }, disabled: isGenerating, className: `px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`, children: [_jsx(Play, { className: "w-4 h-4" }), isGenerating ? 'Generating...' : 'Generate Tagihan Sekarang'] })] })] }), showSuccessModal && (_jsx(ModalSuccessGenerate, { totalTagihan: generatedCount, totalSantri: generatedSantri, onClose: () => {
                    setShowSuccessModal(false);
                    onClose();
                } }))] }));
}
