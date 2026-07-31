"use client";

import { ChangeEvent, useRef, useState } from "react";
import type { ProfileApprovalStatus, UserProfile } from "@/types/user-profile";

type ResumeProfileProps = {
  profile: UserProfile | null;
  approvalStatus: ProfileApprovalStatus;
  onChange: (profile: UserProfile | null) => void;
  onApprove: () => void;
};

export default function ResumeProfile({
  profile,
  approvalStatus,
  onChange,
  onApprove,
}: ResumeProfileProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleResumeUpload(event: ChangeEvent<HTMLInputElement>) {
    const resume = event.target.files?.[0];

    if (!resume) {
      return;
    }

    if (!resume.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF resume.");
      event.target.value = "";
      return;
    }

    if (resume.size > 10 * 1024 * 1024) {
      setError("Resume must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("resume", resume);

      const response = await fetch("/api/profile/parse", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let result: {
        profile?: UserProfile;
        error?: string;
        details?: string;
      };

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          responseText || "The server returned an invalid response",
        );
      }

      if (!response.ok) {
        throw new Error(
          result.details ?? result.error ?? "Resume analysis failed",
        );
      }

      if (!result.profile) {
        throw new Error("The server did not return a user profile");
      }

      onChange(result.profile);
    } catch (uploadError) {
      console.error(uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not analyze the resume",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function updateProfile(changes: Partial<UserProfile>) {
    if (!profile) {
      return;
    }

    onChange({
      ...profile,
      ...changes,
    });
  }

  const statusLabel =
    approvalStatus === "approved"
      ? "Approved"
      : approvalStatus === "needs_review"
        ? "Needs review"
        : "No profile";

  const statusClasses =
    approvalStatus === "approved"
      ? "bg-green-950/50 text-green-300 border-green-900"
      : approvalStatus === "needs_review"
        ? "bg-yellow-950/50 text-yellow-300 border-yellow-900"
        : "bg-slate-950 text-slate-400 border-slate-700";

  const cleanedName = profile?.name?.trim() ?? "";

  const cleanedFacts = Array.isArray(profile?.facts)
    ? profile.facts.map((fact) => String(fact).trim()).filter(Boolean)
    : [];

  const canApprove = cleanedName.length > 0 && cleanedFacts.length > 0;

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">User Profile</h2>

          <p className="mt-1 text-sm text-slate-400">
            Upload a resume, review every fact, and approve the profile before
            the assistant can use it.
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </div>

      <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-700 p-5 text-center hover:border-slate-500">
        <span className="font-medium">
          {uploading
            ? "Analyzing resume..."
            : profile
              ? "Replace resume"
              : "Upload resume PDF"}
        </span>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          disabled={uploading}
          onChange={handleResumeUpload}
          className="hidden"
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {profile && (
        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm text-slate-400">Name</label>

            <input
              value={profile.name}
              onChange={(event) =>
                updateProfile({
                  name: event.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">
              Professional headline
            </label>

            <input
              value={profile.headline}
              onChange={(event) =>
                updateProfile({
                  headline: event.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">
              Tell-me-about-yourself answer
            </label>

            <textarea
              value={profile.elevatorPitch}
              rows={5}
              onChange={(event) =>
                updateProfile({
                  elevatorPitch: event.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Skills</label>

            <input
              value={profile.skills.join(", ")}
              onChange={(event) =>
                updateProfile({
                  skills: event.target.value
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
                })
              }
              placeholder="React, Node.js, Python"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Approved facts</label>

            <p className="mt-1 text-xs text-slate-500">
              One fact per line. Delete anything that is incorrect or
              exaggerated.
            </p>

            <textarea
              value={profile.facts.join("\n")}
              rows={12}
              onChange={(event) =>
                updateProfile({
                  facts: event.target.value
                    .split("\n")
                    .map((fact) => fact.trim())
                    .filter(Boolean),
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
          </div>

          {profile.missingDetails.length > 0 && (
            <div className="rounded-xl bg-yellow-950/30 p-4">
              <p className="font-medium text-yellow-300">
                Details not found in the resume
              </p>

              <ul className="mt-2 space-y-1 text-sm text-yellow-100/80">
                {profile.missingDetails.map((detail) => (
                  <li key={detail}>• {detail}</li>
                ))}
              </ul>

              <p className="mt-3 text-xs text-yellow-100/60">
                Add any relevant answers manually to the approved facts section.
              </p>
            </div>
          )}

          {approvalStatus !== "approved" ? (
            <div className="rounded-xl border border-yellow-900 bg-yellow-950/20 p-4">
              <button
                type="button"
                onClick={() => {
                  console.log("Approve clicked", {
                    canApprove,
                    name: cleanedName,
                    factsCount: cleanedFacts.length,
                  });

                  if (!canApprove) {
                    return;
                  }

                  onApprove();
                }}
                className={`mt-4 w-full rounded-xl px-4 py-3 font-semibold text-white ${
                  canApprove
                    ? "cursor-pointer bg-green-600 hover:bg-green-500"
                    : "cursor-not-allowed bg-slate-700 opacity-50"
                }`}
              >
                Approve Profile
              </button>

              {!canApprove && (
                <div className="mt-3 rounded-lg bg-red-950/30 p-3 text-sm text-red-300">
                  {!cleanedName && <p>Profile name is missing.</p>}

                  {cleanedFacts.length === 0 && (
                    <p>At least one approved fact is required.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-green-900 bg-green-950/20 p-4">
              <p className="font-medium text-green-300">Profile approved</p>

              <p className="mt-1 text-sm text-green-100/70">
                Conversation Mode may now use these facts when answering
                personal questions.
              </p>

              <p className="mt-2 text-xs text-green-100/50">
                Editing any field will require approval again.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-full rounded-xl border border-red-900 px-4 py-3 text-red-400 hover:bg-red-950/30"
          >
            Remove Profile
          </button>
        </div>
      )}
    </section>
  );
}
