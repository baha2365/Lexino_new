# Lexino

Home practice for children (2–7) with speech delays. Child games + a grown-up area (progress, diagnostic card, weekly plan, guides). Supports the speech therapist; does not replace them. English only (MVP).

## Run

```bash
npm i
npm run dev        # http://localhost:5173
npm run build      # production build in dist/ (installable PWA)
npm test           # unit tests
```

Works on phones and tablets (open the dev URL on the same Wi-Fi, or deploy `dist/` to any static host).

## Add your recordings and pictures

Drop files in `public/audio/<folder>/<name>.<mp3|wav|m4a|ogg>`. Name = card id. Missing audio is simply silent; nothing breaks.

| Folder | Names |
|---|---|
| `words/` | card id: `cat`, `dog`, `cow`, `t-shirt`, ... (see `CARDS` in `src/lib/content.ts`) |
| `sounds/` | animal / vehicle / toy sounds, by card id (`cow`, `car`, `drum`, ...) |
| `phonemes/` | vowels and syllables: `a`, `o`, `ma`, `pa`, ... (see `ECHO_LEVELS`) |
| `phrases/` | two-word phrases and sentences, by id |
| `aac/` | request cards: `want`, `drink`, `help`, ... (see `AAC_CORE`) |
| `prompts/` | `where-is`, `what-is-it`, `want-this`, `praise-1`, `praise-2`, `praise-3` |

Check what is still missing: `npm run audio:check`.

Your existing files: copy `item_game/audios/*` into `public/audio/words/` (rename `t-shirt.mp3` stays as is), memory-game sounds into `public/audio/sounds/`, and images into `public/images/`. Cards without a photo show an emoji placeholder; set the card's `image` field in `content.ts` to use a file from `public/images/`.

## Accounts & cloud (optional)

Without setup the app runs in **local mode** (data stays in the browser). To turn on accounts:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Create `.env`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Parent signs up, adds a child and gets an **invite code**; the logoped signs up as a logoped and links the child with that code. Logoped accounts never log play events.

Events are queued offline and synced idempotently.

## Privacy

- The microphone is **off by default** and only detects *that* the child made a sound. Nothing is recorded or stored; clarity is never judged.
- A grown-up rates each attempt with one tap (Said it / Tried / Not yet); that feeds progress.
- The grown-up area sits behind a 1.5 s press-and-hold lock.
- Check local personal-data rules (e.g. Kazakhstan) before a public launch.

## Not included yet

Russian/Kazakh, printable card PDFs, real-Supabase testing, audio-driven lip-sync (the mascot uses hand-authored mouth shapes scaled to audio length). Guide and diagnostic wording are a draft for the logoped to review.
