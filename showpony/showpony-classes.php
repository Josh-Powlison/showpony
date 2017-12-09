<?php
error_reporting(E_ALL);
ini_set('display_errors',1);

class Showpony{

	protected static $password=NULL; #NULL will disable admin access. Using a string will set that as the password and allow admin access.
	
	#Initialize the class
	function __construct($inputArray){
		$this->admin=false;
		chdir(dirname(__FILE__,2).'/'.($inputArray['path'] ?? $_POST['path'] ?? $_GET['path'] ?? null));
		
		#This object is sent to the user as JSON
		$response=[
			'call' => ($_POST['showpony-call'] ?? $inputArray['call'] ?? null)
			,'success' => false
			,'message' => null
		];
		
		#If there's no password in use, don't try to log in
		if(self::$password!==NULL){
			#Always attempt login for admin functions
			$response=$this->login($response);
		}else
		#If the user's trying to access admin stuff when there's no password set, prevent it and let them know
		if(!empty($_POST['password']) || $response['call']==='login'){
			$response['message']=("You are trying to access admin privileges through this webpage but you have admin disabled. Either set a password for the admin or set \"admin:false\" in the Showpony object.");
			
			echo json_encode($response);
			die();
		}
		
		#If the user passed a call
		if(!empty($_POST['showpony-call'])){
			#The message will be kept in the output buffer. We will send the output buffer to the user in the "message".
			ob_start();
			
			#If we were here to login, don't bother doing so again
			if($response['call']!=='login'){
				$response=$this->{$response['call']}($response);
			}
			
			$response["message"]=ob_get_clean();
			
			echo json_encode($response);
		}
		
		if(!empty($_GET['rss'])) $this->RSS();
	}
	
	protected function login($response){
		if(self::$password){
			#Check if the user's trying to log in right now (and aren't trying to auto login)
			if(
				$response['call']=='login'
				&& !empty($_POST['password'])
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
		
		#This is outside the other block because files need to be returned if the user's trying to log in (and needs that info)
		if($response['call']==='login'){
			#Get the file names and pass them on
			$response['success']=true;
			$response=$this->getFiles($response);
			
			$response['admin']=$this->admin;
		}
		
		return $response;
	}
	
	protected function logout($response){
		$response["success"]=setcookie('showpony_password',null,-1);
		$this->admin=false;
		$response=$this->getFiles($response);
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
	public function getFiles($response){
		$response['files']=[];
		$response['success']=true;
		
		#Run through the files (backwards, so we can splice the array and keep going back)
		foreach(scandir('.') as &$file){
			#Remove folders and hidden files
			if($file[0]==".") continue;

			#Ignore files that have dates in their filenames set to later
			$date;
			if(preg_match('/[^x][^(]+(?!\()\S?/',$file,$date)){ #Get the posting date from the file's name; if there is one:
				$date=str_replace(';',':',$date); #Semicolons are used instead of colons to support Windows file naming
				
				#Should be live; remove any x at the beginning of the filename
				if(strtotime($date[0].' UTC')<=time()){
					if($file[0]=='x'){
						$response['success']=(
							$response['success']
							&& rename($file,substr($file,1))
						);
						$file=substr($file,1);
					}
				}else{ #Shouldn't be live; make sure an x is at the beginning of the filename
					if($file[0]!="x"){
						$response['success']=(
							$response['success']
							&& rename($file,'x'.$file)
						);
						$file='x'.$file;
					}
					
					#Don't add this file if we aren't an admin
					if(!$this->admin) continue;
				}
			}
			
			#Add the file to the array
			$response['files'][]=$file;
		}
		
		return $response;
	}
	
	#http://localhost/showpony/showpony/showpony-classes.php?rss=true&path=parts/
	public function RSS(){
		die("RSS feed incomplete.");
		
		#Parse the results as XML
		#header("Content-type: application/xml");
		header("Content-type: txt");
		
		$cover="http://joshpowlison.com/podcasts/pickapart-tv/cover.jpg";
		$creator="Josh Powlison";
		$email="joshuapowlison@gmail.com";
		$category1="TV &amp; Film";
		$category2="Education";
		$explicit="no";
		$title="Inspector Josh Investigates TV";
		$language="en-us";
		
		$keywords="videogames,announcement,games,media";
		
		$summary="Inspector Josh studies TV shows for writing lessons.";
		$subtitle="Inspector Josh will find the truth.";
		
		?><rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
			<channel>
				<atom:link href="<?=getcwd()?>" rel="self" type="application/rss+xml"/>
				<title><?=$title?></title>
				<link><?=getcwd()?></link>
				<description>Inspector Josh studies TV shows for writing lessons.</description>
				<language><?=$language?></language>
				<webMaster><?=$email?> (<?=$creator?>)</webMaster>
				<copyright><![CDATA[ Copyright 2017 Josh Powlison. All rights reserved. ]]></copyright>
				<docs><?=getcwd()?></docs>
				<managingEditor><?=$email?> (<?=$email?>)</managingEditor>
				<image>
					<url><?=$cover?></url>
					<title><?=$title?></title>
					<link><![CDATA[ <?=getcwd()?> ]]></link>
				</image>
				<itunes:summary><![CDATA[ <?=$summary?> ]]></itunes:summary>
				<itunes:author><?=$creator?></itunes:author>
				<itunes:category text="<?=$category1?>"/>
				<itunes:category text="<?=$category2?>"/>
				<itunes:image href="<?=$cover?>"/>
				<itunes:explicit><?=$explicit?></itunes:explicit>
				<itunes:owner>
					<itunes:name><![CDATA[ <?=$creator?> ]]></itunes:name>
					<itunes:email><?=$email?></itunes:email>
				</itunes:owner>
				<itunes:subtitle><![CDATA[ <?=$subtitle?> ]]></itunes:subtitle>

				<?
				
				foreach($this->getFiles($response)['files'] as $file){
					
					$name;
					$date;
					$length;
					
					#Get the name and date from the filename
					preg_match('/(?<=\().+(?=\))/',$file,$name);
					preg_match('/[^x][^(]+(?!\()\S?/',$file,$date);
					preg_match('/[^\s)]+(?=\..+$)/',$file,$length);
					
					#Ignore hidden files
					if($file[0]==='x') continue;
					
					$name=$name[0] ?? '';
					$date=$date[0] ? strtotime($date[0]) : filemtime($file);
					str_replace(';',':',$date);
					$length=$length[0] ?? 10;
					
					#die(date('D, j M Y G:i:s',strtotime($date[0])));
					
					$date=date('D, j M Y G:i:s',$date);
					?>
				<item>
					<title><?=$name?></title>
					<link><?=getcwd().'/'.$file?></link>
					<guid><?=getcwd().'/'.$file?></guid>
					<pubDate><?=$date?></pubDate>
					<description><![CDATA[ Listen to the latest entry of <?=$title?>! ]]></description>
					<enclosure length="<?=$length[0] ?>" type="audio/mpeg" url="<?=getcwd().'/'.$file?>"/>
					<itunes:image href="<?=$cover?>"/>
					<itunes:duration><?=($length / 60).':'.$length[0] % 60 ?></itunes:duration>
					<itunes:explicit><?=$explicit?></itunes:explicit>
					<itunes:keywords><?=$keywords?></itunes:keywords>
					<itunes:subtitle><![CDATA[ The latest update is here! ]]></itunes:subtitle>
				</item>
					<?
				}
				?>
			</channel>
		</rss>
		<?
	}
}

#Call this file to run Showpony functions
if(!empty($_POST['showpony-call']) || !empty($_GET['rss'])) new Showpony([]);

if(!empty($_GET['showpony-get'])){
	$file=dirname(__FILE__,2).'/'.$_GET['showpony-get'];

	#These headers are required to scrub media (yes, you read that right)
	header('Accept-Ranges: bytes');
	header('Content-Length:'.filesize($file));
	
	readfile($file);
}
?>