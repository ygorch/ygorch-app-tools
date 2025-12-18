
from playwright.sync_api import sync_playwright

def verify_typography_and_routes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Verify Home Screen Typography
        print("Navigating to Home...")
        page.goto("http://localhost:3000")

        # Check H1 has serif font (checking classname presence as proxy or computed style)
        h1 = page.locator("h1")
        h1_class = h1.get_attribute("class")
        print(f"H1 classes: {h1_class}")
        if "font-serif" not in h1_class:
            print("ERROR: H1 does not have font-serif class")
        else:
            print("SUCCESS: H1 has font-serif class")

        # Screenshot Home
        page.screenshot(path="verification/home_typography.png")
        print("Screenshot saved to verification/home_typography.png")

        # 2. Verify Redirects
        # Image Reducer
        print("Testing /image-reducer redirect...")
        response = page.goto("http://localhost:3000/image-reducer")
        print(f"Final URL: {page.url}")
        if "/ireducer" in page.url:
            print("SUCCESS: Redirected to /ireducer")
        else:
            print(f"ERROR: Not redirected correctly. Current: {page.url}")

        page.screenshot(path="verification/ireducer_redirect.png")

        # Deeplink Opener
        print("Testing /deeplink-opener redirect...")
        page.goto("http://localhost:3000/deeplink-opener")
        print(f"Final URL: {page.url}")
        if "/deeplink" in page.url:
            print("SUCCESS: Redirected to /deeplink")
        else:
            print(f"ERROR: Not redirected correctly. Current: {page.url}")

        browser.close()

if __name__ == "__main__":
    verify_typography_and_routes()
