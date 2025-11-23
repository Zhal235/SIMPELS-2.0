import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, ArrowRight, ArrowLeft, Check, User, MapPin, DollarSign, FileCheck, X, Trash2 } from 'lucide-react';
import { createSantri, listSantri, deleteSantri } from '../../api/santri';
import { listKelas } from '../../api/kelas';
import { listAsrama } from '../../api/asrama';
import { listJenisTagihan } from '../../api/jenisTagihan';
import { createTunggakan } from '../../api/tagihanSantri';
import toast from 'react-hot-toast';
export default function MutasiMasuk() {
    const [showWizard, setShowWizard] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    // Data list santri mutasi masuk
    const [santriList, setSantriList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    // Step 1: Data Pribadi
    const [formStep1, setFormStep1] = useState({
        nis: '',
        nisn: '',
        nik_santri: '',
        nama_santri: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        jenis_kelamin: 'L',
        asal_sekolah: '',
        hobi: '',
        cita_cita: '',
        jumlah_saudara: undefined,
        alamat: '',
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        kode_pos: '',
        foto: undefined,
        status: 'aktif',
        orang_tua: {
            no_kk: '',
            nama_ayah: '',
            nik_ayah: '',
            pendidikan_ayah: '',
            pekerjaan_ayah: '',
            hp_ayah: '',
            nama_ibu: '',
            nik_ibu: '',
            pendidikan_ibu: '',
            pekerjaan_ibu: '',
            hp_ibu: ''
        }
    });
    // Step 2: Penempatan
    const [formStep2, setFormStep2] = useState({
        kelas_id: '',
        asrama_id: ''
    });
    // Step 3: Tagihan
    const [selectedTagihan, setSelectedTagihan] = useState([]);
    // Modal pilih kelas untuk tagihan beda per kelas
    const [showKelasModal, setShowKelasModal] = useState(false);
    const [pendingTagihan, setPendingTagihan] = useState(null);
    // Data master
    const [kelasList, setKelasList] = useState([]);
    const [asramaList, setAsramaList] = useState([]);
    const [jenisTagihanList, setJenisTagihanList] = useState([]);
    useEffect(() => {
        loadMasterData();
        fetchSantriMutasiMasuk();
    }, []);
    const fetchSantriMutasiMasuk = async () => {
        try {
            setLoadingList(true);
            const res = await listSantri(1, 100);
            const raw = res;
            let allSantri = [];
            if (raw?.data?.data) {
                allSantri = raw.data.data;
            }
            else if (raw?.data) {
                allSantri = Array.isArray(raw.data) ? raw.data : [];
            }
            else {
                allSantri = Array.isArray(raw) ? raw : [];
            }
            // Filter: santri dengan jenis_penerimaan = 'mutasi_masuk'
            const santriMutasi = allSantri.filter((s) => {
                return s.jenis_penerimaan === 'mutasi_masuk';
            });
            // Urutkan berdasarkan created_at terbaru
            santriMutasi.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB.getTime() - dateA.getTime();
            });
            setSantriList(santriMutasi);
        }
        catch (error) {
            console.error('Error fetching santri:', error);
            toast.error('Gagal memuat data santri mutasi masuk');
        }
        finally {
            setLoadingList(false);
        }
    };
    const loadMasterData = async () => {
        try {
            const [kelasRes, asramaRes, tagihanRes] = await Promise.all([
                listKelas(),
                listAsrama(),
                listJenisTagihan()
            ]);
            console.log('RAW Response - Kelas:', kelasRes);
            console.log('RAW Response - Asrama:', asramaRes);
            console.log('RAW Response - Jenis Tagihan:', tagihanRes);
            // Handle berbagai format response
            let kelasData = [];
            let asramaData = [];
            let tagihanData = [];
            // Parse Kelas
            if (Array.isArray(kelasRes)) {
                kelasData = kelasRes;
            }
            else if (kelasRes?.data) {
                kelasData = Array.isArray(kelasRes.data) ? kelasRes.data : (kelasRes.data.data || []);
            }
            // Parse Asrama
            if (Array.isArray(asramaRes)) {
                asramaData = asramaRes;
            }
            else if (asramaRes?.data) {
                asramaData = Array.isArray(asramaRes.data) ? asramaRes.data : (asramaRes.data.data || []);
            }
            // Parse Jenis Tagihan
            if (Array.isArray(tagihanRes)) {
                tagihanData = tagihanRes;
            }
            else if (tagihanRes?.data) {
                tagihanData = Array.isArray(tagihanRes.data) ? tagihanRes.data : (tagihanRes.data.data || []);
            }
            console.log('PARSED - Kelas:', kelasData);
            console.log('PARSED - Asrama:', asramaData);
            console.log('PARSED - Tagihan:', tagihanData);
            setKelasList(kelasData);
            setAsramaList(asramaData);
            setJenisTagihanList(tagihanData);
            console.log('Loaded - Kelas:', kelasData.length, 'Asrama:', asramaData.length, 'Tagihan:', tagihanData.length);
        }
        catch (error) {
            console.error('Error loading master data:', error);
            toast.error('Gagal memuat data master');
        }
    };
    const handleNext = async () => {
        if (currentStep === 1) {
            // Validasi Step 1
            if (!formStep1.nama_santri || !formStep1.tempat_lahir || !formStep1.tanggal_lahir || !formStep1.nis) {
                toast.error('Mohon lengkapi data pribadi yang wajib diisi');
                return;
            }
            if (!formStep1.orang_tua.nama_ayah || !formStep1.orang_tua.nama_ibu) {
                toast.error('Nama ayah dan ibu wajib diisi');
                return;
            }
            setCurrentStep(2);
        }
        else if (currentStep === 2) {
            // Validasi Step 2
            if (!formStep2.kelas_id || !formStep2.asrama_id) {
                toast.error('Mohon pilih kelas dan asrama');
                return;
            }
            // Langsung ke step 3, tidak simpan data dulu
            setCurrentStep(3);
        }
        else if (currentStep === 3) {
            // Validasi Step 3
            if (selectedTagihan.length === 0) {
                toast.error('Mohon pilih minimal 1 tagihan');
                return;
            }
            setCurrentStep(4);
        }
    };
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    const handleSubmit = async () => {
        try {
            setLoading(true);
            // 1. Simpan data santri dulu
            const formData = new FormData();
            // Data santri
            formData.append('nis', formStep1.nis);
            if (formStep1.nisn)
                formData.append('nisn', formStep1.nisn);
            if (formStep1.nik_santri)
                formData.append('nik_santri', formStep1.nik_santri);
            formData.append('nama_santri', formStep1.nama_santri);
            formData.append('tempat_lahir', formStep1.tempat_lahir);
            formData.append('tanggal_lahir', formStep1.tanggal_lahir);
            formData.append('jenis_kelamin', formStep1.jenis_kelamin);
            formData.append('alamat', formStep1.alamat);
            formData.append('asal_sekolah', formStep1.asal_sekolah);
            formData.append('status', 'aktif');
            formData.append('jenis_penerimaan', 'mutasi_masuk'); // Tandai sebagai mutasi masuk
            // Data opsional santri
            if (formStep1.hobi)
                formData.append('hobi', formStep1.hobi);
            if (formStep1.cita_cita)
                formData.append('cita_cita', formStep1.cita_cita);
            if (formStep1.jumlah_saudara)
                formData.append('jumlah_saudara', String(formStep1.jumlah_saudara));
            if (formStep1.desa)
                formData.append('desa', formStep1.desa);
            if (formStep1.kecamatan)
                formData.append('kecamatan', formStep1.kecamatan);
            if (formStep1.kabupaten)
                formData.append('kabupaten', formStep1.kabupaten);
            if (formStep1.provinsi)
                formData.append('provinsi', formStep1.provinsi);
            if (formStep1.kode_pos)
                formData.append('kode_pos', formStep1.kode_pos);
            // Penempatan
            formData.append('kelas_id', String(formStep2.kelas_id));
            formData.append('asrama_id', String(formStep2.asrama_id));
            // Data orang tua
            if (formStep1.orang_tua.no_kk)
                formData.append('no_kk', formStep1.orang_tua.no_kk);
            formData.append('nama_ayah', formStep1.orang_tua.nama_ayah);
            if (formStep1.orang_tua.nik_ayah)
                formData.append('nik_ayah', formStep1.orang_tua.nik_ayah);
            if (formStep1.orang_tua.pendidikan_ayah)
                formData.append('pendidikan_ayah', formStep1.orang_tua.pendidikan_ayah);
            if (formStep1.orang_tua.pekerjaan_ayah)
                formData.append('pekerjaan_ayah', formStep1.orang_tua.pekerjaan_ayah);
            if (formStep1.orang_tua.hp_ayah)
                formData.append('hp_ayah', formStep1.orang_tua.hp_ayah);
            formData.append('nama_ibu', formStep1.orang_tua.nama_ibu);
            if (formStep1.orang_tua.nik_ibu)
                formData.append('nik_ibu', formStep1.orang_tua.nik_ibu);
            if (formStep1.orang_tua.pendidikan_ibu)
                formData.append('pendidikan_ibu', formStep1.orang_tua.pendidikan_ibu);
            if (formStep1.orang_tua.pekerjaan_ibu)
                formData.append('pekerjaan_ibu', formStep1.orang_tua.pekerjaan_ibu);
            if (formStep1.orang_tua.hp_ibu)
                formData.append('hp_ibu', formStep1.orang_tua.hp_ibu);
            console.log('Menyimpan data santri...');
            const santriResponse = await createSantri(formData);
            const newSantriId = ((santriResponse && santriResponse.data && santriResponse.data.id) ||
                (santriResponse && santriResponse.id) ||
                (santriResponse && santriResponse.santri && santriResponse.santri.id));
            if (!newSantriId) {
                throw new Error('Gagal menyimpan data santri');
            }
            console.log('Santri berhasil disimpan dengan ID:', newSantriId);
            // 2. Buat tagihan sebagai tunggakan (endpoint tersedia di backend)
            console.log('Membuat tagihan (tunggakan)...');
            const tunggakan = selectedTagihan.map((tagihan) => ({
                santri_id: newSantriId,
                jenis_tagihan_id: tagihan.jenis_tagihan_id,
                bulan: getBulanNamaFromDate(tagihan.jatuh_tempo),
                nominal: Number(tagihan.nominal) || 0,
            }));
            if (tunggakan.length > 0) {
                await createTunggakan(tunggakan);
            }
            toast.success('Mutasi masuk berhasil! Santri telah terdaftar dengan tagihan lengkap.');
            // Reset form
            resetForm();
            setCurrentStep(1);
            setShowWizard(false);
            // Refresh list
            fetchSantriMutasiMasuk();
        }
        catch (error) {
            console.error('Error:', error);
            console.error('Error response:', error.response?.data);
            const errorData = error.response?.data;
            const errorMessage = errorData?.message || error?.message || 'Gagal menyimpan data';
            const errors = errorData?.errors;
            if (errors) {
                // Tampilkan error validasi dengan detail
                const errorMessages = Object.entries(errors).map(([field, messages]) => {
                    const msgArray = Array.isArray(messages) ? messages : [messages];
                    return `• ${field}: ${msgArray.join(', ')}`;
                }).join('\n');
                console.error('Validation errors:', errorMessages);
                // Toast dengan pesan yang lebih user-friendly
                if (errors.nis && Array.isArray(errors.nis)) {
                    const nisError = errors.nis[0];
                    if (nisError.includes('already') || nisError.includes('sudah ada') || nisError.includes('unique')) {
                        toast.error('NIS sudah terdaftar! Silakan gunakan NIS yang berbeda.');
                        return;
                    }
                }
                toast.error(`${errorMessage}\n\n${errorMessages}`, { duration: 5000 });
            }
            else {
                toast.error(errorMessage);
            }
        }
        finally {
            setLoading(false);
        }
    };
    const resetForm = () => {
        setFormStep1({
            nis: '',
            nisn: '',
            nik_santri: '',
            nama_santri: '',
            tempat_lahir: '',
            tanggal_lahir: '',
            jenis_kelamin: 'L',
            asal_sekolah: '',
            hobi: '',
            cita_cita: '',
            jumlah_saudara: undefined,
            alamat: '',
            provinsi: '',
            kabupaten: '',
            kecamatan: '',
            desa: '',
            kode_pos: '',
            foto: undefined,
            status: 'aktif',
            orang_tua: {
                no_kk: '',
                nama_ayah: '',
                nik_ayah: '',
                pendidikan_ayah: '',
                pekerjaan_ayah: '',
                hp_ayah: '',
                nama_ibu: '',
                nik_ibu: '',
                pendidikan_ibu: '',
                pekerjaan_ibu: '',
                hp_ibu: ''
            }
        });
        setFormStep2({ kelas_id: '', asrama_id: '' });
        setSelectedTagihan([]);
    };
    const addTagihan = (jenisTagihan) => {
        // Cek apakah sudah ada
        if (selectedTagihan.find(t => t.jenis_tagihan_id === jenisTagihan.id)) {
            toast.error('Tagihan sudah ditambahkan');
            return;
        }
        // Tentukan nominal berdasarkan tipe_nominal
        let nominal = 0;
        let needsKelasSelection = false;
        if (jenisTagihan.tipeNominal === 'sama' || jenisTagihan.tipe_nominal === 'sama') {
            // Ambil dari nominal_sama
            nominal = jenisTagihan.nominalSama || jenisTagihan.nominal_sama || 0;
        }
        else if (jenisTagihan.tipeNominal === 'beda_perkelas' ||
            jenisTagihan.tipe_nominal === 'beda_perkelas' ||
            jenisTagihan.tipeNominal === 'per_kelas' ||
            jenisTagihan.tipe_nominal === 'per_kelas') {
            // Akan dipilih oleh user di modal
            needsKelasSelection = true;
            nominal = 0; // Will be set after kelas selection
        }
        else if (jenisTagihan.tipeNominal === 'per_individu' || jenisTagihan.tipe_nominal === 'per_individu') {
            // Bisa custom, default 0
            nominal = 0;
        }
        // Hitung jatuh tempo berdasarkan tipe
        let jatuhTempo = toLocalDateStr(new Date());
        if (jenisTagihan.kategori === 'Rutin' && jenisTagihan.bulan) {
            const bulanRaw = jenisTagihan.bulan;
            let bulanList = [];
            if (Array.isArray(bulanRaw)) {
                bulanList = bulanRaw;
            }
            else if (typeof bulanRaw === 'string') {
                try {
                    const parsed = JSON.parse(bulanRaw);
                    bulanList = Array.isArray(parsed) ? parsed : bulanRaw.split(',').map((b) => b.trim());
                }
                catch {
                    bulanList = bulanRaw.split(',').map((b) => b.trim());
                }
            }
            const monthMap = {
                'Januari': 0,
                'Februari': 1,
                'Maret': 2,
                'April': 3,
                'Mei': 4,
                'Juni': 5,
                'Juli': 6,
                'Agustus': 7,
                'September': 8,
                'Oktober': 9,
                'November': 10,
                'Desember': 11
            };
            const today = new Date();
            const defaultDay = (() => {
                const namaUpper = (jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || '').toString().toUpperCase();
                if (namaUpper === 'BERAS' || namaUpper === 'BMP')
                    return 10;
                const jt = jenisTagihan.jatuhTempo || jenisTagihan.jatuh_tempo || '';
                const match = String(jt).match(/(\d{1,2})/);
                const d = match ? Number(match[1]) : 10;
                return Math.min(Math.max(d, 1), 28);
            })();
            let foundDate = null;
            for (let i = 0; i < 24; i++) {
                const checkDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
                const monthIndex = checkDate.getMonth();
                const monthName = Object.keys(monthMap).find(k => monthMap[k] === monthIndex);
                if (!monthName)
                    continue;
                if (bulanList.includes(monthName)) {
                    const candidate = new Date(checkDate.getFullYear(), monthIndex, defaultDay);
                    if (candidate >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                        foundDate = candidate;
                        break;
                    }
                }
            }
            if (foundDate) {
                jatuhTempo = toLocalDateStr(foundDate);
            }
        }
        // Non Rutin: gunakan jatuhTempo yang ditetapkan saat pembuatan jenis tagihan jika ada
        if (jenisTagihan.kategori === 'Non Rutin') {
            const jt = jenisTagihan.jatuhTempo || jenisTagihan.jatuh_tempo;
            if (jt) {
                jatuhTempo = jt;
            }
        }
        // Jika perlu pilih kelas, khusus BERAS jangan tampilkan modal
        if (needsKelasSelection) {
            const namaUpper = (jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || '').toString().toUpperCase();
            const isBeras = namaUpper === 'BERAS';
            if (!isBeras) {
                // Tampilkan modal untuk pilih nominal per kelas
                setPendingTagihan({
                    jenis_tagihan: jenisTagihan,
                    jatuh_tempo: jatuhTempo
                });
                setShowKelasModal(true);
                return;
            }
            // BERAS: langsung tambahkan dengan nominal 0, bisa diedit di Tagihan Terpilih
            const newTagihanBeras = {
                jenis_tagihan_id: jenisTagihan.id,
                nama_tagihan: jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || 'Tagihan',
                nominal: 0,
                jatuh_tempo: jatuhTempo,
                is_custom_nominal: false,
                tipe_nominal: jenisTagihan.tipeNominal || jenisTagihan.tipe_nominal
            };
            setSelectedTagihan([...selectedTagihan, newTagihanBeras]);
            toast.success('Tagihan BERAS ditambahkan');
            return;
        }
        const newTagihan = {
            jenis_tagihan_id: jenisTagihan.id,
            nama_tagihan: jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || 'Tagihan',
            nominal: nominal,
            jatuh_tempo: jatuhTempo,
            is_custom_nominal: false,
            tipe_nominal: jenisTagihan.tipeNominal || jenisTagihan.tipe_nominal
        };
        setSelectedTagihan([...selectedTagihan, newTagihan]);
        console.log('Tagihan ditambahkan:', {
            nama: newTagihan.nama_tagihan,
            tipe_nominal: newTagihan.tipe_nominal,
            nominal: newTagihan.nominal
        });
        toast.success(`Tagihan ditambahkan${jenisTagihan.kategori === 'Rutin' ? ` (Jatuh tempo: ${jatuhTempo})` : ''}`);
    };
    const removeTagihan = (jenisTagihanId) => {
        setSelectedTagihan(selectedTagihan.filter(t => t.jenis_tagihan_id !== jenisTagihanId));
    };
    const updateTagihanJatuhTempo = (jenisTagihanId, jatuhTempo) => {
        setSelectedTagihan(selectedTagihan.map(t => t.jenis_tagihan_id === jenisTagihanId ? { ...t, jatuh_tempo: jatuhTempo } : t));
    };
    const updateTagihanNominal = (jenisTagihanId, nominal) => {
        setSelectedTagihan(selectedTagihan.map(t => t.jenis_tagihan_id === jenisTagihanId ? { ...t, nominal, is_custom_nominal: true } : t));
    };
    const handlePilihNominalKelas = (kelasId) => {
        if (!pendingTagihan)
            return;
        const jenisTagihan = pendingTagihan.jenis_tagihan;
        // Cari nominal untuk kelas yang dipilih
        const nominalPerkelas = jenisTagihan.nominalPerkelas || jenisTagihan.nominal_perkelas || [];
        const selectedKelasNominal = nominalPerkelas.find((n) => n.kelas_id === kelasId || n.kelasId === kelasId);
        const nominal = selectedKelasNominal?.nominal || 0;
        const newTagihan = {
            jenis_tagihan_id: jenisTagihan.id,
            nama_tagihan: jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || 'Tagihan',
            nominal: nominal,
            jatuh_tempo: pendingTagihan.jatuh_tempo,
            is_custom_nominal: false,
            kelas_id: kelasId,
            tipe_nominal: jenisTagihan.tipeNominal || jenisTagihan.tipe_nominal
        };
        setSelectedTagihan([...selectedTagihan, newTagihan]);
        toast.success('Tagihan ditambahkan');
        // Close modal
        setShowKelasModal(false);
        setPendingTagihan(null);
    };
    const handleDelete = async (id, nama) => {
        if (!confirm(`Hapus santri "${nama}"?`))
            return;
        try {
            await deleteSantri(id);
            toast.success('Santri berhasil dihapus');
            fetchSantriMutasiMasuk();
        }
        catch (error) {
            console.error('Error deleting:', error);
            toast.error('Gagal menghapus santri');
        }
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    return (_jsx("div", { className: "p-6", children: !showWizard ? (
        /* List Mode */
        _jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-6 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Mutasi Masuk" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Daftar santri yang masuk melalui mutasi dari sekolah/pesantren lain" })] }), _jsxs("button", { onClick: () => setShowWizard(true), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium", children: [_jsx(Plus, { className: "w-5 h-5" }), "Tambah Mutasi Masuk"] })] }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "No" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Nama Santri" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "NIS" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Asal Sekolah" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Tanggal Lahir" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Kelas" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Aksi" })] }) }), _jsx("tbody", { className: "divide-y", children: loadingList ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-8 text-center text-gray-500", children: "Memuat data..." }) })) : santriList.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-8 text-center text-gray-500", children: "Belum ada data santri mutasi masuk" }) })) : (santriList.map((santri, idx) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-gray-900", children: idx + 1 }), _jsx("td", { className: "px-6 py-4 text-gray-900 font-medium", children: santri.nama_santri }), _jsx("td", { className: "px-6 py-4 text-gray-600", children: santri.nis }), _jsx("td", { className: "px-6 py-4 text-gray-600", children: santri.asal_sekolah }), _jsx("td", { className: "px-6 py-4 text-gray-600", children: formatDate(santri.tanggal_lahir) }), _jsx("td", { className: "px-6 py-4 text-gray-600", children: santri.kelas?.nama_kelas || '-' }), _jsx("td", { className: "px-6 py-4", children: _jsx("div", { className: "flex items-center gap-2", children: _jsx("button", { onClick: () => handleDelete(santri.id, santri.nama_santri), className: "p-2 hover:bg-red-100 text-red-600 rounded-lg", title: "Hapus", children: _jsx(Trash2, { className: "w-4 h-4" }) }) }) })] }, santri.id)))) })] }) }) })] })) : (
        /* Wizard Mode */
        _jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-6 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Mutasi Masuk - Santri Baru" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Daftarkan santri baru yang masuk ke pesantren" })] }), _jsx("button", { onClick: () => {
                                if (confirm('Batalkan proses mutasi masuk?')) {
                                    setShowWizard(false);
                                    resetForm();
                                    setCurrentStep(1);
                                }
                            }, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Batal" })] }), _jsx("div", { className: "mb-8", children: _jsx("div", { className: "flex items-center justify-between max-w-3xl mx-auto", children: [
                            { num: 1, label: 'Data Pribadi', icon: User },
                            { num: 2, label: 'Penempatan', icon: MapPin },
                            { num: 3, label: 'Tagihan', icon: DollarSign },
                            { num: 4, label: 'Review', icon: FileCheck }
                        ].map((step, idx) => (_jsxs("div", { className: "flex items-center flex-1", children: [_jsxs("div", { className: "flex flex-col items-center flex-1", children: [_jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center font-semibold ${currentStep >= step.num
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-500'}`, children: currentStep > step.num ? (_jsx(Check, { className: "w-6 h-6" })) : (_jsx(step.icon, { className: "w-6 h-6" })) }), _jsx("span", { className: `text-sm mt-2 font-medium ${currentStep >= step.num ? 'text-blue-600' : 'text-gray-500'}`, children: step.label })] }), idx < 3 && (_jsx("div", { className: `h-1 flex-1 mx-2 ${currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'}` }))] }, step.num))) }) }), _jsx("div", { className: "max-w-4xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [currentStep === 1 && (_jsx(Step1DataPribadi, { formData: formStep1, setFormData: setFormStep1 })), currentStep === 2 && (_jsx(Step2Penempatan, { formData: formStep2, setFormData: setFormStep2, kelasList: kelasList, asramaList: asramaList })), currentStep === 3 && (_jsx(Step3Tagihan, { jenisTagihanList: jenisTagihanList, kelasList: kelasList, selectedTagihan: selectedTagihan, addTagihan: addTagihan, removeTagihan: removeTagihan, updateTagihanJatuhTempo: updateTagihanJatuhTempo, updateTagihanNominal: updateTagihanNominal })), currentStep === 4 && (_jsx(Step4Review, { formStep1: formStep1, formStep2: formStep2, selectedTagihan: selectedTagihan, kelasList: kelasList, asramaList: asramaList })), _jsxs("div", { className: "flex justify-between mt-8 pt-6 border-t", children: [_jsxs("button", { onClick: handleBack, disabled: currentStep === 1, className: "flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(ArrowLeft, { className: "w-5 h-5" }), "Kembali"] }), currentStep < 4 ? (_jsxs("button", { onClick: handleNext, disabled: loading, className: "flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", children: [loading ? 'Menyimpan...' : 'Lanjut', _jsx(ArrowRight, { className: "w-5 h-5" })] })) : (_jsxs("button", { onClick: handleSubmit, disabled: loading, className: "flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50", children: [loading ? 'Menyimpan...' : 'Simpan & Selesai', _jsx(Check, { className: "w-5 h-5" })] }))] })] }) }), showKelasModal && pendingTagihan && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full mx-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Pilih Nominal Berdasarkan Tingkat" }), _jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["Tagihan ", _jsx("strong", { children: pendingTagihan.jenis_tagihan.namaTagihan }), " memiliki nominal berbeda per tingkat. Pilih tingkat yang sesuai untuk santri ini:"] }), _jsx("div", { className: "space-y-2 max-h-96 overflow-y-auto", children: (pendingTagihan.jenis_tagihan.nominalPerkelas || pendingTagihan.jenis_tagihan.nominal_perkelas || []).map((item) => {
                                    const kelas = kelasList.find(k => k.id === (item.kelas_id || item.kelasId));
                                    return (_jsx("button", { onClick: () => handlePilihNominalKelas(item.kelas_id || item.kelasId), className: "w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: kelas?.nama_kelas || `Kelas ${item.kelas_id || item.kelasId}` }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Tingkat ", kelas?.tingkat || '-'] })] }), _jsx("p", { className: "text-lg font-semibold text-blue-600", children: new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 0
                                                    }).format(item.nominal || 0) })] }) }, item.kelas_id || item.kelasId));
                                }) }), _jsx("button", { onClick: () => {
                                    setShowKelasModal(false);
                                    setPendingTagihan(null);
                                }, className: "mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Batal" })] }) }))] })) }));
}
// Component untuk Step 1
function Step1DataPribadi({ formData, setFormData }) {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Data Pribadi Santri" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Nama Lengkap ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: formData.nama_santri, onChange: (e) => setFormData({ ...formData, nama_santri: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["NIS ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: formData.nis, onChange: (e) => setFormData({ ...formData, nis: e.target.value }), className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "Masukkan NIS unik", required: true }), _jsx("button", { type: "button", onClick: () => {
                                            const randomNIS = 'NIS' + Date.now().toString().slice(-8);
                                            setFormData({ ...formData, nis: randomNIS });
                                        }, className: "px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm", title: "Generate NIS otomatis", children: "Auto" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "NIS harus unik (tidak boleh sama dengan santri lain)" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "NISN" }), _jsx("input", { type: "text", value: formData.nisn || '', onChange: (e) => setFormData({ ...formData, nisn: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "NIK Santri" }), _jsx("input", { type: "text", value: formData.nik_santri || '', onChange: (e) => setFormData({ ...formData, nik_santri: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Tempat Lahir ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: formData.tempat_lahir, onChange: (e) => setFormData({ ...formData, tempat_lahir: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Tanggal Lahir ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "date", value: formData.tanggal_lahir, onChange: (e) => setFormData({ ...formData, tanggal_lahir: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Jenis Kelamin" }), _jsxs("select", { value: formData.jenis_kelamin, onChange: (e) => setFormData({ ...formData, jenis_kelamin: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "L", children: "Laki-laki" }), _jsx("option", { value: "P", children: "Perempuan" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Hobi" }), _jsx("input", { type: "text", value: formData.hobi || '', onChange: (e) => setFormData({ ...formData, hobi: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Cita-cita" }), _jsx("input", { type: "text", value: formData.cita_cita || '', onChange: (e) => setFormData({ ...formData, cita_cita: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Jumlah Saudara" }), _jsx("input", { type: "number", value: formData.jumlah_saudara || '', onChange: (e) => setFormData({ ...formData, jumlah_saudara: e.target.value ? Number(e.target.value) : undefined }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Asal Sekolah/Pesantren ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: formData.asal_sekolah, onChange: (e) => setFormData({ ...formData, asal_sekolah: e.target.value }), placeholder: "Contoh: SMP Negeri 1 Jakarta / Pesantren Al-Hikmah", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Alamat" }), _jsx("textarea", { value: formData.alamat, onChange: (e) => setFormData({ ...formData, alamat: e.target.value }), rows: 3, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Desa/Kelurahan" }), _jsx("input", { type: "text", value: formData.desa || '', onChange: (e) => setFormData({ ...formData, desa: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Kecamatan" }), _jsx("input", { type: "text", value: formData.kecamatan || '', onChange: (e) => setFormData({ ...formData, kecamatan: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Kabupaten/Kota" }), _jsx("input", { type: "text", value: formData.kabupaten || '', onChange: (e) => setFormData({ ...formData, kabupaten: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Provinsi" }), _jsx("input", { type: "text", value: formData.provinsi || '', onChange: (e) => setFormData({ ...formData, provinsi: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Kode Pos" }), _jsx("input", { type: "text", value: formData.kode_pos || '', onChange: (e) => setFormData({ ...formData, kode_pos: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { className: "pt-4 border-t", children: [_jsx("h3", { className: "text-md font-semibold text-gray-900 mb-4", children: "Data Orang Tua/Wali" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "No. KK" }), _jsx("input", { type: "text", value: formData.orang_tua.no_kk || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, no_kk: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsx("div", {}), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Nama Ayah ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: formData.orang_tua.nama_ayah, onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, nama_ayah: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "NIK Ayah" }), _jsx("input", { type: "text", value: formData.orang_tua.nik_ayah || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, nik_ayah: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Pendidikan Ayah" }), _jsx("input", { type: "text", value: formData.orang_tua.pendidikan_ayah || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, pendidikan_ayah: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Pekerjaan Ayah" }), _jsx("input", { type: "text", value: formData.orang_tua.pekerjaan_ayah || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, pekerjaan_ayah: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "HP Ayah" }), _jsx("input", { type: "text", value: formData.orang_tua.hp_ayah || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, hp_ayah: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Nama Ibu ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: formData.orang_tua.nama_ibu, onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, nama_ibu: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "NIK Ibu" }), _jsx("input", { type: "text", value: formData.orang_tua.nik_ibu || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, nik_ibu: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Pendidikan Ibu" }), _jsx("input", { type: "text", value: formData.orang_tua.pendidikan_ibu || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, pendidikan_ibu: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Pekerjaan Ibu" }), _jsx("input", { type: "text", value: formData.orang_tua.pekerjaan_ibu || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, pekerjaan_ibu: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "HP Ibu" }), _jsx("input", { type: "text", value: formData.orang_tua.hp_ibu || '', onChange: (e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, hp_ibu: e.target.value } }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" })] })] })] })] }));
}
// Component untuk Step 2
function Step2Penempatan({ formData, setFormData, kelasList, asramaList }) {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Penempatan Kelas & Asrama" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Pilih Kelas ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.kelas_id, onChange: (e) => setFormData({ ...formData, kelas_id: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true, children: [_jsx("option", { value: "", children: "-- Pilih Kelas --" }), kelasList.map((kelas) => (_jsx("option", { value: kelas.id, children: kelas.nama_kelas }, kelas.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Pilih Asrama ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { value: formData.asrama_id, onChange: (e) => setFormData({ ...formData, asrama_id: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", required: true, children: [_jsx("option", { value: "", children: "-- Pilih Asrama --" }), asramaList.map((asrama) => (_jsx("option", { value: asrama.id, children: asrama.nama_asrama }, asrama.id)))] })] })] })] }));
}
// Component untuk Step 3
function Step3Tagihan({ jenisTagihanList, kelasList, selectedTagihan, addTagihan, removeTagihan, updateTagihanJatuhTempo, updateTagihanNominal }) {
    const formatRupiah = (nominal) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(nominal);
    };
    const totalTagihan = selectedTagihan.reduce((sum, t) => sum + Number(t.nominal), 0);
    console.log('=== STEP 3 DEBUG ===');
    console.log('jenisTagihanList:', jenisTagihanList);
    console.log('jenisTagihanList.length:', jenisTagihanList.length);
    if (jenisTagihanList.length > 0) {
        console.log('First item:', jenisTagihanList[0]);
    }
    console.log('selectedTagihan:', selectedTagihan);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Pilih Tagihan" }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Jenis Tagihan Tersedia (", jenisTagihanList.length, " item)"] }), jenisTagihanList.length === 0 ? (_jsxs("div", { className: "p-8 border-2 border-dashed border-gray-300 rounded-lg text-center", children: [_jsx("p", { className: "text-gray-500 mb-2", children: "Belum ada jenis tagihan tersedia" }), _jsx("p", { className: "text-sm text-gray-400", children: "Silakan tambahkan jenis tagihan di menu Keuangan \u2192 Jenis Tagihan terlebih dahulu" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: jenisTagihanList.map((jenis) => (_jsx("div", { className: "p-4 border border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors", onClick: () => addTagihan(jenis), children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: jenis.namaTagihan || jenis.nama_tagihan || 'Tagihan' }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: jenis.kategori || '' })] }), _jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            addTagihan(jenis);
                                        }, className: "p-1 text-blue-600 hover:bg-blue-50 rounded flex-shrink-0", type: "button", children: _jsx(Plus, { className: "w-5 h-5" }) })] }) }, jenis.id))) }))] }), selectedTagihan.length > 0 && (_jsxs("div", { className: "pt-4 border-t", children: [_jsx("h3", { className: "text-md font-semibold text-gray-900 mb-3", children: "Tagihan Terpilih" }), _jsx("div", { className: "space-y-3", children: selectedTagihan.map((tagihan) => (_jsxs("div", { className: "p-4 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsx("div", { className: "flex-1", children: _jsx("p", { className: "font-medium text-gray-900", children: tagihan.nama_tagihan }) }), _jsx("button", { onClick: () => removeTagihan(tagihan.jenis_tagihan_id), className: "text-red-600 hover:bg-red-100 p-1 rounded", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-xs text-gray-600 mb-1", children: ["Nominal ", tagihan.is_custom_nominal && _jsx("span", { className: "text-blue-600", children: "(Custom)" })] }), tagihan.tipe_nominal === 'per_individu' || tagihan.tipe_nominal === 'per_kelas' || tagihan.tipe_nominal === 'beda_perkelas' ? (_jsxs(_Fragment, { children: [_jsx("input", { type: "number", value: tagihan.nominal || '', onChange: (e) => updateTagihanNominal(tagihan.jenis_tagihan_id, Number(e.target.value) || 0), className: "w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500", placeholder: "Masukkan nominal", min: "0" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: formatRupiah(Number(tagihan.nominal) || 0) }), tagihan.kelas_id && (_jsxs("p", { className: "text-xs text-blue-600 mt-1", children: ["Tingkat ", kelasList.find((k) => k.id === tagihan.kelas_id)?.tingkat || tagihan.kelas_id] }))] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700", children: tagihan.nominal || 0 }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: formatRupiah(Number(tagihan.nominal) || 0) })] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "Jatuh Tempo" }), tagihan.tipe_nominal === 'per_individu' ? (_jsx("input", { type: "date", value: tagihan.jatuh_tempo || '', onChange: (e) => updateTagihanJatuhTempo(tagihan.jenis_tagihan_id, e.target.value), className: "w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" })) : (_jsx("div", { className: "w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700", children: tagihan.jatuh_tempo || '-' }))] })] })] }, tagihan.jenis_tagihan_id))) }), _jsx("div", { className: "mt-4 p-4 bg-gray-100 rounded-lg", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-semibold text-gray-900", children: "Total Tagihan:" }), _jsx("span", { className: "text-xl font-bold text-blue-600", children: formatRupiah(totalTagihan) })] }) })] }))] }));
}
// Component untuk Step 4
function Step4Review({ formStep1, formStep2, selectedTagihan, kelasList, asramaList }) {
    const formatRupiah = (nominal) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(nominal);
    };
    const kelas = kelasList.find((k) => k.id === Number(formStep2.kelas_id));
    const asrama = asramaList.find((a) => a.id === Number(formStep2.asrama_id));
    const totalTagihan = selectedTagihan.reduce((sum, t) => sum + Number(t.nominal), 0);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Review & Konfirmasi" }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "Data Santri" }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Nama:" }), _jsx("p", { className: "font-medium", children: formStep1.nama_santri })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "NIS:" }), _jsx("p", { className: "font-medium", children: formStep1.nis })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Tempat, Tgl Lahir:" }), _jsxs("p", { className: "font-medium", children: [formStep1.tempat_lahir, ", ", formStep1.tanggal_lahir] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Jenis Kelamin:" }), _jsx("p", { className: "font-medium", children: formStep1.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Asal Sekolah:" }), _jsx("p", { className: "font-medium", children: formStep1.asal_sekolah })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Orang Tua:" }), _jsxs("p", { className: "font-medium", children: [formStep1.orang_tua.nama_ayah, " & ", formStep1.orang_tua.nama_ibu] })] })] })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "Penempatan" }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Kelas:" }), _jsx("p", { className: "font-medium", children: kelas?.nama_kelas || '-' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Asrama:" }), _jsx("p", { className: "font-medium", children: asrama?.nama_asrama || '-' })] })] })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "Tagihan" }), _jsxs("div", { className: "space-y-2", children: [selectedTagihan.map((tagihan) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-700", children: tagihan.nama_tagihan }), _jsx("span", { className: "font-medium", children: formatRupiah(tagihan.nominal) })] }, tagihan.jenis_tagihan_id))), _jsxs("div", { className: "pt-2 border-t flex justify-between font-semibold", children: [_jsx("span", { children: "Total:" }), _jsx("span", { className: "text-blue-600", children: formatRupiah(totalTagihan) })] })] })] }), _jsx("div", { className: "p-4 bg-green-50 border border-green-200 rounded-lg", children: _jsx("p", { className: "text-sm text-green-800", children: "\u2713 Data santri siap disimpan. Klik \"Simpan & Selesai\" untuk menyelesaikan proses mutasi masuk." }) })] }));
}
const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
const bulanNamaID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const getBulanNamaFromDate = (dateStr) => {
    if (!dateStr)
        return '';
    const d = new Date(dateStr);
    const idx = d.getMonth();
    return bulanNamaID[idx] || '';
};
