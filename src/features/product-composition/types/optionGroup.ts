import type { CompositionOption } from "./option";

export type SelectionType = "checkbox" | "radio";

export const OPTION_GROUP_TYPES = [
  "required",
  "optional",
  "single_choice",
  "multiple_choice",
  "premium",
  "gift",
  "complement",
  "ingredient",
  "sauce",
  "drink",
] as const;

export type OptionGroupType = (typeof OPTION_GROUP_TYPES)[number];

export const DISPLAY_STYLES = [
  "list",
  "grid",
  "chips",
  "carousel",
  "cards",
] as const;

export type DisplayStyle = (typeof DISPLAY_STYLES)[number];

export interface OptionGroup {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  selection_type: SelectionType;
  min_selection: number;
  max_selection: number;
  required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  group_type?: OptionGroupType;
  display_style?: DisplayStyle;
  max_free?: number;
  allow_repeat?: boolean;
  allow_quantity?: boolean;
  hidden?: boolean;
  priority?: number;
  icon?: string | null;
  color?: string | null;
  is_premium?: boolean;
  is_recommended?: boolean;
}

export type CreateOptionGroupDTO = Omit<
  OptionGroup,
  "id" | "organization_id" | "created_at" | "updated_at"
>;

export type UpdateOptionGroupDTO = Partial<CreateOptionGroupDTO>;

export type OptionGroupStatusFilter = "all" | "required" | "optional";

export interface OptionGroupsQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: OptionGroupStatusFilter;
}

export interface PaginatedOptionGroups {
  data: OptionGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OptionGroupWithOptions extends OptionGroup {
  options: CompositionOption[];
}
