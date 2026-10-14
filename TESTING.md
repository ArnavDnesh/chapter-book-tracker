# Verification record

These checks were performed by the AI assistant in the local browser preview on 14 October 2026. They are not claimed as tests personally performed by the applicant. Temporary records were used, and no real user library was modified.

| Check | Result |
| --- | --- |
| JavaScript syntax | Passed with `node --check` |
| Initial library | Starts empty; sample content is opt-in |
| Empty required fields | Title and author show inline error messages |
| Whitespace-only fields | Both rejected after trimming |
| Valid book | Added successfully with title, author, and selected status |
| Newest first | Three sequential additions appeared in reverse insertion order |
| Author search | `BEN` matched Benyamin case-insensitively |
| Title search | `secret` matched The Secret Garden |
| No results | Clear empty-state message and a working Clear filters action |
| Status filter | Reading showed only the corresponding book |
| Status persistence | Changed status remained selected after reload |
| Book persistence | All saved books remained after reload |
| Delete | Selected card removed and counts updated |
| Undo | Restored the removed book in its original creation order |
| Safe text rendering | `<b>Not markup</b>` appeared literally; no nested HTML element was created |
| Cross-tab draft regression | Failed in first version; passed after correction |
| Phone layout | Inspected at 390px and 320px; no horizontal document overflow |
| Phone dialog | Labels, fields, buttons, and focus visible at 390px |
| Browser console | No errors or warnings reported in the inspected preview |

## Reproduce the corrected cross-tab bug

1. Open the app in two tabs on the same origin.
2. In tab A, open Add a book and enter a title and author without submitting.
3. In tab B, add a different book.
4. Submit the draft in tab A.
5. Confirm that both books remain, including after refreshing.

The first version failed step 5 because it skipped storage events while a dialog was open. The corrected version keeps library data current without touching the draft inputs.

## Further checks for the applicant

- Repeat the required-feature demo on the final hosted URL; local preview data does not transfer to another origin.
- Open the live URL in a private browser window to verify reviewer access.
- Confirm repository access and the final submission receipt.
- Storage-denied, quota-exceeded, malformed-storage recovery, and truly simultaneous writes were considered in the code but were not all exercised through browser fault injection. Do not claim a comprehensive browser compatibility or accessibility audit.
