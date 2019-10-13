<?php

function visualNovelUnhideChildren($input){
	// visualNovel includes files on specific lines
	
	$handle = fopen($input,'r');
	$comment = false;
	
	// A list of all the objects
	$objects = [
		'textbox'	=> 'textbox',
		'engine'	=> 'engine'
	];

	// Go through every line
	while(($line = fgets($handle)) !== false){
		// Remove line breaks on line
		$line=trim($line,"\r\n");
		
		// TODO: remove rather than skip comments; allow comments that start midway through a line or end midway through a line; allow // comments and make exceptions for file paths (http://). Or, consider not allowing comments after the beginning of text (in case those characters are actually wanted there
		// Skip comments
		if(preg_match('/^\/\//',$line)){
			continue;
		}
		
		// Skip multiline comments
		if(preg_match('/^\/\*/',$line)){
			$comment=true;
			continue;
		}
		
		if($comment){
			if(preg_match('/\*\/$/',$line)){
				$comment=false;
			}
			
			continue;
		}
		
		// Get object data on the line
		if(preg_match('/([^\t\.]*)?\.?([^\t]*)?\t+(.+)/',$line,$matches)){
			$type = null;
			
			// Check if it's a textbox
			if($matches[1] == ''){
				$type = 'textbox';
			}
			// Check if it's type is engine
			else if($matches[1] == 'engine'){
				$type = 'engine';
				
				// See what type of object is being created and add it to the list
				switch($matches[2]){
					case 'textbox':
					case 'character':
					case 'audio':
						$objects[$matches[3]] = $matches[2];
						break;
					default:
						break;
				}
			}
			// See if the object already exists
			else if(array_key_exists($matches[1],$objects)){
				$type = $objects[$matches[1]];
			}
			// Figure out the type if it's a new object
			else{
				// If it includes a variable, skip over it
				if(preg_match('/\[/',$matches[1]) == true) $type = 'variableGet';
				// If it ends with =, it's a variable
				else if(preg_match('/=/',$matches[1]) == true) $type = 'variableSet';
				// If it mentions an audio type, it's audio
				else if(
					preg_match('/\.(?:mp3|ogg|wav)/i',$matches[3]) == true
				) $type = 'audio';
				// All other types are characters
				else $type = 'character';
				
				$objects[$matches[1]] = $type;
			}
			
			// Get audio and images, if the command is content
			if(
				($matches[2] == 'content' || $matches[2] == '')
				&& ($type == 'character' || $type == 'audio')
			){
				$layers = explode(',',$matches[3]);
				
				foreach($layers as $layer){
					$path = 'resources';
					if($layer[0] == '/'){
						$path .= $layer;
					} else $path .= '/' . ($type == 'character' ? 'images/' . $matches[1] . '/' . $layer : 'audio/' . $layer);
					
					// Assume extension based on character or audio, if one isn't set
					if(preg_match('/\./',$layer) == false) $path .= ($type == 'character' ? '.png' : '.mp3');
					
					unhideFile($path);
				}
			}
		}
		
		// Other
		else{
			// src="file.ext"
			// href="file.ext"
			// url("file.ext")
			
			// Go through every regex and look for matches in the line
			$regexChecks=[
				'/(src|href)="(\/|https?:\/\/[^\/]+\/)?([^"]+)"/i'
				,"/(src|href)='(\/|https?:\/\/[^\/]+\/)?([^']+)'/i"
				,'/(url)\(["\']?(\/|https?:\/\/[^\/]+\/)?([^)]+)["\']\)?/i'
			];
			
			foreach($regexChecks as $regex){
				if(preg_match_all($regex,$line,$matches,PREG_SET_ORDER)){
					foreach($matches as $match){
						// Absolute path or from root
						if($match[2][0]==='/' || preg_match('/https?:\/\//',$match[2])){
							// This will not work with subdomains or redirects in Apache; it assumes that the current website's root is the server's root
							
							// If a file doesn't exist, it simply won't be unhidden (if it was hidden in the first place). The script will continue to run.
							
							unhideFile($_SERVER['DOCUMENT_ROOT'].'/'.$match[3]);
						}
						// Relative path
						else{
							unhideFile(ROOT.'/'.$match[3]);
						}
					}
				}
			}
		}
	}
		
	fclose($handle);
}

?>