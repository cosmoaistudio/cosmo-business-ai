import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithOAuth, getAuthRedirectUrl } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  getAuthRedirectUrl: vi.fn(),
}));

vi.mock("@/config/supabase", () => ({
  supabase: {
    auth: {
      signInWithOAuth,
    },
  },
  getAuthRedirectUrl: (...args: unknown[]) => getAuthRedirectUrl(...args),
}));

vi.mock("@/features/auth/oauth/oauthRedirect", () => ({
  isElectronAuthEnvironment: () => false,
}));

import { signInWithGoogle } from "@/features/auth/repository/auth.repository";

describe("signInWithGoogle", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    getAuthRedirectUrl.mockReset();
    signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    getAuthRedirectUrl.mockReturnValue("http://localhost:5173/");
  });

  it("sends prompt select_account and keeps the existing redirectTo", async () => {
    await signInWithGoogle();

    expect(getAuthRedirectUrl).toHaveBeenCalledWith("/");
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/",
        skipBrowserRedirect: false,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  });

  it("preserves an explicit redirectTo from the caller", async () => {
    await signInWithGoogle({ redirectTo: "https://app.example.com/" });

    expect(signInWithOAuth.mock.calls[0][0].options.redirectTo).toBe(
      "https://app.example.com/"
    );
    expect(signInWithOAuth.mock.calls[0][0].options.queryParams.prompt).toBe(
      "select_account"
    );
  });
});
