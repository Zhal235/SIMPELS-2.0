import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useRef, useState } from 'react';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});
    const dismiss = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const timer = timers.current[id];
        if (timer) {
            window.clearTimeout(timer);
            delete timers.current[id];
        }
    };
    const showToast = (t) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const item = { id, title: t.title, description: t.description, variant: t.variant ?? 'info' };
        setToasts((prev) => [item, ...prev]);
        timers.current[id] = window.setTimeout(() => dismiss(id), 3500);
        return id;
    };
    return (_jsxs(ToastContext.Provider, { value: { toasts, showToast, dismiss }, children: [children, _jsx("div", { className: "pointer-events-none fixed right-4 top-4 z-50 flex w-96 max-w-full flex-col gap-2", children: toasts.map((t) => (_jsx(ToastCard, { toast: t, onPause: () => {
                        const timer = timers.current[t.id];
                        if (timer) {
                            window.clearTimeout(timer);
                            delete timers.current[t.id];
                        }
                    }, onResume: () => {
                        if (!timers.current[t.id]) {
                            timers.current[t.id] = window.setTimeout(() => dismiss(t.id), 1500);
                        }
                    }, onClose: () => dismiss(t.id) }, t.id))) })] }));
}
function ToastCard({ toast, onPause, onResume, onClose }) {
    const color = toast.variant === 'success' ? 'border-green-500' : toast.variant === 'error' ? 'border-red-500' : 'border-blue-500';
    const bg = toast.variant === 'success' ? 'bg-green-50' : toast.variant === 'error' ? 'bg-red-50' : 'bg-blue-50';
    return (_jsx("div", { className: `pointer-events-auto ${bg} rounded-md shadow-md border-l-4 ${color} p-3`, onMouseEnter: onPause, onMouseLeave: onResume, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-semibold text-gray-800", children: toast.title }), toast.description && _jsx("div", { className: "text-sm text-gray-700", children: toast.description })] }), _jsx("button", { className: "text-gray-500 hover:text-gray-700", onClick: onClose, "aria-label": "Close", children: "\u2715" })] }) }));
}
export function useToastContext() {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error('ToastProvider missing');
    return ctx;
}
