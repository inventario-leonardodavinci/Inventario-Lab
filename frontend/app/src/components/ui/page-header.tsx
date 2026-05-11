import * as React from "react"
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { ChevronRight, ArrowLeft } from 'lucide-react'

// ─── Page Header Premium ───────────────────────────────────

interface PageHeaderProps extends React.ComponentProps<"div"> {
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  backHref?: string
  onBack?: () => void
  centered?: boolean
  compact?: boolean
  animate?: boolean
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ 
    className, 
    title, 
    description, 
    icon,
    iconColor = "bg-primary/10 text-primary",
    breadcrumbs,
    action,
    secondaryAction,
    backHref,
    onBack,
    centered = false,
    compact = false,
    animate = true,
    ...props 
  }, ref) => {
    const content = (
      <>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="size-3" />}
                {crumb.href ? (
                  <a 
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className={index === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className={cn(
          "flex items-start gap-4",
          centered && "flex-col items-center text-center",
          !centered && "flex-col sm:flex-row sm:items-center sm:justify-between"
        )}>
          <div className={cn(
            "flex items-start gap-3",
            centered && "flex-col items-center"
          )}>
            {/* Back button */}
            {(backHref || onBack) && (
              <motion.button
                onClick={onBack}
                className="flex items-center justify-center size-8 rounded-lg hover:bg-accent transition-colors"
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="size-4" />
              </motion.button>
            )}

            {/* Icon */}
            {icon && (
              <motion.div 
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  iconColor
                )}
                initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
                animate={animate ? { scale: 1, opacity: 1 } : undefined}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {icon}
              </motion.div>
            )}

            {/* Title and description */}
            <div className={cn("space-y-1", centered && "items-center")}>
              <motion.h1 
                className={cn(
                  "font-bold tracking-tight text-foreground",
                  compact ? "text-xl" : "text-2xl"
                )}
                initial={animate ? { opacity: 0, y: 4 } : undefined}
                animate={animate ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                {title}
              </motion.h1>
              {description && (
                <motion.p 
                  className={cn(
                    "text-muted-foreground",
                    compact ? "text-xs" : "text-sm"
                  )}
                  initial={animate ? { opacity: 0, y: 4 } : undefined}
                  animate={animate ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {description}
                </motion.p>
              )}
            </div>
          </div>

          {/* Actions */}
          {(action || secondaryAction) && (
            <motion.div 
              className={cn(
                "flex items-center gap-2 shrink-0",
                centered && "mt-4",
                !centered && "mt-4 sm:mt-0"
              )}
              initial={animate ? { opacity: 0, x: 8 } : undefined}
              animate={animate ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {secondaryAction}
              {action}
            </motion.div>
          )}
        </div>
      </>
    )

    return (
      <div 
        ref={ref} 
        className={cn(
          "page-section",
          className
        )}
        {...props}
      >
        {content}
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

// ─── Page Section Premium ────────────────────────────────

interface PageSectionProps {
  title?: string
  description?: string
  action?: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  delay?: number
  animate?: boolean
  className?: string
  children?: React.ReactNode
}

const PageSection = React.forwardRef<HTMLDivElement, PageSectionProps>(
  ({ 
    className, 
    title, 
    description,
    action,
    delay = 0,
    animate = true,
    children,
    ...props 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={animate ? { opacity: 0, y: 12 } : undefined}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
        className={cn("page-section space-y-4", className)}
        {...props}
      >
        {(title || description || action) && (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {title && (
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {action}
          </div>
        )}
        {children}
      </motion.div>
    )
  }
)
PageSection.displayName = "PageSection"

// ─── Page Grid Premium ───────────────────────────────────

interface PageGridProps {
  columns?: 1 | 2 | 3 | 4 | 'auto'
  gap?: 'sm' | 'md' | 'lg'
  animate?: boolean
  staggerDelay?: number
  className?: string
  children?: React.ReactNode
}

const PageGrid = React.forwardRef<HTMLDivElement, PageGridProps>(
  ({ 
    className, 
    columns = 2, 
    gap = 'md',
    animate = true,
    staggerDelay = 0.05,
    children,
    ...props 
  }, ref) => {
    const gapClasses = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    }

    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      'auto': "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    }

    return (
      <motion.div
        ref={ref}
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: 1 } : undefined}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (animate && React.isValidElement(child)) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.35, 
                  delay: index * staggerDelay,
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                {child}
              </motion.div>
            )
          }
          return child
        })}
      </motion.div>
    )
  }
)
PageGrid.displayName = "PageGrid"

// ─── Stats Grid Premium ──────────────────────────────────

interface StatsGridProps extends React.ComponentProps<"div"> {
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ className, columns = 4, gap = 'md', ...props }, ref) => {
    const gapClasses = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    }

    const columnClasses = {
      2: "grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    )
  }
)
StatsGrid.displayName = "StatsGrid"

export {
  PageHeader,
  PageSection,
  PageGrid,
  StatsGrid,
}
