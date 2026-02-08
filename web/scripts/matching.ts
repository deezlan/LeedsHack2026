// scripts/matching.ts
import users from "../seed/users.json";
import requests from "../seed/requests.json";
import { rankTopN, scoreCandidate, buildReasons } from "../lib/matching";
import type { User, HelpRequest } from "../lib/types";

function pickRequest(all: HelpRequest[]) {
  const argId = process.argv[2];

  if (argId) {
    const found = all.find((r) => r.id === argId);
    if (!found) {
      const ids = all.map((r) => r.id);
      throw new Error(
        `No request found with id: ${argId}\n` +
        `Available request ids: ${ids.join(", ")}\n` +
        `Tip: run without an id: npm run test:matching`
      );
    }
    return found;
  }

  if (all.length === 0) throw new Error("No requests in seed/requests.json");
  return all[0];
}

const allUsers = users as User[];
const allRequests = requests as HelpRequest[];

const request = pickRequest(allRequests);

const requester = allUsers.find((u) => u.id === request.requesterId);
if (!requester) throw new Error(`Requester ${request.requesterId} not found in seed/users.json`);

const results = rankTopN({
  request,
  requester,
  candidates: allUsers,
  n: 8,
});

console.log("\n=== MATCHING TEST (DB-free) ===");
console.log(`Request: ${request.id}`);
console.log(`Title:   ${request.title}`);
console.log(`Format:  ${request.format} | Urgency: ${request.urgency}`);
console.log(`Tags:    ${request.tags.join(", ")}`);
console.log("");

console.table(
  results.map((r, i) => ({
    rank: i + 1,
    helperId: r.helper.id,
    helperName: r.helper.name,
    score: r.score, // 0..1
    reasons: r.reasons.join(" | "),
  }))
);

// Optional: show raw scoring for a specific helper via argv[3]
const helperId = process.argv[3];
if (helperId) {
  const helper = allUsers.find((u) => u.id === helperId);
  if (!helper) throw new Error(`Helper ${helperId} not found`);
  const score = scoreCandidate(request, requester, helper);
  const reasons = buildReasons(request, helper);
  console.log("\n--- SINGLE HELPER DEBUG ---");
  console.log({ helperId, helperName: helper.name, score, reasons });
}
