window.__MB_ADMIN_LOADED=true;
const db=supabase.createClient(window.MB_SUPABASE.url,window.MB_SUPABASE.key);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ADMIN_EMAIL="becker.optica@gmail.com";

const homeFields=[
["topbar_text","Faixa superior"],["store_name","Nome da ótica"],["hero_eyebrow","Hero — etiqueta"],["hero_title","Hero — título"],["hero_subtitle","Hero — subtítulo"],["hero_note","Hero — observação"],
["trust_1_title","Confiança 1 — título"],["trust_1_text","Confiança 1 — texto"],["trust_2_title","Confiança 2 — título"],["trust_2_text","Confiança 2 — texto"],["trust_3_title","Confiança 3 — título"],["trust_3_text","Confiança 3 — texto"],["trust_4_title","Confiança 4 — título"],["trust_4_text","Confiança 4 — texto"]
];
const collectionFields=[["collection_eyebrow","Coleção — etiqueta"],["collection_title","Coleção — título"],["collection_text","Coleção — descrição"],["catalog_note","Coleção — observação"]];
const servicesFields=[["services_eyebrow","Serviços — etiqueta"],["services_title","Serviços — título"],["services_text","Serviços — descrição"]];
const experienceFields=[["experience_eyebrow","A Ótica — etiqueta"],["experience_title","A Ótica — título"],["experience_text","A Ótica — descrição"]];
const historyFields=[["history_eyebrow","Etiqueta da seção"],["history_title","Título da seção"],["history_text","Texto da seção"],["history_note","Frase de destaque"]];
const galleryFields=[["gallery_eyebrow","Galeria — etiqueta"],["gallery_title","Galeria — título"],["gallery_text","Galeria — descrição"]];
const offerFields=[["offer_eyebrow","Ofertas — etiqueta"],["offer_title","Ofertas — título"],["offer_text","Ofertas — texto"]];
const appointmentFields=[["appointment_eyebrow","Atendimento — etiqueta"],["appointment_title","Atendimento — título"],["appointment_text","Atendimento — descrição"]];
const contactFields=[["contact_eyebrow","Contato — etiqueta"],["contact_title","Contato — título"],["address","Endereço"],["hours","Horário"],["whatsapp","WhatsApp"],["phone","Telefone"],["email","E-mail"],["instagram","Instagram"],["map_url","URL do Google Maps","url"]];
const appearanceFields=[["logo_url","URL do logotipo","url"],["hero_image_url","URL da imagem principal","url"],["service_image_url","URL da imagem dos serviços","url"],["primary_color","Cor principal","color"],["cream_color","Cor de fundo","color"],["dark_color","Cor escura","color"],["muted_color","Cor de texto secundário","color"],["footer_tagline","Rodapé — frase"],["footer_copyright","Rodapé — copyright"],["privacy_text","Privacidade / LGPD"],["cookies_text","Cookies"]];

document.addEventListener("DOMContentLoaded",async()=>{
 bindNav(); $("#loginForm").addEventListener("submit",login); $("#logout").addEventListener("click",logout);
 $$(".quick button").forEach(b=>b.onclick=()=>showSection(b.dataset.go));
 $$(".quick a").forEach(a=>a.addEventListener("click",()=>{}));
 const r=await db.auth.getSession(); if(r.data.session) start(r.data.session.user);
});

function showSection(id){if(id==="security"){loadAdminUsers();loadSystemUsers()}$$( ".nav button").forEach(x=>x.classList.toggle("active",x.dataset.section===id));$$( ".section").forEach(x=>x.classList.add("hidden"));$("#"+id)?.classList.remove("hidden");const b=$('.nav button[data-section="'+id+'"]');if(b)$("#sectionTitle").textContent=b.textContent.replace(/^\S+\s/,"").replace(/\s*🔒$/,"");window.scrollTo({top:0,behavior:"smooth"})}
function bindNav(){$$(".nav button").forEach(b=>b.onclick=()=>showSection(b.dataset.section))}
async function login(e){e.preventDefault();setStatus("","");
 const userField=$("#loginUser"),passField=$("#loginPassword");
 const rawUser=(userField?.value||"").trim().toLowerCase(),password=passField?.value||"";
 if(!rawUser)return setStatus("Informe o usuário ou e-mail.","err");
 if(!password)return setStatus("Informe a senha.","err");
 const email=rawUser==="admin"?ADMIN_EMAIL:rawUser;
 setStatus("Entrando...","ok");
 try{
   const {data,error}=await db.auth.signInWithPassword({email,password});
   if(error){setStatus(error.message==="Invalid login credentials"?"Usuário ou senha incorretos.":error.message,"err");return}
   if(!data?.user){setStatus("Não foi possível iniciar a sessão administrativa.","err");return}
   await start(data.user);
 }catch(err){setStatus("Falha ao entrar na Central: "+(err?.message||err),"err")}
}
async function start(user){
 initFormRichEditors();
 const r=await db.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
 if(r.error||!r.data){setStatus("Usuário autenticado, mas não autorizado como administrador.","err");await db.auth.signOut();return}
 $("#loginView").classList.add("hidden");$("#appView").classList.remove("hidden");$("#userEmail").textContent=user.email;$("#securityEmail").textContent=user.email;loadAll()
}
async function logout(){await db.auth.signOut();location.reload()}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function setStatus(m,k){const e=$("#loginStatus");e.textContent=m;e.className=m?"status "+k:""}

function sanitizeRich(value){
  const raw=String(value||"");
  if(!raw)return "";
  const box=document.createElement("div");
  box.innerHTML=raw;
  const allowed=new Set(["B","STRONG","I","EM","U","BR","P","DIV","SPAN","UL","OL","LI","A","H2","H3","BLOCKQUOTE"]);
  box.querySelectorAll("*").forEach(el=>{
    if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);return}
    [...el.attributes].forEach(a=>{
      if(el.tagName==="A" && a.name==="href" && /^(https?:|mailto:)/i.test(a.value))return;
      if(el.tagName==="SPAN" && a.name==="style" && /^\s*(color|background-color)\s*:\s*(#[0-9a-fA-F]{6}|rgb\\([^)]*\\))\s*;?\s*$/i.test(a.value))return;
      el.removeAttribute(a.name);
    });
  });
  return box.innerHTML;
}
function richToolbar(editor){
  const colors=["#2b2721","#9b6a2f","#b24a3a","#315d8c","#47704b","#7b4f8a"];
  return '<div class="rich-toolbar">'+
    '<button type="button" data-cmd="bold" title="Negrito"><b>B</b></button>'+
    '<button type="button" data-cmd="italic" title="Itálico"><i>I</i></button>'+
    '<button type="button" data-cmd="underline" title="Sublinhado"><u>U</u></button>'+
    '<span class="rich-sep"></span>'+
    colors.map(c=>'<button type="button" class="rich-color" data-color="'+c+'" title="Cor do texto" style="--rich-color:'+c+'"></button>').join("")+
    '<span class="rich-sep"></span>'+
    '<button type="button" data-cmd="insertUnorderedList" title="Lista">☷</button>'+
    '<button type="button" data-cmd="insertOrderedList" title="Lista numerada">1.</button>'+
    '<button type="button" data-cmd="justifyLeft" title="Esquerda">≡</button>'+
    '<button type="button" data-cmd="justifyCenter" title="Centralizar">≡</button>'+
    '<button type="button" data-cmd="justifyRight" title="Direita">≡</button>'+
    '<button type="button" data-cmd="removeFormat" title="Limpar formatação">Tx</button>'+
    '</div>';
}
function createRichEditor({value="",name="",id="",label=""}={}){
  const wrap=document.createElement("div");wrap.className="rich-editor";
  wrap.innerHTML=richToolbar(null)+'<div class="rich-content" contenteditable="true" spellcheck="true"></div><input type="hidden" name="'+esc(name)+'" '+(id?'id="'+esc(id)+'"':'')+' value="">';
  const content=wrap.querySelector(".rich-content"), hidden=wrap.querySelector('input[type="hidden"]');
  content.innerHTML=sanitizeRich(value||"").replace(/\n/g,"<br>");
  const sync=()=>{hidden.value=sanitizeRich(content.innerHTML)};
  wrap.querySelectorAll("[data-cmd]").forEach(btn=>btn.addEventListener("mousedown",e=>{e.preventDefault();content.focus();document.execCommand(btn.dataset.cmd,false,null);sync()}));
  wrap.querySelectorAll("[data-color]").forEach(btn=>btn.addEventListener("mousedown",e=>{e.preventDefault();content.focus();document.execCommand("foreColor",false,btn.dataset.color);sync()}));
  content.addEventListener("input",sync);content.addEventListener("blur",sync);sync();
  return wrap;
}
function mountRichField(container, key, label, value){
  const field=document.createElement("div");field.className="field wide";
  const lab=document.createElement("label");lab.textContent=label;field.appendChild(lab);
  field.appendChild(createRichEditor({value,name:key}));
  container.appendChild(field);
}
function renderFields(container,defs,settings){
 container.innerHTML="";
 defs.forEach(([key,label,type])=>{
  const value=settings[key]||"";
  if(type==="color"){
    container.insertAdjacentHTML("beforeend",'<div class="field"><label>'+label+'</label><div class="color-row"><input name="'+key+'" type="color" value="'+esc(/^#[0-9a-fA-F]{6}$/.test(value)?value:"#a97838")+'"><input data-color-text="'+key+'" value="'+esc(value)+'" placeholder="#a97838"></div></div>');
    return;
  }
  const long=label.includes("descrição")||label.includes("texto")||label.includes("título")||label.includes("observação")||label.includes("LGPD")||label.includes("Cookies")||key.endsWith("_text")||key.includes("subtitle")||key.includes("title");
  if(long) mountRichField(container,key,label,value);
  else {
   const imageUrlField=["logo_url","hero_image_url","service_image_url","amorinha_image_url"].includes(key);
   const inputType=imageUrlField?"text":(type||"text");
   container.insertAdjacentHTML("beforeend",'<div class="field"><label>'+label+'</label><input name="'+key+'" type="'+inputType+'" value="'+esc(value)+'"'+(imageUrlField?' placeholder="Opcional — use o botão Anexar para enviar uma imagem"':"")+'></div>');
  }
 });
}
async function getSettings(){const r=await db.from("site_settings").select("key,value");if(r.error)throw r.error;return Object.fromEntries((r.data||[]).map(x=>[x.key,x.value]))}
async function loadAll(){
 try{
  const s=await getSettings();
  renderFields($("#homeFields"),homeFields,s);
  renderFields($("#collectionFields"),collectionFields,s);
  renderFields($("#servicesFields"),servicesFields,s);
  renderFields($("#experienceFields"),experienceFields,s);
  renderFields($("#historyFields"),historyFields,s);
  renderFields($("#galleryFields"),galleryFields,s);
  renderFields($("#offerFields"),offerFields,s);
  renderFields($("#appointmentFields"),appointmentFields,s);
  renderFields($("#contactFields"),contactFields,s);
  renderFields($("#appearanceFields"),appearanceFields,s);
  addUploadControls();
  bindImageEditor();
  bindColorSync();
 }catch(e){console.error(e)}
 await Promise.all([loadStats(),loadList("products"),loadList("services"),loadList("gallery"),loadList("offers"),loadCollectionOptions(),loadCollections()]);
}
function initFormRichEditors(){
 [
  ["sDescription","sDescriptionRich"],
  ["pDescription","pDescriptionRich"],
  ["oDescription","oDescriptionRich"]
 ].forEach(([sourceId,richId])=>{
  const old=$("#"+sourceId); if(!old || $("#"+richId))return;
  const rich=createRichEditor({value:old.value,name:richId,id:richId});
  old.style.display="none"; old.parentNode.insertBefore(rich,old);
 });
}

function bindColorSync(){$("#appearanceFields input[type=color]").forEach(i=>i.oninput=()=>{const t=$('[data-color-text="'+i.name+'"]');if(t)t.value=i.value});$$("#appearanceFields [data-color-text]").forEach(t=>t.oninput=()=>{const i=$('#appearanceFields input[name="'+t.dataset.colorText+'"]');if(/^#[0-9a-fA-F]{6}$/.test(t.value)&&i)i.value=t.value})}
async function saveSettings(form,defs){
 const data={};for(const [k] of defs){const el=form.querySelector('[name="'+k+'"]');if(el)data[k]=el.value}
 const rows=Object.entries(data).map(([key,value])=>({key,value:String(value),updated_at:new Date().toISOString()}));
 const r=await db.from("site_settings").upsert(rows,{onConflict:"key"});if(r.error)throw r.error;alert("Alterações salvas no site.")
}
$("#homeForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,homeFields)}catch(x){alert(x.message)}});
$("#collectionContentForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,collectionFields)}catch(x){alert(x.message)}});
$("#servicesContentForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,servicesFields)}catch(x){alert(x.message)}});
$("#experienceForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,experienceFields)}catch(x){alert(x.message)}});
$("#historyForm")?.addEventListener("submit",async e=>{e.preventDefault();try{
 const file=$("#historyImage")?.files?.[0];
 if(file){
  const edited=await prepareUpload("historyImage");
  const url=await upload(edited);
  const rr=await db.from("site_settings").upsert([{key:"amorinha_image_url",value:url,updated_at:new Date().toISOString()}],{onConflict:"key"});
  if(rr.error)throw rr.error;
  editedImages.delete("historyImage");
  const preview=$("#historyImagePreview");if(preview)preview.src=url;
 }
 await saveSettings(e.target,historyFields);
 alert("Nossa História salva.");
}catch(x){alert(x.message)}});
$("#galleryContentForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,galleryFields)}catch(x){alert(x.message)}});
$("#offerContentForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,offerFields)}catch(x){alert(x.message)}});
$("#appointmentFormCms")?.addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,appointmentFields)}catch(x){alert(x.message)}});
$("#contactForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,contactFields)}catch(x){alert(x.message)}});
$("#appearanceForm")?.addEventListener("submit",async e=>{e.preventDefault();try{
 for(const id of ["logoFile","heroFile","serviceFile"]){
  const file=$("#"+id)?.files?.[0];
  if(file){
   const edited=await prepareUpload(id);
   const url=await upload(edited);
   const key=id==="logoFile"?"logo_url":id==="heroFile"?"hero_image_url":"service_image_url";
   const field=$("#appearanceFields [name='"+key+"']");if(field)field.value=url;
   const row={key,value:url,updated_at:new Date().toISOString()};
   const rr=await db.from("site_settings").upsert([row],{onConflict:"key"});if(rr.error)throw rr.error;
   editedImages.delete(id);
  }
 }
 await saveSettings(e.target,appearanceFields);alert("Aparência salva.")
 }catch(x){alert(x.message)}});
const editedImages=new Map();
const imageTargets={
  gImage:{ratio:16/9,width:1600,height:900,label:"Galeria — 16:9"},
  pImage:{ratio:4/3,width:1600,height:1200,label:"Produto — 4:3"},
  sImage:{ratio:4/3,width:1600,height:1200,label:"Serviço — 4:3"},
  oImage:{ratio:16/9,width:1600,height:900,label:"Oferta — 16:9"},
  logoFile:{ratio:1,width:1200,height:1200,label:"Logotipo — quadrado"},
  heroFile:{ratio:4/5,width:1600,height:2000,label:"Imagem principal — 4:5"},
  serviceFile:{ratio:4/3,width:1600,height:1200,label:"Serviços — 4:3"},
  historyImage:{ratio:4/5,width:1600,height:2000,label:"Nossa História — 4:5"}
};
let editorState=null;

function openImageEditor(file,inputId){
 return new Promise((resolve,reject)=>{
  const target=imageTargets[inputId]||imageTargets.gImage, modal=$("#imageEditor"),stage=$("#imageEditorStage"),img=$("#imageEditorImage"),zoom=$("#imageEditorZoom");
  if(!modal||!stage||!img)return reject(new Error("Editor de imagem indisponível."));
  const url=URL.createObjectURL(file);
  editorState={file,inputId,target,url,image:img,scale:1,x:0,y:0,drag:false,startX:0,startY:0,baseW:0,baseH:0,ratio:target.ratio,width:target.width,height:target.height,resolve,reject};
  stage.style.aspectRatio=String(editorState.ratio);
  $("#imageEditorRatio").value=ratioToOption(editorState.ratio);
  $("#imageEditorTitle").textContent="Ajustar foto — "+target.label;
  $("#imageEditorHint").textContent="A área marcada é exatamente o formato que aparecerá no site. Arraste a foto, ajuste o zoom e clique em Aplicar enquadramento.";
  img.onload=()=>{
    modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");
    requestAnimationFrame(()=>{
      const sw=stage.clientWidth,sh=stage.clientHeight,cover=Math.max(sw/img.naturalWidth,sh/img.naturalHeight);
      if(!sw||!sh||!img.naturalWidth||!img.naturalHeight)return;
      editorState.baseW=img.naturalWidth*cover;editorState.baseH=img.naturalHeight*cover;editorState.scale=1;editorState.x=(sw-editorState.baseW)/2;editorState.y=(sh-editorState.baseH)/2;
      zoom.value="1";applyEditorTransform();
    });
  };
  img.onerror=()=>{URL.revokeObjectURL(url);img.removeAttribute("src");reject(new Error("Não foi possível abrir a imagem no editor."))};
  img.src=url;
 });
}
function applyEditorTransform(){
 const e=editorState;if(!e)return;const img=$("#imageEditorImage");
 img.style.width=e.baseW+"px";img.style.height=e.baseH+"px";img.style.left=e.x+"px";img.style.top=e.y+"px";img.style.transform="scale("+e.scale+")";
}
function closeImageEditor(cancel=true){
 const e=editorState;if(!e)return;$("#imageEditor").classList.add("hidden");$("#imageEditor").setAttribute("aria-hidden","true");if(cancel){editedImages.delete(e.inputId);const input=$("#"+e.inputId);if(input)input.value=""}URL.revokeObjectURL(e.url);const fn=cancel?e.reject:e.resolve;editorState=null;if(cancel)fn(new Error("Edição cancelada."));else fn();
}
function ratioToOption(ratio){const options={"16:9":16/9,"4:3":4/3,"3:2":3/2,"1:1":1,"4:5":4/5,"9:16":9/16};let best="original",delta=Infinity;for(const [key,value] of Object.entries(options)){const d=Math.abs(value-ratio);if(d<delta&&d<0.02){best=key;delta=d}}return best}
function setEditorRatio(value){
 const e=editorState;if(!e)return;
 let ratio;
 if(value==="original")ratio=e.image.naturalWidth/e.image.naturalHeight;
 else{const [w,h]=value.split(":").map(Number);ratio=w/h}
 e.ratio=ratio;e.width=1600;e.height=Math.max(1,Math.round(1600/ratio));
 const stage=$("#imageEditorStage");stage.style.aspectRatio=String(ratio);
 e.scale=1;e.x=0;e.y=0;
 requestAnimationFrame(()=>{
   const sw=stage.clientWidth,sh=stage.clientHeight,cover=Math.max(sw/e.image.naturalWidth,sh/e.image.naturalHeight);
   e.baseW=e.image.naturalWidth*cover;e.baseH=e.image.naturalHeight*cover;e.x=(sw-e.baseW)/2;e.y=(sh-e.baseH)/2;applyEditorTransform();
 });
}
async function applyImageEditor(){
 const e=editorState;if(!e)return;const canvas=document.createElement("canvas");canvas.width=e.width;canvas.height=e.height;const ctx=canvas.getContext("2d"),stage=$("#imageEditorStage"),scaleOut=e.width/stage.clientWidth;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
 const visualX=e.x+((e.baseW*(1-e.scale))/2),visualY=e.y+((e.baseH*(1-e.scale))/2);const sx=visualX*scaleOut,sy=visualY*scaleOut,sw=e.baseW*e.scale*scaleOut,sh=e.baseH*e.scale*scaleOut;
 ctx.drawImage(e.image,sx,sy,sw,sh);
 const blob=await new Promise(res=>canvas.toBlob(res,"image/jpeg",.94));
 if(!blob)throw new Error("Não foi possível preparar a imagem.");
 const safe=(e.file.name.replace(/\.[^.]+$/,"")||"imagem")+"-editada.jpg";
 const edited=new File([blob],safe,{type:"image/jpeg",lastModified:Date.now()});
 editedImages.set(e.inputId,edited);
 const input=$("#"+e.inputId);if(input){const dt=new DataTransfer();dt.items.add(edited);input.files=dt.files}
 const resolve=e.resolve;closeImageEditor(false);resolve(edited);
}
function bindImageEditor(){
 Object.keys(imageTargets).forEach(id=>{
  const input=$("#"+id);if(!input||input.dataset.editorBound)return;
  input.dataset.editorBound="1";
  input.addEventListener("change",async()=>{
   const file=input.files?.[0];if(!file)return;
   try{await openImageEditor(file,id)}catch(err){if(err.message!=="Edição cancelada.")alert(err.message)}
  });
 });
 $("#imageEditorClose")?.addEventListener("click",()=>closeImageEditor(true));
 $("#imageEditorCancel")?.addEventListener("click",()=>closeImageEditor(true));
 $("#imageEditorApply")?.addEventListener("click",()=>applyImageEditor().catch(err=>alert(err.message)));
 $("#imageEditorRatio")?.addEventListener("change",e=>setEditorRatio(e.target.value));
 $("#imageEditorReset")?.addEventListener("click",()=>{if(!editorState)return;const e=editorState,stage=$("#imageEditorStage");e.scale=1;e.x=(stage.clientWidth-e.baseW)/2;e.y=(stage.clientHeight-e.baseH)/2;$("#imageEditorZoom").value="1";applyEditorTransform()});
 $("#imageEditorZoom")?.addEventListener("input",e=>{if(editorState){editorState.scale=Number(e.target.value);applyEditorTransform()}});
 const stage=$("#imageEditorStage");
 stage?.addEventListener("pointerdown",e=>{if(!editorState)return;editorState.drag=true;editorState.startX=e.clientX-editorState.x;editorState.startY=e.clientY-editorState.y;stage.classList.add("dragging");stage.setPointerCapture(e.pointerId)});
 stage?.addEventListener("pointermove",e=>{if(!editorState?.drag)return;editorState.x=e.clientX-editorState.startX;editorState.y=e.clientY-editorState.startY;applyEditorTransform()});
 stage?.addEventListener("pointerup",()=>{if(editorState){editorState.drag=false;stage.classList.remove("dragging")}});
 stage?.addEventListener("pointercancel",()=>{if(editorState){editorState.drag=false;stage.classList.remove("dragging")}});
}
async function prepareUpload(inputId){
 const f=$("#"+inputId)?.files?.[0];if(!f)throw new Error("Selecione uma imagem.");
 if(editedImages.has(inputId))return editedImages.get(inputId);
 return f;
}

async function upload(file){const ext=(file.name.split(".").pop()||"jpg").toLowerCase();const path=Date.now()+"-"+crypto.randomUUID()+"."+ext;const r=await db.storage.from("site-assets").upload(path,file,{upsert:false});if(r.error)throw r.error;return db.storage.from("site-assets").getPublicUrl(path).data.publicUrl}
function addUploadControls(){
 const box=$("#appearanceFields");if(!box||box.dataset.uploadControlsBound)return;
 const maps=[
  ["logo_url","logoFile","Anexar logotipo"],
  ["hero_image_url","heroFile","Anexar imagem principal"],
  ["service_image_url","serviceFile","Anexar imagem dos serviços"]
 ];
 maps.forEach(([key,id,label])=>{
  const urlInput=box.querySelector('[name="'+key+'"]');if(!urlInput)return;
  const field=urlInput.closest(".field");if(!field)return;
  const control=document.createElement("div");control.className="appearance-image-control";
  control.innerHTML='<button type="button" class="btn secondary appearance-upload-btn">'+esc(label)+'</button><input id="'+id+'" type="file" accept="image/*" hidden><span class="appearance-upload-note">A imagem será aberta no editor antes de ser publicada.</span>';
  field.appendChild(control);
  const file=control.querySelector("#"+id);
  control.querySelector("button").addEventListener("click",()=>file.click());
 });
 box.dataset.uploadControlsBound="1";
}
async function loadStats(){const ts=["products","services","gallery","offers"];const nums=await Promise.all(ts.map(async t=>(await db.from(t).select("*",{count:"exact",head:true})).count||0));$("#stats").innerHTML=ts.map((t,i)=>'<div><strong>'+nums[i]+'</strong><span>'+({products:"Produtos",services:"Serviços",gallery:"Fotos",offers:"Ofertas"}[t])+'</span></div>').join("")}
async function getCollections(){
 const r=await db.from("collections").select("id,name,slug,active,sort_order").order("sort_order").order("created_at");
 if(r.error)throw r.error;
 return (r.data||[]).filter(x=>x.active!==false);
}
async function loadCollectionOptions(){
 const select=$("#pCategory");if(!select)return;
 try{
  const collections=await getCollections(),current=select.value;
  select.innerHTML=collections.map(x=>'<option value="'+esc(x.slug)+'">'+esc(x.name)+'</option>').join("");
  if(collections.some(x=>x.slug===current))select.value=current;
 }catch(e){console.error(e)}
}
async function createCollection(){
 const name=prompt("Nome da nova coleção:");
 if(name===null)return;
 const clean=name.trim();
 if(!clean)return alert("Informe o nome da coleção.");
 const slug=clean.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
 if(!slug)return alert("Não foi possível gerar um identificador para esta coleção.");
 try{
  const existing=await getCollections();
  if(existing.some(x=>x.slug===slug||x.name.trim().toLowerCase()===clean.toLowerCase()))return alert("Essa coleção já existe.");
  const nextOrder=existing.reduce((m,x)=>Math.max(m,Number(x.sort_order)||0),0)+10;
  const r=await db.from("collections").insert({name:clean,slug,sort_order:nextOrder}).select("id,name,slug").single();
  if(r.error)throw r.error;
  await loadCollectionOptions();
  $("#pCategory").value=slug;
  await loadCollections();
  alert("Coleção criada com sucesso.");
 }catch(e){alert(e.message||"Não foi possível criar a coleção.")}
}
async function loadCollections(){
 const el=$("#collectionsTable");if(!el)return;
 try{
  const collections=await getCollections();
  const r=await db.from("products").select("id,name,category,image_url,active").order("sort_order").order("created_at",{ascending:false});
  if(r.error)throw r.error;
  const products=(r.data||[]).filter(x=>x.active!==false);
  el.innerHTML=collections.map(col=>{
   const items=products.filter(x=>(x.category||"outros")===col.slug);
   return '<article class="collection-admin-card"><div class="collection-admin-head"><div><span class="eyebrow">'+esc(col.name)+'</span><h3>'+items.length+' modelo'+(items.length===1?"":"s")+'</h3></div><button class="btn small" onclick="showSection(&quot;collection&quot;)">Adicionar modelo</button></div><div class="collection-admin-thumbs">'+(items.length?items.slice(0,8).map(x=>x.image_url?'<img src="'+esc(x.image_url)+'" alt="'+esc(x.name||col.name)+'">':'<div class="collection-thumb-empty">MB</div>').join(""):'<div class="empty">Nenhum modelo cadastrado nesta coleção.</div>')+'</div></article>';
  }).join("");
 }catch(e){el.innerHTML='<div class="empty">'+esc(e.message||"Não foi possível carregar as coleções.")+'</div>'}
}
async function loadList(table){
 const r=await db.from(table).select("*").order("sort_order").order("created_at",{ascending:false});const el=$("#"+table+"Table");
 if(r.error){el.innerHTML='<div class="empty">'+esc(r.error.message)+'</div>';return}
 const rows=r.data||[];if(!rows.length){el.innerHTML='<div class="empty">Nenhum registro cadastrado ainda.</div>';return}
 el.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Foto</th><th>Informação</th><th>Status</th><th>Ações</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+(x.image_url?'<img class="thumb" src="'+esc(x.image_url)+'">':"—")+'</td><td><strong>'+esc(x.name||x.title||"")+'</strong><br><small>'+esc(x.description||x.price_text||x.category||"")+'</small></td><td><button class="pill '+(x.active===false?"off":"on")+'" onclick="toggleActive(\''+table+'\',\''+x.id+'\','+(x.active===false?'true':'false')+')">'+(x.active===false?"Oculto":"Publicado")+'</button></td><td><button class="btn small" onclick="editRow(\''+table+'\',\''+x.id+'\')">Editar</button> '+(x.image_url?'<button class="btn small" onclick="editExistingImage(\''+table+'\',\''+x.id+'\')">Editar foto</button> <button class="btn small" onclick="replaceImage(\''+table+'\',\''+x.id+'\')">Trocar foto</button>':"")+' <button class="btn danger small" onclick="removeRow(\''+table+'\',\''+x.id+'\')">Excluir</button></td></tr>').join("")+
 "</tbody></table></div>"
}
async function toggleActive(table,id,value){const r=await db.from(table).update({active:value,updated_at:new Date().toISOString()}).eq("id",id);if(r.error){alert(r.error.message);return}loadList(table)}
async function editExistingImage(table,id){
 const r=await db.from(table).select("image_url").eq("id",id).single();
 if(r.error)return alert(r.error.message);
 if(!r.data?.image_url)return alert("Este registro não possui foto.");
 try{
  const response=await fetch(r.data.image_url,{cache:"no-store"});
  if(!response.ok)throw new Error("Não foi possível carregar a foto atual.");
  const blob=await response.blob();
  const ext=(blob.type||"image/jpeg").split("/")[1]||"jpeg";
  const file=new File([blob],"foto-atual."+ext,{type:blob.type||"image/jpeg"});
  const inputId=table==="gallery"?"gImage":table==="products"?"pImage":table==="services"?"sImage":"oImage";
  await openImageEditor(file,inputId);
  const edited=editedImages.get(inputId);
  if(!edited)return;
  const url=await upload(edited);
  const u=await db.from(table).update({image_url:url,updated_at:new Date().toISOString()}).eq("id",id);
  if(u.error)throw u.error;
  editedImages.delete(inputId);
  await loadList(table);
  alert("Foto editada e atualizada no site.");
 }catch(e){
  if(e.message!=="Edição cancelada.")alert(e.message||"Não foi possível editar a foto.");
 }
}
async function replaceImage(table,id){
 const input=document.createElement("input");
 const inputId=table==="gallery"?"gImage":table==="products"?"pImage":table==="services"?"sImage":"oImage";
 input.type="file";input.accept="image/png,image/jpeg,image/webp";
 input.onchange=async()=>{
  const file=input.files?.[0];if(!file)return;
  if(file.size>5000000){alert("A imagem deve ter no máximo 5 MB.");return}
  try{
   await openImageEditor(file,inputId);
   const edited=editedImages.get(inputId);if(!edited)return;
   const url=await upload(edited);
   const r=await db.from(table).update({image_url:url,updated_at:new Date().toISOString()}).eq("id",id);
   if(r.error)throw r.error;
   editedImages.delete(inputId);
   await loadList(table);
   alert("Foto atualizada após o editor.");
  }catch(e){if(e.message!=="Edição cancelada.")alert(e.message||"Não foi possível trocar a foto.")}
 };
 input.click();
}
function openRichPrompt(title,value){
 return new Promise(resolve=>{
  const overlay=document.createElement("div");overlay.className="rich-modal";
  overlay.innerHTML='<div class="rich-modal-box"><div class="rich-modal-head"><h3>'+esc(title)+'</h3><button type="button" class="image-editor-close" data-cancel>×</button></div><div data-editor></div><div class="actions"><button type="button" class="btn" data-cancel>Cancelar</button><button type="button" class="btn primary" data-ok>Salvar</button></div></div>';
  document.body.appendChild(overlay);
  const editor=createRichEditor({value});overlay.querySelector("[data-editor]").appendChild(editor);
  const close=()=>{overlay.remove();resolve(null)};
  overlay.querySelectorAll("[data-cancel]").forEach(b=>b.onclick=close);
  overlay.querySelector("[data-ok]").onclick=()=>{const v=editor.querySelector('input[type="hidden"]').value;overlay.remove();resolve(v)};
 });
}
async function editRow(table,id){
 const r=await db.from(table).select("*").eq("id",id).single();if(r.error)return alert(r.error.message);const x=r.data;
 if(table==="products"){const name=prompt("Nome:",x.name);if(name===null)return;const desc=await openRichPrompt("Editar descrição do produto",x.description||"");if(desc===null)return;const cat=prompt("Categoria:",x.category||"outros");const price=prompt("Preço:",x.price??"");const u=await db.from(table).update({name,description:desc,category:cat,price:price||null,updated_at:new Date().toISOString()}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="services"){const name=prompt("Nome:",x.name);if(name===null)return;const desc=await openRichPrompt("Editar descrição do serviço",x.description||"");if(desc===null)return;const u=await db.from(table).update({name,description:desc,updated_at:new Date().toISOString()}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="gallery"){const title=prompt("Título:",x.title||"");if(title===null)return;const alt=prompt("Texto alternativo:",x.alt_text||"");const u=await db.from(table).update({title,alt_text:alt}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="offers"){const title=prompt("Título:",x.title);if(title===null)return;const desc=await openRichPrompt("Editar descrição da oferta",x.description||"");if(desc===null)return;const price=prompt("Texto do preço:",x.price_text||"");const u=await db.from(table).update({title,description:desc,price_text:price}).eq("id",id);if(u.error)alert(u.error.message)}
 loadList(table);if(table==="products")loadCollections()
}
async function removeRow(table,id){if(!confirm("Excluir este registro?"))return;const r=await db.from(table).delete().eq("id",id);if(r.error){alert(r.error.message);return}await loadList(table);await loadStats();if(table==="products")await loadCollections()}

$("#createCollectionBtn")?.addEventListener("click",createCollection);
$("#productForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload(await prepareUpload("pImage"));const description=$("#pDescriptionRich")?.value||$("#pDescription").value;const r=await db.from("products").insert({name:$("#pName").value,category:$("#pCategory").value,price:$("#pPrice").value||null,description,image_url:image});if(r.error)throw r.error;editedImages.delete("pImage");e.target.reset();await loadList("products");await loadStats();alert("Produto adicionado.")}catch(x){alert(x.message)}});
$("#serviceForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload(await prepareUpload("sImage"));const description=$("#sDescriptionRich")?.value||$("#sDescription").value;const r=await db.from("services").insert({name:$("#sName").value,description,image_url:image});if(r.error)throw r.error;editedImages.delete("sImage");e.target.reset();await loadList("services");await loadStats();alert("Serviço adicionado.")}catch(x){alert(x.message)}});
$("#galleryForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload(await prepareUpload("gImage"));const r=await db.from("gallery").insert({title:$("#gTitle").value,alt_text:$("#gAlt").value,image_url:image});if(r.error)throw r.error;editedImages.delete("gImage");e.target.reset();await loadList("gallery");await loadStats();alert("Foto adicionada.")}catch(x){alert(x.message)}});
$("#offerForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload(await prepareUpload("oImage"));const description=$("#oDescriptionRich")?.value||$("#oDescription").value;const r=await db.from("offers").insert({title:$("#oTitle").value,price_text:$("#oPrice").value,description,image_url:image,starts_at:$("#oStart").value||null,ends_at:$("#oEnd").value||null});if(r.error)throw r.error;editedImages.delete("oImage");e.target.reset();await loadList("offers");await loadStats();alert("Oferta adicionada.")}catch(x){alert(x.message)}});

$("#passwordForm").addEventListener("submit",async e=>{e.preventDefault();const old=$("#currentPassword").value,newP=$("#newPassword").value,confirmP=$("#confirmPassword").value;
 if(newP.length<8)return securityMsg("A nova senha precisa ter pelo menos 8 caracteres.","err");if(newP!==confirmP)return securityMsg("A confirmação não confere.","err");
 const r=await db.auth.updateUser({password:newP,current_password:old});if(r.error){securityMsg(r.error.message,"err");return}e.target.reset();securityMsg("Senha alterada com sucesso.","ok")
});
$("#resetPassword").addEventListener("click",async()=>{const email=$("#securityEmail").textContent;const r=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});$("#resetStatus").textContent=r.error?r.error.message:"Link de recuperação enviado.";$("#resetStatus").className="status "+(r.error?"err":"ok")});
function securityMsg(m,k){$("#securityStatus").textContent=m;$("#securityStatus").className="status "+k}
// Os controles de imagem são montados dentro de loadAll(), depois que os campos da Aparência existem.

$( "#createAdminForm")?.addEventListener("submit",async e=>{e.preventDefault();
 const f=e.target, email=$("#newAdminEmail")?.value.trim().toLowerCase()||"", secret=$("#newAdminPassword")?.value||"", confirm=$("#newAdminPasswordConfirm")?.value||"", status=$("#createUserStatus");
 const msg=(m,k)=>{status.textContent=m;status.className="status "+k};
 if(!email)return msg("Informe o e-mail.","err");
 if(secret.length<8)return msg("A senha precisa ter pelo menos 8 caracteres.","err");
 if(secret!==confirm)return msg("A confirmação da senha não confere.","err");
 msg("Criando usuário...","ok");
 try{const s=await db.auth.getSession(),token=s.data.session?.access_token;if(!token)return msg("Sessão administrativa expirada. Entre novamente.","err");
  const r=await fetch(window.MB_SUPABASE.url+"/functions/v1/manage-admin-users",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({action:"create",email,password:secret})});
  const data=await r.json().catch(()=>({}));if(!r.ok)return msg(data.error||"Não foi possível criar o usuário.","err");f.reset();msg("Usuário administrativo criado com sucesso.","ok");
 }catch(err){msg("Falha de conexão: "+(err?.message||err),"err")}
});

async function adminApi(body){
 const s=await db.auth.getSession(),token=s.data.session?.access_token;
 if(!token)throw new Error("Sessão administrativa expirada. Entre novamente.");
 const r=await fetch(window.MB_SUPABASE.url+"/functions/v1/manage-admin-users",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||"Operação administrativa não autorizada.");return data;
}
let adminUsersCache=[];
async function loadAdminUsers(){
 const box=$("#adminUsersTable"),status=$("#adminUsersStatus");if(!box)return;
 try{status.textContent="";box.innerHTML='<div class="empty">Carregando usuários...</div>';
  const data=await adminApi({action:"list"});const users=data.users||[];adminUsersCache=users;
  if(!users.length){box.innerHTML='<div class="empty">Nenhum usuário administrativo cadastrado.</div>';return}
  box.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>E-mail</th><th>Criado em</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>'+
  users.map(u=>'<tr><td><strong>'+esc(u.email||"")+'</strong></td><td>'+fmtDate(u.created_at)+'</td><td>'+fmtDate(u.last_sign_in_at)+'</td><td><button class="btn small" onclick="editAdminUser(\''+u.id+'\')">Editar</button> <button class="btn danger small" onclick="deleteAdminUser(\''+u.id+'\',\''+esc(u.email||"")+'\')">Excluir</button></td></tr>').join("")+
  '</tbody></table></div>';
 }catch(e){box.innerHTML='<div class="empty">'+esc(e.message)+'</div>';status.textContent="Acesso administrativo obrigatório.";status.className="status err";}
}
function fmtDate(v){if(!v)return "—";try{return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(v))}catch(_){return "—"}}
async function editAdminUser(id){
 const user=adminUsersCache.find(x=>x.id===id);if(!user)return;const newEmail=prompt("E-mail do usuário:",user.email);if(newEmail===null)return;
 const newPassword=prompt("Nova senha (deixe em branco para manter):","");
 if(newPassword===null)return;
 try{await adminApi({action:"update",id,email:newEmail,password:newPassword});alert("Usuário atualizado com sucesso.");await loadAdminUsers()}catch(e){alert(e.message)}
}
async function deleteAdminUser(id,email){
 if(!confirm("Excluir o usuário administrativo "+email+"?"))return;
 try{await adminApi({action:"delete",id});alert("Usuário excluído.");await loadAdminUsers()}catch(e){alert(e.message)}
}

async function systemUserApi(body){const s=await db.auth.getSession(),token=s.data.session?.access_token;if(!token)throw new Error("Sessão expirada.");const r=await fetch(window.MB_SUPABASE.url+"/functions/v1/manage-system-users",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Operação não autorizada.");return d}
let systemUsersCache=[];
async function loadSystemUsers(){const box=$("#systemUsersTable");if(!box)return;try{const d=await systemUserApi({action:"list"});systemUsersCache=d.users||[];if(!systemUsersCache.length){box.innerHTML='<div class="empty">Nenhum usuário não administrador cadastrado.</div>';return}box.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Status</th><th>Criado em</th><th>Ações</th></tr></thead><tbody>'+systemUsersCache.map(u=>'<tr><td><strong>'+esc(u.name||"")+'</strong></td><td>'+esc(u.email||"")+'</td><td>'+(u.active?"Ativo":"Inativo")+'</td><td>'+fmtDate(u.created_at)+'</td><td><button class="btn small" onclick="editSystemUser(\''+u.user_id+'\')">Editar</button> <button class="btn danger small" onclick="deleteSystemUser(\''+u.user_id+'\')">Excluir</button></td></tr>').join("")+'</tbody></table></div>'}catch(err){box.innerHTML='<div class="empty">'+esc(err.message)+'</div>'}}
async function editSystemUser(id){const u=systemUsersCache.find(x=>x.user_id===id);if(!u)return;const name=prompt("Nome:",u.name||"");if(name===null)return;const email=prompt("E-mail:",u.email||"");if(email===null)return;const password=prompt("Nova senha (deixe em branco para manter):","");if(password===null)return;try{await systemUserApi({action:"update",id,name,email,password});alert("Usuário atualizado.");loadSystemUsers()}catch(e){alert(e.message)}}
async function deleteSystemUser(id){const u=systemUsersCache.find(x=>x.user_id===id);if(!u)return;if(!confirm("Excluir o usuário "+u.email+"?"))return;try{await systemUserApi({action:"delete",id});alert("Usuário excluído.");loadSystemUsers()}catch(e){alert(e.message)}}
$("#createSystemUserForm")?.addEventListener("submit",async e=>{e.preventDefault();const name=$("#systemUserName").value.trim(),email=$("#systemUserEmail").value.trim().toLowerCase(),password=$("#systemUserPassword").value,status=$("#systemUserStatus");if(!name)return statusMsg(status,"Informe o nome.","err");if(!email)return statusMsg(status,"Informe o e-mail.","err");if(password.length<8)return statusMsg(status,"A senha precisa ter pelo menos 8 caracteres.","err");statusMsg(status,"Cadastrando...","ok");try{await systemUserApi({action:"create",name,email,password});e.target.reset();statusMsg(status,"Usuário não administrador criado com sucesso.","ok");loadSystemUsers()}catch(err){statusMsg(status,err.message,"err")}})
function statusMsg(el,msg,kind){el.textContent=msg;el.className="status "+kind}
