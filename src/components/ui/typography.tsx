import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "lead" | "large" | "small" | "muted";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "small";
}

const typographyVariants = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  h5: "scroll-m-20 text-lg font-semibold tracking-tight",
  h6: "scroll-m-20 text-base font-semibold tracking-tight",
  p: "leading-relaxed",
  lead: "text-xl text-muted-foreground",
  large: "text-lg font-semibold",
  small: "text-sm font-medium leading-none",
  muted: "text-sm text-muted-foreground",
};

export function Typography({ 
  children, 
  className, 
  variant = "p", 
  as: Component = "p" 
}: TypographyProps) {
  const baseClasses = typographyVariants[variant];
  const headingClasses = variant.startsWith('h') ? 'text-secondary' : '';
  
  return (
    <Component 
      className={cn(baseClasses, headingClasses, className)}
    >
      {children}
    </Component>
  );
}

// Convenience components for common use cases
export function H1({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="h1" as="h1" className={className} {...props}>{children}</Typography>;
}

export function H2({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="h2" as="h2" className={className} {...props}>{children}</Typography>;
}

export function H3({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="h3" as="h3" className={className} {...props}>{children}</Typography>;
}

export function H4({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="h4" as="h4" className={className} {...props}>{children}</Typography>;
}

export function H5({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="h5" as="h5" className={className} {...props}>{children}</Typography>;
}

export function H6({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="h6" as="h6" className={className} {...props}>{children}</Typography>;
}

export function P({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="p" as="p" className={className} {...props}>{children}</Typography>;
}

export function Lead({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="lead" as="p" className={className} {...props}>{children}</Typography>;
}

export function Large({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="large" as="div" className={className} {...props}>{children}</Typography>;
}

export function Small({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="small" as="small" className={className} {...props}>{children}</Typography>;
}

export function Muted({ children, className, ...props }: Omit<TypographyProps, 'variant' | 'as'>) {
  return <Typography variant="muted" as="p" className={className} {...props}>{children}</Typography>;
}
