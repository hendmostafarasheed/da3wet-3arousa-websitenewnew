(function(){
  // Background music: continue across navigation inside this site, stop when an invitation opens.
  const music = document.getElementById('site-background-music');
  if (music) {
    const timeKey = 'da3wetArousaMusicTime';
    const stoppedKey = 'da3wetArousaMusicStopped';
    const wasStopped = sessionStorage.getItem(stoppedKey) === '1';
    if (!wasStopped) {
      const savedTime = parseFloat(sessionStorage.getItem(timeKey) || '0');
      if (Number.isFinite(savedTime) && savedTime > 0) {
        music.addEventListener('loadedmetadata', function restorePosition() {
          try {
            if (Number.isFinite(music.duration) && savedTime < music.duration) music.currentTime = savedTime;
          } catch (_) {}
        }, { once: true });
      }
      const tryPlay = function () {
        if (sessionStorage.getItem(stoppedKey) === '1') return;
        const result = music.play();
        if (result && typeof result.catch === 'function') result.catch(function(){});
      };
      tryPlay();
      // Some mobile browsers block autoplay until the visitor interacts with the page.
      document.addEventListener('pointerdown', tryPlay, { once: true });
      document.addEventListener('keydown', tryPlay, { once: true });
      music.addEventListener('timeupdate', function () {
        if (!music.paused && Number.isFinite(music.currentTime)) {
          sessionStorage.setItem(timeKey, String(music.currentTime));
        }
      });
    } else {
      music.pause();
    }
    window.addEventListener('pagehide', function () {
      if (music && Number.isFinite(music.currentTime)) {
        sessionStorage.setItem(timeKey, String(music.currentTime));
      }
    });
    // Opening any live invitation from a preview pauses the music immediately.
    document.querySelectorAll('.invitation-card a[href^="http"], .hero-art a[href^="http"]').forEach(function (link) {
      link.addEventListener('click', function () {
        music.pause();
        sessionStorage.setItem(stoppedKey, '1');
      });
    });
  }

  const cfg = window.SITE_CONFIG || {};
  document.querySelectorAll('[data-config]').forEach(function(link){
    const key = link.getAttribute('data-config');
    const value = cfg[key];
    if (key === 'whatsappNumber' && typeof value === 'string' && value.trim()) {
      const digits = value.replace(/\D/g, '');
      if (digits) { link.href = 'https://wa.me/' + digits; link.target = '_blank'; link.rel = 'noopener'; link.classList.remove('is-unavailable'); return; }
    }
    if (typeof value === 'string' && value.trim()) {
      link.href = value.trim(); link.target = '_blank'; link.rel = 'noopener'; link.classList.remove('is-unavailable');
    } else {
      link.classList.add('is-unavailable');
      link.setAttribute('aria-label', link.textContent.trim() + ' — يحتاج إضافة الرابط في config.js');
      link.addEventListener('click', function(event){ event.preventDefault(); const hint = document.getElementById('config-hint'); if (hint) { hint.textContent = 'الرابط الخاص بـ ' + link.textContent.trim() + ' لسه مش مضاف. أضيفيه في ملف config.js لتفعيل الزر.'; hint.scrollIntoView({behavior:'smooth',block:'center'}); } else { window.location.href = 'index.html#contact'; } });
    }
  });
  document.querySelectorAll('#year').forEach(function(el){el.textContent = new Date().getFullYear();});
  const otherToggle = document.getElementById('other-occasions-toggle');
  const otherOccasions = document.getElementById('other-occasions');
  const soonMessage = document.getElementById('soon-message');
  if (otherToggle && otherOccasions) {
    otherToggle.addEventListener('click', function(){
      const isOpen = !otherOccasions.hidden;
      otherOccasions.hidden = isOpen;
      otherToggle.setAttribute('aria-expanded', String(!isOpen));
      if (soonMessage) soonMessage.hidden = true;
    });
    otherOccasions.querySelectorAll('.occasion-soon').forEach(function(button){
      button.addEventListener('click', function(){
        if (soonMessage) {
          soonMessage.textContent = 'Soon — قريبًا ♥️';
          soonMessage.hidden = false;
        }
      });
    });
  }
  const filters = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('.invitation-card');
  filters.forEach(function(button){button.addEventListener('click',function(){
    const filter = button.getAttribute('data-filter');
    filters.forEach(function(b){b.classList.toggle('active',b===button);});
    cards.forEach(function(card){card.classList.toggle('hidden-card',filter!=='all' && card.getAttribute('data-type')!==filter);});
    if (soonMessage) { if (filter === 'celebrity') { soonMessage.textContent = '✨ اختاري دعوة بطعم حبيبك المشهور، واضغطي «اعملي نفس التصميم ببياناتك إنتِ» عشان نجهزهالك باسمك وتفاصيل مناسبتك ♥'; soonMessage.hidden = false; } else { soonMessage.hidden = true; } }
  });});
})();

/* Create opposite-language preview cards for every invitation. These are styled previews, not a replacement for the live invitation. */
(function bilingualPreviews(){
  const cards = Array.from(document.querySelectorAll('.invitation-card'));
  if (!cards.length) return;
  const modal = document.createElement('div');
  modal.className = 'language-preview-modal';
  modal.id = 'language-preview-modal';
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-label','معاينة الدعوة باللغة الأخرى');
  modal.innerHTML = '<div class="language-preview-dialog"><button type="button" class="language-preview-close" aria-label="إغلاق المعاينة">×</button><p class="language-preview-note">معاينة مقترحة باللغة الأخرى — يمكن تخصيص النصوص النهائية عند الطلب</p><div class="invitation-preview-art" id="invitation-preview-art"><p class="preview-kicker" id="preview-kicker"></p><div class="preview-ornament">✦ ❦ ✦</div><h2 class="preview-names" id="preview-names"></h2><p class="preview-description" id="preview-description"></p><div class="preview-detail" id="preview-detail"></div><p class="preview-footer" id="preview-footer"></p><div class="preview-ornament">❦</div></div></div>';
  document.body.appendChild(modal);
  const art=modal.querySelector('#invitation-preview-art');
  const close=modal.querySelector('.language-preview-close');
  const arabic=/[\u0600-\u06FF]/;
  const englishCopy={wedding:{kicker:'YOU ARE INVITED',desc:'Together with our families, we invite you to celebrate a beautiful new beginning.',detail:'Date • Time • Venue',footer:'With love, joy & a lifetime of memories'},engagement:{kicker:'SAVE THE DATE',desc:'Join us as we celebrate the beginning of our forever story.',detail:'Date • Time • Venue',footer:'A promise today, a lifetime together'},henna:{kicker:'HENNA NIGHT',desc:'An evening of joy, music and beautiful traditions. We would love to celebrate with you.',detail:'Date • Time • Venue',footer:'Let the celebration begin'},baby:{kicker:'A LITTLE MIRACLE',desc:'Our hearts are full as we welcome our precious little one. Join us for a sweet celebration.',detail:'Date • Time • Place',footer:'Tiny hands, endless love'},birthday:{kicker:'YOU’RE INVITED',desc:'Come celebrate a special birthday filled with smiles, sweet moments and happy memories.',detail:'Date • Time • Place',footer:'Make a wish and celebrate'},'extra-service':{kicker:'IN LOVING MEMORY',desc:'You are warmly invited to join us in remembrance, prayer and honoring a life that remains in our hearts.',detail:'Date • Time • Location',footer:'Forever remembered, always loved'},default:{kicker:'YOU ARE INVITED',desc:'We would be delighted to share this special occasion with you.',detail:'Date • Time • Venue',footer:'A beautiful moment to remember'}};
  const arabicCopy={wedding:{kicker:'دعوة لحضور حفل زفاف',desc:'بكل الحب والفرح، نتشرف بدعوتكم لمشاركتنا بداية حكاية جديدة، ونتمنى أن تكتمل فرحتنا بوجودكم.',detail:'التاريخ • الوقت • المكان',footer:'دامت أيامكم عامرة بالحب والفرح'},engagement:{kicker:'دعوة خطوبة',desc:'يسعدنا أن تشاركونا فرحتنا وبداية حكاية جديدة، بحضوركم تكتمل سعادتنا.',detail:'التاريخ • الوقت • المكان',footer:'فرحة تجمعنا وذكرى تدوم'},henna:{kicker:'دعوة ليلة الحنة',desc:'ليلة من الفرح واللمة الحلوة والتقاليد الجميلة. وجودكم يزيد فرحتنا.',detail:'التاريخ • الوقت • المكان',footer:'فرحتنا تحلى بوجودكم'},baby:{kicker:'أجمل هدية وصلت',desc:'بكل الحب، ندعوكم لمشاركتنا فرحتنا بمولودنا الصغير في يوم مليء بالبهجة والذكريات الجميلة.',detail:'التاريخ • الوقت • المكان',footer:'اللهم أنبته نباتًا حسنًا'},birthday:{kicker:'دعوة عيد ميلاد',desc:'شاركونا يومًا مميزًا مليئًا بالضحك والفرح واللحظات الحلوة التي لا تُنسى.',detail:'التاريخ • الوقت • المكان',footer:'سنة حلوة مليانة فرح'},'extra-service':{kicker:'دعوة تذكارية',desc:'نتشرف بدعوتكم للمشاركة في الدعاء واستذكار سيرة غالية، ستبقى ذكراها حاضرة في قلوبنا.',detail:'التاريخ • الوقت • المكان',footer:'رحم الله من بقي أثره في قلوبنا'},default:{kicker:'دعوة خاصة',desc:'يسعدنا دعوتكم لمشاركتنا هذه المناسبة المميزة، فوجودكم يجعل اللحظات أجمل.',detail:'التاريخ • الوقت • المكان',footer:'أجمل اللحظات تجمعنا'}};
  function getType(card){const t=card.getAttribute('data-type')||'';return t==='extra-service'?'extra-service':t;}
  function getNames(card,isArabic){let title=card.querySelector('h2')?.textContent.trim()||'Our Special Day';
    const replacements=[[/Karim\s*&\s*Laila/i,isArabic?'كريم وليلى':'Karim & Laila'],[/Selim\s*&\s*Karma/i,isArabic?'سليم وكرمة':'Selim & Karma'],[/Adham\s*&\s*Salma/i,isArabic?'أدهم وسلمى':'Adham & Salma'],[/Amr\s*&\s*Sereen/i,isArabic?'عمرو وسيرين':'Amr & Sereen'],[/محمد\s*وسارة/i,isArabic?'محمد وسارة':'Mohamed & Sara'],[/Soha/i,isArabic?'سُهى':'Soha'],[/Reem/i,isArabic?'ريم':'Reem'],[/Mina/i,isArabic?'مينا':'Mina'],[/Mona\s*Ahmed/i,isArabic?'منى وأحمد':'Mona & Ahmed'],[/Mohamed\s*Henedy/i,isArabic?'محمد هنيدي':'Mohamed Henedy'],[/Roshdy\s*Abaza/i,isArabic?'رشدي أباظة':'Roshdy Abaza'],[/Mustafa\s*Rasheed/i,isArabic?'مصطفى رشيد':'Mustafa Rasheed'],[/Maha\s*Kazem\s*Hussein/i,isArabic?'أ. مها كاظم حسين':'Maha Kazem Hussein']];
    replacements.forEach(([re,val])=>{if(re.test(title))title=title.replace(re,val)});
    if(isArabic && !arabic.test(title)) title=title.replace(/\s*[—-]\s*Pinky/i,'').replace(/\s*[—-]\s*2/i,'');
    if(!isArabic && arabic.test(title)) title=title.replace(/محمد وسارة/,'Mohamed & Sara').replace(/أ. مها كاظم حسين/,'Maha Kazem Hussein').replace(/حنة /,'Henna ').replace(/سبوع /,'Baby celebration ').replace(/عيد ميلاد النونو /,'Birthday of ').replace(/عيد ميلاد /,'Birthday ');
    return title;
  }
  function openPreview(card){const isArabic=arabic.test(card.querySelector('h2')?.textContent||'');const targetArabic=!isArabic;const type=getType(card);const copy=(targetArabic?arabicCopy:englishCopy)[type]||(targetArabic?arabicCopy:englishCopy).default;
    art.dir=targetArabic?'rtl':'ltr'; art.lang=targetArabic?'ar':'en'; art.className='invitation-preview-art theme-'+type;
    modal.querySelector('#preview-kicker').textContent=copy.kicker;
    modal.querySelector('#preview-names').textContent=getNames(card,targetArabic);
    modal.querySelector('#preview-description').textContent=copy.desc;
    modal.querySelector('#preview-detail').textContent=copy.detail;
    modal.querySelector('#preview-footer').textContent=copy.footer;
    modal.classList.add('is-open');document.body.style.overflow='hidden';close.focus();
  }
  cards.forEach(card=>{const info=card.querySelector('.invitation-info');if(!info)return;const title=card.querySelector('h2')?.textContent.trim()||'الدعوة';const button=document.createElement('button');button.type='button';button.className='language-preview-button';button.textContent=arabic.test(title)?'See English Version · معاينة إنجليزية':'شوفي النسخة العربية · معاينة';button.addEventListener('click',()=>openPreview(card));info.appendChild(button);});
  function closeModal(){modal.classList.remove('is-open');document.body.style.overflow='';}
  close.addEventListener('click',closeModal);modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))closeModal()});
})();
