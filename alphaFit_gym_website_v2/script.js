const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby70Y-qJ7dU0DlDQG2NXr1n_q2e4M2g0Pr3FfDyPy_VKOgwZeOKcqNOaTj-mH6fFQlO/exec";

const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const scrollTopBtn = document.querySelector("[data-scroll-top]");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const opened = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", opened ? "true" : "false");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const currentPage = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll("[data-nav-links] a").forEach((link) => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
  }
});

document.querySelectorAll(".reveal").forEach((el) => {
  el.classList.add("visible");
});

document.querySelectorAll("[data-count]").forEach((element) => {
  const value = element.getAttribute("data-count");
  const suffix = element.getAttribute("data-suffix") || "";
  element.textContent = `${value}${suffix}`;
});

if (scrollTopBtn) {
  window.addEventListener("scroll", () => {
    scrollTopBtn.classList.toggle("show", window.scrollY > 420);
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const accordionItems = document.querySelectorAll("[data-accordion]");
accordionItems.forEach((item) => {
  const button = item.querySelector(".faq-question");
  if (!button) return;
  button.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    accordionItems.forEach((other) => other.classList.remove("open"));
    if (!isOpen) item.classList.add("open");
  });
});

const contactForm = document.querySelector("[data-contact-form]");
const statusBox = document.querySelector("[data-form-status]");

async function submitToGoogleSheet(payload) {
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error("Google Script URL is not configured.");
  }

  await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(payload).toString()
  });
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    const requiredFields = ["name", "email", "phone", "service", "message"];
    const isValid = requiredFields.every((field) => String(payload[field] || "").trim().length > 0);

    if (!isValid) {
      if (statusBox) statusBox.textContent = "Please fill all required fields.";
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton?.setAttribute("disabled", "disabled");
    if (statusBox) statusBox.textContent = "Saving your request...";

    try {
      await submitToGoogleSheet(payload);
      contactForm.reset();
      if (statusBox) statusBox.textContent = "Your request was send successfully.";
    } catch (error) {
      if (statusBox) statusBox.textContent = "Unable to save your request right now. Please check the Google Apps Script URL and deploy settings.";
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
}
