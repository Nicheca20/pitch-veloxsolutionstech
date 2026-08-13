// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// The dev devtools plugin injects `data-tsd-source` on every JSX element.
// react-three-fiber forwards unknown props onto three.js objects and throws on
// dashed prop paths, so strip the attribute from files that render 3D elements.
function stripSourceTagsFrom3D(): Plugin {
  return {
    name: "strip-tsd-source-in-r3f",
    enforce: "post",
    transform(code, id) {
      const file = id.split("?")[0] ?? "";
      if (!/src\/components\/pitch\/(Background3D|Scene)\.tsx$/.test(file)) return null;
      if (!code.includes("data-tsd-source")) return null;
      return { code: code.replace(/\s*data-tsd-source=(?:"[^"]*"|\{[^}]*\})/g, ""), map: null };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripSourceTagsFrom3D()],
  },
});
