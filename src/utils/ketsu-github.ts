const GITHUB_API = "https://api.github.com";

export interface KetsuArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string | null;
  categories: string[];
  wordCount: number;
}

export interface KetsuArticle extends KetsuArticleMeta {
  content: string;
}

interface GitHubFile {
  name: string;
  type: string;
  download_url: string | null;
}

interface GitHubContent {
  content: string;
  encoding: string;
}

/**
 * Read env vars robustly across dev (Astro/Vite proxy) and prod (Vercel).
 *
 * In dev, Astro's Vite module runner wraps import.meta.env in a Proxy that
 * ONLY supports static access (import.meta.env.KEY) — dynamic access via
 * import.meta.env["KEY"] throws.  We use static top-level access here, then
 * fall back to process.env for Vercel production.
 */
const _KETSU_REPO = "KETSU_REPO" in import.meta.env ? import.meta.env.KETSU_REPO : undefined;
const _GITHUB_TOKEN = "GITHUB_TOKEN" in import.meta.env ? import.meta.env.GITHUB_TOKEN : undefined;

function env(key: string): string | undefined {
  if (key === "KETSU_REPO") return _KETSU_REPO ?? process.env.KETSU_REPO;
  if (key === "GITHUB_TOKEN") return _GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  return process.env[key];
}

function getRepo(): string {
  const repo = env("KETSU_REPO");
  if (!repo) throw new Error("KETSU_REPO env var is not set");
  return repo;
}

function getHeaders(): Record<string, string> {
  const token = env("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN env var is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "cloudac7-blog",
  };
}

/** Count words in text — CJK chars count individually, English words split by spaces. */
function countWords(text: string): number {
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
  const english = text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, " ")
    .split(/[\s,.;!?()\[\]{}]+/)
    .filter(Boolean).length;
  return cjk + english;
}

/** Parse a frontmatter value, handling quoted strings and inline arrays like [a, b]. */
function parseFmValue(raw: string): string | string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Parse YAML-style frontmatter into a key-value map, supporting multi-value arrays. */
function parseFrontmatter(raw: string): { meta: Record<string, string | string[]>; body: string } {
  const meta: Record<string, string | string[]> = {};
  let body = raw;

  if (raw.startsWith("---")) {
    const endIdx = raw.indexOf("---", 3);
    if (endIdx !== -1) {
      const fmBlock = raw.substring(3, endIdx).trim();
      body = raw.substring(endIdx + 3).trim();
      for (const line of fmBlock.split("\n")) {
        const sepIdx = line.indexOf(":");
        if (sepIdx !== -1) {
          const key = line.substring(0, sepIdx).trim();
          const val = line.substring(sepIdx + 1).trim();
          meta[key] = parseFmValue(val);
        }
      }
    }
  }

  return { meta, body };
}

/** Normalise a frontmatter field into string[], or empty array. */
function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : v ? [v] : [];
}

/** Normalise a frontmatter field into a single string, or empty string. */
function asString(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v[0] ?? "" : v;
}

/**
 * Build a KetsuArticleMeta from raw parsed frontmatter and body text.
 */
function buildMeta(slug: string, meta: Record<string, string | string[]>, body: string): KetsuArticleMeta {
  const tags = asArray(meta.tags);
  const categories = asArray(meta.categories).length > 0
    ? asArray(meta.categories)
    : asArray(meta.category);

  return {
    slug,
    title: asString(meta.title) || slug,
    description: asString(meta.description) || "",
    date: asString(meta.date) || "",
    tags,
    category: categories[0] || null,
    categories,
    wordCount: countWords(body),
  };
}

/**
 * Fetch list of markdown files from the configured private repo's posts/ dir.
 */
export async function fetchArticleList(): Promise<KetsuArticleMeta[]> {
  const repo = getRepo();
  const response = await fetch(`${GITHUB_API}/repos/${repo}/contents/posts`, { headers: getHeaders() });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const items: GitHubFile[] = await response.json();
  const mdFiles = items.filter((item) => item.type === "file" && item.name.endsWith(".md"));

  const articles: KetsuArticleMeta[] = [];

  for (const file of mdFiles) {
    const slug = file.name.replace(/\.md$/i, "");
    if (!file.download_url) continue;

    const contentResponse = await fetch(file.download_url, { headers: getHeaders() });
    if (contentResponse.ok) {
      const raw = await contentResponse.text();
      const { meta, body } = parseFrontmatter(raw);
      articles.push(buildMeta(slug, meta, body));
    }
  }

  // Sort by date descending; files without date go last
  articles.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return articles;
}

/**
 * Fetch a single article by slug (filename without .md).
 * Returns null if the file does not exist.
 */
export async function fetchArticle(slug: string): Promise<KetsuArticle | null> {
  const repo = getRepo();
  const response = await fetch(`${GITHUB_API}/repos/${repo}/contents/posts/${slug}.md`, {
    headers: getHeaders(),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data: GitHubContent = await response.json();
  const raw = Buffer.from(data.content, "base64").toString("utf-8");
  const { meta, body } = parseFrontmatter(raw);
  const metaFields = buildMeta(slug, meta, body);

  return {
    ...metaFields,
    content: body,
  };
}
