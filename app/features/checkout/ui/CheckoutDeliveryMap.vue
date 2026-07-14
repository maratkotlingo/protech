<template>
  <div class="overflow-hidden rounded-lg border border-[var(--shop-border)] bg-[var(--shop-surface)]">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--shop-border)] px-4 py-3">
      <div>
        <p class="font-semibold text-[var(--shop-text)]">Карта доставки</p>
        <p class="text-sm text-[var(--shop-text-muted)]">
          {{ statusText }}
        </p>
      </div>
      <UBadge
        :color="house ? 'primary' : 'neutral'"
        variant="soft"
      >
        {{ house ? "Дом отмечен" : "Уточняется" }}
      </UBadge>
    </div>

    <div class="relative aspect-[4/3] min-h-80 bg-[var(--shop-surface-muted)]">
      <iframe
        :src="mapSrc"
        class="absolute inset-0 size-full border-0"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="Карта адреса доставки"
      />
      <div
        v-if="pending"
        class="absolute inset-x-4 top-4 rounded-lg border border-[var(--shop-border)] bg-[var(--shop-surface)]/95 px-4 py-3 text-sm text-[var(--shop-text-muted)] shadow-lg backdrop-blur"
      >
        Ищу адрес на карте...
      </div>
      <div
        v-if="error"
        class="absolute inset-x-4 bottom-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";

const props = defineProps<{
  city: string;
  street: string;
  house: string;
}>();

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

const pending = ref(false);
const error = ref("");
const position = ref({
  lat: 55.751244,
  lon: 37.618423,
  label: "Москва"
});

const addressQuery = computed(() => [props.city, props.street, props.house]
  .map((part) => part.trim())
  .filter(Boolean)
  .join(", "));

const statusText = computed(() => {
  if (!props.city.trim()) return "Введите город, затем улицу и дом";
  if (!props.street.trim()) return "Город найден, добавьте улицу";
  if (!props.house.trim()) return "Улица найдена, добавьте номер дома";
  return position.value.label;
});

const geocodeAddress = useDebounceFn(async () => {
  if (!import.meta.client || !props.city.trim()) {
    return;
  }

  pending.value = true;
  error.value = "";

  try {
    const params = new URLSearchParams({
      format: "json",
      limit: "1",
      q: addressQuery.value
    });
    const result = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    const data = await result.json() as NominatimResult[];
    const first = data[0];

    if (!first) {
      error.value = "Не удалось найти адрес. Проверьте город, улицу и номер дома.";
      return;
    }

    position.value = {
      lat: Number(first.lat),
      lon: Number(first.lon),
      label: first.display_name
    };
  } catch {
    error.value = "Карта временно не смогла уточнить адрес.";
  } finally {
    pending.value = false;
  }
}, 700);

watch(addressQuery, () => {
  void geocodeAddress();
}, { immediate: true });

const mapSrc = computed(() => {
  const span = props.house.trim() ? 0.008 : props.street.trim() ? 0.035 : 0.18;
  const lat = position.value.lat;
  const lon = position.value.lon;
  const bbox = [
    lon - span,
    lat - span * 0.65,
    lon + span,
    lat + span * 0.65
  ].join(",");
  const marker = props.house.trim() ? `&marker=${lat},${lon}` : "";

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${marker}`;
});
</script>
