# gh-notifications

See your GitHub notifications at a glance. No API tokens — just your existing `gh` auth.

```
npx gh-notifications
```

## Why?

GitHub notifications pile up. The web UI buries them. You want a quick terminal glance at what needs attention — unread mentions, review requests, assigned issues — across all your repos.

## Install

```bash
npm i -g gh-notifications
```

Requires [gh CLI](https://cli.github.com) authenticated (`gh auth login`).

## Usage

```bash
gh-notifications              # unread only
gh-notifications --all        # include read
gh-notifications --type Issue # just issues
gh-notifications --reason mention   # only mentions
gh-notifications --repo sulthonzh/my-project   # single repo
gh-notifications --json       # pipe to jq
gh-notifications --markdown   # for docs/notes
```

## Output

```
  sulthonzh/gh-notifications
  ● 🔀 #Add pagination support  (review req, today)
    https://github.com/sulthonzh/gh-notifications/pull/12
  ○ 🐛 #Bug: missing headers  (mentioned, 2d ago)
    https://github.com/sulthonzh/gh-notifications/issues/8

  2 notifications
```

● = unread, ○ = read (only shown with `--all`)

## Flags

| Flag | Description |
|---|---|
| `--all` | Include read notifications |
| `--repo <name>` | Filter by repository |
| `--type <type>` | Filter: Issue, PullRequest, Release, Commit, Discussion |
| `--reason <r>` | Filter: mention, assign, review_requested, etc. |
| `--json` | JSON output |
| `--markdown` | Markdown output |
| `-h, --help` | Help |

## Exit Codes

- `0` — no notifications
- `1` — notifications found (CI-friendly)
- `2` — error

## Programmatic API

```js
import { fetchNotifications, formatText } from "gh-notifications";

const items = fetchNotifications({ all: true, type: "Issue" });
console.log(formatText(items));
```

## License

MIT
