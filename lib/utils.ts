import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(p0: string, className: string | undefined, @.inputs
  : ClassValue[]) {
  return twMerge(clsx(inputs))
}
