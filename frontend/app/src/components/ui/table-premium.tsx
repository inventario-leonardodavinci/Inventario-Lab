import { cn } from "@/lib/utils"
import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react"

interface TablePremiumProps extends HTMLAttributes<HTMLTableElement> {
  hoverable?: boolean
  animate?: boolean
}

export function TablePremium({ className, hoverable = true, animate = true, children, ...props }: TablePremiumProps) {
  return (
    <table className={cn("w-full caption-bottom text-sm", hoverable && "", animate && "", className)} {...props}>
      {children}
    </table>
  )
}

export function TableHeaderPremium({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props}>{children}</thead>
}

export function TableBodyPremium({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>{children}</tbody>
}

interface TableHeadPremiumProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right"
}

export function TableHeadPremium({ className, align, children, ...props }: TableHeadPremiumProps) {
  return (
    <th className={cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      align === "right" && "text-right", align === "center" && "text-center", className)} {...props}>
      {children}
    </th>
  )
}

interface TableRowPremiumProps extends HTMLAttributes<HTMLTableRowElement> {
  delay?: number
}

export function TableRowPremium({ className, children, ...props }: TableRowPremiumProps) {
  return <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props}>{children}</tr>
}

interface TableCellPremiumProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right"
}

export function TableCellPremium({ className, align, children, ...props }: TableCellPremiumProps) {
  return (
    <td className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0",
      align === "right" && "text-right", align === "center" && "text-center", className)} {...props}>
      {children}
    </td>
  )
}

interface TableLoadingProps {
  rows?: number
  cols?: number
  showHeader?: boolean
  asTable?: boolean
}

export function TableLoading({ rows = 4, cols = 4, showHeader = true, asTable = false }: TableLoadingProps) {
  const content = (
    <>
      {showHeader && (
        <div className="flex gap-2 mb-3">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={`h-${i}`} className="h-4 flex-1 rounded bg-muted animate-pulse" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-2 mb-2">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={`${r}-${c}`} className="h-3 flex-1 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ))}
    </>
  )
  if (asTable) return <div className="p-4">{content}</div>
  return <>{content}</>
}
