import ts from "@virtual-live-lab/eslint-config/presets/ts";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(ts, globalIgnores([".ai/skills/vercel-react-best-practices/**"]));
