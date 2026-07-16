<template>
  <div class="space-y-8 2xl:space-y-10">
    <AdminPageHeader
      title="Сообщения"
      kicker="Support"
      description="Диалоги с пользователями, вопросы по заказам и оперативные ответы."
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="outline"
          :loading="conversationsPending"
          @click="refreshConversations()"
        >
          <RefreshCw class="size-4" />
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <UAlert
      v-if="conversationsError"
      color="error"
      variant="soft"
      title="Не удалось загрузить диалоги"
      :description="getErrorMessage(conversationsError)"
    />

    <div class="grid min-h-[720px] gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <UCard
        class="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)]"
        :ui="{ body: 'p-0' }"
      >
        <div class="border-b border-[var(--admin-border)] p-4">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Найти пользователя"
            size="lg"
          />
        </div>

        <div class="max-h-[650px] overflow-y-auto">
          <button
            v-for="conversation in filteredConversations"
            :key="conversation.user.id"
            type="button"
            class="flex w-full gap-3 border-b border-[var(--admin-border)] p-4 text-left transition hover:bg-[var(--admin-surface-muted)]"
            :class="selectedUserId === conversation.user.id ? 'bg-[var(--admin-accent-soft)]' : ''"
            @click="selectConversation(conversation.user.id)"
          >
            <div class="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--admin-surface-muted)] text-sm font-semibold text-[var(--admin-text)]">
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
                class="mt-2 block text-xs text-[var(--admin-text-muted)]"
              >
                {{ formatDate(conversation.lastMessage.createdAt) }}
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
        class="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)]"
        :ui="{ body: 'flex h-full min-h-[720px] flex-col p-0' }"
      >
        <template v-if="selectedUser">
          <header class="border-b border-[var(--admin-border)] p-5">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p class="text-xl font-semibold text-[var(--admin-text)]">
                  {{ selectedUser.name || selectedUser.email }}
                </p>
                <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
                  {{ selectedUser.email }} · {{ socketConnected ? "онлайн" : "история" }}
                </p>
              </div>

              <UButton
                color="neutral"
                variant="outline"
                :loading="threadPending"
                @click="loadThread(selectedUser.id)"
              >
                <RefreshCw class="size-4" />
                Обновить
              </UButton>
            </div>
          </header>

          <div
            ref="messagesContainer"
            class="min-h-0 flex-1 overflow-y-auto bg-[var(--admin-surface-muted)] p-5"
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
                  class="max-w-[min(44rem,82%)] rounded-lg px-4 py-3 shadow-sm"
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
            class="border-t border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
            @submit.prevent="sendMessage"
          >
            <UFormField :error="messageError">
              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <UTextarea
                  v-model="draftMessage"
                  :disabled="submitting"
                  :rows="2"
                  placeholder="Сообщение пользователю"
                  @keydown.enter.exact.prevent="sendMessage"
                />
                <UButton
                  color="primary"
                  icon="i-lucide-send"
                  size="lg"
                  type="submit"
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
          class="grid min-h-[720px] place-items-center p-6"
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
import { MessageSquare, RefreshCw } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatDate, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
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
const selectedUserId = ref<string | null>(null);
const messages = ref<AdminMessage[]>([]);
const threadPending = ref(false);
const draftMessage = ref("");
const submitting = ref(false);
const messageError = ref("");
const socketConnected = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
let socket: WebSocket | null = null;

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
const selectedUser = computed(() => selectedConversation.value?.user ?? null);

onMounted(async () => {
  if (!selectedUserId.value && conversations.value.length) {
    await selectConversation(conversations.value[0]!.user.id);
  }

  connectSocket();
});

onBeforeUnmount(() => {
  socket?.close();
  socket = null;
});

watch(conversations, async (next) => {
  if (!selectedUserId.value && next.length) {
    await selectConversation(next[0]!.user.id);
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
