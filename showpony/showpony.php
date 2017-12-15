<?php
session_start();

error_reporting(E_ALL);
ini_set('display_errors',1);

class Showpony{
	protected static $password='password'; #NULL will disable admin access. Using a string will set that as the password and allow admin access.
	
	#Initialize the class
	function __construct($inputArray){
		#Log out if there's no password
		if(!self::$password) unset($_SESSION['showpony_admin']);
		
		#This object is sent to the user as JSON
		$response=[
			'call' => ($inputArray['call'] ?? null)
			,'success' => false
			,'directory' => dirname(__FILE__,2).'/'.($inputArray['path'] ?? '')
		];
		
		chdir($response['directory']);
		
		#If the user passed a call
		if($response['call']){
			#We'll store all errors and code that's echoed, so we can send that info to the user (in a way that won't break the JSON object).
			ob_start();
			
			#Safe functions
			if($response['call']==='logout' || $response['call']==='getFiles'){
				if($response['call']==='logout') unset($_SESSION['showpony_admin']);
				$response=$this->getFiles($response);
			}else{ #Admin functions
				#If no password, exit
				if(!self::$password || ($response['call']!=='login' && empty($_SESSION['showpony_admin']))) $response['message']="You aren't logged in or don't have admin set up! Try refreshing and logging in again, or check out Showpony's wiki on GitHub for setting up or disabling admin.";
				else{
					#Try logging in with the passed password
					if($response['call']==='login'){
						#If the password's right, set the session and get the files
						if($_SESSION['showpony_admin']=($_POST['password']==self::$password)) $response=$this->getFiles($response);
						#Wrong password
						else $response['message']='Wrong password!';
					}
					
					#Try renaming the file, and pass the new filename to the user
					elseif($response['call']==='renameFile') $response['success']=rename($_POST['name'],$response['file']=$_POST['newName']);

					#Delete the old file, upload the new file with the old name and new extension
					elseif($response['call']==='uploadFile') $response["success"]=unlink($_POST['name']) && move_uploaded_file($_FILES["files"]["tmp_name"],$response["file"]=pathinfo($_POST['name'],PATHINFO_FILENAME).'.'.pathinfo($_FILES['files']['name'],PATHINFO_EXTENSION));
					
					#Create a new file for the user to edit and update. We store that new file name in a variable.
					elseif($response['call']==='newFile') $response["success"]=file_put_contents($response["file"]='x2038-01-01 20;00;00 (Untitled '.time().').html','Replace me with your new, better file!');
					
					#Delete a file
					elseif($response['call']==='deleteFile') $response["success"]=unlink($_POST['name']);
				}
			}
			
			$response["message"]=($response["message"] ?? '').ob_get_clean();
			$response['admin']=$_SESSION['showpony_admin'] ?? false;
			
			echo json_encode($response);
		}
		
		#if(!empty($_GET['rss'])) $this->RSS();
	}
	
	#Get files and protect others
	public function getFiles($response){
		$response['files']=[];
		$response['success']=true;
		
		#Run through the files (backwards, so we can splice the array and keep going back)
		foreach(scandir('.') as &$file){
			#Ignore folders and hidden files
			if($file[0]==".") continue;

			#Ignore files that have dates in their filenames set to later
			$date;
			if(preg_match('/[^x][^(]+(?!\()\S?/',$file,$date)){ #Get the posting date from the file's name; if there is one:
				$date=str_replace(';',':',$date); #Semicolons are used instead of colons to support Windows file naming
				
				#Should be live; remove any x at the beginning of the filename
				if(strtotime($date[0].' UTC')<=time()){
					if($file[0]=='x' && !rename($file,$file=substr($file,1))) $response['success']=false;
				}else{
				#Shouldn't be live; make sure an x is at the beginning of the filename
					if($file[0]!="x" && !rename($file,$file='x'.$file)) $response['success']=false;
					
					#Don't add hidden files if we aren't logged in
					if(!$_SESSION['showpony_admin']) continue;
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
if(!empty($_POST['showpony-call']) || !empty($_GET['showpony-call'])){
	new Showpony([
		'call'=>$_POST['showpony-call'] ?? $_GET['showpony-call']
		,'path'=>$_POST['path'] ?? $_GET['path']
	]);
}

if(!empty($_GET['showpony-get'])){
	if(empty($_SESSION['showpony_admin'])){
		die("You need to be logged in to access private files.");
	}
	
	$file=dirname(__FILE__,2).'/'.$_GET['showpony-get'];

	#These headers are required to scrub media (yes, you read that right)
	header('Accept-Ranges: bytes');
	header('Content-Length:'.filesize($file));
	
	readfile($file);
}
?>