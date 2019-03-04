**v1.0.0+**

**Note: Even though this module can be used for both Visual Novels and Kinetic Novels, we'll use the term Visual Novel throughout.**

**Note: In this version, functionality for interactivity isn't guaranteed (using inputs, engine.go, etc). Please wait for a future version of Showpony if you're looking to use its Visual Novel features for interactive works.**

# Setup

## File Syntax
Visual Novel files have the extension "vn". You can change the criteria for Visual Novel files by adjusting `FILE_DATA_GET_MODULES` in _showpony/settings.php_.

## File Structure
The `resources` folder goes into the story's primary folder (the same folder that has the language and `subtitles` folders).

* resources/
  * audio/
    * music.mp3
    * ...
  * images/
    * image.jpg
    * character-a/
      * excited.png
      * happy.png
      * upset.png
      * ...
    * ...

# Programming Language

This module has a unique programming language. It's not Ren'Py-like- it's got HTML mixed with a more concise setup. It's made to be extremely simple to read and feel powerful in your hands. We'll talk about it below!

## Show Text
**Note: make sure you use tabs in your files!**

### Default Display
```
	I stopped and stared, wondering why the baseball was getting bigger.
	Then it hit me.
```

Write a tab and then the text you want to display!

Punctuation will automatically create pauses in the text, so you don't need to worry about adding any of that in manually.

### Automatically Proceed
```
	I'm sorry, I'm going to have to ask you to leave->
	
	No! I came to see Sparkling Angel->

	...before things get ugly.
```

Put a `>` at the end of a line to automatically proceed to the next one!

### Append Text

```
	See... I wanted to... I wanted to tell you...

	Yes, Brian?!

	I... I love...

	Yes, yes?!?!

	I
	+ love
	+ you
	+r sister.
```

Add a `+` at the beginning of a line of text to append it to the current textbox, rather than replacing the existing text. It'll still require clicking through to continue (unless the previous line ends with `>`).

You can use this to add commands in the middle of text:

```
mech	focused
	Give me a moment...>
wait	1s
mech	happy
	+ There we go!>
mech	thumbs-up
	+ Good as new!
```

### HTML

You can use any HTML tags! `<span>`, `<img>`, etc.

### <speed> Tag

`<speed rate="1" constant></speed>` adjusts the text's speed.

`rate` is the relative rate of text display- the regular speed is multiplied by it. 0 means text appears instantly; 2 means letters appear in 2x the time; .5 means letters appear in 1/2 the time.

`constant` means punctuation won't affect the text's speed. 

`basetime` is also supported and sets the time a regular letter will take to appear in seconds: `<speed basetime=".01">` means a letter will take .01 seconds to appear, and punctuation will be calculated based off that. You can also set `basetime="default"`, which will set it back to normal.

These tags can be nested, so if you have speed tags inside of speed tags, take care that you're getting the speed you want!

### Text Animations

To add animation on text, add the right class to it:
```
	<span class="shout">I'm shouting right now!</span>
```

Some custom animations are included in the module's styles.css file.

Certain animations don't just occur on appearing, but are constant. In these cases, you probably don't want them to be in unison, like for:

```
	<span class="shake">I'm scared right now!</span>
```

You probably want the letters to shake somewhat randomly, rather than the the whole text block shaking in unison.

To do this, you can add `<animation offset="x">`. This will offset the constant animations for each letter.

```
	<span class="shake"><animation offset="3">I'm scared right now!</animation></span>
```

### Escape Character (`\`)

If you want to write a character in that normally would perform a special function, use `\`.

For example, `<` will always read as the beginning of an HTML tag. If you want to write out the literal character `<`, you can use `\` like:

```
	The professor said something about a "\<p>" tag. Ever heard of it?
```

Characters that may need to be escaped: `[ ] < > + \`

If your text doesn't end up looking right, try using `\` to escape some of the letters!

An `\` at the end of the line will display normally.

### Other Languages and HTML Entities

You don't have to use HTML entities or funky code for special letters or characters; you can just write them directly in! They'll be translated correctly. So don't worry about that! (you might have to set `<meta charset="UTF-8">` in your webpage, but Showpony shouldn't have a problem from there)

## Creating Objects

You can create new objects by writing the object name, one or more tabs, and then the name of the file it should call.

```
name	excited
name2	upset
```

Files will default to the path "resources/images/[object_name]/". For example:

```
ben	smile	// Will get file "resources/images/ben/smile.png"
sarah	frown	// Will get file "resources/images/sarah/frown.png"
```

If you don't specify a file extension, it'll assume png. But you can use whatever extensions you want. If you use an mp3 extension, it will instead search for the file in "resources/audio'.

```
background	forest.jpg	// Will get the file "resources/images/background/forest.jpg"
song		theme.mp3	// Will get the file "resources/audio/theme.mp3"
```

You can also search from the root of the resources folder by starting the line with a /:

```
forest		/images/forest	// Will go to the root of the resources folder due to starting with "/". Will get "resources/images/forest.png"
```

You can also layer images:

```
forest		dirt,trees,midday-light
```

To adjust styling between characters, backgrounds, and CGs, you can call some custom classes (these are preset up for you and adjustable in the included CSS file): (see how the `class` command works below)

```
forest.class	background	// This class makes image always fill the area- no black bars around the background
ben.class	character	// This class gives some headroom, and sticks the character to the bottom of the screen.
drama.class	cg		// This class makes the image always fill the screen- no black bars around the CG. Also makes sure it goes above the characters.
```

## Commands

All objects are called the same way, and most have the same options. Commands are called this way:

```
object.command-name
```

Most of the above are actually calling a command!

### .content

When a command isn't specified, the assumed command is `content`. `content` can be used to specify different file types for audio and images:

```
audio.content	song.wav
image.content	image.svg
```

`content` is used to write text to a textbox, adjust character images, and so on, but again- since it's assumed as the default command, you never _have_ to specify it.

### .style

The "style" command adjusts CSS for an object. The following would start a character off the left side of the screen:

```
object.style	left:-100%;
```

`time` is a special type of style only usable through `object.style`. This command would move the element to the center of the screen over the course of 1 second:

```
object.style	time:1s;left:0%;
```

You can use any CSS styles you want! In order to animate a style though, you'll have to have set it previously. Just add "time:Xs" in order to have it animate in a way that Showpony can pause effectively!

You can also run this on `engine` to affect the content as a whole!

**Note: I don't recommend using `left` for most character movement. Instead, read the advice under Tips and Tricks: Preventing Jerky Movement. Using `left` will allow any other transformations to work, so for the sake of compatible code, I'm using it in the example here.**

### .class

Set a class on an element.

```
object.class	className
```

You can also run this on `engine`!

### .remove

Remove an object. This can helpful if you have a lot of objects in your file, and you want to begin removing them because things are slowing down. You probably don't have to worry about this in general, though.

```
object.remove
```

You can also run this on `engine`! ...because, um, I don't know. Wait, that's a bad idea, don't do it.

### Audio-Unique Commands

Audio has special commands:

```
audio.play
audio.pause
audio.stop
audio.loop
audio.time		0
audio.speed		1
audio.volume	        1
```

### engine.wait

Wait until users click to continue. You can also set an amount of time to wait before automatically proceeding (skippable by clicking).

```
engine.wait
engine.wait	5s
```

### engine.go

```
engine.go	//Go here
		Let's skip this line of text!
		
//Go here
		We're skipping to here!
```

### engine.event

```
engine.event	dancing
```

Runs an event on the Showpony window. You can listen for it using Event Listeners.

### engine.end

```
engine.end
```

Immediately end the file and go to the next one.

### Creating Objects Using Engine Commands

Objects can be automatically created in most cases, but maybe you don't want that or can't do that for a specific object.

In that case, you can use engine commands:

```
engine.audio		music		// Create an audio object named "music"
engine.character	ben		// Create a character object named "ben"
engine.textbox		thoughts	// Create a textbox object named "thoughts"
```

After you create it, you call it normally:
```
music.play
ben		pose-1
thoughts	I wonder if she'll go out with me this time...
```

## Commenting

You can create multiline comments with `/*` and `*/`. These will be parsed out of the file at runtime.

```
/*

		This is great! I can hide this part for now or just add a bunch of info here:
		
		Lalala, comments are great!~

*/
```

You can create singleline comments with `//`. These will remain, because they can be used with `engine.go` to send you to a specific spot!

```
engine.go		//Excited

//Excited
		I am WAY too pumped about this date.
```

## Variables
You can set and adjust variables by stating a variable name and following it up with an = sign, with tabs after the =:

```
variable=	Hello!
```

Then you can call it in a textbox this way:

```
		"[variable]" Bobby greeted Susie cheerfully.
```

You can even nest variables!

```
variable=	[one] and [two]
one=		ONE!
two=		TWO!
		Come on, let's go! [variable] and THREE! and FOUR!
```
			
You can include HTML tags and even commands in variables!

```
response=	YES I DID, AND I'M SOOOO EXCITED!!!!
		Did you know you can use variables for text?
		[response]
		But did you?
		[response]
		I'm not quite sure if you get it...
		[response]
```

```
commonCommand=	character	pose-excited,eyes/excited,mouth/excited
[commonCommand]
```

You can adjust values with operations as well:

```
variable=	1
variable+=	1
variable-=	1
```

## User input
In order to get user input, use any <input> HTML element in your text. When an <input> element is present, the user won't be able to click through to the next section without selecting an option; so if you have an <input type="text"> element, make sure you also have an <input type="submit"> element present too!

In order to state what variable to adjust, set a data-var attribute to your input. When the user adjusts the variables, it will be set to the value present.

```
	What's your name? <input type="text" data-var="name"> <input type="submit" value="Continue">
```
		
If you want to have buttons with different values, you can also use the data-val attribute, which is only relevant for button inputs. Regular value just adjusts the button text, as normal.

```
	Do you like me? <input type="button" data-var="like" data-val="1" value="Yes"> <input type="button" data-var="like" data-val="0" value="No">
```
		
You don't need a continue button if you use button inputs.

Let's say that you want, on clicking an input submit or button, to go to a new position in the text rather than just adjusting a variable. You can use data-go:

```
	Where do you want to go? <input type="button" data-go="//North" value="North"> <input type="button" data-go="//South" value="South">
```

# Tips and Tricks

## Preventing Jerky Movement

When moving characters around, you can use the styles `left`, `top`, and so on. But although this is easy, it isn't performant. Maybe you've tested on mobile or a weaker computer and are seeing "jerky" movement for what seems like it should be simply moving a character across the screen.

I'd recommend you always use `transform:translate(0,0)` instead:

```
// Slower
james.style	time:1s;left:-100%;

// Faster
james.style	times:1s;transform:translate(-100%,0);
```

If you are timing other transformation animations in a way desynced from character movement (like scale, rotation, etc), this might be impossible, but for most cases you should be good. That's one case where you might want to use `left`, `top`, and so on.

## Videos

You can use videos instead of images for characters. If you do, they'll be set to loop and will play at full volume (so if you want silence you'll have to remove the sound from the video).

The most practical use of this is for animated backgrounds:

```
background		rolling-sky.mp4
```

If you pass a file with either an mp4 or webm format, it will be read as a video.

Remember that Showpony supports playing videos outside of the visual novel module, so if you just want to play a video without any VN features, I'd recommend putting the video file in your story folder instead. That way you'll be able to scrub the video, it will progress at the end instead of looping, etc.

## Including Files

1. In settings.php, under `FILE_DATA_GET_MODULE`, set `'ext:php'=>'visualNovel'`
2. Use "php" as your new Visual Novel extension
3. You can now use PHP's include or require statements inside of the file with `<?php require 'general-script.vn'; ?>`

You can even have the setting files hidden with ~, or have them in a separate folder. PHP can still grab them.

This will let you create visual novel files from collections of other visual novel files, like if you want to start every file with the same commands or the same variables.

## Creating Custom Tags

You can create custom tags using variables:

```
slow=		<speed rate="2">
/slow=		</speed>
fast=		<speed rate=".25">
/fast=		</speed>
instant=	<speed rate="0" constant>
/instant=	</speed>
item=		<span style="color:blue;font-weight:bold;">
/item=		</span>
```

And then reuse them later on:

```
  	[slow]Slow text...[/slow]
	[fast]Fast text![/fast]
	[instant]Instant text![/instant]
	You got a [item]fishing rod[/item]!
```

## Leading on Textbox Text

If you try the following:

```
	<span style="font-size:.5em;">This text is small, and it's a long line! It's a lot of whispered text. Whisper whisper whisper whisper whisper whisper whisper whisper whisper!</span>
```

You'll find that the leading on the text (the vertical space between lines) is really large. The solution is simple: use a `<div>` instead:

```
	<div style="font-size:.5em;">This text is small, and it's a long line! It's a lot of whispered text. Whisper whisper whisper whisper whisper whisper whisper whisper whisper!</div>
```

Inline elements (like spans) can't set line-height. Only block-level elements (like divs) can adjust line height. So for different text sizes to have reasonable leading, you'll have to use block-level elements.

Textbox objects are block-level elements, so if you directly adjust the font-size on it you should get the leading you want as well. But this could have undesirable side effects in some cases (depending on what related styles are using `em` sizing values), so I recommend using divs in your code instead.

## Flat-Color Backgrounds

When creating character objects, you don't have to specify images. This can be really useful for creating flat-color backgrounds that can end up being used just as plain backgrounds, or for transitions like fade-ins and fade-outs:

```
fade.class    background
fade.style    background-color:black;z-index:12;opacity:1;

	We'll be fading in after this text...

fade.style    opacity:0;time:1s;
```

You could also use gradients instead.

# Subtitles

Subtitles are recommended so that you can avoid Describo (like explaining audio while it's playing) while also allowing people with trouble hearing or low volume the ability to take in your Visual Novel.

Subtitles are similar to video and audio structure, with some differences.

Phrases that are either numbered or have no info above are based on the general time in the Visual Novel. I don't recommend using these because these are fluid based on the text in your file, and so aren't very trustworthy. But here's how to do it:

```
00:00:00.00 --> 00:01:55.00
Listen to how slowly I can talk.

2
00:02:00.00 --> 00:02:05.00
Shut up, Ben.
```

In the `HH:MM:SS.SS` format, you don't have to state `HH`.

I DO recommend though tying times to specific audio files. You can do that like this:

```
explosion
00:00:00.00 --> 00:00:10.00
(explosion and screaming)

destruction
00:00:00.00 --> 00:00:15.00
(buildings crumbling)
```

The title is the name of the object. So if your object is called `explosion`, it's explosion here; if it's `destruction`, it's `destruction` here.