const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.calculateDNAScore = functions.https.onCall(async (rawPayload, context) => {
  // 1. Aggressively unwrap the payload to prevent SDK version mismatches
  const data = (rawPayload && rawPayload.data) ? rawPayload.data : (rawPayload || {});

  // 2. Intercept and mathematically verify the token
  if (!data.token) {
    // Echo back exactly what the backend received so we can diagnose the drop
    throw new functions.https.HttpsError("unauthenticated", `Token missing. Received payload: ${JSON.stringify(data)}`);
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(data.token);
  } catch (error) {
    throw new functions.https.HttpsError("unauthenticated", "Token verification failed.");
  }

  // 3. VIP Bouncer Check
  const adminEmail = "admin@dnaflagfootball.com"; // <-- CHANGE THIS TO YOUR EXACT EMAIL
  
  if (decodedToken.email !== adminEmail) {
    throw new functions.https.HttpsError("permission-denied", `Unauthorized coach email: ${decodedToken.email}`);
  }

  // 4. Proprietary DNA Score Formula
  const sprintScore = Math.max(0, 10 - ((data.sprint || 0) - 4.5) * 2);
  const shuttleScore = Math.max(0, 10 - ((data.shuttle || 0) - 4.0) * 2);
  const speedRating = (sprintScore + shuttleScore) / 2;

  const skillRating = (
    ((data.catchingPct || 0) / 10) + 
    (data.throwingScore || 0) + 
    ((data.flagPullingPct || 0) / 10)
  ) / 3;

  const rawScore = (speedRating * 0.5) + (skillRating * 0.5);
  const finalScore = Math.min(10.0, Math.max(1.0, rawScore));

  return { dnaScore: finalScore.toFixed(1) };
});