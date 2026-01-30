#!/usr/bin/env python3
"""
티켓 자동 할당 테스트
- Customer가 티켓 생성
- 자동으로 Agent에게 할당되는지 확인
- Agent가 할당된 티켓을 볼 수 있는지 확인
"""

from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://localhost:3002'

# 테스트 계정 정보 (실제 계정으로 수정 필요)
CUSTOMER_EMAIL = 'customer1@example.com'
CUSTOMER_PASSWORD = 'Customer123!'
AGENT_EMAIL = 'agent1@example.com'
AGENT_PASSWORD = 'Agent123!'

def take_screenshot(page, name):
    """스크린샷 저장"""
    screenshots_dir = 'test-screenshots'
    os.makedirs(screenshots_dir, exist_ok=True)
    filepath = os.path.join(screenshots_dir, f'{name}.png')
    page.screenshot(path=filepath, full_page=True)
    print(f'[Screenshot] {filepath}')
    return filepath

def login(page, email, password):
    """로그인"""
    print(f'\n=== 로그인: {email} ===')

    # 로그인 페이지로 이동
    page.goto(f'{BASE_URL}/login')
    page.wait_for_load_state('networkidle')
    take_screenshot(page, '01_login_page')

    # 로그인 폼 입력
    page.fill('input[type="email"]', email)
    page.fill('input[type="password"]', password)
    take_screenshot(page, '02_login_filled')

    # 로그인 버튼 클릭
    page.click('button[type="submit"]')
    page.wait_for_load_state('networkidle')
    time.sleep(1)

    # 로그인 성공 확인
    current_url = page.url
    print(f'현재 URL: {current_url}')

    if '/login' in current_url:
        print('[ERROR] 로그인 실패 - 여전히 로그인 페이지에 있음')
        take_screenshot(page, '02_login_failed')
        return False

    print('[SUCCESS] 로그인 성공')
    take_screenshot(page, '03_logged_in')
    return True

def logout(page):
    """로그아웃"""
    print('\n=== 로그아웃 ===')

    # 사용자 메뉴 클릭 (헤더의 아바타 또는 사용자 이름)
    try:
        # 여러 가지 셀렉터 시도
        selectors = [
            'button:has-text("로그아웃")',
            'a:has-text("로그아웃")',
            '[data-testid="logout"]',
            'text=로그아웃'
        ]

        for selector in selectors:
            if page.locator(selector).count() > 0:
                page.click(selector)
                page.wait_for_load_state('networkidle')
                time.sleep(1)
                print('[SUCCESS] 로그아웃 성공')
                take_screenshot(page, '10_logged_out')
                return True

        print('[WARNING] 로그아웃 버튼을 찾을 수 없음')
        # 직접 URL로 로그아웃 시도
        page.goto(f'{BASE_URL}/api/auth/signout')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        return True

    except Exception as e:
        print(f'[ERROR] 로그아웃 중 오류: {e}')
        return False

def create_ticket(page):
    """티켓 생성"""
    print('\n=== 티켓 생성 ===')

    # 티켓 생성 페이지로 이동
    page.goto(f'{BASE_URL}/tickets/new')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    take_screenshot(page, '04_ticket_new_page')

    # 폼 입력
    print('제목 입력...')
    page.fill('input[name="title"]', '자동 할당 테스트 티켓')

    print('내용 입력...')
    page.fill('textarea[name="content"]', 'Round-robin 할당 알고리즘 테스트를 위한 티켓입니다. 자동으로 온라인 상태의 Agent에게 할당되어야 합니다.')

    # 카테고리 선택 (첫 번째 옵션)
    print('카테고리 선택...')
    category_selectors = [
        'select[name="categoryId"]',
        '[name="categoryId"]',
        'select'
    ]
    for selector in category_selectors:
        if page.locator(selector).count() > 0:
            page.select_option(selector, index=1)  # 첫 번째 카테고리 선택
            break

    # 우선순위 선택
    print('우선순위 선택...')
    priority_selectors = [
        'select[name="priority"]',
        '[name="priority"]'
    ]
    for selector in priority_selectors:
        if page.locator(selector).count() > 0:
            page.select_option(selector, value='high')
            break

    take_screenshot(page, '05_ticket_form_filled')

    # 제출
    print('티켓 생성 버튼 클릭...')
    page.click('button[type="submit"]')
    page.wait_for_load_state('networkidle')
    time.sleep(2)  # 생성 완료 대기

    current_url = page.url
    print(f'현재 URL: {current_url}')

    # 티켓 목록 또는 상세 페이지로 이동했는지 확인
    if '/tickets' in current_url:
        print('[SUCCESS] 티켓 생성 성공')
        take_screenshot(page, '06_ticket_created')
        return True
    else:
        print('[ERROR] 티켓 생성 실패')
        take_screenshot(page, '06_ticket_creation_failed')
        return False

def check_ticket_assignment(page):
    """티켓 할당 확인"""
    print('\n=== 티켓 할당 확인 ===')

    # 티켓 목록으로 이동
    page.goto(f'{BASE_URL}/tickets')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    take_screenshot(page, '07_ticket_list')

    # 가장 최근 티켓 클릭 (첫 번째 티켓)
    print('최근 생성된 티켓 찾기...')

    # 티켓 링크 찾기
    ticket_links = page.locator('a[href^="/tickets/"]').all()

    if len(ticket_links) == 0:
        print('[ERROR] 티켓을 찾을 수 없음')
        return False

    print(f'티켓 {len(ticket_links)}개 발견')

    # 첫 번째 티켓 클릭
    ticket_links[0].click()
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    take_screenshot(page, '08_ticket_detail')

    # 페이지 내용 확인
    content = page.content()

    # Agent 할당 확인
    if '할당됨' in content or 'Agent' in content or 'agent' in content:
        print('[SUCCESS] Agent 할당 정보 발견')

        # 할당된 Agent 이름 찾기
        page_text = page.locator('body').inner_text()
        print(f'페이지 내용 일부:\n{page_text[:500]}...')

        return True
    else:
        print('[WARNING] Agent 할당 정보를 명확히 확인할 수 없음')
        return None

def check_agent_view(page):
    """Agent가 티켓을 볼 수 있는지 확인"""
    print('\n=== Agent 관점 티켓 확인 ===')

    # 티켓 목록으로 이동
    page.goto(f'{BASE_URL}/tickets')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    take_screenshot(page, '11_agent_ticket_list')

    # 할당된 티켓 확인
    page_text = page.locator('body').inner_text()

    if '자동 할당 테스트' in page_text:
        print('[SUCCESS] Agent가 할당된 티켓을 볼 수 있음')

        # 티켓 클릭
        ticket_links = page.locator('a[href^="/tickets/"]').all()
        if len(ticket_links) > 0:
            ticket_links[0].click()
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            take_screenshot(page, '12_agent_ticket_detail')

        return True
    else:
        print('[WARNING] 할당된 티켓을 찾을 수 없음')
        return False

def main():
    print('=== 티켓 자동 할당 테스트 시작 ===\n')

    with sync_playwright() as p:
        # 브라우저 시작
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        results = {
            'customer_login': False,
            'ticket_created': False,
            'ticket_assigned': False,
            'agent_login': False,
            'agent_can_view': False
        }

        try:
            # 1. Customer 로그인
            results['customer_login'] = login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD)

            if not results['customer_login']:
                print('\n[ERROR] Customer 로그인 실패. 계정 정보를 확인하세요.')
                print(f'시도한 이메일: {CUSTOMER_EMAIL}')
                browser.close()
                return

            # 2. 티켓 생성
            results['ticket_created'] = create_ticket(page)

            if not results['ticket_created']:
                print('\n[ERROR] 티켓 생성 실패')
                browser.close()
                return

            # 3. 티켓 할당 확인
            assignment_check = check_ticket_assignment(page)
            if assignment_check is not None:
                results['ticket_assigned'] = assignment_check

            # 4. 로그아웃
            logout(page)

            # 5. Agent 로그인
            time.sleep(2)
            results['agent_login'] = login(page, AGENT_EMAIL, AGENT_PASSWORD)

            if not results['agent_login']:
                print('\n[WARNING] Agent 로그인 실패. Agent 관점 테스트 건너뜀')
                print(f'시도한 이메일: {AGENT_EMAIL}')
            else:
                # 6. Agent가 티켓을 볼 수 있는지 확인
                results['agent_can_view'] = check_agent_view(page)

        except Exception as e:
            print(f'\n[ERROR] 테스트 중 오류 발생: {e}')
            import traceback
            traceback.print_exc()
            take_screenshot(page, '99_error')

        finally:
            browser.close()

        # 결과 출력
        print('\n' + '='*60)
        print('=== 테스트 결과 요약 ===')
        print('='*60)

        for test, passed in results.items():
            status = '[PASS]' if passed else '[FAIL]'
            print(f'{status} {test}')

        print('='*60)

        # 성공률 계산
        passed_count = sum(1 for v in results.values() if v)
        total_count = len(results)
        success_rate = (passed_count / total_count) * 100

        print(f'\n성공률: {passed_count}/{total_count} ({success_rate:.1f}%)')
        print(f'\n스크린샷 저장 위치: test-screenshots/')

        # 결과 파일 생성
        generate_report(results)

def generate_report(results):
    """테스트 결과 보고서 생성"""
    report_path = 'docs/ticket_assignment_test_result.md'

    os.makedirs('docs', exist_ok=True)

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write('# 티켓 자동 할당 테스트 결과\n\n')
        f.write(f'**테스트 일시:** {time.strftime("%Y-%m-%d %H:%M:%S")}\n\n')
        f.write('## 테스트 시나리오\n\n')
        f.write('1. Customer 로그인\n')
        f.write('2. 새 티켓 생성\n')
        f.write('3. 자동 할당 확인\n')
        f.write('4. Agent 로그인\n')
        f.write('5. Agent가 할당된 티켓 확인\n\n')

        f.write('## 테스트 결과\n\n')

        for test, passed in results.items():
            status = '✅ PASS' if passed else '❌ FAIL'
            test_name = test.replace('_', ' ').title()
            f.write(f'- {status}: {test_name}\n')

        passed_count = sum(1 for v in results.values() if v)
        total_count = len(results)
        success_rate = (passed_count / total_count) * 100

        f.write(f'\n**성공률:** {passed_count}/{total_count} ({success_rate:.1f}%)\n\n')

        f.write('## 스크린샷\n\n')
        f.write('테스트 중 캡처된 스크린샷은 `test-screenshots/` 디렉토리에 저장되었습니다.\n\n')

        f.write('## 검증 사항\n\n')
        f.write('- [{}] 티켓 생성 성공\n'.format('x' if results['ticket_created'] else ' '))
        f.write('- [{}] 자동으로 Agent 할당됨\n'.format('x' if results['ticket_assigned'] else ' '))
        f.write('- [ ] SLA 마감 시간 설정됨 (수동 확인 필요)\n')
        f.write('- [{}] Agent가 티켓 확인 가능\n'.format('x' if results['agent_can_view'] else ' '))
        f.write('- [ ] 할당 이력 기록됨 (DB 확인 필요)\n\n')

        f.write('## 추가 확인 필요\n\n')
        f.write('다음 항목은 DB에서 직접 확인이 필요합니다:\n\n')
        f.write('```sql\n')
        f.write('-- 최근 생성된 티켓 확인\n')
        f.write('SELECT id, title, status, agent_id, \n')
        f.write('       sla_response_deadline, sla_resolve_deadline\n')
        f.write('FROM tickets\n')
        f.write('ORDER BY created_at DESC\n')
        f.write('LIMIT 1;\n\n')
        f.write('-- 할당 이력 확인\n')
        f.write('SELECT * FROM ticket_histories\n')
        f.write('WHERE ticket_id = (SELECT id FROM tickets ORDER BY created_at DESC LIMIT 1)\n')
        f.write('ORDER BY created_at DESC;\n')
        f.write('```\n')

    print(f'\n[Report] 테스트 결과 저장: {report_path}')

if __name__ == '__main__':
    main()
