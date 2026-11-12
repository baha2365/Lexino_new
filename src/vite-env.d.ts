/// <reference types="vite/client" />

declare module 'virtual:audio-manifest' {
  /** key like "words/apple" -> url like "./audio/words/apple.mp3" */
  const manifest: Record<string, string>;
  export default manifest;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
