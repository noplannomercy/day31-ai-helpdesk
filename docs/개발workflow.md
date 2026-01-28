# 개발 워크플로우 (Development Workflow)

## 목적
신규 프로젝트를 100% 완성도로 개발하기 위한 전체 프로세스

## 적용 시점
- 새 프로젝트 시작
- Knack 50 데일리 챌린지
- 신규 MVP 개발

---

## 전체 흐름

```
[Phase 1: 문서화]
SRS → Clarify #1 → Documents → CLAUDE.md → IMPLEMENTATION.md → Clarify #2

[Phase 2: 구현]
Build Phase 1~4 → npm run build

[Phase 3: 검증 & 수정]
verify → plan → fix → 사용자 테스트 → 100%
```

---

## 프롬프트 파일 구조

```
_prompts/
├─ 0.env_settings.md
├─ 1.clarify.md
├─ 2.SRS_Final_generate.md
├─ 3.document_generate.md
├─ 4.claude_md_generate.md
├─ 5.IMPLEMENTATION_generate.md
├─ 6.IMPLEMENTATION_clarify.md
├─ 7.phase1.md
├─ 8.phase2.md
├─ 9.phase3.md
├─ 10.phase4.md
└─ refactoring/
    ├─ 1.verify.md
    ├─ 2.plan.md
    └─ 3.fix_phase.md
```

---

## Phase 1: 문서화

### 1.clarify.md (Clarify #1 - 요구사항)

```markdown
[SRS 내용]

위 SRS를 검토하고 명확화 질문해줘.
- 모호한 요구사항
- 누락된 기능
- 기술적 제약사항
```

### 2.SRS_Final_generate.md

```markdown
Clarify #1 답변을 반영해서 최종 SRS 생성해줘.
specs/SRS.md로 저장.
```

### 3.document_generate.md

```markdown
SRS 기반으로 다음 문서 생성해줘:
- specs/REQUIREMENTS.md
- specs/ARCHITECTURE.md (Mermaid 다이어그램 포함)
- specs/DATABASE.md
```

### 4.claude_md_generate.md

```markdown
문서들 기반으로 CLAUDE.md 생성해줘.

## 규칙
- 60줄 제한 필수
- 핵심 컨텍스트만 포함
```

### 5.IMPLEMENTATION_generate.md

```markdown
문서들 기반으로 specs/IMPLEMENTATION.md 생성해줘.

## 구조
- Phase 1~4로 구분
- 각 Phase별 체크리스트
- 파일별 구현 내용
```

### 6.IMPLEMENTATION_clarify.md (Clarify #2 - 기술검증)

```markdown
IMPLEMENTATION.md 검토해줘.

## 확인 사항
1. 구현 순서 적절한지
2. 누락된 파일 없는지
3. 의존성 순서 맞는지
4. 예상 이슈 있는지

이게 유일한 검증 시점!
```

---

## Phase 2: 구현

### 7.phase1.md ~ 10.phase4.md

```markdown
IMPLEMENTATION.md의 Phase N을 구현해줘.

## 규칙
- Phase N의 항목들 순서대로 진행
- 완료 후 npm run build
- 에러 발생 시 즉시 수정
- 완료된 항목 ✅ 표시
```

---

## Phase 3: 검증 & 수정

### refactoring/1.verify.md

```markdown
IMPLEMENTATION.md와 실제 코드를 비교 분석해줘.

## 분석 내용
1. 완료된 기능 (실제 동작 확인됨)
2. TODO 항목 (파일명:라인번호 포함)
3. 우선순위 분류
   - P1: MVP 차단 (필수)
   - P2: 핵심 기능 (권장)
   - P3: 개선 사항 (선택)
4. 완성도 %
5. 권장 사항

## 출력
docs/YYYYMMDD_REPORT.md 파일로 생성해줘.

코드는 수정하지 마.
```

### refactoring/2.plan.md

```markdown
docs/YYYYMMDD_REPORT.md 기반으로 
IMPLEMENTATION.md에 새 Phase 추가해줘.

## Phase N: P1 Fixes (MVP 차단)
- [ ] P1 항목들 (리포트에서 가져오기)

## Phase N+1: P2 Fixes (핵심 기능)  
- [ ] P2 항목들 (리포트에서 가져오기)

기존 Phase는 유지.
```

### refactoring/3.fix_phase.md

```markdown
IMPLEMENTATION.md의 Phase N (P1/P2 Fixes) 항목들을 순서대로 구현해줘.

## 규칙
- Phase N의 항목들 순서대로 진행
- 각 항목 구현 후 테스트
- 전체 완료 후 npm run build
- 빌드 성공하면 완료된 항목 ✅ 표시
- 에러 발생 시 즉시 수정
```

---

## 흐름도

```
┌─────────────────────────────────────────────────┐
│              전체 개발 워크플로우                  │
└─────────────────────────────────────────────────┘

═══════════════════════════════════════════════════
                 Phase 1: 문서화
═══════════════════════════════════════════════════

SRS (초안)
    │
    ▼
1.clarify.md (Clarify #1)
    │
    ▼
┌─────────────────┐
│ 요구사항 명확화  │ ← 모호한 부분 질문
└─────────────────┘
    │
    ▼
2.SRS_Final_generate.md
    │
    ▼
┌─────────────────┐
│ specs/SRS.md    │ ← 최종 SRS
└─────────────────┘
    │
    ▼
3.document_generate.md
    │
    ▼
┌─────────────────┐
│ REQUIREMENTS.md │
│ ARCHITECTURE.md │ ← Mermaid 다이어그램
│ DATABASE.md     │
└─────────────────┘
    │
    ▼
4.claude_md_generate.md
    │
    ▼
┌─────────────────┐
│ CLAUDE.md       │ ← 60줄 제한!
└─────────────────┘
    │
    ▼
5.IMPLEMENTATION_generate.md
    │
    ▼
┌─────────────────┐
│ IMPLEMENTATION  │ ← Phase 1~4 구현 계획
│ .md             │
└─────────────────┘
    │
    ▼
6.IMPLEMENTATION_clarify.md (Clarify #2)
    │
    ▼
┌─────────────────┐
│ 기술 검증       │ ← 유일한 검증 시점!
│ (Claude.ai)    │
└─────────────────┘

═══════════════════════════════════════════════════
                 Phase 2: 구현
═══════════════════════════════════════════════════

7.phase1.md
    │
    ▼
┌─────────────────┐
│ Phase 1 구현    │ → npm run build
└─────────────────┘
    │
    ▼
8.phase2.md
    │
    ▼
┌─────────────────┐
│ Phase 2 구현    │ → npm run build
└─────────────────┘
    │
    ▼
9.phase3.md
    │
    ▼
┌─────────────────┐
│ Phase 3 구현    │ → npm run build
└─────────────────┘
    │
    ▼
10.phase4.md
    │
    ▼
┌─────────────────┐
│ Phase 4 구현    │ → npm run build
└─────────────────┘

═══════════════════════════════════════════════════
              Phase 3: 검증 & 수정
═══════════════════════════════════════════════════

refactoring/1.verify.md
    │
    ▼
┌─────────────────┐
│ 리포트 생성      │ → docs/YYYYMMDD_REPORT.md
│ (P1/P2/P3 식별) │
└─────────────────┘
    │
    ▼
refactoring/2.plan.md
    │
    ▼
┌─────────────────┐
│ Phase 추가      │ → IMPLEMENTATION.md
│ (P1→Phase 5)   │
│ (P2→Phase 6)   │
└─────────────────┘
    │
    ▼
refactoring/3.fix_phase.md
    │
    ▼
┌─────────────────┐
│ P1 구현         │ → npm run build
└─────────────────┘
    │
    ▼
refactoring/3.fix_phase.md (반복)
    │
    ▼
┌─────────────────┐
│ P2 구현         │ → npm run build
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 사용자 테스트    │ ← 직접 앱 동작 확인
└─────────────────┘
    │
    ├─── 문제 발견 → 1.verify.md (반복)
    │
    └─── 문제 없음 → 완료! ✅ 100%
```

---

## 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **Clarify #2가 품질 결정** | "어짜피 여기서 품질 판가름난다" |
| **구현 중 Clarify 금지** | 컨텍스트 드리프트 & 재작업 방지 |
| **Context Clear 후 Plan 금지** | 과도 설계 방지 |
| **CLAUDE.md 60줄 제한** | 임시파일 폭발 방지 |
| **Phase별 빌드 검증** | React 문법오류 조기 발견 |
| **Living Document** | IMPLEMENTATION.md 계속 업데이트 |

---

## 체크리스트

### Phase 1 완료 조건
- [ ] SRS.md 생성됨
- [ ] REQUIREMENTS.md 생성됨
- [ ] ARCHITECTURE.md 생성됨 (Mermaid 포함)
- [ ] DATABASE.md 생성됨
- [ ] CLAUDE.md 생성됨 (60줄 이하)
- [ ] IMPLEMENTATION.md 생성됨
- [ ] Clarify #2 완료 (Claude.ai 검증)

### Phase 2 완료 조건
- [ ] Phase 1~4 구현 완료
- [ ] 각 Phase 후 npm run build 성공
- [ ] IMPLEMENTATION.md 체크박스 업데이트

### Phase 3 완료 조건
- [ ] verify 리포트 생성됨
- [ ] P1 항목 0개 (또는 모두 수정)
- [ ] P2 항목 모두 수정 (권장)
- [ ] 사용자 테스트 통과
- [ ] 완성도 95%+ 달성

---

## 예상 소요 시간

| Phase | 소요 시간 | 비고 |
|-------|----------|------|
| Phase 1 | 1~2시간 | 문서화 + Clarify |
| Phase 2 | 2~4시간 | 복잡도에 따라 |
| Phase 3 | 1~2시간 | P1/P2 수량에 따라 |
| **합계** | **4~8시간** | Level 3~4 기준 |

---

## 참고

- **Day 6부터 적용:** 9단계 문서 기반 워크플로우
- **BP 근거:** Anthropic - "Claude performs dramatically better when it can verify its own work"
- **Level 2.5 문서 전략:** 파일명 + 함수 시그니처 + 핵심 로직 패턴

---

**버전:** 1.0  
**생성일:** 2026-01-28  
**검증:** Day 30 TeamWiki에서 Phase 3 테스트 완료