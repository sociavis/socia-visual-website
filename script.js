/* ── Phase 2: Performance detection ── */
(function(){var perf='perf-low';if(navigator.hardwareConcurrency>=5&&matchMedia('(pointer:fine)').matches)perf='perf-high';document.body.classList.add(perf)})();

/* ── Phase 2: Split-text animation system ── */
function splitTextLines(el){
if(!document.body.classList.contains('perf-high'))return;
if(el.dataset.split)return;
el.dataset.split='true';
el.setAttribute('aria-label',el.textContent);
/* Collect logical lines by splitting on <br> tags */
var html=el.innerHTML;
var parts=html.split(/<br\s*\/?>/gi);
el.innerHTML='';
parts.forEach(function(part,i){
if(i>0)el.appendChild(document.createElement('br'));
var wrapper=document.createElement('span');
wrapper.className='split-line-wrap';
wrapper.setAttribute('aria-hidden','true');
var inner=document.createElement('span');
inner.className='split-line';
inner.innerHTML=part;
wrapper.appendChild(inner);
el.appendChild(wrapper);
});
return el.querySelectorAll('.split-line');
}

function revealSplitLines(el,baseDelay){
var lines=el.querySelectorAll('.split-line');
if(!lines.length)return 0;
lines.forEach(function(line,i){
setTimeout(function(){
line.classList.add('split-visible');
},baseDelay+(i*120));
});
return baseDelay+(lines.length*120);
}

/* ── Phase 2: Cookie-based boot ── */
var isReturnVisit=document.cookie.indexOf('sv_visited=1')!==-1;

const bootOverlay=document.getElementById("bootOverlay"),bootText=document.getElementById("bootText"),bootBarFill=document.getElementById("bootBarFill"),bootMessages=isReturnVisit?["SYSTEM READY"]:["INITIALIZING SYSTEM...","LOADING VISUAL CORE...","CONNECTING ASSETS...","RENDERING INTERFACE...","CALIBRATING DISPLAY...","SYSTEM READY"];let bootIndex=0,bootProgress=0;function runBoot(){bootIndex<bootMessages.length?(bootText.textContent=bootMessages[bootIndex],bootProgress=(bootIndex+1)/bootMessages.length*100,bootBarFill.style.width=bootProgress+"%",bootIndex++,setTimeout(runBoot,isReturnVisit?200:300+200*Math.random())):setTimeout(()=>{bootOverlay.classList.add("done"),document.body.classList.add("loaded");
/* Set return visit cookie (30 days) */
document.cookie='sv_visited=1;max-age=2592000;path=/;SameSite=Lax';
/* ── Phase 2: Split-text reveal on hero lines ── */
var heroLines=document.querySelectorAll('.panel--hero .hero-line');
var hasSplit=document.body.classList.contains('perf-high');
if(hasSplit){
heroLines.forEach(function(el){splitTextLines(el)});
var totalDelay=0;
heroLines.forEach(function(el,i){
var lines=el.querySelectorAll('.split-line');
if(lines.length){
el.classList.add('visible');/* show container immediately */
totalDelay=revealSplitLines(el,i*200);
}
});
/* After split-text completes, run scramble on data-scramble elements */
setTimeout(function(){
heroLines.forEach(function(el){
if(el.hasAttribute('data-scramble')){
/* Flatten split spans back to text for scramble */
var text=el.textContent;
el.innerHTML=text;
scrambleText(el);
}
});
},totalDelay+100);
/* Reveal non-heading hero elements normally */
document.querySelectorAll('.panel--hero .reveal:not(.hero-line)').forEach(function(el,i){
setTimeout(function(){el.classList.add('visible')},totalDelay+100+(i*120));
});
}else{
/* Fallback: standard reveal for low-perf devices */
document.querySelectorAll(".panel--hero .reveal").forEach((e,t)=>{setTimeout(()=>e.classList.add("visible"),120*t)});
}
},isReturnVisit?200:400)}runBoot();const cursor=document.getElementById("cursor"),cursorDot=document.getElementById("cursorDot"),cursorGlow=document.getElementById("cursorGlow");let mouseX=0,mouseY=0,cx=0,cy=0,dx=0,dy=0,gx=0,gy=0;function animateCursor(){dx+=.6*(mouseX-dx),dy+=.6*(mouseY-dy),cursorDot.style.left=dx+"px",cursorDot.style.top=dy+"px",cx+=.15*(mouseX-cx),cy+=.15*(mouseY-cy),cursor.style.left=cx+"px",cursor.style.top=cy+"px",gx+=.06*(mouseX-gx),gy+=.06*(mouseY-gy),cursorGlow.style.left=gx+"px",cursorGlow.style.top=gy+"px",requestAnimationFrame(animateCursor)}document.addEventListener("mousemove",e=>{mouseX=e.clientX,mouseY=e.clientY}),animateCursor();const hoverTargets=document.querySelectorAll("a, button, [data-tilt], input, textarea");hoverTargets.forEach(e=>{e.addEventListener("mouseenter",()=>cursor.classList.add("hovering")),e.addEventListener("mouseleave",()=>cursor.classList.remove("hovering"))}),document.querySelectorAll(".magnetic").forEach(e=>{let _rect=null;e.addEventListener("mouseenter",()=>{_rect=e.getBoundingClientRect()}),e.addEventListener("mousemove",t=>{if(!_rect)return;const n=t.clientX-_rect.left-_rect.width/2,s=t.clientY-_rect.top-_rect.height/2;e.style.transform=`translate(${.15*n}px, ${.15*s}px)`}),e.addEventListener("mouseleave",()=>{_rect=null;e.style.transform="translate(0, 0)"})});const SectionManager={panels:[],dots:[],currentIndex:0,totalPanels:0,isTransitioning:!1,transitionDuration:850,lastWheelTime:0,wheelCooldown:1e3,touchStartY:0,scanLine:null,progressEdges:{},hudScroll:null,panelMap:{hero:0,about:1,services:2,work:3,contact:4},init(){this.panels=Array.from(document.querySelectorAll(".panel")),this.dots=Array.from(document.querySelectorAll(".section-nav-dot")),this.totalPanels=this.panels.length,this.scanLine=document.getElementById("scanLine"),this.progressEdges={top:document.getElementById("scrollProgressTop"),right:document.getElementById("scrollProgressRight"),bottom:document.getElementById("scrollProgressBottom"),left:document.getElementById("scrollProgressLeft")},this.hudScroll=document.getElementById("hudScroll"),this.panels[0].classList.add("active"),this.updateNav(),this.updateProgress(),this.bindWheel(),this.bindTouch(),this.bindKeyboard(),this.bindDots(),this.bindAnchors()},goTo(e,t){if(this.isTransitioning)return;if(e===this.currentIndex)return;if(e<0||e>=this.totalPanels)return;this.isTransitioning=!0,t=t||(e>this.currentIndex?"down":"up");const o=this.panels[this.currentIndex],n=this.panels[e];n.querySelectorAll(".reveal").forEach(e=>e.classList.remove("visible")),this.scanLine&&(this.scanLine.classList.remove("sweeping-down","sweeping-up"),this.scanLine.classList.add("down"===t?"sweeping-down":"sweeping-up")),o.classList.add("down"===t?"exit-up":"exit-down"),setTimeout(()=>{n.classList.add("active"),n.classList.add("down"===t?"enter-from-below":"enter-from-above")},100),setTimeout(()=>{var reveals=Array.from(n.querySelectorAll(".reveal"));var hasSplit=document.body.classList.contains('perf-high');reveals.forEach((e,t)=>{var isSectionTitle=e.classList.contains('section-title');if(hasSplit&&isSectionTitle){splitTextLines(e);setTimeout(()=>{e.classList.add('visible');revealSplitLines(e,0);setTimeout(()=>{if(e.hasAttribute('data-scramble')){var text=e.textContent;e.innerHTML=text;scrambleText(e)}},e.querySelectorAll('.split-line').length*120+100)},80*t)}else{setTimeout(()=>{e.classList.add("visible"),e.hasAttribute("data-scramble")&&scrambleText(e)},80*t)}})},300),"undefined"!=typeof GridScene&&GridScene.onSectionChange(this.currentIndex,e),4===e?(document.body.classList.add("contact-active"),loadRecaptcha()):document.body.classList.remove("contact-active"),setTimeout(()=>{o.classList.remove("active","exit-up","exit-down"),n.classList.remove("enter-from-below","enter-from-above"),this.scanLine.classList.remove("sweeping-down","sweeping-up"),this.currentIndex=e,this.isTransitioning=!1,this.updateNav(),this.updateProgress();const t=n.id;t&&history.replaceState(null,null,"#"+t);n.setAttribute("tabindex","-1"),n.focus({preventScroll:!0});var a=document.getElementById("sectionAnnounce");if(a){var sn=["Home","About","Services","Work","Contact"];a.textContent="Now viewing: "+(sn[e]||"")}},this.transitionDuration)},next(){this.currentIndex<this.totalPanels-1&&this.goTo(this.currentIndex+1,"down")},prev(){this.currentIndex>0&&this.goTo(this.currentIndex-1,"up")},updateNav(){this.dots.forEach((e,t)=>{var isActive=t===this.currentIndex;e.classList.toggle("active",isActive);e.setAttribute("aria-current",isActive?"true":"false")}),this.updateMobileNav()},updateProgress(){if(this.progressEdges.top){const e=this.progressEdges,t=this.currentIndex;e.top.style.transform=t>=0?"scaleX(1)":"scaleX(0)",e.right.style.transform=t>=1?(t>=2?"scaleY(1)":"scaleY(0.5)"):"scaleY(0)",e.bottom.style.transform=t>=3?"scaleX(1)":"scaleX(0)",e.left.style.transform=t>=4?"scaleY(1)":"scaleY(0)"}this.hudScroll&&(this.hudScroll.textContent=this.currentIndex+1+"/"+this.totalPanels)},bindWheel(){document.addEventListener("wheel",e=>{if(document.body.classList.contains("project-open"))return;e.preventDefault();const t=Date.now();if(t-this.lastWheelTime<this.wheelCooldown)return;if(this.isTransitioning)return;const o=this.panels[this.currentIndex];if(o.scrollHeight>o.clientHeight+5){if(e.deltaY>0&&o.scrollTop+o.clientHeight<o.scrollHeight-5)return;if(e.deltaY<0&&o.scrollTop>5)return}Math.abs(e.deltaY)>20&&(this.lastWheelTime=t,e.deltaY>0?this.next():this.prev())},{passive:!1})},bindTouch(){document.addEventListener("touchstart",e=>{this.touchStartY=e.touches[0].clientY},{passive:!0}),document.addEventListener("touchend",e=>{if(this.isTransitioning)return;const t=this.touchStartY-e.changedTouches[0].clientY,o=this.panels[this.currentIndex];if(o.scrollHeight>o.clientHeight+5){if(t>0&&o.scrollTop+o.clientHeight<o.scrollHeight-5)return;if(t<0&&o.scrollTop>5)return}Math.abs(t)>50&&(t>0?this.next():this.prev())},{passive:!0})},bindKeyboard(){document.addEventListener("keydown",e=>{const t=document.activeElement.tagName;if("INPUT"!==t&&"TEXTAREA"!==t)switch(e.key){case"ArrowDown":case"PageDown":e.preventDefault(),this.next();break;case"ArrowUp":case"PageUp":e.preventDefault(),this.prev();break;case"Home":e.preventDefault(),this.goTo(0);break;case"End":e.preventDefault(),this.goTo(this.totalPanels-1)}})},bindDots(){this.dots.forEach(e=>{e.addEventListener("click",()=>{const t=parseInt(e.dataset.target);this.goTo(t)})})},bindAnchors(){document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const o=e.getAttribute("href").replace("#",""),n=this.panelMap[o];void 0!==n&&this.goTo(n)})}),document.querySelectorAll(".mobile-nav-btn").forEach(e=>{e.addEventListener("click",()=>{const t=parseInt(e.dataset.target);this.goTo(t)})})},updateMobileNav(){document.querySelectorAll(".mobile-nav-btn").forEach((e,t)=>{var isActive=t===this.currentIndex;e.classList.toggle("active",isActive);e.setAttribute("aria-current",isActive?"true":"false")})}};if(SectionManager.init(),window.location.hash){const e=window.location.hash.replace("#",""),t=SectionManager.panelMap[e];void 0!==t&&0!==t&&(SectionManager.panels[0].classList.remove("active"),SectionManager.panels[t].classList.add("active"),SectionManager.currentIndex=t,SectionManager.updateNav(),SectionManager.updateProgress(),SectionManager.panels[t].querySelectorAll(".reveal").forEach(e=>e.classList.add("visible")))}const scrambleChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*<>[]{}";function scrambleText(e){const t=e.textContent,o=t.length;let n=0;const s=setInterval(()=>{e.textContent=t.split("").map((e,o)=>o<n?t[o]:" "===e?" ":scrambleChars[Math.floor(Math.random()*scrambleChars.length)]).join(""),n+=.5,n>=o&&(e.textContent=t,clearInterval(s))},30)}/* Inline form validation */
(function(){var fields=[{input:"name",error:"name-error",msg:"Name is required"},{input:"email",error:"email-error",msg:"Please enter a valid email"},{input:"message",error:"message-error",msg:"Message is required"}];fields.forEach(function(f){var el=document.getElementById(f.input),err=document.getElementById(f.error);if(!el||!err)return;el.addEventListener("blur",function(){if(!el.value.trim()||(el.type==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value))){err.textContent=f.msg;el.setAttribute("aria-invalid","true")}else{err.textContent="";el.removeAttribute("aria-invalid")}});el.addEventListener("input",function(){if(el.value.trim()&&err.textContent){err.textContent="";el.removeAttribute("aria-invalid")}})})})();
const RECAPTCHA_SITE_KEY="6Leau4ksAAAAAPDsayHMnlB8wLZk7yK88EIPnBuS";let recaptchaLoaded=!1;function loadRecaptcha(){if(recaptchaLoaded)return;recaptchaLoaded=!0;const e=document.createElement("script");e.src="https://www.google.com/recaptcha/api.js?render="+RECAPTCHA_SITE_KEY,document.head.appendChild(e)}const contactForm=document.getElementById("contactForm"),formStatus=document.getElementById("formStatus"),formLoadTime=Date.now();contactForm.addEventListener("submit",async e=>{e.preventDefault();const t=contactForm.querySelector(".cta-text"),o=t.textContent;/* Anti-bot: reject if honeypot filled */if(contactForm.querySelector('[name="website"]')&&contactForm.querySelector('[name="website"]').value){formStatus.textContent="";t.textContent=o;return}/* Anti-bot: reject if submitted too fast (<3s) */if(Date.now()-formLoadTime<3000){formStatus.textContent="[ ERROR ] — Please wait a moment before submitting.";formStatus.className="form-status error";t.textContent=o;return}t.textContent="VERIFYING...",loadRecaptcha();try{let e=0;for(;"undefined"==typeof grecaptcha||!grecaptcha.execute;)if(await new Promise(e=>setTimeout(e,100)),e+=100,e>5e3)throw new Error("reCAPTCHA failed to load");const n=await grecaptcha.execute(RECAPTCHA_SITE_KEY,{action:"submit"});document.getElementById("recaptchaResponse").value=n,t.textContent="TRANSMITTING...";const s=new FormData(contactForm);/* Remove honeypot from submission */s.delete("website");if(!(await fetch(contactForm.action,{method:"POST",body:s,headers:{Accept:"application/json"}})).ok)throw new Error("Transmission failed");t.textContent="TRANSMITTED ✓",formStatus.textContent="[ SUCCESS ] — Message delivered. We'll be in touch.",formStatus.className="form-status success",contactForm.reset(),setTimeout(()=>{t.textContent=o},3e3)}catch(e){t.textContent=o,formStatus.textContent="[ ERROR ] — Transmission failed. Try again or email directly.",formStatus.className="form-status error"}}),document.querySelectorAll("[data-tilt]").forEach(e=>{e.addEventListener("mousemove",t=>{const o=e.getBoundingClientRect(),n=(t.clientX-o.left)/o.width,s=-8*((t.clientY-o.top)/o.height-.5),r=8*(n-.5);e.style.transform=`perspective(800px) rotateX(${s}deg) rotateY(${r}deg) scale(1.02)`}),e.addEventListener("mouseleave",()=>{e.style.transform="perspective(800px) rotateX(0) rotateY(0) scale(1)"})});const hudFps=document.getElementById("hudFps");let lastTime=performance.now(),frameCount=0;function updateFPS(){frameCount++;const e=performance.now();e-lastTime>=1e3&&(hudFps&&(hudFps.textContent=frameCount),frameCount=0,lastTime=e),requestAnimationFrame(updateFPS)}updateFPS();const hudVel=document.getElementById("hudVel"),hudLat=document.getElementById("hudLat"),hudLng=document.getElementById("hudLng");let prevMouseX=0,prevMouseY=0,prevMouseTime=performance.now(),velocity=0;document.addEventListener("mousemove",e=>{const t=performance.now(),o=t-prevMouseTime;if(o>0){const t=e.clientX-prevMouseX,n=e.clientY-prevMouseY,s=Math.sqrt(t*t+n*n)/o;velocity+=.3*(s-velocity),hudVel&&(hudVel.textContent=velocity.toFixed(2))}prevMouseX=e.clientX,prevMouseY=e.clientY,prevMouseTime=t;const n=(45.5+e.clientY/window.innerHeight*.05).toFixed(4),s=(e.clientX/window.innerWidth*.1-122.6).toFixed(4);hudLat&&(hudLat.textContent=n),hudLng&&(hudLng.textContent=s)}),setInterval(()=>{velocity*=.9,velocity<.01&&(velocity=0),hudVel&&(hudVel.textContent=velocity.toFixed(2))},100);const hudSignal=document.getElementById("hudSignal");if(hudSignal){const v=hudSignal.querySelectorAll("span");setInterval(()=>{const e=3+Math.floor(3*Math.random());v.forEach((t,o)=>{t.classList.toggle("inactive",o>=e)})},2e3)}const hudRes=document.getElementById("hudRes");function updateRes(){hudRes&&(hudRes.textContent=window.innerWidth+"x"+window.innerHeight)}updateRes(),window.addEventListener("resize",updateRes);const hudClock=document.getElementById("hudClock");setInterval(()=>{const e=new Date,t=String(e.getHours()).padStart(2,"0"),o=String(e.getMinutes()).padStart(2,"0"),n=String(e.getSeconds()).padStart(2,"0");hudClock&&(hudClock.textContent=t+":"+o+":"+n)},1e3);const hudMem=document.getElementById("hudMem"),hudMemBar=document.getElementById("hudMemBar");function updateMem(){const e=30+Math.floor(40*Math.random());hudMem&&(hudMem.textContent=e+"%"),hudMemBar&&(hudMemBar.style.transform="scaleX("+e/100+")")}updateMem(),setInterval(updateMem,3e3);const hudUptime=document.getElementById("hudUptime"),sessionStart=performance.now();setInterval(()=>{const e=Math.floor((performance.now()-sessionStart)/1e3),t=String(Math.floor(e/60)).padStart(2,"0"),o=String(e%60).padStart(2,"0");hudUptime&&(hudUptime.textContent=t+":"+o)},1e3);const konamiCode=[38,38,40,40,37,39,37,39,66,65];let konamiIndex=0;document.addEventListener("keydown",e=>{e.keyCode===konamiCode[konamiIndex]?(konamiIndex++,konamiIndex===konamiCode.length&&(document.body.style.setProperty("--accent-1","#ff00ff"),document.body.style.setProperty("--accent-2","#00ffff"),document.body.style.setProperty("--gradient","linear-gradient(135deg, #ff00ff, #00ffff)"),document.body.style.setProperty("--gradient-text","linear-gradient(135deg, #ff00ff, #00ffff)"),konamiIndex=0,setTimeout(()=>{document.body.style.removeProperty("--accent-1"),document.body.style.removeProperty("--accent-2"),document.body.style.removeProperty("--gradient"),document.body.style.removeProperty("--gradient-text")},5e3))):konamiIndex=0});
// ---- Work section: filter toggles + project overlay ----
const projectData={
"arenacross":{title:"AMA Arenacross Championship",category:"Web / Brand / Graphics / Motion",year:"2023 \u2014 Present",bg:"portfolio/AMA FIM Arenacross Championship/Arenacross/axbg3.webp",desc:"End-to-end creative partnership for the AMA FIM North America Arenacross Championship — the premier indoor short-track motorcycle racing series. We built and maintained the full visual ecosystem: brand identity and guidelines, responsive web platform, sponsor integration across all digital touchpoints, email marketing campaigns, event graphics, social media content, and motion design for broadcast and digital. A ground-up effort spanning every discipline to match the intensity of the sport itself.",client:"AMA FIM North America",scope:"Brand Identity, Web Design & Dev, Graphic Design, Motion, Email, Sponsor Integration, Digital Strategy",hero:"portfolio/AMA FIM Arenacross Championship/Arenacross/AX26 Event Poster - Loveland.webp",gallery:["portfolio/AMA FIM Arenacross Championship/Arenacross/INSIDE AX 25 Ep 4 v2.png","portfolio/AMA FIM Arenacross Championship/Arenacross/AX25-26ProSchedule.png","portfolio/AMA FIM Arenacross Championship/Arenacross/AX25 pit displays mockup.png","portfolio/AMA FIM Arenacross Championship/Arenacross/TCS 25-26 Credentials Mockup.jpg","portfolio/AMA FIM Arenacross Championship/Arenacross/HBshirtlight2-Recovered.webp","portfolio/AMA FIM Arenacross Championship/Arenacross/AX25_Daytona-Flyer.webp"]},
"bitd":{title:"Best in the Desert",category:"Web / Brand / Graphics / Motion",bg:"portfolio/Best in the Desert/BITD BG1.webp",desc:"Four years as the creative backbone of America\u2019s premier off-road desert racing association. From expanding and maintaining the series website to designing unique event logos for every race on the calendar, we delivered a complete visual ecosystem \u2014 social media, print, apparel, course maps, sponsor integration, and motion \u2014 across one of the most demanding schedules in motorsport.",client:"Best in the Desert Racing Association",scope:"Brand Identity, Event Logos, Web Expansion & Maintenance, Graphic Design, Motion, Apparel, Print",year:"2022 \u2014 2026"},
"gouker":{title:"Nathan Gouker Racing",category:"Graphic Design / Brand",desc:"Sponsorship proposal deck for Nathan Gouker — a 13-year-old American motorcycle road racer competing in Spain\u2019s ESBK Talent Cup series. A cinematic, widescreen presentation built to secure sponsor partnerships, combining bold motorsport typography with dynamic race photography across nine pages of rider profile, series overview, audience demographics, and partnership structure.",client:"Nathan Gouker Racing",scope:"Graphic Design, Presentation Design, Brand Collateral",year:"2025"},
"steel-city":{title:"Steel City MX",category:"Brand Identity",desc:"Brand identity and web presence for a motocross facility. Logo, signage system, and a responsive website with event scheduling and rider registration.",client:"Steel City MX Park",scope:"Brand Identity & Web"}
};
document.querySelectorAll(".work-filter").forEach(function(btn){btn.addEventListener("click",function(){document.querySelectorAll(".work-filter").forEach(function(b){b.classList.remove("active")});btn.classList.add("active");var f=btn.dataset.filter;document.querySelectorAll(".work-card").forEach(function(card){var cats=card.dataset.category.split(",");if(f==="all"||cats.indexOf(f)!==-1){card.style.display="";card.classList.add("visible")}else{card.style.display="none";card.classList.remove("visible")}})})});
var overlay=document.getElementById("projectOverlay"),closeBtn=document.getElementById("projectClose");
document.querySelectorAll(".work-card").forEach(function(card){card.addEventListener("click",function(){var id=card.dataset.project,d=projectData[id];if(!d)return;document.getElementById("projectTitle").textContent=d.title;document.getElementById("projectCategory").textContent=d.category;document.getElementById("projectClient").textContent=d.client;document.getElementById("projectScope").textContent=d.scope;var yearEl=document.getElementById("projectYear");if(yearEl)yearEl.textContent=d.year||"2023 \u2014 Present";var tpl=document.getElementById("tpl-"+id);var sectionsEl=document.getElementById("projectSections");if(tpl){sectionsEl.innerHTML="";sectionsEl.appendChild(tpl.content.cloneNode(true))}else{sectionsEl.innerHTML=""}if(d.bg){overlay.style.backgroundImage="url('"+d.bg+"')"}else{overlay.style.backgroundImage="none"}var foundWeb=false;sectionsEl.querySelectorAll(".cs-section").forEach(function(s){var eb=s.querySelector(".cs-section-eyebrow");if(!foundWeb&&eb&&eb.textContent.match(/02|web/i))foundWeb=true;if(!foundWeb)s.classList.add("cs-section-solid")});overlay.classList.add("active");document.body.classList.add("project-open");document.body.style.overflow="hidden";overlay.scrollTop=0})});
closeBtn.addEventListener("click",function(){overlay.classList.remove("active");document.body.classList.remove("project-open");document.body.style.overflow=""});
document.getElementById("csBackToTop").addEventListener("click",function(){overlay.scrollTo({top:0,behavior:"smooth"})});
document.getElementById("csBackToWork").addEventListener("click",function(){overlay.classList.remove("active");document.body.classList.remove("project-open");document.body.style.overflow=""});
(function(){/* Staggered video boot — "control room" activation */
var staggerDelay=150;
function bootVideo(v,delay){
var frame=v.closest(".cs-frame");
if(!frame)return;
if(!frame.querySelector(".cs-vid-scanline")){
var scan=document.createElement("div");scan.className="cs-vid-scanline";frame.appendChild(scan);
var lbl=document.createElement("span");lbl.className="cs-vid-label";lbl.textContent="live";frame.appendChild(lbl);
}
setTimeout(function(){
v.play().then(function(){
var scan=frame.querySelector(".cs-vid-scanline");
if(scan)scan.classList.add("cs-vid-sweep");
v.classList.add("cs-vid-live");
}).catch(function(){v.classList.add("cs-vid-live");});
},delay);
}
function unbootVideo(v){
v.pause();v.classList.remove("cs-vid-live");
var frame=v.closest(".cs-frame");
if(frame){var scan=frame.querySelector(".cs-vid-scanline");if(scan)scan.classList.remove("cs-vid-sweep")}
}
var vidObs=new IntersectionObserver(function(entries){
var entering=[];
entries.forEach(function(entry){
var v=entry.target;
if(entry.isIntersecting){entering.push(v)}else{unbootVideo(v)}
});
entering.forEach(function(v,i){bootVideo(v,i*staggerDelay)});
},{root:overlay,threshold:0.3});
function observeVids(){overlay.querySelectorAll(".cs-autovideo").forEach(function(v){vidObs.observe(v)})}
document.querySelectorAll(".work-card").forEach(function(card){card.addEventListener("click",function(){setTimeout(observeVids,300)})})})();
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&overlay.classList.contains("active")){overlay.classList.remove("active");document.body.classList.remove("project-open");document.body.style.overflow=""}});
(function(){var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("cs-visible");observer.unobserve(entry.target)}})},{root:overlay,threshold:0.1});function observeSections(){overlay.querySelectorAll(".cs-section,.cs-header,.cs-bottom-nav").forEach(function(el){el.classList.remove("cs-visible");observer.observe(el)})}var orig=overlay.classList.contains;document.querySelectorAll(".work-card").forEach(function(card){card.addEventListener("click",function(){setTimeout(observeSections,250)})})})();
overlay.addEventListener("click",function(e){if(e.target===overlay){overlay.classList.remove("active");document.body.classList.remove("project-open");document.body.style.overflow=""}});