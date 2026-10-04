window.__MB_ADMIN_LOADED=true;
const db=supabase.createClient(window.MB_SUPABASE.url,window.MB_SUPABASE.key);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ADMIN_EMAIL="becker.optica@gmail.com";

const contentFields=[
["topbar_text","Faixa superior"],["store_name","Nome da ótica"],["hero_eyebrow","Hero — etiqueta"],["hero_title","Hero — título"],["hero_subtitle","Hero — subtítulo"],["hero_note","Hero — observação"],
["trust_1_title","Confiança 1 — título"],["trust_1_text","Confiança 1 — texto"],["trust_2_title","Confiança 2 — título"],["trust_2_text","Confiança 2 — texto"],["trust_3_title","Confiança 3 — título"],["trust_3_text","Confiança 3 — texto"],["trust_4_title","Confiança 4 — título"],["trust_4_text","Confiança 4 — texto"],
["collection_eyebrow","Coleção — etiqueta"],["collection_title","Coleção — título"],["collection_text","Coleção — descrição"],["catalog_note","Coleção — observação"],
["services_eyebrow","Serviços — etiqueta"],["services_title","Serviços — título"],["services_text","Serviços — descrição"],
["experience_eyebrow","Experiência — etiqueta"],["experience_title","Experiência — título"],["experience_text","Experiência — descrição"],
["gallery_eyebrow","Galeria — etiqueta"],["gallery_title","Galeria — título"],["gallery_text","Galeria — descrição"],
["offer_eyebrow","Ofertas — etiqueta"],["offer_title","Ofertas — título"],["offer_text","Ofertas — texto"],
["appointment_eyebrow","Atendimento — etiqueta"],["appointment_title","Atendimento — título"],["appointment_text","Atendimento — descrição"],
["contact_eyebrow","Contato — etiqueta"],["contact_title","Contato — título"],["address","Endereço"],["hours","Horário"],["whatsapp","WhatsApp"],["phone","Telefone"],["email","E-mail"],["instagram","Instagram"],
["footer_tagline","Rodapé — frase"],["footer_copyright","Rodapé — copyright"],["privacy_text","Privacidade / LGPD"],["cookies_text","Cookies"]
];
const appearanceFields=[
["logo_url","URL do logotipo","url"],["hero_image_url","URL da imagem principal","url"],["amorinha_image_url","URL da foto da Amorinha","url"],["map_url","URL do Google Maps","url"],
["primary_color","Cor principal","color"],["cream_color","Cor de fundo","color"],["dark_color","Cor escura","color"],["muted_color","Cor de texto secundário","color"]
];

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
 const login=rawUser==="admin"?ADMIN_EMAIL:rawUser;
 setStatus("Entrando...","ok");
 try{
   const url=window.MB_SUPABASE.url,key=window.MB_SUPABASE.key;
   const response=await fetch(url+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"apikey":key,"Content-Type":"application/json"},body:JSON.stringify({email:login,password})});
   let data={};try{data=await response.json()}catch(_){data={}};
   if(!response.ok){const msg=data.error_description||data.msg||data.message||("Falha de autenticação ("+response.status+").");setStatus(msg,"err");return}
   const session=await db.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
   if(session.error){setStatus("Sessão recebida, mas não pôde ser criada: "+session.error.message,"err");return}
   await start(session.data.user)
 }catch(err){setStatus("Falha de conexão com o Supabase: "+(err?.message||err),"err")}
}
async function start(user){
 const r=await db.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
 if(r.error||!r.data){setStatus("Usuário autenticado, mas não autorizado como administrador.","err");await db.auth.signOut();return}
 $("#loginView").classList.add("hidden");$("#appView").classList.remove("hidden");$("#userEmail").textContent=user.email;$("#securityEmail").textContent=user.email;loadAll()
}
async function logout(){await db.auth.signOut();location.reload()}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function setStatus(m,k){const e=$("#loginStatus");e.textContent=m;e.className=m?"status "+k:""}

function renderFields(container,defs,settings){
 container.innerHTML=defs.map(([key,label,type])=>{
  const value=settings[key]||"";
  if(type==="color")return '<div class="field"><label>'+label+'</label><div class="color-row"><input name="'+key+'" type="color" value="'+esc(/^#[0-9a-fA-F]{6}$/.test(value)?value:"#a97838")+'"><input data-color-text="'+key+'" value="'+esc(value)+'" placeholder="#a97838"></div></div>';
  const long=label.includes("descrição")||label.includes("texto")||label.includes("título")||label.includes("observação")||label.includes("LGPD")||label.includes("Cookies")||key.endsWith("_text")||key.includes("subtitle")||key.includes("title");
  return '<div class="field '+(long?"wide":"")+'"><label>'+label+'</label>'+(long?'<textarea name="'+key+'">'+esc(value)+'</textarea>':'<input name="'+key+'" type="'+(type||"text")+'" value="'+esc(value)+'">')+'</div>'
 }).join("");
}
async function getSettings(){const r=await db.from("site_settings").select("key,value");if(r.error)throw r.error;return Object.fromEntries((r.data||[]).map(x=>[x.key,x.value]))}
async function loadAll(){
 try{const s=await getSettings();renderFields($("#contentFields"),contentFields,s);renderFields($("#appearanceFields"),appearanceFields,s);bindColorSync();}catch(e){console.error(e)}
 await Promise.all([loadStats(),loadList("products"),loadList("services"),loadList("gallery"),loadList("offers")]);
}
function bindColorSync(){$$("#appearanceFields input[type=color]").forEach(i=>i.oninput=()=>{const t=$('[data-color-text="'+i.name+'"]');if(t)t.value=i.value});$$("#appearanceFields [data-color-text]").forEach(t=>t.oninput=()=>{const i=$('#appearanceFields input[name="'+t.dataset.colorText+'"]');if(/^#[0-9a-fA-F]{6}$/.test(t.value)&&i)i.value=t.value})}
async function saveSettings(form,defs){
 const data={};for(const [k] of defs){const el=form.querySelector('[name="'+k+'"]');if(el)data[k]=el.value}
 const rows=Object.entries(data).map(([key,value])=>({key,value:String(value),updated_at:new Date().toISOString()}));
 const r=await db.from("site_settings").upsert(rows,{onConflict:"key"});if(r.error)throw r.error;alert("Alterações salvas no site.")
}
$("#contentForm").addEventListener("submit",async e=>{e.preventDefault();try{await saveSettings(e.target,contentFields)}catch(x){alert(x.message)}});
$("#appearanceForm").addEventListener("submit",async e=>{e.preventDefault();try{
 for(const id of ["logoFile","heroFile","amorinhaFile"]){const f=$("#"+id)?.files?.[0];if(f){const url=await upload(f);const key=id==="logoFile"?"logo_url":id==="heroFile"?"hero_image_url":"amorinha_image_url";const field=$("#appearanceFields [name='"+key+"']");if(field)field.value=url;const row={key,value:url,updated_at:new Date().toISOString()};const rr=await db.from("site_settings").upsert([row],{onConflict:"key"});if(rr.error)throw rr.error}}
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
  amorinhaFile:{ratio:4/5,width:1600,height:2000,label:"Amorinha — 4:5"}
};
let editorState=null;

function openImageEditor(file,inputId){
 return new Promise((resolve,reject)=>{
  const target=imageTargets[inputId]||imageTargets.gImage, modal=$("#imageEditor"),stage=$("#imageEditorStage"),img=$("#imageEditorImage"),zoom=$("#imageEditorZoom");
  if(!modal||!stage||!img)return reject(new Error("Editor de imagem indisponível."));
  const url=URL.createObjectURL(file); const image=new Image();
  editorState={file,inputId,target,url,image,scale:1,x:0,y:0,drag:false,startX:0,startY:0,baseW:0,baseH:0,resolve,reject};
  stage.style.aspectRatio=String(target.ratio);
  $("#imageEditorTitle").textContent="Ajustar foto — "+target.label;
  $("#imageEditorHint").textContent="A área marcada é exatamente o formato que aparecerá no site. Arraste a foto, ajuste o zoom e clique em Aplicar enquadramento.";
  image.onload=()=>{
    const sw=stage.clientWidth,sh=stage.clientHeight,cover=Math.max(sw/image.naturalWidth,sh/image.naturalHeight);
    editorState.baseW=image.naturalWidth*cover;editorState.baseH=image.naturalHeight*cover;editorState.scale=1;editorState.x=(sw-editorState.baseW)/2;editorState.y=(sh-editorState.baseH)/2;
    img.src=url;zoom.value="1";applyEditorTransform();modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");
  };
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Não foi possível abrir a imagem."))};
  image.src=url;
 });
}
function applyEditorTransform(){
 const e=editorState;if(!e)return;const img=$("#imageEditorImage");
 img.style.width=e.baseW+"px";img.style.height=e.baseH+"px";img.style.left=e.x+"px";img.style.top=e.y+"px";img.style.transform="scale("+e.scale+")";
}
function closeImageEditor(cancel=true){
 const e=editorState;if(!e)return;$("#imageEditor").classList.add("hidden");$("#imageEditor").setAttribute("aria-hidden","true");if(cancel){editedImages.delete(e.inputId);const input=$("#"+e.inputId);if(input)input.value=""}URL.revokeObjectURL(e.url);const fn=cancel?e.reject:e.resolve;editorState=null;if(cancel)fn(new Error("Edição cancelada."));else fn();
}
async function applyImageEditor(){
 const e=editorState;if(!e)return;const target=e.target,canvas=document.createElement("canvas");canvas.width=target.width;canvas.height=target.height;const ctx=canvas.getContext("2d"),stage=$("#imageEditorStage"),scaleOut=target.width/stage.clientWidth;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
 const sx=e.x*scaleOut,sy=e.y*scaleOut,sw=e.baseW*e.scale*scaleOut,sh=e.baseH*e.scale*scaleOut;
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
function addUploadControls(){const box=$("#appearanceFields");box.insertAdjacentHTML("beforeend",'<div class="field"><label>Enviar logotipo</label><input id="logoFile" type="file" accept="image/*"></div><div class="field"><label>Enviar imagem principal</label><input id="heroFile" type="file" accept="image/*"></div><div class="field"><label>Enviar foto da Amorinha</label><input id="amorinhaFile" type="file" accept="image/*"></div>')}
async function loadStats(){const ts=["products","services","gallery","offers"];const nums=await Promise.all(ts.map(async t=>(await db.from(t).select("*",{count:"exact",head:true})).count||0));$("#stats").innerHTML=ts.map((t,i)=>'<div><strong>'+nums[i]+'</strong><span>'+({products:"Produtos",services:"Serviços",gallery:"Fotos",offers:"Ofertas"}[t])+'</span></div>').join("")}
async function loadList(table){
 const r=await db.from(table).select("*").order("sort_order").order("created_at",{ascending:false});const el=$("#"+table+"Table");
 if(r.error){el.innerHTML='<div class="empty">'+esc(r.error.message)+'</div>';return}
 const rows=r.data||[];if(!rows.length){el.innerHTML='<div class="empty">Nenhum registro cadastrado ainda.</div>';return}
 el.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Foto</th><th>Informação</th><th>Status</th><th>Ações</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+(x.image_url?'<img class="thumb" src="'+esc(x.image_url)+'">':"—")+'</td><td><strong>'+esc(x.name||x.title||"")+'</strong><br><small>'+esc(x.description||x.price_text||x.category||"")+'</small></td><td><button class="pill '+(x.active===false?"off":"on")+'" onclick="toggleActive(\''+table+'\',\''+x.id+'\','+(x.active===false?'true':'false')+')">'+(x.active===false?"Oculto":"Publicado")+'</button></td><td><button class="btn small" onclick="editRow(\''+table+'\',\''+x.id+'\')">Editar</button> '+(x.image_url?'<button class="btn small" onclick="replaceImage(\''+table+'\',\''+x.id+'\')">Trocar foto</button>':"")+' <button class="btn danger small" onclick="removeRow(\''+table+'\',\''+x.id+'\')">Excluir</button></td></tr>').join("")+
 "</tbody></table></div>"
}
async function toggleActive(table,id,value){const r=await db.from(table).update({active:value,updated_at:new Date().toISOString()}).eq("id",id);if(r.error){alert(r.error.message);return}loadList(table)}
async function replaceImage(table,id){
 const input=document.createElement("input");
 input.type="file";input.accept="image/png,image/jpeg,image/webp";
 input.onchange=async()=>{
  const file=input.files?.[0];if(!file)return;
  if(file.size>5000000){alert("A imagem deve ter no máximo 5 MB.");return}
  try{
   const url=await upload(file);
   const r=await db.from(table).update({image_url:url,updated_at:new Date().toISOString()}).eq("id",id);
   if(r.error)throw r.error;
   await loadList(table);
   alert("Foto atualizada no site.");
  }catch(e){alert(e.message||"Não foi possível trocar a foto.")}
 };
 input.click();
}
async function editRow(table,id){
 const r=await db.from(table).select("*").eq("id",id).single();if(r.error)return alert(r.error.message);const x=r.data;
 if(table==="products"){const name=prompt("Nome:",x.name);if(name===null)return;const desc=prompt("Descrição:",x.description||"");const cat=prompt("Categoria:",x.category||"outros");const price=prompt("Preço:",x.price??"");const u=await db.from(table).update({name,description:desc,category:cat,price:price||null,updated_at:new Date().toISOString()}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="services"){const name=prompt("Nome:",x.name);if(name===null)return;const desc=prompt("Descrição:",x.description||"");const u=await db.from(table).update({name,description:desc,updated_at:new Date().toISOString()}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="gallery"){const title=prompt("Título:",x.title||"");if(title===null)return;const alt=prompt("Texto alternativo:",x.alt_text||"");const u=await db.from(table).update({title,alt_text:alt}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="offers"){const title=prompt("Título:",x.title);if(title===null)return;const desc=prompt("Descrição:",x.description||"");const price=prompt("Texto do preço:",x.price_text||"");const u=await db.from(table).update({title,description:desc,price_text:price}).eq("id",id);if(u.error)alert(u.error.message)}
 loadList(table)
}
async function removeRow(table,id){if(!confirm("Excluir este registro?"))return;const r=await db.from(table).delete().eq("id",id);if(r.error){alert(r.error.message);return}await loadList(table);await loadStats()}

$("#productForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload(await prepareUpload("pImage"));const r=await db.from("products").insert({name:$("#pName").value,category:$("#pCategory").value,price:$("#pPrice").value||null,description:$("#pDescription").value,image_url:image});if(r.error)throw r.error;e.target.reset();await loadList("products");await loadStats();alert("Produto adicionado.")}catch(x){alert(x.message)}});
$("#serviceForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload(await prepareUpload("sImage"));const r=await db.from("services").insert({name:$("#sName").value,description:$("#sDescription").value,image_url:image});if(r.error)throw r.error;e.target.reset();await loadList("services");await loadStats();alert("Serviço adicionado.")}catch(x){alert(x.message)}});
$("#galleryForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload(await prepareUpload("gImage"));const r=await db.from("gallery").insert({title:$("#gTitle").value,alt_text:$("#gAlt").value,image_url:image});if(r.error)throw r.error;e.target.reset();await loadList("gallery");await loadStats();alert("Foto adicionada.")}catch(x){alert(x.message)}});
$("#offerForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload(await prepareUpload("oImage"));const r=await db.from("offers").insert({title:$("#oTitle").value,price_text:$("#oPrice").value,description:$("#oDescription").value,image_url:image,starts_at:$("#oStart").value||null,ends_at:$("#oEnd").value||null});if(r.error)throw r.error;e.target.reset();await loadList("offers");await loadStats();alert("Oferta adicionada.")}catch(x){alert(x.message)}});

$("#passwordForm").addEventListener("submit",async e=>{e.preventDefault();const old=$("#currentPassword").value,newP=$("#newPassword").value,confirmP=$("#confirmPassword").value;
 if(newP.length<8)return securityMsg("A nova senha precisa ter pelo menos 8 caracteres.","err");if(newP!==confirmP)return securityMsg("A confirmação não confere.","err");
 const r=await db.auth.updateUser({password:newP,current_password:old});if(r.error){securityMsg(r.error.message,"err");return}e.target.reset();securityMsg("Senha alterada com sucesso.","ok")
});
$("#resetPassword").addEventListener("click",async()=>{const email=$("#securityEmail").textContent;const r=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});$("#resetStatus").textContent=r.error?r.error.message:"Link de recuperação enviado.";$("#resetStatus").className="status "+(r.error?"err":"ok")});
function securityMsg(m,k){$("#securityStatus").textContent=m;$("#securityStatus").className="status "+k}
setTimeout(()=>{if($("#appearanceFields")){addUploadControls();bindImageEditor()}},100);

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
