# 리팩토링 워크플로우 (Refactoring Workflow)

## 목적
기존 프로젝트의 완성도를 100%로 올리기 위한 검증 & 수정 프로세스

## 적용 시점
- 구현 완료 후 미완성 항목 존재
- 기존 프로젝트 품질 개선
- MVP 완성도 확인 필요

---

## 프롬프트 파일 구조

```
_prompts/refactoring/
├─ 1.verify.md      → 리포트 생성
├─ 2.plan.md        → Phase 추가
├─ 3.fix_phase.md   → 구현 + 테스트 + 빌드
└─ (필요시 반복)
```

---

## 프롬프트 내용

### 1.verify.md

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

### 2.plan.md

```markdown
docs/YYYYMMDD_REPORT.md 기반으로 
IMPLEMENTATION.md에 새 Phase 추가해줘.

## Phase N: P1 Fixes (MVP 차단)
- [ ] P1 항목들 (리포트에서 가져오기)

## Phase N+1: P2 Fixes (핵심 기능)  
- [ ] P2 항목들 (리포트에서 가져오기)

기존 Phase는 유지.
```

### 3.fix_phase.md

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
│              리팩토링 워크플로우                   │
└─────────────────────────────────────────────────┘

1.verify.md
    │
    ▼
┌─────────────────┐
│ 리포트 생성      │ → docs/YYYYMMDD_REPORT.md
│ (P1/P2/P3 식별) │
└─────────────────┘
    │
    ▼
2.plan.md
    │
    ▼
┌─────────────────┐
│ Phase 추가      │ → IMPLEMENTATION.md 업데이트
│ (P1→Phase N)   │
│ (P2→Phase N+1) │
└─────────────────┘
    │
    ▼
3.fix_phase.md
    │
    ▼
┌─────────────────┐
│ P1 구현         │ → 구현 + 테스트 + 빌드
│ (Phase N)      │
└─────────────────┘
    │
    ▼
3.fix_phase.md (반복)
    │
    ▼
┌─────────────────┐
│ P2 구현         │ → 구현 + 테스트 + 빌드
│ (Phase N+1)    │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ 사용자 테스트    │ ← 직접 앱 동작 확인
└─────────────────┘
    │
    ├─── 문제 발견 → 1.verify.md (반복)
    │
    └─── 문제 없음 → 완료! ✅
```

---

## 사이클 요약

```
verify → plan → fix P1 → fix P2 → 사용자 테스트
                                        │
                     문제 발견? ────────┤
                        │               │
                       Yes             No
                        │               │
                        ▼               ▼
                     verify          완료! 🎉
                     (반복)
```

---

## 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **Living Document** | IMPLEMENTATION.md는 계속 업데이트 |
| **Phase 단위** | P1 완료 → P2 완료 → 테스트 |
| **빌드 검증** | 각 Phase 완료 후 `npm run build` |
| **사용자 검증** | Claude 빌드 후 직접 테스트 필수 |

---

## 검증 결과

### Day 30: TeamWiki (2026-01-28)

| 단계 | 결과 |
|------|------|
| 1.verify.md | ✅ 72% 완성도, P1 7개, P2 10개 식별 |
| 2.plan.md | ✅ Phase 11, 12 추가 |
| 3.fix_phase.md (P1) | ✅ 7/7 완료 |
| 3.fix_phase.md (P2) | ✅ 7/7 완료 |
| 사용자 테스트 | ✅ 거의 동작 (일부 버그) |
| 최종 완성도 | **72% → 95%** |

### Day 29: ContractRiskAnalyzer (2026-01-28)

| 단계 | 결과 |
|------|------|
| 1.verify.md | ✅ 95% 완성도, P1 0개 |
| 2.plan.md | 불필요 (수정 항목 없음) |
| 최종 완성도 | **95%** (이미 완성) |

---

## 참고

- **BP 근거:** Anthropic 공식 - "Claude performs dramatically better when it can verify its own work"
- **반복 개선:** 2-3회 반복으로 품질 크게 향상
- **단계 스킵 금지:** Plan → Implement → Validate

---

**버전:** 1.0  
**생성일:** 2026-01-28  
**검증:** Day 30 TeamWiki에서 테스트 완료