// Apply only non-sensitive display preferences before paint. Never read game
// saves, account sessions or admin credentials. Game documents do not load this.
(()=>{'use strict';
 let theme='dark';
 try{
  let saved;
  if(location.pathname.includes('/admin/'))saved=localStorage.getItem('house-admin-theme');
  else if(location.pathname.endsWith('/account.html'))saved=localStorage.getItem('customer-theme');
  else saved=JSON.parse(localStorage.getItem('house-preferences-v1')||'null')?.theme;
  if(saved==='light'||saved==='dark')theme=saved;
  else if(saved==='system')theme=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
 }catch{}
 const root=document.documentElement;root.dataset.houseTheme=theme;
 function browserChrome(){let meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.append(meta)}meta.content=root.dataset.houseTheme==='light'?'#E7EEF0':'#070A10'}
 browserChrome();new MutationObserver(browserChrome).observe(root,{attributes:true,attributeFilter:['data-house-theme']});
})();

// Curated Tabler outline icons for the public site shell. Game-specific artwork
// stays unchanged; navigation and utility symbols use the local SVG sprite.
(()=>{'use strict';if(location.pathname.includes('/admin/'))return;
 const svg=name=>`<svg class="house-icon" aria-hidden="true" focusable="false"><use href="house-icons.svg#icon-${name}"></use></svg>`;
 function holder(el,name){if(!el||el.dataset.houseIcon===name)return;el.dataset.houseIcon=name;el.innerHTML=svg(name)}
 function lead(el,name){if(!el||el.querySelector(':scope > .house-nav-icon'))return;const i=document.createElement('i');i.className='house-nav-icon';i.setAttribute('aria-hidden','true');i.innerHTML=svg(name);const text=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);if(text)text.nodeValue=text.nodeValue.replace(/^\s*[↪＋⌁◈◇▤◌▦▶↶]\s*/u,'');el.prepend(i)}
 function only(el,name){if(!el)return;el.textContent='';const i=document.createElement('i');i.className='house-nav-icon';i.setAttribute('aria-hidden','true');i.innerHTML=svg(name);el.append(i)}
 function decorate(root=document){
  const one=(selector,name)=>root.querySelectorAll(selector).forEach(el=>holder(el,name));
  one('.bottom-nav [data-tab="all"] > i','grid');one('.bottom-nav [data-tab="favorites"] > i','heart');one('.bottom-nav [data-tab="saved"] > i','history');one('.bottom-nav [data-help] > i','help');one('.bottom-nav a[href*="page=profile"] > i','user');
  one('.house-bottom a[href="arcade.html"] > i','grid');one('.house-bottom a[href*="page=guides"] > i','book');one('.house-bottom a[href*="page=profile"] > i','user');one('.house-bottom a[href*="page=settings"] > i','settings');one('.house-bottom a[href*="page=support"] > i','headset');
  one('.site-quick-play > i','play');one('.footer-command-cta [aria-hidden="true"]','play');one('.search > span','search');
  one('.player-dashboard .resume-banner > i','history');one('.player-dashboard .daily-card > i','bolt');one('.player-dashboard .favorite-card > i','heart');
  one('.site-welcome a[href*="page=profile"] > i','user');one('.site-welcome a[href*="page=guides"] > i','book');one('.site-welcome a[href*="page=settings"] > i','settings');
  const footer=[['arcade.html#library','grid'],['hub.html?page=profile','user'],['hub.html?page=guides','book'],['account.html','login']];for(const[href,name]of footer)root.querySelectorAll(`.footer-command-shortcuts a[href="${href}"]`).forEach(el=>{if(!el.querySelector('.house-icon'))only(el,name)});
  const account={login:'login',register:'user',otp:'shield',profile:'user',social:'gamepad',security:'shield',orders:'bookmark',chat:'message',staff:'headset'};for(const[route,name]of Object.entries(account))root.querySelectorAll(`#customer-nav [data-route="${route}"]`).forEach(el=>lead(el,name));
  root.querySelectorAll('.hero-actions .primary').forEach(el=>lead(el,'play'));root.querySelectorAll('#heroContinue').forEach(el=>lead(el,'history'));
 }
 addEventListener('DOMContentLoaded',()=>{decorate();new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===Node.ELEMENT_NODE)decorate(node.matches?.('.site-enabled,.customer-page')?node:node.parentElement||document)}).observe(document.body,{childList:true,subtree:true})},{once:true});
})();
