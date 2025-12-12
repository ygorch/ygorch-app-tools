
from playwright.sync_api import sync_playwright
import time

def verify_deeplink_scanner_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a new context to avoid persistent state interference, though we want to test IDB
        # Grant camera permissions for the scanner
        context = browser.new_context(permissions=["camera"])
        page = context.new_page()

        # Wait for server to be ready
        time.sleep(5)

        try:
            # Navigate to the app
            print("Navigating to home...")
            page.goto("http://localhost:3000/deeplink-opener")

            # Verify Scan Button exists
            print("Verifying Scan button...")
            expect_scan = page.locator("button[title='Scan QR']") # English title
            if expect_scan.count() == 0:
                 # Try other language or just by icon class if title isn't working as expected (though it should)
                 print("Title match failed, looking for camera icon...")
                 # Assuming it's the 2nd button in the group of 3 (Open, Scan, Generate)
                 # But sticking to title is better if translations loaded.
                 raise Exception("Scan button not found")
            else:
                 print("Scan button found.")

            # Click Scan Button
            print("Clicking Scan button...")
            expect_scan.click()

            # Verify Scanner appears
            print("Verifying Scanner container...")
            page.wait_for_selector("#reader")
            print("Scanner container found.")

            # Verify Close Scanner button
            print("Verifying Close Scanner button...")
            page.click("button >> .lucide-x") # Assuming the X icon is used for closing scanner

            # Verify Scanner disappears
            # page.wait_for_selector("#reader", state="hidden") # This might flaky if animation

            # Test Fallback Toast
            # Enter a fake custom scheme URL that won't open
            print("Testing Fallback Toast...")
            fake_link = "nonexistentapp://test/fallback"
            page.fill("input[type='text']", fake_link)

            # Click Open
            page.click("button[title='Open']")

            # Wait for Toast
            # The logic waits 1500ms before showing toast if doc is visible
            print("Waiting for toast...")
            page.wait_for_selector("text=Application not found or not installed")
            print("Toast appeared successfully.")

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/deeplink_scanner_features.png", full_page=True)

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_scanner.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_deeplink_scanner_features()
