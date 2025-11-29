#!/usr/bin/env -S bun run --silent

import type { Root } from "mdast";

import { fromMarkdown } from "mdast-util-from-markdown";
import { readFile, realpath, stat } from "node:fs/promises";
import { CONTINUE, visit } from "unist-util-visit";

type HeadingTreeNodeData = {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  line?: number;
  value: string;
};

type HeadingTreeNode = {
  children: HeadingTreeNode[];
  data: HeadingTreeNodeData;
};

type HeadingTree = {
  metadata: {
    filepath: string;
  };
  root: HeadingTreeNode;
};

const buildHeadingTree = (
  tree: Root,
  metadata: HeadingTree["metadata"],
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
      ...(node.position?.start.line !== undefined
        ? { line: node.position.start.line }
        : {}),
    });

    return CONTINUE;
  });

  const root: HeadingTreeNode = {
    children: [],
    data: {
      level: 0,
      value: "Root",
    },
  };
  const stack: HeadingTreeNode[] = [root];

  for (const heading of extractedHeadings) {
    const newNode: HeadingTreeNode = {
      children: [],
      data: heading,
    };

    // Get parent node based on heading level
    // Pop nodes from the stack until we find the right parent
    while (
      stack.length > 0 &&
      (stack.at(-1)?.data.level ?? -1) >= heading.level
    ) {
      stack.pop();
    }

    if (stack.length > 0) {
      // Parent found
      stack.at(-1)?.children.push(newNode);
    } else {
      // If no parent found, since it's a top-level heading, add it to the root
      root.children.push(newNode);
    }

    // Push the new node onto the stack
    stack.push(newNode);
  }

  return { metadata, root };
};

export const headingTreeOfMarkdownFile = async (
  markdownPath: string,
): Promise<HeadingTree> => {
  const resolvedPath = await realpath(markdownPath);

  if (!(await stat(resolvedPath)).isFile()) {
    throw new Error(`Error: ${markdownPath} is not a valid file.`);
  }

  const doc = await readFile(resolvedPath, "utf-8");
  const mdTree = fromMarkdown(doc);

  return buildHeadingTree(mdTree, { filepath: markdownPath });
};
