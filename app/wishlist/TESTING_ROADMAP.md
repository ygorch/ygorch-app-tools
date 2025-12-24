# Wishlist Feature Testing Roadmap

This document outlines the functional test steps to verify the stability of the Wishlist feature, specifically targeting the memory leak fixes in list rendering and modal previews.

## 1. List Creation & Rendering
*   **Action**: Click the "Create New List" button.
*   **Action**: Fill in the title, description.
*   **Action**: Upload a custom cover image.
*   **Observation**: Ensure the image preview appears immediately in the modal.
*   **Action**: Save the list.
*   **Observation**: Ensure the new list appears in the main grid with the correct thumbnail.
*   **Verification**: The thumbnail should render without errors. Behind the scenes, the Object URL should be managed (created/revoked) correctly.

## 2. List Modification (Edit)
*   **Action**: Click the "Edit" (pencil) icon on an existing list card.
*   **Observation**: The modal should open with the current details and the current thumbnail preview populated.
*   **Action**: Change the cover image to a different one.
*   **Observation**: The preview should update to the new image.
*   **Action**: Cancel the edit (close modal or click outside).
*   **Observation**: The list on the dashboard should remain unchanged.
*   **Action**: Edit again, change image, and click "Save Changes".
*   **Observation**: The list card on the dashboard should update to the new image.

## 3. List Duplication
*   **Action**: Click the "Duplicate" (copy) icon on a list card.
*   **Observation**: A new list should appear with "(Copy)" appended to the title.
*   **Observation**: If the original had a custom image, the duplicate should also display the same image.

## 4. List Deletion
*   **Action**: Click the "Delete" (trash) icon on a list card.
*   **Action**: Confirm the deletion prompt.
*   **Observation**: The list should disappear from the grid.

## 5. Adding & Removing Items
*   **Action**: Click on a list card to enter the list detail view.
*   **Action**: Add a new item (URL/Title).
*   **Observation**: The item should appear in the list.
*   **Action**: Delete the item.
*   **Observation**: The item should disappear.

## 6. Export & Import
*   **Action**: (If export functionality exists on the list detail page) Export the list to JSON.
*   **Action**: Return to the main Wishlist page.
*   **Action**: Use the "Import" button to upload the JSON file.
*   **Observation**: A new list should be created with all the details (including custom image if supported by export format) and items from the file.

## Technical Verification (Memory Leak)
*   **Goal**: Ensure `URL.createObjectURL` is not called indefinitely without `URL.revokeObjectURL`.
*   **Code Check**:
    *   `WishlistCard.tsx`: Uses `useEffect` to create the URL and returns a cleanup function calling `revokeObjectURL`.
    *   `page.tsx` (Modal): Uses `useEffect` watching `thumbnailPreview` to revoke the old URL when the component unmounts or the state changes.
