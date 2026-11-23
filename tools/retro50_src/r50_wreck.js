
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
