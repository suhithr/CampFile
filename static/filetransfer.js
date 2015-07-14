'use strict'
$(document).ready(readyFunction);
/*
* Make text sharing work - Done
* Make it close the connection properly - Done
* Sort out room assignment, when the rooms are full
* Make it share files
*Fix Browser Interoperability Issues
*Integrate with the Download Index
*/
function readyFunction() {
	/*document.querySelector('input[type=file]').onchange = function() {
		var file = this.files[0];
	};*/

	/* Initial Setup */
	var iceServers = {
		'iceServers': [{
			'urls': 'stun:stun.l.google.com:19302'
		}],

	};

	var options = {
		optional: [
			{DtlsSrtpKeyAgreement: true}, //For Chrome to work with Firefox
			{RtpDataChannels: true} //For DataChannels to work on Firefox
		]
	};

	var theFile = null;
	var roomURL = document.getElementById('url');
	var fileInput = document.getElementById('file');
	var downloadLink = document.getElementById('dllink');

//	var restartButton = document.getElementById('restartButton');
	var sendButton = document.getElementById('sendButton');
	var closeButton = document.getElementById('closeButton');

//	restartButton.disabled = true;
	sendButton.disabled = true;
	closeButton.disabled = true;
//	restartButton.addEventListener('click', restartConnection);
	sendButton.addEventListener('click', sendData);
	closeButton.addEventListener('click', closeChannels);
	fileInput.addEventListener('change', getFile);

	var pC = null;
	var dataChannel = null;
	var isInitiator;
	var receiveBuffer, receivedSize, size;

	/* Signalling Server */
	var namespace = '';
	var id;
	var socket = io.connect($SCRIPT_ROOT + namespace);

	//Only create a room if it's not already there in the URL
	//var room = window.location.hash.substring(1);
	var room = 'test';
	if(!room) {
		room = window.location.hash = randomToken();
	}

	//This seems to be called only after the 'create and join' emit is called
	/*socket.on('connect', function() {
		console.log(this.socket.sessionid)
		socket.emit('got connected');
	}); */


	socket.on('ipaddr', function(ipaddr) {
		console.log('Server IP address is: ' + ipaddr);
		updateRoomURL(ipaddr);
	});

	socket.on('created', function(room, clientId) {
		console.log('Created a room: ' + room + ' - my client id is: ' + clientId);
		isInitiator = true;
		allowTextEntry();
	});

	socket.on('joined', function(room, clientId) {
		console.log('Joined a room : ' + room + ' - my client id is: ' + clientId);
		isInitiator = false;
		allowTextEntry();
	});

	socket.on('full', function(room, clientId) {
		//The idea is to create a new room for them
		console.log('Room : ' + room + ' is full. A new room will be created for you.');
		//window.location.hash = '';
		//window.location.reload();
		//For now when the room is full let it disconnect and redirect to the home page
		//socket.emit('fullsodisconnect', clientId);
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

	socket.on('disconnect', function() {
		socket.emit('disconnect');
	});

	socket.emit('got connected');

	socket.emit('create or join', room);

	

	if(location.hostname.match(/localhost|127\.0\.0/)) {
		socket.emit('ipaddr');
	}

	/* Send the message to Signalling Server */
	function sendMessage(message) {
		console.log('Client sending message: ', message);
		socket.emit('message', message);
	}

	/*Updates URL on the page so users can open in a new tab for checking */
	function updateRoomURL(ipaddr) {
		var url;
		if(!ipaddr) {
			url = location.href;
		}
		else {
			url = location.protocol + '//' + ipaddr + ':5000/#' + room;
		}
		roomURL.innerHTML = url;
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
				candidate: message.candidate
			}));
		}
		else if(message === 'bye') {
			//Cleanup RTC Connection?
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
			pC.createOffer(onLocalSessionCreated, logError);
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
			//restartButton.disabled = false;
		};

		dataChannel.onmessage = onReceiveMessage;
	}

	function onReceiveMessage(event) {


		if(typeof event.data === 'string') {
			size = parseInt(event.data);
			receiveBuffer = [];
			receivedSize = 0;
			console.log('Expecting a total of ' + size + ' bytes');
			return;
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


	function allowTextEntry() {
		console.log('Starting to allow Text Entry');
		//sendTextArea.disabled = false;
		//sendTextArea.placeholder = "";
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
/*
	function restartConnection() {
		closeChannels();
		console.log('Restarting the connection');
		isInitiator = true;
		createPeerConnection(isInitiator, iceServers, options);
	}
*/
	function closeConnection() {
		console.log('Closing the PeerConnection');
		pC.close();
	}

	/* Data Sending and UI */
	function sendData() {

		//Split datachannel message into proper sized chunks, getting the number of chunks
		var chunkLen = 16000;
		var file = theFile;
		var len = file.size;
		var n = len / chunkLen | 0;
		var blob;

		//Inform the file size to the recepient
		console.log('The filesize is ' + len + ' bytes');
		dataChannel.send(len);

		var sliceFile = function(offset) {
			var reader = new FileReader();
			reader.onload = (function() {
				return function(e) {
					dataChannel.send(e.target.result);
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
		var text = 'Click to download ' + data.name + ' of size ' + file.size + ' bytes';
		downloadLink.innerHTML = text;
		downloadLink.href = fileURL;
	}


	function getFile() {
		theFile = this.files[0];
		console.log('File got is: ' + theFile.name + ' with size: ' + theFile.size + ' with type: ' + theFile.type);
	}

}