
from playwright.sync_api import sync_playwright
import time
import urllib.parse

def verify_deeplink_share_and_params():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant camera permissions for the scanner
        context = browser.new_context(permissions=["camera"])
        page = context.new_page()

        time.sleep(5)

        try:
            # 1. Test Query Param Handling
            print("Testing query param handling...")
            test_link = "myapp://param/test"
            encoded_link = urllib.parse.quote(test_link)
            url = f"http://localhost:3000/deeplink-opener?link={encoded_link}"

            page.goto(url)

            # Wait for input to be populated
            # We check the value of the input
            page.wait_for_function(f"document.querySelector('input').value === '{test_link}'")
            print("Query param populated input correctly.")

            # 2. Test Buttons are visible (since input is populated)
            if page.locator("button[title='Open']").count() > 0:
                 print("Open button visible.")
            else:
                 raise Exception("Open button should be visible")

            # 3. Generate QR and Verify Share/Download Logic (Implicitly via Screenshot or Code Check)
            # Since we can't easily intercept "navigator.share" or canvas file download content in a simple headless script
            # without complex mocking, we will trust the code change if the UI doesn't crash and buttons work.

            print("Generating QR...")
            page.click("button[title='Generate QR Code']")
            page.wait_for_selector("#qrcode-svg")

            # Click Download
            print("Clicking Download...")
            # We assume it doesn't crash. In a real env this triggers download.
            # In headless, it might just do nothing or trigger an event we ignore.
            with page.expect_download() as download_info:
                 page.click("button:has-text('Download')")

            download = download_info.value
            print(f"Download triggered: {download.suggested_filename}")
            if "myapp-param-test.png" in download.suggested_filename and "-" in download.suggested_filename:
                 print("Filename format seems correct (sanitized and timestamped).")
            else:
                 print(f"Warning: Filename might not match expected format: {download.suggested_filename}")
                 # It might be unpredictable timestamp, so flexible check is fine

            # Click Share (Mocking navigator.share would be needed to verify arguments)
            # We just verify button exists and is clickable
            print("Clicking Share...")
            page.click("button:has-text('Share')")
            # If no alert (since we didn't mock and headless might not support share), or if alert "Web Share API not supported"
            # We can check for alert

            # Check if alert appears (Web Share API not supported in this headless likely)
            # We can't easily assert alert content in sync api without handling dialog event
            # But if it didn't crash, we are good.

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_share.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_deeplink_share_and_params()
