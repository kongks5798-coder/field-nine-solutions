export async function measureSelfHeal(
  _name: string,
  _method: string,
  fn: () => Promise<any>
): Promise<{ result: any; cache: string }> {
  try {
    const result = await fn();
    return { result, cache: "no-cache" };
  } catch {
    return { result: null, cache: "no-cache" };
  }
}
