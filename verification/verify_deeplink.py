
from playwright.sync_api import sync_playwright
import time

def verify_deeplink_opener():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a new context to avoid persistent state interference, though we want to test IDB
        context = browser.new_context()
        page = context.new_page()

        # Wait for server to be ready
        time.sleep(5)

        try:
            # Navigate to the app
            print("Navigating to home...")
            page.goto("http://localhost:3000")

            # Click on Deeplink Opener app card
            print("Clicking Deeplink Opener...")
            # We look for the link with href /deeplink-opener
            page.click("a[href='/deeplink-opener']")

            # Wait for navigation
            page.wait_for_url("**/deeplink-opener")
            print("Navigated to Deeplink Opener")

            # Verify Title
            # H1 should contain "Deeplink Opener"
            # Since H1 is dynamically loaded via translation, we wait a bit or look for it
            page.wait_for_selector("h1")

            # Type a deeplink
            print("Typing deeplink...")
            test_link = "myapp://verify/test"
            page.fill("input[type='text']", test_link)

            # Generate QR Code
            print("Generating QR Code...")
            # Use specific selectors based on implementation or title attributes
            # We added title="Generate QR Code" to the button
            page.click("button[title='Generate QR Code']") # Adjust if title is different in English defaults

            # Wait for QR code to appear
            page.wait_for_selector("svg") # react-qr-code renders an SVG

            # Verify History
            # We expect to see the link in history now
            print("Verifying history...")
            page.wait_for_selector(f"text={test_link}")

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/deeplink_verification.png", full_page=True)

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_deeplink_opener()
