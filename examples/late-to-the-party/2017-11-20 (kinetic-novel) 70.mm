little-idea.loop
little-idea.play

forest
susan=	<span style="color:magenta">Susan</span>::
ben=	<span style="color:aqua">Ben</span>::

ben		habit
ben.style	left:25%;
susan	angry
susan.style	left:-100%;

content.style	filter:brightness(0);

engine.wait		.1
content.style	time:2s;filter:brightness(1);

engine.wait		2
content.style	filter:brightness(1);

susan.style		time:1s;left:-25%;
		[susan]<shout>What are you doing out here?! Everyone's looking for you, it's time to sing you Happy Birthday!</shout>

ben		shock_blush
susan	frown
		[ben]Um... well...
		[ben]<span style="font-size:.5em">...I hate it when everyone sings me Happy Birthday...</span>
susan	smirk
		[susan]<speed constant rate="2">...</speed>what was that?
ben		scared
		[ben]<shake>Um, when everyone sings Happy Birthday, I get all anxious and stuff.</shake>

susan	grin
		[susan]<sing>Then we'll sing something else!</sing>
ben		shy_blush
		[ben]It's not that. They're all surrounding me, <speed rate=".9">I get so claustrophobic, </speed><speed rate=".7">it's like I can hear them all breathing at once </speed><speed rate=".5">and I can feel the air around me get thick </speed><speed rate=".3">and it becomes hard to breathe </speed><speed rate=".1">and even think->

		[susan]<speed rate="0">What do you want us to sing?</speed>

ben		habit
		[ben]I don't want anyone to sing. I just want cake.

ben		scared
susan	angry

		[susan]<shout>So do I! And guess what, if you don't get your butt back to the party, <em>neither</em> of us is getting cake!</shout>
ben		shock
susan	frown
		[ben]...
susan	sad
		[susan]People are starting to leave. <em>Come on,</em> Ben.
ben		smirk
		[ben]...why don't we wait until they do?
susan	angry
		[susan]<shout>Augh, why do you have to be such an introvert?!</shout>
susan	frown
ben		shy
		[ben]...

susan	sad
		[susan]Sorry. I just worked really hard on this cake, and I've <em>REALLY</em> been looking forward to sharing it with you and all my friends! >
ben		sad
susan	cry
		+But if you just want to relax today, I understand...

ben		laugh
		[ben]No you don't. You're just trying to guilt trip me right now.
susan	angry
ben		scared
		[susan]<shout><span style="font-size:1.5em;">DANG IT BEN!</span></shout>

susan	angry
ben		scared
susan.style		time:1s;left:100%;
ben.style		time:1s;left:100%;
		>
engine.wait		1
forest.style	time:1s;opacity:0;
engine.wait		3.5

		<fade>Writer<br>Josh Powlison<br><br>Characters<br>konett (cosmickonett.<wbr>tumblr.<wbr>com) (under CC-BY-3.0)<br><br>Go to the menu at the top of the screen and drag to go to any place in the kinetic novel!</fade>