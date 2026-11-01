// ====================================================
// MODULE: MS-DOS DUAL-TAB TERMINAL LOGGER (OBSERVER PATTERN)
// THEME 3: EVENT-DRIVEN PROGRAMMING (EVENT STREAM & ERROR DASHBOARD)
// ====================================================

import { playArcadeSound } from './audio.js';

// DOM Element References for MS-DOS Console
const terminalTitle = document.getElementById('terminal-title');
const tabBusBtn = document.getElementById('tab-bus-btn');
const tabErrorsBtn = document.getElementById('tab-errors-btn');
const eventLogContainer = document.getElementById('event-log-container');
const errorLogContainer = document.getElementById('error-log-container');
const clearStreamBtn = document.getElementById('clear-stream-btn');

export let currentTerminalTab = 'bus';
export let unreadErrorCount = 0;

/**
 * Switches the active tab on the MS-DOS terminal between [BUS] and [ERRORS]
 * @param {'bus'|'errors'} tab
 */
export function switchTerminalTab(tab) {
  currentTerminalTab = tab;
  if (tab === 'errors') {
    if (terminalTitle) terminalTitle.textContent = 'C:\\BANANA_QUEST\\ERROR_LOG.DAT';
    if (eventLogContainer) eventLogContainer.classList.add('hidden');
    if (errorLogContainer) errorLogContainer.classList.remove('hidden');
    if (tabBusBtn) tabBusBtn.classList.remove('active-tab');
    if (tabErrorsBtn) {
      tabErrorsBtn.classList.add('active-tab');
      tabErrorsBtn.classList.remove('tab-has-errors');
      unreadErrorCount = 0;
      tabErrorsBtn.textContent = '[ERRORS]';
    }
    if (errorLogContainer) errorLogContainer.scrollTop = errorLogContainer.scrollHeight;
  } else {
    if (terminalTitle) terminalTitle.textContent = 'C:\\BANANA_QUEST\\EVENT_BUS.EXE';
    if (errorLogContainer) errorLogContainer.classList.add('hidden');
    if (eventLogContainer) eventLogContainer.classList.remove('hidden');
    if (tabErrorsBtn) tabErrorsBtn.classList.remove('active-tab');
    if (tabBusBtn) tabBusBtn.classList.add('active-tab');
    if (eventLogContainer) eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
  }
}

/**
 * Dedicated Error Logging Subsystem:
 * Intercepts runtime faults, timeouts, wrong answers & API network drops
 * 
 * @param {string} errorType
 * @param {any} details
 * @param {string} [description='']
 */
export function logToErrorStream(errorType, details, description = '') {
  const timestamp = new Date().toISOString().substring(11, 23);
  const entry = document.createElement('div');
  entry.className = 'error-entry';

  const meta = document.createElement('div');
  meta.className = 'event-meta';
  meta.innerHTML = `
    <span class="error-title">&gt; [FAULT: ${errorType}]</span>
    <span style="color: #cbd5e1;">${timestamp}</span>
  `;

  const descDiv = document.createElement('div');
  descDiv.style.color = '#fecaca';
  descDiv.style.fontSize = '1.05rem';
  descDiv.style.marginBottom = '2px';
  descDiv.textContent = description || errorType;

  const payload = document.createElement('div');
  payload.className = 'error-payload';
  payload.textContent = typeof details === 'object' ? JSON.stringify(details) : String(details);

  entry.appendChild(meta);
  entry.appendChild(descDiv);
  entry.appendChild(payload);

  if (errorLogContainer) {
    errorLogContainer.appendChild(entry);
    errorLogContainer.scrollTop = errorLogContainer.scrollHeight;
  }

  // Update badge alert if user is currently looking at [BUS] tab
  if (currentTerminalTab !== 'errors' && tabErrorsBtn) {
    unreadErrorCount++;
    tabErrorsBtn.textContent = `[ERRORS (${unreadErrorCount})]`;
    tabErrorsBtn.classList.add('tab-has-errors');
  }
}

/**
 * Helper function to log dispatched CustomEvents to the MS-DOS terminal
 * 
 * @param {string} eventName
 * @param {any} details
 * @param {string} [customClass='']
 */
export function logToEventStream(eventName, details, customClass = '') {
  // Capture precise timestamp in HH:MM:SS.mmm format
  const timestamp = new Date().toISOString().substring(11, 23);

  // Create new DOM container for log entry
  const entry = document.createElement('div');
  entry.className = 'event-entry';

  // Construct header with event name and timestamp
  const meta = document.createElement('div');
  meta.className = 'event-meta';
  meta.innerHTML = `
    <span class="event-name ${customClass}">&gt; [${eventName}]</span>
    <span>${timestamp}</span>
  `;

  // Format payload as JSON text
  const payload = document.createElement('div');
  payload.className = 'event-payload';
  payload.textContent = JSON.stringify(details);

  // Append meta and payload into entry container
  entry.appendChild(meta);
  entry.appendChild(payload);

  // Append entry to MS-DOS terminal stream
  if (eventLogContainer) {
    eventLogContainer.appendChild(entry);
    eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
  }
}

/**
 * Clears the active terminal buffer
 */
export function clearTerminal() {
  playArcadeSound('click');
  if (currentTerminalTab === 'errors') {
    if (errorLogContainer) errorLogContainer.innerHTML = '';
    unreadErrorCount = 0;
    if (tabErrorsBtn) {
      tabErrorsBtn.textContent = '[ERRORS]';
      tabErrorsBtn.classList.remove('tab-has-errors');
    }
    logToErrorStream('CLS', { message: 'Error log buffer cleared' }, 'C:\\BANANA_QUEST\\ERROR_LOG.DAT initialized');
  } else {
    if (eventLogContainer) eventLogContainer.innerHTML = '';
    logToEventStream('CLS', { message: 'MS-DOS event bus buffer cleared' });
  }
}

// Attach event listeners for terminal tab controls
if (tabBusBtn) {
  tabBusBtn.addEventListener('click', () => {
    playArcadeSound('click');
    switchTerminalTab('bus');
  });
}

if (tabErrorsBtn) {
  tabErrorsBtn.addEventListener('click', () => {
    playArcadeSound('click');
    switchTerminalTab('errors');
  });
}

if (clearStreamBtn) {
  clearStreamBtn.addEventListener('click', clearTerminal);
}
