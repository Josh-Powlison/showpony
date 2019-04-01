<?php include '~include.php'; ?>

		You can talk to everyone in every order, but you only have time for 1 text option with each person.
		Learn who they are, and how you can best encourage them and connect!

// People List
[doveTalk][kendraTalk][tomoyoTalk][verrillTalk][baldwynTalk][irshaadTalk]==	/111111/
engine.go	// End

		Who will you talk to?
doveTalk==		0
choices	+<button data-go="// Dove: Choices">Princess Dove</button>>
kendraTalk==	0
choices	+<button data-go="// Kendra: Choices">Kendra</button>>
tomoyoTalk==	0
choices	+<button data-go="// Tomoyo: Choices">Tomoyo</button>>
verrillTalk==	0
choices	+<button data-go="// Verrill: Choices">Verrill</button>>
baldwynTalk==	0
choices	+<button data-go="// Baldwyn: Choices">Baldwyn</button>>
irshaadTalk==	0
choices	+<button data-go="// Irshaad: Choices">Irshaad</button>

talkOrderDay=	0
		
/****************/

// Dove: Choices

doveTalk=		1

[dove]
talkOrderDay1+	1

		Hey [mc], how are you holding up?

talkOrderDay==	1
		You don't have to worry about talking to the others, they're all really nice people!
talkOrderDay>	1
		What would you like to talk about?
		
		<button data-go="// Dove: Branch 1">Are you sure this group can really work together?</button><button data-go="// Dove: Branch 2">Are you and family doing well?</button><button data-go="// Dove: Branch 3">What are the strengths of each of the team members?</button>
		
// Dove: Branch 1

dove	nervous

		!...
		...why, are you worried?

dove	thoughtful

		...I guess you are. Why else would you be asking?

dove	determined

		I believe they can, but they need a great leader like you to bring them together.
		I prayed about this team a lot...
		...we've never really talked about it, but you know the royal family are all Communers... 
		...you'll catch me a lot of times stopping mid-sentence, thinking. That's me listening to God. He talks to me a lot.
		...I thought this team seemed like...

//Dove pauses

//[God speaks to Dove: "Stop. You're getting yourself tongue-tied and are breaking morale. Tell him this: 'This team is perfect for what we're looking for, but they have a lot of room to grow. It's your job to grow them. And I know you have it in you.'"]

		"This team is perfect for what we're looking for, but they have a lot of room to grow. It's your job to grow them. And I know you have it in you."

dove		nervous

		...heheheh...
		...Kendra thinks I just chose you because you're my little cousin. I don't know if others think the same way. But growing up, I saw something in you...
		You were quiet. You were off to the side. Others thought you were antisocial, but I always saw that you were there, watching... you were aware of everything going on.
		I think that's why God chose you. I think He wants you to take that skill and use it in leadership.
		I honestly envy that about you... I'm nowhere near as observant as you are.
		It's like you see life as a series of branching paths, and are able to determine what will happen, whatever you do.
		...I think it's safe to trust your instincts.

talkOrderDay1==	0
		Talk to the others, and I think you'll see the potential in the group.

talkOrderDay1>	0
		I think you're already starting to see the potential in the group. I look forward to seeing where you take everyone here.

		It was great talking with you, [mc]!
		
name.empty
textbox.empty
		
engine.go	// People List

// Dove: Branch 2

		Yes, we're doing well.
		...
		...Daddy's still worried about me, though.
		I think my older brothers helped talk him into letting me go on this trip. I'm thankful to them for that.
		This is a day of a lot of firsts. First trip with my personal security detail, first day for you in a leadership position this big... I don't think any of the team expected to be picked, honestly.
		...well, except Kendra. She probably would've let me have it if I hadn't brought her on.
		Mommy's alright with the trip. She remembers what it was like being my age, but Daddy isn't as likely to listen to her as to my brothers. That's just him, I guess.

//[God tells Dove: "You need to tell them."]

		...

//[God tells Dove: "Tell them what your brother said."]

		...my oldest brother said that if anything happens, he'll take full responsibility for the trip. Hopefully, that helps you relax a bit.
		But I better not catch you sleeping in again!
		Well, it was great talking to you!

talkOrderDay1==	0
		Make sure to talk to the others too!

talkOrderDay1>	0
		I'm glad to see you socializing with the others! I know you tend to be shy, so this must be quite a stretching experience for you!
		
name.empty
textbox.empty
		
engine.go	// People List

// Dove: Branch 3

		I've told you all about them many times... but I guess a review couldn't hurt.
		Kendra's very confident. She can be abrasive, but she fights for what she believes in- and I can tell you she believes in me.
		...it might take awhile for her to open up to you the same way though.
		Tomoyo is very skilled in her craft, and great at observing others and seeing the wide range of possibilities in any scenario. Although she's timid, it's not that she won't fight or do hard things; she just really has to be sure of herself to move forward. Make sure you offer her plenty of encouragement.
		Verrill is very by-the-book- which is essential in a nurse. He never forgets any detail, and can be trusted with very complex problems. He rubs others the wrong way sometimes, but he really cares about people and wants to do what's best.
		Baldwyn is extremely courageous and isn't afraid to be in the thick of things. But he often gets in over his head. Anytime you have a big risk that needs to be acted on now, Baldwyn's your guy. His instincts amaze me.
		Irshaad is great at taking on single tasks. He's very single-focused and isn't very aware though, so it's best not to give him too many things to take care of at once.
		[shout]Oh![/shout] You probably meant their skillset, didn't you?
		Kendra's a powerful mage, Tomoyo is an incredible archer- the first woman to join the Marksmen actually!, Verrill is a brilliant nurse and alchemist, Baldwyn is skilled with an axe- I have no idea how he wields such a clumsy weapon so well, and Irshaad is a great swordsman.
		I really believe this team can be great, but you'll need to bring them all together. I know you have a way with words; you can build up a team, or tear them down. I've prayed a lot about it, and decided to trust you. Don't worry if some of them seem standoffish or shy right now, if you're straightforward and open with them, they'll respond in kind!
		You'll know the right words to say. I know you will.
		Just remember- it's your responsibility to bring the team together! They aren't just going to come together without you!
		I believe in you.
		It was great talking with you!

name.empty
textbox.empty

engine.go	// People List

/****************/
		
// Kendra: Choices

[kendra]
talkOrderDay1++

		...

		<button data-go="// Kendra: Negative">I'm glad we have such a skillful mage on the team!</button data-go="// Kendra: Positive"><button>You probably know this team best. Any advice for me?</button><button data-go="// Kendra: Neutral">...</button>

// Kendra: Negative

kendraFavor--

		Quit kissing ass; it got you far with Dove, it won't get you very far with me!
		Seriously, why are you in charge of this team anyway? I should've been in charge; I've been friends with Dove her whole life, whereas you were just the awkward little cousin, hanging out in the corner.
		Is it because you're a first cousin and I'm only a second cousin? Did King _____ put that in as an idiotic stipulation? I don't know.
		But just because you're the leader, doesn't mean I have to respect you.
		Keep your distance. Just let me do my job.
		
name.empty
textbox.empty
		
engine.go	// People List

// Kendra: Neutral

// kendraFavor unchanged

		...
		...look, if you won't say something, I will.
		I don't trust you as a leader yet. I haven't seen you do anything leader-ly- ever. In fact, I think you're just a tool.
		You probably don't want to be in this position either. I'll bet you're just here because the Princess asked you to be. I get it. I'm not a fan of shopping trips either. They're dumb.
		But you could at least put in some backbone. I don't want to follow someone around who's quiet all the time.
		I feel your pain, but try to be strong for us. Get me?
		I could totally lead, and frankly I'm pissed at Dove for choosing you over me, but she probably had to due to some stipulation from her family. I get it. It's not your fault.
		...but stand up a little straighter or something, alright? You're depressing me.
		I don't want to have to feel sorry for you...
		
name.empty
textbox.empty
		
engine.go	// People List

// Kendra: Positive

kendraFavor++

kendra	surprised

		?!?!

kendra	smug

		Yeah.
		Each of these people has their own strengths and weaknesses. But it's easy to just see their weaknesses if you prod them the wrong way.
		Try not to make a judgment call on anybody here too quickly. Dove is too soft in my opinion, but she's also made surprisingly good choices in the past.
		See the good in everyone, and try to relate with them where they're at.
		I thought our first convo on the trip would go much worse. It was good talking to you, I guess.

name.empty
textbox.empty

engine.go	// People List

/****************/

// Tomoyo: Choices

[tomoyo]
talkOrderDay1++

		...

		<button data-go="// Tomoyo: Positive">I've heard you're an incredible archer.</button><button data-go="// Tomoyo: Negative">So what are you good at?</button><button data-go="// Tomoyo: Neutral">I noticed your pointy ears... where are you from?</button>

// Tomoyo: Negative

tomoyoFavor--

		Oh... archery. I've been told I'm really good with a bow.
		And I am... I mean, if you saw...
	
// *squeaks*
	
		...
		...sorry, I just didn't expect you to be so...
		...
		...up-front.
		I... um... I've been told I'm a great archer...
		...but I already told you that...
		...I'm sorry, I can't think clearly right now.
		...it's a reasonable question, but I have a hard time answering it. Usually, other people speak well of me- I don't worry about proving myself. Proving myself is... exhausting...
		...but archery's fun. When you're pulling back your drawstring, nobody distracts you... they know you must focus... it's peaceful...
		...but only until you release.
		...
		...um, sorry, I don't really know what to talk about... you're so quiet, and I'm so...
		...
		...ah, I think you'll find other members of the group are much better conversationalists than me!

// Tomoyo rushes off.
		
name.empty
textbox.empty
		
engine.go	// People List

// Tomoyo: Neutral

// tomoyoFavor unchanged

		Oh... um... I'm from the woods to the southwest.
		...I know that's not a very common answer; most elves are from far east. But I was raised in the woods. I think my parents wanted us to be more in touch with nature.
		It was dangerous there though; as the oldest, I had to look after my siblings when my parents went out.
		I taught myself archery, because I knew I couldn't handle any of the local monsters up close...
		...
		...sorry, I'm rambling.
		I guess I answered your question.
		It was good talking to you!
		
name.empty
textbox.empty
		
engine.go	// People List

// Tomoyo: Positive

tomoyoFavor++

		I- I've been told...
		It's an honor to be the first woman on the Marksmen. Not that it's that big of a group anyway, and it was bound to happen eventually...
		I had to become an archer growing up to protect my siblings, and I wanted to make sure no one else-

// Catches herself
		...
		I wanted to keep them safe.
		Sorry, I'm rambling.
		Some people think I got on the Marksmen because I connected well with one of the members and played him. But he approached me first! He was very kind; but he brought me to a pub when I was only 17. I was the youngest one there...
		...I had milk...
		We had an archery contest in my hometown, and I thought he was the final contestant, so I had to beat him! My family needed the money...
		...but it turned out he was an honored guest, and I'd already won...
		When he saw what I did, I felt humiliated. I didn't mean to one-up our honored guest- I didn't even realize he was one of the Marksmen!!!
		...sorry, I'm rambling.
		...I'm really excited to be here. It's an honor.
		Thank you for saying hi.

name.empty
textbox.empty

engine.go	// People List

/****************/

// Verrill: Choices

[char]
talkOrderDay1++

		Hi.

		<button data-go="// Verrill: Positive">What's your specialty, Nurse?</button><button data-go="// Verrill: Negative">So you're all packed up for whatever happens?</button><button data-go="// Verrill: Neutral">You're still studying, right?</button>

// Verrill: Negative

verrillFavor--
		
		Absolutely. Anything less would be absurd.
		Heaven forbid anything happens, but if anything does we’ll be more than prepared.
		
name.empty
textbox.empty
		
engine.go	// People List

// Verrill: Neutral

// verrillFavor unchanged
		
		Correct. I will become a doctor someday.
		Even though a nurse is usually considered a doctor’s assistant, Princess Dove still saw fit to bring me along.
		I am both honored and confused by this, but I am confident in my abilities to care for anyone here as requested and needed.
		...even if working without a supervising doctor at my stage of education is unadvised.
		
name.empty
textbox.empty
		
engine.go	// People List

// Verrill: Positive

verrillFavor++

		Alchemical medicine.
		Growing up, I had to take care of both of my parents; giving them the right medications was trying, and we didn’t have enough money to pay someone else for the right ingredients, let alone finished medications.
		As a result, I became quite good at alchemical medicine.

name.empty
textbox.empty

engine.go	// People List

/****************/

// Baldwyn: Choices

[baldwyn]
talkOrderDay1++

		Hi.

		<button data-go="// Baldwin: Positive">I doubt it. Hopefully this trip's uneventful.</button><button data-go="// Baldwin: Neutral">Maybe. I guess that's why we're all here.</button><button data-go="// Baldwyn: Negative">Only on my order.</button>

// Baldwyn: Negative

baldwynFavor--
		
name.empty
textbox.empty
		
engine.go	// People List

// Baldwyn: Neutral

// baldwynFavor unchanged
		
name.empty
textbox.empty
		
engine.go	// People List

// Baldwyn: Positive

baldwynFavor++

		I appreciate your honesty, but I wouldn’t mind if at least one goblin or bandit showed up. As long as they didn’t get too close to the Princess.

name.empty
textbox.empty

engine.go	// People List

/****************/

// Irshaad: Choices

[irshaad]
talkOrderDay1++

		Hi.

		<button data-go="// Irshaad: Negative">Are you on high alert?</button><button data-go="// Irshaad: Positive">Did you remember everything for the trip?</button><button data-go="// Irshaad: Neutral">You're also a blacksmith, right?</button>

// Irshaad: Negative

irshaadFavor--
		
name.empty
textbox.empty
		
engine.go	// People List

// Irshaad: Neutral

// irshaadFavor unchanged
		
name.empty
textbox.empty
		
engine.go	// People List

// Irshaad: Positive

irshaadFavor++

name.empty
textbox.empty

engine.go	// People List

/*********************/

// End

		End of Day 1