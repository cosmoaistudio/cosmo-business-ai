import { Sparkles, Upload, X } from "lucide-react";

export default function ProductModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b p-6">

          <div>

            <h2 className="text-2xl font-bold">
              Novo Produto
            </h2>

            <p className="text-slate-500">
              Cadastre um novo produto.
            </p>

          </div>

          <button>

            <X />

          </button>

        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">

          <input
            placeholder="Nome do produto"
            className="rounded-2xl border p-4"
          />

          <input
            placeholder="Categoria"
            className="rounded-2xl border p-4"
          />

          <input
            placeholder="Preço"
            className="rounded-2xl border p-4"
          />

          <input
            placeholder="Estoque"
            className="rounded-2xl border p-4"
          />

        </div>

        <div className="px-6">

          <textarea
            rows={5}
            placeholder="Descrição..."
            className="w-full rounded-2xl border p-4"
          />

        </div>

        <div className="mt-6 flex items-center justify-between border-t p-6">

          <button className="flex items-center gap-3 rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white">

            <Sparkles size={18} />

            Gerar com Orbit

          </button>

          <button className="flex items-center gap-3 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white">

            <Upload size={18} />

            Salvar Produto

          </button>

        </div>

      </div>

    </div>
  );
}