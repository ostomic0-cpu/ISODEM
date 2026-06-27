import { prisma } from "@/lib/prisma";

type ActivityMetadata = Record<string, string | number | boolean | null>;

const ALLOWED_METADATA_KEYS = new Set([
  "docNumber",
  "title",
  "email",
  "name",
  "status",
  "reason",
  "department",
  "category",
  "versionNumber",
  "findingId",
  "auditId",
  "capaId",
  "userId",
  "targetUserId",
  "action",
  "description",
]);

function sanitizeMetadata(input: ActivityMetadata): string {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (ALLOWED_METADATA_KEYS.has(key)) {
      safe[key] = value;
    }
  }
  return JSON.stringify(safe);
}

/**
 * Log an activity entry.
 * Wrapped in try/catch – never fails the caller.
 * Metadata keys are whitelisted – no secrets can leak.
 */
export async function logActivity(
  userId: string,
  action: string,
  metadata?: ActivityMetadata,
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        metadata: sanitizeMetadata(metadata ?? {}),
      },
    });
  } catch {
    // Fail silently – never let activity logging crash the main operation
  }
}
