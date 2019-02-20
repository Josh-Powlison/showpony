<?php

function textUnhideChildren($input){
	// text includes files as paths
	$handle=fopen($input,'r');

	while(($line=fgets($handle))!==false){
		// Remove line breaks on line
		$line=trim($line,"\r\n");
		
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
						unhideFile($parentDir.$match[3]);
					}
				}
			}
		}
	}
		
	fclose($handle);
}

?>