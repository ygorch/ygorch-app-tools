
from playwright.sync_api import sync_playwright
import time

def verify_deeplink_scanner_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(permissions=["camera"])
        page = context.new_page()

        time.sleep(5)

        try:
            print("Navigating to home...")
            page.goto("http://localhost:3000/deeplink-opener")

            # 1. Verify only Camera button is visible initially
            print("Verifying initial buttons...")
            # Camera button should be there
            expect_scan = page.locator("button[title='Scan QR']") # English title (fallback check)
            if expect_scan.count() == 0:
                 # Check by icon class
                 expect_scan = page.locator("button:has(.lucide-camera)")

            if expect_scan.count() > 0:
                 print("Scan button found.")
            else:
                 raise Exception("Scan button not found")

            # Open and Generate buttons should NOT be there
            expect_open = page.locator("button[title='Open']")
            expect_gen = page.locator("button[title='Generate QR Code']")

            if expect_open.count() > 0 or expect_gen.count() > 0:
                 raise Exception("Open/Generate buttons should be hidden when input is empty")
            print("Open/Generate buttons hidden correctly.")

            # 2. Type text and verify buttons appear
            print("Typing text...")
            page.fill("input[type='text']", "myapp://test")

            # Wait a moment for animation
            time.sleep(1)

            if page.locator("button[title='Open']").count() > 0 and page.locator("button[title='Generate QR Code']").count() > 0:
                print("Open/Generate buttons appeared.")
            else:
                raise Exception("Open/Generate buttons did not appear after typing")

            # 3. Verify Camera button is FIRST (leftmost)
            # We can check the order of elements in the container
            # The container is the flex div with gap-2
            buttons = page.locator(".flex.gap-2 button").all()
            if len(buttons) >= 3:
                 # First button should contain the camera icon
                 first_btn_html = buttons[0].inner_html()
                 if "lucide-camera" in first_btn_html:
                      print("Camera button is first.")
                 else:
                      raise Exception("Camera button is not first")

            # 4. Verify Scanner opens directly (no "start" permission intermediate step from UI)
            # Since we use Html5Qrcode.start(), it should just show the video element immediately
            print("Clicking Scan button...")
            # Ensure input is cleared or we just click scan anyway
            page.click("button:has(.lucide-camera)")

            print("Waiting for video element...")
            # Html5Qrcode adds a video element inside #reader
            page.wait_for_selector("#reader video", timeout=10000)
            print("Scanner video started immediately.")

            # Close scanner
            page.click("button >> .lucide-x")


        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_ux.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_deeplink_scanner_ux()
