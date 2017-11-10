DOCUMENTATION

---ADDING AN ENGINE TO YOUR PAGE---

You only need 1 line of code to add an engine to your existing page:

	new Form(windowElement,['part-1','part-2','part-3'],loadingClass);

You can put this in-between media; 


---KINETIC NOVEL---

---BASICS---

Write text on a line for it to go to the main textbox.

MSCE (Missy) Formatting
	{M,S,C,E} is an object for text formatting. MSCE stands for "size Multiplier", "normal Speed", "Color", and "Effects".

	{2,.1,blue,shake}
	-Multiplier: the text will be 2x bigger than normal
	-Speed: a regular letter will take .1 seconds to show. (normal is .03)
	-Color: the text will be blue
	-Effect: the text will be shaky
	
	Use a blank object like {} to restore defaults to the next text, or to reset defaults for just a few you can use {initial,,,initial}

[placeholder]
	If you want to write out variables inside of the text, you can write the variable name surrounded with [].
	
	TIPS:
	-You can use [placeholder]s on any lines- including @GO, @CH, @AU, @ST, @DS, and even @IF! This can let you do some pretty cool things.
	-ANYTHING can go inside of placeholders- even entire functions!
	-Store commonly used text effects inside of variables. Maybe you have a structure for character name display in the textbox; if so, save those blocks of text in variables so they're easy to edit across the board!

---FUNCTIONS---

Text, any type of text not beginning with @
	Add text to the main textbox. Will automatically wait for user input at the end before continuing, and will clear the textbox.

@CH name(image) position
	"CHaracter": Create or alter a character with this function. If you wanted to create Susie and start her with a sad image, you'd write out Susie(sad).
	You can add a hash to a name if you have multiple characters with the same image folder. For example, if multiple characters use the "schoolgirl" folder for all of their images, you can use "schoolgirl#Beth" to separate Beth from "schoolgirl#Nancy".

@BG name(image) z-index
	"BackGround": Make or adjust a background. Z-index is where it is on the page.

@WT seconds
	"WaiT": Wait until seconds run out to automatically continue. If you don't have a seconds value (leave after @WT blank), you'll wait until user input. Alternatively, @WT 0 will allow transitions to play, while keeping things moving.
	
@AU filename play loop pause stop
	"AUdio": Add an audio file. It won't automatically play, but it will preload, so you can load a file early and lay it later. Play, loop, pause, and stop are optional values that make the audio do that thing.

@TB name text
	"TextBox": Make or adjust a textbox. This is more advanced than the default way of displaying text and allows you to do several more things: 1) have multiple textboxes, 2) use a custom @WT tag afterwards to determine how the text waits, and 3) append text to a textbox instead of replacing it, which can allow you to have animations happen in the middle of text displaying, wait for user input before showing all of the text, and more.
	
@ST name{CSS styles}
	"STyles": Apply any CSS styles to a character or background with the set name. You can also call the vn's window by using "window" as the name.
	
	TIPS:
	-You can apply CSS filters to the window for easy fade in-out effects, as well as inverting colors, making the scene sepia or grayscale, blurring out the scene, and more!
	
@GO place
	"GO": Go to the place with the label "place".
	
@DS variable value
	"Data Set": Set "variable" to "value"
	
@IF variable
val1	<val2	>val3	<=val4	>=val5	!val6
go1		go2		go3		go4		go5		go6
	"IF": If variable's value lines up with one of the ones stated below, go to the corresponding location. Variable can be anything. (You can only check <, >, <=, and >= with numbers. ! works with anything.)
	You can add a failsafe easily by having ! at the end, with anything the variable will never be after it. This way you'll always go somewhere from the text.
	
@IB
go1		text1
go2		text2
go3		text3
	"Input Button": Create buttons with text "textx" that go to the place set by "gox".
	
#Commenting!
	Any line beginning with a "#" is a comment.