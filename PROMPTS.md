# Prompt log — Chapter Book Tracker


## 1. Core behaviour

**Prompt excerpt:** “Add a book with a title, an author, and a status of To read, Reading or Finished. Title and author are required.”

**What happened:** The assistant implemented a labelled modal form, trimmed title/author validation, the three specified statuses, unique record IDs, and inline error messages. Browser checks confirmed that empty and whitespace-only values were rejected and that valid books appeared in the list.

## 2. Find and update books

**Prompt excerpts:** “Show the list of books, newest first.” “Search the list by title or author.” “Change a book's status, for example from Reading to Finished.”

**What happened:** Books are added at the front of the library and sorted by their creation time after loading. Search matches both title and author without case sensitivity. Status changes update counts and filters without changing creation order. Browser checks used the brief's Aadujeevitham/Benyamin example and an uppercase author search.

## 3. Persistence

**Prompt excerpt:** “Keep the data when the page is refreshed. Saving in the browser, called local storage, is fine.”

**What happened:** The assistant stored the complete book records as JSON and restored them on load. Refresh testing confirmed that both books and their changed statuses persisted. A separate two-tab test exposed a real synchronization bug, described below, and the assistant corrected it.

## 4. Design and interaction

**Prompt excerpt:** “also the website ui should be clean and modern like with best designs and also maybe interactive elements too. we need to develop this website in a manner that would impress everyone.”

**What happened:** The assistant chose the name Chapter, a warm paper/green palette, original book-inspired CSS artwork, status filters, reading counts, and delete with undo. The browser preview was inspected at desktop, 390-pixel, and 320-pixel widths. A clipped decorative illustration on phones was removed at that breakpoint so the reading introduction retains a clear layout.

## 5. Process documentation

**Prompt excerpts:** “Create a file called PROMPTS.md in your project.” “also make sure we create prompts.md file at the end with the prompts you give that would impress the recruiters too”

**What happened:** The assistant created this log, a README, a verification record, and a code walkthrough. The log preserves the real source of the instructions and describes an actual failed test instead of fabricating five conversations or claiming that the user personally ran the checks.

## One time the AI got something wrong

**The mistake:** The initial AI-generated cross-tab storage listener ignored updates while the add-book dialog was open:

```js
if ((event.key !== STORAGE_KEY && event.key !== null) || dialog.open) return;
```

**How it was noticed:** During browser verification, the assistant opened a draft in tab A, saved a different book in tab B, then submitted tab A. The book added in tab B disappeared because tab A saved an outdated array. Refreshing confirmed the loss. This was a real observed failure, not an intentionally planted bug.

**Correction made:** The assistant removed the `dialog.open` exclusion. The event handler now refreshes the underlying book array even while the form is open. Rendering the library does not reset the form, so the typed draft remains intact and the next save includes the other tab's book.

```js
if (event.key !== STORAGE_KEY && event.key !== null) return;
```

**Verification:** The same two-tab sequence was repeated. Both “Second tab after fix” and “First tab after fix” were present after the submission. The temporary test records were then removed.

**What this demonstrates:** A normal one-tab refresh test was insufficient to reveal the issue. Reproducing the exact sequence made the cause visible, and repeating it after the change verified the correction. Local storage still has limits for genuinely simultaneous writes; the app does not claim collaborative-database guarantees.

## Suggested follow-up prompt (not yet sent by the user)

“Walk me through the data flow from submitting a book to saving and restoring it. Then ask me to explain why the original cross-tab bug occurred. Do not give me the answer until I have tried.”

This is a suggested learning prompt, not a historical log entry.
