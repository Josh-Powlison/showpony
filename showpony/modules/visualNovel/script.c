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

int var[50];					// Pointers to all our variable names
int varPosition = 0;
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
void jsLineData(int input);
void jsCreateLine(int currentLine,int type,char *position);

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
	// We don't have to reset all the memory; we just have to reset our tracking
	objPosition = 0;
	varPosition = 0;
	
	// Chars are smaller, so we used them in this case
	int componentPosition	= CALL_TEXTBOX;
	int commandPosition		= CALL_CONTENT;
	int parameterPosition	= 0;
	int type				= TYPE_EMPTY;
	
	int commenting = 0;
	
	int currentLine = 0;
	
	int logged = 0;
	
	int spaced = 0;
	int lineStart = 0;
	
	// Reset line displays
	jsLineData(0);
	
	// Loop through the file. w00t!
	for(int i = FILE_START; i < SIZE; i++){
		// jsLogInt(i);
		
		// Break on null char
		if(data[i] == '\0') break;
		
		
		// Line break, reset
		if(data[i] == '\n' || data[i] == '\r'){
			/*
			This will check if we're on a new line or not.
			
			Windows:	\r\n
			Mac (old):	\r
			Unix:		\n
			
			If we're on \n but the previous char is \r, we don't consider ourselves as being on a new line.
			
			First line is not 0; first line is 1, like for a text editor.
			*/
			if(data[i] == '\r' && data[i + 1] == '\n') continue;
			// Pass info on the line to JS
			
			lineStart = i + 1;
			
			// Consider the next line
			currentLine++;
			type = TYPE_EMPTY;
			
			// Run commands if not commenting, and if something was passed for parameter
			if(!commenting){
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
				
				// Check if variable type
				switch(data[commandPosition]){
					case '=':
					case '+':
					case '-':
						type = TYPE_SET;
						break;
					case '<':
					case '>':
					case '!':
						type = TYPE_GET;
						break;
					default:
						break;
				}
				
				// If not a variable
				if(type != TYPE_SET && type != TYPE_GET){
					// Test for audio
					// if(/\.mp3/i.test(parameter)) type = 'audio';
					
					int id = 0;
					// Look for a match from other pointers
					for(id = 0; id < objPosition; id++){
						// Found a match
						if(compareStrings(components[id], componentPosition)){
							// jsLogString(&data[components[objPosition]],1);
							match = 1;
							
							// Set type to current component's type
							type = list[id].type;
							
							// Update the struct
							// if(compareStrings(commandPosition + 1, REMOVE_CALL + 1)) list[id].active = 0;
							break;
						}
					}
					
					// If no match, add it
					if(!match){
						// jsLogString(&data[componentPosition],7);
						// jsLogInt(currentLine);
						
						// Update the current struct
						list[objPosition].active = 1;
						
						/// SET TYPE
						// Engine
						if(compareStrings(componentPosition,CALL_ENGINE)) type = TYPE_ENGINE;
						// Textbox
						else if(compareStrings(componentPosition,CALL_TEXTBOX)) type = TYPE_TEXTBOX;
						
						// If neither of the above are true, then if we haven't set a type, assume image
						else if(type == TYPE_EMPTY) type = TYPE_IMAGE;
						
						components[objPosition] = componentPosition;
						list[objPosition].type = type;
						
						// jsLogInt(type);
						
						// Move the position
						objPosition++;
					}
				}
			}
			
			if(commenting) type = TYPE_COMMENT;
			// If the defaults are all the same, and the parameter is empty, we're empty
			else if(componentPosition == CALL_TEXTBOX && commandPosition == CALL_CONTENT && parameterPosition == 0) type = TYPE_EMPTY;
			jsCreateLine(currentLine,type,&data[lineStart]);
			
			// Reset single-line commenting
			if(commenting == 1) commenting = 0;
			
			// Reset settings for the new line
			componentPosition	= CALL_TEXTBOX;
			commandPosition		= CALL_CONTENT;
			parameterPosition	= 0;
			type				= TYPE_EMPTY;
			
			spaced				= 0;
			continue;
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
	
	// Draw all the lines in JS to the DOM
	// jsLineData(currentLine);
	
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
	// Current Line
	if(currentLine === E.line){
		style = 'background-color:rgba(0,255,0,.25);z-index:-1;';
	}
	
	/// ERROR CHECKING ///
	
	// Check if using spaces instead of tabs for separate command and parameter
	if(/^(?!\/{2,})[^\t]* /.test(lines[i])){
		style = 'background-color:rgba(255,0,0,.25);z-index:-1;';
	}
		
		/// READ STUFF ///
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