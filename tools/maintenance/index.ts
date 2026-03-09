import type { JavaScriptProject } from "./javascript";

import { type GoProject, openGoProject } from "./go";
import { openJavaScriptProject } from "./javascript";

type Project = {
  go?: GoProject;
  javascript?: JavaScriptProject;
};

export async function openProject(root: string): Promise<Project> {
  const project: Project = {};

  const [jsProject, goProject] = await Promise.all([
    openJavaScriptProject(root),
    openGoProject(root),
  ]);

  if (jsProject) {
    project.javascript = jsProject;
  }
  if (goProject) {
    project.go = goProject;
  }

  return project;
}
