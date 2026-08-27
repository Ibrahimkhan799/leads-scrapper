import type { LeadCategory } from "@prisma/client";
import {
  DEFAULT_SCORING_PROFILE,
  matchesCondition,
  type ScoringContext,
  type ScoringProfile,
} from "@/lib/scoring/rules";

export interface ScoreReason {
  ruleId: string;
  label: string;
  points: number;
}

export interface LeadScoreResult {
  score: number;
  category: LeadCategory;
  reasons: ScoreReason[];
  profile: string;
}

export function categoryFromScore(score: number): LeadCategory {
  if (score >= 80) return "HOT";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export function calculateLeadScore(
  ctx: ScoringContext,
  profile: ScoringProfile = DEFAULT_SCORING_PROFILE
): LeadScoreResult {
  const grouped = new Map<string, ScoreReason>();

  for (const rule of profile.rules) {
    if (!matchesCondition(rule.condition, ctx)) continue;
    const current = grouped.get(rule.group);
    if (!current || rule.points > current.points) {
      grouped.set(rule.group, {
        ruleId: rule.id,
        label: rule.label,
        points: rule.points,
      });
    }
  }

  const reasons = [...grouped.values()].sort((a, b) => b.points - a.points);
  const raw = reasons.reduce((sum, reason) => sum + reason.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    category: categoryFromScore(score),
    reasons,
    profile: profile.id,
  };
}
