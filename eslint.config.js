import ts from "@virtual-live-lab/eslint-config/presets/ts";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(ts, globalIgnores([".agent/skills/vercel-react-best-practices/**"]));
