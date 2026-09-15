import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CustomerSearch({
  value,
  onChange,
}: CustomerSearchProps) {
  return (
    <div className="relative max-w-lg">
      <Search
        className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
        size={18}
      />

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por nome, telefone, CPF ou e-mail..."
        className="h-12 rounded-2xl border-slate-200 pl-11"
      />
    </div>
  );
}
