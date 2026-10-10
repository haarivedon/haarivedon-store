import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  sourcemap: true,
  clean: true,
  // Workspace packages ship TypeScript source, so they must be bundled in.
  noExternal: [/^@repo\//],
  // Prisma's CJS runtime uses dynamic require — keep it out of the bundle.
  external: ["@prisma/client", ".prisma/client"],
});
