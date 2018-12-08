// Run this script in Photoshop to save all text layer info into a subtitles file.
// This can drastically simplify adding subtitles into your comic.

const originalRulerUnits=app.preferences.rulerUnits;
const originalTypeUnits=app.preferences.typeUnits;
app.preferences.rulerUnits=Units.PIXELS;
app.preferences.typeUnits=TypeUnits.PIXELS;

var fileString='';

// Takes a number percent to 2 decimal places
function floatToPercent(number){
	var output=number*(100)*(100);
	output=Math.floor(output)/100;
	
	return output;
};

// Go through all layers
for(var i=0;i<activeDocument.artLayers.length;i++){
	var layer=activeDocument.artLayers[i];
	
	if(layer.kind!==LayerKind.TEXT) continue;
	
	var text=layer.textItem;
	
	var left=floatToPercent((text.position[0])/activeDocument.width);
	var top=floatToPercent((text.position[1])/activeDocument.height);
	var right=floatToPercent((text.position[0]+text.width)/activeDocument.width);
	var bottom=floatToPercent((text.position[1]+text.height)/activeDocument.height);
	
	fileString+=left+','+top+' --> '+right+','+bottom;
	fileString+='\n'+text.contents;
	fileString+='\n\n';
}

// Save the subtitles file
var saveFile=new File(app.activeDocument.path+'/'+app.activeDocument.name.replace(/\..+$/,'.txt'));
saveFile.open("w");
saveFile.write(fileString);
saveFile.close();

alert('Complete!');

// Reset the preferences
app.preferences.rulerUnits=originalRulerUnits;
app.preferences.typeUnits=app.preferences.typeUnits;