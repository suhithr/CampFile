$(document).ready(function () {

	var url = $SCRIPT_ROOT + '/results';

	$("input#searchbox").on('input',function () {
		searchBox = $("input#searchbox");
		if(searchBox.val() != " " && searchBox.val() != "" && searchBox.val() != "  " && searchBox.val() != "  " && searchBox.val() != "   " && searchBox.val() != "     ") {
			console.log("SearchBox value is: " + searchBox.val());
			var searchData = '{"query":"' + searchBox.val() + '"}';
			var JSONsearchData = JSON.parse(searchData);

			$.ajax({
				type: "POST",
				url: url,
				async: true,
				processData: false,
				contentType: 'application/json;charset=UTF-8',
				dataType: 'json',
				data: JSON.stringify(JSONsearchData),
				success: function(data) {
					console.log("And we're back");
					console.log(data.result);
				}
			});
		}
	});
});