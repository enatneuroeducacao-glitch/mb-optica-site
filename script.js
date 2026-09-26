// MB.Óptica — site público
// CONFIGURE AQUI o WhatsApp comercial antes da publicação.
let WHATSAPP = "5547999999999"; // Exemplo: 5547999999999

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
    const text = `Olá, Ótica Moni Becker!%0A%0A meu nome é ${encodeURIComponent(name)}.%0AWhatsApp: ${encodeURIComponent(phone)}%0AInteresse: ${encodeURIComponent(interest)}%0A${encodeURIComponent(message)}`;
    if (!WHATSAPP || WHATSAPP === "5547999999999") {
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


async function loadCmsContent(){
  try{
    const client=supabase.createClient(window.MB_SUPABASE.url,window.MB_SUPABASE.key);
    const settingsRows=(await client.from("site_settings").select("key,value")).data||[];
    const settings=Object.fromEntries(settingsRows.map(x=>[x.key,x.value]));
    if(settings.store_name){
      document.querySelectorAll(".topbar").forEach(x=>x.textContent="ATENDIMENTO PERSONALIZADO • "+settings.store_name.toUpperCase());
      document.title=settings.store_name+" | Enxergar bem é viver melhor";
    }
    if(settings.hero_title) document.querySelector(".hero h1").innerHTML=escapeCms(settings.hero_title).replace(/\\n/g,"<br>");
    if(settings.hero_subtitle) document.querySelector(".hero-text").textContent=settings.hero_subtitle;
    if(settings.address) document.querySelectorAll(".contact-items p")[0].textContent=settings.address;
    if(settings.hours) document.querySelectorAll(".contact-items p")[1].textContent=settings.hours;
    if(settings.whatsapp) document.querySelectorAll(".contact-items p")[2].textContent=settings.whatsapp;
    if(settings.whatsapp){ WHATSAPP=settings.whatsapp.replace(/\\D/g,""); window.MB_WHATSAPP=WHATSAPP; }

    const products=(await client.from("products").select("*").eq("active",true).order("sort_order").order("created_at",{ascending:false})).data||[];
    if(products.length){
      const grid=document.querySelector(".product-grid");
      grid.innerHTML=products.map(p=>'<article class="product-card" data-category="'+escapeCms(p.category)+'"><div class="product-visual" style="'+(p.image_url?"background-image:url(\''+escapeCss(p.image_url)+'\');background-size:cover;background-position:center":"")+'"><span>MB</span></div><div class="product-info"><small>'+escapeCms((p.category||"outros").toUpperCase())+'</small><h3>'+escapeCms(p.name)+'</h3><p>'+escapeCms(p.description||"")+'</p><button class="text-link" data-product="'+escapeCms(p.name)+'">Tenho interesse →</button></div></article>').join("");
      grid.querySelectorAll(".text-link").forEach(btn=>btn.addEventListener("click",()=>{document.querySelector("#interest").value=btn.dataset.product;document.querySelector("#agendamento").scrollIntoView({behavior:"smooth"});document.querySelector("#message").value="Tenho interesse no modelo "+btn.dataset.product+". Gostaria de saber se está disponível.";document.querySelector("#name").focus()}));
    }
    const services=(await client.from("services").select("*").eq("active",true).order("sort_order").order("created_at",{ascending:false})).data||[];
    if(services.length){
      document.querySelector(".service-list").innerHTML=services.map((s,i)=>'<div><span>'+String(i+1).padStart(2,"0")+'</span><div><h3>'+escapeCms(s.name)+'</h3><p>'+escapeCms(s.description||"")+'</p></div></div>').join("");
    }
    const gallery=(await client.from("gallery").select("*").eq("active",true).order("sort_order").order("created_at",{ascending:false})).data||[];
    if(gallery.length){
      document.querySelector(".gallery-grid").innerHTML=gallery.map(g=>'<div class="gallery-tile" style="background-image:linear-gradient(transparent 40%,#0009),url(\''+escapeCss(g.image_url)+'\');background-size:cover;background-position:center"><span>'+escapeCms(g.title||"ÓTICA MONI BECKER")+'</span></div>').join("");
    }
    const offers=(await client.from("offers").select("*").eq("active",true).order("sort_order").order("created_at",{ascending:false})).data||[];
    if(offers.length){
      const o=offers[0];
      document.querySelector(".offer h2").innerHTML=escapeCms(o.title).replace(/\\n/g,"<br>");
      document.querySelector(".offer p").textContent=o.description||"Confira as novidades e condições especiais da Ótica Moni Becker.";
    }
  }catch(error){console.warn("CMS MB.Óptica:",error)}
}
function escapeCms(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function escapeCss(v){return String(v??"").replace(/['\\)]/g,"\\$&")}
document.addEventListener("DOMContentLoaded",()=>{loadCmsContent()});
