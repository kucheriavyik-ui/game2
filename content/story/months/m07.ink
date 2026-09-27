// Місяць 7 «Перший штурм» — docs/story/month_07.md.
// Без загального betrayal_check: зрада тут грає посеред другої хвилі (розділ 8 документа).
// Хід бою рахує VAR defense.

=== m07_open ===
# speaker:narrator
Сутінки. Під стінами — {f_engineers_burned:одна дерев'яна облогова вежа|три дерев'яні облогові вежі} і накритий шкурами таран. З пагорбів б'ють барабани.
{
- f_marshal_horn and not out_horn:
    # speaker:horn
    # portrait:horn_eager
    Вони підуть цієї ночі, Протекторе. Вежі на північ, таран на Соляну браму. Я триматиму браму сам. Штарн би тримав.
- f_marshal_greyhand:
    # speaker:sira_ruka
    Штурм цієї ночі. Три напрямки. Я розставлю людей до заходу сонця. Мені потрібні лише ваші рішення, а не ваша рада.
- f_marshal_split:
    # speaker:horn
    Стіни — мої.
    # speaker:sira_ruka
    Резерв — мій.
    # speaker:narrator
    Вони не дивляться один на одного.
    {not out_ferrante:
        # speaker:ferrante
        Я ж казав, що так буде надійніше. (пауза) Здається.
    }
- else:
    # speaker:narrator
    Радники дивляться на Копарікуса. Уперше за облогу доповідати нікому, крім нього самого.
    # speaker:anselm
    # portrait:anselm_smirk
    Ну що ж, пане маршале-Протекторе. Наказуйте.
}
{not out_tobias:
    # speaker:tobias
    Я розгорнув лазарет у Храмі і в складах біля брами. Ліжок на двісті. (пауза) Скажіть мені, що двохсот вистачить.
}
{not out_verena:
    # speaker:verena
    Нижнє місто під самою стіною. Якщо вони закидатимуть вогнем — там дерево і солома. Люди питають, куди їм іти.
}
{
- f_traitor_turned:
    # speaker:isolde
    # portrait:isolde_broken
    (дивиться на пагорби) Сьогодні вони дізнаються, скільки було правди в моїх листах.
- not out_erik:
    # speaker:erik
    Гільдія дала всі вози й бочки, які мала. І… я теж можу тримати арбалет. Мабуть.
}
# speaker:anselm
І за звичаєм Кагана перед штурмом нам ще раз запропонують здатися. Посланець уже біля брами.
# speaker:bozhena
# portrait:bozhena_soft
(тихо Протекторові) Що б не сталося цієї ночі — я буду поруч. Не як Інквізиція. Просто поруч.
# speaker:narrator
Номі сидить на зубці стіни і дивиться на вежі орди, наче рахує їх.
# journal:m07_start
-> envoy

// The last envoy: the custom of the Khagan before a storm. One answer, right now.
= envoy
# speaker:narrator
Соляна брама. Під білим прапором чекає вершник.
{
- f_envoy_hanged or f_truce_broken:
    До брами під'їжджає вершник без прапора. Кидає під ворота кінський череп.
    # speaker:narrator
    «Каган сказав: без пощади. Ні вам. Ні вашим дітям. Ні вашому коту». Розвертається і їде. Номі шипить йому вслід.
- f_ferrante_channel or f_horde_knows_we_know:
    # speaker:erden
    # journal:k_envoy_hint
    Протекторе. Я приніс ті самі слова, що й завжди. Відчиніть ворота до заходу сонця — і місто житиме. (пауза, тихіше) І ще одне, від себе. Каган поважає вас. Тому не ставте найкращих людей на брамі. Не там почнеться.
- else:
    # speaker:erden
    Відчиніть ворота до заходу сонця. Це все, що мені доручили сказати. (пауза) Шкода. Ви були цікавим супротивником.
}
# speaker:narrator
Ваша відповідь, Протекторе.
* [«Відповідь та сама».]
    # speaker:narrator
    Вершник киває, наче й не чекав іншого, і розвертає коня.
* [«Передайте Кагану, що в Корвені сьогодні на вечерю смола».]
    # speaker:narrator
    {f_envoy_hanged or f_truce_broken:Вершник уже не чує.|Ерден ледь помітно усміхається. «Передам. Слово в слово».}
* [Відчинити ворота.]
    # game_over:surrender
    # speaker:narrator
    Брама відчиняється зсередини.
- -> END

// --- Радники в ратуші ---

=== m07_horn ===
# speaker:horn
{
- m07_horn > 1: (Горн перевіряє ремені на обладунку. Руки не тремтять.)
- else:
    Бачите вежі? На кожній — сотня. На таран — ще дві. Якщо вони зайдуть на стіну, ми їх скинемо. Якщо проб'ють браму — я там і лишуся. (пауза) Протекторе. Якщо сьогодні щось станеться зі мною… скажіть солдатам, що я не тікав.
    {f_blame_protector or f_horn_forgiven:
        # portrait:horn_broken
        Ви взяли на себе те, що було моїм. (пауза) Я пам'ятаю. Сьогодні я віддам борг.
    }
}
-> END

=== m07_sira_ruka ===
# speaker:sira_ruka
{
- m07_sira_ruka > 1: (Сіра Рука дивиться на північну вежу.) До заходу сонця, пане Протекторе.
- f_marshal_greyhand:
    # journal:k_three_blows
    Північна вежа стоїть на старій кладці. Туди підуть вежі. На браму — таран. А третій удар буде там, де ми не чекаємо. Каган завжди б'є тричі.
- else:
    # journal:k_second_line
    Лицарів залишилося {f_engineers_burned or f_raid_approved:менше, ніж хотілося б, але|} достатньо. За північною стіною можна за годину звести другу лінію з возів і каміння. Якщо стіну проломлять — зустрінемо їх там, а не в проломі.
}
- (hub)
* [«Хто ви, командоре? Ви ніколи не знімаєте шолома».]
    Той, хто стоїть між вами і смертю, пане Протекторе. Цього достатньо. Решта не має значення.
    -> hub
* {f_marshal_greyhand} [«А друга лінія?»]
    # journal:k_second_line
    За північною стіною можна за годину звести другу лінію з возів і каміння. Якщо стіну проломлять — зустрінемо їх там, а не в проломі.
    -> hub
+ [Піти]
    -> END

=== m07_anselm ===
# speaker:anselm
Сьогодні всі дивитимуться на стіни. А я дивитимуся всередину. Той, хто захоче відчинити браму, зробить це саме цієї ночі. (пауза) Знаєте, чого я боюся найбільше, Протекторе? Не орди. Тих, хто вирішить, що ви вже програли.
-> END

=== m07_verena ===
# speaker:verena
# portrait:verena_serious
{
- m07_verena > 1: Три тисячі, пане. Я рахувала.
- else:
    # journal:k_lower_city_crowd
    Тут три тисячі людей між стіною і ринком. Діти, старі. Якщо полетить вогонь — вони побіжать усі одночасно. Туди, до площі. Вузькими вулицями. (пауза) Мої люди можуть вивести їх заздалегідь. Швидко і тихо. Але тоді Нижнє місто знатиме, що його врятувала Верена, а не Протектор.
}
-> END

=== m07_tobias ===
# speaker:tobias
{f_well_closed or f_burn_houses:Гарнізон здоровий, пане. Це єдине, чим я пишаюся цього року.|{f_plague_spreads:Кожен п'ятий солдат на стіні кашляє. Я не можу їх зняти. Нема ким замінити.|Двісті ліжок. Полотна на двісті. Молюся, щоб вистачило.}}
-> END

=== m07_ferrante ===
# speaker:ferrante
# portrait:ferrante_nervous
Я порахував. Якщо ми втратимо північну вежу і браму — місто протримається до полудня. Якщо лише вежу — до весни. (пауза) Я не знаю, навіщо я це вам кажу. Мабуть, щоб хтось знав, що я рахував до кінця.
-> END

=== m07_erik ===
# speaker:erik
Сорок возів, пане. Якщо треба барикаду — вони ваші. Я сам поведу волів. Я вмію, я ж із села.
-> END

=== m07_isolde ===
# speaker:isolde
# portrait:isolde_broken
(дивиться на Соляну браму) Вони чекають, що я махну ліхтарем з вежі Гільдії. Так ми домовлялися. (пауза) Сьогодні я не махатиму. Не заради вас.
-> END

=== m07_bozhena ===
# speaker:bozhena
# portrait:bozhena_soft
Я буду на стіні поруч із вами. Не питайте навіщо. (пауза) Просто буду.
-> END

// --- Люди на стінах ---

=== m07_vido ===
# speaker:vido
{
- m07_vido > 1: (Відо стискає ніж маршала.) Сьогодні ніхто не засне, пане.
- else:
    # journal:k_salt_gate_ram
    Пане! (випрямляється) Солдати… тримаються. Боїмося, звісно. Але тримаємося. (пауза) Бачите таран? Його тягнуть до Соляної брами. До тієї самої, яку пані Марен колись обіцяла їм відчинити. Мабуть, досі думають, що вона відчиниться сама.
}
- (hub)
* [«Як ти, Відо?»]
    У мене є ніж маршала, пане. І наказ не спати на варті. (усміхається) Сьогодні ніхто не засне.
    -> hub
* [«Звідки знаєш про таран?»]
    Бачив зі стіни, як його збивають. І як вони туди дивляться — на Соляну браму. Наче чекають, що хтось їм махне.
    -> hub
+ [Піти]
    -> END

=== m07_myroslava ===
# speaker:myroslava
# journal:k_fire_arrows
Пане! У нас дві бочки смоли, клоччя і триста стріл. Якщо обмотати і підпалити — вежі горітимуть ще до стін. Дерево в них сире, але шкури зверху сухі. Я перевіряла. (пауза) Ну, не зовсім я. Мій хлопець бігав уночі до рову.
-> END

=== m07_radko ===
# speaker:radko
# journal:k_fire_arrows
Смола є. Клоччя трохи є. Стріл мало. Кілька веж підпалимо, якщо пощастить.
-> END

=== m07_lukash ===
# speaker:lukash
# journal:k_horde_signal
Ви прийшли. (пауза) Вони попросили в мене останній лист. Про північну вежу. Я написав те, що наказав пан Ансельм. (підводить голову) І ще. Перед кожною хвилею вони запалюють зелений вогонь на пагорбі. Я бачив це, коли мене вели сюди в перший місяць. Зелене світло — і за мить удар.
-> END

=== m07_yeremiya ===
# speaker:yeremiya
{
- f_preacher_ally: Я носитиму воду на стіни. Хтось має. (пауза) У Вестгарді ніхто не носив.
- else: (до натовпу) …а коли впадуть стіни, брати мої, Храм залишиться! Бо Храм не воює!
}
-> END

=== m07_hedda ===
# speaker:hedda
# portrait:hedda_eerie
Тут уже раз проламували. Двадцять років тому. Каміння пам'ятає, де воно тріснуло. (гладить стіну) Сьогодні теж пам'ятатиме.
-> END

=== m07_nomi ===
# speaker:narrator
# journal:k_nomi_breach
Номі сидить на зубці над старим проломом, де цегла світліша за решту стіни. Раз у раз прикладає вухо до каменю і прищулює очі.
# speaker:nomi
Мяу.
-> END

=== m07_obj_breach ===
# speaker:narrator
Старий пролом у мурі. Залатаний брудною цеглою, світлішою за стіну. Двадцять років тому тут уже прорвалися. Ніхто не полагодив як слід.
-> END

// --- Рада підготовки і штурм ---

=== m07_council ===
# speaker:anselm
Рада зібралась. Після рішень почнеться ніч, і місяць закінчиться на світанку. Готові?
+ [Так, починаймо.]
    -> decisions
+ [Ще ні.]
    Сонце ще не сіло, Протекторе. Але вже низько.
    -> END

= decisions
# council_open
~ defense = 0
{f_suburbs_burned or f_suburbs_timber:
    ~ defense++
}
{f_suburbs_left:
    ~ defense--
}
{f_smiths_in:
    ~ defense++
}
{f_militia_trained:
    ~ defense++
}
{f_militia_armed:
    ~ defense--
}
{f_engineers_burned:
    ~ defense++
}
{f_fleet_burned:
    ~ defense++
}
{f_horde_misled:
    ~ defense++
}
{f_double_agent:
    ~ defense++
}
{f_truce:
    ~ defense++
}
{f_well_closed or f_burn_houses:
    ~ defense++
}
{f_plague_spreads and not f_well_closed and not f_burn_houses:
    ~ defense -= 2
}
{f_envoy_hanged or f_truce_broken:
    ~ defense--
}
{f_preacher_ally:
    ~ defense++
}
{f_preacher_free:
    ~ defense--
}
{f_marshal_greyhand or f_marshal_protector:
    ~ defense++
}
# speaker:sira_ruka
Перше. Де головні сили.
* [На північну вежу #stance:horn:against]
    ~ f_main_north = true
    {k_north_tower or f_horde_misled:
        ~ defense += 2
    - else:
        ~ defense++
    }
* [На Соляну браму #stance:horn:for]
    ~ f_main_gate = true
    {not k_envoy_hint:
        ~ defense++
    }
* [Рівномірно по стінах #stance:ferrante:for]
    ~ f_main_even = true
    ~ defense++
- # speaker:horn
Друге. Ополчення.
{f_militia_armed or f_militia_horn or f_militia_trained or f_militia_split: -> militia}
-> militia_none

= militia
* [На стіни поруч із гарнізоном #stance:horn:for #stance:verena:for]
    ~ f_militia_walls = true
    ~ defense++
    {f_militia_trained:
        ~ defense++
    }
* [Гасити пожежі в Нижньому місті #stance:tobias:for #stance:verena:for]
    ~ f_militia_fire = true
* {k_second_line} [У резерв біля другої лінії #stance:horn:against]
    ~ f_militia_reserve = true
- -> knights

= militia_none
* [Вивести городян гасити пожежі в Нижньому місті #stance:tobias:for #stance:verena:for]
    ~ f_militia_fire = true
* [Городян не чіпати: вони не солдати #stance:ferrante:for]
- -> knights

= knights
# speaker:anselm
Третє. Лицарі Тіла.
* [Резерв для контратаки #stance:anselm:for]
    ~ f_knights_reserve = true
* [На найслабшу ділянку з самого початку #stance:horn:for]
    ~ f_knights_front = true
    ~ defense++
* [Охорона Протектора і цитаделі #stance:ferrante:for #stance:horn:against]
    ~ f_knights_guard = true
    ~ defense--
    ~ loy(loy_horn, -1)
- # speaker:verena
Четверте. Нижнє місто.
* [Евакуювати людей до цитаделі заздалегідь #stance:tobias:for #stance:ferrante:against]
    ~ res(order, -5)
    ~ res(bread, -5)
    ~ f_lower_evacuated = true
* [Залишити як є #stance:ferrante:for]
    ~ f_lower_left = true
* {k_lower_city_crowd} [Доручити евакуацію людям Верени #stance:verena:for #stance:anselm:against]
    ~ loy(loy_verena, 2)
    ~ loy(loy_anselm, -1)
    ~ f_lower_verena = true
- -> wave1

= wave1
# speaker:narrator
Опівночі. {k_horde_signal:На пагорбі спалахує зелений вогонь. Ви знаєте, що це означає.|Барабани раптом замовкають.} Вежі рушають до стіни, скриплячи, на биках, під шкурами.
# speaker:{f_marshal_horn and not out_horn:horn|sira_ruka}
Вони йдуть! Лучники — на стіну!
* {k_fire_arrows} [Вогняні стріли, поки вежі ще в полі]
    {f_suburbs_left:
        ~ defense++
        # speaker:narrator
        Вежі йдуть під прикриттям руїн передмість. Горить лише та, що вийшла на відкрите. Решта доповзають до стіни.
    - else:
        ~ defense += 2
        ~ f_w1_fire = true
        # speaker:narrator
        Триста стріл із клоччям злітають разом. Шкури на вежах спалахують, як солома. До стін доповзає лише дим.
    }
* [Смола і каміння, коли вежі підійдуть впритул]
    ~ defense++
    ~ res(walls, -5)
    # speaker:narrator
    Вежі торкаються стіни. Смола, каміння, крики. Бій на зубцях триває до другої варти.
* [Вилазка під стіну — підпалити вежі знизу]
    ~ defense++
    ~ res(order, 5)
    # speaker:narrator
    Хвіртка. Дюжина людей зі смолоскипами під самі колеса. Вежі горять знизу. Назад повертається не всі, а сержант Відо — обпечений, без брів, живий. Уранці про це співатимуть.
- -> wave2

= wave2
# speaker:narrator
Удар тарана об браму чути по всьому місту. Одночасно через стіну летять горщики з вогнем. Нижнє місто спалахує.
# speaker:vido
Брама! Брама тріщить!
# speaker:verena
(здалеку) Горить! Нижнє місто горить!
{f_marshal_split:
    # speaker:horn
    Резерв — до брами!
    # speaker:sira_ruka
    Резерв лишається на місці.
    # speaker:narrator
    Солдати застигають між двома наказами. Вирішувати вам.
}
-> wave2_betrayal ->
# speaker:narrator
Брама тримається. Поки що.
* [Тримати браму всіма силами, місто хай горить]
    ~ defense += 2
    ~ res(bread, -5)
    {f_lower_evacuated or f_militia_fire:
        ~ res(order, -3)
    - else:
        ~ res(order, -10)
    }
* [Зняти частину людей з брами і гасити пожежу]
    ~ res(order, -3)
    ~ res(walls, -5)
    # speaker:narrator
    Брама тримається на волосині. Пожежу збивають до світанку.
* {k_horde_signal} [Побачити зелений вогонь і вдарити по таранній команді за мить до атаки]
    ~ defense += 3
    # speaker:narrator
    Зелений вогонь — і стріли вже летять. Таранна команда лягає під брамою раніше, ніж торкається її. Таран горить на снігу.
* {k_salt_gate_ram and f_traitor_turned} [Змусити Ізольду махнути ліхтарем — і зустріти тих, хто полізе до «відчиненої» брами]
    ~ defense += 3
    ~ loy(loy_isolde, -3)
    # speaker:narrator
    З вежі Гільдії блимає ліхтар. Сотня вершників кидається до брами, яка «мала відчинитися». Її зустрічають Лицарі. Ізольда стоїть біля вікна і не плаче.
- -> wave3

// The betrayal during the storm: the advisor with the lowest regard (3 or less, never twice) acts in the heat of the second wave.
= wave2_betrayal
~ temp who = traitor()
{
- who == "horn": -> bt_horn ->
- who == "verena": -> bt_verena ->
- who == "ferrante":
    ~ b_ferrante = true
    ~ f_betray_ferrante = true
    {f_ferrante_watched:
        # speaker:anselm
        Ферранте послав гінця до орди. Гонець сидить у моєму підвалі, а лист — у мене. Продовжуйте, пане Протекторе.
    - else:
        # speaker:narrator
        Посеред бою Ферранте посилає орді гінця з пропозицією умов. Гонець проходить. Орда знає про другу лінію.
        ~ f_second_line_known = true
    }
- who == "anselm": -> bt_anselm ->
- who == "tobias": -> bt_tobias ->
- who == "erik": -> bt_erik ->
- who == "isolde":
    ~ b_isolde = true
    ~ f_betray_isolde = true
    ~ defense -= 2
    ~ out_isolde = true
    ~ loy_isolde = 0
    ~ loy_erik = 6
    # speaker:narrator
    З вежі Гільдії блимає ліхтар. Божена збиває його з рук Ізольди, але знак уже подано. Ізольду виводять. Крісло Гільдії переходить до Еріка.
}
->->

= bt_horn
~ b_horn = true
~ f_betray_horn = true
# speaker:narrator
Горн самовільно веде загін через хвіртку «вдарити таранникам у спину». Брама лишається напівпорожньою.
* [«Повернути його!» — Лицарів до брами]
    ~ defense--
* [Хай іде.]
    ~ defense -= 2
    # speaker:narrator
    Таран спалено. Горн повертається з половиною людей.
-
->->

= bt_verena
~ b_verena = true
~ f_betray_verena = true
# speaker:narrator
Ополченці Верени кидають східну ділянку стіни, щоб «рятувати своїх» у Нижньому місті.
* [Послати Інквізицію повернути їх]
    ~ res(order, -10)
* [Відпустити.]
    ~ defense -= 2
    # speaker:narrator
    Нижнє місто тепер вірить їй більше, ніж Протекторові.
-
->->

= bt_anselm
~ b_anselm = true
~ f_betray_anselm = true
# speaker:narrator
Ансельм знімає Інквізицію з брами і хапає в місті «ненадійних» — тих, хто говорив про здачу.
* [Зупинити.]
    ~ defense--
* [Дозволити.]
    ~ res(order, -10)
    # speaker:narrator
    Божена відвертається і до ранку не дивиться на вас.
-
->->

= bt_tobias
~ b_tobias = true
~ f_betray_tobias = true
# speaker:narrator
Тобіас відкликає водоносів і санітарів зі стіни до Храму: «Рятувати тих, кого ще можна».
* [Повернути їх на стіну.]
    ~ loy(loy_tobias, -2)
* [Дозволити.]
    ~ defense--
    ~ res(order, 5)
-
->->

= bt_erik
~ b_erik = true
~ f_betray_erik = true
# speaker:narrator
Ерік не приводить вози для другої лінії — ховається з ними в підвалі Гільдії.
* [Послати Лицарів за возами.]
    ~ defense--
* [Нема часу. Обійдемось.]
    ~ f_second_line_known = true
-
->->

= wave3
# speaker:narrator
Під ранок, коли здається, що все скінчилося, стара кладка північної стіни не витримує. Там, де цегла світліша, — там, де весь вечір сидів Номі, — стіна обвалюється. У пролом лізе орда.
{k_nomi_breach:
    # speaker:protector
    Там. Де сидів кіт.
}
{k_three_blows:
    # speaker:sira_ruka
    Третій удар.
}
* [Кинути Лицарів Тіла в пролом]
    ~ defense += 2
    {f_knights_reserve:
        ~ defense++
    }
    {f_knights_front:
        ~ defense--
    }
    # speaker:narrator
    Темні обладунки закривають пролом. Коли світає, вони ще стоять. Не всі.
* {k_second_line and not f_second_line_known} [Відійти на другу лінію і зустріти їх там]
    ~ defense += 3
    {f_militia_reserve:
        ~ defense++
    }
    # speaker:narrator
    Орда вливається в пролом і застрягає між стіною і возами. Зверху — стріли, спереду — Лицарі. До світанку в проломі нема кому лізти.
* [Копарікус сам іде в пролом з Лицарями]
    ~ defense += 2
    ~ res(order, 15)
    ~ f_protector_wounded = true
    # speaker:narrator
    Копарікус скидає плащ. Під ним — старий, потертий обладунок без гербів. Він іде в пролом першим, і Лицарі Тіла змикаються навколо нього. Три удари, короткі, точні — не так б'ється той, хто вчився на плацу. Так б'ється той, кого вчили виживати.
    # speaker:bozhena
    # portrait:bozhena_soft
    (після, перев'язуючи йому щоку) Де ви навчилися так битися?
    # speaker:protector
    Мене багато били в дитинстві. Рано чи пізно починаєш бити у відповідь.
* [Кинути в пролом усіх, хто є — ополчення, гарнізон, кухарів]
    ~ defense++
    ~ res(order, -5)
    ~ res(walls, -10)
    # speaker:narrator
    Пролом закривають тілами. Своїми.
- -> dawn

= dawn
# speaker:narrator
Сонце встає над димом. Облогові вежі догоряють у рові. Орда відходить на пагорби.
{
- defense >= 12:
    ~ res(walls, -5)
    ~ res(order, 15)
    ~ f_assault1_triumph = true
    # speaker:verena
    # portrait:verena_smile
    Чуєте? Вони кричать ваше ім'я, пане. Ні, не Копарікус — «Корвен». Але ви ж знаєте, що це одне й те саме.
- defense >= 7:
    ~ res(walls, -15)
    ~ res(order, 5)
    ~ res(bread, -5)
    ~ f_assault1_costly = true
    # speaker:tobias
    # portrait:tobias_tired
    Двісті ліжок, пане. Не вистачило. (пауза) Я перестав рахувати на двохсот тридцяти.
- else:
    ~ res(walls, -25)
    ~ res(order, -5)
    ~ res(bread, -10)
    ~ f_assault1_barely = true
    ~ f_vido_dead = true
    # speaker:narrator
    Копарікус стоїть біля пролому. Номі сидить поруч. Ніхто нічого не каже.
}
{not f_assault1_triumph and f_militia_walls and f_smiths_in:
    ~ f_gilda_dead = true
}
{not f_assault1_triumph and not out_horn and (f_blame_protector or f_horn_forgiven):
    ~ out_horn = true
    ~ b_horn = true
    ~ f_horn_hero_death = true
    {f_marshal_horn:
        ~ f_marshal_horn = false
        ~ f_marshal_greyhand = true
    }
    # speaker:narrator
    Горн стояв у проломі один, коли друга лінія ще не зімкнулася. Він тримав прохід стільки, скільки треба. Потім упав.
    # speaker:horn
    # portrait:horn_broken
    (останнє, до Протектора) Скажіть їм… що я не тікав.
}
# month_end
-> END

=== m07_end ===
~ upkeep()
{f_protector_wounded: Шрам через щоку. Місто вже склало про нього три пісні, і в жодній немає правди.}
{f_horn_hero_death: Горна поховали поруч зі Штарном, на стіні. Солдати кажуть, що тепер там двоє вартових.}
{f_vido_dead: Ніж Штарна знайшли в руці сержанта Відо. Тепер його носить Протектор.}
{f_gilda_dead: Кузня біля північної стіни мовчить. Її хлопець кує сам — погано, але не зупиняється.}
{f_lower_left and not f_militia_fire: Нижнє місто згоріло на третину. Ті, хто вижив, дивляться на цитадель, а не на стіни.}
{f_lower_verena: Нижнє місто вціліло. На кожних дверях — крейдою знак Верени.}
{not lost():
    Сім місяців. Корвен уперше подивився смерті в обличчя.
    Смерть моргнула першою.
}
-> defeat_check
