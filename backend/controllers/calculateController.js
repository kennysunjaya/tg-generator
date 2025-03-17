const fs = require("fs");
const csvParser = require("csv-parser");
const { deleteFile } = require("../utils/fileUtils");

exports.processCalculation = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const records = [];

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (row) => {
      row.Bayar = Number(row.Bayar);
      row.x = Number(row.x);
      row.PotPayout = row.Bayar * row.x;
      if (row.Inv.substring(0, 2) === "4D" && row.Tebak.length === 3) {
        row.Tebak = row.Tebak.padStart(4, "0");
      }
      records.push(row);
    })
    .on("end", () => {
      deleteFile(req.file.path);

      const totalBayar = records.reduce((sum, record) => sum + record.Bayar, 0);
      const companyRevenue = totalBayar * 0.2;
      const prizePool = totalBayar * 0.8;
      const totalPlayers = records.length;

      let bestCandidates = [];
      let bestCount = 0;
      let bestPayoutSum = Infinity;

      for (let i = 0; i < 10000; i++) {
        const candidate = i.toString().padStart(4, "0");
        const candidateWinners = [];

        records.forEach((record) => {
          const betType = record.Inv.substring(0, 2);
          if ((betType === "4D" && candidate === record.Tebak) ||
              (betType === "3D" && candidate.substring(1) === record.Tebak) ||
              (betType === "2D" && candidate.substring(2) === record.Tebak)) {
            candidateWinners.push(record);
          }
        });

        const candidatePayoutSum = candidateWinners.reduce(
          (sum, rec) => sum + rec.PotPayout, 0
        );
        const candidateCount = candidateWinners.length;

        if (candidatePayoutSum <= prizePool) {
          if (candidateCount > bestCount || (candidateCount === bestCount && candidatePayoutSum < bestPayoutSum)) {
            bestCount = candidateCount;
            bestPayoutSum = candidatePayoutSum;
            bestCandidates = [{ candidate, candidateWinners, candidatePayoutSum }];
          } else if (candidateCount === bestCount && candidatePayoutSum === bestPayoutSum) {
            bestCandidates.push({ candidate, candidateWinners, candidatePayoutSum });
          }
        }
      }

      let chosenCandidate = { candidate: "0000", candidateWinners: [] };
      if (bestCandidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * bestCandidates.length);
        chosenCandidate = bestCandidates[randomIndex];
      }

      const winners = chosenCandidate.candidateWinners.map((r) => ({
        inv: r.Inv,
        user: r.User
      }));

      res.json({
        winningNumber: chosenCandidate.candidate,
        winners,
        totalBayar,
        companyRevenue,
        prizePool,
        totalPlayers,
        totalWinners: winners.length,
        winningPercentage: ((winners.length / totalPlayers) * 100).toFixed(2)
      });
    });
};
