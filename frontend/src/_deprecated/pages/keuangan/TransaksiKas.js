import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Search, Trash2, X, ArrowDownCircle, ArrowUpCircle, Eye, ArrowRightLeft } from 'lucide-react';
import { listBukuKas, listTransaksiKas, createTransaksiKas, deleteTransaksiKas } from '../../api/bukuKas';
import { listKategoriPengeluaran, createKategoriPengeluaran } from '../../api/kategoriPengeluaran';
import toast from 'react-hot-toast';
// Helper function untuk format rupiah
const formatRupiah = (nominal) => {
    const value = Number(nominal) || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};
// Helper function untuk format tanggal
const formatTanggal = (tanggal) => {
    return new Date(tanggal).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};
export default function TransaksiKas() {
    const [transaksiList, setTransaksiList] = useState([]);
    const [bukuKasList, setBukuKasList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showModalTransfer, setShowModalTransfer] = useState(false);
    const [selectedTransaksi, setSelectedTransaksi] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJenis, setFilterJenis] = useState('all');
    const [filterBukuKas, setFilterBukuKas] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // Form state untuk transaksi pengeluaran
    const [formData, setFormData] = useState({
        buku_kas_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        kategori_id: '',
        nominal: '',
        keterangan: '',
        nama_pemohon: '',
        metode: 'cash'
    });
    // Form state untuk transfer
    const [transferData, setTransferData] = useState({
        dari_buku_kas_id: '',
        ke_buku_kas_id: '',
        dari_metode: 'cash',
        ke_metode: 'cash',
        tanggal: new Date().toISOString().split('T')[0],
        nominal: '',
        keterangan: ''
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [transaksiRes, bukuKasRes, kategoriRes] = await Promise.all([
                listTransaksiKas(),
                listBukuKas(),
                listKategoriPengeluaran()
            ]);
            if (transaksiRes.success) {
                setTransaksiList(transaksiRes.data);
            }
            if (bukuKasRes.success) {
                setBukuKasList(bukuKasRes.data);
            }
            if (kategoriRes) {
                setCategories(kategoriRes);
            }
        }
        catch (error) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const keteranganFull = formData.nama_pemohon
                ? `${formData.keterangan} (Pemohon: ${formData.nama_pemohon})`
                : formData.keterangan;
            // ensure category exists or create if missing
            let kategoriIdToSend = undefined;
            if (formData.kategori_id) {
                kategoriIdToSend = Number(formData.kategori_id);
            }
            else if (formData.kategori) {
                const found = categories.find(c => c.name.toLowerCase() === formData.kategori.toLowerCase());
                if (found)
                    kategoriIdToSend = found.id;
                else {
                    // create new category on the fly
                    try {
                        const created = await createKategoriPengeluaran({ name: formData.kategori });
                        if (created) {
                            setCategories(prev => [...prev, created]);
                            kategoriIdToSend = created.id;
                        }
                    }
                    catch (err) {
                        // ignore — server validation will surface if problem
                    }
                }
            }
            const response = await createTransaksiKas({
                buku_kas_id: Number(formData.buku_kas_id),
                tanggal: formData.tanggal,
                jenis: 'pengeluaran',
                metode: formData.metode,
                kategori: formData.kategori,
                kategori_id: kategoriIdToSend,
                nominal: Number(formData.nominal),
                keterangan: keteranganFull
            });
            if (response.success) {
                toast.success('Transaksi pengeluaran berhasil dicatat');
                setShowModal(false);
                resetForm();
                loadData();
            }
        }
        catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Gagal mencatat transaksi');
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?'))
            return;
        try {
            const response = await deleteTransaksiKas(id);
            if (response.success) {
                toast.success('Transaksi berhasil dihapus');
                loadData();
            }
        }
        catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Gagal menghapus transaksi');
        }
    };
    const resetForm = () => {
        setFormData({
            buku_kas_id: '',
            tanggal: new Date().toISOString().split('T')[0],
            kategori: '',
            kategori_id: '',
            nominal: '',
            keterangan: '',
            nama_pemohon: '',
            metode: 'cash'
        });
    };
    const resetTransferForm = () => {
        setTransferData({
            dari_buku_kas_id: '',
            ke_buku_kas_id: '',
            dari_metode: 'cash',
            ke_metode: 'cash',
            tanggal: new Date().toISOString().split('T')[0],
            nominal: '',
            keterangan: ''
        });
    };
    const handleTransfer = async (e) => {
        e.preventDefault();
        try {
            // Validasi: tidak boleh transfer ke buku kas yang sama dengan metode yang sama
            if (transferData.dari_buku_kas_id === transferData.ke_buku_kas_id &&
                transferData.dari_metode === transferData.ke_metode) {
                toast.error('Tidak bisa transfer ke akun yang sama');
                return;
            }
            const nominal = Number(transferData.nominal);
            const tanggal = transferData.tanggal;
            // Tentukan label metode
            const dariLabel = transferData.dari_metode === 'cash' ? 'Cash' : 'Bank';
            const keLabel = transferData.ke_metode === 'cash' ? 'Cash' : 'Bank';
            const dariBukuKas = bukuKasList.find(bk => bk.id === Number(transferData.dari_buku_kas_id));
            const keBukuKas = bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id));
            // Buat transaksi pengeluaran dari sumber
            await createTransaksiKas({
                buku_kas_id: Number(transferData.dari_buku_kas_id),
                tanggal: tanggal,
                jenis: 'pengeluaran',
                metode: transferData.dari_metode,
                kategori: 'Transfer Keluar',
                nominal: nominal,
                keterangan: `Transfer ke ${keBukuKas?.nama_kas} (${keLabel}) - ${transferData.keterangan}`
            });
            // Buat transaksi pemasukan ke tujuan
            await createTransaksiKas({
                buku_kas_id: Number(transferData.ke_buku_kas_id),
                tanggal: tanggal,
                jenis: 'pemasukan',
                metode: transferData.ke_metode,
                kategori: 'Transfer Masuk',
                nominal: nominal,
                keterangan: `Transfer dari ${dariBukuKas?.nama_kas} (${dariLabel}) - ${transferData.keterangan}`
            });
            toast.success('Transfer saldo berhasil!');
            setShowModalTransfer(false);
            resetTransferForm();
            loadData();
        }
        catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Gagal melakukan transfer');
        }
    };
    // Filter transaksi
    const filteredTransaksi = transaksiList.filter(t => {
        const matchSearch = searchQuery === '' ||
            t.no_transaksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.keterangan?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchJenis = filterJenis === 'all' || t.jenis === filterJenis;
        const matchBukuKas = filterBukuKas === 'all' || t.buku_kas_id === filterBukuKas;
        let matchDate = true;
        if (startDate && endDate) {
            const transaksiDate = new Date(t.tanggal);
            const start = new Date(startDate);
            const end = new Date(endDate);
            matchDate = transaksiDate >= start && transaksiDate <= end;
        }
        return matchSearch && matchJenis && matchBukuKas && matchDate;
    }).sort((a, b) => {
        // Sort by created_at descending (terbaru di atas)
        // Jika created_at sama, sort by id descending
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        if (dateB !== dateA) {
            return dateB - dateA;
        }
        // Jika tanggal sama, urutkan berdasarkan id (yang lebih besar = lebih baru)
        return b.id - a.id;
    });
    // Hitung total
    const totalPemasukan = filteredTransaksi
        .filter(t => t.jenis === 'pemasukan')
        .reduce((sum, t) => sum + Number(t.nominal), 0);
    const totalPengeluaran = filteredTransaksi
        .filter(t => t.jenis === 'pengeluaran')
        .reduce((sum, t) => sum + Number(t.nominal), 0);
    const saldo = totalPemasukan - totalPengeluaran;
    if (loading) {
        return (_jsx("div", { className: "p-6 flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Memuat data..." })] }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Transaksi Kas" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Kelola transaksi kas masuk dan keluar" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: () => setShowModalTransfer(true), className: "flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors", children: [_jsx(ArrowRightLeft, { className: "w-5 h-5" }), "Transfer Saldo"] }), _jsxs("button", { onClick: () => setShowModal(true), className: "flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", children: [_jsx(ArrowDownCircle, { className: "w-5 h-5" }), "Tambah Pengeluaran"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-6", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Total Pemasukan" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: formatRupiah(totalPemasukan) })] }), _jsx("div", { className: "p-3 bg-green-100 rounded-lg", children: _jsx(ArrowUpCircle, { className: "w-8 h-8 text-green-600" }) })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Total Pengeluaran" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: formatRupiah(totalPengeluaran) })] }), _jsx("div", { className: "p-3 bg-red-100 rounded-lg", children: _jsx(ArrowDownCircle, { className: "w-8 h-8 text-red-600" }) })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Saldo" }), _jsx("p", { className: `text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`, children: formatRupiah(saldo) })] }), _jsx("div", { className: `p-3 rounded-lg ${saldo >= 0 ? 'bg-blue-100' : 'bg-red-100'}`, children: _jsx("svg", { className: `w-8 h-8 ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })] }) })] }), _jsx("div", { className: "bg-white rounded-lg shadow p-4 mb-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsx("div", { className: "md:col-span-2", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Cari no transaksi, kategori, keterangan...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }) }), _jsx("div", { children: _jsxs("select", { value: filterJenis, onChange: (e) => setFilterJenis(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "Semua Jenis" }), _jsx("option", { value: "pemasukan", children: "Pemasukan" }), _jsx("option", { value: "pengeluaran", children: "Pengeluaran" })] }) }), _jsx("div", { children: _jsxs("select", { value: filterBukuKas, onChange: (e) => setFilterBukuKas(e.target.value === 'all' ? 'all' : Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "Semua Buku Kas" }), bukuKasList.map(bk => (_jsx("option", { value: bk.id, children: bk.nama_kas }, bk.id)))] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm", placeholder: "Dari" }), _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm", placeholder: "Sampai" })] })] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "No. Transaksi" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Tanggal" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Buku Kas" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Jenis" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Kategori" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Metode" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Nominal" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Keterangan" }), _jsx("th", { className: "px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Aksi" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredTransaksi.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "px-6 py-12 text-center text-gray-500", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx(Search, { className: "w-12 h-12 text-gray-400 mb-3" }), _jsx("p", { children: "Tidak ada data transaksi" })] }) }) })) : (filteredTransaksi.map((transaksi) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "text-sm font-medium text-gray-900", children: transaksi.no_transaksi }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-600", children: formatTanggal(transaksi.tanggal) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-600", children: transaksi.buku_kas?.nama_kas || '-' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${transaksi.jenis === 'pemasukan'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'}`, children: [transaksi.jenis === 'pemasukan' ? (_jsx(ArrowUpCircle, { className: "w-3 h-3" })) : (_jsx(ArrowDownCircle, { className: "w-3 h-3" })), transaksi.jenis === 'pemasukan' ? 'Masuk' : 'Keluar'] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: transaksi.kategori }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded ${transaksi.metode === 'cash'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'}`, children: transaksi.metode === 'cash' ? '💵 Cash' : '🏦 Transfer' }) }), _jsxs("td", { className: `px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${transaksi.jenis === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`, children: [transaksi.jenis === 'pemasukan' ? '+' : '-', " ", formatRupiah(transaksi.nominal)] }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600 max-w-xs truncate", children: transaksi.keterangan || '-' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-center", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => {
                                                                setSelectedTransaksi(transaksi);
                                                                setShowPreview(true);
                                                            }, className: "text-blue-600 hover:text-blue-800 transition-colors", title: "Preview transaksi", children: _jsx(Eye, { className: "w-4 h-4" }) }), !transaksi.pembayaran_id ? (_jsx("button", { onClick: () => handleDelete(transaksi.id), className: "text-red-600 hover:text-red-800 transition-colors", title: "Hapus transaksi", children: _jsx(Trash2, { className: "w-4 h-4" }) })) : (_jsx("span", { className: "text-xs text-gray-400", title: "Transaksi dari pembayaran", children: "\uD83D\uDD12" }))] }) })] }, transaksi.id)))) })] }) }), filteredTransaksi.length > 0 && (_jsx("div", { className: "bg-gray-50 px-6 py-3 border-t", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["Menampilkan ", filteredTransaksi.length, " dari ", transaksiList.length, " transaksi"] }) }))] }), showModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Tambah Transaksi Pengeluaran" }), _jsx("button", { onClick: () => {
                                        setShowModal(false);
                                        resetForm();
                                    }, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Buku Kas ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.buku_kas_id, onChange: (e) => setFormData({ ...formData, buku_kas_id: e.target.value }), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Pilih Buku Kas" }), bukuKasList.map(bk => (_jsx("option", { value: bk.id, children: bk.nama_kas }, bk.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Tanggal ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "date", value: formData.tanggal, onChange: (e) => setFormData({ ...formData, tanggal: e.target.value }), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Kategori Pengeluaran ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("input", { list: "kategori-list", type: "text", value: formData.kategori, onChange: (e) => {
                                                                        const newVal = e.target.value;
                                                                        const found = categories.find(c => c.name.toLowerCase() === newVal.toLowerCase());
                                                                        setFormData({ ...formData, kategori: newVal, kategori_id: found ? String(found.id) : '' });
                                                                    }, placeholder: "Contoh: Pembelian ATK, Gaji Pegawai, Listrik, dll", required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsx("datalist", { id: "kategori-list", children: categories.map(c => (_jsx("option", { value: c.name }, c.id))) })] }), _jsx("button", { type: "button", onClick: async () => {
                                                                if (!formData.kategori || formData.kategori.trim() === '')
                                                                    return;
                                                                try {
                                                                    const created = await createKategoriPengeluaran({ name: formData.kategori });
                                                                    if (created) {
                                                                        setCategories(prev => [...prev, created]);
                                                                        setFormData(prev => ({ ...prev, kategori_id: String(created.id), kategori: created.name }));
                                                                        toast.success('Kategori pengeluaran berhasil dibuat');
                                                                    }
                                                                }
                                                                catch (err) {
                                                                    toast.error(err.response?.data?.message || 'Gagal membuat kategori');
                                                                }
                                                            }, className: "px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Tambah" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Nominal Pengeluaran ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "number", value: formData.nominal, onChange: (e) => setFormData({ ...formData, nominal: e.target.value }), placeholder: "0", min: "0", required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), formData.nominal && (_jsx("p", { className: "mt-1 text-sm text-gray-600", children: formatRupiah(Number(formData.nominal)) }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nama Pemohon" }), _jsx("input", { type: "text", value: formData.nama_pemohon, onChange: (e) => setFormData({ ...formData, nama_pemohon: e.target.value }), placeholder: "Nama orang yang mengajukan pengeluaran", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Metode Pengeluaran ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("button", { type: "button", onClick: () => setFormData({ ...formData, metode: 'cash' }), className: `px-4 py-3 border-2 rounded-lg font-medium transition-colors ${formData.metode === 'cash'
                                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                                : 'border-gray-300 hover:border-gray-400'}`, children: "\uD83D\uDCB5 Cash" }), _jsx("button", { type: "button", onClick: () => setFormData({ ...formData, metode: 'transfer' }), className: `px-4 py-3 border-2 rounded-lg font-medium transition-colors ${formData.metode === 'transfer'
                                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                                : 'border-gray-300 hover:border-gray-400'}`, children: "\uD83C\uDFE6 Transfer" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Keterangan ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { value: formData.keterangan, onChange: (e) => setFormData({ ...formData, keterangan: e.target.value }), placeholder: "Detail keterangan pengeluaran...", rows: 3, required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })] }), _jsxs("div", { className: "flex gap-3 justify-end mt-6 pt-6 border-t", children: [_jsx("button", { type: "button", onClick: () => {
                                                setShowModal(false);
                                                resetForm();
                                            }, className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium", children: "Batal" }), _jsx("button", { type: "submit", className: "px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium", children: "Simpan Pengeluaran" })] })] })] }) })), showPreview && selectedTransaksi && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg max-w-2xl w-full", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Detail Transaksi" }), _jsx("button", { onClick: () => {
                                        setShowPreview(false);
                                        setSelectedTransaksi(null);
                                    }, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between pb-4 border-b", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "No. Transaksi" }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: selectedTransaksi.no_transaksi })] }), _jsxs("span", { className: `inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${selectedTransaksi.jenis === 'pemasukan'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'}`, children: [selectedTransaksi.jenis === 'pemasukan' ? (_jsx(ArrowUpCircle, { className: "w-4 h-4" })) : (_jsx(ArrowDownCircle, { className: "w-4 h-4" })), selectedTransaksi.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Tanggal" }), _jsx("p", { className: "font-medium text-gray-900", children: formatTanggal(selectedTransaksi.tanggal) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Buku Kas" }), _jsx("p", { className: "font-medium text-gray-900", children: selectedTransaksi.buku_kas?.nama_kas || '-' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Kategori" }), _jsx("p", { className: "font-medium text-gray-900", children: selectedTransaksi.kategori })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Metode" }), _jsx("p", { className: "font-medium text-gray-900", children: selectedTransaksi.metode === 'cash' ? '💵 Cash' : '🏦 Transfer' })] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4 border", children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Nominal" }), _jsxs("p", { className: `text-3xl font-bold ${selectedTransaksi.jenis === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`, children: [selectedTransaksi.jenis === 'pemasukan' ? '+' : '-', " ", formatRupiah(selectedTransaksi.nominal)] })] }), selectedTransaksi.keterangan && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-1", children: "Keterangan" }), _jsx("p", { className: "text-gray-900 bg-gray-50 p-3 rounded-lg border", children: selectedTransaksi.keterangan })] })), selectedTransaksi.pembayaran_id && (_jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3", children: _jsxs("p", { className: "text-sm text-blue-800", children: ["\uD83D\uDD12 Transaksi ini terkait dengan pembayaran santri (ID: ", selectedTransaksi.pembayaran_id, ")"] }) })), _jsx("div", { className: "pt-4 border-t", children: _jsxs("p", { className: "text-xs text-gray-400", children: ["Dicatat pada: ", new Date(selectedTransaksi.created_at).toLocaleString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })] }) })] }) }), _jsxs("div", { className: "flex gap-3 justify-end p-6 border-t bg-gray-50", children: [_jsx("button", { onClick: () => {
                                        setShowPreview(false);
                                        setSelectedTransaksi(null);
                                    }, className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-white font-medium", children: "Tutup" }), !selectedTransaksi.pembayaran_id && (_jsxs("button", { onClick: () => {
                                        setShowPreview(false);
                                        setSelectedTransaksi(null);
                                        handleDelete(selectedTransaksi.id);
                                    }, className: "px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2", children: [_jsx(Trash2, { className: "w-4 h-4" }), "Hapus Transaksi"] }))] })] }) })), showModalTransfer && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50", children: _jsxs("div", { className: "bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Transfer Saldo" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Transfer saldo antar kas atau antar metode pembayaran" })] }), _jsx("button", { onClick: () => {
                                        setShowModalTransfer(false);
                                        resetTransferForm();
                                    }, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleTransfer, className: "p-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [_jsxs("h3", { className: "text-sm font-semibold text-red-900 mb-4 flex items-center gap-2", children: [_jsx(ArrowUpCircle, { className: "w-4 h-4" }), "Dari (Sumber)"] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Buku Kas ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: transferData.dari_buku_kas_id, onChange: (e) => setTransferData({ ...transferData, dari_buku_kas_id: e.target.value }), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Pilih Buku Kas" }), bukuKasList.map(bk => (_jsx("option", { value: bk.id, children: bk.nama_kas }, bk.id)))] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Dari Akun ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { type: "button", onClick: () => setTransferData({ ...transferData, dari_metode: 'cash' }), className: `px-4 py-2 border-2 rounded-lg font-medium transition-colors ${transferData.dari_metode === 'cash'
                                                                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                                                                : 'border-gray-300 hover:border-gray-400'}`, children: "\uD83D\uDCB5 Cash" }), _jsx("button", { type: "button", onClick: () => setTransferData({ ...transferData, dari_metode: 'transfer' }), className: `px-4 py-2 border-2 rounded-lg font-medium transition-colors ${transferData.dari_metode === 'transfer'
                                                                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                                                                : 'border-gray-300 hover:border-gray-400'}`, children: "\uD83C\uDFE6 Bank" })] })] }), transferData.dari_buku_kas_id && (_jsxs("div", { className: "p-3 bg-white border border-red-300 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Saldo Tersedia:" }), _jsx("p", { className: "text-lg font-bold text-red-700", children: formatRupiah(transferData.dari_metode === 'cash'
                                                                        ? bukuKasList.find(bk => bk.id === Number(transferData.dari_buku_kas_id))?.saldo_cash || 0
                                                                        : bukuKasList.find(bk => bk.id === Number(transferData.dari_buku_kas_id))?.saldo_bank || 0) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: transferData.dari_metode === 'cash' ? 'Saldo Cash' : 'Saldo Bank' })] }))] }), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [_jsxs("h3", { className: "text-sm font-semibold text-green-900 mb-4 flex items-center gap-2", children: [_jsx(ArrowDownCircle, { className: "w-4 h-4" }), "Ke (Tujuan)"] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Buku Kas ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: transferData.ke_buku_kas_id, onChange: (e) => setTransferData({ ...transferData, ke_buku_kas_id: e.target.value }), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Pilih Buku Kas" }), bukuKasList.map(bk => (_jsx("option", { value: bk.id, children: bk.nama_kas }, bk.id)))] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Ke Akun ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx("button", { type: "button", onClick: () => setTransferData({ ...transferData, ke_metode: 'cash' }), className: `px-4 py-2 border-2 rounded-lg font-medium transition-colors ${transferData.ke_metode === 'cash'
                                                                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                                                                : 'border-gray-300 hover:border-gray-400'}`, children: "\uD83D\uDCB5 Cash" }), _jsx("button", { type: "button", onClick: () => setTransferData({ ...transferData, ke_metode: 'transfer' }), className: `px-4 py-2 border-2 rounded-lg font-medium transition-colors ${transferData.ke_metode === 'transfer'
                                                                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                                                                : 'border-gray-300 hover:border-gray-400'}`, children: "\uD83C\uDFE6 Bank" })] })] }), transferData.ke_buku_kas_id && (_jsxs("div", { className: "p-3 bg-white border border-green-300 rounded-lg", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Saldo Saat Ini:" }), _jsx("p", { className: "text-lg font-bold text-green-700", children: formatRupiah(transferData.ke_metode === 'cash'
                                                                        ? bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))?.saldo_cash || 0
                                                                        : bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))?.saldo_bank || 0) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: transferData.ke_metode === 'cash' ? 'Saldo Cash' : 'Saldo Bank' }), transferData.nominal && Number(transferData.nominal) > 0 && (_jsxs("div", { className: "mt-2 pt-2 border-t border-green-200", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Saldo Setelah Transfer:" }), _jsx("p", { className: "text-sm font-semibold text-green-800", children: formatRupiah((transferData.ke_metode === 'cash'
                                                                                ? bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))?.saldo_cash || 0
                                                                                : bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))?.saldo_bank || 0) + Number(transferData.nominal)) })] }))] }))] })] }), _jsx("div", { className: "flex justify-center -mt-3 -mb-3", children: _jsx("div", { className: "bg-purple-100 p-3 rounded-full border-4 border-white shadow-lg", children: _jsx(ArrowRightLeft, { className: "w-6 h-6 text-purple-600" }) }) }), _jsxs("div", { className: "border-t pt-6", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-4", children: "Detail Transfer" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Tanggal ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "date", value: transferData.tanggal, onChange: (e) => setTransferData({ ...transferData, tanggal: e.target.value }), required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Nominal ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "number", value: transferData.nominal, onChange: (e) => setTransferData({ ...transferData, nominal: e.target.value }), placeholder: "0", min: "0", required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" }), transferData.nominal && (_jsx("p", { className: "mt-1 text-sm text-gray-600", children: formatRupiah(Number(transferData.nominal)) }))] })] }), _jsxs("div", { className: "mt-4", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Keterangan ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { value: transferData.keterangan, onChange: (e) => setTransferData({ ...transferData, keterangan: e.target.value }), placeholder: "Keterangan transfer...", rows: 3, required: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" })] })] })] }), _jsxs("div", { className: "flex gap-3 justify-end mt-6 pt-6 border-t", children: [_jsx("button", { type: "button", onClick: () => {
                                                setShowModalTransfer(false);
                                                resetTransferForm();
                                            }, className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium", children: "Batal" }), _jsxs("button", { type: "submit", className: "px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2", children: [_jsx(ArrowRightLeft, { className: "w-4 h-4" }), "Proses Transfer"] })] })] })] }) }))] }));
}
