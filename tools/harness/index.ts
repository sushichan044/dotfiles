import type { GoProject } from "./go";
import type { JavaScriptProject } from "./javascript";

import { openGoProject } from "./go";
import { openJavaScriptProject } from "./javascript";

type Projects = {
  go?: GoProject;
  javascript?: JavaScriptProject;
};

export async function openProject(root: string): Promise<Projects> {
  const project: Projects = {};

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
