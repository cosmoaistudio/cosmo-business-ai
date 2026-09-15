export function expectValidResult(result: { valid: boolean; errors: string[] }) {
  if (!result.valid) {
    throw new Error(`Expected valid result, got errors: ${result.errors.join(", ")}`);
  }
}

export function expectInvalidResult(
  result: { valid: boolean; errors: string[] },
  messageIncludes?: string
) {
  if (result.valid) {
    throw new Error("Expected invalid result");
  }
  if (messageIncludes) {
    const found = result.errors.some((error) => error.includes(messageIncludes));
    if (!found) {
      throw new Error(
        `Expected error containing "${messageIncludes}", got: ${result.errors.join(", ")}`
      );
    }
  }
}

export async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}
