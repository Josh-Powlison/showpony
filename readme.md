# What is Showpony?

An easy-to-use engine for telling stories in any medium and across any media!

# What are some of its awesome features?

* Fullscreen: on any device, for any medium!
* Built-in easy archives: go to the menu and just click and drag across the screen to go to any part quickly!
* Mix media- video, comics, songs, books, visual novels, and more can all be viewed in a streamlined experience!

# Can you show me Showpony in action?

[Game Plan! (Webmanga)](http://gameplanmanga.com/)

If you use Showpony on your site too, let me know and I might link to it from here!

# What media can I work in with Showpony?

Showpony has been reasonably tested with:

* Comics

Although it also supports:

* Visual Novels
* Kinetic Novels
* Interactive Fiction
* Video
* Audio
* Straight HTML files (for more flexibility)

I also plan to add support for:

* Screenplays
* Stageplays
* Videogames (will likely be limited)

## How hard is it to add to my webpage?

Don't you mean how EASY *wink* It's the same for every medium. If you have PHP, it's as easy as this line of code:

	<?php include ("showpony/showpony-classes.php"); easyShowpony("path-to-files"); ?>

Just make sure your showpony folder is accessible from the webpage, and you should be good to go!
	
Most webhosts will support php no problem-o; if you name your file "yourfile.php" and upload it to the server with the above code in it, things should work right away! It requires PHP 5.2 or greater, but you should be more than good.

But Showpony doesn't require PHP to run, and you can create Showpony objects with raw JavaScript easily as well:

	//Create a Showpony engine
	var engine=new Showpony({
		"window":document.getElementById("showpony");
		,"parts":['0001.jpg','0002.png','0003.kn','0004.mp3']
		,"path":"story-parts/"
		,"loadingClass":"loading"
		,"scrubLoad":false
	});
	
The setup is the same for every medium, and you can have as many Showpony objects running at a time as you want!

## How hard is the syntax for Interactive Fiction and/or Visual Novels? I don't want to learn a new language.

Go into the stories folder and check out some of the ".txt" files. It's already very simple, but I'm working on simplifying it further too! Email me at joshuapowlison@gmail.com if you run into any problems or have any requests/suggestions for improvement.

## Can I use this on my website right now!

Absolutely, although it's still really in the works, so be careful and test thoroughly! Email me if you run into any problems.

## Can I sell or make money off works made with Showpony?

Absolutely! But you can't sell the code itself.

## How heavy is Showpony?

Uncompressed it's less than 200 KB. BUT not counting the license and fonts I added in, it's less than 45 KB. You can whittle it down quite a bit from there still! Compressed the core engine is less than 25 KB.

This will obviously go up as I add features, but it will also go down as I make it more performant. So it'll probably stay around that amount (until/unless I add more media support).

## Is it performant?

This doesn't just depend on the code but on the resources you use, but my bad laptop's handled it pretty well. Try it for your projects and see!

## How's browser support?

It's made to work with newer browsers, and I can test with the latest versions of Chrome, Firefox, Edge, and Chrome Mobile. Test it thoroughly for your own projects, and let me know if you run into any errors!

I do my best to guarantee it works in Chrome, Firefox, and Chrome mobile. I do not guarantee or attempt to support any versions of IE and try to support the newest versions of Edge. Some features in use may be officially up-and-coming in Edge but not commonly available in Edge.

## Do I need PHP, MySQL, Python, etc on my website for this to work?

Nope! Some PHP can be used to make using it easier (you can quickly grab all the files with one line of code) but you can use Showpony with no backend programming on your part!

## I want to make desktop applications with Showpony. Can I do that?

If you use something like php-desktop you can, although I don't have an official implementation out right now. Also php-desktop is Windows-only.

If you have any ideas for implementations or want to fork one, let me know!

## I ran into a bug. I'm not a programmer. I am sad. Can you help?

Email me at joshuapowlison@gmail.com

## Showpony's missing a feature I can't live without and now I am dead.

Don't be dead! Email me at joshuapowlison@gmail.com

## What are Showpony's dependencies?

Showpony has no dependencies!- not even jQuery!

## How can I support Showpony's development?

A few ways, no obligation:

* State on your Showpony-using site that it's powered by Showpony and have a link come back here!
* Tell others about Showpony
* Test Showpony out and send me bug reports by email (joshuapowlison@gmail.com) or on Twitter (@joshpowlison)
* Get involved as a programmer!
* Send me money and let me know it's for Showpony, and I'll try to put more hours towards it (since I can't make any promises, view this as a donation, not as payment)! https://www.paypal.me/joshpowlison

## NOTES ##

Included resources are either public domain or have a license file included. The license of this software does not extend to the included assets.
