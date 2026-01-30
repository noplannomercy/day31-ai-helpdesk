# Phase 3 수동 테스트 가이드

## 테스트 진행 방법

1. 브라우저에서 `http://localhost:3002` 접속
2. 아래 시나리오를 순서대로 진행
3. 각 항목 완료 시 이 문서의 체크박스 업데이트
4. 완료 후 `docs/phase3_varify.md` 에 최종 결과 반영

---

## 0. 사전 준비

### [ ] 0-1. Admin 로그인
- URL: `http://localhost:3002/login`
- 계정: `admin@example.com` / `Admin123!`
- 예상: 대시보드로 리다이렉트

### [ ] 0-2. 테스트 계정 생성
- URL: `/admin/users`
- Agent 2명:
  - [ ] `agent1@example.com` / `Agent123!`
  - [ ] `agent2@example.com` / `Agent123!`
- Manager 1명:
  - [ ] `manager@example.com` / `Manager123!`
- Customer 2명 (회원가입):
  - [ ] `customer1@example.com` / `Customer123!`
  - [ ] `customer2@example.com` / `Customer123!`

### [ ] 0-3. Agent 온라인 상태 설정
- URL: `/admin/users`
- agent1, agent2 온라인 스위치 켜기

---

## 1. 카테고리 관리 (Admin)

### [ ] 1-1. 기본 카테고리 확인
- URL: `/admin/categories`
- 예상: 결제, 배송, 반품/교환, 계정, 기타 (5개)

### [ ] 1-2. 카테고리 생성
- "제품 문의" 생성
- 정렬 순서: 6

### [ ] 1-3. 카테고리 수정
- "제품 문의" → "제품 상담" 변경

### [ ] 1-4. 카테고리 삭제
- "제품 상담" 삭제

---

## 2. 티켓 생성 (Customer1)

### [ ] 2-1. Customer 로그인
- 로그아웃 후 `customer1@example.com` 로그인

### [ ] 2-2. 티켓 생성
- URL: `/tickets/new`
- 제목: "로그인이 안됩니다"
- 내용: "비밀번호를 입력해도 로그인이 되지 않습니다."
- 카테고리: 계정
- 우선순위: High
- 예상:
  - [ ] 상태 Open
  - [ ] agent1 또는 agent2 자동 할당
  - [ ] SLA 마감시간 표시

---

## 3. 티켓 목록 & 필터

### [ ] 3-1. Customer 티켓 목록
- URL: `/tickets`
- 예상: 본인 티켓만 표시

### [ ] 3-2. 검색 테스트
- 검색어: "로그인"
- 예상: 해당 티켓 필터링

---

## 4. 댓글 시스템

### [ ] 4-1. Customer 댓글 작성
- 티켓 상세 페이지
- 댓글: "크롬 브라우저입니다"

### [ ] 4-2. Agent 로그인 및 공개 댓글
- 로그아웃 후 `agent1@example.com` 로그인
- 할당된 티켓 접속
- 댓글: "비밀번호 재설정 링크 전송했습니다"
- 내부 노트 체크 안함

### [ ] 4-3. Agent 내부 노트 작성
- 댓글: "고객 계정 확인 완료"
- 내부 노트 체크

### [ ] 4-4. Customer 내부 노트 비가시성 확인
- Customer1 로그인
- 동일 티켓 접속
- 예상: 내부 노트 보이지 않음

---

## 5. 상태 변경 & 이력

### [ ] 5-1. Agent - 상태 변경
- Agent1 로그인
- 상태: Open → In Progress
- 이력 탭 확인: 변경 기록 있음

### [ ] 5-2. Agent - Resolved 변경
- 상태: In Progress → Resolved

### [ ] 5-3. Customer - Closed 변경
- Customer1 로그인
- 상태: Resolved → Closed
- 예상: 재오픈 버튼 표시

---

## 6. 대시보드

### [ ] 6-1. Customer 대시보드
- URL: `/dashboard`
- 예상: 본인 티켓 통계

### [ ] 6-2. Agent 대시보드
- Agent1 로그인 → `/dashboard`
- 예상: 할당된 티켓 통계

### [ ] 6-3. Manager 대시보드
- Manager 로그인 → `/dashboard`
- 예상: 전체 티켓 통계

### [ ] 6-4. Admin 대시보드
- Admin 로그인 → `/dashboard`
- 예상: 전체 시스템 통계

---

## 7. 권한 제어

### [ ] 7-1. Customer → Admin 페이지 차단
- Customer1 로그인
- URL 직접 입력: `/admin/users`
- 예상: 403 또는 접근 거부

### [ ] 7-2. Customer → 다른 Customer 티켓 차단
- customer2 티켓 ID로 URL 접근
- 예상: 404 또는 접근 거부

---

## 테스트 완료 체크

- [ ] 모든 필수 기능 테스트 완료
- [ ] 발견된 버그 기록
- [ ] `docs/phase3_varify.md` 업데이트

---

**테스트 수행자:** _____________
**테스트 일시:** _____________
