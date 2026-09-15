export type FeedbackKind = "suggestion" | "bug";

export interface FeedbackPayload {
  kind: FeedbackKind;
  message: string;
  pagePath?: string;
  contactEmail?: string;
}

export interface FeedbackResult {
  accepted: boolean;
  id: string;
  message: string;
}
