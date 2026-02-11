import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    title?: string;
    size?: "sm" | "md" | "lg";
    variant?: "primary" | "secondary" | "outline" | "ghost";
    fullWidth?: boolean;
    href?: string;
    className?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    size = "md",
    variant = "primary",
    fullWidth = false,
    href,
    className = "",
    icon,
    rightIcon,
    children,
    ...rest
}) => {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 rounded-xl transition-all font-bold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer";

    const sizeStyles = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    const variantStyles = {
        primary:
            "bg-primary-green text-hunter hover:bg-soft-green shadow-lg shadow-primary-green/10",
        secondary:
            "bg-hunter text-primary-green hover:bg-gray-50 border border-primary-green/10",
        outline:
            "bg-transparent border border-primary-green/30 text-primary-green hover:bg-primary-green/5",
        ghost:
            "bg-transparent text-primary-green hover:bg-primary-green/5",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    const computedClass = [
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        widthStyle,
        className,
    ].join(" ");

    if (href) {
        return (
            <a href={href} className={computedClass} {...(rest as any)}>
                {icon}
                {title ? <span>{title}</span> : children}
                {rightIcon}
            </a>
        );
    }

    return (
        <button className={computedClass} {...rest}>
            {icon}
            {title ? <span>{title}</span> : children}
            {rightIcon}
        </button>
    );
};

export default Button;
