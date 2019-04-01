/* Persistent Variables */
mc=				Default

<?php include '~include.php'; ?>

//dove			habit

/* Start */
		A perverse man stirs up strife. A whisperer separates close friends.
		+<br>Death and life are in the power of the tongue; those who love it will eat its fruit.
		+<br>Whoever digs a pit shall fall into it. Whoever rolls a stone, it will come back on him.
		+<br>-Proverbs from the Bible

// dove	habit

[dove]
		[sing]Good morning![/sing]
		Are you ready for our trip to Tisimo?
		...
		Are you fully awake yet?
		What's your name?

// Name input
choices	<input type="text" data-var="mc" placeholder="Your Name" value="Your Name">
//choices	<input type="text" data-var="mc" placeholder="Your Name" value="Your Name"><input type="submit" value="...">
choices.empty

/*
mc==	/^(?:z+|sno+re)$/
		I know you're awake! What's your name?
engine.go	// Name input
*/

		Good! Glad to see you're not totally conked out!
		But if you're going to lead my personal security detail, I <em>really</em> shouldn't have to wake you up every morning...

//choices	<input type="button" value="Gah! We're heading out today!!" data-go="//1-1"><input type="button" value="You're right. I'll work on getting to bed earlier." data-go="//1-2"><input type="button" value="Maybe I’m not cut out for this..." data-go="//1-3">
choices		<button data-go="//1-1">Gah! We're heading out today!!</button><button data-go="//1-2">You're right. I'll work on getting to bed earlier.</button><button data-go="//1-3">Maybe I’m not cut out for this...</button>

/****************///
//Gah! We're heading out today!!
//1-1
choices.empty

//Dove grins large
		Yep! Aren’t you excited?! This is our first time out together on an official mission!

		...well, it’s shopping, but I’m the Princess, so that makes it about as official as it can get!

		Everyone else is already gathered by the gate. <sing>It’s going to be so much fun!</sing>

//Dove gets quiet for a moment.
//[God’s telling Dove the following: “They’re getting antsy, go out to them.”]

		They’re prolly getting antsy, I’ll go check up on them! Join me when you’re ready!

//Dove leaves your room.
		
.go		//Continue 1
/****************///

/****************///
//You're right. I'll work on getting to bed earlier.
//1-2
choices.empty

		How late were you up prepping last night? I hope you’re taking care of yourself!

		Well, whatever the case, we’re ready to head out! <sing>Aren’t you excited?!</sing>

//Dove gets quiet for a moment.
//[God’s telling Dove the following: “Don’t worry, it’ll all work out.”]

//Dove gets embarrassed.
		Sorry, I’m just really worried. I want you all to look good for Daddy- if King Dad thinks you aren’t taking care of things…

//[God’s telling Dove the following: “But they’ll do great.”]
//Dove nervous.
		But you’ll do great! You’ll do great!
		I’ll see you out there!

//Dove leaves your room.

engine.go		//Continue 1
/****************///

/****************///
//Maybe I’m not cut out for this...
//1-3
choices.empty

		I chose you because you are. You just have to grow into the role a bit!
		Have faith in yourself, just like God does!
		I prayed a lot about choosing you for the role-

//Dove catches herself.
		Sorry, that just made it sound like I thought you were a really bad choice! You’re a great choice!

//Dove goes quiet for a second.
//[God’s telling Dove the following: “You’re making it worse.”]

//[God’s telling Dove the following during her next line: “Dove. Dove.”]
		I mean, I prayed a lot because I wanted to make sure-

//Dove apologetic, but actually to God.
		Okay, sorry. I’ll see you out there, [mc]!

//Dove leaves your room.

engine.go		//Continue 1
/****************///
		
//Continue 1
		
		Alright, everyone's here!
		[sing]Are we ready to go, [mc]?[/sing]

choices	<button data-go="// Roll Call Start">Let's do roll call first!</button><button data-go="// Continue 2">Yep, let's go!</button>

// Roll Call Start
choices.empty
		Um... alright! I think it’s pretty clear that everybody’s here, but sounds good to me! Haha!
		
// Roll Call

/* Check the combined variable values; don't need to roll-call yourself */
[selfTalk][doveTalk][kendraTalk][tomoyoTalk][verrillTalk][baldwynTalk][irshaadTalk]==	/.111111/
engine.go	// Continue 2

[selfTalk]==		0
choices	+<button data-go="// Self: Roll Call">[mc]!</button>>
[doveTalk]==		0
choices	+<button data-go="// Dove: Roll Call">Princess Dove!</button>>
[kendraTalk]==	0
choices	+<button data-go="// Kendra: Roll Call">Apprentice Mage Kendra!</button>>
[tomoyoTalk]==	0
choices	+<button data-go="// Tomoyo: Roll Call">Marksman Tomoyo!</button>>
[verrillTalk]==	0
choices	+<button data-go="// Verrill: Roll Call">Nurse Verrill!</button>>
[baldwynTalk]==	0
choices	+<button data-go="// Baldwyn: Roll Call">Baldwyn the Flurry!</button>>
[irshaadTalk]==	0
choices	+<button data-go="// Irshaad: Roll Call">Knight Irshaad!</button>

// Self: Roll Call
choices.empty
selfTalk=		1

[dove]
		...

[kendra]
		Okay, this is just stupid.

[dove]
		Kendra!

[kendra]
		Why the hell are you roll-calling yourself?! Are you that tired?>
// kendra folds her arms
		+ Did you just wake up?

[dove]
		...

[kendra]
		You woke [mc] up, didn’t you, Dove?

[dove]
		!...

//kendra	annoyed
[kendra]
		Whatever. It’s just a shopping trip.
		
engine.go	// Roll Call
		
// Dove: Roll Call
choices.empty
doveTalk=		1
[dove]
			...here!
engine.go	// Roll Call

// Kendra: Roll Call
choices.empty
kendraTalk=		1
[kendra]
			Here. Why are we doing this again?
engine.go	// Roll Call

// Tomoyo: Roll Call
choices.empty
tomoyoTalk=		1
[tomoyo]
			Here!
engine.go	// Roll Call

// Verrill: Roll Call
choices.empty
verrillTalk=	1
[verrill]
			Here. I'm happy to see you're doing this by the book.
engine.go	// Roll Call

// Baldwyn: Roll Call
choices.empty
baldwynTalk=	1
[baldwyn]
			Here! Let's get moving already!
engine.go	// Roll Call

// Irshaad: Roll Call
choices.empty
irshaadTalk=	1
[irshaad]
			Here.
engine.go	// Roll Call
		
// Continue 2
choices.empty
[dove]
		Alright, then let's [sing]gooooo![/sing]
		
[selfTalk]==	0
engine.go	// Skip 3

[kendra]
		Before [mc] roll calls themself again.

[dove]
		...

// Skip 3
		
/* End of Intro */