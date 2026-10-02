/* =========================================================================
   ApexLaunchMarketing — Global JavaScript
   ========================================================================= */

(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* -----------------------------------------------------------------------
     01. HEADER SCROLL STATE
     ----------------------------------------------------------------------- */
  var header = $('#siteHeader');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }


  /* -----------------------------------------------------------------------
     02. MOBILE NAVIGATION
     ----------------------------------------------------------------------- */
  var navToggle = $('#navToggle');
  var navMenu   = $('#navMenu');

  function closeMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.add('open');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (navMenu.classList.contains('open')) closeMenu();
      else openMenu();
    });

    $$('a', navMenu).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (e) {
      if (!navMenu.classList.contains('open')) return;
      var withinMenu   = navMenu.contains(e.target);
      var withinToggle = navToggle.contains(e.target);
      if (!withinMenu && !withinToggle) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) closeMenu();
    });
  }


  /* -----------------------------------------------------------------------
     03. REVEAL ON SCROLL
     ----------------------------------------------------------------------- */
  var revealEls = $$('.reveal');

  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function (el) { io.observe(el); });
    }
  }


  /* -----------------------------------------------------------------------
     04. FAQ ACCORDION
     ----------------------------------------------------------------------- */
  $$('.faq-question').forEach(function (btn) {
    var item = btn.closest('.faq-item');
    if (item && item.classList.contains('open')) btn.setAttribute('aria-expanded', 'true');
    else btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', function () {
      var thisItem = btn.closest('.faq-item');
      if (!thisItem) return;

      var group = thisItem.closest('.faq');
      var isOpen = thisItem.classList.contains('open');

      if (group) {
        $$('.faq-item.open', group).forEach(function (other) {
          if (other !== thisItem) {
            other.classList.remove('open');
            var q = $('.faq-question', other);
            if (q) q.setAttribute('aria-expanded', 'false');
          }
        });
      }

      thisItem.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });


  /* -----------------------------------------------------------------------
     05. SMOOTH SCROLL FOR IN-PAGE ANCHORS
     ----------------------------------------------------------------------- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;

      var target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();
      var headerOffset = header ? header.offsetHeight + 12 : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });


  /* -----------------------------------------------------------------------
     06. CONTACT FORM (STATIC)
     ----------------------------------------------------------------------- */
  var form = $('#contactForm');
  var statusEl = $('#formStatus');

  if (form) {
    var isStatic = form.getAttribute('data-static-form') === 'true';
    var fallbackEmail = form.getAttribute('data-fallback-email') || '';

    var setStatus = function (message, type) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'form-status show ' + (type || 'info');
    };

    var clearStatus = function () {
      if (!statusEl) return;
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    };

    var markInvalid = function (field, invalid) {
      var wrap = field.closest('.form-field');
      if (!wrap) return;
      wrap.classList.toggle('invalid', invalid);

      var err = wrap.querySelector('.field-error');
      if (invalid) {
        if (!err) {
          err = document.createElement('div');
          err.className = 'field-error';
          wrap.appendChild(err);
        }
        err.textContent = 'This field is required.';
      } else if (err) {
        err.parentNode.removeChild(err);
      }
    };

    var validateField = function (field) {
      var ok = true;

      if (field.hasAttribute('required') && !field.value.trim()) ok = false;

      if (ok && field.type === 'email' && field.value.trim()) {
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(field.value.trim())) ok = false;
      }

      markInvalid(field, !ok);
      return ok;
    };

    var fields = $$('input, select, textarea', form);

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        var wrap = field.closest('.form-field');
        if (wrap && wrap.classList.contains('invalid')) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      clearStatus();

      var allValid = true;
      fields.forEach(function (field) {
        if (!validateField(field)) allValid = false;
      });

      if (!allValid) {
        e.preventDefault();
        setStatus('Please complete the required fields before sending.', 'error');
        var firstInvalid = $('.form-field.invalid input, .form-field.invalid select, .form-field.invalid textarea', form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!isStatic && form.getAttribute('action')) return;

      e.preventDefault();

      if (!fallbackEmail) {
        setStatus('This form is not connected yet. Please email us directly.', 'info');
        return;
      }

      var data = new FormData(form);
      var lines = [];
      var labels = {
        name: 'Name',
        email: 'Email',
        campaign: 'Campaign / Project Name',
        platform: 'Crowdfunding Platform',
        stage: 'Campaign Stage',
        message: 'Message'
      };

      Object.keys(labels).forEach(function (key) {
        var value = (data.get(key) || '').toString().trim();
        if (value) lines.push(labels[key] + ': ' + value);
      });

      var subject = encodeURIComponent('Website contact — ' + (data.get('name') || 'New message'));
      var body    = encodeURIComponent(lines.join('\n\n'));
      var mailto  = 'mailto:' + fallbackEmail + '?subject=' + subject + '&body=' + body;

      setStatus('This form is not connected to a server yet. Opening your email client so you can send the message directly.', 'info');

      window.setTimeout(function () {
        window.location.href = mailto;
      }, 350);
    });
  }


  /* -----------------------------------------------------------------------
     07. SOCIAL LINK PLACEHOLDERS
     Replace the empty strings below with real URLs when available.
     ----------------------------------------------------------------------- */
  var SOCIAL_URLS = {
    facebook:  '',
    instagram: '',
    linkedin:  '',
    x:         '',
    youtube:   '',
    tiktok:    ''
  };

  $$('[data-social]').forEach(function (link) {
    var key = link.getAttribute('data-social');
    var url = SOCIAL_URLS[key];
    if (url) {
      link.setAttribute('href', url);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    } else {
      link.setAttribute('href', '#');
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', function (e) { e.preventDefault(); });
    }
  });

})();
