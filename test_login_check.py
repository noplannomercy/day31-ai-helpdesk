#!/usr/bin/env python3
"""
Simple login test to check account credentials
"""

from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://localhost:3002'

# Test credentials to try
TEST_ACCOUNTS = [
    ('customer1@example.com', 'Customer123!', 'customer'),
    ('customer1@example.com', 'customer123', 'customer'),
    ('customer1@example.com', 'password123', 'customer'),
    ('agent1@example.com', 'Agent123!', 'agent'),
    ('agent1@example.com', 'agent123', 'agent'),
]

def take_screenshot(page, name):
    """Save screenshot"""
    screenshots_dir = 'test-screenshots'
    os.makedirs(screenshots_dir, exist_ok=True)
    filepath = os.path.join(screenshots_dir, f'{name}.png')
    page.screenshot(path=filepath, full_page=True)
    print(f'[Screenshot] {filepath}')
    return filepath

def try_login(page, email, password, expected_role):
    """Try to login with given credentials"""
    print(f'\n=== Trying login: {email} / {password} ===')

    # Navigate to login page
    page.goto(f'{BASE_URL}/login')
    page.wait_for_load_state('networkidle')
    time.sleep(1)

    # Fill in email
    email_input = page.locator('#email')
    if email_input.count() == 0:
        print('[ERROR] Email input not found')
        take_screenshot(page, f'error_{email.replace("@", "_")}')
        return False

    email_input.fill(email)

    # Fill in password
    password_input = page.locator('#password')
    if password_input.count() == 0:
        print('[ERROR] Password input not found')
        return False

    password_input.fill(password)

    take_screenshot(page, f'before_submit_{email.replace("@", "_")}')

    # Click submit
    submit_button = page.locator('button[type="submit"]')
    submit_button.click()

    # Wait for navigation or error
    time.sleep(3)

    current_url = page.url
    print(f'Current URL after submit: {current_url}')

    # Check for error messages
    page_text = page.locator('body').inner_text()

    if '로그인 실패' in page_text or '올바르지 않습니다' in page_text:
        print('[FAIL] Login failed - wrong credentials')
        take_screenshot(page, f'failed_{email.replace("@", "_")}')
        return False

    if '/login' not in current_url:
        print(f'[SUCCESS] Login successful! Redirected to: {current_url}')
        take_screenshot(page, f'success_{email.replace("@", "_")}')
        return True

    print('[FAIL] Still on login page')
    take_screenshot(page, f'stuck_{email.replace("@", "_")}')
    return False

def main():
    print('=== Login Credentials Check ===\n')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        successful_logins = []

        try:
            for email, password, role in TEST_ACCOUNTS:
                success = try_login(page, email, password, role)
                if success:
                    successful_logins.append((email, password, role))
                    # Logout for next test
                    page.goto(f'{BASE_URL}/api/auth/signout')
                    time.sleep(1)

        except Exception as e:
            print(f'\n[ERROR] Test failed: {e}')
            import traceback
            traceback.print_exc()

        finally:
            browser.close()

        # Results
        print('\n' + '='*60)
        print('=== Test Results ===')
        print('='*60)

        if successful_logins:
            print('\n✅ Working credentials found:')
            for email, password, role in successful_logins:
                print(f'  - {role.upper()}: {email} / {password}')
        else:
            print('\n❌ No working credentials found')
            print('\nPossible issues:')
            print('  1. Accounts not created yet')
            print('  2. Different passwords than expected')
            print('  3. Database connection issues')
            print('\nPlease create test accounts manually or check existing credentials.')

if __name__ == '__main__':
    main()
