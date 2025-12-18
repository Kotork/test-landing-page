"use client";

import { Button } from "@/components/ui/button";
import { ButtonAction } from '@/lib/types';
import { cn } from "@/lib/utils/cn";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface DataTableActionsProps {
  primaryAction?: ButtonAction;
  secondaryAction?: ButtonAction;
  className?: string;
}

export function DataTableActions({
  primaryAction,
  secondaryAction,
  className,
}: DataTableActionsProps) {
  if (!primaryAction && !secondaryAction) {
    return null;
  }

  const renderIcon = (icon?: LucideIcon | ReactNode) => {
    if (!icon) return null;

    // If it's a Lucide icon component, render it
    if (typeof icon === "function") {
      const IconComponent = icon as LucideIcon;
      return <IconComponent />;
    }

    // Otherwise, render as ReactNode
    return icon as ReactNode;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {secondaryAction && (
        <Button
          variant={secondaryAction.variant || "outline"}
          size={secondaryAction.size || "sm"}
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
        >
          {renderIcon(secondaryAction.icon)}
          {secondaryAction.label}
        </Button>
      )}
      {primaryAction && (
        <Button
          variant={primaryAction.variant || "default"}
          size={primaryAction.size || "sm"}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          {renderIcon(primaryAction.icon)}
          {primaryAction.label}
        </Button>
      )}
    </div>
  );
}
