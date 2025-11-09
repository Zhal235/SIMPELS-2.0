import { PropsWithChildren } from 'react'

type CardProps = PropsWithChildren<{ className?: string; title?: string; subtitle?: string }>

export default function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <section className={`card ${className}`}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}