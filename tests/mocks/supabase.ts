import { vi } from "vitest";

export type SupabaseMockResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

export function createSupabaseChain(result: SupabaseMockResult = { data: null, error: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: undefined as unknown,
  };

  chain.then = (resolve: (value: SupabaseMockResult) => unknown) =>
    Promise.resolve(result).then(resolve);

  return chain;
}

export function createSupabaseMock(options: {
  fromResults?: Record<string, SupabaseMockResult>;
  rpcResults?: Record<string, SupabaseMockResult>;
} = {}) {
  const fromResults = options.fromResults ?? {};
  const rpcResults = options.rpcResults ?? {};

  return {
    from: vi.fn((table: string) => {
      const result = fromResults[table] ?? { data: [], error: null, count: 0 };
      return createSupabaseChain(result);
    }),
    rpc: vi.fn((fn: string) => {
      const result = rpcResults[fn] ?? { data: null, error: null };
      return Promise.resolve(result);
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "token" } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb?: (status: string) => void) => {
        cb?.("SUBSCRIBED");
        return { unsubscribe: vi.fn() };
      }),
      send: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    })),
    removeChannel: vi.fn(),
  };
}

export function mockSupabaseModule(supabaseMock: ReturnType<typeof createSupabaseMock>) {
  vi.mock("@/config/supabase", () => ({
    supabase: supabaseMock,
  }));
}
