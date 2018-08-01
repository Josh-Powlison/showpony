<?php

chdir('../examples/'.$_GET['story']);

echo '<a href="admin.php?story=',$_GET['story'],'">',$_GET['story'],'</a>/';

#Add links to each subfolder
if(isset($_GET['path'])){
	$path='admin.php?story='.$_GET['story'].'&path=';
	
	chdir($_GET['path']);
	foreach(explode('/',$_GET['path']) as $folder){
		$path.=$folder;
		
		echo '<a href="',$path,'">',$folder,'</a>/';
		
		$path.='/';
	}
}

echo '<br>';

foreach(scandir('.') as $file){
	if($file=='.' || $file=='..') continue;
	
	#Directory
	if(is_dir($file)){
		echo '<a href="admin.php?story=',$_GET['story'],'&path=',isset($_GET['path']) ? $_GET['path'].'/' : '',$file,'">',$file,'</a>: ';
		
		switch($file){
			case 'subtitles':
				echo 'Contains folders for subtitles.';
				break;
			case 'resources':
				echo 'For use in multimedia stories, or can store other files.';
				break;
			case 'audio':
				echo 'Audio in multimedia stories.';
				break;
			case 'backgrounds':
				echo 'Backgrounds in multimedia stories.';
				break;
			case 'characters':
				echo 'Character folders and files in multimedia stories.';
				break;
			default:
				#If we're in a folder, it's not a main story folder
				if(isset($_GET['path'])){
					if($_GET['path']==='subtitles') echo 'Holds all subtitle files for this language.';
				}else{
					echo 'Holds all story files for this language.';
				}
				break;
		}
	}else{
	#File
		echo '<a href="',realpath($file),'">',$file,'</a>: ';
		
		$live=!preg_match('/^x/',$file);
		$hidden=preg_match('/^~/',$file);
		preg_match('/.+(?=\s\()/',$file,$date);
		preg_match('/(?<=\().+(?=\))/',$file,$name);
		preg_match('/(?<=\s)\d.+(?=\.)/',$file,$length);
		
		echo 'Name: ',$name[0],' Date: ',$date[0],' Length: ',$length[0],' | ';
		
		switch(pathinfo($file,PATHINFO_EXTENSION)){
			case 'mm';
				echo 'A multimedia file.';
				break;
			case 'vtt';
				echo 'A subtitles file.';
				break;
			default;
				#If we're in a folder
				if(isset($_GET['path'])){
					#If we're in the resources folder
					if(preg_match('/^resources/',$_GET['path'])){
						#echo 'A file.';
					}else{
						echo 'A story file.';
					}
				}
				break;
		}
	}
	
	echo '<br>';
}

?>