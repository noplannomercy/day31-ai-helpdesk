# 구현 프롬프트 (Sub-agent 버전)

## Phase별 구현 프롬프트

### Phase 1~N 구현

```markdown
Read specs/IMPLEMENTATION.md

Deploy coder-expert sub-agent to implement Phase N.

Requirements:
- IMPLEMENTATION.md의 Phase N 순서대로 구현
- 각 파일 구현 후 저장
- Phase 완료 후 npm run build 실행
- 빌드 에러 0개 확인
- 완료된 항목 IMPLEMENTATION.md에 ✅ 표시
- Context7 MCP로 최신 문서 참조

Stop after Phase N completion.
Report build result.
```

---

### Phase 구현 후 리뷰

```markdown
Read specs/IMPLEMENTATION.md

Deploy code-reviewer sub-agent to review Phase N.

Review:
- 코드 품질 (가독성, 유지보수성)
- IMPLEMENTATION.md 요구사항 충족 여부
- 에러 핸들링 적절성
- TypeScript 타입 안정성
- 보안 취약점

Output:
- 검토 리포트
- 우선순위별 개선사항 (Critical/High/Medium/Low)
```

---

### 병렬 구현 (독립적인 파일들)

```markdown
Read specs/IMPLEMENTATION.md

Deploy 2 coder-expert sub-agents in parallel:

Agent 1: Phase N의 컴포넌트 파일들
- components/ 폴더 파일 구현

Agent 2: Phase N의 API/액션 파일들  
- app/api/ 또는 actions/ 파일 구현

Each agent:
- 독립적으로 작업
- 완료 후 npm run build
- Context7 MCP 사용

Run in parallel now.
```

---

## 사용 예시

### Day 31 AI Help Desk - Phase 1 구현

```markdown
Read specs/IMPLEMENTATION.md

Deploy coder-expert sub-agent to implement Phase 1.

Requirements:
- Phase 1 (Project Setup & Core UI) 순서대로 구현
- lib/db/schema.ts 먼저 (다른 파일 의존성)
- 완료 후 npm run build
- 빌드 성공 확인
- Context7 MCP로 Drizzle, shadcn/ui 문서 참조

Stop after Phase 1 completion.
```

---

## Sub-agent 파일 위치

프로젝트에 `.claude/agents/` 폴더 생성 후 복사:

```
.claude/
└── agents/
    ├── arch-expert.md
    ├── ui-expert.md
    ├── db-expert.md
    ├── api-expert.md
    ├── coder-expert.md
    └── code-reviewer.md
```

또는 Claude Code에서 `/agents create` 명령으로 직접 생성.
