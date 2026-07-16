export interface Product {
  id: string;

  name: string;

  category: string;

  description: string;

  price: number;

  stock: number;

  image?: string;

  status: "active" | "inactive";

  created_at: string;

  updated_at?: string;
}