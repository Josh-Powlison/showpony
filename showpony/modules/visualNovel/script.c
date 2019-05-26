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

const int SIZE = 10;
int data[SIZE];

int* getData(){
	return &data[0];
}

void add(int value){
	data[0] = value;
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
	/*
	if(
		command == "=="
		|| command == '<'
		|| command == '>'
		|| command == "<="
		|| command == ">="
		|| command == '!'
	){
		return COMPARISON;
	}*/
	
	return NULL;
}

// main has to be called manually when using WebAssembly
int main() {
	return 0;
}