// Облога Корвена — entry point of the story.
// The single source of game state: resources, loyalty, knowledge and flags are
// all VARs here. The engine only reads them (HUD, journal, summary) and never keeps copies.

INCLUDE prologue.ink
INCLUDE defeat.ink
INCLUDE test/m01.ink
INCLUDE test/m02.ink

// --- Resources, 0..100 (content/resources.json says how the HUD shows them) ---
VAR bread = 60
VAR gold = 60
VAR walls = 60
VAR order = 60

// --- Council loyalty, 0..10 (content/council.json says how it reads in words) ---
VAR loy_shtarn = 5
VAR loy_horn = 5
VAR loy_anselm = 5
VAR loy_bozhena = 5
VAR loy_ferrante = 5
VAR loy_isolde = 5
VAR loy_tobias = 5
VAR loy_verena = 5

// --- Knowledge (k_*): set by the tag # journal:<id>, opens hidden council options ---
VAR k_smiths = false
VAR k_timber = false

// --- Flags: consequences of decisions (f_*) ---
VAR f_gates_closed = false
VAR f_refugees_in = false
VAR f_refugees_filtered = false
VAR f_spy_inside = false
VAR f_smiths_in = false
VAR f_suburbs_burned = false
VAR f_suburbs_left = false
VAR f_suburbs_timber = false

-> END

// Change a resource and keep it within 0..100: ~ res(bread, -15)
=== function res(ref value, delta)
~ value = MAX(0, MIN(100, value + delta))

// Change an advisor's loyalty and keep it within 0..10: ~ loy(loy_tobias, 2)
=== function loy(ref value, delta)
~ value = MAX(0, MIN(10, value + delta))

// What the city eats and pays every month. Called at the start of each month's ink_end.
=== function upkeep()
~ res(bread, -8)
~ res(gold, -6)
