'use client';

interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableRow {
  [key: string]: any;
}

interface TableProps {
  columns: TableColumn[];
  data: TableRow[];
  className?: string;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
}

export function Table({ 
  columns, 
  data, 
  className = '', 
  striped = true, 
  bordered = false, 
  hover = true 
}: TableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">Nenhum dado encontrado</div>
          <div className="text-sm">A tabela está vazia</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`min-w-full ${bordered ? 'border border-gray-200' : ''}`}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                  ${bordered ? 'border-b border-gray-200' : ''}
                `}
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr
              key={index}
              className={`
                ${striped && index % 2 === 1 ? 'bg-gray-50' : ''}
                ${hover ? 'hover:bg-gray-100' : ''}
                transition-colors duration-150
              `}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    px-4 py-3 text-sm text-gray-900 whitespace-nowrap
                    ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                    ${bordered ? 'border-b border-gray-200' : ''}
                  `}
                >
                  {row[column.key] !== null && row[column.key] !== undefined 
                    ? String(row[column.key]) 
                    : '-'
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;