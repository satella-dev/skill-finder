---
name: skill-finder
description: "Search Claude Code skills/agents from a registry of 5,214 entries across 277 repos via MCP. Use when: 'find skills for', 'recommend skills', 'what skills exist for X', 'skill for agent'. Supports Korean and English."
---

# Skill Finder

Search the skill registry via the `skill-registry` MCP server.

## Prerequisites

The `skill-registry` MCP server must be configured. Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "skill-registry": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://skills.timblo.io/sse"]
    }
  }
}
```

Then restart Claude Code.

## Search Process

### Step 1: Choose the right MCP tool

| MCP Tool | When to use |
|----------|-------------|
| `mcp__skill-registry__search_skills` | Fast keyword search. Use for exact names, technologies. |
| `mcp__skill-registry__hybrid_search` | Most accurate. Understands meaning, handles Korean. Use for vague or conceptual queries. |

### Step 2: Run the search

For keyword search:
```
mcp__skill-registry__search_skills({ query: "security audit", limit: 10 })
```

For accurate hybrid search (recommended):
```
mcp__skill-registry__hybrid_search({ query: "보안 감사 에이전트를 위한 스킬", limit: 10 })
```

### Step 3: Present results

Group by grade:
- **A/A-**: Strongly recommended (production-quality)
- **B+/B**: Consider (useful)
- **Ungraded**: Other

### Step 4: Check alternatives (optional)

```
mcp__skill-registry__get_alternatives({ domain: "security" })
```

Domains: code-review, security, tdd-testing, design-ui, architecture, marketing

### Step 5: Agent role template (when creating agents)

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

# Skill Finder

You are a skill/agent registry search assistant. When the user needs to find skills, create an agent, or explore available capabilities, follow this process.

## Registry Location

Load the registry from one of these paths (try in order):
1. `~/.claude/registry/registry.json`
2. The project-local path: `_skill_repos/_registry/registry.json`

The registry contains ~201 entries across 13 domains with grades (A/A-/B+/B/B-/C+/C), skill/agent/command counts, tags, descriptions, and install commands.

## Search Process

### Step 1: Parse the Request

Extract from the user's query:
- **Domain intent**: Map keywords to one of the 13 domains (SECURITY, DEV_WORKFLOW, DATA_AI_ML, PM_BUSINESS, DEVOPS_INFRA, MOBILE, LANGUAGE_SPECIFIC, FRONTEND_DESIGN, CREATIVE, MARKETING_CONTENT, AUTOMATION, HEALTH_SCIENCE, PLATFORM_TOOLS)
- **Keywords**: Specific technologies, tools, or concepts mentioned
- **Role**: If creating an agent, identify the target role (code-reviewer, security-auditor, frontend-developer, devops-engineer, data-scientist, pm-product, mobile-developer, marketer, legal-advisor, music-producer)

### Step 2: Match Entries

Score each registry entry by:
1. **Domain match** (highest weight): entry.domain matches identified domain
2. **Tag match**: entry.tags overlap with extracted keywords
3. **Description match**: entry.description contains query terms
4. **Grade bonus**: A-grade entries score higher than B or C

Filter out entries with zero skills + zero agents + zero commands unless specifically relevant.

### Step 3: Present Results

Group results into three tiers:

**Strongly Recommended (A/A- grade, high relevance)**
- Show: name, grade badge, skill/agent/command counts, description
- Include install command

**Consider (B+/B grade, moderate relevance)**
- Show: name, grade badge, counts, one-line description

**Alternatives (lower grade or tangential relevance)**
- Show: name and brief note on why it might be useful

### Step 4: Check Alternatives

Look up `registry.alternatives` for the matched domain. If an alternatives entry exists, present:
- The purpose
- Available options with brief descriptions
- The recommended combination

### Step 5: Agent Creation Support

If the user is creating an agent, also check `registry.role_templates`. Present:
- Recommended domains for the role
- Specific skills to reference in the agent's system prompt
- A suggested AGENTS.md snippet referencing the skills

Example agent snippet:
```yaml
# In AGENTS.md
## security-auditor
Description: Security audit agent
Skills:
  - mukul975/Anthropic-Cybersecurity-Skills (MITRE mapping)
  - trailofbits/skills (audit methodology)
  - prompt-security/clawsec (agent security)
```

## Domain Quick Reference

| Domain | Label | Top Picks |
|--------|-------|-----------|
| SECURITY | 보안 | mukul975 (759 skills), trailofbits (24 agents), clawsec (26 skills) |
| DEV_WORKFLOW | 개발 워크플로우 | ECC (151+36+68), task-master (50 cmds), obra/superpowers (33 skills) |
| DATA_AI_ML | AI/ML/데이터 | K-Dense-AI (134 science), Orchestra-Research (92 ML), wanshuiyin (51 research) |
| PM_BUSINESS | PM/비즈니스 | deanpeters (75 PM), lawvable (53 legal), charlie-cfo (finance) |
| DEVOPS_INFRA | DevOps/인프라 | cc-devops (31 skills), terraform-skill, aws-skills |
| MOBILE | 모바일 | ios-simulator (A), apple-hig (14 skills), expo (12 skills) |
| LANGUAGE_SPECIFIC | 언어 특화 | mcollina/Node.js (A-), mattpocock/TS, rails-conventions |
| FRONTEND_DESIGN | 프론트엔드/디자인 | ui-ux-pro-max (7 skills), ibelick (A-), platform-design (A-) |
| CREATIVE | 크리에이티브 | music-skills (97 skills, A), humanizer, hand-drawn-diagrams |
| MARKETING_CONTENT | 마케팅/콘텐츠 | marketingskills (33+63), aso-skills (30), claude-seo (15 agents) |
| AUTOMATION | 자동화 | n8n-skills (36), n8n_agent (20 cmds), slack-tools |
| HEALTH_SCIENCE | 건강/과학 | Claude-Ally-Health (23+118), materials-simulation |
| PLATFORM_TOOLS | 플랫폼/도구 | claude-code-flow (134+105+168), claudekit (46 agents), compound-engineering (41 skills) |

## Install Pattern

For any selected skill, provide the install command from the registry entry. The standard pattern is:
```bash
git clone --depth 1 https://github.com/{owner}/{repo}.git
cp -r skills/ ~/.claude/skills/    # if skills exist
cp -r agents/ ~/.claude/agents/    # if agents exist
cp -r commands/ ~/.claude/commands/ # if commands exist
```

Always verify the entry's actual install command from the registry before presenting it.
