export type UserProfile = {
  name: string;
  headline: string;
  elevatorPitch: string;
  skills: string[];
  facts: string[];
  missingDetails: string[];
};

export type ProfileApprovalStatus = "none" | "needs_review" | "approved";
