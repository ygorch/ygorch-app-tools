
from playwright.sync_api import sync_playwright
import time

def verify_deeplink_opener_qr_features():
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
            page.goto("http://localhost:3000/deeplink-opener")

            # Type a deeplink
            print("Typing deeplink...")
            test_link = "myapp://verify/test"
            page.fill("input[type='text']", test_link)

            # Generate QR Code
            print("Generating QR Code...")
            # We look for the generate QR button. Assuming title is "Generate QR Code" in English
            page.click("button[title='Generate QR Code']")

            # Wait for QR code to appear
            page.wait_for_selector("#qrcode-svg")

            # Verify new buttons exist
            print("Verifying new buttons...")
            # Download button
            expect_download = page.locator("button", has_text="Download")
            if expect_download.count() > 0:
                print("Download button found.")
            else:
                raise Exception("Download button not found")

            # Share button
            expect_share = page.locator("button", has_text="Share")
            if expect_share.count() > 0:
                 print("Share button found.")
            else:
                 raise Exception("Share button not found")

            # Close button (hover needed usually, but we check presence in DOM)
            # It has title="Close"
            expect_close = page.locator("button[title='Close']")
            if expect_close.count() > 0:
                 print("Close button found.")
            else:
                 raise Exception("Close button not found")

            # Take screenshot of the QR section
            print("Taking screenshot...")
            page.screenshot(path="verification/deeplink_qr_features.png", full_page=True)

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_qr.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_deeplink_opener_qr_features()
