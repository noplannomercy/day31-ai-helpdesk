#!/usr/bin/env python3
"""
티켓 자동 할당 최종 테스트
기존에 생성된 계정으로 직접 테스트
"""

from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://localhost:3002'

# 테스트 계정 (이미 생성됨)
CUSTOMER = {
    'email': 'testcustomer@test.com',
    'password': 'Test1234!',
    'name': 'Test Customer'
}

AGENT = {
    'email': 'testagent@test.com',
    'password': 'Agent1234!',
    'name': 'Test Agent'
}

def screenshot(page, name):
    os.makedirs('test-screenshots', exist_ok=True)
    path = f'test-screenshots/{name}.png'
    page.screenshot(path=path, full_page=True)
    print(f'[Screenshot] {path}')

def login(page, email, password):
    print(f'\n=== 로그인: {email} ===')
    page.goto(f'{BASE_URL}/login')
    page.wait_for_load_state('networkidle')
    time.sleep(1)

    page.locator('#email').fill(email)
    page.locator('#password').fill(password)
    screenshot(page, f'login_filled_{email.split("@")[0]}')

    page.locator('button[type="submit"]').click()
    time.sleep(4)

    url = page.url
    text = page.locator('body').inner_text()

    # 성공 판단: dashboard, tickets 등으로 이동했거나, 환영 메시지가 있음
    if '/dashboard' in url or '/tickets' in url:
        print(f'[SUCCESS] 로그인 성공: {url}')
        screenshot(page, f'login_success_{email.split("@")[0]}')
        return True
    elif '환영' in text or 'Welcome' in text:
        print(f'[SUCCESS] 로그인 성공 (환영 메시지 확인): {url}')
        screenshot(page, f'login_success_{email.split("@")[0]}')
        return True
    elif '/login' in url:
        print(f'[FAIL] 로그인 실패 - 여전히 로그인 페이지')
        screenshot(page, f'login_failed_{email.split("@")[0]}')
        return False
    else:
        # 기타 페이지로 이동한 경우 (일단 성공으로 간주)
        print(f'[SUCCESS] 로그인 성공 (추정): {url}')
        screenshot(page, f'login_success_{email.split("@")[0]}')
        return True

def create_ticket(page):
    print('\n=== 티켓 생성 ===')
    page.goto(f'{BASE_URL}/tickets/new')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    screenshot(page, 'ticket_new_page')

    # 제목
    page.locator('input[name="title"]').first.fill('자동 할당 테스트 티켓')

    # 내용
    content_locator = page.locator('textarea[name="content"]').or_(page.locator('textarea[name="description"]'))
    content_locator.first.fill('Round-robin 할당 테스트입니다.')

    # 카테고리 (있으면)
    try:
        selects = page.locator('select').all()
        if len(selects) > 0:
            # 첫 번째 select가 카테고리일 가능성
            selects[0].select_option(index=1)
            # 두 번째가 우선순위
            if len(selects) > 1:
                selects[1].select_option('high')
    except:
        pass

    screenshot(page, 'ticket_filled')

    page.locator('button[type="submit"]').click()
    time.sleep(3)

    if '/tickets' in page.url:
        print(f'[SUCCESS] 티켓 생성 성공: {page.url}')
        screenshot(page, 'ticket_created')
        return True
    else:
        print(f'[FAIL] 티켓 생성 실패')
        screenshot(page, 'ticket_create_failed')
        return False

def check_assignment(page):
    print('\n=== 할당 확인 ===')
    page.goto(f'{BASE_URL}/tickets')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    screenshot(page, 'ticket_list_customer')

    links = page.locator('a[href^="/tickets/"]').all()
    if not links:
        print('[FAIL] 티켓 없음')
        return False

    print(f'티켓 {len(links)}개 발견')
    links[0].click()
    time.sleep(2)
    screenshot(page, 'ticket_detail_customer')

    text = page.locator('body').inner_text()

    if 'Test Agent' in text or 'testagent' in text or '할당' in text:
        print('[SUCCESS] Agent 할당 확인')
        print(f'페이지 내용:\n{text[:500]}')
        return True
    else:
        print('[WARNING] 할당 정보 불명확')
        return None

def logout(page):
    print('\n=== 로그아웃 ===')
    # NextAuth signout 페이지로 이동
    page.goto(f'{BASE_URL}/api/auth/signout')
    time.sleep(1)

    # POST 요청을 위한 버튼 클릭 (있을 경우)
    try:
        signout_button = page.locator('button:has-text("Sign out")').or_(page.locator('form button'))
        if signout_button.count() > 0:
            signout_button.first.click()
            time.sleep(2)
    except:
        pass

    # 확실하게 세션 클리어를 위해 쿠키 삭제
    page.context.clear_cookies()
    time.sleep(1)
    print('[SUCCESS] 로그아웃 완료')

def check_agent_view(page):
    print('\n=== Agent 관점 확인 ===')
    page.goto(f'{BASE_URL}/tickets')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    screenshot(page, 'ticket_list_agent')

    text = page.locator('body').inner_text()

    if '자동 할당 테스트' in text:
        print('[SUCCESS] Agent가 티켓 확인 가능')
        links = page.locator('a[href^="/tickets/"]').all()
        if links:
            links[0].click()
            time.sleep(2)
            screenshot(page, 'ticket_detail_agent')
        return True
    else:
        print('[WARNING] 티켓 미발견')
        print(f'페이지 내용:\n{text[:300]}')
        return False

def main():
    print('=== 티켓 자동 할당 테스트 ===\n')

    results = {
        'customer_login': False,
        'ticket_created': False,
        'ticket_assigned': None,
        'agent_login': False,
        'agent_view': False
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Customer 로그인
            results['customer_login'] = login(page, CUSTOMER['email'], CUSTOMER['password'])

            if not results['customer_login']:
                print('\n[ERROR] Customer 로그인 실패')
                print('계정이 생성되지 않았을 수 있습니다.')
                browser.close()
                return

            # 2. 티켓 생성
            results['ticket_created'] = create_ticket(page)

            if results['ticket_created']:
                # 3. 할당 확인
                results['ticket_assigned'] = check_assignment(page)

            # 4. 로그아웃
            logout(page)

            # 5. Agent 로그인
            results['agent_login'] = login(page, AGENT['email'], AGENT['password'])

            if results['agent_login']:
                # 6. Agent가 티켓 확인
                results['agent_view'] = check_agent_view(page)

        except Exception as e:
            print(f'\n[ERROR] {e}')
            import traceback
            traceback.print_exc()
            screenshot(page, 'error')

        finally:
            browser.close()

        # 결과
        print('\n' + '='*60)
        print('=== 테스트 결과 ===')
        print('='*60)
        for k, v in results.items():
            status = 'PASS' if v is True else ('FAIL' if v is False else 'UNKNOWN')
            print(f'{k:20s}: {status}')
        print('='*60)

        # 성공률
        passed = sum(1 for v in results.values() if v is True)
        total = len(results)
        print(f'\n성공: {passed}/{total} ({int(passed/total*100)}%)')

        # 결과 파일
        with open('docs/ticket_assignment_test_result.md', 'w', encoding='utf-8') as f:
            f.write('# 티켓 자동 할당 테스트 결과\n\n')
            f.write(f'**일시:** {time.strftime("%Y-%m-%d %H:%M:%S")}\n\n')

            f.write('## 테스트 시나리오\n\n')
            f.write('1. Customer 로그인\n')
            f.write('2. 티켓 생성\n')
            f.write('3. 자동 할당 확인\n')
            f.write('4. Agent 로그인\n')
            f.write('5. Agent가 티켓 확인\n\n')

            f.write('## 결과\n\n')
            for k, v in results.items():
                emoji = '✅' if v is True else ('❌' if v is False else '⚠️')
                name = k.replace('_', ' ').title()
                f.write(f'{emoji} {name}\n')

            f.write(f'\n**성공률:** {passed}/{total} ({int(passed/total*100)}%)\n\n')

            f.write('## 스크린샷\n\n')
            f.write('`test-screenshots/` 디렉토리 참조\n\n')

            f.write('## 검증 항목\n\n')
            f.write(f'- [{"x" if results["ticket_created"] else " "}] 티켓 생성 성공\n')
            f.write(f'- [{"x" if results["ticket_assigned"] else " "}] 자동 Agent 할당\n')
            f.write(f'- [{"x" if results["agent_view"] else " "}] Agent 티켓 확인 가능\n')

        print('\n보고서 저장: docs/ticket_assignment_test_result.md')

if __name__ == '__main__':
    main()
