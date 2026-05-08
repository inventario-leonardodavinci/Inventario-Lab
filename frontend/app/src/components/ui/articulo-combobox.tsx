"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useArticulos } from "@/hooks/queries"
import type { Articulo } from "@/types"
import { DEBOUNCE_DELAY_MS } from "@/constants"

interface ArticuloComboboxProps {
  value?: Articulo | null
  onChange: (articulo: Articulo | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ArticuloCombobox({
  value,
  onChange,
  placeholder = "Seleccionar artículo...",
  disabled,
  className,
}: ArticuloComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, DEBOUNCE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch articles with search
  const { data, isFetching } = useArticulos({
    search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    per_page: 50,
  })

  const articulos = data?.data ?? []

  // Handle selection
  const handleSelect = React.useCallback((articulo: Articulo) => {
    onChange(articulo)
    setOpen(false)
    setSearch("")
    setDebouncedSearch("")
  }, [onChange])

  // Handle clear
  const handleClear = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setSearch("")
    setDebouncedSearch("")
  }, [onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {value ? value.nombre : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="rounded-sm opacity-50 hover:opacity-100"
                aria-label="Limpiar selección"
              >
                <span className="sr-only">Limpiar</span>
                ×
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre o código..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Buscando...</span>
              </div>
            ) : search.length > 0 && search.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres
              </div>
            ) : articulos.length === 0 ? (
              <CommandEmpty>
                {search.length >= 2
                  ? "No se encontraron artículos"
                  : "Escribe para buscar artículos"}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {articulos.map((articulo) => (
                  <CommandItem
                    key={articulo.id}
                    value={String(articulo.id)}
                    onSelect={() => handleSelect(articulo)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === articulo.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="truncate">{articulo.nombre}</span>
                      {articulo.codigo && (
                        <span className="text-xs text-muted-foreground">
                          {articulo.codigo}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
