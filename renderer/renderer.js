// PhantomPad renderer
//
// State
let currentFilePath = null;
let autoSaveInterval = null;
let hasUnsavedChanges = false;
let isDarkMode = false;
let userOpacity = 0.85; // what the slider says
let dimWhenUnfocused = true;
let isWindowFocused = document.hasFocus();
let pendingSave = null;
let changingFile = false;

// DOM
const editor = document.getElementById('editor');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');
const dimToggle = document.getElementById('dim-toggle');
const newBtn = document.getElementById('new-btn');
const openBtn = document.getElementById('open-btn');
const saveBtn = document.getElementById('save-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const menuBtn = document.getElementById('menu-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const minimizeBtn = document.getElementById('minimize-btn');
const hideBtn = document.getElementById('hide-btn');
const statusFile = document.getElementById('status-file');
const statusMeta = document.getElementById('status-meta');

const AUTO_SAVE_MS = 2000;
const DIM_OPACITY = 0.25;

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------

function updateBackgroundColor() {
  const opacity = dimWhenUnfocused && !isWindowFocused ? DIM_OPACITY : userOpacity;
  const app = document.getElementById('app');
  if (isDarkMode) {
    app.style.background = `rgba(24, 24, 28, ${opacity})`;
  } else {
    app.style.background = `rgba(255, 255, 255, ${opacity})`;
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDarkMode = true;
    document.body.classList.add('dark-mode');
    themeIcon.textContent = '🌙';
    themeLabel.textContent = 'Light Mode';
  }

  const savedOpacity = localStorage.getItem('opacity');
  if (savedOpacity !== null) {
    opacitySlider.value = savedOpacity;
  }
  userOpacity = opacitySlider.value / 100;
  opacityValue.textContent = `${opacitySlider.value}%`;

  const savedDim = localStorage.getItem('dimWhenUnfocused');
  if (savedDim !== null) {
    dimWhenUnfocused = savedDim === 'true';
    dimToggle.checked = dimWhenUnfocused;
  }

  updateBackgroundColor();
}

themeToggleBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode');
  themeIcon.textContent = isDarkMode ? '🌙' : '☀️';
  themeLabel.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  updateBackgroundColor();
  dropdownMenu.classList.remove('show');
});

opacitySlider.addEventListener('input', (e) => {
  userOpacity = e.target.value / 100;
  opacityValue.textContent = `${e.target.value}%`;
  localStorage.setItem('opacity', e.target.value);
  updateBackgroundColor();
});

dimToggle.addEventListener('change', (e) => {
  dimWhenUnfocused = e.target.checked;
  localStorage.setItem('dimWhenUnfocused', dimWhenUnfocused);
  updateBackgroundColor();
});

// Dim when the pad loses key-window status: it sits quietly over your work
// instead of shouting. It brightens the moment you click back into it.
window.addEventListener('focus', () => {
  isWindowFocused = true;
  updateBackgroundColor();
});
window.addEventListener('blur', () => {
  isWindowFocused = false;
  updateBackgroundColor();
});

// ---------------------------------------------------------------------------
// Status bar
// ---------------------------------------------------------------------------

function fileName(filePath) {
  if (!filePath) return 'Untitled';
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1];
}

function updateStatus() {
  statusFile.textContent = hasUnsavedChanges ? `${fileName(currentFilePath)} •` : fileName(currentFilePath);
  const text = editor.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split('\n').length : 0;
  statusMeta.textContent = `${words} words · ${lines} lines`;
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

editor.addEventListener('input', () => {
  hasUnsavedChanges = true;
  updateStatus();
});

async function confirmReplace() {
  if (pendingSave) await pendingSave;
  if (!hasUnsavedChanges) return true;
  const choice = await window.padAPI.confirmUnsaved();
  if (choice === 'discard') return true;
  if (choice === 'save') return await saveFile() && !hasUnsavedChanges;
  return false;
}

async function openFile() {
  if (changingFile) return;
  changingFile = true;
  try {
    if (!await confirmReplace()) return;
    const result = await window.padAPI.openFile();
    if (result) {
      editor.value = result.content;
      currentFilePath = result.filePath;
      hasUnsavedChanges = false;
      startAutoSave();
      updateStatus();
    }
  } catch (error) {
    await window.padAPI.showError(`Could not open the file: ${error.message}`);
  } finally {
    changingFile = false;
    dropdownMenu.classList.remove('show');
  }
}

function saveFile() {
  if (pendingSave) return pendingSave;
  const content = editor.value;
  pendingSave = (async () => {
    try {
      const filePath = await window.padAPI.saveFile(currentFilePath, content);
      if (!filePath) return false;
      currentFilePath = filePath;
      hasUnsavedChanges = editor.value !== content;
      startAutoSave();
      updateStatus();
      return true;
    } catch (error) {
      stopAutoSave();
      await window.padAPI.showError(`Could not save the file: ${error.message}. Your changes are still in the editor. Try Save again.`);
      return false;
    } finally {
      pendingSave = null;
    }
  })();
  return pendingSave;
}

async function newFile() {
  if (changingFile) return;
  changingFile = true;
  try {
    if (!await confirmReplace()) return;
    editor.value = '';
    currentFilePath = null;
    hasUnsavedChanges = false;
    stopAutoSave();
    updateStatus();
    editor.focus();
  } finally {
    changingFile = false;
    dropdownMenu.classList.remove('show');
  }
}

function startAutoSave() {
  stopAutoSave();
  if (currentFilePath) {
    autoSaveInterval = setInterval(async () => {
      if (hasUnsavedChanges && !changingFile) await saveFile();
    }, AUTO_SAVE_MS);
  }
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

openBtn.addEventListener('click', openFile);
saveBtn.addEventListener('click', async () => {
  await saveFile();
  dropdownMenu.classList.remove('show');
});
newBtn.addEventListener('click', newFile);

// ---------------------------------------------------------------------------
// Menu and window controls
// ---------------------------------------------------------------------------

menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('show');
});

document.addEventListener('click', (e) => {
  if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) {
    dropdownMenu.classList.remove('show');
  }
});

minimizeBtn.addEventListener('click', () => {
  window.padAPI.minimizeWindow();
});

hideBtn.addEventListener('click', () => {
  window.padAPI.hideWindow();
});

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

document.addEventListener('keydown', async (e) => {
  // Cmd+O / Ctrl+O - Open
  if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
    e.preventDefault();
    await openFile();
  }
  // Cmd+S / Ctrl+S - Save
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    await saveFile();
  }
  // Cmd+N / Ctrl+N - New
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
    e.preventDefault();
    await newFile();
  }
  // Cmd+Q / Ctrl+Q - Quit with guard
  if ((e.metaKey || e.ctrlKey) && e.key === 'q') {
    e.preventDefault();
    window.padAPI.quitApp();
  }
  // Esc - hide the pad
  if (e.key === 'Escape') {
    window.padAPI.hideWindow();
  }
});

// ---------------------------------------------------------------------------
// Quit guard handshake
// ---------------------------------------------------------------------------

window.padAPI.getEditorState(async () => {
  if (pendingSave) await pendingSave;
  window.padAPI.sendEditorState(hasUnsavedChanges, currentFilePath, editor.value);
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

initTheme();
updateStatus();
editor.focus();
