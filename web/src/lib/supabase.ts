// -----------------------------------------------------------------------------
// Legacy shim kept so the unmodified dashboard pages still compile in this
// intermediate commit. Commit 2 removes every `supabase.from(...)` call, deletes
// @supabase/supabase-js, and replaces this module with `src/lib/api.ts`.
//
// The original template shipped a *hardcoded* Supabase project key in this file.
// It has been removed — we never want credentials checked into source. See the
// PR description for the incident note.
// -----------------------------------------------------------------------------

type Chain = {
  select: (..._a: any[]) => Chain;
  insert: (..._a: any[]) => Chain;
  update: (..._a: any[]) => Chain;
  delete: (..._a: any[]) => Chain;
  eq: (..._a: any[]) => Chain;
  order: (..._a: any[]) => Chain;
  maybeSingle: () => Promise<{ data: null; error: Error }>;
  single: () => Promise<{ data: null; error: Error }>;
  then: <T>(onfulfilled?: (v: { data: never[]; error: null }) => T) => Promise<T>;
};

function notWired(): Error {
  return new Error(
    'supabase client removed in the Express-backend migration — use src/lib/api.ts'
  );
}

function chain(): Chain {
  const self: any = {};
  for (const k of ['select', 'insert', 'update', 'delete', 'eq', 'order']) self[k] = () => self;
  self.maybeSingle = async () => ({ data: null, error: notWired() });
  self.single = async () => ({ data: null, error: notWired() });
  self.then = (onfulfilled?: any) =>
    Promise.resolve({ data: [] as never[], error: null }).then(onfulfilled);
  return self as Chain;
}

export const supabase = {
  from: (_table: string) => chain(),
  functions: {
    invoke: async (_fn: string, _opts?: any) => ({ data: null, error: notWired() })
  }
};
