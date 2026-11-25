#!/usr/bin/env node
// Creates a complete, working project in one step: config, theme, layout, router,
// components, API code, checks, newest packages for the installed Node.
//
//   node create.mjs <folder> [options]
//
//   --title "My app"       name in the sidebar and browser tab
//   --color "#2563eb"      main color; its other shades are calculated
//   --dark                 light and dark theme
//   --layout sidebar       sidebar (default) or navbar
//   --blocks a,b           from frontend-blocks, e.g. dashboard,auth-pages
//   --locale en-IN --currency INR --country IN
//   --no-api               without API client, login state and TanStack Query
//   --no-install           only write files

import { execSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const fail = (message) => {
  console.error(message);
  process.exit(1);
};
let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      title: { type: 'string' },
      color: { type: 'string', default: '#2563eb' },
      dark: { type: 'boolean', default: false },
      layout: { type: 'string', default: 'sidebar' },
      blocks: { type: 'string', default: '' },
      locale: { type: 'string', default: 'en-US' },
      currency: { type: 'string', default: 'USD' },
      country: { type: 'string', default: 'US' },
      'no-api': { type: 'boolean', default: false },
      'no-install': { type: 'boolean', default: false },
    },
  });
} catch (error) {
  fail(`${error.message}\nSee the first lines of create.mjs for the options.`);
}
const { values: opt, positionals } = parsed;
const core = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sibling = (name) => path.resolve(core, '..', name);
const folder = positionals[0];
if (!folder) fail('Usage: node create.mjs <folder> [--title "My app"] [--color "#2563eb"] [--dark] [--blocks dashboard,auth-pages]');
const project = path.resolve(folder);
if (existsSync(project) && readdirSync(project).some((f) => f !== '.git')) fail(`${project} is not empty. Use add-to-project.mjs for an existing project.`);
if (!/^#[\da-f]{6}$/i.test(opt.color)) fail('--color must look like #2563eb');
if (!['sidebar', 'navbar'].includes(opt.layout)) fail('--layout is sidebar or navbar');

const withApi = !opt['no-api'];
const blocks = opt.blocks.split(',').map((b) => b.trim()).filter(Boolean);
if (opt.dark && !blocks.includes('dark-mode')) blocks.push('dark-mode');
const need = ['frontend-performance', ...(withApi ? ['frontend-api'] : []), ...(blocks.length ? ['frontend-blocks'] : [])];
const absent = need.filter((n) => !existsSync(sibling(n)));
if (absent.length) fail(`Missing next to frontend-core: ${absent.join(', ')}. Install all skills.`);
const name = path.basename(project).toLowerCase().replace(/[^a-z\d-]+/g, '-').replace(/^-+|-+$/g, '') || 'app';
const title = opt.title ?? name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

const write = (file, text) => {
  const full = path.join(project, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, `${text.replace(/^\n/, '').trimEnd()}\n`);
};
const edit = (file, ...pairs) => {
  const full = path.join(project, file);
  let text = readFileSync(full, 'utf8').replaceAll('\r\n', '\n');
  for (const [from, to] of pairs) {
    if (!(typeof from === 'string' ? text.includes(from) : from.test(text))) fail(`Internal: ${file} changed, "${from}" not found`);
    text = text.replace(from, () => to);
  }
  writeFileSync(full, text);
};
const run = (file, ...args) => {
  const result = spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', cwd: project });
  if (result.status !== 0) fail(`${path.basename(file)} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
};

// ---- Finished code
mkdirSync(project, { recursive: true });
run(path.join(core, 'scripts/add-to-project.mjs'), project, '--components');
if (withApi) run(path.join(sibling('frontend-api'), 'scripts/add-to-project.mjs'), project);
run(path.join(sibling('frontend-performance'), 'scripts/add-to-project.mjs'), project);
if (blocks.length) run(path.join(sibling('frontend-blocks'), 'scripts/add.mjs'), project, ...blocks);
copyFileSync(path.join(core, 'assets/template/eslint.config.js'), path.join(project, 'eslint.config.js'));
const has = (file) => existsSync(path.join(project, 'src', file));
const withAuthPages = withApi && has('features/auth/pages/LoginPage.tsx');
const withAccount = has('features/account/pages/ProfilePage.tsx');
const withDashboard = has('features/dashboard/pages/DashboardPage.tsx');
const withDark = has('hooks/useTheme.ts');
const withBell = has('features/notifications/components/NotificationBell.tsx');
const withI18n = has('lib/i18n.ts');
const withCharts = has('styles/charts.css');

// ---- Config files
write('package.json', JSON.stringify({
  name, private: true, version: '0.1.0', type: 'module',
  scripts: {
    dev: 'vite', build: 'tsc --noEmit && vite build', preview: 'vite preview', typecheck: 'tsc --noEmit', lint: 'eslint .',
    test: 'vitest run', format: 'prettier --write src', verify: 'node scripts/verify.mjs', size: 'node scripts/performance/check-size.mjs',
    measure: 'node scripts/performance/measure.mjs', index: 'node scripts/index-components.mjs',
  },
}, null, 2));
write('tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: 'ES2023', lib: ['ES2023', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx',
    strict: true, noUncheckedIndexedAccess: true, noUnusedLocals: true, noUnusedParameters: true, noFallthroughCasesInSwitch: true,
    verbatimModuleSyntax: true, isolatedModules: true, resolveJsonModule: true, skipLibCheck: true, noEmit: true,
    types: ['vite/client', 'vitest/globals', '@testing-library/jest-dom'], paths: { '@/*': ['./src/*'] },
  },
  include: ['src'],
}, null, 2));
write('vite.config.ts', `
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { performanceBuild } from './vite.performance.ts';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: performanceBuild,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    testTimeout: 30_000,${withApi ? "\n    env: { VITE_API_URL: 'http://localhost/api' }," : ''}
  },
});
`);
write('.prettierrc', JSON.stringify({ singleQuote: true, printWidth: 120, plugins: ['prettier-plugin-tailwindcss'] }, null, 2));
write('.gitignore', 'node_modules\ndist\ncoverage\n*.log\n.DS_Store\n.env\n.env.*\n!.env.example');
if (withApi) copyFileSync(path.join(project, '.env.example'), path.join(project, '.env'));
write('index.html', `
<!doctype html>
<html lang="${opt.locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <title>${title.replace(/[<&]/g, '')}</title>${withDark ? `
    <script>
      try {
        var t = localStorage.getItem('theme');
        var dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      } catch (e) { /* stays light */ }
    </script>` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);
write('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${opt.color}"/><text x="16" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#fff">${(/[\p{L}\d]/u.exec(title)?.[0] ?? 'A').toUpperCase()}</text></svg>`);

// ---- Main color and its shades
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, part) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * part));
const light = (h) => rgb(h).map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(light(a), light(b)) + 0.05) / (Math.min(light(a), light(b)) + 0.05);
let primary = opt.color.toLowerCase();
const notes = [];
// Links and buttons must stay readable on every surface, so a light color gets darker.
while (Math.min(contrast(primary, '#ffffff'), contrast(primary, '#f1f5f9')) < 4.5) primary = mix(primary, '#000000', 0.06);
if (primary !== opt.color.toLowerCase()) notes.push(`color ${opt.color} is too light for text, so ${primary} is used`);
const theme = [['primary', primary], ['primary-hover', mix(primary, '#000000', 0.2)], ['primary-subtle', mix(primary, '#ffffff', 0.92)], ['on-primary', '#ffffff'], ['focus', primary]];
// A very pale background must still carry the main color as text.
while (contrast(primary, theme[2][1]) < 4.5) theme[2][1] = mix(theme[2][1], '#ffffff', 0.3);
edit('src/styles/theme.css', ...theme.map(([key, value]) => [new RegExp(`--color-${key}: #[\\da-f]{6};`, 'i'), `--color-${key}: ${value};`]));
if (withDark && primary !== '#2563eb') {
  let pale = primary;
  while (Math.min(...['#0f172a', '#1e293b', '#273449'].map((s) => contrast(pale, s))) < 4.6) pale = mix(pale, '#ffffff', 0.08);
  edit('src/styles/dark.css', [/--color-primary: #[\da-f]{6};/i, `--color-primary: ${pale};`], [/--color-primary-hover: #[\da-f]{6};/i, `--color-primary-hover: ${mix(pale, '#ffffff', 0.25)};`],
    [/--color-primary-subtle: #[\da-f]{6};/i, `--color-primary-subtle: ${mix('#1e293b', pale, 0.08)};`], [/--color-focus: #[\da-f]{6};/i, `--color-focus: ${mix(pale, '#ffffff', 0.25)};`]);
}
write('src/styles/index.css', `@import 'tailwindcss';\n@import './fonts.css';\n@import './theme.css';\n${withDark ? "@import './dark.css';\n" : ''}${withCharts ? "@import './charts.css';\n" : ''}@import './base.css';`);
edit('src/config/app.config.ts', ["name: 'My app'", `name: ${JSON.stringify(title).replace(/^"|"$/g, "'").replace(/\\"/g, '"')}`], ["locale: 'en-US'", `locale: '${opt.locale}'`], ["currency: 'USD'", `currency: '${opt.currency}'`], ["country: 'US'", `country: '${opt.country}'`]);

// ---- App
const routeOf = (key, module, page) => `{ path: ROUTES.${key}, lazy: async () => ({ Component: (await import('${module}')).${page} }) },`;
const routesText = readFileSync(path.join(project, 'src/config/routes.ts'), 'utf8').replaceAll('\r\n', '\n');
write('src/config/routes.ts', routesText.replace(/  users: \{[\s\S]*?\n  \},\n/, ''));
write('src/config/navigation.ts', `
import { ${['LayoutDashboard', ...(withAccount ? ['Settings'] : [])].join(', ')} } from 'lucide-react';
import type { NavGroup } from '@/components/layout/navigation';
import { ROUTES } from './routes';

// Sidebar, mobile menu and breadcrumbs read this.
export const APP_NAV: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Dashboard', to: ROUTES.home, icon: LayoutDashboard, exact: true },
      // features
    ],
  },${withAccount ? `
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', to: ROUTES.settings, icon: Settings }],
  },` : ''}
];
`);
if (!withDashboard) write('src/app/pages/HomePage.tsx', `
import { LayoutDashboard } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { EmptyState } from '@/components/shared/states';

export function HomePage() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" />
      <EmptyState icon={LayoutDashboard} title="Nothing here yet" description="Add the first feature to this page." />
    </PageContainer>
  );
}
`);
const shellNeedsUser = withAuthPages;
const right = [...(withI18n ? ['<LanguageMenu />'] : []), ...(withDark ? ['<ThemeMenu />'] : []), ...(withBell ? ['<NotificationBell />'] : [])];
const userMenu = `{user && (
              <UserMenu
                user={user}${withAccount ? "\n                items={[{ label: 'Profile', icon: User, onSelect: () => void navigate(ROUTES.profile) }]}" : ''}
                onSignOut={() => void signOut().catch(() => undefined)}
              />
            )}`;
const header = '<span className="truncate font-semibold">{appConfig.name}</span>';
const usesNavbarLayout = opt.layout === 'navbar';
write('src/app/layouts/AppShell.tsx', `
${shellNeedsUser && withAccount ? "import { User } from 'lucide-react';\n" : ''}${usesNavbarLayout ? "import { NavLink, Outlet" + (shellNeedsUser && withAccount ? ', useNavigate' : '') + " } from 'react-router';\n" : shellNeedsUser && withAccount ? "import { useNavigate } from 'react-router';\n" : ''}${usesNavbarLayout ? `import { Navbar${shellNeedsUser ? ', UserMenu' : ''} } from '@/components/layout/navbar';
import { SidebarProvider } from '@/components/layout/sidebar';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { OfflineBanner } from '@/components/shared/states';
import { cn } from '@/lib/cn';
` : `import { AppLayout } from './AppLayout';
${shellNeedsUser ? "import { UserMenu } from '@/components/layout/navbar';\n" : ''}`}${withI18n ? "import { LanguageMenu } from '@/components/shared/language';\n" : ''}${withDark ? "import { ThemeMenu } from '@/components/shared/theme';\n" : ''}import { appConfig } from '@/config/app.config';
import { APP_NAV } from '@/config/navigation';
${shellNeedsUser && withAccount ? "import { ROUTES } from '@/config/routes';\n" : ''}${shellNeedsUser ? "import { useAuth, usePermission } from '@/features/auth';\nimport type { Permission } from '@/config/permissions';\n" : ''}${withBell ? "import { NotificationBell } from '@/features/notifications/components/NotificationBell';\n" : ''}${usesNavbarLayout ? "import { uiText } from '@/constants/ui-text';\n" : ''}
/** The frame around every page: menu, navbar, account. */
export function AppShell() {
${shellNeedsUser ? '  const { user, signOut } = useAuth();\n  const { can } = usePermission();\n' : ''}${shellNeedsUser && withAccount ? '  const navigate = useNavigate();\n' : ''}${usesNavbarLayout ? `  const items = APP_NAV.flatMap((g) => g.items).filter((i) => i.to${shellNeedsUser ? ' && (!i.permission || can(i.permission as Permission))' : ''});
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh flex-col">
        <OfflineBanner />
        <Navbar
          left={${header}}
          center={
            <nav aria-label={uiText.mainMenu} className="flex gap-1 overflow-x-auto">
              {items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to ?? '/'}
                  end={!!item.exact}
                  className={({ isActive }) => cn('flex min-h-control items-center rounded-md px-3 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-focus', isActive ? 'bg-primary-subtle font-medium text-primary' : 'hover:bg-subtle')}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          }
          right={
            <>
              ${[...right, ...(shellNeedsUser ? [userMenu] : [])].join('\n              ') || 'null'}
            </>
          }
        />
        <main id="main-content" className="min-h-0 flex-1">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </SidebarProvider>
  );` : `  return (
    <AppLayout
      nav={APP_NAV}${shellNeedsUser ? '\n      can={(permission) => can(permission as Permission)}' : ''}
      header={${header}}${right.length || shellNeedsUser ? `
      navbar={{
        right: (
          <>
            ${[...right, ...(shellNeedsUser ? [userMenu] : [])].join('\n            ')}
          </>
        ),
      }}` : ''}
    />
  );`}
}
`);
const home = withDashboard ? routeOf('home', '@/features/dashboard/pages/DashboardPage', 'DashboardPage') : routeOf('home', '@/app/pages/HomePage', 'HomePage');
const inside = [
  home,
  ...(withAccount ? [routeOf('profile', '@/features/account/pages/ProfilePage', 'ProfilePage'), routeOf('settings', '@/features/account/pages/SettingsPage', 'SettingsPage')] : []),
  ...(withBell ? [routeOf('notifications', '@/features/notifications/pages/NotificationsPage', 'NotificationsPage')] : []),
  '// features',
  "...(import.meta.env.DEV ? [{ path: '/playground', lazy: async () => ({ Component: (await import('@/app/pages/ComponentsPlayground')).ComponentsPlayground }) }, { path: '/playground/fields', lazy: async () => ({ Component: (await import('@/app/pages/FieldsPlayground')).FieldsPlayground }) }] : []),",
  "{ path: '*', element: <NotFoundPage /> },",
].map((l) => `          ${l}`).join('\n');
const auth = [
  routeOf('login', '@/features/auth/pages/LoginPage', 'LoginPage'), routeOf('register', '@/features/auth/pages/RegisterPage', 'RegisterPage'),
  routeOf('verifyEmail', '@/features/auth/pages/VerifyEmailPage', 'VerifyEmailPage'), routeOf('forgotPassword', '@/features/auth/pages/ForgotPasswordPage', 'ForgotPasswordPage'),
  routeOf('resetPassword', '@/features/auth/pages/ResetPasswordPage', 'ResetPasswordPage'),
].map((l) => `          ${l}`).join('\n');
write('src/app/router/router.tsx', `
import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/app/layouts/AppShell';
${withAuthPages ? "import { AuthLayout } from '@/app/layouts/AuthLayout';\n" : ''}import { NotFoundPage } from '@/app/pages/StatusPages';
import { PageLoader } from '@/components/ui/loader';
import { ROUTES } from '@/config/routes';
${withAuthPages ? "import { GuestRoute, ProtectedRoute } from '@/features/auth';\n" : ''}
// Every page is loaded on demand. generate.mjs adds features above "features".
export const routes: RouteObject[] = [
  {
    HydrateFallback: PageLoader,
    children: [
${withAuthPages ? `      {
        element: <GuestRoute loader={<PageLoader />} />,
        children: [{ element: <AuthLayout />, children: [
${auth}
        ] }],
      },
      {
        element: <ProtectedRoute loader={<PageLoader />} loginPath={ROUTES.login} />,
        children: [{ element: <AppShell />, children: [
${inside}
        ] }],
      },` : `      {
        element: <AppShell />,
        children: [
${inside}
        ],
      },`}
    ],
  },
];

export const router = createBrowserRouter(routes);
`);
write('src/app/App.tsx', `
import { RouterProvider } from 'react-router';
import { AppProviders } from '@/app/providers/AppProviders';
import { router } from '@/app/router/router';
${withApi ? "import { QueryClientProvider } from '@tanstack/react-query';\n" : ''}${withAuthPages ? "import { AuthProvider } from '@/features/auth';\n" : ''}${withDark ? "import { useApplyTheme } from '@/hooks/useTheme';\n" : ''}${withApi ? "import { queryClient } from '@/lib/query-client';\n" : ''}
export function App() {
${withDark ? '  useApplyTheme();\n' : ''}  return (
${withApi ? '    <QueryClientProvider client={queryClient}>\n' : ''}${withAuthPages ? '      <AuthProvider>\n' : ''}        <AppProviders>
          <RouterProvider router={router} />
        </AppProviders>
${withAuthPages ? '      </AuthProvider>\n' : ''}${withApi ? '    </QueryClientProvider>\n' : ''}  );
}
`);
write('src/main.tsx', `
import '@fontsource-variable/inter';
import '@/styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
${withI18n ? "import { startI18n } from '@/lib/i18n';\n" : `import { App } from '@/app/App';
import { router, routes } from '@/app/router/router';
import { toast } from '@/components/ui/toast';
import { preloadOnIntent } from '@/lib/preload-routes';
import { recoverFromStaleDeploy } from '@/lib/stale-deploy';
`}
const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root');

${withI18n ? `// The language first, because constants read their texts while loading.
await startI18n();
const [{ App }, { router, routes }, { toast }, { preloadOnIntent }, { recoverFromStaleDeploy }] = await Promise.all([
  import('@/app/App'),
  import('@/app/router/router'),
  import('@/components/ui/toast'),
  import('@/lib/preload-routes'),
  import('@/lib/stale-deploy'),
]);
` : ''}preloadOnIntent(routes);
recoverFromStaleDeploy(router, () =>
  toast.info('A new version is available', { id: 'new-version', action: { label: 'Reload', onClick: () => location.reload() } }),
);
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`);
write('README.md', `# ${title}\n\n\`\`\`bash\nnpm run dev      # start\nnpm run verify   # every check, short output\nnpm run build\n\`\`\`\n\nComponents: \`/playground\` while developing. Rules for people and AI tools: \`AGENTS.md\`.`);
edit('AGENTS.md', ['{{PROJECT_NAME}}', title], ['{{ONE_LINE_PURPOSE}}\n\n', ''], ['{{LIGHT_OR_BOTH}}', withDark ? 'light and dark' : 'light only'], ['{{SIDEBAR_OR_NAVBAR}}', opt.layout], ['{{MODULES}}', 'add them here']);

// ---- Packages
if (!opt['no-install']) {
  const runtime = ['react', 'react-dom', 'react-router', 'react-hook-form', 'lucide-react', 'clsx', 'tailwind-merge', '@floating-ui/react', 'libphonenumber-js', 'country-region-data', '@tanstack/react-virtual', 'web-vitals', '@fontsource-variable/inter', ...(withApi ? ['@tanstack/react-query'] : [])];
  const dev = ['vite', '@vitejs/plugin-react', 'typescript', 'tailwindcss', '@tailwindcss/vite', '@types/node', '@types/react', '@types/react-dom', 'eslint', '@eslint/js', 'typescript-eslint', 'globals', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'eslint-plugin-jsx-a11y-x', 'eslint-config-prettier', 'prettier', 'prettier-plugin-tailwindcss', 'vitest', 'jsdom', '@testing-library/react', '@testing-library/dom', '@testing-library/jest-dom', '@testing-library/user-event'];
  const resolved = run(path.join(core, 'scripts/resolve-versions.mjs'), ...runtime, '-D', ...dev);
  for (const line of resolved.split('\n').filter((l) => l.includes('(latest'))) notes.push(line.replace(/\s+/g, ' ').trim());
  for (const command of resolved.split('\n').filter((l) => l.startsWith('npm install'))) {
    try {
      execSync(`${command} --no-audit --no-fund --loglevel=error`, { cwd: project, stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' });
    } catch (error) {
      fail(`Install failed: ${command}\n${String(error.stderr).slice(0, 1500)}`);
    }
  }
}
run(path.join(core, 'scripts/index-components.mjs'), project);

console.log(`Created ${project}`);
console.log(`  ${opt.layout}, ${withDark ? 'light and dark' : 'light'}, ${primary}${withApi ? ', API code' : ''}${blocks.length ? `, blocks: ${blocks.join(', ')}` : ''}`);
for (const note of notes.slice(0, 12)) console.log(`  note: ${note}`);
console.log(opt['no-install'] ? 'Next: install packages (scripts/resolve-versions.mjs)' : 'Next: npm run verify, then npm run dev');
if (withApi) console.log('Set VITE_API_URL in .env and check each *.service.ts against the real server.');
