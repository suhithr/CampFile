$( document ).ready( readyFunction );

function readyFunction() {
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
		alert(form_data);
		var JsonFormData = JSON.parse(form_data);

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
		alert("helo");
		//Prevent it from submitting the data by default
		evnt.preventDefault();
	});
}