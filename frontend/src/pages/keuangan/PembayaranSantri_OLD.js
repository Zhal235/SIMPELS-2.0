import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Search, User, Home, Building2, Phone, Users, CheckCircle, X, Printer } from 'lucide-react';
import { listSantri } from '@/api/santri';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
export default function PembayaranSantri() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [santriList, setSantriList] = useState([]);
    const [loadingSantri, setLoadingSantri] = useState(false);
    const [activeTab, setActiveTab] = useState('rutin');
    const [selectedTagihan, setSelectedTagihan] = useState([]);
    const [showModalLunas, setShowModalLunas] = useState(false);
    const [showModalSebagian, setShowModalSebagian] = useState(false);
    const [tagihan, setTagihan] = useState([]);
    const [kwitansiData, setKwitansiData] = useState(null);
    const [showKwitansi, setShowKwitansi] = useState(false);
    // Get current user from auth store
    const user = useAuthStore((state) => state.user);
    // Initialize tagihan
    useEffect(() => {
        // Set jatuh tempo untuk tagihan
        // Rutin: Jatuh tempo setiap bulan tanggal 10
        // Non-Rutin: Jatuh tempo berbeda-beda
        // Mix: Belum bayar, sudah bayar, sebagian bayar
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        setTagihan([
            // ===== TAGIHAN RUTIN - BELUM JATUH TEMPO - BELUM BAYAR =====
            {
                id: 1,
                bulan: 'November',
                tahun: '2025',
                jenisTagihan: 'SPP',
                nominal: 500000,
                tipe: 'rutin',
                status: 'belum',
                tglJatuhTempo: `${year}-${String(month + 1).padStart(2, '0')}-15` // Besok
            },
            {
                id: 2,
                bulan: 'November',
                tahun: '2025',
                jenisTagihan: 'Makan',
                nominal: 300000,
                tipe: 'rutin',
                status: 'belum',
                tglJatuhTempo: `${year}-${String(month + 1).padStart(2, '0')}-15` // Besok
            },
            // ===== TAGIHAN RUTIN - BELUM JATUH TEMPO - SUDAH BAYAR =====
            {
                id: 3,
                bulan: 'Oktober',
                tahun: '2025',
                jenisTagihan: 'SPP',
                nominal: 500000,
                tipe: 'rutin',
                status: 'lunas',
                tglJatuhTempo: '2025-10-15',
                tglBayar: '2025-10-12',
                adminPenerima: 'Rhezal Maulana'
            },
            {
                id: 4,
                bulan: 'Oktober',
                tahun: '2025',
                jenisTagihan: 'Makan',
                nominal: 300000,
                tipe: 'rutin',
                status: 'lunas',
                tglJatuhTempo: '2025-10-15',
                tglBayar: '2025-10-12',
                adminPenerima: 'Rhezal Maulana'
            },
            // ===== TAGIHAN RUTIN - BELUM JATUH TEMPO - SEBAGIAN BAYAR =====
            {
                id: 5,
                bulan: 'September',
                tahun: '2025',
                jenisTagihan: 'SPP',
                nominal: 300000,
                jumlahBayar: 300000,
                tipe: 'rutin',
                status: 'lunas',
                sisaBayar: 0,
                tglJatuhTempo: '2025-09-15',
                tglBayar: '2025-09-10',
                adminPenerima: 'Rhezal Maulana'
            },
            {
                id: '5-remaining-spp-sep',
                bulan: 'September',
                tahun: '2025',
                jenisTagihan: 'SPP',
                nominal: 200000,
                jumlahBayar: 0,
                tipe: 'rutin',
                status: 'sebagian',
                sisaBayar: 200000,
                tglJatuhTempo: '2025-09-15'
            },
            {
                id: 6,
                bulan: 'September',
                tahun: '2025',
                jenisTagihan: 'Makan',
                nominal: 300000,
                tipe: 'rutin',
                status: 'lunas',
                tglJatuhTempo: '2025-09-15',
                tglBayar: '2025-09-11',
                adminPenerima: 'Rhezal Maulana'
            },
            // ===== TAGIHAN NON-RUTIN - BELUM JATUH TEMPO - BELUM BAYAR =====
            {
                id: 7,
                bulan: 'November',
                tahun: '2025',
                jenisTagihan: 'Seragam',
                nominal: 750000,
                tipe: 'non-rutin',
                status: 'belum',
                tglJatuhTempo: `${year}-${String(month + 1).padStart(2, '0')}-20`
            },
            {
                id: 8,
                bulan: 'November',
                tahun: '2025',
                jenisTagihan: 'Buku Paket',
                nominal: 450000,
                tipe: 'non-rutin',
                status: 'belum',
                tglJatuhTempo: `${year}-${String(month + 1).padStart(2, '0')}-20`
            },
            // ===== TAGIHAN NON-RUTIN - BELUM JATUH TEMPO - SUDAH BAYAR =====
            {
                id: 9,
                bulan: 'Oktober',
                tahun: '2025',
                jenisTagihan: 'Perlengkapan Lab',
                nominal: 600000,
                tipe: 'non-rutin',
                status: 'lunas',
                tglJatuhTempo: '2025-10-20',
                tglBayar: '2025-10-15',
                adminPenerima: 'Rhezal Maulana'
            },
            // ===== TAGIHAN NON-RUTIN - BELUM JATUH TEMPO - SEBAGIAN BAYAR =====
            {
                id: 10,
                bulan: 'Oktober',
                tahun: '2025',
                jenisTagihan: 'Wisata Edukatif',
                nominal: 500000,
                jumlahBayar: 500000,
                tipe: 'non-rutin',
                status: 'lunas',
                sisaBayar: 0,
                tglJatuhTempo: '2025-10-25',
                tglBayar: '2025-10-22',
                adminPenerima: 'Rhezal Maulana'
            },
            {
                id: '10-remaining-wisata',
                bulan: 'Oktober',
                tahun: '2025',
                jenisTagihan: 'Wisata Edukatif',
                nominal: 300000,
                jumlahBayar: 0,
                tipe: 'non-rutin',
                status: 'sebagian',
                sisaBayar: 300000,
                tglJatuhTempo: '2025-10-25'
            },
            // ===== TAGIHAN RUTIN YANG SUDAH JATUH TEMPO - BELUM BAYAR =====
            {
                id: 11,
                bulan: 'Agustus',
                tahun: '2025',
                jenisTagihan: 'SPP',
                nominal: 500000,
                tipe: 'rutin',
                status: 'belum',
                tglJatuhTempo: '2025-08-15'
            },
            {
                id: 12,
                bulan: 'Agustus',
                tahun: '2025',
                jenisTagihan: 'Makan',
                nominal: 300000,
                tipe: 'rutin',
                status: 'belum',
                tglJatuhTempo: '2025-08-15'
            },
            // ===== TAGIHAN NON-RUTIN YANG SUDAH JATUH TEMPO - SEBAGIAN BAYAR =====
            {
                id: 13,
                bulan: 'Juli',
                tahun: '2025',
                jenisTagihan: 'Asuransi',
                nominal: 800000,
                jumlahBayar: 400000,
                tipe: 'non-rutin',
                status: 'lunas',
                sisaBayar: 0,
                tglJatuhTempo: '2025-07-15',
                tglBayar: '2025-07-10',
                adminPenerima: 'Rhezal Maulana'
            },
            {
                id: '13-remaining-asuransi',
                bulan: 'Juli',
                tahun: '2025',
                jenisTagihan: 'Asuransi',
                nominal: 400000,
                jumlahBayar: 0,
                tipe: 'non-rutin',
                status: 'sebagian',
                sisaBayar: 400000,
                tglJatuhTempo: '2025-07-15'
            },
        ]);
    }, []);
    // Fetch santri from API
    useEffect(() => {
        const fetchSantri = async () => {
            try {
                setLoadingSantri(true);
                const res = await listSantri(1, 100); // Fetch 100 santri untuk search
                let santriData = Array.isArray(res) ? res : (res?.data ? res.data : []);
                setSantriList(santriData);
            }
            catch (error) {
                console.error('Error fetching santri:', error);
                toast.error('Gagal memuat data santri');
            }
            finally {
                setLoadingSantri(false);
            }
        };
        fetchSantri();
    }, []);
    // Filter santri berdasarkan search query
    const getFilteredSantri = () => {
        if (searchQuery.length < 2)
            return [];
        const query = searchQuery.toLowerCase();
        return santriList.filter(s => (s.nama_santri && s.nama_santri.toLowerCase().includes(query)) ||
            (s.nis && s.nis.toLowerCase().includes(query)) ||
            (s.nisn && s.nisn.toLowerCase().includes(query)));
    };
    const getFotoUrl = (santri) => {
        if (santri.foto) {
            // Check if foto is a URL or file path
            if (santri.foto.startsWith('http')) {
                return santri.foto;
            }
            // Construct URL from API if it's a file path
            return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${santri.foto}`;
        }
        // Fallback to avatar
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${santri.nama_santri}`;
    };
    // Helper untuk mendapatkan nama orang tua
    const getNamaOrtuString = (santri) => {
        const ayah = santri.orang_tua?.nama_ayah || santri.nama_ayah || '';
        const ibu = santri.orang_tua?.nama_ibu || santri.nama_ibu || '';
        if (ayah && ibu)
            return `${ayah} / ${ibu}`;
        if (ayah)
            return ayah;
        if (ibu)
            return ibu;
        return 'N/A';
    };
    // Helper untuk mendapatkan nomor HP
    const getNoHpString = (santri) => {
        const hpAyah = santri.orang_tua?.hp_ayah || santri.hp_ayah || '';
        const hpIbu = santri.orang_tua?.hp_ibu || santri.hp_ibu || '';
        if (hpAyah && hpIbu)
            return `${hpAyah} / ${hpIbu}`;
        if (hpAyah)
            return hpAyah;
        if (hpIbu)
            return hpIbu;
        return 'N/A';
    };
    const handleSelectSantri = (santri) => {
        setSelectedSantri(santri);
        setSearchQuery(santri.nama_santri);
        setShowSearchResults(false);
        setSelectedTagihan([]);
    };
    const handleClearSearch = () => {
        setSearchQuery('');
        setSelectedSantri(null);
        setShowSearchResults(false);
        setSelectedTagihan([]);
    };
    const toggleTagihan = (id) => {
        const idStr = String(id);
        setSelectedTagihan(prev => prev.includes(idStr) ? prev.filter(t => String(t) !== idStr) : [...prev, idStr]);
    };
    // Helper untuk deteksi apakah tagihan sudah lewat jatuh tempo
    const isOverdue = (tglJatuhTempo) => {
        if (!tglJatuhTempo)
            return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set ke midnight untuk membandingkan tanggal saja
        const dueDate = new Date(tglJatuhTempo);
        dueDate.setHours(0, 0, 0, 0);
        return today > dueDate;
    };
    const getTotalSelected = () => {
        return tagihan
            .filter(t => {
            const tIdStr = String(t.id);
            // Exact match only - no partial matching
            return selectedTagihan.includes(tIdStr);
        })
            .reduce((sum, t) => sum + t.nominal, 0);
    };
    const getFilteredTagihan = () => {
        if (activeTab === 'rutin') {
            // Tagihan rutin yang belum bayar/sebagian dan belum lewat jatuh tempo
            return tagihan.filter(t => t.tipe === 'rutin' &&
                (t.status === 'belum' || t.status === 'sebagian') &&
                !isOverdue(t.tglJatuhTempo));
        }
        if (activeTab === 'non-rutin') {
            // Tagihan non-rutin yang belum bayar/sebagian dan belum lewat jatuh tempo
            return tagihan.filter(t => t.tipe === 'non-rutin' &&
                (t.status === 'belum' || t.status === 'sebagian') &&
                !isOverdue(t.tglJatuhTempo));
        }
        if (activeTab === 'tunggakan') {
            // Tunggakan: tagihan yang SUDAH lewat jatuh tempo (baik belum bayar maupun sebagian)
            return tagihan.filter(t => t.status !== 'lunas' && isOverdue(t.tglJatuhTempo));
        }
        if (activeTab === 'lunas') {
            // Tagihan yang sudah lunas
            return tagihan.filter(t => t.status === 'lunas');
        }
        return [];
    };
    // Group tagihan by bulan and tahun
    const getGroupedTagihan = () => {
        const filtered = getFilteredTagihan();
        const grouped = {};
        filtered.forEach(t => {
            const key = `${t.bulan}-${t.tahun}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(t);
        });
        return Object.entries(grouped).map(([key, items]) => {
            const [bulan, tahun] = key.split('-');
            return { bulan, tahun, items };
        });
    };
    const updateTagihanStatus = (ids, newStatus, tglBayar, paymentDetails) => {
        const today = new Date().toLocaleDateString('id-ID');
        const adminName = user?.name || 'Admin System';
        const idStrings = ids.map(id => String(id));
        setTagihan(prev => {
            let updated = [...prev];
            idStrings.forEach(idStr => {
                const index = updated.findIndex(t => String(t.id) === idStr);
                if (index !== -1) {
                    const tagihan = updated[index];
                    if (newStatus === 'sebagian' && paymentDetails && paymentDetails[idStr]) {
                        // Split tagihan: yang dibayar dan sisanya
                        const jumlahBayar = paymentDetails[idStr];
                        const sisaBayar = tagihan.nominal - jumlahBayar;
                        // Tagihan yang dibayar (status: lunas)
                        const paidTagihan = {
                            ...tagihan,
                            nominal: jumlahBayar,
                            jumlahBayar: jumlahBayar,
                            status: 'lunas',
                            sisaBayar: undefined,
                            tglBayar: tglBayar || today,
                            adminPenerima: adminName,
                            originalId: tagihan.id,
                            id: `${tagihan.id}-paid-${Date.now()}`, // Unique ID untuk tagihan yang dibayar
                        };
                        // Tagihan sisa (status: sebagian)
                        const remainingTagihan = {
                            ...tagihan,
                            nominal: sisaBayar,
                            jumlahBayar: 0,
                            status: 'sebagian',
                            sisaBayar: sisaBayar,
                            tglBayar: undefined,
                            adminPenerima: undefined,
                            originalId: tagihan.id,
                            id: `${tagihan.id}-remaining-${Date.now()}`, // Unique ID untuk sisa tagihan
                        };
                        // Remove original, add paid dan remaining
                        updated.splice(index, 1, remainingTagihan, paidTagihan);
                    }
                    else if (newStatus === 'lunas') {
                        // Bayar lunas: ubah status langsung
                        updated[index] = {
                            ...tagihan,
                            status: 'lunas',
                            jumlahBayar: tagihan.nominal,
                            tglBayar: tglBayar || today,
                            adminPenerima: adminName,
                            sisaBayar: undefined,
                        };
                    }
                }
            });
            return updated;
        });
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Pembayaran Santri" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Kelola pembayaran santri" })] }), _jsx("div", { className: "w-96", children: _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", placeholder: "Cari nama santri atau NIS...", value: searchQuery, onChange: (e) => {
                                                setSearchQuery(e.target.value);
                                                setShowSearchResults(e.target.value.length >= 2);
                                            }, onFocus: () => searchQuery.length >= 2 && setShowSearchResults(true), className: "w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsx(Search, { className: "absolute left-3 top-2.5 h-5 w-5 text-gray-400" }), searchQuery && (_jsx("button", { onClick: handleClearSearch, className: "absolute right-3 top-2.5 text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "h-5 w-5" }) }))] }), showSearchResults && getFilteredSantri().length > 0 && (_jsx("div", { className: "absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto", children: getFilteredSantri().map((santri) => (_jsxs("button", { onClick: () => handleSelectSantri(santri), className: "w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-3", children: [_jsx("img", { src: getFotoUrl(santri), alt: santri.nama_santri, className: "w-10 h-10 rounded-full object-cover" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-gray-900 truncate", children: santri.nama_santri }), _jsxs("p", { className: "text-xs text-gray-500", children: ["NIS: ", santri.nis, " \u2022 ", santri.kelas || 'N/A'] })] })] }, santri.id))) })), showSearchResults && searchQuery.length >= 2 && getFilteredSantri().length === 0 && (_jsx("div", { className: "absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center", children: _jsx("p", { className: "text-gray-500 text-sm", children: "Santri tidak ditemukan" }) }))] }) })] }), selectedSantri ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6 mb-6", children: _jsxs("div", { className: "flex items-start gap-6", children: [_jsx("img", { src: getFotoUrl(selectedSantri), alt: selectedSantri.nama_santri, className: "w-24 h-24 rounded-lg object-cover border-2 border-gray-200" }), _jsxs("div", { className: "flex-1 grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(User, { className: "w-5 h-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Nama Santri" }), _jsx("p", { className: "font-semibold text-gray-900", children: selectedSantri.nama_santri })] })] }), _jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Building2, { className: "w-5 h-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Kelas" }), _jsx("p", { className: "font-semibold text-gray-900", children: selectedSantri.kelas || 'N/A' })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Home, { className: "w-5 h-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Asrama" }), _jsx("p", { className: "font-semibold text-gray-900", children: selectedSantri.asrama || 'N/A' })] })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Users, { className: "w-5 h-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Nama Orang Tua" }), _jsx("p", { className: "font-semibold text-gray-900 text-sm", children: getNamaOrtuString(selectedSantri) })] })] }), _jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Phone, { className: "w-5 h-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "No. HP" }), _jsx("p", { className: "font-semibold text-gray-900 text-sm", children: getNoHpString(selectedSantri) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Home, { className: "w-5 h-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Alamat" }), _jsx("p", { className: "font-semibold text-gray-900 text-sm", children: selectedSantri.alamat || 'N/A' })] })] })] })] })] }) }), selectedTagihan.length > 0 && (_jsx("div", { className: "bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-4 mb-6 border border-blue-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm text-gray-600 mb-1", children: ["Total yang dipilih (", selectedTagihan.length, " tagihan)"] }), _jsxs("p", { className: "text-2xl font-bold text-blue-600", children: ["Rp ", getTotalSelected().toLocaleString('id-ID')] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setShowModalSebagian(true), className: "px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium", children: "Bayar Sebagian" }), _jsx("button", { onClick: () => setShowModalLunas(true), className: "px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium", children: "Bayar Lunas" })] })] }) })), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("div", { className: "flex", children: [
                                        { key: 'rutin', label: 'Tagihan Rutin' },
                                        { key: 'non-rutin', label: 'Tagihan Non Rutin' },
                                        { key: 'tunggakan', label: 'Tunggakan' },
                                        { key: 'lunas', label: 'Sudah Dibayar' },
                                    ].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.key), className: `px-6 py-3 font-medium text-sm transition-colors ${activeTab === tab.key
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'}`, children: tab.label }, tab.key))) }) }), _jsx("div", { className: "p-6", children: getFilteredTagihan().length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "text-gray-400 mb-2", children: _jsx(CheckCircle, { className: "w-16 h-16 mx-auto" }) }), _jsx("p", { className: "text-gray-500", children: "Tidak ada tagihan di tab ini" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: getGroupedTagihan().map((group) => (_jsxs("div", { className: `border rounded-lg overflow-hidden flex flex-col ${group.items.some(item => isOverdue(item.tglJatuhTempo) && item.status !== 'lunas')
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-200'}`, children: [_jsx("div", { className: `px-4 py-3 border-b ${group.items.some(item => isOverdue(item.tglJatuhTempo) && item.status !== 'lunas')
                                                    ? 'bg-gradient-to-r from-red-100 to-red-50 border-red-200'
                                                    : 'bg-gradient-to-r from-blue-50 to-blue-100 border-gray-200'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-base font-bold text-gray-900", children: [group.bulan, " ", group.tahun] }), group.items.some(item => isOverdue(item.tglJatuhTempo) && item.status !== 'lunas') && (_jsx("span", { className: "text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded", children: "\u26A0 Overdue" }))] }) }), _jsx("div", { className: "divide-y flex-1 overflow-y-auto max-h-64", children: group.items.map((tagihanItem) => (_jsx("div", { className: "p-3 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex items-start gap-2 flex-1 min-w-0", children: [activeTab !== 'lunas' && (_jsx("input", { type: "checkbox", checked: selectedTagihan.includes(String(tagihanItem.id)), onChange: () => toggleTagihan(tagihanItem.id), className: "w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("p", { className: "font-semibold text-gray-900 text-sm truncate", children: tagihanItem.jenisTagihan }), isOverdue(tagihanItem.tglJatuhTempo) && tagihanItem.status !== 'lunas' && (_jsx("span", { className: "text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded whitespace-nowrap", children: "Overdue" }))] }), tagihanItem.tglJatuhTempo && (_jsxs("p", { className: "text-xs text-gray-500 mt-0.5", children: ["Jatuh Tempo: ", new Date(tagihanItem.tglJatuhTempo).toLocaleDateString('id-ID')] })), tagihanItem.tglBayar && (_jsxs("div", { className: "text-xs text-green-600 mt-1", children: [_jsxs("p", { children: ["\u2713 ", tagihanItem.tglBayar] }), _jsx("p", { className: "text-gray-600 text-xs mt-0.5", children: tagihanItem.adminPenerima })] }))] })] }), _jsxs("div", { className: "text-right flex-shrink-0", children: [_jsxs("p", { className: "font-bold text-gray-900 text-sm", children: ["Rp ", (tagihanItem.nominal / 1000).toFixed(0), "K"] }), tagihanItem.status === 'sebagian' && tagihanItem.sisaBayar && tagihanItem.sisaBayar > 0 && (_jsxs("p", { className: "text-xs text-yellow-600 mt-1", children: ["Sisa: Rp ", (tagihanItem.sisaBayar / 1000).toFixed(0), "K"] })), activeTab === 'lunas' && tagihanItem.tglBayar && (_jsxs("button", { onClick: () => {
                                                                            setKwitansiData({
                                                                                type: 'lunas',
                                                                                santri: selectedSantri,
                                                                                tagihan: [tagihanItem],
                                                                                totalBayar: tagihanItem.jumlahBayar || tagihanItem.nominal,
                                                                                nominalBayar: tagihanItem.jumlahBayar || tagihanItem.nominal,
                                                                                admin: tagihanItem.adminPenerima,
                                                                                tanggal: tagihanItem.tglBayar,
                                                                                jam: '-'
                                                                            });
                                                                            setShowKwitansi(true);
                                                                        }, className: "mt-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1 justify-end", children: [_jsx(Printer, { className: "w-3 h-3" }), "Print"] }))] })] }) }, tagihanItem.id))) }), _jsx("div", { className: "bg-gray-50 px-4 py-2 border-t border-gray-200 mt-auto", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("p", { className: "font-semibold text-gray-700 text-xs", children: "Total:" }), _jsxs("p", { className: "font-bold text-base text-blue-600", children: ["Rp ", (group.items.reduce((sum, t) => sum + t.nominal, 0) / 1000).toFixed(0), "K"] })] }) })] }, `${group.bulan}-${group.tahun}`))) })) })] }), showModalLunas && _jsx(ModalBayarLunas, {}), showModalSebagian && _jsx(ModalBayarSebagian, {}), showKwitansi && kwitansiData && _jsx(ModalKwitansi, {})] })) : (_jsxs("div", { className: "bg-white rounded-lg shadow p-12 text-center", children: [_jsx(Search, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-700 mb-2", children: "Cari Santri" }), _jsx("p", { className: "text-gray-500", children: "Gunakan kolom pencarian di atas untuk mencari data santri" })] }))] }));
    // Modal Bayar Lunas Component
    function ModalBayarLunas() {
        const [nominalBayar, setNominalBayar] = useState('');
        const [opsiKembalian, setOpsiKembalian] = useState('tunai');
        const totalTagihan = getTotalSelected();
        const kembalian = Math.max(0, Number(nominalBayar) - totalTagihan);
        const tagihanTerpilih = tagihan.filter(t => {
            const tIdStr = String(t.id);
            // Exact match only
            return selectedTagihan.includes(tIdStr);
        });
        const handleKonfirmasi = () => {
            // Update tagihan status to lunas
            updateTagihanStatus(selectedTagihan, 'lunas');
            // Generate kwitansi data
            const kwitansiInfo = {
                type: 'lunas',
                santri: selectedSantri,
                tagihan: tagihanTerpilih,
                totalBayar: totalTagihan,
                nominalBayar: Number(nominalBayar),
                kembalian: kembalian,
                opsiKembalian: opsiKembalian,
                admin: user?.name,
                tanggal: new Date().toLocaleDateString('id-ID'),
                jam: new Date().toLocaleTimeString('id-ID')
            };
            setKwitansiData(kwitansiInfo);
            setShowKwitansi(true);
            toast.success('Pembayaran berhasil! Tagihan sudah dicatat ke sistem.');
            setShowModalLunas(false);
            setSelectedTagihan([]);
            setNominalBayar('');
        };
        return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/30", onClick: () => setShowModalLunas(false) }), _jsxs("div", { className: "relative z-10 bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg", children: [_jsx("div", { className: "p-6 border-b", children: _jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Bayar Lunas" }) }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("p", { className: "text-sm font-medium text-gray-700 mb-3", children: "Tagihan yang akan dibayar:" }), _jsx("div", { className: "space-y-2", children: tagihanTerpilih.map((t) => (_jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: t.jenisTagihan }), _jsxs("p", { className: "text-xs text-gray-500", children: [t.bulan, " ", t.tahun] })] }), _jsxs("p", { className: "font-semibold text-gray-900", children: ["Rp ", t.nominal.toLocaleString('id-ID')] })] }, t.id))) })] }), _jsx("div", { className: "mb-6 p-4 bg-blue-50 rounded-lg", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("p", { className: "font-medium text-gray-700", children: "Total Tagihan:" }), _jsxs("p", { className: "text-2xl font-bold text-blue-600", children: ["Rp ", totalTagihan.toLocaleString('id-ID')] })] }) }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nominal Uang yang Dibayarkan" }), _jsx("input", { type: "text", value: nominalBayar, onChange: (e) => setNominalBayar(e.target.value.replace(/\D/g, '')), placeholder: "Masukkan nominal", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), nominalBayar && (_jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Rp ", Number(nominalBayar).toLocaleString('id-ID')] }))] }), kembalian > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "p-4 bg-green-50 rounded-lg mb-3", children: [_jsx("p", { className: "text-sm text-gray-700 mb-1", children: "Kembalian:" }), _jsxs("p", { className: "text-xl font-bold text-green-600", children: ["Rp ", kembalian.toLocaleString('id-ID')] })] }), _jsx("p", { className: "text-sm font-medium text-gray-700 mb-2", children: "Opsi Kembalian:" }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setOpsiKembalian('tunai'), className: `flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${opsiKembalian === 'tunai'
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-gray-300 hover:border-gray-400'}`, children: "Kembalian Tunai" }), _jsx("button", { onClick: () => setOpsiKembalian('dompet'), className: `flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${opsiKembalian === 'dompet'
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-gray-300 hover:border-gray-400'}`, children: "Masukkan ke Dompet Santri" })] })] }))] }), _jsxs("div", { className: "p-6 border-t flex gap-3 justify-end", children: [_jsx("button", { onClick: () => setShowModalLunas(false), className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Batal" }), _jsx("button", { onClick: handleKonfirmasi, disabled: !nominalBayar || Number(nominalBayar) < totalTagihan, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: "Konfirmasi Pembayaran" })] })] })] }));
    }
    // Modal Bayar Sebagian Component
    function ModalBayarSebagian() {
        const [nominalBayar, setNominalBayar] = useState('');
        const [distribusiOtomatis, setDistribusiOtomatis] = useState(true);
        const totalTagihan = getTotalSelected();
        const tagihanTerpilih = tagihan.filter(t => {
            const tIdStr = String(t.id);
            // Exact match only
            return selectedTagihan.includes(tIdStr);
        });
        // Rekomendasi pembayaran otomatis
        const getRekomendasi = () => {
            const nominal = Number(nominalBayar);
            if (!nominal)
                return [];
            let sisa = nominal;
            return tagihanTerpilih.map((t) => {
                const bayar = Math.min(sisa, t.nominal);
                sisa -= bayar;
                return { ...t, bayar, sisaTagihan: t.nominal - bayar };
            });
        };
        const handleKonfirmasi = () => {
            // Create payment details object mapping ID to amount paid
            const paymentDetails = {};
            const nominal = Number(nominalBayar);
            let sisa = nominal;
            tagihanTerpilih.forEach(t => {
                const bayar = Math.min(sisa, t.nominal);
                if (bayar > 0) {
                    paymentDetails[String(t.id)] = bayar;
                    sisa -= bayar;
                }
            });
            // Update tagihan status to sebagian dengan payment details
            updateTagihanStatus(selectedTagihan, 'sebagian', undefined, paymentDetails);
            // Generate kwitansi data
            const kwitansiInfo = {
                type: 'sebagian',
                santri: selectedSantri,
                tagihan: tagihanTerpilih,
                paymentDetails: paymentDetails,
                totalTagihan: totalTagihan,
                nominalBayar: nominal,
                opsiKembalian: opsiKembalian,
                admin: user?.name,
                tanggal: new Date().toLocaleDateString('id-ID'),
                jam: new Date().toLocaleTimeString('id-ID')
            };
            setKwitansiData(kwitansiInfo);
            setShowKwitansi(true);
            toast.success('Pembayaran sebagian berhasil! Tagihan telah diperbarui.');
            setShowModalSebagian(false);
            setSelectedTagihan([]);
            setNominalBayar('');
        };
        return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/30", onClick: () => setShowModalSebagian(false) }), _jsxs("div", { className: "relative z-10 bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg", children: [_jsx("div", { className: "p-6 border-b", children: _jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Bayar Sebagian" }) }), _jsxs("div", { className: "p-6", children: [_jsx("div", { className: "mb-6 p-4 bg-gray-50 rounded-lg", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("p", { className: "font-medium text-gray-700", children: "Total Tagihan Dipilih:" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["Rp ", totalTagihan.toLocaleString('id-ID')] })] }) }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nominal Uang yang Dibayarkan" }), _jsx("input", { type: "text", value: nominalBayar, onChange: (e) => setNominalBayar(e.target.value.replace(/\D/g, '')), placeholder: "Masukkan nominal", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), nominalBayar && (_jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Rp ", Number(nominalBayar).toLocaleString('id-ID')] }))] }), nominalBayar && Number(nominalBayar) > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: "Rekomendasi Pembayaran:" }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx("input", { type: "checkbox", checked: distribusiOtomatis, onChange: (e) => setDistribusiOtomatis(e.target.checked), className: "w-4 h-4 text-blue-600 rounded" }), "Distribusi Otomatis"] })] }), _jsx("div", { className: "space-y-2", children: getRekomendasi().map((item) => (_jsxs("div", { className: "p-3 bg-blue-50 rounded-lg border border-blue-200", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: item.jenisTagihan }), _jsxs("p", { className: "text-xs text-gray-500", children: [item.bulan, " ", item.tahun] })] }), _jsx("div", { className: "text-right", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["Total: Rp ", item.nominal.toLocaleString('id-ID')] }) })] }), _jsxs("div", { className: "flex justify-between items-center pt-2 border-t border-blue-200", children: [_jsxs("p", { className: "text-sm font-medium text-green-600", children: ["Dibayar: Rp ", item.bayar.toLocaleString('id-ID')] }), item.sisaTagihan > 0 && (_jsxs("p", { className: "text-sm font-medium text-orange-600", children: ["Sisa: Rp ", item.sisaTagihan.toLocaleString('id-ID')] })), item.sisaTagihan === 0 && (_jsxs("span", { className: "flex items-center gap-1 text-sm text-green-600", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Lunas"] }))] })] }, item.id))) })] }))] }), _jsxs("div", { className: "p-6 border-t flex gap-3 justify-end", children: [_jsx("button", { onClick: () => setShowModalSebagian(false), className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Batal" }), _jsx("button", { onClick: handleKonfirmasi, disabled: !nominalBayar || Number(nominalBayar) <= 0, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: "Konfirmasi Pembayaran" })] })] })] }));
    }
    // Modal Kwitansi Component
    function ModalKwitansi() {
        const kwitansiNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
        const statusLabel = kwitansiData.type === 'lunas' ? 'LUNAS' : 'BAYAR SEBAGIAN';
        const totalSisa = kwitansiData.type === 'sebagian'
            ? kwitansiData.tagihan.reduce((sum, t) => {
                const dibayar = kwitansiData.paymentDetails[String(t.id)] || 0;
                return sum + (t.nominal - dibayar);
            }, 0)
            : 0;
        return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/30", onClick: () => setShowKwitansi(false) }), _jsxs("div", { className: "relative z-10 bg-white rounded-lg shadow-lg", style: { width: '210mm', maxHeight: '90vh', overflow: 'auto' }, children: [_jsxs("div", { id: "kwitansi", className: "relative", style: { width: '210mm', height: '150mm', display: 'flex', flexDirection: 'column', padding: '8mm', boxSizing: 'border-box', overflow: 'hidden' }, children: [_jsxs("div", { className: "text-center mb-2 pb-2 border-b border-gray-800", children: [_jsx("h1", { className: "text-xl font-bold tracking-wider", children: "KWITANSI PEMBAYARAN" }), _jsx("p", { className: "text-gray-700 text-xs mt-0.5", children: "Bukti Pembayaran Tagihan" })] }), _jsxs("div", { className: "flex gap-3 mb-1.5 text-xs", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-bold mb-0.5 text-xs underline", children: "DATA SANTRI" }), _jsxs("p", { className: "mb-0.5", children: [_jsx("span", { className: "font-semibold", children: "Nama" }), " : ", kwitansiData.santri?.nama_santri] }), _jsxs("p", { className: "mb-0.5", children: [_jsx("span", { className: "font-semibold", children: "NIS" }), " : ", kwitansiData.santri?.nis] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Kelas" }), " : ", kwitansiData.santri?.kelas] })] }), _jsxs("div", { className: "flex-1 text-right text-xs", children: [_jsx("p", { className: "mb-0.5", children: _jsx("span", { className: "font-semibold", children: "Nomor" }) }), _jsxs("p", { className: "mb-0.5", children: [_jsx("span", { className: "font-semibold", children: "Kwitansi" }), " : ", kwitansiNumber] }), _jsxs("p", { className: "mb-0.5", children: [_jsx("span", { className: "font-semibold", children: "Tanggal" }), " : ", kwitansiData.tanggal] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Jam" }), " : ", kwitansiData.jam] })] })] }), _jsxs("div", { className: "mb-1.5", children: [_jsx("div", { className: "font-bold mb-0.5 text-xs underline", children: "DETAIL PEMBAYARAN" }), _jsxs("table", { className: "w-full text-xs border-collapse border border-gray-800", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-200", children: [_jsx("th", { className: "border border-gray-800 px-6 py-3 text-left font-bold", children: "Jenis Tagihan" }), _jsx("th", { className: "border border-gray-800 px-6 py-3 text-left font-bold", children: "Bulan" }), _jsx("th", { className: "border border-gray-800 px-6 py-3 text-right font-bold", children: "Nominal" }), kwitansiData.type === 'sebagian' && (_jsxs(_Fragment, { children: [_jsx("th", { className: "border border-gray-800 px-6 py-3 text-right font-bold", children: "Dibayar" }), _jsx("th", { className: "border border-gray-800 px-6 py-3 text-right font-bold", children: "Sisa" })] }))] }) }), _jsx("tbody", { children: kwitansiData.tagihan.map((t, idx) => {
                                                        const dibayar = kwitansiData.type === 'sebagian' ? (kwitansiData.paymentDetails[String(t.id)] || 0) : t.nominal;
                                                        const sisa = t.nominal - dibayar;
                                                        return (_jsxs("tr", { children: [_jsx("td", { className: "border border-gray-800 px-6 py-3", children: t.jenisTagihan }), _jsxs("td", { className: "border border-gray-800 px-6 py-3", children: [t.bulan, " ", t.tahun] }), _jsxs("td", { className: "border border-gray-800 px-6 py-3 text-right", children: ["Rp ", t.nominal.toLocaleString('id-ID')] }), kwitansiData.type === 'sebagian' && (_jsxs(_Fragment, { children: [_jsxs("td", { className: "border border-gray-800 px-6 py-3 text-right", children: ["Rp ", dibayar.toLocaleString('id-ID')] }), _jsxs("td", { className: "border border-gray-800 px-6 py-3 text-right font-semibold", children: ["Rp ", sisa.toLocaleString('id-ID')] })] }))] }, idx));
                                                    }) })] })] }), _jsxs("div", { className: "mb-1 bg-gray-100 p-3 border border-gray-800 text-xs", children: [_jsxs("div", { className: "flex justify-between mb-0.5 px-2", children: [_jsx("span", { className: "font-semibold", children: "Total Tagihan:" }), _jsxs("span", { children: ["Rp ", (kwitansiData.totalTagihan || kwitansiData.totalBayar)?.toLocaleString('id-ID')] })] }), _jsxs("div", { className: "flex justify-between px-2", children: [_jsx("span", { className: "font-semibold", children: "Nominal Bayar:" }), _jsxs("span", { children: ["Rp ", kwitansiData.nominalBayar?.toLocaleString('id-ID')] })] }), kwitansiData.kembalian && kwitansiData.kembalian > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex justify-between border-t pt-0.5 mt-0.5 px-2", children: [_jsx("span", { className: "font-semibold", children: "Kembalian:" }), _jsxs("span", { children: ["Rp ", kwitansiData.kembalian?.toLocaleString('id-ID')] })] }), _jsxs("div", { className: "flex justify-between pt-0.5 px-2", children: [_jsx("span", { className: "font-semibold", children: "Opsi:" }), _jsx("span", { className: "text-xs", children: kwitansiData.opsiKembalian === 'dompet'
                                                                ? '✓ Masukkan ke Dompet Santri'
                                                                : '✓ Kembalian Tunai' })] })] })), kwitansiData.type === 'sebagian' && totalSisa > 0 && (_jsxs("div", { className: "flex justify-between border-t pt-0.5 mt-0.5 px-2", children: [_jsx("span", { className: "font-semibold", children: "Sisa Tagihan:" }), _jsxs("span", { className: "font-bold text-blue-600", children: ["Rp ", totalSisa.toLocaleString('id-ID')] })] }))] }), _jsx("div", { className: "flex-1 flex items-end", children: _jsxs("div", { className: "w-full text-center", children: [_jsx("div", { className: "border-b border-gray-800", style: { height: '35px', marginBottom: '4px' } }), _jsx("p", { className: "text-xs font-semibold", children: kwitansiData.admin })] }) }), _jsxs("div", { className: "text-center text-xs text-gray-600 mt-1", children: [_jsx("p", { children: "Terima kasih telah melakukan pembayaran" }), _jsx("p", { children: "Harap simpan kwitansi ini sebagai bukti pembayaran" })] }), _jsx("style", { children: `
              @media print {
                * {
                  margin: 0;
                  padding: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                #kwitansi {
                  width: 210mm !important;
                  height: 150mm !important;
                  margin: 0 !important;
                  padding: 8mm !important;
                  page-break-after: always;
                  display: flex !important;
                  flex-direction: column !important;
                  box-sizing: border-box !important;
                  overflow: hidden !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            ` })] }), _jsxs("div", { className: "no-print p-6 border-t flex gap-3 justify-end bg-gray-50", children: [_jsx("button", { onClick: () => setShowKwitansi(false), className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium", children: "Tutup" }), _jsxs("button", { onClick: () => {
                                        const kwitansiElement = document.getElementById('kwitansi');
                                        if (kwitansiElement) {
                                            const printWindow = window.open('', '', 'height=400,width=800');
                                            // Get all stylesheets
                                            const styles = Array.from(document.styleSheets)
                                                .map(sheet => {
                                                try {
                                                    return Array.from(sheet.cssRules)
                                                        .map(rule => rule.cssText)
                                                        .join('\n');
                                                }
                                                catch (e) {
                                                    return '';
                                                }
                                            })
                                                .join('\n');
                                            // Clone element untuk copy styles
                                            const clonedElement = kwitansiElement.cloneNode(true);
                                            printWindow?.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Kwitansi Pembayaran</title>
                      <style>
                        @page { 
                          size: 210mm 150mm portrait;
                          margin: 8mm 10mm;
                        }
                        @media print {
                          html, body {
                            width: 210mm;
                            height: 150mm;
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                          }
                          #kwitansi {
                            width: 100%;
                            height: 100%;
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                            page-break-after: avoid;
                            display: flex;
                            flex-direction: column;
                          }
                        }
                        html, body { 
                          margin: 0; 
                          padding: 0;
                          width: 210mm;
                          height: 150mm;
                          font-family: system-ui, -apple-system, sans-serif;
                        }
                        * { 
                          margin: 0; 
                          padding: 0;
                          box-sizing: border-box;
                        }
                        /* Force table cell padding */
                        table th,
                        table td {
                          padding: 8px 16px !important;
                        }
                        /* Force summary section padding */
                        .bg-gray-100 {
                          padding: 12px !important;
                        }
                        .bg-gray-100 > div {
                          padding-left: 8px !important;
                          padding-right: 8px !important;
                        }
                        /* Tailwind Core Styles */
                        ${styles}
                      </style>
                    </head>
                    <body>
                      ${kwitansiElement.innerHTML}
                    </body>
                    </html>
                  `);
                                            printWindow?.document.close();
                                            // Wait for content to load before printing
                                            if (printWindow) {
                                                printWindow.onload = function () {
                                                    setTimeout(() => {
                                                        printWindow.print();
                                                        printWindow.close();
                                                    }, 250);
                                                };
                                            }
                                        }
                                    }, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium", children: [_jsx(Printer, { className: "w-4 h-4" }), "Print Kwitansi"] })] })] })] }));
    }
}
