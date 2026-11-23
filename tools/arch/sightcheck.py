"""MFZ tools/arch: ironsight alignment check.
Renders every gun at full ADS (the exact pose gunplay.js uses) in headless Chrome and reports how many px the
front-sight tip sits from the screen centre (tipOff 0 = perfect). Writes one PNG per gun + summary.json.
usage: python3 -I tools/arch/sightcheck.py <game dir> <out dir> [overrides.json]   (needs: pip install playwright)"""
import sys, json, asyncio, base64, os
from playwright.async_api import async_playwright
GAME, OUT = sys.argv[1], sys.argv[2]
OVR = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
os.makedirs(OUT, exist_ok=True)
W, H = 800, 450
JS = r"""
async ([W,H,OVR])=>{
 const X=window.RGX,T=THREE;X.ensure();
 const rd=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});rd.setSize(W,H);rd.setPixelRatio(1);
 const cam=new T.PerspectiveCamera(44,W/H,.04,8);
 const white=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide});
 const out={};
 for(const id of Object.keys(X.GUNS)){
  const g=X.getGun(id);if(!g)continue;
  for(const k in X.vm.cache)X.vm.cache[k].root.visible=false;g.root.visible=true;
  const info=g.info,sy=(OVR[id]&&OVR[id].sightY!=null)?OVR[id].sightY:info.sightY,az=info.adsZ;
  g.root.position.set(0,-sy,-az);g.root.rotation.set(0,0,0);
  if(info.scopeMeshes)for(const o of info.scopeMeshes)o.visible=false;   // scope hides on aim (overlay takes over)
  g.flash.visible=false;
  // hands/arms off: we judge the gun's sight picture
  const hid=[];g.root.children.forEach(c=>{if(c!==info.group&&c.visible){c.visible=false;hid.push(c)}});
  const sc=X.vm.scene;sc.overrideMaterial=white;const bg=sc.background;sc.background=new T.Color(0);
  rd.render(sc,cam);
  const gl=rd.getContext(),px=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);
  const m=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)m[(H-1-y)*W+x]=px[(y*W+x)*4]>127?1:0;
  sc.overrideMaterial=null;sc.background=bg;
  // shaded picture for eyeballing
  sc.background=new T.Color(0x8fa3b8);rd.render(sc,cam);const shot=rd.domElement.toDataURL('image/png');sc.background=bg;
  hid.forEach(c=>c.visible=true);
  out[id]={key:g.key,sightY:info.sightY,adsZ:az,irons:!!info.irons,scope:!!info.scopeMeshes,mask:Array.from(m).join(''),shot};
 }
 return out}
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width':1280,'height':720})
        pg.on('pageerror', lambda e: print('PAGEERR', str(e)[:200]))
        await pg.goto('file://'+os.path.abspath(GAME)+'/index.html')
        await pg.wait_for_function('window.RGX&&window.RGX.getGun&&typeof renderer!=="undefined"&&renderer', timeout=120000)
        await pg.wait_for_timeout(1500)
        res = await pg.evaluate(JS, [W,H,OVR])
        await b.close()
    summary = {}
    cx, cy = W//2, H//2
    for id_, r in res.items():
        m = r.pop('mask'); shot = r.pop('shot')
        open(f'{OUT}/{id_}.png','wb').write(base64.b64decode(shot.split(',')[1]))
        at = lambda x,y: m[y*W+x]=='1'
        # the sight tip: in the centre column, the nearest "solid below / empty above" edge to the centre row
        edges = [y for y in range(1,H) if at(cx,y) and not at(cx,y-1)]
        tip = min(edges, key=lambda y: abs(y-cy)) if edges else None
        # does anything sit right on the crosshair point (3x3)?
        cover = any(at(cx+dx,cy+dy) for dx in (-1,0,1) for dy in (-1,0,1))
        # anything in the 7px band just above centre (would hide the aim point)
        above = sum(at(x,y) for x in range(cx-3,cx+4) for y in range(cy-7,cy-1))
        r.update(tipRow=tip, tipOff=(tip-cy) if tip is not None else None, coversCentre=cover, solidAbove=above)
        summary[id_] = r
    json.dump(summary, open(f'{OUT}/summary.json','w'), indent=1)
    for k,v in summary.items(): print(k, v['key'], 'tipOff', v['tipOff'], 'cover', v['coversCentre'], 'above', v['solidAbove'], 'sightY', round(v['sightY'],4), 'irons' if v['irons'] else '', 'scope' if v['scope'] else '')
asyncio.run(main())
