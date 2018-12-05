<?php

// Comment out the below line for other media to take priority. Defaults to 'file'.
$displayType='time';

function visualNovelUnhideChildren($input){
	// visualNovel includes files on specific lines
	
	$handle=fopen($input,'r');
	$comment=false;

	while(($line=fgets($handle))!==false){
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
		
		// Determines the correct file type, and allows ids for multiple objects (mook#1, mook#2)
		
		// Characters images
		if(preg_match('/^([^\s\.\=#]+)(#\S*)?\t+(.+)$/',$line,$matches)){
			// Split layers so we can grab every file
			$layers=explode(',',$matches[3]);
			foreach($layers as $layer){
				unhideFile('resources/characters/'.$matches[1].'/'.$layer.'.png');
			}
		}
		
		// Backgrounds
		else if(preg_match('/^([^\.\s#]+)(#[^.\s]*)?$/',$line,$matches)){
			unhideFile('resources/backgrounds/'.$matches[1].'.jpg');
		}
		
		// Audio
		else if(preg_match('/^([^\s#]+)(#\S*)?\.(loop|play)$/',$line,$matches)){
			unhideFile('resources/audio/'.$matches[1].'.mp3');
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