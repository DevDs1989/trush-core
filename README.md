<div align="center">

# trush-core

**The core engine for t-rush and t-rush-mcp.**

Provides the shared scanning, fuzzy search, state persistence, and streak tracking logic used across the t-rush ecosystem.

[![npm version](https://img.shields.io/npm/v/@devds1989/trush-core?color=black&style=flat-square)](https://www.npmjs.com/package/@devds1989/trush-core)
[![license](https://img.shields.io/github/license/DevDs1989/trush-core?color=black&style=flat-square)](./LICENSE)
[![node](https://img.shields.io/node/v/@devds1989/trush-core?color=black&style=flat-square)](https://nodejs.org)

</div>

---

## Overview

`trush-core` contains the extracted logic from the original `t-rush` CLI. It ensures that both the CLI (for humans) and the MCP server (for AI agents) share the exact same detection engine, file parsing, streak tracking, and local JSON store.

```text
@devds1989/trush-core   ← scanning, fuzzy search, streak state, JSON store
├── @devds1989/t-rush        (CLI interface, depends on trush-core)
└── @devds1989/t-rush-mcp    (MCP server, depends on trush-core)
```

By relying on this shared core:
- A bug fix in detection fixes both interfaces simultaneously.
- Resolving a TODO via the MCP server updates the same streak state the CLI reads.
- Streak and stats state remains perfectly synchronized locally.

---

## Features

- **Smart scanner:** Recursively finds `TODO`, `FIXME`, `BUG`, `HACK`, and `XXX` across all common languages.
- **Git integration:** Automatically runs `git blame` on detected comments for author attribution.
- **Fuzzy Search:** Built-in `fuse.js` index to search across scanned TODOs by intent or file.
- **Validator:** Verifies if a comment was actually resolved or if it's still present in the file.
- **Streak & State Management:** Handles the local atomic JSON store (`~/.t-rush/data.json`), updating stats, runs, and streaks.

---

## Install

```bash
npm i @devds1989/trush-core
```

---

## API Usage

### `scanRepo(cwd?: string): Promise<TodoItem[]>`
Scans the given directory (ignoring binary files, `node_modules`, and `.gitignore` paths) and returns an array of detected items.

```ts
import { scanRepo } from "@devds1989/trush-core";

const todos = await scanRepo("/path/to/repo");
console.log(todos[0].author);
```

### `searchTodos(items: TodoItem[], query: string): TodoItem[]`
Performs a fuzzy search across a list of items.

```ts
import { searchTodos } from "@devds1989/trush-core";

const results = searchTodos(todos, "auth race condition");
```

### `validateTodo(file, line, originalText, type): ValidationResult`
Checks whether a specific comment was resolved by checking the file around the specific line.

### State & Streak Management
Methods to interact with the local JSON data store:
- `loadData()` / `saveData(data)`
- `incrementStreak(type)` / `resetStreak()`
- `getStreak()` / `getStats()`
- `addRun(record)`

---

## Supported languages

Detects markers in all common comment styles:

| Style | Languages |
|---|---|
| `//` | JavaScript, TypeScript, Go, Rust, C, C++, Java, Kotlin, Swift, Dart |
| `#` | Python, Ruby, Shell, YAML, R, Perl, Elixir, Crystal |
| `--` | SQL, Lua, Haskell, Ada |
| `%` | Erlang, LaTeX |
| `;` | Lisp, Clojure, Assembly |
| `*` | Inside `/* */` block comments |

---

## Contributing

Contributions are welcome! If you are improving the scanning logic or state management, make your changes here so both `t-rush` and `t-rush-mcp` can benefit.

```bash
git clone https://github.com/DevDs1989/trush-core
cd trush-core
npm install
npm run build
```

---

## License

[MIT](./LICENSE) © Dev
