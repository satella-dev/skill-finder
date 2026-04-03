---
name: skill-installer
description: "Search, filter, and install Claude Code skills/agents via MCP (5,214 entries, 277 repos). Use when: 'install skill', 'find and install', 'add skill for X', 'setup skills for agent'. Combines search → refine → approve → install."
---

# Skill Installer

Search, filter, approve, and install skills/agents via the `skill-registry` MCP server.

## Prerequisites

The `skill-registry` MCP server must be configured. Add to `~/.claude/.mcp.json`:

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

# Skill Installer

Search the PostgreSQL skill registry, refine results with conditions, and install selected skills to global (~/.claude/) or project (.claude/) scope.

## Database

Connect via: `psql -h 127.0.0.1 -p 6432 -d skill_registry`

Tables:
- `repos` — 201 repos (id, name, domain, grade, skill_count, agent_count, tags[], description, url, install_cmd)
- `skills` — 5,214 individual skills/agents (name, type, description, repo_id, source)
- `alternatives` — 6 comparison groups (purpose, options[], recommendation)
- `role_templates` — 10 agent role templates (role, domains[], recommended_skills[])
- `installed` — tracking of installed items
- `domains` — 13 domain categories

## Workflow

### Phase 1: Search

Run a SQL query based on the user's request. Choose the right query pattern:

**By keyword (fuzzy, handles typos):**
```sql
SELECT r.id, r.name, r.grade, r.skill_count, r.agent_count, r.domain,
       similarity(r.name, '{keyword}') AS sim
FROM repos r
WHERE r.name % '{keyword}' OR r.description ILIKE '%{keyword}%'
   OR EXISTS (SELECT 1 FROM skills s WHERE s.repo_id = r.id AND (s.name ILIKE '%{keyword}%' OR s.description ILIKE '%{keyword}%'))
ORDER BY r.grade ASC NULLS LAST, sim DESC
LIMIT 15;
```

**By domain:**
```sql
SELECT r.id, r.name, r.grade, r.skill_count, r.agent_count, r.description
FROM repos r WHERE r.domain = '{DOMAIN}'
ORDER BY r.grade ASC NULLS LAST, r.skill_count + r.agent_count DESC;
```

**By role template (for agent creation):**
```sql
SELECT rt.role, rt.description, rt.recommended_skills, rt.domains
FROM role_templates rt WHERE rt.role = '{role}';
```

**Individual skill search:**
```sql
SELECT s.name, s.type, s.description, r.id AS repo, r.grade, r.url
FROM skills s JOIN repos r ON s.repo_id = r.id
WHERE s.name ILIKE '%{keyword}%' OR s.description ILIKE '%{keyword}%'
ORDER BY r.grade ASC NULLS LAST
LIMIT 20;
```

Present results in tiered format:
- **강력 추천** (A/A- grade)
- **고려** (B+/B grade)
- **기타** (ungraded or C)

### Phase 2: Refine

Accept additional filter conditions from the user. Map to SQL WHERE clauses:

| User says | SQL filter |
|---|---|
| "A등급만" | `AND r.grade IN ('A', 'A-')` |
| "에이전트 있는" | `AND r.agent_count > 0` |
| "스킬 10개 이상" | `AND r.skill_count >= 10` |
| "original만" | `AND r.source = 'original'` |
| "보안 도메인" | `AND r.domain = 'SECURITY'` |

Re-run query with accumulated filters and re-present.

### Phase 3: Approve

Present final selection as numbered list. For each, show:
- Name, grade, skill/agent/command counts
- Install type: Standard (has skills/ dir) / Clone-only / MCP-required
- Any warnings (MCP dependency, large size)

Ask user to confirm by number(s).

### Phase 4: Install

Ask scope: "글로벌 (~/.claude/) 또는 프로젝트 (.claude/)?"

For each approved repo:

```bash
# 1. Clone to temp
TEMP=$(mktemp -d)
git clone --depth 1 {url} "$TEMP/repo"

# 2. Detect installable content
ls "$TEMP/repo/skills/" "$TEMP/repo/agents/" "$TEMP/repo/commands/" 2>/dev/null

# 3. Copy to chosen scope
SCOPE="$HOME/.claude"  # or ".claude" for project
[ -d "$TEMP/repo/skills" ] && cp -r "$TEMP/repo/skills/"* "$SCOPE/skills/" 2>/dev/null
[ -d "$TEMP/repo/agents" ] && cp -r "$TEMP/repo/agents/"* "$SCOPE/agents/" 2>/dev/null
[ -d "$TEMP/repo/commands" ] && cp -r "$TEMP/repo/commands/"* "$SCOPE/commands/" 2>/dev/null

# 4. Clean up
rm -rf "$TEMP"
```

After install, record in database:
```sql
INSERT INTO installed (repo_id, scope, install_path, items, source_url, git_sha)
VALUES ('{repo_id}', '{scope}', '{path}', '{items_json}', '{url}', '{sha}');
```

### Phase 5: Verify

```bash
# Check installed files exist
ls {scope}/skills/{name}/SKILL.md 2>/dev/null && echo "✅ Installed" || echo "❌ Failed"
```

Report: "설치 완료: N개 스킬, M개 에이전트. 즉시 사용 가능."

### Check Alternatives

When the search domain has an alternatives entry:
```sql
SELECT purpose, options, recommendation FROM alternatives WHERE domain = '{domain}';
```

Present the comparison and recommended combination.

### Check Installed

```sql
SELECT i.repo_id, i.scope, i.installed_at, i.items
FROM installed i ORDER BY i.installed_at DESC;
```

### Uninstall

```bash
# Remove files
rm -rf {scope}/skills/{skill_name}
# Update DB
DELETE FROM installed WHERE repo_id = '{repo_id}' AND scope = '{scope}';
```

## Quick Reference

| Domain | Code | Top Repos |
|---|---|---|
| 보안 | SECURITY | mukul975(759), trailofbits(24 agents), clawsec(26) |
| 개발 워크플로우 | DEV_WORKFLOW | ECC(255), task-master(50 cmds), superpowers(37) |
| AI/ML | DATA_AI_ML | K-Dense-AI(134), Orchestra(92), wanshuiyin(51) |
| PM/비즈니스 | PM_BUSINESS | deanpeters(82), lawvable(53), charlie-cfo |
| DevOps | DEVOPS_INFRA | cc-devops(31), terraform, aws-skills |
| 모바일 | MOBILE | ios-simulator(A), apple-hig(14), expo(12) |
| 디자인 | FRONTEND_DESIGN | ui-ux-pro-max(7), ibelick(A-) |
| 마케팅 | MARKETING_CONTENT | marketingskills(33+63), aso-skills(30) |
