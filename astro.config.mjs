import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import netlify from '@astrojs/netlify';

// Netlify sets NETLIFY=true during builds; everywhere else (local dev, any Node host) uses the Node adapter.
const onNetlify = !!process.env.NETLIFY;

export default defineConfig({
  output: 'server',
  adapter: onNetlify ? netlify() : node({ mode: 'standalone' }),
  i18n: { locales: ['da', 'en'], defaultLocale: 'da', routing: 'manual' },
  prefetch: { defaultStrategy: 'hover' },
  security: { checkOrigin: true },
  // `process.env.NETLIFY` only exists at build time, not inside the deployed function, so bake the answer into the bundle.
  vite: { define: { __ON_NETLIFY__: JSON.stringify(onNetlify) } },
});
