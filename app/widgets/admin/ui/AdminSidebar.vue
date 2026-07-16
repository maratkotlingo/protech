<template>
  <aside
    :class="[
      'flex h-full flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] transition-all duration-200',
      collapsed ? 'w-24' : fluid ? 'w-full max-w-[21rem]' : 'w-[21rem]'
    ]"
  >
    <div class="flex h-24 items-center gap-4 border-b border-[var(--admin-border)] px-5">
      <div class="grid size-14 shrink-0 place-items-center rounded-lg bg-[var(--admin-accent)] text-white shadow-lg shadow-green-900/10">
        <ShieldCheck class="size-7" />
      </div>
      <div
        v-if="!collapsed"
        class="min-w-0"
      >
        <p class="truncate text-lg font-semibold text-[var(--admin-text)]">
          ProTech Admin
        </p>
        <p class="mt-1 truncate text-sm text-[var(--admin-text-muted)]">
          Управление магазином
        </p>
      </div>
    </div>

    <nav class="flex-1 space-y-2 overflow-y-auto px-4 py-6">
      <UTooltip
        v-for="item in navItems"
        :key="item.to"
        :text="collapsed ? item.label : undefined"
        :content="{ side: 'right' }"
      >
        <NuxtLink
          :to="item.to"
          :class="[
            'group flex h-14 items-center gap-4 rounded-lg px-4 text-base font-medium transition',
            isActive(item.to)
              ? 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent-strong)]'
              : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-text)]',
            collapsed ? 'justify-center' : ''
          ]"
          @click="$emit('navigate')"
        >
          <component
            :is="item.icon"
            class="size-6 shrink-0"
          />
          <span
            v-if="!collapsed"
            class="truncate"
          >
            {{ item.label }}
          </span>
        </NuxtLink>
      </UTooltip>
    </nav>

    <div
      v-if="showCollapse"
      class="border-t border-[var(--admin-border)] p-4"
    >
      <UButton
        color="neutral"
        variant="ghost"
        class="w-full justify-center text-base"
        @click="ui.toggleSidebar()"
      >
        <PanelLeftClose
          v-if="!collapsed"
          class="size-5"
        />
        <PanelLeftOpen
          v-else
          class="size-5"
        />
        <span v-if="!collapsed">Свернуть</span>
      </UButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  BarChart3,
  ClipboardList,
  HelpCircle,
  Layers3,
  MessageSquareText,
  MessagesSquare,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShieldCheck,
  Users,
  Warehouse
} from "@lucide/vue";
import { useAdminUiStore } from "~~/app/stores/adminUi";

const props = defineProps<{
  collapsed?: boolean;
  fluid?: boolean;
  showCollapse?: boolean;
}>();

defineEmits<{
  navigate: [];
}>();

const route = useRoute();
const ui = useAdminUiStore();

const navItems = [
  { label: "Аналитика", to: "/admin", icon: BarChart3 },
  { label: "Товары", to: "/admin/products", icon: PackageSearch },
  { label: "Остатки", to: "/admin/stock", icon: Warehouse },
  { label: "Справочники", to: "/admin/catalog", icon: Layers3 },
  { label: "Заказы", to: "/admin/orders", icon: ClipboardList },
  { label: "Сообщения", to: "/admin/messages", icon: MessagesSquare },
  { label: "Пользователи", to: "/admin/users", icon: Users },
  { label: "Отзывы", to: "/admin/reviews", icon: MessageSquareText },
  { label: "FAQ", to: "/admin/faq", icon: HelpCircle },
  { label: "Аудит", to: "/admin/audit", icon: ScrollText }
];

function isActive(path: string) {
  if (path === "/admin") {
    return route.path === path;
  }

  return route.path.startsWith(path);
}

const collapsed = computed(() => props.collapsed ?? false);
const fluid = computed(() => props.fluid ?? false);
const showCollapse = computed(() => props.showCollapse ?? true);
</script>
