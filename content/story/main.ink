// Облога Корвена — entry point of the story.
// The single source of game state: resources, loyalty, knowledge and flags are
// all VARs here. The engine only reads them (HUD, journal, summary) and never keeps copies.

INCLUDE prologue.ink
INCLUDE defeat.ink
INCLUDE months/m01.ink
INCLUDE months/m02.ink
INCLUDE months/m03.ink
INCLUDE months/m04.ink
INCLUDE months/m05.ink
INCLUDE months/m06.ink
INCLUDE betrayal.ink

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

// --- Betrayal (from month 4): at or below this loyalty an advisor betrays once (betrayal.ink) ---
VAR BETRAYAL_AT = 3
VAR b_shtarn = false
VAR b_horn = false
VAR b_anselm = false
VAR b_bozhena = false
VAR b_ferrante = false
VAR b_isolde = false
VAR b_tobias = false
VAR b_verena = false
// Left the council for good (dead, executed, exiled, expelled): no betrayals, no stances, «поза радою» in the journal.
VAR out_shtarn = false
VAR out_horn = false
VAR out_anselm = false
VAR out_bozhena = false
VAR out_ferrante = false
VAR out_isolde = false
VAR out_tobias = false
VAR out_verena = false

// --- Knowledge (k_*): set by the tag # journal:<id>, opens hidden council options ---
// Month 1
VAR k_timber = false
VAR k_horn_harsh = false
VAR k_smiths = false
VAR k_spy_suspect = false
VAR k_bread_math = false
// Month 2
VAR k_real_reserves = false
VAR k_verena_black_market = false
VAR k_hidden_warehouses = false
// Month 3
VAR k_plague_spreading = false
VAR k_dockers_riot_risk = false
VAR k_strait = false
VAR k_isolde_offer = false
VAR k_spy_is_scribe = false
// Month 4
VAR k_horn_sally = false
VAR k_cech_iron = false
VAR k_old_armory = false
// Month 5
VAR k_hedda_graves = false
VAR k_rats = false
VAR k_preacher_paid = false
// Month 6
VAR k_horn_poppy = false
VAR k_figs_ribbon = false
VAR k_marshal_report = false
VAR k_maid_box = false
VAR k_ferrante_letters = false

// --- Flags: consequences of decisions (f_*); where they return is in docs/story ---
// Month 1
VAR f_gates_closed = false
VAR f_refugees_in = false
VAR f_refugees_filtered = false
VAR f_smiths_in = false
VAR f_spy_inside = false
VAR f_spy_marked = false
VAR f_suburbs_burned = false
VAR f_suburbs_left = false
VAR f_suburbs_timber = false
// Month 2
VAR f_rations_guard = false
VAR f_rations_verena = false
VAR f_verena_watched = false
VAR f_free_market = false
VAR f_black_market_grows = false
VAR f_guild_confiscated = false
VAR f_guild_untouched = false
VAR f_isolde_debt = false
VAR f_isolde_humiliated = false
// Month 3
VAR f_quarantine = false
VAR f_port_fed = false
VAR f_plague_spreads = false
VAR f_spy_names = false
VAR f_spy_trial = false
VAR f_spy_hanged = false
VAR f_double_agent = false
VAR f_night_runs = false
VAR f_night_runs_watched = false
VAR f_no_night_runs = false
// Betrayals
VAR f_shtarn_retired = false
VAR f_horn_demoted = false
VAR f_anselm_report = false
VAR f_bozhena_silenced = false
VAR f_ferrante_jailed = false
VAR f_guild_stormed = false
VAR f_tobias_expelled = false
VAR f_verena_partner = false
VAR f_drain_sealed = false
// Month 4
VAR f_arsenal_fire = false
VAR f_bells_melted = false
VAR f_iron_bought = false
VAR f_iron_levy = false
VAR f_old_armory = false
VAR f_cech_paid = false
VAR f_forced_forges = false
VAR f_refugee_forges = false
VAR f_cech_broken = false
// Month 5
VAR f_houses_sealed = false
VAR f_procession = false
VAR f_plague_city = false
VAR f_plague_fires = false
VAR f_rat_bounty = false
VAR f_preacher_jailed = false
VAR f_preacher_free = false
VAR f_disputation = false
VAR f_anselm_exposed = false
VAR f_marshal_poisoned = false
// Month 6
VAR f_shtarn_dead = false
VAR f_isolde_executed = false
VAR f_isolde_owned = false
VAR f_isolde_tried = false
VAR f_isolde_exiled = false
VAR f_horn_scapegoat = false
VAR f_truth_buried = false
VAR f_shtarn_stays = false
VAR f_horn_command = false
VAR f_horn_jailed = false
VAR f_ferrante_hanged = false
VAR f_letters_burned = false
VAR f_enemy_channel = false

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

// Whether any resource has run out (the city falls at the end of the month).
=== function lost()
~ return bread <= 0 or gold <= 0 or walls <= 0 or order <= 0
