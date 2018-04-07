>	ST	window	filter:brightness(0);
>	DS	cats	=	0
>	BG	cat		kittens.jpg
>	AU	cats.mp3	loop	play
>	WT	0
>	ST	window	transition:all 1s;filter:brightness(1);
{,,,shout}Welcome to the cat store, you crazy cat person!
>	GO	store

store
>	IF	[cats]	==	0		hi0
>	IF	[cats]	==	1		hi1
>	IF	[cats]	<	5		hi5
>	IF	[cats]	<	10		hi10
>	IF	[cats]	<	20		hi20
>	IF	[cats]	<	30		hi30
>	IF	[cats]	<	40		hi40
>	IF	[cats]	<	50		hi50
>	GO	hitop

hi0
>	TB	main	You are presently catless. What can I getcha?
>	GO	SHOP

hi1
>	TB	main	You currently have 1 cat. And it's a cutie! What can I getcha?
>	GO	SHOP

hi5
>	TB	main	You currently have [cats] cats. Look at them play! What can I getcha?
>	GO	SHOP

hi10
>	TB	main	You currently have [cats] cats. Whoo, that's a lot of cats! What can I getcha?
>	GO	SHOP

hi20
>	TB	main	You currently have [cats] cats. Um... I gotta say I'm starting to get concerned about you. What can I getcha?
>	GO	SHOP

hi30
>	TB	main	You currently have [cats] cats. You sure you want another cat? You SURE? Okay, what can I getcha?
>	GO	SHOP

hi40
>	TB	main	You currently have [cats] cats. And you are certainly healthy in the head. What can I getcha?
>	GO	SHOP

hi50
>	TB	main	You currently have [cats] cats. I can already guess what you're going to do...
>	GO	SHOP

hitop
I ain't selling you any more cats! [cats] is more than enough! Go home!
>	GO	bye

SHOP
>	IN	addcat		(Buy a cat)
>	IN	minuscat	(Sell a cat)
>	IN	bye			Goodbye!
>	WT

addcat
>	DS	cats	+	1
All right, that's another cat in your house!
>	GO	store

minuscat
>	IF	[cats]	<=	0	catnone
>	GO	cathas

catnone
You're already catless! What, what are you trying to pull? You evil person!
>	GO	store

cathas
>	DS	cats	-	1
Um... okay! {.75,,,}What a cat-hater...
>	GO	store

bye
{,,,sing}Bye bye, cat person!
>	ST	window	filter:brightness(0);
>	WT	1
>	AU	cats.mp3	stop
>	TB	main
>	EN