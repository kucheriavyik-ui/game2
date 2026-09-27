# Арт: план генерацій і промпти

Бюджет: **40 генерацій** (trial). План нижче — 37, запас 3 на повтори. Генерації запускаються лише після підтвердження автором; спершу один пробний асет.

## Базовий стильовий промпт

Додається до кожного опису:

> grimdark medieval port city under siege and plague, muted desaturated palette, dirty browns, cold greys, sickly greens, rust-red accents, top-down 3/4 view, clean readable pixel art, no text

Спільні параметри: `view: "low top-down"`, `outline: "single color black outline"`, `shading: "basic shading"`, `detail: "medium detail"`. Тайл 32×32, персонажі на полотні 48 px.

## 1. Персонажі — `create_character`, standard, 4 напрямки (1 ген. кожен)

| id | Опис | Ген. |
|---|---|---|
| `anselm` | tired middle-aged inquisitor investigator, short dark beard, worn black leather coat with high collar, dull steel breastplate under it, gloved hands, no weapon, slouched posture | 1 |
| `rat` | scrawny street urchin boy about 12, oversized patched grey coat, bare feet, shaved head with scars, sly grin | 1 |
| `orso` | tall cold guild merchant in his fifties, immaculate dark blue velvet doublet with silver chain, grey hair combed back, gloves, thin lips | 1 |
| `verena` | stout tavern keeper woman in her fifties, stained brown apron over dark red dress, hair in a bun, rolled sleeves, thick forearms | 1 |
| `hedda` | ancient hunched gravedigger woman, ragged grey-green cloak, hood, wooden shovel on her back, bandaged hands, milky eye | 1 |
| `tobias` | young gaunt monk physician, undyed wool habit with rope belt, dark circles under eyes, leather apron with stains, shaved tonsure | 1 |

**Пробний асет: `anselm`.** Якщо стиль не той — правимо промпт до серії.

## 2. Ходьба — `animate_character`, template `walk`, 4 напрямки (1 ген./напрямок)

Лише `anselm`: 4 генерації. NPC у грі стоять на місці.

## 3. Тайли — `create_image_pixen`, 32×32, без прозорості (1 ген. кожен)

Одна текстура на символ легенди. Промпт: «seamless tileable top-down texture of …».

| Ключ у manifest | Опис | Ген. |
|---|---|---|
| `wall` | dark stone wall top, wet basalt blocks with moss in the cracks | 1 |
| `cobblestone` | uneven wet cobblestone street, grey with dirt between stones | 1 |
| `mud` | trampled dark mud with puddles and straw | 1 |
| `pier` | weathered wooden pier planks, grey-brown, gaps between boards | 1 |
| `water` | dark harbour water, oily, sickly green-grey, slight ripples | 1 |
| `floorboards` | old tavern floorboards, dark brown, beer stains | 1 |
| `table` | rough wooden table top seen from above, knife marks | 1 |
| `bar` | tavern bar counter top seen from above, dark polished wood with rings from mugs | 1 |
| `flagstone` | cold grey stone flagstones, cracked, faint dried stains | 1 |

## 4. Предмети — `create_image_pixen`, 32×32, прозорий фон (1 ген. кожен)

| id сутності | Опис | Ген. |
|---|---|---|
| `port_board` | wooden notice board with nailed parchments, seen from above | 1 |
| `port_crate` | broken wooden crate with a wax seal, straw inside | 1 |
| `port_net` | torn fishing net heap with a broken oar | 1 |
| `port_pillory` | iron pillory post with chain and collar, dark stain below | 1 |
| `port_cart` | gravedigger's black wooden handcart with a shroud | 1 |
| `tavern_hearth` | stone hearth with low fire and a small green brass bell on the mantel | 1 |
| `tavern_chalkboard` | slate chalkboard with smudged marks (no readable text) | 1 |
| `tavern_dice` | tavern table corner with dice and a knife | 1 |
| `inf_cot` | infirmary cot with a body under a grey shroud | 1 |
| `inf_censer` | brass censer on a chain with smoke | 1 |
| `inf_ledger` | open heavy ledger book on a lectern | 1 |
| `inf_backdoor` | locked heavy wooden door with iron bands, seen from above in a wall | 1 |

Якщо бюджет тисне — спершу ріжемо `tavern_dice`, `inf_censer`, `port_crate` (їх можна лишити плейсхолдерами).

## 5. Портрети — `create_image_pixen`, 64×64 (1 ген. кожен), лише нейтральний вираз

Промпт: «pixel art bust portrait, facing viewer, dark background, …» + опис персонажа з таблиці 1. Шість портретів: `anselm_neutral`, `rat_neutral`, `orso_neutral`, `verena_neutral`, `hedda_neutral`, `tobias_neutral`. Інші вирази (`rat_smirk`, `verena_smile`, `tobias_tired`, `tobias_angry`) падають на нейтральний, доки не буде бюджету.

## Підсумок

| Група | Ген. |
|---|---|
| Персонажі | 6 |
| Ходьба Ансельма | 4 |
| Тайли | 9 |
| Предмети | 12 |
| Портрети | 6 |
| **Разом** | **37** |

## Журнал генерацій

_Тут фіксуються реальні промпти, id завдань і результат кожної генерації._

| Дата | Асет | Інструмент і параметри | id | Ген. | Результат |
|---|---|---|---|---|---|
| 2026-09-25 | `anselm` (пробний) | `create_character`, standard, 4 dir, size 48, low top-down, single color black outline, basic shading, medium detail. Промпт: опис з таблиці 1 + базовий стильовий | `f75de33f-0b1c-4eb8-b022-afba82d9c59f` | 1 | ✅ Полотно 68×68, персонаж ≈40px. Файли `characters/anselm/{south,east,north,west}.png`. Стиль підходить — беремо за еталон серії. |
| 2026-09-25 | `rat` | як `anselm`, промпт з таблиці 1 | `978434f9-2c9f-4394-854e-d6a57607fa0a` | 1 | ✅ `characters/rat/*.png` |
| 2026-09-25 | `orso` | як `anselm` | `5f679049-fbde-46dc-bbea-49f7e87f00e5` | 1 | ✅ `characters/orso/*.png` |
| 2026-09-25 | `verena` | як `anselm` | `6d0c8f8b-a964-46e9-a8ef-238b4cb67d05` | 1 | ✅ `characters/verena/*.png` |
| 2026-09-25 | `hedda` | як `anselm` | `7cd6652b-d520-4af1-90cb-159ea5a1d444` | 1 | ✅ `characters/hedda/*.png` |
| 2026-09-25 | `tobias` | як `anselm` | `ad5266b7-43a6-46e4-a68c-2af83455f139` | 1 | ✅ `characters/tobias/*.png` |
| 2026-09-25 | `anselm` ходьба | `animate_character`, template `walk`, 4 напрямки | group `b87a00b1-fec4-4550-938d-d003bcbf9a63` | 4 | ✅ 6 кадрів × 4 напрямки, `characters/anselm/walk/<dir>/<0-5>.png` |
| 2026-09-25 | 9 тайлів | `create_image_pixen`, 32×32, high top-down, medium detail, промпти з таблиці 3 («seamless tileable top-down texture of …» + стиль) | wall `e4e68fb8`, cobblestone `8d845097`, mud `3804114b`, pier `82a1fdab`, water `018b4293`, floorboards `8238299f`, table `650f9bb2`, bar `ae9c5114`, flagstone `203ef06d` | 9 | ✅ `tiles/<name>.png`. Стіни й бруківка близькі за тоном — стіни затемнено через `overlay` у легенді локацій. |
| 2026-09-25 | 12 предметів | `create_image_pixen`, 32×32, прозорий фон, low top-down, промпти з таблиці 4 + стиль | board `2b7a98d9`, crate `ffe4d805`, net `54f7cac1`, pillory `fbf4382d`, cart `c14773fe`, hearth `f48751d5`, chalkboard `9d9f0d6a`, cot `2a9c4f47`, censer `45cf7b7e`, ledger `0022a910`, backdoor `ffd5ae37`, dice `8e153236` | 12 | ✅ `objects/<entity id>.png` |
| 2026-09-25 | 6 портретів | `create_image_pixen`, 64×64, view side, «pixel art bust portrait facing the viewer, dark plain background: …» + опис + стиль | anselm `ad7acc97`, rat `750c9e8a`, orso `a33703fc`, verena `bc5674a8`, hedda `ba0ac770`, tobias `9758d972` | 6 | ✅ `characters/<id>/portrait_neutral.png` |
| 2026-09-25 | `port_board` повтор | `create_image_pixen`, 32×32, прозорий фон: «free-standing wooden notice board on two posts with several parchment sheets pinned to it, front view at a low top-down angle …» | `10121123` | 1 | ✅ Перша версія була схожа на хатку; ця — дошка на двох стовпах. Замінено. |

**Trial: використано 38 із 40.**

## Етап A (підписка Tier 2): будівлі

Інструмент `create_building_kit`, `tile_type: square_topdown`, `tile_size: 32`, `tile_view_angle: 90` (земля строго зверху → клітинка 32×32), `wall_angle: 70` (висота фасаду ≈72px; менший кут дає *нижчу* стіну), `layout: materials`. Підлога скрізь: «uneven wet cobblestone street, grey stones with dirt between them, muted desaturated palette». Кожен набір — 80 елементів, 20–40 генерацій. Індекси елементів однакові в усіх наборах (див. `src/systems/Buildings.ts`).

| Дата | Набір | Стіни / дах | id | Результат |
|---|---|---|---|---|
| 2026-09-25 | проба 1 | базальт із мохом / черепиця з мохом; кут землі за замовчуванням | `39307cbb` | ❌ клітинка 32×24 — не сумісно з сіткою |
| 2026-09-25 | проба 2 | те саме; `tile_view_angle 90`, `wall_angle 35` | `e04f57ab` | ❌ геометрія ок, але стіна 48px, без вікон, мох повторюється |
| 2026-09-25 | проба 3 | вікна зі свічками / черепиця без моху; `wall_angle 18` | `75bd7721` | ❌ стіна лише 32px |
| 2026-09-25 | `stone` | «dark weathered stone house walls … every wall segment has a small shuttered window … dim candlelight» / «old clay roof tiles … rust-red and brown … no moss»; `wall_angle 70` | `51f6078a` | ✅ таверна. `kits/stone/` |
| 2026-09-25 | `timber` (v1) | «half-timbered … dark oak beams over cracked dirty plaster …» / «old wooden shingle roof …» | `f12263ed` | ⚠️ білий незафарбований прямокутник у `tile_3`; перегенеровано |
| 2026-09-25 | `chapel` | «pale grey stone chapel walls … tall narrow arched window with dark leaded glass» / «dark slate roof …» | `ced64ae1` | ✅ лазарет. `kits/chapel/` |
| 2026-09-25 | `ruin` | «ruined house walls destroyed by siege bombardment, fire-blackened …» / «collapsed burnt roof …»; `wall_tiles 1` | `367b6dc7` | ✅ руїна. `kits/ruin/` |
| 2026-09-25 | `timber` (v2) | як v1, дах «… shingles in overlapping rows …», `seed 7` | `bdec0818` | ✅ малі будинки. `kits/timber/` |

## Етап B: земля з переходами

Інструмент `create_topdown_tileset`, 32×32, `view: high top-down`, `transition_size 0.25` (16 кутових тайлів; 0.5 у pro дає 25 тайлів зі «стінками», які автотайлер не підтримує). Набори зчеплені через `lower_base_tile_id`/`upper_base_tile_id`, щоб одна й та сама вода/багно/причал була в усіх парах. Аркуш — `/mcp/tilesets/<id>/image`, розкладка — `/metadata` (`corners` + `bounding_box`), обидва в `assets/terrain/`. Автотайлер: `src/systems/Terrain.ts`, конфіг — блок `terrain` у `location.json`.

| Дата | Набір | Пара | Режим | id | Результат |
|---|---|---|---|---|---|
| 2026-09-25 | shore v1 | вода → багно | standard | `22907b12` | ❌ вода — рівна зелена заливка, багно помаранчеве; палітру не слухає |
| 2026-09-25 | street v1 | багно → бруківка | standard | `decf7fa4` | ❌ те саме |
| 2026-09-25 | pier_water v1 | вода → причал | standard | `959c8ca4` | ❌ те саме |
| 2026-09-25 | pier_mud v1 | багно → причал | standard | `7f6feef9` | ❌ те саме |
| 2026-09-25 | shore v2 | вода → багно; «very dark … almost black desaturated teal-grey … no bright colours» | pro, guidance 12 | `8430bfb7` | ✅ `terrain/shore.*` |
| 2026-09-25 | street v2 | багно → бруківка | pro | `4fe144e7` | ✅ `terrain/street.*` |
| 2026-09-25 | pier_water (0.5) | вода → причал | pro | `bf2e74f9` | ❌ 25 тайлів — не використовується |
| 2026-09-25 | pier_water v2 | вода → причал, 0.25 | pro | `38b13256` | ✅ `terrain/pier_water.*` |
| 2026-09-25 | pier_mud v2 | багно → причал | pro | `462d080d` | ✅ `terrain/pier_mud.*` |

Висновок: для землі брати лише **pro** — стандартна модель ігнорує палітру. Базові id pro-серії: вода `fe4c2c3b`, багно `8bcb0934`, бруківка `d0e8782c`, причал `10d27a6a` — використовувати для нових пар.

## Етап C: масштаб, двері, декор

`create_image_pixen`, прозорий фон, `view: low top-down`, промпт «… seen from a low top-down angle, sprite on transparent background» + стиль. Полотно кратне 4, при стороні <32 — лише квадрат. Орієнтир масштабу: людина ≈40px.

| Дата | Асет | Розмір | id | Результат |
|---|---|---|---|---|
| 2026-09-25 | `port_cart` v2 | 56×48 | `2f28ceb7` | ✅ |
| 2026-09-25 | `port_pillory` v2 | 32×56 | `ae840a7b` | ✅ |
| 2026-09-25 | `inf_cot` v2 | 48×32 | `a09962d6` | ✅ |
| 2026-09-25 | `port_board` v3 | 40×44 | `dacbe623` | ✅ |
| 2026-09-25 | `tavern_hearth` v2 | 48×44 | `0744db9e` | ✅ |
| 2026-09-25 | `inf_ledger` v2 | 32×44 | `fad02c6a` | ✅ |
| 2026-09-25 | `inf_backdoor` v2 | 32×48 | `342fc710` | ✅ |
| 2026-09-25 | `door_tavern` (двері як спрайт у прорізі) | 32×48 | `01420cab` | ✅ `objects/door_tavern.png` |
| 2026-09-25 | `door_infirmary` (аркові) | 32×48 | `63dc857c` | ✅ |
| 2026-09-25 | декор: barrel, barrels, boat, lantern, post, rubble, sacks, puddle, cot, bench, crates | 32–64px | `df897312`, `c4674751`, `ee87c4a7`, `25e6b528`, `8125a86a`, `071ae984`, `6193bcb9`, `db05b4be`, `a7d8cf89`, `93211529`, `a12033b6` | ✅ `decor/<name>.png`, сутності `type: "decor"` |
| 2026-09-25 | rubble v1 (бруківка → щебінь) | tileset pro | `e916f46c` | ❌ помаранчевий край, як жаринки |
| 2026-09-25 | rubble v2 «only greys … no orange, no fire», guidance 14 | tileset pro | `af028634` | ✅ `terrain/rubble.*` |
| 2026-09-25 | `door_out` (двері в нижній стіні інтер'єрів, вид зверху) | 32×32 | `1d3de509` | ✅ спільний для таверни й лазарету |

## Фідбек №2 (2026-09-26)

| Асет | Інструмент / розмір | id | Результат |
|---|---|---|---|
| kits `stone`, `timber`, `chapel` без вікон («plain solid wall with no windows and no doors») | `create_building_kit`, як раніше | `614ba6ab`, `673f1f4a`, `796818a3` | ✅ замінили версії з сіткою мікровікон |
| `window_stone` (віконниці, свічка) | pixen 40×40, `view: side` | `de060a98` | ✅ `decor/`, на фасаді `wall: true` |
| `window_timber` (свинцеві шибки) | pixen 40×40 | `fb17d7da` | ✅ |
| `window_chapel` (арка, вітраж) | pixen 32×56 | `8e457736` | ✅ |
| `door_out` v2 (подвійні двері в стіні) | pixen 48×48 | `e5d8e841` | ✅ |
| `table`, `tavern_dice` (стіл із кістками) | pixen 64×48 → замало, повтор 96×64 | `beb06d47`/`f47fe9c2` → `1f114a30`, `6b385268` | ✅ 96×64 |
| `inf_cot`, `cot` | pixen 64×40 → замало, повтор 96×64 | `28305c94`/`64472555` → `63a4d963`, `109d35ef` | ✅ 96×64, ліжко ≈80px |
| `shelf`, `keg`, `candles` | pixen 48×56, 48×40, 32×56 | `0447c8a4`, `cbd283c4`, `350772d8` | ✅ декор таверни |
| `rat` v2 — дитячі пропорції | `create_character` standard, size 40, custom proportions (head 1.3, legs 0.75, shoulders 0.7) | `9e970db8` | ✅ ≈39px заввишки |

## 9. Розділ 2 «Залізний маршал» (2026-09-26, ≈115 генерацій разом із наборами)

Ті самі параметри, що й у розділі 1: персонажі `create_character` standard, 4 напрямки, size 48, low top-down; портрети pixen 64×64 `view: side`; вирази — `create_image_pixflux` img2img від нейтрального (`init_image_url` = download-посилання PixelLab на нейтральний портрет, `init_image_strength` 200–220); предмети pixen `no_background`, полотно з запасом (96×64 для столів і тіла).

| Асет | Інструмент / промпт | Job / id | Результат |
|---|---|---|---|
| `bozhena` (пробний) | young inquisitor nun, light blonde hair pulled back under grey hood pushed halfway back, grey Inquisition cloak, notebook on belt | `fa167761` | ✅ |
| `isolde` | stern beautiful guild merchant woman ~40, dark auburn hair pinned up, wine-red velvet gown, silver clasps, gloves in hand | `baf1f20f` | ✅ |
| `ferrante` | thin nervous treasurer, ink-stained fingers, dark blue clerk's robe, black skullcap, spectacles, ledger under arm | `1fa11dc9` | ✅ |
| `horn` | broad veteran captain, scar across lip, cropped grey-brown hair, dented breastplate over dark red gambeson | `1a9a8e2b` | ✅ |
| `martyn` | frightened cupbearer boy ~16, linen shirt, brown vest, apron, cloth cap, pewter jug (size 44) | `d92573e4` | ✅ |
| `nomi` | quadruped `cat`, size 32: scruffy grey and white stray cat, white chest and paws, faint tabby stripes, ragged ear, green eyes | `23e9778c` | ✅ полотно 48×48, кіт ≈24px |
| Портрети нейтральні | bozhena `38fd0560`, isolde_composed `c9928604`, ferrante_nervous `3f528a82`, horn_angry `b17b41e0`, servant_scared `900cb771`, nomi `f4059382` | | ✅ |
| Вирази (pixflux img2img) | bozhena grave `4eba587c`, soft `131d3971`, surprised `f9eada1c`, conflicted `235eed81`, tired `e1743d72`; isolde cracking `eb859f3a`, broken `ffe5650c`; horn_broken `44fd2166`; ferrante_terrified `2d86041d`; rat_grin `45c2f6aa`; verena_serious `cfdfbeff`; hedda_eerie `125a5b04`; tobias_urgent `0055c751` | | ✅ (для старих персонажів init_image — base64 локального нейтрального) |
| `anselm_tired` | pixen з нуля (base64 для img2img обрізався в транспорті MCP — >5 КБ не проходить) | `54cb8dd4` | ✅ |
| Набір `townhall` | `create_building_kit` як у розділі 1 (square_topdown, 32, view 90, wall_angle 70, materials): «grand town hall walls of large cut pale grey stone blocks… plain solid wall with no windows and no doors», дах «dark grey slate roof tiles» | `f70989ba` | ✅ `kits/townhall/` |
| Набір `guild` | «ochre lime plaster over red brick, plaster cracked and flaking… no windows and no doors», дах «old clay roof tiles, dull rust-red» | `37cd82e9` | ✅ `kits/guild/` |
| Двері | `door_home` 32×48 `9cff4065`, `door_townhall` `8a5d2326`, `door_guild` `a3b4910a` (pixen, `view: side`) | | ✅ |
| Предмети ратуші | hall_body 96×64 `a227c570`, hall_cup_marshal 32 `65ab39a6`, hall_cup_isolde `10f4ec5e`, hall_plate `72ed7724`, hall_crest 40×48 `277d7f26`, hall_map 48×56 `d657db58`, hall_menu 32×44 `08f8b19c`, hall_folder 64×48 `9a7d6ba4`, office_desk 96×64 `34375f3f`, office_map 64×48 `73de6fd2`, office_chair 64×64 `27ef21f9`, kitchen_barrel 32×40 `4a14693a`, kitchen_cups 48×40 `38699da4`, kitchen_ledger 32×40 `08ee7c50` | | ✅ |
| Предмети Гільдії | guild_ledger 64×48 `02499d96`, guild_scales 32×40 `ed9aaa1c`, guild_notice 40×44 `c884f446`, wh_figs 48×40 `5c4dfbdb`, wh_ledger `7097570a`, wh_pennant 32 `cc25f37b`, wh_sacks 48×40 `e05bf4f3`, rooms_portrait 32×40 `18fe8690`, rooms_vase 32 `2285880b`, rooms_window 40×48 `4b4989f2` | | ✅ |
| Предмети дому | home_desk 96×64 `2651dc8b`, home_stove 48×56 `daa87be8`, home_bowl 32 `390caccb` | | ✅ |

Урок: PixelLab тримає не більше 10 задач одночасно — серію запускати хвилями через `wait_for_jobs`.

| `flagstone_hall` (спокійніша плитка, кухня і склад) | pixen 32×32 «worn dark grey flagstone floor, large flat slabs, low contrast» | `1e3da022` | ✅ у залі ради виглядала ромбами — там лишили дошки |
| `carpet` (доріжка в залі ради, символ `c`) | pixen 32×32 «old dark red carpet runner, faded geometric border» | `a156b983` | ✅ |

## 10. Правки після фідбеку по розділу 2 (2026-09-26, 32 генерації)

Портрети розділу 2 вийшли як «бюст-статуя на постаменті» з міським фоном, а в розділі 1 — обличчя на весь кадр. Робочий промпт для портретів тепер: «pixel art close-up head and shoulders portrait of … facing the viewer, her face large and centered filling most of the frame, flat plain dark grey background with nothing else», для Божени ще «not a statue, no pedestal» і «golden blonde hair, warm pale skin» (без цього виходить майже чорно-біла).

| Асет | Job | Результат |
|---|---|---|
| bozhena_neutral v2 (перша спроба `5398fd27` — сіра) | `810a3af0` | ✅ |
| bozhena grave/soft/surprised/conflicted/tired v2 (pixflux від `810a3af0`, 220) | `e0e72287`, `49ee1f89`, `457eb884`, `1da5529f`, `9db6aab2` | ✅ |
| isolde_composed v2, cracking, broken | `4eb42822`, `861b5f1d`, `7153e549` (200) | ✅ |
| servant_scared v2 (Мартин) | `f135a164` | ✅ |
| `clerk` — клерк Гільдії: персонаж standard 48 / портрет | `3ed1536b` / `0afb68bf` | ✅ |
| Високі вікна: `window_tall_stone` 40×64, `window_tall_timber` 48×64 (`view: side`) | `4a39a7bb`, `c5914faa` | ✅ `wall: true, dy: -24` |
| Двері: `door_out_tall` 48×64 (вихід з усіх інтер'єрів), `door_inner` 40×64 (двері у верхній стіні) | `2f2fb13b`, `328a8712` | ✅ |
| Меблі (pixen, `no_background`): bookshelf 48×64, chest 40×32, rug 96×64 (`floor: true`), tapestry 32×64 (на стіну), armor_stand 40×64, dresser 48×64, fireplace 64×64, canopy_bed 96×80, vanity 48×64, wardrobe 48×64, chair 32×32 | `6f8ff67c`, `d506330b`, `e24a2a8d`, `906eff94`, `f6f22cf4`, `521a01c3`, `c63b16ab`, `4cf46282`, `28eac95e`, `3a4b4879`, `2e8d6642` | ✅ |
| Площа: well 48×64, stall_veg 64×64, stall_grain 64×64, sq_statue 48×80 (предмет) | `bdcd8f64`, `2ac4bc43`, `643d8ecd`, `954adce0` | ✅ |
| `nomi` за фото автора (піщано-бурий смугастий таббі, зелені очі): спрайт v2 `3c83cf39` — яскраво-рудий мультяшний ❌; v3 «muted greyish sandy-brown tabby (not orange, not ginger), bold dark stripes», `medium shading`, `text_guidance_scale 12` | `0c0a856a` | ✅ |
| Фронтальні меблі (автор: «лавки і столи в різні сторони»): table `afc081a5`, tavern_dice `57d3f809`, bench `c534745c`, hall_body `3e90c13b`, office_desk `ece17b05`, home_desk `c8bd9a0b`, hall_folder `51a9bf05`, guild_ledger `0e3cd218`, canopy_bed `8c248deb`, wh_figs `61c40f66`; друга спроба «classic 16-bit RPG style, orthographic axis-aligned top-down view with the front face visible, no perspective»: cot `1d8ea1ad`, inf_cot `cb456428`, office_map `85dfcc2b` | pixen, `view: high top-down`, «seen from straight in front and slightly above, perfectly horizontal, long side parallel to the bottom edge, symmetrical, not rotated, not diagonal» | ✅ 16 генерацій |
| `nomi_neutral` v2 — brown tabby (v1 вийшов рудо-золотим): «brown tabby cat with cool greyish-brown taupe fur, bold black mackerel stripes, black M marking on the forehead … NOT orange, NOT ginger, NOT golden, NOT red fur», pixen 64×64 `view: side` | `e547e73a` (pixflux-перефарбування `6ff40f5d` лишилось золотим ❌) | ✅ |
| `fireplace` → камін у стіні: «stone fireplace built flush into a grey stone wall, seen perfectly straight from the front, flat, symmetrical, no side walls visible», pixen 64×64 `view: side`; ставиться як `wall: true, dy: -16` | `d5e648b0` | ✅ старий «окремий» камін `decor/fireplace.png` більше не використовується |
| `office_chair` — лише шкіряне крісло, фронтально (старе було крісло+камін навскоси) | `ef53b30d` | ✅ |
| `nomi_neutral` v1 за фото автора: «sandy golden-brown mackerel tabby, dark stripes on forehead, cream-white chin, pink nose, half-closed green eyes» | `5646605a` | ✅ |

## 11. «Облога Корвена», M4 (2026-09-26, 30 генерацій)

Параметри як у розділах 9–10: персонажі `create_character` standard, 4 напрямки, size 48, `low top-down`, опис = базовий стильовий промпт + зовнішність; портрети pixen 64×64 `view: side` з промптом «pixel art close-up head and shoulders portrait of … facing the viewer, face large and centered filling most of the frame, flat plain dark grey background with nothing else, no text»; вирази — `create_image_pixflux` img2img (`init_image_strength` 220). Для старих портретів `init_image_url` — raw-посилання на файл у публічному репозиторії `kucheriavyik-ui/game2` (base64 >5 КБ обрізається).

| Асет | Опис / інструмент | Id | Результат |
|---|---|---|---|
| `shtarn` (пробний) | old grizzled city marshal ~60, bald, white stubble, scarred face, worn plate armor, dark grey cloak | `9f1cf8f4` | ✅ |
| `protector` + ходьба `walk` (6 кадрів × 4) | young Protector ~30, short dark hair, clean-shaven, all in black: fitted doublet with high collar, trousers, boots, cloak with silver clasp, sword | `e5ef3680` | ✅ |
| `vido` | young thin wall guard, dented kettle helmet, gambeson, spear | `7709c6b6` | ✅ |
| `myroslava` | sturdy woman blacksmith ~40, sooty leather apron, burned hands, dark braid, bundle | `00e95331` | ✅ |
| `lukash` | thin polite scribe ~30, tidy worn brown coat, ink-stained fingers, satchel | `61abd3d8` | ✅ |
| `hanna` | stout baker woman ~50, floury apron, headscarf, bread peel | `d7ede004` | ✅ |
| `gnat` | old fisherman ~70, white beard, knitted cap, patched oilskin coat | `9a8402f2` | ✅ |
| `bartosh` | broad dockworker, shaved head, torn sleeveless shirt, iron crowbar | `b70689a8` | ✅ |
| Портрети нейтральні | shtarn `7628265a`, vido `dfcaf468`, myroslava `487dc2b5`, lukash `498d2115`, hanna `a439b483`, gnat `108cb914`, bartosh `fec10e48` | | ✅ |
| Вирази (pixflux) | shtarn_grim `6c60c652` (від нового нейтрального), horn_eager `a01c1103`, anselm_smirk `ca8af517`, verena_smirk `f7d4078c` | | ✅ зміни тонкі |
| Тайли брами (pixen 32×32) | `city_wall` «thick old city wall of large grey cut stone blocks, moss» `0320e209`; `gate` «oak planks with iron bands» `392dc421`; `gate_bars` «iron portcullis grid» `cc90fe46` | | ✅ брама й ґрати вийшли арками в рамці — у ряд читаються як надбрамні арки |
| Предмети (pixen, `no_background`) | door_wicket 32×48 `3362107f`, gate_tar (казан смоли) 32×40 `755639c3`, council_table 96×64 (стіл з картою й свічками, фронтально) `f5232e9f`, gate_breach 48×40 `3c4cca9f`, gate_flag (прапор Корвена) 32×48 `d99db52f`, pier_bell 32×48 `67a0425c` | | ✅ |

## 12. Місто: міська стіна і брама (2026-09-26)

| Асет | Інструмент / промпт | Id | Результат |
|---|---|---|---|
| Набір `citywall` | `create_building_kit` як етап A (square_topdown, 32, view 90, wall_angle 70, materials): стіни «massive fortified city wall of huge weathered grey cut stone blocks, dark mortar, a few narrow arrow slits, stains and cracks … plain solid wall with no windows and no doors», верх «top of a city wall: wide worn stone rampart walkway with crenellated battlements» | `7e659eb5` | ✅ `kits/citywall/`, у місті символ `#` |
| `city_gate` 64×72 | pixen `no_background`, `view: side`: «massive arched city gate set in a grey stone city wall, closed heavy oak doors bound with black iron bands and rivets, iron portcullis half lowered in front, seen perfectly straight from the front, flat, symmetrical» | `669a7a41` | ✅ декор на стіні (`wall: true, dy: -20`) |

## 13. Лор: Копарікус, Номі, Лицар Тіла (2026-09-26)

| Асет | Інструмент / промпт | Id | Результат |
|---|---|---|---|
| `kopar_neutral` | pixen 64×64 `view: side`: «gloomy young nobleman about 30, short dark hair, clean-shaven pale stern face, heavy calm unhurried gaze, faint tiredness around the eyes, black fitted doublet with high collar, black cloak with a small silver clasp …» (під наявний спрайт Протектора) | `493f4fb4` | ✅ |
| `kopar_grim`, `kopar_amused` | pixflux img2img від `493f4fb4`, 220 | `0f9df6f6`, `3faa0642` | ✅ |
| `nomi` (спрайт) | `create_character` quadruped `cat`, size 32: «thin scruffy grey cat with a torn left ear, lean body, long tail, pale green eyes, plain solid grey fur without stripes» | `dd07d531` | ✅ полотно 48×48 |
| `nomi_neutral` | pixen 64×64: перша спроба `6107d708` — смугастий таббі ❌; друга «solid uniform smoky grey fur, NO stripes, NO tabby markings, left ear clearly torn with a ragged notch» | `a05a40c9` | ⚠️ сіріший, ледь смугастий, щербина на вусі є |
| `knight` (Лицар Тіла) | `create_character` standard 48: «royal bodyguard knight in dark blackened plate armor without any heraldry, closed great helm hiding the face, a small gold royal seal on the shoulder plate, long dark cloak, tall halberd held upright» | `fba6cef0` | ✅ двоє на варті біля ратуші |

## 14. Рада і городяни (2026-09-26, 16 генерацій)

Параметри як у розділах 9–11 (персонажі standard 48, 4 напрямки; портрети pixen 64×64 «close-up head and shoulders … flat plain dark grey background»).

| Асет | Опис | Id (спрайт / портрет) |
|---|---|---|
| `council_table` v2 160×112 (замінив 96×64) | «long heavy dark oak council table … eight high-backed wooden chairs around it, a large unrolled war map of the besieged city … seen from straight in front and slightly above, perfectly horizontal …», `no_background`, `view: high top-down` | `f2b1e31d` |
| `sira_ruka` (пробний) | silent commander of royal bodyguard knights, closed great helm with a narrow slit, one gauntlet painted ash grey, gold royal seal on the shoulder | `efca7958` / `e6c3997f` |
| `orest` | portly merchant, trimmed grey beard, fur-trimmed brown coat worn thin, heavy purse, rings | `8a42aaa0` / `40e76308` |
| `yadviga` | stern merchant woman ~50, dark green velvet dress, grey bun under a lace cap, account book, keys | `cc3ed8e3` / `b98def9d` |
| `myron` | off-duty veteran sergeant ~40, unbuckled gambeson over mail, scar on the cheek, tankard | `cc3f1839` / `7c9810e1` |
| `hrytsko` | wounded young soldier, bandaged head, arm in a sling, crutch | `4f04f2d1` / `e827fe9c` |
| `yulian` | young novice monk, brown habit, tonsure, stained apron, bowl | `1784b946` / `bc8a9bd1` |
| `olena` | townswoman seamstress ~35, patched grey dress, faded red headscarf, shawl | `75753992` / `4d166973` |

## 15. Стіни інтер'єрів (2026-09-26)

Старий тайл `wall` (мохуватий камінь з Game1, затемнений) у ратуші й інтер'єрах читався як щебінь. Згенеровано два варіанти «верху стіни» (pixen 32×32, `view: high top-down`): `wall_top_stone` — «top of a thick interior stone wall seen from directly above, neat rows of large dressed grey limestone blocks with thin dark mortar lines, clean, no moss» (`00646851`, ✅ обрано, з overlay `rgba(20,14,10,0.25)`), `wall_top_beam` — «dark oak beam cap over smooth pale grey plastered stone» (`d23de35a`, запасний). Символ `#` у ратуші, таверні, лазареті й Домі Гільдії.

## 16. Десятник Конрад (колишній Мирон), повтор (2026-09-26)

Перша версія (`cc3f1839` / `7c9810e1`) мала круглий шолом і синю форму — автор: «як космонавт». Новий промпт прямо забороняє шолом.

| Асет | Опис | Id |
|---|---|---|
| `myron` спрайт | `create_character` standard 48, 4 dir, low top-down: «weathered medieval garrison sergeant about 45, bareheaded with close-cropped grey hair and short grizzled beard, scar across the cheek, padded brown quilted gambeson with leather belt, short sword at the hip, worn leather boots, no helmet, no metal armor on the head» + стиль | `18bef3d7` |
| `myron_neutral` | pixen 64×64 `view: side`: «close-up head and shoulders … bareheaded, close-cropped grey hair, short grizzled beard, old scar across the cheek, tired shrewd eyes, padded brown quilted gambeson …, no helmet, flat plain dark grey background» | `cf3d54af` |

## 17. Місяць 4 «Дзвони Корвена»: посол Ерден (2026-09-26)

| Асет | Опис | Id |
|---|---|---|
| `erden` спрайт | `create_character` standard 48, 4 dir: «steppe nomad envoy, short slim man about 50, weathered tan face, thin grey moustache, simple plain dark blue quilted coat without ornament, soft felt cap, one large gold ring with a red stone, calm polite posture, hands folded» + стиль | `1b1e68df` |
| `erden_neutral` | pixen 64×64 `view: side`: «close-up head and shoulders … weathered tan face, high cheekbones, narrow calm dark eyes, thin grey moustache, soft felt cap, plain dark blue quilted collar, polite faint smile, flat plain dark grey background» | `4133ff26` |
| `envoy_tent` 96×72 | pixen `no_background`, low top-down: «small round steppe nomad felt tent (yurt) with a low domed roof, grey-white felt walls with dark rope bands, dark wooden door flap facing the viewer, a white cloth banner on a pole beside it, a few bulging burlap sacks by the entrance» | `28d2feb0` |

Правило для `scripts/fetch-asset.mjs`: запускати з кореня проєкту і шлях давати відносно `assets/` — інакше файл лягає в `assets/assets/…`.

## 18. Місяці 5–6: Ієронім, Дитко, Магда (2026-09-27)

Ті самі параметри (standard 48, 4 dir; портрети pixen 64×64 `view: side`, «flat plain dark grey background»).

| Асет | Опис | Id (спрайт / портрет) |
|---|---|---|
| `yeremiya` (Проповідник Ієронім) | gaunt barefoot medieval preacher ~45, long unkempt dark hair and beard, ragged patched burlap sackcloth robe tied with rope, bare feet, burning intense eyes | `ca2dffb3` / `c1ee0563` |
| `dytko` (розвідник) | young wiry army scout ~20, hood, mud-smeared dark green cloak, leather jerkin, short bow | `f3231567` / `965b9474` |
| `magda` (кухарка ратуші) | stout cook ~50, grey hair under white linen kerchief, flour-dusted brown dress, stained apron, wooden ladle | `bcb18ac7` / `2d720d5d` |

## 19. Місяці 7 і 9: Каган, Матей, хлопець Гільди (2026-09-27)

Ті самі параметри (standard 48, 4 dir; портрети pixen 64×64). Запущено, але сервер PixelLab повертав помилки під час забирання результатів — перевірити в галереї і докачати `characters/<id>/{south,east,north,west,portrait_neutral}.png`, вписати в manifest (`characters.<id>.idle`, `portraits.<id>_neutral`).

| Асет | Опис | Id (спрайт / портрет) |
|---|---|---|
| `kagan` | old steppe nomad khan ~60, grey hair in a thin braid, weathered calm face, long grey moustache, plain quilted grey-brown felt robe, no crown, hands folded in sleeves | `68f22997` / `1c25fb76` |
| `matey` (колодязник) | lean man ~50, bald with grey stubble, mud-caked brown leather apron, rope over the shoulder, lantern on the belt, stooped | `b4c7486f` / `c1e0d7a9` |
| `stas` (хлопець Гільди) | skinny teenage apprentice ~15, soot-smeared face, short fair hair, oversized leather apron, small hammer; size 44, proportions head 1.2, legs 0.85, shoulders 0.8 | `4cfc27c0` / `3bac790f` |
