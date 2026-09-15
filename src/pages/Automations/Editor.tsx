import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  RuleBuilder,
  useAutomationRuleEditor,
  type CreateAutomationRuleDTO,
} from "@/features/automation";
import { EVENTS_BY_MODULE } from "@/features/automation/utils/automationLabels";

export default function AutomationEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  const draftApplied = useRef(false);

  const {
    form,
    setForm,
    loading,
    saving,
    setModule,
    setTriggerType,
    setConditions,
    setActions,
    save,
  } = useAutomationRuleEditor(id);

  useEffect(() => {
    if (isEditing || draftApplied.current || loading) return;
    const draft = (location.state as { draft?: CreateAutomationRuleDTO } | null)
      ?.draft;
    if (!draft) return;
    draftApplied.current = true;
    setForm(draft);
  }, [isEditing, loading, location.state, setForm]);

  async function handleSave() {
    await save(() => navigate("/automacoes"));
  }

  function handleModuleChange(module: typeof form.module) {
    const events = EVENTS_BY_MODULE[module];
    setModule(module);
    if (events.length > 0 && !events.includes(form.trigger_type as never)) {
      setTriggerType(events[0]);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Carregando automação...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={isEditing ? "Editar automação" : "Nova automação"}
        subtitle="Configure o fluxo visual SE → Condição → ENTÃO → Ação."
        action={
          <Link to="/automacoes">
            <Button type="button" variant="outline" className="rounded-xl">
              <ArrowLeft size={16} />
              Voltar
            </Button>
          </Link>
        }
      />

      <RuleBuilder
        form={form}
        saving={saving}
        onChange={setForm}
        onModuleChange={handleModuleChange}
        onTriggerChange={setTriggerType}
        onConditionsChange={setConditions}
        onActionsChange={setActions}
        onSave={handleSave}
      />
    </div>
  );
}
