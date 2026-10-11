/* LINKA polish layer - visual only, never touches like/seen/delete logic */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

  // scroll progress bar + back-to-top
  const bar=document.createElement('div');bar.id='lk-progress';document.body.appendChild(bar);
  const top=document.createElement('button');top.id='lk-top';top.setAttribute('aria-label','Back to top');top.textContent='↑';
  top.onclick=()=>scrollTo({top:0,behavior:'smooth'});document.body.appendChild(top);
  addEventListener('scroll',()=>{
    const h=document.documentElement,m=h.scrollHeight-h.clientHeight;
    bar.style.width=(m>0?h.scrollTop/m*100:0)+'%';
    top.classList.toggle('show',h.scrollTop>600);
  },{passive:true});

  // posts reveal as they scroll into view
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('lk-in');io.unobserve(e.target)}}),{threshold:.08});
  const watch=p=>{if(!p.dataset.lkSeen){p.dataset.lkSeen=1;io.observe(p)}};
  $$('.post.card').forEach(watch);
  new MutationObserver(m=>m.forEach(r=>r.addedNodes.forEach(n=>{
    if(n.nodeType===1&&n.matches?.('.post.card'))watch(n);
  }))).observe($('.feed')||document.body,{childList:true,subtree:true});

  // floating hearts when a post becomes liked (watches the class, so the one-like rule stays untouched)
  const ob=new MutationObserver(ms=>ms.forEach(m=>{
    const b=m.target;
    if(b.classList.contains('liked')&&!(m.oldValue||'').includes('liked')&&b.dataset.lkBurst!=='1'){
      const r=b.getBoundingClientRect();
      for(let i=0;i<5;i++){
        const h=document.createElement('span');h.className='lk-heart';h.textContent='♥';
        h.style.left=r.left+r.width/2+'px';h.style.top=r.top+'px';
        h.style.setProperty('--dx',(Math.random()*80-40)+'px');
        h.style.animationDelay=i*60+'ms';h.style.fontSize=18+Math.random()*14+'px';
        document.body.appendChild(h);setTimeout(()=>h.remove(),1200);
      }
    }
  }));
  const hook=b=>{if(!b.dataset.lkHook){b.dataset.lkHook=1;ob.observe(b,{attributes:true,attributeFilter:['class'],attributeOldValue:true})}};
  $$('.like-btn').forEach(hook);
  new MutationObserver(()=>$$('.like-btn').forEach(hook)).observe(document.body,{childList:true,subtree:true});

  // double-tap a photo to like (still goes through the normal button, so only 1 like is possible)
  document.addEventListener('dblclick',e=>{
    const img=e.target.closest('.post-image');if(!img)return;
    const post=img.closest('.post');const btn=$('.like-btn',post);if(!btn)return;
    const big=document.createElement('div');big.className='lk-bigheart';big.textContent='♥';
    img.appendChild(big);setTimeout(()=>big.remove(),850);
    if(!btn.classList.contains('liked'))btn.click();
  });

  // press "/" to jump to search, Esc to leave it
  addEventListener('keydown',e=>{
    const s=$('#searchInput');if(!s)return;
    if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();s.focus()}
    else if(e.key==='Escape'&&document.activeElement===s)s.blur();
  });

  // ---------- Facebook-style stories ----------
  const times={jessica:'2h',mark:'3h',alex:'5h',sofia:'8h',ryan:'11h'};
  const list=[];
  $$('.story:not(.create-story)').forEach(el=>{
    const img=$('.story-ring img',el),name=($('span',el)||{}).textContent||img.alt;
    const key=name.trim().toLowerCase();
    const photo='myday/'+key+'.jpg';
    const holder=$('.story-image',el);
    const cover=document.createElement('img');cover.className='story-cover';cover.src=photo;cover.alt=name+' story';cover.loading='lazy';
    holder.insertBefore(cover,holder.firstChild);
    list.push({el,name:name.trim(),avatar:img.src,photo,time:times[key]||'1h'});
    el.addEventListener('click',()=>openStory(list.findIndex(s=>s.el===el)));
  });

  const sv=document.createElement('div');sv.id='lk-sv';
  sv.innerHTML='<button class="sv-nav sv-prev" aria-label="Previous">‹</button><div class="sv-card"><div class="sv-bars"></div><div class="sv-head"><img alt=""><div><b></b><small></small></div><button aria-label="Close">✕</button></div><img class="sv-photo" alt=""><div class="sv-hit l"></div><div class="sv-hit r"></div><div class="sv-foot"><div class="sv-react"></div><form class="sv-reply" autocomplete="off"><input type="text" placeholder="Reply to story..." maxlength="200"><button type="submit" disabled aria-label="Send">➤</button></form></div></div><button class="sv-nav sv-next" aria-label="Next">›</button>';
  document.body.appendChild(sv);
  const bars=$('.sv-bars',sv),photo=$('.sv-photo',sv),card=$('.sv-card',sv);
  const EMO=[['👍','Like'],['❤️','Love'],['😂','Haha'],['😮','Wow'],['😢','Sad'],['😡','Angry']];
  const rbox=$('.sv-react',sv),form=$('.sv-reply',sv),inp=$('input',form),sendBtn=$('button',form);
  const RK='linka_story_reactions';
  const getR=()=>{try{return JSON.parse(localStorage.getItem(RK))||{}}catch(e){return{}}};
  const setR=o=>{try{localStorage.setItem(RK,JSON.stringify(o))}catch(e){}};
  rbox.innerHTML=EMO.map(e=>'<button type="button" data-e="'+e[0]+'" title="'+e[1]+'" aria-label="'+e[1]+'">'+e[0]+'</button>').join('');
  function markReact(){const r=getR()[list[cur].name];$$('button',rbox).forEach(b=>b.classList.toggle('on',b.dataset.e===r))}
  rbox.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const all=getR(),n=list[cur].name;
    if(all[n]===b.dataset.e){delete all[n]}else{all[n]=b.dataset.e;
      for(let i=0;i<6;i++){const f=document.createElement('span');f.className='sv-fly';f.textContent=b.dataset.e;
        f.style.setProperty('--dx',(Math.random()*160-80)+'px');f.style.animationDelay=i*90+'ms';card.appendChild(f);setTimeout(()=>f.remove(),1500)}}
    setR(all);markReact();
  });
  inp.addEventListener('input',()=>sendBtn.disabled=!inp.value.trim());
  inp.addEventListener('focus',()=>paused=true);inp.addEventListener('blur',()=>paused=false);
  form.addEventListener('submit',e=>{
    e.preventDefault();const t=inp.value.trim();if(!t)return;
    const m=document.createElement('div');m.className='sv-sent';m.textContent=t;card.appendChild(m);setTimeout(()=>m.remove(),3000);
    inp.value='';sendBtn.disabled=true;
    window.LINKA_UI&&LINKA_UI.toast('Reply sent to '+list[cur].name);
  });
  ['mousedown','touchstart','keydown'].forEach(ev=>$('.sv-foot',sv).addEventListener(ev,e=>e.stopPropagation()));
  let cur=0,timer=null,start=0,elapsed=0,DUR=5000,paused=false,raf=0;

  function render(){
    const s=list[cur];
    bars.innerHTML=list.map((_,i)=>'<div class="sv-bar'+(i<cur?' done':'')+'"><i></i></div>').join('');
    $('.sv-head img',sv).src=s.avatar;$('.sv-head b',sv).textContent=s.name;$('.sv-head small',sv).textContent=s.time;
    photo.src=s.photo;photo.alt=s.name+"'s story";
    s.el.classList.add('viewed');markReact();inp.value='';sendBtn.disabled=true;
    elapsed=0;start=performance.now();cancelAnimationFrame(raf);tick();
  }
  function tick(){
    raf=requestAnimationFrame(()=>{
      const now=performance.now();
      if(paused){start=now-elapsed}else{elapsed=now-start}
      const f=$('.sv-bar:nth-child('+(cur+1)+') i',bars);if(f)f.style.width=Math.min(elapsed/DUR*100,100)+'%';
      if(elapsed>=DUR){next();return}
      tick();
    });
  }
  function openStory(i){cur=Math.max(0,i);sv.classList.add('open');document.body.style.overflow='hidden';render()}
  function closeStory(){sv.classList.remove('open');cancelAnimationFrame(raf);document.body.style.overflow=''}
  function next(){cur<list.length-1?(cur++,render()):closeStory()}
  function prev(){cur>0?(cur--,render()):render()}
  $('.sv-hit.r',sv).onclick=next;$('.sv-hit.l',sv).onclick=prev;
  $('.sv-next',sv).onclick=next;$('.sv-prev',sv).onclick=prev;
  $('.sv-head button',sv).onclick=closeStory;
  sv.addEventListener('click',e=>{if(e.target===sv)closeStory()});
  // hold to pause, like Facebook
  ['mousedown','touchstart'].forEach(ev=>card.addEventListener(ev,e=>{if(!e.target.closest('.sv-foot'))paused=true},{passive:true}));
  ['mouseup','mouseleave','touchend'].forEach(ev=>card.addEventListener(ev,()=>{if(document.activeElement!==inp)paused=false}));
  addEventListener('keydown',e=>{
    if(!sv.classList.contains('open'))return;if(document.activeElement===inp&&e.key!=='Escape')return;
    if(e.key==='Escape')closeStory();else if(e.key==='ArrowRight')next();else if(e.key==='ArrowLeft')prev();
  });

  // ---------- Audience (Public / Friends / Only me) + edit own posts ----------
  const AUD={public:['🌎','Public','Anyone on or off LINKA'],friends:['👥','Friends','Only your friends'],me:['🔒','Only me','Just you can see this']};
  let chosen='public';
  let pop=null;
  const closePop=()=>{pop&&pop.remove();pop=null};
  document.addEventListener('click',e=>{if(pop&&!e.target.closest('.aud-pop,.aud-btn,.aud-pick,.more-button'))closePop()},true);
  addEventListener('keydown',e=>{if(e.key==='Escape')closePop()});
  addEventListener('scroll',closePop,{passive:true});

  function popup(anchor,html,onPick){
    closePop();
    pop=document.createElement('div');pop.className='aud-pop';pop.innerHTML=html;document.body.appendChild(pop);
    const r=anchor.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;
    pop.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';
    pop.style.top=(r.bottom+h+12>innerHeight?Math.max(8,r.top-h-6):r.bottom+6)+'px';
    pop.addEventListener('click',e=>{const b=e.target.closest('button');if(b){e.stopPropagation();onPick(b.dataset.v)}});
  }
  const audHTML=cur=>Object.entries(AUD).map(([k,v])=>'<button data-v="'+k+'" class="'+(k===cur?'on':'')+'"><span class="ico">'+v[0]+'</span><span><b>'+v[1]+'</b><small>'+v[2]+'</small></span></button>').join('');

  // 1) picker inside the "Create a post" window
  const mu=$('.modal-user>div>span');
  if(mu){
    const pick=document.createElement('button');pick.type='button';pick.className='aud-pick';
    const paint=()=>pick.textContent=AUD[chosen][0]+' '+AUD[chosen][1]+' ▾';paint();
    mu.replaceWith(pick);
    pick.onclick=e=>{e.stopPropagation();popup(pick,audHTML(chosen),v=>{chosen=v;paint();closePop()})};
  }

  // 2) own posts get a clickable audience icon
  const isMine=p=>/^darcy/i.test(($('.post-user strong',p)||{}).textContent||'');
  function setAud(p,k){
    p.dataset.aud=k;const b=$('.aud-btn',p);
    if(b){b.textContent=AUD[k][0];b.title=AUD[k][1]+' - tap to change'}
  }
  function decorate(p){
    if(p.dataset.audReady||!isMine(p))return;
    const meta=$('.post-meta',p);if(!meta)return;
    const m=meta.textContent.match(/(🌎|👥|🔒)\s*$/);
    p.dataset.audReady=1;
    const b=document.createElement('button');b.type='button';b.className='aud-btn';
    meta.innerHTML=meta.innerHTML.replace(/(🌎|👥|🔒)\s*$/,'')+(m?'':' · ');
    meta.appendChild(b);
    const k=p.dataset.pendingAud||(m&&Object.keys(AUD).find(x=>AUD[x][0]===m[1]))||'public';
    setAud(p,k);
    b.onclick=e=>{e.stopPropagation();popup(b,audHTML(p.dataset.aud),v=>{setAud(p,v);closePop();window.LINKA_UI&&LINKA_UI.toast('Post audience: '+AUD[v][1])})};
  }
  // new post: apply the audience picked in the create window
  $('#publishPost')&&$('#publishPost').addEventListener('click',()=>setTimeout(()=>{
    const first=$('.create-post');const p=first&&first.nextElementSibling;
    if(p&&p.matches('.post.card')&&!p.dataset.audReady){p.dataset.pendingAud=chosen;decorate(p)}
  },0));
  $$('.post.card').forEach(decorate);
  new MutationObserver(ms=>ms.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1&&n.matches?.('.post.card'))setTimeout(()=>decorate(n),0)}))).observe($('.feed')||document.body,{childList:true});

  // 3) own post "•••" menu: Edit post / Change audience / Delete
  document.addEventListener('click',e=>{
    const mb=e.target.closest('.more-button');if(!mb)return;
    const p=mb.closest('.post');if(!p||!isMine(p))return;
    e.preventDefault();e.stopImmediatePropagation();
    popup(mb,
      '<button data-v="edit"><span class="ico">✎</span><b>Edit post</b></button>'+
      '<button data-v="aud"><span class="ico">'+AUD[p.dataset.aud||'public'][0]+'</span><span><b>Edit audience</b><small>'+AUD[p.dataset.aud||'public'][1]+'</small></span></button><hr>'+
      '<button data-v="del" class="danger"><span class="ico">🗑</span><b>Delete post</b></button>',
      v=>{
        if(v==='aud'){popup(mb,audHTML(p.dataset.aud||'public'),k=>{setAud(p,k);closePop();window.LINKA_UI&&LINKA_UI.toast('Post audience: '+AUD[k][1])});return}
        closePop();
        if(v==='del'){if(confirm('Delete this post?'))p.remove();return}
        if(v==='edit')editPost(p);
      });
  },true);

  function editPost(p){
    const para=$('.post-content p',p);if(!para||$('.edit-box',p))return;
    const old=para.textContent;
    const ta=document.createElement('textarea');ta.className='edit-box';ta.value=old;
    const row=document.createElement('div');row.className='edit-row';
    row.innerHTML='<button type="button" class="cancel">Cancel</button><button type="button" class="save">Save</button>';
    para.style.display='none';para.after(ta);ta.after(row);ta.focus();ta.setSelectionRange(old.length,old.length);
    const done=()=>{ta.remove();row.remove();para.style.display=''};
    $('.cancel',row).onclick=done;
    $('.save',row).onclick=()=>{
      const t=ta.value.trim();if(!t){ta.focus();return}
      para.textContent=t;done();
      const meta=$('.post-meta',p);
      if(t!==old&&meta&&!meta.dataset.edited){meta.dataset.edited=1;meta.insertBefore(document.createTextNode(' · Edited '),$('.aud-btn',meta))}
      window.LINKA_UI&&LINKA_UI.toast('Post updated');
    };
    ta.addEventListener('keydown',e=>{if(e.key==='Escape')done();else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))$('.save',row).click()});
  }
})();
