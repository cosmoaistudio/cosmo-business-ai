export interface CompositionOption {
  id: string;
  organization_id: string;
  group_id: string;
  name: string;
  description: string | null;
  price: number;
  stock_control: boolean;
  stock: number;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  sku?: string | null;
  barcode?: string | null;
  weight?: number;
  cost_price?: number;
  nutrition?: Record<string, unknown>;
  preparation_time?: number;
  priority?: number;
  is_featured?: boolean;
  is_default?: boolean;
  min_quantity?: number;
  max_quantity?: number;
}

export interface CompositionOptionWithGroup extends CompositionOption {
  option_groups?: { name: string } | null;
}

export type CreateCompositionOptionDTO = Omit<
  CompositionOption,
  "id" | "organization_id" | "created_at" | "updated_at"
>;

export type UpdateCompositionOptionDTO = Partial<
  Omit<CreateCompositionOptionDTO, "group_id">
>;

export type OptionStatusFilter = "all" | "active" | "inactive";

export interface OptionsQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: OptionStatusFilter;
  groupId?: string;
}

export interface PaginatedOptions {
  data: CompositionOptionWithGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
