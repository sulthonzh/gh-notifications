#!/usr/bin/env node
import { execSync } from "child_process";
import { stdout, exit } from "process";

function daysSince(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / 86400000);
}

function formatDays(d) {
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

function typeIcon(t) {
  if (t === "PullRequest") return "🔀";
  if (t === "Issue") return "🐛";
  if (t === "Commit") return "📦";
  if (t === "Release") return "🏷️";
  if (t === "Discussion") return "💬";
  return "📌";
}

function reasonLabel(r) {
  const map = {
    assign: "assigned",
    author: "authored",
    comment: "comment",
    invitation: "invited",
    manual: "subscribed",
    mention: "mentioned",
    review_requested: "review req",
    security_alert: "security",
    state_change: "state change",
    subscribed: "watching",
    team_mention: "team mention",
  };
  return map[r] || r;
}

function ghAvailable() {
  try {
    execSync("gh --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function fetchNotifications(opts = {}) {
  const args = ["gh", "api", "notifications", "--paginate"];
  if (opts.all) args.push("-f", "per_page=100");

  const raw = execSync(args.join(" "), {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  let items = JSON.parse(raw);
  if (!Array.isArray(items)) items = items.flat ? items.flat() : [items];

  // de-duplicate by subject url
  const seen = new Set();
  items = items.filter((n) => {
    const key = n.subject?.url || n.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!opts.all) items = items.filter((n) => n.unread);
  if (opts.repo)
    items = items.filter((n) =>
      n.repository?.full_name?.includes(opts.repo)
    );
  if (opts.type)
    items = items.filter((n) => n.subject?.type === opts.type);
  if (opts.reason)
    items = items.filter((n) => n.reason === opts.reason);

  return items.map((n) => ({
    repo: n.repository?.full_name || "unknown",
    type: n.subject?.type || "Unknown",
    title: n.subject?.title || "(no title)",
    url: n.subject?.html_url || n.subject?.url || "",
    reason: n.reason || "",
    unread: n.unread,
    updated: n.updated_at,
    age: daysSince(n.updated_at),
  }));
}

function formatText(items) {
  if (!items.length) return "No notifications.";
  const lines = [];
  let currentRepo = "";
  for (const n of items) {
    if (n.repo !== currentRepo) {
      currentRepo = n.repo;
      lines.push(`\n  ${currentRepo}`);
    }
    const icon = typeIcon(n.type);
    const unread = n.unread ? "●" : "○";
    const age = formatDays(n.age);
    const reason = reasonLabel(n.reason);
    lines.push(
      `  ${unread} ${icon} #${n.title}  (${reason}, ${age})`
    );
    if (n.url) lines.push(`    ${n.url}`);
  }
  lines.push(`\n  ${items.length} notification${items.length === 1 ? "" : "s"}`);
  return lines.join("\n");
}

function formatJSON(items) {
  return JSON.stringify(
    { count: items.length, notifications: items },
    null,
    2
  );
}

function formatMarkdown(items) {
  if (!items.length) return "_No notifications._\n";
  const lines = ["# GitHub Notifications\n"];
  let currentRepo = "";
  for (const n of items) {
    if (n.repo !== currentRepo) {
      currentRepo = n.repo;
      lines.push(`\n## ${currentRepo}\n`);
    }
    const icon = typeIcon(n.type);
    const unread = n.unread ? "🔴" : "⚪";
    const link = n.url ? `[${n.title}](${n.url})` : n.title;
    lines.push(
      `- ${unread} ${icon} ${link} — _${reasonLabel(n.reason)}_, ${formatDays(n.age)}`
    );
  }
  lines.push(`\n> ${items.length} notification${items.length === 1 ? "" : "s"}`);
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { format: "text" };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--all":
        opts.all = true;
        break;
      case "--json":
        opts.format = "json";
        break;
      case "--markdown":
        opts.format = "markdown";
        break;
      case "--repo":
        opts.repo = args[++i];
        break;
      case "--type":
        opts.type = args[++i];
        break;
      case "--reason":
        opts.reason = args[++i];
        break;
      case "--help":
      case "-h":
        opts.help = true;
        break;
      default:
        if (args[i].startsWith("-")) {
          console.error(`Unknown flag: ${args[i]}`);
          exit(2);
        }
    }
  }
  return opts;
}

const HELP = `
gh-notifications — See your GitHub notifications at a glance

USAGE
  gh-notifications [flags]

FLAGS
  --all             Include read notifications (default: unread only)
  --repo <repo>     Filter by repository name
  --type <type>     Filter by type: Issue, PullRequest, Release, Commit, Discussion
  --reason <r>      Filter by reason: assign, author, mention, review_requested, etc.
  --json            Output as JSON
  --markdown        Output as Markdown
  -h, --help        Show this help

EXAMPLES
  gh-notifications              # unread only
  gh-notifications --all        # everything
  gh-notifications --type Issue # just issues
  gh-notifications --json       # pipe to jq

REQUIRES
  gh CLI authenticated (gh auth login)
`.trim();

export {
  daysSince,
  formatDays,
  typeIcon,
  reasonLabel,
  fetchNotifications,
  formatText,
  formatJSON,
  formatMarkdown,
  parseArgs,
  HELP,
};

if (process.argv[1] && process.argv[1].endsWith("cli.js")) {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(HELP);
    exit(0);
  }
  if (!ghAvailable()) {
    console.error("gh CLI not found. Install: https://cli.github.com");
    exit(2);
  }
  try {
    const items = fetchNotifications(opts);
    const out =
      opts.format === "json"
        ? formatJSON(items)
        : opts.format === "markdown"
        ? formatMarkdown(items)
        : formatText(items);
    console.log(out);
    exit(items.length > 0 ? 1 : 0);
  } catch (e) {
    console.error("Failed to fetch notifications:", e.message);
    exit(2);
  }
}
