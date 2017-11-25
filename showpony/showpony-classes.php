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
						,"parts":<?php echo json_encode(array_slice(scandir($dirName),2));?>
						,"path":"<?php echo $dirName; ?>/"
					});
				}
			);
		</script>
	<?
}

?>