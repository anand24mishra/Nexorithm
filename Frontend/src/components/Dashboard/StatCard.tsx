import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  children?: ReactNode;
  icon?: ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  children,
  icon,
}: StatCardProps) {
  return (
    <div className="bg-[#1C1B1B] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#ffa116]/40 transition-all">
      {icon && <div className="mb-4">{icon}</div>}
      <span className="text-sm font-semibold text-[#D9C3AD] opacity-70 uppercase tracking-wider block mb-4">
        {title}
      </span>
      <div className="text-4xl font-bold mb-4">{value}</div>
      {subtitle && (
        <p className="text-sm text-[#D9C3AD] opacity-60">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
