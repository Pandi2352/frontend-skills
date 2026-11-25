import type { BuildOptions } from 'vite';

/** Use in vite.config.ts: `build: performanceBuild`. */
export const performanceBuild: BuildOptions = {
  // Read by scripts/performance/check-size.mjs.
  manifest: true,
  rolldownOptions: {
    output: {
      codeSplitting: {
        groups: [
          // Changes rarely, so visitors keep it cached between releases.
          { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
        ],
      },
    },
  },
};
