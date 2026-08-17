import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/paris", label: "Mes paris" },
  { to: "/bankroll", label: "Bankroll" },
  { to: "/statistiques", label: "Statistiques" },
  { to: "/importer", label: "Importer un pari" },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-surface-border bg-surface-raised p-4">
      <div className="mb-8 px-2 text-xl font-semibold tracking-tight text-slate-50">
        PariStats
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-slate-400 hover:bg-surface-border hover:text-slate-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
