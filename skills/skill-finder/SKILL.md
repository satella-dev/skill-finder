---
name: skill-finder
description: "Search Claude Code skills/agents from a registry of 5,214 entries across 277 repos. Use when: 'find skills for', 'recommend skills', 'what skills exist for X', 'skill for agent'. Supports Korean and English."
---

# Skill Finder

5,214개 스킬/에이전트를 검색합니다. 13개 도메인, 한국어 지원.

## 사용법

검색:
```
mcp__skill-registry__hybrid_search({ query: "검색어", limit: 10 })
```

대안 비교:
```
mcp__skill-registry__get_alternatives({ domain: "security" })
```

에이전트 역할 추천:
```
mcp__skill-registry__get_role_template({ role: "security-auditor" })
```

도메인 목록:
```
mcp__skill-registry__list_domains()
```

## 설치 (MCP 서버 연결)

```bash
claude mcp add --transport sse skill-registry https://skills.timblo.io/sse --scope user
```

## 프로젝트 컨텍스트

`.skill-context.json`이 프로젝트 루트에 있으면 기술스택에 맞는 결과를 우선 추천합니다. 없으면 첫 검색 시 자동 생성됩니다.
