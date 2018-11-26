'use strict';

function ObjPrint(obj={}){
	// SETUP //
	const O=this;
	
	if(!obj.window) throw 'Error: No window element passed to ObjPrint creation object.';
	O.window=obj.window;
	O.window.classList.add('objprint-window');
	
	if(!obj.explanationWindow) throw 'Error: No explanationWindow element passed to ObjPrint creation object.';
	O.explanationWindow=obj.explanationWindow;
	O.explanationWindow.classList.add('objprint-explanation');
	
	O.properties=obj.properties || {};
	O.unsetAction=obj.unsetAction || 'default';
	
	var container=null;

	// PUBLIC FUNCTIONS //
	
	O.print=function(obj){
		O.window.innerHTML='Loading...';
		
		container=document.createDocumentFragment();
		
		var openingBracket=document.createElement('p');
		openingBracket.className='objprint-bracket';
		openingBracket.innerHTML=Array.isArray(obj) ? '[' : '{';
		openingBracket.style.marginLeft='0em';
		container.appendChild(openingBracket);
		
		buildObjectList(obj,1);
		
		O.window.innerHTML='';
		O.window.appendChild(container);

		O.explanationWindow.innerHTML='Hover over a property to get info on it!';
	}

	// PRIVATE FUNCTIONS //
	
	// This is run for the overall object and sub-objects
	function buildObjectList(obj,level=1,depth='',name=''){
		container.className='objprint-container';
		
		var keys=Object.keys(obj);
		if(!Array.isArray(obj)) keys=keys.sort();
		
		for(var i=0;i<keys.length;i++){
			var value=obj[keys[i]];
			
			// Build line
			var lineEl=document.createElement('p');
			lineEl.className='objprint-line';
			lineEl.style.marginLeft=level+'em';
			
			container.appendChild(lineEl);
			
			// Build name
			var nameEl=document.createElement('span');
			nameEl.innerHTML=keys[i];
			if(!Array.isArray(obj)){
				nameEl.className='objprint-name';
				nameEl.dataset.call=depth+keys[i];
			}else{
				nameEl.dataset.call=depth+'#';
			}
			
			
			// What do we do with this?
			if(getPropertyText(nameEl.dataset.call)===null){
				if(O.unsetAction==='hide') continue;
				else nameEl.dataset.select='false';
			}else{
				nameEl.dataset.select='true';
			}
			
			nameEl.dataset.name=name+keys[i];
			
			lineEl.appendChild(nameEl);
			lineEl.insertAdjacentHTML('beforeend',': ');
			
			// Build value
			var valueEl=document.createElement("span");
			valueEl.dataset.value=nameEl.dataset.call;
			
			switch(typeof value){
				case 'number':
					valueEl.innerHTML=value;
					valueEl.className='objprint-number';
					break;
				case 'boolean':
					valueEl.innerHTML=(value ? 'true' : 'false');
					valueEl.className='objprint-boolean';
					break;
				case 'string':
					valueEl.innerText=JSON.stringify(value);
					valueEl.className='objprint-string';
					break;
				case 'object':
					if(value===null){
						valueEl.innerHTML='null';
						valueEl.className='objprint-null';
					}
					else{
						// Add the opening tag with its attributes if it's an HTML element
						if(value.tagName){
							var elementEl=document.createElement('span');
							elementEl.innerText=/^[^>]+?>/.exec(value.outerHTML)[0];
							elementEl.className='objprint-element';
							valueEl.appendChild(elementEl);
						}
						
						valueEl.insertAdjacentHTML('beforeend',Array.isArray(value) ? '[' : '{');
						buildObjectList(value,level+1,nameEl.dataset.call+'.',nameEl.dataset.name+'.');
					}
					break;
				case 'function':
					// Add parentheses to clarify that this is a function
					nameEl.dataset.name+='(';
				
					var functionText=/([^(]+)\(([^\)]*)\)(?={)/.exec(value.toString());
					
					valueEl.innerHTML=functionText[1]+'(';
					
					
					// Add function parameters if needbe
					if(functionText[2]!==''){
						nameEl.dataset.name+=functionText[2];
						
						var parameters=functionText[2].split(',');
						for(var ii=0;ii<parameters.length;ii++){
							var parameterEl=document.createElement('span');
							
							var parameterSplit=/([^=]+)(=.+)?/.exec(parameters[ii]);
							
							parameterEl.dataset.call=nameEl.dataset.call+'('+parameterSplit[1]+')';
							parameterEl.className='objprint-parameter';
							parameterEl.innerHTML=parameterSplit[1];
							
							parameterEl.dataset.name=nameEl.dataset.call+'('+functionText[2]+')';
							
							valueEl.appendChild(parameterEl);
							
							// What do we do with this?
							if(getPropertyText(parameterEl.dataset.call)===null){
								parameterEl.dataset.select='false';
							}else{
								parameterEl.dataset.select='true';
							}
							
							if(parameterSplit[2]) valueEl.insertAdjacentHTML('beforeend',parameterSplit[2]);
							
							if(ii<parameters.length-1){
								valueEl.insertAdjacentHTML('beforeend',',');
							}
							
							if(ii>5) break;
						}
					}
					
					nameEl.dataset.name+=')';
					
					valueEl.insertAdjacentHTML('beforeend',')');
					valueEl.className='objprint-function';
					
					break;
				case 'undefined':
					valueEl.innerHTML='undefined';
					valueEl.className='objprint-undefined';
					break;
				default: break;
			}
			
			lineEl.appendChild(valueEl);
		}
		
		var closingBracket=document.createElement('p');
		closingBracket.className='objprint-bracket';
		closingBracket.innerHTML=Array.isArray(obj) ? ']' : '}';
		closingBracket.style.marginLeft=(level-1)+'em';
		container.appendChild(closingBracket);
	}
	
	function getPropertyText(call){
		// See if it exists
		if(O.properties[call]){
			return O.properties[call];
		}else{
			// Try using wildcards in the text
			var split=call.split('.');
			for(var i=0;i<split.length;i++){
				var test=call.replace(split[i],'*');
				if(O.properties[test]){
					return O.properties[test];
					break;
				}
			}
		}
		
		return null;
	}
	
	// EVENT LISTENERS //
	
	O.window.addEventListener("mouseover",function(event){
		if(!event.target.dataset.call) return;
		if(event.target.dataset.select==='false') return;
		
		if(document.querySelector('.objprint-study')) document.querySelector('.objprint-study').classList.remove('objprint-study');
		
		event.target.classList.add('objprint-study');
		
		// Get the regex-safe name and find the last instance of it
		var searchString=event.target.innerHTML;
		var regex=new RegExp(searchString+'(?=(?:(?!'+searchString+').)*$)');
		
		// Only surround the relevant part of the name with strong tags
		var nameDisplay=event.target.dataset.name.replace(regex,'<strong>'+event.target.innerHTML+'</strong>');;
		
		O.explanationWindow.innerHTML=nameDisplay+": "+getPropertyText(event.target.dataset.call);
	});
}