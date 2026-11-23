
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
