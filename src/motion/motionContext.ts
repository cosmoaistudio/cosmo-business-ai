import { createContext } from "react";

export interface MotionContextValue {
  reducedMotion: boolean;
}

export const MotionContext = createContext<MotionContextValue>({
  reducedMotion: false,
});
