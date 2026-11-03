const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Admin SDK to bypass client security rules securely
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- 1. DNA SCORING ENGINE (Youth 8-13 Scale) ---
exports.calculateDNAScore = onCall((request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Only authorized coaches can calculate scores.');

  const data = request.data;
  const sprint = Number(data.sprint) || 0;
  const shuttle = Number(data.shuttle) || 0;
  const lDrill = Number(data.lDrill) || 0;
  const mph = Number(data.mph) || 0;
  const broadInches = Number(data.broadInches) || 0;
  const vertical = Number(data.vertical) || 0;
  const catchingPct = Number(data.catchingPct) || 0;
  const throwingPct = Number(data.throwingPct) || 0;
  const flagPullingPct = Number(data.flagPullingPct) || 0;

  let earnedPoints = 0;
  let maxPossiblePoints = 0;

  if (sprint > 0) { maxPossiblePoints += 20; earnedPoints += Math.max(0, Math.min(20, ((8.5 - sprint) / (8.5 - 5.4)) * 20)); }
  if (mph > 0) { maxPossiblePoints += 10; earnedPoints += Math.max(0, Math.min(10, ((mph - 8.0) / (15.5 - 8.0)) * 10)); }
  if (shuttle > 0) { maxPossiblePoints += 15; earnedPoints += Math.max(0, Math.min(15, ((7.5 - shuttle) / (7.5 - 4.8)) * 15)); }
  if (lDrill > 0) { maxPossiblePoints += 15; earnedPoints += Math.max(0, Math.min(15, ((11.0 - lDrill) / (11.0 - 7.5)) * 15)); }
  if (broadInches > 0) { maxPossiblePoints += 10; earnedPoints += Math.max(0, Math.min(10, ((broadInches - 42) / (90 - 42)) * 10)); }
  if (vertical > 0) { maxPossiblePoints += 10; earnedPoints += Math.max(0, Math.min(10, ((vertical - 10) / (26 - 10)) * 10)); }
  
  if (catchingPct > 0 || throwingPct > 0 || flagPullingPct > 0) {
    maxPossiblePoints += 20;
    let active = 0, total = 0;
    if (catchingPct > 0) { total += catchingPct; active++; }
    if (throwingPct > 0) { total += throwingPct; active++; }
    if (flagPullingPct > 0) { total += flagPullingPct; active++; }
    earnedPoints += Math.max(0, Math.min(20, ((total / active) / 100) * 20));
  }

  if (maxPossiblePoints === 0) return { dnaScore: "0.0" };
  let formattedScore = (Math.round((earnedPoints / maxPossiblePoints) * 100) / 10).toFixed(1);
  return { dnaScore: formattedScore };
});

// --- 2. SCOUT MESSAGING (Intercept & Hold) ---
exports.sendScoutMessage = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in.');

  const { playerId, messageText, appId } = request.data;
  if (!playerId || !messageText) throw new HttpsError('invalid-argument', 'Missing payload.');

  const senderUid = request.auth.uid;
  const recruiterRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('recruiters').doc(senderUid);
  const recruiterSnap = await recruiterRef.get();

  if (!recruiterSnap.exists || !recruiterSnap.data().approved) {
    throw new HttpsError('permission-denied', 'Unverified scouts cannot send messages.');
  }

  const messageData = {
    playerId,
    scoutId: senderUid,
    scoutName: recruiterSnap.data().name,
    scoutSchool: recruiterSnap.data().school,
    text: messageText,
    status: 'pending_parent', // Gateway active
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('messages').add(messageData);

  return { success: true, status: 'pending_parent' };
});

// --- 3. PARENT APPROVAL (Release to Athlete) ---
exports.reviewScoutMessage = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in.');

  const { messageId, appId, newStatus } = request.data;
  if (!['approved', 'rejected'].includes(newStatus)) {
    throw new HttpsError('invalid-argument', 'Invalid status.');
  }

  const msgRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('messages').doc(messageId);
  const msgSnap = await msgRef.get();

  if (!msgSnap.exists) throw new HttpsError('not-found', 'Message missing.');

  await msgRef.update({
    status: newStatus,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: request.auth.uid
  });

  return { success: true, status: newStatus };
});