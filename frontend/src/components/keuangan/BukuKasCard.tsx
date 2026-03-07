interface KasMutasi {
  buku_kas: { id: number; nama_kas: string }
  saldo_awal_cash: number
  saldo_awal_bank: number
  mutasi_masuk_cash: number
  mutasi_masuk_bank: number
  mutasi_keluar_cash: number
  mutasi_keluar_bank: number
  saldo_akhir_cash: number
  saldo_akhir_bank: number
  total_saldo_akhir: number
}

interface Props {
  kas: KasMutasi
  formatCurrency: (value: number) => string
}

export default function BukuKasCard({ kas, formatCurrency }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
        <h3 className="text-lg font-semibold text-white">{kas.buku_kas.nama_kas}</h3>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 pb-2 border-b-2 border-blue-200">
              💵 KAS TUNAI (CASH)
            </h4>
            <div className="space-y-2 ml-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Saldo Awal</span>
                <span className="font-medium">{formatCurrency(kas.saldo_awal_cash)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Mutasi Masuk (+)</span>
                <span className="font-medium">{formatCurrency(kas.mutasi_masuk_cash)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Mutasi Keluar (-)</span>
                <span className="font-medium">{formatCurrency(kas.mutasi_keluar_cash)}</span>
              </div>
              <div className="flex justify-between font-semibold text-blue-600 pt-2 border-t-2 border-gray-200">
                <span>Saldo Akhir</span>
                <span>{formatCurrency(kas.saldo_akhir_cash)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 pb-2 border-b-2 border-green-200">
              🏦 KAS BANK (TRANSFER)
            </h4>
            <div className="space-y-2 ml-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Saldo Awal</span>
                <span className="font-medium">{formatCurrency(kas.saldo_awal_bank)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Mutasi Masuk (+)</span>
                <span className="font-medium">{formatCurrency(kas.mutasi_masuk_bank)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Mutasi Keluar (-)</span>
                <span className="font-medium">{formatCurrency(kas.mutasi_keluar_bank)}</span>
              </div>
              <div className="flex justify-between font-semibold text-green-600 pt-2 border-t-2 border-gray-200">
                <span>Saldo Akhir</span>
                <span>{formatCurrency(kas.saldo_akhir_bank)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-4 border-gray-900">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">TOTAL SALDO AKHIR</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(kas.total_saldo_akhir)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
