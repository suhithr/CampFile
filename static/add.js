$( document ).ready( readyFunction );

function readyFunction() {
	var sizes = [];
	var names = [];
	var extns = [];
	var calextn = "";
	var input = document.getElementById('thefiles');
	var output = document.getElementById('output');
	var url = $SCRIPT_ROOT + '/add';



	var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	if (isChrome) {
		$("div.instructions").text("Select the folder you wish to scan.");
		$("input#files").text('Choose Folder');
	}
	else {
		$("div.instructions").text("Select the files you wish to scan.");
	}

	input.onchange = function(e) {
		var movieButton = document.getElementById('movie');
		var musicButton = document.getElementById('music');
		var tvButton = document.getElementById('tv');
		var otherButton = document.getElementById('other');
		var allowedExtns = [];
			if(movieButton.checked || tvButton.checked) {
				allowedExtns.push('mp4','3gp','avi','flv','m4v','mov','mkv');
			}
			if(musicButton.checked) {
				allowedExtns.push('mp3');
				allowedExtns.push('wav');
				allowedExtns.push('flac');
				allowedExtns.push('la');
				allowedExtns.push('aiff');
				allowedExtns.push('m4a');
				allowedExtns.push('wma');
				allowedExtns.push('aac');
			}

		console.log('Allowed extns : ' + allowedExtns);

		var files = e.target.files; //FileList
		for (var i = 0, f; f = files[i]; ++i) {			

			
			console.log("name " + f.name);
			console.log("size " + f.size);
			console.log("extn " + String(f.name.substr((~-f.name.lastIndexOf(".") >>> 0) + 2 ) ));
			
			var calextn = f.name.substr((~-f.name.lastIndexOf(".") >>> 0) + 2);
			calextn = String(calextn).toLowerCase();

			if(musicButton.checked || tvButton.checked || movieButton.checked) {
				if(allowedExtns.indexOf(calextn) > -1 ) {
					console.log('Allowed');
					if( calextn === ""){
						extns.push('""');
					}
					else {
						extns.push('"' + calextn + '"');
					}
					sizes.push('"' + String(f.size) + '"');
					names.push('"' + String(f.name) + '"');

					$("div#output").append("<input class=" + f.name + " value=" + f.name + "></input><br>");
				}
			}
			else {
				//Dirty Fix for filename with no extension
				if( calextn === ""){
					extns.push('""');
				}
				else {
					extns.push('"' + calextn + '"');
				}
				sizes.push('"' + String(f.size) + '"');
				names.push('"' + String(f.name) + '"');
				output.append('<input class=' + f.name + ' value=' + f.name + '></input><br>');
			}	
		}
		
		var form_data = '{ "names" : [' + names + '], "sizes" : [' + sizes + '], "extensions" : [' + extns + ']}';
		console.log(form_data);
		//Converts JSON String to an object, also check JSON Validity of string
		var JsonFormData = JSON.parse(form_data); 
		console.log(JsonFormData);
		$.ajax({
			type: "POST", //Since the default is GET
			url: url,
			async: true, //so that it's asynchronous
			processData: false, //So it doesn't automatically get converted to strings
			contentType: 'application/json;charset=UTF-8', //So it doesn't set any header
			dataType: 'json',
			success: function(data) {
				console.log("Data Received!");
			},
			data: JSON.stringify(JsonFormData, null, '\t'),
		});
	}
}