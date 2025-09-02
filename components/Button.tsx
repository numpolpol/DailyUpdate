
import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';
  
  const variantClasses = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-blue-500'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};
