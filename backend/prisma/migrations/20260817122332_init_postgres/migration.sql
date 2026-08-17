-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "time" TEXT,
    "bookmaker" TEXT,
    "sport" TEXT,
    "competition" TEXT,
    "betType" TEXT,
    "totalOdds" DOUBLE PRECISION,
    "stake" DOUBLE PRECISION,
    "potentialWin" DOUBLE PRECISION,
    "totalReturn" DOUBLE PRECISION,
    "actualProfit" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confidence" DOUBLE PRECISION,
    "betExternalId" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "screenshotPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetSelection" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "match" TEXT,
    "market" TEXT,
    "selection" TEXT,
    "odds" DOUBLE PRECISION,

    CONSTRAINT "BetSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankrollTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "BankrollTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
