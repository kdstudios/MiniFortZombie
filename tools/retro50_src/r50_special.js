
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
