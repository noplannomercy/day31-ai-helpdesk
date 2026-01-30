#!/usr/bin/env python3
"""
테스트 계정 생성 및 티켓 할당 테스트
"""

from playwright.sync_api import sync_playwright
import time
import os
import json

BASE_URL = 'http://localhost:3002'

# 테스트 계정 정보
TEST_CUSTOMER = {
    'email': 'testcustomer@test.com',
    'password': 'Test1234!',
    'name': 'Test Customer'
}

TEST_AGENT = {
    'email': 'testagent@test.com',
    'password': 'Agent1234!',
    'name': 'Test Agent'
}

def take_screenshot(page, name):
    """스크린샷 저장"""
    screenshots_dir = 'test-screenshots'
    os.makedirs(screenshots_dir, exist_ok=True)
    filepath = os.path.join(screenshots_dir, f'{name}.png')
    page.screenshot(path=filepath, full_page=True)
    print(f'[Screenshot] {filepath}')
    return filepath

def register_customer(page):
    """Customer 회원가입"""
    print('\n=== Customer 회원가입 ===')

    page.goto(f'{BASE_URL}/register')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    take_screenshot(page, '01_register_page')

    # 폼 입력
    page.locator('#name').fill(TEST_CUSTOMER['name'])
    page.locator('#email').fill(TEST_CUSTOMER['email'])
    page.locator('#password').fill(TEST_CUSTOMER['password'])

    take_screenshot(page, '02_register_filled')

    # 제출
    page.locator('button[type="submit"]').click()

    # 성공 메시지나 리다이렉트 대기 (충분한 시간 부여)
    time.sleep(5)

    current_url = page.url
    page_text = page.locator('body').inner_text()

    print(f'현재 URL: {current_url}')

    # 성공 판단: 로그인 페이지로 이동했거나, 성공 메시지가 있거나, 대시보드에 있음
    if '/login' in current_url:
        print('[SUCCESS] Customer 회원가입 성공 - 로그인 페이지로 이동')
        take_screenshot(page, '03_register_success')
        return True
    elif '/dashboard' in current_url:
        print('[SUCCESS] Customer 회원가입 성공 - 자동 로그인됨')
        take_screenshot(page, '03_register_success')
        return True
    elif '회원가입 성공' in page_text or '로그인 페이지로 이동' in page_text:
        print('[SUCCESS] Customer 회원가입 성공 - 성공 메시지 확인')
        take_screenshot(page, '03_register_success')
        # 리다이렉트 대기
        time.sleep(2)
        return True
    elif '이미 등록된' in page_text:
        print('[INFO] 이미 등록된 이메일 - 기존 계정 사용')
        take_screenshot(page, '03_register_already_exists')
        return True
    else:
        print('[ERROR] 회원가입 실패')
        take_screenshot(page, '03_register_failed')
        print(f'페이지 내용: {page_text[:300]}')
        return False

def login(page, email, password, role_name):
    """로그인"""
    print(f'\n=== {role_name} 로그인 ===')

    page.goto(f'{BASE_URL}/login')
    page.wait_for_load_state('networkidle')
    time.sleep(1)

    page.locator('#email').fill(email)
    page.locator('#password').fill(password)

    page.locator('button[type="submit"]').click()
    time.sleep(3)

    current_url = page.url

    if '/login' not in current_url:
        print(f'[SUCCESS] {role_name} 로그인 성공')
        return True
    else:
        print(f'[ERROR] {role_name} 로그인 실패')
        return False

def create_ticket(page):
    """티켓 생성"""
    print('\n=== 티켓 생성 ===')

    page.goto(f'{BASE_URL}/tickets/new')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    take_screenshot(page, '10_ticket_new')

    # 폼 입력
    print('제목 입력...')
    title_input = page.locator('input[name="title"]').or_(page.locator('#title'))
    title_input.fill('자동 할당 테스트 티켓')

    print('내용 입력...')
    content_input = page.locator('textarea[name="content"]').or_(page.locator('textarea[name="description"]'))
    content_input.fill('Round-robin 할당 알고리즘 테스트입니다. 자동으로 온라인 Agent에게 할당되어야 합니다.')

    # 카테고리 선택
    print('카테고리 선택...')
    try:
        category_select = page.locator('select[name="categoryId"]').or_(page.locator('select[name="category"]'))
        if category_select.count() > 0:
            # 첫 번째 옵션이 아닌 실제 카테고리 선택
            category_select.select_option(index=1)
    except:
        print('[WARNING] 카테고리 선택 건너뜀')

    # 우선순위 선택
    print('우선순위 선택...')
    try:
        priority_select = page.locator('select[name="priority"]')
        if priority_select.count() > 0:
            priority_select.select_option('high')
    except:
        print('[WARNING] 우선순위 선택 건너뜀')

    take_screenshot(page, '11_ticket_filled')

    # 제출
    print('티켓 생성...')
    submit_button = page.locator('button[type="submit"]')
    submit_button.click()
    time.sleep(3)

    current_url = page.url
    print(f'현재 URL: {current_url}')

    if '/tickets' in current_url:
        print('[SUCCESS] 티켓 생성 성공')
        take_screenshot(page, '12_ticket_created')
        return True
    else:
        print('[ERROR] 티켓 생성 실패')
        take_screenshot(page, '12_ticket_failed')
        return False

def check_ticket_assignment(page):
    """티켓 할당 확인"""
    print('\n=== 티켓 할당 확인 ===')

    # 티켓 목록
    page.goto(f'{BASE_URL}/tickets')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    take_screenshot(page, '13_ticket_list')

    # 첫 번째 티켓 클릭
    ticket_links = page.locator('a[href^="/tickets/"]').all()

    if len(ticket_links) == 0:
        print('[ERROR] 티켓을 찾을 수 없음')
        return False

    print(f'{len(ticket_links)}개 티켓 발견')
    ticket_links[0].click()
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    take_screenshot(page, '14_ticket_detail')

    # 할당 정보 확인
    page_text = page.locator('body').inner_text()

    if '할당' in page_text or 'Agent' in page_text or TEST_AGENT['name'] in page_text:
        print('[SUCCESS] Agent 할당 정보 발견')
        return True
    else:
        print('[WARNING] Agent 할당 정보를 명확히 확인할 수 없음')
        print(f'페이지 내용 일부: {page_text[:300]}')
        return None

def logout(page):
    """로그아웃"""
    print('\n=== 로그아웃 ===')
    page.goto(f'{BASE_URL}/api/auth/signout')
    time.sleep(2)
    print('[SUCCESS] 로그아웃')

def check_agent_view(page):
    """Agent가 티켓을 볼 수 있는지 확인"""
    print('\n=== Agent 관점 확인 ===')

    page.goto(f'{BASE_URL}/tickets')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    take_screenshot(page, '20_agent_ticket_list')

    page_text = page.locator('body').inner_text()

    if '자동 할당 테스트' in page_text:
        print('[SUCCESS] Agent가 할당된 티켓을 볼 수 있음')

        # 티켓 클릭
        ticket_links = page.locator('a[href^="/tickets/"]').all()
        if len(ticket_links) > 0:
            ticket_links[0].click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            take_screenshot(page, '21_agent_ticket_detail')

        return True
    else:
        print('[WARNING] 할당된 티켓을 찾을 수 없음')
        return False

def create_agent_via_api(context):
    """API를 통해 Agent 계정 생성"""
    print('\n=== Agent 계정 생성 (API) ===')

    # Admin 페이지로 이동하거나 API 직접 호출
    # 여기서는 register API를 사용하되, 역할을 agent로 설정할 수 없으므로
    # 일단 customer로 등록하고, 수동으로 DB에서 변경해야 함

    print('[INFO] Agent 계정은 Admin이 생성해야 합니다.')
    print('[INFO] 수동으로 다음 Agent 계정을 생성해주세요:')
    print(f'  이메일: {TEST_AGENT["email"]}')
    print(f'  비밀번호: {TEST_AGENT["password"]}')
    print(f'  이름: {TEST_AGENT["name"]}')

    return False

def main():
    print('=== 테스트 계정 생성 및 티켓 할당 테스트 ===\n')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        results = {
            'customer_registered': False,
            'customer_login': False,
            'ticket_created': False,
            'ticket_assigned': None,
            'agent_login': False,
            'agent_can_view': False
        }

        try:
            # 1. Customer 회원가입
            results['customer_registered'] = register_customer(page)

            if results['customer_registered']:
                # 2. Customer 로그인
                results['customer_login'] = login(page, TEST_CUSTOMER['email'], TEST_CUSTOMER['password'], 'Customer')

                if results['customer_login']:
                    # 3. 티켓 생성
                    results['ticket_created'] = create_ticket(page)

                    if results['ticket_created']:
                        # 4. 티켓 할당 확인
                        results['ticket_assigned'] = check_ticket_assignment(page)

                    # 5. 로그아웃
                    logout(page)

            # 6. Agent 로그인 시도 (수동으로 생성된 경우)
            print('\n[INFO] Agent 계정으로 로그인 시도...')
            print('[INFO] Agent 계정이 없다면 로그인이 실패합니다.')

            results['agent_login'] = login(page, TEST_AGENT['email'], TEST_AGENT['password'], 'Agent')

            if results['agent_login']:
                # 7. Agent가 티켓 확인
                results['agent_can_view'] = check_agent_view(page)

        except Exception as e:
            print(f'\n[ERROR] 오류 발생: {e}')
            import traceback
            traceback.print_exc()
            take_screenshot(page, '99_error')

        finally:
            browser.close()

        # 결과 출력
        print('\n' + '='*60)
        print('=== 테스트 결과 ===')
        print('='*60)

        print(f'Customer 회원가입: {"PASS" if results["customer_registered"] else "FAIL"}')
        print(f'Customer 로그인: {"PASS" if results["customer_login"] else "FAIL"}')
        print(f'티켓 생성: {"PASS" if results["ticket_created"] else "FAIL"}')

        if results['ticket_assigned'] is True:
            print(f'자동 할당: PASS')
        elif results['ticket_assigned'] is False:
            print(f'자동 할당: FAIL')
        else:
            print(f'자동 할당: UNKNOWN')

        print(f'Agent 로그인: {"PASS" if results["agent_login"] else "FAIL"}')
        print(f'Agent 티켓 확인: {"PASS" if results["agent_can_view"] else "FAIL"}')

        print('='*60)

        # 테스트 계정 정보 저장
        with open('test_accounts.txt', 'w', encoding='utf-8') as f:
            f.write('=== Test Accounts ===\n\n')
            f.write(f'Customer:\n')
            f.write(f'  Email: {TEST_CUSTOMER["email"]}\n')
            f.write(f'  Password: {TEST_CUSTOMER["password"]}\n')
            f.write(f'  Name: {TEST_CUSTOMER["name"]}\n\n')
            f.write(f'Agent (requires manual creation):\n')
            f.write(f'  Email: {TEST_AGENT["email"]}\n')
            f.write(f'  Password: {TEST_AGENT["password"]}\n')
            f.write(f'  Name: {TEST_AGENT["name"]}\n')
            f.write(f'  Role: agent\n')
            f.write(f'  Status: active\n')
            f.write(f'  Is Online: true\n')

        print('\n계정 정보 저장: test_accounts.txt')

        if not results['agent_login']:
            print('\n[ACTION REQUIRED] Agent 계정 생성 필요')
            print('다음 방법 중 하나를 선택하세요:')
            print('1. Admin 계정으로 로그인하여 /users 페이지에서 Agent 생성')
            print('2. DB에서 직접 생성')
            print(f'\n   Email: {TEST_AGENT["email"]}')
            print(f'   Password: {TEST_AGENT["password"]} (bcrypt 해시 필요)')
            print(f'   Name: {TEST_AGENT["name"]}')
            print(f'   Role: agent')
            print(f'   Is Online: true')

if __name__ == '__main__':
    main()
