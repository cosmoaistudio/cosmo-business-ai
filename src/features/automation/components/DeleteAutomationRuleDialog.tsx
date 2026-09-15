import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { automationRulesService } from "../services/automationRules.service";
import type { AutomationRuleWithLastLog } from "../types/automationRule";

interface DeleteAutomationRuleDialogProps {
  rule: AutomationRuleWithLastLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteAutomationRuleDialog({
  rule,
  open,
  onOpenChange,
  onDeleted,
}: DeleteAutomationRuleDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!rule) return;

    try {
      setLoading(true);
      await automationRulesService.remove(rule.id);
      toast.success("Automação excluída com sucesso.");
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir automação:", error);
      toast.error("Não foi possível excluir a automação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Excluir automação</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <strong>{rule?.name}</strong>? Os logs históricos serão mantidos,
            mas a regra deixará de ser executada.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
