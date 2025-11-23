import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Search, Eye, DollarSign, Calendar, User, CheckCircle, XCircle, X, Plus } from 'lucide-react';
import { listTagihanSantri, createTunggakan } from '../../api/tagihanSantri';
import { listJenisTagihan } from '../../api/jenisTagihan';
import { listTahunAjaran } from '../../api/tahunAjaran';
import toast from 'react-hot-toast';
// Helper function untuk format nominal sesuai standar Indonesia
const formatRupiah = (nominal) => {
    const value = Number(nominal) || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};
export default function TagihanSantri() {
    const [dataTagihan, setDataTagihan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showTunggakanModal, setShowTunggakanModal] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState(null);
    // Fetch data dari API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await listTagihanSantri();
                const result = Array.isArray(response) ? response : (response?.data || []);
                setDataTagihan(result);
            }
            catch (error) {
                console.error('Error fetching tagihan:', error);
                toast.error('Gagal memuat data tagihan');
                setDataTagihan([]);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    const filteredData = dataTagihan.filter(item => item.santri_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kelas.toLowerCase().includes(searchTerm.toLowerCase()));
    const handleShowDetail = (santri) => {
        setSelectedSantri(santri);
        setShowDetailModal(true);
    };
    // Summary stats
    const totalTagihan = filteredData.reduce((sum, item) => sum + item.total_tagihan, 0);
    const totalDibayar = filteredData.reduce((sum, item) => sum + item.total_dibayar, 0);
    const totalSisa = filteredData.reduce((sum, item) => sum + item.sisa_tagihan, 0);
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Tagihan Santri" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Daftar rekap tagihan per santri" })] }), _jsxs("button", { onClick: () => setShowTunggakanModal(true), className: "inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium", children: [_jsx(Plus, { className: "w-4 h-4" }), "Tambah Tunggakan Manual"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-4 border-l-4 border-blue-500", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Tagihan" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatRupiah(totalTagihan) })] }), _jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx(DollarSign, { className: "w-6 h-6 text-blue-600" }) })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-4 border-l-4 border-green-500", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Sudah Dibayar" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatRupiah(totalDibayar) })] }), _jsx("div", { className: "w-12 h-12 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { className: "w-6 h-6 text-green-600" }) })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-4 border-l-4 border-red-500", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Sisa Tagihan" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatRupiah(totalSisa) })] }), _jsx("div", { className: "w-12 h-12 bg-red-100 rounded-full flex items-center justify-center", children: _jsx(XCircle, { className: "w-6 h-6 text-red-600" }) })] }) })] }), _jsx("div", { className: "bg-white rounded-lg shadow p-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Cari nama santri atau kelas...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "No" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Nama Santri" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Kelas" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase", children: "Total Tagihan" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase", children: "Total Dibayar" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase", children: "Sisa Tagihan" }), _jsx("th", { className: "px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase", children: "Aksi" })] }) }), _jsx("tbody", { className: "divide-y", children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-8 text-center text-gray-500", children: "Memuat data..." }) })) : filteredData.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-8 text-center text-gray-500", children: "Tidak ada data tagihan" }) })) : (filteredData.map((item, idx) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-gray-900", children: idx + 1 }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "font-medium text-gray-900", children: item.santri_nama })] }) }), _jsx("td", { className: "px-6 py-4 text-gray-600", children: item.kelas }), _jsx("td", { className: "px-6 py-4 text-right font-medium text-gray-900", children: formatRupiah(item.total_tagihan) }), _jsx("td", { className: "px-6 py-4 text-right text-green-600 font-medium", children: formatRupiah(item.total_dibayar) }), _jsx("td", { className: "px-6 py-4 text-right text-red-600 font-medium", children: formatRupiah(item.sisa_tagihan) }), _jsx("td", { className: "px-6 py-4 text-center", children: _jsxs("button", { onClick: () => handleShowDetail(item), className: "inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm", children: [_jsx(Eye, { className: "w-4 h-4" }), "Detail"] }) })] }, item.santri_id)))) })] }) }) }), showDetailModal && selectedSantri && (_jsx(ModalDetailTagihan, { santri: selectedSantri, onClose: () => {
                    setShowDetailModal(false);
                    setSelectedSantri(null);
                } })), showTunggakanModal && (_jsx(ModalTambahTunggakan, { dataTagihan: dataTagihan, onClose: () => setShowTunggakanModal(false), onSuccess: () => {
                    setShowTunggakanModal(false);
                    // Refresh data
                    const fetchData = async () => {
                        const response = await listTagihanSantri();
                        const result = Array.isArray(response) ? response : (response?.data || []);
                        setDataTagihan(result);
                    };
                    fetchData();
                } }))] }));
}
// Modal Detail Tagihan
function ModalDetailTagihan({ santri, onClose }) {
    const getStatusBadge = (status) => {
        const badges = {
            lunas: 'bg-green-100 text-green-800',
            sebagian: 'bg-yellow-100 text-yellow-800',
            belum_bayar: 'bg-red-100 text-red-800'
        };
        const labels = {
            lunas: 'Lunas',
            sebagian: 'Sebagian',
            belum_bayar: 'Belum Bayar'
        };
        return (_jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`, children: labels[status] }));
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col", children: [_jsxs("div", { className: "p-6 border-b flex justify-between items-center bg-blue-50", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Detail Tagihan Santri" }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4 text-gray-600" }), _jsx("span", { className: "font-medium text-gray-900", children: santri.santri_nama })] }), _jsx("div", { className: "text-gray-600", children: "\u2022" }), _jsxs("div", { className: "text-gray-600", children: ["Kelas: ", _jsx("span", { className: "font-medium", children: santri.kelas })] })] })] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "p-6 bg-gray-50 border-b", children: _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-white rounded-lg p-4 border", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Total Tagihan" }), _jsx("p", { className: "text-xl font-bold text-gray-900", children: formatRupiah(santri.total_tagihan) })] }), _jsxs("div", { className: "bg-white rounded-lg p-4 border border-green-200", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Total Dibayar" }), _jsx("p", { className: "text-xl font-bold text-green-600", children: formatRupiah(santri.total_dibayar) })] }), _jsxs("div", { className: "bg-white rounded-lg p-4 border border-red-200", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Sisa Tagihan" }), _jsx("p", { className: "text-xl font-bold text-red-600", children: formatRupiah(santri.sisa_tagihan) })] })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 sticky top-0", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "No" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Jenis Tagihan" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Periode" }), _jsx("th", { className: "px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase", children: "Nominal" }), _jsx("th", { className: "px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase", children: "Dibayar" }), _jsx("th", { className: "px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase", children: "Sisa" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase", children: "Status" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Jatuh Tempo" })] }) }), _jsx("tbody", { className: "divide-y", children: santri.detail_tagihan.map((detail, idx) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-3 text-gray-900", children: idx + 1 }), _jsx("td", { className: "px-4 py-3 font-medium text-gray-900", children: detail.jenis_tagihan }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-4 h-4" }), detail.bulan, " ", detail.tahun] }) }), _jsx("td", { className: "px-4 py-3 text-right font-medium text-gray-900", children: formatRupiah(detail.nominal) }), _jsx("td", { className: "px-4 py-3 text-right text-green-600 font-medium", children: formatRupiah(detail.dibayar) }), _jsx("td", { className: "px-4 py-3 text-right text-red-600 font-medium", children: formatRupiah(detail.sisa) }), _jsx("td", { className: "px-4 py-3 text-center", children: getStatusBadge(detail.status) }), _jsx("td", { className: "px-4 py-3 text-gray-600 text-sm", children: detail.jatuh_tempo })] }, detail.id))) })] }) }), _jsx("div", { className: "p-6 border-t bg-gray-50", children: _jsx("button", { onClick: onClose, className: "w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium", children: "Tutup" }) })] }) }));
}
// Modal Tambah Tunggakan Manual
function ModalTambahTunggakan({ dataTagihan, onClose, onSuccess }) {
    console.log('=== ModalTambahTunggakan Mounted ===');
    console.log('dataTagihan:', dataTagihan);
    console.log('dataTagihan[0]:', dataTagihan[0]);
    const [jenisTagihan, setJenisTagihan] = useState([]);
    const [loadingJenis, setLoadingJenis] = useState(false);
    const [tahunAjaranAktif, setTahunAjaranAktif] = useState(null);
    const [rows, setRows] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const bulanList = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    // Debug: watch rows changes
    useEffect(() => {
        console.log('=== ROWS STATE CHANGED ===');
        rows.forEach((row, idx) => {
            console.log(`Row ${idx}:`, {
                id: row.id,
                santri_id: row.santri_id,
                santri_nama: row.santri_nama,
                kelas: row.kelas,
                jenis_tagihan_id: row.jenis_tagihan_id,
                bulan: row.bulan,
                nominal: row.nominal
            });
        });
        console.log('=== END ROWS ===');
    }, [rows]);
    // Fetch jenis tagihan dan tahun ajaran aktif
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingJenis(true);
                // Fetch jenis tagihan
                const resJenis = await listJenisTagihan();
                console.log('Jenis Tagihan Response:', resJenis); // DEBUG
                let data = [];
                if (Array.isArray(resJenis)) {
                    data = resJenis;
                }
                else if (resJenis?.data && Array.isArray(resJenis.data)) {
                    data = resJenis.data;
                }
                else if (resJenis?.data) {
                    data = [resJenis.data];
                }
                console.log('Jenis Tagihan Data:', data); // DEBUG
                setJenisTagihan(data);
                // Fetch tahun ajaran aktif
                const resTahun = await listTahunAjaran();
                const tahunData = Array.isArray(resTahun) ? resTahun : (resTahun?.data || []);
                const aktif = tahunData.find((t) => t.status === 'aktif');
                console.log('Tahun Ajaran Aktif:', aktif); // DEBUG
                setTahunAjaranAktif(aktif);
            }
            catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Gagal memuat data');
            }
            finally {
                setLoadingJenis(false);
            }
        };
        fetchData();
    }, []);
    // Helper: bulan yang tersedia = bulan di jenis tagihan MINUS bulan yang sudah dimiliki santri untuk jenis tersebut
    const getAvailableBulan = (santri_id, jenistagihanId) => {
        if (!santri_id || !jenistagihanId || !tahunAjaranAktif) {
            console.log('Missing data:', { santri_id, jenistagihanId, tahunAjaranAktif });
            return [];
        }
        // Jenis tagihan terpilih
        const jenisTerpilih = jenisTagihan.find(j => {
            const jId = j?.id || j?.ID || j?.jenis_tagihan_id;
            return jId === jenistagihanId;
        });
        if (!jenisTerpilih)
            return [];
        // Nama jenis untuk membandingkan dengan detail_tagihan (detail menyimpan nama, bukan ID)
        const jenisNama = jenisTerpilih?.nama_tagihan || jenisTerpilih?.namaTagihan || '';
        // Bulan yang dicentang saat membuat jenis tagihan
        const bulanRaw = jenisTerpilih?.bulan;
        let bulanDiCeklist = [];
        if (Array.isArray(bulanRaw)) {
            bulanDiCeklist = bulanRaw;
        }
        else if (typeof bulanRaw === 'string') {
            try {
                const parsed = JSON.parse(bulanRaw);
                bulanDiCeklist = Array.isArray(parsed) ? parsed : bulanRaw.split(',').map((b) => b.trim());
            }
            catch {
                bulanDiCeklist = bulanRaw.split(',').map((b) => b.trim());
            }
        }
        // Tahun ajaran aktif
        const tahunMulai = tahunAjaranAktif.tahun_mulai || 2025;
        const tahunSelesai = tahunAjaranAktif.tahun_akhir || 2026;
        // Peta bulan -> tahun sesuai tahun ajaran
        const bulanToYear = (bulan) => {
            const p = {
                'Juli': tahunMulai,
                'Agustus': tahunMulai,
                'September': tahunMulai,
                'Oktober': tahunMulai,
                'November': tahunMulai,
                'Desember': tahunMulai,
                'Januari': tahunSelesai,
                'Februari': tahunSelesai,
                'Maret': tahunSelesai,
                'April': tahunSelesai,
                'Mei': tahunSelesai,
                'Juni': tahunSelesai,
            };
            return p[bulan] ?? tahunMulai;
        };
        // Ambil detail tagihan santri untuk mengetahui bulan yang sudah ada bagi jenis tersebut
        const santriData = dataTagihan.find(d => String(d.santri_id) === String(santri_id));
        const existingPairs = new Set();
        if (santriData && Array.isArray(santriData.detail_tagihan)) {
            santriData.detail_tagihan
                .filter(dt => dt.jenis_tagihan === jenisNama)
                .forEach(dt => {
                existingPairs.add(`${dt.bulan}-${dt.tahun}`);
            });
        }
        // Bulan yang tersedia = semua bulan yang di-ceklist, dikonversi ke pasangan bulan-tahun, lalu eksklusi yang sudah ada
        const available = bulanDiCeklist
            .map(b => ({ bulan: b, tahun: bulanToYear(b) }))
            .filter(pair => !existingPairs.has(`${pair.bulan}-${pair.tahun}`));
        return available;
    };
    // Helper: get nominal based on tipe_nominal
    const getNominalDefault = (jenistagihanId, santriKelas) => {
        const jenisTerpilih = jenisTagihan.find(j => {
            const jId = j?.id || j?.ID || j?.jenis_tagihan_id;
            return jId === jenistagihanId;
        });
        if (!jenisTerpilih)
            return 0;
        const tipeNominal = jenisTerpilih?.tipe_nominal || jenisTerpilih?.tipeNominal;
        // Jika sama untuk semua
        if (tipeNominal === 'sama') {
            return jenisTerpilih?.nominal_sama || jenisTerpilih?.nominalSama || 0;
        }
        // Jika per kelas
        if (tipeNominal === 'per_kelas') {
            const nominalPerKelas = jenisTerpilih?.nominal_per_kelas || jenisTerpilih?.nominalPerKelas || [];
            const kelasData = nominalPerKelas.find((k) => k.kelas === santriKelas);
            return kelasData?.nominal || 0;
        }
        // Jika per individu, return 0 (user harus input manual)
        return 0;
    };
    const addRow = () => {
        const newRow = {
            id: Date.now().toString(),
            santri_index: -1,
            santri_id: '',
            santri_nama: '',
            kelas: '',
            jenis_tagihan_id: 0,
            jenis_tagihan_nama: '',
            bulan: [], // Empty array for multiple months
            tahun: 2025,
            nominal: 0
        };
        setRows([...rows, newRow]);
    };
    const removeRow = (id) => {
        setRows(rows.filter(row => row.id !== id));
    };
    const updateRow = (id, field, value) => {
        console.log('=== updateRow START ===');
        console.log('Field being updated:', field, 'Value:', value);
        setRows(prevRows => {
            const newRows = prevRows.map(row => {
                if (row.id === id) {
                    if (field === 'santri_index') {
                        const index = parseInt(value);
                        console.log('Santri index selected:', index);
                        if (index < 0 || index >= dataTagihan.length) {
                            console.error('Invalid index:', index);
                            return row;
                        }
                        const santri = dataTagihan[index];
                        console.log('✅ Santri found by index:', santri);
                        const updated = {
                            ...row,
                            santri_index: index,
                            santri_id: String(santri.santri_id),
                            santri_nama: santri.santri_nama,
                            kelas: santri.kelas,
                            bulan: [],
                            tahun: 2025,
                            nominal: 0
                        };
                        console.log('Updated row:', updated);
                        return updated;
                    }
                    else if (field === 'jenis_tagihan_id') {
                        const jenis = jenisTagihan.find(j => {
                            const jId = j?.id || j?.ID || j?.jenis_tagihan_id;
                            return jId == value; // Use == instead of ===
                        });
                        if (!jenis) {
                            console.error('JENIS TAGIHAN NOT FOUND for ID:', value);
                            return row;
                        }
                        const nominalDefault = getNominalDefault(value, row.kelas);
                        const tipeNominal = jenis?.tipe_nominal || jenis?.tipeNominal;
                        console.log('Jenis found:', jenis, 'Nominal default:', nominalDefault); // DEBUG
                        return {
                            ...row,
                            jenis_tagihan_id: Number(value),
                            jenis_tagihan_nama: jenis?.nama_tagihan || jenis?.namaTagihan || '',
                            // Reset bulan ketika jenis tagihan berubah
                            bulan: [],
                            tahun: 2025,
                            // Set nominal default kecuali jika per_individu
                            nominal: tipeNominal === 'per_individu' ? 0 : nominalDefault
                        };
                    }
                    else if (field === 'bulan') {
                        // Toggle bulan in array
                        const currentBulan = Array.isArray(row.bulan) ? row.bulan : [];
                        const bulanValue = value;
                        let newBulan;
                        if (currentBulan.includes(bulanValue)) {
                            // Remove if already selected
                            newBulan = currentBulan.filter(b => b !== bulanValue);
                        }
                        else {
                            // Add if not selected
                            newBulan = [...currentBulan, bulanValue];
                        }
                        console.log('Bulan toggled:', bulanValue, 'New selection:', newBulan);
                        return {
                            ...row,
                            bulan: newBulan
                        };
                    }
                    return { ...row, [field]: value };
                }
                return row;
            });
            console.log('New rows state:', newRows); // DEBUG
            return newRows;
        });
    };
    const handleSubmit = async () => {
        // Validasi
        if (rows.length === 0) {
            toast.error('Tambahkan minimal satu tagihan');
            return;
        }
        // Validasi lebih detail
        const invalidRows = rows.filter(row => !row.santri_id ||
            row.santri_id === '' ||
            !row.jenis_tagihan_id ||
            row.jenis_tagihan_id === 0 ||
            !Array.isArray(row.bulan) ||
            row.bulan.length === 0 ||
            !row.nominal ||
            row.nominal === 0);
        if (invalidRows.length > 0) {
            console.error('Invalid rows:', invalidRows);
            toast.error('Harap isi semua field dengan lengkap dan pilih minimal 1 bulan');
            return;
        }
        try {
            setIsSubmitting(true);
            // Expand rows with multiple months into individual payloads
            const payload = [];
            rows.forEach(row => {
                row.bulan.forEach(bulan => {
                    // Note: santri_id is UUID (string) — do NOT cast to Number
                    payload.push({
                        santri_id: String(row.santri_id),
                        jenis_tagihan_id: Number(row.jenis_tagihan_id),
                        bulan: bulan,
                        nominal: Number(row.nominal)
                    });
                });
            });
            console.log('Payload to send:', payload); // DEBUG
            console.log(`Total tagihan: ${payload.length} (dari ${rows.length} row)`);
            const res = await createTunggakan(payload);
            toast.success(res.message || `${payload.length} tunggakan berhasil ditambahkan`);
            onSuccess();
        }
        catch (error) {
            console.error('Error submit:', error);
            console.error('Error response:', error.response?.data);
            // Show validation details if available
            const errData = error.response?.data;
            if (errData?.errors) {
                const messages = [];
                Object.entries(errData.errors).forEach(([field, msgs]) => {
                    const arr = Array.isArray(msgs) ? msgs : [msgs];
                    messages.push(`${field}: ${arr.join(', ')}`);
                });
                toast.error(errData.message + '\n' + messages.join('\n'));
            }
            else {
                toast.error(errData?.message || 'Gagal menyimpan tunggakan');
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col", children: [_jsxs("div", { className: "p-6 border-b", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Tambah Tunggakan Manual" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Input tunggakan tagihan dari bulan-bulan sebelumnya" })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: _jsx("div", { className: "space-y-4", children: rows.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: _jsx("p", { children: "Belum ada data. Klik \"Tambah Row\" untuk menambahkan tunggakan" }) })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm border-collapse", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left border", children: "No" }), _jsx("th", { className: "px-3 py-2 text-left border", children: "Nama Santri" }), _jsx("th", { className: "px-3 py-2 text-left border", children: "Jenis Tagihan" }), _jsx("th", { className: "px-3 py-2 text-left border", children: "Bulan" }), _jsx("th", { className: "px-3 py-2 text-right border", children: "Nominal" }), _jsx("th", { className: "px-3 py-2 text-center border w-12", children: "Aksi" })] }) }), _jsx("tbody", { children: rows.map((row, idx) => {
                                            console.log(`Row ${idx}:`, row); // DEBUG
                                            return (_jsxs("tr", { className: "border-b", children: [_jsx("td", { className: "px-3 py-2 border text-center", children: idx + 1 }), _jsx("td", { className: "px-3 py-2 border", children: _jsxs("div", { className: "space-y-1", children: [_jsxs("select", { value: row.santri_index, onChange: (e) => {
                                                                        const index = parseInt(e.target.value, 10);
                                                                        console.log('onChange - Santri index selected:', index);
                                                                        if (!isNaN(index) && index >= 0) {
                                                                            updateRow(row.id, 'santri_index', index);
                                                                        }
                                                                    }, className: "w-full px-2 py-1 border rounded text-sm", children: [_jsx("option", { value: -1, children: "-- Pilih Santri --" }), dataTagihan.map((s, index) => (_jsxs("option", { value: index, children: [s.santri_nama, " (", s.kelas, ")"] }, index)))] }), row.santri_id && row.santri_nama && (_jsxs("div", { className: "text-xs text-green-600 font-medium", children: ["\u2713 ", row.santri_nama, " - ", row.kelas] }))] }) }), _jsx("td", { className: "px-3 py-2 border", children: _jsxs("select", { value: row.jenis_tagihan_id, onChange: (e) => {
                                                                const val = parseInt(e.target.value, 10);
                                                                if (!isNaN(val)) {
                                                                    console.log('Jenis Tagihan selected:', val);
                                                                    updateRow(row.id, 'jenis_tagihan_id', val);
                                                                }
                                                            }, className: "w-full px-2 py-1 border rounded text-sm", disabled: loadingJenis || jenisTagihan.length === 0, children: [_jsx("option", { value: 0, children: "-- Pilih Jenis --" }), jenisTagihan.length > 0 ? (jenisTagihan.map(j => {
                                                                    const jId = j?.id || j?.ID || j?.jenis_tagihan_id;
                                                                    const jNama = j?.nama_tagihan || j?.namaTagihan || j?.name || 'Unknown';
                                                                    return (_jsx("option", { value: jId, children: jNama }, jId));
                                                                })) : (_jsx("option", { disabled: true, children: "Loading..." }))] }) }), _jsx("td", { className: "px-3 py-2 border", children: _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-xs font-medium text-gray-700", children: "Pilih Bulan (bisa lebih dari 1):" }), _jsx("div", { className: "max-h-40 overflow-y-auto border rounded p-2 bg-gray-50", children: !row.santri_id || !row.jenis_tagihan_id ? (_jsx("div", { className: "text-xs text-gray-500 italic", children: "Pilih santri dan jenis tagihan terlebih dahulu" })) : (_jsx("div", { className: "grid grid-cols-2 gap-1", children: getAvailableBulan(row.santri_id, row.jenis_tagihan_id).map(b => {
                                                                            const isSelected = Array.isArray(row.bulan) && row.bulan.includes(b.bulan);
                                                                            return (_jsxs("label", { className: `flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-100'} border`, children: [_jsx("input", { type: "checkbox", checked: isSelected, onChange: () => updateRow(row.id, 'bulan', b.bulan), className: "w-3 h-3" }), _jsxs("span", { children: [b.bulan, " ", b.tahun] })] }, `${b.bulan}-${b.tahun}`));
                                                                        }) })) }), Array.isArray(row.bulan) && row.bulan.length > 0 && (_jsxs("div", { className: "text-xs text-green-600 font-medium", children: ["\u2713 ", row.bulan.length, " bulan dipilih: ", row.bulan.join(', ')] }))] }) }), _jsx("td", { className: "px-3 py-2 border", children: _jsx("input", { type: "number", value: row.nominal, onChange: (e) => updateRow(row.id, 'nominal', Number(e.target.value)), className: "w-full px-2 py-1 border rounded text-sm text-right", placeholder: "0", disabled: (() => {
                                                                const jenis = jenisTagihan.find(j => {
                                                                    const jId = j?.id || j?.ID || j?.jenis_tagihan_id;
                                                                    return jId === row.jenis_tagihan_id;
                                                                });
                                                                const tipeNominal = jenis?.tipe_nominal || jenis?.tipeNominal;
                                                                return tipeNominal !== 'per_individu';
                                                            })() }) }), _jsx("td", { className: "px-3 py-2 border text-center", children: _jsx("button", { onClick: () => removeRow(row.id), className: "text-red-600 hover:text-red-800 text-sm font-medium", children: "Hapus" }) })] }, `${row.id}-${row.santri_id}`));
                                        }) })] }) })) }) }), _jsx("div", { className: "p-6 border-t bg-gray-50", children: _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: addRow, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium", children: "+ Tambah Row" }), _jsx("button", { onClick: onClose, className: "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium", children: "Batal" }), _jsx("button", { onClick: handleSubmit, disabled: isSubmitting || rows.length === 0, className: "flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-50", children: isSubmitting ? 'Menyimpan...' : 'Simpan Semua' })] }) })] }) }));
}
