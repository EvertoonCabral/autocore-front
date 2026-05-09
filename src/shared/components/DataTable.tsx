import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from './EmptyState'
import { cn } from '@/lib/cn'

export interface ColumnDef<T> {
  id: string
  header: ReactNode
  /** Render do conteúdo da célula. */
  cell: (row: T) => ReactNode
  /** Largura/classe extra (ex.: "w-32 text-right"). */
  className?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[] | undefined
  loading?: boolean
  /** Função estável que extrai a chave única do item. */
  rowKey: (row: T) => string | number
  /** Disparado ao clicar numa linha (cursor pointer + hover). */
  onRowClick?: (row: T) => void
  /** Mostrar este conteúdo quando `data` estiver vazio. */
  empty?: ReactNode
}

export function DataTable<T>({
  columns,
  data,
  loading,
  rowKey,
  onRowClick,
  empty,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.id} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.id} className={c.className}>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <>{empty ?? <EmptyState />}</>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.id} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              {columns.map((c) => (
                <TableCell key={c.id} className={c.className}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
