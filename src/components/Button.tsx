import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../styles/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center cursor-pointer font-semibold rounded-md transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed outline-none';


  const variants = {
    primary: 'bg-primary text-white hover:opacity-90 shadow-sm font-bold',
    secondary: 'bg-secondary text-white hover:bg-secondary/80 border border-white/5 font-bold',
    outline: 'border border-primary text-primary hover:bg-primary/5 font-bold',
    ghost: 'text-primary hover:bg-primary/10 font-bold',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      <span className="flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default Button;
