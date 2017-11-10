# What is Showpony?

A collection of easy-to-use engines for various media, ranging from infinite-scroll novels to visual novel engines!

Currently I have the following working in a usable capacity:

* Visual Novel/Kinetic Novels
* Interactive Fiction

I plan to add more media!

## How hard is it to add to my webpage?

You only need 1 line of JS to add an engine to your existing page. If you want it to load on click on a div, you could use:

	<div onclick="new VisualNovel(this,['part-1','part-2','part-3'],'loadingClass');">
		<h1>Click to play!</h1>
	</div>

The setup is the same for every medium!

## Can I use this on my website right now!

Absolutely, although it's still very much a WIP, so be careful!

## Can I sell or make money off works made with Showpony!

Absolutely! But you can't sell the code itself.

## How heavy is Showpony?

Ponies are pretty light. Our Visual Novel/Kinetic Novel engine is less than 30 KB- uncompressed. For all of the engines (stil uncompressed) you're currently look at less than 40 KB. Obviously, that will go up as we add features, but it's already pretty feature-packed

## Do I need PHP, MySQL, Python, etc on my website for this to work?

Nope! It's all pure HTML, JS, and CSS (with some AJAX, if you want to count that as separate from JS).

## I want to make desktop applications with Showpony. Can I do that?

If you use something like php-desktop you can, although I don't have an official implementation out right now.

## I ran into a bug. I'm not a programmer. I am sad. Can you help?

Email me at joshuapowlison@gmail.com
