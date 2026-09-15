import { supabase } from "@/config/supabase";
import type {
  CompositionOption,
  CompositionOptionWithGroup,
  CreateCompositionOptionDTO,
  OptionsQueryParams,
  PaginatedOptions,
  UpdateCompositionOptionDTO,
} from "../types/option";

const DEFAULT_PAGE_SIZE = 10;

function mapOption(row: CompositionOption): CompositionOption {
  return {
    ...row,
    description: row.description ?? null,
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    sort_order: Number(row.sort_order ?? 0),
    image_url: row.image_url ?? null,
  };
}

function mapOptionWithGroup(
  row: CompositionOptionWithGroup
): CompositionOptionWithGroup {
  return {
    ...mapOption(row),
    option_groups: row.option_groups ?? null,
  };
}

function sanitizeOptionPayload(
  payload: CreateCompositionOptionDTO | UpdateCompositionOptionDTO
) {
  return {
    ...payload,
    name: payload.name?.trim(),
    description: payload.description?.trim() || null,
    image_url: payload.image_url?.trim() || null,
  };
}

export async function getOptionsPaginated(
  params: OptionsQueryParams = {}
): Promise<PaginatedOptions> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const search = params.search?.trim();
  const status = params.status ?? "all";
  const groupId = params.groupId?.trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("options")
    .select("*, option_groups(name)", { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term}`);
  }

  if (status === "active") {
    query = query.eq("active", true);
  }

  if (status === "inactive") {
    query = query.eq("active", false);
  }

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const total = count ?? 0;

  return {
    data: (data as CompositionOptionWithGroup[]).map(mapOptionWithGroup),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getOptionsByGroupId(groupId: string) {
  const { data, error } = await supabase
    .from("options")
    .select("*")
    .eq("group_id", groupId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data as CompositionOption[]).map(mapOption);
}

export async function getOptionById(id: string) {
  const { data, error } = await supabase
    .from("options")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return mapOption(data as CompositionOption);
}

export async function createOption(payload: CreateCompositionOptionDTO) {
  const { data, error } = await supabase
    .from("options")
    .insert(sanitizeOptionPayload(payload))
    .select()
    .single();

  if (error) throw error;

  return mapOption(data as CompositionOption);
}

export async function updateOption(
  id: string,
  payload: UpdateCompositionOptionDTO
) {
  const { data, error } = await supabase
    .from("options")
    .update(sanitizeOptionPayload(payload))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapOption(data as CompositionOption);
}

export async function deleteOption(id: string) {
  const { error } = await supabase.from("options").delete().eq("id", id);

  if (error) throw error;
}

export type {
  CreateCompositionOptionDTO,
  UpdateCompositionOptionDTO,
  OptionsQueryParams,
} from "../types/option";
