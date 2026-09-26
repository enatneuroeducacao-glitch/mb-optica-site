// MB.Óptica — site público
// CONFIGURE AQUI o WhatsApp comercial antes da publicação.
const WHATSAPP = "5547999999999"; // Exemplo: 5547999999999

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();

  const menuToggle = $(".menu-toggle");
  const nav = $(".nav");
  menuToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("mobile-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("mobile-open")));

  $$(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      $$(".product-card").forEach(card => {
        card.style.display = filter === "todos" || card.dataset.category === filter ? "" : "none";
      });
    });
  });

  $$(".text-link").forEach(btn => {
    btn.addEventListener("click", () => {
      $("#interest").value = btn.dataset.product;
      document.querySelector("#agendamento").scrollIntoView({behavior:"smooth"});
      $("#message").value = `Tenho interesse no modelo ${btn.dataset.product}. Gostaria de saber se está disponível.`;
      $("#name").focus();
    });
  });

  $("#appointmentForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#name").value.trim();
    const phone = $("#phone").value.trim();
    const interest = $("#interest").value;
    const message = $("#message").value.trim();
    const text = `Olá, Ótica Meni Becker!%0A%0A meu nome é ${encodeURIComponent(name)}.%0AWhatsApp: ${encodeURIComponent(phone)}%0AInteresse: ${encodeURIComponent(interest)}%0A${encodeURIComponent(message)}`;
    if (WHATSAPP === "5547999999999") {
      showToast("Configure o número do WhatsApp em script.js antes de usar o botão.");
      return;
    }
    window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank", "noopener");
  });

  $("#newsletterForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    $("#newsletterMsg").textContent = "Cadastro recebido. A integração de e-mail será conectada na próxima etapa.";
    e.target.reset();
  });

  $$(".access-controls button").forEach(btn => {
    btn.addEventListener("click", () => {
      const root = document.documentElement;
      const current = parseFloat(getComputedStyle(root).getPropertyValue("--scale")) || 1;
      if (btn.dataset.font === "up") root.style.setProperty("--scale", Math.min(current + .08, 1.25));
      if (btn.dataset.font === "down") root.style.setProperty("--scale", Math.max(current - .08, .9));
      if (btn.dataset.font === "reset") root.style.setProperty("--scale", 1);
    });
  });
});

function openModal(id){ document.getElementById(id)?.classList.add("open"); }
function closeModal(id){ document.getElementById(id)?.classList.remove("open"); }
function showToast(message){
  const t = $("#toast"); t.textContent = message; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 4200);
}
