<?php
###PHP 7 required (and recommended, because it's MUST faster)###

#You can disable this
session_start();

#NULL will disable admin access. Using a string will set that as the password and allow admin access.
static $password=NULL;

#Uncomment the below to show errors
//*
error_reporting(E_ALL);
ini_set('display_errors',1);
//*/

#Log out if there's no password
if(!$password) unset($_SESSION['showpony_admin']);

#Get a private file
if(!empty($_GET['get'])){
	#If we aren't logged in, block the effort
	if(empty($_SESSION['showpony_admin'])) die('You need to be logged in to access private files.');
	
	#Go to the correct directory
	chdir(($_POST['rel-path'] ?: '..').'/');
	
	#Get the file path
	$file=dirname(__FILE__,2).'/'.$_GET['get'];

	#These headers are required to scrub media (yes, you read that right)
	header('Accept-Ranges: bytes');
	header('Content-Length:'.filesize($file));
	
	readfile($file);
}else{
	#Run called functions
	
	#This object is sent to the user as JSON
	$response=[];
	
	#Go to the story's file directory
	chdir(($_POST['rel-path'] ?: '..').'/'.$_POST['path']);
	
	#We'll store all errors and code that's echoed, so we can send that info to the user (in a way that won't break the JSON object).
	ob_start();
	
	#If the user's seeking to log out, log them out
	if($_POST['call']==='logout') unset($_SESSION['showpony_admin']);
	
	#If we're making a call that doesn't require admin permissions, check it
	if(
		$_POST['call']==='login'
		|| $_POST['call']==='logout'
		|| $_POST['call']==='getFiles'
	){
		#On login request, attempt to log in; if it fails, let the user know
		if($_POST['call']==='login' && empty($_SESSION['showpony_admin']=$_POST['password']===$password)) echo 'Wrong password!';
		else{
			#Get files and protect others
			$response['files']=[];
			$response['success']=true;
			
			#Run through the files
			foreach(scandir('.') as &$file){
				#Ignore hidden files and folders
				if($file[0]==='.' || $file[0]==='~' || is_dir($file)) continue;

				#Ignore files that have dates in their filenames set to later
				$date;
				if(preg_match('/[^x][^(]+(?!\()\S?/',$file,$date)){ #Get the posting date from the file's name; if there is one:
					#If the time is previous to now (replacing ; with : for Windows filename compatibility)
					if(strtotime(str_replace(';',':',$date)[0].' UTC')<=time()){
						#Should be live; remove any x at the beginning of the filename
						if($file[0]=='x' && !rename($file,$file=substr($file,1))) $response['success']=false;
					}else{
						#Shouldn't be live; make sure an x is at the beginning of the filename
						if($file[0]!='x' && !rename($file,$file='x'.$file)) $response['success']=false;
						
						#Don't add hidden files if we aren't logged in
						if(empty($_SESSION['showpony_admin'])) continue;
					}
				}
				
				#Add the file to the array
				$response['files'][]=$_POST['path'].$file;
			}
		}
	}
	#Admin functions: must be logged in
	else{
		#If not logged in (or admin is disabled), let the user know and don't make a call
		if(empty($_SESSION['showpony_admin'])) echo 'You aren\'t logged in or don\'t have admin set up! Try refreshing and logging in again, or check out Showpony\'s wiki on GitHub for setting up or disabling admin.';
		
		#Try renaming the file, and pass the new filename to the user
		elseif($_POST['call']==='renameFile') $response['success']=rename($_POST['name'],$response['file']=$_POST['newName']);

		#Delete the old file, upload the new file with the old name and new extension
		elseif($_POST['call']==='uploadFile') $response['success']=unlink($_POST['name']) && move_uploaded_file($_FILES['files']['tmp_name'],$response['file']=pathinfo($_POST['name'],PATHINFO_FILENAME).'.'.pathinfo($_FILES['files']['name'],PATHINFO_EXTENSION));
		
		#Create a new file for the user to edit and update. We store that new file name in a variable.
		elseif($_POST['call']==='newFile') $response['success']=file_put_contents($response['file']='x2038-01-01 20;00;00 (Untitled '.time().').html','Replace me with your new, better file!');
		
		#Delete a file
		elseif($_POST['call']==='deleteFile') $response['success']=unlink($_POST['name']);
	}
	
	#Pass any echoed statements or errors to the response object
	$response['message']=ob_get_clean();
	$response['admin']=$_SESSION['showpony_admin'] ?? false;
	
	echo json_encode($response);
}

?>