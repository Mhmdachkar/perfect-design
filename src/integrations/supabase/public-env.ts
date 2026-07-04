export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

declare global {
  interface Window {
    __SUPABASE_ENV__?: SupabasePublicEnv;
  }
}

function readEnv(name: "url" | "publishableKey"): string | undefined {
  const viteKey =
    name === "url" ? import.meta.env.VITE_SUPABASE_URL : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const processKey =
    name === "url" ? process.env.SUPABASE_URL : process.env.SUPABASE_PUBLISHABLE_KEY;
  const runtimeKey =
    typeof window !== "undefined"
      ? name === "url"
        ? window.__SUPABASE_ENV__?.url
        : window.__SUPABASE_ENV__?.publishableKey
      : undefined;

  return runtimeKey || viteKey || processKey;
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = readEnv("url");
  const publishableKey = readEnv("publishableKey");

  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function getSupabasePublicEnvOrThrow(): SupabasePublicEnv {
  const env = getSupabasePublicEnv();
  if (env) return env;

  const missing = [
    ...(!readEnv("url") ? ["SUPABASE_URL"] : []),
    ...(!readEnv("publishableKey") ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
  ];
  const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
  console.error(`[Supabase] ${message}`);
  throw new Error(message);
}
