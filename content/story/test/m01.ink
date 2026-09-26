// M2 TEST CONTENT for month 1 — a short version of docs/story/months_01-03.md, section 3.
// Its job is to exercise the month loop; the real month 1 replaces it in M3.

=== m01_open ===
# speaker:shtarn
Пане Протекторе. Сорок тисяч мечів на пагорбах. У нас три тисячі і стіни, які пам'ятають ще вашого діда.
# speaker:tobias
Під брамою наші люди. Жінки, діти, старі. Якщо ми не відчинимо, ворог знайде їх до ночі.
# speaker:shtarn
У вас є день, Протекторе. Пройдіться стінами. Потім скажете раді, що робимо. Стіл ради - під вежею ліворуч.
# journal:m01_start
-> END

=== shtarn_talk ===
# speaker:shtarn
Кожен рот - мінус день облоги. Я солдат, а не священник.
-> END

=== tobias_talk ===
# speaker:tobias
{k_smiths:
    Мирослава знову питала про вас. Двадцять рук, що вміють лагодити стіни.
- else:
    Бачите ту жінку за ґратами? Ковалиха Мирослава. З нею двадцятеро: ковалі, теслі, мулярі.
    # journal:k_smiths
    Вони вміють лагодити стіни. Впустіть хоча б їх.
}
-> END

=== horn_talk ===
# speaker:horn
Бачите ті дахи? До зими там сидітиме ворожий полк. Спалімо їх самі, поки не пізно.
+ [«А якщо розібрати будинки на дерево для стін?»]
    На це треба тиждень і сотня рук. Тижня в нас немає. А от сотня рук... (дивиться на натовп біля брами)
    # journal:k_timber
    Подумайте.
+ [«Я подумаю».]
    Думайте швидше, Протекторе.
- -> END

=== m01_council ===
# speaker:shtarn
Рада зібралась. Після рішень місяць закінчиться. Готові?
+ [Так, починаймо.]
    -> decisions
+ [Ще ні.]
    Ми почекаємо. Недовго.
    -> END

= decisions
# council_open
Перше. Біженці під брамою.
* [Закрити ворота #stance:shtarn:for #stance:ferrante:for #stance:tobias:against #stance:bozhena:against #stance:verena:against]
    ~ res(order, -10)
    ~ loy(loy_shtarn, 1)
    ~ loy(loy_ferrante, 1)
    ~ loy(loy_tobias, -2)
    ~ loy(loy_bozhena, -1)
    ~ loy(loy_verena, -1)
    ~ f_gates_closed = true
    # speaker:tobias
    Я молитимусь за них. І за вас. Вам це знадобиться більше.
* [Впустити всіх #stance:tobias:for #stance:bozhena:for #stance:verena:for #stance:shtarn:against #stance:ferrante:against #stance:anselm:against]
    ~ res(bread, -15)
    ~ res(order, 5)
    ~ loy(loy_tobias, 2)
    ~ loy(loy_bozhena, 1)
    ~ loy(loy_shtarn, -1)
    ~ loy(loy_ferrante, -1)
    ~ f_refugees_in = true
    ~ f_spy_inside = true
    Добре серце, Протекторе. Сподіваюся, воно наїсться.
* [Впустити через перевірку Інквізиції #stance:anselm:for #stance:bozhena:against #stance:tobias:against]
    ~ res(bread, -10)
    ~ res(order, -5)
    ~ loy(loy_anselm, 2)
    ~ loy(loy_bozhena, -1)
    ~ loy(loy_tobias, -1)
    ~ f_refugees_filtered = true
    # speaker:bozhena
    Я стоятиму поруч з Ансельмом на хвіртці. Щоб він пам'ятав, що на нього дивляться.
* {k_smiths} [Впустити лише ремісників і їхні сім'ї #stance:shtarn:for #stance:horn:for #stance:tobias:against #stance:verena:against]
    ~ res(bread, -5)
    ~ res(walls, 10)
    ~ res(order, -5)
    ~ loy(loy_shtarn, 1)
    ~ loy(loy_tobias, -1)
    ~ loy(loy_verena, -1)
    ~ f_gates_closed = true
    ~ f_smiths_in = true
    Мирослава гукає з брами: «Дякую, пане! Ми не підведемо!» За нею тиша.
- # speaker:shtarn
Друге. Передмістя.
* [Спалити #stance:shtarn:for #stance:horn:for #stance:isolde:against #stance:verena:against]
    ~ res(walls, 10)
    ~ res(order, -10)
    ~ loy(loy_horn, 1)
    ~ loy(loy_shtarn, 1)
    ~ loy(loy_isolde, -2)
    ~ loy(loy_verena, -1)
    ~ f_suburbs_burned = true
* [Залишити як є #stance:isolde:for #stance:verena:for #stance:shtarn:against #stance:horn:against]
    ~ res(walls, -10)
    ~ res(order, 5)
    ~ loy(loy_isolde, 1)
    ~ loy(loy_horn, -2)
    ~ f_suburbs_left = true
* {k_timber} [Розібрати на дерево для стін #stance:horn:for #stance:ferrante:against]
    ~ res(walls, 10)
    ~ res(gold, -10)
    ~ res(order, -3)
    ~ loy(loy_horn, 1)
    ~ loy(loy_ferrante, -1)
    ~ f_suburbs_timber = true
- Рада розходиться.
# month_end
-> END

=== m01_end ===
~ upkeep()
{f_suburbs_burned: Передмістя горіло три дні. Дим було видно з моря.}
{f_suburbs_left: На третю ніч у вікнах передмістя з'явились ворожі вогні.}
{f_suburbs_timber: Там, де стояли будинки, тепер лише фундаменти. Мур на північ став на лікоть вищим.}
{f_gates_closed && not f_smiths_in: Крики під брамою стихли на п'яту ніч.}
-> defeat_check
