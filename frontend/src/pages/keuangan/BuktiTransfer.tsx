import { useState, useEffect } from 'react';
import api from '../../api';
import { CheckCircle, XCircle, Eye, FileText, User, Calendar, DollarSign, Filter } from 'lucide-react';
import Modal from '../../components/Modal'
import toast from 'react-hot-toast';

interface BuktiTransfer {
  id: number;
  jenis_transaksi?: 'pembayaran' | 'topup' | 'pembayaran_topup';
  santri: {
    id: string;
    nis: string;
    nama: string;
    kelas: string | null;
  };
  selected_bank?: {
    id: number;
    bank_name: string;
    account_number: string;
    account_name: string;
  } | null;
  total_nominal: number;
  status: 'pending' | 'approved' | 'rejected';
  catatan_wali: string | null;
  catatan_admin: string | null;
  bukti_url: string;
  uploaded_at: string;
  processed_at: string | null;
  processed_by: string | null;
  tagihan: Array<{
    id: number;
    jenis: string;
    bulan: string | null;
    tahun: number;
    nominal: number;
    dibayar: number;
    sisa: number;
    status: string;
  }>;
}

export default function BuktiTransfer() {
  const [buktiList, setBuktiList] = useState<BuktiTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBukti, setSelectedBukti] = useState<BuktiTransfer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadBuktiTransfer();
  }, [activeTab, historyFilter]);

  const loadBuktiTransfer = async () => {
    try {
      setLoading(true);
      let params: any = {};
      
      if (activeTab === 'pending') {
        params.status = 'pending';
      } else {
        // History tab - apply filter
        if (historyFilter === 'approved') {
          params.status = 'approved';
        } else if (historyFilter === 'rejected') {
          params.status = 'rejected';
        }
        // If 'all', don't add status param to get all processed bukti
      }
      
      const response = await api.get('/admin/bukti-transfer', { params });
      setBuktiList(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (bukti: BuktiTransfer, type: 'approve' | 'reject') => {
    setSelectedBukti(bukti);
    setActionType(type);
    setCatatan('');
    setShowModal(true);
  };

  const submitAction = async () => {
    if (!selectedBukti || !actionType) return;

    if (actionType === 'reject' && !catatan.trim()) {
      toast.error('Catatan penolakan wajib diisi');
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/admin/bukti-transfer/${selectedBukti.id}/${actionType}`, {
        catatan: catatan.trim(),
      });

      toast.success(
        actionType === 'approve'
          ? 'Bukti transfer berhasil disetujui'
          : 'Bukti transfer ditolak'
      );

      setShowModal(false);
      loadBuktiTransfer();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses');
    } finally {
      setProcessing(false);
    }
  };

  // Approve immediately from image modal (no extra confirmation)
  const handleApproveDirect = async (bukti: BuktiTransfer) => {
    try {
      setProcessing(true);
      await api.post(`/admin/bukti-transfer/${bukti.id}/approve`, { catatan: '' });
      toast.success('Bukti transfer berhasil disetujui');
      setShowImageModal(false);
      loadBuktiTransfer();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyetujui bukti');
    } finally {
      setProcessing(false);
    }
  };

  // Reject from image modal — ask for reason then submit
  const handleRejectDirect = async (bukti: BuktiTransfer) => {
    const reason = window.prompt('Alasan penolakan (wajib):');
    if (!reason || !reason.trim()) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/admin/bukti-transfer/${bukti.id}/reject`, { catatan: reason.trim() });
      toast.success('Bukti transfer berhasil ditolak');
      setShowImageModal(false);
      loadBuktiTransfer();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menolak bukti');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bukti Transfer</h1>
            <p className="text-gray-600 mt-1">Verifikasi pembayaran dari wali santri</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Histori
          </button>
        </div>

        {/* History Filter - shown only in history tab */}
        {activeTab === 'history' && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                historyFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              Semua
            </button>
            <button
              onClick={() => setHistoryFilter('approved')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                historyFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Disetujui
            </button>
            <button
              onClick={() => setHistoryFilter('rejected')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                historyFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <XCircle className="h-4 w-4" />
              Ditolak
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : buktiList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Tidak ada bukti transfer</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {buktiList.map((bukti) => (
            <div key={bukti.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-bold text-lg">{bukti.santri.nama}</h3>
                        <p className="text-sm text-gray-600">
                          {bukti.santri.nis} {bukti.santri.kelas && `• ${bukti.santri.kelas}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {activeTab === 'history' && bukti.processed_at
                          ? `Diproses: ${formatDate(bukti.processed_at)}`
                          : `Upload: ${formatDate(bukti.uploaded_at)}`}
                      </span>
                    </div>
                    
                    {activeTab === 'history' && bukti.processed_by && (
                      <p className="text-xs text-gray-500 mt-1">
                        Oleh: <span className="font-semibold">{bukti.processed_by}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    {getStatusBadge(bukti.status)}
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(bukti.total_nominal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  {bukti.selected_bank && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 text-blue-900">Transfer ke:</h4>
                      <div className="text-sm text-blue-800">
                        <div className="font-bold">{bukti.selected_bank.bank_name}</div>
                        <div className="font-mono">{bukti.selected_bank.account_number}</div>
                        <div className="text-xs">{bukti.selected_bank.account_name}</div>
                      </div>
                    </div>
                  )}
                  
                  <h4 className="font-semibold text-sm mb-3">
                    {bukti.jenis_transaksi === 'topup' 
                      ? 'Top-up Dompet' 
                      : bukti.jenis_transaksi === 'pembayaran_topup'
                        ? 'Pembayaran Tagihan + Top-up'
                        : 'Tagihan yang dibayar:'}
                  </h4>
                  <div className="space-y-2">
                    {bukti.tagihan.length > 0 ? (
                      bukti.tagihan.map((t, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {t.jenis} {t.bulan && `- ${t.bulan} ${t.tahun}`}
                          </span>
                          <span className="font-medium">{formatCurrency(t.sisa)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        {bukti.jenis_transaksi === 'topup' ? 'Top-up dompet santri' : 'Tidak ada detail tagihan'}
                      </div>
                    )}
                  </div>
                </div>

                {bukti.catatan_wali && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Catatan: </span>
                      {bukti.catatan_wali}
                    </p>
                  </div>
                )}

                {bukti.catatan_admin && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Admin: </span>
                      {bukti.catatan_admin}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedBukti(bukti);
                      setShowImageModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">Lihat Bukti</span>
                  </button>
                  
                  {activeTab === 'pending' && bukti.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(bukti, 'approve')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Setujui</span>
                      </button>
                      
                      <button
                        onClick={() => handleAction(bukti, 'reject')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">Tolak</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for action confirmation */}
      {showModal && selectedBukti && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">
                {actionType === 'approve' ? 'Setujui' : 'Tolak'} Bukti Transfer
              </h3>
              
              <p className="text-gray-600 mb-4">
                Pembayaran dari <strong>{selectedBukti.santri.nama}</strong>
                <br />
                Total: <strong>{formatCurrency(selectedBukti.total_nominal)}</strong>
              </p>

              <label className="block mb-2 text-sm font-medium">
                Catatan {actionType === 'reject' && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={
                  actionType === 'approve'
                    ? 'Catatan (opsional)'
                    : 'Alasan penolakan (wajib)'
                }
              />

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={submitAction}
                  disabled={processing}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {processing ? 'Memproses...' : 'Konfirmasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing image */}
      {showImageModal && selectedBukti && (
        <Modal
          open={showImageModal}
          title={selectedBukti.santri.nama}
          onClose={() => setShowImageModal(false)}
          footer={
            selectedBukti.status === 'pending' ? (
              <div className="w-full flex gap-3">
                <button
                  disabled={processing}
                  onClick={() => handleApproveDirect(selectedBukti)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Setujui</span>
                </button>
                <button
                  disabled={processing}
                  onClick={() => handleRejectDirect(selectedBukti)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Tolak</span>
                </button>
              </div>
            ) : undefined
          }
        >
          <div className="p-4 bg-white flex items-center justify-center overflow-auto" style={{ maxHeight: '65vh' }}>
            <img
              src={selectedBukti.bukti_url}
              alt="Bukti Transfer"
              className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <p class="text-gray-500 text-center">Gambar tidak dapat dimuat</p>
                    <p class="text-xs text-gray-400 mt-2">URL: ${selectedBukti.bukti_url || 'Tidak tersedia'}</p>
                  </div>
                `;
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
