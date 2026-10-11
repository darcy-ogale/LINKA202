(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  let overlay;
  const esc = s => String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function close(){ if(overlay) overlay.classList.remove('open'); }
  function show(title, body, actions=''){ 
    if(!overlay){ overlay=document.createElement('div'); overlay.className='ui-overlay'; document.body.appendChild(overlay); }
    overlay.innerHTML=`<div class="ui-modal" role="dialog" aria-modal="true"><div class="ui-head"><h2>${title}</h2><button class="ui-close" aria-label="Close">×</button></div><div class="ui-body">${body}</div>${actions?`<div class="ui-body" style="padding-top:0">${actions}</div>`:''}</div>`;
    overlay.classList.add('open');
    $('.ui-close',overlay).onclick=close;
    overlay.onclick=e=>{if(e.target===overlay)close()};
  }
  function toast(msg){const t=document.createElement('div');t.className='ui-toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}
  function form(type){
    const data={
      story:['Add to story',`<div class="ui-form"><div class="ui-field"><label>Story media</label><input type="file" accept="image/*,video/*"></div><div class="ui-field"><label>Caption</label><textarea placeholder="Add a caption..."></textarea></div></div>`,`<div class="ui-actions"><button class="ui-btn soft ui-close-action">Cancel</button><button class="ui-btn primary ui-submit">Share story</button></div>`],
      message:['New message',`<div class="ui-form"><div class="ui-field"><label>To</label><input placeholder="Search people..."></div><div class="ui-field"><label>Message</label><textarea placeholder="Write a message..."></textarea></div></div>`,`<div class="ui-actions"><button class="ui-btn soft ui-close-action">Cancel</button><button class="ui-btn primary ui-submit">Start chat</button></div>`],
      edit:['Edit profile',`<div class="ui-profile-edit"><div class="ui-profile-photo"><img src="Profile/darcy.jpg"><button class="ui-btn soft">Change photo</button></div><div class="ui-form"><div class="ui-field"><label>Full name</label><input value="Darcy"></div><div class="ui-field"><label>Username</label><input value="@darcy"></div><div class="ui-field"><label>Bio</label><textarea>Living, creating, and connecting on LINKA.</textarea></div><div class="ui-field"><label>Location</label><input placeholder="Add location"></div></div></div>`,`<div class="ui-actions"><button class="ui-btn soft ui-close-action">Cancel</button><button class="ui-btn primary ui-submit">Save changes</button></div>`],
      forgot:['Reset password',`<div class="ui-form"><div class="ui-field"><label>Email or username</label><input type="email" placeholder="you@example.com"></div></div>`,`<div class="ui-actions"><button class="ui-btn soft ui-close-action">Cancel</button><button class="ui-btn primary ui-submit">Continue</button></div>`],
      search:['Search LINKA',`<div class="ui-form"><div class="ui-field"><label>Search</label><input autofocus placeholder="People, posts, groups, pages..."></div><div class="ui-list"><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></div><div><strong>Popular searches</strong><small>Profiles, posts and communities will appear here.</small></div></div></div></div>`],
      call:['Start call',`<div class="ui-list"><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><path d="M6.5 4.5l3 1.5-1.5 4-2-1c1.2 3.2 3.3 5.3 6.5 6.5l-1-2 4-1.5 1.5 3c.3.7 0 1.5-.7 1.8-1.3.6-2.6.7-4 .2-6-2-10-6-12-12-.5-1.4-.4-2.7.2-4 .3-.7 1.1-1 1.8-.7z"/></svg></div><div><strong>Voice call</strong><small>Ready for your calling function.</small></div></div><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 12l3-2 3 2-3 2z"/></svg></div><div><strong>Video call</strong><small>Ready for your video function.</small></div></div></div>`],
      info:['Conversation details',`<div class="ui-list"><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19c.5-3.3 2.3-5 5.5-5s5 1.7 5.5 5M14 15c2.8 0 4.5 1.3 5 4"/></svg></div><div><strong>Members</strong><small>Conversation participants</small></div></div><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></div><div><strong>Notifications</strong><small>Manage alerts for this chat</small></div></div><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg></div><div><strong>Shared media</strong><small>Photos, files and links</small></div></div><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><path d="M12 4l9 16H3L12 4z"/><path d="M12 9v5M12 17h.01"/></svg></div><div><strong>Report conversation</strong><small>Safety and moderation</small></div></div></div>`],
      settings:['Settings',`<div class="ui-list"><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"/></svg></div><div><strong>Account</strong><small>Profile, username and contact details</small></div></div><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div><div><strong>Privacy & security</strong><small>Password, visibility and blocked accounts</small></div></div><div class="ui-list-item"><div class="ui-icon"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></div><div><strong>Notifications</strong><small>Control your LINKA alerts</small></div></div></div>`],
      createAccount:['Create your LINKA account',`<div class="ui-form"><div class="ui-field"><label>Full name</label><input placeholder="Your name"></div><div class="ui-field"><label>Email</label><input type="email" placeholder="you@example.com"></div><div class="ui-field"><label>Password</label><input type="password" placeholder="Create a password"></div><div class="ui-field"><label>Date of birth</label><input type="date"></div></div>`,`<div class="ui-actions"><button class="ui-btn primary ui-submit">Create account</button></div>`]
    }; return data[type];
  }
  function openType(type){const d=form(type);if(!d)return;show(d[0],d[1],d[2]);}
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-ui]'); if(a){e.preventDefault();openType(a.dataset.ui);return;}
    const text=(e.target.textContent||'').trim().toLowerCase();
    if(e.target.closest('.ui-close-action')){close();return}
    if(e.target.closest('.ui-submit')){toast('UI ready — connect your function here.');close();return}
    if(e.target.closest('.more-button,.post-more,.more')){e.preventDefault();show('Post options',`<div class="ui-menu"><button data-action="save">🔖 Save post</button><button data-action="edit">✎ Edit post</button><button data-action="share">↗ Share post</button><button data-action="copy">🔗 Copy link</button><button class="danger">⚑ Report post</button></div>`);return}
    if(e.target.closest('.like-btn')){return}
    if(e.target.closest('.accept')){e.target.closest('.accept').textContent='Connected';toast('Connection UI updated.');return}
    if(e.target.closest('.connect-btn')){const b=e.target.closest('.connect-btn');b.textContent=b.textContent.toLowerCase().includes('connected')?'Connect':'Connected';return}
    if(e.target.closest('#notificationBtn')) return;
    if(text==='add story'||e.target.closest('.add-story')){e.preventDefault();openType('story');return}
    if(text==='view all'||text==='see all'){show('See all',`<div class="ui-empty">This full list UI is ready for your data/function.</div>`);return}
    if(e.target.closest('#infoBtn')){openType('info');return}
    if(e.target.closest('.chat-action')){openType('call');return}
    if(e.target.closest('#globalSearch')||e.target.matches('input[placeholder="Search"]')){if(e.target.tagName==='INPUT')return;openType('search');return}
    if(e.target.closest('.setting-row.link-row[href="#"]')){e.preventDefault();show('Settings section',`<div class="ui-list"><div class="ui-list-item"><div class="ui-icon">✓</div><div><strong>Interface ready</strong><small>Connect this section to your real settings function.</small></div></div></div>`);return}
    const clickedLink=e.target.closest('a');
    const linkText=clickedLink?(clickedLink.textContent||'').trim().toLowerCase():'';
    if(clickedLink && linkText.includes('forgot password')){e.preventDefault();openType('forgot');return}
    if(clickedLink && (linkText.includes('create account')||linkText.includes('sign up'))){e.preventDefault();openType('createAccount');return}
    if(e.target.closest('.social-button')){e.preventDefault();show('Continue with provider',`<div class="ui-empty">Social sign-in interface is ready. Connect the provider function here.</div>`);return}
    if(text==='•••' && e.target.closest('button')){show('More options',`<div class="ui-menu"><button>Open</button><button>Mute</button><button class="danger">Report</button></div>`);return}
    if(e.target.closest('.composer-icon')||e.target.closest('.emoji-btn')){show('Message tools',`<div class="ui-tabs"><button class="ui-tab active">Photos</button><button class="ui-tab">Files</button><button class="ui-tab">GIFs</button><button class="ui-tab">Emoji</button></div><div class="ui-empty">Choose an item to attach. Function can be connected later.</div>`);return}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    // Convert common existing controls into UI-enabled actions without changing their markup.
    $$('a[href="#"]').forEach(a=>{const t=(a.textContent||'').trim().toLowerCase();if(t.includes('forgot'))a.dataset.ui='forgot';if(t.includes('create account')||t.includes('sign up'))a.dataset.ui='createAccount';});
    $$('input[placeholder="Search"]').forEach(i=>{const wrap=i.parentElement;if(wrap && !wrap.dataset.searchReady){wrap.dataset.searchReady='1';}});
  });

  document.addEventListener('keydown',e=>{
    if(e.key==='Enter' && e.target.matches('input[placeholder="Write a comment..."]') && e.target.value.trim()){toast('Comment UI ready — connect comment storage here.');e.target.value='';}
  });
  window.LINKA_UI={show,close,toast,openType};
})();
