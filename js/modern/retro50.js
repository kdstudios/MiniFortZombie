/* ==========================================================================================================
   MINI FORT ZOMBIE - 1950s RETRO VEHICLE KIT (v078)
   A procedural generator for the whole retro fleet, built on the Modern prop kit (RGPK Maker/prefab) exactly like the original
   Modern cars and trucks. It replaces the six original car bodies (sedan, hatch, suv, mpv, cross, offroad), the jeep, the army
   truck and the service vehicles with 50s designs: chrome, fins, whitewalls, two-tone paint, bullet bumpers, wood panelling...

   Frame: wheels on y = 0, FRONT = +Z, x lateral (the same frame MFZV.make gives the finished group).
   Paint: every vehicle has a PRIMARY paint (material carpaint, or dustpaint when dusty) and an ACCENT paint (carpaint2 /
   dustpaint2) for roofs, side sweeps and fenders. Colours are applied when stamping (Maker.put tint object), so one model
   appears in any colour: tint = {carpaint:[r,g,b], carpaint2:[r,g,b], dustpaint:.., dustpaint2:..}. RGRETRO.tint() builds one
   from a 50s palette index or from any legacy [r,g,b] (the accent is then derived).
   API: RGPK.PF.retro(kind, opts) -> prefab ;  RGRETRO.kinds, RGRETRO.paints, RGRETRO.tint(opts), RGRETRO.meta[kind]
   ========================================================================================================== */
(function(){
'use strict';
const K=window.RGPK;
if(!K||!K.I||!K.PF||!K.prefab){console.warn('[retro50] kit missing');return}
const PF=K.PF,I=K.I,prefab=K.prefab,PI=Math.PI,TAU=PI*2;
const DECALS={};
const lerp=I.lerp,clamp=I.clamp,hyp3=I.hyp3,hyp=(x,y)=>Math.sqrt(x*x+y*y);
const sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const sc3=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const poly=(P,z)=>{if(z<=P[0][0])return P[0][1];for(let i=1;i<P.length;i++)if(z<=P[i][0]){const a=P[i-1],b=P[i];return lerp(a[1],b[1],(z-a[0])/((b[0]-a[0])||1))}return P[P.length-1][1]};
const chaikin=(P,it)=>{for(let k=0;k<it;k++){const Q=[P[0]];for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];Q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}Q.push(P[P.length-1]);P=Q}return P};

/* ---------------------------------------------------------------- 50s paint schemes: [name, primary, accent] */
const PAINTS=[
 ['Tropical Turquoise',[.10,.58,.58],[.95,.94,.86]],
 ['Cherry Red',[.64,.07,.09],[.95,.93,.85]],
 ['Flamingo Pink',[.88,.42,.52],[.13,.13,.14]],
 ['Sea Foam',[.50,.78,.66],[.95,.94,.88]],
 ['Sunburst Yellow',[.93,.72,.12],[.13,.13,.14]],
 ['Sky Blue',[.40,.62,.86],[.95,.94,.9]],
 ['Admiral Blue',[.06,.14,.40],[.94,.92,.84]],
 ['Coral',[.90,.38,.17],[.95,.93,.85]],
 ['Charcoal & Rose',[.17,.17,.19],[.86,.45,.52]],
 ['Pistachio',[.60,.75,.38],[.95,.93,.86]],
 ['Lilac',[.60,.48,.78],[.95,.94,.9]],
 ['Cream & Cherry',[.90,.86,.70],[.64,.07,.09]],
 ['Forest Green',[.10,.30,.16],[.93,.9,.78]],
 ['Dusty Rose',[.78,.55,.55],[.92,.9,.82]],
];
const lum=c=>.2126*c[0]+.7152*c[1]+.0722*c[2];
const accentFor=b=>lum(b)<.3?[.93,.9,.8]:lum(b)<.62?[.95,.93,.85]:[.17,.17,.19];
/* tint object for Maker.put from opts: {ci} palette index, {tint:[r,g,b]} legacy colour, {tint:{...}} passthrough, {accent:[r,g,b]} */
function tint(o){
 o=o||{};if(o.tint&&!Array.isArray(o.tint)&&typeof o.tint==='object')return o.tint;
 let b,a;
 if(Array.isArray(o.tint)){b=o.tint;a=o.accent||accentFor(b)}else{const p=PAINTS[((o.ci||0)%PAINTS.length+PAINTS.length)%PAINTS.length];b=p[1];a=o.accent||p[2]}
 return{carpaint:b,carpaint2:a,dustpaint:mix(b,[.55,.5,.44],.28),dustpaint2:mix(a,[.55,.5,.44],.3)};
}

/* ---------------------------------------------------------------- small colour table */
const C={
 chrome:[.92,.92,.9],chromeD:[.62,.63,.64],black:[.035,.035,.04],trim:[.05,.05,.055],red:[.72,.05,.04],amber:[.95,.55,.1],white:[.95,.95,.92],
 glass:[.12,.2,.19],glassD:[.5,.48,.42],cream:[.9,.85,.7],vinyl:[.78,.7,.52],vinylR:[.62,.1,.1],dark:[.03,.03,.03],rubber:[.06,.06,.06],
 wood:[.62,.4,.2],woodD:[.5,.32,.16],canvas:[.72,.66,.52],brass:[.86,.68,.26],olive:[.33,.38,.22],rust:[.3,.2,.14],
};

/* ---------------------------------------------------------------- wheel + tyre
   o.kind: 'disc' (dog-dish hubcap) | 'cap' (full chrome cap with spinner ring) | 'wire' (wire spokes) | 'steel' (painted truck wheel, lugs)
           | 'mag' (slotted racing wheel) | 'moon' (flat moon disc)
   o.ww whitewall width (0 = none) ; o.wide wider tyre ; o.rim painted rim colour ; o.dust */
function wheel50(M,r,w,o){
 o=o||{};const hw=w/2,s=-(o.side||1),k=r/.33;
 M.save().move(0,r,0).rotZ(PI/2);
 const prof=[[r*.60,-hw],[r*.92,-hw-.006],[r,-hw*.5],[r,hw*.5],[r*.92,hw+.006],[r*.60,hw]];
 M.color(o.dust?[.62,.57,.5]:[1,1,1]);M.uvS=1;
 if(o.tread){const nb=o.tread,d=.028*k,rows=prof.length-1;
  M.surf('rubber',nb*2,rows,(u,v)=>{const f=v*rows,j=Math.min(rows-1,Math.floor(f)),t=f-j,a=prof[j],b=prof[j+1],ax=lerp(a[1],b[1],t);
   const band=1-sm(.55,.95,Math.abs(ax)/hw),rr=lerp(a[0],b[0],t)-d*band*(.5+.5*Math.cos((u*nb+(Math.abs(ax)/hw)*.45)*TAU));
   return[Math.cos(u*TAU)*rr,ax,Math.sin(u*TAU)*rr]},{closeU:true,flipN:true,uL:TAU*r*1.4,vL:w})}
 else M.lathe('rubber',prof,18,{sharp:.45,uR:r*1.4});
 // whitewall band on the outer sidewall (local +y points to -x, so the outer face of side +1 is local -y)
 if(o.ww>0&&!o.noWW){const rr0=r*.66,rr1=Math.min(r*.9,rr0+o.ww),y0=hw+(rr0-r*.6)/(r*.32)*.006+.0015,y1=hw+(rr1-r*.6)/(r*.32)*.006+.0015;
  M.color(o.dust?[.7,.66,.58]:[.95,.95,.92]);
  M.lathe('whitewall',[[rr0,-s*y0],[(rr0+rr1)/2,-s*(y0+y1)/2],[rr1,-s*y1]],20,{sharp:.95});
  // thin red pinstripe edge on the white band inner side for some tyres
  if(o.redline){M.color([.7,.08,.08]);M.lathe('paint',[[rr0-.006,-s*(y0-.001)],[rr0,-s*y0]],20,{sharp:.95})}}
 const face=y=>{M.save().move(0,s*y,0);if(s<0)M.rotX(PI)}; // local +y = outward
 const rim=o.rim||C.chromeD;
 // rim well + back plate (painted steel)
 M.color(o.kind==='steel'||o.kind==='mag'?rim:[.5,.5,.52]);
 M.lathe('steel',[[0,-s*(hw-.03)],[r*.6,-s*(hw-.03)],[r*.6,s*(hw-.03)],[r*.54,s*(hw-.05)],[r*.3,s*(hw-.03)],[0,s*(hw-.03)]],14,{sharp:.5});
 if(o.kind==='disc'||o.kind==='cap'||o.kind==='moon'){
  face(hw-.03);
  const cc=o.kind==='moon'?(o.rim||C.chromeD):C.chrome;M.color(cc);
  // dished chrome cover: shallow dome, rim lip
  M.lathe('chrome',[[r*.58,0],[r*.56,.012],[r*.4,.028],[r*.2,.036],[r*.1,.046],[r*.035,.052],[0,.052]],16,{sharp:.7});
  if(o.kind==='cap'){ // spinner ring + rim trim ring
   M.color(C.chromeD);M.tube('chrome',.006,Array.from({length:13},(_,i)=>{const a=i/12*TAU;return[Math.cos(a)*r*.32,.032,Math.sin(a)*r*.32]}),3);
   for(let i=0;i<8;i++){const a=i/8*TAU;M.color(C.black);M.save().move(Math.cos(a)*r*.46,.024,Math.sin(a)*r*.46).rotY(-a);M.boxB('dark',-.012,.012,0,.002,-.03,.03);M.restore()}
   M.color(C.chrome);M.save().move(0,.05,0);M.lathe('chrome',[[0,0],[r*.07,.004],[r*.1,.02],[r*.05,.04],[0,.045]],10,{sharp:.5});M.restore()}
  else if(o.kind==='disc'){M.color(o.hubCol||[.8,.1,.1]);M.save().move(0,.05,0);M.cyl('paint',r*.07,.006,10,{caps:'t'});M.restore();
   M.color(C.chromeD);M.tube('chrome',.004,Array.from({length:13},(_,i)=>{const a=i/12*TAU;return[Math.cos(a)*r*.3,.034,Math.sin(a)*r*.3]}),3)}
  M.restore();
 } else if(o.kind==='wire'){
  face(hw-.03);const n=o.spokes||18;
  M.color(C.chrome);
  M.lathe('chrome',[[r*.6,.0],[r*.58,.008],[r*.54,.0]],14,{sharp:.9});            // rim ring
  M.save().move(0,.012,0);M.cyl('chrome',r*.11,.04,10,{r1:r*.085,caps:'t'});M.restore(); // knock-off hub
  M.color(o.dust?[.55,.5,.45]:[.8,.8,.78]);
  for(let i=0;i<n;i++){const a=i/n*TAU,a2=a+(i%2?.5:-.5)*.22,y=i%2?.018:.004;
   M.tube('chrome',.0035,[[Math.cos(a)*r*.12,.02,Math.sin(a)*r*.12],[Math.cos(a2)*r*.57,y,Math.sin(a2)*r*.57]],3)}
  M.color([.12,.12,.12]);M.save().move(0,.006,0);M.cyl('dark',r*.55,.004,14,{caps:'t'});M.restore();
  M.color(C.red);M.save().move(0,.05,0);M.cyl('paint',r*.04,.006,8,{caps:'t'});M.restore();
  M.restore();
 } else if(o.kind==='steel'){
  face(hw-.04);const big=r>.42,n=big?8:6;
  M.color(o.rim||[.72,.72,.7]);M.cyl('steel',r*.24,.07,10,{r1:r*.18,caps:'t'});
  M.color(C.chromeD);
  for(let i=0;i<n;i++){const a=i/n*TAU;M.save().move(Math.cos(a)*r*.34,.0,Math.sin(a)*r*.34);M.cyl('steel',r*.032,.045,6,{caps:'t'});M.restore()}
  for(let i=0;i<n;i++){const a=i/n*TAU;M.color([.16,.16,.16]);M.save().move(Math.cos(a+PI/n)*r*.44,0,Math.sin(a+PI/n)*r*.44);M.cyl('dark',r*.06,.012,8,{caps:'t'});M.restore()}
  M.color(o.rim||[.72,.72,.7]);M.tube('steel',.012,Array.from({length:13},(_,i)=>{const a=i/12*TAU;return[Math.cos(a)*r*.56,.012,Math.sin(a)*r*.56]}),3);
  M.restore();
 } else if(o.kind==='mag'){
  face(hw-.03);const n=5;M.color(C.chrome);
  M.cyl('chrome',r*.14,.05,10,{r1:r*.1,caps:'t'});
  for(let i=0;i<n;i++){const a=i/n*TAU;M.save().rotY(-a);M.boxB('chrome',r*.1,r*.58,0,.03,-r*.07,r*.07,{bevel:.008});M.restore()}
  M.lathe('chrome',[[r*.6,0],[r*.57,.012],[r*.54,0]],14,{sharp:.9});M.restore();
 }
 M.restore();
}

/* ---------------------------------------------------------------- body sections (a car's lower body, one smooth skin)
   S: zr zf (rear / front ends), w (half width), yb yt-line `top` [[z,y]...], ym, n, ax [rear axle, front axle], ra (arch radius), r (wheel radius)
      yf yr (underside at the ends), rc/rt/rb [rear,front] roundings (plan corners, top edge, bottom edge) */
function bodyGeo(S){
 if(S._g)return S._g;
 const cy=S.r+.02,top=chaikin(S.top,3);
 const cut=(d,r)=>d>=r?0:r-Math.sqrt(Math.max(0,r*r-(r-d)*(r-d)));
 /* v088: sec() is pure in z and is asked for the same z many times over (finite differences, end bisection): remember it */
 const secM=new Map();
 const sec=z=>{let r=secM.get(z);if(r===undefined){if(secM.size>40000)secM.clear();r=sec0(z);secM.set(z,r)}return r};
 const sec0=z=>{
  const kf=(S.zf-z)<(z-S.zr)?1:0,d=Math.max(0,kf?S.zf-z:z-S.zr);
  let yb=(z<S.ax[0]?S.yr:z>S.ax[1]?S.yf:S.yb)+cut(d,S.rb[kf]);
  for(const az of S.ax){const dz=Math.abs(z-az),ra=S.ra;if(dz<ra)yb=Math.max(yb,cy+Math.sqrt(ra*ra-dz*dz))}
  const yt=poly(top,z)-cut(d,S.rt[kf]);
  const w=(S.wf?lerp(S.w,S.wf,sm(S.ax[0],S.ax[1]+.4,z)):S.w)-cut(d,S.rc[kf]);
  return{z,w,yb,yt,ym:clamp(Math.max(S.ym,yb+.08),yb+.02,yt-.04),n:S.n}};
 const tubEnv=z=>{const T=S.tub;if(!T||z<T.z0||z>T.z1)return -1;const e=Math.min(sm(T.z0,T.z0+.28,z),1-sm(T.z1-.28,T.z1,z));return e};
 const xAt=(y,z)=>{const s=sec(z);const te=tubEnv(z);if(te>0&&y>s.yt-.03&&y<=S.tub.top+.02)return s.w*lerp(.9,1,te);y=clamp(y,s.yb+.025,s.yt-.012);const t=y>=s.ym?(y-s.ym)/Math.max(.01,s.yt-s.ym):(s.ym-y)/Math.max(.01,s.ym-s.yb);return t>=1?s.w*.12:s.w*Math.pow(Math.max(0,1-Math.pow(t,s.n)),1/s.n)};
 const yTop=(x,z)=>{const s=sec(z),t=Math.abs(x)/s.w;return t>=1?s.ym:s.ym+(s.yt-s.ym)*Math.pow(1-Math.pow(t,s.n),1/s.n)};
 return S._g={sec,xAt,yTop,cy,top};
}
/* z samples: regular + refined near the ends and the wheel arches */
function zSamples(S,step){
 const zs=[S.zf];for(let z=S.zr;z<S.zf;z+=step||.25)zs.push(z);
 for(const [z0,d,k] of [[S.zr,1,0],[S.zf,-1,1]]){const R=Math.max(S.rc[k],S.rt[k],S.rb[k]);for(let i=0;i<=7;i++)zs.push(z0+d*R*(1-Math.cos(i/7*PI/2)))}
 for(const az of S.ax){for(let i=0;i<=10;i++)zs.push(az+S.ra*Math.cos(i/10*PI));zs.push(az-S.ra-.004,az+S.ra+.004)}
 return[...new Set(zs.map(z=>+clamp(z,S.zr,S.zf).toFixed(4)))].sort((a,b)=>a-b).filter((z,i,A)=>i===0||z-A[i-1]>.006);
}
/* a skin patch hugging the body flank (side sd, z0..z1, y between y0(s,z) and y1(s,z)), pushed off the metal by `off` */
function sideSkin(M,G,mat,sd,z0,z1,y0,y1,off,nu,nv){
 M.surf(mat,nu,nv,(u,v)=>{
  const z=lerp(z0,z1,u),s=G.sec(z),y=lerp(y0(s,z),y1(s,z),v),e=.004,x=G.xAt(y,z);
  const hy=(G.xAt(y+e,z)-G.xAt(y-e,z))/(2*e),hz=(G.xAt(y,z+e)-G.xAt(y,z-e))/(2*e),l=hyp3(1,hy,hz);
  return[sd*(x+off/l),y-hy*off/l,z-hz*off/l]},{flipN:sd>0,uL:z1-z0,vL:.5});
}
/* a path (list of [z,y]) laid on the flank at offset off -> 3D points for tubes */
function flankPath(G,sd,pts,off){return pts.map(([z,y])=>{const x=G.xAt(y,z),e=.004,hy=(G.xAt(y+e,z)-G.xAt(y-e,z))/(2*e),hz=(G.xAt(y,z+e)-G.xAt(y,z-e))/(2*e),l=hyp3(1,hy,hz);return[sd*(x+off/l),y-hy*off/l,z-hz*off/l]})}
/* end conforming patches: d=+1 front, -1 rear. x0..x1, y0..y1 in body terms; off pushes out along the end normal */
function endTools(S,G){
 const zEnd=(x,y,d)=>{
  const inside=z=>{if(z<S.zr||z>S.zf)return false;const s=G.sec(z);return y<=s.yt&&y>=s.yb&&Math.abs(x)<=G.xAt(y,z)+1e-6};
  let a=d>0?S.zf+.01:S.zr-.01,b=d>0?S.ax[1]+S.ra:S.ax[0]-S.ra;
  if(!inside(b))return b;
  for(let i=0;i<24;i++){const m=(a+b)/2;if(inside(m))b=m;else a=m}
  return b};
 const endSkin=(M,mat,d,x0,x1,y0,y1,off,nu,nv)=>M.surf(mat,nu||6,nv||2,(u,v)=>{
  const x=lerp(x0,x1,u),y=lerp(y0,y1,v),e=.004,z=zEnd(x,y,d);
  const fx=(zEnd(x+e,y,d)-zEnd(x-e,y,d))/(2*e),fy=(zEnd(x,y+e,d)-zEnd(x,y-e,d))/(2*e),nx=d*fx,ny=d*fy,l=hyp3(nx,ny,1);
  return[x+nx*off/l*-1,y+ny*off/l*-1,z+d*off/l]},{flipN:d<0,uL:x1-x0,vL:y1-y0});
 return{zEnd,endSkin};
}

/* ---------------------------------------------------------------- cabin ("greenhouse"): a skin over the body, cut into cells
   that become roof / pillar paint, glass, or chrome window frames. Non-glass cells get a dark inner lining so the cabin is hollow
   and the interior (seats, dash, wheel) shows through the glass.
   C: roof [[z,y],...] rear base -> front base ; cw [[z,halfwidth]...] ; n ; ws [zTop,zBase] ; bl [zBase,zTop] ; win [[z0,z1],...] ;
      h0 h1 (window band as height fractions) ; pil (A-pillar angular margin) ; pilR (rear pillar margin) ; frame (chrome border)
      pillarMat 'a'|'b' ; roofMat ; arc [a0,a1] ; glass:false ; noWs ; noBl ; wsChromePillar ; lift (extra y) */
const CAB_DROP=.07,CAB_WIDE=1.08;
function cabinLoft(M,S,G,C,o){
 const e=2/(C.n||3),roofL=chaikin(C.roof,3),cwL=chaikin(C.cw,2),z0=C.roof[0][0],z1=C.roof[C.roof.length-1][0];
 const MB=o.MB,MA=o.MA,dust=!!o.dust,fr=C.frame===undefined?.03:C.frame,fh=C.frameH===undefined?.035:C.frameH;
 const secM=new Map(); // v088: same memo as bodyGeo's sec (pure in z for this cabin)
 const sec=z=>{let r=secM.get(z);if(r!==undefined)return r;
  /* v093: the cabin used to stand on the very top of the body's rounded shoulder, where the body is only two thirds of its width: a
     small glass bubble with the seats, dash and wheel poking out of it. It now starts CAB_DROP lower (inside the shoulder, where the
     body is wider) and is CAB_WIDE wider, still never wider than the body at its base. C.lowerBy / C.wide override per vehicle. */
  const yb=G.yTop(0,z)-.03+(C.lowerBy===undefined?-CAB_DROP:C.lowerBy),yt=Math.max(yb+.03,poly(roofL,z)),wBody=G.xAt(Math.max(yb,G.sec(z).ym)+.02,z)-.012;
  r={yb,yt,w:Math.min(poly(cwL,z)*(C.wide||CAB_WIDE),wBody),z};if(secM.size>40000)secM.clear();secM.set(z,r);return r};
 const ring=(z,a)=>{const s=sec(z),c=Math.cos(a),sn=Math.sin(a);return[Math.sign(c)*Math.pow(Math.abs(c),e)*s.w,s.yb+Math.pow(Math.max(0,sn),e)*(s.yt-s.yb),z]};
 const aOf=hf=>Math.asin(Math.pow(clamp(hf,0,1),1/e));
 const [aA,aB]=C.arc||[0,PI];
 const pMat=C.pillarMat==='b'?MB:MA,rMat=C.roofMat==='b'?MB:MA;
 const gm=dust?'retroglassD':'retroglass',gc=dust?C.glassD:C.glass;
 const ws=C.ws,bl=C.bl,wins=C.win||[],h0=C.h0===undefined?.12:C.h0,h1=C.h1===undefined?.78:C.h1,aP=C.pil===undefined?.34:C.pil,aPR=C.pilR===undefined?aP:C.pilR;
 // cuts
 let zc=[z0,z1];if(ws)zc.push(ws[0],ws[1]);if(bl)zc.push(bl[0],bl[1]);
 const pushF=(a,b)=>{zc.push(a,b);if(fr){zc.push(a-fr,b+fr)}};
 for(const [a,b] of wins)pushF(a,b);
 if(ws&&fr)zc.push(ws[0]-fr,ws[1]+fr);if(bl&&fr)zc.push(bl[0]-fr,bl[1]+fr);
 zc=[...new Set(zc.filter(z=>z>=z0&&z<=z1).map(z=>+z.toFixed(4)))].sort((a,b)=>a-b);
 const Z=[];for(let i=0;i<zc.length-1;i++){const n=Math.max(1,Math.ceil((zc[i+1]-zc[i])/.26));for(let k=0;k<n;k++)Z.push(lerp(zc[i],zc[i+1],k/n))}Z.push(zc[zc.length-1]);
 let ac=[aA,aB,aOf(h0),aOf(h1),PI-aOf(h0),PI-aOf(h1),aP,PI-aPR];
 if(fh){ac.push(aOf(Math.max(0,h0-fh)),aOf(Math.min(1,h1+fh)),PI-aOf(Math.max(0,h0-fh)),PI-aOf(Math.min(1,h1+fh)))}
 ac=[...new Set(ac.filter(a=>a>=aA-1e-6&&a<=aB+1e-6).map(a=>+a.toFixed(4)))].sort((a,b)=>a-b);
 const A=[];for(let i=0;i<ac.length-1;i++){const n=Math.max(1,Math.ceil((ac[i+1]-ac[i])/.34));for(let k=0;k<n;k++)A.push(lerp(ac[i],ac[i+1],k/n))}A.push(ac[ac.length-1]);
 const inI=(zm,[p,q],d)=>zm>p-d&&zm<q+d;
 const kind=(zm,am)=>{
  const hf=Math.pow(Math.max(0,Math.sin(am)),e),sideA=Math.min(am,PI-am);
  const inWs=ws&&zm>ws[0]&&zm<ws[1]&&!C.noWs,inBl=bl&&zm>bl[0]&&zm<bl[1]&&!C.noBl;
  if(inWs){
   if(am<aP||am>PI-aP)return C.chromePillar?'chrome':'pillar';
   if(fr&&(zm<ws[0]+fr||zm>ws[1]-fr))return'chrome';
   if(fr&&(am<aP+.07||am>PI-aP-.07))return'chrome';
   return C.glass===false?'pillar':'glass'}
  if(inBl){
   if(am<aPR||am>PI-aPR)return'pillar';
   if(fr&&(zm<bl[0]+fr||zm>bl[1]-fr))return'chrome';
   if(fr&&(am<aPR+.07||am>PI-aPR-.07))return'chrome';
   return C.glass===false?'pillar':'glass'}
  // side band
  if(hf>=h1+fh&&!(C.sideGlassTop))return'roof';
  for(const w of wins){
   if(zm>w[0]&&zm<w[1]&&hf>h0&&hf<h1)return C.glass===false?'pillar':'glass';
   if(fr&&inI(zm,w,fr)&&hf>h0-fh&&hf<h1+fh)return'chrome'}
  if(hf>=h1+fh)return'roof';
  if(hf<h0-fh*.2&&C.sill==='chrome')return'chrome';
  return'pillar';
 };
 const capRear=C.capRear;
 const look={glass:[gm,gc],chrome:['chrome',C.chromeC||[.9,.9,.88]],pillar:[pMat,[1,1,1]],roof:[rMat,[1,1,1]]};
 const cell=(za,zb,aa,ab,mat,col,inner)=>{
  const nu=inner?Math.max(1,Math.ceil((zb-za)/.7)):Math.max(1,Math.ceil((zb-za)/.22)),nv=inner?1:Math.max(1,Math.ceil((ab-aa)/.26));
  M.color(col);
  M.surf(mat,nu,nv,(u,v)=>{const z=lerp(za,zb,u),a=lerp(aa,ab,v),p=ring(z,a);
   if(!inner)return p;const q=ring(z,a),s=sec(z);const k=.014,cx=0,cy=s.yb+(s.yt-s.yb)*.35;const dx=q[0]-cx,dy=q[1]-cy,l=hyp(dx,dy)||1;return[q[0]-dx/l*k,q[1]-dy/l*k,q[2]]},{flipN:inner?false:true,uL:zb-za,vL:.3});
 };
 for(let j=0;j<Z.length-1;j++)for(let i=0;i<A.length-1;i++){
  const zm=(Z[j]+Z[j+1])/2,am=(A[i]+A[i+1])/2,k=kind(zm,am),[mat,col]=look[k];
  cell(Z[j],Z[j+1],A[i],A[i+1],mat,col,false);
  if(k!=='glass'&&k!=='chrome'){M.cls=1;cell(Z[j],Z[j+1],A[i],A[i+1],'plastic',k==='roof'||k==='pillar'?(C.lining||[.55,.5,.4]):[.2,.2,.2],true);M.cls=0}
 }
 if(capRear){const zc0=z0,s0=sec(zc0),capM=capRear==='b'?MB:MA;M.color([1,1,1]);
  for(const fl of[true,false])M.surf(capM,10,2,(u,v)=>{const a=lerp(aA,aB,u),p=ring(zc0,a);return[p[0],lerp(s0.yb,p[1],v),zc0]},{flipN:fl,uL:2,vL:1});}
 return{sec,ring,e,z0,z1};
}

/* ---------------------------------------------------------------- interior seen through the glass
   closed cars: compact (cushion on the lid at the beltline); open cars (C.floor): a real cockpit with a floor, seats at the right height, wheel, column, dash pod */
function interior(M,S,G,C,o,cab){
 const dust=!!o.dust;
 /* v093: every part is fitted to the inside of the cabin skin. hw(y,z): half width of the cabin at a height and station (0 outside it or
    above the roof / raked glass); roofY(z): the skin's height over the centre line. Open cars have no skin to fit to. */
 const cabF=cab&&C.floor===undefined&&!C.noFit?cab:null;
 const roofY=z=>!cabF?9:(z<=cabF.z0||z>=cabF.z1)?-9:cabF.sec(z).yt;
 const hw=(y,z)=>{if(!cabF)return 9;if(z<=cabF.z0||z>=cabF.z1)return 0;const c=cabF.sec(z);if(y>=c.yt-.02)return 0;if(y<=c.yb)return c.w;
  const f=clamp((y-c.yb)/Math.max(.01,c.yt-c.yb),0,.999);return Math.abs(cabF.ring(z,Math.asin(Math.pow(f,1/cabF.e)))[0])};
 const fitW=(w,ys,zs,m)=>{let r=w;for(const y of ys)for(const z of zs)r=Math.min(r,hw(y,z)-m);return r};
 const red=dust?[.28,.2,.16]:(o.vinyl||[.62,.16,.12]),cream=dust?[.4,.36,.3]:(o.vinyl2||[.86,.8,.64]);
 let z0=C.ws?C.ws[1]:C.roof[C.roof.length-1][0],z1=C.bl?C.bl[1]:C.roof[0][0];if(C.intZ){z0=C.intZ[0];z1=C.intZ[1]}
 const open=C.floor!==undefined,belt=(C.intBelt!==undefined?C.intBelt:G.yTop(0,(z0+z1)/2));
 const yAt=z=>Math.min(belt-.05,G.yTop(0,z)-.08);
 const xw=Math.max(.3,Math.min(...[z0,z1,(z0+z1)/2].map(z=>G.xAt(yAt(z),z)))-.1);
 const fl=open?C.floor:belt-.3,sY0=open?fl+.2:belt+.06;
 const dir=o.rhd?-1:1,wr=C.wheelR||(open?.19:.15),wy=open?fl+.52:belt+.25,span=Math.abs(z0-z1);const sYc=sY0;
 M.cls=1;
 // ---- seats: cushion + back, red vinyl with a cream band
 const seat=(zc,w,depth,hb,sx,sy)=>{
  const sY=sy===undefined?sY0:sy;
  if(cabF){ // back no taller than the roof allows, and the whole seat inside the side glass
   hb=Math.max(.1,Math.min(hb,roofY(zc-depth/2-.05)-.07-(sY-.04)));
   const lim=fitW(9,[sY-.02,sY-.04+hb],[zc-depth/2-.07,zc,zc+depth/2],.045),need=Math.abs(sx||0)+w;
   if(lim<.14)return;if(need>lim){const k=lim/need;w*=k;sx=(sx||0)*k}}
  M.save().move(sx||0,0,0);
  M.color(red);M.boxB('vinyl',-w,w,sY-.13,sY,zc-depth/2,zc+depth/2,{bevel:.045});
  M.color(cream);M.boxB('vinyl',-w+.07,w-.07,sY-.005,sY+.012,zc-depth/2+.07,zc+depth/2-.05,{bevel:.01});
  M.save().move(0,sY-.04,zc-depth/2+.02).rotX(-.16);M.color(red);M.boxB('vinyl',-w,w,0,hb,-.06,.06,{bevel:.04});
  M.color(cream);M.boxB('vinyl',-w+.07,w-.07,.07,hb-.06,.055,.066,{bevel:.01});M.restore();M.restore()};
 const zS=open?z0-.85:lerp(z0,z1,.33),nrow=(!C.single&&span>(open?2.1:1.3))?2:1;
 const bw=xw*.93;
 const bucket=!!C.bucket;
 for(let r=0;r<nrow;r++){const zc=open?zS-r*.95:(r?lerp(z0,z1,.8):zS),sy=(r&&C.rearDeck!==undefined)?C.rearDeck+.14:undefined;
  if(bucket&&r===0){for(const sx of[-1,1])seat(zc,xw*.4,.5,hb(open),sx*xw*.52)}
  else seat(zc,bw,.5,hb(open),0,sy)}
 function hb(o2){return o2?.4:.24}
 // ---- instrument panel
 // closed cars: the dash starts where the raked screen is high enough to clear it, and is as wide as the cabin is there
 let dzF=z0-.06;if(cabF)for(let i=0;i<40&&roofY(dzF)<belt+.1;i++)dzF-=.02;
 const dz1=dzF-.24,bd=open?fl+.34:belt,dw=cabF?Math.max(.12,fitW(xw,[belt+.06],[dzF,dz1],.035)):xw;
 if(open){ // pod on the cowl face + glove box
  M.color([.07,.06,.06]);M.boxB('dark',-xw,xw,fl+.3,fl+.5,z0-.03,z0+.02,{bevel:.015});
  M.color(C.chromeC||C.chrome);for(const sx of[-.4,-.15,.12,.38]){M.save().move(sx*xw*1.6,fl+.42,z0-.035).rotX(PI/2);M.cyl('chrome',.045,.012,12,{caps:'t'});M.restore()}
  M.color(C.chrome);M.boxB('chrome',-xw,xw,fl+.5,fl+.512,z0-.033,z0+.02)
 }else{
  M.color([1,1,1]);M.boxB(o.MB,-dw,dw,belt-.1,belt+.05,dz1,dzF,{bevel:.025});
  M.color([.07,.06,.06]);M.boxB('plastic',-dw+.03,dw-.03,belt+.05,belt+.065,dz1+.03,dzF-.03,{bevel:.01});
  M.color(C.chromeC||C.chrome);M.boxB('chrome',dw*.1,dw*.5,belt-.01,belt+.035,dz1-.004,dz1+.004)}
 // ---- steering wheel: thin ring, tilted top-forward, on a column that meets the dash
 let sx=dir*xw*.5,wz=(open?z0-.05:dz1-.05);const tilt=.55;
 if(cabF){ // the rim's top edge is what meets a raked screen first: back until it clears, then inboard until it clears the side glass
  for(let i=0;i<30;i++){if(roofY(wz+wr*Math.sin(tilt))>wy+wr*Math.cos(tilt)+.05&&roofY(wz)>wy+.06)break;wz-=.03}
  sx=dir*Math.max(0,Math.min(Math.abs(sx),Math.min(hw(wy,wz),hw(wy+wr*.8,wz+wr*.45),hw(wy-wr*.8,wz-wr*.45))-wr-.035))}
 const ring=(R,n)=>Array.from({length:n},(_,i)=>{const a=i/(n-1)*TAU,cy=Math.cos(a)*R,cx=Math.sin(a)*R;return[sx+cx,wy+cy*Math.cos(tilt),wz+cy*Math.sin(tilt)]});
 M.color([.1,.08,.08]);M.tube('rubber',.014,ring(wr,17),4);
 M.color(C.chrome);M.tube('chrome',.007,ring(wr*.62,13),3);
 for(let k=0;k<3;k++){const a=k/3*TAU+PI/2,p=[sx+Math.sin(a)*wr*.62,wy+Math.cos(a)*wr*.62*Math.cos(tilt),wz+Math.cos(a)*wr*.62*Math.sin(tilt)];M.tube('chrome',.006,[[sx,wy,wz],p],3)}
 M.color([.1,.1,.1]);M.tube('plastic',.02,[[sx,wy,wz],[sx,wy-.17,wz+.2]],5);
 M.color(C.chrome);M.save().move(sx,wy,wz).rotX(-(PI/2-tilt));M.cyl('chrome',.035,.02,8,{caps:'t'});M.restore();
 // ---- gear lever and handbrake in open cars
 if(open){M.color([.1,.1,.1]);M.tube('plastic',.01,[[0,fl+.1,z0-.7],[0,fl+.34,z0-.78]],4);M.color(C.chrome);M.save().move(0,fl+.36,z0-.78);M.lathe('chrome',[[0,0],[.025,.01],[.02,.03],[0,.035]],8);M.restore()}
 M.cls=0;
}
/* ---------------------------------------------------------------- shapes + small fittings */
function rrShape(w,h,r,n){n=n||3;const s=[],hw=w/2,hh=h/2;r=Math.min(r,hw,hh);
 for(const [qx,qy,a0] of [[1,-1,-PI/2],[1,1,0],[-1,1,PI/2],[-1,-1,PI]])for(let i=0;i<=n;i++){const a=a0+i/n*PI/2;s.push([qx*(hw-r)+Math.cos(a)*r,qy*(hh-r)+Math.sin(a)*r])}return s}
const circS=(r,n)=>Array.from({length:n},(_,i)=>[Math.cos(i/n*TAU)*r,Math.sin(i/n*TAU)*r]);
/* round lamp in a chrome bezel, looking along +z (dir=1) or -z (dir=-1); base at the surface point (x,y,z) */
function lampPod(M,x,y,z,r,dir,o){
 o=o||{};M.save().move(x,y,z).rotX(dir>0?PI/2:-PI/2);
 M.color(o.bezel||C.chrome);M.lathe('chrome',[[r+.018,-.01],[r+.018,.012],[r+.006,.03],[r+.002,.026]],16,{sharp:.8});
 M.color(o.back||[.05,.05,.05]);M.cyl('dark',r+.003,.016,14,{caps:'t'});
 M.color(o.lens||[.95,.95,.9]);M.lathe(o.lensMat||'lampOff',[[r,.014],[r*.82,.03],[r*.45,.04],[0,.043]],16,{sharp:.8});
 if(o.inner){M.color(o.inner);M.save().move(0,.036,0);M.cyl('chrome',r*.35,.006,10,{caps:'t'});M.restore()}
 M.restore();
}
/* straight-ish bar across the front/rear following the end surface in n segments */
function endBar(M,E,mat,d,x0,x1,y,h,t,off,col){
 const n=Math.max(2,Math.ceil((x1-x0)/.2));M.color(col||C.chrome);
 for(let i=0;i<n;i++){const xa=lerp(x0,x1,i/n),xb=lerp(x0,x1,(i+1)/n),za=E.zEnd(xa,y,d),zb=E.zEnd(xb,y,d);
  const zm=(za+zb)/2+d*off;M.save().move((xa+xb)/2,y,zm).rotY(Math.atan2(zb-za,xb-xa)*-1);
  M.boxB(mat,-(xb-xa)/2-.004,(xb-xa)/2+.004,-h/2,h/2,-t/2,t/2);M.restore()}
}
/* bullet (Dagmar) pointing along z */
function bullet(M,x,y,z,dir,s){
 s=s||1;M.save().move(x,y,z).rotX(dir>0?PI/2:-PI/2).scl(s);M.color(C.chrome);
 M.lathe('chrome',[[0,0],[.06,.004],[.078,.04],[.07,.09],[.045,.135],[.018,.16],[0,.17]],14,{sharp:.7});M.restore();
}
/* wrap-around bumper: a chrome bar swept along the end of the body (d=+1 front, -1 rear) at height y, its tips swinging back along the
   flank. o: y, h (bar height), t (depth), out (stand-off from the metal), w (half length), wrap (how far the tips run back) */
function bumper(M,S,G,E,d,o){
 const y=o.y,h=o.h||.13,t=o.t||.06,off=o.out||.1,wrap=o.wrap===undefined?.34:o.wrap;
 const wmax=o.w||(G.xAt(y,d>0?S.ax[1]+.8:S.ax[0]-.8)+.015),N=14,path=[];
 for(let i=0;i<=N;i++){const x=(i/N*2-1)*wmax;const zz=E.zEnd(Math.min(Math.abs(x),wmax*.9),y,d);path.push([x,y,zz+d*off])}
 // tips: swing back and inward a touch
 const tipL=[],tipR=[];
 for(let k=1;k<=5;k++){const f=k/5,e=f*f;tipR.push([wmax-.03*e,y,path[N][2]-d*wrap*e*1.0-d*.02*f]);tipL.push([-(wmax-.03*e),y,path[0][2]-d*wrap*e*1.0-d*.02*f])}
 const full=tipL.reverse().concat(path,tipR);
 M.color(o.col||C.chrome);M.sweep('chrome',rrShape(h,t,Math.min(.03,t*.48),2),full,{});
 return{wmax,y,off};
}
/* fin: polygon in (z,y) extruded along x. outer x edge `x`, thickness t */
function fin(M,G,sd,f){
 const x=f.x,t=f.t||.07,zs=[],top=[],bot=[];
 const n=12;
 for(let i=0;i<=n;i++){const z=lerp(f.z0,f.z1,i/n);const yb=G.yTop(x,z)-.07;const u=i/n;
  const yy=G.yTop(x,z)+f.h*(f.prof?f.prof(u):Math.pow(u,1.5));
  zs.push(z);top.push(yy);bot.push(yb)}
 const shape=[];for(let i=0;i<=n;i++)shape.push([zs[i],top[i]]);
 // tip: slightly raked back edge
 shape.push([f.z1-(f.rake||.06),top[n]-(f.cut||.12)]);
 for(let i=n;i>=0;i--)shape.push([zs[i]+(i===n?-(f.rake||.06)*.5:0),bot[i]]);
 M.save().move(sd>0?x:-x+t,0,0).rotY(-PI/2);
 M.color([1,1,1]);M.extrude(f.mat,shape,t,{sharp:.25});M.restore();
}

/* ---------------------------------------------------------------- front / rear fascia pieces */
function grille(M,S,G,E,g){
 const d=1,st=g.style||'egg',x1=g.x,y0=g.y0,y1=g.y1;
 M.color(C.dark);E.endSkin(M,'dark',d,-x1,x1,y0,y1,.004,10,3);
 M.cls=2;
 if(st==='egg'){
  // horizontal chrome bars with vertical ribs: the '57 mesh
  const nb=g.bars||4;for(let i=0;i<nb;i++){const y=lerp(y0+.03,y1-.03,i/(nb-1));endBar(M,E,'chrome',d,-x1+.01,x1-.01,y,.016,.02,.014)}
  for(let x=-x1+.05;x<x1-.02;x+=.075){M.color(C.chromeD);E.endSkin(M,'chrome',d,x-.004,x+.004,y0+.02,y1-.02,.012,1,2)}
  endBar(M,E,'chrome',d,-x1-.02,x1+.02,y1,.035,.03,.018);endBar(M,E,'chrome',d,-x1-.02,x1+.02,y0,.03,.03,.018);
  for(const sx of[-1,1]){M.color(C.chrome);for(const y of[y0,y1])endBar(M,E,'chrome',d,sx*x1-.012,sx*x1+.012,(y0+y1)/2,y1-y0,.03,.018)}
 } else if(st==='teeth'){
  const n=g.n||9;for(let i=0;i<n;i++){const x=lerp(-x1+.05,x1-.05,i/(n-1)),z=E.zEnd(x,(y0+y1)/2,d);
   M.save().move(x,(y0+y1)/2,z+.02);M.color(C.chrome);M.boxB('chrome',-.022,.022,-(y1-y0)/2+.02,(y1-y0)/2-.02,-.012,.03,{bevel:.012});M.restore()}
  for(const y of[y0,y1])endBar(M,E,'chrome',d,-x1-.01,x1+.01,y,.024,.03,.016);
  for(const sx of[-1,1])endBar(M,E,'chrome',d,sx*x1-.01,sx*x1+.01,(y0+y1)/2,y1-y0,.03,.016);
 } else if(st==='oval'){
  const bars=g.bars||5;for(let i=0;i<bars;i++){const y=lerp(y0+.02,y1-.02,i/(bars-1));const hw=x1*Math.sqrt(1-Math.pow((y-(y0+y1)/2)/((y1-y0)/2+.02),2));endBar(M,E,'chrome',d,-hw,hw,y,.02,.025,.016)}
  endBar(M,E,'chrome',d,-x1,x1,y1,.03,.03,.02);endBar(M,E,'chrome',d,-x1,x1,y0,.03,.03,.02);
 } else if(st==='slot'){ // Jeep: vertical slots
  const n=g.n||7,ww=(2*x1)/n;for(let i=0;i<n;i++){const x=-x1+ww*(i+.5),z=E.zEnd(x,(y0+y1)/2,d);M.color(g.col||C.dark);
   M.save().move(x,(y0+y1)/2,z+.012);M.boxB('paint',-ww*.5+.012,ww*.5-.012,-(y1-y0)/2,(y1-y0)/2,0,.02,{bevel:.006});M.restore()}
 } else if(st==='fish'){ // wide low mouth with a central bar and two chrome ovals (T-bird / 300SL)
  endBar(M,E,'chrome',d,-x1,x1,(y0+y1)/2,.03,.03,.02);for(const sx of[-1,1])endBar(M,E,'chrome',d,sx*x1*.5-x1*.4,sx*x1*.5+x1*.4,(y0+y1)/2+sx*0,.02,.02,.014);
  endBar(M,E,'chrome',d,-x1,x1,y1,.026,.03,.018);endBar(M,E,'chrome',d,-x1,x1,y0,.026,.03,.018);
  for(let x=-x1+.06;x<x1-.02;x+=.06){M.color(C.chromeD);E.endSkin(M,'chrome',d,x-.003,x+.003,y0+.01,y1-.01,.012,1,2)}
 }
 M.cls=0;
}
/* licence plate on an end (d=+1 front,-1 rear) */
function plate(M,S,G,E,d,y,w,off){
 w=w||.26;const z=E.zEnd(0,y,d)+d*(off||.02);
 M.color([.95,.93,.78]);M.boxB('plastic',-w,w,y-.065,y+.065,d>0?z-.01:z-.003,d>0?z+.003:z+.01,{bevel:.004});
 M.color([.08,.14,.35]);M.boxB('plastic',-w+.02,w-.02,y+.04,y+.05,d>0?z+.003:z-.0035,d>0?z+.004:z-.003);
 M.color([.1,.1,.1]);for(let i=0;i<6;i++){const x=lerp(-w*.7,w*.7,i/5);M.boxB('dark',x-.017,x+.017,y-.03,y+.02,d>0?z+.003:z-.0035,d>0?z+.0045:z-.003)}
}

/* ---------------------------------------------------------------- the generic car builder */
function carBuild(M,P,S,o){
 o=o||{};const dust=!!o.dust;
 const MB=dust?'dustpaint':'carpaint',MA=MB+'2';P.tintable=[MB,MA];o.MB=MB;o.MA=MA;
 const G=bodyGeo(S),E=endTools(S,G),cy=G.cy,belt0=G.sec(0).yt;
 const T={M,P,S,G,E,o,MB,MA,cy};
 M.local(1);
 // ---- lower body: one continuous skin
 const Z=zSamples(S);
 M.aoFn=(x,y)=>lerp(dust?.45:.55,1,sm(S.yb,S.ym+.25,y));
 M.color([1,1,1]);M.loft(MB,Z.map(G.sec),18);M.aoFn=null;
 // ---- open cockpit tub: coaming walls with a padded roll, carpet floor
 if(S.tub){const Tb=S.tub,fl=Tb.floor;
  for(const sd of[-1,1]){const secs=[];
   for(let i=0;i<=16;i++){const z=lerp(Tb.z0-.06,Tb.z1+.06,i/16),e=Math.min(sm(Tb.z0-.06,Tb.z0+.3,z),1-sm(Tb.z1-.3,Tb.z1+.06,z)),sc=G.sec(z),wd=sc.w-.04;
    secs.push({z,w:.045,yb:fl-.04,yt:lerp(sc.yt+.015,Tb.top,e),n:3,x:sd*(wd-.0)})}
   M.color([1,1,1]);M.loft(MB,secs,10);
   // padded roll along the top
   M.color(Tb.roll||[.12,.08,.07]);M.tube('vinyl',.03,secs.filter((q,i)=>i>2&&i<14).map(q=>[q.x,q.yt+.012,q.z]),5)}
  M.color(Tb.carpet||[.3,.1,.08]);M.boxB('plastic',-(S.w-.12),(S.w-.12),fl+.004,fl+.014,Tb.z0+.05,Tb.z1-.05);
  M.color(C.dark);M.boxB('dark',-.09,.09,fl+.014,fl+.09,Tb.z0+.1,Tb.z1-.45,{bevel:.03});}
 // wheel wells and underbody
 M.color(C.dark);
 for(const az of S.ax)if(az-S.ra>S.zr&&az+S.ra<S.zf)M.boxB('dark',-S.w+.2,S.w-.2,S.yb-.08,cy+S.ra+.01,az-S.ra,az+S.ra);
 M.boxB('dark',-S.w+.12,S.w-.12,S.yb-.015,S.yb+.04,Math.max(S.zr+.1,S.ax[0]+S.ra),Math.min(S.zf-.1,S.ax[1]-S.ra));
 // ---- mud on the sills (dusty cars)
 if(dust){M.color([.5,.43,.35]);M.cls=1;for(const sd of[-1,1])sideSkin(M,G,'dirt',sd,S.ax[0]+S.ra+.02,S.ax[1]-S.ra-.02,s=>s.yb+.01,(s,z)=>s.yb+.1+.12*clamp(.5+.3*Math.sin(z*9+sd)+.2*Math.sin(z*23),0,1),.008,Math.round((S.ax[1]-S.ax[0])/.07),1);M.cls=0}
 // ---- two-tone side sweep(s)
 if(S.sweep)for(const sw of S.sweep){
  for(const sd of[-1,1]){
   if(sw.fill!==false){M.color([1,1,1]);sideSkin(M,G,sw.mat==='b'?MB:MA,sd,sw.z0,sw.z1,(s,z)=>sw.y0(z),(s,z)=>sw.y1(z),.006,Math.max(4,Math.round((sw.z1-sw.z0)/.06)),4)}
   if(sw.edge!==false){const up=[],lo=[],nn=Math.max(8,Math.round((sw.z1-sw.z0)/.22));for(let i=0;i<=nn;i++){const z=lerp(sw.z0,sw.z1,i/nn);up.push([z,sw.y1(z)]);lo.push([z,sw.y0(z)])}
    M.color(C.chrome);M.cls=1;M.tube('chrome',sw.tube||.009,flankPath(G,sd,up,.01),4);M.tube('chrome',sw.tube||.009,flankPath(G,sd,lo,.01),4);
    M.tube('chrome',sw.tube||.009,flankPath(G,sd,[[sw.z0,sw.y0(sw.z0)],[sw.z0,sw.y1(sw.z0)]],.01),4);M.tube('chrome',sw.tube||.009,flankPath(G,sd,[[sw.z1,sw.y0(sw.z1)],[sw.z1,sw.y1(sw.z1)]],.01),4);M.cls=0}
  }}
 // ---- chrome spears (side mouldings)
 if(S.spear)for(const sp of S.spear)for(const sd of[-1,1]){const pts=[],nn=Math.max(4,Math.round((sp.z1-sp.z0)/.3));for(let i=0;i<=nn;i++){const z=lerp(sp.z0,sp.z1,i/nn);pts.push([z,sp.y(z)])}
  M.color(C.chrome);M.cls=1;M.tube('chrome',sp.r||.011,flankPath(G,sd,pts,.012),4);M.cls=0}
 // ---- rocker panel chrome strip
 if(S.rocker)for(const sd of[-1,1]){M.color(C.chrome);M.cls=1;sideSkin(M,G,'chrome',sd,S.ax[0]+S.ra+.04,S.ax[1]-S.ra-.04,s=>s.yb+.02,s=>s.yb+.06,.008,10,1);M.cls=0}
 // ---- fender skirts
 if(S.skirt)for(const sd of[-1,1])for(const az of S.skirt.axles||[S.ax[0]]){
  const za=az-S.ra-.03,zb=az+S.ra+.06,SK=S.skirt;
  M.color([1,1,1]);
  M.surf(SK.mat==='a'?MA:MB,16,5,(u,v)=>{const z=lerp(za,zb,u),dz=Math.abs(z-az),s=G.sec(z),dy=Math.sqrt(Math.max(0,S.ra*S.ra-dz*dz)),ytop=Math.max(s.yb,cy+dy),ylow=cy-dy*.62+Math.pow(dz/S.ra,6)*.1,y=lerp(Math.max(ylow,S.yb-.04+Math.pow(dz/S.ra,2)*.2),ytop+.01,v);
   const x=G.xAt(s.ym,z)-.012-Math.pow(1-v,3)*.03;return[sd*x,y,z]},{flipN:sd>0,uL:zb-za,vL:.5});
  M.color(C.chrome);M.cls=1;M.tube('chrome',.008,Array.from({length:13},(_,i)=>{const u=i/12,z=lerp(za,zb,u),dz=Math.abs(z-az),s=G.sec(z),dy=Math.sqrt(Math.max(0,S.ra*S.ra-dz*dz)),y=cy-dy*.62+Math.pow(dz/S.ra,6)*.1;const yy=Math.max(y,S.yb-.04+Math.pow(dz/S.ra,2)*.2);return[sd*(G.xAt(s.ym,z)-.012-.03*0),yy,z]}),4);M.cls=0}
 // ---- cabin
 let cab=null;
 if(S.cab){cab=cabinLoft(M,S,G,S.cab,o);T.cab=cab;
  /* v093: half width of the inside of the cabin at a height and station (0 outside it), for parts a vehicle's own `extras` put in the cabin */
  T.cabW=(y,z)=>{if(z<=cab.z0||z>=cab.z1)return 0;const c=cab.sec(z);if(y>=c.yt-.02)return 0;if(y<=c.yb)return c.w;const f=clamp((y-c.yb)/Math.max(.01,c.yt-c.yb),0,.999);return Math.abs(cab.ring(z,Math.asin(Math.pow(f,1/cab.e)))[0])};
  if(!S.noInterior)interior(M,S,G,S.cab,o,cab)}
 if(S.cab2){T.cab2=cabinLoft(M,S,G,Object.assign({},S.cab2),o)}
 T.sideX=(y,z)=>{const s=G.sec(z);if(!cab||y<s.yt-.03)return G.xAt(y,z);const c=cab.sec(z),f=clamp((y-c.yb)/Math.max(.01,c.yt-c.yb),0,.999),a=Math.asin(Math.pow(f,1/cab.e));return Math.abs(cab.ring(z,a)[0])};
 // ---- doors: seams and handles
 for(const sd of[-1,1]){
  M.color([.03,.03,.03]);M.cls=2;
  for(const z of S.seams||[])sideSkin(M,G,'dark',sd,z-.004,z+.004,s=>s.yb+.04,(s,zz)=>(S.seamTop?S.seamTop(zz):G.sec(zz).yt-.06),.0022,1,6);
  M.cls=0;
  M.color(C.chrome);M.cls=2;
  for(const h of S.handles||[]){const x=G.xAt(h[1]+.015,h[0]+.06);M.boxB('chrome',sd*(x-.008),sd*(x+.014),h[1],h[1]+.028,h[0],h[0]+.12)}
  M.cls=0;
 }
 // ---- fins
 if(S.fin)for(const sd of[-1,1])fin(M,G,sd,Object.assign({mat:MB},S.fin));
 // ---- front: grille, lamps, bumper, plate
 if(S.grille)grille(M,S,G,E,S.grille);
 if(S.head)for(const h of S.head){for(const sd of(h.x===0?[1]:[-1,1])){const z=E.zEnd(sd*h.x,h.y,1)+.0;lampPod(M,sd*h.x,h.y,z-.006,h.r,1,h)}}
 if(S.parking)for(const h of S.parking)for(const sd of[-1,1]){const z=E.zEnd(sd*h.x,h.y,1);M.color(C.chrome);M.save().move(sd*h.x,h.y,z-.004);M.boxB('chrome',-h.w/2-.01,h.w/2+.01,-h.h/2-.01,h.h/2+.01,0,.026,{bevel:.01});M.color(C.amber);M.boxB('plastic',-h.w/2,h.w/2,-h.h/2,h.h/2,.02,.03);M.restore()}
 if(S.bumpF){const b=bumper(M,S,G,E,1,S.bumpF);T.bf=b;
  if(S.bumpF.guards)for(const x of S.bumpF.guards)bullet(M,x,S.bumpF.y+(S.bumpF.gy||0),E.zEnd(x,S.bumpF.y,1)+S.bumpF.out+.02,1,S.bumpF.gs||1);
  if(S.bumpF.plate!==false)plate(M,S,G,E,1,S.bumpF.y+.14,.26,S.bumpF.out+.06)}
 else if(S.plateF)plate(M,S,G,E,1,S.plateF,.26,.03);
 // ---- rear: lamps, bumper, plate, exhaust
 if(S.tail)for(const h of S.tail)for(const sd of(h.x===0?[1]:[-1,1])){
  const z=E.zEnd(sd*h.x,h.y,-1);
  if(h.pod){lampPod(M,sd*h.x,h.y,z+.006,h.r,-1,Object.assign({lens:[.85,.08,.06],lensMat:'plastic',bezel:C.chrome},h))}
  else{M.color(C.chrome);M.save().move(sd*h.x,h.y,z+.004);M.boxB('chrome',-h.w/2-.012,h.w/2+.012,-h.h/2-.012,h.h/2+.012,-.022,0,{bevel:.01});
   M.color(C.red);M.boxB('plastic',-h.w/2,h.w/2,-h.h/2,h.h/2,-.03,-.018,{bevel:.006});
   if(h.rev){M.color([.95,.95,.9]);M.boxB('plastic',-h.w/2,h.w/2,-h.h/2,-h.h/2+.03,-.034,-.02)}M.restore()}}
 if(S.bumpR){bumper(M,S,G,E,-1,S.bumpR);if(S.bumpR.guards)for(const x of S.bumpR.guards)bullet(M,x,S.bumpR.y,E.zEnd(x,S.bumpR.y,-1)-S.bumpR.out-.02,-1,S.bumpR.gs||1);
  if(S.bumpR.plate!==false)plate(M,S,G,E,-1,S.bumpR.y+.18,.26,S.bumpR.out+.04)}
 else if(S.plateR)plate(M,S,G,E,-1,S.plateR,.26,.03);
 if(S.exhaust!==false){const y=(S.bumpR?S.bumpR.y:S.yr)-.06,x=S.exhaustX||S.w*.5,ze=E.zEnd(x,y+.05,-1);M.color([.3,.3,.3]);M.cls=2;
  for(const sx of S.dualExhaust?[-x,x]:[x])M.tube('chrome',.026,[[sx,y,ze+.5],[sx,y-.015,ze-.02],[sx,y-.015,ze-.13-(S.bumpR?S.bumpR.out:0)]],8);M.cls=0}
 // ---- mirrors: base pad on the door skin, arm out and up, round (or big rectangular truck) head facing back
 if(S.mirror){const m=S.mirror;
  for(const sd of[-1,1]){if(m.single&&sd<0)continue;   // driver side only = +x (left-hand drive)
   /* v093: a mirror stood wherever its (y, z) fell on the cabin skin, which for most vehicles was the raked windscreen, well inboard:
      "a mirror in the middle of the screen". It now sits at the leading edge of the door (never forward of the top of the screen);
      a car's round mirror is on the door skin just under the glass, a truck's keeps its height on the cab side. */
   let y=m.y,z=m.z;const wsM=S.cab&&S.cab.ws;if(wsM&&z>wsM[0]-.06)z=wsM[0]-.06;
   const sB=G.sec(z);if(!m.big)y=Math.min(y,sB.yt-.06);else if(S.cab&&S.cab.floor!==undefined)y=Math.min(y,sB.yt+.13); // open cab: no cab side to hang it on, so it stands on the door top
   let x0=G.xAt(Math.min(y,sB.yt-.002),z);
   if(cab&&z>cab.z0&&z<cab.z1){const c=cab.sec(z);if(y>c.yb&&y<c.yt-.02){const f=clamp((y-c.yb)/Math.max(.01,c.yt-c.yb),0,.999);x0=Math.max(y<sB.yt-.03?x0:0,Math.abs(cab.ring(z,Math.asin(Math.pow(f,1/cab.e)))[0]))}}
   x0+=.004;const arm=m.arm||(m.big?.15:.12);
   M.color(m.col||C.chrome);M.cls=2;
   M.boxB('chrome',sd>0?x0-.03:-x0-.012,sd>0?x0+.012:-x0+.03,y-.035,y+.035,z-.03,z+.03,{bevel:.008});   // mounting pad
   if(m.big){ // rectangular west-coast mirror on two arms
    const xo=sd*(x0+arm);M.tube('chrome',.02,[[sd*x0,y+.12,z],[xo,y+.14,z-.02]],6);M.tube('chrome',.02,[[sd*x0,y-.1,z],[xo,y-.1,z-.02]],6);
    M.color([.12,.12,.12]);M.boxB('chrome',xo-.014,xo+.014,y-.15,y+.23,z-.11,z+.04,{bevel:.008});M.color([.55,.6,.62]);M.boxB('plastic',xo-.016,xo+.016,y-.12,y+.2,z-.115,z-.1)
   }else{
    const hx=sd*(x0+arm),hy=y+.05;M.tube('chrome',.011,[[sd*(x0-.005),y,z],[sd*(x0+arm*.6),y+.02,z-.01],[hx,hy,z-.02]],6);
    M.save().move(hx,hy,z-.03).scl(.55,1,1);M.lathe('chrome',[[0,-.07],[.045,-.05],[.06,0],[.045,.05],[0,.07]],12,{sharp:.6});M.restore();
    M.color([.55,.6,.62]);M.save().move(hx,hy,z-.058).scl(.5,1,.4);M.lathe('chrome',[[0,-.055],[.04,-.04],[.05,0],[.04,.04],[0,.055]],10,{sharp:.5});M.restore()}
   M.cls=0}}
 if(S.antenna){const a=S.antenna;M.color(C.chrome);M.cls=2;M.tube('chrome',.005,[[a.x,a.y,a.z],[a.x*1.0,a.y+.6,a.z-.05],[a.x*1.01,a.y+1.05,a.z-.1]],4);M.save().move(a.x,a.y,a.z);M.cyl('chrome',.02,.03,8);M.restore();M.cls=0}
 // ---- hood ornament + hood trim
 if(S.ornament){const orn=S.ornament,y=G.yTop(0,orn.z);M.color(C.chrome);M.cls=2;
  if(orn.type==='rocket'){M.save().move(0,y+.01,orn.z).rotX(PI/2);M.lathe('chrome',[[.045,0],[.04,.05],[.03,.15],[.015,.26],[0,.34]],10,{sharp:.5});M.restore();M.save().move(0,y+.04,orn.z-.04);M.boxB('chrome',-.1,.1,0,.015,-.04,.06,{bevel:.006});M.restore()}
  else if(orn.type==='bird'){M.save().move(0,y+.02,orn.z);M.boxB('chrome',-.01,.01,0,.05,-.08,.12,{bevel:.004});for(const sd of[-1,1]){M.save().rotY(sd*.2).rotZ(-sd*.4);M.boxB('chrome',sd>0?0:-.12,sd>0?.12:0,.03,.04,-.07,.1,{bevel:.003});M.restore()}M.restore()}
  else if(orn.type==='star'){M.save().move(0,y+.005,orn.z);M.cyl('chrome',.05,.012,3,{caps:'bt'});M.restore();}
  M.cls=0}
 // ---- model-specific extras
 if(S.extras)S.extras(T);
 if(S.decals&&S.kind)DECALS[S.kind]=S.decals(T).map(d=>d.side&&d.x===undefined?Object.assign({},d,{x:T.sideX(d.y,d.z)+(d.off||.008)}):d);
 // ---- wheels
 const wo=Object.assign({kind:'cap',ww:.1},S.wheel||{},{dust});
 const wr=S.wheelRear?Object.assign({},wo,S.wheelRear):wo;
 const wax=S.wax||S.ax;
 wax.forEach((az,ai)=>{const front=ai===wax.length-1,rearish=!front;
  for(const sd of[-1,1]){const wspec=rearish?wr:wo,tx=rearish?(S.txR||S.tx):S.tx,rr=rearish?(S.rR||S.r):S.r,tw=rearish?(S.twR||S.tw):S.tw;
   M.save().move(sd*tx,0,az);wheel50(M,rr,tw,Object.assign({},wspec,{side:sd}));M.restore();
   if(rearish&&S.dual){M.save().move(sd*(tx-(tw+.03)),0,az);wheel50(M,rr,tw,Object.assign({},wspec,{side:-sd,noWW:false}));M.restore()}}});
 return T;
}

/* ---------------------------------------------------------------- shared decorative helpers (used by the model specs) */
/* a raised fender / hood bulge: a small lofted blister riding on the body top at x = xc (side sd), between z0 and z1 */
function crown(M,G,mat,sd,xc,w,z0,z1,hmax,o){
 o=o||{};const n=14,S=[];
 for(let i=0;i<=n;i++){const u=i/n,z=lerp(z0,z1,u),f=o.prof?o.prof(u):Math.sin(u*PI)**(o.pw||.8);
  const yt=G.yTop(xc,z);S.push({z,w:Math.max(.012,w*(.35+.65*Math.sqrt(f))),yb:yt-.07,yt:yt+hmax*f+.004,n:o.n||3,x:sd*xc})}
 M.color([1,1,1]);M.loft(mat,S,14);
}
/* a stripe along the body top (hood/roof/deck) of half-width w centred on x, following yTop; mat paint */
function topStripe(M,G,mat,x,w,z0,z1,off,col){
 M.color(col||[1,1,1]);
 M.surf(mat,3,Math.max(6,Math.round((z1-z0)/.08)),(u,v)=>{const z=lerp(z0,z1,v),xx=x+(u-.5)*2*w;return[xx,G.yTop(xx,z)+(off||.004),z]},{flipN:true,uL:2*w,vL:z1-z0});
}
/* chrome roof rack: rails + slats, between z0..z1 at half width x and height y (follows nothing: flat) */
function roofRack(M,x,y,z0,z1,o){
 o=o||{};M.color(C.chrome);M.cls=1;
 for(const sd of[-1,1]){M.tube('chrome',.011,[[sd*x,y,z0],[sd*x,y,z1]],5);for(const z of[z0+.05,z1-.05,(z0+z1)/2]){M.tube('chrome',.009,[[sd*x,y-.001,z],[sd*x,y-(o.h||.04),z]],4)}}
 const n=Math.max(2,Math.round((z1-z0)/.28));for(let i=0;i<=n;i++){const z=lerp(z0,z1,i/n);M.tube('chrome',.007,[[-x,y+.004,z],[x,y+.004,z]],4)}
 M.cls=0;
}
/* suitcase: rounded box with straps */
function suitcase(M,x,y,z,sx,sy,sz,col,ry){
 M.save().move(x,y,z).rotY(ry||0);M.color(col);M.boxB('vinyl',-sx/2,sx/2,0,sy,-sz/2,sz/2,{bevel:.04});
 M.color([.12,.1,.08]);for(const k of[-.3,.3])M.boxB('vinyl',-sx/2-.004,sx/2+.004,sy*.2,sy*.8,sz*k-.02,sz*k+.02);
 M.color(C.brass);M.boxB('brass',-.03,.03,sy*.35,sy*.55,sz/2,sz/2+.012);M.restore();
}
/* spare wheel mounted vertically on a flank/rear: centre (x,y,z), axis along +/-z (dir) */
function spareTyre(M,x,y,z,r,w,dir,o){
 o=o||{};M.save().move(x,y,z);if(dir)M.rotX(dir>0?PI/2:-PI/2);
 M.color([1,1,1]);M.lathe('rubber',[[r*.6,-w/2],[r*.92,-w/2-.005],[r,-w*.25],[r,w*.25],[r*.92,w/2+.005],[r*.6,w/2]],18,{sharp:.45});
 if(o.ww){M.color(C.white);M.lathe('whitewall',[[r*.68,w/2+.007],[r*.78,w/2+.009],[r*.88,w/2+.011]],18,{sharp:.95})}
 M.color(o.rim||C.chromeD);M.lathe('steel',[[0,w/2-.01],[r*.6,w/2-.01],[r*.5,w/2+.012],[0,w/2+.02]],14,{sharp:.5});
 M.color(C.chrome);M.save().move(0,w/2+.02,0);M.cyl('chrome',r*.1,.012,8,{caps:'t'});M.restore();M.restore();
}
/* a cantilevered box lamp etc. */
const strip=(M,mat,col,x0,x1,y0,y1,z0,z1,b)=>{M.color(col);M.boxB(mat,x0,x1,y0,y1,z0,z1,b?{bevel:b}:undefined)};

/* tailgate window: a framed glass panel standing on the rear wall (z = the cabin's rear plane) */
function rearWindow(M,z,x,y0,y1,dust){
 M.cls=1;M.color(C.chrome);
 M.boxB('chrome',-x-.03,x+.03,y0-.03,y1+.03,z-.014,z-.002,{bevel:.008});
 M.color(dust?C.glassD:C.glass);M.boxB(dust?'retroglassD':'retroglass',-x,x,y0,y1,z-.02,z-.01);M.cls=0;
}

/* truck chassis: frame rails, axles with differential, leaf springs, tank, exhaust, driveshaft, mud flaps.
   o: z0 z1 (rear/front of the frame), axles [z], tx, r (wheel radius), rail (half gauge), y0 y1 (rail underside/top) */
function chassis(M,o){
 const rail=o.rail||.42,y0=o.y0||.5,y1=o.y1||.62;
 M.cls=1;M.color(C.dark);
 for(const sd of[-1,1]){M.boxB('dark',sd*rail-.05,sd*rail+.05,y0,y1,o.z0,o.z1,{bevel:.015});
  // cross members
 }
 for(let z=o.z0+.3;z<o.z1;z+=.9)M.boxB('dark',-rail,rail,y0+.02,y0+.1,z,z+.08);
 for(const z of o.axles){
  M.color([.16,.16,.17]);M.save().move(o.tx-.1,o.r,z).rotZ(PI/2);M.cyl('steel',.045,2*(o.tx-.1),8);M.restore();
  M.color([.2,.2,.21]);M.save().move(0,o.r,z).scl(1,.8,1);M.lathe('steel',[[0,-.16],[.12,-.12],[.19,0],[.12,.12],[0,.16]],10,{sharp:.6});M.restore();
  M.color([.08,.08,.08]);for(const sd of[-1,1]){M.boxB('dark',sd*(rail+.1)-.045,sd*(rail+.1)+.045,o.r+.05,y0,z-.55,z+.55,{bevel:.01});M.boxB('dark',sd*(rail+.1)-.045,sd*(rail+.1)+.045,o.r+.04,o.r+.075,z-.62,z+.62)}
 }
 const zmid=(o.z0+o.z1)/2;
 if(o.tank!==false){M.color([.25,.25,.27]);M.save().move(rail+.2,y0-.05,o.tankZ!==undefined?o.tankZ:zmid-.3).rotX(PI/2);M.cyl('steel',.19,.8,12);M.restore()}
 if(o.exhaust!==false){M.color([.2,.2,.2]);const ex=o.exX||-(rail+.15);M.tube('steel',.035,[[ex,y0+.05,o.z0+.2],[ex,y0+.05,zmid-.3]],8);M.save().move(ex,y0+.05,zmid-.7).rotX(PI/2);M.cyl('steel',.09,.5,10);M.restore()}
 M.color([.1,.1,.1]);M.tube('steel',.03,[[0,y0+.08,o.axles[0]+.05],[0,y0+.1,o.axles[o.axles.length-1]-.3]],6);
 if(o.flaps){const top=o.flapTop!==undefined?o.flapTop:y0+.12,zf=o.axles[0]-o.r-.12;M.color([.04,.04,.04]);for(const sd of[-1,1]){M.boxB('rubber',sd*(o.tx-.08)-.2,sd*(o.tx-.08)+.2,Math.max(.12,top-.5),top,zf-.012,zf);M.color(C.chromeD);M.boxB('steel',sd*(o.tx-.08)-.21,sd*(o.tx-.08)+.21,top-.03,top,zf-.02,zf+.01);M.color([.04,.04,.04])}}
 M.cls=0;
}

/* ladder: two rails + rungs, along z at (x, y), width w, rail section r */
function ladder(M,x,y,z0,z1,w,col){
 M.color(col||[.75,.55,.25]);M.cls=1;
 for(const sd of[-1,1])M.boxB('wood',x+sd*w/2-.022,x+sd*w/2+.022,y,y+.09,z0,z1,{bevel:.008});
 for(let z=z0+.1;z<z1;z+=.28)M.tube('wood',.014,[[x-w/2,y+.045,z],[x+w/2,y+.045,z]],4);
 M.cls=0;
}

/* spare wheel on a rear carrier: tyre hangs off a bracket bolted to the surface at z = zs (d=-1 rear) */
function spareAt(M,x,y,zs,r,w,o){
 o=o||{};const zc=zs-.075-w/2;
 spareTyre(M,x,y,zc,r,w,-1,o);
 M.cls=1;M.color(o.bracket||C.chromeD);
 M.boxB('steel',x-.045,x+.045,y-.04,y+.04,zc,zs+.012,{bevel:.01});                    // hub arm
 for(const k of[-1,1])M.boxB('steel',x+k*r*.55-.03,x+k*r*.55+.03,y-.035,y+.035,zc+w/2-.01,zs+.012);   // side straps
 M.boxB('steel',x-r*.55,x+r*.55,y-r-.02,y-r+.012,zc+w*.2,zc+w/2+.015);                   // lower cradle
 M.boxB('steel',x-.08,x+.08,y-.1,y+.1,zs-.02,zs+.015,{bevel:.008});                       // wall plate
 M.cls=0;
}
const spareRear=(T,x,y,r,w,o)=>spareAt(T.M,x,y,T.E.zEnd(x,y,-1),r,w,o);
/* bicycle standing on a rack: two wheels, diamond frame, bars, saddle */
function bicycle(M,x,y,z0,z1,o){
 const R=.3;M.cls=1;const wc=[[x,y+R,z0],[x,y+R,z1]];
 M.color([.08,.08,.08]);for(const c of wc){M.save().move(c[0],c[1],c[2]).rotZ(PI/2);M.lathe('rubber',[[R-.02,-.02],[R,0],[R-.02,.02]],16,{sharp:.5});M.restore()}
 M.color(C.chromeD);for(const c of wc){for(let k=0;k<6;k++){const a=k/6*PI;M.tube('chrome',.003,[[x,c[1]+Math.cos(a)*(R-.03),c[2]+Math.sin(a)*(R-.03)],[x,c[1]-Math.cos(a)*(R-.03),c[2]-Math.sin(a)*(R-.03)]],3)}}
 const mid=(z0+z1)/2,bb=[x,y+R*.9,mid],seat=[x,y+R*2.05,lerp(z0,z1,.28)],head=[x,y+R*1.9,lerp(z0,z1,.86)];
 M.color(o&&o.col||[.7,.1,.1]);
 for(const [a,b] of[[wc[0],bb],[wc[0],seat],[bb,seat],[bb,head],[seat,head],[wc[1],head],[wc[1],bb]])M.tube('steel',.014,[a,b],5);
 M.color([.1,.1,.1]);M.tube('steel',.012,[[x-.2,head[1]+.08,head[2]-.03],[x+.2,head[1]+.08,head[2]-.03]],4);M.tube('steel',.012,[head,[x,head[1]+.08,head[2]-.03]],4);
 M.boxB('vinyl',x-.05,x+.05,seat[1]+.01,seat[1]+.05,seat[2]-.12,seat[2]+.06,{bevel:.015});
 M.cls=0;
}

/* ================================================================ CAR SPECS ================================================================ */
const BUILD={},META={},CARS={};
CARS.sedan={
 zr:-2.48,zf:2.62,w:.94,r:.355,tw:.21,tx:.775,ax:[-1.42,1.58],ra:.42,yb:.31,yf:.34,yr:.36,ym:.68,n:4.6,
 top:[[-2.48,.84],[-2.28,.96],[-1.8,.995],[-1.2,.99],[0,.97],[.7,.98],[1.3,.955],[2.0,.9],[2.62,.84]],
 rc:[.36,.4],rt:[.09,.12],rb:[.07,.08],
 cab:{roof:[[-1.62,.99],[-1.22,1.38],[-1.0,1.47],[.28,1.49],[.38,1.47],[.86,.975]],cw:[[-1.62,.80],[-1.2,.82],[0,.86],[.86,.9]],n:3,
  ws:[.36,.86],bl:[-1.62,-1.08],win:[[-1.0,-.52],[-.46,.26]],h0:.1,h1:.8,pil:.38,pilR:.5,pillarMat:'a',roofMat:'a',frame:.028},
 sweep:[{z0:-2.25,z1:-.15,y0:z=>.52,y1:z=>z>-1?.8:lerp(.8,.93,(-1-z)/1.25),mat:'a'}],
 spear:[{z0:-.15,z1:2.05,y:z=>.8+(z>1.2?(z-1.2)*.03:0),r:.011}],
 rocker:true,skirt:{axles:[-1.42],mat:'b'},
 fin:{x:.8,z0:-1.1,z1:-2.44,h:.13,t:.07},
 seams:[.3,-.49,-1.3],handles:[[-.4,.82],[-1.2,.82]],
 grille:{style:'egg',x:.5,y0:.57,y1:.78,bars:4},
 head:[{x:.78,y:.73,r:.07},{x:.64,y:.73,r:.058}],
 bumpF:{y:.45,h:.13,t:.07,out:.1,wrap:.42,guards:[-.34,.34],plate:false},
 bumpR:{y:.5,h:.14,t:.07,out:.1,wrap:.42,guards:[-.55,.55]},
 tail:[{x:.66,y:.92,w:.1,h:.22}],
 ornament:{type:'rocket',z:2.1},mirror:{y:1.0,z:.55,single:true},
 wheel:{kind:'cap',ww:.1},
};

/* ---- MICRO: bubble microcar (Isetta / Fiat 500 spirit): egg body, big glass bubble, narrow rear track ---- */
CARS.micro={
 zr:-1.3,zf:1.3,w:.66,r:.25,tw:.13,tx:.55,txR:.27,ax:[-.74,.74],ra:.3,yb:.2,yf:.24,yr:.26,ym:.52,n:3.2,
 top:[[-1.3,.62],[-1.15,.8],[-.7,.86],[0,.86],[.7,.84],[1.1,.78],[1.3,.62]],
 rc:[.42,.46],rt:[.12,.2],rb:[.1,.1],
 cab:{roof:[[-1.02,.86],[-.78,1.18],[-.4,1.38],[.3,1.42],[.62,1.3],[.98,.84]],cw:[[-1.02,.5],[-.4,.58],[.5,.6],[.98,.56]],n:2.4,
  ws:[.3,.98],bl:[-1.02,-.62],win:[[-.55,.28]],h0:.08,h1:.86,pil:.5,pilR:.5,pillarMat:'a',roofMat:'a',frame:.022,single:true},
 sweep:[{z0:-1.15,z1:1.0,y0:z=>.42,y1:z=>.56,mat:'a',tube:.007}],
 rocker:false,seams:[.28,-.56],handles:[[-.25,.7]],
 grille:{style:'oval',x:.2,y0:.4,y1:.52,bars:3},
 head:[{x:.46,y:.64,r:.06}],
 bumpF:{y:.34,h:.07,t:.04,out:.05,wrap:.22,plate:false},bumpR:{y:.38,h:.07,t:.04,out:.05,wrap:.22,plate:true},
 tail:[{x:.42,y:.66,w:.07,h:.07}],exhaust:false,
 wheel:{kind:'disc',ww:.05},mirror:{y:.98,z:.2,single:true},
 extras:T=>{const{M,G}=T;
  // chrome front trim + roll-back canvas hood hint, luggage rack on the tail
  roofRack(M,.28,G.yTop(0,-.9)+.02,-1.18,-.7,{h:.03});
  suitcase(M,0,G.yTop(0,-.95)+.03,-.95,.42,.2,.3,[.5,.3,.18],0)}
};

/* ---- HATCHBACK: small 4CV-style family hatch with a roof rack and suitcase ---- */
CARS.hatch={
 zr:-1.95,zf:1.85,w:.78,r:.31,tw:.16,tx:.66,ax:[-1.2,1.05],ra:.37,yb:.26,yf:.28,yr:.3,ym:.58,n:3.6,
 top:[[-1.95,.78],[-1.82,.9],[-1.3,.94],[-.2,.94],[.5,.93],[1.0,.89],[1.5,.82],[1.85,.7]],
 rc:[.4,.46],rt:[.1,.14],rb:[.08,.08],
 cab:{roof:[[-1.78,.9],[-1.55,1.15],[-1.1,1.38],[-.2,1.46],[.15,1.44],[.6,.93]],cw:[[-1.78,.7],[-1.0,.74],[.6,.76]],n:3,
  ws:[.1,.6],bl:[-1.78,-1.18],win:[[-.95,.03]],h0:.12,h1:.8,pil:.4,pilR:.45,pillarMat:'a',roofMat:'a',frame:.025},
 sweep:[{z0:-1.9,z1:1.6,y0:z=>.46,y1:z=>.6,mat:'a',tube:.007}],
 seams:[.1,-.98],handles:[[-.12,.7],[-.9,.7]],
 grille:{style:'oval',x:.3,y0:.48,y1:.64,bars:4},
 head:[{x:.55,y:.7,r:.075}],
 bumpF:{y:.38,h:.08,t:.045,out:.06,wrap:.26,plate:false},bumpR:{y:.4,h:.08,t:.045,out:.06,wrap:.26},
 tail:[{x:.52,y:.8,w:.07,h:.12}],exhaust:true,exhaustX:.4,
 wheel:{kind:'disc',ww:.07},mirror:{y:.99,z:.45,single:true},
 extras:T=>{const{M,G}=T;
  roofRack(M,.5,1.5,-1.1,.0,{h:.05});
  suitcase(M,-.2,1.5,-.7,.5,.24,.38,[.45,.28,.16],.05);suitcase(M,.2,1.5,-.4,.42,.2,.3,[.2,.3,.4],-.1);
  // rear hatch seams
  M.color([.03,.03,.03]);for(const sd of[-1,1])sideSkin(M,G,'dark',sd,-1.9,-1.4,s=>s.yb+.2,s=>G.yTop(0,-1.9)-.04,.002,1,1);
  // fender crowns holding the headlamps
  for(const sd of[-1,1])crown(M,G,T.MB,sd,.55,.17,.75,1.85,.045)}
};

/* ---- UNIVERSAL: big wood-panelled station wagon ---- */
CARS.universal={
 zr:-2.58,zf:2.62,w:.94,r:.355,tw:.21,tx:.775,ax:[-1.5,1.58],ra:.42,yb:.31,yf:.34,yr:.36,ym:.68,n:4.6,
 top:[[-2.58,.98],[-2.4,1.0],[-1.8,1.0],[-1.2,.99],[0,.97],[.7,.98],[1.3,.955],[2.0,.9],[2.62,.84]],
 rc:[.1,.4],rt:[.07,.12],rb:[.07,.08],
 cab:{roof:[[-2.42,1.0],[-2.4,1.4],[-2.3,1.48],[.28,1.5],[.38,1.48],[.86,.975]],cw:[[-2.42,.84],[0,.88],[.86,.9]],n:3.6,
  ws:[.36,.86],win:[[-2.25,-1.12],[-1.04,-.52],[-.46,.26]],h0:.1,h1:.8,pil:.36,pilR:.2,pillarMat:'a',roofMat:'a',frame:.026,capRear:'b'},
 spear:[{z0:-.15,z1:2.05,y:z=>.8+(z>1.2?(z-1.2)*.03:0),r:.011}],
 rocker:true,seams:[.3,-.49,-1.3],handles:[[-.4,.82],[-1.2,.82]],
 grille:{style:'egg',x:.5,y0:.57,y1:.78,bars:4},
 head:[{x:.78,y:.73,r:.07},{x:.64,y:.73,r:.058}],
 bumpF:{y:.45,h:.13,t:.07,out:.1,wrap:.42,guards:[-.34,.34],plate:false},
 bumpR:{y:.5,h:.14,t:.07,out:.1,wrap:.42,guards:[-.55,.55]},
 fin:{x:.82,z0:-2.2,z1:-2.58,h:.07,t:.06},
 tail:[{x:.74,y:.9,w:.07,h:.26}],
 ornament:{type:'bird',z:2.1},mirror:{y:1.0,z:.55,single:true},
 wheel:{kind:'cap',ww:.1},
 extras:T=>{const{M,G,S}=T;
  // wood-grain panels with black framing and chrome beading
  for(const sd of[-1,1]){
   for(const [za,zb] of[[-2.5,-1.98],[-1.0,.2]]){
    M.color(C.wood);sideSkin(M,G,'wood',sd,za,zb,(s,z)=>.52,(s,z)=>.8,.006,10,4);
    M.color([.12,.08,.05]);for(let z=za+.1;z<=zb-.05;z+=.42)sideSkin(M,G,'dark',sd,z-.008,z+.008,s=>.52,s=>.8,.008,1,2);
    for(const y of[.52,.8]){M.color([.12,.08,.05]);sideSkin(M,G,'dark',sd,za,zb,()=>y-.012,()=>y+.012,.009,8,1)}
    M.color(C.chrome);M.cls=1;M.tube('chrome',.008,flankPath(G,sd,[[za,.81],[zb,.81]],.012),4);M.cls=0}}
  // tailgate wood and chrome
  M.color(C.wood);M.boxB('wood',-.7,.7,.62,.92,-2.595,-2.58);M.color([.12,.08,.05]);M.boxB('dark',-.7,.7,.77,.78,-2.6,-2.585);
  rearWindow(M,-2.42,.55,1.08,1.34,T.o.dust);
  roofRack(M,.62,1.52,-2.3,.05,{h:.045});
  suitcase(M,-.25,1.52,-1.4,.7,.28,.45,[.45,.28,.16],.06);suitcase(M,.3,1.52,-.7,.55,.22,.36,[.25,.22,.2],-.04)}
};

/* ---- LIFTBACK: fastback sedan with a long sloping tail and a rear lift window ---- */
CARS.liftback={
 zr:-2.4,zf:2.6,w:.93,r:.355,tw:.21,tx:.77,ax:[-1.4,1.56],ra:.42,yb:.31,yf:.34,yr:.36,ym:.68,n:4.2,
 top:[[-2.4,.82],[-2.2,.92],[-1.8,.96],[-1.2,.98],[0,.97],[.7,.98],[1.3,.955],[2.0,.9],[2.6,.84]],
 rc:[.4,.4],rt:[.12,.12],rb:[.07,.08],
 cab:{roof:[[-2.2,.92],[-1.9,1.04],[-1.4,1.2],[-.8,1.34],[-.2,1.44],[.3,1.47],[.4,1.45],[.86,.975]],cw:[[-2.2,.7],[-1.4,.8],[-.5,.85],[.86,.9]],n:3.1,
  ws:[.32,.86],bl:[-2.2,-1.45],win:[[-1.35,-.55],[-.49,.24]],h0:.1,h1:.8,pil:.4,pilR:.55,pillarMat:'b',roofMat:'a',frame:.026},
 sweep:[{z0:-2.2,z1:-.1,y0:z=>.5,y1:z=>.72,mat:'a',tube:.008}],
 spear:[{z0:-.15,z1:2.05,y:z=>.74+(z>1.2?(z-1.2)*.03:0),r:.011}],
 rocker:true,skirt:{axles:[-1.4],mat:'b'},
 seams:[.28,-.52],handles:[[-.4,.82]],
 grille:{style:'egg',x:.5,y0:.57,y1:.78,bars:4},
 head:[{x:.78,y:.73,r:.07},{x:.64,y:.73,r:.058}],
 bumpF:{y:.45,h:.13,t:.07,out:.1,wrap:.42,guards:[-.34,.34],plate:false},
 bumpR:{y:.5,h:.14,t:.07,out:.1,wrap:.42,guards:[-.55,.55]},
 tail:[{x:.7,y:.86,w:.09,h:.18}],
 ornament:{type:'rocket',z:2.1},mirror:{y:1.0,z:.55,single:true},
 wheel:{kind:'cap',ww:.1},
 extras:T=>{const{M,G}=T;
  // hatch outline + chrome hatch handle
  M.color(C.chrome);M.tube('chrome',.008,[[-.5,.96,-2.27],[-.5,.9,-2.38],[.5,.9,-2.38],[.5,.96,-2.27]],4)}
};

/* ---- COUPE: pillarless hardtop with a wrap windshield and a stainless roof band ---- */
CARS.coupe={
 zr:-2.48,zf:2.6,w:.94,r:.355,tw:.21,tx:.775,ax:[-1.4,1.56],ra:.42,yb:.31,yf:.34,yr:.36,ym:.68,n:4.6,
 top:[[-2.48,.84],[-2.28,.96],[-1.8,.995],[-1.2,.99],[0,.97],[.7,.98],[1.3,.955],[2.0,.9],[2.6,.84]],
 rc:[.36,.4],rt:[.09,.12],rb:[.07,.08],
 cab:{roof:[[-1.56,.99],[-1.22,1.33],[-1.0,1.41],[.28,1.43],[.4,1.41],[.9,.975]],cw:[[-1.56,.78],[-1.2,.82],[0,.86],[.9,.9]],n:3,
  ws:[.38,.9],bl:[-1.56,-1.0],win:[[-1.0,.32]],h0:.1,h1:.8,pil:.3,pilR:.55,pillarMat:'a',roofMat:'a',frame:.026},
 sweep:[{z0:-2.25,z1:-.15,y0:z=>.52,y1:z=>z>-1?.8:lerp(.8,.93,(-1-z)/1.25),mat:'a'}],
 spear:[{z0:-.15,z1:2.05,y:z=>.8+(z>1.2?(z-1.2)*.03:0),r:.011}],
 rocker:true,skirt:{axles:[-1.4],mat:'b'},
 fin:{x:.8,z0:-1.1,z1:-2.44,h:.12,t:.07},
 seams:[.36,-1.0],handles:[[.0,.82]],
 grille:{style:'egg',x:.5,y0:.57,y1:.78,bars:4},
 head:[{x:.78,y:.73,r:.07},{x:.64,y:.73,r:.058}],
 bumpF:{y:.45,h:.13,t:.07,out:.1,wrap:.42,guards:[-.34,.34],plate:false},
 bumpR:{y:.5,h:.14,t:.07,out:.1,wrap:.42,guards:[-.55,.55]},
 tail:[{x:.66,y:.92,w:.1,h:.22}],
 ornament:{type:'bird',z:2.1},mirror:{y:1.0,z:.55,single:true},
 wheel:{kind:'cap',ww:.1},
 extras:T=>{const{M,G,cab}=T;
  // stainless "tiara" band over the roof
  const pts=[];for(let i=0;i<=18;i++){const a=i/18*PI,p=cab.ring(-.05,a);pts.push([p[0]*.995,p[1]+.01,p[2]])}
  M.color(C.chrome);M.cls=1;M.tube('chrome',.014,pts,5);M.cls=0}
};

/* ---- CABRIOLET: big-finned convertible, top folded under a vinyl boot ---- */
CARS.cabrio={
 zr:-2.5,zf:2.62,w:.95,r:.355,tw:.21,tx:.78,ax:[-1.42,1.58],ra:.42,yb:.31,yf:.34,yr:.36,ym:.66,n:4.4,
 top:[[-2.5,.84],[-2.3,.97],[-1.9,.99],[-1.5,.96],[-1.3,.8],[-1.2,.52],[.3,.52],[.5,.8],[.65,.93],[.9,.98],[1.3,.955],[2.0,.9],[2.62,.84]],
 tub:{z0:-1.2,z1:.4,floor:.52,top:.86},
 rc:[.36,.4],rt:[.09,.12],rb:[.07,.08],
 cab:{roof:[[.3,1.34],[.9,.98]],cw:[[.3,.84],[.9,.9]],n:6,ws:[.3,.9],pil:.2,chromePillar:true,frame:.045,
  intZ:[.4,-1.2],floor:.52,intBelt:.86},
 sweep:[{z0:-2.28,z1:-.2,y0:z=>.5,y1:z=>z>-1?.78:lerp(.78,.93,(-1-z)/1.28),mat:'a'}],
 spear:[{z0:-.2,z1:2.05,y:z=>.78+(z>1.2?(z-1.2)*.035:0),r:.011}],
 rocker:true,skirt:{axles:[-1.42],mat:'b'},
 fin:{x:.82,z0:-1.2,z1:-2.46,h:.15,t:.07},
 seams:[.35,-.5,-1.15],handles:[[-.45,.78]],seamTop:z=>.84,
 grille:{style:'egg',x:.5,y0:.57,y1:.78,bars:4},
 head:[{x:.78,y:.73,r:.07},{x:.64,y:.73,r:.058}],
 bumpF:{y:.45,h:.13,t:.07,out:.1,wrap:.42,guards:[-.34,.34],plate:false},
 bumpR:{y:.5,h:.14,t:.07,out:.1,wrap:.42,guards:[-.55,.55]},
 tail:[{x:.66,y:.93,w:.1,h:.22}],
 ornament:{type:'bird',z:2.1},mirror:{y:.98,z:.62,single:true},
 wheel:{kind:'cap',ww:.1},
 extras:T=>{const{M,G,MB,MA}=T;
  // folded hood under a vinyl boot + chrome rail
  M.color([.06,.05,.05]);M.boxB('vinyl',-.8,.8,.94,1.07,-1.78,-1.24,{bevel:.06});
  M.color(C.chrome);M.tube('chrome',.01,[[-.8,1.06,-1.74],[-.8,1.07,-1.26],[.8,1.07,-1.26],[.8,1.06,-1.74]],4)}
};

/* ---- ROADSTER: British-style two-seater (XK/MG spirit): low, wire wheels, bonnet strap, lamp buckets ---- */
CARS.roadster={
 zr:-1.95,zf:2.0,w:.76,r:.34,tw:.15,tx:.64,ax:[-1.15,1.05],ra:.4,yb:.26,yf:.3,yr:.3,ym:.56,n:3.4,
 top:[[-1.95,.7],[-1.78,.82],[-1.4,.84],[-1.1,.7],[-.95,.44],[.2,.44],[.4,.6],[.62,.84],[1.0,.86],[1.5,.8],[2.0,.64]],
 tub:{z0:-.95,z1:.3,floor:.44,top:.72},
 rc:[.4,.46],rt:[.1,.16],rb:[.08,.08],
 cab:{roof:[[.28,1.14],[.66,.85]],cw:[[.28,.66],[.66,.7]],n:6,ws:[.28,.66],pil:.22,chromePillar:true,frame:.04,
  intZ:[.3,-.95],floor:.44,intBelt:.7,bucket:true,single:true},
 sweep:[{z0:-1.7,z1:-.1,y0:z=>.44,y1:z=>.62,mat:'a',tube:.007}],
 spear:[{z0:-.1,z1:1.6,y:z=>.62+(z>.8?(z-.8)*.04:0),r:.01}],
 rocker:true,seams:[.3,-.95],handles:[],seamTop:z=>.68,
 grille:{style:'egg',x:.28,y0:.52,y1:.74,bars:3},
 head:[],
 bumpF:{y:.4,h:.09,t:.05,out:.07,wrap:.3,guards:[],plate:false},bumpR:{y:.42,h:.09,t:.05,out:.07,wrap:.3,plate:false},
 tail:[{x:.5,y:.78,w:.07,h:.08}],exhaustX:.3,
 wheel:{kind:'wire',ww:0},mirror:{y:.84,z:.5},
 extras:T=>{const{M,G,MB}=T;
  // headlamp buckets on stalks, up on the wings
  for(const sd of[-1,1]){const x=sd*.5,z=1.45,y=G.yTop(.5,z)+.1;
   M.color(C.chrome);M.tube('chrome',.012,[[x,y-.1,z-.04],[x,y-.02,z]],5);
   lampPod(M,x,y+.04,z+.02,.075,1,{});
   crown(M,G,MB,sd,.56,.15,.6,1.9,.05)}
  // bonnet strap, louvres
  for(const z of[1.25,1.75]){M.color([.2,.12,.07]);M.save().move(0,G.yTop(0,z)+.004,z);M.boxB('vinyl',-.3,.3,0,.012,-.03,.03,{bevel:.004});M.restore();M.color(C.chrome);for(const sd of[-1,1])M.boxB('chrome',sd*.3-.012,sd*.3+.012,G.yTop(0,z)-.0,G.yTop(0,z)+.02,z-.02,z+.02)}
  for(let z=.9;z<1.3;z+=.07){M.color([.05,.05,.05]);for(const sd of[-1,1])M.boxB('dark',sd*.45-.07,sd*.45+.07,G.yTop(.45,z)+.001,G.yTop(.45,z)+.004,z,z+.02)}
  spareTyre(M,0,.6,-2.02,.34,.17,-1,{rim:C.chrome});
  // leather door-top rolls
  for(const sd of[-1,1]){M.color([.16,.09,.06]);M.tube('vinyl',.022,[[sd*.66,.715,.35],[sd*.7,.715,-.2],[sd*.7,.715,-1.0]],5)}
  // tonneau cover over rear shelf
  M.color(C.canvas);M.boxB('canvas',-.62,.62,.72,.82,-1.45,-1.0,{bevel:.05});
  // wing-top racing roundel
 }
};

/* ---- TARGA: two-seat tourer, open roof, fixed rear hoop with porthole windows ---- */
CARS.targa={
 zr:-2.1,zf:2.35,w:.89,r:.345,tw:.2,tx:.73,ax:[-1.25,1.35],ra:.41,yb:.29,yf:.32,yr:.33,ym:.62,n:4.2,
 top:[[-2.1,.8],[-1.95,.93],[-1.9,.96],[-1.0,.96],[-.9,.7],[-.82,.5],[.1,.5],[.32,.6],[.55,.9],[.82,.96],[1.3,.95],[1.9,.88],[2.35,.8]],
 tub:{z0:-.95,z1:.3,floor:.5,top:.86},
 rc:[.34,.4],rt:[.09,.13],rb:[.07,.08],
 cab:{roof:[[.3,1.3],[.84,.96]],cw:[[.3,.8],[.84,.86]],n:6,ws:[.3,.84],pil:.2,chromePillar:true,frame:.045,
  intZ:[.3,-.95],floor:.5,intBelt:.86,bucket:true,single:true},
 cab2:{roof:[[-1.9,.96],[-1.55,1.28],[-1.22,1.34],[-1.05,1.3],[-1.0,.94]],cw:[[-1.9,.78],[-1.4,.82],[-1.0,.84]],n:3,bl:[-1.9,-1.45],h0:.12,h1:.8,pil:.4,pilR:.5,pillarMat:'a',roofMat:'a',frame:.026,noInterior:true},
 sweep:[{z0:-1.95,z1:-.1,y0:z=>.48,y1:z=>.7,mat:'a',tube:.008}],
 spear:[{z0:-.1,z1:2.05,y:z=>.7+(z>1.0?(z-1.0)*.05:0),r:.011}],
 rocker:true,seams:[.3,-.52],handles:[[-.35,.76]],seamTop:z=>.86,
 grille:{style:'fish',x:.52,y0:.5,y1:.68},
 head:[{x:.7,y:.73,r:.075}],
 bumpF:{y:.42,h:.1,t:.06,out:.08,wrap:.34,guards:[-.3,.3],plate:false},bumpR:{y:.46,h:.11,t:.06,out:.08,wrap:.34,guards:[-.5,.5]},
 tail:[{x:.62,y:.9,w:.09,h:.2}],
 fin:{x:.74,z0:-1.0,z1:-2.12,h:.06,t:.06},
 ornament:{type:'bird',z:1.95},mirror:{y:.96,z:.55,single:true},
 wheel:{kind:'cap',ww:.1},
 extras:T=>{const{M,G,MA}=T;
  // porthole windows in the hoop
  for(const sd of[-1,1]){const x=T.sideX(1.1,-1.42)+.004;M.save().move(sd*x,1.1,-1.42).rotY(sd*PI/2);
   M.color(C.chrome);M.lathe('chrome',[[.115,-.004],[.12,.02],[.105,.02],[.1,.0]],18,{sharp:.7});
   M.color(C.glass);M.cyl('retroglass',.1,.02,18,{caps:'t'});M.restore()}
  // chrome hoop trim at the open front edge
  M.color(C.chrome);M.tube('chrome',.01,Array.from({length:18},(_,i)=>{const p=T.cab2.ring(-1.02,i/17*PI);return[p[0],p[1]+.004,-1.0]}),4)
 }
};

/* ---- LIMOUSINE: stretched formal limousine with landau bars, partition and big fins ---- */
CARS.limo={
 zr:-3.5,zf:2.7,w:.96,r:.36,tw:.21,tx:.79,ax:[-2.2,1.66],ra:.43,yb:.31,yf:.34,yr:.36,ym:.68,n:4.6,
 top:[[-3.5,.86],[-3.3,.98],[-2.6,1.0],[-1.2,.99],[0,.97],[.7,.98],[1.3,.955],[2.0,.9],[2.7,.84]],
 rc:[.38,.42],rt:[.1,.12],rb:[.07,.08],
 cab:{roof:[[-2.75,.99],[-2.4,1.36],[-2.1,1.45],[.28,1.47],[.4,1.45],[.88,.975]],cw:[[-2.75,.84],[-2.3,.86],[0,.88],[.88,.92]],n:3,
  ws:[.36,.88],bl:[-2.75,-2.2],win:[[-.46,.26],[-1.2,-.54],[-1.9,-1.3],[-2.4,-1.98]],h0:.1,h1:.8,pil:.36,pilR:.55,pillarMat:'b',roofMat:'b',frame:.024,lining:[.15,.14,.12]},
 sweep:[{z0:-3.3,z1:-.15,y0:z=>.52,y1:z=>z>-1?.8:lerp(.8,.95,Math.min(1,(-1-z)/2.2)),mat:'a'}],
 spear:[{z0:-.15,z1:2.15,y:z=>.8+(z>1.3?(z-1.3)*.03:0),r:.011}],
 rocker:true,skirt:{axles:[-2.2],mat:'b'},
 fin:{x:.84,z0:-1.6,z1:-3.52,h:.2,t:.08},
 seams:[.3,-.5,-1.25,-1.95],handles:[[-.4,.82],[-1.2,.82],[-1.9,.82]],
 grille:{style:'egg',x:.52,y0:.57,y1:.8,bars:5},
 head:[{x:.8,y:.74,r:.075},{x:.66,y:.74,r:.06}],
 bumpF:{y:.45,h:.14,t:.075,out:.1,wrap:.44,guards:[-.36,.36],plate:false},
 bumpR:{y:.5,h:.15,t:.075,out:.1,wrap:.44,guards:[-.58,.58]},
 tail:[{x:.7,y:.95,w:.1,h:.24}],
 ornament:{type:'rocket',z:2.2},mirror:{y:1.0,z:.55},
 wheel:{kind:'cap',ww:.11},
 extras:T=>{const{M,G}=T;
  // landau bars on the rear quarter, partition behind the driver
  for(const sd of[-1,1]){M.color(C.chrome);M.cls=1;const x=G.xAt(1.3,-2.15)+.01;
   M.tube('chrome',.014,[[sd*x,1.2,-2.0],[sd*(x+.03),1.27,-2.12],[sd*x,1.2,-2.24]],5);M.cls=0}
  // v093: the partition was one slab as wide as the body: its top corners stuck out through the rear door glass. It is now cut in
  // four bands, each as wide as the cabin is at that height.
  {const cw=T.cabW||(()=>.82),ys=[.9,1.03,1.16,1.28,1.385];
   for(let i=0;i<4;i++){const w=Math.max(.05,Math.min(cw(ys[i],-.42),cw(ys[i+1],-.42))-.03);M.color([.05,.05,.05]);M.boxB('dark',-w,w,ys[i],ys[i+1],-.44,-.4);
    if(i===3){M.color(C.chrome);M.boxB('chrome',-w,w,ys[4]-.02,ys[4],-.45,-.39)}}}
  // pennant sockets on the front wings
  for(const sd of[-1,1]){M.color(C.chrome);M.save().move(sd*.86,G.yTop(.86,1.6)+.0,1.6);M.cyl('chrome',.02,.07,8);M.restore()}}
};

/* ---- MUSCLE: hot-rodded two-door hardtop: scoop, stripes, side pipes, fat mag wheels, nose-high rake ---- */
CARS.muscle={
 zr:-2.42,zf:2.55,w:.95,r:.35,rR:.4,tw:.21,twR:.3,tx:.78,txR:.74,ax:[-1.4,1.55],ra:.45,yb:.33,yf:.4,yr:.3,ym:.68,n:4.8,
 top:[[-2.42,.88],[-2.25,.99],[-1.8,1.02],[-1.2,1.0],[0,.98],[.7,.99],[1.3,.97],[2.0,.93],[2.55,.88]],
 rc:[.34,.38],rt:[.09,.1],rb:[.07,.08],
 cab:{roof:[[-1.5,1.0],[-1.18,1.3],[-1.0,1.37],[.26,1.38],[.4,1.36],[.9,.99]],cw:[[-1.5,.78],[-1.2,.82],[0,.86],[.9,.9]],n:3.2,
  ws:[.36,.9],bl:[-1.5,-1.0],win:[[-1.0,.3]],h0:.1,h1:.8,pil:.3,pilR:.55,pillarMat:'b',roofMat:'b',frame:.026,bucket:true},
 sweep:[{z0:-2.2,z1:-.2,y0:z=>.56,y1:z=>.66,mat:'a',tube:.008}],
 rocker:false,seams:[.34,-1.0],handles:[[.0,.84]],
 grille:{style:'teeth',x:.5,y0:.56,y1:.8,n:9},
 head:[{x:.76,y:.76,r:.075},{x:.62,y:.76,r:.06}],
 bumpF:{y:.5,h:.1,t:.06,out:.08,wrap:.36,guards:[],plate:false},
 bumpR:{y:.52,h:.1,t:.06,out:.08,wrap:.36,guards:[]},
 tail:[{x:.66,y:.9,w:.12,h:.1}],dualExhaust:true,exhaustX:.45,
 wheel:{kind:'mag',ww:0,rim:C.chrome},wheelRear:{kind:'mag',ww:0},
 extras:T=>{const{M,G,MA,MB}=T;
  // hood scoop + blower bulge
  M.save().move(0,G.yTop(0,1.3),1.3);M.color([1,1,1]);M.loft(MA,[{z:-.35,w:.22,yb:-.02,yt:.04,n:3},{z:-.1,w:.25,yb:-.02,yt:.2,n:3},{z:.3,w:.26,yb:-.02,yt:.22,n:3},{z:.4,w:.2,yb:-.02,yt:.12,n:3},{z:.45,w:.14,yb:-.02,yt:.0,n:3}],12);
  M.color([.03,.03,.03]);M.boxB('dark',-.2,.2,.1,.17,.38,.44);M.restore();
  // racing stripes down the middle
  topStripe(M,G,MA,-.12,.06,-2.25,2.45,.004);topStripe(M,G,MA,.12,.06,-2.25,2.45,.004);
  // chrome side pipes
  for(const sd of[-1,1]){M.color(C.chrome);M.tube('chrome',.04,[[sd*.88,.36,.55],[sd*.9,.34,.2],[sd*.9,.34,-.55],[sd*.89,.35,-.95]],8);
   M.color([.4,.4,.4]);for(let z=.45;z>-.8;z-=.16)M.tube('chrome',.043,[[sd*.9,.34,z],[sd*.9,.34,z-.03]],8)}
  // fender crowns, rear fins small
  for(const sd of[-1,1]){crown(M,G,MB,sd,.72,.2,.7,2.2,.04)}}
};

/* ---- SPORT: rounded rear-engined fastback coupe (356 spirit) ---- */
CARS.sport={
 zr:-1.95,zf:2.0,w:.8,r:.32,tw:.17,tx:.67,ax:[-1.2,1.0],ra:.38,yb:.25,yf:.3,yr:.3,ym:.55,n:3.0,
 top:[[-1.95,.62],[-1.7,.78],[-1.2,.86],[-.5,.88],[.2,.86],[.55,.88],[1.0,.8],[1.5,.7],[2.0,.58]],
 rc:[.42,.5],rt:[.14,.2],rb:[.08,.08],
 cab:{roof:[[-1.5,.84],[-1.1,1.08],[-.7,1.24],[-.1,1.3],[.2,1.27],[.65,.86]],cw:[[-1.5,.6],[-1.0,.72],[-.2,.76],[.65,.76]],n:2.7,
  ws:[.2,.65],bl:[-1.5,-.72],win:[[-.62,.12]],h0:.1,h1:.84,pil:.4,pilR:.6,pillarMat:'b',roofMat:'b',frame:.025,single:true,bucket:true},
 sweep:[{z0:-1.8,z1:1.5,y0:z=>.42,y1:z=>.52,mat:'a',tube:.007,fill:true}],
 seams:[.14,-1.0],handles:[[-.2,.68]],
 grille:{style:'oval',x:.2,y0:.4,y1:.48,bars:3},
 head:[{x:.58,y:.7,r:.085}],
 bumpF:{y:.38,h:.07,t:.045,out:.06,wrap:.24,guards:[],plate:false},bumpR:{y:.4,h:.07,t:.045,out:.06,wrap:.24,guards:[-.4,.4],gs:.6},
 tail:[{x:.5,y:.72,w:.07,h:.07}],dualExhaust:true,exhaustX:.3,
 wheel:{kind:'disc',ww:.06,hubCol:[.7,.1,.1]},
 extras:T=>{const{M,G,MB}=T;
  // humped front wings with the lamps, rear engine louvres, chrome bumper over-riders
  for(const sd of[-1,1])crown(M,G,MB,sd,.58,.18,.8,1.85,.07);
  for(let i=0;i<6;i++){M.color([.03,.03,.03]);const z=-1.75+i*.07;M.boxB('dark',-.28,.28,G.yTop(0,z)+.001,G.yTop(0,z)+.006,z,z+.03)}
  M.color(C.chrome);M.boxB('chrome',-.12,.12,G.yTop(0,-1.9)+.0,G.yTop(0,-1.9)+.03,-1.92,-1.88,{bevel:.01})}
};

/* ---- SUPERCAR: gull-wing grand tourer (300SL spirit): eyebrow wings, bonnet bulge, louvres, side pipes ---- */
CARS.supercar={
 zr:-2.15,zf:2.4,w:.9,r:.34,tw:.19,tx:.74,ax:[-1.3,1.25],ra:.4,yb:.26,yf:.3,yr:.3,ym:.56,n:3.3,
 top:[[-2.15,.72],[-1.9,.86],[-1.3,.9],[-.5,.9],[.3,.88],[.62,.9],[1.1,.86],[1.8,.78],[2.4,.68]],
 rc:[.36,.46],rt:[.12,.16],rb:[.08,.08],
 cab:{roof:[[-1.35,.89],[-1.0,1.14],[-.6,1.25],[.1,1.26],[.35,1.22],[.72,.89]],cw:[[-1.35,.66],[-.9,.78],[-.2,.8],[.72,.8]],n:2.8,
  ws:[.32,.72],bl:[-1.35,-.75],win:[[-.68,.22]],h0:.1,h1:.84,pil:.35,pilR:.6,pillarMat:'b',roofMat:'b',frame:.026,single:true,bucket:true},
 sweep:[{z0:-2.0,z1:-.1,y0:z=>.38,y1:z=>.46,mat:'a',tube:.007}],
 seams:[.26,-.7],handles:[],
 grille:{style:'fish',x:.5,y0:.46,y1:.62},
 head:[{x:.7,y:.7,r:.08}],
 bumpF:{y:.36,h:.08,t:.05,out:.06,wrap:.3,guards:[-.4,.4],gs:.7,plate:false},bumpR:{y:.4,h:.08,t:.05,out:.06,wrap:.3,guards:[-.4,.4],gs:.7},
 tail:[{x:.66,y:.78,w:.09,h:.1}],
 wheel:{kind:'cap',ww:0,rim:C.chrome},
 extras:T=>{const{M,G,MB,cab}=T;
  for(const sd of[-1,1]){crown(M,G,MB,sd,.64,.2,.65,2.0,.06);for(let i=0;i<3;i++){M.color(C.chrome);M.tube('chrome',.012,[[sd*.88,.46+i*.04,.72+i*.0],[sd*.9,.47+i*.04,.55]],4)}}
  crown(M,G,MB,1,.0,.24,1.0,2.15,.06);
  // bonnet louvre slats
  for(let i=0;i<5;i++){const z=1.3+i*.1;M.color([.05,.05,.05]);M.boxB('dark',-.3,.3,G.yTop(0,z)+.04,G.yTop(0,z)+.048,z,z+.035)}
  // gull-wing door cut lines up over the roof
  const dpts=[];for(let i=0;i<=14;i++){const p=cab.ring(-.7+(i>=7?0:0),i/14*PI);dpts.push([p[0],p[1]+.004,-.7])}
  M.color([.04,.04,.04]);M.cls=2;M.tube('dark',.004,dpts,4);
  const d2=[];for(let i=0;i<=14;i++){const p=cab.ring(.3,i/14*PI);d2.push([p[0],p[1]+.004,.3])}
  M.tube('dark',.004,d2,4);
  M.cls=0;
  // exhaust pipes beyond the front wheel
  for(const sd of[-1,1]){M.color(C.chrome);for(const dy of[0,.045])M.tube('chrome',.018,[[sd*.9,.38+dy,.2],[sd*.91,.38+dy,-.5]],6)}}
};

/* ---- SUV: big boxy truck-based estate (Suburban spirit) with barn doors and a spare on the roof ---- */
CARS.suv={
 zr:-2.5,zf:2.55,w:.96,r:.39,tw:.24,tx:.8,ax:[-1.5,1.45],ra:.47,yb:.42,yf:.44,yr:.42,ym:.82,n:5.2,
 top:[[-2.5,1.22],[-2.4,1.27],[-1.8,1.27],[-.4,1.26],[.35,1.22],[.7,1.1],[1.1,1.04],[1.8,1.0],[2.55,.9]],
 rc:[.12,.38],rt:[.06,.12],rb:[.1,.1],
 cab:{roof:[[-2.42,1.26],[-2.4,1.78],[-2.3,1.86],[0,1.88],[.12,1.86],[.55,1.17]],cw:[[-2.42,.88],[0,.92],[.55,.92]],n:4.2,
  ws:[.12,.55],win:[[-.3,.4],[-1.25,-.52],[-2.1,-1.33]],h0:.1,h1:.86,pil:.34,pilR:.2,pillarMat:'b',roofMat:'a',frame:.03,capRear:'b'},
 sweep:[{z0:-2.4,z1:.5,y0:z=>.62,y1:z=>.72,mat:'a',tube:.009}],
 rocker:false,seams:[.42,-.45,-1.28],handles:[[.0,.96],[-.62,.96],[-1.5,.96]],
 grille:{style:'egg',x:.6,y0:.66,y1:.92,bars:4},
 head:[{x:.8,y:.96,r:.095}],
 bumpF:{y:.52,h:.14,t:.07,out:.07,wrap:.3,guards:[],plate:true},bumpR:{y:.52,h:.14,t:.07,out:.07,wrap:.3},
 tail:[{x:.8,y:1.1,w:.09,h:.22}],
 ornament:{type:'bird',z:1.9},mirror:{y:1.3,z:.35},
 wheel:{kind:'steel',ww:.09,rim:[.85,.85,.82]},
 extras:T=>{const{M,G,MB}=T;
  for(const sd of[-1,1]){crown(M,G,MB,sd,.74,.2,.7,2.3,.05);
   M.color(C.chrome);M.boxB('chrome',sd*.99-.03,sd*.99+.03,.36,.4,-1.2,.9,{bevel:.01})}  // running boards
  rearWindow(M,-2.43,.5,1.5,1.74,T.o.dust);
  roofRack(M,.7,1.92,-2.3,.0,{h:.05});spareTyre(M,0,1.92+.14,-1.15,.38,.2,0,{});M.color(C.chromeD);for(const z of[-1.3,-1.0])M.tube('steel',.008,[[-.4,1.93,z],[-.12,2.1,z],[.12,2.1,z],[.4,1.93,z]],4);
  // barn-door seam and handles on the tailgate
  M.color([.04,.04,.04]);M.boxB('dark',-.004,.004,.6,1.8,-2.43,-2.42);
  M.color(C.chrome);for(const sd of[-1,1])M.boxB('chrome',sd*.08-.015,sd*.08+.015,1.2,1.32,-2.43,-2.46,{bevel:.006})}
};

/* ---- CROSSOVER: bathtub station wagon on a raised stance (Rambler / Jeep Wagon spirit) ---- */
CARS.crossover={
 zr:-2.25,zf:2.3,w:.88,r:.36,tw:.2,tx:.74,ax:[-1.3,1.38],ra:.43,yb:.38,yf:.4,yr:.4,ym:.7,n:3.8,
 top:[[-2.25,1.0],[-2.15,1.05],[-1.6,1.06],[-.2,1.04],[.45,1.0],[.8,.97],[1.5,.94],[2.3,.84]],
 rc:[.2,.4],rt:[.1,.14],rb:[.09,.09],
 cab:{roof:[[-2.15,1.05],[-2.12,1.5],[-1.95,1.6],[.1,1.62],[.22,1.6],[.7,1.0]],cw:[[-2.15,.8],[0,.82],[.7,.84]],n:3.4,
  ws:[.2,.7],win:[[-1.9,-1.15],[-1.05,-.5],[-.44,.14]],h0:.1,h1:.82,pil:.38,pilR:.3,pillarMat:'a',roofMat:'a',frame:.026,capRear:'b'},
 sweep:[{z0:-2.2,z1:2.0,y0:z=>.56,y1:z=>.66,mat:'a',tube:.008}],
 rocker:true,seams:[.18,-.47,-1.1],handles:[[-.3,.9],[-.95,.9]],
 grille:{style:'slot',x:.4,y0:.58,y1:.82,n:7,col:C.chrome},
 head:[{x:.66,y:.84,r:.085}],
 bumpF:{y:.5,h:.12,t:.06,out:.07,wrap:.3,guards:[-.3,.3],gs:.8,plate:true},bumpR:{y:.5,h:.12,t:.06,out:.07,wrap:.3},
 tail:[{x:.66,y:.9,w:.07,h:.2}],
 ornament:{type:'star',z:1.7},mirror:{y:1.1,z:.35},
 wheel:{kind:'disc',ww:.08,rim:[.9,.9,.88]},
 extras:T=>{const{M,G,MB}=T;
  for(const sd of[-1,1])crown(M,G,MB,sd,.66,.18,.7,2.0,.045);
  rearWindow(M,-2.16,.5,1.22,1.46,T.o.dust);
  roofRack(M,.6,1.66,-1.9,.0,{h:.05});suitcase(M,0,1.66,-1.0,.7,.26,.42,[.4,.25,.15],0);
  // bull bar
  M.color(C.chrome);M.tube('chrome',.02,[[-.5,.44,2.4],[-.5,.78,2.42],[.5,.78,2.42],[.5,.44,2.4]],6)}
};

/* ---- SERVICE CARS (offshoots): police cruiser, taxi cab, ambulance ---- */
const sedanCab=Object.assign({},CARS.sedan.cab);
CARS.police=Object.assign({},CARS.sedan,{
 cab:Object.assign({},sedanCab,{pillarMat:'b',roofMat:'b'}),
 sweep:[{z0:-1.38,z1:.33,y0:z=>.36,y1:z=>.95,mat:'a',tube:.008}],
 spear:[{z0:.33,z1:2.05,y:z=>.8+(z>1.2?(z-1.2)*.03:0),r:.011}],
 rocker:false,fin:{x:.8,z0:-1.1,z1:-2.44,h:.1,t:.07},
 ornament:null,
 extras:T=>{const{M,G,MB,MA}=T,y=1.495;
  // roof beacon: base plate, red dome, siren horns
  M.color([.06,.06,.06]);M.boxB('dark',-.2,.2,y-.005,y+.03,-.35,.05,{bevel:.012});
  M.color([.85,.05,.05]);M.save().move(0,y+.03,-.15);M.lathe('plastic',[[.0,.0],[.12,.0],[.13,.04],[.1,.1],[.05,.14],[0,.15]],14,{sharp:.6});M.restore();
  M.color([.1,.25,.8]);M.save().move(.0,y+.03,-.15);M.boxB('plastic',-.002,.002,.02,.1,-.1,.1);M.restore();
  M.color(C.chrome);for(const sd of[-1,1]){M.save().move(sd*.15,y+.03,-.3).rotX(PI/2);M.cyl('chrome',.03,.07,8,{r1:.045});M.restore()}
  // A-pillar spotlight, fender siren, push bar
  for(const sd of[-1]){M.color(C.chrome);M.save().move(sd*.95,1.07,.55);M.cyl('chrome',.055,.1,10);M.color([.95,.95,.8]);M.save().move(0,.1,0);M.cyl('lampOff',.045,.01,10,{caps:'t'});M.restore();M.restore()}
  M.color(C.chrome);M.save().move(.62,G.yTop(.62,1.45),1.45);M.lathe('chrome',[[0,0],[.04,0],[.05,.04],[.03,.09],[0,.1]],10);M.restore();
  M.color(C.chrome);M.tube('chrome',.012,[[-.4,.45,2.77],[-.4,.7,2.77],[.4,.7,2.77],[.4,.45,2.77]],5)}
});
CARS.taxi=Object.assign({},CARS.sedan,{
 cab:Object.assign({},sedanCab,{pillarMat:'b',roofMat:'b'}),
 sweep:[{z0:-2.25,z1:1.95,y0:z=>.52,y1:z=>.6,mat:'a',tube:.006,edge:false}],
 spear:[],ornament:null,
 extras:T=>{const{M,G}=T,y=1.495;
  // checker band
  for(const sd of[-1,1])for(let r=0;r<2;r++)for(let i=0;i<36;i++){if((i+r)%2)continue;const z0=-2.2+i*.115;if(z0>1.0&&z0<1.2)continue;const zc=z0,za=Math.max(zc,-2.2),zb=Math.min(zc+.115,1.9);if(zb<=za)continue;
   M.color([.95,.95,.92]);sideSkin(M,G,'paint',sd,za,zb,()=>.52+r*.04,()=>.56+r*.04,.0085,1,1)}
  // roof light box with chrome rails, antenna
  M.color([.95,.9,.65]);M.boxB('plastic',-.3,.3,y,y+.17,-.32,-.02,{bevel:.03});
  M.color(C.chrome);M.boxB('chrome',-.31,.31,y-.005,y+.01,-.33,-.01);M.boxB('chrome',-.31,.31,y+.165,y+.18,-.33,-.01,{bevel:.006});
  M.color([.1,.1,.1]);for(const sd of[-1,1])M.boxB('dark',sd*.3-.005,sd*.3+.005,y+.01,y+.165,-.32,-.02)}
});
CARS.ambulance={
 zr:-3.15,zf:2.65,w:.96,r:.36,tw:.21,tx:.79,ax:[-1.95,1.62],ra:.43,yb:.33,yf:.34,yr:.38,ym:.7,n:4.8,
 top:[[-3.15,.98],[-3.0,1.0],[-2.2,1.0],[-1.2,.99],[0,.97],[.7,.98],[1.3,.955],[2.0,.9],[2.65,.84]],
 rc:[.1,.4],rt:[.07,.12],rb:[.07,.08],
 cab:{roof:[[-3.02,1.0],[-3.0,1.72],[-2.9,1.8],[-.55,1.82],[-.4,1.7],[.1,1.52],[.3,1.5],[.4,1.48],[.88,.975]],cw:[[-3.02,.88],[-.6,.9],[0,.88],[.88,.92]],n:4,
  ws:[.36,.88],win:[[-.46,.28],[-1.55,-.95],[-2.55,-1.95]],h0:.14,h1:.84,pil:.36,pilR:.2,pillarMat:'b',roofMat:'b',frame:.026,capRear:'a',lining:[.8,.8,.76]},
 sweep:[{z0:-3.05,z1:2.2,y0:z=>.6,y1:z=>.7,mat:'a',tube:.007,edge:false}],
 spear:[{z0:.3,z1:2.15,y:z=>.8+(z>1.2?(z-1.2)*.03:0),r:.011}],
 rocker:true,skirt:{axles:[-1.95],mat:'a'},
 fin:{x:.82,z0:-2.2,z1:-3.15,h:.16,t:.07},
 seams:[.3,-.5,-1.6],handles:[[-.4,.82]],
 grille:{style:'egg',x:.5,y0:.57,y1:.78,bars:4},
 head:[{x:.78,y:.73,r:.07},{x:.64,y:.73,r:.058}],
 bumpF:{y:.45,h:.13,t:.07,out:.1,wrap:.42,guards:[-.34,.34],plate:false},
 bumpR:{y:.5,h:.14,t:.07,out:.1,wrap:.42,guards:[-.55,.55]},
 tail:[{x:.76,y:1.0,w:.1,h:.3}],
 mirror:{y:1.1,z:.45},
 wheel:{kind:'cap',ww:.1},
 extras:T=>{const{M,G}=T,y=1.82;
  // light bar: two red domes and a blue one, siren, chrome rails
  M.color(C.chrome);M.boxB('chrome',-.46,.46,y,y+.03,-.9,-.5,{bevel:.01});
  for(const [x,col] of[[-.34,[.85,.05,.05]],[.34,[.85,.05,.05]],[0,[.1,.25,.85]]]){M.color(col);M.save().move(x,y+.03,-.7);M.lathe('plastic',[[0,0],[.1,0],[.11,.03],[.08,.08],[0,.1]],12,{sharp:.6});M.restore()}
  M.color(C.chrome);M.save().move(0,y+.03,-.55).rotX(PI/2);M.cyl('chrome',.03,.09,8,{r1:.05});M.restore();
  // rear door seams, handle, bumper step
  M.color([.04,.04,.04]);M.boxB('dark',-.004,.004,.6,1.7,-3.03,-3.02);M.color(C.chrome);for(const sd of[-1,1])M.boxB('chrome',sd*.1-.015,sd*.1+.015,1.0,1.12,-3.03,-3.06,{bevel:.006});
  // frosted rear windows
  rearWindow(M,-3.04,.38,1.2,1.5,T.o.dust)}
};

/* ================================================================ TRUCKS: hood-nose workhorses built on the same body system ================================================================ */
/* a conventional 50s hood-nose cab: cab roof/windows over a wide body. Used by pickup, tow, dump, truck, army, bus-nose, fire */
const truckCab=(o)=>Object.assign({
 roof:[[-.74,1.1],[-.7,1.62],[-.55,1.72],[.0,1.74],[.1,1.72],[.58,1.1]],cw:[[-.74,.8],[0,.84],[.58,.86]],n:4,
 ws:[.1,.58],win:[[-.42,.46]],h0:.12,h1:.82,pil:.36,pilR:.2,pillarMat:'b',roofMat:'b',frame:.028,capRear:'b'},o||{});

/* ---- PICKUP: 3100-style half-ton with bulging wings, chrome bar grille and a stake-free wood-floor bed ---- */
CARS.pickup={
 zr:-.8,zf:2.5,w:.92,r:.4,tw:.22,tx:.8,txR:.8,ax:[-2.0,1.5],ra:.47,yb:.52,yf:.52,yr:.52,ym:.9,n:5,
 top:[[-.8,1.12],[-.7,1.14],[.3,1.14],[.65,1.12],[1.1,1.12],[1.8,1.1],[2.4,1.04],[2.5,.96]],
 rc:[.08,.3],rt:[.07,.08],rb:[.1,.1],
 cab:truckCab({sweepRoof:0}),
 sweep:[{z0:-.7,z1:.55,y0:z=>.62,y1:z=>.72,mat:'a',tube:.008,edge:false}],
 rocker:false,seams:[.5,-.5],handles:[[.0,.98]],
 grille:{style:'egg',x:.48,y0:.62,y1:1.0,bars:5},
 head:[{x:.74,y:1.0,r:.11,inner:[.8,.8,.7]}],
 bumpF:{y:.5,h:.15,t:.08,out:.08,wrap:.28,guards:[],plate:true},
 tail:[],exhaust:false,plateR:null,
 ornament:{type:'bird',z:2.0},mirror:{y:1.4,z:.4,big:true},
 wheel:{kind:'steel',ww:.08,rim:[.9,.88,.8]},
 extras:T=>{const{M,G,MB,MA,S}=T;
  chassis(M,{z0:-3.3,z1:2.2,axles:[-2.0,1.5],tx:.8,r:.4,rail:.45,y0:.5,y1:.62,flaps:.55,flapTop:.8,tankZ:-.9});
  for(const sd of[-1,1])crown(M,G,MB,sd,.82,.2,.5,2.25,.14);
  // running boards + chrome
  for(const sd of[-1,1]){M.color([.1,.1,.1]);M.boxB('dark',sd*.98-.1,sd*.98+.1,.43,.46,-.7,.5,{bevel:.01})}
  // bed: wood floor, steel sides with wheel humps, tail gate with chains
  const bz0=-.86,bz1=-3.2,bx=.84,fy=.88,top=1.28;
  M.color(C.wood);M.boxB('wood',-bx+.04,bx-.04,fy-.05,fy,bz1,bz0);
  M.color([.2,.12,.07]);for(let x=-bx+.2;x<bx-.1;x+=.2)M.boxB('dark',x-.004,x+.004,fy,fy+.003,bz1+.03,bz0-.03);
  M.color([1,1,1]);
  for(const sd of[-1,1]){M.boxB(MB,sd*bx-.04,sd*bx+.04,fy-.1,top,bz1,bz0,{bevel:.02});
   M.color(C.chrome);M.boxB('chrome',sd*bx-.05,sd*bx+.05,top-.01,top+.035,bz1,bz0,{bevel:.014});M.color([1,1,1]);
   M.boxB(MB,sd*(bx-.55)-.18,sd*(bx-.55)+.18,fy,fy+.2,-2.35,-1.65,{bevel:.06});    // wheel humps
   // rear wings: rounded fenders with a stepped sill
   crown(M,G,MB,sd,.98,.2,-2.5,-1.5,0,{prof:u=>Math.sin(u*PI)**.5});}
  M.boxB(MB,-bx,bx,fy-.1,top,bz1-.04,bz1+.02,{bevel:.02});
  M.color(C.chrome);M.boxB('chrome',-.12,.12,top-.4,top-.34,bz1-.06,bz1-.04,{bevel:.01});M.tube('chrome',.008,[[-.78,top-.2,bz1-.04],[-.7,top-.38,bz1-.12]],4);M.tube('chrome',.008,[[.78,top-.2,bz1-.04],[.7,top-.38,bz1-.12]],4);
  M.color([1,1,1]);M.boxB(MB,-bx,bx,fy-.1,top,bz0-.08,bz0,{bevel:.02}); // headboard
  // tail lights + bumper + plate
  for(const sd of[-1,1]){M.color(C.chrome);M.boxB('chrome',sd*.7-.05,sd*.7+.05,.98,1.12,bz1-.07,bz1-.04,{bevel:.008});M.color(C.red);M.boxB('plastic',sd*.7-.04,sd*.7+.04,.99,1.1,bz1-.09,bz1-.065)}
  M.color(C.chrome);M.sweep('chrome',rrShape(.14,.07,.03,3),[[-.95,.56,bz1-.13],[-.6,.56,bz1-.17],[.6,.56,bz1-.17],[.95,.56,bz1-.13],[1.0,.56,bz1+.15]],{});
  M.color([.95,.93,.78]);M.boxB('plastic',-.26,.26,.62,.76,bz1-.2,bz1-.188)
 }
};
CARS.pickup.cab.pillarMat='b';

/* ---- TOW TRUCK: two-tone wrecker with an A-frame boom, winch, hook and amber beacon ---- */
CARS.tow=Object.assign({},CARS.pickup,{
 ax:[-2.6,1.55],wax:[-2.6,1.55],dual:true,zr:-.8,zf:2.55,
 cab:truckCab({pillarMat:'a',roofMat:'a'}),
 sweep:[{z0:-.7,z1:2.2,y0:z=>.66,y1:z=>.74,mat:'a',tube:.008,edge:false}],
 extras:T=>{const{M,G,MB,MA,S}=T;
  chassis(M,{z0:-4.1,z1:2.2,axles:[-2.6,1.55],tx:.8,r:.4,rail:.45,y0:.5,y1:.62,flaps:.6,flapTop:.82,tankZ:-1.2});
  for(const sd of[-1,1])crown(M,G,MB,sd,.82,.2,.5,2.3,.14);
  // wrecker deck with side tool lockers, ribbed
  const z0=-.86,z1=-3.9,top=1.2,fy=.86;
  M.color([.14,.14,.15]);M.boxB('steel',-.9,.9,fy-.12,fy,z1,z0,{bevel:.015});
  M.color([1,1,1]);
  for(const sd of[-1,1]){M.boxB(MA,sd*.86-.1,sd*.86+.1,fy,top,-2.0,z0-.05,{bevel:.03});M.boxB(MA,sd*.86-.1,sd*.86+.1,fy,top-.1,z1+.1,-3.1,{bevel:.03});
   M.color(C.chrome);for(let z=-1.0;z>-1.95;z-=.3)M.boxB('chrome',sd*.97-.005,sd*.97+.005,fy+.1,top-.1,z-.12,z,{bevel:.003});
   M.boxB('chrome',sd*.97-.008,sd*.97+.008,top-.02,top+.02,-2.0,z0-.05);M.color([1,1,1])}
  // boom: pivot tower, A-frame, cable, hook
  M.color(MB==='carpaint'?[1,1,1]:[1,1,1]);M.boxB(MB,-.22,.22,fy,fy+.9,-2.05,-1.55,{bevel:.04});
  M.color(C.chrome);M.save().move(0,fy+.9,-1.8).rotZ(PI/2);M.cyl('chrome',.07,.5,10);M.restore();
  M.color([.12,.12,.12]);for(const sd of[-1,1])M.tube('steel',.04,[[sd*.14,fy+.9,-1.8],[sd*.14,fy+1.45,-2.6],[sd*.1,fy+1.75,-3.55]],8);
  M.color(C.chrome);M.tube('steel',.03,[[0,fy+1.0,-1.9],[0,fy+1.78,-3.5]],6);
  M.color([.05,.05,.05]);M.tube('steel',.012,[[0,fy+1.74,-3.55],[0,fy+.55,-3.7],[0,fy+.2,-3.72]],4);
  M.color(C.chrome);M.save().move(0,fy+.1,-3.72);M.lathe('chrome',[[0,.1],[.05,.1],[.07,.05],[.04,-.04],[0,-.06]],8);M.restore();
  M.color([.2,.2,.2]);M.save().move(0,fy+1.78,-3.55).rotZ(PI/2);M.cyl('steel',.07,.22,10);M.restore();
  // winch drum, spade, bumper, rotating amber beacon on the cab
  M.color([.25,.25,.27]);M.save().move(.3,fy+.2,-1.35).rotZ(PI/2);M.cyl('steel',.1,.6,10);M.restore();
  M.color(C.chrome);M.sweep('chrome',rrShape(.16,.08,.03,3),[[-.95,.6,-4.1],[-.5,.6,-4.15],[.5,.6,-4.15],[.95,.6,-4.1]],{});
  M.color([.95,.6,.05]);M.save().move(0,1.74,-.15);M.lathe('plastic',[[0,0],[.08,0],[.09,.04],[.06,.1],[0,.12]],10);M.restore();
  M.color(C.chrome);M.boxB('chrome',-.1,.1,1.735,1.745,-.25,-.05)
 }
});

/* ---- DUMP TRUCK: tandem-axle hauler with a ribbed bed, hoist cylinder and cab guard ---- */
CARS.dump=Object.assign({},CARS.pickup,{
 zr:-.85,zf:2.7,w:.98,r:.46,tw:.26,tx:.9,txR:.88,twR:.26,ax:[-2.9,1.65],wax:[-3.9,-2.55,1.65],ra:.54,dual:true,yb:.6,yf:.62,yr:.6,ym:1.0,n:5,
 top:[[-.85,1.3],[-.75,1.32],[.3,1.3],[.7,1.28],[1.2,1.28],[2.0,1.26],[2.6,1.2],[2.7,1.1]],
 cab:truckCab({roof:[[-.8,1.28],[-.76,1.84],[-.6,1.94],[0,1.96],[.12,1.94],[.62,1.28]],cw:[[-.8,.86],[0,.9],[.62,.92]],ws:[.12,.62],win:[[-.42,.5]],pillarMat:'a',roofMat:'a'}),
 sweep:[{z0:-.75,z1:.6,y0:z=>.7,y1:z=>.8,mat:'a',tube:.008,edge:false}],
 grille:{style:'egg',x:.52,y0:.74,y1:1.2,bars:5},head:[{x:.82,y:1.18,r:.12}],
 bumpF:{y:.62,h:.17,t:.09,out:.08,wrap:.28,guards:[],plate:true},
 wheel:{kind:'steel',ww:0,rim:[.35,.35,.37]},wheelRear:{kind:'steel',ww:0,rim:[.35,.35,.37]},
 mirror:{y:1.7,z:.5,big:true},ornament:{type:'bird',z:2.2},
 extras:T=>{const{M,G,MB,MA}=T;
  chassis(M,{z0:-5.2,z1:2.4,axles:[-3.9,-2.55,1.65],tx:.9,r:.46,rail:.5,y0:.62,y1:.76,flaps:.7,flapTop:.98,tankZ:-1.3});
  for(const sd of[-1,1])crown(M,G,MB,sd,.88,.22,.5,2.5,.12);
  // dump body: sloped front, ribbed sides, cab guard, tailgate hinge
  const z0=-.95,z1=-5.15,fy=1.0,top=2.18,bw=.98;
  M.color([1,1,1]);
  M.boxB(MA,-bw,bw,fy,fy+.1,z1,z0,{bevel:.03});
  for(const sd of[-1,1]){M.boxB(MA,sd*bw-.05,sd*bw+.05,fy+.1,top,z1,z0,{bevel:.03});
   M.color(C.chrome);M.boxB('chrome',sd*bw-.07,sd*bw+.07,top-.02,top+.06,z1,z0,{bevel:.02});M.color([.2,.2,.2]);
   for(let z=z1+.3;z<z0-.1;z+=.55)M.boxB('steel',sd*bw-.075,sd*bw+.075,fy+.06,top-.04,z,z+.08,{bevel:.01});M.color([1,1,1])}
  M.boxB(MA,-bw,bw,fy+.1,top,z0-.08,z0,{bevel:.03});           // headboard
  // cab shield canopy over the roof
  M.save().move(0,1.98,-.45);M.boxB(MA,-bw+.05,bw-.05,0,.12,-.1,1.0,{bevel:.05});M.restore();
  M.boxB(MA,-bw,bw,top-.02,top+.1,z0-.3,z0,{bevel:.04});
  // tailgate (hinged on pins), chains
  M.boxB(MA,-bw,bw,fy+.1,top-.1,z1-.06,z1+.01,{bevel:.025});
  M.color(C.chrome);for(const sd of[-1,1]){M.save().move(sd*bw,top-.12,z1+.02).rotZ(PI/2);M.cyl('chrome',.04,.1,8);M.restore()}
  M.color([.1,.1,.1]);M.tube('steel',.012,[[-.7,top-.25,z1-.04],[-.7,top-.55,z1-.08]],4);M.tube('steel',.012,[[.7,top-.25,z1-.04],[.7,top-.55,z1-.08]],4);
  // hoist: hydraulic ram on a sub-frame pivot
  M.color(C.chrome);M.tube('chrome',.07,[[0,.9,-1.9],[0,1.2,-2.0]],10);M.tube('chrome',.045,[[0,1.2,-2.0],[0,1.45,-2.08]],10);
  // tail bumper + lamps
  M.color(C.chrome);M.sweep('chrome',rrShape(.16,.08,.03,3),[[-.98,.7,-5.2],[-.5,.7,-5.25],[.5,.7,-5.25],[.98,.7,-5.2]],{});
  for(const sd of[-1,1]){M.color(C.red);M.boxB('plastic',sd*.8-.07,sd*.8+.07,.88,1.0,z1-.09,z1-.06)}
 }
});

/* ---- TRUCK: standalone heavy tractor ("bobtail") with a long hood, chrome stacks and a fifth wheel ---- */
CARS.truck=Object.assign({},CARS.pickup,{
 zr:-.8,zf:3.0,w:1.0,r:.5,tw:.3,tx:.92,txR:.9,twR:.28,ax:[-3.0,2.0],wax:[-3.35,-2.05,2.0],ra:.58,dual:true,yb:.66,yf:.66,yr:.66,ym:1.1,n:5.2,
 top:[[-.8,1.4],[-.7,1.42],[.2,1.4],[.5,1.38],[.8,1.36],[2.0,1.34],[2.7,1.3],[3.0,1.2]],
 rc:[.08,.3],rt:[.07,.1],
 cab:truckCab({roof:[[-.8,1.4],[-.76,1.95],[-.62,2.08],[-.1,2.1],[0,2.08],[.5,1.4]],cw:[[-.8,.9],[0,.94],[.5,.94]],ws:[0,.5],win:[[-.45,.42]],pillarMat:'a',roofMat:'a',h0:.14,h1:.84}),
 sweep:[{z0:-.75,z1:.45,y0:z=>.8,y1:z=>.9,mat:'a',tube:.01,edge:true},{z0:.5,z1:2.9,y0:z=>1.12,y1:z=>1.2,mat:'a',tube:.01,edge:false}],
 seams:[.4,-.5],handles:[[.0,1.1]],
 grille:{style:'egg',x:.56,y0:.8,y1:1.3,bars:6},head:[{x:.86,y:1.26,r:.12}],
 bumpF:{y:.7,h:.18,t:.1,out:.09,wrap:.3,guards:[],plate:true},
 wheel:{kind:'steel',ww:0,rim:[.78,.78,.76]},wheelRear:{kind:'steel',ww:0,rim:[.78,.78,.76]},
 mirror:{y:1.8,z:.4,big:true},ornament:{type:'bird',z:2.7},
 extras:T=>{const{M,G,MB,MA}=T;
  chassis(M,{z0:-4.5,z1:2.8,axles:[-3.35,-2.05,2.0],tx:.92,r:.5,rail:.5,y0:.66,y1:.82,flaps:.7,flapTop:1.0,tankZ:-1.0});
  for(const sd of[-1,1])crown(M,G,MB,sd,.9,.24,.5,2.8,.12);
  // chrome air stacks behind the cab
  for(const sd of[-1,1]){M.color(C.chrome);M.save().move(sd*.78,.9,-.98);M.cyl('chrome',.055,1.85,12);M.save().move(0,1.85,0);M.cyl('chrome',.075,.06,12);M.restore();M.restore();
   M.color(C.chromeD);for(const y of[1.2,1.8])M.boxB('steel',sd*.78-.07,sd*.78+.07,y,y+.04,-.86,-.99)}
  // fifth-wheel plate on a deck, air tanks, catwalk
  M.color([.12,.12,.13]);M.boxB('steel',-.55,.55,1.02,1.1,-3.9,-2.3,{bevel:.02});
  M.color([.22,.22,.24]);M.save().move(0,1.1,-3.0);M.cyl('steel',.5,.05,18);M.restore();
  M.color([.05,.05,.05]);M.boxB('dark',-.12,.12,1.1,1.14,-3.6,-3.0);
  M.color([.3,.3,.32]);for(const sd of[-1,1]){M.save().move(sd*.62,.78,-1.6).rotX(PI/2);M.cyl('steel',.14,.8,10);M.restore()}
  M.color([.7,.7,.7]);for(const sd of[-1,1])M.boxB('steel',sd*.92-.14,sd*.92+.14,.82,.85,-1.0,.0,{bevel:.01});
  // rear lamps bar and bumper
  M.color(C.chrome);M.sweep('chrome',rrShape(.16,.08,.03,3),[[-.95,.8,-4.55],[-.5,.8,-4.6],[.5,.8,-4.6],[.95,.8,-4.55]],{});
  for(const sd of[-1,1]){M.color(C.red);M.boxB('plastic',sd*.85-.07,sd*.85+.07,1.1,1.3,-4.52,-4.48)}
  // big chrome horns on the cab roof
  M.color(C.chrome);for(const sd of[-1,1]){M.save().move(sd*.3,2.1,-.4).rotX(PI/2);M.cyl('chrome',.03,.34,8,{r1:.07});M.restore()}
 }
});

/* ---- BOX TRUCK (delivery): cab-over-bonnet cab with a tall cargo box and a roll-up door ---- */
CARS.boxtruck=Object.assign({},CARS.pickup,{
 ax:[-3.0,1.6],wax:[-3.0,1.6],dual:true,zf:2.6,
 cab:truckCab({pillarMat:'b',roofMat:'b'}),sweep:[],
 decals:T=>[],
 extras:T=>{const{M,G,MB,MA}=T;
  chassis(M,{z0:-5.0,z1:2.3,axles:[-3.0,1.6],tx:.8,r:.4,rail:.45,y0:.5,y1:.62,flaps:.6,flapTop:.8,tankZ:-1.0});
  for(const sd of[-1,1])crown(M,G,MB,sd,.82,.2,.5,2.3,.14);
  const z0=-.9,z1=-5.0,fy=.82,top=3.1,bx=1.1;
  M.color(C.wood);M.boxB('wood',-bx,bx,fy-.06,fy,z1,z0);
  M.color([1,1,1]);M.boxB(MA,-bx,bx,fy,top,z1,z0,{bevel:.05});
  M.color(C.chrome);for(const sd of[-1,1]){M.boxB('chrome',sd*bx-.01,sd*bx+.02,fy+.7,fy+.74,z1,z0);M.boxB('chrome',sd*bx-.01,sd*bx+.02,top-.14,top-.1,z1,z0)}
  M.color([.55,.55,.55]);for(let y=fy+.2;y<top-.3;y+=.12)M.boxB('steel',-.9,.9,y,y+.03,z1-.02,z1);
  M.color(C.chrome);M.boxB('chrome',-.12,.12,1.2,1.3,z1-.04,z1-.02,{bevel:.008});
  for(const sd of[-1,1]){M.color(C.red);M.boxB('plastic',sd*.9-.07,sd*.9+.07,1.0,1.25,z1-.05,z1-.03)}
  M.color(C.chrome);M.sweep('chrome',rrShape(.16,.08,.03,3),[[-1.0,.58,z1-.1],[-.5,.58,z1-.14],[.5,.58,z1-.14],[1.0,.58,z1-.1]],{});
  M.color(C.glass);M.boxB('dark',-.3,.3,2.6,2.8,-.9,-.88)
 }
});
CARS.boxtruck.decals=T=>[];

/* ================================================================ VANS & BUSES: forward-control one-box bodies ================================================================ */
const winSeq=(z0,z1,w,gap)=>{const a=[];for(let z=z0;z-w>=z1-1e-6;z-=w+gap)a.push([z-w,z]);return a};  // windows from front (z0) to rear (z1), each w long
const corrug=(M,G,mat,col,z0,z1,y0,y1,step)=>{for(const sd of[-1,1]){M.color(col);for(let z=z0;z<z1;z+=step)sideSkin(M,G,mat,sd,z,z+step*.45,()=>y0,()=>y1,.012,1,2)}};

/* ---- VAN: corrugated-panel delivery van with a snout nose (Type-H spirit): sliding door, barn doors, roof sign space ---- */
CARS.van={
 zr:-2.5,zf:2.55,w:.95,r:.34,tw:.19,tx:.8,ax:[-1.5,1.55],ra:.4,yb:.34,yf:.36,yr:.38,ym:.78,n:5,
 top:[[-2.5,1.08],[-2.3,1.1],[0,1.08],[1.0,1.06],[1.6,1.0],[2.1,.94],[2.55,.86]],
 rc:[.1,.4],rt:[.07,.12],rb:[.08,.08],
 cab:{roof:[[-2.42,1.1],[-2.4,2.0],[-2.3,2.12],[.9,2.14],[1.12,2.1],[1.62,1.0]],cw:[[-2.42,.88],[0,.9],[1.62,.9]],n:4.4,
  ws:[1.12,1.62],win:[[.28,1.0]],h0:.46,h1:.9,pil:.36,pilR:.2,pillarMat:'b',roofMat:'b',frame:.03,capRear:'b',single:true,lining:[.35,.32,.28]},
 sweep:[{z0:-2.4,z1:1.55,y0:z=>.52,y1:z=>.6,mat:'a',tube:.007,edge:false}],
 rocker:false,seams:[.22,1.06,-.8],seamTop:z=>1.82,handles:[[.0,1.0],[-.6,1.0]],
 grille:{style:'oval',x:.45,y0:.5,y1:.86,bars:6},
 head:[{x:.7,y:.78,r:.1}],
 bumpF:{y:.45,h:.14,t:.08,out:.09,wrap:.3,guards:[],plate:true},bumpR:{y:.5,h:.14,t:.07,out:.07,wrap:.3},
 tail:[{x:.8,y:.98,w:.08,h:.2}],
 mirror:{y:1.55,z:1.2,big:true},
 wheel:{kind:'disc',ww:.07,rim:[.8,.8,.78],hubCol:[.7,.1,.1]},
 extras:T=>{const{M,G,MB,MA}=T;
  corrug(M,G,MB,[1,1,1],-2.35,.2,.38,1.78,.14);
  M.color(C.chrome);for(const sd of[-1,1]){M.tube('chrome',.01,flankPath(G,sd,[[-2.4,.62],[1.55,.62]],.016),4)}
  // snout details: chevron badge, hood strip, split barn doors + handles
  M.color(C.chrome);M.tube('chrome',.012,[[-.12,.7,2.55],[0,.76,2.57],[.12,.7,2.55]],4);
  M.color([.04,.04,.04]);M.boxB('dark',-.004,.004,.55,1.95,-2.43,-2.42);
  M.color(C.chrome);for(const sd of[-1,1])M.boxB('chrome',sd*.1-.015,sd*.1+.015,1.0,1.16,-2.43,-2.46,{bevel:.006});
  rearWindow(M,-2.43,.6,1.55,1.75,T.o.dust);M.color([.1,.1,.1]);M.boxB('dark',-.62,.62,1.55,1.75,-2.434,-2.43);
  // sliding door rail + roof gutter
  M.color(C.chrome);for(const sd of[-1,1])M.tube('chrome',.008,flankPath(G,sd,[[1.06,.78],[-.8,.78]],.018),4);
 }
};

/* ---- MINIVAN: forward-control people carrier with big glass, sliding door and a vee'd nose (Greenbrier spirit) ---- */
CARS.minivan={
 zr:-2.2,zf:2.2,w:.88,r:.33,tw:.18,tx:.76,ax:[-1.3,1.28],ra:.39,yb:.33,yf:.35,yr:.36,ym:.72,n:4.6,
 top:[[-2.2,1.0],[-2.0,1.02],[0,1.0],[1.4,.98],[2.2,.88]],
 rc:[.18,.28],rt:[.08,.12],rb:[.08,.08],
 cab:{roof:[[-2.12,1.02],[-2.08,1.64],[-1.95,1.78],[1.5,1.8],[1.7,1.74],[2.02,.98]],cw:[[-2.12,.8],[0,.82],[2.02,.82]],n:3.6,
  ws:[1.68,2.02],win:[[1.0,1.62],[-.15,.85],[-1.0,-.3],[-1.85,-1.12]],h0:.2,h1:.86,pil:.26,pilR:.2,pillarMat:'a',roofMat:'a',frame:.026,capRear:'b'},
 sweep:[{z0:-2.1,z1:2.1,y0:z=>.5,y1:z=>.74,mat:'a',tube:.008}],
 rocker:true,seams:[1.65,.9,-1.05],handles:[[1.2,.95],[.0,.95]],seamTop:z=>1.55,
 grille:{style:'oval',x:.42,y0:.52,y1:.84,bars:5},
 head:[{x:.62,y:.74,r:.095}],
 bumpF:{y:.42,h:.13,t:.07,out:.08,wrap:.3,guards:[],plate:true},bumpR:{y:.46,h:.13,t:.07,out:.06,wrap:.3},
 tail:[{x:.72,y:.92,w:.07,h:.18}],
 mirror:{y:1.3,z:1.7},
 wheel:{kind:'cap',ww:.09},
 extras:T=>{const{M,G,MB,MA}=T;
  M.color(C.chrome);M.boxB('chrome',-.04,.04,.7,.82,2.21,2.24,{bevel:.01});
  for(const sd of[-1,1])M.tube('chrome',.01,flankPath(G,sd,[[-2.1,.75],[2.1,.75]],.016),4);
  roofRack(M,.5,1.84,-1.8,.6,{h:.04});suitcase(M,0,1.84,-1.0,.7,.24,.4,[.4,.26,.16],.05);
  rearWindow(M,-2.13,.52,1.2,1.5,T.o.dust);
  M.color([.04,.04,.04]);M.boxB('dark',-.004,.004,.55,1.62,-2.14,-2.13);
  // roof vent hat
  M.color(C.chrome);M.save().move(.0,1.8,.6);M.lathe('chrome',[[0,0],[.12,0],[.1,.03],[0,.05]],10);M.restore()}
};

/* ---- MINIBUS: long 15-seater with a row of windows, roof rack and ladder ---- */
CARS.minibus={
 zr:-3.0,zf:2.75,w:.95,r:.36,tw:.2,tx:.8,ax:[-1.85,1.7],ra:.42,yb:.34,yf:.36,yr:.38,ym:.78,n:4.6,
 top:[[-3.0,1.02],[-2.8,1.04],[0,1.02],[1.6,1.0],[2.35,.96],[2.75,.88]],
 rc:[.18,.3],rt:[.08,.12],rb:[.08,.08],
 cab:{roof:[[-2.92,1.04],[-2.88,1.78],[-2.74,1.92],[1.6,1.94],[1.85,1.88],[2.2,1.0]],cw:[[-2.92,.86],[0,.9],[2.2,.9]],n:3.8,
  ws:[1.85,2.2],win:winSeq(1.7,-2.7,.68,.1).concat([]),h0:.2,h1:.86,pil:.26,pilR:.2,pillarMat:'a',roofMat:'a',frame:.024,capRear:'b'},
 sweep:[{z0:-2.9,z1:2.6,y0:z=>.52,y1:z=>.78,mat:'a',tube:.008}],
 rocker:true,seams:[1.74,.9],handles:[[1.3,1.0]],seamTop:z=>1.6,
 grille:{style:'egg',x:.46,y0:.5,y1:.9,bars:5},
 head:[{x:.7,y:.8,r:.1}],
 bumpF:{y:.44,h:.14,t:.08,out:.09,wrap:.3,guards:[-.3,.3],gs:.8,plate:true},bumpR:{y:.48,h:.14,t:.07,out:.07,wrap:.3},
 tail:[{x:.8,y:.96,w:.07,h:.2}],
 mirror:{y:1.35,z:1.8,big:true},
 wheel:{kind:'cap',ww:.1},
 extras:T=>{const{M,G,MB,MA}=T;
  for(const sd of[-1,1])M.tube('chrome',.01,flankPath(G,sd,[[-2.9,.8],[2.6,.8]],.016),4);
  roofRack(M,.64,1.98,-2.6,1.2,{h:.05});suitcase(M,-.2,1.98,-1.6,.8,.3,.5,[.4,.26,.16],.05);suitcase(M,.25,1.98,-.5,.7,.26,.4,[.2,.28,.4],-.08);
  // rear ladder + window + sign board
  M.color(C.chrome);for(const sd of[-1,1])M.tube('chrome',.012,[[sd*.2,.5,-3.02],[sd*.2,1.9,-3.02]],4);for(let y=.6;y<1.9;y+=.25)M.tube('chrome',.009,[[-.2,y,-3.02],[.2,y,-3.02]],4);
  rearWindow(M,-3.04,.5,1.2,1.5,T.o.dust);
  M.color([.95,.9,.65]);M.boxB('plastic',-.5,.5,1.5,1.7,1.84,1.9,{bevel:.012})}
};

/* ---- CAMPERVAN: pop-top camper with an awning, roof rack with a bike, spare, jerrycan and a folding table ---- */
CARS.camper=Object.assign({},CARS.minivan,{
 cab:Object.assign({},CARS.minivan.cab,{win:[[1.0,1.62],[-.1,.85]],roofMat:'a'}),
 sweep:[{z0:-2.1,z1:2.1,y0:z=>.5,y1:z=>.74,mat:'a',tube:.008}],
 extras:T=>{const{M,G,MB,MA}=T;
  M.color(C.chrome);M.boxB('chrome',-.04,.04,.7,.82,2.21,2.24,{bevel:.01});
  for(const sd of[-1,1])M.tube('chrome',.01,flankPath(G,sd,[[-2.1,.75],[2.1,.75]],.016),4);
  // pop-top: raised roof panel on canvas bellows with little windows
  const yb=1.8,yt=2.1;
  M.color(C.canvas);M.boxB('canvas',-.7,.7,yb,yt-.02,-1.7,.9,{bevel:.03});
  M.color([1,1,1]);M.boxB(MA,-.72,.72,yt-.04,yt+.06,-1.74,.94,{bevel:.04});
  M.color(C.glass);for(const sd of[-1,1])M.boxB('retroglass',sd*.7-.004,sd*.7+.004,yb+.08,yt-.1,-1.3,-.6);
  M.color(C.chrome);M.tube('chrome',.008,[[-.72,yt+.06,.0],[.72,yt+.06,.0]],4);
  // side awning with candy stripes and two poles
  for(let i=0;i<8;i++){M.color(i%2?[.95,.93,.85]:(MB==='dustpaint'?[.5,.3,.2]:[.78,.2,.15]));
   const z0=-.9+i*.2;M.save().move(0,0,0);
   const p=(x,y,z)=>[x,y,z];M.surf('canvas',3,1,(u,v)=>p(lerp(.9,2.25,u),lerp(1.8,1.35,u),lerp(z0,z0+.2,v)),{flipN:true});
   M.surf('canvas',3,1,(u,v)=>p(lerp(.9,2.25,u),lerp(1.8,1.35,u)-.01,lerp(z0,z0+.2,v)),{flipN:false});M.restore()}
  M.color(C.chrome);for(const z of[-.9,.7])M.tube('chrome',.012,[[2.2,1.38,z],[2.2,0,z]],5);
  // camp table + chairs under the awning
  M.color([.9,.9,.85]);M.boxB('plastic',1.45,2.05,.5,.54,-.4,.2,{bevel:.01});for(const [x,z] of[[1.5,-.35],[2.0,-.35],[1.5,.15],[2.0,.15]]){M.color(C.chromeD);M.tube('chrome',.01,[[x,.0,z],[x,.5,z]],4)}
  M.color([.2,.4,.65]);for(const z of[-.8,.6]){M.boxB('canvas',1.5,1.95,.28,.32,z-.2,z+.2);M.boxB('canvas',1.5,1.55,.3,.62,z-.2,z+.2)}
  // roof rack with bicycle
  roofRack(M,.64,2.2,-1.75,.9,{h:.05});
  bicycle(M,-.3,2.25,-1.55,-.65,{col:[.2,.4,.6]});
  // spare on the nose, jerrycan on the rear, ladder
  spareRear(T,0,.9,.3,.17,{ww:true});
  M.color([.45,.5,.3]);M.boxB('steel',.6,.82,.52,.84,-2.2,-2.1,{bevel:.02});
  rearWindow(M,-2.13,.5,1.28,1.52,T.o.dust);
  M.color([.04,.04,.04]);M.boxB('dark',-.004,.004,.55,1.62,-2.14,-2.13)}
});
CARS.camper.cab.win=[[1.0,1.62],[-.1,.85],[-1.0,-.3]];

/* ---- BUS: 1950s city transit coach with rounded ends, destination board, chrome and a rear engine grille ---- */
CARS.bus={
 zr:-5.0,zf:5.0,w:1.28,r:.5,tw:.26,tx:1.0,txR:.98,twR:.26,ax:[-3.3,3.0],wax:[-3.3,3.0],ra:.58,dual:true,yb:.5,yf:.52,yr:.52,ym:1.2,n:5,
 top:[[-5.0,1.2],[-4.8,1.26],[0,1.26],[4.4,1.26],[5.0,1.18]],
 rc:[.5,.6],rt:[.25,.3],rb:[.1,.1],
 cab:{roof:[[-4.85,1.26],[-4.7,2.3],[-4.3,2.9],[-3.4,3.12],[3.4,3.12],[4.2,2.95],[4.6,2.6],[4.88,1.26]],cw:[[-4.85,1.1],[-3,1.2],[3,1.2],[4.88,1.1]],n:3.6,
  ws:[4.3,4.88],bl:[-4.85,-4.55],win:winSeq(4.1,-4.3,.92,.14),h0:.3,h1:.82,pil:.3,pilR:.4,pillarMat:'a',roofMat:'a',frame:.03,lining:[.55,.5,.4]},
 sweep:[{z0:-4.9,z1:4.9,y0:z=>.56,y1:z=>.8,mat:'a',tube:.01}],
 rocker:false,seams:[3.95,.2],seamTop:z=>2.2,handles:[],
 grille:{style:'oval',x:.7,y0:.58,y1:1.0,bars:5},
 head:[{x:.9,y:.9,r:.14}],
 bumpF:{y:.5,h:.18,t:.1,out:.1,wrap:.3,guards:[-.5,.5],gs:1.1,plate:true},bumpR:{y:.55,h:.18,t:.1,out:.08,wrap:.3},
 tail:[{x:1.0,y:1.0,w:.1,h:.3},{x:.85,y:1.4,w:.1,h:.1}],
 mirror:{y:2.2,z:4.3,big:true},
 wheel:{kind:'steel',ww:.1,rim:[.85,.85,.82]},wheelRear:{kind:'steel',ww:.1,rim:[.85,.85,.82]},
 extras:T=>{const{M,G,MB,MA}=T;
  chassis(M,{z0:-4.8,z1:4.7,axles:[-3.3,3.0],tx:1.0,r:.5,rail:.6,y0:.46,y1:.5,tank:false,exhaust:false});
  // doors: folding glass doors in front and a centre exit, dark outlines
  for(const sd of[-1,1]){for(const [z0,z1] of[[3.6,4.35],[-.6,.35]]){
    M.color(C.glass);sideSkin(M,G,'retroglass',sd,z0+.04,z1-.04,s=>1.0,s=>2.55,.012,4,4);
    M.color(C.chrome);M.cls=1;for(const z of[z0,z1,(z0+z1)/2])M.tube('chrome',.012,flankPath(G,sd,[[z,.8],[z,2.65]],.016),4);M.tube('chrome',.012,flankPath(G,sd,[[z0,2.6],[z1,2.6]],.016),4);M.cls=0}
   M.color(C.chrome);M.tube('chrome',.012,flankPath(G,sd,[[-4.9,1.3],[4.9,1.3]],.016),4);M.tube('chrome',.012,flankPath(G,sd,[[-4.9,2.28],[4.9,2.28]],.016),4)}
  // destination board, roof vents, rear engine louvres, headlight visor
  M.color([.04,.04,.04]);M.boxB('dark',-.52,.52,2.5,2.72,4.2,4.3,{bevel:.01});M.color([.98,.9,.55]);M.boxB('plastic',-.48,.48,2.53,2.69,4.3,4.305);
  M.color(C.chrome);for(const z of[-1.6,1.6])M.boxB('chrome',-.3,.3,3.1,3.17,z-.3,z+.3,{bevel:.025});
  M.color([.05,.05,.05]);for(let y=.9;y<1.5;y+=.08)M.boxB('dark',-.55,.55,y,y+.035,-5.05,-5.03);
  M.color(C.chrome);M.boxB('chrome',-.58,.58,.86,.9,-5.06,-5.03);M.boxB('chrome',-.58,.58,1.5,1.54,-5.06,-5.03);
  // roof ventilators already above; headlamp visors
  M.color(C.chrome);for(const sd of[-1,1])M.boxB('chrome',sd*.9-.1,sd*.9+.1,1.0,1.03,4.93,5.02,{bevel:.01})}
};

/* ---- SCHOOL BUS: yellow conventional-nose bus: stop arm, wig-wag lights, black rub rails ---- */
CARS.schoolbus={
 zr:-4.2,zf:4.4,w:1.05,r:.46,tw:.24,tx:.92,txR:.9,twR:.24,ax:[-2.7,3.3],wax:[-2.7,3.3],ra:.54,dual:true,yb:.5,yf:.52,yr:.52,ym:1.05,n:5,
 top:[[-4.2,1.15],[-4.0,1.2],[0,1.2],[2.5,1.2],[2.9,1.22],[3.3,1.3],[4.4,1.28]],
 rc:[.1,.34],rt:[.14,.1],rb:[.1,.1],
 cab:{roof:[[-4.1,1.2],[-4.06,2.25],[-3.9,2.45],[2.6,2.46],[2.78,2.4],[3.0,1.3]],cw:[[-4.1,1.0],[0,1.02],[3.0,1.0]],n:4.6,
  ws:[2.7,3.0],bl:null,win:winSeq(2.55,-3.9,.78,.12),h0:.3,h1:.86,pil:.34,pilR:.2,pillarMat:'a',roofMat:'b',frame:.026,capRear:'b'},
 sweep:[{z0:-4.1,z1:2.9,y0:z=>.8,y1:z=>.9,mat:'a',tube:.005,edge:false},{z0:-4.1,z1:2.9,y0:z=>1.2,y1:z=>1.28,mat:'a',tube:.005,edge:false},{z0:2.9,z1:4.3,y0:z=>.64,y1:z=>.72,mat:'a',tube:.005,edge:false}],
 rocker:false,seams:[2.2],seamTop:z=>2.1,handles:[],
 grille:{style:'egg',x:.5,y0:.7,y1:1.2,bars:5},
 head:[{x:.82,y:1.12,r:.12}],
 bumpF:{y:.58,h:.18,t:.1,out:.09,wrap:.3,guards:[],plate:true,col:[.06,.06,.06]},bumpR:{y:.6,h:.18,t:.1,out:.07,wrap:.3,col:[.06,.06,.06]},
 tail:[{x:.9,y:1.4,w:.1,h:.2}],
 mirror:{y:1.9,z:2.9,big:true},
 wheel:{kind:'steel',ww:0,rim:[.18,.18,.2]},wheelRear:{kind:'steel',ww:0,rim:[.18,.18,.2]},
 extras:T=>{const{M,G,MB,MA}=T;
  chassis(M,{z0:-4.1,z1:3.9,axles:[-2.7,3.3],tx:.92,r:.46,rail:.5,y0:.46,y1:.54,tank:false,flaps:.55,flapTop:.56});
  for(const sd of[-1,1])crown(M,G,MB,sd,.9,.22,2.7,4.3,.12);
  // folding passenger door (front right = -x seen from front? door on the right side facing forward = -x)
  const sd=-1;M.color(C.glass);sideSkin(M,G,'retroglass',sd,2.1,2.85,s=>.75,s=>2.15,.012,4,4);M.color([.1,.1,.1]);M.cls=1;for(const z of[2.1,2.85,2.475])M.tube('dark',.012,flankPath(G,sd,[[z,.65],[z,2.2]],.016),4);M.cls=0;
  // roof lights (red pair + amber pair), stop sign arm, mirror arm
  for(const [z,y,zr] of[[2.6,2.47,1],[-4.0,2.47,-1]]){for(const sx of[-1,1]){M.color(C.red);M.save().move(sx*.55,y,z);M.cyl('plastic',.1,.06,12);M.restore();M.color([.98,.7,.1]);M.save().move(sx*.78,y,z);M.cyl('plastic',.08,.05,12);M.restore()}}
  M.color([.85,.1,.08]);M.save().move(-1.06,1.7,2.0).rotY(PI/2).rotZ(0);M.cyl('plastic',.2,.012,8,{caps:'bt'});M.restore();
  M.color(C.chromeD);M.boxB('steel',-1.07,-1.05,1.6,1.7,1.95,2.05);
  M.color([.94,.72,.08]);M.boxB('paint',-.7,.7,2.14,2.44,2.78,2.86,{bevel:.015});M.boxB('paint',-.7,.7,2.14,2.44,-4.2,-4.12,{bevel:.015});
  // rear emergency door seams and bumper step
  M.color([.04,.04,.04]);M.boxB('dark',-.004,.004,.6,2.2,-4.12,-4.11);M.boxB('dark',-.45,.45,.6,.62,-4.12,-4.11);
  rearWindow(M,-4.13,.38,1.5,2.0,T.o.dust);
  // long hood chrome side vents + big rounded fender lamps
  for(const sd of[-1,1]){M.color(C.chrome);for(let i=0;i<4;i++)M.boxB('chrome',sd*.99-.01,sd*.99+.01,1.0+i*.05,1.03+i*.05,3.4,4.0)}
 }
};

/* ---- MINI TRUCK: kei-class cab-over flatbed with stake sides ---- */
CARS.minitruck={
 zr:-.15,zf:1.5,w:.7,r:.27,tw:.14,tx:.6,txR:.6,ax:[-1.2,.95],ra:.32,yb:.3,yf:.32,yr:.3,ym:.62,n:4.2,
 top:[[-.15,.8],[-.05,.84],[.8,.84],[1.2,.8],[1.5,.7]],
 rc:[.06,.22],rt:[.06,.12],rb:[.08,.08],
 cab:{roof:[[-.08,.84],[-.05,1.3],[.05,1.4],[.6,1.42],[.78,1.38],[1.38,.8]],cw:[[-.08,.62],[.4,.64],[1.38,.62]],n:3.6,
  ws:[.78,1.38],win:[[.1,.7]],h0:.12,h1:.84,pil:.3,pilR:.2,pillarMat:'a',roofMat:'a',frame:.022,capRear:'b',single:true},
 sweep:[{z0:0,z1:1.4,y0:z=>.42,y1:z=>.5,mat:'a',tube:.006,edge:false}],
 rocker:false,seams:[.72],handles:[[.5,.7]],
 grille:{style:'oval',x:.3,y0:.42,y1:.66,bars:3},
 head:[{x:.5,y:.62,r:.07}],
 bumpF:{y:.34,h:.08,t:.045,out:.06,wrap:.22,guards:[],plate:false},
 tail:[],exhaust:false,
 mirror:{y:1.0,z:1.35},
 wheel:{kind:'disc',ww:.05},
 extras:T=>{const{M,G,MB,MA}=T;
  chassis(M,{z0:-2.3,z1:1.3,axles:[-1.2,.95],tx:.6,r:.27,rail:.32,y0:.32,y1:.4,flaps:.3,flapTop:.56,tank:false});
  // flatbed deck with stake sides, tail gate
  const z0=-.2,z1=-2.3,fy=.58,top=.98,bx=.68;
  M.color(C.wood);M.boxB('wood',-bx,bx,fy-.05,fy,z1,z0);
  M.color([1,1,1]);for(const sd of[-1,1]){M.boxB(MA,sd*bx-.025,sd*bx+.025,fy,fy+.3,z1,z0,{bevel:.01});M.color(C.wood);for(let z=z1+.06;z<=z0-.05;z+=.45)M.boxB('wood',sd*bx-.04,sd*bx+.04,fy,top,z,z+.06,{bevel:.006});M.color([1,1,1])}
  M.boxB(MA,-bx,bx,fy,fy+.3,z1-.02,z1+.02,{bevel:.01});M.boxB(MA,-bx,bx,fy,top-.1,z0-.04,z0,{bevel:.01});
  M.color(C.red);for(const sd of[-1,1])M.boxB('plastic',sd*.55-.04,sd*.55+.04,.62,.72,z1-.04,z1-.02);
  // a stack of crates on the load deck
  M.color(C.wood);for(const [x,z,y] of[[-.3,-1.0,0],[.3,-1.0,0],[0,-1.0,.26]]){M.boxB('wood',x-.25,x+.25,fy+y,fy+y+.24,z-.25,z+.25,{bevel:.012})}
 }
};

/* ================================================================ SPECIALS: jeep, army truck, fire engine ================================================================ */
/* ---- JEEP: slab-sided 1950s utility with a folding windscreen, slotted grille, spare, jerrycan and shovel ---- */
const E_ZE=(T,x,y)=>T.E.zEnd(x,y,-1);
CARS.jeep={
 zr:-1.58,zf:1.68,w:.78,r:.38,tw:.2,tx:.66,txR:.66,ax:[-1.0,1.06],ra:.46,yb:.42,yf:.44,yr:.42,ym:.8,n:6.5,
 top:[[-1.58,.9],[-1.45,.93],[-.62,.93],[-.5,.62],[-.42,.5],[.25,.5],[.4,.7],[.55,.98],[1.0,1.0],[1.68,.96]],
 tub:{z0:-.5,z1:.42,floor:.5,top:.9},
 rc:[.08,.14],rt:[.05,.06],rb:[.1,.1],
 cab:{roof:[[.5,1.62],[.62,1.0]],cw:[[.5,.7],[.62,.72]],n:9,ws:[.5,.62],pil:.2,chromePillar:true,frame:.04,chromeC:[.5,.5,.48],
  intZ:[.42,-.5],floor:.5,intBelt:.92,bucket:true,rearDeck:.93,single:true},
 rocker:false,seams:[],handles:[],
 grille:{style:'slot',x:.36,y0:.66,y1:1.0,n:7,col:[.1,.1,.1]},
 head:[{x:.52,y:.98,r:.09,bezel:[.2,.2,.2]}],
 bumpF:{y:.52,h:.1,t:.06,out:.05,wrap:.12,guards:[],plate:false,col:[.45,.45,.44]},bumpR:{y:.52,h:.1,t:.06,out:.05,wrap:.12,col:[.45,.45,.44],plate:false},
 tail:[{x:.64,y:.8,w:.07,h:.07}],exhaust:false,
 mirror:{y:1.22,z:.55,single:true},
 wheel:{kind:'steel',ww:0,rim:[.28,.3,.2],tread:14},
 extras:T=>{const{M,G,MB,MA}=T;
  // flat fenders over the wheels, hood tie-downs, windscreen hinges
  for(const sd of[-1,1]){crown(M,G,MB,sd,.66,.18,.75,1.62,.05,{n:4});crown(M,G,MB,sd,.66,.18,-1.5,-.5,.03,{n:4});
   M.color([.1,.1,.1]);M.boxB('dark',sd*.58-.03,sd*.58+.03,1.0,1.05,.7,1.1);}
  // spare on the tail, jerrycan on a bracket, shovel on the flank
  spareRear(T,.28,.8,.38,.2,{rim:[.28,.3,.2]});
  M.color([.33,.37,.2]);M.boxB('steel',-.58,-.32,.58,.98,E_ZE(T,-.45,.78)-.12,E_ZE(T,-.45,.78)+.012,{bevel:.015});
  // rear bench on the deck
  M.color([.62,.16,.12]);M.boxB('vinyl',-.58,.58,.93,1.05,-1.35,-.82,{bevel:.04});M.save().move(0,1.03,-1.35).rotX(-.14);M.boxB('vinyl',-.58,.58,0,.3,-.06,.06,{bevel:.04});M.restore();
  M.color([.4,.3,.2]);M.tube('wood',.016,[[.72,.95,-.3],[.74,.9,-1.2]],4);M.color(C.chromeD);M.boxB('steel',.7,.78,.9,.99,-1.25,-1.15);
  // seats are open bucket pans; add a windscreen wiper pair + folded canvas bows
  M.color([.1,.1,.1]);for(const sx of[-.3,.3])M.tube('rubber',.007,[[sx,1.05,.58],[sx+.2,1.35,.52]],3);
  M.color(C.canvas);M.boxB('canvas',-.6,.6,.98,1.14,-1.45,-1.05,{bevel:.04});
  // towing pintle and tow hooks
  M.color(C.chromeD);M.boxB('steel',-.05,.05,.48,.58,-1.75,-1.6)
 }
};

/* ---- ARMY TRUCK: 6x6 two-and-a-half-tonne cargo truck with slatted sides, bows and canvas tilt ---- */
CARS.army=Object.assign({},CARS.pickup,{
 zr:-.85,zf:2.75,w:.98,r:.5,tw:.3,tx:.92,txR:.9,twR:.28,ax:[-3.3,1.9],wax:[-3.65,-2.35,1.9],ra:.58,dual:true,yb:.66,yf:.66,yr:.66,ym:1.1,n:5.5,
 top:[[-.85,1.38],[-.75,1.4],[.3,1.38],[.7,1.36],[1.2,1.34],[2.0,1.32],[2.75,1.18]],
 rc:[.08,.14],rt:[.07,.08],
 cab:truckCab({roof:[[-.8,1.36],[-.76,1.98],[-.64,2.06],[-.05,2.08],[.06,2.06],[.62,1.36]],cw:[[-.8,.88],[0,.92],[.62,.92]],ws:[.06,.62],win:[[-.4,.5]],pillarMat:'b',roofMat:'b',h0:.14,h1:.84}),
 sweep:[],
 grille:{style:'slot',x:.5,y0:.74,y1:1.28,n:9,col:[.08,.08,.06]},head:[{x:.78,y:1.2,r:.1,bezel:[.2,.22,.14]}],
 bumpF:{y:.68,h:.2,t:.1,out:.1,wrap:.22,guards:[],plate:false,col:[.25,.27,.2]},
 wheel:{kind:'steel',ww:0,rim:[.28,.3,.2],tread:16},wheelRear:{kind:'steel',ww:0,rim:[.28,.3,.2],tread:16},
 mirror:{y:1.75,z:.5,big:true},ornament:null,
 extras:T=>{const{M,G,MB,MA}=T;
  chassis(M,{z0:-5.1,z1:2.5,axles:[-3.65,-2.35,1.9],tx:.9,r:.5,rail:.5,y0:.66,y1:.82,flaps:.7,flapTop:1.0,tankZ:-1.1});
  for(const sd of[-1,1])crown(M,G,MB,sd,.9,.22,.5,2.6,.1,{n:4});
  // winch drum on the nose bumper + tow hooks + blackout lamps
  M.color([.2,.2,.18]);M.save().move(0,.62,2.95).rotZ(PI/2);M.cyl('steel',.09,.7,10);M.restore();M.color(C.chromeD);for(const sd of[-1,1])M.tube('steel',.02,[[sd*.45,.55,2.88],[sd*.5,.5,2.98]],4);
  // cargo body: slat sides, headboard with spare, bows and canvas tilt
  const z0=-.95,z1=-5.0,fy=1.0,top=1.62,bx=.98;
  M.color([.33,.28,.2]);M.boxB('wood',-bx,bx,fy-.08,fy,z1,z0);
  M.color([1,1,1]);
  for(const sd of[-1,1]){M.boxB(MB,sd*bx-.04,sd*bx+.04,fy,top,z1,z0,{bevel:.015});M.color([.1,.1,.08]);for(let z=z1+.3;z<z0-.1;z+=.4)M.boxB('dark',sd*bx-.048,sd*bx+.048,fy+.04,top-.04,z,z+.04);M.color([1,1,1])}
  M.boxB(MB,-bx,bx,fy,top+.15,z0-.06,z0,{bevel:.015});
  M.boxB(MB,-bx,bx,fy,top,z1-.06,z1+.02,{bevel:.015});
  M.color(C.red);for(const sd of[-1,1])M.boxB('plastic',sd*.8-.06,sd*.8+.06,1.1,1.2,z1-.08,z1-.06);
  M.color(C.canvas);M.color([.38,.4,.26]);
  const nb=6;for(let i=0;i<=nb;i++){const z=lerp(z0-.1,z1+.1,i/nb);M.color([.2,.2,.15]);M.tube('steel',.025,Array.from({length:13},(_,k)=>{const a=k/12*PI;return[Math.cos(a)*(bx-.04),top+.02+Math.sin(a)*.62,z]}),5)}
  M.color([.4,.42,.28]);
  for(const fl of[false,true])M.surf('canvas',24,12,(u,v)=>{const a=u*PI,z=lerp(z0-.1,z1+.1,v);return[Math.cos(a)*(bx-.02),top+.04+Math.sin(a)*.62*(1-.06*Math.abs(Math.cos(v*PI*6))),z]},{flipN:fl,uL:3,vL:4});
  M.color([.34,.36,.22]);M.boxB('canvas',-bx+.02,bx-.02,top-.01,top+.1,z1-.1,z1+.02);
  spareAt(M,0,1.32,z1-.06,.46,.3,{rim:[.28,.3,.2]});
  // fuel cans + step
  M.color([.33,.37,.2]);for(const sd of[-1,1])M.boxB('steel',sd*1.03-.04,sd*1.03+.04,.9,1.25,-.2,.05,{bevel:.01});
  M.color([.1,.1,.08]);M.boxB('dark',-.7,.7,.7,.76,-5.12,-5.02)
 }
});

/* ---- FIRETRUCK: open-cab pumper with a hose bed, ladders, bell, siren, pump panel and gold-leaf trim ---- */
CARS.fire={
 zr:-.9,zf:3.0,w:.95,r:.46,tw:.26,tx:.88,txR:.88,twR:.26,ax:[-4.0,1.85],wax:[-4.0,1.85],ra:.54,dual:true,yb:.6,yf:.62,yr:.6,ym:1.0,n:5,
 top:[[-.9,1.28],[-.8,1.3],[-.74,.9],[-.7,.84],[.28,.84],[.45,1.1],[.78,1.28],[1.3,1.28],[2.1,1.25],[2.7,1.2],[3.0,1.1]],
 tub:{z0:-.74,z1:.4,floor:.84,top:1.28},
 rc:[.08,.3],rt:[.07,.12],rb:[.1,.1],
 cab:{roof:[[.3,1.82],[.78,1.28]],cw:[[.3,.84],[.78,.9]],n:6,ws:[.3,.78],pil:.2,chromePillar:true,frame:.045,intZ:[.4,-.74],floor:.84,intBelt:1.2,single:true},
 sweep:[{z0:-.85,z1:.7,y0:z=>.72,y1:z=>.78,mat:'a',tube:.01,edge:true},{z0:.78,z1:2.8,y0:z=>1.12,y1:z=>1.17,mat:'a',tube:.006,edge:false}],
 seams:[.5],handles:[],seamTop:z=>1.2,
 grille:{style:'egg',x:.52,y0:.74,y1:1.2,bars:6},
 head:[{x:.82,y:1.18,r:.12}],
 bumpF:{y:.62,h:.17,t:.09,out:.08,wrap:.28,guards:[],plate:false},
 tail:[],exhaust:false,
 ornament:{type:'bird',z:2.7},mirror:{y:1.85,z:.5,big:true},
 wheel:{kind:'steel',ww:.07,rim:[.92,.9,.82]},wheelRear:{kind:'steel',ww:.07,rim:[.92,.9,.82]},
 extras:T=>{const{M,G,MB,MA}=T;
  chassis(M,{z0:-6.2,z1:2.6,axles:[-4.0,1.85],tx:.88,r:.46,rail:.5,y0:.6,y1:.74,flaps:.7,flapTop:.9,tankZ:-1.2});
  for(const sd of[-1,1])crown(M,G,MB,sd,.88,.22,.5,2.7,.12);
  // chrome-edged running boards + folded canvas hood hint
  M.color(C.chrome);for(const sd of[-1,1])M.boxB('chrome',sd*.98-.1,sd*.98+.1,.5,.53,-.9,.7,{bevel:.01});
  // equipment body: compartments with roller-shutter lines, pump panel, rear step
  const z0=-.98,z1=-6.1,fy=.9,top=2.1,bx=.95;
  M.color([1,1,1]);M.boxB(MB,-bx,bx,fy,top-.5,z1,z0,{bevel:.05});
  for(const sd of[-1,1]){M.boxB(MB,sd*bx-.05,sd*bx+.05,fy,top,z1,-3.0,{bevel:.04});
   M.color(C.chrome);for(let z=-1.2;z>-3.0;z-=.38)M.boxB('chrome',sd*bx-.002,sd*bx+.06,1.0,1.75,z-.32,z,{bevel:.004});
   M.color([.3,.04,.04]);for(let z=-3.3;z>-6.0;z-=.45)M.boxB('dark',sd*bx-.002,sd*bx+.06,1.0,1.7,z-.4,z,{bevel:.004});M.color([1,1,1]);
   M.color(C.chrome);M.boxB('chrome',sd*bx-.005,sd*bx+.07,1.76,1.8,z1,-3.0);M.color([1,1,1])}
  // hose bed: dark canvas hose coils + chrome rail
  M.color([.15,.1,.08]);M.boxB('canvas',-bx+.1,bx-.1,top-.5,top-.2,z1+.1,z0-.4,{bevel:.04});
  M.color([.85,.6,.2]);for(let z=-1.4;z>-5.6;z-=.12)M.tube('canvas',.07,[[-bx+.2,top-.18,z],[bx-.2,top-.18,z]],6);
  M.color(C.chrome);for(const sd of[-1,1])M.tube('chrome',.016,[[sd*(bx-.04),top-.1,z0-.4],[sd*(bx-.04),top+.18,z0-.4],[sd*(bx-.04),top+.18,z1+.1],[sd*(bx-.04),top-.1,z1+.1]],5);
  // ladders: one long pair on the roof and a hook ladder along the side
  ladder(M,-.4,top+.02,z1+.1,z0-.35,.45);ladder(M,.4,top+.02,z1+.1,z0-.35,.45);
  ladder(M,0,top+.12,z1-.5,z0+.5,.5,[.8,.6,.3]);
  // pump panel with gauges, deck gun, siren, bell, beacon
  M.color(C.chrome);M.boxB('chrome',-.7,.7,1.05,1.7,-.99,-.97);M.color([.1,.1,.1]);for(const x of[-.45,-.15,.15,.45]){M.save().move(x,1.5,-1.0);M.cyl('dark',.07,.02,12);M.restore()}
  M.color(C.chrome);for(const x of[-.45,-.15,.15,.45]){M.save().move(x,1.5,-1.02).rotX(PI/2);M.lathe('chrome',[[.075,0],[.075,.02]],10,{sharp:.5});M.restore()}
  M.color(C.chrome);M.save().move(0,top-.5,-1.2);M.cyl('chrome',.06,.35,10);M.restore();M.tube('chrome',.04,[[0,top-.18,-1.2],[0,top-.05,-1.5]],6);
  M.color(C.brass);M.save().move(-.4,1.85,.1);M.lathe('brass',[[.0,.02],[.08,.0],[.12,.07],[.1,.14],[0,.14]],12,{sharp:.6});M.restore();
  M.color(C.chrome);M.save().move(.4,1.86,.15);M.lathe('chrome',[[0,.0],[.1,.0],[.1,.08],[.05,.14],[0,.16]],12);M.restore();
  M.color(C.red);M.save().move(0,1.86,.2);M.lathe('plastic',[[0,0],[.1,0],[.1,.05],[.06,.1],[0,.12]],10);M.restore();
  // rear step board + hose connections, rear lamps
  M.color(C.chrome);M.boxB('chrome',-bx,bx,.7,.76,-6.4,-6.1,{bevel:.012});
  for(const sd of[-1,1]){M.color(C.red);M.boxB('plastic',sd*.8-.07,sd*.8+.07,1.0,1.2,z1-.04,z1-.02)}
 }
};

/* ================================================================ DECALS: lettering and emblems, placed from the real surface ================================================================ */
/* descriptor: {t:'text'|'num'|'star'|'cross', txt, asp, fg, bg, w, h, y, z, side:true (both flanks, x from the surface) | end:'front'|'rear', x?} */
const sd=(t,txt,asp,fg,bg,w,h,y,z,x)=>({t,txt,asp,fg,bg,w,h,y,z,side:true,x});
const en=(end,t,txt,asp,fg,bg,w,h,y,z)=>({t,txt,asp,fg,bg,w,h,y,z,end,x:0});
CARS.taxi.decals=T=>[en('front','text','TAXI',3.2,'#111','#f3e9a8',.5,.125,1.58,-.012),en('rear','text','TAXI',3.2,'#111','#f3e9a8',.5,.125,1.58,-.328),
 sd('text','YELLOW CAB',6,'#1a1a1a',null,.78,.14,.74,-.12)];
CARS.police.decals=T=>[sd('text','POLICE',4.4,'#111',null,1.0,.23,.68,-.52),sd('star','\u2605',1,'#111',null,.2,.2,.84,-.1)];
CARS.ambulance.decals=T=>[sd('cross','+',1,'#c8141a',null,.55,.55,1.35,-1.25),sd('cross','+',1,'#c8141a',null,.55,.55,1.35,-2.78),
 en('rear','text','AMBULANCE',7,'#c8141a','#fafaf5',.8,.12,1.67,-3.03)];
CARS.fire.decals=T=>[sd('text','FIRE DEPT',5.2,'#f0c030',null,2.0,.38,1.95,-4.55),sd('text','No. 12',3,'#f4e6b0',null,.5,.17,1.0,.35),
 en('rear','text','ENGINE 12',6,'#f0c030',null,1.0,.17,1.55,-6.12)];
CARS.schoolbus.decals=T=>[sd('text','SCHOOL BUS',7,'#111',null,1.7,.24,1.05,-1.2),sd('text','SCHOOL BUS',7,'#111',null,1.7,.24,1.05,.6),
 en('front','text','SCHOOL BUS',7,'#111','#f0b818',1.4,.2,2.29,2.862),en('rear','text','SCHOOL BUS',7,'#111','#f0b818',1.4,.2,2.29,-4.2)];
CARS.bus.decals=T=>[en('front','text','DOWNTOWN',7,'#ffcc55','#101010',0.96,.16,2.61,4.31),en('rear','text','No. 9',3,'#ffcc55','#101010',.5,.2,2.15,-4.87),
 sd('text','CITY TRANSIT',7,'#222',null,2.6,.3,1.0,-2.0),sd('text','CITY TRANSIT',7,'#222',null,2.6,.3,1.0,1.9)];
CARS.army.decals=T=>[sd('star','\u2605',1,'#e8e8d0',null,.5,.5,1.1,.05)];
CARS.jeep.decals=T=>[sd('star','\u2605',1,'#e8e8d0',null,.32,.32,.88,.95)];
CARS.tow.decals=T=>[sd('text','TOWING',4.5,'#f6f2e0',null,.8,.18,.84,.02),sd('text','24 HR',3,'#f6f2e0',null,.5,.16,1.03,-1.4,.972)];
CARS.dump.decals=T=>[sd('text','HAULING CO.',6,'#1c1c1c',null,2.0,.34,1.75,-3.05,1.034),sd('text','No. 4',3,'#f6f2e0',null,.45,.15,.95,.0)];
CARS.truck.decals=T=>[sd('text','FREIGHT',4.5,'#f6f2e0',null,.85,.19,1.0,.0)];
CARS.muscle.decals=T=>[sd('num','55',1,'#111','#f4f0e6',.3,.3,.76,-.35),sd('num','55',1,'#111','#f4f0e6',.3,.3,.74,-.6)].slice(0,1);
CARS.roadster.decals=T=>[sd('num','7',1,'#111','#f4f0e6',.26,.26,.58,-.4)];
CARS.supercar.decals=T=>[sd('num','9',1,'#111','#f4f0e6',.28,.28,.62,-.45)];
CARS.sport.decals=T=>[sd('num','4',1,'#111','#f4f0e6',.26,.26,.62,-.35)];
CARS.pickup.decals=T=>[sd('text','FARM SUPPLY',5,'#f4efe0',null,.8,.16,.84,.02)];
CARS.universal.decals=T=>[];
CARS.minibus.decals=T=>[sd('text','TOURS',3.4,'#f6f2e0',null,.6,.18,.9,.0)];
CARS.camper.decals=T=>[];
/* v090: the van's lettering stands 3 cm off the flank (the corrugation ribs are 12 mm proud and cut through it) on a cream sign panel */
CARS.van.decals=T=>[Object.assign(sd('label','',5.2,null,'#f2eee2',2.3,.46,1.4,-.75,undefined),{off:.03})];
CARS.boxtruck.decals=T=>[sd('label','',3.6,null,null,3.6,.9,2.1,-3.0,1.124)];

/* ================================================================ WRECKS: burnt-out, rusted-out and crashed versions of ANY model ================================================================
   wreckify() post-processes the finished prefab: it deforms the geometry (front/rear crush, panel dents along the normals, roof cave-in, sagging, body roll,
   flat or missing tyres), shatters glass, strips canvas, perforates rusty roofs, and bakes weathering into the vertex colours (rust, soot, scuffed paint).
   Styles:  burnt   - charred shell, no glass, melted tyres, burnt interior, a little rust and a mild crumple
            rusted  - decades of rust: orange/brown paint, holes in the roof, flat tyres, dirty cracked glass, torn canvas
            crashed - a fresh wreck: crushed nose (or tail), dented flank, scuffed bare metal, smashed glass, one or two flat or missing wheels
   Colours are baked, so the wreck keeps its model's paint scheme (o.pc / o.ac, sRGB) under the damage. */
const WS={
 burnt: {burn:1,  rust:.35,crash:.3, sag:.1, flat:.9, glassKeep:0,   canvasKeep:0,   holes:0},
 rusted:{burn:0,  rust:1,  crash:.18,sag:.07,flat:.6, glassKeep:.62, canvasKeep:.55, holes:1},
 crashed:{burn:0, rust:.22,crash:1,  sag:0,  flat:.45,glassKeep:.32, canvasKeep:.85, holes:0},
};
const WRECK_STYLES=Object.keys(WS);
const slin=c=>[Math.pow(c[0],2.2),Math.pow(c[1],2.2),Math.pow(c[2],2.2)];
function rngOf(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function hstr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mkNoise(seed){
 const hh=(x,y,z)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177)^Math.imul(seed,2147483647);n=Math.imul(n^n>>>13,1274126177);n^=n>>>16;return(n>>>0)/4294967296};
 const v=(x,y,z)=>{const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),uz=fz*fz*(3-2*fz);
  const a=lerp(hh(ix,iy,iz),hh(ix+1,iy,iz),ux),b=lerp(hh(ix,iy+1,iz),hh(ix+1,iy+1,iz),ux),c=lerp(hh(ix,iy,iz+1),hh(ix+1,iy,iz+1),ux),d=lerp(hh(ix,iy+1,iz+1),hh(ix+1,iy+1,iz+1),ux);
  return lerp(lerp(a,b,uy),lerp(c,d,uy),uz)};
 return(x,y,z)=>v(x,y,z)*.56+v(x*2.1+7,y*2.1+3,z*2.1+11)*.3+v(x*4.3+5,y*4.3+9,z*4.3+1)*.14;
}
const MIXC=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const PAINTM=new Set(['dustpaint','dustpaint2','carpaint','carpaint2']);
const WHEELM=new Set(['rubber','whitewall','steel','chrome','paint']);

function wreckify(P,S,o,zc){
 const style=WS[o.wreck===true?'crashed':o.wreck]||WS.crashed;
 const seed=hstr(S.kind+'|'+style.burn+style.rust+'|'+(o.seed||0)),rnd=rngOf(seed),noise=mkNoise(seed&0xffff);
 const parts=[...P.parts.values()];
 // ---- bounds
 let x0=1e9,x1=-1e9,y1=-1e9,z0=1e9,z1=-1e9;
 for(const p of parts){if(p.mat==='rubber'||p.mat==='whitewall')continue;const g=p.g,A=g.P;for(let i=0;i<g.nv;i++){const x=A[i*3],y=A[i*3+1],z=A[i*3+2];if(x<x0)x0=x;if(x>x1)x1=x;if(y>y1)y1=y;if(z<z0)z0=z;if(z>z1)z1=z}}
 const L=z1-z0,H=y1,Wd=x1-x0,cz=(z0+z1)/2;
 // ---- damage layout
 const crash=style.crash*(.75+rnd()*.5),hitEnd=rnd()<.72?1:-1,hitSide=rnd()<.5?-1:1;
 const Lc=Math.min(L,4.6),crushLen=Lc*(.14+.22*crash),crushAmt=Lc*(.07+.13*crash)*(style.crash>=1?1:.7);
 const dents=[];const nd=Math.round(2+4*style.crash+2*rnd());
 for(let i=0;i<nd;i++){const side=rnd()<.6?hitSide:-hitSide;dents.push({x:side*(Wd*.5),y:H*(.3+.45*rnd()),z:cz+(rnd()-.5)*L*.8,r:.3+.35*rnd(),d:(.05+.1*rnd())*(.4+style.crash)})}
 const cave={x:(rnd()-.5)*.5,z:cz+(rnd()-.5)*L*.3,r:.5+.4*rnd(),d:(style.crash>=1||style.burn?.12+.14*rnd():.04)*(style.burn?1.3:1)};
 const roll=(rnd()<.5?-1:1)*(.012+.03*style.flat*rnd())+hitSide*.01*crash;
 // ---- wheels
 const wax=S.wax||S.ax,wheels=[];
 wax.forEach((az,ai)=>{const front=ai===wax.length-1;for(const sd of[-1,1]){const tx=front?S.tx:(S.txR||S.tx),r=front?S.r:(S.rR||S.r),tw=front?S.tw:(S.twR||S.tw);
  const xs=[sd*tx];if(!front&&S.dual)xs.push(sd*(tx-(tw+.03)));
  wheels.push({xs,z:az-zc,r,tw,flat:rnd()<style.flat,gone:false,sq:.5+.2*rnd()})}});
 let goneN=0;if(style.crash>=1||style.burn)for(const w of wheels){if(goneN<1&&rnd()<.16){w.gone=true;w.flat=false;goneN++}}
 const wheelOf=(x,y,z)=>{for(const w of wheels){if(Math.abs(z-w.z)>w.r+.05)continue;if(y>w.r*2+.05)continue;const dy=y-w.r,dz=z-w.z;if(dy*dy+dz*dz>(w.r+.05)*(w.r+.05))continue;
   for(const wx of w.xs)if(Math.abs(x-wx)<w.tw*.75)return w}return null};
 const ssm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
 const cr=Math.cos(roll),sr=Math.sin(roll);
 // ---- geometry pass
 let minWheelY=0;
 for(const p of parts){const g=p.g,A=g.P,Nn=g.N,n=g.nv;p.kill=new Uint8Array(n);p.dm=new Float32Array(n);
  const isW=WHEELM.has(p.mat);
  for(let i=0;i<n;i++){const i3=i*3;let x=A[i3],y=A[i3+1],z=A[i3+2];const nx=Nn[i3],ny=Nn[i3+1],nz=Nn[i3+2];
   const w=isW?wheelOf(x,y,z):null;
   if(w){if(w.gone){p.kill[i]=1}else if(w.flat){const f=style.burn?w.sq*.85:w.sq;y*=f}
    // wheels only roll with the body
   }else{
    let dx=0,dy=0,dz=0,dm=0;
    // crush at the struck end
    const u=hitEnd>0?(z-(z1-crushLen))/crushLen:((z0+crushLen)-z)/crushLen;
    if(u>0){const t=ssm(0,1,u),nzz=noise(x*3.1,y*3.1,z*3.1)-.5;
     dz-=hitEnd*crushAmt*t*(.9+.5*nzz);dy-=crush(y,H)*t*.16*(.6+nzz);dx+=hitSide*t*t*.22*crash+nzz*t*.16*crash;
     const k=(noise(x*5,y*5,z*5)-.5)*t*.16*crash;dx-=nx*k;dy-=ny*k;dz-=nz*k;dm+=t*.5}
    // panel dents along the normal
    for(const d of dents){const ex=x-d.x,ey=y-d.y,ez=z-d.z,q=(ex*ex+ey*ey+ez*ez)/(d.r*d.r);if(q<3){const f=Math.exp(-q*1.6)*d.d;dx-=nx*f;dy-=ny*f;dz-=nz*f;dm+=f*2.2}}
    // roof cave-in and burnt sag
    if(y>H*.7){const q=((x-cave.x)*(x-cave.x)+(z-cave.z)*(z-cave.z))/(cave.r*cave.r),f=Math.exp(-q)*cave.d*ssm(H*.7,H*.95,y);dy-=f;dm+=f*2}
    if(style.sag){dy-=style.sag*H*ssm(H*.45,H,y)*(.4+noise(x*1.5,0,z*1.5)*.9)}
    // crumpled-sheet roughness
    const wr=(noise(x*3.3+1,y*3.3,z*3.3)-.5)*(.03+.05*style.crash+.03*style.burn);dx+=nx*wr;dy+=ny*wr;dz+=nz*wr;
    x+=dx;y+=dy;z+=dz;p.dm[i]=Math.min(1,Math.abs(dm));
   }
   // body roll about the long axis
   const rx=x*cr-(y-.35)*sr,ry=x*sr+(y-.35)*cr+.35;x=rx;y=ry;
   if(p.mat==='rubber'&&y<minWheelY)minWheelY=y;
   A[i3]=x;A[i3+1]=y;A[i3+2]=z}}
 const lift=Math.max(0,-minWheelY);if(lift>.001)for(const p of parts){const A=p.g.P;for(let i=0;i<p.g.nv;i++)A[i*3+1]+=lift}
 // ---- triangle removal (glass, canvas, rust holes, missing wheels), then normals
 const dropIf=(p,pred)=>{const g=p.g,I=g.I,A=g.P;let w=0;for(let t=0;t<g.ni;t+=3){const a=I[t],b=I[t+1],c=I[t+2];
   if(p.kill[a]||p.kill[b]||p.kill[c])continue;
   const cx=(A[a*3]+A[b*3]+A[c*3])/3,cy=(A[a*3+1]+A[b*3+1]+A[c*3+1])/3,cz2=(A[a*3+2]+A[b*3+2]+A[c*3+2])/3;
   if(pred&&pred(cx,cy,cz2))continue;I[w++]=a;I[w++]=b;I[w++]=c}g.ni=w};
 for(const p of parts){
  const m=p.mat;
  if(m==='retroglass'||m==='retroglassD'||m==='dark'&&o.wreck&&false)dropIf(p,(x,y,z)=>noise(x*2.2+3,y*2.2,z*2.2)>style.glassKeep);
  else if(m==='canvas')dropIf(p,(x,y,z)=>noise(x*4+5,y*4,z*4)>style.canvasKeep);
  else if(style.holes&&(m==='dustpaint'||m==='dustpaint2'))dropIf(p,(x,y,z)=>y>H*.82&&noise(x*3.5+9,y*3.5,z*3.5)>.8);
  else dropIf(p,null);
 }
 for(const p of parts){const g=p.g,A=g.P,Nn=g.N,I=g.I,n=g.nv,acc=new Float32Array(n*3);
  for(let t=0;t<g.ni;t+=3){const a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3,ux=A[b]-A[a],uy=A[b+1]-A[a+1],uz=A[b+2]-A[a+2],vx=A[c]-A[a],vy=A[c+1]-A[a+1],vz=A[c+2]-A[a+2];
   const fx=uy*vz-uz*vy,fy=uz*vx-ux*vz,fz=ux*vy-uy*vx;for(const k of[a,b,c]){acc[k]+=fx;acc[k+1]+=fy;acc[k+2]+=fz}}
  for(let i=0;i<n;i++){const i3=i*3;let x=acc[i3],y=acc[i3+1],z=acc[i3+2];const l=Math.hypot(x,y,z);if(l<1e-9)continue;x/=l;y/=l;z/=l;
   if(x*Nn[i3]+y*Nn[i3+1]+z*Nn[i3+2]<0){x=-x;y=-y;z=-z}Nn[i3]=x;Nn[i3+1]=y;Nn[i3+2]=z}}
 // ---- weathering colours
 const pc=slin(o.pc||[.5,.5,.5]),ac=slin(o.ac||[.8,.8,.75]);
 const RUSTS=[slin([.5,.22,.08]),slin([.36,.14,.05]),slin([.22,.1,.045]),slin([.58,.3,.12])];
 const CHAR=slin([.006,.0055,.005]),ASH=slin([.12,.11,.1]),SOOT=slin([.004,.004,.004]);
 const rustAt=(x,y,z,k)=>{const n=noise(x*4+k,y*4,z*4);return n<.35?RUSTS[2]:n<.55?RUSTS[1]:n<.75?RUSTS[0]:RUSTS[3]};
 for(const p of parts){const g=p.g,A=g.P,Cc=g.C,n=g.nv,m=p.mat;
  const paint=PAINTM.has(m),isAcc=m==='dustpaint2'||m==='carpaint2';
  if(m==='chrome'){p.mat='rust'}
  for(let i=0;i<n;i++){const i3=i*3,x=A[i3],y=A[i3+1],z=A[i3+2],low=1-ssm(0,H*.6,y);
   const n1=noise(x*2+2,y*2,z*2),n2=noise(x*6.5+9,y*6.5,z*6.5);let c;
   if(paint){c=isAcc?ac.slice():pc.slice();const rb=Cc[i3];c=[c[0]*rb,c[1]*rb,c[2]*rb];
    // old paint: chalky and faded
    if(!style.burn)c=MIXC(c,[.4,.36,.3].map(v=>Math.pow(v,2.2)),.1+.14*n1);
    const rustAmt=clamp(style.rust*(.3+1.2*n1+low*.6+(n2-.5)*.7)-.3,0,1);
    if(rustAmt>0)c=MIXC(c,rustAt(x,y,z,3),Math.min(1,rustAmt*1.6));
    if(style.burn){const heat=clamp(style.burn*(1.05+.3*n1),0,1),brownish=n2>.8?RUSTS[2]:n2<.1?ASH:CHAR;c=MIXC(c,brownish,heat)}
    const sc=p.dm[i]*(style.crash>=1?1.2:.5);if(sc>.12)c=MIXC(c,n2>.5?slin([.52,.5,.47]):RUSTS[1],clamp(sc*1.6,0,.85));
    // dirt line low on the body
    if(!style.burn)c=MIXC(c,slin([.3,.25,.19]),low*.28*(.5+n2));
   }else if(m==='chrome'||m==='rust'||m==='steel'){const base=m==='steel'?[Cc[i3],Cc[i3+1],Cc[i3+2]]:slin([.42,.38,.33]);c=MIXC(base,rustAt(x,y,z,7),clamp(.35+style.rust*.55+(n2-.5),0,.95));if(style.burn)c=MIXC(c,CHAR,.7*style.burn)}
   else if(m==='whitewall'){c=MIXC(slin([.6,.57,.5]),CHAR,style.burn)}
   else if(m==='vinyl'){c=style.burn?SOOT:MIXC([Cc[i3],Cc[i3+1],Cc[i3+2]],slin([.2,.17,.1]),.5+.3*n1)}
   else if(m==='wood'){c=style.burn?CHAR:MIXC([Cc[i3],Cc[i3+1],Cc[i3+2]],slin([.38,.34,.28]),.6)}
   else if(m==='retroglass'||m==='retroglassD'){c=MIXC([Cc[i3],Cc[i3+1],Cc[i3+2]],slin([.5,.46,.38]),.55+.3*n2)}
   else if(m==='lampOff'){c=MIXC([Cc[i3],Cc[i3+1],Cc[i3+2]],SOOT,.5+style.burn*.4)}
   else if(m==='plastic'||m==='canvas'||m==='dark'||m==='paint'||m==='dirt'||m==='brass'){const k=style.burn?.08:style.rust>.6?.65:.85;c=[Cc[i3]*k,Cc[i3+1]*k,Cc[i3+2]*k];if(style.burn&&(m==='canvas'))c=CHAR}
   else continue;
   Cc[i3]=c[0];Cc[i3+1]=c[1];Cc[i3+2]=c[2]}}
}
const crush=(y,H)=>.6+.4*clamp(y/H,0,1);

/* ================================================================ registry ================================================================ */
/* z extents of the whole vehicle (so the model is centred on its collider) and overall size */
const EXT={pickup:[-3.35,2.65],tow:[-4.25,2.65],dump:[-5.3,2.85],truck:[-4.65,3.15],army:[-5.2,2.95],fire:[-6.5,3.1],schoolbus:[-4.3,4.6],bus:[-5.15,5.15],van:[-2.6,2.7],minivan:[-2.3,2.35],minibus:[-3.1,2.9],camper:[-2.3,2.45],minitruck:[-2.4,1.65],jeep:[-1.8,1.85],boxtruck:[-5.1,2.65],ambulance:[-3.3,2.85]};
const HEIGHT={pickup:1.85,tow:2.9,dump:2.3,truck:3.0,army:3.0,fire:3.0,schoolbus:2.8,bus:3.3,boxtruck:3.2,camper:2.5,jeep:1.4,roadster:1.1,cabrio:1.35,targa:1.3,minitruck:1.5};
for(const k of Object.keys(CARS)){const S=CARS[k];S.kind=k;if(BUILD[k])continue;
 const ex=EXT[k]||[S.zr-.2,S.zf+.2],zc=(ex[0]+ex[1])/2;
 BUILD[k]=(M,P,o)=>{M.save().move(0,0,-zc);try{carBuild(M,P,S,o)}finally{M.restore()}
  if(o.wreck)wreckify(P,S,o,zc);
  if(DECALS[k])DECALS[k]=DECALS[k].map(d=>Object.assign({},d,{z:d.z-zc}))};
 const top=S.cab?Math.max(...S.cab.roof.map(p=>p[1])):1.4;
 META[k]={dims:[ex[1]-ex[0],S.w*2+(k==='camper'?.4:.12),HEIGHT[k]||top+.05],zc}}

PF.retro=function(kind,o){o=o||{};if(!BUILD[kind])throw new Error('retro kind '+kind);const dust=!!o.dust||!!o.wreck;const wk=o.wreck?(o.wreck===true?'crashed':o.wreck)+'|'+(o.seed||0)+'|'+(o.pc||[]).map(v=>v.toFixed(2))+'|'+(o.ac||[]).map(v=>v.toFixed(2)):'';
 return prefab('r50|'+kind+'|'+(dust?1:0)+'|'+wk+'|'+(o.opt||''),(M,P)=>BUILD[kind](M,P,Object.assign({},o,{dust})))};

/* street traffic: weighted pool of models that appear as ordinary parked / abandoned vehicles */
const STREET=[['sedan',10],['hatch',8],['universal',7],['liftback',5],['coupe',6],['cabrio',3],['roadster',3],['targa',2],['muscle',4],['sport',3],['supercar',1],['micro',4],['suv',6],['crossover',6],['pickup',8],['van',6],['minivan',5],['minibus',2],['camper',3],['limo',1.2],['minitruck',3],['tow',1],['dump',.8],['truck',.8],['bus',.8]];
const STW=STREET.reduce((a,b)=>a+b[1],0);
const streetPick=()=>{let r=Math.random()*STW;for(const [k,w] of STREET){r-=w;if(r<=0)return k}return'sedan'};
/* legacy model names used by older game code */
const LEGACY={sedan:'sedan',hatch:'hatch',suv:'suv',mpv:'minivan',cross:'crossover',offroad:'jeep'};
window.RGRETRO={wreckStyles:WRECK_STYLES,kinds:Object.keys(BUILD),paints:PAINTS,tint,meta:META,specs:CARS,decals:DECALS,street:streetPick,legacy:LEGACY};
console.log('[retro50] '+Object.keys(BUILD).length+' retro models ready');
})();
