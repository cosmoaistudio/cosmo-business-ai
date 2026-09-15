import type {
  GrowthAiPanelSlot,
  GrowthContentObjective,
  GrowthNiche,
  GrowthSocialNetwork,
  PaidTrafficChannel,
} from "../types/growthHub.types";

export const GROWTH_NICHES: { id: GrowthNiche; label: string }[] = [
  { id: "restaurante", label: "Restaurante" },
  { id: "pizzaria", label: "Pizzaria" },
  { id: "hamburgueria", label: "Hamburgueria" },
  { id: "acai", label: "Açaí" },
  { id: "sorveteria", label: "Sorveteria" },
  { id: "barbearia", label: "Barbearia" },
  { id: "salao", label: "Salão" },
  { id: "clinica", label: "Clínica" },
  { id: "dentista", label: "Dentista" },
  { id: "pet_shop", label: "Pet Shop" },
  { id: "academia", label: "Academia" },
  { id: "loja", label: "Loja" },
  { id: "mercado", label: "Mercado" },
  { id: "padaria", label: "Padaria" },
  { id: "farmacia", label: "Farmácia" },
  { id: "imobiliaria", label: "Imobiliária" },
  { id: "advogado", label: "Advogado" },
  { id: "personal", label: "Personal" },
  { id: "criador_conteudo", label: "Criador de Conteúdo" },
  { id: "outro", label: "Outro" },
];

export const GROWTH_NETWORKS: { id: GrowthSocialNetwork; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "pinterest", label: "Pinterest" },
  { id: "whatsapp", label: "WhatsApp" },
];

export const GROWTH_OBJECTIVES: {
  id: GrowthContentObjective;
  label: string;
}[] = [
  { id: "atrair", label: "Atrair" },
  { id: "engajar", label: "Engajar" },
  { id: "converter", label: "Converter" },
  { id: "retencao", label: "Retenção" },
  { id: "autoridade", label: "Autoridade" },
  { id: "promocao", label: "Promoção" },
];

export const PAID_TRAFFIC_CHANNELS: PaidTrafficChannel[] = [
  {
    id: "meta_ads",
    name: "Meta Ads",
    description: "Campanhas no Instagram e Facebook. Integração de API em breve.",
    status: "coming_soon",
    metricsPlaceholder: { spend: "—", clicks: "—", roas: "—" },
  },
  {
    id: "google_ads",
    name: "Google Ads",
    description: "Busca e Performance Max. Arquitetura pronta para conexão.",
    status: "coming_soon",
    metricsPlaceholder: { spend: "—", clicks: "—", roas: "—" },
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    description: "Tráfego curto e criativos. Sem API nesta versão.",
    status: "coming_soon",
    metricsPlaceholder: { spend: "—", clicks: "—", roas: "—" },
  },
];

export const GROWTH_AI_SLOTS: GrowthAiPanelSlot[] = [
  {
    id: "roteiro",
    title: "Roteiros",
    description: "Estrutura de Reels, Shorts e stories com gancho e CTA.",
  },
  {
    id: "legenda",
    title: "Legendas",
    description: "Textos prontos para publicar com tom da marca.",
  },
  {
    id: "hashtags",
    title: "Hashtags",
    description: "Pacotes por nicho, alcance e intenção.",
  },
  {
    id: "oferta",
    title: "Ofertas",
    description: "Combos, cupons e urgência alinhados ao cardápio.",
  },
  {
    id: "criativo",
    title: "Criativos",
    description: "Briefs de imagem/vídeo para produção rápida.",
  },
];

export const IDEA_QUANTITY_OPTIONS = [3, 5, 8, 10, 15, 20] as const;
