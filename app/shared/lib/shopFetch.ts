type ShopFetchOptions = Omit<NonNullable<Parameters<typeof $fetch>[1]>, "headers"> & {
  headers?: Record<string, string>;
};

export function shopFetch<T>(request: string, options: ShopFetchOptions = {}) {
  return $fetch<T>(request, {
    credentials: "include",
    ...options,
    headers: {
      ...(import.meta.server ? useRequestHeaders(["cookie"]) : {}),
      ...(options.headers ?? {})
    }
  });
}
