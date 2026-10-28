const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.calculateDNAScore = onCall((request) => {
  // Ensure the request comes from an authenticated Admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Only authorized coaches can calculate scores.');
  }

  const data = request.data;
  
  // Extract and sanitize metrics
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

  // 1. Speed (Max 25 pts) - 40yd dash (Baseline: 7.0s = 0pts, 4.5s = 25pts)
  if (sprint > 0) {
    maxPossiblePoints += 25;
    let sprintScore = ((7.0 - sprint) / (7.0 - 4.5)) * 25;
    earnedPoints += Math.max(0, Math.min(25, sprintScore));
  }

  // 2. Max Speed / MPH Bonus (Max 15 pts) - (Baseline: 12mph = 0, 20mph = 15)
  if (mph > 0) {
    maxPossiblePoints += 15;
    let mphScore = ((mph - 12) / (20 - 12)) * 15;
    earnedPoints += Math.max(0, Math.min(15, mphScore));
  }

  // 3. Agility (Max 20 pts total)
  if (shuttle > 0) {
    maxPossiblePoints += 10;
    let shuttleScore = ((6.5 - shuttle) / (6.5 - 4.5)) * 10;
    earnedPoints += Math.max(0, Math.min(10, shuttleScore));
  }
  if (lDrill > 0) {
    maxPossiblePoints += 10;
    let lDrillScore = ((9.5 - lDrill) / (9.5 - 7.0)) * 10;
    earnedPoints += Math.max(0, Math.min(10, lDrillScore));
  }

  // 4. Power (Max 20 pts total)
  if (broadInches > 0) {
    maxPossiblePoints += 10;
    let broadScore = ((broadInches - 60) / (110 - 60)) * 10; // 5ft = 0, 9ft+ = 10
    earnedPoints += Math.max(0, Math.min(10, broadScore));
  }
  if (vertical > 0) {
    maxPossiblePoints += 10;
    let vertScore = ((vertical - 15) / (35 - 15)) * 10; // 15in = 0, 35in+ = 10
    earnedPoints += Math.max(0, Math.min(10, vertScore));
  }

  // 5. Technical Skills (Max 20 pts total)
  if (catchingPct > 0 || throwingPct > 0 || flagPullingPct > 0) {
    maxPossiblePoints += 20;
    let activeSkillCount = 0;
    let totalSkillPct = 0;

    if (catchingPct > 0) { totalSkillPct += catchingPct; activeSkillCount++; }
    if (throwingPct > 0) { totalSkillPct += throwingPct; activeSkillCount++; }
    if (flagPullingPct > 0) { totalSkillPct += flagPullingPct; activeSkillCount++; }

    let skillAvg = totalSkillPct / activeSkillCount;
    let skillScore = (skillAvg / 100) * 20;
    earnedPoints += Math.max(0, Math.min(20, skillScore));
  }

  // Handle edge case where no data was submitted
  if (maxPossiblePoints === 0) {
    return { dnaScore: "0.0" };
  }

  // Calculate final percentage based ONLY on completed events
  let finalRawScore = (earnedPoints / maxPossiblePoints) * 100;
  let formattedScore = (Math.round(finalRawScore * 10) / 10).toFixed(1);

  logger.info(`Calculated DNA Score: ${formattedScore} (Earned: ${earnedPoints} / Max Possible: ${maxPossiblePoints})`);

  return {
    dnaScore: formattedScore
  };
});