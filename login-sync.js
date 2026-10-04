(function(){
let c,u; const $=id=>document.getElementById(id);
function status(t){$('syncStatus').textContent=t}
function cloudStatus(t){const el=$('cloudStatus');if(el)el.textContent=t}
async function loadCloud(){
 if(!u)return;
 cloudStatus('Cargando datos…');
 const {data,error}=await c.from('finance_profiles').select('data,updated_at').eq('user_id',u.id).maybeSingle();
 if(error){console.error('CLOUD LOAD ERROR',error);cloudStatus('Error al cargar: '+error.message);return}
 const v=data?.data?.sync_test||'';
 $('cloudValue').value=v;
 cloudStatus(data?'✓ Datos cargados desde la nube':'✓ Nube lista · todavía sin datos');
}
async function saveCloud(){
 if(!u)return;
 const value=$('cloudValue').value;
 cloudStatus('Guardando…');
 const payload={user_id:u.id,data:{sync_test:value},updated_at:new Date().toISOString()};
 const {error}=await c.from('finance_profiles').upsert(payload,{onConflict:'user_id'});
 if(error){console.error('CLOUD SAVE ERROR',error);cloudStatus('Error al guardar: '+error.message);return}
 cloudStatus('✓ Guardado en la nube');
}
async function hello(user){
 u=user;
 const n=user?.user_metadata?.display_name||localStorage.getItem('masAllaNombre');
 if(n)document.querySelector('.hello').textContent='Hola '+n+' ♡';
 $('loginForm').style.display='none';$('loggedArea').style.display='block';
 $('accountEmail').textContent=user.email||'';status('✓ Cuenta conectada');
 await loadCloud();
}
async function login(){
 const n=$('syncName').value.trim(),e=$('syncEmail').value.trim();
 if(!n||!e)return alert('Escribe tu nombre y tu correo 💗');
 localStorage.setItem('masAllaNombre',n);status('Enviando acceso a tu correo…');
 const {error}=await c.auth.signInWithOtp({email:e,options:{emailRedirectTo:location.origin+location.pathname,data:{display_name:n}}});
 if(error){console.error('SUPABASE LOGIN ERROR',error);const detail=[error.message,error.code,error.status].filter(Boolean).join(' · ');status('Error: '+detail);return alert('Supabase respondió:\n'+detail)}
 status('Revisa tu correo ✉️');alert('Te enviamos un enlace para entrar 💗')
}
async function init(){
 if(!window.supabase||typeof SUPABASE_URL==='undefined'||typeof SUPABASE_KEY==='undefined'||!SUPABASE_KEY){status('Falta configuración de Supabase');return}
 c=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
 $('syncLoginButton').onclick=login;
 $('syncLogoutButton').onclick=async()=>{await c.auth.signOut();location.reload()};
 $('cloudSaveButton').onclick=saveCloud;
 const {data:{session}}=await c.auth.getSession();u=session?.user||null;if(u)await hello(u);
 c.auth.onAuthStateChange((_e,s)=>{const next=s?.user||null;if(next&&!u)hello(next);u=next})
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init()
})();