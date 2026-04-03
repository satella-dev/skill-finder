# Skill Finder

Search and install Claude Code skills/agents from a curated registry of **5,214 skills** across **277 repositories**.

## What it does

- **skill-finder**: Search skills by keyword, domain, or role. Supports Korean and English.
- **skill-installer**: Search, filter, approve, and install skills in one flow.
- **MCP Server**: Remote hybrid search (keyword + vector similarity) via `skills.timblo.io`.

## Quick Start

### Option 1: MCP Server (recommended)

Add to `~/.claude/.mcp.json`:

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

Restart Claude Code. You get 6 tools:

| Tool | Description |
|------|-------------|
| `search_skills` | Keyword search with domain inference (fast) |
| `hybrid_search` | Keyword + vector similarity search (accurate, Korean supported) |
| `list_domains` | List all 13 skill domains |
| `get_alternatives` | Compare alternatives for a domain |
| `get_role_template` | Get recommended skills for an agent role |
| `get_stats` | Registry statistics |

### Option 2: Plugin

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

### Option 3: Manual

```bash
git clone https://github.com/satella-dev/skill-finder.git
cp -r skill-finder/skills/skill-finder ~/.claude/skills/
cp -r skill-finder/skills/skill-installer ~/.claude/skills/
```

## Usage

### Search skills

```
/skill-finder security audit agent skills
/skill-finder TDD 관련 스킬 추천해줘
/skill-finder what skills exist for iOS development
```

### Install skills

```
/skill-installer install security skills
/skill-installer Django 개발용 스킬 설치
```

## Domains

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

## Search Accuracy

Tested with 100 diverse queries (English + Korean):

| Metric | Score |
|--------|-------|
| Top-3 accuracy | **95%** |
| Top-1 accuracy | 85% |

Powered by PostgreSQL + pg_trgm + pgvector (OpenAI text-embedding-3-small).

## License

MIT
