# What is Showpony?

A collection of easy-to-use engines for various media, ranging from infinite-scroll novels to visual novel engines!

Currently I have the following working in a usable capacity:

* Visual Novel/Kinetic Novels
* Interactive Fiction

I plan to add more media!

## How hard is it to add to my webpage?

You only need 1 line of JS to add an engine to your existing page. If you want a visual kovel to load on clicking a block, you could use:

	<div onclick="new VisualNovel(this,['part-1','part-2','part-3'],'loadingClass');">
		<h1>Click to play!</h1>
	</div>

The setup is the same for every medium!

## How hard is the syntax? I don't want to learn a new language.

Go into the stories folder and check out some of the ".txt" files. It's already very simple, but I'm working on simplifying it further too! Email me at joshuapowlison@gmail.com if you run into any problems or have any requests/suggestions for improvement.

## Can I use this on my website right now!

Absolutely, although it's still very much a WIP, so be careful!

## Can I sell or make money off works made with Showpony!

Absolutely! But you can't sell the code itself.

## How heavy is Showpony?

Our Visual Novel/Kinetic Novel engine is less than 30 KB uncompressed. For all of the engines (stil uncompressed) you're currently look at less than 40 KB. Obviously, that will go up as I add features, but it will likely also go down as I condense and improve the code too.

## Is it performant?

This doesn't just depend on the code but on the resources you use, but my bad laptop's handled it pretty well. Try it for your projects and see!

## Will it support older browsers?

It's made to work with newer browsers. But most people into new media are also into new browsers, so you should be fine. If you find something that isn't working cross-browser email me at joshuapowlison@gmail.com

## Do I need PHP, MySQL, Python, etc on my website for this to work?

Nope! It's all pure HTML, JS, and CSS (with some AJAX, if you want to count that as separate from JS).

## I want to make desktop applications with Showpony. Can I do that?

If you use something like php-desktop you can, although I don't have an official implementation out right now.

## I ran into a bug. I'm not a programmer. I am sad. Can you help?

Email me at joshuapowlison@gmail.com

## Showpony's missing a feature I can't live without and now I am dead.

Don't be dead! Email me at joshuapowlison@gmail.com

## NOTES ##

Included resources are either public domain or have a license file included. The license of this software does not extend to the included assets.
