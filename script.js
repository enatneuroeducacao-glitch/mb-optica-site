let WHATSAPP="5547999999999";let PUBLIC_PRODUCTS=[];let PUBLIC_COLLECTIONS=[];const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
document.addEventListener("DOMContentLoaded",()=>{
 $("#year").textContent=new Date().getFullYear();
 const menuToggle=$(".menu-toggle"),nav=$(".nav");
 menuToggle?.addEventListener("click",()=>{const open=nav.classList.toggle("mobile-open");menuToggle.setAttribute("aria-expanded",String(open))});
 $$(".nav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("mobile-open")));
 bindInterestButtons();
 $("#appointmentForm")?.addEventListener("submit",appointmentSubmit);
 $("#newsletterForm")?.addEventListener("submit",e=>{e.preventDefault();$("#newsletterMsg").textContent="Cadastro recebido. Em breve enviaremos novidades.";e.target.reset()});
 $$(".access-controls button").forEach(btn=>btn.addEventListener("click",()=>{const root=document.documentElement,current=parseFloat(getComputedStyle(root).getPropertyValue("--scale"))||1;if(btn.dataset.font==="up")root.style.setProperty("--scale",Math.min(current+.08,1.25));if(btn.dataset.font==="down")root.style.setProperty("--scale",Math.max(current-.08,.9));if(btn.dataset.font==="reset")root.style.setProperty("--scale",1)}));
 loadCmsContent();
});
function bindCollectionFilters(){
 $$(".filter").forEach(btn=>btn.onclick=()=>{
  $$(".filter").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  if(btn.dataset.filter==="todos"){filterProducts("todos");closeCollectionAlbum();return}
  filterProducts(btn.dataset.filter);openCollectionAlbum(btn.dataset.filter);
 });
}
async function loadPublicCollections(client){
 const r=await client.from("collections").select("name,slug,active,sort_order").eq("active",true).order("sort_order");
 if(r.error){console.warn("Coleções:",r.error);return []}
 const collections=(r.data||[]).filter(x=>x.slug!=="outros");
 PUBLIC_COLLECTIONS=collections;
 const filters=$(".filters");if(filters)filters.innerHTML="";
 return collections;
}
function openCollectionAlbum(category){
 const modal=$("#collectionAlbum"),grid=$("#collectionAlbumGrid"),title=$("#collectionAlbumTitle"),count=$("#collectionAlbumCount");if(!modal||!grid)return;
 const collection=PUBLIC_COLLECTIONS.find(x=>x.slug===category);
 const products=PUBLIC_PRODUCTS.filter(p=>String(p.category||"").toLowerCase()===String(category||"").toLowerCase());
 title.textContent=collection?.name||category;
 count.textContent=products.length+" modelo"+(products.length===1?"":"s")+" nesta coleção";
 grid.innerHTML=products.length?products.map(p=>'<article class="product-card"><div class="product-visual">'+(p.image_url?'<img src="'+escapeCms(p.image_url)+'" alt="'+escapeCms(p.name||"Produto")+'" loading="lazy">':'<span>MB</span>')+'</div><div class="product-info"><small>'+escapeCms((p.category||"").toUpperCase())+'</small><h3>'+escapeCms(p.name||"Produto")+'</h3><div class="product-description">'+sanitizeCms(p.description||"")+'</div>'+(p.price!==null&&p.price!==undefined&&p.price!==""?'<strong class="product-price">R$ '+Number(p.price).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})+'</strong>':"")+(p.source_product_id&&p.stock_controlled?(Number(p.stock||0)>0?'<small class="product-availability">Disponível</small>':'<small class="product-availability">Esgotado</small>'):"")+'<button class="text-link" data-product="'+escapeCms(p.name||"Produto")+'">Tenho interesse →</button></div></article>').join(""):'<p class="album-empty">Ainda não há modelos cadastrados nesta coleção.</p>';
 modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");document.body.classList.add("album-open");
 $$("#collectionAlbumGrid .text-link").forEach(btn=>btn.addEventListener("click",()=>{const interest=$("#interest");if(interest)interest.value=btn.dataset.product;closeCollectionAlbum();$("#agendamento")?.scrollIntoView({behavior:"smooth"});if($("#message"))$("#message").value="Tenho interesse no modelo "+btn.dataset.product+". Gostaria de saber se está disponível.";$("#name")?.focus()}));
}
function closeCollectionAlbum(){const modal=$("#collectionAlbum");if(!modal)return;modal.classList.add("hidden");modal.setAttribute("aria-hidden","true");document.body.classList.remove("album-open")}
document.addEventListener("click",e=>{if(e.target.matches("[data-close-album]"))closeCollectionAlbum()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCollectionAlbum()});
function filterProducts(filter){$$(".product-card").forEach(card=>{card.style.display=filter==="todos"||card.dataset.category===filter?"":"none"})}
function bindInterestButtons(){$$(".text-link").forEach(btn=>btn.addEventListener("click",()=>{const interest=$("#interest");if(interest)interest.value=btn.dataset.product;$("#agendamento")?.scrollIntoView({behavior:"smooth"});if($("#message"))$("#message").value="Tenho interesse no modelo "+btn.dataset.product+". Gostaria de saber se está disponível.";$("#name")?.focus()}))}
function appointmentSubmit(e){e.preventDefault();const name=$("#name").value.trim(),phone=$("#phone").value.trim(),interest=$("#interest").value,message=$("#message").value.trim();const text="Olá, Ótica Moni Becker!%0A%0AMeu nome é "+encodeURIComponent(name)+".%0AWhatsApp: "+encodeURIComponent(phone)+"%0AInteresse: "+encodeURIComponent(interest)+"%0A"+encodeURIComponent(message);if(!WHATSAPP||WHATSAPP==="5547999999999"){showToast("O WhatsApp da loja ainda não está configurado.");return}window.open("https://wa.me/"+WHATSAPP+"?text="+text,"_blank","noopener")}
function openModal(id){document.getElementById(id)?.classList.add("open")}function closeModal(id){document.getElementById(id)?.classList.remove("open")}
function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),4200)}
function sanitizeCms(value){
 const raw=String(value??"");if(!raw)return "";
 const box=document.createElement("div");box.innerHTML=raw;
 const allowed=new Set(["B","STRONG","I","EM","U","BR","P","DIV","SPAN","UL","OL","LI","A","H2","H3","BLOCKQUOTE"]);
 box.querySelectorAll("*").forEach(el=>{
  if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);return}
  [...el.attributes].forEach(a=>{
   if(el.tagName==="A"&&a.name==="href"&&/^(https?:|mailto:)/i.test(a.value))return;
   if(el.tagName==="SPAN"&&a.name==="style"&&/^\\s*(color|background-color)\\s*:\\s*(#[0-9a-fA-F]{6}|rgb\\([^)]*\\))\\s*;?\\s*$/i.test(a.value))return;
   el.removeAttribute(a.name);
  });
 });
 const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(n=>{if(/\\n/.test(n.nodeValue)){const parts=n.nodeValue.split(/\\n/);const frag=document.createDocumentFragment();parts.forEach((p,i)=>{if(i)frag.appendChild(document.createElement("br"));frag.appendChild(document.createTextNode(p))});n.replaceWith(frag)}});
 return box.innerHTML;
}
function setText(sel,value){const el=$(sel);if(el&&value!==undefined&&value!=="")el.innerHTML=sanitizeCms(value)}
function setTitle(sel,value){const el=$(sel);if(el&&value!==undefined&&value!=="")el.innerHTML=sanitizeCms(value)}
function setMany(sel,value){if(value===undefined||value==="")return;$(sel)?.forEach?$(sel).forEach(x=>x.innerHTML=sanitizeCms(value)):null}
function escapeCms(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function escapeCss(v){return String(v??"").replace(/['\\)]/g,"\\$&")}

async function loadCmsContent(){
 try{
  const client=supabase.createClient(window.MB_SUPABASE.url,window.MB_SUPABASE.key);
  const rows=(await client.from("site_settings").select("key,value")).data||[],s=Object.fromEntries(rows.map(x=>[x.key,x.value]));
  if(s.store_name){document.title=s.store_name+" | Enxergar bem é viver melhor";$$(".topbar").forEach(x=>x.textContent=(s.topbar_text||"ATENDIMENTO PERSONALIZADO")+" • "+s.store_name.toUpperCase())}
  if(s.topbar_text)$$(".topbar").forEach(x=>x.textContent=s.topbar_text);
  if(s.logo_url)$$("img[alt*='Logo'],.brand img,.footer-brand img,.login-box img").forEach(x=>x.src=s.logo_url);
  if(s.hero_image_url){const hero=$(".hero-photo");if(hero)hero.src=s.hero_image_url}
  const serviceImage=$("#serviceImage");if(serviceImage){serviceImage.src=s.service_image_url||"assets/service-dnp-reader.svg";}
  if(s.amorinha_image_url){const photo=$("#amorinhaPhoto");if(photo)photo.src=s.amorinha_image_url}
  setText(".hero .eyebrow",s.hero_eyebrow);setTitle(".hero h1",s.hero_title);setText(".hero-text",s.hero_subtitle);setText(".hero-note",s.hero_note);
  [[".trust-strip div:nth-child(1) strong","trust_1_title"],[".trust-strip div:nth-child(1) span","trust_1_text"],[".trust-strip div:nth-child(2) strong","trust_2_title"],[".trust-strip div:nth-child(2) span","trust_2_text"],[".trust-strip div:nth-child(3) strong","trust_3_title"],[".trust-strip div:nth-child(3) span","trust_3_text"],[".trust-strip div:nth-child(4) strong","trust_4_title"],[".trust-strip div:nth-child(4) span","trust_4_text"]].forEach(([q,k])=>setText(q,s[k]));
  setText("#colecao .eyebrow",s.collection_eyebrow);setTitle("#colecao h2",s.collection_title);setText("#colecao .section-heading>p",s.collection_text);setText(".catalog-note",s.catalog_note);
  setText("#servicos .eyebrow",s.services_eyebrow);setTitle("#servicos h2",s.services_title);setText("#servicos .split-copy>p:last-child",s.services_text);
  setText("#historia .eyebrow",s.history_eyebrow);setTitle("#historia h2",s.history_title);setText("#historia .story-copy>p:not(.eyebrow)",s.history_text);setText("#historia .story-note",s.history_note);
  setText("#experiencia .eyebrow",s.experience_eyebrow);setTitle("#experiencia h2",s.experience_title);setText("#experiencia .section-heading>p:last-child",s.experience_text);const experienceImg=$("#experienceImage"),experienceWrap=$("#experienceImageWrap");if(experienceImg&&experienceWrap){if(s.experience_image_url){experienceImg.src=s.experience_image_url;experienceWrap.hidden=false}else{experienceWrap.hidden=true}}
  setText("#galeria .eyebrow",s.gallery_eyebrow);setTitle("#galeria h2",s.gallery_title);setText("#galeria .section-heading>p",s.gallery_text);
  setText("#promocoes .eyebrow",s.offer_eyebrow);setTitle("#promocoes h2",s.offer_title);setText("#promocoes>div>p:last-child",s.offer_text);
  setText("#agendamento .eyebrow",s.appointment_eyebrow);setTitle("#agendamento h2",s.appointment_title);setText("#agendamento .appointment-card>div>p:last-child",s.appointment_text);
  setText("#contato .eyebrow",s.contact_eyebrow);setTitle("#contato h2",s.contact_title);
  setText("#contactAddress",s.address);setText("#contactHours",s.hours);setText("#contactWhatsapp",s.whatsapp);setText("#contactPhone",s.phone);setText("#contactEmail",s.email);setText("#contactInstagram",s.instagram);
  if(s.map_url){const map=$(".map-container iframe");if(map)map.src=s.map_url}
  if(s.privacy_text){const m=$("#lgpdModal .modal-box p:nth-of-type(2)");if(m)m.textContent=s.privacy_text}
  if(s.cookies_text){const m=$("#cookieModal .modal-box p:nth-of-type(2)");if(m)m.textContent=s.cookies_text}
  setText(".footer-brand p",s.footer_tagline);setText(".footer-bottom",s.footer_copyright?("© "+new Date().getFullYear()+" "+s.footer_copyright):"");
  const root=document.documentElement;if(s.primary_color)root.style.setProperty("--gold",s.primary_color);if(s.cream_color)root.style.setProperty("--cream",s.cream_color);if(s.dark_color)root.style.setProperty("--dark",s.dark_color);if(s.muted_color)root.style.setProperty("--muted",s.muted_color);
  if(s.whatsapp)WHATSAPP=s.whatsapp.replace(/\D/g,"");
  await loadPublicCollections(client);
  const collections=await loadPublicCollections(client);
  const products=(await client.from("products").select("*").eq("active",true).order("sort_order").order("created_at",{ascending:false})).data||[];
  PUBLIC_PRODUCTS=products;
  const grid=$(".product-grid");
  if(grid){
   grid.innerHTML=collections.map(collection=>{
    const product=products.find(p=>String(p.category||"").toLowerCase()===String(collection.slug||"").toLowerCase());
    return '<article class="product-card collection-showcase" data-category="'+escapeCms(collection.slug)+'"><div class="product-visual">'+(product?.image_url?'<img src="'+escapeCms(product.image_url)+'" alt="'+escapeCms(collection.name)+'" loading="lazy">':'<span>MB</span>')+'</div><div class="product-info"><small>'+escapeCms(collection.name.toUpperCase())+'</small><h3>'+escapeCms(collection.name)+'</h3><button type="button" class="collection-link" data-collection="'+escapeCms(collection.slug)+'">Conheça a coleção →</button></div></article>';
   }).join("");
   $$(".collection-link").forEach(btn=>btn.addEventListener("click",()=>openCollectionAlbum(btn.dataset.collection)));
  }
  const servicesResult=await client.from("services").select("*").eq("active",true).order("sort_order").order("created_at",{ascending:false});const services=servicesResult.data||[];if(services.length){$(".service-list").innerHTML=services.map((x,i)=>'<div><span>'+String(i+1).padStart(2,"0")+'</span><div><h3>'+sanitizeCms(x.name||"")+'</h3><div class="service-desc">'+sanitizeCms(x.description||"")+'</div></div></div>').join("");if(services[0].image_url){const serviceImage=$("#serviceImage");if(serviceImage){serviceImage.src=services[0].image_url;serviceImage.alt=services[0].name||"Imagem dos serviços";serviceImage.style.backgroundImage="none"}}}
  const gallery=(await client.from("gallery").select("*").eq("active",true).order("sort_order").order("created_at",{ascending:false})).data||[];
  if(gallery.length){$(".gallery-grid").innerHTML=gallery.map(x=>'<figure class="gallery-tile"><img src="'+escapeCms(x.image_url)+'" alt="'+escapeCms(x.alt_text||x.title||"Ótica Moni Becker")+'" loading="lazy"><figcaption>'+escapeCms(x.title||"ÓTICA MONI BECKER")+'</figcaption></figure>').join("")}
  const now=new Date();const offersResult=await client.from("offers").select("*").eq("active",true).order("sort_order").order("created_at",{ascending:false});const offers=(offersResult.data||[]).filter(o=>(!o.starts_at||new Date(o.starts_at)<=now)&&(!o.ends_at||new Date(o.ends_at)>=now));if(offers.length){const o=offers[0];setTitle("#promocoes h2",o.title);setText("#promocoes>div>p:last-child",o.description||s.offer_text);if(o.price_text)setText("#promocoes strong",o.price_text);if(o.image_url){const offer=document.querySelector("#promocoes");if(offer){offer.style.backgroundImage="linear-gradient(90deg,rgba(214,189,148,.96) 0%,rgba(214,189,148,.88) 55%,rgba(214,189,148,.55) 100%),url('"+escapeCss(o.image_url)+"')";offer.style.backgroundSize="cover";offer.style.backgroundPosition="center"}}}
 }catch(error){console.warn("CMS MB.Óptica:",error)}
}
