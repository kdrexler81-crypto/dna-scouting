// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- 1. DNA SCORING ENGINE ---
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

// --- 2. IDENTITY VERIFICATION: LINK ACCOUNTS ---
exports.linkFamilyAccount = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in to link account.");
  
  try {
    const { athleteId, accessCode, role, phone, address, city, state, zip, fullName, appId } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token?.email || '';

    const playerRef = db.doc(`artifacts/${appId}/public/data/players/${athleteId}`);
    const playerSnap = await playerRef.get();
    
    if (!playerSnap.exists) throw new HttpsError("not-found", "Athlete profile not found.");

    const player = playerSnap.data();
    
    // VERIFY THE SECURE ACCESS CODE
    if (!player.accessCode || player.accessCode !== accessCode) {
      throw new HttpsError("permission-denied", "Invalid Access Code. Please contact your coach.");
    }

    // Update the player document with the verified identities
    const updates = {};
    if (role === 'parent') {
      updates.guardianEmail = email;
      updates.guardianUid = uid;
      updates.guardianName = fullName;
      updates.guardianPhone = phone;
      updates.familyAddress = { address, city, state, zip };
    } else if (role === 'athlete') {
      updates.athleteEmail = email;
      updates.athleteUid = uid;
      updates.athletePhone = phone;
    }

    await playerRef.update(updates);

    // Save the structured user data to their dedicated collection
    const collectionName = role === 'parent' ? 'parents' : 'athletes';
    await db.doc(`artifacts/${appId}/public/data/${collectionName}/${uid}`).set({
      email, uid, role, fullName, phone,
      address: { address, city, state, zip },
      linkedAthleteId: athleteId,
      linkedAt: Date.now()
    });

    return { success: true };
  } catch (err) {
    logger.error("Link Account Error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", `Server error: ${err.message}`);
  }
});

// --- 3. SEND TWO-WAY MESSAGE ---
exports.sendMessage = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const { athleteId, scoutId, content, senderRole, appId } = request.data;
    const uid = request.auth.uid;
    const email = request.auth.token?.email || '';

    const athleteRef = db.doc(`artifacts/${appId}/public/data/players/${athleteId}`);
    const athleteSnap = await athleteRef.get();
    if (!athleteSnap.exists || !athleteSnap.data().guardianEmail) {
      throw new HttpsError("failed-precondition", "Athlete has no verified Parent/Guardian email to receive messages.");
    }
    const athlete = athleteSnap.data();

    const scoutRef = db.doc(`artifacts/${appId}/public/data/recruiters/${scoutId}`);
    const scoutSnap = await scoutRef.get();
    if (!scoutSnap.exists) {
      throw new HttpsError("failed-precondition", "Scout not found.");
    }
    const scout = scoutSnap.data();

    const threadId = `${scoutId}_${athleteId}`;
    const timestamp = Date.now();
    let status = '';
    let emailTarget = '';
    let emailSubject = '';
    let emailBody = '';

    if (senderRole === 'scout') {
      if (uid !== scoutId || scout.approved !== true) throw new HttpsError("permission-denied", "Unauthorized scout account.");
      status = 'pending';
      emailTarget = athlete.guardianEmail;
      emailSubject = `New Recruiting Message for ${athlete.name}`;
      emailBody = `<strong>Coach ${scout.name}</strong> from <strong style="color: #1c7ed6;">${scout.school}</strong> sent a new message to ${athlete.name}. Log in to the Family Dashboard to approve it.`;
    } else if (senderRole === 'athlete') {
      if (athlete.athleteEmail !== email) throw new HttpsError("permission-denied", "You are not authorized for this athlete profile.");
      status = 'draft';
      emailTarget = athlete.guardianEmail;
      emailSubject = `Action Required: ${athlete.name} drafted a reply to ${scout.school}`;
      emailBody = `<strong>${athlete.name}</strong> drafted a reply to Coach ${scout.name}. Per NCAA compliance guidelines, log in to your Family Dashboard to approve this message before it is released to the college.`;
    } else {
      throw new HttpsError("invalid-argument", "Invalid sender role.");
    }

    const messageData = {
      threadId, athleteId, scoutId,
      athleteName: athlete.name,
      guardianEmail: athlete.guardianEmail,
      senderName: senderRole === 'scout' ? scout.name : athlete.name,
      senderSchool: scout.school,
      senderId: uid, senderRole, content, status, timestamp, readAt: null
    };

    const msgRef = await db.collection(`artifacts/${appId}/public/data/messages`).add(messageData);

    const threadRef = db.doc(`artifacts/${appId}/public/data/threads/${threadId}`);
    await threadRef.set({
      threadId, scoutId, athleteId,
      scoutName: scout.name, scoutSchool: scout.school,
      athleteName: athlete.name, guardianEmail: athlete.guardianEmail,
      lastUpdate: timestamp, lastMessagePreview: content.substring(0, 60) + '...',
    }, { merge: true });

    if (emailTarget) {
      try {
        await db.collection('mail').add({
          to: emailTarget,
          message: {
            subject: emailSubject,
            html: `
              <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #0f172a; margin-top: 0; text-transform: uppercase;">Compliance Alert</h2>
                <p style="color: #475569; line-height: 1.6;">${emailBody}</p>
                <div style="background-color: #f8fafc; padding: 16px; margin: 24px 0; border-radius: 8px; border-left: 4px solid #1c7ed6;">
                  <p style="color: #334155; margin: 0; font-style: italic;">"${content.substring(0, 100)}..."</p>
                </div>
                <a href="https://dnaflagratings.com" style="display: inline-block; padding: 14px 24px; background-color: #059669; color: white; text-decoration: none; font-weight: bold; border-radius: 8px; text-transform: uppercase;">Review in Dashboard</a>
              </div>
            `
          }
        });
      } catch (e) { logger.error("Email queue failed:", e); }
    }

    return { success: true, messageId: msgRef.id };
  } catch (err) {
    logger.error("sendMessage Error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", `Server error: ${err.message}`);
  }
});

// --- 4. TWO-WAY MODERATION ---
exports.moderateMessage = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const { messageId, action, appId } = request.data;
    if (!messageId || !['approve', 'reject'].includes(action)) throw new HttpsError("invalid-argument", "Invalid moderation request.");

    const msgRef = db.doc(`artifacts/${appId}/public/data/messages/${messageId}`);
    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) throw new HttpsError("not-found", "Message not found.");

    const msgData = msgSnap.data();

    if (msgData.guardianEmail !== request.auth.token?.email) {
      throw new HttpsError("permission-denied", "Not authorized to moderate this message.");
    }

    if (action === 'approve') {
      await msgRef.update({ status: 'approved', moderatedAt: Date.now() });

      if (msgData.senderRole === 'athlete') {
        const scoutRef = db.doc(`artifacts/${appId}/public/data/recruiters/${msgData.scoutId}`);
        const scoutSnap = await scoutRef.get();
        if (scoutSnap.exists && scoutSnap.data().email) {
          try {
            await db.collection('mail').add({
              to: scoutSnap.data().email,
              message: {
                subject: `New Message from ${msgData.athleteName}`,
                html: `
                  <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <h2 style="color: #0f172a; margin-top: 0; text-transform: uppercase;">New Prospect Message</h2>
                    <p style="color: #475569; line-height: 1.6;"><strong>${msgData.athleteName}</strong> has sent you a secure message.</p>
                    <a href="https://dnaflagratings.com" style="display: inline-block; padding: 14px 24px; background-color: #1c7ed6; color: white; text-decoration: none; font-weight: bold; border-radius: 8px; text-transform: uppercase;">Open Scout Portal</a>
                  </div>
                `
              }
            });
          } catch (e) { logger.error("Scout email queue failed:", e); }
        }
      }
    } else {
      await msgRef.delete();
    }
    return { success: true };
  } catch (err) {
    logger.error("moderateMessage Error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", `Server error: ${err.message}`);
  }
});

// --- 5. MARK MESSAGE AS READ ---
exports.markMessageRead = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "You must be logged in.");
  
  try {
    const { messageId, appId } = request.data;
    const msgRef = db.doc(`artifacts/${appId}/public/data/messages/${messageId}`);
    await msgRef.update({ readAt: Date.now() });
    return { success: true };
  } catch (err) {
    logger.error("markMessageRead Error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", `Server error: ${err.message}`);
  }
});