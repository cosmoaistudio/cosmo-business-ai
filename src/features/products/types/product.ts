export type ProductMenuKind = "simple" | "assembled" | "combo";

export interface Product {
  id: string;

  name: string;

  category: string;

  description: string;

  price: number;

  stock: number;

  min_stock: number;

  image_url?: string | null;

  image?: string;

  status: "active" | "inactive";

  /** Present after migration 026; until then kind is derived from composition. */
  menu_kind?: ProductMenuKind;

  /** Present after migration 028. Default fixed when absent. */
  combo_selection_mode?: "fixed" | "choice";
  combo_min_choices?: number | null;
  combo_max_choices?: number | null;

  created_at: string;

  updated_at?: string;
}