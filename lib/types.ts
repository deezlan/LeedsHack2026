import type { AllowedTag } from "./tags";

export type Id = string;

export type User = {
  id: Id;
  name: string;
  bio?: string;
  tags: AllowedTag[];
  timezone?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type HelpRequest = {
  id: Id;
  requesterId: Id;
  title: string;
  description: string;
  urgency: "low" | "medium" | "high";
  format: "chat" | "call" | "async";
  tags: AllowedTag[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type MatchState = "suggested" | "requested" | "accepted" | "declined";

export type Match = {
  id: Id;
  requestId: Id;
  requesterId: Id;
  helperId: Id;
  score: number; // 0..1
  reasons: string[];
  state: MatchState;
  connectionPayload?: {
    message?: string;
    nextStep?: string;
  };
  createdAt: string; // ISO
  updatedAt: string; // ISO
};
