/* LINKA connect layer: wires every button/page that had no action. Loaded after ui.js on every page. */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const UI=()=>window.LINKA_UI;
  const toast=m=>UI()?UI().toast(m):alert(m);
  const show=(t,b,a)=>UI().show(t,b,a||'');
  const close=()=>UI().close();
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const txt=el=>(el.innerText||el.getAttribute('aria-label')||el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
  const go=u=>{location.href=u};

  // small styles used by this layer
  const st=document.createElement('style');st.textContent=`
  .lk-pop{position:fixed;z-index:10070;background:#fff;border:1px solid #e3ebf7;border-radius:14px;padding:6px;box-shadow:0 18px 50px rgba(8,43,103,.25);max-height:320px;overflow:auto;min-width:210px}
  .lk-pop button{display:flex;gap:10px;align-items:center;width:100%;border:0;background:transparent;padding:9px 12px;border-radius:10px;cursor:pointer;font:inherit;font-size:14px;color:#10213f;text-align:left}
  .lk-pop button:hover{background:#f0f6ff}
  .lk-comment{display:flex;gap:10px;padding:8px 18px 4px;animation:lkc .3s ease both}
  .lk-comment img{width:32px;height:32px;border-radius:50%;object-fit:cover}
  .lk-comment div{background:#f0f4fa;border-radius:16px;padding:8px 13px;font-size:14px}
  .lk-comment b{display:block;font-size:13px}
  @keyframes lkc{from{opacity:0;transform:translateY(8px)}}
  .lk-attach{position:relative;margin:8px 0}.lk-attach img{width:100%;max-height:220px;object-fit:cover;border-radius:12px}
  .lk-attach button{position:absolute;top:8px;right:8px;width:30px;height:30px;border:0;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;cursor:pointer}
  .lk-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid #edf0f4}.lk-row:last-child{border:0}
  body.dark .lk-pop{background:#172033;border-color:#253149}body.dark .lk-pop button{color:#f8fafc}body.dark .lk-pop button:hover{background:#1f2c45}
  body.dark .lk-comment div{background:#1b2740;color:#f8fafc}`;
  document.head.appendChild(st);

  // popup helper
  let pop=null;const closePop=()=>{pop&&pop.remove();pop=null};
  function popup(anchor,items,pick){
    closePop();pop=document.createElement('div');pop.className='lk-pop';
    pop.innerHTML=items.map(i=>'<button data-v="'+esc(i[0])+'">'+i[1]+'</button>').join('');
    document.body.appendChild(pop);popAt=Date.now();
    const r=anchor.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;
    pop.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';
    pop.style.top=(r.bottom+h+10>innerHeight?Math.max(8,r.top-h-6):r.bottom+6)+'px';
    pop.onclick=e=>{const b=e.target.closest('button');if(b){e.stopPropagation();pick(b.dataset.v);closePop()}};
  }
  document.addEventListener('click',e=>{if(pop&&!e.target.closest('.lk-pop'))closePop()},true);
  let popAt=0;addEventListener('scroll',()=>{if(Date.now()-popAt>700)closePop()},{passive:true});

  const copy=t=>{try{navigator.clipboard.writeText(t)}catch(e){const i=document.createElement('input');i.value=t;document.body.appendChild(i);i.select();document.execCommand('copy');i.remove()}};
  const pickFile=cb=>{const f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=()=>{const file=f.files[0];if(!file)return;const r=new FileReader();r.onload=()=>cb(r.result,file);r.readAsDataURL(file)};f.click()};

  // ---------- post-modal extras (photo / feeling / location) ----------
  let attached=null;
  const FEEL=[['😊 Happy'],['😍 Loved'],['🤩 Excited'],['😎 Cool'],['😴 Tired'],['🥳 Celebrating'],['🙏 Grateful'],['😢 Sad']];
  const ACT=[['✈️ Traveling'],['🍕 Eating'],['🎧 Listening to music'],['🎮 Playing games'],['💻 Working'],['📚 Reading']];
  const PLACES=[['📍 Olongapo City'],['📍 Subic Bay'],['📍 Manila'],['📍 Baguio'],['📍 At home']];
  function addToText(s){const t=$('#postText');if(!t)return;const cur=t.value.replace(/\s+$/,'');t.value=cur?cur+' — '+s:s.charAt(0).toUpperCase()+s.slice(1);t.focus()}
  function attachPhoto(){
    pickFile(src=>{attached=src;let box=$('.lk-attach');if(!box){box=document.createElement('div');box.className='lk-attach';box.innerHTML='<img alt="Attached photo"><button type="button" aria-label="Remove">✕</button>';$('#postText').after(box);box.querySelector('button').onclick=()=>{attached=null;box.remove()}}box.querySelector('img').src=src});
  }
  function openComposer(then){
    const pi=$('.post-input');if(!pi)return go('home.html#create');
    pi.click();if(then)setTimeout(then,320);
  }
  $('#publishPost')&&$('#publishPost').addEventListener('click',()=>setTimeout(()=>{
    if(!attached)return;
    const p=$('.create-post')&&$('.create-post').nextElementSibling;
    if(p&&p.matches('.post')&&!p.dataset.pic){p.dataset.pic=1;
      const d=document.createElement('div');d.className='post-image';d.innerHTML='<img alt="Post photo" style="width:100%;display:block;border-radius:12px">';d.firstChild.src=attached;
      const c=$('.post-content',p);c&&c.after(d);}
    attached=null;const b=$('.lk-attach');b&&b.remove();
  },30));

  // ---------- comments ----------
  function addComment(input){
    const v=input.value.trim();if(!v)return;
    const post=input.closest('.post,article');const area=input.closest('.comment-area');if(!post||!area)return;
    const c=document.createElement('div');c.className='lk-comment';
    c.innerHTML='<img src="Profile/darcy.jpg" alt="Darcy"><div><b>Darcy Og</b>'+esc(v)+'</div>';
    area.after(c);input.value='';
    const spans=$$('.post-stats span',post);
    spans.forEach(s=>{const m=s.textContent.match(/(\d+)\s+comments?/);if(m&&s.children.length===0)s.textContent=s.textContent.replace(/(\d+)(\s+comments?)/,(a,n)=>(+n+1)+' comment'+(+n+1===1?'':'s'))});
  }
  document.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&e.target.matches('.comment-area input')){e.preventDefault();e.stopImmediatePropagation();addComment(e.target)}
  },true);

  // ---------- share ----------
  function share(btn){
    popup(btn,[['copy','🔗 Copy link'],['msg','💬 Send in a message'],['story','✨ Share to your story'],['feed','📝 Share to your profile']],v=>{
      if(v==='copy'){copy(location.href.split('#')[0]);toast('Link copied')}
      else if(v==='msg')go('messages.html');
      else if(v==='story')toast('Shared to your story');
      else toast('Shared to your profile');
    });
  }

  // ---------- saved posts ----------
  let lastPost=null;
  function savePost(p){
    if(!p)return toast('Post saved');
    const t=(($('.post-content p',p)||{}).textContent||'').trim().slice(0,160);
    const who=(($('.post-user strong',p)||{}).textContent||'Someone').trim();
    const all=store.get('linka_saved',[]);all.unshift({t,who});store.set('linka_saved',all.slice(0,50));toast('Post saved');
  }

  // ---------- modals for settings-type pages ----------
  const sheet=(title,rows,empty)=>show(title,rows.length?'<div class="ui-list">'+rows.join('')+'</div>':'<div class="ui-empty">'+empty+'</div>');
  const item=(i,a,b)=>'<div class="ui-list-item"><div class="ui-icon">'+i+'</div><div><strong>'+a+'</strong><small>'+b+'</small></div></div>';

  const actions={
    'view saved posts':()=>{const s=store.get('linka_saved',[]);sheet('Saved posts',s.map(x=>item('🔖',esc(x.who),esc(x.t||'(photo post)'))),'No saved posts yet. Tap ••• on any post and choose Save post.')},
    'view media':()=>sheet('Saved media',[],'No saved photos or videos yet.'),
    'view links':()=>sheet('Saved links',[],'No saved links yet.'),
    'view people':()=>go('connections.html'),
    'browse communities':()=>sheet('Communities',[
      '<a class="ui-list-item" href="gaming.html" style="text-decoration:none"><div class="ui-icon">🎮</div><div><strong>Gaming</strong><small>Gamers, streams and events</small></div></a>',
      '<a class="ui-list-item" href="music.html" style="text-decoration:none"><div class="ui-icon">🎵</div><div><strong>Music Lovers</strong><small>Share and discover music</small></div></a>',
      '<a class="ui-list-item" href="creative-hub.html" style="text-decoration:none"><div class="ui-icon">🎨</div><div><strong>Creative Hub</strong><small>Design, art and ideas</small></div></a>'],''),
    'start community':()=>show('Start a community','<div class="ui-form"><div class="ui-field"><label>Community name</label><input id="lkCN" placeholder="e.g. Photography Club"></div><div class="ui-field"><label>Description</label><textarea id="lkCD" placeholder="What is this community about?"></textarea></div><div class="ui-field"><label>Privacy</label><select id="lkCP"><option>Public</option><option>Private</option></select></div></div>','<div class="ui-actions"><button class="ui-btn soft ui-close-action">Cancel</button><button class="ui-btn primary" id="lkCreateC">Create community</button></div>'),
    'manage':()=>{const b=store.get('linka_blocked',[]);show('Blocked accounts',b.length?'<div class="ui-list">'+b.map((n,i)=>'<div class="ui-list-item"><div class="ui-icon">⛔</div><div style="flex:1"><strong>'+esc(n)+'</strong><small>Blocked</small></div><button class="ui-btn soft" data-unblock="'+i+'">Unblock</button></div>').join('')+'</div>':'<div class="ui-empty">You have not blocked anyone.</div>')},
    'review':()=>sheet('Login activity',[item('💻','Chrome on Windows','Olongapo, PH · Active now'),item('📱','LINKA mobile','Olongapo, PH · Yesterday')],''),
    'set up':()=>show('Two-factor authentication','<div class="ui-empty">Protect your account with a 6-digit code each time you log in.</div>','<div class="ui-actions"><button class="ui-btn soft ui-close-action">Not now</button><button class="ui-btn primary" id="lkTwoFA">Turn on</button></div>'),
    'open guide':()=>sheet('Getting started',[item('1','Create your profile','Add a photo and a short bio.'),item('2','Connect with people','Find friends in Connections.'),item('3','Share your day','Post, add stories and react.')],''),
    'safety center':()=>sheet('Safety center',[item('🛡️','Block and report','Use ••• on any post or chat.'),item('🔒','Privacy','Choose who sees your posts.'),item('🔑','Strong password','Use 12+ characters.')],''),
    'contact us':()=>show('Contact us','<div class="ui-form"><div class="ui-field"><label>How can we help?</label><textarea id="lkHelp" placeholder="Describe your issue..."></textarea></div></div>','<div class="ui-actions"><button class="ui-btn soft ui-close-action">Cancel</button><button class="ui-btn primary" id="lkSendHelp">Send</button></div>'),
    'save changes':()=>toast('Changes saved')
  };

  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a,div.story,.setting-row,[role=button]');
    // modal buttons
    const t=e.target;
    if(t.closest('#lkCreateC')){const n=($('#lkCN')||{}).value;if(!n||!n.trim()){$('#lkCN').focus();return}close();toast('Community "'+n.trim()+'" created');return}
    if(t.closest('#lkTwoFA')){close();toast('Two-factor authentication turned on');return}
    if(t.closest('#lkSendHelp')){const v=($('#lkHelp')||{}).value;if(!v||!v.trim()){$('#lkHelp').focus();return}close();toast('Message sent. We will reply soon.');return}
    const ub=t.closest('[data-unblock]');if(ub){const b=store.get('linka_blocked',[]);b.splice(+ub.dataset.unblock,1);store.set('linka_blocked',b);ub.closest('.ui-list-item').remove();toast('Unblocked');return}
    if(t.closest('#lkBlock')){const n=($('#chatName')||$('.chat-header strong')||{}).textContent||'User';const b=store.get('linka_blocked',[]);b.push(n.trim());store.set('linka_blocked',b);close();toast(n.trim()+' blocked');return}
    if(t.closest('[data-action="save"]')){e.preventDefault();e.stopImmediatePropagation();savePost(lastPost);close();return}
    if(t.closest('[data-action="copy"]')){e.preventDefault();e.stopImmediatePropagation();copy(location.href);toast('Link copied');close();return}
    if(!el)return;
    if(el.closest('.more-button'))lastPost=el.closest('.post,article');
    const label=txt(el);

    // brand / home nav on home page
    if(page==='home.html'&&el.matches('a[href="#"]')){e.preventDefault();scrollTo({top:0,behavior:'smooth'});return}
    // header icon buttons
    if(el.matches('.icon-btn')){
      if(label.includes('notification')){e.preventDefault();go('notifications.html');return}
      if(label.includes('message')){e.preventDefault();go('messages.html');return}
    }
    if(el.matches('.small-edit')){e.preventDefault();const eb=$('#editProfileBtn');eb&&eb.click();return}
    if(el.matches('.profile-mini')){e.preventDefault();go('profile.html');return}

    // home / profile composer shortcuts
    if(el.matches('.create-story')){e.preventDefault();e.stopImmediatePropagation();UI().openType('story');return}
    if(el.matches('.post-action,.post-input')&&!el.closest('.post-modal')&&page==='profile.html'){e.preventDefault();e.stopImmediatePropagation();go('home.html#create');return}
    if(el.matches('.post-action')&&page==='home.html'){
      e.stopImmediatePropagation();
      if(el.matches('.photo-action')||label.includes('photo'))openComposer(attachPhoto);
      else if(label.includes('feeling'))openComposer(()=>{const b=$$('.modal-options button').find(x=>txt(x).includes('feeling'));popup(b||el,FEEL,v=>addToText('feeling '+v))});
      else openComposer(()=>{const b=$$('.modal-options button').find(x=>txt(x).includes('feeling'));popup(b||el,ACT,v=>addToText(v))});
      return;
    }
    // inside the post modal
    if(el.closest('.modal-options')){
      e.stopImmediatePropagation();
      if(label.includes('photo'))attachPhoto();
      else if(label.includes('feeling'))popup(el,FEEL,v=>addToText('feeling '+v));
      else if(label.includes('location'))popup(el,PLACES,v=>addToText('at '+v));
      return;
    }

    // post actions
    const act=el.closest('.post-actions');
    if(act&&!el.matches('.like-btn')){
      const post=el.closest('.post,article');
      if(label.includes('comment')){const i=$('.comment-area input',post);i&&(i.scrollIntoView({block:'center',behavior:'smooth'}),i.focus());return}
      if(label.includes('share')){e.stopImmediatePropagation();share(el);return}
    }

    // trends "Show more"
    if(el.matches('.show-more')){
      const more=[['TRAVEL','#Subic','8 posts'],['MUSIC','#NewRelease','5 posts'],['GAMING','#WeekendRanked','7 posts']];
      more.forEach(m=>{const d=document.createElement('div');d.className='trend';d.innerHTML='<span class="trend-category">'+m[0]+' · TRENDING</span><strong>'+m[1]+'</strong><small>'+m[2]+'</small>';el.before(d)});
      el.remove();return;
    }

    // profile photo / cover
    if(el.matches('.edit-cover')){e.preventDefault();pickFile(src=>{const c=$('.cover-photo');c.style.backgroundImage='url('+src+')';c.style.backgroundSize='cover';c.style.backgroundPosition='center';const p=$('.cover-pattern');p&&(p.style.display='none');toast('Cover photo updated')});return}
    if(el.matches('.avatar-edit')){e.preventDefault();pickFile(src=>{$$('#heroAvatar img,.profile-avatar img,.profile-mini img').forEach(i=>i.src=src);toast('Profile photo updated')});return}

    // chat info panel
    if(el.matches('.info-option')){
      if(label.startsWith('shared media')){sheet('Shared media',[],'No shared media yet.');return}
      if(label.startsWith('shared files')){sheet('Shared files',[],'No shared files yet.');return}
      if(label.includes('shared links')){sheet('Shared links',[],'No shared links yet.');return}
      if(label.includes('mute')){const on=el.dataset.m!=='1';el.dataset.m=on?1:0;el.textContent=on?'🔔 Unmute conversation':'🔕 Mute conversation';toast(on?'Conversation muted':'Conversation unmuted');return}
      if(label.startsWith('notifications')){const off=el.dataset.n!=='1';el.dataset.n=off?1:0;el.textContent=off?'Notifications · Off':'Notifications · On';toast(off?'Notifications off for this chat':'Notifications on');return}
    }
    if(el.matches('.danger-option')){e.preventDefault();show('Block user?','<div class="ui-empty">They will no longer be able to message you or see your profile.</div>','<div class="ui-actions"><button class="ui-btn soft ui-close-action">Cancel</button><button class="ui-btn danger" id="lkBlock">Block</button></div>');return}

    // settings rows: tap anywhere to toggle
    if(el.matches('.setting-row')&&!el.matches('a')&&!t.closest('.switch')){const i=$('.switch input',el);if(i){i.click();return}}

    // privacy "Enabled" toggle
    if(page==='privacy.html'&&el.matches('button.secondary')){const on=label==='enabled';el.textContent=on?'Disabled':'Enabled';toast(on?'Turned off':'Turned on');return}

    // connect buttons without the .connect-btn class
    if(page==='connections.html'&&el.matches('button')&&(label==='connect'||label==='connected'||label==='pending')){
      e.stopImmediatePropagation();el.textContent=label==='connect'?'Connected':'Connect';toast(label==='connect'?'Connection added':'Connection removed');return}

    // generic labelled actions
    if(el.matches('button')&&actions[label]){e.preventDefault();actions[label]();return}
  },true);

  // profile: send everything composer-like to the home composer
  if(page==='profile.html'){$$('.post-input,.create-actions button').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();go('home.html#create')}))}
})();
