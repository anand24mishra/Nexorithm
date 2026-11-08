import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  children?: ReactNode;
  icon?: ReactNode;
}

export function StatCard({ title, value, subtitle, children, icon }: StatCardProps) {
  return (
    <section className="min-w-0 border border-outline-variant bg-surface-container-low p-5">
      {icon ? <div className="mb-4">{icon}</div> : null}
      <h2 className="text-sm text-on-surface-variant">{title}</h2>
      <p className="mt-3 font-mono text-3xl text-on-surface">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-on-surface-variant">{subtitle}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
