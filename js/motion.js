/* Bewegung für Taxi Diez Adell: GSAP + ScrollTrigger + SplitText, Lenis für ruhiges Scrollen.
   Läuft nur, wenn <html> die Klasse "motion" trägt (also ohne "Bewegung reduzieren"). */
(function () {
  var d = document.documentElement;
  var showAll = function () { d.classList.remove('motion', 'intro'); };
  if (!d.classList.contains('motion')) return;
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || !window.Lenis) { showAll(); return; }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ruhiges Scrollen, an ScrollTrigger gekoppelt
  var lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var el = id.length > 1 ? $(id) : null;
      e.preventDefault();
      lenis.scrollTo(el || 0, { duration: 1.4 });
    });
  });

  // Kopfzeile: wird beim Scrollen fest, verschwindet nach unten, kommt nach oben zurück
  var nav = $('.nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      nav.classList.toggle('solid', y > 60);
      nav.classList.toggle('hide', self.direction === 1 && y > 420);
    }
  });

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);

  function start() {
    var intro = d.classList.contains('intro');
    var tl = gsap.timeline();

    // 1. Vorspann: Dachzeichen flackert an, Vorhang hebt sich
    if (intro) {
      var loader = $('.loader'), sign = $('.loader .sign');
      lenis.stop();
      [[.25, 1], [.31, 0], [.43, 1], [.48, 0], [.6, 1]].forEach(function (s) {
        tl.call(function () { sign.classList.toggle('on', !!s[1]); }, null, s[0]);
      });
      tl.to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 1.05)
        .call(function () { loader.style.display = 'none'; d.classList.remove('intro'); lenis.start(); });
    }

    // 2. Titel
    var h1 = $('.hero h1');
    var heroSplit = SplitText.create(h1, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    var at = intro ? '-=.55' : 0;
    gsap.set(['.hero-copy', '.order'], { opacity: 1 });
    tl.from('.hero-media picture', { scale: 1.18, duration: 2.4, ease: 'expo.out' }, at)
      .from(heroSplit.lines, { yPercent: 115, duration: 1.3, stagger: .12, ease: 'expo.out' }, '<.15')
      .from(['.hero .lead', '.hero .owner'], { y: 24, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out' }, '<.35')
      .from('.order', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out' }, '<.05');
    // Dachzeichen auf der Bestellkarte geht flackernd an
    var roof = $('.order .roof');
    tl.addLabel('roof', '<.7');
    [[0, 1], [.07, 0], [.18, 1], [.24, 0], [.34, 1]].forEach(function (s) {
      tl.call(function () { roof.classList.toggle('on', !!s[1]); }, null, 'roof+=' + s[0]);
    });

    // Titelfoto taucht beim Scrollen tiefer in die Nacht
    gsap.to('.hero-media img', { scale: 1.14, yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-in', { yPercent: -10, opacity: .25, ease: 'none', scrollTrigger: { trigger: '.hero', start: '45% top', end: 'bottom top', scrub: true } });

    marquee();
    sections();
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  // 3. Laufband: Grundtempo, beim Scrollen schneller, Richtung folgt dem Scrollen
  function marquee() {
    var track = $('.marquee-track'), group = track && track.children[0];
    if (!group) return;
    var w = group.offsetWidth, x = 0, dir = -1, boost = 0;
    window.addEventListener('resize', function () { w = group.offsetWidth; });
    lenis.on('scroll', function (l) {
      if (l.direction) dir = l.direction === 1 ? -1 : 1;
      boost = Math.min(Math.abs(l.velocity), 60);
    });
    gsap.ticker.add(function (t, dt) {
      x += dir * (0.55 + boost * 0.3) * (dt / 16.67);
      boost *= 0.94;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
    });
  }

  function sections() {
    // Überschriften steigen zeilenweise aus einer Maske
    $$('h2.split').forEach(function (h) {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 115, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
        }
      });
    });

    gsap.from('.glance li', { y: 30, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.glance', start: 'top 90%', once: true } });

    // 4. Fahrten: auf großen Bildschirmen seitlich, auf kleinen einfach einblenden
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1001px)', function () {
      var sec = $('.rides'), track = $('.rides-track');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var ride = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      $$('.card', sec).forEach(function (card) {
        gsap.fromTo($('img', card), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: ride, start: 'left right', end: 'right left', scrub: true } });
        gsap.from($('.txt', card), { y: 46, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, containerAnimation: ride, start: 'left 78%', toggleActions: 'play none none reverse' } });
      });
    });
    mm.add('(max-width: 1000px)', function () {
      gsap.from('.card', { x: 60, opacity: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.rides-cards', start: 'top 85%', once: true } });
    });

    // 5. Flughafen: Foto öffnet sich wie ein Vorhang, Linien ziehen durch, Kilometer zählen hoch
    var photo = $('.air .photo');
    gsap.timeline({ scrollTrigger: { trigger: photo, start: 'top 82%', once: true } })
      .fromTo(photo, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .from($('img', photo), { scale: 1.35, duration: 2, ease: 'expo.out' }, '<.2');
    var rows = $$('.dest li');
    gsap.timeline({ scrollTrigger: { trigger: '.dest', start: 'top 85%', once: true } })
      .to(rows, { '--rule': 1, duration: 1.3, stagger: .15, ease: 'expo.inOut' })
      .from($$(".dest li > span"), { y: 26, opacity: 0, duration: 1, stagger: .05, ease: 'expo.out' }, '<.2')
      .from('.dest .count', { textContent: 0, duration: 1.6, stagger: .15, ease: 'power2.out', snap: { textContent: 1 } }, '<.1');

    // 6. Bildband: Foto zoomt beim Durchfahren, der Satz leuchtet Wort für Wort auf
    gsap.fromTo('.band img', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });
    var words = SplitText.create('.band h2', { type: 'words' });
    gsap.fromTo(words.words, { opacity: .12 }, { opacity: 1, stagger: .12, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top 65%', end: 'center 45%', scrub: true } });

    gsap.from('.facts dt, .facts dd', { x: -18, opacity: 0, duration: .9, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: '.facts', start: 'top 85%', once: true } });
    gsap.from('.info p', { y: 22, opacity: 0, duration: 1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.info', start: 'top 80%', once: true } });

    // 7. Kontakt: Nummer erscheint Ziffer für Ziffer
    var tel = SplitText.create('.contact .tel', { type: 'chars', mask: 'chars' });
    gsap.timeline({ scrollTrigger: { trigger: '.contact', start: 'top 75%', once: true } })
      .from(tel.chars, { yPercent: 110, duration: 1, stagger: .035, ease: 'expo.out' })
      .from(['.contact .btns', '.contact address'], { y: 24, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out' }, '<.3');

    // Knöpfe folgen dem Zeiger ein Stück (nur mit Maus)
    if (window.matchMedia('(pointer: fine)').matches) {
      $$('.magnet').forEach(function (el) {
        var xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
        var yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * .3);
          yTo((e.clientY - r.top - r.height / 2) * .4);
        });
        el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
      });
    }
  }
})();
