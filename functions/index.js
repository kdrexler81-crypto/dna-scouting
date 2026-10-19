const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.calculateDNAScore = functions.https.onCall(async (data, context) => {
  // 1. Intercept and mathematically verify the token
  if (!data.token) {
    throw new functions.https.HttpsError("unauthenticated", "No secure token provided.");
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(data.token);
  } catch (error) {
    throw new functions.https.HttpsError("unauthenticated", "Token verification failed.");
  }

  // 2. VIP Bouncer Check
  const adminEmail = "admin@dnaflagfootball.com"; // <-- CHANGE TO YOUR EXACT EMAIL
  
  if (decodedToken.email !== adminEmail) {
    throw new functions.https.HttpsError("permission-denied", "Unauthorized coach email.");
  }

  // 3. Proprietary DNA Score Formula (SAFE & HIDDEN)
  const sprintScore = Math.max(0, 10 - (data.sprint - 4.5) * 2);
  const shuttleScore = Math.max(0, 10 - (data.shuttle - 4.0) * 2);
  const speedRating = (sprintScore + shuttleScore) / 2;

  const skillRating = (
    (data.catchingPct / 10) + 
    data.throwingScore + 
    (data.flagPullingPct / 10)
  ) / 3;

  const rawScore = (speedRating * 0.5) + (skillRating * 0.5);
  const finalScore = Math.min(10.0, Math.max(1.0, rawScore));

  // 4. Return the protected calculation
  return { dnaScore: finalScore.toFixed(1) };
});