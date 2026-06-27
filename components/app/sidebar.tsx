"use client";

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  type NavGroup,
  navGroupLabels,
  navGroupOrder,
  navItems as configuredNavItems,
} from "@/config/nav.config";
import { OrgSwitcher, type OrgSwitcherOrg } from "./org-switcher";

type Props = {
  orgSlug: string;
  currentOrg: OrgSwitcherOrg;
  orgs: OrgSwitcherOrg[];
  currentRole: "owner" | "admin" | "member";
  user: {
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

type NavRenderItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppSidebar({ orgSlug, currentOrg, orgs, currentRole, user }: Props) {
  const pathname = usePathname();
  const base = `/app/${orgSlug}`;

  const itemsByGroup = new Map<NavGroup, NavRenderItem[]>();
  for (const item of configuredNavItems) {
    if (item.roles && !item.roles.includes(currentRole)) continue;
    const renderItem: NavRenderItem = {
      href: `${base}${item.path}`,
      label: item.label,
      icon: item.icon,
    };
    const bucket = itemsByGroup.get(item.group);
    if (bucket) bucket.push(renderItem);
    else itemsByGroup.set(item.group, [renderItem]);
  }

  const initials = (user.fullName ?? user.email)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border py-1">
        <OrgSwitcher current={currentOrg} orgs={orgs} />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {navGroupOrder.map((group) => {
          const items = itemsByGroup.get(group);
          if (!items || items.length === 0) return null;
          const label = navGroupLabels[group];
          return (
            <SidebarGroup key={group} className={label ? "" : "pt-2"}>
              {label && (
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden label-mono px-3 pt-1 text-[10px] text-sidebar-foreground/40">
                  {label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-0">
        {/* Usuário */}
        <div className="group-data-[collapsible=icon]:hidden flex items-center gap-2.5 px-3 py-3">
          <Avatar className="h-7 w-7 shrink-0">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium leading-tight text-sidebar-foreground">
              {user.fullName ?? user.email}
            </p>
            <p className="truncate text-[11px] leading-tight text-sidebar-foreground/50">
              {user.email}
            </p>
          </div>
        </div>

        {/* Avatar compacto no modo icon */}
        <div className="group-data-[collapsible=icon]:flex hidden justify-center py-3">
          <Avatar className="h-7 w-7">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        </div>

        {/* Botão de colapso */}
        <CollapseToggle />
      </SidebarFooter>
    </Sidebar>
  );
}

function CollapseToggle() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarTrigger className="group-data-[collapsible=icon]:justify-center flex w-full items-center gap-2 border-t border-sidebar-border px-3 py-2.5 text-left text-[12px] text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
      <ChevronLeftIcon
        className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
          collapsed ? "rotate-180" : ""
        }`}
      />
      <span className="group-data-[collapsible=icon]:hidden">Recolher menu</span>
    </SidebarTrigger>
  );
}

function NavLink({ item, pathname }: { item: NavRenderItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={active}
        tooltip={item.label}
        className="relative h-9 rounded-lg"
      >
        {active && (
          <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-primary" />
        )}
        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-sidebar-foreground/60"}`} />
        <span className={`text-[13px] ${active ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/80"}`}>
          {item.label}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
