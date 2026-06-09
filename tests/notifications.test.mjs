import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  daysSince,
  formatDays,
  typeIcon,
  reasonLabel,
  formatText,
  formatJSON,
  formatMarkdown,
  parseArgs,
  HELP,
} from "../cli.js";

describe("daysSince", () => {
  it("returns 0 for today", () => {
    assert.equal(daysSince(new Date().toISOString()), 0);
  });
  it("returns 1 for yesterday", () => {
    const d = new Date(Date.now() - 86400000);
    assert.equal(daysSince(d.toISOString()), 1);
  });
  it("handles string dates", () => {
    assert.ok(daysSince("2025-01-01T00:00:00Z") > 365);
  });
});

describe("formatDays", () => {
  it("today", () => assert.equal(formatDays(0), "today"));
  it("yesterday", () => assert.equal(formatDays(1), "yesterday"));
  it("plural", () => assert.equal(formatDays(5), "5d ago"));
});

describe("typeIcon", () => {
  it("PullRequest", () => assert.equal(typeIcon("PullRequest"), "🔀"));
  it("Issue", () => assert.equal(typeIcon("Issue"), "🐛"));
  it("Release", () => assert.equal(typeIcon("Release"), "🏷️"));
  it("unknown", () => assert.equal(typeIcon("Foo"), "📌"));
});

describe("reasonLabel", () => {
  it("mention", () => assert.equal(reasonLabel("mention"), "mentioned"));
  it("review_requested", () => assert.equal(reasonLabel("review_requested"), "review req"));
  it("unknown", () => assert.equal(reasonLabel("foo"), "foo"));
});

describe("formatText", () => {
  it("empty", () => assert.equal(formatText([]), "No notifications."));
  it("shows repo and title", () => {
    const out = formatText([
      { repo: "user/repo", type: "Issue", title: "Bug fix", url: "https://x", reason: "mention", unread: true, updated: new Date().toISOString(), age: 0 },
    ]);
    assert.ok(out.includes("user/repo"));
    assert.ok(out.includes("Bug fix"));
    assert.ok(out.includes("1 notification"));
  });
  it("groups by repo", () => {
    const out = formatText([
      { repo: "a/b", type: "Issue", title: "X", url: "", reason: "assign", unread: true, updated: new Date().toISOString(), age: 0 },
      { repo: "a/b", type: "PullRequest", title: "Y", url: "", reason: "review_requested", unread: false, updated: new Date().toISOString(), age: 1 },
    ]);
    // repo header appears once
    assert.equal(out.split("a/b").length - 1, 1);
  });
});

describe("formatJSON", () => {
  it("empty", () => {
    const obj = JSON.parse(formatJSON([]));
    assert.equal(obj.count, 0);
  });
  it("has count and notifications", () => {
    const obj = JSON.parse(formatJSON([
      { repo: "a/b", type: "Issue", title: "T", url: "", reason: "", unread: true, updated: "", age: 0 },
    ]));
    assert.equal(obj.count, 1);
    assert.equal(obj.notifications[0].repo, "a/b");
  });
});

describe("formatMarkdown", () => {
  it("empty", () => assert.ok(formatMarkdown([]).includes("No notifications")));
  it("has headers", () => {
    const out = formatMarkdown([
      { repo: "a/b", type: "Issue", title: "T", url: "https://x", reason: "mention", unread: true, updated: new Date().toISOString(), age: 0 },
    ]);
    assert.ok(out.includes("## a/b"));
    assert.ok(out.includes("[T](https://x)"));
  });
});

describe("parseArgs", () => {
  it("defaults", () => {
    const opts = parseArgs(["node", "cli.js"]);
    assert.equal(opts.format, "text");
    assert.equal(opts.all, undefined);
  });
  it("--all", () => {
    assert.equal(parseArgs(["node", "cli.js", "--all"]).all, true);
  });
  it("--json", () => {
    assert.equal(parseArgs(["node", "cli.js", "--json"]).format, "json");
  });
  it("--markdown", () => {
    assert.equal(parseArgs(["node", "cli.js", "--markdown"]).format, "markdown");
  });
  it("--repo", () => {
    assert.equal(parseArgs(["node", "cli.js", "--repo", "foo/bar"]).repo, "foo/bar");
  });
  it("--type", () => {
    assert.equal(parseArgs(["node", "cli.js", "--type", "Issue"]).type, "Issue");
  });
  it("--reason", () => {
    assert.equal(parseArgs(["node", "cli.js", "--reason", "mention"]).reason, "mention");
  });
  it("--help", () => {
    assert.equal(parseArgs(["node", "cli.js", "--help"]).help, true);
  });
  it("-h", () => {
    assert.equal(parseArgs(["node", "cli.js", "-h"]).help, true);
  });
});

describe("HELP", () => {
  it("has usage info", () => {
    assert.ok(HELP.includes("gh-notifications"));
    assert.ok(HELP.includes("--all"));
    assert.ok(HELP.includes("--json"));
  });
});
