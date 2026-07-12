import z from "zod";

export const imagePathSchema = z
  .string("Ссылка на изображение необходима")
  .trim()
  .min(1, "Ссылка на изображение необходима")
  .max(1000, "Ссылка на изображение должна быть не более 1000 символов")
  .refine(
    (value) => {
      if (/^\/uploads\/[a-z0-9._-]+\.(?:jpe?g|png|webp|gif)$/i.test(value)) {
        return true;
      }

      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Некорректная ссылка на изображение" },
  );
