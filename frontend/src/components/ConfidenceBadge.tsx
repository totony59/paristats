interface ConfidenceBadgeProps {
  confidence: number;
  hasValue: boolean;
}

export function ConfidenceBadge({ confidence, hasValue }: ConfidenceBadgeProps) {
  if (!hasValue) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-loss/15 px-2 py-0.5 text-xs font-medium text-loss">
        🔴 À vérifier
      </span>
    );
  }
  if (confidence >= 0.9) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-profit/15 px-2 py-0.5 text-xs font-medium text-profit">
        🟢 Confiance élevée
      </span>
    );
  }
  if (confidence >= 0.7) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-pending/15 px-2 py-0.5 text-xs font-medium text-pending">
        🟠 Vérification recommandée
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-loss/15 px-2 py-0.5 text-xs font-medium text-loss">
      🔴 Vérification nécessaire
    </span>
  );
}
