# Istabul_Git-Diff_test
Test12345
Test7867
Wird das angezeigt?

Usage for coverage-diff
-----------------------

1. Install deps:

```
npm install
```

2. Run instrumented tests to generate coverage:

```
npm run coverage:run
```

3. Generate the diff coverage report (shows uncovered changed lines):

```
npm run coverage:diff
```

Notes: The script reads `coverage/coverage-final.json` produced by `nyc`. It parses `git diff -U0 HEAD` to find changed lines and maps those to statements in the coverage JSON.

Optional: compare against a previous coverage JSON with `--base`:

```
npm run coverage:diff -- --base=path/to/previous/coverage-final.json
```
