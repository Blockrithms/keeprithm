# Contributing to Keeprithm

Thanks for working on Keeprithm. This file is the review bar for code changes. Install, Slack, Cloudinary, and environment variables are in the [README](README.md). Follow that setup before you change behavior.

By sending a patch you agree that it is licensed under the [MIT License](LICENSE), the same license as the rest of the repository. There is no separate contributor agreement.

## What helps

- A bug report with the API log line, the HTTP status, and what you expected
- A small pull request that fixes one thing
- Docs that match the code, especially setup steps a new contributor would follow
- A missing validation, auth check, or empty state

Open an issue before a large change (a new archive source, a new auth method, a schema migration). A pull request that rewrites the backup loop or the encryption format without that discussion will not be merged.

## Report a vulnerability in private

Do not open a public issue for a leaked secret, an auth bypass, or a way to read another workspace’s messages. Email **info@blockrithms.com** with the details. Give the maintainers time to ship a fix before you publish it.

## Set up

Use Node.js 22 and Yarn Classic 1.22. The [README](README.md#run-it-locally) is the source of truth for MongoDB, the Slack app, Cloudinary, and both `.env` files.

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn install
yarn dev
```

`yarn dev` runs the Next.js app on port 3000 and the API on port 6000. Leave it running while you work. `server/.env` and `client/.env` stay on your machine. Never commit them, and never paste a bot token, signing secret, `ENCRYPTION_KEY`, or `JWT_SECRET` into an issue or pull request.

There is no test runner in the repository yet. A pull request that adds one for the area it touches is welcome. Until then, the pull request must say how you checked the change.

## Where code goes

The browser talks to Next.js. Next.js calls the Express API. Slack and Cloudinary are reached only from the API.

| You are changing | Start here |
| --- | --- |
| A page or layout | `client/app/` |
| Shared UI | `client/components/` |
| A call from the UI to the API | `client/services/` (these files are `"use server"`) |
| Who can open a page | `client/constants/auth.ts` and `client/proxy.ts` |
| A new HTTP route | `server/src/routes/`, then register it in `server/src/routes/index.js` |
| Request checks | `server/src/validations/` and the `validate` middleware on the route |
| Behavior | `server/src/services/` |
| Stored shape | `server/src/models/` |
| An operator script | `server/scripts/`, with a script entry in `server/package.json` and the root `package.json` if people should run it as `yarn <name>` |

A new API route is a route file, a Joi schema, a thin controller, and a service. Mount the router in `server/src/routes/index.js` or it will 404. Protect it with `auth()` unless it is a Slack callback or the events endpoint. Admin-only behavior uses `auth(ADMIN)` from `server/src/config/roles.js`. The admin cookie in the browser is only a routing hint. The API is what enforces the role.

A new page is private unless its path is listed in `PUBLIC_ROUTES` in `client/constants/auth.ts`. `client/proxy.ts` is the gate (this app does not use `middleware.ts`). `/dashboard` is already covered by `ADMIN_ROUTES`.

Client imports use `@/` and `~/`. Both point at `client/`. Server code is CommonJS (`require`).

## Style

Match the file you are editing.

**Server.** Airbnb base, Prettier, single quotes, print width 125. `no-console` is an error. Scripts under `server/scripts/` that must print progress disable that rule at the top of the file. Do not log message text, tokens, cookies, or connection strings.

**Client.** TypeScript and the Next.js ESLint config. Components are Server Components until they need state or browser events. A file marked `"use server"` exposes every exported async function to the client, so export only functions you mean to call from the UI. Do not pass event handlers from a Server Component into a Client Component.

Run the linter for the workspace you changed:

```bash
yarn --cwd server lint
yarn --cwd client lint
```

Format the server with `yarn --cwd server format`. The client formatter is Prettier:

```bash
yarn --cwd client exec prettier --write .
```

Prettier ignores `node_modules`. On commit, Husky runs `lint-staged`, which lints and formats the staged client and server files. If the hook fails, fix the report and commit again. Do not skip the hook.

## Check the change

Say in the pull request what you ran. For a UI change, that means the real click path: which page, what you typed, where you landed, and the empty or error state if you touched one. For an API change, include the route, the status code, and a redacted response body.

Do not run a full Slack backup, and do not run `yarn debug:history-limit -- --burst`, to prove a change that does not need Slack. Both spend the workspace’s `conversations.history` budget. A dashboard change can be checked against the API with a normal admin session.

## Leave these alone unless the issue says otherwise

These look like cleanups and will break existing archives or sessions.

- The HKDF labels in `server/src/utils/crypto.js`: `slack-exporter:aes-gcm:v1` and `slack-exporter:search-hmac:v1`. They are part of the ciphertext. Changing them makes every encrypted row unreadable. There is no key-rotation command.
- `ENCRYPTION_KEY` handling. Getters must keep accepting legacy plaintext until `yarn migrate:encrypt` has been run, and setters must not encrypt a value that already starts with `enc:v1:`.
- Cookie names in `client/constants/auth.ts` (`access`, `refresh`, `keeprithmuser`). They are written and read in more than one file.
- The in-memory ops lock in `server/src/services/opsJob.js`. Backup, sync, the cron, and `POST /api/message/backup` share it. A second job must still fail with 409 while one is running.
- Dashboard responses. They must not include message bodies, file payloads, bot tokens, or Slack user tokens.

A schema change needs a note in the pull request about existing documents. Prefer a change that still reads old rows. If old rows need a rewrite, add a script under `server/scripts/` that defaults to a dry run, the same way `encryptExistingData.js` does.

## Pull requests

Branch from `main`. Use a short name such as `fix/channel-cursor` or `docs/backup-cron`.

Work in small commits. The subject is an imperative sentence about why the change exists (`Keep the backup cursor when a page is empty`), not a file list. The body can be empty when the subject is enough.

Open the pull request against `main` and include:

1. What changed and why.
2. How you verified it (commands, pages, status codes).
3. Anything you did not verify (no Slack workspace, no browser, migration not applied).
4. Screenshots only when the layout changed. Crop out real Slack message text and workspace names if the shot is from a real workspace.

Review looks for these:

- The patch does what the description says, and does not include drive-by edits.
- New routes validate input and check `auth()` or `auth(ADMIN)`.
- Secrets and archive contents are not logged.
- Lint passes on the workspace you touched.
- Docs change when the setup or operator commands change.

Force-pushing your own feature branch to update a review is fine. Do not force-push `main`.

## Maintainers

Issues and pull requests are tracked at <https://github.com/Blockrithms/keeprithm/issues>. Questions about running Keeprithm for a team can go to **info@blockrithms.com**.
