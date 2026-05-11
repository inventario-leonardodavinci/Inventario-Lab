import * as React from "react"
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// ─── Badge Premium Variants ────────────────────────────────

const badgePremiumVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20",
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
        outline: "border border-border bg-background hover:bg-muted",
        ghost: "hover:bg-muted",
        soft: "bg-muted text-muted-foreground hover:bg-muted/80",
      },
      size: {
        default: "h-6 px-2.5 text-xs",
        sm: "h-5 px-2 text-[11px]",
        lg: "h-7 px-3 text-sm",
        icon: "size-6 p-0",
      },
      glow: {
        true: "shadow-sm",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        glow: true,
        class: "shadow-primary/20 shadow-[0_0_8px_-2px]",
      },
      {
        variant: "success",
        glow: true,
        class: "shadow-green-500/20 shadow-[0_0_8px_-2px]",
      },
      {
        variant: "warning",
        glow: true,
        class: "shadow-amber-500/20 shadow-[0_0_8px_-2px]",
      },
      {
        variant: "destructive",
        glow: true,
        class: "shadow-destructive/20 shadow-[0_0_8px_-2px]",
      },
      {
        variant: "info",
        glow: true,
        class: "shadow-blue-500/20 shadow-[0_0_8px_-2px]",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
    },
  }
)

// ─── Badge Premium Component ───────────────────────────────

interface BadgePremiumProps extends VariantProps<typeof badgePremiumVariants> {
  icon?: React.ReactNode
  animate?: boolean
  pulse?: boolean
  dot?: boolean
  dotColor?: string
  removable?: boolean
  onRemove?: () => void
  className?: string
  children?: React.ReactNode
}

const BadgePremium = React.forwardRef<HTMLSpanElement, BadgePremiumProps>(
  ({ 
    className, 
    variant, 
    size, 
    glow,
    icon, 
    animate = false,
    pulse = false,
    dot = false,
    dotColor,
    removable = false,
    onRemove,
    children,
    ...props 
  }, ref) => {
    const content = (
      <>
        {dot && (
          <span 
            className={cn(
              "size-1.5 rounded-full",
              pulse && "relative",
              dotColor || (variant === 'destructive' ? 'bg-destructive' : 
                         variant === 'success' ? 'bg-green-500' :
                         variant === 'warning' ? 'bg-amber-500' :
                         variant === 'info' ? 'bg-blue-500' : 'bg-primary')
            )}
          >
            {pulse && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-inherit" />
            )}
          </span>
        )}
        {icon && <span className="size-3.5 shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
        {removable && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            className="ml-0.5 -mr-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
          >
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </>
    )

    if (animate) {
      return (
        <motion.span
          ref={ref}
          initial={{ opacity: 0, scale: 0.8, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className={cn(badgePremiumVariants({ variant, size, glow }), className)}
          {...props}
        >
          {content}
        </motion.span>
      )
    }

    return (
      <span
        ref={ref}
        className={cn(badgePremiumVariants({ variant, size, glow }), className)}
        {...props}
      >
        {content}
      </span>
    )
  }
)
BadgePremium.displayName = "BadgePremium"

// ─── Status Badge ────────────────────────────────────────

interface StatusBadgeProps extends Omit<BadgePremiumProps, 'variant' | 'dot'> {
  status: 'online' | 'offline' | 'busy' | 'away' | 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning'
  showPulse?: boolean
}

const statusConfig = {
  online: { variant: 'success' as const, label: 'En línea' },
  offline: { variant: 'soft' as const, label: 'Desconectado' },
  busy: { variant: 'warning' as const, label: 'Ocupado' },
  away: { variant: 'warning' as const, label: 'Ausente' },
  active: { variant: 'success' as const, label: 'Activo' },
  inactive: { variant: 'soft' as const, label: 'Inactivo' },
  pending: { variant: 'warning' as const, label: 'Pendiente' },
  error: { variant: 'destructive' as const, label: 'Error' },
  success: { variant: 'success' as const, label: 'Completado' },
  warning: { variant: 'warning' as const, label: 'Advertencia' },
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showPulse = false, className, children, ...props }, ref) => {
    const config = statusConfig[status]
    
    return (
      <BadgePremium
        ref={ref}
        variant={config.variant}
        dot
        pulse={showPulse}
        className={className}
        {...props}
      >
        {children || config.label}
      </BadgePremium>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

// ─── Count Badge ─────────────────────────────────────────

interface CountBadgeProps {
  count: number
  max?: number
  variant?: 'default' | 'destructive' | 'primary'
  className?: string
}

const CountBadge = React.forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ count, max = 99, variant = 'default', className }, ref) => {
    const displayCount = count > max ? `${max}+` : count
    
    const variantClasses = {
      default: "bg-muted text-muted-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      primary: "bg-primary text-primary-foreground",
    }
    
    return (
      <motion.span
        ref={ref}
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={cn(
          "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5",
          "rounded-full text-[10px] font-bold tabular-nums",
          variantClasses[variant],
          className
        )}
      >
        {displayCount}
      </motion.span>
    )
  }
)
CountBadge.displayName = "CountBadge"

// ─── Notification Badge ──────────────────────────────────

interface NotificationBadgeProps {
  count?: number
  dot?: boolean
  pulse?: boolean
  className?: string
  children?: React.ReactNode
}

const NotificationBadge = React.forwardRef<HTMLSpanElement, NotificationBadgeProps>(
  ({ count, dot = false, pulse = true, className, children }, ref) => {
    return (
      <span ref={ref} className={cn("relative inline-flex", className)}>
        {children}
        {dot ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            {pulse && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            )}
            <span className="relative inline-flex rounded-full size-2.5 bg-destructive border-2 border-background" />
          </span>
        ) : count !== undefined && count > 0 ? (
          <span className="absolute -top-2 -right-2">
            <CountBadge count={count} variant="destructive" />
          </span>
        ) : null}
      </span>
    )
  }
)
NotificationBadge.displayName = "NotificationBadge"

export {
  BadgePremium,
  StatusBadge,
  CountBadge,
  NotificationBadge,
  badgePremiumVariants,
}
