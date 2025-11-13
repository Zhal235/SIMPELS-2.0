import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import { useAuthStore } from './stores/useAuthStore';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SantriLegacy = lazy(() => import('./pages/Santri'));
const Pengguna = lazy(() => import('./pages/Pengguna'));
const Pengaturan = lazy(() => import('./pages/Pengaturan'));
const Login = lazy(() => import('./pages/Login'));
// Kesantrian subpages
const KesantrianSantri = lazy(() => import('./pages/kesantrian/Santri'));
const KesantrianKelas = lazy(() => import('./pages/kesantrian/Kelas'));
const KesantrianAsrama = lazy(() => import('./pages/kesantrian/Asrama'));
const MutasiMasuk = lazy(() => import('./pages/kesantrian/MutasiMasuk'));
const MutasiKeluar = lazy(() => import('./pages/kesantrian/MutasiKeluar'));
const Alumni = lazy(() => import('./pages/kesantrian/Alumni'));
// Keuangan subpages
const PembayaranSantri = lazy(() => import('./pages/keuangan/PembayaranSantri'));
const TransaksiKas = lazy(() => import('./pages/keuangan/TransaksiKas'));
const BukuKas = lazy(() => import('./pages/keuangan/BukuKas'));
const TagihanSantri = lazy(() => import('./pages/keuangan/TagihanSantri'));
const TunggakanAktif = lazy(() => import('./pages/keuangan/TunggakanAktif'));
const TunggakanMutasi = lazy(() => import('./pages/keuangan/TunggakanMutasi'));
const TunggakanAlumni = lazy(() => import('./pages/keuangan/TunggakanAlumni'));
const JenisTagihan = lazy(() => import('./pages/keuangan/JenisTagihan'));
const KeringananTagihan = lazy(() => import('./pages/keuangan/KeringananTagihan'));
// Akademik subpages
const AkademikTahunAjaran = lazy(() => import('./pages/akademik/TahunAjaran'));
// Protected Route Component
function ProtectedRoute({ children }) {
    const token = useAuthStore((state) => state.token);
    if (!token) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
// Layout Component with Sidebar and Topbar
function AppLayout({ children }) {
    return (_jsxs("div", { className: "flex h-screen bg-[#F5F5F5]", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex w-full flex-col", children: [_jsx(Topbar, {}), _jsx("main", { className: "flex-1 overflow-y-auto p-4", children: children })] })] }));
}
export default function App() {
    return (_jsxs(BrowserRouter, { children: [_jsx(Toaster, { position: "top-right", richColors: true, expand: true }), _jsx(HotToaster, { position: "top-right" }), _jsx(ErrorBoundary, { children: _jsx(Suspense, { fallback: _jsx("div", { className: "p-6 text-center text-gray-500", children: "Memuat halaman..." }), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(Dashboard, {}) }) }) }), _jsx(Route, { path: "/santri", element: _jsx(Navigate, { to: "/kesantrian/santri", replace: true }) }), _jsx(Route, { path: "/kesantrian", element: _jsx(Navigate, { to: "/kesantrian/santri", replace: true }) }), _jsx(Route, { path: "/kesantrian/mutasi", element: _jsx(Navigate, { to: "/kesantrian/mutasi/masuk", replace: true }) }), _jsx(Route, { path: "/keuangan", element: _jsx(Navigate, { to: "/keuangan/pembayaran", replace: true }) }), _jsx(Route, { path: "/keuangan/tunggakan", element: _jsx(Navigate, { to: "/keuangan/tunggakan/aktif", replace: true }) }), _jsx(Route, { path: "/keuangan/pengaturan", element: _jsx(Navigate, { to: "/keuangan/pengaturan/jenis-tagihan", replace: true }) }), _jsx(Route, { path: "/akademik", element: _jsx(Navigate, { to: "/akademik/tahun-ajaran", replace: true }) }), _jsx(Route, { path: "/kesantrian/santri", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(KesantrianSantri, {}) }) }) }), _jsx(Route, { path: "/kesantrian/kelas", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(KesantrianKelas, {}) }) }) }), _jsx(Route, { path: "/kesantrian/asrama", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(KesantrianAsrama, {}) }) }) }), _jsx(Route, { path: "/kesantrian/mutasi/masuk", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(MutasiMasuk, {}) }) }) }), _jsx(Route, { path: "/kesantrian/mutasi/keluar", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(MutasiKeluar, {}) }) }) }), _jsx(Route, { path: "/kesantrian/alumni", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(Alumni, {}) }) }) }), _jsx(Route, { path: "/keuangan/pembayaran", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(PembayaranSantri, {}) }) }) }), _jsx(Route, { path: "/keuangan/transaksi-kas", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(TransaksiKas, {}) }) }) }), _jsx(Route, { path: "/keuangan/buku-kas", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(BukuKas, {}) }) }) }), _jsx(Route, { path: "/keuangan/tagihan", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(TagihanSantri, {}) }) }) }), _jsx(Route, { path: "/keuangan/tunggakan/aktif", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(TunggakanAktif, {}) }) }) }), _jsx(Route, { path: "/keuangan/tunggakan/mutasi", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(TunggakanMutasi, {}) }) }) }), _jsx(Route, { path: "/keuangan/tunggakan/alumni", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(TunggakanAlumni, {}) }) }) }), _jsx(Route, { path: "/keuangan/pengaturan/jenis-tagihan", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(JenisTagihan, {}) }) }) }), _jsx(Route, { path: "/keuangan/pengaturan/keringanan", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(KeringananTagihan, {}) }) }) }), _jsx(Route, { path: "/pengguna", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(Pengguna, {}) }) }) }), _jsx(Route, { path: "/pengaturan", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(Pengaturan, {}) }) }) }), _jsx(Route, { path: "/akademik/tahun-ajaran", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(AkademikTahunAjaran, {}) }) }) })] }) }) })] }));
}
