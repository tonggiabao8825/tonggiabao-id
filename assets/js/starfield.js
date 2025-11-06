(function(){
  const canvas = document.getElementById('starfield-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let DPR = Math.max(1, window.devicePixelRatio || 1);

  let stars = [];
  let width = 0, height = 0;
  const mouse = { x: null, y: null, active: false };

  const config = {
    density: 9000, // one star per N pixels
    maxLinks: 3, // how many links from a single star (soft limit)
    linkDistance: 120, // px
    minRadius: 0.4,
    maxRadius: 1.3,
    twinkleSpeed: 0.02,
  };

  // detect current theme
  function getThemeColors(){
    const isLight = document.body.dataset.theme === 'light';
    return {
      starColor: isLight ? '#1a202c' : '#ffffff',
      linkColor: isLight ? '#2d3748' : '#cfe9ff',
      mouseLinkColor: isLight ? '#1a202c' : '#aee7ff',
    };
  }
  let themeColors = getThemeColors();

  function resize(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.round(width * DPR);
    canvas.height = Math.round(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initStars();
  }

  function initStars(){
    const area = width * height;
    const target = Math.min(220, Math.max(50, Math.floor(area / config.density)));
    // preserve some stars positions if resizing larger
    const old = stars.slice(0, Math.min(stars.length, target));
    stars = [];
    for(let i=0;i<target;i++){
      if(i < old.length){
        stars.push(old[i]);
        continue;
      }
      stars.push(createStar());
    }
  }

  function createStar(){
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
      alpha: 0.2 + Math.random() * 0.9,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: config.twinkleSpeed * (0.5 + Math.random()),
      vx: (Math.random() - 0.5) * 0.02, // tiny drift
      vy: (Math.random() - 0.5) * 0.02
    };
  }

  function update(dt){
    for(const s of stars){
      s.twinkle += s.twinkleSpeed * dt;
      s.alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.twinkle));
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if(s.x < 0) s.x = width + (s.x % width);
      if(s.x > width) s.x = s.x % width;
      if(s.y < 0) s.y = height + (s.y % height);
      if(s.y > height) s.y = s.y % height;
    }
  }

  function draw(){
    ctx.clearRect(0,0,width,height);
    const isLight = document.body.dataset.theme === 'light';
    const starAlphaMultiplier = isLight ? 1.0 : 0.9;
    const linkAlphaMultiplier = isLight ? 0.9 : 0.7;
    const mouseLinkAlphaMultiplier = isLight ? 1.0 : 0.9;

    // subtle background stars glow using global composite
    for(const s of stars){
      ctx.beginPath();
      ctx.globalAlpha = s.alpha * starAlphaMultiplier;
      ctx.fillStyle = themeColors.starColor;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // draw links
    const maxDist = config.linkDistance;
    for(let i=0;i<stars.length;i++){
      const a = stars[i];
      let links = 0;
      for(let j=i+1;j<stars.length;j++){
        const b = stars[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if(dist <= maxDist){
          const alpha = (1 - dist / maxDist) * linkAlphaMultiplier * Math.min(a.alpha, b.alpha);
          ctx.beginPath();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = themeColors.linkColor;
          ctx.lineWidth = isLight ? 0.9 : 0.7;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          links++;
          if(links >= config.maxLinks) break;
        }
      }
      // link to mouse if active
      if(mouse.active && mouse.x !== null){
        const dxm = a.x - mouse.x;
        const dym = a.y - mouse.y;
        const distm = Math.hypot(dxm, dym);
        if(distm <= maxDist * 1.1){
          const alphaM = (1 - distm / (maxDist*1.1)) * mouseLinkAlphaMultiplier * a.alpha;
          ctx.beginPath();
          ctx.globalAlpha = alphaM;
          ctx.strokeStyle = themeColors.mouseLinkColor;
          ctx.lineWidth = isLight ? 1.4 : 1.1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
  }

  let last = performance.now();
  function frame(now){
    const dt = Math.min(60, now - last) / 16.666; // normalize to ~60fps baseline
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // events
  window.addEventListener('mousemove', function(e){
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }, {passive:true});
  window.addEventListener('mouseleave', function(){ mouse.x = null; mouse.y = null; mouse.active=false}, {passive:true});
  window.addEventListener('touchmove', function(e){
    const t = e.touches[0];
    if(t){ mouse.x = t.clientX; mouse.y = t.clientY; mouse.active = true; }
  }, {passive:true});
  window.addEventListener('touchend', function(){ mouse.x = null; mouse.y = null; mouse.active=false}, {passive:true});

  // watch for theme changes
  const themeObserver = new MutationObserver(function(mutations){
    for(const mutation of mutations){
      if(mutation.type === 'attributes' && mutation.attributeName === 'data-theme'){
        themeColors = getThemeColors();
        break;
      }
    }
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  // initialize and start
  resize();
  requestAnimationFrame(frame);
  window.addEventListener('resize', resize);
})();
