#!/usr/bin/env -S deno run --allow-env --allow-read

import { CONTINUE, visit } from "https://esm.sh/unist-util-visit@5";

import { fromMarkdown } from "https://esm.sh/mdast-util-from-markdown@2";

import type { Root } from "https://esm.sh/@types/mdast@4.0.4/index.js";

type HeadingTreeNodeData = {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  value: string;
  line?: number;
};

type HeadingTreeNode = {
  data: HeadingTreeNodeData;
  children: HeadingTreeNode[];
};

type HeadingTree = {
  root: HeadingTreeNode;
  metadata: {
    filepath: string;
  };
};

const buildHeadingTree = (
  tree: Root,
  metadata: HeadingTree["metadata"]
): HeadingTree => {
  /**
   * sorted by appearance in the document
   */
  const extractedHeadings: HeadingTreeNodeData[] = [];
  visit(tree, "heading", (node) => {
    const text = node.children
      .filter((child) => child.type === "text")
      .map((child) => child.value)
      .join("");

    extractedHeadings.push({
      level: node.depth,
      value: text,
      line: node.position?.start.line,
    });

    return CONTINUE;
  });

  const root: HeadingTreeNode = {
    data: {
      level: 0,
      value: "Root",
    },
    children: [],
  };
  const stack: HeadingTreeNode[] = [root];

  for (const heading of extractedHeadings) {
    const newNode: HeadingTreeNode = {
      data: heading,
      children: [],
    };

    // Get parent node based on heading level
    // Pop nodes from the stack until we find the right parent
    while (stack.length > 0 && stack.at(-1)!.data.level >= heading.level) {
      stack.pop();
    }

    if (stack.length > 0) {
      // Parent found
      stack.at(-1)!.children.push(newNode);
    } else {
      // If no parent found, since it's a top-level heading, add it to the root
      root.children.push(newNode);
    }

    // Push the new node onto the stack
    stack.push(newNode);
  }

  return { root, metadata };
};

export const headingTreeOfMarkdownFile = async (
  markdownPath: string
): Promise<HeadingTree> => {
  const resolvedPath = await Deno.realPath(markdownPath);

  if (!(await Deno.stat(resolvedPath)).isFile) {
    throw new Error(`Error: ${markdownPath} is not a valid file.`);
  }

  const doc = await Deno.readTextFile(resolvedPath);
  const mdTree = fromMarkdown(doc);

  return buildHeadingTree(mdTree, { filepath: markdownPath });
};
