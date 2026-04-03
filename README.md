# Skill Finder

A Claude Code plugin that searches and installs skills/agents from a curated registry of **5,214 skills** across **277 repositories** and **13 domains**.

Powered by PostgreSQL + pgvector hybrid search (keyword + vector similarity). Accuracy: 95% (Top-3, 100 test queries).

## Setup

### 1. Connect the MCP server

```bash
claude mcp add --transport sse skill-registry https://skills.timblo.io/sse --scope user
```

Restart Claude Code. Verify: run `/mcp` and confirm `skill-registry` is connected.

### 2. Install the plugin (optional — adds `/skill-finder` and `/skill-installer` slash commands)

Add to `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "satella": {
      "source": {
        "source": "github",
        "repo": "satella-dev/skill-finder"
      }
    }
  },
  "enabledPlugins": {
    "skill-registry@satella": true
  }
}
```

Or install manually:

```bash
git clone https://github.com/satella-dev/skill-finder.git
cp -r skill-finder/skills/skill-finder ~/.claude/skills/
cp -r skill-finder/skills/skill-installer ~/.claude/skills/
```

Restart Claude Code after setup.

## What You Get

### MCP Tools (available after Step 1)

| Tool | Description |
|------|-------------|
| `search_skills(query, limit)` | Fast keyword search with domain inference and typo tolerance |
| `hybrid_search(query, limit)` | Keyword + vector similarity search — most accurate, Korean supported |
| `list_domains()` | List all 13 skill domains with skill counts |
| `get_alternatives(domain)` | Compare competing skills for a domain (security, code-review, tdd-testing, design-ui, architecture, marketing) |
| `get_role_template(role)` | Get recommended skill set for an agent role (code-reviewer, security-auditor, frontend-developer, devops-engineer, data-scientist, pm-product, mobile-developer, marketer, legal-advisor, music-producer) |
| `get_stats()` | Total repos, skills, and agents in the registry |
| `get_search_analytics(days)` | Search log analytics — top queries, tool usage, response times |

### Skills (available after Step 2)

| Skill | Trigger | What it does |
|-------|---------|--------------|
| `/skill-finder` | "find skills for X", "recommend skills", "what skills exist for X" | Searches the registry, groups results by grade, suggests alternatives, supports agent creation |
| `/skill-installer` | "install skill for X", "add skills for this project" | Searches → user selects → installs to global or project scope |

## Usage Examples

```
find me security audit skills
recommend skills for a TDD workflow
what skills exist for iOS development
install frontend design skills for this project
```

Korean queries work with `hybrid_search`:

```
보안 관련 스킬 찾아줘
Flutter 앱 개발에 필요한 스킬 추천해줘
```

## Domains

| Domain | Skills | Examples |
|--------|--------|---------|
| Platform & Tools | 1,873 | Claude Code extensions, orchestration, plugins |
| Security | 884 | OWASP, MITRE ATT&CK, pen testing, compliance |
| Dev Workflow | 717 | Code review, TDD, git, CI/CD |
| PM & Business | 662 | PRD, roadmap, legal, finance |
| AI / ML / Data | 575 | Training, RAG, research, scientific computing |
| Marketing & Content | 130 | SEO, email, CRO, copywriting |
| DevOps & Infra | 73 | Terraform, AWS, Docker, Kubernetes |
| Language-Specific | 67 | Rust, Go, Python, TypeScript, Ruby |
| Health & Science | 60 | Clinical, materials, bioinformatics |
| Creative | 58 | Music production, writing, video |
| Mobile | 54 | iOS, Android, Flutter, React Native |
| Frontend & Design | 51 | UI/UX, design systems, Tailwind |
| Automation | 10 | n8n, Home Assistant |

## Project Context

When `/skill-finder` runs for the first time in a project, it scans the project structure (package.json, requirements.txt, etc.) and generates `.skill-context.json`. Subsequent searches use this context to prioritize relevant results.

## License

MIT
