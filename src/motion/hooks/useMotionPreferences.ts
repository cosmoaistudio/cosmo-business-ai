import { useContext } from "react";
import { MotionContext, type MotionContextValue } from "../motionContext";

export function useMotionPreferences(): MotionContextValue {
  return useContext(MotionContext);
}
