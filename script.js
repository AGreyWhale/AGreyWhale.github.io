(function () {
  /* Scroll progress bar */
  const progress = document.querySelector('.scroll-progress');
  function updateProgress() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
  }

  /* Top nav background + mobile toggle */
  const topnav = document.querySelector('.topnav');
  function updateTopnav() {
    if (!topnav) return;
    topnav.classList.toggle('scrolled', window.scrollY > 20);
  }

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.topnav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  /* Achievements: registry, persistence, toast queue, and panel */
  const ACHIEVEMENTS = [
    { id: 'about', title: 'Got to Know Me', hint: 'Scroll to the About section' },
    { id: 'research', title: 'Into the Lab', hint: 'Scroll to the Research section' },
    { id: 'projects', title: 'Shipped It', hint: 'Scroll to the Projects section' },
    { id: 'skills', title: 'Level Up', hint: 'Scroll to the Skills section' },
    { id: 'service', title: 'Good Citizen', hint: 'Scroll to the Service section' },
    { id: 'contact', title: 'Reached the End', hint: 'Scroll to the Contact section' },
    { id: 'konami', title: 'Konami Master', hint: 'Some codes are timeless.', special: true },
  ];

  const STORAGE_KEY = 'gauri-site-achievements';
  function loadUnlocked() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch (e) {
      return new Set();
    }
  }
  function saveUnlocked(set) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch (e) {
      /* localStorage unavailable — achievements just won't persist */
    }
  }

  const unlocked = loadUnlocked();
  const achievementQueue = [];
  let achievementShowing = false;
  let toastEl = null;

  function createToastEl() {
    const el = document.createElement('div');
    el.className = 'achievement-toast';
    el.innerHTML =
      '<div class="achievement-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2l2.9 6.26L21.5 9l-5 4.87L17.8 21 12 17.77 6.2 21l1.3-7.13L2.5 9l6.6-.74L12 2z"/></svg></div>' +
      '<div class="achievement-text"><span class="eyebrow-ach">Achievement Unlocked</span><span class="title-ach"></span></div>';
    document.body.appendChild(el);
    return el;
  }

  function processAchievementQueue() {
    if (achievementShowing || achievementQueue.length === 0) return;
    achievementShowing = true;
    const { title, special } = achievementQueue.shift();
    if (!toastEl) toastEl = createToastEl();
    toastEl.classList.toggle('special', !!special);
    toastEl.querySelector('.title-ach').textContent = title;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => {
        achievementShowing = false;
        processAchievementQueue();
      }, 500);
    }, 3200);
  }

  function unlockAchievement(id) {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def || unlocked.has(id)) return;
    unlocked.add(id);
    saveUnlocked(unlocked);
    achievementQueue.push({ title: def.title, special: def.special });
    processAchievementQueue();
    renderAchievementsPanel();
    pulseAchievementsButton();
  }

  /* Section tracking for topnav + dot-nav active states + achievements */
  const sections = document.querySelectorAll('main [id]');
  const topnavLinks = document.querySelectorAll('.topnav-links a[href^="#"]');
  const dotLinks = document.querySelectorAll('.dot-nav a[href^="#"]');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        topnavLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        dotLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        unlockAchievement(id);
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* Konami code easter egg */
  const konamiSeq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiPos = 0;
  window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expected = konamiSeq[konamiPos];
    if (key === expected) {
      konamiPos++;
      if (konamiPos === konamiSeq.length) {
        konamiPos = 0;
        unlockAchievement('konami');
        burstConfetti();
      }
    } else {
      konamiPos = key === konamiSeq[0] ? 1 : 0;
    }
  });

  function burstConfetti() {
    const colors = ['#ffeaa7', '#fab1a0', '#ff7675', '#d63031', '#fdcb6e'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const duration = 2.2 + Math.random() * 1.4;
      const delay = Math.random() * 0.4;
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = duration + 's';
      piece.style.animationDelay = delay + 's';
      const size = 5 + Math.random() * 6;
      piece.style.width = size + 'px';
      piece.style.height = size + 'px';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + delay) * 1000 + 200);
    }
  }

  /* Achievements button + panel */
  const starIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2l2.9 6.26L21.5 9l-5 4.87L17.8 21 12 17.77 6.2 21l1.3-7.13L2.5 9l6.6-.74L12 2z"/></svg>';

  const achBtn = document.createElement('button');
  achBtn.className = 'achievements-btn';
  achBtn.type = 'button';
  achBtn.setAttribute('aria-label', 'View achievements');
  achBtn.innerHTML = starIcon + '<span class="achievements-count">0/' + ACHIEVEMENTS.length + '</span>';
  document.body.appendChild(achBtn);

  const achOverlay = document.createElement('div');
  achOverlay.className = 'achievements-overlay';
  achOverlay.innerHTML =
    '<div class="achievements-panel" role="dialog" aria-label="Achievements">' +
    '<div class="achievements-panel-header">' +
    '<div><h3>Achievements</h3><span class="achievements-progress"></span></div>' +
    '<button type="button" class="achievements-close" aria-label="Close achievements">&times;</button>' +
    '</div>' +
    '<ul class="achievements-list"></ul>' +
    '</div>';
  document.body.appendChild(achOverlay);

  const achList = achOverlay.querySelector('.achievements-list');
  const achProgress = achOverlay.querySelector('.achievements-progress');
  const achCount = achBtn.querySelector('.achievements-count');

  function renderAchievementsPanel() {
    achCount.textContent = unlocked.size + '/' + ACHIEVEMENTS.length;
    achProgress.textContent = unlocked.size + ' of ' + ACHIEVEMENTS.length + ' unlocked';
    achList.innerHTML = '';
    ACHIEVEMENTS.forEach((def) => {
      const isUnlocked = unlocked.has(def.id);
      const li = document.createElement('li');
      li.className = 'achievement-row' + (isUnlocked ? ' unlocked' : '');
      li.innerHTML =
        '<span class="row-icon">' + starIcon + '</span>' +
        '<span class="row-text"><span class="row-title">' + def.title + '</span>' +
        '<span class="row-hint">' + (isUnlocked ? 'Unlocked' : def.hint) + '</span></span>' +
        '<span class="row-check">' + (isUnlocked ? '✓' : '—') + '</span>';
      achList.appendChild(li);
    });
  }

  function pulseAchievementsButton() {
    achBtn.classList.remove('pulse');
    void achBtn.offsetWidth;
    achBtn.classList.add('pulse');
  }

  function openAchievementsPanel() {
    achOverlay.classList.add('open');
  }
  function closeAchievementsPanel() {
    achOverlay.classList.remove('open');
  }

  achBtn.addEventListener('click', openAchievementsPanel);
  achOverlay.querySelector('.achievements-close').addEventListener('click', closeAchievementsPanel);
  achOverlay.addEventListener('click', (e) => {
    if (e.target === achOverlay) closeAchievementsPanel();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAchievementsPanel();
  });

  renderAchievementsPanel();

  /* Generic reveal-on-scroll */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* Timeline scroll-fill */
  const timelineEl = document.querySelector('.timeline');
  const timelineFill = document.querySelector('.timeline-fill');
  let watchingTimeline = false;

  function updateTimelineFill() {
    if (!timelineEl || !timelineFill) return;
    const rect = timelineEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height + vh * 0.5;
    const progressed = vh * 0.75 - rect.top;
    let pct = progressed / total;
    pct = Math.max(0, Math.min(1, pct));
    timelineFill.style.height = pct * 100 + '%';
  }

  if (timelineEl) {
    const timelineVisibility = new IntersectionObserver(
      (entries) => {
        watchingTimeline = entries[0].isIntersecting;
        if (watchingTimeline) updateTimelineFill();
      },
      { threshold: 0 }
    );
    timelineVisibility.observe(timelineEl);
  }

  /* Bottom-of-page check — a short last section (like the footer) can sit
     below the IntersectionObserver's center band even at max scroll, so it
     would never register as "entered". Catch that case explicitly. */
  const contactEl = document.getElementById('contact');
  function checkReachedBottom() {
    if (!contactEl) return;
    const doc = document.documentElement;
    const atBottom = doc.scrollHeight - (window.scrollY + window.innerHeight) < 4;
    if (!atBottom) return;
    topnavLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#contact'));
    dotLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#contact'));
    unlockAchievement('contact');
  }

  /* rAF-throttled scroll handler for progress bar + topnav + timeline */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateProgress();
      updateTopnav();
      if (watchingTimeline) updateTimelineFill();
      checkReachedBottom();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (watchingTimeline) updateTimelineFill();
    checkReachedBottom();
  });

  updateProgress();
  updateTopnav();
  checkReachedBottom();

  /* Project accordion */
  document.querySelectorAll('.project-head').forEach((head) => {
    head.addEventListener('click', () => {
      const card = head.closest('.project-card');
      const wasOpen = card.classList.contains('open');
      document.querySelectorAll('.project-card.open').forEach((c) => c.classList.remove('open'));
      if (!wasOpen) card.classList.add('open');
    });
  });
})();
