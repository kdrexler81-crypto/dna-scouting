const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.calculateDNAScore = onCall((request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Only authorized coaches can calculate scores.');
  }

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

  // 1. STRAIGHT-LINE SPEED (Total 30 pts)
  // 40-Yard Dash (Max 20 pts) - Youth Age 8-13 Scale (8.5s = 0, 5.4s = 20)
  if (sprint > 0) {
    maxPossiblePoints += 20;
    let sprintScore = ((8.5 - sprint) / (8.5 - 5.4)) * 20;
    earnedPoints += Math.max(0, Math.min(20, sprintScore));
  }

  // Max Speed / MPH (Max 10 pts) - Youth Age 8-13 Scale (8mph = 0, 15.5mph = 10)
  if (mph > 0) {
    maxPossiblePoints += 10;
    let mphScore = ((mph - 8.0) / (15.5 - 8.0)) * 10;
    earnedPoints += Math.max(0, Math.min(10, mphScore));
  }

  // 2. AGILITY & CHANGE OF DIRECTION (Total 30 pts - Weighted Equal to Speed)
  // 5-10-5 Shuttle (Max 15 pts) - Youth Age 8-13 Scale (7.5s = 0, 4.8s = 15)
  if (shuttle > 0) {
    maxPossiblePoints += 15;
    let shuttleScore = ((7.5 - shuttle) / (7.5 - 4.8)) * 15;
    earnedPoints += Math.max(0, Math.min(15, shuttleScore));
  }
  
  // L-Drill (Max 15 pts) - Youth Age 8-13 Scale (11.0s = 0, 7.5s = 15)
  if (lDrill > 0) {
    maxPossiblePoints += 15;
    let lDrillScore = ((11.0 - lDrill) / (11.0 - 7.5)) * 15;
    earnedPoints += Math.max(0, Math.min(15, lDrillScore));
  }

  // 3. LOWER BODY POWER (Total 20 pts)
  // Broad Jump (Max 10 pts) - Youth Scale (42 inches = 0, 90 inches = 10)
  if (broadInches > 0) {
    maxPossiblePoints += 10;
    let broadScore = ((broadInches - 42) / (90 - 42)) * 10; 
    earnedPoints += Math.max(0, Math.min(10, broadScore));
  }
  
  // Vertical Jump (Max 10 pts) - Youth Scale (10 inches = 0, 26 inches = 10)
  if (vertical > 0) {
    maxPossiblePoints += 10;
    let vertScore = ((vertical - 10) / (26 - 10)) * 10; 
    earnedPoints += Math.max(0, Math.min(10, vertScore));
  }

  // 4. TECHNICAL SKILLS (Total 20 pts)
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

  if (maxPossiblePoints === 0) {
    return { dnaScore: "0.0" };
  }

  // Final 10.0 Scale Output
  let finalRawScore = (earnedPoints / maxPossiblePoints) * 10;
  let formattedScore = (Math.round(finalRawScore * 10) / 10).toFixed(1);

  logger.info(`Youth DNA Score: ${formattedScore} (Earned: ${earnedPoints} / Max Possible: ${maxPossiblePoints})`);

  return {
    dnaScore: formattedScore
  };
});