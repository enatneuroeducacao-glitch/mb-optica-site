const db=supabase.createClient(window.MB_SUPABASE.url,window.MB_SUPABASE.key);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const settings=[["store_name","Nome da ótica"],["whatsapp","WhatsApp (somente números)"],["phone","Telefone"],["email","E-mail"],["address","Endereço"],["hours","Horário de atendimento"],["instagram","Instagram"],["hero_title","Título principal"],["hero_subtitle","Subtítulo principal"]];

db.auth.onAuthStateChange((event,session)=>{
  if(event==="PASSWORD_RECOVERY"&&session) showResetView();
});

document.addEventListener("DOMContentLoaded",async()=>{
  bindNav();
  $("#loginForm").addEventListener("submit",login);
  $("#forgotPassword").addEventListener("click",requestPasswordReset);
  $("#resetForm").addEventListener("submit",updatePassword);
  $("#cancelReset").addEventListener("click",()=>{location.href="admin.html"});
  const r=await db.auth.getSession();
  const isRecovery=new URLSearchParams(location.search).get("reset")==="1";
  if(isRecovery&&r.data.session){showResetView();return}
  if(r.data.session)start(r.data.session.user);
});

async function login(e){
  e.preventDefault();
  setStatus("","");
  const r=await db.auth.signInWithPassword({email:$("#loginEmail").value.trim(),password:$("#loginPassword").value});
  if(r.error){setStatus(r.error.message,"err");return}
  start(r.data.user);
}

async function requestPasswordReset(){
  const email=$("#loginEmail").value.trim();
  if(!email){setStatus("Informe seu e-mail acima para receber o link de recuperação.","err");$("#loginEmail").focus();return}
  setStatus("Enviando instruções de recuperação...","");
  const redirectTo=location.origin+location.pathname+"?reset=1";
  const r=await db.auth.resetPasswordForEmail(email,{redirectTo});
  if(r.error){setStatus(r.error.message,"err");return}
  setStatus("Se o e-mail estiver cadastrado, você receberá o link para redefinir a senha.","ok");
}

function showResetView(){
  $("#loginView").classList.add("hidden");
  $("#appView").classList.add("hidden");
  $("#resetView").classList.remove("hidden");
}

async function updatePassword(e){
  e.preventDefault();
  const password=$("#resetPassword").value;
  const confirmation=$("#resetPasswordConfirm").value;
  const status=$("#resetStatus");
  status.textContent="";
  status.className="";
  if(password.length<8){status.textContent="A senha deve ter pelo menos 8 caracteres.";status.className="status err";return}
  if(password!==confirmation){status.textContent="As senhas não conferem.";status.className="status err";return}
  const r=await db.auth.updateUser({password});
  if(r.error){status.textContent=r.error.message;status.className="status err";return}
  status.textContent="Senha redefinida com sucesso. Você já pode entrar.";
  status.className="status ok";
  await db.auth.signOut();
  setTimeout(()=>location.href="admin.html",1400);
}

async function start(user){
  const r=await db.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
  if(r.error||!r.data){setStatus("Usuário autenticado, mas ainda não autorizado como administrador.","err");await db.auth.signOut();return}
  $("#loginView").classList.add("hidden");
  $("#resetView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#userEmail").textContent=user.email;
  loadAll();
}

async function logout(){await db.auth.signOut();location.reload()}

function bindNav(){
  $$(".nav button").forEach(b=>b.onclick=()=>{
    $$(".nav button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    $$(".section").forEach(x=>x.classList.add("hidden"));
    $("#"+b.dataset.section).classList.remove("hidden");
    $("#sectionTitle").textContent=b.textContent.replace(/^\S+\s/,"")
  });
}

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function setStatus(m,k){const e=$("#loginStatus");e.textContent=m;e.className=m?"status "+k:""}

async function loadAll(){await Promise.all([loadStats(),loadSettings(),loadList("products"),loadList("services"),loadList("gallery"),loadList("offers")])}
async function loadStats(){
  const ts=["products","services","gallery","offers"];
  const nums=await Promise.all(ts.map(async t=>(await db.from(t).select("*",{count:"exact",head:true})).count||0));
  $("#stats").innerHTML=ts.map((t,i)=>'<div class="card"><strong>'+nums[i]+'</strong><div>'+t+'</div></div>').join("")
}
async function loadSettings(){
  const r=await db.from("site_settings").select("key,value").order("key");
  if(r.error)return;
  $("#siteFields").innerHTML=settings.map(x=>{const row=(r.data||[]).find(y=>y.key===x[0]);return '<div class="field"><label>'+x[1]+'</label><input name="'+x[0]+'" value="'+esc(row?.value||"")+'"></div>'}).join("")
}
$("#siteForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const rows=[...new FormData(e.target).entries()].map(x=>({key:x[0],value:String(x[1]),updated_at:new Date().toISOString()}));
  const r=await db.from("site_settings").upsert(rows,{onConflict:"key"});
  alert(r.error?r.error.message:"Dados salvos.")
});
async function upload(file){
  if(!file)return "";
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
  const path=Date.now()+"-"+crypto.randomUUID()+"."+ext;
  const r=await db.storage.from("site-assets").upload(path,file);
  if(r.error)throw r.error;
  return db.storage.from("site-assets").getPublicUrl(path).data.publicUrl
}
$("#productForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    const image=await upload($("#pImage").files[0]);
    const r=await db.from("products").insert({name:$("#pName").value,category:$("#pCategory").value,price:$("#pPrice").value||null,description:$("#pDescription").value,image_url:image});
    if(r.error)throw r.error;
    e.target.reset();await loadList("products");await loadStats();alert("Produto adicionado.")
  }catch(x){alert(x.message)}
});
$("#serviceForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    const image=await upload($("#sImage").files[0]);
    const r=await db.from("services").insert({name:$("#sName").value,description:$("#sDescription").value,image_url:image});
    if(r.error)throw r.error;
    e.target.reset();await loadList("services");await loadStats();alert("Serviço adicionado.")
  }catch(x){alert(x.message)}
});
$("#galleryForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    const image=await upload($("#gImage").files[0]);
    const r=await db.from("gallery").insert({title:$("#gTitle").value,alt_text:$("#gAlt").value,image_url:image});
    if(r.error)throw r.error;
    e.target.reset();await loadList("gallery");await loadStats();alert("Foto adicionada.")
  }catch(x){alert(x.message)}
});
$("#offerForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    const image=await upload($("#oImage").files[0]);
    const r=await db.from("offers").insert({title:$("#oTitle").value,price_text:$("#oPrice").value,description:$("#oDescription").value,image_url:image,starts_at:$("#oStart").value||null,ends_at:$("#oEnd").value||null});
    if(r.error)throw r.error;
    e.target.reset();await loadList("offers");await loadStats();alert("Oferta adicionada.")
  }catch(x){alert(x.message)}
});
async function loadList(table){
  const r=await db.from(table).select("*").order("sort_order").order("created_at",{ascending:false});
  const el=$("#"+table+"Table");
  if(r.error){el.innerHTML='<div class="empty">'+esc(r.error.message)+'</div>';return}
  const rows=r.data||[];
  if(!rows.length){el.innerHTML='<div class="empty">Nenhum registro cadastrado ainda.</div>';return}
  el.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Foto</th><th>Informação</th><th>Ações</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+(x.image_url?'<img class="thumb" src="'+esc(x.image_url)+'">':"—")+'</td><td><strong>'+esc(x.name||x.title||"")+'</strong><br><small>'+esc(x.description||x.price_text||x.category||"")+'</small></td><td><button class="btn danger" onclick="removeRow(\''+table+'\',\''+x.id+'\')">Excluir</button></td></tr>').join("")+'</tbody></table></div>'
}
async function removeRow(table,id){
  if(!confirm("Excluir este registro?"))return;
  const r=await db.from(table).delete().eq("id",id);
  if(r.error){alert(r.error.message);return}
  await loadList(table);await loadStats()
}
