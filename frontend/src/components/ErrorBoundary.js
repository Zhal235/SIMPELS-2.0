import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { toast } from 'sonner';
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: undefined };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Global error captured by ErrorBoundary:', error, errorInfo);
        const message = String(error?.message || 'Terjadi error tak terduga.');
        toast.error(message, {
            description: 'Silakan muat ulang halaman atau hubungi admin jika masalah berlanjut.',
        });
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "p-4", children: _jsxs("div", { className: "rounded border border-red-200 bg-red-50 p-4", children: [_jsx("h2", { className: "text-lg font-semibold text-red-700", children: "Terjadi error tak terduga." }), _jsx("p", { className: "text-sm text-red-600", children: "Silakan coba muat ulang halaman." }), _jsx("div", { className: "mt-2", children: _jsx("button", { className: "btn btn-primary", onClick: () => {
                                    this.setState({ hasError: false, error: undefined });
                                    window.location.reload();
                                }, children: "Muat Ulang" }) })] }) }));
        }
        return this.props.children;
    }
}
