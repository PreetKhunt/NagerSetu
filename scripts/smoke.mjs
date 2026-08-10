/**
 * Runner for the route smoke test.
 *
 * Boots a Vite dev server in middleware mode purely to reuse its SSR module
 * loader — that gives us JSX transforms and CSS-import stubbing for free, so
 * the real App component tree can be rendered under Node.
 *
 * Usage: npm run smoke
 */
import { createServer } from "vite";

// Minimal browser shims: renderToString does not run effects, so only APIs
// touched during render need to exist (localStorage, read by AuthProvider).
const store = new Map();
globalThis.localStorage ??= {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "warn",
});

try {
  const { run } = await vite.ssrLoadModule("/scripts/smokeRoutes.jsx");
  process.exitCode = (await run()) ? 1 : 0;
} catch (error) {
  console.error("Smoke test could not start:\n", error);
  process.exitCode = 1;
} finally {
  await vite.close();
}
