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
INCLUDE idle.ink
INCLUDE people.ink

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
// Erik Stolz holds the Guild seat once Isolde is out (set to 6 when appointed at the end of month 3).
VAR loy_erik = 5

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
VAR k_ford = false
VAR k_north_tower = false
// Month 2
VAR k_real_reserves = false
VAR k_verena_black_market = false
VAR k_hidden_warehouses = false
VAR k_pay_arrears = false
// Month 3
VAR k_plague_spreading = false
VAR k_dockers_riot_risk = false
VAR k_strait = false
VAR k_isolde_offer = false
VAR k_spy_is_scribe = false
VAR k_guild_silver = false
VAR k_fireships_plan = false
VAR k_engineers_camp = false
// Month 4
VAR k_horn_plans = false
VAR k_forge_capacity = false
VAR k_militia_verena = false
VAR k_envoy_eyes = false
VAR k_horde_fever = false
// Month 5
VAR k_bad_well = false
VAR k_well_confirmed = false
VAR k_preacher_westgard = false
VAR k_horn_raid_plan = false
VAR k_greyhand_doubt = false
VAR k_shtarn_tired = false
VAR k_truce_offer = false
// Month 6
VAR k_garrison_split = false
VAR k_shtarn_last_words = false
VAR k_knights_view = false
VAR k_ferrante_contact = false
VAR k_poison_sweet = false
VAR k_poison_otto = false

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
VAR f_mil_hold = false
VAR f_mil_sally = false
VAR f_sally_ford = false
VAR f_knights_walls = false
VAR f_north_tower = false
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
VAR f_guard_granaries = false
VAR f_walls_first = false
VAR f_knights_granaries = false
VAR f_pay_arrears = false
// Month 3
VAR f_quarantine = false
VAR f_port_fed = false
VAR f_plague_spreads = false
VAR f_spy_names = false
VAR f_spy_trial = false
VAR f_spy_hanged = false
VAR f_double_agent = false

VAR f_fleet_burned = false
VAR f_engineers_burned = false
VAR f_no_sortie = false
VAR f_victory_sortie = false
VAR f_isolde_prison = false
VAR f_isolde_executed = false
VAR f_isolde_exiled = false
VAR f_traitor_turned = false
VAR f_isolde_vanished = false
VAR f_victory_conspiracy = false
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
VAR f_feast = false
VAR f_bells = false
VAR f_no_feast = false
VAR f_militia_armed = false
VAR f_militia_horn = false
VAR f_militia_trained = false
VAR f_militia_split = false
VAR f_hero_horn = false
VAR f_hero_common = false
VAR f_hero_knights = false
VAR f_hero_protector = false
VAR f_hero_anselm = false
VAR f_hero_bozhena = false
VAR f_hero_erik = false
VAR f_envoy_heard = false
VAR f_envoy_refused = false
VAR f_envoy_hanged = false
VAR f_horde_misled = false
VAR f_horde_knows_we_know = false
// Month 5
VAR f_burn_houses = false
VAR f_plague_slow = false
VAR f_well_closed = false
VAR f_preacher_banned = false
VAR f_preacher_arrested = false
VAR f_preacher_free = false
VAR f_preacher_ally = false
VAR f_truce = false
VAR f_truce_refused = false
VAR f_truce_broken = false
VAR f_raid_approved = false
VAR f_raid_forbidden = false
VAR f_raid_delayed = false
// Month 6: how the marshal died (decided at the end of month 5), who commands now, the letter, Ferrante
VAR f_death_gate = false
VAR f_death_rescue = false
VAR f_death_plague = false
VAR f_death_poison = false
VAR f_marshal_horn = false
VAR f_marshal_greyhand = false
VAR f_marshal_split = false
VAR f_marshal_protector = false
VAR f_horn_forgiven = false
VAR f_horn_prison = false
VAR f_blame_horn = false
VAR f_blame_protector = false
VAR f_poisoner_caught = false
VAR f_poison_hidden = false
VAR f_inquisition_purge = false
VAR f_truth_plague = false
VAR f_death_hidden = false
VAR f_letter_read = false
VAR f_letter_burned = false
VAR f_letter_anselm = false
VAR f_ferrante_prison = false
VAR f_ferrante_watched = false
VAR f_ferrante_channel = false

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
Утримання міста за місяць: Хліб −8, Золото −6.

// Whether any resource has run out (the city falls at the end of the month).
=== function lost()
~ return bread <= 0 or gold <= 0 or walls <= 0 or order <= 0
