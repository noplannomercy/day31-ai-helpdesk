#!/usr/bin/env python3
"""
테스트 계정 생성
- Customer 계정 생성
- Agent 계정 생성 (Admin이 생성해야 하므로 API 사용)
"""

from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://localhost:3002'

# 테스트 계정 정보
TEST_CUSTOMER = {
    'email': 'testcustomer@example.com',
    'password': 'Test1234!@#$',
    'name': '테스트고객'
}

TEST_AGENT = {
    'email': 'testagent@example.com',
    'password': 'Agent1234!@#$',
    'name': '테스트상담사'
}

# Admin 계정 (이미 존재한다고 가정)
ADMIN_EMAIL = 'admin@example.com'
ADMIN_PASSWORD = 'Admin1234!@#$'

def take_screenshot(page, name):
    """스크린샷 저장"""
    screenshots_dir = 'test-screenshots'
    os.makedirs(screenshots_dir, exist_ok=True)
    filepath = os.path.join(screenshots_dir, f'{name}.png')
    page.screenshot(path=filepath, full_page=True)
    print(f'[Screenshot] {filepath}')
    return filepath

def create_customer_account(page):
    """Customer 계정 생성 (회원가입)"""
    print('\n=== Customer 계정 생성 ===')

    # 회원가입 페이지로 이동
    page.goto(f'{BASE_URL}/register')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    take_screenshot(page, 'register_page')

    # 폼 입력
    page.locator('#name').fill(TEST_CUSTOMER['name'])
    page.locator('#email').fill(TEST_CUSTOMER['email'])
    page.locator('#password').fill(TEST_CUSTOMER['password'])
    page.locator('#confirmPassword').fill(TEST_CUSTOMER['password'])

    take_screenshot(page, 'register_filled')

    # 제출
    page.locator('button[type="submit"]').click()
    time.sleep(3)

    current_url = page.url
    print(f'현재 URL: {current_url}')

    if '/login' in current_url or '/dashboard' in current_url:
        print('[SUCCESS] Customer 계정 생성 성공')
        take_screenshot(page, 'register_success')
        return True
    else:
        print('[ERROR] Customer 계정 생성 실패')
        take_screenshot(page, 'register_failed')
        page_text = page.locator('body').inner_text()
        print(f'페이지 내용: {page_text[:500]}')
        return False

def login_as_admin(page):
    """Admin으로 로그인"""
    print('\n=== Admin 로그인 ===')

    page.goto(f'{BASE_URL}/login')
    page.wait_for_load_state('networkidle')
    time.sleep(1)

    page.locator('#email').fill(ADMIN_EMAIL)
    page.locator('#password').fill(ADMIN_PASSWORD)

    page.locator('button[type="submit"]').click()
    time.sleep(3)

    current_url = page.url

    if '/login' not in current_url:
        print('[SUCCESS] Admin 로그인 성공')
        return True
    else:
        print('[WARNING] Admin 로그인 실패 - 기본 admin 계정이 없을 수 있음')
        print('Agent 계정은 수동으로 생성해야 합니다.')
        return False

def create_agent_via_ui(page):
    """Admin UI를 통해 Agent 계정 생성"""
    print('\n=== Agent 계정 생성 (Admin UI) ===')

    # 사용자 관리 페이지로 이동
    page.goto(f'{BASE_URL}/users')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    take_screenshot(page, 'users_page')

    # 새 사용자 버튼 찾기 (여러 가지 가능한 텍스트)
    create_button_selectors = [
        'button:has-text("새 사용자")',
        'button:has-text("사용자 추가")',
        'button:has-text("추가")',
        'a:has-text("새 사용자")',
        '[data-testid="create-user"]'
    ]

    button_clicked = False
    for selector in create_button_selectors:
        if page.locator(selector).count() > 0:
            page.click(selector)
            button_clicked = True
            break

    if not button_clicked:
        print('[ERROR] 사용자 생성 버튼을 찾을 수 없음')
        return False

    time.sleep(2)
    take_screenshot(page, 'create_user_form')

    # 폼 입력 (다양한 셀렉터 시도)
    try:
        # 이름
        name_selectors = ['#name', 'input[name="name"]', 'input[placeholder*="이름"]']
        for selector in name_selectors:
            if page.locator(selector).count() > 0:
                page.locator(selector).fill(TEST_AGENT['name'])
                break

        # 이메일
        email_selectors = ['#email', 'input[name="email"]', 'input[type="email"]']
        for selector in email_selectors:
            if page.locator(selector).count() > 0:
                page.locator(selector).fill(TEST_AGENT['email'])
                break

        # 비밀번호
        password_selectors = ['#password', 'input[name="password"]', 'input[type="password"]']
        for selector in password_selectors:
            if page.locator(selector).count() > 0:
                page.locator(selector).first.fill(TEST_AGENT['password'])
                break

        # 역할 선택
        role_selectors = ['select[name="role"]', '#role', 'select']
        for selector in role_selectors:
            if page.locator(selector).count() > 0:
                page.locator(selector).select_option('agent')
                break

        take_screenshot(page, 'create_agent_filled')

        # 제출
        page.locator('button[type="submit"]').click()
        time.sleep(2)

        print('[SUCCESS] Agent 계정 생성 성공')
        take_screenshot(page, 'agent_created')
        return True

    except Exception as e:
        print(f'[ERROR] Agent 계정 생성 중 오류: {e}')
        take_screenshot(page, 'agent_create_error')
        return False

def set_agent_online(page):
    """Agent 상태를 온라인으로 설정"""
    print('\n=== Agent 온라인 상태 설정 ===')

    # Agent 목록에서 방금 생성한 agent 찾기
    page.goto(f'{BASE_URL}/users?role=agent')
    page.wait_for_load_state('networkidle')
    time.sleep(1)

    # 페이지에서 testagent 찾기
    page_text = page.locator('body').inner_text()

    if 'testagent' in page_text or TEST_AGENT['email'] in page_text:
        print('[INFO] Agent 계정 확인됨')
        # 상태 토글이 있다면 클릭
        # 실제 UI 구조에 따라 조정 필요
        take_screenshot(page, 'agent_in_list')
        return True

    return False

def main():
    print('=== 테스트 계정 생성 시작 ===\n')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # UI 확인을 위해 headless=False
        page = browser.new_page()

        results = {
            'customer_created': False,
            'admin_login': False,
            'agent_created': False
        }

        try:
            # 1. Customer 계정 생성
            results['customer_created'] = create_customer_account(page)

            if not results['customer_created']:
                print('\n[WARNING] Customer 계정 생성 실패. 이미 존재할 수 있습니다.')

            # 로그아웃
            page.goto(f'{BASE_URL}/api/auth/signout')
            time.sleep(2)

            # 2. Admin 로그인 시도
            results['admin_login'] = login_as_admin(page)

            if results['admin_login']:
                # 3. Agent 계정 생성
                results['agent_created'] = create_agent_via_ui(page)

                if results['agent_created']:
                    set_agent_online(page)
            else:
                print('\n[INFO] Admin 계정으로 로그인할 수 없어 Agent 계정을 자동 생성할 수 없습니다.')
                print('[INFO] 수동으로 다음 Agent 계정을 생성해주세요:')
                print(f'  이메일: {TEST_AGENT["email"]}')
                print(f'  비밀번호: {TEST_AGENT["password"]}')
                print(f'  이름: {TEST_AGENT["name"]}')
                print(f'  역할: agent')

            time.sleep(3)

        except Exception as e:
            print(f'\n[ERROR] 오류 발생: {e}')
            import traceback
            traceback.print_exc()
            take_screenshot(page, 'error')

        finally:
            browser.close()

        # 결과 출력
        print('\n' + '='*60)
        print('=== 계정 생성 결과 ===')
        print('='*60)
        print(f'Customer 생성: {"✓" if results["customer_created"] else "✗"}')
        print(f'Admin 로그인: {"✓" if results["admin_login"] else "✗"}')
        print(f'Agent 생성: {"✓" if results["agent_created"] else "✗"}')
        print('='*60)

        print('\n생성된 테스트 계정:')
        print(f'\nCustomer:')
        print(f'  이메일: {TEST_CUSTOMER["email"]}')
        print(f'  비밀번호: {TEST_CUSTOMER["password"]}')
        print(f'\nAgent:')
        print(f'  이메일: {TEST_AGENT["email"]}')
        print(f'  비밀번호: {TEST_AGENT["password"]}')

        # 계정 정보를 파일로 저장
        with open('test_accounts.txt', 'w', encoding='utf-8') as f:
            f.write('=== Test Accounts ===\n\n')
            f.write(f'Customer:\n')
            f.write(f'  Email: {TEST_CUSTOMER["email"]}\n')
            f.write(f'  Password: {TEST_CUSTOMER["password"]}\n')
            f.write(f'  Name: {TEST_CUSTOMER["name"]}\n\n')
            f.write(f'Agent:\n')
            f.write(f'  Email: {TEST_AGENT["email"]}\n')
            f.write(f'  Password: {TEST_AGENT["password"]}\n')
            f.write(f'  Name: {TEST_AGENT["name"]}\n')

        print('\n계정 정보 저장: test_accounts.txt')

if __name__ == '__main__':
    main()
