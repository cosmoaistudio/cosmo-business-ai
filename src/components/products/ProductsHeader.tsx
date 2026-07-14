import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";

export default function ProductsHeader() {
  return (
    <PageHeader
      title="Produtos"
      subtitle="Gerencie todos os produtos da sua empresa."
      action={
        <Button className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      }
    />
  );
}