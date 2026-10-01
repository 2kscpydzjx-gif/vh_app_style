const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let db=null,categories=[],subcategories=[],products=[],selected=[],activeCategoryId=null,activeSubcategoryId=null;
let generatedLookImage=null,isGeneratingLook=false;
const money=v=>`${new Intl.NumberFormat('uk-UA').format(Number(v||0))} грн`;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function toast(t){const e=$('#toast');if(!e){console.warn('Toast:',t);return}e.textContent=t;e.classList.add('show');clearTimeout(window.__t);window.__t=setTimeout(()=>e.classList.remove('show'),1800)}
function go(id){$$('.screen').forEach(x=>x.classList.toggle('active',x.id===id));$$('nav [data-go]').forEach(x=>x.classList.toggle('active',x.dataset.go===id));window.scrollTo(0,0);if(id==='look'){renderLook();document.querySelector('#look').classList.toggle('isEmpty',selected.length===0);}if(id==='saved')renderSaved()}
$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));$('#back')?.addEventListener('click',()=>go('home'));$('#menu')?.addEventListener('click',()=>toast('Vintage Hedonista Style Lab'));
const img=p=>p?.cover_image||'assets/model/base-look.png', sold=p=>Number(p.stock||0)<=0;
function roleFor(p){
 const cat=(categories.find(x=>x.id===p.category_id)?.slug||'').toLowerCase();
 const sub=(subcategories.find(x=>x.id===p.subcategory_id)?.slug||'').toLowerCase();
 const s=sub||cat;
 if(/sukni|suknia|dress/.test(s))return'base';
 if(/spidny|bryuk|briuk|dzhyn|short|nyz/.test(s))return'bottom';
 if(/soroch|bluz|koft|kard|korset/.test(s))return'top';
 if(/pidzhak|zhaket|palto|kurt|shub|plash|kimono|keip/.test(s))return'layer';
 if(/vzutt|tufl|chobot|kozaky/.test(s))return'shoes';
 if(/sumk|klatch/.test(s))return'bag';
 if(/akses|prykras|khust|holovni|rukavych|poyas/.test(s))return'accessory';
 return'other';
}
function addProduct(p){
 const existing=selected.findIndex(x=>x.id===p.id);if(existing>=0){selected.splice(existing,1);sync();return}
 const role=roleFor(p);
 if(role==='base') selected=selected.filter(x=>!['base','top','bottom'].includes(roleFor(x)));
 else if(['top','bottom'].includes(role)) selected=selected.filter(x=>roleFor(x)!=='base'&&roleFor(x)!==role);
 else if(['layer','shoes','bag'].includes(role)) selected=selected.filter(x=>roleFor(x)!==role);
 selected.push(p);sync();
}
function sync(){localStorage.setItem('vh-current-look',JSON.stringify(selected.map(x=>x.id)));generatedLookImage=null;renderCatalog({preserveScroll:true})}
function restore(){try{const ids=JSON.parse(localStorage.getItem('vh-current-look')||'[]');selected=ids.map(id=>products.find(p=>p.id===id)).filter(Boolean)}catch{}}
function filtered(){return products.filter(p=>activeSubcategoryId?p.subcategory_id===activeSubcategoryId:activeCategoryId?p.category_id===activeCategoryId:true)}
function renderCategories(){const box=$('#categoryTabs');box.innerHTML='';[{id:null,name:'УСІ'},...categories].forEach(c=>{const b=document.createElement('button');b.textContent=c.name.toUpperCase();b.className=activeCategoryId===c.id?'active':'';b.onclick=()=>{activeCategoryId=c.id;activeSubcategoryId=null;renderCatalog()};box.appendChild(b)})}
function renderSubs(){const box=$('#subcategoryTabs');box.innerHTML='';if(!activeCategoryId){box.classList.remove('visible');return}const list=subcategories.filter(s=>s.category_id===activeCategoryId);if(!list.length){box.classList.remove('visible');return}box.classList.add('visible');[{id:null,name:'Усі'},...list].forEach(s=>{const b=document.createElement('button');b.textContent=s.name;b.className=activeSubcategoryId===s.id?'active':'';b.onclick=()=>{activeSubcategoryId=s.id;renderCatalog()};box.appendChild(b)})}
function renderProducts(){
 const list=filtered(),grid=$('#productGrid');grid.innerHTML='';
 const cat=categories.find(c=>c.id===activeCategoryId),sub=subcategories.find(s=>s.id===activeSubcategoryId);
 const sectionTitle=$('#sectionTitle');if(sectionTitle)sectionTitle.textContent=(sub?.name||cat?.name||'Усі товари').toUpperCase();const catalogMeta=$('#catalogMeta');if(catalogMeta)catalogMeta.textContent=`${list.length} товарів`;
 if(!list.length){grid.innerHTML='<div class="state">У цьому розділі поки немає товарів.</div>';return}
 list.forEach(p=>{const chosen=selected.some(x=>x.id===p.id),b=document.createElement('button');b.className='product '+(chosen?'selected ':'')+(sold(p)?'sold':'');
 b.innerHTML=`<div class="image"><img loading="lazy" src="${esc(img(p))}" alt="${esc(p.name)}">${sold(p)?'<span class="soldBadge">ПРОДАНО</span>':''}<span class="check">${chosen?'ДОДАНО ✓':'ДОДАТИ ДО ОБРАЗУ'}</span></div><b>${esc(p.name)}</b><small>${money(p.price)}</small>${p.brand?`<em>${esc(p.brand)}</em>`:''}`;
 b.onclick=()=>addProduct(p);grid.appendChild(b)})
}
function renderCatalog(opts={}){const builder=$('#builder'),scroll=builder?.scrollTop||0;renderCategories();renderSubs();renderProducts();applyCatalogSearch();const selectedCount=$('#selectedCount');if(selectedCount)selectedCount.textContent=selected.length;const dock=document.querySelector('.builderDock');if(dock)dock.classList.toggle('visible',selected.length>0);if(opts.preserveScroll&&builder)requestAnimationFrame(()=>builder.scrollTop=scroll)}
$('#clearFilter').onclick=()=>{activeCategoryId=null;activeSubcategoryId=null;renderCatalog()};
$('#openLook').onclick=()=>selected.length?go('look'):toast('Додай хоча б одну річ');

const catalogSearchInput=$('#catalogSearchInput');
function applyCatalogSearch(){
  const q=(catalogSearchInput?.value||'').trim().toLocaleLowerCase('uk-UA');
  document.querySelectorAll('#productGrid .product').forEach(card=>{
    const hay=(card.textContent||'').toLocaleLowerCase('uk-UA');
    card.hidden=!!q&&!hay.includes(q);
  });
}
catalogSearchInput?.addEventListener('input',applyCatalogSearch);
$('#catalogFilterBtn')?.addEventListener('click',()=>{
  const builder=$('#builder');if(!builder)return;
  builder.classList.toggle('filtersCollapsed');
  const btn=$('#catalogFilterBtn');if(btn)btn.classList.toggle('active',!builder.classList.contains('filtersCollapsed'));
});

function renderLook(){
 const lookCount=$('#lookCount');if(lookCount)lookCount.textContent=selected.length;
 const preview=$('#lookPreview');if(preview)preview.src=generatedLookImage||'assets/model/base-look.png';const lookTotal=$('#lookTotal');if(lookTotal)lookTotal.textContent=money(selected.reduce((a,p)=>a+Number(p.price||0),0));
 const box=$('#lookItems');box.innerHTML='';
 if(!selected.length){box.innerHTML='<div class="state">Образ порожній. Додай речі з каталогу.</div>';return}
 selected.forEach(p=>{const cat=categories.find(c=>c.id===p.category_id),sub=subcategories.find(s=>s.id===p.subcategory_id);const row=document.createElement('div');row.className='lookRow';row.innerHTML=`<img src="${esc(img(p))}"><div><span>${esc(sub?.name||cat?.name||'Товар')}</span><b>${esc(p.name)}</b><small>${money(p.price)} · ${sold(p)?'Продано':'В наявності'}</small></div><button>×</button>`;row.querySelector('button').onclick=()=>{selected=selected.filter(x=>x.id!==p.id);sync();renderLook()};box.appendChild(row)})
}
function buildLookPrompt(){const items=selected.map(p=>{const cat=categories.find(c=>c.id===p.category_id),sub=subcategories.find(s=>s.id===p.subcategory_id);return[p.name,p.brand,p.color,sub?.name||cat?.name].filter(Boolean).join(', ')}).join('; ');return `Ultra realistic full body editorial fashion photograph of an adult female model wearing one coherent outfit inspired by these selected vintage fashion items: ${items}. Preserve the described garment types and colors as closely as possible. Dark chocolate studio background, premium Vintage Hedonista editorial, natural realistic body proportions, soft cinematic studio lighting, detailed textile texture, full body visible.`}
function aiReferenceProducts(){const priority={base:0,top:1,bottom:2,layer:3,shoes:4,bag:5,accessory:6,other:7};return selected.filter(p=>p?.cover_image).map((p,index)=>({p,index,rank:priority[roleFor(p)]??7})).sort((a,b)=>a.rank-b.rank||a.index-b.index).slice(0,4).map(x=>x.p)}
async function generateLook(){
 if(!selected.length)return toast('Додай хоча б одну річ');if(isGeneratingLook)return;if(!db)return toast('Каталог ще завантажується');
 const references=aiReferenceProducts();if(!references.length)return toast('У вибраних товарів немає фото');const btn=$('#generateLook'),stage=$('.modelStage');
 try{
  isGeneratingLook=true;btn.disabled=true;btn.textContent='ГЕНЕРУЄМО ОБРАЗ…';stage?.classList.add('aiLoading');
  const payload={prompt:buildLookPrompt(),images:references.map(p=>p.cover_image)};
  const url=window.VH_CONFIG.supabaseUrl.replace(/\/$/,'')+'/functions/v1/generate-look';
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','apikey':window.VH_CONFIG.supabaseKey,'Authorization':'Bearer '+window.VH_CONFIG.supabaseKey},body:JSON.stringify(payload)});
  const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{throw new Error('Edge Function returned HTTP '+res.status)}
  if(!res.ok||!data?.success||!data?.imageUrl)throw new Error(data?.error||('AI HTTP '+res.status));
  generatedLookImage=data.imageUrl;const preview=$('#lookPreview');if(preview)preview.src=generatedLookImage;toast('AI-образ готовий');
 }catch(e){console.error('generate-look',e);toast('Помилка AI: '+(e?.message||'невідома'))}
 finally{isGeneratingLook=false;btn.disabled=false;btn.textContent=generatedLookImage?'ЗГЕНЕРУВАТИ ЩЕ РАЗ ✦':'СТВОРИТИ ОБРАЗ НА МОДЕЛІ ✦';stage?.classList.remove('aiLoading')}
}
$('#generateLook').onclick=generateLook;
function savedLooks(){try{return JSON.parse(localStorage.getItem('vh-saved-looks')||'[]')}catch{return[]}}
function openSaveModal(){if(!selected.length)return toast('Образ порожній');$('#lookNameInput').value='';$('#nameModal').classList.add('show');setTimeout(()=>$('#lookNameInput').focus(),50)}
function closeSaveModal(){$('#nameModal').classList.remove('show')}
$('#saveLook').onclick=openSaveModal;$('#cancelSave').onclick=closeSaveModal;$('#nameModalBackdrop').onclick=closeSaveModal;
$('#confirmSave').onclick=()=>{const name=$('#lookNameInput').value.trim();if(!name)return toast('Напиши назву стилізації');const looks=savedLooks();looks.unshift({id:Date.now(),name,ids:selected.map(x=>x.id),count:selected.length,total:selected.reduce((a,p)=>a+Number(p.price||0),0),image:generatedLookImage||null});localStorage.setItem('vh-saved-looks',JSON.stringify(looks));selected=[];generatedLookImage=null;localStorage.setItem('vh-current-look','[]');closeSaveModal();renderCatalog();toast('Стилізацію збережено');setTimeout(()=>go('saved'),300)};
function renderSaved(){const looks=savedLooks(),box=$('#savedList');box.innerHTML='';if(!looks.length){box.innerHTML='<div class="state">Ще немає збережених стилізацій.</div>';return}looks.forEach((l,index)=>{const card=document.createElement('div');card.className='savedCard savedLookCard';card.innerHTML=`<img src="${esc(l.image||'assets/model/base-look.png')}" alt=""><div class="savedInfo"><span>ЗБЕРЕЖЕНА СТИЛІЗАЦІЯ</span><b>${esc(l.name)}</b><small>${l.count} речей · ${money(l.total)}</small><div class="savedActions"><button class="renameSaved">ЗМІНИТИ НАЗВУ</button><i>·</i><button class="deleteSaved">ВИДАЛИТИ</button></div></div>`;card.querySelector('.renameSaved').onclick=()=>{const n=prompt('Назва стилізації:',l.name);if(n&&n.trim()){l.name=n.trim();localStorage.setItem('vh-saved-looks',JSON.stringify(looks));renderSaved()}};card.querySelector('.deleteSaved').onclick=()=>{if(!confirm('Видалити цю стилізацію?'))return;looks.splice(index,1);localStorage.setItem('vh-saved-looks',JSON.stringify(looks));renderSaved()};box.appendChild(card)})}
async function allProducts(){let out=[],from=0,size=1000;while(true){const{data,error}=await db.from('products').select('id,name,slug,price,old_price,category_id,subcategory_id,size,color,brand,status,stock,cover_image,created_at').eq('status','published').order('created_at',{ascending:false}).range(from,from+size-1);if(error)throw error;out.push(...(data||[]));if((data||[]).length<size)break;from+=size}return out}
async function load(){try{const cfg=window.VH_CONFIG;if(!cfg?.supabaseUrl||!cfg?.supabaseKey||!window.supabase)throw new Error('Не знайдено конфігурацію Supabase');db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey);const[c,s,p]=await Promise.all([db.from('categories').select('id,name,slug,sort_order,is_active').eq('is_active',true).order('sort_order'),db.from('subcategories').select('id,category_id,name,slug,sort_order').order('sort_order'),allProducts()]);if(c.error)throw c.error;if(s.error)throw s.error;categories=c.data||[];subcategories=s.data||[];products=p||[];restore();renderCatalog()}catch(e){console.error(e);$('#productGrid').innerHTML=`<div class="state">Помилка завантаження:<br>${esc(e.message)}</div>`;toast('Не вдалося завантажити каталог')}}
load();
function renderHomeEditorial(){const hp=document.querySelector('#homeProducts');if(hp&&Array.isArray(products)){hp.innerHTML='';const pool=products.filter(p=>!sold(p));for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}pool.slice(0,3).forEach(p=>{const b=document.createElement('button');b.className='homeProduct';b.innerHTML=`<img loading="lazy" src="${esc(img(p))}" alt="${esc(p.name)}"><b>${esc(p.name)}</b><small>${money(p.price)}</small>`;b.onclick=()=>vhGoCatalog();hp.appendChild(b)})}const wrap=document.querySelector('#lastLookHome'),card=document.querySelector('#lastLookCard');if(wrap&&card){const looks=savedLooks();if(looks.length){const l=looks[looks.length-1];wrap.hidden=false;card.innerHTML=`<button class="homeLastCard"><img src="${esc(l.image||'assets/model/base-look.png')}" alt=""><div><span class="eyebrow">ОСТАННЯ ВЕРСІЯ</span><b>${esc(l.name)}</b><small>${l.count} речей · ${money(l.total)}</small></div></button>`;card.querySelector('button').onclick=()=>go('saved')}else wrap.hidden=true}}
function vhGoCatalog(){renderCatalog();go('builder');const builder=document.querySelector('#builder');if(builder)builder.scrollTop=0}
(function(){let n=0,t=setInterval(()=>{if((Array.isArray(products)&&products.length)||++n>30){clearInterval(t);renderHomeEditorial()}},150)})();
