const revealItems = document.querySelectorAll("[data-reveal]");
const slidePanels = document.querySelectorAll(".mockup-panel");
const slideMeters = document.querySelectorAll(".slide-meter span");
const signupForm = document.querySelector(".signup-form");
const formStatus = document.querySelector(".form-status");

let slideIndex = 0;

function showSlide(index) {
  slidePanels.forEach((panel, panelIndex) => {
    panel.classList.toggle("is-active", panelIndex === index);
  });

  slideMeters.forEach((meter, meterIndex) => {
    meter.classList.toggle("is-active", meterIndex === index);
  });
}

if (slidePanels.length) {
  window.setInterval(() => {
    slideIndex = (slideIndex + 1) % slidePanels.length;
    showSlide(slideIndex);
  }, 3200);
}

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = String(new FormData(signupForm).get("email") || "").trim();

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        formStatus.textContent = data.error || "Something went wrong. Try again.";
        return;
      }

      formStatus.textContent = `${email} is on the first-drop list.`;
      signupForm.reset();
    } catch (_error) {
      formStatus.textContent = "Network error. Make sure the local server is running.";
    }
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
