// Зради — docs/story/months_04-06.md, розділ 1.
// Кожне відкриття ради з місяця 4 починається з -> betrayal_check ->.
// Радник із лояльністю BETRAYAL_AT або нижче, який ще не зраджував і досі в раді,
// зраджує один раз; за місяць — не більше однієї зради (найнижча лояльність, за рівності — перший за порядком ради).

=== betrayal_check ===
~ temp who = traitor()
{
- who == "shtarn": -> betray_shtarn ->
- who == "horn": -> betray_horn ->
- who == "anselm": -> betray_anselm ->
- who == "bozhena": -> betray_bozhena ->
- who == "ferrante": -> betray_ferrante ->
- who == "isolde": -> betray_isolde ->
- who == "tobias": -> betray_tobias ->
- who == "verena": -> betray_verena ->
- who == "erik": -> betray_erik ->
}
->->

=== function traitor()
~ temp who = ""
~ temp low = BETRAYAL_AT + 1
{not b_shtarn and not out_shtarn and loy_shtarn < low:
    ~ who = "shtarn"
    ~ low = loy_shtarn
}
{not b_horn and not out_horn and loy_horn < low:
    ~ who = "horn"
    ~ low = loy_horn
}
{not b_anselm and not out_anselm and loy_anselm < low:
    ~ who = "anselm"
    ~ low = loy_anselm
}
{not b_bozhena and not out_bozhena and loy_bozhena < low:
    ~ who = "bozhena"
    ~ low = loy_bozhena
}
{not b_ferrante and not out_ferrante and loy_ferrante < low:
    ~ who = "ferrante"
    ~ low = loy_ferrante
}
{not b_isolde and not out_isolde and loy_isolde < low:
    ~ who = "isolde"
    ~ low = loy_isolde
}
{not b_tobias and not out_tobias and loy_tobias < low:
    ~ who = "tobias"
    ~ low = loy_tobias
}
{out_isolde and not b_erik and not out_erik and loy_erik < low:
    ~ who = "erik"
    ~ low = loy_erik
}
{not b_verena and not out_verena and loy_verena < low:
    ~ who = "verena"
    ~ low = loy_verena
}
~ return who

=== betray_shtarn ===
~ b_shtarn = true
# speaker:narrator
Штарн кладе на стіл ради маршальський жезл.
# speaker:shtarn
# portrait:shtarn_grim
Я не триматиму стіни для людини, яка мене не чує. Знайдіть собі іншого маршала. Горн давно чекає.
* [Упросити повернутися]
    ~ loy(loy_shtarn, 3)
    ~ res(order, -5)
    (довго дивиться) Добре. Але наступного разу я не прийду на раду, я прийду до вас додому. І не з жезлом.
* [Прийняти відставку]
    ~ res(walls, -15)
    ~ loy(loy_horn, 2)
    ~ f_shtarn_retired = true
    # speaker:horn
    (бере жезл, поки ніхто не передумав) Нарешті.
- ->->

=== betray_horn ===
~ b_horn = true
# speaker:narrator
На світанку з воріт виїжджає сотня. Вертається сорок. Горн — перший, у чужій крові.
# speaker:horn
Ми спалили два вози їхнього фуражу! Два!
* [Нагородити тих, хто вернувся]
    ~ res(order, 5)
    ~ res(walls, -10)
    ~ loy(loy_horn, 2)
    # speaker:narrator
    Сорок героїв п'ють у таверні. Шістдесят вдів — удома.
* [Розжалувати Горна]
    ~ res(walls, -10)
    ~ res(order, 5)
    ~ loy_horn = 0
    ~ f_horn_demoted = true
    (зриває нашивку) Ви боїтеся перемог більше, ніж поразок, Протекторе.
- ->->

=== betray_anselm ===
~ b_anselm = true
# speaker:narrator
На вашому столі — копія доповіді Верховній Інквізиції: «Протектор некомпетентний». Почерк бездоганний.
# speaker:anselm
# portrait:anselm_smirk
Я хотів, щоб ви знали, що я вмію писати. І що я вмію не надсилати.
* [Торгуватися]
    ~ res(gold, -10)
    ~ loy(loy_anselm, 3)
    Мудро. Я коштую дорожче за ворога, але я — ваш.
* [Порвати доповідь при ньому]
    ~ res(order, -5)
    ~ loy(loy_anselm, -2)
    ~ f_anselm_report = true
    (дивиться, як падають клапті) У мене є ще дві копії. Але ви цього не знали. Тепер знаєте.
- ->->

=== betray_bozhena ===
~ b_bozhena = true
# speaker:narrator
Площа. Божена на сходах, у сірому плащі, з книгою записів.
# speaker:bozhena
Я записувала кожне рішення ради. Кожне. Закон у Корвені помер разом із совістю ради. Я лише читаю його заповіт.
* [Вийти до людей і відповісти]
    ~ res(order, 5)
    ~ loy(loy_bozhena, 2)
    (коли ви закінчуєте) Ви говорили чесно. Я запишу і це.
* [Заборонити їй говорити]
    ~ res(order, -10)
    ~ loy(loy_anselm, 1)
    ~ f_bozhena_silenced = true
    # speaker:narrator
    Божену ведуть із площі двоє вартових. Вона не опирається. Книгу записів забирає Ансельм.
- ->->

=== betray_ferrante ===
~ b_ferrante = true
# speaker:narrator
Ніч. Скарбниця. Свічка. Ферранте рахує, і рахує не те, що в книгах.
# speaker:ferrante
Протекторе! Я… це резерв. На чорний день. Ви ж розумієте, що чорний день настане? Я — розумію. Я єдиний, хто розуміє.
* [«Поверніть. Усе, до монети».]
    ~ res(gold, -5)
    ~ loy(loy_ferrante, 1)
    (віддає мішечок, другий лишається під столом) Звісно. До монети.
* [«Варта! Обшукати скарбницю».]
    ~ res(gold, -15)
    ~ res(order, 5)
    ~ loy_ferrante = 0
    ~ out_ferrante = true
    ~ f_ferrante_jailed = true
    (коли його виводять) Ви мене ще згадаєте, коли в скарбниці буде порожньо! Я рахував за вас!
- ->->

=== betray_isolde ===
~ b_isolde = true
# speaker:narrator
Ранок. Комори Гільдії зачинені. На воротах — табличка: «Облік».
# speaker:isolde
Облік, Протекторе. Раз на рік Гільдія рахує, що має. Цього року — раз на місяць. Цього місяця — зараз.
* [Домовитися]
    ~ res(gold, -10)
    ~ loy(loy_isolde, 3)
    Облік закінчено. Дивовижно, скільки всього знайшлося.
* [Відкрити комори силою]
    ~ res(bread, 5)
    ~ res(order, -10)
    ~ loy(loy_isolde, -3)
    ~ f_guild_stormed = true
    # speaker:narrator
    Варта виламує ворота. Мішків менше, ніж чекали. Набагато менше.
- ->->

=== betray_tobias ===
~ b_tobias = true
# speaker:narrator
Лазарет. Тобіас стоїть серед ліжок, хворі слухають.
# speaker:tobias
# portrait:tobias_urgent
Рада торгує життями, як мішками! Я бачив їхні рахунки: скільки коштує дитина, скільки — солдат!
* [Прийти в лазарет і вислухати]
    ~ res(order, 5)
    ~ loy(loy_tobias, 3)
    (плаче, раптово) Я не спав тиждень. Пробачте. Ні. Не пробачайте. Просто дайте мені ліки.
* [Вигнати з ради]
    ~ res(order, -10)
    ~ loy_tobias = 0
    ~ out_tobias = true
    ~ f_tobias_expelled = true
    Мене виженете. Хворих — ні. Вони прийдуть за мною.
- ->->

=== betray_verena ===
~ b_verena = true
# speaker:narrator
Уночі біля таверни — черга з клунками. Верена тримає ліхтар і рахує монети.
# speaker:verena
Стік старий, пане, ще дідів. Хто платить — той виходить. Хто не платить — той залишається з вами. Чесна торгівля.
* [Взяти частку]
    ~ res(gold, 10)
    ~ res(order, -5)
    ~ loy(loy_verena, 2)
    ~ f_verena_partner = true
    Ох, пане. Я знала, що ми порозуміємося. Ви почали думати як я.
* [Замурувати стік]
    ~ res(order, -5)
    ~ res(bread, 5)
    ~ loy(loy_verena, -3)
    ~ f_drain_sealed = true
    (дивиться, як муляри кладуть цеглу) Люди все одно тікатимуть. Тепер — через стіну. І падатимуть.
- ->->

=== betray_erik ===
~ b_erik = true
# speaker:narrator
Ерік не приходить на раду. Його знаходять у підвалі Гільдії над відкритою скринею із золотом купців — він переписує його «на схов».
# speaker:erik
Вони сказали, що інакше заберуть самі. Я… я хотів, щоб хоч книги лишились чесними.
* [Пробачити: золото повертається в книги]
    ~ loy(loy_erik, 2)
* [Забрати золото в скарбницю міста]
    ~ res(gold, 10)
    ~ loy(loy_erik, -3)
    # speaker:erik
    (тихо) Тепер купці скажуть, що я їх продав. І матимуть рацію.
-
->->
