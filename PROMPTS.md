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

### Prompt 4: Design and interaction

Now I'd like to polish the look and feel. I want the site to be clean and 
modern, like the best designs out there, with some interactive elements.

Here's the direction I have in mind:
- Name the site "Chapter", with a warm paper-and-green colour palette.
- Use original, book-inspired artwork made with CSS (no copyrighted images).
- Add status filters (All, To read, Reading, Finished) and a small count 
  of what I'm currently reading.
- Make delete forgiving by offering an Undo after a book is removed.
- Add subtle hover, focus, and transition states that feel responsive 
  without being distracting.

Please check the layout at desktop width, 390px, and 320px. If any 
decorative element gets clipped on small screens, remove it at that 
breakpoint so the main content stays clear.


## Pages-read progress feels like the right next feature. Can we work on that?

What I'd like:
- Optional "total pages" and "pages read" fields in the add-book form.
- A progress bar and percentage on each book card.
- An expandable control on each card to update the page counts later.
- Persistence for totalPages and pagesRead, with sensible defaults for 
  older books that don't have these fields yet.
- Keyboard focus returned to a sensible place after saving progress.

Rules for the data:
1. Page counts are optional.
2. Pages read must be a non-negative whole number.
3. Total pages, if given, must be a positive whole number.
4. Pages read can't exceed total pages.
5. A positive pages-read value requires a total page count.
6. Round the percentage down, so an unfinished book never shows 100%.
7. Status stays under my control. Hitting 100% should not automatically 
   mark the book as Finished.

**Important implementation decisions:**

1. Page counts are optional.
2. Pages read must be a nonnegative whole number.
3. Total pages, when supplied, must be a positive whole number.
4. Pages read cannot exceed total pages.
5. A positive pages-read value requires a total page count.
6. The displayed percentage uses rounding down so an unfinished book
   does not display 100%.
7. Reading status remains manually controlled. Reaching 100% does not
   automatically mark the book Finished.



## One time the AI got something wrong

**The mistake:** The initial AI-generated cross-tab storage listener ignored updates while the add-book dialog was open:

```js
if ((event.key !== STORAGE_KEY && event.key !== null) || dialog.open) return;
```

**How it was noticed:** During browser verification, opened a draft in tab A, saved a different book in tab B, then submitted tab A. The book added in tab B disappeared because tab A saved an outdated array. Refreshing confirmed the loss. This was a real observed failure, not an intentionally planted bug.

**Correction made:** Removed the `dialog.open` exclusion. The event handler now refreshes the underlying book array even while the form is open. Rendering the library does not reset the form, so the typed draft remains intact and the next save includes the other tab's book.

```js
if (event.key !== STORAGE_KEY && event.key !== null) return;
```

**Verification:** The same two-tab sequence was repeated. Both “Second tab after fix” and “First tab after fix” were present after the submission. The temporary test records were then removed.

**What this demonstrates:** A normal one-tab refresh test was insufficient to reveal the issue. Reproducing the exact sequence made the cause visible, and repeating it after the change verified the correction. Local storage still has limits for genuinely simultaneous writes; the app does not claim collaborative-database guarantees.

## Suggested follow-up prompt

“Walk me through the data flow from submitting a book to saving and restoring it. Then ask me to explain why the original cross-tab bug occurred. Do not give me the answer until I have tried.”
