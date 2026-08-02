/* ============================================================
   VERA NUTRITION — SCRIPT
   Vanilla JS, inga beroenden. Varje del är fristående och
   tiger om dess markup saknas.

   1. Rörelseinställning      4. Drift (parallax)
   2. Topprad                 5. Räknare
   3. Öppningssekvens         6. Formulär
      + scroll-reveals
   ============================================================ */

(function () {
  "use strict";

  /* ---- 1. Respektera systemets "minska rörelse" -------------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* Fördröjning mellan stegen i öppningssekvensen (ms). */
  const STEP = 110;


  /* ---- 2. Topprad -------------------------------------------- */
  const masthead = document.getElementById("masthead");

  const onScroll = () => {
    if (masthead) masthead.classList.toggle("is-stuck", window.scrollY > 20);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });


  /* ---- 3a. Öppningssekvens -----------------------------------
     Elementen med data-seq spelas upp i dokumentordning när
     typsnitten är laddade — annars hoppar sättningen mitt i. */
  const sequence = Array.from(document.querySelectorAll("[data-seq]"));

  const play = () => {
    sequence.forEach((el, i) => {
      el.style.transitionDelay = reduceMotion ? "0ms" : `${i * STEP}ms`;
      el.classList.add("is-in");
    });

    // Städa bort fördröjningarna efteråt så de inte påverkar hover
    window.setTimeout(() => {
      sequence.forEach((el) => (el.style.transitionDelay = ""));
    }, sequence.length * STEP + 1400);
  };

  if (document.fonts && document.fonts.ready) {
    // Vänta på typsnitten, men aldrig längre än en sekund
    Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1000))
    ]).then(() => requestAnimationFrame(play));
  } else {
    requestAnimationFrame(play);
  }


  /* ---- 3b. Scroll-reveals ------------------------------------
     Syskon som kommer in samtidigt förskjuts lätt inbördes. */
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


  /* ---- 4. Drift ----------------------------------------------
     Bilder med data-drift förskjuts några pixlar i takt med
     scrollen. Talet är hur många pixlar per scrollad pixel —
     håll det under 0.08, annars blir det en effekt.            */
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


  /* ---- 5. Räknare --------------------------------------------
     Antalet står i data-count-to i index.html.                 */
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


  /* ---- 6. Formulär -------------------------------------------
     Fram tills ni kopplar in en tjänst skickas ingenting vidare.
     Byt innehållet i sendEmail() mot ett riktigt anrop.        */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const TEXT = {
    empty:   "Skriv in din e-postadress först.",
    invalid: "Adressen ser inte komplett ut — kontrollera den.",
    done:    "Du står i kön. Vi hör av oss innan vi öppnar.",
    failed:  "Adressen kunde inte sparas. Försök igen om en stund."
  };

  /**
   * Skicka adressen vidare. Ersätt kroppen med t.ex.:
   *
   *   return fetch("https://din-endpoint.se/vantelista", {
   *     method: "POST",
   *     headers: { "Content-Type": "application/json" },
   *     body: JSON.stringify({ email })
   *   }).then((res) => { if (!res.ok) throw new Error(res.status); });
   */
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

        // Räknaren speglar den nya anmälan
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


  /* ---- Årtal i sidfoten -------------------------------------- */
  const year = document.getElementById("ar");
  if (year) year.textContent = new Date().getFullYear();

})();
