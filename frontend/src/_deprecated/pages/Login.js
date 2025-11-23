import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { login } from '../api/auth';
import { toast } from 'sonner';
import { Lock, Mail, Eye, EyeOff, LogIn } from 'lucide-react';
export default function Login() {
    const navigate = useNavigate();
    const { setToken, setUser } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Email dan password harus diisi');
            return;
        }
        setLoading(true);
        try {
            const response = await login(email, password);
            if (response.token && response.user) {
                setToken(response.token);
                setUser(response.user);
                toast.success('Login berhasil!');
                navigate('/');
            }
            else {
                toast.error('Response tidak valid dari server');
            }
        }
        catch (error) {
            const message = error?.response?.data?.message || 'Login gagal. Periksa email dan password Anda.';
            toast.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50", children: _jsxs("div", { className: "w-full max-w-md p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4", children: _jsx("span", { className: "text-2xl font-bold text-white", children: "S" }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "SIMPELS 2.0" }), _jsx("p", { className: "text-gray-600", children: "Sistem Informasi Manajemen Pesantren" })] }), _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 border border-gray-100", children: [_jsx("h2", { className: "text-2xl font-semibold text-gray-900 mb-6", children: "Masuk ke Akun" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-2", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Mail, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "nama@example.com", className: "block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors", disabled: loading })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-2", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Lock, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { id: "password", type: showPassword ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors", disabled: loading }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute inset-y-0 right-0 pr-3 flex items-center", disabled: loading, children: showPassword ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400 hover:text-gray-600" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400 hover:text-gray-600" })) })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("span", { className: "ml-2 text-sm text-gray-600", children: "Ingat saya" })] }), _jsx("a", { href: "#", className: "text-sm text-blue-600 hover:text-blue-700 font-medium", children: "Lupa password?" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("span", { children: "Memproses..." })] })) : (_jsxs(_Fragment, { children: [_jsx(LogIn, { className: "h-5 w-5" }), _jsx("span", { children: "Masuk" })] })) })] })] }), _jsx("p", { className: "text-center text-sm text-gray-600 mt-6", children: "\u00A9 2025 SIMPELS 2.0. All rights reserved." })] }) }));
}
