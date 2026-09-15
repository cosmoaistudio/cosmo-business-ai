import { getMyProfile } from "../repository/profile.repository";

export const profileService = {
  getMyProfile(userId?: string) {
    return getMyProfile(userId);
  },
};
