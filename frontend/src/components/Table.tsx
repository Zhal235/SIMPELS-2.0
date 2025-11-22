import { PropsWithChildren } from 'react'
import React from 'react'

// Allow custom, synthetic columns (e.g., 'no', 'actions') in addition to real keys of T
type Column<T> = { key: keyof T | string; header: string; render?: (value: any, row: T, idx: number) => React.ReactNode }

type TableProps<T> = PropsWithChildren<{
  columns: Column<T>[];
  data: T[];
  getRowKey?: (row: T, idx: number) => React.Key;
  // optional renderer to show extra row after a given row (e.g., inline editor)
  renderExpandedRow?: (row: T, idx: number) => React.ReactNode | null;
}>

export default function Table<T extends Record<string, any>>({ columns, data, getRowKey, renderExpandedRow }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {Array.isArray(data) && data.map((row, idx) => {
            const rowKey = getRowKey ? getRowKey(row, idx) : idx
            return (
              <React.Fragment key={String(rowKey)}>
                <tr className="hover:bg-gray-50">
                {columns.map((col) => {
                  // Safely read value when key may be synthetic (not present on row)
                  const key = col.key as keyof T
                  const value = (row as any)[key]
                  return (
                    <td key={String(col.key)} className="px-4 py-2 text-sm text-gray-700">
                      {col.render ? col.render(value, row, idx) : String(value ?? '')}
                    </td>
                  )
                })}
                </tr>
                {renderExpandedRow && (
                  <tr>
                    <td colSpan={columns.length} className="bg-gray-50 py-3 px-4">
                      {renderExpandedRow(row, idx)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}