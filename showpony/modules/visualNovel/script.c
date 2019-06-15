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
	int active;			// If it is live on the currently selected line
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
const int STRING_ENGINE = 1;
const int STRING_TEXTBOX = 8;
const int STRING_IMAGE = 16;
const int STRING_AUDIO = 22;
const int STRING_CONTENT = 28;
const int STRING_REMOVE = 36;
const int STRING_MP3 = 43;
const int STRING_OGG = 47;
const int FILE_START = 51;

///////////////////////
//// JS FUNCTIONS /////
///////////////////////

void jsLogString(char *position, int length);
void jsLogInt(int input);
float jsCreateLine(int fileLine, int type, char *position, int length);
void jsCreateHighlight(float top, float height);
void jsRecommendation(char *position, int length, int type, int componentType);
void jsDisplayObjects(int *position);
void jsOverwriteText(char *position, int length);

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

int* getObject(int id){
	return &list[id];
}

int getBufferLength(){
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
		case ',':
		case '\/':
		case '\\':
		case '\0':
			return 1;
			break;
		default:
			return 0;
			break;
	}
}
/*
int getStringUntilDelimiter(int a){
	// Return true once we hit a delimiter
	for(int i = 0; i < 50; i++){
		if(isDelimiter(data[a + i]) return i;
	}
	
	// Otherwise, return false if we never do
	return 0;
}*/

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

// Gets two positions in the text file and sees if the strings from there are the same
int matchStringsPartial(int a, int b){
	int aEnds = 0;
	int bEnds = 0;
	
	// When there's a delimiter with one and not another, there's a difference
	for(int i = 0; i < 50; i++){
		// Save the end
		if(isDelimiter(data[a + i]) && !aEnds) aEnds = i;
		if(isDelimiter(data[b + i]) && !bEnds) bEnds = i;
		
		if(aEnds && bEnds) break;
		
		// If they're not equal and neither's delimited, return false
		if(
			!aEnds && !bEnds
			&& data[a + i] != data[b + i]
		) return 0;
	}
	
	// When there's a delimiter with one and not another, there's a difference
	return aEnds - bEnds;
}

int readFile(int line){
	/// Clear Data
	
	/*while(assets.firstChild) assets.removeChild(assets.firstChild);
	
	/// ASSETS ///
	var objectKeys = Object.keys(objects);
	
	for(var i = 0; i < objectKeys.length; i++){
		var obj = document.createElement('p');
		obj.innerHTML = objectKeys[i] + ' (' + objects[objectKeys[i]].type + ')';
		assets.appendChild(obj);
	}
	
	// Variables
	var variableKeys = Object.keys(M.variables);
	
	for(var i = 0; i < variableKeys.length; i++){
		var input = document.createElement('input');
		input.value = M.variables[variableKeys[i]];
		assets.appendChild(input);
	}*/
	/*
	
	var yPos = 0;
	
	// Calculate the maximum number of characters on a line
	
	var oneLineMaxChars	= Math.floor(content.innerWidth / letterWidth);
	
	*/
	
	// We don't have to reset all the memory; we just have to reset our tracking
	objPosition = 0;
	varPosition = 0;
	
	// Chars are smaller, so we used them in this case
	int componentPosition	= STRING_TEXTBOX;
	int commandPosition		= STRING_CONTENT;
	int parameterPosition	= 0;
	int extPosition			= 0;
	int type				= TYPE_EMPTY;
	
	int commenting = 0;
	
	int fileLine = 0;		// The actual line in the file
	int parseLine = 0;		// The lines as parsed later on
	
	int logged = 0;
	
	int spaced = 0;
	int lineStart = FILE_START;
	
	float yPosition = 0;
	float height = 16;
	
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
			
			type = TYPE_EMPTY;
			
			// Run commands if not commenting, and if something was passed for parameter
			if(!commenting){
				// loop through pointers
				// see how far one matches
				// If it doesn't completely match, move on
				int match = 0;
				
				// Some commands make new components, in which case the line type is really of the created component. Check type.
				if(compareStrings(componentPosition,STRING_ENGINE)){
					// Creating an image
					if(compareStrings(commandPosition + 1,STRING_IMAGE)){
						type = TYPE_IMAGE;
						componentPosition = parameterPosition;
						parameterPosition = 0;
					}
					
					// Creating audio
					else if(compareStrings(commandPosition + 1,STRING_AUDIO)){
						type = TYPE_AUDIO;
						componentPosition = parameterPosition;
						parameterPosition = 0;
					}
					
					// Creating a textbox
					else if(compareStrings(commandPosition + 1,STRING_TEXTBOX)){
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
					
					// Look for a match from other pointers
					for(int id = 0; id < objPosition; id++){
						// Found a match
						if(compareStrings(components[id], componentPosition)){
							// jsLogString(&data[components[objPosition]],1);
							match = 1;
							
							// Set type to current component's type
							type = list[id].type;
							
							// If we're removing it, deactive it
							if(parseLine < line && compareStrings(commandPosition + 1, STRING_REMOVE)) list[id].active = 0;
							break;
						}
					}
					
					// If no match, add it
					if(!match){
						// jsLogString(&data[componentPosition],7);
						// jsLogInt(fileLine);
						
						// The element is active if it exists on the current line
						if(parseLine < line) list[objPosition].active = 1;
						
						/// SET TYPE
						
						// Engine
						if(compareStrings(componentPosition,STRING_ENGINE)) type = TYPE_ENGINE;
						// Textbox
						else if(compareStrings(componentPosition,STRING_TEXTBOX)) type = TYPE_TEXTBOX;
						// Audio
						else if(compareStrings(extPosition + 1,STRING_MP3) || compareStrings(extPosition + 1,STRING_OGG)) type = TYPE_AUDIO;
						// If neither of the above are true, and if we haven't set a type, assume image
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
			else if(componentPosition == STRING_TEXTBOX && commandPosition == STRING_CONTENT && parameterPosition == 0) type = TYPE_EMPTY;
			
			// The styling of the highlight problem
			// int style		= 0;
			
			/// HIGHLIGHT
			height = jsCreateLine(fileLine,type,&data[lineStart],i - lineStart);
			
			// Check the line as after the file has been parsed by JS (removing multiline comments, removing adjacent whitespace
			if(type != TYPE_EMPTY && commenting != 2){
				// jsLogString(&data[lineStart],10);
				// jsLogInt(type);
				
				// If it's the line we're on in the player, highlight it
				if(parseLine == line){
					jsCreateHighlight(yPosition, height);
				}
				
				parseLine++;
			}
			
			/// LINE INFO
			fileLine++;
			
			lineStart = i + 1;
			
			yPosition += height;
			
			/*
			
			/// ERROR CHECKING ///
			
			// Check if using spaces instead of tabs for separate command and parameter
			if(/^(?!\/{2,})[^\t]* /.test(lines[i])){
				style = STYLE_ERROR;
			}
			*/
			
			// Reset single-line commenting
			if(commenting == 1) commenting = 0;
			
			// Reset settings for the new line
			componentPosition	= STRING_TEXTBOX;
			commandPosition		= STRING_CONTENT;
			parameterPosition	= 0;
			type				= TYPE_EMPTY;
			extPosition			= 0;
			
			spaced				= 0;
			
			// height = 16;
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
		if(parameterPosition){
			// Track extension (if it is an extension), so we know what we're working with
			if(data[i] == '.') extPosition = i;
			continue;
		}
		
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
		else if(componentPosition == STRING_TEXTBOX && commandPosition == STRING_CONTENT){
			componentPosition = i;
		}
	}
		
	// Display all objects
	jsDisplayObjects(&components[0]);
	
	// Return the total number of lines
	return fileLine;
		
	// We've now got pointers for the beginning of each component, command, and parameter. w00t!
	
}

// Add tabs to the selection line
int tabLine(int maxTabbedTo, int start, int multiline){
	// Get the number of chars in the line
	while(data[start - 1] != '\n' && data[start - 1] != '\r' && data[start - 1] != '\0'){
		start--;
	}
	
	int count = 0;
	int length = 0;
	int tabbed = 0;
	
	// Get the length of the line up until tab ends (or line end)
	while(
			data[start + count] != '\n'
		&&	data[start + count] != '\r'
		&&	data[start + count] != '\0'
	){
		
		// Tabs count as 4
		if(data[start + count] == '\t'){
			// Calculate how much space the tab is taking up
			int calc = (4 - (length % 4));
			if(!calc) calc = 4;
			length += calc;
			
			tabbed = 1;
			count++;
			continue;
		}
		
		// If we're already tabbed but we're reading another char, exit- the user just wants to add a regular tab
		if(tabbed){
			// If this isn't a multiline run, exit- the user just wants to add in a regular tab
			// if(!multiline) return 0;
			break;
		}
		
		count++;
		length++;
	}
	
	// Ceil value: https://stackoverflow.com/questions/2745074/fast-ceiling-of-an-integer-division-in-c-c#2745086
	int tabsToAdd = ((maxTabbedTo - length) + 4 - 1) / 4;
	
	// Add any tabs we need to
	if(tabsToAdd > 0){
		// Loop back through and add in tabs
		for(int i = SIZE - tabsToAdd; i >= start + count; i--){
			// Skip null chars
			// if(data[i - tabsToAdd] == '\0') continue;
			
			// Add a tab here if we're at that spot
			if(i < start + count + tabsToAdd) data[i] = '\t';
			
			// Move all chars forward by the number of tabs we need to add
			else data[i] = data[i - tabsToAdd];
		}
	} else tabsToAdd = 0;
	
	return tabsToAdd;
}

int tabLines(int selectionStart, int selectionEnd){
	// CONVERT TO WASM (it's written in a way that will hopefully transfer easier)
	int maxTabbedTo		= 0;
	int lineStart		= 0;
	int linePosition	= 0;
	int tabbed			= 0;
	int tabsAdded		= 0;
	
	selectionStart		+= FILE_START;
	selectionEnd		+= FILE_START;
	
	
	// Loop through the file
	for(int i = FILE_START; i < SIZE; i++){
		if(data[i] == '\0') break;
		
		switch(data[i]){
			case '\n':
			case '\r':
				lineStart = 0;
				linePosition = 0;
				tabbed = 0;
				continue;
				break;
			// Add tab spacing
			case '\t':
				// If we're tabbing in the parameter, ignore
				if(tabbed < 2){
					int calc = (4 - (linePosition % 4));
					if(!calc) calc = 4;
					linePosition += calc;
					tabbed = 1;
				}
				continue;
				break;
			case '\0':
				// Exit here
				break;
			default:
				break;
		}
		
		// Move position if we haven't tabbed yet
		if(!tabbed) linePosition++;
		else tabbed = 2;
		
		// If we're further along, and we've tabbed
		if(linePosition > maxTabbedTo && tabbed > 0) maxTabbedTo = linePosition;
		
	}
	
	// If we haven't selected a section, perform this action
	if(selectionStart == selectionEnd){
		// Default start to selection start
		tabsAdded = tabLine(maxTabbedTo,selectionStart,0);
	// If we've selected a section
	} else {
		int multiline = 0;
		
		// Check if it spans multiple lines
		for(int i = selectionStart; i < selectionEnd; i ++){
			if(data[i] == '\n' || data[i] == '\r'){
				multiline = 1;
				break;
			}
		}
		
		// If it spans multiple lines, we'll fix tabbing for them all
		if(multiline){
			int s = selectionStart;
			int e = selectionEnd;
			
			int newLine = 1;
			
			// Get lines
			for(int i = s; i < e; i ++){
				switch(data[i]){
					case '\n':
					case '\r':
						newLine = 1;
						continue;
						break;
					case '\0':
						// Exit here
						continue;
						break;
					default:
						break;
				}
				
				// If not a new line, add tabs to line if needed
				if(newLine){
					// Continue forward if needbe; the end of our selection has moved with the tabs
					e += tabLine(maxTabbedTo,i,1);
					newLine = 0;
				}
			}
			
			tabsAdded = 1;
		// Otherwise, just write a tab
		} else {
			tabsAdded = 0;
		}
	}
	
	// Overwrite the JS text if needbe
	if(tabsAdded > 0) jsOverwriteText(&data[FILE_START],getLength());
	return tabsAdded;
}

// Get the real length of the file
int getLength(){
	for(int i = FILE_START; i < SIZE; i ++){
		if(data[i] == '\0') return (i - 1 - FILE_START);
	}
}

// When the user is typing a value, recommend like ones to them
void autocomplete(int pos){
	/*
		1: Component
		2: Command
		3: Resource
	*/
	int searchType = 0;
	int length = 1;
	
	int i = pos + FILE_START;
	
	// If we're on a delimiter, check if we're at the end of a line
	if(data[i] == '\n' || data[i] == '\r' || data[i] == '\0') i--;
	// But if we're still on a delimiter, don't bother
	if(data[i] == '\n' || data[i] == '\r' || data[i] == '\0'){
		jsRecommendation(&data[0],length,searchType,0);
		return;
	}

	// if(isDelimiter(data[i])) return &data[0];
	
	// Get the end position
	int end = i;
	while(!isDelimiter(data[end])) end++;
	
	searchType = 1;
	
	// Check where each piece starts
	int componentStart	= 0;
	int commandStart	= 0;
	int parameterStart	= 0;
	int tabbed			= 0;
	
	// We look back to see how this is called, to figure out if it's a component, command, or parameter
	for(i; i > 0; i--){
		switch(data[i]){
			// End loop on getting to the line's start
			case '\0':
			case '\n':
			case '\r':
				i++;
				componentStart = i;
				goto endLoop;
				break;
			// We're working with the command
			case '.':
				commandStart = i;
				searchType = 2;
				break;
			// Parameter (chars only allowed here)
			case '\t':
				commandStart = i;
				
				// Set the parameter's start
				if(!parameterStart) parameterStart = i + 1;
				searchType = 3;
				break;
			default:
				break;
		}
	}
	endLoop: ;
	
	int match = 0;
	
	// Found parameter, component, and (maybe) command
	if(parameterStart){
		// We have resources to recommend! Because content is being searched for
		if(data[commandStart] == '\t' || compareStrings(commandStart + 1,STRING_CONTENT)){
			match = componentStart;
			length = commandStart - componentStart;
		}else{
			// ???
		}
	}
	// Found command and component
	else if(commandStart){
		
	}
	// Only found component
	else if(componentStart){
		int minBeyond = 50;
		
		// Loop through all components
		for(int j = 0; j < objPosition; j++){
			// Positive if a's longer than b and partially matches; negative if b's longer than a and partially matches; 0 if exact matches
			int lengthBeyond = matchStringsPartial(components[j],i);

			// jsLogInt(lengthMatched);
			// jsLogString(&data[components[j]],10);
			
			if(lengthBeyond > 0 && lengthBeyond < minBeyond){
				match = components[j];
				minBeyond = lengthBeyond;
			}
		}
		
		length = end - i + minBeyond;
	}
	
	// Set defaults
	if(!componentStart)	componentStart = STRING_TEXTBOX;
	if(!commandStart)	commandStart = STRING_CONTENT;
	
	// Get the type of the selected component
	int type = 0;
	for(int id = 0; id < objPosition; id++){
		// Found a match
		if(compareStrings(components[id], componentStart)){
			// Set type to current component's type
			type = list[id].type;
			break;
		}
	}
	
	jsRecommendation(&data[match],length,searchType,type);
	
	/*var contentToNow = content.value.substr(0, selectionEnd);
	if(
		selectionStart === selectionEnd
		&& selectionStart
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