import { BookOpen, Keyboard, LifeBuoy, PlayCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import "../styles/saas.css";

const SECTIONS = [
  {
    icon: BookOpen,
    title: "Documentação",
    body: "Arquitetura, Foundation e guias de módulos em /docs do repositório.",
    items: [
      "docs/ARCHITECTURE.md",
      "docs/SAAS_ARCHITECTURE.md",
      "docs/FOUNDATION.md",
    ],
  },
  {
    icon: PlayCircle,
    title: "Tutoriais",
    body: "Fluxos recomendados para colocar a loja no ar.",
    items: [
      "Configuração inicial (/assistente)",
      "Primeira venda no PDV",
      "Publicar Pedido Digital",
    ],
  },
  {
    icon: Keyboard,
    title: "Atalhos",
    body: "Produtividade no dia a dia.",
    items: [
      "Busca global / Command Palette (header)",
      "PDV: atalhos de teclado do caixa",
      "ESC fecha painéis e drawers",
    ],
  },
  {
    icon: LifeBuoy,
    title: "Suporte",
    body: "Canais de atendimento comercial (placeholders).",
    items: [
      "E-mail: suporte@cosmo.local",
      "Feedback: botão flutuante na aplicação",
      "Diagnóstico: /diagnostico",
    ],
  },
];

export function HelpCenterPage() {
  return (
    <div className="cosmo-saas">
      <PageHeader
        title="Central de Ajuda"
        subtitle="Documentação, tutoriais, atalhos e suporte."
      />

      <div className="cosmo-saas__grid cosmo-saas__grid--2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="cosmo-saas__panel">
            <div className="flex items-start gap-3">
              <section.icon className="text-sky-400" size={18} />
              <div>
                <h2 className="cosmo-saas__title">{section.title}</h2>
                <p className="cosmo-saas__desc">{section.body}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
                  {section.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
