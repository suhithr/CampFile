$( document ).ready( readyFunction );

function readyFunction() {
	var sizes = [];
	var names = [];
	var extns = [];
	var calextn = "";
	var mtype = [];
	var input = document.getElementById('thefiles');
	var output = document.getElementById('output');
	var url = $SCRIPT_ROOT + '/add';
	var specType = '';
	$('#checkToggle').click(function() {
		$('input[type=checkbox]').trigger('click');
	});



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
				if(movieButton.checked) {
					specType = 'movie';
				}
				if(tvButton.checked) {
					specType = 'tv';
				}
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
				specType = 'music';
			}
			else {
				specType = 'other';
			}

		//Show the Add Files Button
		$('#addFiles').show();

		console.log('Allowed extns : ' + allowedExtns);

		var files = e.target.files; //FileList
		$("div#input").append("");
		for (var i = 0, f; f = files[i]; ++i) {			

			
			console.log("name " + f.name);
			console.log("size " + f.size);
			console.log("extn " + String(f.name.substr((~-f.name.lastIndexOf(".") >>> 0) + 2 ) ));
			
			var calextn = f.name.substr((~-f.name.lastIndexOf(".") >>> 0) + 2);
			calextn = String(calextn).toLowerCase();

			if(musicButton.checked || tvButton.checked || movieButton.checked) {
				if(allowedExtns.indexOf(calextn) > -1 ) {
					console.log('Allowed');

					//Replac ing spaces with hyphens
					var fId = f.name.replace(/\s+/g, "-");

					$("div#output").append("<div class="+ String(i) + "></div>");
					$("div." + String(i)).append("<input class=" + String(fId) + " id=" + String(fId) + " type='text'></input>\
						<input class=" + String(fId) +  " id=" + String(i) + " type='checkbox'></input>\
						<select id='mediatype" + String(i) +  "' name='mediatype'><option value='movie'>Movie</option><option value='tv'>TV</option>\
						<option value='music'>Music</option><option value='other'>Other</option></select>");
					document.getElementById(fId).defaultValue = String(f.name);
					$('mediatype' + this.id).find("option[val='" + specType + "']").attr("selected", "selected");
				}
			}
			else {
				//Replacing spaces with hyphens
				var fId = f.name.replace(/\s+/g, "-");

				$("div#output").append("<div class="+ String(i) + "></div>");
				$("div." + String(i)).append("<input class=" + String(fId) + " id=" + String(fId) + " type='text'></input>\
					<input class=" + String(fId) +  " id=" + String(i) + " type='checkbox'></input>\
					<select id='mediatype" + String(i) +  "' name='mediatype'><option value='movie'>Movie</option><option value='tv'>TV</option>\
					<option value='music'>Music</option><option value='other'>Other</option></select>");
				document.getElementById(fId).defaultValue = String(f.name);
				$('mediatype' + this.id).find("option[val='" + specType + "']").attr("selected", "selected");

			}	
		}

		//Sending the Checked Files
		$('#addFiles').click( function() {
			$('input[type=checkbox]').each(function () {
				if(this.checked) {

					var cbId = parseInt(this.id);
					
					var calextn = files[cbId].name.substr((~-files[cbId].name.lastIndexOf(".") >>> 0) + 2);
					calextn = String(calextn).toLowerCase();
					if( calextn === "") {
						extns.push('""');
					}
					else {
						extns.push('"' + calextn + '"');
					}

					sizes.push('"' + String(files[cbId].size) + '"');
					//Pushing the Name
					var newName = document.getElementById(this.className).value;
					names.push('"' + String(newName) + '"');

					var mtypeElem = $("select#" + fId);

					mtype.push('"' + + '"');

					//Hiding the sent textbox, then the checkbox
					$('div.' + this.id).hide(800);
					$('#' + this.id).hide(800);
				}
			});

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
		});
	}
}