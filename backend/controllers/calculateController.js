const fs = require("fs");
const csvParser = require("csv-parser");
const { deleteFile } = require("../utils/fileUtils");

exports.processCalculation = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const profitPercentage = parseFloat(req.body.profitPercentage) || 20;
  if (profitPercentage < 0 || profitPercentage > 100) {
    return res.status(400).json({ error: "Profit percentage must be between 0 and 100." });
  }

  // Process excluded users
  const excludedUsers = req.body.excludedUsers
    ? req.body.excludedUsers.split(',').map(user => user.trim()).filter(user => user)
    : [];

  const records = [];
  const betTypeGroups = {
    "4D": new Map(),
    "3D": new Map(),
    "2D": new Map()
  };

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (row) => {
      // Skip records if user is in excluded list
      if (excludedUsers.includes(row.User)) {
        return;
      }

      row.Bayar = Number(row.Bayar);
      row.x = Number(row.x);
      row.Bet = Number(row.Bet);
      row.PotPayout = row.Bet * row.x;
      
      const betType = row.Inv.substring(0, 2);
      switch(betType) {
        case "4D":
          row.Tebak = row.Tebak.padStart(4, "0");
          break;
        case "3D":
          row.Tebak = row.Tebak.padStart(3, "0");
          break;
        case "2D":
          row.Tebak = row.Tebak.padStart(2, "0");
          break;
      }
      
      records.push(row);

      const group = betTypeGroups[betType];
      if (group) {
        if (!group.has(row.Tebak)) {
          group.set(row.Tebak, []);
        }
        group.get(row.Tebak).push(row);
      }
    })
    .on("end", () => {
      deleteFile(req.file.path);

      const totalBayar = records.reduce((sum, record) => sum + (record.Bayar), 0);
      const profitRatio = profitPercentage / 100;
      const companyRevenue = totalBayar * profitRatio;
      const prizePool = totalBayar * (1 - profitRatio);
      const totalPlayers = records.length;

      let bestCandidates = [];
      let bestCount = 0;
      let bestPayoutSum = Infinity;

      for (let i = 0; i < 10000; i++) {
        const candidate = i.toString().padStart(4, "0");
        let candidateWinners = [];
        let candidatePayoutSum = 0;
        
        const matches2D = betTypeGroups["2D"].get(candidate.substring(2)) || [];
        candidateWinners = candidateWinners.concat(matches2D);
        candidatePayoutSum += matches2D.reduce((sum, rec) => sum + (rec.PotPayout || 0), 0);
        
        const matches3D = betTypeGroups["3D"].get(candidate.substring(1)) || [];
        candidateWinners = candidateWinners.concat(matches3D);
        candidatePayoutSum += matches3D.reduce((sum, rec) => sum + (rec.PotPayout || 0), 0);

        const matches4D = betTypeGroups["4D"].get(candidate) || [];
        candidateWinners = candidateWinners.concat(matches4D);
        candidatePayoutSum += matches4D.reduce((sum, rec) => sum + (rec.PotPayout || 0), 0);

        const candidateCount = candidateWinners.length;

        if (candidatePayoutSum > prizePool || 
            (candidateCount < bestCount) || 
            (candidateCount === bestCount && candidatePayoutSum >= bestPayoutSum)) {
          continue;
        }

        if (candidateCount > bestCount || (candidateCount === bestCount && candidatePayoutSum < bestPayoutSum)) {
          bestCount = candidateCount;
          bestPayoutSum = candidatePayoutSum;
          bestCandidates = [{ candidate, candidateWinners, candidatePayoutSum }];
        } else if (candidateCount === bestCount && candidatePayoutSum === bestPayoutSum) {
          bestCandidates.push({ candidate, candidateWinners, candidatePayoutSum });
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
        totalBayar: totalBayar,
        companyRevenue: companyRevenue,
        prizePool: prizePool,
        totalPlayers: totalPlayers,
        totalWinners: winners.length,
        winningPercentage: ((winners.length / (totalPlayers || 1)) * 100).toFixed(2),
        profitPercentage: profitPercentage,
        excludedUsers: excludedUsers
      });
    })
    .on('error', (error) => {
      console.error('Error processing CSV:', error);
      res.status(500).json({ error: 'Error processing CSV file' });
    });
};
