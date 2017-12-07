<?php
error_reporting(E_ALL);
ini_set('display_errors',1);

class Showpony{

	protected static $password='password'; #NULL will disable admin access. Do not keep the default password.
	
	#Initialize the class
	function __construct($inputArray){
		#The message will be kept in the output buffer. We will send the output buffer to the user in the "message".
		ob_start();
		
		$this->admin=false;
		chdir(dirname(__FILE__,2).'/'.($inputArray['path'] ?? $_POST['path'] ?? null));
		
		#This object is sent to the user as JSON
		$response=[
			'call' => ($_POST['showpony-call'] ?? null)
			,'success' => false
			,'message' => null
		];
		
		#Always attempt login for admin functions
		$response=$this->login($response);
		
		#If the user passed a call
		if(!empty($_POST['showpony-call'])){
			#If we were here to login, don't bother doing so again
			if($response['call']!=='login'){
				$response=$this->{$response['call']}($response);
			}
			
			$response["message"]=ob_get_clean();
			
			echo json_encode($response);
		}
	}
	
	protected function login($response){
		if(self::$password){
			#Check if the user's trying to log in right now (and aren't trying to auto login)
			if(
				$response['call']=='login'
				&& $_POST['password']!=="null"
			){
				$this->admin=($_POST['password']==self::$password);
				
				$response['success']=setcookie(
					"showpony_password"
					,self::$password
					,($this->admin ? time()+60*60*24 : -1) #Expire in a day
				);
				
				if(!$response['success']) echo $this->admin ? "Correct password, but we failed to log you in." : "Wrong password!";
			}else if(!empty($_COOKIE['showpony_password'])){
				#Check if the password cookie lines with up the password
				$this->admin=($_COOKIE['showpony_password']===self::$password);
				
				if(!$this->admin){
					echo "You've been logged out!";
					setcookie('showpony_password',null,-1);
				}
				
			}
		}else echo 'Admin access not available for this Showpony object.';
		
		if($response['call']==='login'){
			if(
				$this->admin
				|| $_POST['password']==='null'
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
		$response["success"]=setcookie('showpony_password',null,-1);
		$response["files"]=$this->getFiles();
		return $response;
	}
	
	protected function uploadFile($response){
		#Delete original file
		unlink($_POST['name']);
		
		#Use the passed file name, but make sure to use the new file's extension
		$fileName=pathinfo($_POST['name'],PATHINFO_FILENAME).'.'.pathinfo($_FILES['files']['name'],PATHINFO_EXTENSION); #add new extension
	
		#Place the uploaded file
		$response["success"]=move_uploaded_file(
			$_FILES["files"]["tmp_name"]
			,$fileName
		);
		
		$response["file"]=$fileName;
		return $response;
	}
	
	protected function renameFile($response){
		$response['success']=rename(
			$_POST['name']
			,$_POST['newName']
		);
		
		$response['file']=$_POST['newName'];
		
		if(!$response['success']) echo "Rename failed! You may have an illegal character in your new title.";
		
		return $response;
	}
	
	protected function newFile($response){
		$response["file"]='x2038-01-01 20;00;00 (Untitled '.time().').html';
				
		$response["success"]=file_put_contents($response["file"],'Replace me with your new, better file!');
		
		return $response;
	}
	
	protected function deleteFile($response){
		$response["success"]=unlink($_POST['name']);
		return $response;
	}
	
	#Get files and protect others
	public function getFiles(){
		$passFiles=scandir('.');
		
		#Run through the files (backwards, so we can splice the array and keep going back)
		for($i=count($passFiles)-1;$i>=0;$i--){
			#Remove folders and hidden files
			if($passFiles[$i][0]==".") array_splice($passFiles,$i,1);

			#Ignore files that have dates in their filenames set to later
			$date;
			if(preg_match('/[^x][^(]+(?!\()\S?/',$passFiles[$i],$date)){ #Get the posting date from the file's name; if there is one:
				$file=$passFiles[$i];
				
				$date=str_replace(';',':',$date); #Semicolons are used instead of colons to support Windows file naming
				
				#Should be live; remove any x at the beginning of the filename
				if(strtotime($date[0].' UTC')<=time()){
					if($file[0]=='x'){
						rename(
							$file
							,substr($file,1)
						);
						
						$passFiles[$i]=substr($file,1);
					}
				}else{ #Shouldn't be live; make sure an x is at the beginning of the filename
					if($file[0]!="x"){
						rename(
							$file
							,'x'.$file
						);
						
						if($this->admin) $passFiles[$i]='x'.$file;
					}
					
					if(!$this->admin) array_splice($passFiles,$i,1);
				}
			}
		}
		
		return $passFiles;
	}
}

#Call this file to run Showpony functions
if(!empty($_POST['showpony-call'])) new Showpony([]);

?>