import {
  fetchProfileByUserId,
  getMyProfile,
  signInWithEmail,
  signOut,
  getSession,
  subscribeToAuthChanges,
} from "./repositories/auth.repository";

export const authService = {
  getSession,
  signIn: signInWithEmail,
  signOut,
  getProfile: fetchProfileByUserId,
  getMyProfile,
  onAuthStateChange: subscribeToAuthChanges,
};
