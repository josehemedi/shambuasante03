import { motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/primitives"
import { AnimatedCounter } from "./AnimatedCounter"
import { cn } from "@/lib/utils"

export function StatCard({ label, value, delta, icon: Icon, tone = "primary", index = 0, formatter, prefix, suffix, decimals, hideDelta = false }) {
  const positive = delta >= 0
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/15 text-accent-foreground",
    warning: "bg-warning/18 text-warning",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="relative overflow-hidden p-5">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", toneClasses[tone])}>
            <Icon className="h-[22px] w-[22px]" />
          </div>
          {!hideDelta && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold",
                positive ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
              )}
            >
              {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="font-display text-[26px] font-bold tracking-tight text-foreground">
            <AnimatedCounter value={value} formatter={formatter} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
        </div>
      </Card>
    </motion.div>
  )
}
