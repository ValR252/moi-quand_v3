/**
 * Card avec glassmorphism (UI Designer)
 */

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`
        bg-white/80 dark:bg-gray-900/70
        backdrop-blur-xl
        border border-white/20 dark:border-white/10
        rounded-2xl
        shadow-xl
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">{children}</div>
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-semibold">{children}</h3>
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
