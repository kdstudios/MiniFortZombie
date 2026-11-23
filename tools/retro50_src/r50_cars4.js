
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
