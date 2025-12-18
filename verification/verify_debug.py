
from playwright.sync_api import sync_playwright

def verify_debug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to Home...")
        page.goto("http://localhost:3000")

        # 1. Inspect Body
        body = page.locator("body")
        body_class = body.get_attribute("class")
        print(f"Body classes: {body_class}")

        # Check variable on body
        body_var = body.evaluate("element => getComputedStyle(element).getPropertyValue('--font-instrument-serif')")
        print(f"Body --font-instrument-serif: '{body_var}'")

        # 2. Inspect H1
        h1 = page.locator("h1")
        h1_class = h1.get_attribute("class")
        print(f"H1 classes: {h1_class}")

        h1_font = h1.evaluate("element => getComputedStyle(element).fontFamily")
        print(f"H1 Computed Font Family: '{h1_font}'")

        # Check what .font-serif applies
        # We can create a dummy element or just check computed

        browser.close()

if __name__ == "__main__":
    verify_debug()
