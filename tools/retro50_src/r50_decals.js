
/* ================================================================ DECALS: lettering and emblems, placed from the real surface ================================================================ */
/* descriptor: {t:'text'|'num'|'star'|'cross', txt, asp, fg, bg, w, h, y, z, side:true (both flanks, x from the surface) | end:'front'|'rear', x?} */
const sd=(t,txt,asp,fg,bg,w,h,y,z,x)=>({t,txt,asp,fg,bg,w,h,y,z,side:true,x});
const en=(end,t,txt,asp,fg,bg,w,h,y,z)=>({t,txt,asp,fg,bg,w,h,y,z,end,x:0});
CARS.taxi.decals=T=>[en('front','text','TAXI',3.2,'#111','#f3e9a8',.5,.125,1.58,-.012),en('rear','text','TAXI',3.2,'#111','#f3e9a8',.5,.125,1.58,-.328),
 sd('text','YELLOW CAB',6,'#1a1a1a',null,.78,.14,.74,-.12)];
CARS.police.decals=T=>[sd('text','POLICE',4.4,'#111',null,1.0,.23,.68,-.52),sd('star','\u2605',1,'#111',null,.2,.2,.84,-.1)];
CARS.ambulance.decals=T=>[sd('cross','+',1,'#c8141a',null,.55,.55,1.35,-1.25),sd('cross','+',1,'#c8141a',null,.55,.55,1.35,-2.78),
 en('rear','text','AMBULANCE',7,'#c8141a','#fafaf5',.8,.12,1.67,-3.03)];
CARS.fire.decals=T=>[sd('text','FIRE DEPT',5.2,'#f0c030',null,2.0,.38,1.95,-4.55),sd('text','No. 12',3,'#f4e6b0',null,.5,.17,1.0,.35),
 en('rear','text','ENGINE 12',6,'#f0c030',null,1.0,.17,1.55,-6.12)];
CARS.schoolbus.decals=T=>[sd('text','SCHOOL BUS',7,'#111',null,1.7,.24,1.05,-1.2),sd('text','SCHOOL BUS',7,'#111',null,1.7,.24,1.05,.6),
 en('front','text','SCHOOL BUS',7,'#111','#f0b818',1.4,.2,2.29,2.862),en('rear','text','SCHOOL BUS',7,'#111','#f0b818',1.4,.2,2.29,-4.2)];
CARS.bus.decals=T=>[en('front','text','DOWNTOWN',7,'#ffcc55','#101010',0.96,.16,2.61,4.31),en('rear','text','No. 9',3,'#ffcc55','#101010',.5,.2,2.15,-4.87),
 sd('text','CITY TRANSIT',7,'#222',null,2.6,.3,1.0,-2.0),sd('text','CITY TRANSIT',7,'#222',null,2.6,.3,1.0,1.9)];
CARS.army.decals=T=>[sd('star','\u2605',1,'#e8e8d0',null,.5,.5,1.1,.05)];
CARS.jeep.decals=T=>[sd('star','\u2605',1,'#e8e8d0',null,.32,.32,.88,.95)];
CARS.tow.decals=T=>[sd('text','TOWING',4.5,'#f6f2e0',null,.8,.18,.84,.02),sd('text','24 HR',3,'#f6f2e0',null,.5,.16,1.03,-1.4,.972)];
CARS.dump.decals=T=>[sd('text','HAULING CO.',6,'#1c1c1c',null,2.0,.34,1.75,-3.05,1.034),sd('text','No. 4',3,'#f6f2e0',null,.45,.15,.95,.0)];
CARS.truck.decals=T=>[sd('text','FREIGHT',4.5,'#f6f2e0',null,.85,.19,1.0,.0)];
CARS.muscle.decals=T=>[sd('num','55',1,'#111','#f4f0e6',.3,.3,.76,-.35),sd('num','55',1,'#111','#f4f0e6',.3,.3,.74,-.6)].slice(0,1);
CARS.roadster.decals=T=>[sd('num','7',1,'#111','#f4f0e6',.26,.26,.58,-.4)];
CARS.supercar.decals=T=>[sd('num','9',1,'#111','#f4f0e6',.28,.28,.62,-.45)];
CARS.sport.decals=T=>[sd('num','4',1,'#111','#f4f0e6',.26,.26,.62,-.35)];
CARS.pickup.decals=T=>[sd('text','FARM SUPPLY',5,'#f4efe0',null,.8,.16,.84,.02)];
CARS.universal.decals=T=>[];
CARS.minibus.decals=T=>[sd('text','TOURS',3.4,'#f6f2e0',null,.6,.18,.9,.0)];
CARS.camper.decals=T=>[];
/* v090: the van's lettering stands 3 cm off the flank (the corrugation ribs are 12 mm proud and cut through it) on a cream sign panel */
CARS.van.decals=T=>[Object.assign(sd('label','',5.2,null,'#f2eee2',2.3,.46,1.4,-.75,undefined),{off:.03})];
CARS.boxtruck.decals=T=>[sd('label','',3.6,null,null,3.6,.9,2.1,-3.0,1.124)];
