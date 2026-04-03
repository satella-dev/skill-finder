# Skill Finder

Search and install Claude Code skills/agents from a curated registry of **5,214 skills** across **277 repositories**.

## Setup

### Step 1: Connect to the MCP server

Run in your terminal:

```bash
claude mcp add --transport sse skill-registry https://skills.timblo.io/sse --scope user
```

This registers the server globally. Restart Claude Code.

### Step 2 (optional): Install skills for slash commands

**Plugin:**

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

**Or manual:**

```bash
git clone https://github.com/satella-dev/skill-finder.git
cp -r skill-finder/skills/skill-finder ~/.claude/skills/
cp -r skill-finder/skills/skill-installer ~/.claude/skills/
```

**Restart Claude Code** after setup.

### Verify

After restart, run `/mcp` and check that `skill-registry` shows as connected. Then:

```
보안 관련 스킬 찾아줘
```

Should return search results from 5,214 skills across 277 repos.

## What you get

### Skills (slash commands)

| Skill | Usage |
|-------|-------|
| `/skill-finder` | Search skills by keyword, domain, or role |
| `/skill-installer` | Search → filter → approve → install in one flow |

### MCP Tools (auto-available)

| Tool | Description |
|------|-------------|
| `search_skills` | Fast keyword search with domain inference |
| `hybrid_search` | Keyword + vector similarity (most accurate, Korean supported) |
| `list_domains` | Show all 13 domains with skill counts |
| `get_alternatives` | Compare competing skills for a domain |
| `get_role_template` | Get recommended skills for an agent role |
| `get_stats` | Registry statistics |

## Usage Examples

```
/skill-finder security audit agent
/skill-finder TDD 관련 스킬 추천해줘
/skill-finder what skills exist for iOS development

/skill-installer install security skills
/skill-installer Django 개발용 스킬 설치
```

## Searchable Domains

| Domain | Skills |
|--------|--------|
| Platform & Tools | 1,873 |
| Security | 884 |
| Dev Workflow | 717 |
| PM & Business | 662 |
| AI / ML / Data | 575 |
| Marketing & Content | 130 |
| DevOps & Infra | 73 |
| Language-Specific | 67 |
| Health & Science | 60 |
| Creative | 58 |
| Mobile | 54 |
| Frontend & Design | 51 |
| Automation | 10 |

## Accuracy

Tested with 100 diverse queries (English + Korean):

| Metric | Score |
|--------|-------|
| Top-3 accuracy | **95%** |
| Top-1 accuracy | 85% |

Powered by PostgreSQL + pg_trgm + pgvector.

## License

MIT
