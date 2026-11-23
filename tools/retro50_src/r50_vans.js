
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
