import { visit } from "unist-util-visit";

/**
 * Normalize Obsidian callout types to uppercase.
 * remarkGithubAdmonitionsToDirectives handles the rest.
 *
 * Note: Fuwari's admonition component only supports default titles.
 * Custom titles (e.g. > [!NOTE] Title) are not yet supported.
 */
export function remarkObsidianCallout() {
  return (tree) => {
    visit(tree, "blockquote", (node) => {
      const fp = node.children?.[0];
      if (fp?.type !== "paragraph") return;
      const fc = fp.children?.[0];
      if (fc?.type !== "text") return;

      // Uppercase the type: [!note] → [!NOTE]
      fc.value = fc.value.replace(/^\[!(\w+)\]([\s\S]*)/, (_, type, rest) =>
        `[!${type.toUpperCase()}]${rest}`
      );
    });
  };
}
