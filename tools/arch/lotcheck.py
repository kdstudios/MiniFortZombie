# MFZ tools/arch (v081): build one lot headless and report errors + stats, without playing the game.
# usage: python3 -I tools/arch/lotcheck.py <game dir> <NEWCAT id> [screenshot.png]
#   prints: page / console errors, the lot's mesh / vertex / collider / solid counts, loot containers and zombie spawns.
#   With a png path it also renders the lot from a high front-left corner (slow on software GL; only when a look is needed).
# needs: python playwright + a Chrome/Chromium (set CHROME=/path if not /usr/bin/google-chrome)
import sys, os, json, asyncio
from playwright.async_api import async_playwright

root, lot = os.path.abspath(sys.argv[1]), sys.argv[2]
shot = sys.argv[3] if len(sys.argv) > 3 else None
JS = """(id) => {
  let s = 12345; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const t = NEWCAT.find(d => d.id === id);
  if (!t) return {err: 'no NEWCAT entry ' + id, ids: NEWCAT.map(d => d.id)};
  const out = {name: t.name, build: t.build && t.build.name};
  try {
    if (!scene) scene = new THREE.Scene();
    const zs = [], sp = [];
    window.zombie = (x, z) => zs.push([+x.toFixed(1), +z.toFixed(1)]); try { zombie = window.zombie; } catch (e) {}
    window.spawnPropContainer = (x, z, n, tb) => sp.push(n + ':' + tb); try { spawnPropContainer = window.spawnPropContainer; } catch (e) {}
    const n0 = solids.length, B = t.build(0, 0, t);
    let meshes = 0, verts = 0;
    B.g.traverse(o => { if (o.isMesh) { meshes++; verts += o.geometry.attributes.position.count; } });
    Object.assign(out, {meshes, verts, solids: solids.length - n0, occ: B.occ.length, loot: sp, zombies: zs});
    if (window.__shot) { scene.add(B.g); window.__B = B; }
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 800); }
  return out;
}"""
SHOT = """() => {
  const r = new THREE.WebGLRenderer({antialias: true}); r.setSize(1280, 800); document.body.appendChild(r.domElement);
  Object.assign(r.domElement.style, {position: 'fixed', left: 0, top: 0, zIndex: 99999});
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x9ab4c8);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x445544, 0.9)); const d = new THREE.DirectionalLight(0xffffff, 0.9); d.position.set(-20, 40, 30); sc.add(d);
  sc.add(window.__B.g);
  const c = new THREE.PerspectiveCamera(50, 1.6, 0.5, 400); c.position.set(-34, 26, 44); c.lookAt(0, 2, 0); r.render(sc, c);
}"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/usr/bin/google-chrome'),
                                     args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGE ERROR ' + str(e)))
        pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'GPU stall' not in m.text else None)
        await pg.goto('file://' + root + '/index.html')
        await pg.wait_for_timeout(6000)
        if shot: await pg.evaluate('window.__shot = 1')
        r = await pg.evaluate(JS, lot)
        if shot and 'err' not in r:
            await pg.evaluate(SHOT); await pg.wait_for_timeout(500); await pg.screenshot(path=shot)
            r['screenshot'] = shot
        print(json.dumps(r, indent=1))
        print('ERRORS:', json.dumps(errs, indent=1) if errs else 'none')
        await br.close()

asyncio.run(main())
