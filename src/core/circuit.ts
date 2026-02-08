type State = "closed" | "open" | "half";

export class CircuitBreaker {
  private state: State = "closed";
  private failures = 0;
  private lastOpened = 0;
  constructor(
    private readonly failureThreshold = 5,
    private readonly cooldownMs = 60000,
    private readonly halfOpenAfterMs = 30000
  ) {}
  private now() {
    return Date.now();
  }
  private canAttempt() {
    if (this.state === "open") {
      const since = this.now() - this.lastOpened;
      if (since > this.halfOpenAfterMs) {
        this.state = "half";
        return true;
      }
      return false;
    }
    return true;
  }
  private recordSuccess() {
    this.failures = 0;
    this.state = "closed";
  }
  private recordFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = "open";
      this.lastOpened = this.now();
      setTimeout(() => {
        if (this.state === "open") {
          this.state = "half";
        }
      }, this.cooldownMs).unref?.();
    }
  }
  async exec<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (!this.canAttempt()) {
      if (fallback) return fallback();
      throw new Error("Circuit open");
    }
    try {
      const res = await fn();
      this.recordSuccess();
      return res;
    } catch (e) {
      this.recordFailure();
      if (fallback) return fallback();
      throw e;
    }
  }
}

const openAIBreaker = new CircuitBreaker(
  Number(process.env.CB_FAIL_THRESHOLD || 5),
  Number(process.env.CB_COOLDOWN_MS || 60000),
  Number(process.env.CB_HALFOPEN_MS || 30000)
);

export async function fetchOpenAI(url: string, init: RequestInit, fallback?: () => Promise<Response>) {
  return openAIBreaker.exec(() => fetch(url, init), fallback);
}
