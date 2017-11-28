<?php

function easyShowpony($dirName){
	#Get parts for a story
	?>
		<div id="showpony"></div>
		<script src="showpony/showpony.js"></script>
		<script>
			var engine;
			var showponyWindow=document.getElementById("showpony");
		
			window.addEventListener(
				"load"
				,function(){
					engine=new Showpony({
						"window":showponyWindow
						,"parts":<?php echo json_encode(getFiles($dirName));?>
						,"path":"<?php echo $dirName;?>/"
					});
				}
			);
		</script>
	<?php
}

#Get files and protect others
function getFiles($dirName){
	$passFiles=scandir($dirName);
	
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
			if(strtotime($date[0])<time()){
				rename($dirName.'/'.$file,$dirName.'/'.substr($file,1));
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
			rename($dirName.'/'.$file,$dirName.'/'.'x'.$file);
		}else{
			#If this file is accessible by date, all the earlier ones will be too! Let's break out of this loop to save processing power:
			#break;
		}
	}
	
	return $passFiles;
}



?>