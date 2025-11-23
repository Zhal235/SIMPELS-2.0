import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
/**
 * Lightweight Button component compatible with shadcn/ui API used in this project.
 * Supports variant="outline" and size="icon" with Tailwind classes, and allows extending via className.
 */
export const Button = React.forwardRef(({ className = '', variant = 'outline', size = 'default', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center select-none outline-none';
    const ring = 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand/40';
    const disabled = 'disabled:opacity-50 disabled:pointer-events-none';
    const radius = 'rounded-lg';
    const shadow = 'shadow-sm';
    const variantClasses = variant === 'outline'
        ? 'border bg-white'
        : 'bg-brand text-white';
    const sizeClasses = size === 'icon'
        ? 'h-9 w-9 p-[6px]'
        : 'h-9 px-3 py-2';
    const extra = 'border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150';
    const classes = [base, ring, disabled, radius, shadow, variantClasses, sizeClasses, extra, className]
        .filter(Boolean)
        .join(' ');
    return (_jsx("button", { ref: ref, className: classes, ...props, children: children }));
});
Button.displayName = 'Button';
export default Button;
