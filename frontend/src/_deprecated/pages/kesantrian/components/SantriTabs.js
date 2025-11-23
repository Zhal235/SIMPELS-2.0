import { jsx as _jsx } from "react/jsx-runtime";
export default function SantriTabs({ tabs, active, onChange }) {
    return (_jsx("div", { className: "relative z-10 flex flex-wrap gap-2 border-b border-gray-200 bg-gray-100 rounded-t-lg p-1 shadow-sm mb-4", children: tabs.map((tab) => {
            const isActive = tab === active;
            const base = 'px-4 py-2 text-sm font-medium rounded-t-md transition-all duration-200 cursor-pointer';
            const activeCls = 'border-b-2 border-emerald-600 bg-white text-emerald-600 font-semibold';
            const inactiveCls = 'text-gray-500 hover:text-gray-700';
            return (_jsx("button", { type: "button", className: `${base} ${isActive ? activeCls : inactiveCls}`, onClick: (e) => { e.preventDefault(); onChange(tab); }, children: tab }, tab));
        }) }));
}
