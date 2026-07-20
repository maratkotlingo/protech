<template>
  <div class="messages-shop-page space-y-5">
    <AdminPageHeader
      title="Сообщения"
      kicker="Поддержка"
      description="Диалоги с пользователями, вопросы по заказам и оперативные ответы."
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="conversationsPending"
          @click="refreshConversations()"
        >
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <div class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      <AdminMetricCard
        label="Диалогов"
        :value="formatNumber(conversations.length)"
        hint="Всего доступных тредов"
        positive
      >
        <template #icon>
          <Inbox class="size-6" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="С непрочитанными"
        :value="formatNumber(unreadConversationsCount)"
        hint="Диалоги, где нужен ответ"
        :positive="unreadConversationsCount === 0"
      >
        <template #icon>
          <BellDot class="size-6" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Непрочитанных"
        :value="formatNumber(unreadMessagesCount)"
        hint="Сумма по всем диалогам"
        :positive="unreadMessagesCount === 0"
      >
        <template #icon>
          <MessageSquare class="size-6" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="В выбранном треде"
        :value="formatNumber(messages.length)"
        hint="Сообщений в открытом диалоге"
        positive
      >
        <template #icon>
          <MessagesSquare class="size-6" />
        </template>
      </AdminMetricCard>
    </div>

    <UAlert
      v-if="conversationsError"
      color="error"
      variant="soft"
      title="Не удалось загрузить диалоги"
      :description="getErrorMessage(conversationsError)"
      class="rounded-2xl"
    />

    <div class="grid min-h-[680px] gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <UCard
        class="admin-list-card"
        :ui="{ body: 'p-0' }"
      >
        <div class="border-b border-[var(--admin-border)] p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="admin-section-heading">
                Входящие
              </p>
              <p class="admin-section-copy">
                {{ filteredConversations.length }} из {{ conversations.length }} диалогов
              </p>
            </div>
            <UBadge
              :color="socketConnected ? 'success' : 'neutral'"
              variant="soft"
              class="rounded-md"
            >
              {{ socketConnected ? "онлайн" : "история" }}
            </UBadge>
          </div>
          <div class="rounded-2xl bg-[#f9fafb] p-1.5 shadow-inner shadow-zinc-950/5">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Найти пользователя"
              size="lg"
              variant="none"
              :ui="adminInputUi"
            />
          </div>
        </div>

        <div class="admin-muted-scroll max-h-[620px] space-y-2 overflow-y-auto bg-[#f9fafb] p-3">
          <button
            v-for="conversation in filteredConversations"
            :key="conversation.user.id"
            type="button"
            class="flex w-full gap-3 rounded-2xl bg-white p-3 text-left shadow-sm shadow-zinc-950/5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-zinc-950/10"
            :class="selectedUserId === conversation.user.id ? 'ring-2 ring-emerald-200 shadow-emerald-950/10' : ''"
            @click="selectConversation(conversation.user.id)"
          >
            <img
              v-if="conversation.user.image"
              :src="conversation.user.image"
              alt=""
              class="size-10 shrink-0 rounded-lg object-cover ring-1 ring-[var(--admin-border)]"
            >
            <div
              v-else
              class="admin-avatar size-10 shrink-0 text-xs"
            >
              {{ getInitials(conversation.user.name || conversation.user.email) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate font-semibold text-[var(--admin-text)]">
                    {{ conversation.user.name || conversation.user.email }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-[var(--admin-text-muted)]">
                    {{ conversation.user.email }}
                  </p>
                </div>
                <span
              v-if="conversation.unreadCount"
                  class="grid min-w-6 place-items-center rounded-full bg-[var(--admin-accent)] px-2 py-0.5 text-xs font-semibold text-white"
                >
                  {{ conversation.unreadCount }}
                </span>
              </div>

              <p class="mt-2 line-clamp-2 text-sm text-[var(--admin-text-muted)]">
                {{ conversation.lastMessage?.message || "Диалог пока пуст" }}
              </p>
              <time
                v-if="conversation.lastMessage"
                class="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--admin-text-muted)]"
              >
                <span>{{ formatDate(conversation.lastMessage.createdAt) }}</span>
                <span>{{ conversation.totalMessages }} сообщ.</span>
              </time>
            </div>
          </button>

          <AdminEmptyState
            v-if="!filteredConversations.length && !conversationsPending"
            title="Диалоги не найдены"
            description="Проверьте поиск или список пользователей."
          >
            <template #icon>
              <MessageSquare class="size-6" />
            </template>
          </AdminEmptyState>
        </div>
      </UCard>

      <UCard
        class="admin-list-card"
        :ui="{ body: 'flex h-full min-h-[680px] flex-col p-0' }"
      >
        <template v-if="selectedUser">
          <header class="border-b border-[var(--admin-border)] bg-white p-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <div class="admin-avatar size-11 shrink-0 text-sm">
                  {{ getInitials(selectedUser.name || selectedUser.email) }}
                </div>
                <div class="min-w-0">
                  <p class="truncate text-lg font-semibold text-[var(--admin-text)]">
                    {{ selectedUser.name || selectedUser.email }}
                  </p>
                  <p class="truncate text-sm text-[var(--admin-text-muted)]">
                    {{ selectedUser.email }} · {{ messages.length }} сообщений
                  </p>
                </div>
              </div>

              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-refresh-cw"
                class="rounded-full bg-white"
                :loading="threadPending"
                @click="loadThread(selectedUser.id)"
              >
                Обновить
              </UButton>
            </div>
          </header>

          <div
            ref="messagesContainer"
            class="admin-muted-scroll min-h-0 flex-1 overflow-y-auto bg-[#f9fafb] p-4"
          >
            <div
              v-if="threadPending"
              class="space-y-3"
            >
              <USkeleton
                v-for="item in 5"
                :key="item"
                class="h-20 rounded-lg"
              />
            </div>

            <div
              v-else
              v-auto-animate
              class="space-y-3"
            >
              <article
                v-for="message in messages"
                :key="message.id"
                class="flex"
                :class="message.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="max-w-[min(44rem,84%)] rounded-2xl px-4 py-3 shadow-sm"
                  :class="message.senderRole === 'ADMIN'
                    ? 'bg-[var(--admin-accent)] text-white shadow-green-950/10'
                    : 'bg-[var(--admin-surface)] text-[var(--admin-text)] ring-1 ring-[var(--admin-border)]'"
                >
                  <p
                    class="text-xs font-semibold"
                    :class="message.senderRole === 'ADMIN' ? 'text-white/70' : 'text-[var(--admin-text-muted)]'"
                  >
                    {{ getSenderLabel(message.senderRole) }}
                  </p>
                  <p class="mt-1 whitespace-pre-line text-sm leading-6">
                    {{ message.message }}
                  </p>
                  <time
                    class="mt-2 block text-xs"
                    :class="message.senderRole === 'ADMIN' ? 'text-white/65' : 'text-[var(--admin-text-muted)]'"
                  >
                    {{ formatDate(message.createdAt) }}
                  </time>
                </div>
              </article>

              <AdminEmptyState
                v-if="!messages.length"
                title="Диалог пуст"
                description="Напишите первое сообщение пользователю."
              >
                <template #icon>
                  <MessageSquare class="size-6" />
                </template>
              </AdminEmptyState>
            </div>
          </div>

          <form
            class="border-t border-zinc-100 bg-white p-4"
            @submit.prevent="sendMessage"
          >
            <UFormField :error="messageError">
              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div class="rounded-2xl bg-[#f9fafb] p-1.5 shadow-inner shadow-zinc-950/5">
                  <UTextarea
                    v-model="draftMessage"
                    class="w-full"
                    :disabled="submitting"
                    :rows="3"
                    variant="none"
                    :ui="adminTextareaUi"
                    placeholder="Сообщение пользователю"
                    @keydown.enter.exact.prevent="sendMessage"
                  />
                </div>
                <UButton
                  color="primary"
                  icon="i-lucide-send"
                  size="lg"
                  type="submit"
                  class="min-h-12 justify-center rounded-full px-5 shadow-lg shadow-emerald-950/10"
                  :disabled="!draftMessage.trim()"
                  :loading="submitting"
                >
                  Отправить
                </UButton>
              </div>
            </UFormField>
          </form>
        </template>

        <div
          v-else
          class="grid min-h-[680px] place-items-center p-6"
        >
          <AdminEmptyState
            title="Выберите диалог"
            description="Слева отображаются пользователи и последние сообщения."
          >
            <template #icon>
              <MessageSquare class="size-6" />
            </template>
          </AdminEmptyState>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BellDot, Inbox, MessageSquare, MessagesSquare } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatDate, formatNumber, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import type {
  AdminMessage,
  MessageConversation,
  MessageConversationListResponse,
  MessageSenderRole,
  MessageThreadResponse
} from "~~/app/shared/types/admin";

type MessageCreatedEvent = {
  message: AdminMessage;
  type: "message.created";
};

type MessageReadEvent = {
  messageIds: number[];
  type: "message.read";
  userId: string;
};

type RealtimeEvent = MessageCreatedEvent | MessageReadEvent | { type: "connection.ready" };

definePageMeta({
  layout: "admin"
});

const search = ref("");
const route = useRoute();
const selectedUserId = ref<string | null>(null);
const messages = ref<AdminMessage[]>([]);
const selectedThreadUser = ref<MessageThreadResponse["user"] | null>(null);
const threadPending = ref(false);
const draftMessage = ref("");
const submitting = ref(false);
const messageError = ref("");
const socketConnected = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
let socket: WebSocket | null = null;

const adminInputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700"
};
const adminTextareaUi = {
  base: "min-h-28 resize-y rounded-2xl bg-transparent text-sm leading-6 text-zinc-900"
};

const {
  data: conversationsData,
  pending: conversationsPending,
  error: conversationsError,
  refresh: refreshConversations
} = await useAsyncData(
  "admin-message-conversations",
  () => adminFetch<MessageConversationListResponse>("/api/admin/messages")
);

const conversations = computed(() => conversationsData.value?.conversations ?? []);
const unreadConversationsCount = computed(() => conversations.value.filter((conversation) => conversation.unreadCount > 0).length);
const unreadMessagesCount = computed(() =>
  conversations.value.reduce((total, conversation) => total + conversation.unreadCount, 0)
);
const filteredConversations = computed(() => {
  const query = search.value.trim().toLowerCase();

  if (!query) {
    return conversations.value;
  }

  return conversations.value.filter((conversation) => [
    conversation.user.name,
    conversation.user.email,
    conversation.lastMessage?.message
  ].some((value) => value?.toLowerCase().includes(query)));
});
const selectedConversation = computed<MessageConversation | null>(() =>
  conversations.value.find((conversation) => conversation.user.id === selectedUserId.value) ?? null
);
const selectedUser = computed(() => selectedConversation.value?.user ?? selectedThreadUser.value);
const requestedUserId = computed(() => {
  const value = route.query.userId;

  return typeof value === "string" && value.trim() ? value : null;
});

onMounted(async () => {
  const initialUserId = requestedUserId.value ?? conversations.value[0]?.user.id ?? null;

  if (initialUserId) {
    await selectConversation(initialUserId);
  }

  connectSocket();
});

onBeforeUnmount(() => {
  socket?.close();
  socket = null;
});

watch(conversations, async (next) => {
  const nextUserId = requestedUserId.value ?? next[0]?.user.id ?? null;

  if (!selectedUserId.value && nextUserId) {
    await selectConversation(nextUserId);
  }
});

watch(requestedUserId, async (userId) => {
  if (userId && userId !== selectedUserId.value) {
    await selectConversation(userId);
  }
});

async function selectConversation(userId: string) {
  selectedUserId.value = userId;
  await loadThread(userId);
}

async function loadThread(userId: string) {
  threadPending.value = true;

  try {
    const response = await adminFetch<MessageThreadResponse>(`/api/admin/messages/${userId}`);
    messages.value = response.messages;
    selectedThreadUser.value = response.user;
    await refreshConversations();
    await scrollToBottom();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить диалог"));
  } finally {
    threadPending.value = false;
  }
}

async function sendMessage() {
  messageError.value = "";
  const text = draftMessage.value.trim();
  const userId = selectedUserId.value;

  if (!userId) {
    messageError.value = "Выберите пользователя";
    return;
  }

  if (!text) {
    messageError.value = "Введите сообщение";
    return;
  }

  submitting.value = true;

  try {
    const response = await adminFetch<{ message: AdminMessage }>(`/api/admin/messages/${userId}`, {
      method: "POST",
      body: {
        message: text
      }
    });

    upsertMessage(response.message);
    draftMessage.value = "";
    await refreshConversations();
    await scrollToBottom();
  } catch (error) {
    messageError.value = getErrorMessage(error, "Не удалось отправить сообщение");
    toast.error(messageError.value);
  } finally {
    submitting.value = false;
  }
}

function connectSocket() {
  if (!import.meta.client || socket) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${window.location.host}/api/messages/ws`);

  socket.addEventListener("open", () => {
    socketConnected.value = true;
  });

  socket.addEventListener("close", () => {
    socketConnected.value = false;
    socket = null;
  });

  socket.addEventListener("message", async (event) => {
    const payload = parseRealtimeEvent(event.data);

    if (!payload) {
      return;
    }

    if (payload.type === "message.created") {
      if (payload.message.userId === selectedUserId.value) {
        upsertMessage(payload.message);
        await scrollToBottom();
      }

      await refreshConversations();
    }

    if (payload.type === "message.read") {
      markMessagesRead(payload.messageIds);
      await refreshConversations();
    }
  });
}

function parseRealtimeEvent(data: unknown): RealtimeEvent | null {
  if (typeof data !== "string") {
    return null;
  }

  try {
    return JSON.parse(data) as RealtimeEvent;
  } catch {
    return null;
  }
}

function upsertMessage(message: AdminMessage) {
  const index = messages.value.findIndex((item) => item.id === message.id);

  if (index >= 0) {
    messages.value[index] = message;
  } else {
    messages.value.push(message);
  }

  messages.value.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

function markMessagesRead(messageIds: number[]) {
  const readAt = new Date().toISOString();
  const messageIdSet = new Set(messageIds);

  messages.value = messages.value.map((message) => (
    messageIdSet.has(message.id)
      ? { ...message, readAt }
      : message
  ));
}

function getSenderLabel(senderRole: MessageSenderRole) {
  if (senderRole === "ADMIN") {
    return "Администратор";
  }

  if (senderRole === "USER") {
    return "Пользователь";
  }

  return "Уведомление";
}

function getInitials(value: string) {
  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function scrollToBottom() {
  await nextTick();
  const element = messagesContainer.value;

  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}
</script>
