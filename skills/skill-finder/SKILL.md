---
name: skill-finder
description: "Search Claude Code skills/agents from a registry of 5,214 entries across 277 repos via MCP. Use when: 'find skills for', 'recommend skills', 'what skills exist for X', 'skill for agent'. Supports Korean and English. Auto-detects project tech stack."
---

# Skill Finder

Search the skill registry via the `skill-registry` MCP server, with automatic project context detection.

## Prerequisites

The `skill-registry` MCP server must be configured. Run:

```bash
claude mcp add --transport sse skill-registry https://skills.timblo.io/sse --scope user
```

Then restart Claude Code. Verify with `/mcp` — `skill-registry` should show as connected.

## Search Process

### Step 0: Project Context (automatic, silent)

Before searching, check if `.skill-context.json` exists in the project root.

**If it exists:** Read it and use the detected tech stack to boost relevant results.

**If it does NOT exist:** Automatically detect the project's tech stack by scanning files. This is silent — the user should not see this step, only the search results.

Detection method — use Glob to check which files exist, then build context:

| File | Detected |
|------|----------|
| `package.json` | Read `dependencies` + `devDependencies` keys → frameworks (react, next, vue, express, fastify, etc.) |
| `requirements.txt` / `pyproject.toml` | Python + frameworks (django, fastapi, flask, etc.) |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `pubspec.yaml` | Flutter/Dart |
| `Package.swift` / `*.xcodeproj` | Swift/iOS |
| `build.gradle*` | Kotlin/Java/Android |
| `Dockerfile` / `docker-compose*` | Docker |
| `*.tf` | Terraform |
| `.github/workflows/*` | GitHub Actions |
| `CLAUDE.md` / `AGENTS.md` | Existing Claude Code project |

After detection, write `.skill-context.json`:

```json
{
  "generated": "2026-04-03",
  "languages": ["typescript", "python"],
  "frameworks": ["nextjs", "fastapi"],
  "databases": ["postgresql"],
  "tools": ["docker", "github-actions"],
  "domain_hint": "FRONTEND_DESIGN"
}
```

Add `.skill-context.json` to `.gitignore` if not already there.

### Step 1: Build search query

Combine the user's request with project context:

- User asks: "보안 스킬 추천해줘"
- Project context: `{ frameworks: ["nextjs", "fastapi"] }`
- Enhanced query: "security skills for nextjs fastapi web application"

This gives hybrid_search better context for vector matching.

### Step 2: Choose the right MCP tool

| MCP Tool | When to use |
|----------|-------------|
| `mcp__skill-registry__hybrid_search` | **Default.** Most accurate. Understands meaning, handles Korean. |
| `mcp__skill-registry__search_skills` | Fallback if hybrid_search is unavailable. Fast keyword search. |

### Step 3: Run the search

```
mcp__skill-registry__hybrid_search({ query: "enhanced query here", limit: 10 })
```

### Step 4: Present results

Group by grade:
- **Strongly Recommended (A/A-)**: Production-quality, well-maintained
- **Consider (B+/B)**: Useful, less tested
- **Other**: Ungraded

For each result show: name, type (skill/agent), repo, grade, score, description.

If the project context detected specific frameworks, highlight results that match:
> "이 프로젝트는 Next.js + FastAPI를 사용 중이므로, frontend-patterns와 django-security 스킬이 특히 유용합니다."

### Step 5: Check alternatives (when relevant)

```
mcp__skill-registry__get_alternatives({ domain: "security" })
```

Domains: code-review, security, tdd-testing, design-ui, architecture, marketing

### Step 6: Agent role template (when creating agents)

```
mcp__skill-registry__get_role_template({ role: "security-auditor" })
```

Roles: code-reviewer, security-auditor, frontend-developer, devops-engineer, data-scientist, pm-product, mobile-developer, marketer, legal-advisor, music-producer

## Other Tools

```
mcp__skill-registry__list_domains()    — 13 domains with skill counts
mcp__skill-registry__get_stats()       — total repos, skills, agents
```

## Domains

| Domain | Skills |
|--------|--------|
| Platform/Tools | 1,873 |
| Security | 884 |
| Dev Workflow | 717 |
| PM/Business | 662 |
| AI/ML/Data | 575 |
| Marketing | 130 |
| DevOps | 73 |
| Languages | 67 |
| Health/Science | 60 |
| Creative | 58 |
| Mobile | 54 |
| Frontend | 51 |
| Automation | 10 |
