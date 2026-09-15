/** Desktop OAuth deep-link gate — false after logout until a new Google login starts. */
let acceptDesktopOAuthCallbacks = true;

export function setAcceptDesktopOAuthCallbacks(value: boolean) {
  acceptDesktopOAuthCallbacks = value;
}

export function shouldAcceptDesktopOAuthCallbacks() {
  return acceptDesktopOAuthCallbacks;
}
