import { ReactNode } from "react";
import { cn } from "@/lib/utils";
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}
export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between px-8 pt-8 pb-6 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10",
        className,
      )}
    >
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 animate-fade-up">{action}</div>
      )}
    </div>
  );
}
