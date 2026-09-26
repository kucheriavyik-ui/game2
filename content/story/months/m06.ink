// Місяць 6 «Залізний маршал» — docs/story/months_04-06.md, розділ 4.
// Варіант А (f_marshal_poisoned, вирішено наприкінці місяця 5): Ізольда труїть Штарна.
// Варіант Б: Штарн виживає після маку Горна.

=== m06_open ===
-> betrayal_check ->
{f_marshal_poisoned:
    -> poison
- else:
    -> alive
}

= poison
~ f_shtarn_dead = true
~ out_shtarn = true
~ loy_shtarn = 0
# speaker:narrator
Зала ради. Вечеря. Штарн заговорюється, сміється не до ладу, перекидає кубок. Горн дивиться в тарілку. Ізольда — на Штарна. Потім Штарн хапається за груди.
# speaker:tobias
# portrait:tobias_urgent
Сині нігті. Це не серце. Це отрута.
# speaker:horn
(підводиться) Хто?! (озирається на всіх) Хто?!
# speaker:isolde
# portrait:isolde_composed
(тихо) Він весь вечір був дивний. Я думала, він випив зайвого. Він ніколи не пив зайвого.
# speaker:anselm
Ніхто не виходить із ратуші, поки Протектор не дозволить. Якщо ворог дізнається, що маршала немає, завтра буде штурм. Якщо місто дізнається, що його вбили свої, — сьогодні буде різанина.
{not out_bozhena:
    # speaker:bozhena
    Протекторе. У вас ніч. До ранку місто має почути, від чого помер маршал. Правду чи ні — вирішувати вам.
}
# journal:m06_start_poison
-> END

= alive
# speaker:narrator
Зала ради. Вечеря. Штарн заговорюється, сміється не до ладу, перекидає кубок. Рада переглядається.
{not out_horn:
    # speaker:horn
    (голосно) Маршал утомився. Може, маршалові пора відпочити? Весною потрібна вилазка, а не… це.
}
# speaker:shtarn
(важко) Я… не п'яний. Я не пив. (намагається встати і не може)
{not out_tobias:
    # speaker:tobias
    Його зіниці. Це не вино. Це мак.
}
{f_night_runs_watched and not out_isolde:
    # speaker:anselm
    Поки маршал відпочиває — ще одна новина. Мої люди на Скелі Вдови бачили, як шхуни Дому Марен вивантажують сіль не в Корвені. А в таборі ворога. (кладе на стіл сувій) Ізольдо, скажіть, що це помилка.
    # speaker:isolde
    (дуже спокійно) Це не помилка.
    # speaker:shtarn
    (з останніх сил підводить голову, дивиться на Ізольду) …Ти.
}
# speaker:anselm
Протекторе. Ніч ваша. Зранку рада чекатиме рішень.
# journal:m06_start
-> END

// --- Люди в ратуші ---

=== m06_martyn ===
# speaker:martyn
# journal:k_horn_poppy
Я нічого не підливав! Я… (плаче) Капітан дав мені склянку. Сказав — снодійне, щоб маршал виспався. Маршал три ночі не спав, пане. Я думав, я роблю добре.
-> END

=== m06_horn ===
# speaker:horn
{k_horn_poppy:
    Ви вже знаєте, так? Мак. Я хотів, щоб рада побачила: маршал старий. Щоб командування вилазкою віддали мені. Я не хотів його вбивати.
    {f_shtarn_dead: Я не вбивав його. Мак не синить нігті.}
- else:
    {f_shtarn_dead:
        Найкращий із нас. І найупертіший. Хтось за це заплатить, Протекторе. Хтось обов'язково заплатить.
    - else:
        Маршал спить. А ворог — ні. Подумайте, хто має командувати стінами, поки маршал «відпочиває».
    }
}
-> END

=== m06_nomi ===
# speaker:nomi
{f_shtarn_dead:
    # speaker:narrator
    # journal:k_figs_ribbon
    Кіт грається шовковою стрічкою з печаткою Дому Марен. У шухляді столу — порожня коробка з-під засахарених фіг.
- else:
    # speaker:narrator
    # journal:k_marshal_report
    Кіт грається згорнутим аркушем. Це недописана доповідь маршала раді: «…кораблі Дому Марен…». Далі чорнило розмазане.
}
# speaker:nomi
Мяу.
-> END

=== m06_ferrante ===
# speaker:ferrante
{
- m06_ferrante > 1 and k_ferrante_letters: (Ферранте не піднімає очей від теки.)
- m06_ferrante > 1: Протекторе? Рахунки. Лише рахунки.
- else: Протекторе, я… (закриває теку) Це рахунки. Лише рахунки.
}
- (hub)
* [«Покажіть теку».]
    # speaker:narrator
    # journal:k_ferrante_letters
    У теці — листи. Ворожий посланець пише ввічливо: умови здачі міста, гарантії для ради, хліб для жителів.
    # speaker:ferrante
    Я не зрадник! Я рахував! Ще одна зима — і місто вимре. Я хотів мати двері. Хоч одні двері.
    -> END
* [«Добре. Рахуйте далі».]
    (видихає) Дякую. Я… дякую.
    -> END
+ [Піти]
    -> END

=== m06_isolde ===
# speaker:isolde
Він був упертий. Невиносимо. Він думав, що місто — це стіни. А місто — це хліб. Хліб приходить на кораблях. Кораблі ходять туди, де платять.
{f_shtarn_dead: (тихо) Я кохала його, Протекторе. Це нічого не змінює. Але ви маєте знати.}
-> END

=== m06_verena ===
# speaker:verena
# journal:k_maid_box
Прислуга все чула, пане. Прислуга завжди все чує. Служниця пані Марен сьогодні двічі бігала до кабінету маршала. З коробкою. Назад — без. (усміхається) Це вам безкоштовно. Сьогодні я щедра.
-> END

=== m06_tobias ===
# speaker:tobias
{f_shtarn_dead:
    Вовча синь. Діє за годину. Його отруїли до вечері, не за столом. Мак тільки зробив його смішним в останню годину життя.
- else:
    Він житиме. Мак виходить до ранку. Але хтось хотів, щоб рада побачила його слабким. І рада побачила.
}
-> END

=== m06_shtarn ===
# speaker:shtarn
Двадцять років мене боялись вороги. Досить було склянки маку, щоб мене пожаліли свої.
{f_night_runs_watched: Протекторе… вона. Я знав. Я знав і мовчав. Бо кохав. Тепер ви знаєте, чого вартий «залізний маршал».}
-> END

=== m06_anselm ===
# speaker:anselm
# portrait:anselm_smirk
Ніч довга, Протекторе. Кухня, кабінет, скарбниця, вартівня. Хтось у цих стінах бреше. Зазвичай — усі.
-> END

=== m06_bozhena ===
# speaker:bozhena
Я записую все, що чую цієї ночі. Не для суду. Для того, хто колись питатиме, яким було це місто.
-> END

// --- Предмети ---

=== m06_obj_cup ===
# speaker:narrator
Перекинутий кубок маршала. Вино пахне солодко. Надто солодко для вина з ратушного погреба.
-> END

=== m06_obj_plate ===
# speaker:narrator
Тарілка маршала. Недоїдене м'ясо. Маршал майже нічого не їв.
-> END

=== m06_obj_map ===
# speaker:narrator
Карта облоги в кабінеті. Червоним позначено табір ворога. Синім — щось біля Скелі Вдови. Синім олівцем, яким пише лише Штарн.
-> END

=== m06_obj_desk ===
# speaker:narrator
Стіл маршала. Акуратні стоси донесень. Одна шухляда висунута, наче її відкривали поспіхом.
-> END

=== m06_obj_figs ===
# speaker:narrator
Порожня коробка з-під засахарених фіг. Солодкий запах. На дні — крихти і дрібний синій осад.
-> END

=== m06_obj_body ===
# speaker:narrator
Тіло маршала накрите його ж плащем. Із-під краю видно руку. Нігті сині.
-> END

// --- Рада ---

=== m06_council ===
# speaker:anselm
Рада зібралась за тим самим столом. Після рішень місяць закінчиться. Готові?
+ [Так, починаймо.]
    -> decisions
+ [Ще ні.]
    Ніч ще не скінчилась, Протекторе. Але скінчиться.
    -> END

= decisions
# council_open
{f_shtarn_dead:
    -> verdict
- else:
    -> command
}

= verdict
# speaker:anselm
Перше. Від чого помер маршал.
* {k_figs_ribbon or k_maid_box} [Правда: Ізольда отруїла маршала #stance:bozhena:for #stance:horn:for #stance:ferrante:against]
    ~ res(order, 10)
    ~ res(bread, -15)
    ~ loy_isolde = 0
    ~ out_isolde = true
    ~ f_isolde_executed = true
    # speaker:isolde
    Він дав мені вибір. Ви — ні. Мабуть, так і має бути.
* {k_figs_ribbon or k_maid_box} [Тиха угода: Ізольда платить і возить хліб далі #stance:ferrante:for #stance:bozhena:against #stance:horn:against]
    ~ res(bread, 15)
    ~ res(gold, 15)
    ~ loy(loy_bozhena, -3)
    ~ loy(loy_horn, -2)
    ~ f_isolde_owned = true
    {not out_bozhena:
        # speaker:bozhena
        Я запишу це, Протекторе. Не для суду. Для себе. Щоб пам'ятати, яким було це місто.
    }
* {k_horn_poppy and not out_horn} [Зручний винний: Горн підлив маршалові отрути #stance:anselm:for #stance:bozhena:against #stance:tobias:against]
    ~ res(order, 5)
    ~ res(walls, -15)
    ~ loy_horn = 0
    ~ out_horn = true
    ~ f_horn_scapegoat = true
    # speaker:horn
    (коли виводять) Я підлив маку. Не отрути. Але ви це знаєте. Правда?
* [Серце. Нікого не звинувачувати #stance:ferrante:for #stance:isolde:for #stance:bozhena:against #stance:anselm:against]
    ~ res(order, -5)
    ~ loy(loy_bozhena, -2)
    ~ loy(loy_anselm, -1)
    ~ f_truth_buried = true
- -> letters

= command
# speaker:anselm
Перше. Хто командує стінами.
* [Штарн лишається #stance:shtarn:for #stance:ferrante:for #stance:horn:against]
    ~ res(order, 5)
    ~ loy(loy_shtarn, 2)
    ~ loy(loy_horn, -2)
    ~ f_shtarn_stays = true
* {not out_horn} [Командування — Горнові, весною вилазка #stance:horn:for #stance:shtarn:against #stance:ferrante:against]
    ~ res(walls, 5)
    ~ loy(loy_horn, 3)
    ~ loy(loy_shtarn, -3)
    ~ f_horn_command = true
    # speaker:shtarn
    Весною, коли ти поведеш триста людей у болото, згадай, що я читав твій план. Двічі.
* {k_horn_poppy and not out_horn} [Горн — під арешт за мак #stance:shtarn:for #stance:bozhena:for #stance:anselm:against]
    ~ res(order, 5)
    ~ res(walls, -5)
    ~ loy_horn = 0
    ~ out_horn = true
    ~ loy(loy_shtarn, 2)
    ~ f_horn_jailed = true
- {f_night_runs_watched and not out_isolde: -> runs}
- -> letters

= runs
# speaker:anselm
Друге. Шхуни Ізольди.
* [Публічний суд #stance:bozhena:for #stance:shtarn:for #stance:ferrante:against]
    ~ res(order, 10)
    ~ res(bread, -15)
    ~ loy_isolde = 0
    ~ out_isolde = true
    ~ f_isolde_tried = true
* [Шхуни ходять далі, під Інквізицією і з податком #stance:anselm:for #stance:ferrante:for #stance:bozhena:against #stance:shtarn:against]
    ~ res(bread, 10)
    ~ res(gold, 10)
    ~ loy(loy_shtarn, -3)
    ~ f_isolde_owned = true
* [Вигнати Ізольду з міста на її ж шхуні #stance:shtarn:for #stance:anselm:against]
    ~ res(bread, -5)
    ~ res(order, 5)
    ~ loy_isolde = 0
    ~ out_isolde = true
    ~ f_isolde_exiled = true
- -> letters

= letters
{k_ferrante_letters and not out_ferrante:
    # speaker:anselm
    І листи пана Дуска.
    -> letters_choice
}
-> done

= letters_choice
* [Зрадник — на стіну #stance:horn:for #stance:anselm:for #stance:tobias:against #stance:bozhena:against]
    ~ res(order, 5)
    ~ res(gold, -5)
    ~ loy_ferrante = 0
    ~ out_ferrante = true
    ~ f_ferrante_hanged = true
* [Спалити листи і забути #stance:ferrante:for #stance:anselm:against]
    ~ loy(loy_ferrante, 3)
    ~ f_letters_burned = true
* [Лишити канал: хай пише далі, під наглядом #stance:anselm:for #stance:horn:against]
    ~ loy(loy_ferrante, 1)
    ~ loy(loy_anselm, 1)
    ~ f_enemy_channel = true
    # speaker:ferrante
    Ви… ви дозволяєте мені мати двері?
    # speaker:anselm
    Ми дозволяємо собі мати двері. Ви — лише ключ.
- -> done

= done
# speaker:anselm
Рада розходиться.
# month_end
-> END

=== m06_end ===
~ upkeep()
{f_shtarn_dead and f_truth_buried: Маршала поховали з почестями. На похороні Ізольда стояла в першому ряду.}
{f_isolde_executed: Ізольду стратили на площі. Шхуни Дому Марен стоять у гавані, і ніхто не знає, чиї вони тепер.}
{f_horn_scapegoat: Горна повісили над брамою. Солдати проходять повз, не підводячи очей.}
{f_horn_command: Горн тренує триста охочих. Штарн дивиться зі стіни і мовчить.}
{f_shtarn_stays: Штарн знову на стіні. Він не п'є навіть води, яку не набрав сам.}
{f_enemy_channel: Ферранте пише листи щовечора. Ансельм читає їх раніше за ворога.}
{not lost():
    Пів облоги.
    Корвен ще стоїть.
    Але тепер кожен у раді знає, як легко тут умирають.
}
-> defeat_check
