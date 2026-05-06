/**
 * Skeletons de carga específicos por tipo de página.
 * Cada variante replica fielmente la estructura visual de su página.
 */
import { Skeleton } from '@/components/ui/skeleton'

// ─── Bloques reutilizables ────────────────────────────────────────────────────

export function SkeletonCard({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function SkeletonCardHeader({ titleW = 'w-40', descW = 'w-56' }: { titleW?: string; descW?: string }) {
  return (
    <div className="mb-4 flex flex-col gap-2">
      <Skeleton className={`h-5 ${titleW}`} />
      <Skeleton className={`h-3.5 ${descW}`} />
    </div>
  )
}

function SkeletonTableRows({ cols, rows = 6 }: { cols: string[]; rows?: number }) {
  return (
    <>
      {/* Header */}
      <div className="mb-3 flex gap-4 border-b pb-2">
        {cols.map((w, i) => <Skeleton key={i} className={`h-3.5 ${w}`} />)}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2.5 border-b last:border-0">
          {cols.map((w, j) => <Skeleton key={j} className={`h-3.5 ${w}`} />)}
        </div>
      ))}
    </>
  )
}

function SkeletonPageHeader({
  hasButton = true,
  buttonW = 'w-32',
}: {
  hasButton?: boolean
  buttonW?: string
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      {hasButton && <Skeleton className={`h-9 ${buttonW}`} />}
    </div>
  )
}

// ─── Variantes por página ─────────────────────────────────────────────────────

/** Panel principal: 4 KPI cards + tabla alertas + feed actividad */
export function SkeletonPanel() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <SkeletonPageHeader buttonW="w-52" />

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex items-start justify-between pb-2">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="size-9 rounded-md" />
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Tabla alertas + feed */}
      <div className="grid gap-4 xl:grid-cols-3">
        <SkeletonCard className="xl:col-span-2">
          <SkeletonCardHeader titleW="w-52" descW="w-64" />
          <SkeletonTableRows cols={['w-1/3', 'w-20', 'w-20', 'w-16']} rows={5} />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonCardHeader titleW="w-36" descW="w-44" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </main>
  )
}

/** Tabla genérica: cabecera + card filtros + card tabla */
export function SkeletonTabla({
  cols,
  hasFilterBar = true,
  hasButton = true,
  rows = 7,
}: {
  cols: string[]
  hasFilterBar?: boolean
  hasButton?: boolean
  rows?: number
}) {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <SkeletonPageHeader hasButton={hasButton} />

      {hasFilterBar && (
        <SkeletonCard>
          <SkeletonCardHeader titleW="w-36" descW="w-48" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 flex-1 min-w-[160px]" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-24" />
          </div>
        </SkeletonCard>
      )}

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-44" descW="w-32" />
        <SkeletonTableRows cols={cols} rows={rows} />
      </SkeletonCard>
    </main>
  )
}

/** Artículos: filtros + tabla con 7 columnas */
export function SkeletonArticulos() {
  return (
    <SkeletonTabla
      cols={['w-20', 'flex-1', 'w-24', 'w-16', 'w-16', 'w-16', 'w-16', 'w-20']}
      rows={7}
    />
  )
}

/** Categorías: tabla simple sin filtros */
export function SkeletonCategorias() {
  return (
    <SkeletonTabla
      cols={['flex-1', 'w-24', 'w-20']}
      hasFilterBar={false}
      rows={6}
    />
  )
}

/** Ubicaciones: tabla simple sin filtros */
export function SkeletonUbicaciones() {
  return (
    <SkeletonTabla
      cols={['flex-1', 'w-24', 'w-48', 'w-20']}
      hasFilterBar={false}
      rows={6}
    />
  )
}

/** Movimientos: formulario + tabla */
export function SkeletonMovimientos() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <SkeletonPageHeader hasButton={false} />

      {/* Formulario */}
      <SkeletonCard>
        <SkeletonCardHeader titleW="w-52" descW="w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <div className="flex items-end md:col-span-2">
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </SkeletonCard>

      {/* Historial */}
      <SkeletonCard>
        <SkeletonCardHeader titleW="w-36" descW="w-28" />
        <div className="mb-3 flex justify-end">
          <Skeleton className="h-9 w-36" />
        </div>
        <SkeletonTableRows cols={['w-16', 'w-20', 'flex-1', 'w-20', 'w-20', 'w-32']} rows={6} />
      </SkeletonCard>
    </main>
  )
}

/** Alertas: filtros (3 dropdowns) + tabla */
export function SkeletonAlertas() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <SkeletonPageHeader hasButton={false} />

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-20" descW="w-56" />
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-40" />
            </div>
          ))}
          <div className="flex items-end gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-36" descW="w-28" />
        <SkeletonTableRows cols={['w-24', 'w-16', 'w-16', 'flex-1', 'w-32', 'w-28']} rows={7} />
      </SkeletonCard>
    </main>
  )
}

/** Mantenimiento: input rápido + tabla */
export function SkeletonMantenimiento() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <SkeletonPageHeader hasButton={false} />

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-40" descW="w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-28" />
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-36" descW="w-28" />
        <SkeletonTableRows cols={['w-12', 'w-28', 'w-20', 'flex-1', 'w-24']} rows={5} />
      </SkeletonCard>
    </main>
  )
}

/** Informes: filtros fecha + 3 stat cards + tabla */
export function SkeletonInformes() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <SkeletonPageHeader hasButton={false} />

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-36" descW="w-56" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <div className="flex justify-end gap-2 md:col-span-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
      </SkeletonCard>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i}>
            <Skeleton className="mb-2 h-3.5 w-28" />
            <Skeleton className="h-9 w-16" />
          </SkeletonCard>
        ))}
      </div>

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-36" descW="w-28" />
        <SkeletonTableRows cols={['w-20', 'flex-1', 'w-28', 'w-20', 'w-32']} rows={6} />
      </SkeletonCard>
    </main>
  )
}

/** Usuarios: tabla con selector de rol inline */
export function SkeletonUsuarios() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <SkeletonPageHeader hasButton={false} />

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-36" descW="w-52" />
        <div className="mb-3 flex gap-4 border-b pb-2">
          {['flex-1', 'w-28', 'w-32', 'w-36'].map((w, i) => (
            <Skeleton key={i} className={`h-3.5 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-8 w-36 rounded-md" />
          </div>
        ))}
      </SkeletonCard>
    </main>
  )
}

/** Auditoría: filtros + tabla con detalle expandible */
export function SkeletonAuditoria() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <SkeletonPageHeader hasButton={false} />

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-20" descW="w-56" />
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-40" />
            </div>
          ))}
          <div className="flex items-end gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <SkeletonCardHeader titleW="w-44" descW="w-24" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 py-3 border-b last:border-0">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-32" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </SkeletonCard>
    </main>
  )
}

/** Perfil: tarjeta identidad + tabs + cards */
export function SkeletonPerfil() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Tarjeta identidad */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-5 p-6">
          <Skeleton className="size-20 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-5 w-20 rounded-full mt-1" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 w-fit rounded-xl bg-muted/60 p-1 border border-border/50">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </main>
  )
}
