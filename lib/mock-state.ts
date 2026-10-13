// Server-side preview state. Recreated whenever the server process starts.
type MockState = {
  users: Map<string, Record<string, unknown>>;
  sessions: Map<string, { userId: string; expiresAt: number }>;
  profiles: Map<string, Record<string, unknown>>;
  presence: Map<string, boolean>;
  coachAccess: Map<string, "own" | "demo" | "admin">;
  employeeCoaches: Map<string, { userId: string; slug: string; profile: unknown; published: boolean }>;
  coachPublication: Map<string, boolean>;
  coachProfiles: Map<string, unknown>;
  coachRiotAccounts: Map<string, unknown>;
  coachRiotProfiles: Map<string, unknown>;
  riotHistory: Map<string, unknown>;
  championStats: Map<string, unknown>;
  requests: Map<string, unknown>;
  messages: Map<string, unknown[]>;
  messageReads: Map<string, number>;
  orderDetails: Map<string, { customerId: string; submissionId: string; orderNumber: string; encrypted: string }>;
};

const state = globalThis as typeof globalThis & { ascendMockState?: MockState };
export const mockState: MockState = state.ascendMockState ??= {
  users: new Map(), sessions: new Map(), profiles: new Map(), presence: new Map(),
  coachAccess: new Map(), employeeCoaches: new Map(), coachPublication: new Map(),
  coachProfiles: new Map(), coachRiotAccounts: new Map(), coachRiotProfiles: new Map(),
  riotHistory: new Map(), championStats: new Map(), requests: new Map(),
  messages: new Map(), messageReads: new Map(), orderDetails: new Map(),
};
