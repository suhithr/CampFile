$( document ).ready( readyFunction );

function readyFunction() {
	var input = document.getElementById('files');
	var output = document.getElementById('output');
	input.onchange = function(e) {
		var files = e.target.files; //FileList
		for (var i = 0, f; f = files[i]; ++i) {
			output.innerText = output.innerText + files[i].webkitRelativePath + '\n';
			console.log("name " + f.name);
			console.log("size " + f.size);
			console.log("extn " + String(f.name.substr( f.name.lastIndexOf('.') + 1)));
		}
	}
	$("#fileform").submit( function(evnt) {

		var url = $SCRIPT_ROOT;
		//For getting file sizes
		var files = $('input[type="file"]').get(0).files;

		var sizes = [];
		var names = [];
		var extns = [];
		for(var i=0; file = files[i]; i++) {

			//File size in bytes
			//learn how to make it into a JSON string which can be sent to the server
			sizes.push('"' + String(file.size) + '"');
			names.push('"' + String(file.name) + '"');
			extns.push('"' + String(names[i].substr( names[i].lastIndexOf('.') + 1)));
		}



		var form_data = '{ "names" : [' + names + '], "sizes" : [' + sizes + '], "extensions" : [' + extns + ']}';
		var JsonFormData = JSON.parse(form_data);
		alert(JsonFormData);
		alert(JSON.stringify(JsonFormData));

		$.ajax({
			type: "POST", //Since the default is GET
			url: url,
			async: true, //so that it's asynchronous
			processData: false, //So it doesn't automatically get converted to strings
			contentType: 'application/json;charset=UTF-8', //So it doesn't set any header
			dataType: 'json',
			success: function() {
				alert("hi");
			},
			data: JSON.stringify(JsonFormData, null, '\t'),
		});
		//Prevent it from submitting the data by default
		evnt.preventDefault();
	});
}