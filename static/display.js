function readyFunction(listFromDb) {
	for( var i=0; i < listFromDb.length; i++) {
		listFromDb[i].name = listFromDb.name.replace(/_/g," ");
		console.log(listFromDb[i].name);
	}
	button.addEventListener('click', requestSend);
	function requestSend() {

	}
}
