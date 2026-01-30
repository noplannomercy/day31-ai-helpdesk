# Vercel 배포 가이드

## 사전 준비

### 1. 필수 요구사항
- [x] GitHub 계정
- [x] Vercel 계정 (https://vercel.com)
- [x] PostgreSQL 데이터베이스 (외부 접근 가능해야 함)

### 2. 환경 변수 확인

현재 `.env.local` 파일의 환경 변수:

```env
# Database
DATABASE_URL=postgresql://budget:budget123@193.168.195.222:5432/helpdesk

# NextAuth.js
NEXTAUTH_URL=https://your-app.vercel.app  # Vercel 배포 후 업데이트 필요
NEXTAUTH_SECRET=supersecretkey1234567890abcdefghijk

# OpenRouter API
OPENROUTER_API_KEY=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

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=test@example.com
SMTP_PASS=testpassword
SMTP_FROM=noreply@ai-helpdesk.com

# App Config
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app  # Vercel 배포 후 업데이트 필요
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
```

---

## 배포 단계

### Step 1: GitHub 저장소 연결

#### 1-1. 로컬 Git 저장소 초기화 (이미 완료된 것으로 보임)

```bash
git status
```

#### 1-2. GitHub에 저장소 생성
1. GitHub.com 접속
2. New Repository 클릭
3. Repository 이름: `day31-ai-helpdesk` (또는 원하는 이름)
4. Private/Public 선택
5. Create repository

#### 1-3. 원격 저장소 연결

```bash
# 원격 저장소 추가 (GitHub에서 제공하는 URL 사용)
git remote add origin https://github.com/YOUR_USERNAME/day31-ai-helpdesk.git

# 또는 SSH 사용
git remote add origin git@github.com:YOUR_USERNAME/day31-ai-helpdesk.git

# 현재 변경사항 커밋
git add .
git commit -m "feat: AI Help Desk - Phase 1-8 완료

- NextAuth.js v5 인증 (4 roles)
- 티켓 CRUD 및 자동 할당 (Round-robin)
- SLA 관리 및 알림
- AI 답변 제안 (OpenRouter)
- 대시보드 및 보고서
- 만족도 조사

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Push
git push -u origin master
```

### Step 2: Vercel 프로젝트 생성

#### 2-1. Vercel 웹사이트에서 배포

1. **Vercel 로그인**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **New Project**
   - "Add New..." → "Project" 클릭
   - GitHub 저장소에서 `day31-ai-helpdesk` 선택
   - Import 클릭

3. **프로젝트 설정**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **환경 변수 설정**

   Environment Variables 섹션에서 다음 변수들을 추가:

   ```
   DATABASE_URL=postgresql://budget:budget123@193.168.195.222:5432/helpdesk

   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=supersecretkey1234567890abcdefghijk

   OPENROUTER_API_KEY=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

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=test@example.com
   SMTP_PASS=testpassword
   SMTP_FROM=noreply@ai-helpdesk.com

   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_MAX_FILE_SIZE=5242880
   ```

   **중요:** `NEXTAUTH_URL`과 `NEXT_PUBLIC_APP_URL`은 배포 후 실제 URL로 업데이트 필요

5. **Deploy 클릭**

#### 2-2. Vercel CLI 사용 (선택사항)

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### Step 3: 배포 후 설정

#### 3-1. 도메인 URL 확인
배포가 완료되면 Vercel이 제공하는 URL을 받습니다:
```
https://day31-ai-helpdesk-xxx.vercel.app
```

#### 3-2. 환경 변수 업데이트

Vercel 대시보드에서:
1. Settings → Environment Variables
2. `NEXTAUTH_URL` 수정: `https://your-actual-domain.vercel.app`
3. `NEXT_PUBLIC_APP_URL` 수정: `https://your-actual-domain.vercel.app`
4. Save 후 Redeploy

또는 Vercel CLI:
```bash
vercel env add NEXTAUTH_URL production
# 값 입력: https://your-actual-domain.vercel.app

vercel env add NEXT_PUBLIC_APP_URL production
# 값 입력: https://your-actual-domain.vercel.app

# 재배포
vercel --prod
```

#### 3-3. 데이터베이스 연결 확인

PostgreSQL 데이터베이스가 외부에서 접근 가능한지 확인:
- IP: 193.168.195.222
- Port: 5432
- 방화벽 설정 확인

**만약 로컬 DB를 사용 중이라면:**
- Vercel에서 접근 불가능
- 외부 PostgreSQL 서비스로 마이그레이션 필요 (Neon, Supabase, Railway 등)

### Step 4: 배포 확인

1. **배포된 URL 접속**
   ```
   https://your-app.vercel.app
   ```

2. **기능 테스트**
   - [ ] 로그인 페이지 접속 가능
   - [ ] 회원가입 가능
   - [ ] 대시보드 로드
   - [ ] 티켓 생성 가능
   - [ ] 데이터베이스 연결 확인

3. **로그 확인**
   - Vercel 대시보드 → Deployments → 최신 배포 → Logs
   - 에러가 있는지 확인

---

## 추가 설정

### 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드 → Settings → Domains
2. Add Domain
3. 도메인 입력 (예: helpdesk.yourdomain.com)
4. DNS 설정 업데이트 (A 레코드 또는 CNAME)

### 빌드 최적화

`vercel.json` 생성:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["icn1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 데이터베이스 마이그레이션 (필요 시)

Vercel에서는 로컬 DB에 접근할 수 없으므로, 외부 PostgreSQL 서비스 사용 권장:

**추천 서비스:**
1. **Neon** (https://neon.tech)
   - 무료 티어 제공
   - Serverless PostgreSQL
   - 자동 스케일링

2. **Supabase** (https://supabase.com)
   - 무료 티어 제공
   - PostgreSQL + 추가 기능
   - 실시간 기능

3. **Railway** (https://railway.app)
   - 무료 티어 제공
   - 간단한 설정

---

## 문제 해결

### 빌드 실패

**증상:** Build failed
**해결:**
```bash
# 로컬에서 빌드 테스트
npm run build

# 의존성 확인
npm install

# 타입 에러 확인
npm run type-check
```

### 데이터베이스 연결 실패

**증상:** Database connection error
**해결:**
1. DATABASE_URL 환경 변수 확인
2. PostgreSQL 서버가 외부 접근 허용하는지 확인
3. 방화벽 설정 확인

### NextAuth 오류

**증상:** NextAuth configuration error
**해결:**
1. `NEXTAUTH_URL`이 배포된 도메인과 일치하는지 확인
2. `NEXTAUTH_SECRET`이 설정되어 있는지 확인
3. Redeploy

### 환경 변수 인식 안 됨

**증상:** Environment variables undefined
**해결:**
1. Vercel 대시보드에서 환경 변수 확인
2. Production/Preview/Development 타겟 확인
3. Redeploy 필요

---

## 배포 체크리스트

### 배포 전
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] 환경 변수 목록 준비
- [ ] GitHub 저장소 생성 및 push
- [ ] PostgreSQL 외부 접근 가능 확인

### 배포 중
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 첫 배포 실행

### 배포 후
- [ ] 배포 URL 확인
- [ ] `NEXTAUTH_URL` 업데이트
- [ ] `NEXT_PUBLIC_APP_URL` 업데이트
- [ ] 재배포
- [ ] 기능 테스트 (로그인, 티켓 생성 등)
- [ ] 로그 확인

---

## 보안 권장사항

### 프로덕션 환경 변수

1. **NEXTAUTH_SECRET 재생성**
   ```bash
   openssl rand -base64 32
   ```

2. **SMTP 설정**
   - Gmail 사용 시: 앱 비밀번호 생성
   - 프로덕션 SMTP 서비스 사용 권장 (SendGrid, AWS SES 등)

3. **OpenRouter API Key**
   - 프로덕션용 키로 교체
   - 사용량 제한 설정

4. **데이터베이스**
   - 프로덕션 DB 사용
   - 강력한 비밀번호 설정
   - SSL 연결 사용

---

## 참고 링크

- Vercel 문서: https://vercel.com/docs
- Next.js 배포: https://nextjs.org/docs/deployment
- Vercel CLI: https://vercel.com/docs/cli
- 환경 변수: https://vercel.com/docs/projects/environment-variables
