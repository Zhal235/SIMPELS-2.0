import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Card from '../components/Card';
import { useUIStore } from '../stores/useUIStore';
export default function Pengaturan() {
    const { theme, setTheme } = useUIStore();
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Pengaturan" }), _jsx(Card, { title: "Tema", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn", onClick: () => setTheme('light'), children: "Light" }), _jsx("button", { className: "btn", onClick: () => setTheme('dark'), children: "Dark" }), _jsxs("span", { className: "ml-2 text-sm text-gray-600", children: ["Saat ini: ", theme] })] }) }), _jsx(Card, { title: "Sesi", children: _jsx("button", { className: "btn btn-primary", children: "Logout" }) })] }));
}
