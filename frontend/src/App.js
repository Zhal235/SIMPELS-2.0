import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SantriLegacy = lazy(() => import('./pages/Santri'));
const Keuangan = lazy(() => import('./pages/Keuangan'));
const Absensi = lazy(() => import('./pages/Absensi'));
const Pengguna = lazy(() => import('./pages/Pengguna'));
const Pengaturan = lazy(() => import('./pages/Pengaturan'));
// Kesantrian subpages
const KesantrianSantri = lazy(() => import('./pages/kesantrian/Santri'));
const KesantrianKelas = lazy(() => import('./pages/kesantrian/Kelas'));
const KesantrianAsrama = lazy(() => import('./pages/kesantrian/Asrama'));
const MutasiMasuk = lazy(() => import('./pages/kesantrian/MutasiMasuk'));
const MutasiKeluar = lazy(() => import('./pages/kesantrian/MutasiKeluar'));
const Alumni = lazy(() => import('./pages/kesantrian/Alumni'));
// Akademik subpages (dipindah: Kelas berada di menu Kesantrian)
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsxs("div", { className: "flex h-screen bg-[#F5F5F5]", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex w-full flex-col", children: [_jsx(Topbar, {}), _jsxs("main", { className: "flex-1 overflow-y-auto p-4", children: [_jsx(Toaster, { position: "top-right", richColors: true, expand: true }), _jsx(HotToaster, { position: "top-right" }), _jsx(ErrorBoundary, { children: _jsx(Suspense, { fallback: _jsx("div", { children: "Loading..." }), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/santri", element: _jsx(Navigate, { to: "/kesantrian/santri", replace: true }) }), _jsx(Route, { path: "/kesantrian", element: _jsx(Navigate, { to: "/kesantrian/santri", replace: true }) }), _jsx(Route, { path: "/kesantrian/mutasi", element: _jsx(Navigate, { to: "/kesantrian/mutasi/masuk", replace: true }) }), _jsx(Route, { path: "/keuangan", element: _jsx(Keuangan, {}) }), _jsx(Route, { path: "/absensi", element: _jsx(Absensi, {}) }), _jsx(Route, { path: "/pengguna", element: _jsx(Pengguna, {}) }), _jsx(Route, { path: "/pengaturan", element: _jsx(Pengaturan, {}) }), _jsx(Route, { path: "/kesantrian/santri", element: _jsx(KesantrianSantri, {}) }), _jsx(Route, { path: "/kesantrian/kelas", element: _jsx(KesantrianKelas, {}) }), _jsx(Route, { path: "/kesantrian/asrama", element: _jsx(KesantrianAsrama, {}) }), _jsx(Route, { path: "/kesantrian/mutasi/masuk", element: _jsx(MutasiMasuk, {}) }), _jsx(Route, { path: "/kesantrian/mutasi/keluar", element: _jsx(MutasiKeluar, {}) }), _jsx(Route, { path: "/kesantrian/alumni", element: _jsx(Alumni, {}) })] }) }) })] })] })] }) }));
}
