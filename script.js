/* ============================================================
   VERA NUTRITION — SCRIPT
   ============================================================ */

(function () {
  "use strict";

  /* KOMMENTAR: Ändrat till 'false' för att tvinga rullbandet och animationer att 
     köra även på datorer som har stängt av systemanimationer */
  const reduceMotion = false; 
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const STEP = 110;

  /* TOPPRAD */
  const masthead = document.getElementById("masthead");
  const onScroll = () => {
    if (masthead) masthead.classList.toggle("is-stuck", window.scrollY > 20);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });


  /* ÖPPNINGSSEKVENS */
  const sequence = Array.from(document.querySelectorAll("[data-seq]"));
  const play = () => {
    sequence.forEach((el, i) => {
      el.style.transitionDelay = reduceMotion ? "0ms" : `${i * STEP}ms`;
      el.classList.add("is-in");
    });
    window.setTimeout(() => {
      sequence.forEach((el) => (el.style.transitionDelay = ""));
    }, sequence.length * STEP + 1400);
  };

  if (document.fonts && document.fonts.ready) {
    Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1000))
    ]).then(() => requestAnimationFrame(play));
  } else {
    requestAnimationFrame(play);
  }


  /* SCROLL-REVEALS */
  const revealables = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    let batch = [];
    let flushTimer = null;
    const flush = () => {
      batch.forEach((el, i) => {
        el.style.transitionDelay = `${i * 70}ms`;
        el.classList.add("is-in");
      });
      batch = [];
    };
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          batch.push(entry.target);
          obs.unobserve(entry.target);
        });
        clearTimeout(flushTimer);
        flushTimer = setTimeout(flush, 20);
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    revealables.forEach((el) => observer.observe(el));
  }


  /* DRIFT (PARALLAX) */
  const drifters = Array.from(document.querySelectorAll("[data-drift]"));
  if (drifters.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const mid = window.innerHeight / 2;
      drifters.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        const offset = (rect.top + rect.height / 2 - mid) * parseFloat(el.dataset.drift);
        el.style.transform = `translate3d(0, ${(-offset).toFixed(2)}px, 0)`;
      });
      ticking = false;
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
  }


  /* RULLANDE BAND */
  const SPEED = 45;
  const marqueeTrack = document.querySelector(".facts__track");

  if (marqueeTrack) {
    const list = marqueeTrack.firstElementChild;
    const originalItems = Array.from(list.children).map((li) => li.cloneNode(true));

    const buildMarquee = () => {
      marqueeTrack.querySelectorAll("[data-marquee-copy]").forEach((el) => el.remove());
      list.replaceChildren(...originalItems.map((li) => li.cloneNode(true)));

      let guard = 0;
      while (list.getBoundingClientRect().width < window.innerWidth && guard < 12) {
        originalItems.forEach((li) => list.appendChild(li.cloneNode(true)));
        guard += 1;
      }

      const width = list.getBoundingClientRect().width;
      if (!width) return;

      const copy = list.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.setAttribute("data-marquee-copy", "");
      marqueeTrack.appendChild(copy);

      marqueeTrack.style.animationDuration = `${(width / SPEED).toFixed(2)}s`;
    };

    buildMarquee();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(buildMarquee);
    }
    let marqueeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(marqueeTimer);
      marqueeTimer = setTimeout(buildMarquee, 250);
    });
  }


  /* RÄKNARE */
  const counters = document.querySelectorAll("[data-count-to]");
  const countUp = (el) => {
    const target = parseInt(el.dataset.countTo, 10) || 0;
    if (reduceMotion) {
      el.textContent = target.toLocaleString("sv-SE");
      return;
    }
    const duration = 1600;
    const started = performance.now();
    const tick = (now) => {
      const p = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString("sv-SE");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.8 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(countUp);
  }


  /* FORMULÄR */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const TEXT = {
    empty:   "Skriv in din e-postadress först.",
    invalid: "Adressen ser inte komplett ut — kontrollera den.",
    done:    "Du står i kön. Vi hör av oss innan vi öppnar.",
    failed:  "Adressen kunde inte sparas. Försök igen om en stund."
  };

  function sendEmail(email) {
    console.log("Väntelista:", email);
    return new Promise((resolve) => setTimeout(resolve, 600));
  }

  document.querySelectorAll(".signup").forEach((form) => {
    const input = form.querySelector("input[type='email']");
    const button = form.querySelector("button");
    const msg = form.querySelector(".signup__msg");
    const buttonLabel = button.querySelector("span").textContent;

    const say = (text, isError) => {
      msg.textContent = text;
      msg.classList.toggle("is-error", Boolean(isError));
      msg.classList.add("is-shown");
    };

    input.addEventListener("input", () => {
      form.classList.remove("is-invalid");
      msg.classList.remove("is-shown", "is-error");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = input.value.trim();

      if (!email || !EMAIL.test(email)) {
        form.classList.add("is-invalid");
        say(email ? TEXT.invalid : TEXT.empty, true);
        input.focus();
        return;
      }

      button.disabled = true;
      button.querySelector("span").textContent = "Skickar…";

      try {
        await sendEmail(email);
        form.classList.add("is-done");
        say(TEXT.done, false);
        counters.forEach((el) => {
          const next = (parseInt(el.textContent.replace(/\D/g, ""), 10) || 0) + 1;
          el.textContent = next.toLocaleString("sv-SE");
        });
      } catch (error) {
        say(TEXT.failed, true);
        button.disabled = false;
        button.querySelector("span").textContent = buttonLabel;
      }
    });
  });

  /* Årtal i sidfoten */
  const year = document.getElementById("ar");
  if (year) year.textContent = new Date().getFullYear();

})();
