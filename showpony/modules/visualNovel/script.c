/*

Best bae compiler: https://mbebenita.github.io/WasmExplorer/

emscripten bloats it a lot, and I don't think I need it from what I can tell

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

// The data we'll be reading from and writing to
char component[30]		= {'\0'};
char command[30]		= {'\0'};
char parameter[1000]	= {'\0'};

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
	switch(type){
		case 1:
			return &component[0];
			break;
		case 2:
			return &command[0];
			break;
		case 3:
			return &parameter[0];
			break;
		// 0 or Unset
		case 0:
		default:
			return &data[0];
			break;
	}
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


// const int SIZE = 10;
/*
char* getData(){
	return &data[0];
}

void add(int value){
	data[0] = value;
}
*/

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

int lineEmpty(){
	// Loop through everything, returning 0 if we find a not-space
	for(int i = 0; i < SIZE; i++){
		// return -1;
		// Exit the loop if we've reached a null char
		if(data[i] == '\0') break;
		
		switch(data[i]){
			case ' ':
			case '\t':
			case '\n':
			case '\v':
			case '\f':
			case '\r':
				break;
			default:
				return 0;
				break;
		}
	}
	
	return 1;
}

int readLine(){
	/*int component	= -1;
	int command		= -1;
	int parameter	= -1;
	int type		= -1;*/
	
	// The styling of the highlight problem
	int style		= -1;

	// If a line is not empty
	/*if(!lineEmpty()){
		
		// Highlight multiline comments
		if(multilineComment){
			//style = 'background-color:rgba(255,255,255,.5);z-index:1;';
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
		
		// Check if multiline comment ends
		/*if(/^\s*\*\/\s*$/.test(lines[i])){
			multilineComment = false;
		}*/
		
		/// AUTOCOMPLETE ///
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
		
		/// READ STUFF ///
		
		// Get command, etc
		// var text = /(^[^\t\.\+\-=<>!]+)?\.?([^\t]+|[+\-=<>!]+)?\t*(.+$)?/.exec(lines[i]);
		
		// Chars are smaller, so we used them in this case
		signed char componentPosition	= -1;
		signed char commandPosition		= -1;
		signed char parameterPosition	= -1;
		
		// Whether we're past the command yet or not
		int spaced				= 0;
		
		// Check for comment
		/*
			0: No comment
			1: Single-line comment
			2: Multi-line comment
		*/
		int commenting = 0;
		
		int type = EMPTY;
		
		// Go through each char, determining the different values
		for(int i = 0; i < SIZE; i++){
			/// COMMENTS ///
			// Single-line comments
			if(data[i] == '/' && data[i + 1] == '/'){
				commenting = 1;
				break;
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
			
			/// MOST READING ///
			switch(data[i]){
				// Commands
				case '.':
				case '=':
				case '+':
				case '-':
				case '>':
				case '<':
				case '!':
					commenting = 0;
					// If we haven't begun writing the parameter, write to the command
					if(parameterPosition != -1 || spaced == 1){
						parameter[++parameterPosition] = data[i];
					} else {
						command[++commandPosition] = data[i];
					}
					break;
				// End of line
				case '\n':
				case '\r':
					continue;
					break;
				// Spaces
				case ' ':
				case '\t':
				case '\v':
				case '\f':
					// If we've begun writing the parameter, add it on
					if(parameterPosition != -1){
						parameter[++parameterPosition] = data[i];
					}
					else spaced = 1;
					break;
				// Null
				case '\0':
					// Get out of here
					goto EndFor;
					break;
				// Everything else: letters, numbers, etc
				default:
					// Add onto whichever element we're looking at
					if(parameterPosition != -1 || spaced == 1) parameter[++parameterPosition] = data[i];
					else if(commandPosition != -1) command[++commandPosition] = data[i];
					else component[++componentPosition] = data[i];
					break;
			}
		}
		
		EndFor: ;
		
		// End lines with NULL char
		if(componentPosition < 29)		component[componentPosition + 1]	= '\0';
		if(commandPosition < 29)		command[commandPosition + 1]		= '\0';
		if(parameterPosition < 999)		parameter[parameterPosition + 1]	= '\0';
		
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
			/*
			if(objectTypes[component]) type = objectTypes[component];
			else{
				type = 'character';
				if(/\.mp3/i.test(parameter)) type = 'audio';
			*/
			
			if(component[0] == '\0'){
				type = TEXTBOX;
			} else {
				type = IMAGE;
			}
			
			if(command[0] == '\0') {
				
			}
			
			char STR_ENGINE[] = "engine";
			char STR_TEXTBOX[] = "textbox";
			
			// See if the value is "engine"
			if(componentPosition == 5
				&& compareStrings(component, STR_ENGINE, componentPosition, 5) == 6
			){
				return -3;
				type = ENGINE;
			}
			/*
			// See if the value is "textbox"
			if(componentPosition == 6
				&& compareStrings(component, STR_TEXTBOX, componentPosition, 6)
			){
				type = TEXTBOX;
			}*/
			
			// If it's an engine, read the command
			if(type == ENGINE){
				/*switch(command){
					case AUDIO:
					case TEXTBOX:
					case IMAGE:
						// component = parameter;
						// type		= command;
						command[0]	= '\0';

						// If the object already exists, show a warning
						// if(objectTypes[component]){
							// style = 'background-color:rgba(255,0,0,.25);z-index:-1;';
						// }
						break;
					default:
						break;
				}*/
			}
			
			// type = ENGINE;
			
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
		}*/
	}
	
	return type;
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

/*
	 0: No match
	 N: Array position where match ends
*/
int compareStrings(int a[], int b[], int aMax, int bMax){
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