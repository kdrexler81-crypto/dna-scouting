const functions = require("firebase-functions");

// This creates a secure, callable API endpoint
exports.calculateDNAScore = functions.https.onCall((data, context) => {
  // Security Check: Only allow logged-in coaches to run the formula
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Only authorized coaches can generate a DNA Score.");
  }

  // Extract the raw metrics sent from the iPad
  const { sprint, shuttle, catchingPct, throwingScore, flagPullingPct } = data;

  // ==========================================
  // YOUR SECRET FORMULA IS NOW HIDDEN HERE
  // ==========================================
  const sprintScore = Math.max(0, 10 - (sprint - 4.5) * 2);
  const shuttleScore = Math.max(0, 10 - (shuttle - 4.0) * 2);
  const speedRating = (sprintScore + shuttleScore) / 2;

  const skillRating = (
    (Number(catchingPct) / 10) + 
    Number(throwingScore) + 
    (Number(flagPullingPct) / 10)
  ) / 3;

  const rawScore = (speedRating * 0.5) + (skillRating * 0.5);
  const finalScore = Math.min(10.0, Math.max(1.0, rawScore)).toFixed(1);

  // Return ONLY the final number back to the public frontend
  return { dnaScore: finalScore };
});