
export interface ModerationRequest {
  filename: string;
  type: string;
  caption?: string;
  imageData?: string;
  fileCount?: number;
}

export interface ModerationIssue {
  category: string;
  description: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  blocking_reason?: string;
}

export interface ModerationResult {
  status: "passed" | "failed";
  confidence: number;
  violation_category?: string | null;
  issues: ModerationIssue[];
}

export const CRITICAL_VIOLATIONS = {
  PERSONAL_INFO: "personal_information",
  VIOLENCE: "violence_harassment", 
  ADULT_CONTENT: "adult_content_nudity",
  HARMFUL_CONTENT: "harmful_dangerous_content"
} as const;

export const BLOCKING_THRESHOLDS = {
  HIGH_CONFIDENCE: 70,
  MEDIUM_CONFIDENCE: 60,
  LOW_CONFIDENCE: 50
} as const;
