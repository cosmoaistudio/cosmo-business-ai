import { Bell, Moon, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b bg-white px-8">

      <div className="flex w-full max-w-lg items-center gap-3">

        <Search className="text-slate-400" size={18} />

        <Input
          placeholder="Pesquisar produtos, pedidos, clientes..."
          className="border-0 shadow-none focus-visible:ring-0"
        />

      </div>

      <div className="flex items-center gap-4">

        <Button
          className="rounded-full bg-violet-600 hover:bg-violet-700"
        >
          <Sparkles className="mr-2" size={18} />
          Cosmo AI
        </Button>

        <Button variant="ghost" size="icon">
          <Bell size={20} />
        </Button>

        <Button variant="ghost" size="icon">
          <Moon size={20} />
        </Button>

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
            F
          </div>

          <div>

            <h3 className="font-semibold text-slate-800">
              Felipe
            </h3>

            <p className="text-sm text-slate-500">
              Administrador
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}