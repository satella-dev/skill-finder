---
name: skill-installer
description: "Search, filter, and install Claude Code skills/agents via MCP (5,214 entries, 277 repos). Use when: 'install skill', 'find and install', 'add skill for X', 'setup skills for agent'. Combines search → refine → approve → install."
---

# Skill Installer

Search, filter, approve, and install skills/agents via the `skill-registry` MCP server.

## Prerequisites

The `skill-registry` MCP server must be configured. Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "skill-registry": {
      "type": "sse",
      "url": "https://skills.timblo.io/sse"
    }
  }
}
```

Then restart Claude Code.

## Workflow

### Phase 1: Search

Use the MCP tools to find skills:

```
mcp__skill-registry__hybrid_search({ query: "사용자 요청 내용", limit: 10 })
```

Or for fast keyword search:

```
mcp__skill-registry__search_skills({ query: "keyword", limit: 10 })
```

Present results grouped by grade (A → B → ungraded).

### Phase 2: Refine

If the user wants to narrow results, search again with modified query:
- "A등급만" → add "grade A" to context
- "에이전트만" → filter results where skill_type = "agent"
- "특정 도메인" → use `mcp__skill-registry__list_domains()` to show options

### Phase 3: Approve

Present final selection as a numbered list:
- Name, grade, repo, skill/agent type
- GitHub URL for each repo

Ask user to confirm by number.

### Phase 4: Install

For each approved skill, install from GitHub:

```bash
# Clone the repo
TEMP=$(mktemp -d)
git clone --depth 1 https://github.com/{owner}/{repo}.git "$TEMP/repo"

# Detect and copy available components
[ -d "$TEMP/repo/skills" ] && cp -r "$TEMP/repo/skills/"* ~/.claude/skills/
[ -d "$TEMP/repo/agents" ] && cp -r "$TEMP/repo/agents/"* ~/.claude/agents/
[ -d "$TEMP/repo/commands" ] && cp -r "$TEMP/repo/commands/"* ~/.claude/commands/

# Cleanup
rm -rf "$TEMP"
```

Ask user for scope before installing:
- **Global** (`~/.claude/`): Available in all projects
- **Project** (`.claude/`): Available in current project only

### Phase 5: Verify

After install, check files exist:

```bash
ls ~/.claude/skills/{skill-name}/SKILL.md && echo "Installed" || echo "Failed"
```

Report: "설치 완료: N개 스킬. 즉시 사용 가능."

## Check Alternatives

When user asks about competing options:

```
mcp__skill-registry__get_alternatives({ domain: "security" })
```

## Agent Creation Support

When creating a new agent, get recommended skills:

```
mcp__skill-registry__get_role_template({ role: "security-auditor" })
```
