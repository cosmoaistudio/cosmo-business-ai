/**
 * Publish must target the slug that was just persisted.
 * Never publish from a stale hook snapshot after save.
 */
export function resolvePublishTargetSlug(
  justSavedSlug: string | undefined,
  fallbackSlug: string
): string {
  const slug = (justSavedSlug ?? fallbackSlug).trim();
  return slug;
}

export function canStartPublish(input: {
  publishing: boolean;
  saving?: boolean;
  ready: boolean;
}): boolean {
  return input.ready && !input.publishing && !input.saving;
}

export function publishedFlagAfterAttempt(input: {
  success: boolean;
  productCount: number;
}): boolean {
  return input.success && input.productCount > 0;
}
