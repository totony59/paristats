-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME,
    "time" TEXT,
    "bookmaker" TEXT,
    "sport" TEXT,
    "competition" TEXT,
    "betType" TEXT,
    "totalOdds" REAL,
    "stake" REAL,
    "potentialWin" REAL,
    "totalReturn" REAL,
    "actualProfit" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confidence" REAL,
    "betExternalId" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BetSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "betId" TEXT NOT NULL,
    "match" TEXT,
    "market" TEXT,
    "selection" TEXT,
    "odds" REAL,
    CONSTRAINT "BetSelection_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankrollTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT
);
