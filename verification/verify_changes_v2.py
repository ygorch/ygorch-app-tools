
from playwright.sync_api import sync_playwright

def verify_typography_and_routes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Verify Home Screen Typography
        print("Navigating to Home...")
        page.goto("http://localhost:3000")

        # Check H1 has serif font (checking computed style)
        h1 = page.locator("h1")
        computed_font = h1.evaluate("element => getComputedStyle(element).fontFamily")
        print(f"H1 Computed Font Family: {computed_font}")

        if "Instrument Serif" in computed_font or "Instrument_Serif" in computed_font:
             print("SUCCESS: H1 is using Instrument Serif")
        else:
             print("WARNING: H1 might not be using Instrument Serif (check if it's because of variable name)")

        # Check App Icon Label Typography
        # Find an app icon label. Based on code it's a div with text-lg font-serif
        # We can look for text "Image Reducer" or similar
        icon_label = page.locator("text=Image Reducer")
        if icon_label.count() > 0:
            icon_computed_font = icon_label.first.evaluate("element => getComputedStyle(element).fontFamily")
            print(f"Icon Label Computed Font Family: {icon_computed_font}")
            if "Instrument Serif" in icon_computed_font or "Instrument_Serif" in icon_computed_font:
                print("SUCCESS: Icon label is using Instrument Serif")
            else:
                 print("WARNING: Icon label might not be using Instrument Serif")
        else:
            print("ERROR: Could not find 'Image Reducer' text to verify font.")

        # Screenshot Home
        page.screenshot(path="verification/home_typography_v2.png")
        print("Screenshot saved to verification/home_typography_v2.png")

        # 2. Verify Redirects
        # Image Reducer
        print("Testing /image-reducer redirect...")
        response = page.goto("http://localhost:3000/image-reducer")
        print(f"Final URL: {page.url}")
        if "/ireducer" in page.url:
            print("SUCCESS: Redirected to /ireducer")
        else:
            print(f"ERROR: Not redirected correctly. Current: {page.url}")

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
