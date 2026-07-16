import { X } from "lucide-react";
import ProductForm from "./ProductForm";

interface ProductModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductModal({
  onClose,
  onSaved,
}: ProductModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">
            Novo Produto
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        <ProductForm
          onSuccess={() => {
            onSaved();
            onClose();
          }}
        />

      </div>
    </div>
  );
}