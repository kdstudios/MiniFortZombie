/* ==========================================================================================================
   MINI FORT ZOMBIE - PLOT TWIST CEMETERY (v084; on the lot kit): the full-block cemetery. Replaces the core 'cemetery' yard.
   Outside: wrought-iron railings with spear tips on a stone kerb between ashlar piers (front and sides), a dry-stone back wall with
   ivy, ashlar gate piers with urn finials, double iron gates (one swung open) under a scrolled iron arch with the cemetery name;
   gravel paths (main avenue, cross walk, a ring round the war memorial obelisk), old iron lamp posts, benches, a stone birdbath,
   cedars at the gate, dead trees and red maples; a classical mausoleum (portico, four columns, pediment, bronze doors) beside a
   giant praying-hands statue; a sealed gothic family vault; the groundskeeper's shed with a lean-to, wheelbarrow and tools.
   Graves (about 150): rounded, gothic, ogee, square and slant headstones, crosses, Celtic crosses, angels on pedestals,
   obelisks, table tombs, ledger slabs, flat markers, children's lambs, family plots with stone kerbs and chains; leaning,
   sunken, broken and toppled stones, wreaths, flowers, grave lanterns; fresh mounds; open dug graves and burst-open graves
   (with lootable coffins).
   Inside the mausoleum: marble floor, wall of crypt niches with name plates and urns, two carved sarcophagi, a stone altar
   with candles and a funeral urn, stained-glass oculus. Inside the shed: tool chest, workbench, shelves, sacks.
   Loot: 'cemetery' (coffins, funeral urns, random), 'hardware' (shed tool chest / toolbox).
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[cemetery] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // mausoleum (walls on centre lines)
  const MX0 = -13.2,
    MX1 = -5.8,
    MZ0 = -14.4,
    MZ1 = -7.8,
    MH = 4.2,
    MCX = (MX0 + MX1) / 2,
    PORT = 1.8; // portico depth in front of the facade
  // groundskeeper's shed
  const SX0 = 14.2,
    SX1 = 18.6,
    SZ0 = -17.2,
    SZ1 = -13.6,
    SH = 2.7;
  // family vault (solid)
  const VX = 10.6,
    VZ = -14.2;
  const FZ = 15.2, // front railing line
    GW = 1.9; // gate pier offset from the centre line
  const PATHW = 2.4, // main avenue width
    CZ = 1.2, // cross walk centre z
    RING = 3.0; // memorial ring radius (centre 0, CZ)

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      lawn: () => K.surf('lawn', 0x5a5a34),
      lawnD: () => K.surf('lawn', 0x46462a),
      humus: () => K.surf('humus', 0x5a4632),
      dirt: () => K.surf('dirt', 0x6a5238),
      gravel: () => K.surf('pathgravel', 0xb0a898),
      conc: () => K.surf('concrete', 0xa8a49c),
      ashlar: () => K.surf('ashlar', 0xa8a49a),
      ashlarD: () => K.surf('ashlar', 0x7e7a72),
      drystone: () => K.surf('drystone', 0x8a8478),
      stone: () => K.surf('stone', 0x9a9890),
      stoneD: () => K.surf('stone', 0x6e6c66),
      granite: () => K.surf('stone', 0x5a5a5e),
      marble: () =>
        K.tri(
          'cm_marble',
          (c, W, H, r) => {
            c.fillStyle = '#e4e2dc';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 26; i++) {
              c.strokeStyle = `rgba(${110 + r() * 40},${110 + r() * 40},${120 + r() * 40},${0.12 + r() * 0.2})`;
              c.lineWidth = 0.6 + r() * 1.8;
              c.beginPath();
              let x = r() * W,
                y = r() * H;
              c.moveTo(x, y);
              for (let k = 0; k < 6; k++) {
                x += (r() - 0.3) * 60;
                y += (r() - 0.5) * 50;
                c.lineTo(x, y);
              }
              c.stroke();
            }
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 0.8, r: 0.35}
        ),
      floorM: () =>
        K.tri(
          'cm_floor',
          (c, W, H, r) => {
            const n = 4,
              s = W / n;
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                c.fillStyle = (i + j) % 2 ? '#3a3a3e' : '#d8d4cc';
                c.fillRect(i * s, j * s, s, s);
                c.strokeStyle = 'rgba(40,40,40,.4)';
                c.strokeRect(i * s + 1, j * s + 1, s - 2, s - 2);
              }
            P.grime(c, W, H, r, 0.45);
          },
          {tile: 0.9, r: 0.4}
        ),
      roofSlab: () => K.surf('slate', 0x5a5a5e),
      boards: () => K.surf('boards', 0x6a5a48),
      wood: () => K.surf('wood', 0x7a5a3a),
      rust: () => K.surf('rust', 0x7a4a2a),
      ivy: () =>
        K.paint(
          'cm_ivy',
          512,
          256,
          (c, W, H, r) => {
            c.clearRect(0, 0, W, H);
            for (let i = 0; i < 900; i++) {
              const x = r() * W,
                y = H * (1 - Math.pow(r(), 0.6));
              c.fillStyle = `rgba(${30 + r() * 30},${60 + r() * 50},${20 + r() * 20},${0.75 + r() * 0.25})`;
              c.beginPath();
              c.ellipse(x, y, 3 + r() * 5, 2 + r() * 4, r() * 6, 0, PI * 2);
              c.fill();
            }
          },
          {r: 0.9, alpha: true}
        ),
      leaves: () => K.surf('humus', 0x6a4a2e)
    }[k]());
  const iron = () => K.mat(0x1c1e22, 0.55, 0.6),
    bronze = () => K.mat(0x4a5a42, 0.45, 0.7),
    brass = () => K.mat(0xb8902a, 0.35, 0.85),
    whiteM = () => K.mat(0xe8e6e0, 0.5);

  /* ===================== artwork ===================== */
  /* v089: every headstone that is standing gets its own pun name, years and a short epitaph; none repeat. The faces are cells of one
     atlas texture (one material, one draw batch) painted as a dark plate with light lettering and a black shadow, so they read on every
     stone colour. Toppled and broken stones (and the burst-open graves) carry no plate. Names are handed out in build order by
     nextName(); if a future layout ever has more standing stones than names, the extra stones are left blank rather than repeat one. */
  const NAMES = [
    ['BARRY D. HATCHET', '1902 - 1951', 'MADE PEACE AT LAST'],
    ['BARRY M. DEEP', '1915 - 1966', 'SIX FEET UNDER PAR'],
    ['DOUG GRAVES', '1888 - 1940', 'DIG THIS'],
    ['DOUG DEEPER', '1890 - 1943', 'STILL DIGGING'],
    ['ANITA SHOVEL', '1911 - 1959', 'GOT TO THE BOTTOM'],
    ['DEE KAYEN', '1923 - 1971', 'GOING OFF SLOWLY'],
    ['WILLY ROTT', '1899 - 1948', 'HE DID. HE IS.'],
    ['OTTA B. ALIVE', '1930 - 1979', "BUT ISN'T"],
    ['IMA GONER', '1905 - 1950', 'CALLED IT'],
    ['RICK R. MORTIS', '1894 - 1937', 'STIFF COMPETITION'],
    ['CHRIS P. BACON', '1919 - 1968', 'WELL DONE'],
    ['MONA LITTLEMORE', '1887 - 1939', 'QUIET AT LAST'],
    ['ELLA VATOR', '1913 - 1962', 'GOING DOWN'],
    ['AL B. BACK', '1921 - 1984', 'WATCH THIS SPACE'],
    ['NEIL DOWN', '1908 - 1955', 'STAYED DOWN'],
    ['JUSTIN TIME', '1926 - 1975', 'OR NOT'],
    ['M. T. TOMB', '1900 - 1901', 'NOBODY HOME'],
    ['DAN D. LYON', '1917 - 1969', 'PUSHING UP WEEDS'],
    ['DEE CEASED', '1891 - 1944', 'SAYS IT ALL'],
    ['PEPE RONI', '1928 - 1977', 'EXTRA CHEESY'],
    ['PHIL DIRT', '1897 - 1952', 'ALL FILLED IN'],
    ['RHODA CAMEL', '1909 - 1961', 'THE LAST STRAW'],
    ['SHIRLEY KNOT', '1920 - 1973', 'DEAD SURE'],
    ['TERRY BULL', '1886 - 1938', 'A TERRIBLE END'],
    ['ANITA HUGG', '1914 - 1966', 'HUG AT OWN RISK'],
    ['BEN DOVER', '1903 - 1958', 'BENT THE RULES'],
    ['EILEEN DOVER', '1906 - 1960', 'AND FELL'],
    ['ANITA BATH', '1912 - 1964', 'WASHED UP'],
    ['OPHELIA PAIN', '1925 - 1974', 'NOT ANY MORE'],
    ['LUKE ATME', '1918 - 1970', 'LOOK AWAY NOW'],
    ['HUGH JASS', '1889 - 1946', 'A BIG LOSS'],
    ['AMANDA HUGGINKISS', '1922 - 1976', 'STILL SINGLE'],
    ['GERRY ATRIC', '1850 - 1949', 'FINALLY'],
    ['DAN DRUFF', '1910 - 1963', 'FLAKED OUT'],
    ['SOFA KING DEAD', '1931 - 1980', 'NO, REALLY'],
    ['LOU SER', '1907 - 1957', 'LOST AGAIN'],
    ['JUSTIN PIECES', '1924 - 1972', 'MOSTLY HERE'],
    ['SAL MONELLA', '1916 - 1967', 'BAD CHICKEN'],
    ['SUE FLAY', '1927 - 1978', 'FELL FLAT'],
    ['OLIVE YEW', '1893 - 1945', 'MISS YEW'],
    ['MELON COLLIE', '1929 - 1981', 'CHEER UP'],
    ['HUGH MUNGUS', '1885 - 1941', 'DOUBLE PLOT'],
    ['FRANK N. STEIN', '1818 - 1851', 'SOME ASSEMBLY REQ.'],
    ['SAL AMI', '1901 - 1953', 'CURED AT LAST'],
    ['SUE PERB', '1932 - 1983', 'JUST FINE'],
    ['PIZZA MY HEART', '1911 - 1958', 'DELIVERED'],
    ['PEPPER TONY', '1904 - 1956', 'HOT STUFF'],
    ['NORMA LEE BATES', '1899 - 1960', 'MOTHER KNOWS BEST'],
    ['CARRIE ON', '1958 - 1976', 'PROM WAS A BLAST'],
    ['REGAN SPINNER', '1961 - 1973', 'HEAD OVER HEELS'],
    ['MIKE MYERSON', '1957 - 1978', 'OUT FOR HALLOWEEN'],
    ['CHUCK E. DOLL', '1960 - 1988', 'FRIENDS TO THE END'],
    ['SAMMY RINGS', '1952 - 1998', 'SEVEN DAYS LATER'],
    ['PENNY WISE', '1927 - 1986', 'WE ALL FLOAT'],
    ['VLAD T. MEETYA', '1431 - 1476', 'PAIN IN THE NECK'],
    ['PHARAOH NUFF', '1341 - 1323 BC', 'ALL WRAPPED UP'],
    ['HARRY WOLFE', '1901 - 1941', 'FULL MOON TONIGHT'],
    ['I. GORE', '1888 - 1931', 'WALK THIS WAY'],
    ['LEA THERFACE', '1940 - 1974', 'CHAINSAW SALE'],
    ['DIAL M. FORMURDER', '1909 - 1954', 'WRONG NUMBER'],
    ['HANNA BALL', '1933 - 1991', 'FRIENDS FOR DINNER'],
    ['ASH N. DUST', '1959 - 1981', 'GROOVY'],
    ['BRAIN Z. NOM', '1938 - 1968', 'BRAAAINS'],
    ['RED RUM', '1921 - 1980', 'READ IT BACKWARDS'],
    ['BIRDIE PECKHAM', '1902 - 1963', 'PECKED TO DEATH'],
    ['BRUNDLE FLYE', '1948 - 1986', 'BUZZ OFF'],
    ['MAC READY', '1946 - 1982', 'WHO GOES THERE?'],
    ['KANE HUGGER', '1932 - 1979', 'BAD LUNCH'],
    ['CAROL ANNE', '1977 - 1982', "THEY'RE HERE"],
    ['HOLDA GRUDGE', '1960 - 2002', 'STILL UPSET'],
    ['JIG SAWYER', '1940 - 2004', 'GAME OVER'],
    ['PIN HEDD', '1919 - 1987', 'LOOKING SHARP'],
    ['CANDACE MANN', '1925 - 1992', "DON'T SAY IT"],
    ['HEATHER BLAIR', '1974 - 1994', 'LOST IN THE WOODS'],
    ['KATIE ACTIVITY', '1980 - 2007', 'NOTHING TO SEE'],
    ['ROSE MARY', '1943 - 1968', 'NO BABY SHOWER'],
    ['MORTY CIAN', '1890 - 1957', 'UNDERTAKEN'],
    ['SEAMORE NOTHING', '1897 - 1933', 'HERE ALL ALONG'],
    ["BRIDE O'FRANK", '1915 - 1935', 'DRESSED TO KILL'],
    ['GILL MANNING', '1910 - 1954', 'SLEEPS WITH FISHES'],
    ['NOSE FERRATU', '1838 - 1922', 'SUNBATHED ONCE'],
    ['OMAN SIXX', '1966 - 1976', 'BORN BAD'],
    ['ANNA BELLE', '1950 - 1970', 'DOLL FACE'],
    ['FINN ALDEST', '1981 - 2000', 'SAW IT COMING'],
    ['FOLLY WALKER', '1990 - 2014', 'KEEP WALKING'],
    ['SHAKY GROUNDS', '1949 - 1990', "DON'T TOUCH DIRT"],
    ['BRUCE SHARKEY', '1940 - 1975', 'BIGGER BOAT'],
    ['HERB B. WEST', '1917 - 1985', 'GLOWING GREEN'],
    ['DAISY LATER', '1975 - 2002', '28 DAYS LATER'],
    ['BARBRA COMING', '1938 - 1968', 'COMING TO GET YOU'],
    ['DAWN MALLE', '1945 - 1978', 'SHOPPED TILL DROPPED'],
    ['CREEP SHAW', '1924 - 1982', "FATHER'S DAY"],
    ['BETTY JUICE', '1918 - 1988', 'SAY IT THRICE'],
    ['HED LESS', '1760 - 1790', 'LOST HIS HEAD'],
    ['RIGOR MORTIMER', '1882 - 1936', 'STIFF UPPER LIP'],
    ['PAUL BEARER', '1895 - 1950', 'CARRIED AWAY'],
    ['KASS KETT', '1903 - 1949', 'BOXED IN'],
    ['ERNEST URN', '1911 - 1971', 'IN THE URN'],
    ['BONE E. MARONEY', '1926 - 1970', 'BAD TO THE BONE'],
    ['SKELLY TONE', '1880 - 1933', 'NO BODY TO LOVE'],
    ['CREMA TORIA', '1914 - 1979', 'WARM REGARDS'],
    ['EMBALMA LOT', '1898 - 1951', 'WELL PRESERVED'],
    ['TOMMY STONE', '1907 - 1964', 'SET IN STONE'],
    ['GUS GHOULASH', '1892 - 1947', 'STEWED'],
    ['MOE BID', '1919 - 1953', 'DYING TO MEET YOU'],
    ['DIGBY GRAVESEND', '1887 - 1942', 'PLOT TWIST'],
    ['COFFIN FITZ', '1901 - 1960', 'IT FITS'],
    ['BAT T. ATTIC', '1928 - 1966', 'HANGING AROUND'],
    ['SCARE CROW', '1912 - 1948', 'OUTSTANDING IN FIELD'],
    ['WITCH HAZEL', '1666 - 1692', 'SPELL CHECKED'],
    ['BOO REGARD', '1894 - 1938', 'SCARED STIFF'],
    ['LAIDE TOREST', '1905 - 1962', 'DO NOT DISTURB'],
    ['MORT TALITY', '1923 - 1977', 'IT HAPPENS'],
    ['GRIM REAPERSON', '1870 - 1950', 'SCYTHE YOU LATER'],
    ['SPOOK E. MANOR', '1899 - 1934', 'HOUSE CALL'],
    ['CORPSE BRYDE', '1876 - 1899', 'TIED THE KNOT']
  ];
  const NCOLS = 8,
    NROWS = 16,
    CW = 256,
    CH = 128; // 2048 x 2048 atlas, 128 cells of 256 x 128 (a 2:1 plate)
  let nameI = 0;
  const nextName = () => {
    if (nameI < NAMES.length && nameI < NCOLS * NROWS) return nameI++;
    if (nameI++ === NAMES.length) console.warn('[cemetery] more standing stones than names: the rest stay blank');
    return -1;
  };
  const NO_TEXT = new Set(['toppled', 'broken']);
  window.MFZCEM = {names: NAMES, used: () => Math.min(nameI, NAMES.length)}; // diagnostics
  let NAME_MAT = null;
  function nameAtlas() {
    if (NAME_MAT) return NAME_MAT;
    return (NAME_MAT = K.paint(
      'cm_names_v089',
      CW * NCOLS,
      CH * NROWS,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        const fit = (txt, y, size, max, font) => {
          c.font = font.replace('#', size);
          let w = c.measureText(txt).width;
          while (w > max && size > 10) {
            size -= 1;
            c.font = font.replace('#', size);
            w = c.measureText(txt).width;
          }
          c.fillText(txt, 0, y);
        };
        NAMES.forEach((n, i) => {
          if (i >= NCOLS * NROWS) return;
          const x0 = (i % NCOLS) * CW,
            y0 = Math.floor(i / NCOLS) * CH;
          c.save();
          c.translate(x0, y0);
          // the plate: near-black, rounded, a thin pale rule inside
          const r = 14,
            m = 3;
          c.beginPath();
          c.moveTo(m + r, m);
          c.arcTo(CW - m, m, CW - m, CH - m, r);
          c.arcTo(CW - m, CH - m, m, CH - m, r);
          c.arcTo(m, CH - m, m, m, r);
          c.arcTo(m, m, CW - m, m, r);
          c.closePath();
          c.fillStyle = 'rgba(10,10,12,0.86)';
          c.fill();
          c.strokeStyle = 'rgba(232,226,210,0.55)';
          c.lineWidth = 2;
          c.beginPath();
          c.rect(11, 9, CW - 22, CH - 18);
          c.stroke();
          // lettering: light, with a black shadow so it stands off the plate
          c.translate(CW / 2, 0);
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.shadowColor = 'rgba(0,0,0,0.95)';
          c.shadowBlur = 4;
          c.shadowOffsetX = 2;
          c.shadowOffsetY = 2;
          c.fillStyle = '#f4efe2';
          fit(n[0], 38, 30, CW - 30, "bold #px Georgia, 'Times New Roman', serif");
          c.fillStyle = '#d8d0bc';
          fit(n[1], 70, 22, CW - 40, "bold #px Georgia, 'Times New Roman', serif");
          c.fillStyle = '#f2c96a';
          fit(n[2], 100, 21, CW - 30, "italic bold #px Georgia, 'Times New Roman', serif");
          c.restore();
        });
      },
      {r: 0.6, alpha: true}
    ));
  }
  /* a name plate on a face: the biggest 2:1 plate that fits a w x h area, centred at p, facing r (default +z). i < 0: nothing. */
  function plate(b, w, h, i, p, r) {
    if (i == null || i < 0) return;
    const pw = Math.min(w, h * 2) * 0.98,
      ph = pw / 2,
      g = new T.PlaneGeometry(pw, ph),
      uv = g.attributes.uv,
      u0 = (i % NCOLS) / NCOLS,
      v0 = 1 - (Math.floor(i / NCOLS) + 1) / NROWS; // canvas row 0 is the top of the texture (flipY)
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / NCOLS, v0 + uv.getY(k) / NROWS);
    uv.needsUpdate = true;
    b.add(g, nameAtlas(), {p, r});
  }
  const signMat = () =>
    K.paint(
      'cm_sign',
      1024,
      160,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        P.text(c, 'PLOT  TWIST  CEMETERY', W / 2, H / 2 + 6, {
          size: 92,
          col: '#1c1e22',
          font: 'Georgia',
          max: W * 0.94
        }); // v090: fits (was cut at both ends)
      },
      {r: 0.5, alpha: true}
    );
  const plaqueMat = (key, lines, bg, fg) =>
    K.paint(
      key,
      256,
      128,
      (c, W, H, r) => {
        c.fillStyle = bg;
        c.fillRect(0, 0, W, H);
        c.strokeStyle = fg;
        c.lineWidth = 4;
        c.strokeRect(8, 8, W - 16, H - 16);
        lines.forEach((t, i) => P.text(c, t, W / 2, 40 + i * 32, {size: i ? 22 : 30, col: fg, font: 'Georgia'}));
        P.grime(c, W, H, r, 0.5);
      },
      {r: 0.5}
    );
  const stainedMat = () =>
    K.paint(
      'cm_oculus',
      256,
      256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        const cx = W / 2,
          cy = H / 2;
        const cols = ['#2a4ab8', '#b82a2a', '#e8c23a', '#2a8a4a', '#7a3ab8', '#2ab8b8'];
        for (let i = 0; i < 12; i++) {
          c.fillStyle = cols[i % cols.length];
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(cx, cy, 120, (i / 12) * PI * 2, ((i + 1) / 12) * PI * 2);
          c.fill();
        }
        c.fillStyle = '#e8d890';
        c.beginPath();
        c.arc(cx, cy, 34, 0, PI * 2);
        c.fill();
        c.strokeStyle = '#1a1a1a';
        c.lineWidth = 6;
        for (let i = 0; i < 12; i++) {
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(cx + Math.cos((i / 12) * PI * 2) * 120, cy + Math.sin((i / 12) * PI * 2) * 120);
          c.stroke();
        }
        c.beginPath();
        c.arc(cx, cy, 34, 0, PI * 2);
        c.stroke();
        c.beginPath();
        c.arc(cx, cy, 120, 0, PI * 2);
        c.stroke();
      },
      {r: 0.2, alpha: true, glow: 0.5}
    );

  /* ===================== lootable props of our own: coffin, funeral urn ===================== */
  K.def('coffin', {label: 'Coffin', table: 'cemetery', items: [1, 3], auto: ['cemetery']}, b => {
    const wd = K.surf('wood', 0x5a3a24),
      lin = K.mat(0xd8d0c0, 0.8),
      br = K.mat(0xb8902a, 0.35, 0.85);
    // six-sided box (wide at the shoulders), lid slid half off
    const shape = new T.Shape();
    shape.moveTo(-0.22, -1.0);
    shape.lineTo(0.22, -1.0);
    shape.lineTo(0.32, 0.45);
    shape.lineTo(0.22, 1.0);
    shape.lineTo(-0.22, 1.0);
    shape.lineTo(-0.32, 0.45);
    shape.closePath();
    const box = new T.ExtrudeGeometry(shape, {depth: 0.42, bevelEnabled: false});
    b.add(box, wd, {p: [0, 0, 0], r: [-PI / 2, 0, 0]});
    b.add(new T.ShapeGeometry(shape), lin, {p: [0, 0.43, 0], r: [-PI / 2, 0, 0]});
    const lid = new T.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 1
    });
    b.add(lid, wd, {p: [0.22, 0.46, -0.35], r: [-PI / 2, 0, 0.18]});
    for (const z of [-0.6, 0, 0.6]) for (const s of [-1, 1]) b.box(0.04, 0.04, 0.16, br, [s * 0.29, 0.22, z], null, 0);
  });
  K.def('funeral_urn', {label: 'Funeral urn', table: 'cemetery', items: [1, 1], auto: ['cemetery']}, b => {
    const m = K.mat(0x4a5a42, 0.4, 0.75),
      g = new T.LatheGeometry(
        [
          [0.0, 0],
          [0.08, 0],
          [0.09, 0.02],
          [0.06, 0.05],
          [0.11, 0.14],
          [0.12, 0.22],
          [0.08, 0.3],
          [0.07, 0.32],
          [0.09, 0.34],
          [0.0, 0.36]
        ].map(q => new T.Vector2(q[0], q[1])),
        18
      );
    b.add(g, m, {p: [0, 0, 0]});
    b.sph(0.03, m, [0, 0.38, 0], null, 8);
  });

  /* ===================== geometry helpers ===================== */
  // a beam between two points (rectangular section)
  function beam(b, mat, p0, p1, wd, ht) {
    const dx = p1[0] - p0[0],
      dy = p1[1] - p0[1],
      dz = p1[2] - p0[2],
      L = Math.hypot(dx, dy, dz);
    const yaw = Math.atan2(dx, dz),
      pitch = Math.atan2(-dy, Math.hypot(dx, dz));
    b.box(wd, ht, L, mat, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], [pitch, yaw, 0], 0);
  }
  // a gable prism along X (ridge along X): x0..x1, eave z0..z1 at y, ridge rise
  function gableX(b, mat, x0, x1, z0, z1, y, rise, th, over) {
    const half = (z1 - z0) / 2 + over,
      zc = (z0 + z1) / 2,
      sl = Math.hypot(half, rise),
      a = Math.atan2(rise, half);
    for (const s of [-1, 1])
      b.box(x1 - x0 + over * 2, th, sl, mat, [(x0 + x1) / 2, y + rise / 2, zc + (s * half) / 2], [s * a, 0, 0], 0);
  }
  // triangular end (pediment / gable infill) in the plane z = z, base width w at y, height h
  function tri(b, mat, x, z, y, w, h, d, ry) {
    const sh = new T.Shape();
    sh.moveTo(-w / 2, 0);
    sh.lineTo(w / 2, 0);
    sh.lineTo(0, h);
    sh.closePath();
    b.add(new T.ExtrudeGeometry(sh, {depth: d, bevelEnabled: false}), mat, {p: [x, y, z - d / 2], r: [0, ry || 0, 0]});
  }

  /* ===================== the cached lot ===================== */
  let CACHE = null;
  const LOTTREES = [];
  const GRAVESP = []; // lootable coffins at dug graves etc: [x, z, model, table, angle, y]
  const ZSPOTS = [];
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('plottwist'),
      b = G.b,
      S = G.S,
      rnd = b.rnd;
    nameI = 0; // v089: names are handed out in build order
    grounds(b, S, rnd);
    railings(b, S);
    gate(b, S);
    mausoleum(b, S);
    vault(b, S);
    shed(b, S);
    graves(b, S, rnd);
    monuments(b, S, rnd);
    dressing(b, S, rnd);
    interiors(b, S, rnd);
    CACHE = G.done();
    return CACHE;
  }

  /* ---------- grounds: lawn with darker patches and leaf litter, gravel avenue / cross walk / memorial ring, sidewalk ---------- */
  function grounds(b, S, rnd) {
    LK.pavement(b, surf('conc'), {kerb: true});
    b.box(40, 0.02, 33.8, surf('lawn'), [0, 0.012, -1.0], null, 0);
    for (let i = 0; i < 26; i++) {
      const x = -18 + rnd() * 36,
        z = -16 + rnd() * 30,
        w = 2 + rnd() * 5,
        d = 2 + rnd() * 4;
      b.box(w, 0.004, d, i % 3 ? surf('lawnD') : surf('leaves'), [x, 0.024 + i * 0.0002, z], [0, rnd() * PI, 0], 0);
    }
    // avenue from the gate to the mausoleum plaza, cross walk, the ring round the memorial
    const gv = surf('gravel'),
      edge = surf('stoneD');
    b.box(PATHW, 0.02, FZ - (CZ + RING), gv, [0, 0.03, (FZ + CZ + RING) / 2], null, 0);
    b.box(PATHW, 0.02, CZ - RING - -5.2, gv, [0, 0.03, (CZ - RING + -5.2) / 2], null, 0);
    b.box(17.4 - RING, 0.02, 2.0, gv, [-(RING + 17.4) / 2 - 0.0, 0.03, CZ], null, 0);
    b.box(17.4 - RING, 0.02, 2.0, gv, [(RING + 17.4) / 2, 0.03, CZ], null, 0);
    b.cyl(RING + 1.0, RING + 1.0, 0.02, gv, [0, 0.03, CZ], null, 40);
    b.cyl(RING - 0.9, RING - 0.9, 0.03, surf('lawnD'), [0, 0.035, CZ], null, 40);
    // mausoleum plaza (flagstones) and the path on to the shed
    b.box(14.0, 0.024, 3.6, K.surf('flagstone', 0x9a948a), [-5.6, 0.031, -5.4], null, 0);
    b.box(1.6, 0.02, 12, gv, [13.4, 0.03, -6.4], null, 0);
    b.box(6.2, 0.02, 1.6, gv, [16.0, 0.03, -12.6], null, 0);
    // stone edging along the avenue
    for (const s of [-1, 1]) {
      b.box(0.12, 0.08, FZ - (CZ + RING) - 0.2, edge, [s * (PATHW / 2 + 0.06), 0.04, (FZ + CZ + RING) / 2], null, 0);
      b.box(0.12, 0.08, CZ - RING + 5.2 - 0.2, edge, [s * (PATHW / 2 + 0.06), 0.04, (CZ - RING - 5.2) / 2], null, 0);
    }
  }

  /* ---------- wrought-iron railings with spear tips on a stone kerb, ashlar piers; dry-stone back wall with ivy ---------- */
  function railings(b, S) {
    const ir = iron(),
      kerb = surf('stoneD'),
      pier = surf('ashlar'),
      cap = surf('stone');
    const H = 1.85;
    const pierAt = (x, z, big) => {
      const w = big ? 0.9 : 0.55,
        h = big ? 2.8 : 2.15;
      b.box(w, h, w, pier, [x, h / 2, z], null, 0);
      b.box(w + 0.16, 0.14, w + 0.16, cap, [x, h + 0.07, z], null, 0);
      b.box(w - 0.1, 0.12, w - 0.1, cap, [x, h + 0.2, z], null, 0);
      S(x - w / 2, x + w / 2, z - w / 2, z + w / 2, 0, h + 0.26, true);
    };
    // one railing run along X (ax 1) or Z (ax 0) between u0 and u1 at f, piers every ~5 m
    const run = (ax, f, u0, u1, piers) => {
      const L = u1 - u0,
        P3 = (u, y) => (ax ? [u, y, f] : [f, y, u]);
      b.box(ax ? L : 0.36, 0.3, ax ? 0.36 : L, kerb, P3((u0 + u1) / 2, 0.15), null, 0);
      for (const y of [0.42, H - 0.18]) b.box(ax ? L : 0.05, 0.05, ax ? 0.05 : L, ir, P3((u0 + u1) / 2, y), null, 0);
      for (let u = u0 + 0.07; u < u1 - 0.05; u += 0.13) {
        b.box(0.026, H - 0.3, 0.026, ir, P3(u, 0.3 + (H - 0.3) / 2), null, 0);
        b.cyl(0, 0.035, 0.13, ir, P3(u, H + 0.065), null, 4);
      }
      // a scroll band between the rails
      for (let u = u0 + 0.2; u < u1 - 0.1; u += 0.52)
        b.box(0.18, 0.18, 0.02, ir, P3(u, H - 0.42), ax ? [0, 0, PI / 4] : [PI / 4, PI / 2, 0], 0);
      if (ax) S(u0, u1, f - 0.18, f + 0.18, 0, H + 0.1, true);
      else S(f - 0.18, f + 0.18, u0, u1, 0, H + 0.1, true);
      if (piers) {
        const n = Math.max(1, Math.round(L / 5));
        for (let i = 1; i < n; i++) pierAt(...(ax ? [u0 + (L * i) / n, f] : [f, u0 + (L * i) / n]));
      }
    };
    // front: two runs either side of the gate; sides front to back; corner piers
    run(1, FZ, -19.6, -GW - 0.45, true);
    run(1, FZ, GW + 0.45, 19.6, true);
    run(0, -19.6, -17.4, FZ, true);
    run(0, 19.6, -17.4, FZ, true);
    for (const x of [-19.6, 19.6]) pierAt(x, FZ, false);
    // back: dry-stone wall with a coping and ivy
    const ds = surf('drystone');
    b.box(39.6, 2.0, 0.6, ds, [0, 1.0, -17.65], null, 0);
    b.box(39.8, 0.14, 0.72, surf('stoneD'), [0, 2.07, -17.65], null, 0);
    S(-19.9, 19.9, -17.95, -17.35, 0, 2.14, true);
    const ivy = surf('ivy');
    for (const [x, w, h] of [
      [-16, 5, 1.9],
      [-6.5, 3.5, 1.4],
      [3, 6, 2.0],
      [12.5, 3, 1.2]
    ])
      b.label(w, h, ivy, [x, h / 2 + 0.05, -17.33], [0, 0, 0]);
    for (const [z, h] of [
      [-8, 1.6],
      [4, 1.2]
    ])
      b.label(4, h, ivy, [-19.39, h / 2 + 0.3, z], [0, PI / 2, 0]);
  }

  /* ---------- front gate: ashlar piers with urn finials, double iron gates (left swung open), scrolled arch with the name ---------- */
  function gate(b, S) {
    const ir = iron(),
      pier = surf('ashlar'),
      cap = surf('stone'),
      urnM = surf('stone');
    for (const s of [-1, 1]) {
      const x = s * GW;
      b.box(0.9, 2.8, 0.9, pier, [x, 1.4, FZ], null, 0);
      b.box(1.1, 0.16, 1.1, cap, [x, 2.88, FZ], null, 0);
      b.box(0.8, 0.1, 0.8, cap, [x, 3.01, FZ], null, 0);
      b.add(
        new T.LatheGeometry(
          [
            [0.0, 0],
            [0.18, 0],
            [0.12, 0.08],
            [0.24, 0.3],
            [0.26, 0.42],
            [0.18, 0.5],
            [0.22, 0.54],
            [0.0, 0.58]
          ].map(q => new T.Vector2(q[0], q[1])),
          16
        ),
        urnM,
        {p: [x, 3.06, FZ]}
      );
      S(x - 0.45, x + 0.45, FZ - 0.45, FZ + 0.45, 0, 3.6, true);
    }
    // gate leaves: 1.5 m each, hinged on the piers. Left swung open into the cemetery, right closed
    const leaf = (hx, ry) => {
      b.push([hx, 0, FZ], [0, ry, 0]);
      const W = 1.45,
        sx = hx < 0 ? 1 : -1;
      for (const y of [0.15, 0.9, 1.95]) b.box(W, 0.06, 0.05, ir, [(sx * W) / 2, y, 0], null, 0);
      for (const u of [0.03, W - 0.03]) b.box(0.07, 2.1, 0.07, ir, [sx * u, 1.05, 0], null, 0);
      for (let u = 0.15; u < W - 0.05; u += 0.12) {
        const top = 2.0 + 0.25 * Math.sin((u / W) * PI) * (hx < 0 ? 1 : 1);
        b.box(0.025, top - 0.1, 0.025, ir, [sx * u, 0.1 + (top - 0.1) / 2, 0], null, 0);
        b.cyl(0, 0.035, 0.12, ir, [sx * u, top + 0.06, 0], null, 4);
      }
      for (let u = 0.3; u < W - 0.2; u += 0.36) b.box(0.2, 0.2, 0.02, ir, [sx * u, 1.42, 0], [0, 0, PI / 4], 0);
      b.pop();
    };
    leaf(-GW + 0.45, -1.9); // open: swung ~110 degrees, back along the railing inside
    leaf(GW - 0.45, 0.25); // ajar
    // collision: the open leaf lies against the inside of the railing; the ajar one across half the opening
    S(-GW + 0.45 - 0.5, -GW + 0.45 + 0.2, FZ - 1.5, FZ - 0.05, 0, 2.2, true);
    S(GW - 0.45 - 1.45, GW - 0.45, FZ - 0.4, FZ + 0.1, 0, 2.2, true);
    // the arch: two curved bars, scrolls and the name plate
    const arc = (r, y0, th) => {
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a0 = PI * (i / n),
          a1 = PI * ((i + 1) / n);
        beam(
          b,
          ir,
          [-Math.cos(a0) * r, y0 + Math.sin(a0) * 0.9, FZ],
          [-Math.cos(a1) * r, y0 + Math.sin(a1) * 0.9, FZ],
          th,
          th
        );
      }
    };
    arc(GW - 0.1, 3.2, 0.06);
    arc(GW - 0.1, 3.75, 0.05);
    for (const s of [-1, 1]) b.box(0.07, 0.7, 0.07, ir, [s * (GW - 0.1), 3.45, FZ], null, 0);
    // v090: narrower and lower, inside the arch, in front of its bars (the bars crossed the first and last letters)
    b.label(2.5, 0.39, signMat(), [0, 3.5, FZ + 0.045]);
    b.label(2.5, 0.39, signMat(), [0, 3.5, FZ - 0.045], [0, PI, 0]);
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++)
        b.box(0.16, 0.16, 0.02, ir, [s * (0.5 + i * 0.4), 4.05 + (i === 0 ? 0.05 : 0), FZ], [0, 0, PI / 4], 0);
    b.cyl(0.02, 0.02, 0.5, ir, [0, 4.85, FZ], null, 6);
    b.sph(0.08, brass(), [0, 5.1, FZ], null, 10);
  }

  /* ---------- mausoleum: stone walls (core WL in the builder), skins, portico with four columns, pediment, slab roof, bronze doors ---------- */
  function mausoleum(b, S) {
    const ash = surf('ashlar'),
      ashD = surf('ashlarD'),
      st = surf('stone'),
      mb = surf('marble'),
      rf = surf('roofSlab');
    // skins over the WL walls (outside) with a plinth and a cornice
    const W = MX1 - MX0,
      D = MZ1 - MZ0;
    // ashlar faces just outside the 0.4 m WL walls (the front face leaves the doorway open)
    const o = 0.21,
      zc = (MZ0 + MZ1) / 2;
    b.box(W + 0.44, MH, 0.03, ash, [MCX, MH / 2, MZ0 - o], null, 0);
    b.box(0.03, MH, D + 0.44, ash, [MX0 - o, MH / 2, zc], null, 0);
    b.box(0.03, MH, D + 0.44, ash, [MX1 + o, MH / 2, zc], null, 0);
    for (const [u0, u1] of [
      [MX0 - 0.22, MCX - 0.65],
      [MCX + 0.65, MX1 + 0.22]
    ])
      b.box(u1 - u0, MH, 0.03, ash, [(u0 + u1) / 2, MH / 2, MZ1 + o], null, 0);
    b.box(1.3, MH - 2.4, 0.03, ash, [MCX, 2.4 + (MH - 2.4) / 2, MZ1 + o], null, 0);
    b.box(W + 0.6, 0.5, 0.12, ashD, [MCX, 0.25, MZ0 - 0.27], null, 0);
    for (const x of [MX0 - 0.27, MX1 + 0.27]) b.box(0.12, 0.5, D + 0.6, ashD, [x, 0.25, zc], null, 0);
    b.box(W + 0.7, 0.24, D + 0.7, st, [MCX, MH + 0.12, (MZ0 + MZ1) / 2], null, 0);
    b.box(W + 0.5, 0.16, D + 0.5, st, [MCX, MH - 0.16, (MZ0 + MZ1) / 2], null, 0);
    // portico: platform, three steps, four columns, entablature, pediment
    const pz0 = MZ1,
      pz1 = MZ1 + PORT;
    // platform one step up (0.24, then a 0.12 step), so walking in and out is two easy steps
    b.box(W + 0.6, 0.24, PORT + 0.2, ashD, [MCX, 0.12, (pz0 + pz1) / 2 + 0.1], null, 0);
    b.box(W + 0.3, 0.12, 0.4, st, [MCX, 0.06, pz1 + 0.4], null, 0);
    S(MX0 - 0.3, MX1 + 0.3, pz0 + 0.2, pz1 + 0.2, 0, 0.24, true);
    S(MX0 - 0.15, MX1 + 0.15, pz1 + 0.2, pz1 + 0.6, 0, 0.12, true);
    const colZ = pz1 - 0.35;
    for (const x of [MX0 + 0.35, MX0 + 2.2, MX1 - 2.2, MX1 - 0.35]) {
      b.box(0.62, 0.22, 0.62, st, [x, 0.35, colZ], null, 0);
      b.add(new T.CylinderGeometry(0.22, 0.26, MH - 0.5, 16, 1), mb, {p: [x, 0.46 + (MH - 0.5) / 2, colZ]});
      for (let f = 0; f < 12; f++) {
        const a = (f / 12) * PI * 2;
        b.box(
          0.02,
          MH - 0.7,
          0.02,
          surf('stoneD'),
          [x + Math.cos(a) * 0.235, 0.46 + (MH - 0.5) / 2, colZ + Math.sin(a) * 0.235],
          null,
          0
        );
      }
      b.box(0.6, 0.2, 0.6, st, [x, MH - 0.02, colZ], null, 0);
      S(x - 0.27, x + 0.27, colZ - 0.27, colZ + 0.27, 0.24, MH, true);
    }
    // entablature over the portico, frieze plaque
    b.box(W + 0.7, 0.5, PORT + 0.2, st, [MCX, MH + 0.25, (pz0 + pz1) / 2], null, 0);
    b.label(3.4, 0.36, plaqueMat('cm_famname', ['THE  HARGROVE  FAMILY'], '#9a968c', '#2a2a2a'), [
      MCX,
      MH + 0.25,
      pz1 + 0.105
    ]);
    // roof: low gable along Z (pediment to the front), slab covering
    const rise = 1.5,
      rz0 = MZ0 - 0.35,
      rz1 = pz1 + 0.1,
      half = W / 2 + 0.45,
      sl = Math.hypot(half, rise),
      a = Math.atan2(rise, half);
    for (const s of [-1, 1])
      b.box(sl, 0.16, rz1 - rz0, rf, [MCX + (s * half) / 2, MH + 0.5 + rise / 2, (rz0 + rz1) / 2], [0, 0, -s * a], 0);
    tri(b, st, MCX, rz1 - 0.06, MH + 0.5, W + 0.8, rise, 0.24);
    tri(b, mb, MCX, rz1 + 0.02, MH + 0.62, W - 0.6, rise - 0.36, 0.1);
    tri(b, ash, MCX, rz0 + 0.12, MH + 0.5, W + 0.6, rise - 0.05, 0.2);
    // acroteria: small stone blocks at the pediment corners and apex
    for (const x of [MX0 - 0.35, MX1 + 0.35]) b.box(0.3, 0.3, 0.3, st, [x, MH + 0.65, rz1 - 0.1], null, 0);
    b.box(0.3, 0.4, 0.3, st, [MCX, MH + 0.5 + rise + 0.15, rz1 - 0.1], [0, PI / 4, 0], 0);
    // bronze door surround (the leaves are core doors on the WL wall); oculus in the back wall (outside face)
    b.box(1.9, 0.2, 0.2, st, [MCX, 2.55, MZ1 + 0.28], null, 0);
    for (const s of [-1, 1]) b.box(0.22, 2.5, 0.2, st, [MCX + s * 0.86, 1.25, MZ1 + 0.28], null, 0);
    b.cyl(0.62, 0.62, 0.12, st, [MCX, 2.9, MZ0 - 0.2], [PI / 2, 0, 0], 24);
    b.cyl(0.5, 0.5, 0.04, stainedMat(), [MCX, 2.9, MZ0 - 0.26], [PI / 2, 0, 0], 24);
    // bronze urns on pedestals either side of the steps
    for (const s of [-1, 1]) {
      const x = MCX + s * (W / 2 + 0.9),
        z = pz1 + 0.6;
      b.box(0.6, 0.9, 0.6, ash, [x, 0.45, z], null, 0);
      b.box(0.7, 0.1, 0.7, st, [x, 0.95, z], null, 0);
      b.add(
        new T.LatheGeometry(
          [
            [0, 0],
            [0.16, 0],
            [0.1, 0.08],
            [0.3, 0.36],
            [0.32, 0.5],
            [0.26, 0.58],
            [0.0, 0.6]
          ].map(q => new T.Vector2(q[0], q[1])),
          18
        ),
        bronze(),
        {p: [x, 1.0, z]}
      );
      S(x - 0.32, x + 0.32, z - 0.32, z + 0.32, 0, 1.6, true);
    }
  }

  /* ---------- the sealed gothic family vault ---------- */
  function vault(b, S) {
    const ash = surf('ashlarD'),
      st = surf('stone'),
      rf = surf('roofSlab'),
      ir = iron();
    const w = 3.0,
      d = 3.4,
      h = 2.9;
    b.box(w + 0.4, 0.3, d + 0.4, st, [VX, 0.15, VZ], null, 0);
    b.box(w, h, d, ash, [VX, h / 2 + 0.3, VZ], null, 0);
    // pyramid roof (4 sides), finial
    b.add(new T.ConeGeometry((Math.max(w, d) / 2) * 1.5, 1.8, 4, 1), rf, {
      p: [VX, h + 0.3 + 0.9, VZ],
      r: [0, PI / 4, 0]
    });
    b.add(new T.ConeGeometry(0.12, 0.6, 8), st, {p: [VX, h + 0.3 + 2.0, VZ]});
    // corner buttresses with pinnacles
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const x = VX + sx * (w / 2),
          z = VZ + sz * (d / 2);
        b.box(0.4, h + 0.2, 0.4, st, [x, (h + 0.2) / 2 + 0.3, z], null, 0);
        b.add(new T.ConeGeometry(0.2, 0.7, 4), st, {p: [x, h + 0.85, z], r: [0, PI / 4, 0]});
      }
    // pointed-arch iron gate on the front (+z), name plate
    const fz = VZ + d / 2 + 0.01;
    const sh = new T.Shape();
    sh.moveTo(-0.6, 0);
    sh.lineTo(0.6, 0);
    sh.lineTo(0.6, 1.6);
    sh.quadraticCurveTo(0.6, 2.2, 0, 2.5);
    sh.quadraticCurveTo(-0.6, 2.2, -0.6, 1.6);
    sh.closePath();
    b.add(new T.ShapeGeometry(sh), K.mat(0x0c0c0e, 0.9), {p: [VX, 0.3, fz]});
    for (let x = -0.5; x <= 0.51; x += 0.125) {
      const top = 1.6 + 0.85 * (1 - Math.pow(Math.abs(x) / 0.6, 1.6));
      b.box(0.025, top, 0.025, ir, [VX + x, 0.3 + top / 2, fz + 0.03], null, 0);
    }
    for (const y of [0.5, 1.4]) b.box(1.2, 0.05, 0.04, ir, [VX, 0.3 + y, fz + 0.04], null, 0);
    b.label(1.4, 0.32, plaqueMat('cm_vault', ['ABERNATHY'], '#6e6a62', '#1e1e1e'), [VX, h + 0.05, fz]);
    S(VX - w / 2 - 0.2, VX + w / 2 + 0.2, VZ - d / 2 - 0.2, VZ + d / 2 + 0.2, 0, h + 0.3, false);
  }

  /* ---------- groundskeeper's shed (walls are WL in the builder): board skin, pent roof, lean-to with a wheelbarrow and tools ---------- */
  function shed(b, S) {
    const bd = surf('boards'),
      wd = surf('wood'),
      rf = K.surf('steel', 0x6e6e68),
      ir = iron();
    const W = SX1 - SX0,
      D = SZ1 - SZ0,
      cx = (SX0 + SX1) / 2,
      cz = (SZ0 + SZ1) / 2;
    // boards over the outside of the WL walls (skip the door), corner posts
    const skin = (ax, f, a0, a1, n, door) => {
      const segs = door
        ? [
            [a0, door - 0.7],
            [door + 0.7, a1]
          ]
        : [[a0, a1]];
      for (const [u0, u1] of segs) {
        if (u1 - u0 < 0.05) continue;
        if (ax) b.box(u1 - u0, SH, 0.04, bd, [(u0 + u1) / 2, SH / 2, f + n * 0.17], null, 0);
        else b.box(0.04, SH, u1 - u0, bd, [f + n * 0.17, SH / 2, (u0 + u1) / 2], null, 0);
      }
      if (door) {
        if (ax) b.box(1.4, SH - 2.4, 0.04, bd, [door, 2.4 + (SH - 2.4) / 2, f + n * 0.17], null, 0);
      }
    };
    skin(1, SZ1, SX0 - 0.15, SX1 + 0.15, 1, cx - 0.6);
    skin(1, SZ0, SX0 - 0.15, SX1 + 0.15, -1);
    skin(0, SX0, SZ0 - 0.15, SZ1 + 0.15, -1);
    skin(0, SX1, SZ0 - 0.15, SZ1 + 0.15, 1);
    for (const x of [SX0 - 0.15, SX1 + 0.15])
      for (const z of [SZ0 - 0.15, SZ1 + 0.15]) b.box(0.14, SH + 0.1, 0.14, wd, [x, (SH + 0.1) / 2, z], null, 0);
    // pent roof sloping to the back, corrugated
    const rz0 = SZ0 - 0.5,
      rz1 = SZ1 + 0.6,
      drop = 0.45,
      L = Math.hypot(rz1 - rz0, drop);
    b.box(W + 0.8, 0.05, L, rf, [cx, SH + 0.25, (rz0 + rz1) / 2], [Math.atan2(drop, rz1 - rz0), 0, 0], 0);
    for (let x = SX0 - 0.35; x < SX1 + 0.4; x += 0.2)
      b.box(0.04, 0.04, L, rf, [x, SH + 0.29, (rz0 + rz1) / 2], [Math.atan2(drop, rz1 - rz0), 0, 0], 0);
    // lean-to on the -x side: posts, tin roof, wheelbarrow, spades, sacks
    const lx0 = SX0 - 2.0;
    for (const z of [SZ0 + 0.2, SZ1 - 0.2]) b.box(0.12, 2.1, 0.12, wd, [lx0, 1.05, z], null, 0);
    b.box(2.2, 0.04, D + 0.6, rf, [lx0 + 1.0, 2.2, cz], [0, 0, -0.15], 0);
    // wheelbarrow
    b.push([lx0 + 0.9, 0, cz + 0.6], [0, 0.4, 0]);
    b.box(0.6, 0.3, 0.9, K.mat(0x3a5a3a, 0.6, 0.4), [0, 0.55, 0], [0.1, 0, 0], 0.05);
    b.cyl(0.2, 0.2, 0.08, K.mat(0x1a1a1a, 0.8), [0, 0.2, 0.55], [0, 0, PI / 2], 14);
    for (const s of [-1, 1]) beam(b, wd, [s * 0.25, 0.45, 0.4], [s * 0.28, 0.75, -0.75], 0.04, 0.04);
    b.pop();
    S(lx0 + 0.5, lx0 + 1.3, cz, cz + 1.3, 0, 0.8, true);
    // spades and a pitchfork leaning on the shed wall
    for (let i = 0; i < 3; i++) {
      const z = SZ0 + 0.6 + i * 0.5;
      beam(b, wd, [SX0 - 0.3, 0.1, z], [SX0 - 0.2, 1.4, z + 0.05], 0.035, 0.035);
      b.box(0.2, 0.28, 0.02, ir, [SX0 - 0.32, 0.18, z], [0, PI / 2, 0.08], 0);
    }
    for (let i = 0; i < 3; i++)
      b.rbox(
        0.45,
        0.6,
        0.3,
        0.12,
        K.mat(0xb8a478, 0.95),
        [lx0 + 0.4, 0.3 + (i === 2 ? 0.5 : 0), SZ0 + 0.5 + (i % 2) * 0.45],
        [0, 0.3 * i, 0]
      );
  }

  /* ===================== graves ===================== */
  // stone finishes: light grey, weathered, dark granite, white marble, red granite, mossy
  const STONES = [0x9a9890, 0x84827a, 0x55565a, 0xdcd8d0, 0x7a4e46, 0x6e7462];
  const stoneM = i => K.surf('stone', STONES[i]);
  const DARKS = new Set([2, 4]); // light lettering on these
  // trees and features keep these spots clear of graves: [x, z, radius]
  const KEEP = [
    [-17.6, 13.9, 1.8],
    [17.4, 13.9, 1.8],
    [-3.3, 13.9, 1.4],
    [3.3, 13.9, 1.4],
    [17.8, -1.4, 1.8],
    [-18.4, -4.2, 1.6],
    [14.6, 8.6, 1.4], // birdbath
    [-9.0, -0.4, 1.3], // benches
    [9.0, -0.4, 1.3],
    [10.4, -6.6, 1.5], // obelisk
    [10.6, -9.9, 1.8], // table tombs
    [17.0, -11.0, 1.8]
  ];
  const kept = (x, z) => KEEP.some(k => Math.hypot(x - k[0], z - k[1]) < k[2]);

  // one grave: marker of kind k at (x, z) facing +z, with its plot in front. o: {lean, sink, plot, kerb, deco, st, eng}
  function grave(b, S, rnd, x, z, k, o) {
    const st = stoneM(o.st),
      ni = NO_TEXT.has(k) ? -1 : o.eng, // v089: name index (-1 = blank)
      lean = o.lean || [0, 0];
    // the plot: grass mound, sunken dirt or gravel chips inside a kerb
    const pl = o.plot || 'mound';
    if (pl === 'mound') {
      b.box(0.9, 0.1, 1.8, surf('lawnD'), [x, 0.05, z + 1.05], null, 0);
      b.box(0.7, 0.05, 1.6, surf('lawnD'), [x, 0.12, z + 1.05], null, 0);
    } else if (pl === 'dirt') b.box(0.9, 0.02, 1.8, surf('dirt'), [x, 0.026, z + 1.05], null, 0);
    else if (pl === 'chips') b.box(0.9, 0.04, 1.8, surf('gravel'), [x, 0.035, z + 1.05], null, 0);
    if (o.kerb) {
      const km = stoneM(o.st === 3 ? 0 : o.st);
      for (const s of [-1, 1]) b.box(0.1, 0.14, 2.0, km, [x + s * 0.5, 0.07, z + 1.05], null, 0);
      b.box(1.1, 0.14, 0.1, km, [x, 0.07, z + 2.05], null, 0);
    }
    b.push([x, -(o.sink || 0), z], [lean[0], o.ry || 0, lean[1]]);
    let w = 0.75,
      h = 0.9,
      d = 0.16;
    const face = (fw, fh, fy) => plate(b, fw, fh, ni, [0, fy, d / 2 + 0.004]);
    if (k === 'round' || k === 'broken') {
      const top = k === 'broken' ? 0.45 : h;
      b.box(w, top, d, st, [0, top / 2, 0], null, 0);
      if (k === 'round') {
        b.add(new T.CylinderGeometry(w / 2, w / 2, d, 20, 1, false, PI / 2, PI), st, {p: [0, h, 0], r: [PI / 2, 0, 0]});
        face(w * 0.84, (h + 0.25) * 0.82, h * 0.6);
      } else {
        // the snapped-off top lies face up in the grass
        b.box(w, 0.42, d, st, [0.15, 0.09, 0.65], [-PI / 2 + 0.06, 0.4, 0], 0);
        b.add(new T.CylinderGeometry(w / 2, w / 2, d, 20, 1, false, 0, PI), st, {
          p: [0.15 + 0.08, 0.09, 0.95],
          r: [0, 0.4, 0]
        });
      }
    } else if (k === 'gothic' || k === 'ogee') {
      const sh = new T.Shape();
      sh.moveTo(-w / 2, 0);
      sh.lineTo(w / 2, 0);
      sh.lineTo(w / 2, h);
      if (k === 'gothic') {
        sh.quadraticCurveTo(w / 2, h + 0.3, 0, h + 0.45);
        sh.quadraticCurveTo(-w / 2, h + 0.3, -w / 2, h);
      } else {
        sh.bezierCurveTo(w / 2, h + 0.18, w * 0.1, h + 0.12, 0, h + 0.4);
        sh.bezierCurveTo(-w * 0.1, h + 0.12, -w / 2, h + 0.18, -w / 2, h);
      }
      sh.closePath();
      b.add(new T.ExtrudeGeometry(sh, {depth: d, bevelEnabled: false, curveSegments: 6}), st, {p: [0, 0, -d / 2]});
      face(w * 0.8, h * 0.95, h * 0.55);
    } else if (k === 'square') {
      w = 0.85;
      h = 1.0;
      d = 0.22;
      b.box(w + 0.2, 0.2, d + 0.25, st, [0, 0.1, 0], null, 0);
      b.box(w, h, d, st, [0, 0.2 + h / 2, 0], null, 0);
      b.box(w + 0.08, 0.08, d + 0.08, st, [0, 0.2 + h + 0.04, 0], null, 0);
      d = 0.22;
      plate(b, w * 0.82, h * 0.86, ni, [0, 0.2 + h / 2, d / 2 + 0.004]);
    } else if (k === 'slant') {
      h = 0.5;
      b.box(0.8, 0.45, 0.5, st, [0, 0.22, 0], null, 0);
      b.box(0.8, 0.16, 0.55, st, [0, 0.47, 0.02], [0.5, 0, 0], 0);
      plate(b, 0.7, 0.42, ni, [0, 0.545, 0.06], [-(PI / 2 - 0.5), 0, 0]);
    } else if (k === 'cross' || k === 'celtic') {
      b.box(0.7, 0.25, 0.5, st, [0, 0.125, 0], null, 0);
      b.box(0.5, 0.25, 0.36, st, [0, 0.375, 0], null, 0);
      const ch = k === 'celtic' ? 1.5 : 1.25;
      b.box(0.16, ch, 0.14, st, [0, 0.5 + ch / 2, 0], null, 0);
      b.box(0.62, 0.15, 0.14, st, [0, 0.5 + ch * 0.72, 0], null, 0);
      if (k === 'celtic') b.add(new T.TorusGeometry(0.2, 0.035, 6, 20), st, {p: [0, 0.5 + ch * 0.72, 0]});
      plate(b, 0.48, 0.24, ni, [0, 0.375, 0.184]);
      h = 0.5 + ch;
    } else if (k === 'angel') {
      // pedestal and a robed figure with folded wings, head bowed (our own sculpt)
      b.box(0.8, 0.3, 0.8, st, [0, 0.15, 0], null, 0);
      b.box(0.62, 0.9, 0.62, st, [0, 0.75, 0], null, 0);
      b.box(0.74, 0.1, 0.74, st, [0, 1.25, 0], null, 0);
      plate(b, 0.58, 0.6, ni, [0, 0.78, 0.315]);
      b.add(new T.CylinderGeometry(0.13, 0.28, 1.05, 14), st, {p: [0, 1.3 + 0.52, 0]});
      b.sph(0.16, st, [0, 1.3 + 1.12, 0], [1, 0.95, 1], 12);
      b.sph(0.11, st, [0, 1.3 + 1.32, 0.04], [1, 1.1, 1], 12);
      for (const s of [-1, 1]) {
        b.box(0.26, 0.85, 0.06, st, [s * 0.18, 1.3 + 0.95, -0.16], [0.25, s * 0.5, s * 0.12], 0);
        b.box(0.1, 0.38, 0.1, st, [s * 0.08, 1.3 + 0.95, 0.14], [-0.9, 0, -s * 0.5], 0); // arms folded
      }
      h = 2.8;
      w = 0.8;
      d = 0.8;
    } else if (k === 'lamb' || k === 'flat') {
      if (k === 'lamb') {
        b.box(0.5, 0.3, 0.3, st, [0, 0.15, 0], null, 0);
        b.sph(0.14, st, [0, 0.42, 0], [1.4, 0.9, 0.9], 10);
        b.sph(0.07, st, [0.16, 0.5, 0], null, 8);
        plate(b, 0.48, 0.28, ni, [0, 0.15, 0.154]);
        h = 0.55;
      } else {
        b.box(0.6, 0.08, 0.4, st, [0, 0.04, 0.2], null, 0);
        plate(b, 0.58, 0.38, ni, [0, 0.082, 0.2], [-PI / 2, 0, 0]);
        h = 0.08;
      }
      w = 0.6;
    } else if (k === 'toppled') {
      // a full stone lying on its back across the plot
      b.box(w, h, d, st, [0.1, 0.08, 0.55], [-PI / 2 + 0.04, 0.3, 0], 0);
      h = 0.2;
    }
    b.pop();
    // decoration on the plot: flowers in a vase, a wreath, a grave lantern
    const dd = o.deco;
    if (dd === 'flowers') {
      b.cyl(0.07, 0.05, 0.22, K.mat(0x3a4a3a, 0.5, 0.5), [x + 0.25, 0.11, z + 0.35], null, 10);
      const pet = [0xc82a2a, 0xe8d82a, 0xf2f2f2, 0xb84ab8, 0xe8782a][Math.floor(rnd() * 5)];
      for (let i = 0; i < 5; i++)
        b.sph(
          0.05,
          K.mat(pet, 0.7),
          [x + 0.25 + (rnd() - 0.5) * 0.12, 0.28 + rnd() * 0.08, z + 0.35 + (rnd() - 0.5) * 0.1],
          null,
          6
        );
    } else if (dd === 'wreath') {
      b.add(new T.TorusGeometry(0.22, 0.06, 6, 16), K.mat(0x2a4a2a, 0.9), {p: [x, 0.35, z + 0.12], r: [0.2, 0, 0]});
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2;
        b.sph(0.04, K.mat(0xb81a1a, 0.6), [x + Math.cos(a) * 0.22, 0.35 + Math.sin(a) * 0.22, z + 0.16], null, 6);
      }
    } else if (dd === 'lantern') {
      b.box(0.14, 0.24, 0.14, K.mat(0x1a1a1a, 0.5, 0.5), [x - 0.3, 0.12, z + 0.3], null, 0);
      b.box(
        0.1,
        0.12,
        0.1,
        K.mat(0xc8281a, 0.3, 0, {emissive: 0xc8281a, emissiveIntensity: 0.8}),
        [x - 0.3, 0.14, z + 0.3],
        null,
        0
      );
      b.add(new T.ConeGeometry(0.1, 0.08, 4), K.mat(0x1a1a1a, 0.5, 0.5), {
        p: [x - 0.3, 0.28, z + 0.3],
        r: [0, PI / 4, 0]
      });
    }
    // collision: the marker itself (thin things are no camera occluders)
    if (h > 0.3) S(x - w / 2, x + w / 2, z - Math.max(d, 0.2) / 2, z + Math.max(d, 0.2) / 2, 0, h, true);
  }

  function pickKind(rnd, sec) {
    const r = rnd();
    if (sec === 'child') return r < 0.45 ? 'lamb' : r < 0.75 ? 'flat' : 'round';
    if (sec === 'old')
      return r < 0.18
        ? 'celtic'
        : r < 0.32
          ? 'cross'
          : r < 0.5
            ? 'gothic'
            : r < 0.62
              ? 'broken'
              : r < 0.7
                ? 'toppled'
                : r < 0.8
                  ? 'square'
                  : 'round';
    return r < 0.26
      ? 'round'
      : r < 0.4
        ? 'gothic'
        : r < 0.52
          ? 'ogee'
          : r < 0.64
            ? 'square'
            : r < 0.72
              ? 'slant'
              : r < 0.8
                ? 'cross'
                : r < 0.85
                  ? 'flat'
                  : r < 0.9
                    ? 'broken'
                    : r < 0.93
                      ? 'toppled'
                      : r < 0.96
                        ? 'celtic'
                        : 'angel';
  }
  const COUNT = {graves: 0};
  function graves(b, S, rnd) {
    let n = 0;
    const one = (x, z, sec) => {
      if (kept(x, z)) return;
      const k = pickKind(rnd, sec),
        r = rnd();
      grave(b, S, rnd, x, z, k, {
        st: Math.floor(rnd() * STONES.length),
        eng: NO_TEXT.has(k) ? -1 : nextName(),
        lean: r < 0.22 ? [(rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.18] : [(rnd() - 0.5) * 0.04, (rnd() - 0.5) * 0.03],
        ry: (rnd() - 0.5) * 0.08,
        sink: r > 0.85 ? 0.06 + rnd() * 0.08 : 0,
        plot: rnd() < 0.7 ? 'mound' : rnd() < 0.5 ? 'dirt' : 'chips',
        kerb: rnd() < 0.16,
        deco: rnd() < 0.18 ? 'flowers' : rnd() < 0.08 ? 'wreath' : rnd() < 0.08 ? 'lantern' : null
      });
      n++;
    };
    const ring = (x, z) => Math.hypot(x, z - CZ) < RING + 1.5;
    // front sections either side of the avenue: 4 rows x 9
    for (const s of [-1, 1])
      for (const z of [3.4, 6.0, 8.6, 11.2])
        for (let i = 0; i < 9; i++) {
          const x = s * (3.0 + i * 1.8);
          if (ring(x, z)) continue;
          // three burst-open graves where the dead got up
          if ((s < 0 && z === 6.0 && i === 4) || (s > 0 && z === 8.6 && i === 2) || (s > 0 && z === 3.4 && i === 6)) {
            burst(b, S, rnd, x, z);
            continue;
          }
          one(x, z, 'main');
        }
    // behind the cross walk, left: one row
    for (let i = 0; i < 9; i++) {
      const x = -3.4 - i * 1.65;
      if (!ring(x, -3.0)) one(x, -3.0, 'main');
    }
    // old section, back right: rows between the plaza line and the vault
    for (const z of [-3.0, -5.8, -8.6, -11.4])
      for (let i = 0; i < 6; i++) {
        const x = 3.0 + i * 1.75;
        if (ring(x, z)) continue;
        if (z <= -11 && x > 7.6) continue; // the vault
        if (x > 4.5 && x < 8.5 && z < -4 && z > -10) continue; // the family plot (monuments)
        one(x, z, 'old');
      }
    // across the shed path, back right
    for (const z of [-3.0, -5.8, -8.6]) for (const x of [15.4, 17.4]) one(x, z, 'old');
    // children's section, far left behind the mausoleum line
    for (let r = 0; r < 5; r++) for (const x of [-18.6, -17.0, -15.4]) one(x, -15.6 + r * 2.0, 'child');
    COUNT.graves = n;
  }
  // a burst-open grave: the earth thrown out, a splintered coffin lid, the stone knocked over, a lootable coffin half out
  function burst(b, S, rnd, x, z) {
    grave(b, S, rnd, x, z, 'toppled', {st: Math.floor(rnd() * 6), eng: (rnd(), -1), plot: 'dirt'}); // knocked over: no name
    b.box(0.95, 0.03, 1.9, K.mat(0x140e0a, 1), [x, 0.03, z + 1.05], null, 0);
    for (let i = 0; i < 9; i++) {
      const a = rnd() * PI * 2,
        r = 0.7 + rnd() * 0.6;
      b.box(
        0.3 + rnd() * 0.4,
        0.1 + rnd() * 0.12,
        0.3 + rnd() * 0.3,
        surf('dirt'),
        [x + Math.cos(a) * r * 0.7, 0.05, z + 1.05 + Math.sin(a) * r],
        [0, a, 0],
        0
      );
    }
    const wd = K.surf('wood', 0x4a3020);
    b.box(0.5, 0.04, 1.6, wd, [x + 0.75, 0.25, z + 1.2], [0.2, 0.5, 0.5], 0);
    b.box(0.08, 0.04, 0.7, wd, [x - 0.55, 0.06, z + 1.7], [0, 1.1, 0], 0);
    ZSPOTS.push([x, z + 2.4]);
  }

  /* ---------- monuments: war memorial obelisk, family plot, obelisks, table tombs, praying hands, dug graves ---------- */
  function monuments(b, S, rnd) {
    const st = stoneM(0),
      mb = surf('marble'),
      gr = stoneM(2),
      br = bronze();
    // war memorial in the ring: three-step base, die with bronze plaques, tall obelisk, bronze wreath
    const mz = CZ;
    for (let i = 0; i < 3; i++) b.box(2.6 - i * 0.5, 0.25, 2.6 - i * 0.5, st, [0, 0.125 + i * 0.25, mz], null, 0);
    b.box(1.0, 1.1, 1.0, gr, [0, 0.75 + 0.55, mz], null, 0);
    b.box(1.12, 0.12, 1.12, st, [0, 1.92, mz], null, 0);
    b.add(new T.CylinderGeometry(0.22 * Math.SQRT2, 0.42 * Math.SQRT2, 3.8, 4, 1), mb, {
      p: [0, 1.98 + 1.9, mz],
      r: [0, PI / 4, 0]
    });
    b.add(new T.ConeGeometry(0.22 * Math.SQRT2, 0.45, 4), mb, {p: [0, 1.98 + 3.8 + 0.22, mz], r: [0, PI / 4, 0]});
    const pm = plaqueMat('cm_memorial', ['TO  OUR  FALLEN', 'THEY SHALL GROW', 'NOT OLD'], '#3e5040', '#d8c890');
    for (let i = 0; i < 4; i++) {
      const a = (i * PI) / 2;
      b.label(0.8, 0.5, pm, [Math.sin(a) * 0.505, 1.35, mz + Math.cos(a) * 0.505], [0, a, 0]);
    }
    b.add(new T.TorusGeometry(0.3, 0.06, 8, 20), br, {p: [0, 2.7, mz + 0.4]});
    S(-1.3, 1.3, mz - 1.3, mz + 1.3, 0, 0.75, true);
    S(-0.55, 0.55, mz - 0.55, mz + 0.55, 0, 6.0, false);
    // family plot in the old section: granite kerb with corner posts and drooping chains, a central angel and four ledgers
    const fx0 = 4.6,
      fx1 = 8.4,
      fz0 = -9.6,
      fz1 = -4.2,
      ch = iron();
    for (const [ax, f, a0, a1] of [
      [1, fz0, fx0, fx1],
      [1, fz1, fx0, fx1],
      [0, fx0, fz0, fz1],
      [0, fx1, fz0, fz1]
    ]) {
      if (ax) b.box(a1 - a0, 0.22, 0.2, gr, [(a0 + a1) / 2, 0.11, f], null, 0);
      else b.box(0.2, 0.22, a1 - a0, gr, [f, 0.11, (a0 + a1) / 2], null, 0);
    }
    const posts = [];
    for (let x = fx0; x <= fx1 + 0.01; x += (fx1 - fx0) / 3) posts.push([x, fz1], [x, fz0]);
    for (let z = fz0; z <= fz1 + 0.01; z += (fz1 - fz0) / 3) posts.push([fx0, z], [fx1, z]);
    for (const [x, z] of posts) {
      b.box(0.16, 0.6, 0.16, gr, [x, 0.3, z], null, 0);
      b.sph(0.09, gr, [x, 0.65, z], null, 8);
    }
    const chain = (p0, p1) => {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const t0 = i / n,
          t1 = (i + 1) / n,
          y = t => 0.52 - Math.sin(t * PI) * 0.18;
        beam(
          b,
          ch,
          [p0[0] + (p1[0] - p0[0]) * t0, y(t0), p0[1] + (p1[1] - p0[1]) * t0],
          [p0[0] + (p1[0] - p0[0]) * t1, y(t1), p0[1] + (p1[1] - p0[1]) * t1],
          0.025,
          0.025
        );
      }
    };
    const dx = (fx1 - fx0) / 3,
      dzs = (fz1 - fz0) / 3;
    for (let i = 0; i < 3; i++) {
      if (i !== 1) chain([fx0 + i * dx, fz1], [fx0 + (i + 1) * dx, fz1]); // gap in the front middle
      chain([fx0 + i * dx, fz0], [fx0 + (i + 1) * dx, fz0]);
      chain([fx0, fz0 + i * dzs], [fx0, fz0 + (i + 1) * dzs]);
      chain([fx1, fz0 + i * dzs], [fx1, fz0 + (i + 1) * dzs]);
    }
    for (const [ax, f, a0, a1] of [
      [1, fz0, fx0, fx1],
      [0, fx0, fz0, fz1],
      [0, fx1, fz0, fz1]
    ])
      ax ? S(a0, a1, f - 0.1, f + 0.1, 0, 0.6, true) : S(f - 0.1, f + 0.1, a0, a1, 0, 0.6, true);
    S(fx0, fx0 + dx, fz1 - 0.1, fz1 + 0.1, 0, 0.6, true);
    S(fx0 + 2 * dx, fx1, fz1 - 0.1, fz1 + 0.1, 0, 0.6, true);
    grave(b, S, rnd, (fx0 + fx1) / 2, fz0 + 0.9, 'angel', {st: 3, eng: nextName(), plot: 'chips'});
    for (const [x, z] of [
      [fx0 + 0.85, fz0 + 2.4],
      [fx1 - 0.85, fz0 + 2.4]
    ]) {
      b.box(0.9, 0.18, 2.0, gr, [x, 0.09, z], null, 0);
      plate(b, 0.7, 1.4, (rnd(), nextName()), [x, 0.184, z], [-PI / 2, 0, 0]);
    }
    // two obelisks and two table tombs among the old graves
    const obelisk = (x, z, h, m) => {
      b.box(1.0, 0.3, 1.0, m, [x, 0.15, z], null, 0);
      b.box(0.74, 0.7, 0.74, m, [x, 0.65, z], null, 0);
      b.add(new T.CylinderGeometry(0.18 * Math.SQRT2, 0.3 * Math.SQRT2, h, 4, 1), m, {
        p: [x, 1.0 + h / 2, z],
        r: [0, PI / 4, 0]
      });
      b.add(new T.ConeGeometry(0.18 * Math.SQRT2, 0.3, 4), m, {p: [x, 1.0 + h + 0.15, z], r: [0, PI / 4, 0]});
      plate(b, 0.6, 0.5, (rnd(), nextName()), [x, 0.65, z + 0.374]);
      S(x - 0.5, x + 0.5, z - 0.5, z + 0.5, 0, 1.0 + h, true);
    };
    obelisk(10.4, -6.6, 2.6, st);
    obelisk(3.2, -14.6, 3.0, gr);
    const table = (x, z, m) => {
      b.box(1.0, 0.7, 2.0, m, [x, 0.35, z], null, 0);
      b.box(1.2, 0.12, 2.2, m, [x, 0.76, z], null, 0);
      for (const s of [-1, 1])
        for (const t of [-1, 1]) b.box(0.12, 0.6, 0.12, stoneM(1), [x + s * 0.5, 0.36, z + t * 0.95], null, 0);
      plate(b, 0.9, 1.6, (rnd(), nextName()), [x, 0.824, z], [-PI / 2, 0, 0]);
      S(x - 0.6, x + 0.6, z - 1.1, z + 1.1, 0, 0.82, true);
    };
    table(10.6, -9.9, stoneM(1));
    table(17.0, -11.0, stoneM(5));
    // the giant praying hands beside the mausoleum (our own sculpt), on a stepped plinth
    const hx = -2.8,
      hz = -14.6;
    b.push([hx, 0, hz], [0, 0.25, 0]);
    b.box(2.4, 0.5, 1.8, surf('ashlarD'), [0, 0.25, 0], null, 0);
    b.box(2.0, 0.3, 1.5, st, [0, 0.65, 0], null, 0);
    b.push([0, 0.8, 0]);
    b.add(new T.CylinderGeometry(0.34, 0.44, 0.9, 16), mb, {p: [0, 0.45, 0]});
    for (const s of [-1, 1]) {
      b.push([s * 0.2, 0.9, 0], [0, 0, s * 0.1]);
      b.rbox(0.8, 1.9, 0.26, 0.12, mb, [0, 0.95, s * 0.02]);
      b.rbox(0.55, 0.8, 0.6, 0.2, mb, [s * 0.08, 0.1, 0]);
      for (let f = 0; f < 4; f++) {
        const fl = [1.6, 1.85, 1.75, 1.45][f];
        b.add(K.rboxGeo(0.18, fl, 0.2, 0.08, 2), mb, {
          p: [-0.3 + f * 0.2, 1.85 + fl / 2, 0],
          r: [0, 0, (f - 1.5) * 0.03]
        });
      }
      b.add(K.rboxGeo(0.2, 0.9, 0.21, 0.08, 2), mb, {p: [0.46, 1.25, s * 0.1], r: [0, 0, -0.4]});
      b.pop();
    }
    b.pop();
    b.pop();
    S(hx - 1.2, hx + 1.2, hz - 0.9, hz + 0.9, 0, 5.2, false);
    // dug graves by the back wall: open pits with spoil heaps, boards, a shovel stuck in; a coffin waiting on trestles
    const pit = (x, z, ry) => {
      b.push([x, 0, z], [0, ry, 0]);
      b.box(1.0, 0.03, 2.1, K.mat(0x0c0806, 1), [0, 0.028, 0], null, 0);
      for (const s of [-1, 1]) b.box(0.06, 0.03, 2.1, surf('dirt'), [s * 0.53, 0.03, 0], null, 0);
      b.add(new T.SphereGeometry(1, 12, 6, 0, PI * 2, 0, PI / 2), surf('dirt'), {p: [1.3, 0, 0], s: [0.6, 0.55, 1.1]});
      for (let i = 0; i < 3; i++)
        b.box(0.2, 0.04, 1.4, K.surf('wood', 0x7a6a4a), [-0.1 + i * 0.3 - 0.3, 0.06, 0], [0, PI / 2, 0], 0);
      beam(b, K.surf('wood', 0x6a4a2a), [1.2, 0.5, 0.3], [1.0, 1.6, 0.4], 0.04, 0.04);
      b.box(0.22, 0.3, 0.03, iron(), [1.22, 0.4, 0.3], [0, 0, -0.2], 0);
      b.pop();
      S(x + 0.6, x + 1.9, z - 1.1, z + 1.1, 0, 0.7, true);
    };
    pit(1.2, -15.0, 0);
    pit(5.4, -15.2, 0.05);
    for (const s of [-1, 1]) {
      b.box(0.08, 0.7, 0.7, K.surf('wood', 0x5a4030), [8.6 + s * 0.6, 0.35, -15.0], null, 0);
    }
    GRAVESP.push([8.6, -15.0, 'coffin', 'cemetery', PI / 2, 0.7]);
    GRAVESP.push([3.0, -12.9, 'coffin', 'cemetery', 0.2, 0]);
    ZSPOTS.push([3.2, -11.8], [7.0, -12.6]);
  }

  /* ---------- dressing: iron lamp posts, benches, birdbath, trees, litter, sidewalk ---------- */
  function dressing(b, S, rnd) {
    const ir = iron(),
      st = stoneM(0),
      glow = K.mat(0xffe8b0, 0.3, 0, {emissive: 0xffd890, emissiveIntensity: 0.9});
    const lamp = (x, z) => {
      b.cyl(0.14, 0.18, 0.3, ir, [x, 0.15, z], null, 10);
      b.cyl(0.05, 0.06, 2.9, ir, [x, 1.75, z], null, 8);
      b.cyl(0.12, 0.08, 0.08, ir, [x, 3.2, z], null, 8);
      b.box(0.26, 0.36, 0.26, glow, [x, 3.42, z], [0, PI / 4, 0], 0);
      for (let i = 0; i < 4; i++) {
        const a = PI / 4 + (i * PI) / 2;
        b.box(0.03, 0.4, 0.03, ir, [x + Math.cos(a) * 0.17, 3.42, z + Math.sin(a) * 0.17], null, 0);
      }
      b.add(new T.ConeGeometry(0.26, 0.22, 4), ir, {p: [x, 3.71, z], r: [0, PI / 4, 0]});
      b.sph(0.04, ir, [x, 3.86, z], null, 6);
      S(x - 0.12, x + 0.12, z - 0.12, z + 0.12, 0, 3.8, true);
    };
    for (const z of [12.6, 7.4]) for (const s of [-1, 1]) lamp(s * (PATHW / 2 + 0.45), z);
    for (const x of [-11.6, -1.8]) lamp(x, -4.3);
    lamp(12.2, -2.0);
    // benches: stone ends, wooden slats
    const bench = (x, z, ry) => {
      b.push([x, 0, z], [0, ry, 0]);
      for (const s of [-1, 1]) b.box(0.18, 0.45, 0.5, st, [s * 0.75, 0.225, 0], null, 0);
      for (let i = 0; i < 3; i++)
        b.box(1.75, 0.05, 0.12, K.surf('wood', 0x6a4a30), [0, 0.47, -0.16 + i * 0.16], null, 0);
      b.pop();
      S(x - 0.9, x + 0.9, z - 0.3, z + 0.3, 0, 0.5, true);
    };
    bench(-9.0, -0.4, 0);
    bench(9.0, -0.4, 0);
    bench(-4.4, -12.2, PI / 2);
    // stone birdbath
    b.cyl(0.3, 0.4, 0.12, st, [14.6, 0.06, 8.6], null, 14);
    b.cyl(0.12, 0.16, 0.8, st, [14.6, 0.5, 8.6], null, 12);
    b.cyl(0.5, 0.25, 0.14, st, [14.6, 0.97, 8.6], null, 18);
    b.cyl(0.42, 0.42, 0.02, K.mat(0x3a4a50, 0.1, 0.2), [14.6, 1.03, 8.6], null, 18);
    S(14.2, 15.0, 8.2, 9.0, 0, 1.05, true);
    // trees: dead ones, red maples, cedars at the gate (real flora, planted per instance)
    const tree = (x, z, s, o) => LOTTREES.push([x, z, s, o || {}]);
    tree(-17.6, 13.9, 1.15, {dead: 1});
    tree(17.8, -1.4, 1.2, {dead: 1});
    tree(-18.4, -4.2, 1.0, {dead: 1});
    tree(-0.6, -16.4, 1.0, {dead: 1});
    tree(17.4, 13.9, 1.05, {kind: 'maple'});
    tree(-12.0, -16.6, 0.9, {kind: 'maple'});
    tree(-3.3, 13.9, 0.8, {kind: 'cedar'});
    tree(3.3, 13.9, 0.8, {kind: 'cedar'});
    // sidewalk: two street lights, a hydrant, no parking
    LK.lightPole(b, S, -12);
    LK.lightPole(b, S, 12);
    LK.hydrant(b, S, 6);
    LK.noParking(b, -6);
    // fallen leaves along the railings and under the maples
    const lf = [0x8a3a1a, 0xa85a1a, 0x6a2a14, 0xc8822a];
    for (let i = 0; i < 160; i++) {
      const near = i % 3,
        x = near === 0 ? 17.4 + (rnd() - 0.5) * 4 : near === 1 ? -12 + (rnd() - 0.5) * 4 : -19 + rnd() * 38,
        z = near === 0 ? 13.6 + (rnd() - 0.5) * 3 : near === 1 ? -16.2 + (rnd() - 0.5) * 2.4 : FZ - 0.5 - rnd() * 0.6;
      b.box(0.09, 0.006, 0.07, K.mat(lf[i % 4], 0.9), [x, 0.03 + rnd() * 0.01, z], [0, rnd() * PI, 0], 0);
    }
    ZSPOTS.push([-8, 8], [9, 5], [-12, 11], [12, 10], [0, 9], [-6, -2], [6, -6], [-16, -10]);
  }

  /* ---------- interiors: the mausoleum crypt and the groundskeeper's shed ---------- */
  function interiors(b, S, rnd) {
    const mb = surf('marble'),
      st = stoneM(0),
      gr = stoneM(2),
      ix0 = MX0 + 0.2,
      ix1 = MX1 - 0.2,
      iz0 = MZ0 + 0.2,
      iz1 = MZ1 - 0.2,
      icx = (ix0 + ix1) / 2;
    // floor, skirting, coffered ceiling
    b.box(ix1 - ix0, 0.02, iz1 - iz0, surf('floorM'), [icx, 0.03, (iz0 + iz1) / 2], null, 0);
    b.box(ix1 - ix0, 0.06, iz1 - iz0, mb, [icx, MH - 0.03, (iz0 + iz1) / 2], null, 0);
    for (let x = ix0 + 1.0; x < ix1 - 0.5; x += 1.4)
      b.box(0.18, 0.18, iz1 - iz0, st, [x, MH - 0.15, (iz0 + iz1) / 2], null, 0);
    for (let z = iz0 + 1.0; z < iz1 - 0.5; z += 1.4) b.box(ix1 - ix0, 0.18, 0.18, st, [icx, MH - 0.15, z], null, 0);
    // marble wall faces (inside the WL walls), dado rail, the front wall skips the doorway
    const face = (ax, f, n, a0, a1, door) => {
      const segs =
        door !== undefined
          ? [
              [a0, door - 0.65],
              [door + 0.65, a1]
            ]
          : [[a0, a1]];
      for (const [u0, u1] of segs) {
        const L = u1 - u0;
        if (ax) {
          b.box(L, MH, 0.02, mb, [(u0 + u1) / 2, MH / 2, f + n * 0.01], null, 0);
          b.box(L, 0.08, 0.05, st, [(u0 + u1) / 2, 1.0, f + n * 0.03], null, 0);
          b.box(L, 0.2, 0.05, gr, [(u0 + u1) / 2, 0.1, f + n * 0.03], null, 0);
        } else {
          b.box(0.02, MH, L, mb, [f + n * 0.01, MH / 2, (u0 + u1) / 2], null, 0);
          b.box(0.05, 0.08, L, st, [f + n * 0.03, 1.0, (u0 + u1) / 2], null, 0);
          b.box(0.05, 0.2, L, gr, [f + n * 0.03, 0.1, (u0 + u1) / 2], null, 0);
        }
      }
      if (door !== undefined) b.box(1.3, MH - 2.4, 0.02, mb, [door, 2.4 + (MH - 2.4) / 2, f + n * 0.01], null, 0);
    };
    face(1, iz0, 1, ix0, ix1);
    face(1, iz1, -1, ix0, ix1, MCX);
    face(0, ix0, 1, iz0, iz1);
    face(0, ix1, -1, iz0, iz1);
    // crypt niches (loculi): bronze-framed name plates in rows on the back and side walls
    const plate = plaqueMat('cm_loculus', ['HARGROVE', 'REQUIESCAT', 'IN PACE'], '#c8c2b4', '#3a3226');
    const br = bronze();
    const niches = (ax, f, n, u0, u1, cols) => {
      const step = (u1 - u0) / cols;
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < cols; c++) {
          const u = u0 + step * (c + 0.5),
            y = 1.35 + r * 0.85;
          const P3 = (o, yy) => (ax ? [u, yy, f + n * o] : [f + n * o, yy, u]);
          const rot = ax ? (n > 0 ? [0, 0, 0] : [0, PI, 0]) : [0, n > 0 ? PI / 2 : -PI / 2, 0];
          b.box(ax ? step - 0.08 : 0.06, 0.72, ax ? 0.06 : step - 0.08, gr, P3(0.03, y), null, 0);
          b.label(step - 0.22, 0.56, plate, P3(0.065, y), rot);
          for (const s of [-1, 1])
            b.sph(
              0.025,
              br,
              ax ? [u + s * (step / 2 - 0.15), y, f + n * 0.07] : [f + n * 0.07, y, u + s * (step / 2 - 0.15)],
              null,
              6
            );
        }
    };
    niches(1, iz0, 1, ix0 + 0.3, ix1 - 0.3, 6);
    niches(0, ix0, 1, iz0 + 0.3, iz1 - 0.6, 4);
    niches(0, ix1, -1, iz0 + 0.3, iz1 - 0.6, 4);
    // stained-glass oculus on the inside of the back wall, glowing
    b.cyl(0.5, 0.5, 0.03, stainedMat(), [icx, 2.9 + 0.95, iz0 + 0.06], [PI / 2, 0, 0], 24);
    b.add(new T.TorusGeometry(0.52, 0.05, 6, 24), st, {p: [icx, 2.9 + 0.95, iz0 + 0.07]});
    // altar against the back wall below the oculus, candles, a funeral urn (loot) on top
    const az = iz0 + 0.6;
    b.box(1.8, 0.95, 0.7, mb, [icx, 0.475, az], null, 0);
    b.box(2.0, 0.08, 0.84, st, [icx, 0.99, az], null, 0);
    b.box(1.4, 0.5, 0.02, gr, [icx, 0.5, az + 0.36], null, 0);
    S(icx - 1.0, icx + 1.0, az - 0.42, az + 0.42, 0, 1.03, true);
    const wax = K.mat(0xf0ead8, 0.6),
      flame = K.mat(0xffc860, 0.3, 0, {emissive: 0xffa830, emissiveIntensity: 1.2});
    for (const dx of [-0.75, -0.55, 0.55, 0.75]) {
      const h = 0.2 + Math.abs(dx) * 0.2;
      b.cyl(0.035, 0.035, h, wax, [icx + dx, 1.03 + h / 2, az], null, 8);
      b.sph(0.022, flame, [icx + dx, 1.05 + h, az], [1, 1.6, 1], 6);
    }
    GRAVESP.push([icx, az, 'funeral_urn', 'cemetery', 0, 1.03]);
    // tall candle stands either side
    for (const s of [-1, 1]) {
      const x = icx + s * 1.5,
        z = az + 0.3;
      b.cyl(0.18, 0.22, 0.06, br, [x, 0.03, z], null, 12);
      b.cyl(0.025, 0.025, 1.3, br, [x, 0.7, z], null, 8);
      b.cyl(0.1, 0.06, 0.06, br, [x, 1.36, z], null, 10);
      b.cyl(0.04, 0.04, 0.3, wax, [x, 1.54, z], null, 8);
      b.sph(0.028, flame, [x, 1.72, z], [1, 1.6, 1], 6);
      S(x - 0.15, x + 0.15, z - 0.15, z + 0.15, 0, 1.75, true);
    }
    // two sarcophagi: plinth, chest with carved panels, gabled lid (one lid shoved aside; a coffin inside to loot)
    const sarc = (x, z, open) => {
      b.box(1.2, 0.2, 2.4, gr, [x, 0.1, z], null, 0);
      b.box(1.0, 0.75, 2.2, mb, [x, 0.575, z], null, 0);
      for (const s of [-1, 1])
        for (let i = 0; i < 3; i++) b.box(0.02, 0.45, 0.55, st, [x + s * 0.505, 0.58, z - 0.7 + i * 0.7], null, 0);
      b.push([x + (open ? 0.45 : 0), 0, z + (open ? 0.3 : 0)], [0, open ? 0.35 : 0, open ? -0.12 : 0]);
      b.box(1.1, 0.1, 2.3, mb, [0, 1.0, 0], null, 0);
      const sh = new T.Shape();
      sh.moveTo(-0.55, 0);
      sh.lineTo(0.55, 0);
      sh.lineTo(0, 0.22);
      sh.closePath();
      b.add(new T.ExtrudeGeometry(sh, {depth: 2.3, bevelEnabled: false}), mb, {p: [0, 1.05, -1.15]});
      b.pop();
      if (open) b.box(0.9, 0.02, 2.0, K.mat(0x0c0a08, 1), [x, 0.95, z], null, 0);
      S(x - 0.6, x + 0.6, z - 1.2, z + 1.2, 0, 1.0, false);
    };
    sarc(icx - 1.7, -11.3, false);
    sarc(icx + 1.7, -11.3, true);
    GRAVESP.push([icx + 1.7, -11.3, 'funeral_urn', 'cemetery', 0.4, 0.96]);
    // a coffin on a bier by the right wall, waiting for its niche
    const bz = iz1 - 1.6;
    for (const dz of [-0.8, 0.8])
      b.box(0.6, 0.55, 0.08, K.surf('wood', 0x3a2618), [ix1 - 0.6, 0.275, bz + dz], null, 0);
    GRAVESP.push([ix1 - 0.6, bz, 'coffin', 'cemetery', 0, 0.55]);
    // dried wreath on an easel by the door, a fallen vase
    beam(b, K.surf('wood', 0x4a3020), [ix0 + 0.5, 0, iz1 - 0.8], [ix0 + 0.5, 1.5, iz1 - 0.6], 0.04, 0.04);
    b.add(new T.TorusGeometry(0.3, 0.07, 6, 16), K.mat(0x5a4a2a, 0.95), {
      p: [ix0 + 0.5, 1.2, iz1 - 0.62],
      r: [-0.12, 0, 0]
    });
    b.cyl(0.08, 0.06, 0.32, br, [ix0 + 1.1, 0.12, iz1 - 1.2], [PI / 2, 0, 0.6], 10);

    /* ----- shed ----- */
    const fx0 = SX0 + 0.15,
      fx1 = SX1 - 0.15,
      fz0 = SZ0 + 0.15,
      fz1 = SZ1 - 0.15,
      wd = K.surf('wood', 0x6a5038);
    b.box(fx1 - fx0, 0.02, fz1 - fz0, surf('boards'), [(fx0 + fx1) / 2, 0.03, (fz0 + fz1) / 2], null, 0);
    b.box(fx1 - fx0, 0.03, fz1 - fz0, surf('boards'), [(fx0 + fx1) / 2, SH - 0.02, (fz0 + fz1) / 2], null, 0);
    // workbench along the right wall with a vise; pegboard with tools above
    const wbx = fx1 - 0.35;
    b.box(0.65, 0.06, 2.4, wd, [wbx, 0.9, (fz0 + fz1) / 2], null, 0);
    for (const dz of [-1.1, 1.1])
      for (const dx of [-0.25, 0.25]) b.box(0.07, 0.88, 0.07, wd, [wbx + dx, 0.44, (fz0 + fz1) / 2 + dz], null, 0);
    b.box(0.6, 0.04, 2.3, wd, [wbx, 0.25, (fz0 + fz1) / 2], null, 0);
    b.box(0.2, 0.14, 0.12, K.mat(0x2a4a7a, 0.5, 0.5), [wbx - 0.25, 1.0, fz1 - 0.6], null, 0);
    b.box(0.02, 1.0, 2.0, K.mat(0x8a7050, 0.9), [fx1 - 0.02, 1.6, (fz0 + fz1) / 2], null, 0);
    for (let i = 0; i < 6; i++) {
      const z = fz0 + 0.65 + i * 0.32;
      b.box(0.03, 0.4 + (i % 3) * 0.1, 0.03, wd, [fx1 - 0.06, 1.6, z], null, 0);
      b.box(0.04, 0.1, 0.12, iron(), [fx1 - 0.06, 1.85 + (i % 3) * 0.05, z], null, 0);
    }
    S(wbx - 0.33, wbx + 0.33, fz0 + 0.1, fz1 - 0.1, 0, 0.93, true);
    GRAVESP.push([wbx, fz0 + 0.6, 'toolbox', 'hardware', -PI / 2, 0.93]);
    // shelves on the back wall: paint tins, jars, a lantern
    for (const y of [0.9, 1.5, 2.1]) {
      b.box(2.0, 0.04, 0.35, wd, [fx0 + 1.2, y, fz0 + 0.2], null, 0);
      for (let i = 0; i < 5; i++)
        b.cyl(
          0.08,
          0.08,
          0.16,
          K.mat([0x8a2a1a, 0x2a5a8a, 0xc8c8c0, 0x3a6a3a, 0xb8902a][(i + y * 10) % 5], 0.5, 0.3),
          [fx0 + 0.4 + i * 0.38, y + 0.1, fz0 + 0.2],
          null,
          10
        );
    }
    S(fx0 + 0.2, fx0 + 2.2, fz0, fz0 + 0.4, 0, 2.2, true);
    // tool chest (loot) in the back corner, sacks, a push mower
    GRAVESP.push([fx1 - 0.5, fz0 + 0.45, 'tool_chest', 'hardware', 0, 0]);
    for (let i = 0; i < 3; i++)
      b.rbox(0.45, 0.55, 0.3, 0.12, K.mat(0xc8b890, 0.95), [fx0 + 0.35, 0.28, fz1 - 0.4 - i * 0.4], [0, 0.2 * i, 0]);
    b.push([fx0 + 3.4, 0, fz1 - 1.2], [0, 0.6, 0]); // v089: the mower moved off the shed door
    b.box(0.5, 0.25, 0.45, K.mat(0x8a2a1a, 0.5, 0.4), [0, 0.3, 0], null, 0);
    for (const s of [-1, 1])
      for (const t of [-1, 1])
        b.cyl(0.1, 0.1, 0.04, K.mat(0x1a1a1a, 0.8), [s * 0.24, 0.1, t * 0.18], [0, 0, PI / 2], 10);
    beam(b, iron(), [0, 0.35, -0.2], [0, 1.0, -0.8], 0.03, 0.03);
    b.box(0.5, 0.03, 0.03, iron(), [0, 1.0, -0.8], null, 0);
    b.pop();
  }

  /* ===================== the builder ===================== */
  function bPlotTwist(x, z, t) {
    const B = mk(x, z, 40, 36, MH, 0xa8a49a, 0x2a2622, 0x3a4a3a);
    B.dx = 0;
    // mausoleum: thick stone walls, bronze double door at the front
    const MT = {th: 0.4};
    WL(B, 1, MZ1, MX0, MX1, [{k: 'd', c: MCX}], MH, MT);
    WL(B, 1, MZ0, MX0, MX1, [], MH, MT);
    WL(B, 0, MX0, MZ0, MZ1, [], MH, MT);
    WL(B, 0, MX1, MZ0, MZ1, [], MH, MT);
    // shed: board walls, a door on the front
    const ST = {th: 0.3, c: 0x6a5a48};
    WL(B, 1, SZ1, SX0, SX1, [{k: 'd', c: (SX0 + SX1) / 2 - 0.6}], SH, ST);
    WL(B, 1, SZ0, SX0, SX1, [], SH, ST);
    WL(B, 0, SX0, SZ0, SZ1, [], SH, ST);
    WL(B, 0, SX1, SZ0, SZ1, [], SH, ST);
    LK.attach(B, build());
    for (const [tx, tz, ts, o] of LOTTREES)
      try {
        bldTree(B, tx, tz, ts, o);
      } catch (e) {}
    const SP = LK.spawner(B, 'cemetery');
    for (const s of GRAVESP) SP(...s);
    return LK.finish(B, t, {
      at: [MCX, (MZ0 + MZ1) / 2],
      w: MX1 - MX0,
      d: MZ1 - MZ0,
      loot: ['cemetery', [-16, 16, -4, 13], 2],
      zombies: ZSPOTS.length
        ? ZSPOTS
        : [
            [0, 6],
            [-8, 8],
            [8, 4],
            [6, -8],
            [-14, -3]
          ]
    });
  }

  LK.register({
    id: 'cemetery',
    name: 'Plot Twist Cemetery',
    build: bPlotTwist,
    note: 'full-block cemetery: iron railings and gate arch, mausoleum, family vault, war memorial, ~150 graves, dug graves, shed',
    globals: {bPlotTwist, PLOTTWIST: {build}}
  });
  console.log('[cemetery] Plot Twist ready');
})();
