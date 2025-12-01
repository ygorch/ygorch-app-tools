from playwright.sync_api import sync_playwright

def verify_wishlist(page):
    # 1. Go to home page and verify link
    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle")

    # 2. Click Wishlist link
    page.click("text=Wishlist")
    page.wait_for_url("**/wishlist")

    # 3. Create a new list
    page.click("text=New List")

    # Fill form
    page.fill("input[placeholder='e.g., Tech Upgrade 2024']", "My Dream Setup")
    page.fill("textarea[placeholder='What\\'s this list for?']", "Things I want to buy")

    # Select color (Orange)
    page.click("button[aria-label='Orange']")

    # Submit List Creation
    page.click("button[type='submit']")

    # 4. Verify list created and click it
    page.wait_for_selector("text=My Dream Setup")
    page.click("text=My Dream Setup")
    page.wait_for_url("**/wishlist/*")

    # 5. Add an Item
    # Click the "Add Item" button to open modal
    page.click("text=Add Item")

    # Fill Item Title
    page.fill("input[placeholder='e.g., Wireless Headphones']", "Super Mouse")

    # Create new category
    page.click("text=+ New Category")
    page.fill("input[placeholder='e.g., Electronics, Clothes...']", "Peripherals")
    page.click("text=Save Category")

    # Wait for category to be selected (it's auto-selected in logic)
    # The modal for category should close, and we are back to Item modal.
    # Now click the Submit button for the Item.
    # We use a more specific selector to avoid confusion with the trigger button.
    page.click("button[type='submit']")

    # 6. Take Screenshot of the list detail view
    # Verify the item appears in the list
    page.wait_for_selector("text=Super Mouse")
    page.screenshot(path="verification/wishlist_detail.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_wishlist(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_retry.png")
        finally:
            browser.close()
