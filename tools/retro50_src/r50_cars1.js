
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
