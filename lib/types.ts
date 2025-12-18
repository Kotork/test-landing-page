import { ButtonProps } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface ButtonAction {
  label: string;
  disabled?: boolean;
  icon?: LucideIcon | ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  onClick: () => void;
}