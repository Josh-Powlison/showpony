/*/////////////////////
/////// README ////////
///////////////////////

// Compiler
https://mbebenita.github.io/WasmExplorer/
emscripten bloats it a lot; I may be using it wrong, but its export for simple tasks was 200KB+. That's ridiculous.

// Memory Limit
128,000 bytes (128 KB)

We want to stay within one core's L2 cache on low-end phone processors.
This is our benchmark: http://phonedb.net/index.php?m=processor&id=657&c=qualcomm_snapdragon_425_msm8917

Don't bother trying to control JS, but we will control WASM's consumption this way.

Remember that WASM only supports 32-bit and 64-bit ints and floats, so even if we use smaller data types here they'll probably (need to confirm) be converted to 32 and 64-bit types anyway.

// Memory Allocations

// BYTES	// ALLOCATED FOR			// RESULTS IN			// PURPOSE
112,000		UTF-8 Chars					28,000 4-byte chars		Text file storage
 16,000		INTS, FLOATS, POINTERS		 2,000 8-byte vals		Pointing to strings, general use

// Helpful Resources
Accessing linear memory: https://stackoverflow.com/questions/46748572/how-to-access-webassembly-linear-memory-from-c-c#46748966

*/

///////////////////////
////// VARIABLES //////
///////////////////////

// STRUCTS
struct Object{
	int type;			// Object type
	int active;			// If it's been removed
	char values[];		// The settings for the object such as style, class, content
};

// VARS

const int SIZE = 28000;

// change to an int later to cover more characters?
char data[SIZE] = {'\0'};

int objPosition = 0;

// ARRAYS
int components[50];		// Where object names start in the data string/array. We just loop through this first because it's faster than iterating objects, and this will return a pointer to the object we actually want.
struct Object list[50];			// A list of all structs in use

// int var[50];					// Pointers to all our variable names
// int varVals[50];				// Pointers to all our variable values

// CONSTANTS
const int TYPE_EMPTY	= 0;
const int TYPE_ENGINE	= 1;
const int TYPE_SET		= 2;
const int TYPE_GET		= 3;
const int TYPE_COMMENT	= 4;
const int TYPE_TEXTBOX	= 5;
const int TYPE_IMAGE	= 6;
const int TYPE_AUDIO	= 7;

const int DEBUG_INT		= 0;
const int DEBUG_ARRAY	= 1;
const int DEBUG_STRING	= 2;

// String Positions
const int CALL_ENGINE = 1;
const int CALL_TEXTBOX = 8;
const int CALL_IMAGE = 16;
const int CALL_AUDIO = 22;
const int CALL_CONTENT = 28;
const int CALL_REMOVE = 36;
const int FILE_START = 50;

///////////////////////
//// JS FUNCTIONS /////
///////////////////////

void jsLogString(char *position, int length);
void jsLogInt(int input);

///////////////////////
///// C FUNCTIONS /////
///////////////////////

// main has to be called manually when using WebAssembly
int main() {
	return 0;
}

char* getData(int type){
	return &data[0];
}

int getLength(){
	return SIZE;
}

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


char test;

int isDelimiter(char a){
	switch(a){
		case '\t':
		case '\r':
		case '\n':
		case '.':
		case '=':
		case '<':
		case '>':
		case '-':
		case '+':
		case '!':
		case '\0':
			// test = a;
			// jsLogString(&test,1);
			return 1;
			break;
		default:
			return 0;
			break;
	}
}

// Gets two positions in the text file and sees if the strings from there are the same
int compareStrings(int a, int b){
	for(int i = 0; i < 50; i++){
		// If they're both delimiters, return true
		if(isDelimiter(data[a + i]) && isDelimiter(data[b + i])) return 1;
		
		// If they're not equal, return false
		if(data[a + i] != data[b + i]) return 0;
		
		// Otherwise, keep looping
	}
}

void readFile(){
	// Chars are smaller, so we used them in this case
	int componentPosition	= CALL_TEXTBOX;
	int commandPosition		= CALL_CONTENT;
	int parameterPosition	= 0;
	int type				= TYPE_EMPTY;
	
	int commenting = 0;
	
	int currentLine = 0;
	
	int logged = 0;
	
	int spaced = 0;
	
	// Loop through the file. w00t!
	for(int i = FILE_START; i < SIZE; i++){
		// jsLogInt(i);
		
		// Break on null char
		if(data[i] == '\0') break;
		
		/*
		This will check if we're on a new line or not.
		
		Windows:	\r\n
		Mac (old):	\r
		Unix:		\n
		
		If we're on \n but the previous char is \r, we don't consider ourselves as being on a new line.
		
		First line is not 0; first line is 1, like for a text editor.
		*/
		if(data[i] == '\n' || data[i] == '\r'){
			if(data[i] == '\n' && data[i - 1] == '\r') continue;
			currentLine++;
		}
		
		/// COMMENTS ///
		// Check for comment
		/*
			0: No comment
			1: Single-line comment
			2: Multi-line comment
		*/
		
		// If we aren't already commenting, we can start single or multiline commenting
		if(commenting == 0){
			// Single-line comments
			if(data[i] == '/' && data[i + 1] == '/'){
				commenting = 1;
				continue;
			}
			
			// Check for multiline comment start
			if(data[i] == '/'
				&& data[i + 1] == '*'
			){
				commenting = 2;
				i++;
				continue;
			}
		}
		
		// If we're in the middle of a multiline comment
		if(commenting == 2){
			// Multiline comment end
			if(data[i] == '*'
				&& i + 1 < SIZE
				&& data[i + 1] == '/'
			){
				commenting = 0;
				i++;
			}
			
			// Continue regardless
			continue;
		}
		
		// Line break, reset
		if(data[i] == '\n' || data[i] == '\r'){
			
			// Run commands if not commenting
			if(commenting == 0){
				/// TODO: see if items are original and if so, add them. Otherwise, refer to them and adjust any values that need to be adjusted.
				
				// loop through pointers
				// see how far one matches
				// If it doesn't completely match, move on
				int match = 0;
				
				// Some commands make new components, in which case the line type is really of the created component. Check type.
				if(compareStrings(componentPosition,CALL_ENGINE)){
					// Creating an image
					if(compareStrings(commandPosition + 1,CALL_IMAGE)){
						type = TYPE_IMAGE;
						componentPosition = parameterPosition;
						parameterPosition = 0;
					}
					
					// Creating audio
					else if(compareStrings(commandPosition + 1,CALL_AUDIO)){
						type = TYPE_AUDIO;
						componentPosition = parameterPosition;
						parameterPosition = 0;
					}
					
					// Creating a textbox
					else if(compareStrings(commandPosition + 1,CALL_TEXTBOX)){
						type = TYPE_TEXTBOX;
						componentPosition = parameterPosition;
						parameterPosition = 0;
					}
				}
				
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
				
				// if(/\.mp3/i.test(parameter)) type = 'audio';
				}*/
				
				int id = 0;
				// Look for a match from other pointers
				for(id = 0; id < objPosition; id++){
					// jsLogInt(components[id]);
					// jsLogInt(componentPosition);
					
					if(compareStrings(components[id], componentPosition)){
						// jsLogString(&data[components[objPosition]],1);
						match = 1;
						break;
					}
				}
				
				if(match){
					// Show the matches
					// jsLogString(&data[components[id]],3);
					// jsLogString(&data[componentPosition],3);
					
					// Update the struct
					// if(compareStrings(commandPosition + 1, REMOVE_CALL + 1)) list[id].active = 0;
				}
				
				// If no match, add it
				if(!match){
					jsLogString(&data[componentPosition],7);
					jsLogInt(currentLine);
					
					// Update the current struct
					list[objPosition].active = 1;
					
					/// SET TYPE
					// Engine
					if(compareStrings(componentPosition,CALL_ENGINE)) list[objPosition].type = TYPE_ENGINE;
					// Textbox
					else if(compareStrings(componentPosition,CALL_TEXTBOX)) list[objPosition].type = TYPE_TEXTBOX;
					
					// Other call
					else list[objPosition].type = TYPE_IMAGE;
					
					components[objPosition] = componentPosition;
					// jsLogInt(list[objPosition].type);
					
					// Move the position
					objPosition++;
				}
			}
			
			// Reset single-line commenting
			commenting = 0;
			
			// Reset settings for the new line
			componentPosition	= CALL_TEXTBOX;
			commandPosition		= CALL_CONTENT;
			parameterPosition	= 0;
			type				= TYPE_EMPTY;
			
			spaced				= 0;
			continue;
		}
		
		// Continue if we're in the middle of a comment
		if(commenting == 1) continue;
		
		// Continue nonstop if we're reading a parameter
		if(parameterPosition) continue;
		
		// Skip over tabs
		if(data[i] == '\t'){
			spaced = 1;
			continue;
		}
		
		// If we've hit tabs, we're at the parameter now.
		if(spaced){
			parameterPosition = i;
			continue;
		}
		
		// If we're on a delimiter, and it's not a tab (tabs were already checked), this must be a command
		if(isDelimiter(data[i])) commandPosition = i;
		// If we're not on a delimiter, but are on defaults for componentPosition and commandPosition, we must be at the beginning of a component
		else if(componentPosition == CALL_TEXTBOX && commandPosition == CALL_CONTENT){
			componentPosition = i;
		}
	}
		
	// We've now got pointers for the beginning of each component, command, and parameter. w00t!
	
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
	/*
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
*/
		
		/// READ STUFF ///
		
		/*
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
}

/*
	 0: No match
	 N: Array position where match ends
*/
/*int compareStrings(char a[], char b[], int aMax, int bMax){
	int i = 0;
	
	while(i < 30){
		// If we're maxed
		if(i > aMax || i > bMax) break;
		
		// If they don't match
		if(a[i] != b[i]) break;
		
		i++;
	}
	
	return i;
}*/