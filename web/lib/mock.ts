import type { Id } from "./types";

export type MatchCard = {
  id: Id;
  requestId: Id;
  helperName: string;
  score: number;
  reasons: string[];
  state?: "suggested" | "requested" | "accepted" | "declined";
  connectionPayload?: { message?: string; nextStep?: string };
};

export type InboxItem = {
  matchId: Id;
  requestId: Id;
  fromUserName: string;
  preview: string;
  status: "unread" | "read" | "action-needed" | "accepted" | "declined";
};

export const mockMatches: MatchCard[] = [
  {
    id: "match_r1",
    requestId: "req_pitch_practice",
    helperName: "Amina Patel",
    score: 0.92,
    reasons: [
      "Expert in pitch coaching",
      "Available this week",
      "Similar project domain",
    ],
  },
  {
    id: "match_r2",
    requestId: "req_ui_review",
    helperName: "Marcus Hill",
    score: 0.86,
    reasons: [
      "Strong UI/UX portfolio",
      "Has reviewed hackathon demos",
      "Matches requested tags",
    ],
  },
  {
    id: "match_r3",
    requestId: "req_backend_debug",
    helperName: "Sofia Nguyen",
    score: 0.79,
    reasons: ["Node + Postgres experience", "Quick response time"],
  },
];

export const mockInbox: InboxItem[] = [
  {
    matchId: "match_r1",
    requestId: "req_pitch_practice",
    fromUserName: "Amina Patel",
    preview: "Happy to run a 20-minute pitch practice tomorrow.",
    status: "unread",
  },
  {
    matchId: "match_r2",
    requestId: "req_ui_review",
    fromUserName: "Marcus Hill",
    preview: "Send the latest Figma link and I will review tonight.",
    status: "action-needed",
  },
  {
    matchId: "match_r3",
    requestId: "req_backend_debug",
    fromUserName: "Sofia Nguyen",
    preview: "I can take a look at the logs after 6pm.",
    status: "read",
  },
];
