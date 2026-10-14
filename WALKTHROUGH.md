# Understand and present Chapter

## A two-minute demo

1. Start with an empty library. Explain that data is stored locally in this browser.
2. Click Add a book and submit blank fields to show the inline validation.
3. Add **Aadujeevitham**, author **Benyamin**, status **To read**.
4. Add a second book and show that it appears above the first.
5. Search for **ben**. Only the Benyamin match should remain.
6. Change its status to **Finished** and show the updated count.
7. Refresh. The book and status should remain.
8. Show a status filter, delete with undo, and the phone layout if time permits.

## Explain the architecture in your own words

“HTML defines the interface, CSS styles and adapts it, and JavaScript manages the book list. Each book has an ID, title, author, status, and creation timestamp. The list lives in an array while the app is running. After changes, the array is converted to JSON and saved to localStorage. On startup, the app parses and validates that JSON, then renders the books.”

Use this as a study aid, not a claim that you wrote every line without assistance.

## Functions to understand in app.js

| Function | What it does |
| --- | --- |
| `newBook` | Creates a record with a stable unique ID and timestamp |
| Form submit handler | Trims inputs, rejects missing values, adds a record, saves, and renders |
| `saveBooks` | Serializes the full array and reports storage failures |
| `loadBooks` | Reads saved JSON and handles unavailable or invalid storage |
| `validateStoredBooks` | Checks record structure and sorts newest first |
| `render` | Updates counts, applies search/status filters, and rebuilds the visible cards |
| `makeBookCard` | Creates safe DOM elements and attaches book-specific controls |
| `changeStatus` | Updates a book by ID, saves, and renders |
| `deleteBook` | Removes a book and remembers it for a short undo window |
| `storage` event handler | Receives updates from other tabs using the same origin |

## Questions you should be able to answer

**Why use an ID instead of a title to identify a book?** Titles can repeat. An ID identifies the exact record to update or delete.

**Why trim input?** A string of spaces is nonempty but does not satisfy the requirement for a meaningful title or author.

**Why use JSON?** Local storage stores strings. JSON represents the array of book objects as a string; parsing reconstructs the data.

**Why does changing status not move a book to the top?** The brief asks for newest additions first, so ordering uses creation time, not modification time.

**Why use textContent?** It displays user input as text rather than interpreting it as HTML.

**What is stored when someone searches?** Search changes the visible view. It does not remove or rewrite stored books.

**Why does the hosted app not show books added in local preview?** Storage is isolated by origin. Different domains or ports have different storage.

**What are the limitations?** No account or cross-device sync, no shared database, limited browser storage, and no guarantee against truly simultaneous tab writes. Clearing browser data removes the saved library.

**What did AI get wrong?** Read PROMPTS.md and reproduce the two-tab case. Be clear that the assistant found and corrected it during testing. Explain the mechanism yourself before discussing it in an interview.

## Before submitting

Confirm the exact GitHub and public live URLs, review PROMPTS.md for accuracy, try the required-feature demo yourself, and submit through the platform before its deadline. Do not claim tests, prompts, or authorship that did not happen.
