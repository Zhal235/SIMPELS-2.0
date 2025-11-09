import { PropsWithChildren } from 'react'

type Column<T> = { key: keyof T; header: string; render?: (value: any, row: T, idx: number) => React.ReactNode }

type TableProps<T> = PropsWithChildren<{ columns: Column<T>[]; data: T[] }>

export default function Table<T extends Record<string, any>>({ columns, data }: TableProps<T>) {
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
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2 text-sm text-gray-700">
                  {col.render ? col.render(row[col.key], row, idx) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}