# General Guidelines

- Don't include any superfluous PHP Annotations, except ones that start with `@` for typing variables.
- Every time you create a new file, stage it immediately with `git add <path>`. Never commit; leave committing to the user.
- Do not write browser tests (`tests/Browser`, Pest browser plugin, Playwright). Cover behavior with Feature and Unit tests only.
- Migrations only go up: never write a `down` method. To undo a migration, write a new one.
- Use the Laravel AI SDK for new AI features and semantic search query embeddings. Load the `ai-sdk-development` skill and keep the embedding provider, model, and dimensions compatible with the stored vectors.

## Minimal code

- Write the least code that does the job: no private helpers, extra cache layers, or defensive checks the feature doesn't need. If a method can be inlined or a branch removed without losing behavior, do it.
- Prefer Laravel collections and the framework's typed accessors over hand-written array handling: `collect(...)->map(...)` instead of building arrays in loops, `$response->collect()` / `$response->fluent()` with `->integer()` / `->string()` instead of `is_array` / `is_numeric` checks and `(int)` casts.