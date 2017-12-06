<?php

error_reporting(E_ALL);
ini_set('display_errors',1);

#Allows working with non-ASCII characters
setlocale(LC_ALL,'en_US.UTF-8');
date_default_timezone_set('UTC');

#The directory of the page we're running showpony from
$home=dirname(__FILE__,2).'/';

class Showpony{
	
	#Variables
	public $filePath='parts';
	public $admin=false;
	
	/***
		SHOWPONY SECURITY
		
		Showpony is not a fortress. The security here is very simple; if you are at all concerned about security, don't use the editor; you can do everything the editor can do by simply naming files properly and putting them into the correct folder. The editor is just a tool that can be helpful.
		
		To turn on the editor, set a password (other than "null" below, and set admin:true for the showpony object in JS.
		
		To turn off the editor, set the password to "null" (no quotes) and set admin:false for the showpony object in JS. It's important you do both of these things; if you leave password at something here, somebody can sneakily adjust the backend on you. You don't want that.
	***/
	
	#If null, then the admin console won't be accessible at all.
	#protected static $password='password';
	protected static $password=null;
	
	function login(){
		if(self::$password==null){
			echo 'Admin access not available for this Showpony object.';
		}else{
			
			#Check if the user's trying to log in right now (and aren't trying to auto login)
			if(
				$_POST['call']=='login'
				&& $_POST['password']!=="null"
			){
				if($_POST['password']==self::$password){
					setcookie(
						"showpony_password"
						,self::$password
						,time()+60*60*24 #Expire in a day
						,false
					);
					
					$this->admin=true;
				}else{
					echo "Wrong password!";
					
					setcookie('showpony_password',null,-1);
					unset($_COOKIE['showpony_password']);
					$this->admin=false;
				}
			}else{
				
				if(!empty($_COOKIE['showpony_password'])){
					#Check if the password cookie lines with up the password
					if(
						$_COOKIE['showpony_password']===self::$password
					){
						#Set admin to true
						$this->admin=true;
					}else{
						echo "You've been logged out!";
						
						setcookie('showpony_password',null,-1);
						unset($_COOKIE['showpony_password']);
						$this->admin=false;
					}
				}
			}
		}
	}
	
	function logout(){
		$this->admin=false;
		setcookie('showpony_password',null,-1);
		unset($_COOKIE['showpony_password']);
		
		echo "You've been logged out successfully!";
	}
	
	#Get files and protect others
	function getFiles(){
		global $home;
		
		$passFiles=scandir($home.$this->filePath);
		
		#Run through the files (backwards, so we can splice the array and keep going back
		for($i=count($passFiles)-1;$i>=0;$i--){
			$file=$passFiles[$i];
			
			#Check if it's a folder, htaccess file, or other hidden file
			if($file[0]=="."){
				#If so, remove it from the list
				array_splice($passFiles,$i,1);
				continue;
			}
			
			###DETERMINE WHETHER TO HIDE FILES OR ALLOW THEM TO PASS###
			
			#We only do this with files that have a date on them (otherwise we can't tell, so check that it has a properly formatted date first:
			if(preg_match('/^\d{4}-\d\d-\d\d(\s\d\d:\d\d:\d\d)?/',$file)){
				$date;
				#Get the posting date from the file's name
				preg_match('/[^x][^(]+(?!\()\S?/',$file,$date);
				$date=str_replace(';',':',$date); #Replace semicolons in the date with colons for proper date check (semicolons are allowed in windows names, so they're used as an alternative to colons
				
				#If it has an "X" in the name, see if it should be made live
				if($file[0]=="x"){
					#If its launch time is before now, make it live
					if(
						!empty($date)
						&& strtotime($date[0])<time()
					){
						rename($home.$this->mainFolder.$this->filePath.'/'.$file,$this->filePath.'/'.substr($file,1));
						#Change the file name in the array
						$passFiles[$i]=substr($file,1);
					} #Otherwise, don't include it in the array
					else
					{
						if(!$this->admin) array_splice($passFiles,$i,1);
						else $passFiles[$i]=$file;
					}
					
					continue;
				}
				
				#If it doesn't have an x in the name, see if it should be made private
				if(strtotime($date[0])>=time()){
					#Prepend the filename with x so it's inaccessible
					rename($home.$this->filePath.'/'.$file,$this->filePath.'/'.'x'.$file);
					
					if(!$this->admin) array_splice($passFiles,$i,1);
					else $passFiles[$i]='x'.$file;
					
				}else{
					#If this file is accessible by date, all the earlier ones will be too! Let's break out of this loop to save processing power:
					#break;
				}
			}
		}
		
		return $passFiles;
	}
}

#Call this file to run certain functions too
if(!empty($_POST["call"])){
	#This object is sent to the user as JSON
	$response=[
		"call" => $_POST["call"]
		,"success" => false
		,"message" => null
	];
	
	#The message will be kept in the output buffer. We will send the output buffer to the user in the "message".
	ob_start();
	
	$showpony=new Showpony();
	$showpony->filePath=$_POST['filePath'];
	$showpony->login();
	
	if($_POST['call']==='login'){
		if($showpony->admin){
			echo "Logged in successfully!";
					
			#Get the file names and pass them on
			$response["success"]=true;
			$response["files"]=$showpony->getFiles();
		}else if($_POST['password']==='null'){
			$response["success"]=true;
			$response["files"]=$showpony->getFiles();
		}
		
		
		$response["admin"]=$showpony->admin;
	}else if($_POST['call']==='logout'){
		$showpony->logout();
		$response["files"]=$showpony->getFiles();
		$response["success"]=true;
	}else{
		if($showpony->admin){
			switch($_POST['call']){
				case "uploadFile":
					#Delete original file
					unlink($home.($showpony->filePath).$_POST['name']);
					
					#Use the passed file name, but make sure to use the new file's extension
					$fileName=pathinfo($_POST['name'],PATHINFO_FILENAME).'.'.pathinfo($_FILES['files']['name'],PATHINFO_EXTENSION); #add new extension
				
					#Place the uploaded file
					move_uploaded_file(
						$_FILES["files"]["tmp_name"]
						,$home.$showpony->filePath.$fileName
					);
					
					$response["success"]=true;
					echo "Upload successful!";
					$response["file"]=$fileName;
					break;
				case "renameFile":
					$newFile=$_POST['newName'];
			
					#If the rename is successful, it will return true
					if(
						rename(
							$home.$showpony->filePath.$_POST['name']
							,$home.$showpony->filePath.$_POST['newName']
						)
					){ #If renaming's successful
						$response["success"]=true;
						echo "Rename successful!";
						$response["file"]=$_POST['newName'];
					}else{ #If renaming fails
						echo "Rename failed! You may have an illegal character in your new name.";
					}
					
					break;
					case "newFile":
						$newFile='x2038-01-01 20;00;00 (Untitled '.time().').html';
					
						file_put_contents('../'.$showpony->filePath.$newFile,'Replace me with your new, better file!');
						
						$response["success"]=true;
						echo "New part created!";
						$response["file"]=$newFile;
					break;
					case "deleteFile":
						#Delete file
						unlink($home.$showpony->filePath.$_POST['name']);
						
						$response["success"]=true;
						echo "Part deleted successfully!";
						break;
					default:
						break;
			}
		}else{
			echo "You don't have the rights to perform that action! Are you logged in?";
		}
	}
	
	$response["message"]=ob_get_contents();
	ob_end_clean();
	
	echo json_encode($response);
}

?>