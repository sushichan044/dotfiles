#!/usr/bin/env bun

import { openProject } from "../../tools/harness";

const proj = await openProject(process.cwd());

const setupJS = async () => {
  if (!proj.javascript) {
    return;
  }
  console.log("Running setup for JavaScript stack...");
  await proj.javascript.packageManager.installDependencies();
  console.log("Setup completed.");
};

const setupGo = async () => {
  if (!proj.go) {
    return;
  }
  console.log("Running setup for Go stack...");
  await proj.go.packageManager.installDependencies();
  console.log("Setup completed.");
};

await Promise.all([setupJS(), setupGo()]);
