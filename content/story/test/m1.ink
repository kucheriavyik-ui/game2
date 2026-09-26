// M1 test content: one decision that moves the resource bars.
// Replaced by the real month 1 council in M3 (docs/story/months_01-03.md, 3.4).

=== shtarn_talk ===
# speaker:shtarn
Пане Протекторе. Під брамою тисячі біженців із передмістя. Хліба в коморах на сім місяців, якщо ніхто нового не прийде.
Наказуйте.
+ [Закрити ворота]
    ~ res(order, -10)
    ~ loy(loy_shtarn, 1)
    ~ loy(loy_ferrante, 1)
    ~ loy(loy_tobias, -2)
    ~ loy(loy_bozhena, -1)
    ~ loy(loy_verena, -1)
    ~ f_gates_closed = true
    # speaker:tobias
    Я молитимусь за них. І за вас. Вам це знадобиться більше.
+ [Впустити всіх]
    ~ res(bread, -15)
    ~ res(order, 5)
    ~ loy(loy_tobias, 2)
    ~ loy(loy_bozhena, 1)
    ~ loy(loy_shtarn, -1)
    ~ loy(loy_ferrante, -1)
    ~ f_refugees_in = true
    ~ f_spy_inside = true
    Добре серце, Протекторе. Сподіваюся, воно наїсться.
+ [Впустити через перевірку Інквізиції]
    ~ res(bread, -10)
    ~ res(order, -5)
    ~ loy(loy_anselm, 2)
    ~ loy(loy_bozhena, -1)
    ~ loy(loy_tobias, -1)
    ~ f_refugees_filtered = true
    # speaker:bozhena
    Я стоятиму поруч з Ансельмом на хвіртці. Щоб він пам'ятав, що на нього дивляться.
- # speaker:shtarn
(Тестова розмова. Поговоріть зі мною ще раз, щоб знову змінити шкали.)
-> END
