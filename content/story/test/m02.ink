// M2 TEST CONTENT for month 2: a tiny council that can empty the granaries,
// so the defeat path can be tried. Replaced by the real month 2 in M3.

=== m02_open ===
# speaker:ferrante
Хліб подорожчав учетверо. Якщо нічого не змінити, комори спорожніють раніше, ніж ми думали.
# speaker:shtarn
Стіл ради там само, під вежею.
# journal:m02_start
-> END

=== m02_council ===
# speaker:shtarn
Рада зібралась. Готові?
+ [Так.]
    -> decisions
+ [Ще ні.]
    -> END

= decisions
# council_open
# speaker:ferrante
Що робимо з хлібом?
* [Пайки: однакова норма на кожного #stance:ferrante:for #stance:isolde:against]
    ~ res(order, -10)
    ~ loy(loy_ferrante, 1)
    ~ loy(loy_isolde, -1)
* [Відкрити комори: хай їдять досхочу (тест поразки) #stance:verena:for #stance:shtarn:against #stance:ferrante:against]
    ~ res(bread, -100)
    ~ loy(loy_verena, 2)
    ~ loy(loy_ferrante, -3)
- # speaker:shtarn
Рада розходиться.
# month_end
-> END

=== m02_end ===
~ upkeep()
Черги стали коротшими. Або люди просто перестали приходити.
-> defeat_check
