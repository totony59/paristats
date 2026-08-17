import { useEffect, useState } from "react";
import type { DashboardStats } from "@paristats/shared";
import { fetchDashboard } from "../api/client";
import { StatCard } from "../components/StatCard";
import { BankrollChart } from "../components/BankrollChart";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const percentFormatter = (value: number) => `${value.toFixed(1)} %`;

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-loss/40 bg-loss/10 p-4 text-loss">
        Erreur de chargement du dashboard : {error}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-slate-400">Chargement…</div>;
  }

  const netProfitTone = stats.netProfit >= 0 ? "profit" : "loss";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Vue d'ensemble de ta bankroll et de tes performances.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Bankroll" value={currencyFormatter.format(stats.bankroll)} />
        <StatCard label="Total des mises" value={currencyFormatter.format(stats.totalStake)} />
        <StatCard label="Total des retours" value={currencyFormatter.format(stats.totalReturn)} />
        <StatCard
          label="Bénéfice net"
          value={currencyFormatter.format(stats.netProfit)}
          tone={netProfitTone}
        />
        <StatCard label="ROI" value={percentFormatter(stats.roi)} tone={stats.roi >= 0 ? "profit" : "loss"} />
        <StatCard label="Taux de réussite" value={percentFormatter(stats.successRate)} />
        <StatCard label="Nombre de paris" value={String(stats.totalBets)} />
        <StatCard
          label="Gagnés / Perdus / En attente"
          value={`${stats.wonBets} / ${stats.lostBets} / ${stats.pendingBets}`}
        />
        <StatCard label="Mise moyenne" value={currencyFormatter.format(stats.averageStake)} />
        <StatCard label="Cote moyenne" value={stats.averageOdds.toFixed(2)} />
      </div>

      <BankrollChart data={stats.bankrollHistory} />
    </div>
  );
}
