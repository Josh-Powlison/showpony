/*

Best bae compiler: https://mbebenita.github.io/WasmExplorer/

emscripten bloats it a lot, and I don't think I need it from what I can tell

*/

/*

TARGET:

We want this to work well on low-tier phones.
I'm using the Samsung Galaxy J3 Emerge as the target.
https://www.gsmarena.com/samsung_galaxy_j3_emerge-8486.php


L2 Cache:
512 KB shared between 4 cores

So 1 core takes 128 kilobytes
Or 128,000 bytes

So that's our limit with C
I can't control JS very well, but that can be our C limit. If the 3 other cores are used for other things, we should still be getting at least 1 of those cores for the webpage.

--- LIMIT ---
Our C limit is based on the Samsung Galaxy J3 Emerge, a lower-end smart phone (and my phone).

Processor Info: http://phonedb.net/index.php?m=processor&id=657&c=qualcomm_snapdragon_425_msm8917

It shares 512 Kilobytes across its 4 cores, so each cores has 128 Kilobytes.

char	1 byte
int		2 or 4 bytes
short	2 bytes
long	8 bytes

UTF-8 Chars use 4 bytes, so we'll need to support 4-byte chars. That could be int, or we may have to use long if an int could be 2 bytes.

WASM supports:
32-bit ints and floats
64-bit ints and floats

And that's it. So in order to be resource-efficient, we'll have to be smarter about our allocations. Claiming smaller chunks in C won't do anything; combining data can.

Just use a short if want 2 bytes, to keep us safe from greater data usage.

--- FAST FACTS ---
Limit:				128 Kilobytes / 128,000 Bytes

--- MAX VALUES ---
Component max:		20 chars
Command max:		8 chars
Parameter max:		1000 chars		32-bit 8 bytes

*/

#define true 1
#define false 0

// JavaScript functions we'll call
// void draw(float x, float y, float w, float h);
// void clear();

/*

HELPFUL LINKS:
https://stackoverflow.com/questions/46748572/how-to-access-webassembly-linear-memory-from-c-c#46748966

*/

//////////// DECLARE VARIABLES ////////////

//					NUM		* KB
const int SIZE =	100		* 1024;


//	change to an int later to cover more characters?

char data[SIZE] = {'\0'};// = { 'a','p','p','l','e',' ','j','a','c','k' };
// int data[SIZE] = { 'こ','ん','に','ち','は',' ','~','!','_','=' };


int multilineComment = 0;
int currentLine = 0;

/*

/// TODO: get rid of component[], command[], and parameter[] strings; instead, store start positions in data[].

Only need to store start position; the end position is clear as you move through the line.
To see if an object by the same name exists, go through the pointers, read the strings, and see if they match up (until the delimiters, periods/spaces/math).

*/

int start	= 0;		// Position in data[]

struct Object{
	int type;	// Object type
	int active;		// If it's been removed
	char values[];		// The settings for the object such as style, class, content
};

char* components[50] = {0};		// Where object names start in the data string/array. We just loop through this first because it's faster than iterating objects, and this will return a pointer to the object we actually want.
struct Object list[50];			// A list of all structs in use

int objPosition = 0;

// The data we'll be reading from and writing to
// char component[30]		= {'\0'};
// char command[30]		= {'\0'};
// char parameter[1000]	= {'\0'};

///// TYPES /////
const int EMPTY			= 0;
const int ENGINE		= 1;
const int SET			= 2;
const int GET			= 3;
const int COMMENT		= 4;
const int TEXTBOX		= 5;
const int IMAGE			= 6;
const int AUDIO			= 7;

/*
こんにちは
*/

char* getData(int type){
	return &data[0];
}

int getLength(){
	return SIZE;
}

void add(char value){
	data[0] = value;
}

// Return chars before a passed string, or 0 if none found
int returnString(){
	int count = 0;
	
	for(int i = 0; i < SIZE; i ++){
		if(data[i] == ' ') return count;
		count++;
	}
	return 0;
}

float getMaxChars(float textboxWidth, float letterWidth) {
	return (textboxWidth / letterWidth);
}
/*
float getLineHeight(float minHeight){
	var height = null;
				
	// If this is shorter than the total length that fits on one line, just get that height
	if(lines[i].length <= oneLineMaxChars){
		return minHeight;
	// Otherwise, calculate the line's height
	} else {
		contentSizing.innerText = lines[i];
		var height = contentSizing.clientHeight;
		
		// Change the max length a line can be befoe spilling over; this can save us processing power
		if(height <= minHeight) oneLineMaxChars = lines[i].length;
	}
	
}*/
/*
const NULL			= 0;
const SET			= 1;
const COMPARISON	= 2;

const EQUALS		= 0;
const PLUS			= 1;
const MINUS			= 2;

int getType(int command){
	// Operations
	if(
		command == EQUALS
		|| command == PLUS
		|| command == MINUS
	){
		return SET;
	}
	
	if(
		command == "=="
		|| command == '<'
		|| command == '>'
		|| command == "<="
		|| command == ">="
		|| command == '!'
	){
		return COMPARISON;
	}
	
	return NULL;
}*/

/*
	Can we trust heightChars as an array, or only for the first one?
	
	If only for the first one, we need to remove the arrays.
	
	It will get later values, and in checking those rather than calculating we'll get stuff being on one line but calculated as more lines.
	
	Maybe we need > max instead? Rather than < min? But that could still be wrong.
*/

/*
	USE WASM TO ESTIMATE PROPER LINE HEIGHTS, ETC
	
	This should allow us to get reasonable times when updating this data. (probably)
	
	But take it a step at a time.
*/
/*
// Point to a string that seems to match this one
char* getLikePointer(char *pointer){
	// Run through all components and see what matches
	for(int i = 0; i < 50; i++){
		if(components[i] == 0) break;
		
		for(int j = 0; j < 30; j++){
			if((pointer + i) == (components[i] + i))
		}
	}
	
	return;
}*/

char textbox[] = "textbox";
char content[] = ".content";

char* readFile(){
	// Chars are smaller, so we used them in this case
	char* componentPosition	= 0;
	char* commandPosition	= 0;
	char* parameterPosition	= 0;
	
	int commenting = 0;
	
	char* match = 0;
	
	int type = EMPTY;
	
	int i;
	
	int spaced = 0;
	
	// Loop through the file. w00t!
	for(i = 0; i < SIZE; i++){
		// Break on null char
		if(data[i] == '\0') break;
		
		// Line break, reset
		if(data[i] == '\n' || data[i] == '\r'){
			// Reset single-line commenting
			if(commenting == 1) commenting = 0;
			
			/// TODO: see if items are original and if so, add them. Otherwise, refer to them and adjust any values that need to be adjusted.
			
			componentPosition	= 0;
			commandPosition		= 0;
			parameterPosition	= 0;
			continue;
		}
		
		/// COMMENTS ///
		// Check for comment
		/*
			0: No comment
			1: Single-line comment
			2: Multi-line comment
		*/
		
		// Continue if we're in the middle of a comment
		if(commenting == 1) continue;
		
		// Single-line comments
		if(data[i] == '/' && data[i + 1] == '/'){
			commenting = 1;
			continue;
		}
		
		// Check for multiline comment start
		if(data[i] == '/'
			&& SIZE < data + 1
			&& data[i + 1] == '*'
		){
			commenting = 2;
			i++;
			continue;
		}
		
		// Multiline comment end
		if(data[i] == '*'
			&& SIZE < data + 1
			&& data[i + 1] == '/'
		){
			commenting = 0;
			i++;
			continue;
		}
		
		// Skip in the middle of multiline commenting
		if(commenting == 2) continue;
		
		// Continue nonstop if we're reading a parameter
		if(parameterPosition) continue;
		
		// Skip over tabs
		if(data[i] == '\t'){
			// Set component and command to default strings
			if(componentPosition == 0)	componentPosition	= &textbox[0];
			if(commandPosition == 0)	commandPosition		= &content[0];
			
			spaced = 1;
			continue;
		}
		
		// If we've hit tabs, we're at the parameter now.
		if(spaced){
			parameterPosition = &data[i];
			continue;
		}
		
		// If no command position is set, we're on the component. Check it.
		if(commandPosition == 0){
			switch(data[i]){
				// Commands
				case '.':
				case '=':
				case '+':
				case '-':
				case '>':
				case '<':
				case '!':
					commandPosition = &data[i];
					if(componentPosition == 0) componentPosition = &textbox[0];
					break;
				default:
					break;
			}
		}
		
		// If no component position is set, set it
		if(componentPosition == 0){
			componentPosition = &data[i];
			continue;
		}
		
		// We've now got pointers for the beginning of each component, command, and parameter. w00t!
		
		/*
		
		// Otherwise, read it

		// var height = instance.exports.getLineHeight();
		/*
		var height = null;

		// If this is shorter than the total length that fits on one line, just get that height
		if(lines[i].length <= oneLineMaxChars){
			height = minHeight;
		// Otherwise, calculate the line's height
		} else {
			contentSizing.innerText = lines[i];
			height = contentSizing.clientHeight;
			
			// Change the max length a line can be befoe spilling over; this can save us processing power
			if(height <= minHeight) oneLineMaxChars = lines[i].length;
		}*/
		
		// The styling of the highlight problem
		int style		= -1;

		// If a line is not empty
		/*if(!lineEmpty()){
			
			// Other lines
			}else{
				// currentLine++;
				
				// Current Line
				if(currentLine === E.line){
					style = 'background-color:rgba(0,255,0,.25);z-index:-1;';
				}
				
				/// ERROR CHECKING ///
				
				// Check if using spaces instead of tabs for separate command and parameter
				if(/^(?!\/{2,})[^\t]* /.test(lines[i])){
					style = 'background-color:rgba(255,0,0,.25);z-index:-1;';
				}
			}*/
			
			/// READ STUFF ///
			
			/*
			// Comments
			if(commenting > 0){
				type = COMMENT;
			// If empty
			}else if(component[0] == '\0' && command[0] == '\0' && parameter[0] == '\0'){
				type = EMPTY;
			}
			// Set
			else  if(command[0] == '='
				|| command[0] == '+'
				|| command[0] == '-'
			){
				type = SET;
			}
			// Get
			else if(command[0] == '<'
				|| command[0] == '>'
				|| command[0] == '!'
			){
				type = GET;
			}
			// If no component was set, default to textbox
			else{
				
				// if(objectTypes[component]) type = objectTypes[component];
				// else{
					// type = 'character';
					// if(/\.mp3/i.test(parameter)) type = 'audio';
				
				if(component[0] == '\0'){
					type = TEXTBOX;
				} else {
					type = IMAGE;
				}
				
				if(command[0] == '\0') {
					
				}
				
				char STR_CMP_ENGINE[]		= "engine";
				char STR_CMD_TEXTBOX[]		= ".textbox";
				char STR_CMD_AUDIO[]		= ".audio";
				char STR_CMD_CHARACTER[]	= ".character";
				
				// See if the value is "engine"
				if(componentPosition == 5
					&& compareStrings(component, STR_CMP_ENGINE, componentPosition, 5) == 6
				){
					type = ENGINE;
				}
				
				// See if the value is "textbox"
				// if(componentPosition == 6
					// && compareStrings(component, STR_TEXTBOX, componentPosition, 6)
				// ){
					// type = TEXTBOX;
				// }
				
				// If it's an engine, read the command
				if(type == ENGINE){
					if(commandPosition == 5
						&& compareStrings(command, STR_CMD_AUDIO, commandPosition, 5) == 6
					){
						type = AUDIO;
					} else if(commandPosition == 7
						&& compareStrings(command, STR_CMD_TEXTBOX, commandPosition, 7) == 8
					){
						type = TEXTBOX;
					} else if(commandPosition == 9
						&& compareStrings(command, STR_CMD_CHARACTER, commandPosition, 9) == 10
					){
						type = IMAGE;
					}
					
					// If a new element was created
					if(type != ENGINE){
						command[0] = '\0';
						// component = parameter;
						
						// If the object already exists, show a warning
						// if(objectTypes[component]){
							// style = 'background-color:rgba(255,0,0,.25);z-index:-1;';
						// }
					}
				}*/
				
				/*
				// Determine type
				
					if(component === 'textbox') type = 'textbox';
					else if(component === 'engine') type = 'engine';
				}
				*/
				/*
				// Creating a new element using the engine command
				
				// Keep track of existing objects
				objectTypes[component] = type;
			}
			
			// Add style
			if(style){
				var highlight = document.createElement('div');
				highlight.className = 'highlight';
				highlight.style.top = yPos + 'px';
				highlight.style.height = height + 'px';
				highlight.dataset.line = currentLine + '|' + i;
				highlight.style.cssText += style;
				highlightFragment.appendChild(highlight);
			}
		}
		
		/// AUTOCOMPLETE ///
		if(type == IMAGE
			|| 0
		){
			
		}*/
		// Get current line
		/*var contentToNow = content.value.substr(0, content.selectionEnd);
		if(
			content.selectionStart === content.selectionEnd
			&& content.selectionStart
			&& i === (contentToNow.match(/\n/g) || '').length
		){
			var helpText = '';
			var match = /[^\n]*$/.exec(contentToNow)[0];
			
			if(match !== ''){
				// console.log('current line!', match);
				
				// See if there's something for us to autocomplete
				var keys = Object.keys(objectTypes).sort();
				for(var j = 0; j < keys.length; j++){
					// console.log('COMPARE',match,keys[j],new RegExp('^' + match));
					
					// If this key exists, don't bother passing autocomplete text
					if(match === keys[j]){
						helpText = '';
						break;
					}
					
					// See if it matches
					if(new RegExp('^' + match).test(keys[j])){
						if(helpText !== '' && helpText.length > keys[j]) continue;
						helpText = keys[j];
					}
				}
			}
			
			var autocomplete = E.window.document.getElementById('content-autocomplete');
			// console.log('SHOW',helpText);
			if(helpText === ''){
				autocomplete.style.visibility = 'hidden';
			}else{
				autocomplete.style.visibility = 'visible';
				autocomplete.innerHTML = helpText;
				autocomplete.style.top = yPos + 'px';
			}
		}*/
		
		/*
		/// LINE INFO ///
		if(data.children.length <= i){
			var lineData = document.createElement('p');
			lineData.innerHTML = i + 1;
			// dataFragment.appendChild(lineData);
			data.appendChild(lineData);
		}
		
		var child = data.children[i];
		// Change height if needed
		if(child.style.height !== height + 'px'){
			child.style.height = height + 'px';
		}
		
		if(child.className !== type) child.className = type;
		
		yPos += height;*/
		// }
	}
}

/*
	 0: No match
	 N: Array position where match ends
*/
int compareStrings(char a[], char b[], int aMax, int bMax){
	int i = 0;
	
	while(i < 30){
		// If we're maxed
		if(i > aMax || i > bMax) break;
		
		// If they don't match
		if(a[i] != b[i]) break;
		
		i++;
	}
	
	return i;
}

// main has to be called manually when using WebAssembly
int main() {
	return 0;
}