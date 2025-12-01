from playwright.sync_api import sync_playwright

def verify_wishlist_features(page):
    # 1. Go to Wishlist Home
    page.goto("http://localhost:3000/wishlist")
    page.wait_for_load_state("networkidle")

    # 2. Check "New List" button position
    page.wait_for_selector("text=New List")

    # 3. Create a list with an Emoji
    page.click("text=New List")
    page.fill("input[placeholder='e.g., Tech Upgrade 2024']", "Emoji List")

    # Switch to Emoji tab
    page.click("text=Emojis")
    # Select first emoji
    page.click("button:has-text('🎁')")

    # Create (Target the submit button specifically)
    page.click("button[type='submit']")

    # 4. Verify List Created with Emoji
    page.wait_for_selector("text=Emoji List")
    page.screenshot(path="verification/wishlist_home_updated.png")

    # 5. Go to List Detail
    page.click("text=Emoji List")
    page.wait_for_url("**/wishlist/*")

    # 6. Add Item
    page.click("text=Add Item") # Trigger button
    page.fill("input[placeholder='e.g., Wireless Headphones']", "Edit Me Item")

    # Create new category
    page.click("text=+ New Category")
    page.fill("input[placeholder='e.g., Electronics, Clothes...']", "Test Cat")
    page.click("button:has-text('Save Category')")

    # Submit Item (Target the modal submit button, which is w-full)
    # We can use the text, but ensure it's the one in the modal
    page.click("form button:has-text('Add Item')")

    # 7. Verify Item and Edit Button
    page.wait_for_selector("text=Edit Me Item")

    # 8. Verify Export Buttons at bottom
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.screenshot(path="verification/wishlist_detail_updated.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_wishlist_features(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_retry_final.png")
        finally:
            browser.close()
