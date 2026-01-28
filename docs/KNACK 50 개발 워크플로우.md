# Knack 50 신규 개발 워크플로우

## 개요

Claude Code를 활용한 신규 웹앱 개발 표준 워크플로우.
BP(Best Practice) 기반으로 검증과 반복을 강화한 버전.

---

## Phase 1: 문서화

### 1-1. SRS 작성
- 간단한 요구사항 정의
- 핵심 기능 나열

### 1-2. SRS Clarify
- 요구사항 명확화 인터뷰
- 빠진 기능 파악
- Skip 전략 적용 (Level별)

### 1-3. Document 병렬 작성
- REQUIREMENTS.md
- ARCHITECTURE.md (Mermaid 포함)
- DATABASE.md
- COMPONENTS.md

### 1-4. CLAUDE.md 작성
- 60줄 제한 필수
- 핵심 컨텍스트만

### 1-5. IMPLEMENTATION.md 작성
- Phase별 구현 계획
- 체크박스 형태
- 예상 시간

### 1-6. Clarify #2 (기술 검증)
- 유일한 검증 시점
- Claude.ai에서 Co-pilot 검증
- 여기서 품질 판가름

---

## Phase 2: 구현 & 검증 (보강)

### 2-1. 구현
- IMPLEMENTATION.md 따라 구현
- Phase별 진행
- 각 Phase 완료 후 npm run build

### 2-2. 빌드 검증
- npm run build 에러 체크
- React 문법 오류 방지
- 에러 있으면 즉시 수정

### 2-3. 완성도 검증 ← 추가!
```
프롬프트:
"IMPLEMENTATION.md와 실제 코드 비교해서
1. 완료된 것
2. TODO 항목 (파일:라인 포함)
3. 완성도 %
코드 수정하지 말고 분석만 해줘."
```

### 2-4. TODO 우선순위 정리 ← 추가!
- P1: MVP 차단 (필수)
- P2: 핵심 기능 (권장)
- P3: 개선 사항 (선택)

### 2-5. 반복 구현 ← 추가!
```
프롬프트:
"P1 항목 순서대로 하나씩 구현해줘.
각 항목 완료 후 npm run build."
```

### 2-6. 반복 (100% 될 때까지)
```
검증 → TODO 정리 → 구현 → 검증 → ...
```

### 2-7. IMPLEMENTATION.md 업데이트 (Living Document)
- 모든 체크박스 완료 확인
- 실제 구현 상태 반영
- 새로운 TODO 섹션 추가

---

## IMPLEMENTATION.md 관리 정책

### BP 근거
> "All work emanates from an ever-evolving but controlled specification" - Red Hat
> "Specification becomes your single source of truth" - IBM

### 핵심 원칙
1. **Living Document** - 고정이 아닌 계속 진화
2. **Single Source of Truth** - Claude가 참조하는 유일한 진실
3. **Document Stable Things** - 확정된 상태만 반영
4. **Update Only When It Hurts** - 필요할 때만 업데이트

### 업데이트 타이밍
| 시점 | 업데이트 내용 |
|------|--------------|
| 구현 완료 후 | 체크박스 ✅ 표시 |
| 검증 후 | TODO 섹션 추가/수정 |
| 반복 구현 후 | 완성도 % 반영 |

### 문서 구조 (검증 후 추가)
```markdown
## 🚨 CURRENT STATUS
- 완성도: X%
- 마지막 검증: YYYY-MM-DD

## 📋 TODO (검증 결과)
### P1 - MVP 차단
- [ ] 항목 (파일:라인)

### P2 - 핵심 기능
- [ ] 항목

### P3 - 개선 사항
- [ ] 항목
```

### 백업 (선택)
- 원래 계획 보존 필요시: `IMPLEMENTATION_v1.md`로 백업
- 히스토리/비교 분석 목적

---

## 흐름도

```
[Phase 1: 문서화]
SRS → Clarify #1 → Documents → CLAUDE.md → IMPLEMENTATION.md → Clarify #2
                                                                    ↓
[Phase 2: 구현 & 검증]
구현 → 빌드 체크 → 완성도 검증 → TODO 정리 → 반복 구현
                        ↑                         ↓
                        └─────── 반복 ─────────────┘
                                                  ↓
                                            100% 완성 ✅
```

---

## Phase 2 Before vs After

| 항목 | Before | After (보강) |
|------|--------|-------------|
| 빌드 체크 | ✅ | ✅ |
| 완성도 검증 | ❌ | ✅ |
| TODO 파악 | ❌ | ✅ |
| 우선순위 분류 | ❌ | ✅ |
| 반복 구현 | ❌ | ✅ |
| 예상 결과 | 60-70% | 100% |

---

## BP 근거

### Anthropic 공식
> "Claude performs dramatically better when it can verify its own work"

### 핵심 원칙
1. **검증 필수** - AI 출력은 검증 전까지 신뢰하지 않음
2. **반복 개선** - 2-3회 반복으로 품질 크게 향상
3. **피드백 루프** - 테스트/빌드로 검증
4. **단계 스킵 금지** - Plan → Implement → Validate 순서 지키기

### 추천 워크플로우 패턴
```
Research → Plan → Implement → Validate (반복)
```

---

## 적용 예시

### Day 30 TeamWiki 상황
```
현재: 65% 완성, TODO 20+ 개

Phase 2 보강 적용:
1. 완성도 검증 → 65%, P1 7개, P2 5개 파악
2. P1 순서대로 구현
3. 각 항목 후 빌드 체크
4. 다시 검증 → 80%
5. 반복...
6. 100% 완성
```

---

## 버전
- v1.0: 2026-01-28 - Phase 2 보강 버전
- v1.1: 2026-01-28 - IMPLEMENTATION.md Living Document 정책 추가

---

## 프롬프트 템플릿 (표준화 진행 중)

### 2-3. 완성도 검증 프롬프트
```markdown
IMPLEMENTATION.md와 실제 코드를 비교 분석해줘.

1. 완료된 기능 (실제 동작 확인됨)
2. TODO 항목 (파일명:라인번호 포함)
3. 우선순위 분류
   - P1: MVP 차단 (필수)
   - P2: 핵심 기능 (권장)
   - P3: 개선 사항 (선택)
4. 완성도 %

코드 수정하지 말고 분석만 해줘.
```

### 2-4. IMPLEMENTATION.md 업데이트 프롬프트
```markdown
방금 분석 결과를 IMPLEMENTATION.md에 반영해줘.

추가할 섹션:
## 🚨 CURRENT STATUS
## 📋 TODO (검증 결과)

기존 내용은 유지하고 상단에 추가.
```

### 2-5. 반복 구현 프롬프트
```markdown
IMPLEMENTATION.md의 P1 항목들 순서대로 구현해줘.

규칙:
- 한 항목씩 구현
- 각 항목 완료 후 npm run build
- 완료된 항목은 IMPLEMENTATION.md에 ✅ 표시
```

### 검증 완료 후 다음 반복 프롬프트
```markdown
다시 검증해줘.
IMPLEMENTATION.md와 실제 코드 비교해서 완성도 % 업데이트.
```