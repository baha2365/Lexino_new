import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Virtual module "virtual:audio-manifest": scans public/audio/<folder>/<name>.<ext>
 * and exposes { "<folder>/<name>": "./audio/<folder>/<name>.<ext>" }.
 * Drop a recording in the right folder and it is picked up - no code or extension to configure.
 */
function audioManifest(): Plugin {
  const ID = 'virtual:audio-manifest';
  const RESOLVED = '\0' + ID;
  const root = path.resolve('public/audio');
  const EXT = /\.(mp3|wav|m4a|aac|ogg|oga|opus|webm)$/i;

  function scan(): Record<string, string> {
    const out: Record<string, string> = {};
    if (!fs.existsSync(root)) return out;
    for (const folder of fs.readdirSync(root, { withFileTypes: true })) {
      if (!folder.isDirectory()) continue;
      for (const file of fs.readdirSync(path.join(root, folder.name))) {
        if (!EXT.test(file)) continue;
        const key = `${folder.name}/${file.replace(EXT, '')}`.toLowerCase();
        out[key] = `./audio/${folder.name}/${file}`;
      }
    }
    return out;
  }

  return {
    name: 'lexino-audio-manifest',
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load: (id) => (id === RESOLVED ? `export default ${JSON.stringify(scan())};` : null),
    configureServer(server) {
      fs.mkdirSync(root, { recursive: true });
      server.watcher.add(root);
      const refresh = (file: string) => {
        if (!file.startsWith(root)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', refresh).on('unlink', refresh);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    audioManifest(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Lexino',
        short_name: 'Lexino',
        description: 'Speech games for little talkers',
        theme_color: '#ffc83d',
        background_color: '#c4e9ff',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/(audio|images)\//.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'lexino-media', expiration: { maxEntries: 800 } },
          },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
});
