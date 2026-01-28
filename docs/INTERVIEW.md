# TeamWiki Requirements Clarification Interview

## Interview Date
2026-01-27

## Overview
This document contains clarification decisions for all ambiguous requirements and edge cases identified in the TeamWiki SRS before implementation begins.

---

## Session 1: Core Features (Authentication, Editor, File Upload)

### Q1: 회원가입 시 이메일 인증이 필요한가요?
**Answer**: 불필요 - 이메일만 입력하면 바로 사용

**Rationale**:
- 가장 빠른 온보딩 경험 제공
- MVP 단계에 적합한 진입장벽 최소화
- 스팸 계정 위험은 존재하지만 팀 기반 워크스페이스이므로 초대 기반으로 완화 가능

**Implementation Notes**:
- 이메일 형식 검증만 수행
- 추후 이메일 인증 기능 추가 가능하도록 설계

### Q2: 비밀번호 요구사항은 어떻게 설정할까요?
**Answer**: 간단 - 6자 이상만

**Rationale**:
- 사용자 편의 우선
- MVP 빠른 테스트에 적합
- 기업용으로 확장 시 정책 강화 가능

**Implementation Notes**:
- 최소 길이: 6자
- 특수문자, 숫자, 대소문자 요구사항 없음
- bcrypt/argon2 해싱은 필수

### Q3: 소셜 로그인(Google/GitHub)을 지원할까요?
**Answer**: Google 로그인 지원

**Rationale**:
- 기업 팀 워크스페이스에 가장 적합
- Google Workspace 사용 팀이 많음
- NextAuth.js로 쉽게 구현 가능

**Implementation Notes**:
- NextAuth.js Google Provider 사용
- 이메일/비밀번호 방식과 병행 지원
- GitHub 로그인은 추후 확장 시 고려

### Q4: 이미지 업로드 시 어떤 형식을 지원할까요?
**Answer**: 기본 - PNG, JPG, GIF만

**Rationale**:
- 가장 일반적인 형식
- 처리 간단
- MVP에 적합

**Implementation Notes**:
- 지원 형식: `.png`, `.jpg`, `.jpeg`, `.gif`
- MIME 타입 검증 필수
- 추후 WebP, SVG 확장 가능

### Q5: 이미지 업로드 시 자동 최적화(압축)를 할까요?
**Answer**: 자동 압축 - 품질 유지하며 크기 감소

**Rationale**:
- 저장공간/대역폭 절감
- 사용자 경험 향상 (빠른 로딩)
- 1MB 이상 이미지 자동 압축

**Implementation Notes**:
- Sharp 라이브러리 사용 권장
- 1MB 이상 이미지만 압축
- 품질 80-85% 유지
- 최대 너비/높이: 1920px

### Q6: 문서 삭제 시 첨부된 이미지는 어떻게 처리할까요?
**Answer**: 즉시 삭제 - 문서와 함께 이미지도 삭제

**Rationale**:
- 저장공간 절감
- MVP에 적합한 단순한 정책
- 부분 복원은 불가하지만 구현 간단

**Implementation Notes**:
- 문서 삭제 시 연결된 이미지 파일도 삭제
- 트랜잭션으로 처리하여 일관성 보장
- 추후 휴지통 기능 추가 시 30일 유예 고려

---

## Session 2: AI & Search

### Q7: AI 태그 추천과 요약은 언제 실행할까요?
**Answer**: 저장 시 자동 - 문서 저장 시 자동 처리

**Rationale**:
- 사용자 조작 불필요
- 항상 최신 AI 분석 유지
- "자동화된 AI" 브랜드 이미지 강화

**Implementation Notes**:
- 문서 저장 완료 후 백그라운드 작업으로 AI 호출
- API 실패 시 재시도 로직 (최대 3회)
- 사용자는 저장 즉시 다음 작업 가능 (비동기)

### Q8: AI가 제안한 태그/요약을 사용자가 수정할 수 있나요?
**Answer**: 수락/거부/수정 가능

**Rationale**:
- AI 추천을 참고로 사용자가 최종 결정
- 유연성 최대화
- 잘못된 AI 분류에 대한 사용자 통제

**Implementation Notes**:
- AI 생성 후 "제안된 태그" UI 표시
- 사용자가 개별 태그 수락/거부 가능
- 태그 추가/수정/삭제 자유
- 요약은 별도 섹션에 표시, 편집 가능

### Q9: 문서 내용이 OpenRouter API로 전송되는 것에 대한 정책은?
**Answer**: 전체 내용 전송 - AI 분석을 위해 필수

**Rationale**:
- AI 기능 정상 작동을 위해 필수
- OpenRouter는 30일 후 데이터 삭제 정책
- 프라이버시 정책에 명시 필요

**Implementation Notes**:
- 프라이버시 정책에 "AI 기능을 위해 문서 내용이 OpenRouter로 전송됨" 명시
- OpenRouter 데이터 보관 정책 (30일) 안내
- 민감 정보 처리 가이드라인 제공
- 추후 "AI 비활성화" 옵션 고려

### Q10: 검색 기능이 댓글도 검색하나요?
**Answer**: 문서 + 댓글 모두 검색

**Rationale**:
- 포괄적 검색
- 댓글에 있는 중요 정보도 찾을 수 있음
- 팀 지식 관리에 유리

**Implementation Notes**:
- 검색 인덱스: 문서 제목 + 내용 + 댓글 내용
- 검색 결과에 출처 표시 (문서 본문 vs 댓글)
- 댓글 작성자와 날짜 표시
- PostgreSQL Full-Text Search 또는 별도 검색 엔진 사용

---

## Session 3: Collaboration (Permissions, Sharing, Comments)

### Q11: Viewer 역할을 가진 사용자가 댓글을 달 수 있나요?
**Answer**: 댓글 가능 - Viewer도 댓글 작성 OK

**Rationale**:
- 협업 활성화
- 피드백 수집 용이
- 읽기 전용과 의미 약간 희석되지만 실용성 우선

**Implementation Notes**:
- Viewer: 읽기 + 댓글 작성/수정(자신 것만) 가능
- 문서 편집/삭제는 불가
- 댓글 권한은 문서 권한과 독립적으로 관리

### Q12: Editor 역할이 다른 사람이 만든 문서를 삭제할 수 있나요?
**Answer**: 삭제 불가 - 자신이 만든 문서만

**Rationale**:
- 실수로 중요 문서 삭제 방지
- 안전성 향상
- 팀 관리는 Admin 역할

**Implementation Notes**:
- Editor 권한:
  - 자신이 만든 문서: 생성/읽기/수정/삭제
  - 다른 사람 문서: 읽기/수정만 (편집 권한 있는 경우)
- 삭제 권한: 문서 작성자 또는 Admin/Owner만

### Q13: 팀원을 워크스페이스에서 제거하면 그 사람이 만든 문서는 어떻게 되나요?
**Answer**: 문서 유지 - 작성자만 변경

**Rationale**:
- 지식 보존
- 작성자 "탈퇴 멤버"로 표시
- 문서 소유권 이전 옵션 제공

**Implementation Notes**:
- 문서는 삭제하지 않고 유지
- 작성자 표시: "[탈퇴한 사용자] (이전: 홍길동)"
- Admin이 문서 소유권을 다른 멤버에게 이전 가능
- 탈퇴 멤버 문서 필터 기능 제공

### Q14: 댓글을 수정/삭제할 수 있는 사람은?
**Answer**: 작성자 + Admin

**Rationale**:
- 일반적인 SNS 패턴
- 자기 댓글만 수정
- Admin은 부적절 내용 삭제 가능

**Implementation Notes**:
- 댓글 작성자: 수정/삭제 가능
- Admin/Owner: 모든 댓글 삭제 가능 (수정은 불가)
- 댓글 수정 이력 기록 (선택 사항)
- "해결됨" 표시는 문서 작성자 + 댓글 작성자 가능

---

## Session 4: Data & Performance

### Q15: 버전 히스토리를 얼마나 오래 보관할까요?
**Answer**: 영구 보관 - 모든 버전 유지

**Rationale**:
- 완전한 이력 추적
- 감사/규제 대응에 유리
- 데이터베이스 크기 증가는 현대 스토리지 비용으로 감당 가능

**Implementation Notes**:
- 모든 저장 시점의 버전 기록
- 버전 테이블에 content (JSON) 저장
- 자동 저장 시 버전 생성 여부는 변경 감지로 결정 (내용 변경 시만)
- 버전 간 diff 알고리즘 구현 (효율적 저장)

### Q16: 문서의 최대 크기(글자 수)를 제한할까요?
**Answer**: 제한 없음 - 원하는 만큼 작성

**Rationale**:
- 유연성 최대화
- 대용량 문서 가능 (기술 문서, 가이드)
- 성능 문제 발생 시 추후 제한 검토

**Implementation Notes**:
- DB 컬럼: TEXT (무제한) 또는 JSON
- 프론트엔드 에디터 성능 모니터링
- 10만자 이상 문서는 로딩 최적화 (가상 스크롤 등)
- 백엔드 타임아웃 설정 (60초)

### Q17: 폴더의 최대 중첩 깊이는?
**Answer**: 5단계 - 적당한 깊이

**Rationale**:
- 대부분 조직에 충분
- UI 가독성 유지
- 지나치게 복잡한 구조 방지

**Implementation Notes**:
- 최대 깊이: 5단계
- 폴더 생성 시 깊이 검증
- UI에 깊이 제한 안내
- 구조: 워크스페이스 > 폴더1 > 폴더2 > 폴더3 > 폴더4 > 폴더5

### Q18: 데이터 암호화는 어떻게 할까요?
**Answer**: 전송/저장 모두 암호화

**Rationale**:
- HTTPS + DB 암호화
- 보안 최대화
- 표준 보안 관행

**Implementation Notes**:
- 전송 중 암호화: HTTPS (TLS 1.3)
- 저장 암호화:
  - 비밀번호: bcrypt 해싱
  - 민감 데이터: AES-256
  - PostgreSQL TDE (Transparent Data Encryption) 또는 애플리케이션 레벨 암호화
- 공유 링크 토큰: 랜덤 UUID + 해싱

---

## Session 5: Edge Cases & Polish

### Q19: 문서 저장 중 네트워크 오류가 발생하면?
**Answer**: 로컬 저장 + 재시도

**Rationale**:
- LocalStorage에 임시 저장 후 자동 재시도
- 데이터 손실 방지
- 사용자 경험 향상

**Implementation Notes**:
- 저장 실패 시 LocalStorage에 백업
- 네트워크 복구 감지 후 자동 재시도 (최대 5회)
- 재시도 중 사용자 알림 표시
- 재시도 실패 시 "저장 실패, 수동 재시도" 버튼 제공
- 로컬 저장된 데이터는 성공 저장 후 삭제

### Q20: MVP 제약사항 '최대 100개 문서' 초과 시?
**Answer**: 경고 + 생성 차단

**Rationale**:
- "문서 한계 초과" 메시지
- 생성 버튼 비활성화
- 명확한 제한

**Implementation Notes**:
- 문서 개수 카운터 표시 (95/100)
- 100개 도달 시:
  - "문서 한계에 도달했습니다" 모달 표시
  - [+ 새 문서] 버튼 비활성화
  - 기존 문서 삭제 권장 안내
- 관리자에게 알림 전송
- Pro 플랜 안내 (추후 확장 시)

### Q21: 같은 제목의 문서를 여러 개 만들 수 있나요?
**Answer**: 허용 - 제목 중복 OK

**Rationale**:
- 유연성
- 동명의 회의록 등 가능 (2024-01-30 회의록, 2024-01-31 회의록)
- URL은 ID 기반으로 구분

**Implementation Notes**:
- 제목 중복 허용
- URL: `/documents/{uuid}` (제목 아닌 ID 사용)
- 검색/목록에서 제목 + 작성일시로 구분 표시
- 중복 제목 경고는 표시하지 않음

### Q22: 모바일 반응형 디자인 우선순위는?
**Answer**: 데스크톱 우선 - 모바일은 기본만

**Rationale**:
- 모바일에서도 사용 가능하나 최적화 안함
- MVP에 적합
- 개발 시간 절감
- 주 사용 환경은 데스크톱

**Implementation Notes**:
- Tailwind CSS 반응형 클래스 사용
- 모바일에서 레이아웃 깨짐 없도록 기본 반응형 처리
- 복잡한 터치 제스처는 구현하지 않음
- 에디터는 모바일에서도 기본 편집 가능하도록
- 추후 모바일 앱 또는 최적화 고려

---

## Summary of Key Decisions

### Authentication & Onboarding
- ✅ 이메일 인증 불필요 (빠른 온보딩)
- ✅ 비밀번호 6자 이상 (간단한 정책)
- ✅ Google 소셜 로그인 지원

### File Upload & Media
- ✅ PNG, JPG, GIF 형식만 지원
- ✅ 1MB 이상 이미지 자동 압축 (품질 80-85%)
- ✅ 문서 삭제 시 이미지도 즉시 삭제

### AI Features
- ✅ 문서 저장 시 AI 자동 실행 (태그/요약)
- ✅ AI 제안은 사용자가 수락/거부/수정 가능
- ✅ 문서 전체 내용을 OpenRouter로 전송 (프라이버시 정책 명시)
- ✅ 검색은 문서 + 댓글 모두 포함

### Collaboration & Permissions
- ✅ Viewer도 댓글 작성 가능
- ✅ Editor는 자신의 문서만 삭제 가능
- ✅ 탈퇴 멤버의 문서는 유지 (작성자 "탈퇴 멤버"로 표시)
- ✅ 댓글 수정/삭제: 작성자 + Admin

### Data & Performance
- ✅ 버전 히스토리 영구 보관
- ✅ 문서 크기 제한 없음
- ✅ 폴더 최대 5단계 깊이
- ✅ HTTPS + DB 암호화 (TLS 1.3 + bcrypt)

### Edge Cases & Constraints
- ✅ 저장 실패 시 LocalStorage + 자동 재시도
- ✅ 100개 문서 초과 시 생성 차단
- ✅ 제목 중복 허용 (ID로 구분)
- ✅ 데스크톱 우선, 모바일 기본 반응형

---

## Features Excluded (Skipped)
None - All critical features were addressed

---

## Open Questions (Needs Further Discussion)

### 1. 실시간 협업 (Feature 2) - Phase 4로 연기
- **Question**: Yjs vs Supabase Realtime vs Pusher?
- **Note**: MVP에서 제외되었으나, 추후 구현 시 기술 스택 결정 필요

### 2. 백링크 (Feature 5) - Phase 4로 연기
- **Question**: 링크 그래프 시각화를 포함할지?
- **Note**: 기본 백링크 목록은 구현, 시각화는 선택

### 3. 알림 시스템 (Feature 14) - Phase 4로 연기
- **Question**: 이메일 알림 (Resend) vs 인앱 알림만?
- **Note**: MVP는 인앱 알림만, 이메일은 추후 확장

### 4. Slack 연동 - 선택 사항
- **Question**: MVP에 포함할지?
- **Note**: API 연동 복잡도 고려, Phase 4 또는 Post-MVP

### 5. 파일 업로드 서비스
- **Question**: Uploadthing vs Supabase Storage vs S3?
- **Note**: 비용/성능/구현 난이도 비교 필요

### 6. AI 모델 선택
- **Question**: `anthropic/claude-sonnet-4` vs `openai/gpt-4o`?
- **Note**: 비용/성능/한국어 품질 테스트 필요

---

## Next Steps

1. ✅ Interview completed and documented
2. ⏸️ **STOP HERE** - Do not begin implementation
3. ⏭️ User will proceed to Step 2: Generate SRS_Final.md
4. ⏭️ Implementation will begin only after SRS_Final approval

---

## Interview Statistics
- Total Questions Asked: 22
- Sessions Completed: 5
- Features Clarified: 20
- Skipped Questions: 0
- Time Spent: ~15 minutes

---

## Document Version
- Version: 1.0
- Created: 2026-01-27
- Last Updated: 2026-01-27
- Status: Complete ✅
