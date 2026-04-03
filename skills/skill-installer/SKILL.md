---
name: skill-installer
description: "Search and install Claude Code skills/agents from a registry of 5,214 entries. Use when: 'install skill', 'find and install', 'add skill for X', 'setup skills for agent'."
---

# Skill Installer

스킬을 검색하고 설치합니다. 검색 → 필터 → 승인 → 설치.

## 사용법

1. 검색: `mcp__skill-registry__hybrid_search({ query: "검색어", limit: 10 })`
2. 사용자가 선택
3. 설치:

```bash
TEMP=$(mktemp -d)
git clone --depth 1 https://github.com/{owner}/{repo}.git "$TEMP/repo"
[ -d "$TEMP/repo/skills" ] && cp -r "$TEMP/repo/skills/"* ~/.claude/skills/
[ -d "$TEMP/repo/agents" ] && cp -r "$TEMP/repo/agents/"* ~/.claude/agents/
rm -rf "$TEMP"
```

글로벌(`~/.claude/`) 또는 프로젝트(`.claude/`) 중 사용자에게 확인.

## 설치 (MCP 서버 연결)

```bash
claude mcp add --transport sse skill-registry https://skills.timblo.io/sse --scope user
```
