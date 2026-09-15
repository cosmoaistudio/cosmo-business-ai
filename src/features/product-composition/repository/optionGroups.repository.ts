import { supabase } from "@/config/supabase";
import type {
  CreateOptionGroupDTO,
  OptionGroup,
  OptionGroupsQueryParams,
  PaginatedOptionGroups,
  UpdateOptionGroupDTO,
} from "../types/optionGroup";

const DEFAULT_PAGE_SIZE = 10;

function mapOptionGroup(row: OptionGroup): OptionGroup {
  return {
    ...row,
    description: row.description ?? null,
    min_selection: Number(row.min_selection ?? 0),
    max_selection: Number(row.max_selection ?? 1),
    sort_order: Number(row.sort_order ?? 0),
  };
}

function sanitizeOptionGroupPayload(
  payload: CreateOptionGroupDTO | UpdateOptionGroupDTO
) {
  return {
    ...payload,
    name: payload.name?.trim(),
    description: payload.description?.trim() || null,
  };
}

export async function getOptionGroups() {
  const { data, error } = await supabase
    .from("option_groups")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data as OptionGroup[]).map(mapOptionGroup);
}

export async function getOptionGroupsPaginated(
  params: OptionGroupsQueryParams = {}
): Promise<PaginatedOptionGroups> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const search = params.search?.trim();
  const status = params.status ?? "all";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("option_groups")
    .select("*", { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term}`);
  }

  if (status === "required") {
    query = query.eq("required", true);
  }

  if (status === "optional") {
    query = query.eq("required", false);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const total = count ?? 0;

  return {
    data: (data as OptionGroup[]).map(mapOptionGroup),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getOptionGroupById(id: string) {
  const { data, error } = await supabase
    .from("option_groups")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return mapOptionGroup(data as OptionGroup);
}

export async function createOptionGroup(payload: CreateOptionGroupDTO) {
  const { data, error } = await supabase
    .from("option_groups")
    .insert(sanitizeOptionGroupPayload(payload))
    .select()
    .single();

  if (error) throw error;

  return mapOptionGroup(data as OptionGroup);
}

export async function updateOptionGroup(
  id: string,
  payload: UpdateOptionGroupDTO
) {
  const { data, error } = await supabase
    .from("option_groups")
    .update(sanitizeOptionGroupPayload(payload))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapOptionGroup(data as OptionGroup);
}

export async function deleteOptionGroup(id: string) {
  const { error } = await supabase.from("option_groups").delete().eq("id", id);

  if (error) throw error;
}

export type {
  CreateOptionGroupDTO,
  UpdateOptionGroupDTO,
  OptionGroupsQueryParams,
} from "../types/optionGroup";
