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
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = String(new FormData(signupForm).get("email") || "").trim();

    window.localStorage.setItem("court-and-stitch-waitlist-email", email);
    formStatus.textContent = `${email} is on the first-drop list.`;
    signupForm.reset();
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
