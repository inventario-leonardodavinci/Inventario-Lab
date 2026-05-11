import * as React from "react"
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"

// ─── Card Premium con efectos avanzados ─────────────────────

interface CardPremiumProps extends React.ComponentProps<"div"> {
  variant?: "default" | "glass" | "gradient" | "elevated"
  hover?: "lift" | "glow" | "none"
  animate?: boolean
  delay?: number
}

const CardPremium = React.forwardRef<HTMLDivElement, CardPremiumProps>(
  ({ className, variant = "default", hover = "lift", animate = true, delay = 0, children, ...props }, ref) => {
    const baseClasses = cn(
      "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground",
      // Variant styles
      variant === "glass" && "glass border border-border/50",
      variant === "gradient" && "gradient-border",
      variant === "elevated" && "shadow-lg shadow-black/5 dark:shadow-black/20",
      // Hover effects
      hover === "lift" && "card-hover-lift cursor-pointer",
      hover === "glow" && "card-hover-glow",
      className
    )

    if (animate) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.4, 
            delay, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className={baseClasses}
        >
          {children}
        </motion.div>
      )
    }

    return <div ref={ref} className={baseClasses} {...props}>{children}</div>
  }
)
CardPremium.displayName = "CardPremium"

// ─── Card Header Premium ─────────────────────────────────────

interface CardHeaderPremiumProps extends React.ComponentProps<"div"> {
  action?: React.ReactNode
  icon?: React.ReactNode
  iconColor?: string
}

const CardHeaderPremium = React.forwardRef<HTMLDivElement, CardHeaderPremiumProps>(
  ({ className, children, action, icon, iconColor, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between gap-4 px-4",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {icon && (
            <motion.div 
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                iconColor || "bg-primary/10 text-primary"
              )}
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {icon}
            </motion.div>
          )}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {children}
          </div>
        </div>
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
    )
  }
)
CardHeaderPremium.displayName = "CardHeaderPremium"

// ─── Card Title Premium ────────────────────────────────────

const CardTitlePremium = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "font-semibold text-base leading-tight tracking-tight",
          className
        )}
        {...props}
      />
    )
  }
)
CardTitlePremium.displayName = "CardTitlePremium"

// ─── Card Description Premium ────────────────────────────────

const CardDescriptionPremium = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-sm text-muted-foreground leading-relaxed",
          className
        )}
        {...props}
      />
    )
  }
)
CardDescriptionPremium.displayName = "CardDescriptionPremium"

// ─── Card Content Premium ──────────────────────────────────

const CardContentPremium = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-4", className)}
        {...props}
      />
    )
  }
)
CardContentPremium.displayName = "CardContentPremium"

// ─── Stat Card Premium (especial para métricas) ──────────────

interface StatCardPremiumProps extends React.ComponentProps<"div"> {
  title: string
  value: React.ReactNode
  description?: string
  icon: React.ReactNode
  iconColor?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  loading?: boolean
  delay?: number
}

const StatCardPremium = React.forwardRef<HTMLDivElement, StatCardPremiumProps>(
  ({ className, title, value, description, icon, iconColor, trend, loading, delay = 0, children }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group relative overflow-hidden rounded-xl bg-card p-4",
          "card-hover-lift cursor-pointer",
          "border border-border/50",
          className
        )}
      >
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground font-medium">{title}</span>
            <div className="flex items-baseline gap-2">
              {loading ? (
                <div className="h-8 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <motion.span 
                  className="text-3xl font-bold tracking-tight"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: delay + 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  {value}
                </motion.span>
              )}
              {trend && !loading && (
                <span className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-green-600 dark:text-green-400" : "text-destructive"
                )}>
                  {trend.positive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
          
          <motion.div 
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              iconColor || "bg-primary/10 text-primary"
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {icon}
          </motion.div>
        </div>

        {/* Progress indicator if trend exists */}
        {trend && !loading && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  trend.positive ? "bg-green-500" : "bg-destructive"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(trend.value), 100)}%` }}
                transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-xs text-muted-foreground mt-1">{trend.label}</span>
          </div>
        )}
        {children}
      </motion.div>
    )
  }
)
StatCardPremium.displayName = "StatCardPremium"

// ─── Empty State Premium ───────────────────────────────────

interface EmptyStatePremiumProps extends React.ComponentProps<"div"> {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyStatePremium = React.forwardRef<HTMLDivElement, EmptyStatePremiumProps>(
  ({ className, icon, title, description, action, children }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex flex-col items-center justify-center gap-4 py-12 text-center",
          className
        )}
      >
        <motion.div 
          className="flex size-14 items-center justify-center rounded-2xl bg-muted"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {icon}
        </motion.div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground max-w-[200px]">{description}</p>
          )}
        </div>
        {action}
        {children}
      </motion.div>
    )
  }
)
EmptyStatePremium.displayName = "EmptyStatePremium"

export {
  CardPremium,
  CardHeaderPremium,
  CardTitlePremium,
  CardDescriptionPremium,
  CardContentPremium,
  StatCardPremium,
  EmptyStatePremium,
}
