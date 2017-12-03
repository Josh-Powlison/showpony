<?php

error_reporting(E_ALL);
ini_set('display_errors',1);

#Allows working with non-ASCII characters
setlocale(LC_ALL,'en_US.UTF-8');

class Showpony{
	
	#Variables
	public $filePath='parts';
	
	#Upload files for the story
	function uploadFile(){
		#$_POST['']
		
		#die($_FILES['files']['name']);
		
		#return $_FILES["files"]["name"]." ".$this->filePath;
		
		return move_uploaded_file(basename($_FILES["files"]["name"][0]),'../'.$this->filePath);
	}
	
	function renameFile(){
		#rename($this->filePath.'/'.$file,$this->filePath.'/'.substr($file,1));
	}
	
	function deleteFile(){
		#rename($this->filePath.'/'.$file,$this->filePath.'/'.substr($file,1));
	}
	
	#Get files and protect others
	function getFiles(){
		$passFiles=scandir($this->filePath);
		
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
			
			$date;
			#Get the posting date from the file's name
			preg_match('/[^x][^(]+(?!\()\S?/',$file,$date);
			
			#If it has an "X" in the name, see if it should be made live
			if($file[0]=="x"){
				#If its launch time is before now, make it live
				if(
					!empty($date)
					&& strtotime($date[0])<time()
				){
					rename($this->filePath.'/'.$file,$this->filePath.'/'.substr($file,1));
					#Change the file name in the array
					$passFiles[$i]=substr($file,1);
				} #Otherwise, don't include it in the array
				else
				{
					array_splice($passFiles,$i,1);
				}
				
				continue;
			}
			
			#If it doesn't have an x in the name, see if it should be made private
			if(strtotime($date[0])>=time()){
				#Prepend the filename with x so it's inaccessible
				rename($this->filePath.'/'.$file,$this->filePath.'/'.'x'.$file);
			}else{
				#If this file is accessible by date, all the earlier ones will be too! Let's break out of this loop to save processing power:
				#break;
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
	
	switch($_POST['call']){
		case "uploadFile":
			move_uploaded_file(
				$_FILES["files"]["tmp_name"]
				,'../'.($showpony->filePath).(
					#Use the passed file name, but make sure to use the new file's extension
					#preg_replace('/\..+$/','',$_POST['name']) #Get the filename without the extension
					pathinfo($_POST['name'],PATHINFO_FILENAME).'.'.pathinfo($_FILES['files']['name'],PATHINFO_EXTENSION) #add new extension
				)
			);
			break;
		case "renameFile":
			$newFile=$_POST['newName'];
	
			#If the rename is successful, it wil return true
			if(
				rename(
					'../'.$showpony->filePath.$_POST['name']
					,'../'.$showpony->filePath.$_POST['newName']
				)
			){ #If renaming's successful
				$response["success"]=true;
				echo "Rename successful!";
				$response["file"]=$_POST['newName'];
			}else{ #If renaming fails
				echo "Rename failed! You may have an illegal character in your new name.";
			}
			
		break;
	}
	
	$response["message"]=ob_get_contents();
	ob_end_clean();
	
	echo json_encode($response);
}

?>