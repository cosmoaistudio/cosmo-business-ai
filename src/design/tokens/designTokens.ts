import { colors } from "./colors";
import { elevations } from "./elevations";
import { glass } from "./glass";
import { gradients } from "./gradients";
import { radius } from "./radius";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const designTokens = {
  colors,
  spacing,
  radius,
  typography,
  elevations,
  glass,
  gradients,
} as const;

export type DesignTokens = typeof designTokens;

export {
  colors,
  spacing,
  radius,
  typography,
  elevations,
  glass,
  gradients,
};
