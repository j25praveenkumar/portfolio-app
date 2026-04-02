import { useEffect, useRef } from "react";

// Exact port of toukoum.fr fluid simulation
// Config: SIM_RESOLUTION:128, DYE_RESOLUTION:1440, DENSITY_DISSIPATION:0.5,
//         VELOCITY_DISSIPATION:3, PRESSURE:0.1, CURL:3, SPLAT_RADIUS:0.2, SPLAT_FORCE:6000

export default function LivelyBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    // Resize canvas to match display
    function scaleByPixelRatio(v) { return Math.floor(v * (window.devicePixelRatio || 1)); }
    function resizeCanvas() {
      const w = scaleByPixelRatio(canvas.clientWidth);
      const h = scaleByPixelRatio(canvas.clientHeight);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
      return false;
    }
    resizeCanvas();

    const config = {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1440,
      DENSITY_DISSIPATION: 0.5,
      VELOCITY_DISSIPATION: 3,
      PRESSURE: 0.1,
      PRESSURE_ITERATIONS: 20,
      CURL: 3,
      SPLAT_RADIUS: 0.2,
      SPLAT_FORCE: 6000,
      SHADING: true,
      COLOR_UPDATE_SPEED: 10,
    };

    // WebGL context
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext("webgl2", params);
    const isWebGL2 = !!gl;
    if (!isWebGL2) gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);

    let halfFloat, supportLinearFiltering;
    if (isWebGL2) {
      gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
    }
    gl.clearColor(0, 0, 0, 1);
    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;

    function supportRenderTextureFormat(internalFormat, format, type) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    }
    function getSupportedFormat(internalFormat, format, type) {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        if (internalFormat === gl.R16F) return getSupportedFormat(gl.RG16F, gl.RG, type);
        if (internalFormat === gl.RG16F) return getSupportedFormat(gl.RGBA16F, gl.RGBA, type);
        return null;
      }
      return { internalFormat, format };
    }

    let formatRGBA, formatRG, formatR;
    if (isWebGL2) {
      formatRGBA = getSupportedFormat(gl.RGBA16F, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl.RG16F, gl.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl.R16F, gl.RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
    }
    const ext = { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering };

    if (!ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }

    // Shader compilation
    function compileShader(type, source, keywords) {
      let src = source;
      if (keywords) src = keywords.map(k => `#define ${k}\n`).join("") + src;
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    }
    function createProgram(vs, fs) {
      const p = gl.createProgram();
      gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
      return p;
    }
    function getUniforms(program) {
      const u = {};
      const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(program, i).name; u[name] = gl.getUniformLocation(program, name); }
      return u;
    }
    class GLProgram {
      constructor(vs, fs) { this.program = createProgram(vs, fs); this.uniforms = getUniforms(this.program); }
      bind() { gl.useProgram(this.program); }
    }
    class Material {
      constructor(vs, fsSrc) { this.vs = vs; this.fsSrc = fsSrc; this.programs = {}; this.activeProgram = null; this.uniforms = {}; }
      setKeywords(kw) {
        const hash = kw.reduce((h, k) => { for (let i = 0; i < k.length; i++) h = (h << 5) - h + k.charCodeAt(i) | 0; return h; }, 0);
        if (!this.programs[hash]) {
          const fs = compileShader(gl.FRAGMENT_SHADER, this.fsSrc, kw);
          this.programs[hash] = createProgram(this.vs, fs);
        }
        if (this.programs[hash] === this.activeProgram) return;
        this.uniforms = getUniforms(this.programs[hash]);
        this.activeProgram = this.programs[hash];
      }
      bind() { gl.useProgram(this.activeProgram); }
    }

    // Vertex shaders
    const baseVS = compileShader(gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform vec2 texelSize;
      void main(){
        vUv=aPosition*0.5+0.5;
        vL=vUv-vec2(texelSize.x,0.0); vR=vUv+vec2(texelSize.x,0.0);
        vT=vUv+vec2(0.0,texelSize.y); vB=vUv-vec2(0.0,texelSize.y);
        gl_Position=vec4(aPosition,0.0,1.0);
      }`);

    // Fragment shaders
    const copyFS = compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; uniform sampler2D uTexture; void main(){ gl_FragColor=texture2D(uTexture,vUv); }`);
    const clearFS = compileShader(gl.FRAGMENT_SHADER, `precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value; void main(){ gl_FragColor=value*texture2D(uTexture,vUv); }`);
    const splatFS = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float; precision highp sampler2D;
      varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio;
      uniform vec3 color; uniform vec2 point; uniform float radius;
      void main(){
        vec2 p=vUv-point.xy; p.x*=aspectRatio;
        vec3 splat=exp(-dot(p,p)/radius)*color;
        gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+splat,1.0);
      }`);
    const advectionFS = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float; precision highp sampler2D;
      varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;
      uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;
      vec4 bilerp(sampler2D sam,vec2 uv,vec2 ts){
        vec2 st=uv/ts-0.5; vec2 iuv=floor(st); vec2 fuv=fract(st);
        vec4 a=texture2D(sam,(iuv+vec2(0.5,0.5))*ts); vec4 b=texture2D(sam,(iuv+vec2(1.5,0.5))*ts);
        vec4 c=texture2D(sam,(iuv+vec2(0.5,1.5))*ts); vec4 d=texture2D(sam,(iuv+vec2(1.5,1.5))*ts);
        return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);
      }
      void main(){
        #ifdef MANUAL_FILTERING
          vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;
          vec4 result=bilerp(uSource,coord,dyeTexelSize);
        #else
          vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;
          vec4 result=texture2D(uSource,coord);
        #endif
        gl_FragColor=result/(1.0+dissipation*dt);
      }`, ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"]);
    const divergenceFS = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main(){
        float L=texture2D(uVelocity,vL).x,R=texture2D(uVelocity,vR).x;
        float T=texture2D(uVelocity,vT).y,B=texture2D(uVelocity,vB).y;
        vec2 C=texture2D(uVelocity,vUv).xy;
        if(vL.x<0.0)L=-C.x; if(vR.x>1.0)R=-C.x; if(vT.y>1.0)T=-C.y; if(vB.y<0.0)B=-C.y;
        gl_FragColor=vec4(0.5*(R-L+T-B),0.0,0.0,1.0);
      }`);
    const curlFS = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main(){
        float L=texture2D(uVelocity,vL).y,R=texture2D(uVelocity,vR).y;
        float T=texture2D(uVelocity,vT).x,B=texture2D(uVelocity,vB).x;
        gl_FragColor=vec4(0.5*(R-L-T+B),0.0,0.0,1.0);
      }`);
    const vorticityFS = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float; precision highp sampler2D;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
      void main(){
        float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x;
        float T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x,C=texture2D(uCurl,vUv).x;
        vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));
        force/=length(force)+0.0001; force*=curl*C; force.y*=-1.0;
        vec2 vel=texture2D(uVelocity,vUv).xy+force*dt;
        gl_FragColor=vec4(clamp(vel,-1000.0,1000.0),0.0,1.0);
      }`);
    const pressureFS = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
      uniform sampler2D uPressure; uniform sampler2D uDivergence;
      void main(){
        float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x;
        float T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;
        float div=texture2D(uDivergence,vUv).x;
        gl_FragColor=vec4((L+R+B+T-div)*0.25,0.0,0.0,1.0);
      }`);
    const gradSubFS = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D;
      varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
      uniform sampler2D uPressure; uniform sampler2D uVelocity;
      void main(){
        float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x;
        float T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;
        vec2 vel=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B);
        gl_FragColor=vec4(vel,0.0,1.0);
      }`);
    // Exact Toukoum display shader — no background color, just fluid with optional shading
    const displayFSSrc = `
      precision highp float; precision highp sampler2D;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uTexture; uniform vec2 texelSize;
      void main(){
        vec3 c=texture2D(uTexture,vUv).rgb;
        #ifdef SHADING
          vec3 lc=texture2D(uTexture,vL).rgb,rc=texture2D(uTexture,vR).rgb;
          vec3 tc=texture2D(uTexture,vT).rgb,bc=texture2D(uTexture,vB).rgb;
          float dx=length(rc)-length(lc),dy=length(tc)-length(bc);
          vec3 n=normalize(vec3(dx,dy,length(texelSize)));
          float diffuse=clamp(dot(n,vec3(0.0,0.0,1.0))+0.7,0.7,1.0);
          c*=diffuse;
        #endif
        float a=max(c.r,max(c.g,c.b));
        gl_FragColor=vec4(c,a);
      }`;

    // Programs
    const copyProgram = new GLProgram(baseVS, copyFS);
    const clearProgram = new GLProgram(baseVS, clearFS);
    const splatProgram = new GLProgram(baseVS, splatFS);
    const advectionProgram = new GLProgram(baseVS, advectionFS);
    const divergenceProgram = new GLProgram(baseVS, divergenceFS);
    const curlProgram = new GLProgram(baseVS, curlFS);
    const vorticityProgram = new GLProgram(baseVS, vorticityFS);
    const pressureProgram = new GLProgram(baseVS, pressureFS);
    const gradSubProgram = new GLProgram(baseVS, gradSubFS);
    const displayMaterial = new Material(baseVS, displayFSSrc);

    // Blit — exact Toukoum D() function
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function blit(target) {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    // FBO helpers — exact Toukoum B() and I()
    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture: tex, fbo, width: w, height: h,
        texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; }
      };
    }
    function createDoubleFBO(w, h, internalFormat, format, type, param) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; }, set read(v) { fbo1 = v; },
        get write() { return fbo2; }, set write(v) { fbo2 = v; },
        swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; }
      };
    }
    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
      if (target.width === w && target.height === h) return target;
      const newRead = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      gl.uniform1i(copyProgram.uniforms.uTexture, target.read.attach(0));
      blit(newRead);
      target.read = newRead;
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w; target.height = h;
      target.texelSizeX = 1 / w; target.texelSizeY = 1 / h;
      return target;
    }

    function getResolution(res) {
      let ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (ar < 1) ar = 1 / ar;
      const min = Math.round(res), max = Math.round(res * ar);
      return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    // FBO state
    let dyeFBO, velocityFBO, divergenceFBO, curlFBO, pressureFBO;

    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);
      dyeFBO = dyeFBO ? resizeDoubleFBO(dyeFBO, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering)
        : createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      velocityFBO = velocityFBO ? resizeDoubleFBO(velocityFBO, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering)
        : createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      divergenceFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curlFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressureFBO = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    // Color generation — exact Toukoum q() function: HSV(random,1,1) * 0.15
    function generateColor() {
      const h = Math.random(), s = 1, v = 1;
      const i = Math.floor(h * 6), f = h * 6 - i;
      const p = v * (1 - s), q2 = v * (1 - f * s), t = v * (1 - (1 - f) * s);
      let r, g, b;
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break; case 1: r = q2; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break; case 3: r = p; g = q2; b = v; break;
        case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q2; break;
      }
      return { r: r * 0.15, g: g * 0.15, b: b * 0.15 };
    }

    // Splat — exact Toukoum H() function
    function splat(x, y, dx, dy, color) {
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocityFBO.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
      let radius = config.SPLAT_RADIUS / 100;
      if (canvas.width / canvas.height > 1) radius *= canvas.width / canvas.height;
      gl.uniform1f(splatProgram.uniforms.radius, radius);
      blit(velocityFBO.write); velocityFBO.swap();
      gl.uniform1i(splatProgram.uniforms.uTarget, dyeFBO.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(dyeFBO.write); dyeFBO.swap();
    }

    // Pointer state
    const pointer = {
      id: -1, texcoordX: 0, texcoordY: 0, prevTexcoordX: 0, prevTexcoordY: 0,
      deltaX: 0, deltaY: 0, down: false, moved: false, color: generateColor()
    };

    // Pointer update — exact Toukoum W() function
    function updatePointerMove(posX, posY, color) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1 - posY / canvas.height;
      let dx = pointer.texcoordX - pointer.prevTexcoordX;
      let dy = pointer.texcoordY - pointer.prevTexcoordY;
      const ar = canvas.width / canvas.height;
      if (ar < 1) dx *= ar;
      if (ar > 1) dy /= ar;
      pointer.deltaX = dx;
      pointer.deltaY = dy;
      pointer.moved = Math.abs(dx) > 0 || Math.abs(dy) > 0;
      pointer.color = color;
    }

    // Simulation step — exact Toukoum step inside G()
    function step(dt) {
      gl.disable(gl.BLEND);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocityFBO.read.attach(0));
      blit(curlFBO);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocityFBO.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curlFBO.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocityFBO.write); velocityFBO.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocityFBO.read.attach(0));
      blit(divergenceFBO);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, pressureFBO.read.attach(0));
      gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      blit(pressureFBO.write); pressureFBO.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergenceFBO.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressureFBO.read.attach(1));
        blit(pressureFBO.write); pressureFBO.swap();
      }

      gradSubProgram.bind();
      gl.uniform2f(gradSubProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
      gl.uniform1i(gradSubProgram.uniforms.uPressure, pressureFBO.read.attach(0));
      gl.uniform1i(gradSubProgram.uniforms.uVelocity, velocityFBO.read.attach(1));
      blit(velocityFBO.write); velocityFBO.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
      if (!ext.supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
      const velId = velocityFBO.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velId);
      gl.uniform1i(advectionProgram.uniforms.uSource, velId);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocityFBO.write); velocityFBO.swap();

      if (!ext.supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dyeFBO.texelSizeX, dyeFBO.texelSizeY);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityFBO.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, dyeFBO.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dyeFBO.write); dyeFBO.swap();
    }

    // Display — exact Toukoum render: blendFunc(ONE, ONE_MINUS_SRC_ALPHA), draw to null
    // White background comes from CSS body background
    function render() {
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      const kw = [];
      if (config.SHADING) kw.push("SHADING");
      displayMaterial.setKeywords(kw);
      displayMaterial.bind();
      if (config.SHADING) gl.uniform2f(displayMaterial.uniforms.texelSize, 1 / w, 1 / h);
      gl.uniform1i(displayMaterial.uniforms.uTexture, dyeFBO.read.attach(0));
      blit(null);
    }

    // Main loop — exact Toukoum G()
    let lastTime = Date.now(), colorTimer = 0, animId;
    function update() {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.016666);
      lastTime = now;

      if (resizeCanvas()) initFramebuffers();

      // Color update timer
      colorTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorTimer >= 1) {
        colorTimer = colorTimer % 1;
        pointer.color = generateColor();
      }

      // Apply pointer movement
      if (pointer.moved) {
        pointer.moved = false;
        splat(pointer.texcoordX, pointer.texcoordY, pointer.deltaX * config.SPLAT_FORCE, pointer.deltaY * config.SPLAT_FORCE, pointer.color);
      }

      step(dt);
      render();
      animId = requestAnimationFrame(update);
    }

    // Event listeners — exact Toukoum pattern
    // First mousemove: init pointer position (no splat yet)
    let firstMove = true;
    const onFirstMove = (e) => {
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1 - posY / canvas.height;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      firstMove = false;
      window.removeEventListener("mousemove", onFirstMove);
    };

    // Subsequent mousemove: update and splat — Toukoum fires on every mousemove, no click needed
    const onMouseMove = (e) => {
      if (firstMove) return;
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      updatePointerMove(posX, posY, pointer.color);
    };

    // Touch support
    const onTouchMove = (e) => {
      const t = e.targetTouches[0];
      updatePointerMove(scaleByPixelRatio(t.clientX), scaleByPixelRatio(t.clientY), pointer.color);
    };

    window.addEventListener("mousemove", onFirstMove);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, false);

    // Init and start
    initFramebuffers();

    // Seed initial splats — exact Toukoum: color*10, random positions
    for (let i = 0; i < 8; i++) {
      const c = generateColor();
      c.r *= 10; c.g *= 10; c.b *= 10;
      splat(Math.random(), Math.random(), 1000 * (Math.random() - 0.5), 1000 * (Math.random() - 0.5), c);
    }

    update();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onFirstMove);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: 0, pointerEvents: "none",
      }}
    />
  );
}
