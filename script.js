/**
 * ================================================================
 * ALEX MORGAN — PORTFOLIO JAVASCRIPT
 * script.js
 *
 * Modules (in order):
 *  1.  Loading Screen
 *  2.  Theme Toggle (dark / light)
 *  3.  Navigation — scroll state & active links
 *  4.  Mobile Menu Toggle
 *  5.  Smooth Scrolling
 *  6.  Scroll Progress Indicator
 *  7.  Back-to-Top Button
 *  8.  Typing Animation (hero)
 *  9.  Reveal-on-scroll Animations
 *  10. Animated Stat Counters
 *  11. Skill Progress Bars
 *  12. Project Filter
 *  13. Contact Form Validation & Submission
 *  14. Footer Year
 *  15. Init
 * ================================================================
 */

'use strict';

/* ================================================================
   UTILITY HELPERS
================================================================ */

/**
 * Select a single DOM element.
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Select multiple DOM elements.
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 */
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Add one or more event listeners to a target.
 * @param {EventTarget} target
 * @param {string} events - space-separated event types
 * @param {Function} handler
 * @param {Object} [opts]
 */
const on = (target, events, handler, opts) =>
  events.split(' ').forEach(ev => target && target.addEventListener(ev, handler, opts));


/* ================================================================
   1. LOADING SCREEN
   Hides the splash screen after page load + minimum delay.
================================================================ */
function initLoader() {
  const loader = $('#loader');
  if (!loader) return;

  // Minimum display time so the animation feels intentional
  const MIN_MS = 1500;
  const start  = Date.now();

  const hide = () => {
    const elapsed = Date.now() - start;
    const delay   = Math.max(0, MIN_MS - elapsed);

    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
    }, delay);
  };

  document.body.style.overflow = 'hidden'; // prevent scroll during load

  if (document.readyState === 'complete') {
    hide();
  } else {
    on(window, 'load', hide);
  }
}


/* ================================================================
   2. THEME TOGGLE
   Persists preference to localStorage. Respects system preference
   as initial default if no stored value exists.
================================================================ */
function initThemeToggle() {
  const html   = document.documentElement;
  const btn    = $('#theme-toggle');
  const STORAGE_KEY = 'portfolio-theme';

  // Determine initial theme
  const stored = localStorage.getItem(STORAGE_KEY);
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = stored || (systemDark ? 'dark' : 'light');

  html.setAttribute('data-theme', initial);

  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);

    // Announce to screen readers
    btn.setAttribute('aria-label', `Switch to ${current} theme`);
  });
}


/* ================================================================
   3. NAVIGATION — SCROLL STATE & ACTIVE LINKS
   Adds .scrolled class to navbar for glassmorphism effect.
   Highlights nav link matching current viewport section.
================================================================ */
function initNavigation() {
  const navbar   = $('#navbar');
  const navLinks = $$('.nav-link');
  const sections = $$('section[id]');

  if (!navbar) return;

  // Scroll threshold to activate navbar background
  const SCROLL_THRESHOLD = 50;

  const updateNav = () => {
    // Navbar background
    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active link — find which section is most visible
    let currentId = '';
    sections.forEach(section => {
      const { top } = section.getBoundingClientRect();
      if (top <= 120) currentId = section.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href')?.slice(1); // strip '#'
      link.classList.toggle('active', href === currentId);
      link.setAttribute('aria-current', href === currentId ? 'page' : 'false');
    });
  };

  on(window, 'scroll', updateNav, { passive: true });
  updateNav(); // run on mount
}


/* ================================================================
   4. MOBILE MENU TOGGLE
   Opens/closes the full-screen mobile overlay. Traps focus when
   open. Closes on escape key or link click.
================================================================ */
function initMobileMenu() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobile-menu');
  const mobileLinks = $$('.mobile-link');

  if (!hamburger || !mobileMenu) return;

  let isOpen = false;

  const openMenu = () => {
    isOpen = true;
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close mobile menu');
    document.body.style.overflow = 'hidden';

    // Animate links in with stagger
    mobileLinks.forEach((link, i) => {
      link.style.opacity    = '0';
      link.style.transform  = 'translateY(20px)';
      link.style.transition = `opacity 300ms ${i * 80}ms, transform 300ms ${i * 80}ms`;
      // Force reflow
      link.offsetHeight; // eslint-disable-line no-unused-expressions
      link.style.opacity   = '1';
      link.style.transform = 'none';
    });
  };

  const closeMenu = () => {
    isOpen = false;
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open mobile menu');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => isOpen ? closeMenu() : openMenu());

  // Close on any mobile link click
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  // Close on Escape
  on(document, 'keydown', e => { if (e.key === 'Escape' && isOpen) closeMenu(); });
}


/* ================================================================
   5. SMOOTH SCROLLING
   Intercepts all '#hash' anchor clicks and scrolls to the target
   section, accounting for the fixed navbar height.
================================================================ */
function initSmoothScrolling() {
  const NAV_HEIGHT = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '70'
  );

  on(document, 'click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;

    const target = $(targetId);
    if (!target) return;

    e.preventDefault();

    const targetTop = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });

    // Update URL hash without page jump
    history.pushState(null, '', targetId);
  });
}


/* ================================================================
   6. SCROLL PROGRESS INDICATOR
   Thin gold bar at the top of the page tracking read progress.
================================================================ */
function initScrollProgress() {
  const bar = $('#scroll-progress');
  if (!bar) return;

  const update = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const pct = scrollTop / (scrollHeight - clientHeight);
    bar.style.width = `${Math.min(pct * 100, 100).toFixed(2)}%`;
  };

  on(window, 'scroll', update, { passive: true });
  update();
}


/* ================================================================
   7. BACK-TO-TOP BUTTON
   Appears after user scrolls 400px. Smooth scrolls to top.
================================================================ */
function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  const THRESHOLD = 400;

  on(window, 'scroll', () => {
    btn.classList.toggle('visible', window.scrollY > THRESHOLD);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ================================================================
   8. TYPING ANIMATION
   Cycles through an array of phrases with character-by-character
   type-in, brief pause, then character-by-character erase.
================================================================ */
function initTypingAnimation() {
  const el = $('#typed-text');
  if (!el) return;

  const phrases = [
    'Machine Learning Models',
    'Data Dashboards',
    'AI Solutions',
    'Predictive Analytics',
    'Data-Driven Insights',
  ];

  let phraseIndex = 0;
  let charIndex   = 0;
  let isErasing   = false;

  const TYPE_SPEED   = 80;    // ms per character when typing
  const ERASE_SPEED  = 40;    // ms per character when erasing
  const PAUSE_AFTER  = 1800;  // ms pause before erasing
  const PAUSE_BEFORE = 400;   // ms pause before next phrase

  function tick() {
    const phrase = phrases[phraseIndex];

    if (!isErasing) {
      // Type one character
      charIndex++;
      el.textContent = phrase.slice(0, charIndex);

      if (charIndex === phrase.length) {
        // Finished typing — pause then erase
        isErasing = true;
        setTimeout(tick, PAUSE_AFTER);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      // Erase one character
      charIndex--;
      el.textContent = phrase.slice(0, charIndex);

      if (charIndex === 0) {
        // Finished erasing — move to next phrase
        isErasing    = false;
        phraseIndex  = (phraseIndex + 1) % phrases.length;
        setTimeout(tick, PAUSE_BEFORE);
        return;
      }
      setTimeout(tick, ERASE_SPEED);
    }
  }

  setTimeout(tick, 1000); // initial delay
}


/* ================================================================
   9. REVEAL-ON-SCROLL ANIMATIONS
   Uses IntersectionObserver to trigger CSS transitions when
   elements enter the viewport. Respects prefers-reduced-motion.
================================================================ */
function initRevealAnimations() {
  // Respect accessibility preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const targets = $$('.reveal-up, .reveal-left, .reveal-right');
  if (!targets.length) return;

  if (prefersReduced) {
    // Skip animation — make everything visible immediately
    targets.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}


/* ================================================================
   10. ANIMATED STAT COUNTERS
   Counts up from 0 to the data-target value when the element
   scrolls into view. Uses requestAnimationFrame for smoothness.
================================================================ */
function initCounters() {
  const stats = $$('.stat-number[data-target]');
  if (!stats.length) return;

  const DURATION = 1800; // ms

  const animateCounter = el => {
    const target  = parseInt(el.getAttribute('data-target'), 10);
    const start   = performance.now();

    const update = now => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / DURATION, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach(el => observer.observe(el));
}


/* ================================================================
   11. SKILL PROGRESS BARS
   Triggers the width CSS transition when bars scroll into view.
================================================================ */
function initSkillBars() {
  const bars = $$('.skill-bar-fill[data-width]');
  if (!bars.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar   = entry.target;
          const width = bar.getAttribute('data-width');
          bar.style.width = `${width}%`;
          observer.unobserve(bar);
        }
      });
    },
    { threshold: 0.3 }
  );

  bars.forEach(bar => observer.observe(bar));
}


/* ================================================================
   12. PROJECT FILTER
   Filters project cards by data-category attribute. Cards not
   matching the selected filter are hidden with CSS.
================================================================ */
function initProjectFilter() {
  const filterGroup = $('.filter-group');
  const projectGrid = $('#projects-grid');

  if (!filterGroup || !projectGrid) return;

  const filterBtns  = $$('.filter-btn', filterGroup);
  const projectCards = $$('.project-card', projectGrid);

  filterGroup.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    // Update active button
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');

    // Show / hide cards
    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const match    = filter === 'all' || category === filter;

      // Animate out then hide / animate in
      if (match) {
        card.classList.remove('hidden');
        card.style.opacity   = '0';
        card.style.transform = 'scale(.95)';
        // Use rAF so browser registers the start state
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.style.transition = 'opacity .35s ease, transform .35s ease';
            card.style.opacity    = '1';
            card.style.transform  = 'none';
          });
        });
      } else {
        card.style.transition = 'opacity .25s ease';
        card.style.opacity    = '0';
        setTimeout(() => card.classList.add('hidden'), 260);
      }
    });
  });
}


/* ================================================================
   13. CONTACT FORM VALIDATION & SUBMISSION
   Client-side validation with inline error messages.
   Simulates async submission (replace with real API call).
================================================================ */
function initContactForm() {
  const form     = $('#contact-form');
  const feedback = $('#form-feedback');
  const submitBtn = $('#form-submit');

  if (!form) return;

  /* --- Validation Rules ---------------------------------------- */
  const validators = {
    'f-name': {
      required: true,
      minLength: 2,
      messages: {
        required:  'Please enter your full name.',
        minLength: 'Name must be at least 2 characters.',
      },
    },
    'f-email': {
      required: true,
      pattern:  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      messages: {
        required: 'Please enter your email address.',
        pattern:  'Please enter a valid email address.',
      },
    },
    'f-message': {
      required: true,
      minLength: 15,
      messages: {
        required:  'Please include a message.',
        minLength: 'Message must be at least 15 characters.',
      },
    },
  };

  /* --- Validate a single field --------------------------------- */
  function validateField(id) {
    const input  = $(`#${id}`);
    const errEl  = $(`#${id}-error`);
    const rules  = validators[id];

    if (!input || !rules) return true;

    const val = input.value.trim();
    let error = '';

    if (rules.required && !val) {
      error = rules.messages.required;
    } else if (rules.minLength && val.length < rules.minLength) {
      error = rules.messages.minLength;
    } else if (rules.pattern && !rules.pattern.test(val)) {
      error = rules.messages.pattern;
    }

    if (errEl) errEl.textContent = error;
    input.classList.toggle('error', !!error);

    return !error;
  }

  /* --- Real-time validation on blur ---------------------------- */
  Object.keys(validators).forEach(id => {
    const input = $(`#${id}`);
    if (input) {
      on(input, 'blur', () => validateField(id));
      on(input, 'input', () => {
        // Clear error as user types
        const errEl = $(`#${id}-error`);
        if (errEl && errEl.textContent) validateField(id);
      });
    }
  });

  /* --- Submit -------------------------------------------------- */
  /* --- EmailJS Setup --- */
emailjs.init("JEwF9UqRoSAQK42LN");

/* --- Submit -------------------------------------------------- */
form.addEventListener('submit', async e => {
  e.preventDefault();

  // Validate fields
  const isValid = Object.keys(validators)
    .map(id => validateField(id))
    .every(Boolean);

  if (!isValid) return;

  const btnText = submitBtn.querySelector('.btn-text');
  const origText = btnText?.textContent;

  submitBtn.disabled = true;
  if (btnText) btnText.textContent = 'Sending...';

  if (feedback) {
    feedback.className = '';
    feedback.style.display = 'none';
  }

  try {
    await emailjs.send(
      "service_n7bc0p4",
      "template_hhz9ih8",
      {
        name: $('#f-name').value.trim(),
        email: $('#f-email').value.trim(),
        subject: $('#f-subject').value.trim(),
        message: $('#f-message').value.trim(),
      }
    );

    form.reset();

    if (feedback) {
      feedback.textContent = '✓ Message sent successfully!';
      feedback.className = 'success';
      feedback.style.display = 'block';
    }

  } catch (error) {
    console.error(error);

    if (feedback) {
      feedback.textContent = '✕ Failed to send message.';
      feedback.className = 'error-msg';
      feedback.style.display = 'block';
    }
  } finally {
    submitBtn.disabled = false;
    if (btnText) btnText.textContent = origText;
  }
});
}


/* ================================================================
   14. FOOTER YEAR
   Keeps the copyright year current automatically.
================================================================ */
function initFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
}


/* ================================================================
   15. PARALLAX EFFECT
   Subtle vertical parallax on the hero glow element.
================================================================ */
function initParallax() {
  const glow = $('.hero-glow');
  if (!glow) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  on(window, 'scroll', () => {
    const y = window.scrollY;
    glow.style.transform = `translate(-50%, calc(-50% + ${y * 0.18}px))`;
  }, { passive: true });
}


/* ================================================================
   16. INIT — Run all modules
================================================================ */
(function init() {
  // Run loader immediately
  initLoader();
  initThemeToggle();

  // DOM-dependent setup
  on(document, 'DOMContentLoaded', () => {
    initNavigation();
    initMobileMenu();
    initSmoothScrolling();
    initScrollProgress();
    initBackToTop();
    initTypingAnimation();
    initRevealAnimations();
    initCounters();
    initSkillBars();
    initProjectFilter();
    initContactForm();
    initFooterYear();
    initParallax();
  });
})();