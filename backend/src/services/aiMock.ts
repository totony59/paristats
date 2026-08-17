export type MockScenario =
  | "simple_won"
  | "simple_lost"
  | "combine_won"
  | "combine_pending"
  | "void"
  | "partial"
  | "ai_error"
  | "invalid_response"
  | "random";

const RANDOM_SCENARIOS: MockScenario[] = [
  "simple_won",
  "simple_lost",
  "combine_won",
  "combine_pending",
  "void",
  "partial",
];

function field<T>(value: T | null, confidence: number) {
  return { value, confidence };
}

function buildScenario(scenario: MockScenario): unknown {
  switch (scenario) {
    case "simple_won":
      return {
        bookmaker: field("Betclic", 0.99),
        date: field("2026-08-10", 0.98),
        time: field("21:00", 0.95),
        sport: field("Football", 0.99),
        competition: field("Ligue 1", 0.97),
        betType: field("simple", 0.98),
        stake: field(15, 0.99),
        totalOdds: field(1.8, 0.98),
        potentialWin: field(27, 0.97),
        totalReturn: field(27, 0.95),
        status: field("won", 0.96),
        betExternalId: field("BC-DEMO-1001", 0.9),
        selections: [
          {
            match: field("Lens - Rennes", 0.97),
            market: field("Résultat du match", 0.95),
            selection: field("Lens", 0.96),
            odds: field(1.8, 0.98),
          },
        ],
      };
    case "simple_lost":
      return {
        bookmaker: field("Betclic", 0.99),
        date: field("2026-08-05", 0.97),
        time: field("18:00", 0.9),
        sport: field("Football", 0.99),
        competition: field("Premier League", 0.95),
        betType: field("simple", 0.97),
        stake: field(20, 0.99),
        totalOdds: field(2.2, 0.96),
        potentialWin: field(44, 0.95),
        totalReturn: field(null, 0),
        status: field("lost", 0.95),
        betExternalId: field(null, 0),
        selections: [
          {
            match: field("Everton - Newcastle", 0.94),
            market: field("Total buts", 0.9),
            selection: field("+2.5", 0.92),
            odds: field(2.2, 0.96),
          },
        ],
      };
    case "combine_won":
      return {
        bookmaker: field("Betclic", 0.99),
        date: field("2026-08-08", 0.96),
        time: field("20:45", 0.9),
        sport: field("Football", 0.99),
        competition: field("Ligue des Champions", 0.93),
        betType: field("combine", 0.97),
        stake: field(10, 0.99),
        totalOdds: field(4.6, 0.95),
        potentialWin: field(46, 0.94),
        totalReturn: field(46, 0.92),
        status: field("won", 0.93),
        betExternalId: field("BC-DEMO-2002", 0.85),
        selections: [
          {
            match: field("Séville - Rayo Vallecano", 0.96),
            market: field("Résultat du match", 0.93),
            selection: field("Séville", 0.95),
            odds: field(1.75, 0.97),
          },
          {
            match: field("Porto - Benfica", 0.92),
            market: field("Double chance", 0.88),
            selection: field("Porto ou nul", 0.9),
            odds: field(2.63, 0.94),
          },
        ],
      };
    case "combine_pending":
      return {
        bookmaker: field("Betclic", 0.98),
        date: field("2026-08-15", 0.97),
        time: field("19:00", 0.85),
        sport: field("Football", 0.99),
        competition: field("Liga", 0.9),
        betType: field("combine", 0.96),
        stake: field(12, 0.98),
        totalOdds: field(3.35, 0.93),
        potentialWin: field(40.2, 0.92),
        totalReturn: field(null, 0),
        status: field("pending", 0.9),
        betExternalId: field("BC-DEMO-3003", 0.8),
        selections: [
          {
            match: field("Betis - Getafe", 0.9),
            market: field("Résultat du match", 0.87),
            selection: field("Betis", 0.89),
            odds: field(1.9, 0.93),
          },
          {
            match: field("Valence - Alavés", 0.86),
            market: field("Double chance", 0.82),
            selection: field("Valence ou nul", 0.85),
            odds: field(1.76, 0.9),
          },
        ],
      };
    case "void":
      return {
        bookmaker: field("Betclic", 0.98),
        date: field("2026-07-28", 0.95),
        time: field("15:00", 0.85),
        sport: field("Football", 0.99),
        competition: field("Serie A", 0.9),
        betType: field("simple", 0.95),
        stake: field(25, 0.98),
        totalOdds: field(1.65, 0.93),
        potentialWin: field(41.25, 0.92),
        totalReturn: field(25, 0.9),
        status: field("void", 0.88),
        betExternalId: field(null, 0),
        selections: [
          {
            match: field("Fiorentina - Bologne", 0.9),
            market: field("Résultat du match", 0.87),
            selection: field("Fiorentina", 0.88),
            odds: field(1.65, 0.93),
          },
        ],
      };
    case "partial":
      // Simule une capture partiellement illisible : plusieurs champs à null / faible confiance.
      return {
        bookmaker: field("Betclic", 0.85),
        date: field(null, 0.2),
        time: field(null, 0),
        sport: field("Football", 0.9),
        competition: field(null, 0.15),
        betType: field("simple", 0.6),
        stake: field(null, 0.3),
        totalOdds: field(1.95, 0.55),
        potentialWin: field(null, 0.2),
        totalReturn: field(null, 0),
        status: field(null, 0.1),
        betExternalId: field(null, 0),
        selections: [
          {
            match: field("Match non identifié", 0.3),
            market: field(null, 0.1),
            selection: field(null, 0.1),
            odds: field(1.95, 0.55),
          },
        ],
      };
    case "invalid_response":
      // Volontairement invalide (confidence hors bornes, champ manquant) pour tester la validation Zod.
      return {
        bookmaker: { value: "Betclic", confidence: 5 },
        selections: "not-an-array",
      };
    case "ai_error":
      throw new Error("Erreur simulée du fournisseur IA (scénario ai_error)");
    case "random":
    default:
      return buildScenario(
        RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)],
      );
  }
}

export function generateMockAnalysis(scenario: MockScenario = "random"): unknown {
  return buildScenario(scenario);
}
