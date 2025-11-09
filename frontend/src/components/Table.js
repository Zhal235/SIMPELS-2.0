import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Table({ columns, data, getRowKey }) {
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsx("tr", { children: columns.map((col) => (_jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: col.header }, String(col.key)))) }) }), _jsx("tbody", { className: "divide-y divide-gray-100 bg-white", children: Array.isArray(data) && data.map((row, idx) => {
                        const rowKey = getRowKey ? getRowKey(row, idx) : idx;
                        return (_jsx("tr", { className: "hover:bg-gray-50", children: columns.map((col) => {
                                // Safely read value when key may be synthetic (not present on row)
                                const key = col.key;
                                const value = row[key];
                                return (_jsx("td", { className: "px-4 py-2 text-sm text-gray-700", children: col.render ? col.render(value, row, idx) : String(value ?? '') }, String(col.key)));
                            }) }, String(rowKey)));
                    }) })] }) }));
}
