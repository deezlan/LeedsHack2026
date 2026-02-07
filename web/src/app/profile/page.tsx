"use client";

import { useEffect, useMemo, useState } from "react";
import { AllowedTags, type AllowedTag } from "../../../lib/tags";

const STORAGE_KEY = "leedsHack.profile";

type ProfileDraft = {
  name: string;
  bio: string;
  tags: AllowedTag[];
};

const emptyProfile: ProfileDraft = {
  name: "",
  bio: "",
  tags: [],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfile);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as ProfileDraft;
      setProfile({
        name: parsed.name ?? "",
        bio: parsed.bio ?? "",
        tags: Array.isArray(parsed.tags)
          ? (parsed.tags.filter((tag) =>
              AllowedTags.includes(tag as AllowedTag)
            ) as AllowedTag[])
          : [],
      });
    } catch {
      // Ignore invalid localStorage entries.
    }
  }, []);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const tagSet = useMemo(() => new Set(profile.tags), [profile.tags]);

  const toggleTag = (tag: AllowedTag) => {
    setProfile((prev) => {
      const nextTags = new Set(prev.tags);
      if (nextTags.has(tag)) {
        nextTags.delete(tag);
      } else {
        nextTags.add(tag);
      }
      return { ...prev, tags: Array.from(nextTags) };
    });
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaveMessage("Profile saved locally.");
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Profile
        </p>
        <h1 className="text-3xl font-semibold">Your Profile</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Update your public details and tags. Changes are saved locally in your
          browser until backend wiring is ready.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-[1fr,2fr]">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Name
            <input
              type="text"
              value={profile.name}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Add your name"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
          </label>

          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Bio
            <textarea
              value={profile.bio}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, bio: event.target.value }))
              }
              placeholder="Share what you can help with"
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Tags
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {profile.tags.length} selected
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {AllowedTags.map((tag) => {
              const selected = tagSet.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                    selected
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-700"
          >
            Save
          </button>
          {saveMessage && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              {saveMessage}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
