// Menu mobile
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      toggle.focus();
    }
  });
}

// Formulaire de réservation
const form = document.getElementById("booking-form");
if (form) {
  const params = new URLSearchParams(location.search);
  const activity = form.elements.activite;
  if (params.get("activite") && activity.querySelector(`option[value="${params.get("activite")}"]`)) {
    activity.value = params.get("activite");
  }

  const date = form.elements.date;
  if (date) date.min = new Date().toISOString().slice(0, 10);

  const status = form.querySelector(".form__status");
  const setStatus = (msg, ok) => {
    status.textContent = msg;
    status.className = "form__status " + (ok ? "form__status--ok" : "form__status--err");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const label = (name) => {
      const el = form.elements[name];
      return el.tagName === "SELECT" ? el.options[el.selectedIndex].text : el.value;
    };
    const lines = [
      `Nom : ${data.get("nom")}`,
      `Téléphone : ${data.get("telephone")}`,
      `E-mail : ${data.get("email")}`,
      `Activité : ${label("activite")}`,
      `Nombre de joueurs : ${data.get("joueurs")}`,
      `Date souhaitée : ${data.get("date")} (${label("creneau")})`,
      "",
      data.get("message") || "",
    ];

    if (form.dataset.demo) {
      setStatus("Maquette de démonstration : aucune demande n'est envoyée.", true);
      return;
    }

    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        setStatus("Merci ! Votre demande est bien envoyée. Nous vous recontactons rapidement pour confirmer le créneau.", true);
        return;
      } catch {
        setStatus("L'envoi n'a pas fonctionné. Appelez-nous directement ou réessayez dans un instant.", false);
        return;
      }
    }

    // Sans service d'envoi configuré : ouverture de la messagerie avec la demande pré-remplie.
    const subject = `Demande de réservation – ${label("activite")} – ${data.get("date")}`;
    location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setStatus("Votre messagerie s'ouvre avec la demande pré-remplie : il ne reste plus qu'à l'envoyer.", true);
  });
}
