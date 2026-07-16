<template>
  <aside
    :class="[
      'admin-sidebar flex flex-col overflow-hidden transition-[width] duration-200',
      fluid
        ? 'h-full w-full'
        : collapsed
          ? 'sticky top-0 h-screen w-[var(--admin-sidebar-collapsed-width)]'
          : 'sticky top-0 h-screen w-[var(--admin-sidebar-width)]'
    ]"
  >
    <div
      :class="[
        'flex min-h-18 items-center gap-3 border-b border-[var(--admin-border)] px-3 py-3',
        collapsed ? 'justify-center' : 'justify-between'
      ]"
    >
      <NuxtLink
        to="/admin"
        class="group flex min-w-0 items-center gap-3 rounded-lg p-1 transition hover:bg-[var(--admin-accent-soft)]/45"
        aria-label="ProTech Admin"
        @click="$emit('navigate')"
      >
        <span class="admin-icon-tile size-10 shrink-0 transition group-hover:scale-[1.03]">
          <Zap class="size-6" />
        </span>
        <span
          v-if="!collapsed"
          class="min-w-0 leading-tight"
        >
          <span class="block truncate text-base font-semibold tracking-normal text-[var(--admin-text)]">
            ProTech
          </span>
          <span class="block truncate text-[0.7rem] uppercase text-[var(--admin-text-muted)]">
            Admin console
          </span>
        </span>
      </NuxtLink>

      <UTooltip
        v-if="!collapsed && showCollapse"
        text="Свернуть меню"
      >
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-panel-left-close"
          square
          class="rounded-md"
          aria-label="Свернуть навигацию"
          @click="ui.toggleSidebar()"
        />
      </UTooltip>
    </div>

    <div
      v-if="!collapsed"
      class="border-b border-[var(--admin-border)] px-4 py-3"
    >
      <p class="text-xs font-semibold uppercase text-[var(--admin-accent-strong)]">
        Рабочее пространство
      </p>
      <p class="mt-1 text-xs leading-5 text-[var(--admin-text-muted)]">
        Каталог, склад, продажи и поддержка.
      </p>
    </div>

    <nav
      :class="[
        'admin-muted-scroll flex-1 overflow-y-auto py-3',
        collapsed ? 'px-2' : 'px-3'
      ]"
    >
      <div
        v-for="group in navGroups"
        :key="group.label"
        class="mb-4 last:mb-0"
      >
        <p
          v-if="!collapsed"
          class="mb-1 px-2 text-[0.68rem] font-semibold uppercase text-[var(--admin-text-subtle)]"
        >
          {{ group.label }}
        </p>

        <div class="space-y-1">
          <UTooltip
            v-for="item in group.items"
            :key="item.to"
            :text="collapsed ? item.label : undefined"
            :content="{ side: 'right' }"
          >
            <NuxtLink
              :to="item.to"
              :class="[
                'admin-sidebar-link group',
                isActive(item.to) ? 'is-active' : '',
                collapsed ? 'justify-center px-2' : ''
              ]"
              @click="$emit('navigate')"
            >
              <span
                :class="[
                  'grid size-8 shrink-0 place-items-center rounded-md transition',
                  isActive(item.to)
                    ? 'bg-[var(--admin-accent)] text-white shadow-sm shadow-emerald-950/15'
                    : 'bg-white text-[var(--admin-text-muted)] ring-1 ring-[var(--admin-border)] group-hover:text-[var(--admin-accent-strong)]'
                ]"
              >
                <component
                  :is="item.icon"
                  class="size-4"
                />
              </span>
              <span
                v-if="!collapsed"
                class="truncate"
              >
                {{ item.label }}
              </span>
            </NuxtLink>
          </UTooltip>
        </div>
      </div>
    </nav>

    <div
      v-if="showCollapse"
      :class="[
        'border-t border-[var(--admin-border)] p-3',
        collapsed ? 'space-y-2' : 'space-y-3'
      ]"
    >
      <UButton
        v-if="!collapsed"
        color="neutral"
        variant="outline"
        icon="i-lucide-store"
        to="/"
        block
        class="justify-center rounded-md bg-white"
        @click="$emit('navigate')"
      >
        В магазин
      </UButton>

      <div
        v-if="collapsed"
        class="flex flex-col items-center gap-2"
      >
        <UTooltip text="В магазин">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-store"
            to="/"
            square
            class="rounded-md"
            aria-label="В магазин"
            @click="$emit('navigate')"
          />
        </UTooltip>

        <UTooltip text="Развернуть меню">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-panel-left-open"
            square
            class="rounded-md"
            aria-label="Развернуть навигацию"
            @click="ui.toggleSidebar()"
          />
        </UTooltip>
      </div>

      <button
        v-if="!collapsed"
        type="button"
        class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-xs text-[var(--admin-text-muted)] transition hover:bg-[var(--admin-accent-soft)]/45 hover:text-[var(--admin-text)]"
        @click="ui.toggleSidebar()"
      >
        <PanelLeftClose class="size-4" />
        <span>Свернуть навигацию</span>
      </button>
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
  ScrollText,
  Users,
  Warehouse,
  Zap
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

const navGroups = [
  {
    label: "Обзор",
    items: [
      { label: "Аналитика", to: "/admin", icon: BarChart3 }
    ]
  },
  {
    label: "Каталог",
    items: [
      { label: "Товары", to: "/admin/products", icon: PackageSearch },
      { label: "Остатки", to: "/admin/stock", icon: Warehouse },
      { label: "Справочники", to: "/admin/catalog", icon: Layers3 }
    ]
  },
  {
    label: "Операции",
    items: [
      { label: "Заказы", to: "/admin/orders", icon: ClipboardList },
      { label: "Сообщения", to: "/admin/messages", icon: MessagesSquare }
    ]
  },
  {
    label: "Контент",
    items: [
      { label: "Отзывы", to: "/admin/reviews", icon: MessageSquareText },
      { label: "FAQ", to: "/admin/faq", icon: HelpCircle }
    ]
  },
  {
    label: "Система",
    items: [
      { label: "Пользователи", to: "/admin/users", icon: Users },
      { label: "Аудит", to: "/admin/audit", icon: ScrollText }
    ]
  }
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
