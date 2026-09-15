import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  subtitleClassName?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  subtitleClassName = "text-green-600",
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        {subtitle && (
          <span className={`text-sm font-semibold ${subtitleClassName}`}>
            {subtitle}
          </span>
        )}
      </div>

      <h3 className="mt-6 text-sm font-medium text-slate-500">{title}</h3>

      <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
