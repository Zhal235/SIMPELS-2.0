import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/useUIStore';
export default function Topbar() {
    const location = useLocation();
    const { toggleSidebar } = useUIStore();
    // Build breadcrumb based on pathname
    const segments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = (() => {
        if (segments.length === 0)
            return [{ name: 'Dashboard', to: '/' }];
        if (segments[0] === 'kesantrian') {
            const items = [{ name: 'Kesantrian', to: '/kesantrian' }];
            if (segments[1] === 'mutasi') {
                items.push({ name: 'Mutasi', to: '/kesantrian/mutasi' });
                if (segments[2] === 'masuk')
                    items.push({ name: 'Masuk', to: '/kesantrian/mutasi/masuk' });
                else if (segments[2] === 'keluar')
                    items.push({ name: 'Keluar', to: '/kesantrian/mutasi/keluar' });
                return items;
            }
            const subMap = {
                santri: 'Data Santri',
                kelas: 'Kelas',
                asrama: 'Asrama',
                alumni: 'Alumni',
            };
            const label = subMap[segments[1]] ?? '';
            if (label)
                items.push({ name: label, to: `/kesantrian/${segments[1]}` });
            return items;
        }
        const topMap = {
            '': 'Dashboard',
            keuangan: 'Keuangan',
            absensi: 'Absensi',
            pengguna: 'Pengguna',
            pengaturan: 'Pengaturan',
        };
        const name = topMap[segments[0]] ?? 'Halaman';
        return [{ name, to: `/${segments[0]}` }];
    })();
    return (_jsxs("header", { className: "sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { className: "btn btn-primary", onClick: toggleSidebar, children: "Menu" }), _jsx("nav", { className: "flex items-center gap-2 text-sm", children: breadcrumbs.map((bc, idx) => (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx(Link, { to: bc.to, className: "text-gray-800 font-medium hover:text-brand", children: bc.name }), idx < breadcrumbs.length - 1 && _jsx("span", { className: "text-gray-400", children: "/" })] }, idx))) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm font-medium", children: "Admin" }), _jsx("div", { className: "text-xs text-gray-500", children: "admin@example.com" })] }), _jsx("img", { className: "h-8 w-8 rounded-full", src: "https://api.dicebear.com/7.x/initials/svg?seed=AZ", alt: "avatar" })] })] }));
}
