'use strict'

/*
* Make text sharing work - Done
* Make it close the connection properly - Done
* Sort out room assignment, when the rooms are full
* Make it share files - Done
* Make DataChannels much faster
* Make filesharing work in Chrome - Done
* Fix Browser Interoperability Issues - Done Note: Large files >50MB don't work from CHROME -> Firefox
* Fix issue with restarting -Done
* Make the connectione always work, or add something so user is prompted to reload if it fails
* Integrate with the rest of CampFile
*/
function readyFunction(room_name) {
	/*document.querySelector('input[type=file]').onchange = function() {
		var file = this.files[0];
	};*/

	/* Initial Setup */
	var iceServers = {
		'iceServers': [
			{url:'stun:stun.l.google.com:19302'},
			{url:'stun:stun1.l.google.com:19302'},
			{url:'stun:stun2.l.google.com:19302'},
			{url:'stun:stun3.l.google.com:19302'},
			{url:'stun:stun4.l.google.com:19302'},
			{url:'stun:stun.ekiga.net'},
			{url:'stun:stun.ideasip.com'},
			{url:'stun:stun.iptel.org'},
			{url:'stun:stun.rixtelecom.se'},
			{url:'stun:stun.schlund.de'},
			{url:'stun:stunserver.org'},
		]

	};

	var options = {
		optional: [
			{DtlsSrtpKeyAgreement: true}//, //For Chrome to work with Firefox
			//{RtpDataChannels: true} //For DataChannels to work on Firefox
		]
	};

	var sdpOptions = {
		offerToReceiveAudio: false,
		offerToReceiveVideo: false
	};
	var theFile = null;
	var roomURL = document.getElementById('url');
	updateRoomURL();
	var fileInput = document.getElementById('file');
	var downloadLink = document.getElementById('dllink');

	var restartButton = document.getElementById('restartButton');
	var sendButton = document.getElementById('sendButton');
	var closeButton = document.getElementById('closeButton');

	restartButton.disabled = true;
	sendButton.disabled = true;
	closeButton.disabled = true;
	restartButton.addEventListener('click', restartConnection);
	sendButton.addEventListener('click', sendData);
	closeButton.addEventListener('click', closeChannels);
	fileInput.addEventListener('change', getFile);
	window.addEventListener("unload", handleUnload);

	var restart = false;
	var pC = null;
	var dataChannel = null;
	var isInitiator;
	var receiveBuffer = [], receivedSize = 0, size;

	/* Signalling Server */
	var namespace = '';
	var id;
	var socket = io.connect($SCRIPT_ROOT + namespace);

	//Only create a room if it's not already there in the URL
	var room = room_name;


	console.log('Room ought to be: ' + room);

	//This seems to be called only after the 'create and join' emit is called
	/*socket.on('connect', function() {
		console.log(this.socket.sessionid)
		socket.emit('got connected');
	}); */

	socket.on('created', function(room, clientId) {
		console.log('Created a room: ' + room + ' - my client id is: ' + clientId);
		isInitiator = true;
	});

	socket.on('joined', function(room, clientId) {
		console.log('Joined a room : ' + room + ' - my client id is: ' + clientId);
		isInitiator = false;
		if(restart === true ) {
			isInitiator = true;
		}
	});

	socket.on('full', function(room, clientId) {
		//The idea is to create a new room for them
		console.log('Room : ' + room + ' is full. A new room will be created for you.');
		var newRoom = prompt('Enter a new room to join: ');
		window.location.reload();
	});

	socket.on('nowready', function() {
		//restartButton.disabled = false;
		createPeerConnection(isInitiator, iceServers, options);
	});


	socket.on('logger', function(array) {
		console.log.apply(console, array);
	});

	socket.on('message', function(message) {
		console.log('Client received message:' + message);
		signallingMessageCallback(message);
	});

	socket.on('disconnect', function(room) {
		socket.emit('on_disconnect', room);
	});

	socket.emit('got connected');

	socket.emit('create or join', room);

	/* Send the message to Signalling Server */
	function sendMessage(message) {
		console.log('Client sending message: ', message);
		socket.emit('message', message);
	}

	/*Updates URL on the page so users can open in a new tab for checking */
	function updateRoomURL() {
		roomURL.innerHTML = '<a href=' + window.location.href + '>' + window.location.href + '</a>';
		console.log('Updated URL is: ' + url);
	}

	function clue(text) {
		console.log((window.performance.now / 1000).toFixed(3) + ': ' + text);
	}

	/* PeerConnection and DataChannel */

	function signallingMessageCallback(message) {
		if(message.type === 'offer') {
			console.log('Got an offer, sending back an answer');
			pC.setRemoteDescription(new RTCSessionDescription(message), function() {
				pC.createAnswer(onLocalSessionCreated, logError);
			}, logError);

		}
		else if(message.type === 'answer') {
			console.log('Got an answer');
			pC.setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);
		}
		else if(message.type === 'candidate') {
			console.log("Adding an ICE Candidate");
			pC.addIceCandidate(new RTCIceCandidate({
				sdpMLineIndex: message.sdpMLineIndex,
				candidate: message.candidate
			}));
		}
		else if(message === 'bye') {
			//Cleanup RTC Connection
		}
	}

	function createPeerConnection(isInitiator, iceServers, options) {
		console.log('Creating peer connection, initiator ' + isInitiator + ' Ice Servers: ' + iceServers);
		pC = new RTCPeerConnection(iceServers, options);

		pC.oniceconnectionstatechange = handleICEConnectionStateChange;

		// send any ice candidate to the other peer
		pC.onicecandidate = function(iceevent) {
			console.log('onicecandidate event fired, event: ' + iceevent);
			if(iceevent.candidate) {
				sendMessage({
					type: 'candidate',
					label: iceevent.candidate.sdpMLineIndex,
					id: iceevent.candidate.sdpMid,
					candidate: iceevent.candidate.candidate
				});
			}
			else {
				console.log('The candidates have got over');
			}
		};

		
		// if it's the initiator it needs to create the data channel
		if(isInitiator) {
			console.log('Creating the data channel');
			dataChannel = pC.createDataChannel('fileChannel', {reliable: false});
			dataChannel.binaryType = "arraybuffer";
			onDataChannelCreated(dataChannel);

			console.log('Now creating an offer');
			pC.createOffer(onLocalSessionCreated, logError, sdpOptions);
		}
		else {
			pC.ondatachannel = function(event) {
				console.log('ondatachannel: ' + event.channel);
				dataChannel = event.channel;
				onDataChannelCreated(dataChannel);
			};
		}
	}

	function onLocalSessionCreated(descrip) {
		console.log('Local session create: ' + descrip);
		pC.setLocalDescription(descrip, function() {
			console.log('Sending the local description: ' + pC.localDescription);
			sendMessage(pC.localDescription);
		}, logError);
	}

	function onDataChannelCreated(dataChannel) {
		console.log('onDataChannelCreated : ' + dataChannel);

		dataChannel.onopen = function() {
			console.log('The data channel : '+ dataChannel + ' is OPEN');
			sendButton.disabled = false;
			closeButton.disabled = false;
			restartButton.disabled = false;
		};

		dataChannel.onmessage = onReceiveMessage;
	}

	function onReceiveMessage(event) {
		if(typeof event.data === 'string') {
			if(/^\d+$/.test(event.data) && !isNaN(event.data)) {
				size = parseInt(event.data);
				receiveBuffer = [];
				receivedSize = 0;
				console.log('Expecting a total of ' + size + ' bytes');
				return;
			}
			else {
				name = event.data;
				console.log("Received name is " + name);
				return;
			}
		}
		console.log('Received message ' + event.data.byteLength);
		receiveBuffer.push(event.data);
		receivedSize += parseInt(event.data.byteLength);
		console.log('Received message ' + receivedSize + ' so far');


		console.log(typeof(receivedSize) + ' and ' + typeof(size));
		if(receivedSize === size) {
			console.log('Everything has been received');
			var received = new window.Blob(receiveBuffer);
			receiveBuffer = [];
			readyForDownload(received);
		}
	}

	function handleMessage(event) {
		console.log('The received message is ' + event.data);
		//receiveTextArea.value = event.data;
	}


	function handleICEConnectionStateChange() {
		if(pC.iceConnectionState == 'disconnected') {
			console.log('The Client Disconnected');
		}
	}

	function logError(error) {
		console.log(error.toString(), error);
	}



	function closeChannels() {
		console.log('Closing DataChannels');
		dataChannel.close();
		closeConnection();
	}

	function restartConnection() {
		//restart = true;
		handleUnload();
		console.log('Restarting the connection');
		socket.emit('create or join', room);
		//isInitiator = true;
		createPeerConnection(isInitiator, iceServers, options);

	}

	function closeConnection() {
		console.log('Closing the PeerConnection');
		pC.close();
	}

	/* Data Sending and UI */
	function sendData() {

		//Split datachannel message into proper sized chunks, getting the number of chunks
		var chunkLen;
		if(webrtcDetectedBrowser === 'firefox') {
			chunkLen = 16000;
		}
		else { //Assuming it's chrome
			chunkLen = 16000;
		}	
		var file = theFile;
		var len = file.size;
		var n = len / chunkLen | 0;
		var blob;

		//Inform the file size to the recepient
		console.log('The filesize is : ' + len + ' bytes');
		dataChannel.send(len);
		console.log('The file name is : ' + file.name);
		dataChannel.send(file.name);

		var sliceFile = function(offset) {
			var reader = new FileReader();
			reader.onload = (function() {
				return function(e) {
					console.log('Buffered amount ' + dataChannel.bufferedAmount);
					if(dataChannel.bufferedAmount > 16000000 || dataChannel.readyState != 'open') {
						window.setTimeout(function() {
							dataChannel.send(e.target.result);
						}, 500);
					}
					else {
						dataChannel.send(e.target.result);
					}
					if( len > offset + e.target.result.byteLength) {
						window.setTimeout(sliceFile, 0, offset + chunkLen);
					}
				};
			})(file);
			var slice = file.slice(offset, offset + chunkLen);
			reader.readAsArrayBuffer(slice)
		};
		sliceFile(0);
	}


	function readyForDownload(data) {
		var fileURL = URL.createObjectURL(data);
		var text = 'Click to download ' + name + ' of size ' + size + ' bytes';
		downloadLink.innerHTML = text;
		downloadLink.download = name;
		downloadLink.href = fileURL;
	}


	function getFile() {
		theFile = this.files[0];
		console.log('File got is: ' + theFile.name + ' with size: ' + theFile.size + ' with type: ' + theFile.type);
	}

	function handleUnload() {
		console.log('Leaving the room');
		socket.emit('leave', room);
		console.log('Closing Data Channel');
		dataChannel.close();
		console.log('Closing peer connection');
		pC.close();
	}

}