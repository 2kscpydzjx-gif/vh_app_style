// Temporary Prom.ua XML test exporter. Remove this file + its script tag after testing.
(()=>{
 const escXml=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
 const cdata=v=>String(v??'').replace(/]]>/g,']]]]><![CDATA[>');
 const val=(o,...keys)=>keys.map(k=>o?.[k]).find(v=>v!==null&&v!==undefined&&String(v).trim()!=='')??'';
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 async function ready(){for(let i=0;i<100;i++){if(window.supabase&&window.VH_CONFIG?.supabaseUrl&&window.VH_CONFIG?.supabaseKey)return;await sleep(100)}throw new Error('Supabase не готовий')}
 async function make(){
  await ready();
  const client=window.supabase.createClient(window.VH_CONFIG.supabaseUrl,window.VH_CONFIG.supabaseKey);
  const {data:ps,error}=await client.from('products').select('*').eq('status','published').gt('stock',0).gt('price',0).order('created_at',{ascending:false}).limit(3);
  if(error)throw error;if(!ps?.length)throw new Error('Не знайдено published товарів у наявності');
  const ids=ps.map(p=>p.id);
  const [{data:cats,error:ce},{data:subs,error:se},{data:imgs,error:ie}]=await Promise.all([
   client.from('categories').select('id,name'),
   client.from('subcategories').select('id,name,category_id'),
   client.from('product_images').select('product_id,image_url,sort_order,is_cover').in('product_id',ids).order('sort_order')
  ]);
  if(ce)throw ce;if(se)throw se;if(ie)throw ie;
  const cm=new Map((cats||[]).map(x=>[x.id,x.name])),sm=new Map((subs||[]).map(x=>[x.id,x.name]));
  const groups=new Map(),groupIds=new Map();let gid=1;
  for(const p of ps){const group=sm.get(p.subcategory_id)||cm.get(p.category_id)||'Vintage Hedonista';if(!groupIds.has(group))groupIds.set(group,gid++);groups.set(p.id,group)}
  const lines=['<?xml version="1.0" encoding="UTF-8"?>','<shop>','  <categories>'];
  for(const [name,id] of groupIds)lines.push(`    <category id="${id}">${escXml(name)}</category>`);
  lines.push('  </categories>','  <offers>');
  for(const p of ps){
   const pics=(imgs||[]).filter(x=>x.product_id===p.id).sort((a,b)=>(b.is_cover?1:0)-(a.is_cover?1:0)||(a.sort_order??0)-(b.sort_order??0)).map(x=>x.image_url).filter(Boolean);
   if(p.cover_image&&!pics.includes(p.cover_image))pics.unshift(p.cover_image);
   const desc=val(p,'description','details_text'); const qty=Math.max(0,Number(p.stock)||0);
   lines.push(`    <offer id="${escXml(p.id)}" available="true">`,
    `      <name>${escXml(p.name)}</name>`,`      <name_ua>${escXml(p.name)}</name_ua>`,
    `      <categoryId>${groupIds.get(groups.get(p.id))}</categoryId>`,`      <price>${Number(p.price)||0}</price>`,
    `      <available>${qty>0?'true':'false'}</available>`,`      <currencyId>UAH</currencyId>`,`      <quantity_in_stock>${qty}</quantity_in_stock>`);
   pics.slice(0,10).forEach(u=>lines.push(`      <picture>${escXml(u)}</picture>`));
   if(p.brand)lines.push(`      <vendor>${escXml(p.brand)}</vendor>`);
   lines.push(`      <vendorCode>${escXml(p.slug||p.id)}</vendorCode>`);
   if(desc){lines.push(`      <description><![CDATA[${cdata(desc)}]]></description>`,`      <description_ua><![CDATA[${cdata(desc)}]]></description_ua>`)}
   [['Розмір',p.size],['Колір',p.color],['Матеріал',p.material],['Стан',p.condition],['Країна',p.country],['Сезон',p.season]].forEach(([n,v])=>{if(v)lines.push(`      <param name="${n}">${escXml(v)}</param>`)});
   lines.push('    </offer>');
  }
  lines.push('  </offers>','</shop>');
  const blob=new Blob([lines.join('\n')],{type:'application/xml;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='prom-feed-test.xml';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  alert('Готово: prom-feed-test.xml — '+ps.length+' товари');
 }
 const b=document.createElement('button');b.type='button';b.textContent='PROM XML TEST';b.title='Завантажити XML на 3 товари';Object.assign(b.style,{position:'fixed',right:'12px',bottom:'82px',zIndex:'9999',padding:'10px 12px',border:'1px solid #b99b75',background:'#1a100b',color:'#fff',font:'600 11px Arial',letterSpacing:'1px',cursor:'pointer'});b.onclick=()=>make().catch(e=>{console.error(e);alert('Prom XML: '+e.message)});document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(b));
})();