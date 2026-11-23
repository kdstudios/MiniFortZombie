/* =====================================================================================================
   MINI FORT ZOMBIE v092 - GAME ASSETS: custom textures and custom sounds (Options > Game Assets)
   The Game Assets page now has three headings that open one at a time: Icons (the v06x custom inventory icons, unchanged, still
   in js/game/core/01_items.js + js/game/ui.js), Custom Textures and Custom Sounds (both here).

   Both work like the icons: name a file after the ID of the thing it replaces, import as many as you like, export the defaults
   to paint or play over, clear them all. Files are kept in this browser (IndexedDB "mfz_assets"), not in save games.

   TEXTURES (window.MFZTEX)  slot = {id, name, cat, hint, ready(), def() -> canvas of the default, put(canvas | null)}
   - world surfaces: the 47 sets of js/layers/world.js (two GPU texture arrays, 512 x 512 a layer). "<name>.png" replaces the
     colour, "<name>_n.png" the normal map. Ambient occlusion and roughness stay the game's.
   - characters: the zombie atlas (skin, camo skin, normal map, roughness/metal map) and the survivor atlas
   - effects: the fire flipbook
   To add a slot: push it in texSlots(). Dev Mode needs nothing: this is not spawnable content.

   SOUNDS (window.MFZSND)  slot = {id, name, cat, fn, pick(args), pos, range, dur, call(O)}
   Every game sound is synthesised (S.* in js/game/core/03_audio.js). A slot wraps one S function (or one variant of it): when a
   custom file exists the file plays through the same out(p, range) path (distance volume + panning), otherwise the original
   synth runs. Up to 9 variants per slot ("groan.wav", "groan_2.wav", ...), picked at random. Music slots stream a looping file
   into the game's music channel instead of the procedural notes (music_game, music_siege) or replace the menu track (music_menu).
   Export default sounds renders every synth to a WAV with an OfflineAudioContext (the synths are pointed at it for a moment).
   To add a slot: add a row to SFXT below.
   ===================================================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const AS = (window.MFZASSETS = {open: null});
  const MB = 1024 * 1024;
  const LIM = {
    texFile: 16 * MB,
    texPx: 4096,
    sfxFile: 8 * MB,
    sfxSec: 30,
    musFile: 80 * MB,
    variants: 9
  };
  AS.limits = LIM;

  /* ---------------------------------------------------------------- storage (best effort, like the icons) */
  let persistOK = true;
  function dbOpen() {
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('mfz_assets', 1);
        r.onupgradeneeded = () => {
          r.result.createObjectStore('tex');
          r.result.createObjectStore('snd');
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) {
        rej(e);
      }
    });
  }
  async function dbDo(store, mode, fn) {
    const d = await dbOpen();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode),
        r = fn(t.objectStore(store));
      t.oncomplete = () => {
        d.close();
        res(r && r.result);
      };
      t.onerror = t.onabort = () => {
        d.close();
        rej(t.error);
      };
    });
  }
  const dbPut = (st, k, v) =>
      dbDo(st, 'readwrite', s => s.put(v, k)).catch(() => {
        persistOK = false;
      }),
    dbDel = (st, k) => dbDo(st, 'readwrite', s => s.delete(k)).catch(() => {}),
    dbClear = st => dbDo(st, 'readwrite', s => s.clear()).catch(() => {});
  async function dbAll(st) {
    const d = await dbOpen();
    return new Promise((res, rej) => {
      const out = [],
        q = d.transaction(st, 'readonly').objectStore(st).openCursor();
      q.onsuccess = () => {
        const c = q.result;
        if (c) {
          out.push([c.key, c.value]);
          c.continue();
        } else {
          d.close();
          res(out);
        }
      };
      q.onerror = () => {
        d.close();
        rej(q.error);
      };
    });
  }
  function say(id, html, good, err) {
    const e = $(id);
    if (e) {
      e.innerHTML = html;
      e.style.color = err ? '#ef4444' : good ? '#22c55e' : '#aaa';
    }
  }
  function report(id, noun, ok, bad, extra) {
    say(
      id,
      (ok.length ? 'Imported ' + ok.length + ' ' + noun + '(s): ' + esc(ok.join(', ')) + '. ' : '') +
        (bad.length
          ? '<br><span class="r">Skipped ' + bad.length + ':<br>' + bad.map(esc).join('<br>') + '</span>'
          : '') +
        (ok.length && !persistOK
          ? '<br><span class="o">Could not save to browser storage - these last until you reload.</span>'
          : '') +
        (extra || ''),
      ok.length > 0,
      bad.length > 0 && !ok.length
    );
  }
  const sizeTxt = n => (n >= MB ? (n / MB).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

  /* =====================================================================================================
     TEXTURES
     ===================================================================================================== */
  const TX = (window.MFZTEX = {slots: [], by: {}, cu: {}, thumbs: {}});
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function loadImg(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('image could not be decoded'));
      im.src = src;
    });
  }
  async function decodeFile(buf, type) {
    const u = URL.createObjectURL(new Blob([buf], {type: type || 'image/png'}));
    try {
      return await loadImg(u);
    } finally {
      URL.revokeObjectURL(u);
    }
  }
  function toCanvas(img, w, h) {
    const c = canvas(w || img.naturalWidth || img.width, h || img.naturalHeight || img.height);
    c.getContext('2d', {willReadFrequently: true}).drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  /* world surface groups (the filters) */
  const WGROUP = {
    Ground: 'asphalt pavers concrete lawn humus dirt galets cobble flagstone pathgravel sand snow snowpack reg ash',
    Walls: 'brick plaster plaster2 ashlar adobe drystone pise stone rock strata',
    Wood: 'paintwood wood boards bark barkw palmbark crate timber',
    'Roofs & metal': 'rooftiles slate rollshutter shutter steel rust mecha mechadark',
    'Fabric & misc': 'burlap canvas cardboard laine linge vase'
  };
  const WNAME = {
    pavers: 'Paving slabs',
    plaster2: 'Plaster (warm)',
    paintwood: 'Painted wood',
    boards: 'Floorboards',
    rooftiles: 'Roof tiles',
    rollshutter: 'Roller shutter',
    mecha: 'Machinery metal',
    mechadark: 'Machinery metal (dark)',
    humus: 'Forest floor',
    galets: 'Pebbles',
    barkw: 'Bark (pale)',
    palmbark: 'Palm bark',
    pathgravel: 'Gravel path',
    pise: 'Rammed earth',
    reg: 'Stony desert',
    laine: 'Wool',
    linge: 'Linen',
    vase: 'Mud',
    ashlar: 'Ashlar stone',
    drystone: 'Dry stone wall',
    snowpack: 'Packed snow'
  };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function texSlots() {
    const out = [];
    const D = window.RGTEX,
      W = window.RGW;
    if (D && W && W.U) {
      const S = D.size,
        groupOf = n =>
          Object.keys(WGROUP).find(g => (' ' + WGROUP[g] + ' ').includes(' ' + n + ' ')) || 'Fabric & misc';
      const raw = async (b64, opaque) => {
        const c = toCanvas(await loadImg('data:image/webp;base64,' + b64), S, S);
        if (opaque) {
          const x = c.getContext('2d'),
            d = x.getImageData(0, 0, S, S);
          for (let i = 3; i < d.data.length; i += 4) d.data[i] = 255;
          x.putImageData(d, 0, 0);
        }
        return c;
      };
      D.names.forEach((n, i) => {
        const nice = WNAME[n] || cap(n),
          arr = k => W.U[k].value && W.U[k].value.image && W.U[k].value.image.data;
        // colour: RGB of layer i of the first array (its alpha = ambient occlusion, kept)
        out.push({
          id: n,
          name: nice,
          cat: groupOf(n),
          hint: S + ' × ' + S,
          ready: () => !!(W.ready && arr('tA')),
          def: () => raw(D.a[i], true),
          async put(cv) {
            const data = arr('tA'),
              off = i * S * S * 4,
              avg = [0, 0, 0];
            if (cv) {
              const px = toCanvas(cv, S, S).getContext('2d').getImageData(0, 0, S, S).data;
              for (let j = 0; j < px.length; j += 4) {
                data[off + j] = px[j];
                data[off + j + 1] = px[j + 1];
                data[off + j + 2] = px[j + 2];
                avg[0] += px[j];
                avg[1] += px[j + 1];
                avg[2] += px[j + 2];
              }
              const k = 1 / (S * S * 255);
              W.U.uAvg.value[i].set(avg[0] * k, avg[1] * k, avg[2] * k); // the shader keeps a surface's hue relative to its average colour
            } else {
              data.set((await raw(D.a[i])).getContext('2d').getImageData(0, 0, S, S).data, off);
              W.U.uAvg.value[i].set(...D.avg[i]);
            }
            W.U.tA.value.needsUpdate = true;
          }
        });
        // normal map: red / green of layer i of the second array (its blue = roughness, kept)
        out.push({
          id: n + '_n',
          name: nice + ' (normal map)',
          cat: 'Normal maps',
          hint: S + ' × ' + S + ' normal',
          ready: () => !!(W.ready && arr('tB')),
          async def() {
            const c = await raw(D.b[i], true),
              x = c.getContext('2d'),
              d = x.getImageData(0, 0, S, S);
            for (let j = 0; j < d.data.length; j += 4) {
              const nx = d.data[j] / 127.5 - 1,
                ny = d.data[j + 1] / 127.5 - 1;
              d.data[j + 2] = Math.round((Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * 0.5 + 0.5) * 255); // blue rebuilt so it reads as a normal map
            }
            x.putImageData(d, 0, 0);
            return c;
          },
          async put(cv) {
            const data = arr('tB'),
              off = i * S * S * 4;
            if (cv) {
              const px = toCanvas(cv, S, S).getContext('2d').getImageData(0, 0, S, S).data;
              for (let j = 0; j < px.length; j += 4) {
                data[off + j] = px[j];
                data[off + j + 1] = px[j + 1];
              }
            } else data.set((await raw(D.b[i])).getContext('2d').getImageData(0, 0, S, S).data, off);
            W.U.tB.value.needsUpdate = true;
          }
        });
      });
    }
    /* single-image textures: swap the image of the THREE.Texture the game already uses */
    const single = (id, name, cat, hint, get, src) => {
      if (!src) return;
      out.push({
        id,
        name,
        cat,
        hint,
        ready: () => !!get(),
        def: async () => toCanvas(await loadImg(src)),
        async put(cv) {
          const t = get();
          if (!t) return;
          const im = cv || (await loadImg(src));
          t.image = im;
          t.needsUpdate = true;
          // the game's own loader may still be decoding the default image and would put it back: check once more
          if (cv)
            setTimeout(() => {
              if (TX.cu[id] && t.image !== im) {
                t.image = im;
                t.needsUpdate = true;
              }
            }, 2500);
        }
      });
    };
    const Z = window.RZTEX,
      zt = k => () => window.RZ && RZ.TX && RZ.TX[k];
    if (Z) {
      single('zombie_skin', 'Zombie skin and clothes', 'Characters', 'atlas, keep the layout', zt('map'), Z.map);
      single('zombie_camo', 'Zombie skin (camouflage)', 'Characters', 'atlas, keep the layout', zt('camo'), Z.camo);
      single('zombie_normal', 'Zombie normal map', 'Characters', 'atlas normal map', zt('normal'), Z.normal);
      single('zombie_rm', 'Zombie roughness / metal', 'Characters', 'atlas: G rough, B metal', zt('rm'), Z.rm);
    }
    if (window.RSTEX)
      single(
        'survivor_skin',
        'Survivor skin and clothes',
        'Characters',
        'atlas, keep the layout',
        () => window.RGSURV && RGSURV.tex && RGSURV.tex(),
        RSTEX.map
      );
    if (window.MFZ_FIRE_TEX)
      single(
        'fire_strip',
        'Fire (flipbook strip)',
        'Effects',
        MFZ_FIRE_TEX.frames + ' frames side by side',
        () => window.MFZFIRE && MFZFIRE.baseTex && MFZFIRE.baseTex(),
        MFZ_FIRE_TEX.src
      );
    return out;
  }
  TX.cats = ['Ground', 'Walls', 'Wood', 'Roofs & metal', 'Fabric & misc', 'Normal maps', 'Characters', 'Effects'];
  function texInit() {
    TX.slots = texSlots();
    TX.slots.sort((a, b) => TX.cats.indexOf(a.cat) - TX.cats.indexOf(b.cat)); // "All" reads group by group (the sort is stable)
    TX.by = {};
    TX.slots.forEach(s => (TX.by[s.id] = s));
  }
  async function texApply(id, cv) {
    const s = TX.by[id];
    if (!s) return false;
    for (let i = 0; i < 240 && !s.ready(); i++) await new Promise(r => setTimeout(r, 500)); // the world's texture arrays decode after start-up
    if (!s.ready()) return false;
    await s.put(cv);
    delete TX.thumbs[id];
    return true;
  }
  const IMGEXT = /\.(png|jpe?g|webp)$/i,
    IMGTYPE = {png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp'};
  TX.import = async function (files) {
    const ok = [],
      bad = [],
      notes = [];
    for (const f of files) {
      const nm = f.name || '(unnamed)';
      try {
        const m = IMGEXT.exec(nm);
        if (!m) {
          bad.push(nm + ': not a .png, .jpg or .webp file');
          continue;
        }
        const base = nm.replace(IMGEXT, ''),
          id = TX.by[base] ? base : TX.by[base.toLowerCase()] ? base.toLowerCase() : null;
        if (!id) {
          bad.push(nm + ': no texture has the ID "' + base + '" (export the defaults to see every name)');
          continue;
        }
        if (f.size > LIM.texFile) {
          bad.push(nm + ': file is larger than ' + sizeTxt(LIM.texFile));
          continue;
        }
        const buf = await f.arrayBuffer(),
          type = IMGTYPE[m[1].toLowerCase()],
          img = await decodeFile(buf, type),
          w = img.naturalWidth,
          h = img.naturalHeight;
        if (!w || !h || w > LIM.texPx || h > LIM.texPx) {
          bad.push(nm + ': unreadable image or larger than ' + LIM.texPx + ' px');
          continue;
        }
        const world = !!(window.RGTEX && (RGTEX.names.includes(id) || RGTEX.names.includes(id.replace(/_n$/, ''))));
        if (world && (w !== h || w !== RGTEX.size))
          notes.push(
            nm +
              ' is ' +
              w +
              ' × ' +
              h +
              ': resized to ' +
              RGTEX.size +
              ' × ' +
              RGTEX.size +
              (w !== h ? ' (stretched)' : '')
          );
        const cv = toCanvas(img);
        if (!(await texApply(id, cv))) {
          bad.push(nm + ': the game has not finished loading that texture yet, try again in a moment');
          continue;
        }
        TX.cu[id] = {w, h, name: nm, size: f.size};
        ok.push(id);
        dbPut('tex', id, {name: nm, type, buf});
      } catch (e) {
        bad.push(nm + ': ' + ((e && e.message) || 'could not be read'));
      }
    }
    report(
      'texMsg',
      'texture',
      ok,
      bad,
      notes.length ? '<br><span class="o">' + notes.map(esc).join('<br>') + '</span>' : ''
    );
    AS.refresh();
  };
  TX.remove = async function (id, quiet) {
    if (!TX.cu[id]) return;
    delete TX.cu[id];
    dbDel('tex', id);
    try {
      await texApply(id, null);
    } catch (e) {}
    if (!quiet) {
      say('texMsg', 'Restored the default texture for ' + esc(TX.by[id].name) + '.', 1);
      AS.refresh();
    }
  };
  TX.clear = async function () {
    const ids = Object.keys(TX.cu);
    if (!ids.length) return say('texMsg', 'There are no custom textures to clear.');
    if (!confirm('Remove all ' + ids.length + ' custom textures and restore every default texture?')) return;
    for (const id of ids) await TX.remove(id, true);
    dbClear('tex');
    say('texMsg', 'Cleared ' + ids.length + ' custom texture(s). All default textures restored.', 1);
    AS.refresh();
  };
  const toPng = c => new Promise(r => c.toBlob(r, 'image/png')).then(b => b.arrayBuffer()).then(b => new Uint8Array(b));
  const text = s => new TextEncoder().encode(s.replace(/\n/g, '\r\n'));
  TX.exportDefaults = async function () {
    say('texMsg', 'Exporting ' + TX.slots.length + ' default textures...');
    try {
      const files = [];
      let i = 0;
      for (const s of TX.slots) {
        files.push({name: s.id + '.png', data: await toPng(await s.def())});
        if (++i % 12 === 0) {
          say('texMsg', 'Exporting default textures... ' + i + ' / ' + TX.slots.length);
          await new Promise(r => setTimeout(r, 0));
        }
      }
      files.push({
        name: 'README.txt',
        data: text(
          'MINI FORT ZOMBIE - default textures\n\n' +
            'Edit any of these, keep the file name, and bring it back with Options > Game Assets > Custom Textures > Import textures.\n' +
            'PNG, JPG and WebP are accepted. Limits: ' +
            sizeTxt(LIM.texFile) +
            ' a file, ' +
            LIM.texPx +
            ' x ' +
            LIM.texPx +
            ' px.\n\n' +
            'ID (file name)            What it is                              Notes\n' +
            TX.slots.map(s => (s.id + '.png').padEnd(26) + s.name.padEnd(40) + s.hint.replace(/×/g, 'x')).join('\n') +
            '\n\nWorld surfaces (' +
            TX.slots.filter(s => !/Characters|Effects|Normal/.test(s.cat)).length +
            ' of them) are 512 x 512 and repeat across walls and ground: make them tile.\n' +
            '"<name>_n.png" is the normal map of the same surface: only red and green are read. Ambient occlusion and roughness stay the game\'s.\n' +
            'The game tints every surface towards the colour of the building it is on, so detail and contrast carry over more than hue.\n' +
            'Character textures are atlases: paint over the default, do not move the parts. The UV guide is assets/zombie/zombie_uv_template.png.\n' +
            'Not replaceable here: props, furniture, vehicles, weapons, the sky, the user interface.\n'
        )
      });
      saveBlob(makeZip(files), 'default_textures.zip');
      say(
        'texMsg',
        'Exported ' +
          (files.length - 1) +
          ' default textures to default_textures.zip (with a README listing every name). Custom overrides were NOT used.',
        1
      );
    } catch (e) {
      say('texMsg', 'Export failed: ' + esc((e && e.message) || e), 0, 1);
    }
  };
  async function texLoadSaved() {
    try {
      const all = await dbAll('tex');
      for (const [id, v] of all) {
        if (!TX.by[id]) continue;
        try {
          const img = await decodeFile(v.buf, v.type);
          TX.cu[id] = {w: img.naturalWidth, h: img.naturalHeight, name: v.name, size: v.buf.byteLength};
          texApply(id, toCanvas(img)).then(ok => {
            if (!ok) delete TX.cu[id];
          });
        } catch (e) {
          dbDel('tex', id);
        }
      }
    } catch (e) {
      persistOK = false;
    }
  }
  async function texThumb(id, cv) {
    try {
      let t = TX.thumbs[id];
      if (!t) {
        const s = TX.by[id];
        let src;
        if (TX.cu[id]) {
          const v = (await dbDo('tex', 'readonly', st => st.get(id)).catch(() => null)) || null;
          src = v ? await decodeFile(v.buf, v.type) : await s.def();
        } else src = await s.def();
        const w = src.naturalWidth || src.width,
          h = src.naturalHeight || src.height,
          k = Math.min(56 / w, 48 / h);
        t = TX.thumbs[id] = toCanvas(src, Math.max(4, Math.round(w * k)), Math.max(4, Math.round(h * k)));
      }
      cv.width = t.width;
      cv.height = t.height;
      cv.getContext('2d').drawImage(t, 0, 0);
    } catch (e) {}
  }

  /* =====================================================================================================
     SOUNDS
     ===================================================================================================== */
  const SN = (window.MFZSND = {slots: [], by: {}, cu: {}, O: {}});
  const hasAudio = () => typeof AC !== 'undefined' && !!AC;
  const P3 = {x: 0, z: 0};
  /* fn: the S function wrapped; when(args): is this call that slot's variant; pos: index of the position argument (-1: none);
     range: metres the game uses for that sound; dur: seconds rendered by "Export default sounds"; args: what the export calls it with */
  const ANY = () => true; // the catch-all variant of a function: tried last
  const SFXT = [
    ['groan', 'Zombie groan', 'Zombies', 'groan', null, 0, 35, 2.4, []],
    ['snarl', 'Zombie snarl (it has seen you)', 'Zombies', 'snarl', null, 0, 30, 0.9, []],
    ['lost', 'Zombie loses your trail', 'Zombies', 'lost', null, 0, 35, 2.6, []],
    ['zbash_door', 'Zombie bashes a door', 'Zombies', 'zbash', a => a[0] === 'door', 1, 35, 0.7, ['door']],
    ['zbash_win', 'Zombie bashes a window', 'Zombies', 'zbash', a => a[0] === 'win', 1, 35, 0.7, ['win']],
    ['zbash_bar', 'Zombie bashes a barricade', 'Zombies', 'zbash', ANY, 1, 35, 0.7, ['bar']],
    ['zclaw', 'Zombie claws or bites a person', 'Zombies', 'zclaw', null, 0, 30, 0.6, []],
    ['die', 'Zombie dies', 'Zombies', 'die', null, 0, 40, 1.6, []],
    ['shot_pistol', 'Gunshot: pistol', 'Weapons', 'shot', ANY, 1, 100, 1.0, ['pistol']],
    ['shot_revolver', 'Gunshot: revolver', 'Weapons', 'shot', a => a[0] === 'revolver', 1, 100, 1.2, ['revolver']],
    ['shot_magnum', 'Gunshot: magnum', 'Weapons', 'shot', a => a[0] === 'magnum', 1, 100, 1.2, ['magnum']],
    ['shot_smg', 'Gunshot: SMG', 'Weapons', 'shot', a => a[0] === 'smg', 1, 100, 0.8, ['smg']],
    ['shot_rifle', 'Gunshot: rifle', 'Weapons', 'shot', a => a[0] === 3 || a[0] === 'rifle', 1, 100, 1.2, ['rifle']],
    [
      'shot_shotgun',
      'Gunshot: shotgun',
      'Weapons',
      'shot',
      a => a[0] === 2 || a[0] === 'shotgun',
      1,
      100,
      1.5,
      ['shotgun']
    ],
    ['shot_heavy', 'Gunshot: heavy weapon', 'Weapons', 'shot', a => a[0] === 'heavy', 1, 100, 1.6, ['heavy']],
    ['reload_pistol', 'Reload: magazine (pistol)', 'Weapons', 'reload', a => a[0] === 1, -1, 0, 1.4, [1]],
    ['reload_shotgun', 'Reload: shells (shotgun)', 'Weapons', 'reload', a => a[0] === 2, -1, 0, 2.6, [2]],
    ['reload_rifle', 'Reload: rifle and others', 'Weapons', 'reload', ANY, -1, 0, 2.3, [0]],
    ['dryfire', 'Empty gun click', 'Weapons', 'click', null, -1, 0, 0.4, []],
    ['swap', 'Switch weapon', 'Weapons', 'swap', null, -1, 0, 0.5, [1]],
    ['swing', 'Melee swing', 'Weapons', 'swing', null, 1, 30, 0.6, [0]],
    ['hit_blunt', 'Melee hit: blunt', 'Weapons', 'hit', ANY, 1, 40, 0.6, ['blunt']],
    ['hit_blade', 'Melee hit: blade', 'Weapons', 'hit', a => a[0] === 'blade', 1, 40, 0.6, ['blade']],
    ['hit_fist', 'Melee hit: fist', 'Weapons', 'hit', a => a[0] === 'fist', 1, 40, 0.5, ['fist']],
    ['hit_metal', 'Melee hit: metal', 'Weapons', 'hit', a => a[0] === 'metal', 1, 40, 0.6, ['metal']],
    ['hitmarker', 'Hit marker', 'Weapons', 'hm', null, -1, 0, 0.3, [0]],
    ['door_open', 'Door opens', 'World', 'door', a => !!a[0], 1, 30, 0.9, [1]],
    ['door_close', 'Door closes', 'World', 'door', a => !a[0], 1, 30, 0.6, [0]],
    ['glass', 'Glass breaks', 'World', 'glass', null, 0, 50, 1.2, []],
    ['splash_small', 'Water: bullet or object splash', 'World', 'splash', a => !a[0], 1, 40, 0.8, [false]],
    ['splash_big', 'Water: heavy splash', 'World', 'splash', ANY, 1, 55, 1.0, [true]],
    ['wade_shallow', 'Water: wading step (shallow)', 'World', 'wade', a => !a[0], 1, 28, 0.5, [false]],
    ['wade_deep', 'Water: wading step (deep)', 'World', 'wade', ANY, 1, 28, 0.7, [true]],
    ['hurt', 'Player is hurt', 'People', 'hurt', null, -1, 0, 0.7, []],
    ['voice', 'Survivor voice', 'People', 'voice', null, 0, 30, 1.0, []],
    ['scream', 'Scream', 'People', 'scream', null, 0, 50, 1.6, []],
    ['ui', 'Menu click', 'Interface', 'ui', null, -1, 0, 0.3, []],
    ['bird', 'Birdsong (day)', 'Ambience', '@bird', null, -2, 50, 1.2, []],
    ['spook', 'Distant eerie sound', 'Ambience', '@spook', null, -2, 90, 3.6, []]
  ].map(r => ({id: r[0], name: r[1], cat: r[2], fn: r[3], when: r[4], pos: r[5], range: r[6], dur: r[7], args: r[8]}));
  const MUSIC = [
    {id: 'music_menu', name: 'Main menu music', cat: 'Music', music: 'menu', dur: 0},
    {id: 'music_game', name: 'In-game music (fort and town)', cat: 'Music', music: 'game', dur: 60},
    {id: 'music_siege', name: 'Siege music', cat: 'Music', music: 'siege', dur: 24}
  ];
  SN.slots = SFXT.concat(MUSIC);
  SN.slots.forEach(s => (SN.by[s.id] = s));
  SN.cats = ['Zombies', 'Weapons', 'World', 'People', 'Interface', 'Ambience', 'Music'];
  const MENU_DEFAULT = 'assets/audio/FZTrioxin.mp3';

  /* ---- playing a custom sound effect ---- */
  let lastGroan = 0;
  function playCustom(slot, c, p) {
    if (!hasAudio() || !c.bufs || !c.bufs.length) return false;
    let o;
    if (slot.pos === -2) {
      // ambience: somewhere round the player, scaled by the ambience volume like the originals
      const r = slot.range * 0.6;
      o = out(
        {x: pl.position.x + (Math.random() * 2 - 1) * r, z: pl.position.z + (Math.random() * 2 - 1) * r},
        slot.range
      );
      if (o && typeof AV !== 'undefined') o.gain.value *= AV;
    } else o = slot.pos >= 0 && p ? out(p, slot.range) : out();
    if (!o) return true; // out of earshot: the original would have been silent too
    if (slot.id === 'groan') {
      if (AC.currentTime < lastGroan) return true;
      lastGroan = AC.currentTime + 0.3;
    }
    const src = AC.createBufferSource();
    src.buffer = c.bufs[Math.floor(Math.random() * c.bufs.length)];
    if (slot.cat === 'Zombies' || slot.cat === 'Weapons') src.playbackRate.value = 0.97 + Math.random() * 0.06;
    src.connect(o);
    src.start();
    return true;
  }
  function hookSounds() {
    if (typeof S === 'undefined') return;
    const byFn = {};
    SFXT.forEach(s => (byFn[s.fn] = byFn[s.fn] || []).push(s));
    Object.keys(byFn).forEach(fn => {
      // specific variants first, the catch-all (when: ANY, or no test) last
      const list = byFn[fn].slice().sort((a, b) => (a.when === ANY ? 1 : 0) - (b.when === ANY ? 1 : 0));
      const amb = fn[0] === '@',
        name = amb ? fn.slice(1) : fn,
        orig = amb ? window[name] : S[name];
      if (typeof orig !== 'function') return;
      SN.O[fn] = orig;
      const wrap = function () {
        let a = arguments;
        if (fn === 'shot' && a[0] && typeof a[0] === 'object') a = ['pistol', a[0]]; // S.shot(p): a position only
        const slot = list.find(s => !s.when || s.when(a)),
          c = slot && SN.cu[slot.id];
        if (c && c.bufs && c.bufs.length)
          try {
            if (playCustom(slot, c, slot.pos >= 0 ? a[slot.pos] : null)) return;
          } catch (e) {}
        return orig.apply(this, arguments);
      };
      if (amb) window[name] = wrap;
      else S[name] = wrap;
    });
  }
  /* ---- music: a looping stream into the game's music channel ---- */
  const MU = {el: {}, node: {}, gain: {}};
  SN.musicFor = mm => !!(SN.cu['music_' + mm] && SN.cu['music_' + mm].url && mm !== 'menu');
  function musicTick() {
    if (!hasAudio() || typeof MUS === 'undefined' || !MUS) return;
    const mode = typeof musMode !== 'undefined' ? musMode : '';
    for (const m of ['game', 'siege']) {
      const id = 'music_' + m,
        c = SN.cu[id],
        want = !!(c && c.url) && mode === m;
      if (c && c.url && !MU.el[id]) {
        try {
          const el = new Audio(c.url);
          el.loop = true;
          el.preload = 'auto';
          const node = AC.createMediaElementSource(el),
            g = AC.createGain();
          g.gain.value = 0;
          node.connect(g);
          g.connect(MUS);
          MU.el[id] = el;
          MU.node[id] = node;
          MU.gain[id] = g;
        } catch (e) {
          c.url = null;
        }
      }
      const el = MU.el[id];
      if (!el) continue;
      const g = MU.gain[id];
      g.gain.setTargetAtTime(want ? 1 : 0, AC.currentTime, 0.7);
      if (want && el.paused) {
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
      } else if (!want && !el.paused && g.gain.value < 0.01) el.pause();
    }
  }
  function musicDrop(id) {
    const el = MU.el[id];
    if (el) {
      try {
        el.pause();
        MU.node[id].disconnect();
        MU.gain[id].disconnect();
      } catch (e) {}
      delete MU.el[id];
      delete MU.node[id];
      delete MU.gain[id];
    }
  }
  function menuTrack(url) {
    const M = window.MENUMUSIC;
    if (!M || !M.audio) return;
    const was = !M.audio.paused;
    M.audio.src = url || MENU_DEFAULT;
    if (was) {
      const p = M.audio.play();
      if (p && p.catch) p.catch(() => {});
    }
  }
  /* ---- decoding ---- */
  function sniff(u) {
    const tag = (o, s) => [...s].every((ch, i) => u[o + i] === ch.charCodeAt(0));
    if (u.length > 12 && tag(0, 'RIFF') && tag(8, 'WAVE')) return 'wav';
    if (u.length > 4 && (tag(0, 'ID3') || (u[0] === 0xff && (u[1] & 0xe0) === 0xe0))) return 'mp3';
    return null;
  }
  const decode = buf =>
    new Promise((res, rej) => {
      try {
        const p = AC.decodeAudioData(buf.slice(0), res, rej);
        if (p && p.catch) p.catch(rej);
      } catch (e) {
        rej(e);
      }
    });
  async function sndBuild(id) {
    // (re)build the playable form of a slot from its stored files
    const c = SN.cu[id],
      slot = SN.by[id];
    if (!c || !slot) return;
    if (slot.music) {
      if (c.url) URL.revokeObjectURL(c.url);
      musicDrop(id);
      const f = c.files[id];
      c.url = f ? URL.createObjectURL(new Blob([f.buf], {type: f.type})) : null;
      if (slot.music === 'menu') menuTrack(c.url);
      return;
    }
    if (!hasAudio()) return (c.pending = true);
    c.pending = false;
    const bufs = [];
    for (const k of Object.keys(c.files).sort())
      try {
        bufs.push(await decode(c.files[k].buf));
      } catch (e) {}
    c.bufs = bufs;
  }
  const AUDEXT = /\.(mp3|wav)$/i;
  function audioMeta(buf, type) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(new Blob([buf], {type})),
        a = new Audio(),
        done = (f, v) => {
          clearTimeout(t);
          URL.revokeObjectURL(u);
          f(v);
        },
        t = setTimeout(() => done(rej, new Error('the browser could not read it as audio')), 10000);
      a.preload = 'metadata';
      a.onloadedmetadata = () => done(res, a.duration);
      a.onerror = () => done(rej, new Error('the browser could not read it as audio'));
      a.src = u;
    });
  }
  SN.import = async function (files) {
    const ok = [],
      bad = [],
      notes = [];
    try {
      if (typeof initAudio === 'function') initAudio(); // importing is a click, so the browser lets audio start
    } catch (e) {}
    for (const f of files) {
      const nm = f.name || '(unnamed)';
      try {
        const m = AUDEXT.exec(nm);
        if (!m) {
          bad.push(nm + ': not an .mp3 or .wav file');
          continue;
        }
        let base = nm.replace(AUDEXT, '').toLowerCase(),
          key = base,
          id = SN.by[base] ? base : null;
        if (!id) {
          const v = /^(.*)_([2-9])$/.exec(base);
          if (v && SN.by[v[1]]) id = v[1];
        }
        if (!id) {
          bad.push(nm + ': no sound has the ID "' + base + '" (export the defaults to see every name)');
          continue;
        }
        const slot = SN.by[id];
        if (slot.music && key !== id) {
          bad.push(nm + ': music slots take one file, not variants');
          continue;
        }
        const lim = slot.music ? LIM.musFile : LIM.sfxFile;
        if (f.size > lim) {
          bad.push(
            nm +
              ': ' +
              sizeTxt(f.size) +
              ' is over the ' +
              sizeTxt(lim) +
              ' limit for ' +
              (slot.music ? 'music' : 'a sound effect')
          );
          continue;
        }
        const buf = await f.arrayBuffer(),
          kind = sniff(new Uint8Array(buf, 0, Math.min(16, buf.byteLength)));
        if (!kind) {
          bad.push(nm + ': not a valid MP3 or WAV file (the content does not match)');
          continue;
        }
        const type = kind === 'wav' ? 'audio/wav' : 'audio/mpeg';
        let secs;
        if (slot.music) secs = await audioMeta(buf, type);
        else {
          if (!hasAudio()) {
            bad.push(nm + ': audio is not running yet - click anywhere in the game and import again');
            continue;
          }
          let ab;
          try {
            ab = await decode(buf);
          } catch (e) {
            bad.push(nm + ': could not be decoded (use uncompressed PCM WAV or MP3)');
            continue;
          }
          secs = ab.duration;
          if (secs > LIM.sfxSec) {
            bad.push(
              nm + ': ' + secs.toFixed(1) + ' s is longer than the ' + LIM.sfxSec + ' s limit for a sound effect'
            );
            continue;
          }
          if (ab.sampleRate > 48000 || ab.numberOfChannels > 2)
            notes.push(nm + ': played as ' + AC.sampleRate + ' Hz, at most stereo');
        }
        const c = SN.cu[id] || (SN.cu[id] = {files: {}});
        c.files[key] = {name: nm, type, buf, secs};
        await sndBuild(id);
        ok.push(key);
        dbPut('snd', key, {id, name: nm, type, buf, secs});
      } catch (e) {
        bad.push(nm + ': ' + ((e && e.message) || 'could not be read'));
      }
    }
    report(
      'sndMsg',
      'sound',
      ok,
      bad,
      notes.length ? '<br><span class="o">' + notes.map(esc).join('<br>') + '</span>' : ''
    );
    AS.refresh();
  };
  SN.remove = function (id, quiet) {
    const c = SN.cu[id];
    if (!c) return;
    Object.keys(c.files).forEach(k => dbDel('snd', k));
    if (c.url) URL.revokeObjectURL(c.url);
    musicDrop(id);
    delete SN.cu[id];
    if (id === 'music_menu') menuTrack(null);
    if (!quiet) {
      say('sndMsg', 'Restored the default sound for ' + esc(SN.by[id].name) + '.', 1);
      AS.refresh();
    }
  };
  SN.clear = function () {
    const ids = Object.keys(SN.cu);
    if (!ids.length) return say('sndMsg', 'There are no custom sounds to clear.');
    if (!confirm('Remove all custom sounds and music (' + ids.length + ') and restore every default sound?')) return;
    ids.forEach(id => SN.remove(id, true));
    dbClear('snd');
    say('sndMsg', 'Cleared ' + ids.length + ' custom sound(s). All default sounds restored.', 1);
    AS.refresh();
  };
  async function sndLoadSaved() {
    try {
      for (const [key, v] of await dbAll('snd')) {
        if (!SN.by[v.id]) continue;
        const c = SN.cu[v.id] || (SN.cu[v.id] = {files: {}});
        c.files[key] = {name: v.name, type: v.type, buf: v.buf, secs: v.secs};
      }
      for (const id of Object.keys(SN.cu)) await sndBuild(id);
    } catch (e) {
      persistOK = false;
    }
  }
  /* audio only exists after the first key press or click: decode what was waiting for it, and keep the music in step */
  setInterval(() => {
    if (hasAudio()) for (const id of Object.keys(SN.cu)) if (SN.cu[id].pending) sndBuild(id);
    try {
      musicTick();
    } catch (e) {}
  }, 300);

  /* ---- export: render the synths to WAV ---- */
  function wav(ch, sr) {
    const n = ch.length,
      b = new DataView(new ArrayBuffer(44 + n * 2)),
      w = (o, s) => [...s].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF');
    b.setUint32(4, 36 + n * 2, true);
    w(8, 'WAVEfmt ');
    b.setUint32(16, 16, true);
    b.setUint16(20, 1, true);
    b.setUint16(22, 1, true);
    b.setUint32(24, sr, true);
    b.setUint32(28, sr * 2, true);
    b.setUint16(32, 2, true);
    b.setUint16(34, 16, true);
    w(36, 'data');
    b.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) b.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i])) * 32767, true);
    return new Uint8Array(b.buffer);
  }
  async function renderDefault(slot) {
    const sr = 44100,
      OC = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, Math.ceil(sr * slot.dur), sr),
      bus = OC.createGain();
    bus.connect(OC.destination);
    let off = 0;
    // the synths ask AC for the time and for their nodes: hand them the offline context, with a clock we can move
    const proxy = new Proxy(OC, {
      get(t, k) {
        if (k === 'currentTime') return off;
        const v = t[k];
        return typeof v === 'function' ? v.bind(t) : v;
      }
    });
    const keep = {AC, SFX, MUS, out, aT: Object.assign({}, aT)};
    AC = proxy;
    SFX = bus;
    MUS = bus;
    out = () => bus; // no distance, no panning
    try {
      aT.g = 0;
      aT.w = 0;
      if (slot.music) {
        let t = 0;
        while (t < slot.dur - 7) {
          off = t;
          t += musicNotes(slot.music);
        }
      } else SN.O[slot.fn].apply(S, slot.args);
    } finally {
      AC = keep.AC;
      SFX = keep.SFX;
      MUS = keep.MUS;
      out = keep.out;
      Object.assign(aT, keep.aT);
    }
    const buf = await OC.startRendering(),
      d = buf.getChannelData(0);
    let end = d.length - 1;
    while (end > 0 && Math.abs(d[end]) < 0.0015) end--;
    return wav(d.subarray(0, Math.min(d.length, Math.max(Math.ceil(sr * 0.12), end + Math.ceil(sr * 0.06)))), sr);
  }
  SN.exportDefaults = async function () {
    try {
      if (typeof initAudio === 'function') initAudio();
    } catch (e) {}
    if (!hasAudio()) return say('sndMsg', 'Audio is not running yet - click anywhere in the game and try again.', 0, 1);
    say('sndMsg', 'Rendering ' + SN.slots.length + ' default sounds...');
    try {
      const files = [],
        skipped = [];
      for (const s of SN.slots) {
        if (s.music === 'menu') {
          try {
            const r = await fetch(MENU_DEFAULT);
            if (!r.ok) throw 0;
            files.push({name: 'music_menu.mp3', data: new Uint8Array(await r.arrayBuffer())});
          } catch (e) {
            skipped.push(
              'music_menu: the browser does not let the game read its own files here; the track is ' +
                MENU_DEFAULT +
                ' in the game folder'
            );
          }
          continue;
        }
        try {
          files.push({name: s.id + '.wav', data: await renderDefault(s)});
        } catch (e) {
          skipped.push(s.id + ': ' + ((e && e.message) || e));
        }
      }
      files.push({
        name: 'README.txt',
        data: text(
          'MINI FORT ZOMBIE - default sounds\n\n' +
            'The game makes its sounds with code, so these WAV files are recordings of that code (each export differs a little).\n' +
            'Replace any of them: keep the file name, use .wav or .mp3, and bring it back with Options > Game Assets > Custom Sounds > Import sounds.\n' +
            'Variants: add _2 to _9 to the name (groan.wav, groan_2.wav, groan_3.mp3) and the game picks one at random.\n\n' +
            'Limits\n' +
            '  Sound effects: ' +
            sizeTxt(LIM.sfxFile) +
            ' and ' +
            LIM.sfxSec +
            ' seconds a file. Music: ' +
            sizeTxt(LIM.musFile) +
            ' a track, any length, loops.\n' +
            '  MP3: MPEG-1/2 Layer III, constant or variable bit rate, 32 to 320 kbps. WAV: uncompressed PCM, 8, 16 or 24 bit or 32 bit float.\n' +
            "  Mono or stereo. Any sample rate is accepted and converted to the sound card's rate (usually 48 kHz), so more than 48 kHz gains nothing.\n" +
            '  MP3 files start and end with a few hundredths of a second of silence: use WAV for sharp sounds (gunshots) and for music that must loop without a gap.\n' +
            '  Sounds with a place in the world (zombies, shots, doors) are faded by distance and panned by the game: mono, dry and loud works best.\n' +
            '  The game does not level volumes: match yours to these defaults.\n\n' +
            'ID (file name)        What it is\n' +
            SN.slots.map(s => (s.id + (s.music === 'menu' ? '.mp3' : '.wav')).padEnd(22) + s.name).join('\n') +
            (skipped.length ? '\n\nNot exported\n' + skipped.join('\n') : '') +
            '\n'
        )
      });
      saveBlob(makeZip(files), 'default_sounds.zip');
      say(
        'sndMsg',
        'Exported ' +
          (files.length - 1) +
          " default sounds to default_sounds.zip (WAV recordings of the game's synthesised sounds, with a README). Custom overrides were NOT used." +
          (skipped.length ? '<br><span class="o">' + skipped.map(esc).join('<br>') + '</span>' : ''),
        1
      );
    } catch (e) {
      say('sndMsg', 'Export failed: ' + esc((e && e.message) || e), 0, 1);
    }
  };
  /* ---- preview (the play button on a tile) ---- */
  let pv = null;
  SN.preview = function (id) {
    const slot = SN.by[id],
      c = SN.cu[id];
    try {
      if (typeof initAudio === 'function') initAudio();
    } catch (e) {}
    if (pv) {
      pv.pause();
      pv = null;
      if (slot.music) return;
    }
    if (slot.music) {
      const src = c && c.url ? c.url : slot.music === 'menu' ? MENU_DEFAULT : null;
      if (src) {
        pv = new Audio(src);
        pv.volume = 0.7;
        const p = pv.play();
        if (p && p.catch) p.catch(() => {});
        const me = pv;
        setTimeout(() => {
          if (pv === me) {
            me.pause();
            pv = null;
          }
        }, 12000);
      } else if (hasAudio()) for (let i = 0; i < 3; i++) setTimeout(() => musicNotes(slot.music), i * 700);
      return;
    }
    if (!hasAudio()) return;
    if (c && c.bufs && c.bufs.length) {
      const src = AC.createBufferSource();
      src.buffer = c.bufs[Math.floor(Math.random() * c.bufs.length)];
      src.connect(out());
      src.start();
    } else {
      const keepG = aT.g;
      aT.g = 0; // the groan's own rate limit
      try {
        SN.O[slot.fn].apply(S, slot.args);
      } finally {
        aT.g = keepG;
      }
    }
  };

  /* =====================================================================================================
     OPTIONS PAGE: three headings, one open at a time; paged tiles like the icons
     ===================================================================================================== */
  const VIEW = {
    tex: {cat: '', page: 0, list: 'texList', pager: 'texPager', chips: 'texCats', count: 'texCount', head: 'astCntTex'},
    snd: {cat: '', page: 0, list: 'sndList', pager: 'sndPager', chips: 'sndCats', count: 'sndCount', head: 'astCntSnd'}
  };
  function counts() {
    const set = (id, t) => {
      const e = $(id);
      if (e) e.textContent = t;
    };
    if (typeof ICU !== 'undefined' && typeof ITEM_ORDER !== 'undefined')
      set('astCntIco', Object.keys(ICU).length + ' / ' + ITEM_ORDER.length + ' custom');
    const nt = Object.keys(TX.cu).length,
      ns = Object.keys(SN.cu).length;
    set('astCntTex', nt + ' / ' + TX.slots.length + ' custom');
    set('texCount', nt + ' / ' + TX.slots.length + ' custom');
    set('astCntSnd', ns + ' / ' + SN.slots.length + ' custom');
    set('sndCount', ns + ' / ' + SN.slots.length + ' custom');
  }
  function render(kind) {
    const V = VIEW[kind],
      L = $(V.list),
      C = $(V.chips);
    if (!L) return;
    const M = kind === 'tex' ? TX : SN;
    if (C) {
      C.innerHTML = '';
      [['', 'All']]
        .concat(M.cats.filter(k => M.slots.some(s => s.cat === k)).map(k => [k, k]))
        .concat([['*', 'Custom only']])
        .forEach(([k, lab]) => {
          const b = document.createElement('button');
          b.textContent = lab;
          b.classList.toggle('on', k === V.cat);
          b.onclick = () => {
            V.cat = k;
            V.page = 0;
            render(kind);
          };
          C.appendChild(b);
        });
    }
    if (!L.offsetParent) return;
    const items = M.slots.filter(s => !V.cat || (V.cat === '*' ? !!M.cu[s.id] : s.cat === V.cat));
    L.innerHTML = '';
    const W = L.clientWidth,
      H = L.clientHeight,
      cols = Math.max(1, Math.floor((W + 8) / (232 + 8))),
      rh = 64,
      rows = Math.max(1, Math.floor((H + 8) / (rh + 8))),
      per = cols * rows,
      pages = Math.max(1, Math.ceil(items.length / per));
    V.page = Math.min(V.page, pages - 1);
    L.style.setProperty('--ic', cols);
    L.style.setProperty('--ir', rh + 'px');
    if (!items.length) {
      const e = document.createElement('div');
      e.className = 'astEmpty';
      e.textContent = V.cat === '*' ? 'Nothing custom yet. Import files to replace the defaults.' : 'Nothing here.';
      L.appendChild(e);
    }
    items.slice(V.page * per, V.page * per + per).forEach(s => {
      const cu = M.cu[s.id],
        t = document.createElement('div'),
        th = document.createElement('div'),
        tx = document.createElement('div'),
        st = document.createElement('div');
      t.className = 'icoTile' + (cu ? ' cu' : '');
      th.className = 'ith';
      tx.style.minWidth = '0';
      st.className = 'ist';
      let sub;
      if (kind === 'tex') {
        const cv = canvas(8, 8);
        th.appendChild(cv);
        texThumb(s.id, cv);
        sub = s.id + '.png · ' + (cu ? cu.w + ' × ' + cu.h : s.hint);
        st.textContent = cu ? 'Custom' : 'Default';
      } else {
        const b = document.createElement('button');
        b.className = 'astPlay';
        b.innerHTML = '&#9654;';
        b.title = 'Play the ' + (cu ? 'custom' : 'default') + ' sound';
        b.onclick = () => SN.preview(s.id);
        th.appendChild(b);
        const n = cu ? Object.keys(cu.files).length : 0,
          f0 = cu && cu.files[Object.keys(cu.files).sort()[0]];
        sub = cu
          ? esc(f0.name) +
            (n > 1 ? ' +' + (n - 1) : '') +
            (f0.secs
              ? ' · ' +
                (f0.secs >= 60
                  ? Math.floor(f0.secs / 60) + ':' + String(Math.floor(f0.secs % 60)).padStart(2, '0')
                  : f0.secs.toFixed(1) + ' s')
              : '')
          : s.id + (s.music ? '.mp3 / .wav' : '.wav / .mp3');
        st.textContent = cu
          ? n > 1
            ? n + ' variants'
            : 'Custom'
          : s.music && s.music !== 'menu'
            ? 'Default (generated)'
            : 'Default';
      }
      tx.innerHTML = '<b title="' + esc(s.name) + '">' + esc(s.name) + '</b><small>' + sub + '</small>';
      if (cu) {
        const b = document.createElement('button');
        b.textContent = 'Remove';
        b.onclick = () => (kind === 'tex' ? TX.remove(s.id) : SN.remove(s.id));
        st.appendChild(b);
      }
      tx.appendChild(st);
      t.append(th, tx);
      L.appendChild(t);
    });
    if (window.MFZUI && MFZUI.pager)
      MFZUI.pager($(V.pager), V.page, pages, p => {
        V.page = p;
        render(kind);
      });
  }
  AS.refresh = function () {
    counts();
    if (AS.open === 'tex' || AS.open === 'snd') render(AS.open);
    else if (AS.open === 'ico' && typeof icoList === 'function') icoList();
  };
  AS.toggle = function (k) {
    AS.open = AS.open === k ? null : k;
    document.querySelectorAll('#astAcc .astSec').forEach(s => s.classList.toggle('open', s.dataset.a === AS.open));
    const acc = $('astAcc');
    if (acc) acc.classList.toggle('has', !!AS.open);
    requestAnimationFrame(AS.refresh);
  };
  function wire() {
    const pick = (id, fn) => {
      const e = $(id);
      if (e)
        e.onchange = ev => {
          const f = [...ev.target.files];
          ev.target.value = '';
          if (f.length) fn(f);
        };
    };
    pick('texFile', TX.import);
    pick('sndFile', SN.import);
    document
      .querySelectorAll('#astAcc details')
      .forEach(d => d.addEventListener('toggle', () => requestAnimationFrame(AS.refresh)));
    document.addEventListener(
      'wheel',
      e => {
        for (const k of ['tex', 'snd']) {
          const L = $(VIEW[k].list);
          if (L && L.offsetParent && L.contains(e.target)) {
            const pg = $(VIEW[k].pager).querySelectorAll('button');
            if (!pg.length) return;
            e.preventDefault();
            (e.deltaY > 0 ? pg[1] : pg[0]).click();
          }
        }
      },
      {passive: false}
    );
    addEventListener('resize', () => requestAnimationFrame(AS.refresh));
    const _ot = window.optTab;
    window.optTab = function (t) {
      const r = _ot.apply(this, arguments);
      if (t === 'I' || (!t && $('optI') && !$('optI').classList.contains('hide'))) requestAnimationFrame(AS.refresh);
      return r;
    };
    // the icon count on its heading follows the icon list
    if (typeof iconsChanged === 'function') {
      const _ic = iconsChanged;
      iconsChanged = function () {
        const r = _ic.apply(this, arguments);
        counts();
        return r;
      };
    }
  }
  texInit();
  hookSounds();
  wire();
  texLoadSaved().then(counts);
  sndLoadSaved().then(counts);
  counts();
  console.log(
    '[assets] custom textures (' + TX.slots.length + ' slots) and custom sounds (' + SN.slots.length + ' slots) ready'
  );
})();
