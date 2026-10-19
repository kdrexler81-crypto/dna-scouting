const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.calculateDNAScore = functions.https.onCall(async (rawPayload, context) => {
  const data = (rawPayload && rawPayload.data) ? rawPayload.data : (rawPayload || {});

  if (!data.token) {
    throw new functions.https.HttpsError("unauthenticated", `Token missing. Received payload: ${JSON.stringify(data)}`);
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(data.token);
  } catch (error) {
    throw new functions.https.HttpsError("unauthenticated", "Token verification failed.");
  }

  const adminEmail = "admin@dnaflagfootball.com"; // <-- CHANGE THIS TO YOUR EXACT EMAIL
  
  if (decodedToken.email !== adminEmail) {
    throw new functions.https.HttpsError("permission-denied", `Unauthorized coach email: ${decodedToken.email}`);
  }

  // Math logic
  const sprintScore = (data.sprint > 0) ? Math.max(0, 10 - (data.sprint - 4.5) * 2) : 0;
  const shuttleScore = (data.shuttle > 0) ? Math.max(0, 10 - (data.shuttle - 4.0) * 2) : 0;
  const speedRating = (sprintScore + shuttleScore) / 2;

  // Changed throwing to a percentage / 10 to match catching and flag pulling
  const skillRating = (
    ((data.catchingPct || 0) / 10) + 
    ((data.throwingPct || 0) / 10) + 
    ((data.flagPullingPct || 0) / 10)
  ) / 3;

  const rawScore = (speedRating * 0.5) + (skillRating * 0.5);
  const finalScore = (rawScore > 0) ? Math.min(10.0, Math.max(1.0, rawScore)) : 0;

  return { dnaScore: finalScore.toFixed(1) };
});