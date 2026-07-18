import { cn } from '@/lib/utils'

function Skeleton({ className, style, ...props }: React.ComponentProps<'div'> & { style?: React.CSSProperties }) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      style={style}
      {...props}
    />
  )
}

export { Skeleton }
