export const AllowedTags = [
  "career",
  "cv",
  "interview",
  "coding",
  "frontend",
  "backend",
  "database",
  "design",
  "writing",
  "marketing",
  "finance",
  "legal",
  "health",
  "admin",
  "other",
] as const;

export type AllowedTag = (typeof AllowedTags)[number];
