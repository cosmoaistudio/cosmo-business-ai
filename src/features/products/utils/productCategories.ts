/**
 * Category helpers for product forms.
 * Categories are free-text on products.category — no separate table.
 */

export function extractProductCategories(
  products: Array<{ category?: string | null }>
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const product of products) {
    const raw = product.category?.trim();
    if (!raw) continue;
    const key = raw.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(raw);
  }

  return result.sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
}

export function filterCategorySuggestions(
  categories: string[],
  query: string,
  limit = 8
): string[] {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return categories.slice(0, limit);

  return categories
    .filter((category) =>
      category.toLocaleLowerCase("pt-BR").includes(normalized)
    )
    .slice(0, limit);
}

/** True when the typed value is new (not already in the catalog). */
export function isNewCategoryValue(
  categories: string[],
  query: string
): boolean {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return false;
  return !categories.some(
    (category) => category.toLocaleLowerCase("pt-BR") === normalized
  );
}
