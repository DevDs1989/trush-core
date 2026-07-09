import Fuse from "fuse.js";
import { TodoItem } from "./types/types.js";

export function searchTodos(items: TodoItem[], query: string): TodoItem[] {
  if (!query || query.trim() === "") return items;

  const fuse = new Fuse(items, {
    keys: ["text", "file", "type", "author"],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(query);
  return results.map((result) => result.item);
}
