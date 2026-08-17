import { Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Import } from "./pages/Import";
import { ComingSoon } from "./pages/ComingSoon";

export function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/paris" element={<ComingSoon title="Mes paris" />} />
          <Route path="/bankroll" element={<ComingSoon title="Bankroll" />} />
          <Route path="/statistiques" element={<ComingSoon title="Statistiques" />} />
          <Route path="/importer" element={<Import />} />
        </Routes>
      </main>
    </div>
  );
}
