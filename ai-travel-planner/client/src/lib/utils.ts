import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBudget(budgetString: string): string {
  if (!budgetString) return "N/A";
  if (budgetString.includes("₹")) return budgetString;

  const isUsd = budgetString.toLowerCase().includes("usd") || budgetString.includes("$");
  if (!isUsd) return budgetString;

  // Replace numbers and convert from USD to INR (1 USD = 85 INR)
  const converted = budgetString.replace(/\d+([,.]\d+)*/g, (match) => {
    const num = parseFloat(match.replace(/,/g, ''));
    if (isNaN(num)) return match;
    const inr = Math.round(num * 85);
    return new Intl.NumberFormat('en-IN').format(inr);
  });

  // Clean up currency symbols and add ₹ prefix
  return "₹" + converted.replace(/USD|\$/gi, "").trim();
}
