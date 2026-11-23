// MFZ tools/arch: regenerates the "Wrapper chains" table in ARCHITECTURE.md.  node tools/arch/wrappers.js . > /tmp/w.md
// List global functions that a later script replaces/wraps (name = function..., window.name = function...), in load order.
// usage: node wrappers.js <game dir>  -> markdown table on stdout, plus a "defined in" index as JSON on stderr
const fs = require('fs'), path = require('path');
const req = m => { try { return require(m) } catch (e) { return require('/opt/node-tools/node_modules/' + m) } }, acorn = req('acorn'), walk = req('acorn-walk');   // npm i acorn acorn-walk
const DIR = process.argv[2];
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !/vendor|js\/data\//.test(s) && !/propkit|retro50/.test(s));
const defs = new Map(), wraps = new Map();
const isFn = n => n && (n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression');
for (const s of scripts) {
  const src = fs.readFileSync(path.join(DIR, s), 'utf8');
  let ast; try { ast = acorn.parse(src, { ecmaVersion: 2022, locations: true }) } catch (e) { console.error('parse fail', s, e.message); continue }
  for (const st of ast.body) if (st.type === 'FunctionDeclaration' && !defs.has(st.id.name)) defs.set(st.id.name, `${s}:${st.loc.start.line}`);
  walk.full(ast, n => {
    if (n.type !== 'AssignmentExpression' || n.operator !== '=') return;
    let name = null;
    if (n.left.type === 'Identifier') name = n.left.name;
    else if (n.left.type === 'MemberExpression' && !n.left.computed && n.left.object.type === 'Identifier' && n.left.object.name === 'window') name = n.left.property.name;
    if (!name) return;
    if (!isFn(n.right) && !(n.right.type === 'ConditionalExpression' && (isFn(n.right.consequent) || isFn(n.right.alternate)))) return;
    if (!wraps.has(name)) wraps.set(name, []);
    const arr = wraps.get(name), at = `${s}:${n.loc.start.line}`;
    if (!arr.includes(at)) arr.push(at);
  });
}
const rows = [];
for (const [name, list] of wraps) {
  const d = defs.get(name);
  if (!d && list.length < 2) continue;              // a plain window.x = function, defined once: not a wrapper chain
  rows.push([name, d || '(window.' + name + ' in ' + list[0] + ')', d ? list : list.slice(1)]);
}
rows.sort((a, b) => b[2].length - a[2].length || a[0].localeCompare(b[0]));
console.log('| Function | Defined in | Then wrapped / replaced by (load order) |\n|---|---|---|');
for (const [n, d, l] of rows) console.log(`| \`${n}\` | ${d.replace(/:\d+$/, '')} | ${l.map(x => x.replace(/:\d+$/, '')).filter((x, i, a) => a.indexOf(x) === i).join(' → ')} |`);
console.error(JSON.stringify({ scripts: scripts.length, wrapped: rows.length }));
