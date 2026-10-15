history.scrollRestoration = 'manual';
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const preloader = $('#preloader');
  const cover = $('#cover');
  const openInvite = $('#openInvite');
  const skipIntro = $('#skipIntro');
  const main = $('#main');
  const reveal = $('#siteReveal');
  const handoffPaper = $('#handoffPaper');
  const envelopeVideo = $('#envelopeVideo');
  const coverStatus = $('#coverStatus');
  const music = $('#bgMusic');
  const musicToggle = $('#musicToggle');
  const musicIcon = $('#musicIcon');
  let toastTimer;
  const announce = (message) => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  };

  // Keep preloader over media only until basic resources are ready.
  const ready = () => setTimeout(() => preloader.classList.add('loaded'), 150);
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready, { once: true });
  setTimeout(() => preloader.classList.add('loaded'), 2400);

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .08, rootMargin: '0px 0px -16px 0px' })
    : null;
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.closest('.hero')) return;
    if (observer) observer.observe(el);
    else el.classList.add('revealed');
  });

  const DURATION = 7.5;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const mix = (a,b,t) => a + (b - a) * t;
  const ease = (a,b,t) => {
    const p = clamp((t-a)/(b-a),0,1);
    return p*p*p*(p*(p*6-15)+10);
  };
  // The moving aperture is calibrated to the card's 1080×1920 pixel coordinates.
  // Sizing uses object-fit:contain exactly as the MP4 poster and video do.
  function geometryAt(t,w,h) {
    const s = Math.min(w/1080,h/1920);
    const ox=(w-1080*s)/2, oy=(h-1920*s)/2;
    const camera=9-.14*ease(0,1.5,t)-.03*ease(1.5,5.5,t);
    const lift=ease(3.65,5.5,t), push=ease(5.5,7.2,t);
    const depth=.023+.77*lift+4.15*push;
    const y=-.31*lift*(1-push);
    const projection=4212/(camera-depth);
    const cardW=1.87*projection*s*.83, cardH=2.82*projection*s*.79;
    const cx=ox+540*s, cy=oy+(940+y*projection)*s;
    const l=clamp(cx-cardW/2,0,w), r=clamp(cx+cardW/2,0,w);
    const top=clamp(cy-cardH/2,0,h), bottom=clamp(cy+cardH/2,0,h);
    const merge=ease(5.95,7.18,t);
    const rect={left:mix(l,0,merge),top:mix(top,0,merge),width:mix(Math.max(1,r-l),w,merge),height:mix(Math.max(1,bottom-top),h,merge)};
    return {rect,scale:Math.max(rect.width/w,rect.height/h),opacity:ease(4.45,5.6,t),mediaOpacity:1-ease(5.55,6.9,t),paperOpacity:1-ease(4.94,6.65,t), textOpacity:ease(5.6,7.1,t)};
  }

  let phase='closed';
  let raf=null;
  let watchdog=null;
  let lastTime=0, lastAdvance=0;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let heroTextShown=false;
  const mainHeadingEls=[...document.querySelectorAll('.hero [data-reveal]')];

  function showHeroText() {
    if (heroTextShown) return;
    heroTextShown=true;
    main.classList.add('is-open');
    mainHeadingEls.forEach((el,i) => setTimeout(()=>el.classList.add('revealed'),i*100));
  }

  function applyFrame(mediaSeconds) {
    if (phase!=='playing') return;
    const bounds=cover.getBoundingClientRect();
    const w=bounds.width,h=bounds.height;
    const dur=Number.isFinite(envelopeVideo.duration)&&envelopeVideo.duration>0?envelopeVideo.duration:DURATION;
    const t=mediaSeconds*DURATION/dur;
    const state=geometryAt(t,w,h),b=state.rect;
    if (envelopeVideo.readyState >= 2) cover.classList.add('has-frame');
    // Fixed clip lives in the centered 430px mobile stage, even on wide screens.
    reveal.style.left=`${bounds.left+b.left}px`;
    reveal.style.top=`${bounds.top+b.top}px`;
    reveal.style.width=`${b.width}px`;
    reveal.style.height=`${b.height}px`;
    reveal.style.opacity=state.opacity;
    main.style.width=`${w}px`;
    main.style.height=`${h}px`;
    main.style.transform=`translate(-50%,-50%) scale(${state.scale})`;
    handoffPaper.style.opacity=state.paperOpacity;
    cover.style.opacity=state.mediaOpacity;
    main.style.setProperty('--intro-text-opacity',state.textOpacity);
    if (t>5.65) showHeroText();
    if (t>=7.30) finish(false);
  }

  function stopClock() {
    if (raf!==null) {cancelAnimationFrame(raf);raf=null;}
    if(watchdog!==null){clearInterval(watchdog);watchdog=null;}
  }
  function finish(skipped=false) {
    if(phase==='open') return;
    phase='open';
    stopClock();
    envelopeVideo.pause();
    main.style.removeProperty('--intro-text-opacity');
    main.style.removeProperty('transform');
    main.style.removeProperty('width');
    main.style.removeProperty('height');
    reveal.removeAttribute('style');
    handoffPaper.removeAttribute('style');
    cover.removeAttribute('style');
    document.documentElement.classList.add('intro-done');
    cover.hidden=true;
    cover.setAttribute('aria-hidden','true');
    main.inert=false;
    showHeroText();
    main.classList.remove('intro-playing');
    main.classList.add('visible','is-open');
    document.body.classList.remove('is-locked');
    musicToggle.hidden=false;
    window.scrollTo(0,0);
    coverStatus.textContent='Invito aperto';
  }
  function tick() {
    if(phase!=='playing')return;
    applyFrame(envelopeVideo.currentTime);
    raf=requestAnimationFrame(tick);
  }
  async function start() {
    if(phase!=='closed')return;
    if(reducedMotion || envelopeVideo.error){finish(true);return;}
    phase='playing';
    openInvite.disabled=true;
    skipIntro.hidden=false;
    cover.dataset.phase='playing';
    coverStatus.textContent='La busta si sta aprendo';
    cover.classList.add('opening');
    main.classList.add('prepared','visible','intro-playing');
    main.inert=true;
    lastTime=0;
    lastAdvance=performance.now();
    try {envelopeVideo.currentTime=0;} catch(_) {}
    applyFrame(0);
    raf=requestAnimationFrame(tick);
    watchdog=setInterval(()=>{
      if(document.hidden||phase!=='playing')return;
      if(Math.abs(envelopeVideo.currentTime-lastTime)>.015){lastTime=envelopeVideo.currentTime;lastAdvance=performance.now();}
      else if(performance.now()-lastAdvance>11000)finish(true);
    },700);
    try{await envelopeVideo.play();}
    catch(_){finish(true);}
  }
  envelopeVideo.addEventListener('ended',()=>finish(false));
  envelopeVideo.addEventListener('error',()=>{if(phase==='playing')finish(true);});
  openInvite.addEventListener('click',start);
  skipIntro.addEventListener('click',()=>finish(true));
  window.addEventListener('resize',()=>{if(phase==='playing')applyFrame(envelopeVideo.currentTime);});
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&phase==='playing')finish(true);});
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&phase==='playing'&&envelopeVideo.paused){
      envelopeVideo.play().catch(()=>finish(true));
    }
  });

  musicToggle.addEventListener('click', async () => {
    if (music.paused) {
      try {
        music.volume = 0.42;
        await music.play();
        musicToggle.classList.add('playing');
        musicToggle.setAttribute('aria-pressed', 'true');
        musicToggle.setAttribute('aria-label', 'Disattiva la musica');
        musicIcon.textContent = '♫';
      } catch (_err) {
        announce('La musica non è disponibile su questo dispositivo.');
      }
    } else {
      music.pause();
      musicToggle.classList.remove('playing');
      musicToggle.setAttribute('aria-pressed', 'false');
      musicToggle.setAttribute('aria-label', 'Attiva la musica');
      musicIcon.textContent = '♫';
    }
  });


  const womenTab = $('#tabWomen');
  const menTab = $('#tabMen');
  const showLook = (women) => {
    womenTab.classList.toggle('active', women);
    menTab.classList.toggle('active', !women);
    womenTab.setAttribute('aria-selected', String(women));
    menTab.setAttribute('aria-selected', String(!women));
    $('#lookWomen').hidden = !women;
    $('#lookMen').hidden = women;
  };
  womenTab.addEventListener('click', () => showLook(true));
  menTab.addEventListener('click', () => showLook(false));

  // Dress code: keep the original Per lei / Per lui tabs and let guests expand each image.
  const dressLightbox = $('#dressLightbox');
  const dressLightboxImage = $('#dressLightboxImage');
  const dressLightboxTitle = $('#dressLightboxTitle');
  const dressClose = dressLightbox.querySelector('.dress-lightbox__close');
  let dressReturnFocus = null;
  let dressPreviousOverflow = '';

  document.querySelectorAll('[data-dress-image]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const women = trigger.dataset.dressImage === 'women';
      dressReturnFocus = trigger;
      const previewImage = trigger.querySelector('img');
      dressLightboxImage.src = previewImage.currentSrc || previewImage.src;
      dressLightboxImage.alt = previewImage.alt;
      dressLightboxTitle.textContent = women ? 'Ispirazioni · Per lei' : 'Ispirazioni · Per lui';
      dressPreviousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dressLightbox.hidden = false;
      dressLightbox.setAttribute('aria-hidden', 'false');
      dressClose.focus({preventScroll: true});
    });
  });

  const closeDressLightbox = () => {
    if (dressLightbox.hidden) return;
    dressLightbox.hidden = true;
    dressLightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = dressPreviousOverflow;
    dressReturnFocus?.focus({preventScroll: true});
  };
  dressLightbox.querySelectorAll('[data-close-dress]').forEach((el) => {
    el.addEventListener('click', closeDressLightbox);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dressLightbox.hidden) closeDressLightbox();
  });


  const showBank = $('#showBank');
  showBank.addEventListener('click', () => {
    const details = $('#bankDetails');
    const visible = details.hidden;
    details.hidden = !visible;
    showBank.setAttribute('aria-expanded', String(visible));
    showBank.innerHTML = visible ? 'NASCONDI I DATI <span>−</span>' : 'MOSTRA I DATI PER IL REGALO <span>+</span>';
  });

  $('#copyIban').addEventListener('click', async () => {
    const iban = 'IT38Y0200816513000421389696';
    try {
      await navigator.clipboard.writeText(iban);
      announce('IBAN copiato negli appunti');
    } catch (_err) {
      announce(`IBAN: ${iban}`);
    }
  });

  const rsvpForm = $('#rsvpForm');
  const attendanceDetails = $('#attendanceDetails');
  const allergyDetails = $('#allergyDetails');
  const allergyLabel = $('#allergyLabel');
  const errorNode = $('#rsvpError');
  const selected = (name) => rsvpForm.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const showError = (message) => {
    errorNode.textContent = message;
    errorNode.hidden = false;
    errorNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  rsvpForm.addEventListener('change', () => {
    errorNode.hidden = true;
    const isPresent = selected('attendance') === 'yes';
    attendanceDetails.hidden = !isPresent;
    const hasAllergy = isPresent && selected('allergy') === 'yes';
    allergyDetails.hidden = !hasAllergy;
    allergyLabel.hidden = !hasAllergy;
  });

  rsvpForm.addEventListener('submit', (event) => {
    event.preventDefault();
    errorNode.hidden = true;
    const name = $('#guestName').value.trim().replace(/\s+/g, ' ');
    const attendance = selected('attendance');
    const menu = selected('menu');
    const allergy = selected('allergy');
    const allergyText = allergyDetails.value.trim();
    if (name.length < 2) return showError('Inserisci il tuo nome e cognome.');
    if (!attendance) return showError('Seleziona se parteciperai al matrimonio.');
    if (attendance === 'yes' && !menu) return showError('Seleziona la preferenza per il menù.');
    if (attendance === 'yes' && !allergy) return showError('Indica se hai allergie o intolleranze.');
    if (attendance === 'yes' && allergy === 'yes' && !allergyText) return showError('Specifica le allergie o intolleranze alimentari.');

    const message = [
      '💍 *RSVP — Matrimonio di Vittoria & Gabriele*',
      '📅 10 giugno 2027',
      '',
      `*Nome e cognome:* ${name}`,
      `*Partecipazione:* ${attendance === 'yes' ? 'Sì, sarò presente 🥂' : 'Purtroppo non potrò esserci'}`,
    ];
    if (attendance === 'yes') {
      message.push(`*Preferenza menù:* ${menu}`);
      message.push(`*Allergie/intolleranze:* ${allergy === 'yes' ? allergyText : 'Nessuna'}`);
    }
    message.push('', 'Grazie! ♡');
    const url = `https://wa.me/393492402586?text=${encodeURIComponent(message.join('\n'))}`;
    // This opens a pre-filled WhatsApp draft; only the guest can press Send.
    window.open(url, '_blank', 'noopener,noreferrer');
    announce('WhatsApp aperto: premi Invia per completare la conferma.');
  });

  // Italian local time: wedding date is 18:00 CEST (UTC+2).
  const weddingDate = new Date('2027-06-10T18:00:00+02:00').getTime();
  const pad = (n) => String(n).padStart(2, '0');
  const updateCountdown = () => {
    const seconds = Math.max(0, Math.floor((weddingDate - Date.now()) / 1000));
    $('#cdDays').textContent = Math.floor(seconds / 86400);
    $('#cdHours').textContent = pad(Math.floor(seconds / 3600) % 24);
    $('#cdMinutes').textContent = pad(Math.floor(seconds / 60) % 60);
    $('#cdSeconds').textContent = pad(seconds % 60);
  };
  updateCountdown();
  setInterval(updateCountdown, 1000);
})();
