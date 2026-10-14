/* Chapter: a dependency-free book tracker. Book data never leaves this browser. */
(() => {
  'use strict';
  const STORAGE_KEY = 'chapter.books.v1';
  const STATUSES = { 'to-read': 'To read', reading: 'Reading', finished: 'Finished' };
  const PALETTES = [
    ['#e8ecdf', '#365344', '#eee7ce'], ['#efe4da', '#af674c', '#fff0db'],
    ['#e4e9ed', '#455b70', '#f4e4bf'], ['#eee9dc', '#b18c43', '#fff5d5'],
    ['#e9e5ed', '#6b5c79', '#f6e6d4'], ['#e4ebe5', '#4b766a', '#f4e9c5']
  ];
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#book-dialog');
  const form = $('#book-form');
  const search = $('#search');
  let books = [];
  let filter = 'all';
  let query = '';
  let undoBook = null;
  let toastTimer;
  let storageBlocked = false;
  let rawBackup = null;
  let returnFocus = null;

  function validateStoredBooks(data) {
    if (!Array.isArray(data)) throw new Error('Invalid saved library');
    const ids = new Set();
    return data.map((book) => {
      if (!book || typeof book.id !== 'string' || ids.has(book.id) ||
          typeof book.title !== 'string' || !book.title.trim() ||
          typeof book.author !== 'string' || !book.author.trim() ||
          !Object.hasOwn(STATUSES, book.status) || !Number.isFinite(book.createdAt)) {
        throw new Error('Invalid saved book');
      }
      ids.add(book.id);
            // Older books do not have page counts yet.
      const totalPages = book.totalPages ?? null;
      const pagesRead = book.pagesRead ?? 0;

      const validTotal =
        totalPages === null ||
        (Number.isSafeInteger(totalPages) && totalPages > 0);

      const validRead =
        Number.isSafeInteger(pagesRead) && pagesRead >= 0;

      if (
        !validTotal ||
        !validRead ||
        (totalPages === null && pagesRead !== 0) ||
        (totalPages !== null && pagesRead > totalPages)
      ) {
        throw new Error('Invalid saved reading progress');
      }

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        status: book.status,
        createdAt: book.createdAt,
        totalPages,
        pagesRead
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  }

  function warnStorage(message, recoverable = false) {
    $('#storage-warning').hidden = false;
    $('#storage-message').textContent = message;
    $('#recovery-actions').hidden = !recoverable;
    $('#save-note').classList.add('unsaved');
    $('#save-note').lastChild.textContent = 'Not saved to this device';
  }

  function loadBooks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      rawBackup = raw;
      books = validateStoredBooks(JSON.parse(raw));
      rawBackup = null;
    } catch (error) {
      if (rawBackup !== null) {
        storageBlocked = true;
        warnStorage('Your saved library could not be read. Download a backup before starting a new library. Changes here will stay in this tab until you reset the saved library.', true);
      } else {
        warnStorage('Browser storage is unavailable. You can use Chapter, but changes will only stay in this tab.');
      }
    }
  }

  function saveBooks() {
    if (storageBlocked) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
      $('#storage-warning').hidden = true;
      $('#save-note').classList.remove('unsaved');
      $('#save-note').lastChild.textContent = 'Saved on this device';
      return true;
    } catch {
      warnStorage('Your browser could not save these changes. They are available in this tab, but may be lost on refresh. Check browser storage settings or free up space.');
      return false;
    }
  }

  function normalize(text) {
    return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function paletteFor(title) {
    let hash = 0;
    for (const char of title) hash = ((hash * 31) + char.codePointAt(0)) >>> 0;
    return PALETTES[hash % PALETTES.length];
  }

  function makeBookCard(book) {
    const card = element('article', 'book-card');
    card.dataset.id = book.id;
    const [background, ink, type] = paletteFor(book.title);
    card.style.setProperty('--cover-bg', background);
    card.style.setProperty('--cover-ink', ink);
    card.style.setProperty('--cover-type', type);
    const cover = element('div', 'book-cover');
    const mini = element('div', 'mini-book');
    mini.setAttribute('aria-hidden', 'true');
    mini.append(element('span', 'cover-author', book.author), element('span', 'cover-title', book.title), element('span', 'cover-ornament'));
    const remove = element('button', 'delete-book');
    remove.setAttribute('aria-label', `Delete ${book.title}`);
    remove.title = 'Delete book';
    remove.append(icon('trash'));
    remove.addEventListener('click', () => deleteBook(book.id));
    cover.append(mini, remove);
    const info = element('div', 'book-info');
    info.append(element('h3', '', book.title), element('p', 'book-author', book.author));
    const bottom = element('div', 'book-bottom');
    const select = element('select', `status-select ${book.status}`);
    select.setAttribute('aria-label', `Reading status for ${book.title}`);
    Object.entries(STATUSES).forEach(([value, label]) => {
      const option = element('option', '', label);
      option.value = value;
      select.append(option);
    });
    select.value = book.status;
    select.addEventListener('change', () => changeStatus(book.id, select.value));
    const date = new Date(book.createdAt);
    const dateLabel = element('span', 'date-label', date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    dateLabel.title = `Added ${date.toLocaleDateString()}`;
    bottom.append(select, dateLabel);
    info.append(bottom);
    card.append(cover, info);
    return card;
  }

  function render() {
    const counts = { all: books.length, 'to-read': 0, reading: 0, finished: 0 };
    books.forEach((book) => counts[book.status]++);
    document.querySelectorAll('[data-count]').forEach((node) => { node.textContent = counts[node.dataset.count]; });
    document.querySelectorAll('[data-filter]').forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const term = normalize(query.trim());
    const visible = books.filter((book) => (filter === 'all' || book.status === filter) &&
      (!term || normalize(book.title).includes(term) || normalize(book.author).includes(term)));
    $('#book-grid').replaceChildren(...visible.map(makeBookCard));
    $('#book-grid').hidden = visible.length === 0;
    $('#empty-state').hidden = visible.length > 0;
    $('#result-count').textContent = books.length ? `${visible.length} ${visible.length === 1 ? 'book' : 'books'}${filter !== 'all' ? ` · ${STATUSES[filter]}` : ''}${term ? ` matching “${query.trim()}”` : ' on your shelf'}` : 'Your next great read belongs here.';
    const isEmpty = books.length === 0;
    $('#empty-title').textContent = isEmpty ? 'Every good shelf starts with one book.' : 'A little quiet on this shelf.';
    $('#empty-copy').textContent = isEmpty ? 'A future favourite is waiting. Add your first book and make this little space your own.' : 'No books match these filters. Try another title, author, or reading status.';
    $('#empty-action span').textContent = isEmpty ? 'Add your first book' : 'Clear filters';
    $('#sample-books').hidden = !isEmpty;
    $('#clear-search').hidden = !query;
    $('#search-hint').hidden = !!query;
  }

  function showToast(message, withUndo = false) {
    clearTimeout(toastTimer);
    $('#toast-text').textContent = message;
    $('#undo-delete').hidden = !withUndo;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; undoBook = null; }, withUndo ? 10000 : 4500);
  }

  function clearErrors() {
    ['title', 'author'].forEach((field) => {
      $(`#${field}-error`).hidden = true;
      $(`#book-${field}`).removeAttribute('aria-invalid');
    });
  }

  function openDialog() {
    if (dialog.open) return;
    returnFocus = document.activeElement;
    form.reset();
    clearErrors();
    dialog.showModal();
    $('#book-title').focus();
  }

  function closeDialog() { dialog.close(); }
  dialog.addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus(); });

  function newBook(title, author, status) {
    return {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title, author, status,
      createdAt: Math.max(Date.now(), (books[0]?.createdAt || 0) + 1)
    };
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const title = $('#book-title').value.trim();
    const author = $('#book-author').value.trim();
    let firstInvalid;
    for (const [field, value] of [['title', title], ['author', author]]) {
      if (!value) {
        const input = $(`#book-${field}`);
        input.setAttribute('aria-invalid', 'true');
        $(`#${field}-error`).textContent = field === 'title' ? 'Please enter a title' : 'Please enter an author';
        $(`#${field}-error`).hidden = false;
        firstInvalid ||= input;
      }
    }
    if (firstInvalid) { firstInvalid.focus(); return; }
    const status = $('#book-status').value;
    if (!Object.hasOwn(STATUSES, status)) return;
    books.unshift(newBook(title, author, status));
    const saved = saveBooks();
    filter = 'all'; query = ''; search.value = '';
    render(); closeDialog();
    showToast(saved ? 'A new chapter, added to your shelf.' : 'Book added in this tab. Browser storage is unavailable.');
  });

  function changeStatus(id, status) {
    const book = books.find((item) => item.id === id);
    if (!book || !Object.hasOwn(STATUSES, status)) return;
    book.status = status;
    const saved = saveBooks();
    render();
    const card = [...document.querySelectorAll('.book-card')].find((node) => node.dataset.id === id);
    if (card) card.querySelector('select').focus();
    else document.querySelector(`.filter-tab[data-filter="${filter}"]`).focus();
    showToast(`${status === 'finished' ? 'Another story, beautifully finished.' : `Status updated to ${STATUSES[status]}.`}${saved ? '' : ' Changes are only in this tab.'}`);
  }

  function deleteBook(id) {
    undoBook = books.find((book) => book.id === id);
    if (!undoBook) return;
    books = books.filter((book) => book.id !== id);
    const saved = saveBooks();
    render();
    showToast(saved ? 'Book removed from your shelf.' : 'Book removed in this tab only.', true);
    $('#undo-delete').focus();
  }

  $('#undo-delete').addEventListener('click', () => {
    if (!undoBook) return;
    if (!books.some((book) => book.id === undoBook.id)) books.push(undoBook);
    books.sort((a, b) => b.createdAt - a.createdAt);
    undoBook = null;
    const saved = saveBooks();
    render();
    showToast(saved ? 'Book restored. Welcome back.' : 'Book restored in this tab only.');
    search.focus();
  });

  document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', openDialog));
  $('#close-dialog').addEventListener('click', closeDialog);
  $('#cancel-dialog').addEventListener('click', closeDialog);
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter; render();
  }));
  search.addEventListener('input', () => { query = search.value; render(); });
  $('#clear-search').addEventListener('click', () => { query = ''; search.value = ''; render(); search.focus(); });
  $('#empty-action').addEventListener('click', () => {
    if (!books.length) openDialog();
    else { filter = 'all'; query = ''; search.value = ''; render(); search.focus(); }
  });
  $('#sample-books').addEventListener('click', () => {
    if (books.length) return;
    for (const [title, author, status] of [
      ['The Little Prince', 'Antoine de Saint-Exupéry', 'finished'],
      ['Aadujeevitham', 'Benyamin', 'to-read'],
      ['The Secret Garden', 'Frances Hodgson Burnett', 'reading']
    ]) books.unshift(newBook(title, author, status));
    const saved = saveBooks();
    filter = 'all'; query = ''; search.value = ''; render();
    showToast(saved ? 'Three sample books to make yourself at home.' : 'Sample books added in this tab only.');
  });
  $('#close-toast').addEventListener('click', () => { clearTimeout(toastTimer); $('#toast').hidden = true; undoBook = null; });
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || dialog.open || event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === '/') { event.preventDefault(); search.focus(); }
    if (event.key.toLowerCase() === 'n') { event.preventDefault(); openDialog(); }
  });
  ['title', 'author'].forEach((field) => $(`#book-${field}`).addEventListener('input', () => {
    if ($(`#book-${field}`).value.trim()) { $(`#${field}-error`).hidden = true; $(`#book-${field}`).removeAttribute('aria-invalid'); }
  }));
  $('#backup-data').addEventListener('click', () => {
    if (rawBackup === null) return;
    const url = URL.createObjectURL(new Blob([rawBackup], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'chapter-library-backup.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('#reset-data').addEventListener('click', () => {
    if (!confirm('Replace the unreadable saved library with the books shown in this tab? Download a backup first if you want to keep the old data.')) return;
    storageBlocked = false;
    if (saveBooks()) { rawBackup = null; showToast('Your new library is saved.'); }
    else storageBlocked = true;
  });
  window.addEventListener('storage', (event) => {
    // Keep the library current even while a draft is open. render() leaves the
    // form inputs untouched, so another tab's saved book cannot be overwritten
    // merely because this tab was composing its own book.
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      books = event.newValue ? validateStoredBooks(JSON.parse(event.newValue)) : [];
      render();
    } catch { /* Keep the currently valid library if another tab writes invalid data. */ }
  });
    // Store layout preference separately from the user's books.
  const VIEW_KEY = 'chapter.view.v1';

  function setLibraryView(view, remember = true) {
    const selectedView = view === 'list' ? 'list' : 'grid';

    $('#book-grid').classList.toggle(
      'list-view',
      selectedView === 'list'
    );

    document.querySelectorAll('[data-view]').forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.view === selectedView)
      );
    });

    if (remember) {
      try {
        localStorage.setItem(VIEW_KEY, selectedView);
      } catch {
        // The layout still works if preferences cannot be saved.
      }
    }
  }

  let initialView = 'grid';

  try {
    initialView = localStorage.getItem(VIEW_KEY) || 'grid';
  } catch {
    // Use the default layout when storage is unavailable.
  }

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      setLibraryView(button.dataset.view);
    });
  });

  setLibraryView(initialView, false);
  loadBooks();
  render();
})();
