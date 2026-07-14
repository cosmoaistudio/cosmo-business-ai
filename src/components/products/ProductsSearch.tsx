import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ProductsSearch() {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border bg-white p-4">
      <Search className="text-slate-400" size={18} />

      <Input
        placeholder="Pesquisar produtos..."
        className="border-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}