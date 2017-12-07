<?php

#Testing
error_reporting(E_ALL);
ini_set('display_errors',1);

class Showpony{

	protected static $password='password'; #NULL will disable admin access. Do not keep the default password.
	
	#Initialize the class
	function __construct($inputArray){
		$this->home=dirname(__FILE__,2).'/';
		$this->admin=false;
		$this->path=($inputArray['path'] ?? $_POST['path'] ?? null);
		
		if(!empty($_POST['showpony-call'])) $this->postHandler();
	}
	
	protected function login($response){
		if(self::$password==null){
			echo 'Admin access not available for this Showpony object.';
		}else{
			
			#Check if the user's trying to log in right now (and aren't trying to auto login)
			if(
				$response['call']=='login'
				&& $response['password']!=="null"
			){
				if($response['password']==self::$password){
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
					$this->admin=false;
				}
			}else{
				if(!empty($_COOKIE['showpony_password'])){
					#Check if the password cookie lines with up the password
					if($_COOKIE['showpony_password']!==self::$password){
						echo "You've been logged out!";
						
						setcookie('showpony_password',null,-1);
					}
					
					$this->admin=($_COOKIE['showpony_password']===self::$password);
				}
			}
		}
		
		if($response['call']==='login'){
			if(
				$this->admin
				|| $response['password']==='null'
			){
				#Get the file names and pass them on
				$response['success']=true;
				$response['files']=$this->getFiles();
			}
			
			$response['admin']=$this->admin;
		}
		
		return $response;
	}
	
	protected function logout($response){
		setcookie('showpony_password',null,-1);
		
		$response["files"]=$this->getFiles();
		$response["success"]=true;
		
		return $response;
	}
	
	protected function uploadFile($response){
		#Delete original file
		unlink($this->home.($this->path).$response['name']);
		
		#Use the passed file name, but make sure to use the new file's extension
		$fileName=pathinfo($response['name'],PATHINFO_FILENAME).'.'.pathinfo($_FILES['files']['name'],PATHINFO_EXTENSION); #add new extension
	
		#Place the uploaded file
		move_uploaded_file(
			$_FILES["files"]["tmp_name"]
			,$this->home.$this->path.$fileName
		);
		
		$response["success"]=true;
		$response["file"]=$fileName;
		
		return $response;
	}
	
	protected function renameFile($response){
		$newFile=$response['newName'];
		
		#If the rename is successful, it will return true
		if(
			rename(
				$this->home.$this->path.$response['name']
				,$this->home.$this->path.$response['newName']
			)
		){ #If renaming's successful
			$response["success"]=true;
			$response["file"]=$response['newName'];
		}else{ #If renaming fails
			echo "Rename failed! You may have an illegal character in your new title.";
		}
		
		return $response;
	}
	
	protected function newFile($response){
		$newFile='x2038-01-01 20;00;00 (Untitled '.time().').html';
				
		file_put_contents($this->home.$this->path.$newFile,'Replace me with your new, better file!');
		
		$response["success"]=true;
		$response["file"]=$newFile;
		
		return $response;
	}
	
	protected function deleteFile($response){
		unlink($this->home.$this->path.$response['name']);
		$response["success"]=true;
		return $response;
	}
	
	#Get files and protect others
	public function getFiles(){
		$passFiles=scandir($this->home.$this->path);
		
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
			$date;
			#Get the posting date from the file's name
			preg_match('/[^x][^(]+(?!\()\S?/',$file,$date);
			
			if($date){
				$date=str_replace(';',':',$date); #Replace semicolons in the date with colons for proper date check (semicolons are allowed in windows names, so they're used as an alternative to colons
				
				#If it has an "X" in the name, see if it should be made live
				if($file[0]=="x"){
					#If its launch time is before now, make it live
					if(strtotime($date[0].' UTC')<time()){
						rename(
							$this->home.$this->path.$file
							,$this->home.$this->path.substr($file,1));
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
				
				#If it doesn't have an x in the name, see if it should be made protected
				if(strtotime($date[0].' UTC')>=time()){
					#Prepend the filename with x so it's inaccessible
					rename(
						$this->home.$this->path.$file
						,$this->home.$this->path.'x'.$file
					);
					
					if(!$this->admin) array_splice($passFiles,$i,1);
					else $passFiles[$i]='x'.$file;
				}
			}
		}
		
		return $passFiles;
	}
	
	private function postHandler(){
		#This object is sent to the user as JSON
		$response=[
			'call' => $_POST['showpony-call']
			,'success' => false
			,'message' => null
			,'name' => ($_POST['name'] ?? null)
			,'newName' => ($_POST['newName'] ?? null)
			,'password' => ($_POST['password'] ?? null)
		];
		
		#The message will be kept in the output buffer. We will send the output buffer to the user in the "message".
		ob_start();
		
		$this->path=$_POST['path'];
		
		#Always attempt login for admin functions
		$response=$this->login($response);
		
		#If we were here to login, don't bother doing so again
		if($response['call']!=='login'){
			$response=$this->{$response['call']}($response);
		}
		
		$response["message"]=ob_get_clean();
		
		echo json_encode($response);
	}
}

#Call this file to run certain functions too
if(!empty($_POST['showpony-call'])){
	new Showpony([]);
}

?>