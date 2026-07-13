<script setup lang="ts">
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@vue-email/components";

defineProps<{
  appName: string;
  appUrl: string;
  verificationUrl: string;
  expiresInMinutes: number;
  userName: string;
  supportEmail?: string;
}>();

const previewText = "Подтвердите почту, чтобы завершить регистрацию в ProTech.";

type VueEmailTailwindConfig = NonNullable<InstanceType<typeof Tailwind>["$props"]["config"]>;

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        accent: "#19b394",
        button: "#147a6c",
        canvas: "#eef2f6",
        divider: "#e4e9f0",
        hero: "#123047",
        ink: "#1d2939",
        line: "#d7dee8",
        link: "#356178",
        muted: "#344054",
        note: "#667085",
        soft: "#f4f7fb",
        subtle: "#7a8797",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
      maxWidth: {
        email: "620px",
      },
    },
    fontSize: {
      xs: ["12px", { lineHeight: "18px" }],
      sm: ["14px", { lineHeight: "22px" }],
      base: ["16px", { lineHeight: "25px" }],
      lg: ["18px", { lineHeight: "28px" }],
      xl: ["20px", { lineHeight: "28px" }],
      "2xl": ["28px", { lineHeight: "36px" }],
    },
    spacing: {
      px: "1px",
      0: "0",
      1: "4px",
      2: "8px",
      3: "12px",
      "3.5": "14px",
      4: "16px",
      5: "20px",
      6: "24px",
      7: "28px",
      8: "32px",
      9: "36px",
      10: "40px",
      12: "48px",
    },
  },
} as unknown as VueEmailTailwindConfig;
</script>

<template>
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>{{ previewText }}</Preview>
    <Tailwind :config="tailwindConfig">
      <Body class="m-0 bg-canvas font-sans text-ink">
        <Container class="mx-auto w-full max-w-email px-4 py-7">
          <Section class="overflow-hidden rounded-lg border border-solid border-line bg-white">
            <Section class="bg-hero px-8 py-7">
              <Text class="m-0 inline-block rounded-md bg-accent px-3 py-2 text-xs font-bold text-white">
                {{ appName }}
              </Text>
              <Heading as="h1" class="m-0 mt-5 text-2xl font-bold text-white">
                Остался один шаг
              </Heading>
            </Section>

            <Section class="px-8 pb-7 pt-8">
              <Text class="m-0 mb-5 text-base text-muted">
                Здравствуйте, {{ userName }}!
              </Text>
              <Text class="m-0 mb-5 text-base text-muted">
                Подтвердите адрес электронной почты, чтобы завершить регистрацию и
                защитить аккаунт от случайного доступа.
              </Text>
              <Text class="m-0 text-sm text-note">
                Ссылка действует {{ expiresInMinutes }} минут.
              </Text>

              <Section class="pb-7 pt-2">
                <Button :href="verificationUrl" class="inline-block rounded-md bg-button px-5 py-3.5 text-base font-bold text-white no-underline">
                  Подтвердить почту
                </Button>
              </Section>

              <Text class="m-0 text-sm text-note">
                Если кнопка не открывается, скопируйте эту ссылку в браузер:
              </Text>
              <Text class="m-0 mt-4 break-all rounded-md border border-solid border-line bg-soft p-3.5 text-[13px] leading-5 text-link">
                {{ verificationUrl }}
              </Text>

              <Hr class="my-7 border-0 border-t border-solid border-divider" />

              <Text class="m-0 text-sm text-note">
                Если вы не регистрировались в {{ appName }}, просто проигнорируйте
                это письмо.
              </Text>
            </Section>

            <Section class="px-8 pb-7">
              <Text class="m-0 text-xs text-subtle">
                С уважением, команда
                <Link :href="appUrl" class="text-button no-underline">
                  {{ appName }}
                </Link>
              </Text>
              <Text v-if="supportEmail" class="m-0 text-xs text-subtle">
                Нужна помощь? Напишите на
                <Link :href="`mailto:${supportEmail}`" class="text-button no-underline">
                  {{ supportEmail }}
                </Link>
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
</template>
