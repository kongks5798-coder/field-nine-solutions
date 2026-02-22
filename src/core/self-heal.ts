export async function measureSelfHeal(
  _name: string,
  _method: string,
  fn: () => Promise<unknown>
): Promise<{ result: unknown; cache: string }> {
  try {
    const result = await fn();
    return { result, cache: "no-cache" };
  } catch {
    return { result: null, cache: "no-cache" };
  }
}
