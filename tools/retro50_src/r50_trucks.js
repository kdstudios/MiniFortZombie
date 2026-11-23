
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
