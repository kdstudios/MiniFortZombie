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
