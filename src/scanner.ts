import fg from "fast-glob";
import ignore from "ignore";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

import { TodoItem } from "./types/types.js";

const ALWAYS_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/*.min.js",
  "**/*.lock",
];

const TODO_REGEX =
  /(?:\/\/|#|--|%|;|\*)\s*(?:TODO|FIXME)(?:\(.*?\))?[:\s]+(.+)/i;

const TODO_TYPE_REGEX = /(?:TODO|FIXME)/i;

function getBlameInfo(filePath: string, line: number, cwd: string): { author?: string, age_days?: number } {
  try {
    const rel = path.relative(cwd, filePath);
    const output = execSync(`git blame -L ${line},${line} --porcelain "${rel}"`, { cwd, stdio: 'pipe' }).toString();
    const lines = output.split('\n');
    const authorLine = lines.find(l => l.startsWith('author '));
    const authorTimeLine = lines.find(l => l.startsWith('author-time '));
    
    let author: string | undefined;
    let age_days: number | undefined;

    if (authorLine && authorLine !== 'author Not Committed Yet') {
      author = authorLine.replace('author ', '').trim();
    }
    
    if (authorTimeLine) {
      const authorTime = parseInt(authorTimeLine.replace('author-time ', '').trim(), 10);
      if (!isNaN(authorTime)) {
        age_days = Math.floor((Date.now() / 1000 - authorTime) / 86400);
      }
    }
    
    return { author, age_days };
  } catch {
    return {};
  }
}

const BINARY_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "svg",
  "pdf",
  "zip",
  "tar",
  "gz",
  "rar",
  "7z",
  "exe",
  "bin",
  "dll",
  "so",
  "dylib",
  "mp3",
  "mp4",
  "wav",
  "mov",
  "avi",
  "ttf",
  "woff",
  "woff2",
  "eot",
  "lock",
  "map",
]);

function isBinary(filePath: string): boolean {
  const ext = path.extname(filePath).replace(".", "").toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function loadGitignore(cwd: string): ReturnType<typeof ignore> {
  const ig = ignore();
  const gitignorePath = path.join(cwd, ".gitignore");

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    ig.add(content);
  }

  return ig;
}

function parseTodos(filePath: string, cwd: string): TodoItem[] {
  const items: TodoItem[] = [];

  if (isBinary(filePath)) return items;

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return items;
  }

  // skip if file looks binary despite extension
  if (content.includes("\0")) return items;

  const lines = content.split("\n");

  lines.forEach((rawLine, index) => {
    const match = TODO_REGEX.exec(rawLine);
    if (!match) return;

    const typeMatch = TODO_TYPE_REGEX.exec(rawLine);
    if (!typeMatch) return;

    const lineNum = index + 1;
    const blameInfo = getBlameInfo(filePath, lineNum, cwd);
    items.push({
      type: typeMatch[0].toUpperCase() as TodoItem["type"],
      file: path.relative(cwd, filePath),
      line: lineNum,
      text: match[1].trim(),
      rawLine: rawLine.trim(),
      author: blameInfo.author,
      age_days: blameInfo.age_days,
    });
  });

  return items;
}

export async function scanRepo(
  cwd: string = process.cwd(),
): Promise<TodoItem[]> {
  const ig = loadGitignore(cwd);

  const files = await fg("**/*", {
    cwd,
    absolute: true,
    onlyFiles: true,
    ignore: ALWAYS_IGNORE,
    dot: false,
  });

  const filtered = files.filter((f) => {
    const rel = path.relative(cwd, f);
    return !ig.ignores(rel);
  });

  const todos = filtered.flatMap((f) => parseTodos(f, cwd));

  return todos;
}
