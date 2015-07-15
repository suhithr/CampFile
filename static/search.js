$(document).ready(function () {

	var url = $SCRIPT_ROOT + '/results';

	$("#searchbox").change(function () {
		searchBox = $("#searchbox");
		var searchData = '{"query":"' + searchBox.value + '"}';
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
				console.log(data.result);
			}
		});
	});
});