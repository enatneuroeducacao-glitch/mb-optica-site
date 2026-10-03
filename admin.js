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
["logo_url","URL do logotipo","url"],["hero_image_url","URL da imagem principal","url"],["map_url","URL do Google Maps","url"],
["primary_color","Cor principal","color"],["cream_color","Cor de fundo","color"],["dark_color","Cor escura","color"],["muted_color","Cor de texto secundário","color"]
];

document.addEventListener("DOMContentLoaded",async()=>{
 bindNav(); $("#loginForm").addEventListener("submit",login); $("#logout").addEventListener("click",logout);
 $$(".quick button").forEach(b=>b.onclick=()=>showSection(b.dataset.go));
 $$(".quick a").forEach(a=>a.addEventListener("click",()=>{}));
 const r=await db.auth.getSession(); if(r.data.session) start(r.data.session.user);
});

function showSection(id){$$( ".nav button").forEach(x=>x.classList.toggle("active",x.dataset.section===id));$$( ".section").forEach(x=>x.classList.add("hidden"));$("#"+id)?.classList.remove("hidden");const b=$('.nav button[data-section="'+id+'"]');if(b)$("#sectionTitle").textContent=b.textContent.replace(/^\S+\s/,"");window.scrollTo({top:0,behavior:"smooth"})}
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
 for(const id of ["logoFile","heroFile"]){const f=$("#"+id)?.files?.[0];if(f){const url=await upload(f);const key=id==="logoFile"?"logo_url":"hero_image_url";const row={key,value:url,updated_at:new Date().toISOString()};const rr=await db.from("site_settings").upsert([row],{onConflict:"key"});if(rr.error)throw rr.error}}
 await saveSettings(e.target,appearanceFields);alert("Aparência salva.")
}catch(x){alert(x.message)}});
async function upload(file){const ext=(file.name.split(".").pop()||"jpg").toLowerCase();const path=Date.now()+"-"+crypto.randomUUID()+"."+ext;const r=await db.storage.from("site-assets").upload(path,file,{upsert:false});if(r.error)throw r.error;return db.storage.from("site-assets").getPublicUrl(path).data.publicUrl}
function addUploadControls(){const box=$("#appearanceFields");box.insertAdjacentHTML("beforeend",'<div class="field"><label>Enviar logotipo</label><input id="logoFile" type="file" accept="image/*"></div><div class="field"><label>Enviar imagem principal</label><input id="heroFile" type="file" accept="image/*"></div>')}
async function loadStats(){const ts=["products","services","gallery","offers"];const nums=await Promise.all(ts.map(async t=>(await db.from(t).select("*",{count:"exact",head:true})).count||0));$("#stats").innerHTML=ts.map((t,i)=>'<div><strong>'+nums[i]+'</strong><span>'+({products:"Produtos",services:"Serviços",gallery:"Fotos",offers:"Ofertas"}[t])+'</span></div>').join("")}
async function loadList(table){
 const r=await db.from(table).select("*").order("sort_order").order("created_at",{ascending:false});const el=$("#"+table+"Table");
 if(r.error){el.innerHTML='<div class="empty">'+esc(r.error.message)+'</div>';return}
 const rows=r.data||[];if(!rows.length){el.innerHTML='<div class="empty">Nenhum registro cadastrado ainda.</div>';return}
 el.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Foto</th><th>Informação</th><th>Status</th><th>Ações</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+(x.image_url?'<img class="thumb" src="'+esc(x.image_url)+'">':"—")+'</td><td><strong>'+esc(x.name||x.title||"")+'</strong><br><small>'+esc(x.description||x.price_text||x.category||"")+'</small></td><td><button class="pill '+(x.active===false?"off":"on")+'" onclick="toggleActive(\''+table+'\',\''+x.id+'\','+(x.active===false?'true':'false')+')">'+(x.active===false?"Oculto":"Publicado")+'</button></td><td><button class="btn small" onclick="editRow(\''+table+'\',\''+x.id+'\')">Editar</button> <button class="btn danger small" onclick="removeRow(\''+table+'\',\''+x.id+'\')">Excluir</button></td></tr>').join("")+
 "</tbody></table></div>"
}
async function toggleActive(table,id,value){const r=await db.from(table).update({active:value,updated_at:new Date().toISOString()}).eq("id",id);if(r.error){alert(r.error.message);return}loadList(table)}
async function editRow(table,id){
 const r=await db.from(table).select("*").eq("id",id).single();if(r.error)return alert(r.error.message);const x=r.data;
 if(table==="products"){const name=prompt("Nome:",x.name);if(name===null)return;const desc=prompt("Descrição:",x.description||"");const cat=prompt("Categoria:",x.category||"outros");const price=prompt("Preço:",x.price??"");const u=await db.from(table).update({name,description:desc,category:cat,price:price||null,updated_at:new Date().toISOString()}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="services"){const name=prompt("Nome:",x.name);if(name===null)return;const desc=prompt("Descrição:",x.description||"");const u=await db.from(table).update({name,description:desc,updated_at:new Date().toISOString()}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="gallery"){const title=prompt("Título:",x.title||"");if(title===null)return;const alt=prompt("Texto alternativo:",x.alt_text||"");const u=await db.from(table).update({title,alt_text:alt}).eq("id",id);if(u.error)alert(u.error.message)}
 if(table==="offers"){const title=prompt("Título:",x.title);if(title===null)return;const desc=prompt("Descrição:",x.description||"");const price=prompt("Texto do preço:",x.price_text||"");const u=await db.from(table).update({title,description:desc,price_text:price}).eq("id",id);if(u.error)alert(u.error.message)}
 loadList(table)
}
async function removeRow(table,id){if(!confirm("Excluir este registro?"))return;const r=await db.from(table).delete().eq("id",id);if(r.error){alert(r.error.message);return}await loadList(table);await loadStats()}

$("#productForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload($("#pImage").files[0]);const r=await db.from("products").insert({name:$("#pName").value,category:$("#pCategory").value,price:$("#pPrice").value||null,description:$("#pDescription").value,image_url:image});if(r.error)throw r.error;e.target.reset();await loadList("products");await loadStats();alert("Produto adicionado.")}catch(x){alert(x.message)}});
$("#serviceForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload($("#sImage").files[0]);const r=await db.from("services").insert({name:$("#sName").value,description:$("#sDescription").value,image_url:image});if(r.error)throw r.error;e.target.reset();await loadList("services");await loadStats();alert("Serviço adicionado.")}catch(x){alert(x.message)}});
$("#galleryForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload($("#gImage").files[0]);const r=await db.from("gallery").insert({title:$("#gTitle").value,alt_text:$("#gAlt").value,image_url:image});if(r.error)throw r.error;e.target.reset();await loadList("gallery");await loadStats();alert("Foto adicionada.")}catch(x){alert(x.message)}});
$("#offerForm").addEventListener("submit",async e=>{e.preventDefault();try{const image=await upload($("#oImage").files[0]);const r=await db.from("offers").insert({title:$("#oTitle").value,price_text:$("#oPrice").value,description:$("#oDescription").value,image_url:image,starts_at:$("#oStart").value||null,ends_at:$("#oEnd").value||null});if(r.error)throw r.error;e.target.reset();await loadList("offers");await loadStats();alert("Oferta adicionada.")}catch(x){alert(x.message)}});

$("#passwordForm").addEventListener("submit",async e=>{e.preventDefault();const old=$("#currentPassword").value,newP=$("#newPassword").value,confirmP=$("#confirmPassword").value;
 if(newP.length<8)return securityMsg("A nova senha precisa ter pelo menos 8 caracteres.","err");if(newP!==confirmP)return securityMsg("A confirmação não confere.","err");
 const r=await db.auth.updateUser({password:newP,current_password:old});if(r.error){securityMsg(r.error.message,"err");return}e.target.reset();securityMsg("Senha alterada com sucesso.","ok")
});
$("#resetPassword").addEventListener("click",async()=>{const email=$("#securityEmail").textContent;const r=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});$("#resetStatus").textContent=r.error?r.error.message:"Link de recuperação enviado.";$("#resetStatus").className="status "+(r.error?"err":"ok")});
function securityMsg(m,k){$("#securityStatus").textContent=m;$("#securityStatus").className="status "+k}
setTimeout(()=>{if($("#appearanceFields"))addUploadControls()},100);

$("#createUserForm")?.addEventListener("submit",async e=>{e.preventDefault();
 const f=e.target, email=f.elements[0].value.trim().toLowerCase(), secret=f.elements[1].value, confirm=f.elements[2].value, status=$("#createUserStatus");
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
async function loadAdminUsers(){
 const box=$("#adminUsersTable"),status=$("#adminUsersStatus");if(!box)return;
 try{status.textContent="";box.innerHTML='<div class="empty">Carregando usuários...</div>';
  const data=await adminApi({action:"list"});const users=data.users||[];
  if(!users.length){box.innerHTML='<div class="empty">Nenhum usuário administrativo cadastrado.</div>';return}
  box.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>E-mail</th><th>Criado em</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>'+
  users.map(u=>'<tr><td><strong>'+esc(u.email||"")+'</strong></td><td>'+fmtDate(u.created_at)+'</td><td>'+fmtDate(u.last_sign_in_at)+'</td><td><button class="btn small" onclick="editAdminUser(\''+u.id+'\',\''+esc(u.email||"")+'\')">Editar</button> <button class="btn danger small" onclick="deleteAdminUser(\''+u.id+'\',\''+esc(u.email||"")+'\')">Excluir</button></td></tr>').join("")+
  '</tbody></table></div>';
 }catch(e){box.innerHTML='<div class="empty">'+esc(e.message)+'</div>';status.textContent="Acesso administrativo obrigatório.";status.className="status err";}
}
function fmtDate(v){if(!v)return "—";try{return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(v))}catch(_){return "—"}}
async function editAdminUser(id,email){
 const newEmail=prompt("E-mail do usuário:",email);if(newEmail===null)return;
 const newPassword=prompt("Nova senha (deixe em branco para manter):","");
 if(newPassword===null)return;
 try{await adminApi({action:"update",id,email:newEmail,password:newPassword});alert("Usuário atualizado com sucesso.");await loadAdminUsers()}catch(e){alert(e.message)}
}
async function deleteAdminUser(id,email){
 if(!confirm("Excluir o usuário administrativo "+email+"?"))return;
 try{await adminApi({action:"delete",id});alert("Usuário excluído.");await loadAdminUsers()}catch(e){alert(e.message)}
}
