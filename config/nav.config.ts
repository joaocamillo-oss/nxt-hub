import {
  BriefcaseIcon,
  BuildingIcon,
  CalendarClockIcon,
  CheckSquareIcon,
  CableIcon,
  FileTextIcon,
  HomeIcon,
  LayersIcon,
  type LucideIcon,
  MessageSquareIcon,
  PlugIcon,
  ScaleIcon,
  SparklesIcon,
  TagIcon,
  UserCogIcon,
  UserIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

/** Grupos da sidebar, na ordem em que aparecem. */
export type NavGroup =
  | "geral"
  | "atendimento"
  | "captacao"
  | "juridico"
  | "configuracoes";

export const navGroupOrder: NavGroup[] = [
  "geral",
  "atendimento",
  "captacao",
  "juridico",
  "configuracoes",
];

export const navGroupLabels: Record<NavGroup, string> = {
  geral: "",
  atendimento: "atendimento",
  captacao: "captação",
  juridico: "jurídico",
  configuracoes: "configurações",
};

export type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  group: NavGroup;
  roles?: Array<"owner" | "admin" | "member">;
};

export const navItems: NavItem[] = [
  // geral (sem label de grupo)
  { path: "/dashboard", label: "Início", icon: HomeIcon, group: "geral" },

  // atendimento
  { path: "/inbox", label: "Conversas", icon: MessageSquareIcon, group: "atendimento" },
  {
    path: "/settings/agents",
    label: "Agentes IA",
    icon: SparklesIcon,
    group: "atendimento",
    roles: ["owner", "admin"],
  },
  {
    path: "/automacoes",
    label: "Automações",
    icon: ZapIcon,
    group: "atendimento",
    roles: ["owner", "admin"],
  },

  // captação
  { path: "/contatos", label: "Clientes", icon: UsersIcon, group: "captacao" },
  { path: "/empresas", label: "Empresas", icon: BuildingIcon, group: "captacao" },
  { path: "/deals", label: "CRM", icon: BriefcaseIcon, group: "captacao" },
  { path: "/tarefas", label: "Tarefas", icon: CheckSquareIcon, group: "captacao" },

  // jurídico
  { path: "/processos", label: "Processos", icon: ScaleIcon, group: "juridico" },
  { path: "/prazos", label: "Prazos", icon: CalendarClockIcon, group: "juridico" },
  { path: "/financeiro", label: "Honorários", icon: FileTextIcon, group: "juridico" },

  // configurações
  {
    path: "/settings/integracoes",
    label: "Integrações",
    icon: PlugIcon,
    group: "configuracoes",
    roles: ["owner", "admin"],
  },
  {
    path: "/settings/members",
    label: "Membros",
    icon: UserCogIcon,
    group: "configuracoes",
  },
  {
    path: "/settings/tags",
    label: "Tags",
    icon: TagIcon,
    group: "configuracoes",
    roles: ["owner", "admin"],
  },
  {
    path: "/settings/organization",
    label: "Escritório",
    icon: LayersIcon,
    group: "configuracoes",
    roles: ["owner", "admin"],
  },
  {
    path: "/settings/profile",
    label: "Meu perfil",
    icon: UserIcon,
    group: "configuracoes",
  },
];
