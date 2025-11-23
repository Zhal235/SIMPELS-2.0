import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
export default function Modal({ open, title, children, onClose, footer }) {
    if (!open)
        return null;
    return (_jsx(AnimatePresence, { children: open && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/30", onClick: onClose }), _jsxs(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 12 }, transition: { type: 'spring', stiffness: 300, damping: 24 }, className: "relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg", children: [title && _jsx("h3", { className: "mb-2 text-lg font-semibold", children: title }), _jsx("div", { className: "max-h-[75vh] overflow-y-auto px-2", children: children }), _jsx("div", { className: "mt-4 flex justify-end gap-2", children: footer !== undefined ? footer : (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: onClose, children: "Tutup" }), _jsx("button", { className: "btn btn-primary", onClick: onClose, children: "Simpan" })] })) })] })] })) }));
}
