/* ═══════════════════════════════════════════════════════
   BOOT SEQUENCE PORTFOLIO — script.js

   All interaction logic: typewriter animations,
   section reveals, keyboard/click handling, easter eggs.

   ─── HOW TO EDIT CONTENT ────────────────────────────
   Content lives in index.html inside each .section div.
   This file only controls *animation & interaction*.
   You should never need to touch this to change text.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Configuration ────────────────────────────────────
  const TYPE_SPEED      = 8;    // ms per tick (typewriter)
  const CMD_TYPE_SPEED  = 25;   // ms per character for commands (slower, more dramatic)
  const BOOT_LINE_DELAY = 150;  // ms between boot lines
  const POST_CMD_DELAY  = 200;  // ms pause after command finishes typing
  const TYPE_STEP       = 3;    // characters added per tick for body text
  const SECTION_GAP     = 400;  // ms pause between sections
  const INTRO_SEEN_KEY  = 'introSeen';

  // ── DOM References ───────────────────────────────────
  const terminalBody   = document.getElementById('terminal-body');
  const advancePrompt  = document.getElementById('advance-prompt');
  const skipBtn        = document.getElementById('skip-intro');
  const hasMouse       = window.matchMedia('(hover: hover)').matches;
  const finalPrompt    = document.getElementById('final-prompt');
  const finalInput     = document.getElementById('final-input');
  const easterEggArea  = document.getElementById('easter-egg-area');

  // Gather boot lines & sections from the DOM
  const bootLines = Array.from(document.querySelectorAll('.boot-line'));
  const sections  = Array.from(document.querySelectorAll('.section'));

  // ── State ────────────────────────────────────────────
  let isAnimating     = false;
  let sequenceDone    = false;
  let skipped         = false;  // set by skipIntro to abort async work
  let fastForward     = false;  // set by space/click mid-typing to finish the current section
  let wakeUp          = null;   // ends the pending sleep early on fast-forward

  // ── Utility: sleep (abortable) ───────────────────────
  function sleep(ms) {
    if (fastForward) return Promise.resolve();
    return new Promise(resolve => {
      const timer = setTimeout(resolve, ms);
      wakeUp = () => { clearTimeout(timer); resolve(); };
    });
  }

  // ── Typewriter Effect ────────────────────────────────
  // Animates text into `element` character by character.
  // Handles nested HTML by working with innerHTML carefully.
  // Returns a promise that resolves when done.
  // If `skipped` or `fastForward` becomes true mid-animation, the
  // remaining content is dumped instantly and the promise resolves.
  function typewrite(element, speed = TYPE_SPEED, step = 1) {
    return new Promise((resolve) => {
      const html = element.innerHTML;
      element.innerHTML = '';
      element.classList.add('typed');
      element.style.visibility = 'visible';

      // We build up displayed text character by character.
      // To handle HTML tags, we skip inside tags instantly.
      let i = 0;
      let displayed = '';

      function tick() {
        // ── Abort: skip or fast-forward — dump remaining content ──
        if (skipped || fastForward) {
          element.innerHTML = html;
          resolve();
          return;
        }

        if (i < html.length) {
          // If we hit an HTML tag, add the whole tag at once
          if (html[i] === '<') {
            const closeIdx = html.indexOf('>', i);
            if (closeIdx !== -1) {
              displayed += html.substring(i, closeIdx + 1);
              i = closeIdx + 1;
            } else {
              displayed += html[i];
              i++;
            }
            element.innerHTML = displayed;
            scrollFollowTick();
            tick(); // don't delay for tags
            return;
          }
          // If we hit an HTML entity like &amp;
          if (html[i] === '&') {
            const semiIdx = html.indexOf(';', i);
            if (semiIdx !== -1 && semiIdx - i < 10) {
              displayed += html.substring(i, semiIdx + 1);
              i = semiIdx + 1;
              element.innerHTML = displayed;
              scrollFollowTick();
              setTimeout(tick, speed);
              return;
            }
          }
          // Up to `step` plain characters per tick (tags/entities are handled above)
          let n = 0;
          do {
            displayed += html[i];
            i++;
            n++;
          } while (n < step && i < html.length && html[i] !== '<' && html[i] !== '&');
          element.innerHTML = displayed;
          scrollFollowTick();
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      }

      tick();
    });
  }

  // ── Type a command string into a command-line element ─
  function typeCommand(cmdLineEl) {
    const cmdTextEl = cmdLineEl.querySelector('.command-text');
    if (!cmdTextEl) return Promise.resolve();
    return typewrite(cmdTextEl, CMD_TYPE_SPEED);
  }

  // ── Reveal all text in a section instantly ───────────
  function revealInstantly(sectionEl) {
    sectionEl.classList.add('revealed');
    sectionEl.querySelectorAll('.typewriter-target').forEach(el => {
      el.style.visibility = 'visible';
      el.classList.add('typed');
    });
  }

  // ── Reveal a section with typewriter ─────────────────
  async function revealSection(section) {
    const cmdLine = section.previousElementSibling;

    // 1. Show & type the command
    if (cmdLine && cmdLine.classList.contains('command-line')) {
      cmdLine.style.display = 'block';
      await typeCommand(cmdLine);
      if (skipped) return;
      await sleep(POST_CMD_DELAY);
      if (skipped) return;
    }

    // 2. Reveal the section container
    section.classList.add('revealed');

    // 3. Typewrite each .typewriter-target inside the section in order
    const targets = section.querySelectorAll('.typewriter-target');
    for (const target of targets) {
      if (skipped) return;
      await typewrite(target, TYPE_SPEED, TYPE_STEP);
    }

    fastForward = false;     // a press only skips the section that was typing
  }

  // ── Boot Sequence (initial loading lines) ────────────
  async function runBootSequence() {
    for (let i = 0; i < bootLines.length; i++) {
      if (skipped) return;   // skipIntro took over — bail out
      bootLines[i].classList.add('visible');
      await typewrite(bootLines[i], TYPE_SPEED);
      if (skipped) return;
      await sleep(BOOT_LINE_DELAY);
    }

    fastForward = false;
  }

  // ── Whole intro: boot, then every section in order ───
  async function runSequence() {
    isAnimating = true;
    await runBootSequence();
    for (const section of sections) {
      if (skipped) return;
      await sleep(SECTION_GAP);
      if (skipped) return;
      await revealSection(section);
    }
    if (!skipped) finishSequence();
  }

  // ── Finish: all sections revealed ────────────────────
  function finishSequence() {
    sequenceDone = true;
    isAnimating = false;
    skipBtn.classList.add('hidden');
    document.body.classList.add('sequence-complete');
    try { localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch (e) { /* storage blocked */ }

    // Open the first project and commit so visitors see the lines expand
    toggle(document.querySelector('.project-name'));
    toggle(document.querySelector('.git-log-entry'));

    // One shimmer down the clickable lines, then the closed carets
    // glow until the visitor's first real click
    const shimmerTargets = document.querySelectorAll('.project-name, .git-msg');
    shimmerTargets.forEach((el, i) => el.style.setProperty('--i', i));
    document.body.classList.add('shimmer');
    setTimeout(() => {
      document.body.classList.remove('shimmer');
      document.body.classList.add('carets-glow');
    }, shimmerTargets.length * 80 + 900);

    // Show final interactive prompt
    finalPrompt.classList.add('visible');
    if (!skipped) scrollFollowTick();

    // Focus the easter-egg input on desktop only; on phones it would open the keyboard
    if (hasMouse) {
      setTimeout(() => {
        if (finalInput) finalInput.focus({ preventScroll: true });
      }, 500);
    }
  }

  // ── Skip Intro ───────────────────────────────────────
  function skipIntro() {
    skipped = true;   // tells any in-flight async work to bail out

    // Instantly reveal everything
    bootLines.forEach(line => {
      line.classList.add('visible');
      line.style.visibility = 'visible';
      line.querySelectorAll('.typewriter-target').forEach(t => {
        t.style.visibility = 'visible';
        t.classList.add('typed');
      });
    });

    sections.forEach((section, i) => {
      const cmdLine = section.previousElementSibling;
      if (cmdLine && cmdLine.classList.contains('command-line')) {
        cmdLine.style.display = 'block';
        const cmdText = cmdLine.querySelector('.command-text');
        if (cmdText) {
          cmdText.style.visibility = 'visible';
          cmdText.classList.add('typed');
        }
      }
      revealInstantly(section);
    });

    finishSequence();
    window.scrollTo({ top: 0, behavior: 'instant' });   // start reading from the top
  }

  // ── Advance Handler ──────────────────────────────────
  // Mid-intro: finish the section that's typing instantly
  function advance() {
    if (!isAnimating) return;
    fastForward = true;
    if (wakeUp) wakeUp();
  }

  // ── Scroll helpers ───────────────────────────────────

  // Smooth-scroll to the very bottom (used after a section finishes)
  function scrollToBottom() {
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }

  // Keeps the viewport pinned to the bottom while content is being
  // typed. Called on every typewriter tick — only actually scrolls
  // when the content has grown past the viewport, and stops following
  // once the visitor scrolls up to read.
  let followBottom = true;
  window.addEventListener('scroll', () => {
    followBottom = document.body.scrollHeight - (window.innerHeight + window.scrollY) < 120;
  }, { passive: true });

  let _scrollTicking = false;
  function scrollFollowTick() {
    if (_scrollTicking || !followBottom) return;   // throttle to one rAF at a time
    _scrollTicking = true;
    requestAnimationFrame(() => {
      const docHeight  = document.body.scrollHeight;
      const viewBottom = window.innerHeight + window.scrollY;
      // Re-check: the visitor may have scrolled up since this frame was queued
      if (followBottom && docHeight - viewBottom > 80) {
        window.scrollTo({ top: docHeight, behavior: 'instant' });
      }
      _scrollTicking = false;
    });
  }

  // ── Project & Commit expand/collapse (event delegation) ──
  // We use delegation on the terminal body instead of binding
  // directly to elements, because the typewriter effect destroys
  // and rebuilds innerHTML — which wipes any direct listeners.
  // Opens/closes a project (button) or commit (git-log-entry) and its detail
  function toggle(el) {
    if (!el) return;
    const detail = el.classList.contains('project-name')
      ? el.closest('.project-entry').querySelector('.project-detail')
      : document.querySelector(`.commit-detail[data-commit="${el.dataset.commit}"]`);
    if (!detail) return;
    const open = detail.classList.toggle('open');
    (el.closest('.project-entry') || el).classList.toggle('open', open);
    el.setAttribute('aria-expanded', open);
  }

  function initToggles() {
    // A visitor's own toggle ends the caret glow for good and gets a short glow as feedback
    function userToggle(el) {
      document.body.classList.add('explored');
      el.classList.remove('tap-glow');
      void el.offsetWidth;   // restart the animation on repeat clicks
      el.classList.add('tap-glow');
      toggle(el);
    }

    // Double/triple-clicking a toggle line would select words instead of
    // toggling it again; drag-to-select still works
    terminalBody.addEventListener('mousedown', (e) => {
      if (e.detail > 1 && e.target.closest('.project-name, .git-log-entry')) e.preventDefault();
    });

    terminalBody.addEventListener('click', (e) => {
      if (!window.getSelection().isCollapsed) return;

      const target = e.target.closest('.project-name, .git-log-entry');
      if (target) userToggle(target);
    });

    // Commit lines aren't native buttons, so give them Enter/Space
    terminalBody.addEventListener('keydown', (e) => {
      const entry = e.target.closest('.git-log-entry');
      if (entry && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        userToggle(entry);
      }
    });
  }

  // ── Easter Eggs ──────────────────────────────────────
  // Easter egg commands — sorted longest-key-first so the matcher
  // always picks the most specific entry (e.g. "cat contact.txt"
  // before "cat").  Add new commands anywhere; the array is
  // re-sorted on init.
  const EASTER_EGGS = [
    // ── multi-word commands (must come before their short prefixes) ──
    ['cat contact.txt', 'Open to part-time work and interesting projects.\n\ngithub   → github.com/MazenYasser\nlinkedin → linkedin.com/in/mazen-yasser225\nemail    → mazenyasserx47@gmail.com'],
    ['cat contact',     'Open to part-time work and interesting projects.\n\ngithub   → github.com/MazenYasser\nlinkedin → linkedin.com/in/mazen-yasser225\nemail    → mazenyasserx47@gmail.com'],
    ['npx mazenx47',    'It\'s real! Run "npx mazenx47" in your own terminal and my card prints right there.'],
    ['git log',         'e4a1b09  Apr 2026  (HEAD → main)  Engineering Manager @ TJM Labs\na3f9c12  Oct 2025  Promoted to Lead SWE @ TJM Labs\n7b2e841  Jul 2025  Software Engineer @ TJM Labs\n3d1f092  May 2025  Software Engineer (contract) @ farapi\n1c8a3f7  Jul 2024  Back End Engineer @ Nex Ventures\n9e2b105  Sep 2023  Junior Software Engineer @ farapi'],
    ['ls projects',     'retail-bot/  aegis/  seen/  nex-email-platform/'],
    ['ps aux',          'PID  PROCESS                       STATUS   CPU\n001  engineering-management        running  high\n002  retail-bot · 100+ pharmacies  running  high\n003  engineering-hiring            active   medium\n004  python · django · celery      stable   medium\n005  kafka · kubernetes · docker   bg       low\n006  websockets · agora · apis     active   medium\n007  currently-reading-your-msg    running  100%'],
    ['rm -rf /',        'I admire the audacity, but no.'],
    ['rm -rf',          'I admire the audacity, but no.'],

    // ── single-word commands ──
    ['help', `Available commands:
  whoami        — about me
  ls projects/  — my work
  git log       — career timeline
  ps aux        — current focus
  cat contact   — reach out
  clear         — nice try
  sudo          — nope`],
    ['sudo',      'Nice try. You don\'t have sudo access here. 🔒'],
    ['clear',     'This terminal has a mind of its own. No clearing allowed.'],
    ['ls',        'whoami/  projects/  .git/  contact.txt  .secrets (permission denied)'],
    ['pwd',       '/home/mazen/portfolio'],
    ['cd',        'You\'re already where you need to be.'],
    ['exit',      'There is no escape. But you can close the tab.'],
    ['vim',       'You\'d be stuck here forever. Use VS Code instead. 😄'],
    ['neofetch',  `  ███╗   ███╗  Mazen Yasser\n  ████╗ ████║  Engineering Manager @ TJM Labs\n  ██╔████╔██║  OS: Human/Developer\n  ██║╚██╔╝██║  Shell: zsh + Claude\n  ██║ ╚═╝ ██║  Uptime: way too long\n  ╚═╝     ╚═╝  Coffee: critical`],
    ['whoami',    'mazen — Engineering Manager @ TJM Labs, builder of things that automate other things.'],
    ['cat',       'Usage: cat <filename>. Try "cat contact.txt" or scroll up.'],
    ['ping',      'PONG! 🏓 Latency: 0ms (I\'m right here)'],
    ['hello',     'Hey there! 👋 Thanks for exploring.'],
    ['hi',        'Hello! Welcome to my corner of the internet.'],
    ['date',      new Date().toUTCString()],
    ['uptime',    'Too long. Send coffee. ☕'],
    ['man',       'RTFM? In this economy? Just type "help".'],
    ['curl',      'curl: (7) Failed to connect — but my LinkedIn is open!'],
    ['git',       'usage: git <command>. Try "git log".'],
  ].sort((a, b) => b[0].length - a[0].length);   // longest key first

  function handleEasterEgg(input) {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    // Find the best match: first check exact, then find the longest
    // key that is a prefix of the input OR that the input is a prefix of.
    let response;
    for (const [key, val] of EASTER_EGGS) {
      if (trimmed === key) { response = val; break; }       // exact
    }
    if (!response) {
      for (const [key, val] of EASTER_EGGS) {
        if (trimmed.startsWith(key) || key.startsWith(trimmed)) {
          response = val;
          break;   // longest key first → first hit is best hit
        }
      }
    }
    if (!response) {
      response = `bash: ${trimmed}: command not found. Type "help" for available commands.`;
    }

    // Create a new response block
    const line = document.createElement('div');
    line.className = 'easter-egg-response';
    line.textContent = response;
    easterEggArea.appendChild(line);

    // Create a new prompt line (uses same flex layout as the original)
    const newPrompt = document.createElement('div');
    newPrompt.className = 'prompt-input-line';
    newPrompt.style.marginTop = '8px';
    newPrompt.innerHTML = `<span class="prompt-prefix">mazen@portfolio:~$</span>&nbsp;<input type="text" class="final-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />`;
    easterEggArea.appendChild(newPrompt);

    const newInput = newPrompt.querySelector('.final-input');
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = newInput.value;
        newInput.disabled = true;
        newInput.style.opacity = '0.5';
        handleEasterEgg(val);
      }
    });
    newInput.focus();
    scrollToBottom();
  }

  // ── Event Listeners ──────────────────────────────────

  // Keyboard: Space or Enter skips ahead while the intro plays
  document.addEventListener('keydown', (e) => {
    if (!isAnimating) return;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (e.target instanceof Element && e.target.closest('button, a, input, [role="button"]')) return;
    e.preventDefault();
    advance();
  });

  // Click on advance prompt
  advancePrompt.addEventListener('click', advance);

  // Click anywhere on terminal body: advance during sequence,
  // or focus the active input after sequence completes.
  terminalBody.addEventListener('click', (e) => {
    // A drag-to-select also fires a click on mouseup; leave the selection alone
    if (!window.getSelection().isCollapsed) return;

    // Don't interfere with interactive elements
    if (e.target.closest('.project-name, .project-detail, .git-log-entry, .commit-detail, .final-input, a')) {
      return;
    }

    if (!sequenceDone) {
      advance();
      return;
    }

    // Focus the last (active) input so the user can click anywhere and type.
    // On phones only a tap on the prompt line itself does, so stray taps
    // don't pop the keyboard open.
    if (!hasMouse && !e.target.closest('.prompt-input-line')) return;
    const inputs = terminalBody.querySelectorAll('.final-input');
    const lastInput = inputs[inputs.length - 1];
    if (lastInput && !lastInput.disabled) lastInput.focus({ preventScroll: true });
  });

  // Skip intro button
  skipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    skipIntro();
  });

  // Easter egg input
  if (finalInput) {
    finalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = finalInput.value;
        finalInput.disabled = true;
        finalInput.style.opacity = '0.5';
        handleEasterEgg(val);
      }
    });
  }

  // ── Initialize ───────────────────────────────────────
  initToggles();

  // Show where the page is actually served from
  document.querySelector('.boot-host').textContent = location.host || 'localhost';

  // Hide all command lines initially
  document.querySelectorAll('.command-line').forEach(el => {
    el.style.display = 'none';
  });

  // Return visitors and reduced-motion users get the full page at once;
  // add ?intro to the URL to replay it.
  let introSeen = false;
  try { introSeen = localStorage.getItem(INTRO_SEEN_KEY) === '1'; } catch (e) { /* storage blocked */ }
  const replay = new URLSearchParams(location.search).has('intro');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ((introSeen && !replay) || reducedMotion) {
    skipIntro();
  } else {
    runSequence();
  }
})();
