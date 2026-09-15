import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ProductSearch({
  value,
  onChange,
  placeholder = "Pesquisar produtos por nome ou categoria...",
}: ProductSearchProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Search className="shrink-0 text-slate-400" size={18} />

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="border-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
