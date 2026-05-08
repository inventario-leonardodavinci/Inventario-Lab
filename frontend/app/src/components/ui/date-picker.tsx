"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

interface DatePickerProps {
  id?: string
  label?: string
  value?: string | Date
  onChange: (date: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
  buttonClassName,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Convertir string a Date para el calendar
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    return new Date(value)
  }, [value])

  // Verificar si la fecha es válida
  const isValidDate = dateValue && !isNaN(dateValue.getTime())

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Formatear como YYYY-MM-DD para inputs tipo date
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange(undefined)
    }
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !isValidDate && "text-muted-foreground",
              buttonClassName
            )}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0" />
            <span className="truncate">
              {isValidDate 
                ? format(dateValue, "PPP", { locale: es })
                : placeholder
              }
            </span>
            {isValidDate && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                className="ml-auto size-4 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                ×
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={isValidDate ? dateValue : undefined}
            onSelect={handleSelect}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Variante simplificada sin label
interface DatePickerSimpleProps {
  value?: string | Date
  onChange: (date: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePickerSimple({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
}: DatePickerSimpleProps) {
  const [open, setOpen] = React.useState(false)
  
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    return new Date(value)
  }, [value])

  const isValidDate = dateValue && !isNaN(dateValue.getTime())

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange(undefined)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !isValidDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          <span className="truncate">
            {isValidDate 
              ? format(dateValue, "PPP", { locale: es })
              : placeholder
            }
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={isValidDate ? dateValue : undefined}
          onSelect={handleSelect}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}
