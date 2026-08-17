interface StatCardProps {
  label: string;
  value: string;
  tone?: "neutral" | "profit" | "loss";
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "text-slate-50",
  profit: "text-profit",
  loss: "text-loss",
};

export function StatCard({ label, value, tone = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
}
