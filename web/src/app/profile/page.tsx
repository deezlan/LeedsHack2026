"use client";

import { useEffect, useMemo, useState } from "react";
import { AllowedTags, type AllowedTag } from "../../../lib/tags";
import { useRequireAuth } from "@/src/hooks/useRequireAuth";

const STORAGE_KEY = "leedsHack.profile";
const PROFILE_UPDATED_EVENT = "leedsHack.profile.updated";

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
  const session = useRequireAuth();
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

  if (!session) return null;

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
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
    setSaveMessage("Profile saved successfully.");
  };

  return (
    <section className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-4 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-leeds-blue tracking-tight">Your Profile</h1>
        <p className="text-lg text-leeds-blue-dark/70 max-w-2xl">
          Customize how you appear to other hackers. Show off your skills and what you're looking for.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-leeds-border overflow-hidden">
        <div className="bg-leeds-blue/5 px-6 py-4 border-b border-leeds-border">
          <h2 className="font-semibold text-leeds-blue">Public Information</h2>
        </div>

        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8">
          {/* Name Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-leeds-blue-dark">
              Display Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="e.g. Alex Smith"
              className="w-full rounded-xl border border-leeds-border bg-leeds-cream/30 px-4 py-3 text-leeds-blue-dark placeholder:text-gray-400 focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 transition-all outline-none"
            />
          </div>

          {/* Bio Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-leeds-blue-dark">
              Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, bio: event.target.value }))
              }
              placeholder="Tell us about your skills, interests, and what you want to build..."
              rows={4}
              className="w-full resize-none rounded-xl border border-leeds-border bg-leeds-cream/30 px-4 py-3 text-leeds-blue-dark placeholder:text-gray-400 focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 transition-all outline-none"
            />
            <p className="text-xs text-leeds-blue-dark/50 text-right">
              {profile.bio.length} characters
            </p>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-leeds-blue-dark">
                Skills & Interests
              </label>
              <span className="text-xs font-medium text-leeds-teal bg-leeds-teal/10 px-2 py-1 rounded-full">
                {profile.tags.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {AllowedTags.map((tag) => {
                const selected = tagSet.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border ${selected
                        ? "border-leeds-teal bg-leeds-teal text-white shadow-md transform scale-105"
                        : "border-leeds-border bg-white text-leeds-blue-dark/70 hover:border-leeds-teal/50 hover:bg-leeds-cream"
                      }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-leeds-border flex items-center justify-end gap-4">
            {saveMessage && (
              <span className="animate-fadeUp text-sm font-medium text-leeds-teal flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                {saveMessage}
              </span>
            )}
            <button
              type="submit"
              className="rounded-full bg-leeds-blue text-white px-8 py-3 text-sm font-bold shadow-lg shadow-leeds-blue/20 hover:bg-leeds-blue-dark hover:shadow-xl hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-leeds-blue"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
