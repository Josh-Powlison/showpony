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

#Commands
if(isset($_POST['newFolder'])){
	mkdir($_POST['newFolder']);
}

if(isset($_FILES['files'])){
	for($i=0;$i<count($_FILES['files']['tmp_name']);$i++){
		if($_FILES['files']['error'][$i]!==UPLOAD_ERR_OK){
			#Error messages: http://php.net/manual/en/features.file-upload.errors.php
			echo [
				'Upload okay but we\'re still here somehow!'
				,'Uploaded file size too big according to php.ini!'
				,'Uploaded file size too big according to HTML form!'
				,'File only uploaded partially!'
				,'No file found!'
				,'Missing a temporary folder!'
				,'Failed to write to disk!'
				,'A PHP extension stopped the upload!'
			][$_FILES['files']['error'][$i]];
		}
		
		if(!move_uploaded_file(
			$_FILES['files']['tmp_name'][$i]
			,basename($_FILES['files']['name'][$i])
		)){
			echo 'Failed to move the file!';
		}
		
		#die('We did something! '.__DIR__);
	}
}

#Delete directory or file
if(isset($_POST['delete'])){
	if(is_dir($_POST['delete'])) rmdir($_POST['delete']);
	else unlink($_POST['delete']);
}

if(isset($_POST['updateFile'])){
	rename(
		$_POST['updateFile']
		,$_POST['updateDate'].' ('.$_POST['updateName'].') '.$_POST['updateLength'].'.'.pathinfo($_POST['updateFile'],PATHINFO_EXTENSION)
	);
}

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
				
				#We don't allow deleting other folders, but we do allow these ones.
				?>
				<form method="POST"><input type="hidden" name="delete" value="<?=$file?>"><button>X</button></form>
				<?
				break;
		}
	}else{
	#File
		echo '<a href="',realpath($file),'">',$file,'</a>: ';
		
		#If we're not in the resources folder
		if(!preg_match('/^resources/',$_GET['path']  ?? '')){
			$live=!preg_match('/^x/',$file);
			$hidden=preg_match('/^~/',$file);
			preg_match('/.+(?=\s\()/',$file,$date);
			preg_match('/(?<=\().+(?=\))/',$file,$name);
			preg_match('/(?<=\s)\d.+(?=\.)/',$file,$length);
			
			?>
			<form method="POST">
				<input type="hidden" name="updateFile" value="<?=$file?>">
				<input type="text" name="updateName" value="<?=$name[0] ?? ''?>">
				<input type="text" name="updateDate" value="<?=$date[0] ?? ''?>">
				<input type="text" name="updateLength" value="<?=$length[0] ?? ''?>">
				<button>Update</button>
			</form>
			
			<?
		}
		
		switch(pathinfo($file,PATHINFO_EXTENSION)){
			case 'mm';
				echo 'A multimedia file.';
				break;
			case 'vtt';
				echo 'A subtitles file.';
				break;
			default;
				#If we're in the resources folder
				if(preg_match('/^resources/',$_GET['path']  ?? '')){
					#echo 'A file.';
				}else{
					echo 'A story file.';
				}
				break;
		}
		?>
		
		<form method="POST"><input type="hidden" name="delete" value="<?=$file?>"><button>X</button></form>
		<?
	}
	
	echo '<br>';
}

?>

<form method="POST"><input type="text" name="newFolder"><button>Create Folder</button></form>

<form method="POST" enctype="multipart/form-data"><input name="files[]" type="file" multiple><button>Upload File</button></form>