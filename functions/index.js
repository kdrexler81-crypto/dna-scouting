// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Parser = require("rss-parser");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");
const geminiApiKey = defineSecret("GEMINI_API_KEY");
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();
const parser = new Parser();


exports.importExternalProfile = onCall({ cors: true }, async (request) => {
  const rawUrl = (request.data?.url || "").trim();

  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    throw new HttpsError("invalid-argument", "Please paste a valid URL starting with https://");
  }

  const imported = {};
  const lowerUrl = rawUrl.toLowerCase();

  // 1. Direct URL pattern matching (works even if a site blocks scraping)
  if (lowerUrl.includes("hudl.com/video/") || lowerUrl.includes("youtube.com/watch") || lowerUrl.includes("youtu.be/")) {
    imported.hudlLink = rawUrl;
  } else if (lowerUrl.includes("twitter.com/") || lowerUrl.includes("x.com/")) {
    imported.twitter = rawUrl;
  } else if (lowerUrl.includes("instagram.com/")) {
    imported.instagram = rawUrl;
  } else if (lowerUrl.includes("tiktok.com/")) {
    imported.tiktok = rawUrl;
  } else if (lowerUrl.includes("youtube.com/@") || lowerUrl.includes("youtube.com/channel/")) {
    imported.youtube = rawUrl;
  }

  // 2. Fetch public HTML & OpenGraph metadata server-side
  try {
    const response = await fetch(rawUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000)
    });

    if (response.ok) {
      const html = await response.text();

      const getMeta = (prop) => {
        const match =
          html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ||
          html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
        return match ? match[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim() : "";
      };

      const ogTitle = getMeta("og:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
      const ogImage = getMeta("og:image");
      const ogDesc = getMeta("og:description") || getMeta("description");

      // Extract Athlete Name from title (strips "- Hudl", "| MaxPreps", etc.)
      if (ogTitle && !imported.hudlLink) {
        const cleanName = ogTitle
          .replace(/\s*[-|•]\s*(Hudl|MaxPreps|NCSA|SportsRecruits|YouTube|Instagram|X|Twitter).*$/i, "")
          .replace(/'s\s+(Football|Flag Football|Profile|Highlights).*$/i, "")
          .trim();
        if (cleanName && cleanName.length >= 3 && cleanName.length <= 50 && !/hudl|login|sign in/i.test(cleanName)) {
          imported.name = cleanName;
        }
      }

      // Extract Profile Photo (skip generic site logos)
      if (ogImage && /^https?:\/\//i.test(ogImage) && !/default-avatar|hudl-logo|maxpreps-logo/i.test(ogImage)) {
        imported.avatar = ogImage;
      }

      // Extract Grad Year (e.g., "Class of 2027" or "2028")
      const combinedText = `${ogTitle} ${ogDesc}`;
      const gradMatch = combinedText.match(/\b(202[6-9]|203[0-5])\b/);
      if (gradMatch) {
        imported.gradYear = gradMatch[1];
      }

      // Extract 2-Letter State Code (e.g., ", NJ" or "(NJ)")
      const stateMatch = combinedText.match(/(?:,\s*|\()([A-Z]{2})(?:\)|\s|\.|,|$)/);
      if (stateMatch) {
        imported.state = stateMatch[1];
      }

      // Extract Primary Position
      const posMatch = combinedText.match(/\b(QB|WR|RB|DB|LB|RUSH|RUSHER|ATH)\b/);
      if (posMatch) {
        imported.primaryPos = posMatch[1];
      }

      // If it's a Hudl profile page, grab the first public highlight video URL if present
      if (lowerUrl.includes("hudl.com/profile/") && !imported.hudlLink) {
        const videoMatch = html.match(/https?:\/\/(?:www\.)?hudl\.com\/video\/[a-zA-Z0-9/_-]+/i);
        if (videoMatch) {
          imported.hudlLink = videoMatch[0];
        }
      }
    }
  } catch (err) {
    // If the external site blocks server fetches, still return any direct link fields we matched above
    console.warn("External metadata fetch skipped/blocked:", err.message);
  }

  return {
    imported,
    foundFields: Object.keys(imported)
  };
});
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


// --- 6. AUTOMATED DAILY GIRLS' FLAG FOOTBALL NEWS ---
// Runs automatically every day at 8:00 AM Eastern Time
exports.fetchDailyFlagNews = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "America/New_York",
  },
  async () => {
    const appId = "1:1017762631786:web:1663a6a926887b6173fa13";
    const newsRef = db.collection("artifacts").doc(appId).collection("public").doc("data").collection("news");

    // Free Google News RSS search for Girls / Women's Flag Football (past 2 days)
    const rssUrl =
      "https://news.google.com/rss/search?q=%22girls+flag+football%22+OR+%22women%27s+flag+football%22+when:2d&hl=en-US&gl=US&ceid=US:en";

    try {
      const feed = await parser.parseURL(rssUrl);
      if (!feed.items || feed.items.length === 0) {
        logger.info("No new flag football headlines found today.");
        return;
      }

      // Grab the 20 most recent headlines already in Firestore to prevent duplicates
      const existingSnap = await newsRef.orderBy("timestamp", "desc").limit(20).get();
      const existingTitles = new Set(
        existingSnap.docs.map((doc) => (doc.data().title || "").toLowerCase().trim())
      );

      let addedCount = 0;

      for (const item of feed.items) {
        if (addedCount >= 2) break; // Limit to 2 fresh headlines per day

        const cleanTitle = (item.title || "").trim();
        if (!cleanTitle || existingTitles.has(cleanTitle.toLowerCase())) {
          continue;
        }

        // Auto-categorize based on keywords
        let category = "ANNOUNCEMENT";
        const lower = cleanTitle.toLowerCase();
        if (lower.includes("college") || lower.includes("ncaa") || lower.includes("naia") || lower.includes("commit") || lower.includes("scholarship")) {
          category = "RECRUITING";
        } else if (lower.includes("championship") || lower.includes("tournament") || lower.includes("playoff") || lower.includes("title")) {
          category = "TOURNAMENT";
        }

        await newsRef.add({
          title: cleanTitle,
          category: category,
          link: item.link || "",
          source: item.creator || "Flag Football News",
          automated: true,
          timestamp: Date.now(),
        });

        existingTitles.add(cleanTitle.toLowerCase());
        addedCount++;
      }

      logger.info(`Daily news update complete. Added ${addedCount} new headlines.`);
    } catch (error) {
      logger.error("Error fetching daily flag football news:", error);
    }
  }
);
// --- 7. AUTOMATED WEEKLY COLLEGE PROGRAM & COACH RADAR ---
const COLLEGE_APP_ID = "1:1017762631786:web:1663a6a926887b6173fa13";

async function runCollegeUpdateScan() {
  const pendingRef = db
    .collection("artifacts")
    .doc(COLLEGE_APP_ID)
    .collection("public")
    .doc("data")
    .collection("pendingCollegeUpdates");

  const rssQueries = [
    {
      type: "NEW PROGRAM",
      url: "https://news.google.com/rss/search?q=%22women%27s+flag+football%22+(%22adds%22+OR+%22launches%22+OR+%22announces%22+OR+%22new+program%22+OR+%22varsity%22)+when:14d&hl=en-US&gl=US&ceid=US:en",
    },
    {
      type: "COACH HIRE",
      url: "https://news.google.com/rss/search?q=%22flag+football%22+(%22head+coach%22+OR+%22named+head+coach%22+OR+%22hires%22)+(university+OR+college)+when:14d&hl=en-US&gl=US&ceid=US:en",
    },
  ];

  // Pull recent pending & dismissed items to avoid duplicates
  const existingSnap = await pendingRef.orderBy("timestamp", "desc").limit(100).get();
  const existingTitles = new Set(
    existingSnap.docs.map((d) => (d.data().title || "").toLowerCase().trim())
  );

  let addedCount = 0;

  for (const feedConfig of rssQueries) {
    try {
      const feed = await parser.parseURL(feedConfig.url);
      if (!feed.items) continue;

      for (const item of feed.items.slice(0, 10)) {
        const cleanTitle = (item.title || "").trim();
        const titleKey = cleanTitle.toLowerCase();
        if (!cleanTitle || existingTitles.has(titleKey)) continue;

        // Filter out high school-only stories
        if (/\bhigh school\b|\bhs\b|\bvarsity girls\b/i.test(cleanTitle) && !/\bcollege\b|\buniversity\b|\bncaa\b|\bnaia\b|\bnjcaa\b/i.test(cleanTitle)) {
          continue;
        }

        await pendingRef.add({
          title: cleanTitle,
          type: feedConfig.type,
          link: item.link || "",
          source: item.creator || "College Flag Radar",
          pubDate: item.pubDate || "",
          status: "pending",
          timestamp: Date.now(),
        });

        existingTitles.add(titleKey);
        addedCount++;
      }
    } catch (err) {
      logger.error(`Radar RSS error (${feedConfig.type}):`, err);
    }
  }

  return addedCount;
}

// Runs automatically every Monday at 9:00 AM Eastern Time
exports.scanCollegeUpdates = onSchedule(
  {
    schedule: "0 9 * * 1",
    timeZone: "America/New_York",
  },
  async () => {
    const added = await runCollegeUpdateScan();
    logger.info(`Weekly College Radar complete. Queued ${added} new updates.`);
  }
);

// Manual "Scan Now" trigger for the Admin Panel
exports.triggerCollegeScan = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Admin login required.");
  }
  const added = await runCollegeUpdateScan();
  return { success: true, added };
});
// --- 8. AI AUTO-FIND SCHOOL INFO (GEMINI + GOOGLE SEARCH) ---
exports.lookupCollegeInfo = onCall(
  { cors: true, secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Admin login required.");
    }

    const schoolName = (request.data?.schoolName || "").trim();
    if (!schoolName) {
      throw new HttpsError("invalid-argument", "Please enter a school name first.");
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

    const prompt = `Search the official athletics website and staff directory for "${schoolName}" women's flag football program.
Return ONLY a valid JSON object (no markdown, no backticks, no extra text) with these exact keys:
{
  "state": "2-letter US state code like NJ, or empty string",
  "division": "one of: NCAA DI, NCAA DII, NCAA DIII, NAIA, NJCAA, 3C2A, USCAA, Club",
  "conference": "conference name or empty string",
  "coach": "head coach full name or TBA",
  "email": "head coach official school email or empty string",
  "phone": "office phone number or empty string",
  "questionnaireUrl": "official recruiting questionnaire URL or empty string"
}
If a field cannot be verified from official sources, leave it as an empty string (or "TBA" for coach).`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = (response.text || "").trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse school info from search results.");
      }

      const info = JSON.parse(jsonMatch[0]);
      return { success: true, info };
    } catch (err) {
      logger.error("lookupCollegeInfo error:", err);
      throw new HttpsError("internal", err.message || "AI lookup failed.");
    }
  }
);