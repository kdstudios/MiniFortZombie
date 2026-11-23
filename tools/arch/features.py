import re, sys, os
root = sys.argv[1]; L = os.path.join(root, 'js/layers')
B = [('burgerjoint',"Bruno's Burgerama",'willy_burgerorium','burger joint'),('gasstation','Nut & Bolt Gas Station','eco_pump','filling station'),
 ('gunshop','Triggered Firearms & Supplies','trigger_guard','gun shop'),('bowling','Gutter Minds Bowling','gutter_lanes','bowling alley'),
 ('supermarket','Meat & 2 Veg','food_library','supermarket'),('cerberus','Water Tower & Cerberus Studios','water_tower_kerberos','office lot + water tower'),
 ('church','Aisle Be Back Church','church','church (lot kit template)'),('cinema','Climax Cinema','the_aztec','two-storey cinema / theatre'),
 ('hardware','Morning Wood Hardware','hammertime','hardware & lumber store'),('motel','Inn-and-Out Motel','sunshine_motel','courtyard motel'),
 ('sporting','Dead Weight Sporting Goods','dead_weight_sporting','sporting goods store'),
 ('halfhouse','Half Plot House','small_house / medium_house','half-plot houses, one and two storey (5 plans)'),
 ('cemetery','Plot Twist Cemetery','cemetery','full-block cemetery: mausoleum, vault, ~150 graves'),
 ('pawnshop','Pawnographic','golden_fences_pawn','pawn shop: shop floor, buying counter, pawn store, gun-vault workshop'),
 ('goremet','Gore-met Foods','lucky_ducky','gourmet grocery & butcher: shop floor, butchery counter, walk-in cooler, stock room + dock, office, toilet'),
 ('medikill','MediKill Drug & Pharmacy','morgans_drug','drugstore: big shop floor, pharmacy counter + dispensary, stock room, staff room; car park behind open to the alley'),
 ('bedsburns','Beds, Burns & Beyond','furniture_store','half-plot furniture & fireplace store: big shop floor (sofas, beds, dining, fireplace showroom), drive-in delivery area with two shuttered truck bays off the alley'),
 ('dailygrind','Daily Grind & Get Baked','cuppa_joe','half plot split into two shops: Daily Grind coffee cafe (patio, seating, coffee bar, customer toilet) and Get Baked bakery (front shop, kitchen, staff toilet, delivery van)'),
 ('beatmeat','Beat The Meat & Soylent Greens','geins_butcheria','half plot split into two mirrored butchers: Beat The Meat (meat case, kitchen with block and band saw, freezer store with sides on a rail) and Soylent Greens vegan butchers (plant-cuts case, mural, kitchen, veg freezer store); staff toilets; one shared delivery van'),
 ('threads','Threads with Benefits','fancypantz_wearables','half-plot clothing store: big shop floor (shelving wall, rails, round racks, mannequins, fitting rooms, display counter), delivery stock room with a roller-shutter bay, small office, locker alcove, staff toilet'),
 ('bluebank','Blue Balls Bank','piety_mutual_bank','half-plot neoclassical bank: portico of fluted columns, big banking hall (waiting area, teller line, check-writing island), vault room with a row of green safes and a strongroom behind a round vault door, two small offices, staff toilet'),
 ('hideyourjunk','Hide Your Junk: Storage Units','rays_storage_units','half-plot self-storage yard: razor-wire chain-link with one gate, 16 units with orange roller doors (locked, a few open, 2-3 random units worth looting), yellow locker bank under a canopy, small office'),
 ('littleprick','Little Prick Clinic','piety_medical_clinic','half-plot walk-in clinic under a clay-tile gable roof: waiting area (teal bench seating, herringbone oak) with the reception counter and secretary area, a corridor to two consulting rooms, a jab room, the doctor\'s office and an accessible toilet; staff yard behind'),
 ('greasyneedy','Greasy & Needy Diner','diner','half-plot 1950s diner on the back half of the plot: booths, counter with chrome stools, back bar, jukebox, kitchen line under a hood, customer toilet; car park with 50s cars in front, neon roof sign, pole sign'),
 ('majorwoody',"Major Woody's Army Surplus",'army_surplus','half-plot army surplus store: shop floor with camo rails, pegboard gondolas, counter, ration shelving; ammo room, office, stock room, toilet; board-fenced motor pool with a block garage, army trucks, a jeep and camo net, open to the alley'),
 ('finalload','The Final Load & Get Nailed','laundromat','half plot split into two businesses: The Final Load laundromat (bank of coin-op washers on a tiled plinth, stacked dryers, folding island, carts, waiting chairs, change machine, utility room) and Get Nailed nail salon (lit polish wall, reception, manicure stations, pedicure thrones, customer toilet, back room); vending machines and benches out front; dingy back yard'),
 ('pizzabytes','PizzaBytes','bakery','half-plot pizza restaurant: dining room (booths, gingham four-tops, arcade cabinets), order counter with a heated slice case, open wood-fired dome oven and make line; kitchen (conveyor oven, dough mixer, proofing rack, fryer), walk-in cooler, dry stores, office, customer toilet; patio with parasols, scooter, pole sign, giant roof slice'),
 ('kebabwok','Kebabsolutely & Nightmare on Wok Street','mr_foos_takeout','half plot split into two takeaways: Kebabsolutely (doner spits, salad counter, fryer) and Nightmare on Wok Street (flaming wok range under a hood, hot cabinet, fish tank); waiting benches, customer toilets, kitchens, questionable back rooms (chained freezers, MEAT (MIXED) boxes, camp beds, card tables, dodgy stock); vending machines and benches out front; dingy yard')]
SKIP = set('K T P PI SURF surf build CACHE LOTTREES GRAVESP ZSPOTS KEEP STONES NAMES ENG COUNT MX0 MX1 MZ0 MZ1 MH MCX PORT SX0 SX1 SZ0 SZ1 SH VX VZ FZ GW PATHW CZ RING e _r NX0 NX1 NZ0 NZ1 H CX TW TZ1 RISE EAVE X0 X1 Z0 Z1 FRONT LK RIGHT BACK PART PARTX PZ PX OV CEIL'.split())
out = []
for f, name, id_, kind in B:
    s = open(os.path.join(L, f + '.js')).read()
    top = [m for m in re.findall(r'^  (?:function|const) ([A-Za-z_]\w*)', s, re.M) if m not in SKIP]
    i = s.find('  const SURF = {}'); j = s.find('  /* ====', i)
    surfs = re.findall(r'^ {6}(\w+): ', s[i:j], re.M) if i >= 0 else []
    secs = re.findall(r'^ *(?:/\* -{3,} (.*?) -{3,} \*/|// -{3,} (.*?) -*$)', s, re.M)
    secs = [a or b for a, b in secs]
    bf = re.search(r'function (b[A-Z]\w*)\(x, z, t\)', s)
    out.append(f"### {name} — `js/layers/{f}.js`\n{kind} · NEWCAT id `{id_}` · builder `{bf.group(1) if bf else '?'}` · {len(s.splitlines())} lines\n")
    out.append(f"- **Helpers / painters:** {', '.join('`%s`' % t for t in top)}")
    out.append(f"- **Surfaces (`surf('key')`):** {', '.join(surfs)}")
    out.append("- **Sections** (grep the text to jump there):")
    out += ['  - ' + x for x in secs]
    out.append('')
print('\n'.join(out))
