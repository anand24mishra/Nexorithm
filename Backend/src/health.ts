export async function probeDependency(
  name: string,
  check: () => Promise<unknown>,
  budgetMs = 2000,
): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), budgetMs);
      }),
    ]);
    return null;
  } catch {
    return name;
  } finally {
    clearTimeout(timer);
  }
}

export async function assessReadiness(input: {
  closing: boolean;
  mongo: () => Promise<unknown>;
  redis: () => Promise<unknown>;
}): Promise<
  { status: "ready" } | { status: "unavailable"; dependencies: string[] }
> {
  if (input.closing)
    return { status: "unavailable", dependencies: ["process"] };
  const failed = (
    await Promise.all([
      probeDependency("mongodb", input.mongo),
      probeDependency("redis", input.redis),
    ])
  ).filter((name): name is string => Boolean(name));
  if (failed.length) return { status: "unavailable", dependencies: failed };
  return { status: "ready" };
}
