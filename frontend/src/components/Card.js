import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Card({ children, className = '', title, subtitle }) {
    return (_jsxs("section", { className: `card ${className}`, children: [(title || subtitle) && (_jsxs("div", { className: "mb-3", children: [title && _jsx("h2", { className: "text-base font-semibold", children: title }), subtitle && _jsx("p", { className: "text-sm text-gray-600", children: subtitle })] })), children] }));
}
