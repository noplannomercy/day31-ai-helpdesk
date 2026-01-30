# Vercel 배포 빠른 시작 가이드

## 🚀 5분 안에 배포하기

### 1단계: GitHub에 Push (2분)

```bash
# 원격 저장소 추가 (GitHub에서 저장소 먼저 생성)
git remote add origin https://github.com/YOUR_USERNAME/ai-helpdesk.git

# 커밋 및 푸시
git add .
git commit -m "chore: Vercel 배포 준비

- vercel.json 설정
- .env.example 업데이트
- 배포 가이드 추가"

git push -u origin master
```

### 2단계: Vercel 배포 (3분)

1. **Vercel 접속**
   - https://vercel.com 로그인
   - GitHub 계정 연결

2. **프로젝트 Import**
   - "Add New..." → "Project"
   - GitHub에서 `ai-helpdesk` 저장소 선택
   - Import 클릭

3. **환경 변수 설정**

   다음 변수들을 복사해서 추가:

   ```env
   DATABASE_URL=postgresql://budget:budget123@193.168.195.222:5432/helpdesk
   NEXTAUTH_URL=https://PLACEHOLDER
   NEXTAUTH_SECRET=supersecretkey1234567890abcdefghijk
   OPENROUTER_API_KEY=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
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=test@example.com
   SMTP_PASS=testpassword
   SMTP_FROM=noreply@ai-helpdesk.com
   NEXT_PUBLIC_APP_URL=https://PLACEHOLDER
   NEXT_PUBLIC_MAX_FILE_SIZE=5242880
   CRON_SECRET=supersecretkey1234567890abcdefghijk
   ```

4. **Deploy 클릭**

### 3단계: 배포 후 설정 (1분)

1. **배포 완료 확인**
   - Vercel이 제공하는 URL 확인 (예: `https://ai-helpdesk-xxx.vercel.app`)

2. **환경 변수 업데이트**
   - Settings → Environment Variables
   - `NEXTAUTH_URL` → 실제 배포된 URL로 변경
   - `NEXT_PUBLIC_APP_URL` → 실제 배포된 URL로 변경
   - Save

3. **재배포**
   - Deployments → 최신 배포 → "Redeploy" 클릭

### 4단계: 테스트

```
https://your-app.vercel.app 접속

✓ 로그인 페이지 표시
✓ 회원가입 가능
✓ 대시보드 접근
```

---

## ⚠️ 중요 사항

### 데이터베이스 접근

**현재 DB:** `193.168.195.222:5432`

이 IP가 **외부에서 접근 가능**해야 Vercel에서 연결할 수 있습니다.

**만약 로컬 DB라면:**
- Vercel에서 접근 불가능
- 외부 PostgreSQL로 마이그레이션 필요

**추천 무료 PostgreSQL:**
- Neon (https://neon.tech)
- Supabase (https://supabase.com)
- Railway (https://railway.app)

### 보안 강화 (프로덕션)

배포 전 다음 항목을 업데이트하세요:

```bash
# NEXTAUTH_SECRET 생성
openssl rand -base64 32

# CRON_SECRET 생성
openssl rand -base64 32
```

---

## 📋 배포 체크리스트

### 배포 전
- [ ] GitHub 저장소 생성 및 push 완료
- [ ] PostgreSQL 외부 접근 가능 확인
- [ ] 환경 변수 목록 준비
- [ ] `npm run build` 로컬 테스트 성공

### 배포 중
- [ ] Vercel 프로젝트 생성
- [ ] 모든 환경 변수 입력
- [ ] Deploy 실행

### 배포 후
- [ ] 배포 URL 확인
- [ ] `NEXTAUTH_URL` 업데이트
- [ ] `NEXT_PUBLIC_APP_URL` 업데이트
- [ ] Redeploy
- [ ] 로그인 테스트
- [ ] 티켓 생성 테스트

---

## 🆘 문제 해결

### "Build failed"
→ 로컬에서 `npm run build` 확인

### "Database connection error"
→ DATABASE_URL 확인, DB 외부 접근 가능 확인

### "NextAuth error"
→ NEXTAUTH_URL이 배포된 도메인과 일치하는지 확인

### 환경 변수 안 먹힘
→ Vercel 대시보드에서 확인 후 Redeploy

---

## 📚 상세 가이드

더 자세한 내용은 `DEPLOYMENT.md` 참조

## 🎯 배포 완료 후

배포가 완료되면:
- [ ] 관리자 계정 생성
- [ ] 카테고리 설정
- [ ] Agent 계정 생성
- [ ] SLA 정책 확인
- [ ] 이메일 알림 테스트

**배포 성공을 축하합니다! 🎉**
