
from playwright.sync_api import sync_playwright
import time
import json
import os

def run():
    # Create a dummy JSON file for import
    import_data = [
        {
            "id": "imported-item-1",
            "title": "Imported Item 1",
            "url": "https://example.com/1",
            "categoryId": "some-cat",
            "createdAt": 1234567890
        },
        {
            "id": "imported-item-2",
            "title": "Imported Item 2",
            "createdAt": 1234567890
        }
    ]

    os.makedirs("verification", exist_ok=True)
    with open("verification/import_test.json", "w") as f:
        json.dump(import_data, f)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        page.on("dialog", lambda dialog: dialog.accept())

        page.goto("http://localhost:3000/wishlist")
        page.wait_for_load_state("networkidle")

        page.evaluate("""
            () => {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open('wishlist-db', 1);
                    request.onsuccess = (event) => {
                        const db = event.target.result;
                        const tx = db.transaction(['lists'], 'readwrite');
                        const store = tx.objectStore('lists');
                        const list = {
                            id: 'test-list-import',
                            title: 'Import Test List',
                            description: 'Testing import feature',
                            color: 'bg-green-500',
                            iconName: 'Download',
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        };
                        store.put(list);
                        resolve();
                    };
                });
            }
        """)

        page.goto("http://localhost:3000/wishlist/test-list-import")
        page.wait_for_selector("text=Import Test List")

        page.set_input_files('input[type="file"]', "verification/import_test.json")

        page.wait_for_selector("text=Imported Item 1")

        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)
        page.screenshot(path="verification/verification_import.png", full_page=True)
        browser.close()

if __name__ == "__main__":
    run()
