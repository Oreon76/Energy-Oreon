(function () {
  "use strict";

  /* --- menu --------------------------------------------------------- */
  var menu = document.getElementById("menu");
  var btn = document.getElementById("menuBtn");
  var isOpen = false;

  function setMenu(open) {
    if (!menu || !btn) return;
    isOpen = open;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    btn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (btn) {
    btn.addEventListener("click", function () {
      setMenu(!isOpen);
    });
  }

  if (menu) {
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen) setMenu(false);
  });

  /* --- clock -------------------------------------------------------- */
  var clock = document.getElementById("clock");

  function tick() {
    if (!clock) return;
    var now = new Date();
    var msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
    var h = String(msk.getHours()).padStart(2, "0");
    var m = String(msk.getMinutes()).padStart(2, "0");
    clock.textContent = "MSK " + h + ":" + m;
  }

  tick();
  setInterval(tick, 30000);

  /* --- reveal ------------------------------------------------------- */
  var items = document.querySelectorAll(".reveal");

  function show(el) {
    el.classList.add("is-in");
  }

  if (!("IntersectionObserver" in window)) {
    items.forEach(show);
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            show(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.12 }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* hero intro: reveal copy immediately */
  var heroReveals = document.querySelectorAll(".hero .reveal");
  setTimeout(function () {
    heroReveals.forEach(show);
  }, 220);

  /* --- parallax ----------------------------------------------------- */
  var art = document.querySelector("[data-parallax]");
  var hero = document.querySelector(".hero");
  var raf = null;

  function updateParallax() {
    raf = null;
    if (!art || !hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var rect = hero.getBoundingClientRect();
    if (rect.bottom < 0) return;
    var progress = Math.max(0, -rect.top);
    art.style.setProperty("--py", (progress * 0.12).toFixed(1) + "px");
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!raf) raf = window.requestAnimationFrame(updateParallax);
    },
    { passive: true }
  );

  /* --- flavour picker ------------------------------------------------ */
  var picker = document.querySelector("[data-picker]");

  if (picker) {
    var tabs = Array.prototype.slice.call(picker.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(picker.querySelectorAll('[role="tabpanel"]'));
    var dots = Array.prototype.slice.call(picker.querySelectorAll("[data-dot]"));
    var cans = Array.prototype.slice.call(document.querySelectorAll("[data-can]"));
    var prevBtn = picker.querySelector("[data-prev]");
    var nextBtn = picker.querySelector("[data-next]");
    var active = 0;

    tabs.forEach(function (tab) {
      if (tab.dataset.accent) tab.style.setProperty("--flavor", tab.dataset.accent);
    });

    function paint(can, tab) {
      can.style.setProperty("--flavor", tab.dataset.accent || "");
      var name = can.querySelector("[data-can-name]");
      var notes = can.querySelector("[data-can-notes]");
      if (name) name.textContent = tab.dataset.name || "";
      if (notes) notes.textContent = tab.dataset.notes || "";
    }

    function select(index, moveFocus) {
      if (!tabs.length) return;
      var next = (index + tabs.length) % tabs.length;
      var changed = next !== active;
      active = next;

      tabs.forEach(function (tab, i) {
        var on = i === active;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        if (on && moveFocus) tab.focus();
      });

      panels.forEach(function (panel, i) {
        panel.hidden = i !== active;
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-on", i === active);
      });

      cans.forEach(function (can) {
        paint(can, tabs[active]);

        if (!changed) return;

        window.clearTimeout(can.swapTimer);
        can.classList.remove("is-switching");
        void can.offsetWidth;
        can.classList.add("is-switching");
        can.swapTimer = window.setTimeout(function () {
          can.classList.remove("is-switching");
        }, 680);
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(i, false);
      });

      tab.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          select(active + 1, true);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          select(active - 1, true);
        } else if (event.key === "Home") {
          event.preventDefault();
          select(0, true);
        } else if (event.key === "End") {
          event.preventDefault();
          select(tabs.length - 1, true);
        }
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        select(active - 1, false);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        select(active + 1, false);
      });
    }

    select(0, false);
  }

  /* --- pointer sheen -------------------------------------------------- */
  function bindSheen(surface) {
    if (!surface) return;

    var can = surface.querySelector(".can");
    if (!can) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var frame = null;

    surface.addEventListener(
      "pointermove",
      function (event) {
        if (reduced.matches) return;
        if (frame) return;

        frame = window.requestAnimationFrame(function () {
          frame = null;
          var rect = can.getBoundingClientRect();
          if (!rect.width) return;
          var ratio = (event.clientX - rect.left) / rect.width;
          ratio = Math.min(1, Math.max(0, ratio));
          can.style.setProperty("--gloss-x", (6 + ratio * 58).toFixed(1) + "%");
        });
      },
      { passive: true }
    );

    surface.addEventListener("pointerleave", function () {
      can.style.removeProperty("--gloss-x");
    });
  }

  bindSheen(document.querySelector(".hero"));
  bindSheen(document.querySelector(".picker__stage"));

  updateParallax();
})();
