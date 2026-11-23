
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
