
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
