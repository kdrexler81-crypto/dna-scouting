const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.calculateDNAScore = functions.https.onCall(async (rawPayload, context) => {
  const data = (rawPayload && rawPayload.data) ? rawPayload.data : (rawPayload || {});

  if (!data.token) throw new functions.https.HttpsError("unauthenticated", "Token missing.");

  let decodedToken;
  try { decodedToken = await admin.auth().verifyIdToken(data.token); } 
  catch (error) { throw new functions.https.HttpsError("unauthenticated", "Token failed."); }

  const adminEmail = "YOUR_ACTUAL_EMAIL@EXAMPLE.COM"; // <-- CHANGE THIS
  if (decodedToken.email !== adminEmail) throw new functions.https.HttpsError("permission-denied", "Unauthorized.");

  // --- 1. SPEED RATING ---
  // Sprint: 5.0s = 10 pts, 6.0s = 7 pts, 7.0s = 4 pts
  const sprintScore = (data.sprint > 0) ? Math.max(0, 10 - (data.sprint - 5.0) * 3) : 0;
  // Shuttle: 4.6s = 10 pts, 5.25s = 7.4 pts, 5.5s = 6.4 pts
  const shuttleScore = (data.shuttle > 0) ? Math.max(0, 10 - (data.shuttle - 4.6) * 4) : 0;
  // L-Drill: 4.8s = 10 pts, 5.5s = 7.2 pts, 6.0s = 5.2 pts
  const lDrillScore = (data.lDrill > 0) ? Math.max(0, 10 - (data.lDrill - 4.8) * 4) : 0; 
  // MPH: 15 MPH = 10 pts, 12 MPH = 7 pts
  const mphScore = (data.mph > 0) ? Math.min(10, Math.max(0, data.mph - 5)) : 0;
  
  const speedRating = (sprintScore + shuttleScore + lDrillScore + mphScore) / 4;

  // --- 2. EXPLOSIVENESS RATING ---
  // Broad Jump: 80" (6'8") = 10 pts, 72" (6'0") = 8.4 pts, 60" (5'0") = 6 pts
  const broadScore = (data.broadInches > 0) ? Math.min(10, Math.max(0, (data.broadInches - 30) / 5)) : 0;
  // Vertical: 22" = 10 pts, 17" = 6.6 pts, 14" = 4.6 pts
  const verticalScore = (data.vertical > 0) ? Math.min(10, Math.max(0, (data.vertical - 7) / 1.5)) : 0;

  const explosivenessRating = (broadScore + verticalScore) / 2;

  // --- 3. SKILL RATING ---
  const skillRating = (
    ((data.catchingPct || 0) / 10) + 
    ((data.throwingPct || 0) / 10) + 
    ((data.flagPullingPct || 0) / 10)
  ) / 3;

  // --- 4. WEIGHTED DNA SCORE ---
  let rawScore = 0;
  if (data.broadInches > 0 || data.vertical > 0) {
    // Weighted: 40% Speed, 30% Explosiveness, 30% Skill
    rawScore = (speedRating * 0.4) + (explosivenessRating * 0.3) + (skillRating * 0.3);
  } else {
    // Fallback if no jumps were recorded
    rawScore = (speedRating * 0.5) + (skillRating * 0.5);
  }
  
  const finalScore = (rawScore > 0) ? Math.min(10.0, Math.max(1.0, rawScore)) : 0;

  return { dnaScore: finalScore.toFixed(1) };
});