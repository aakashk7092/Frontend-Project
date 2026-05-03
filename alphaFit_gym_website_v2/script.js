const body = document.body;
const header = document.querySelector(".site-header");
const scrollTopBtn = document.querySelector("[data-scroll-top]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const themeToggle = document.querySelector("[data-theme-toggle]");

function applyTheme(theme) {
  body.setAttribute("data-theme", theme);

  if (themeToggle) {
    const isLight = theme === "light";
    themeToggle.textContent = isLight ? "Dark mode" : "Light mode";
    themeToggle.setAttribute("aria-pressed", String(isLight));
  }
}

const savedTheme = localStorage.getItem("alphafit-theme");
applyTheme(savedTheme || "dark");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = body.getAttribute("data-theme") === "light" ? "dark" : "light";
    localStorage.setItem("alphafit-theme", nextTheme);
    applyTheme(nextTheme);
  });
}

window.addEventListener("scroll", () => {
  if (header) header.classList.toggle("scrolled", window.scrollY > 40);
  if (scrollTopBtn) scrollTopBtn.classList.toggle("visible", window.scrollY > 300);
});

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.innerHTML = isOpen ? "&#10005;" : "&#9776;";
  });

  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.innerHTML = "&#9776;";
    });
  });
}

const currentPage = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach((a) => {
  const href = a.getAttribute("href");
  if (href === currentPage || (currentPage === "" && href === "index.html")) {
    a.classList.add("active");
  }
});

if (scrollTopBtn) {
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), i * 80);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1600;
  const start = performance.now();

  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

document.querySelectorAll("[data-accordion]").forEach((item) => {
  const btn = item.querySelector(".faq-question");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    document.querySelectorAll("[data-accordion]").forEach((i) => i.classList.remove("open"));
    if (!isOpen) item.classList.add("open");
  });
});

const form = document.querySelector("[data-contact-form]");
const status = document.querySelector("[data-form-status]");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    btn.textContent = "Sending...";
    btn.disabled = true;

    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (status) {
      status.textContent = "Your booking request has been received. We will contact you within 24 hours.";
      status.className = "status success";
    }

    form.reset();
    btn.textContent = "Submit Booking";
    btn.disabled = false;
  });
}
