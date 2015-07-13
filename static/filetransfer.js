//'use strict'
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
	}
;
	var roomURL = document.getElementById('url');
	var fileInput = document.getElementById('file');
	var downloadLink = document.getElementById('dllink');
	//var sendTextArea = document.getElementById('sendText');
	//var receiveTextArea = document.getElementById('receiveText');

//	var restartButton = document.getElementById('restartButton');
	var sendButton = document.getElementById('sendButton');
	var closeButton = document.getElementById('closeButton');

//	restartButton.disabled = true;
	sendButton.disabled = true;
	closeButton.disabled = true;
	//sendTextArea.disabled = true;
	//sendTextArea.placeholder = 'Once the datachannel is ready you can enter text';
//	restartButton.addEventListener('click', restartConnection);
	sendButton.addEventListener('click', sendData);
	closeButton.addEventListener('click', closeChannels);
	

	var pC = null;
	var dataChannel = null;
	var isInitiator;

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
			dataChannel = pC.createDataChannel('text', {reliable: false});
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

		dataChannel.onmessage = (webrtcDetectedBrowser === 'firefox') ?
			receiveDataFirefox() : 
			receiveDataChrome();
	}

	function receiveDataFirefox() {
		var count, total, parts;

		return function onmessage(event) {
			if (typeof event.data === 'string') {
				total = parseInt(event.data);
				parts = [];
				count = 0;
				console.log('Expecting a total of ' + total + ' bytes');
				return;
			}
			parts.push(event.data);
			count += event.data.size;
			var diff = total - count;
			console.log('Got ' + event.data.size + ' bytes' + diff + ' to go.');

			if (count === total) {
				console.log('Assembling the file');
				var buf = new Uint8ClampedArray(total);
				var compose = function(i, pos) {
					var reader = new FileReader();
					reader.onload = function() {
						buf.set(new Uint8ClampedArray(this.result), pos);
						if ( i + 1 === parts.length) {
							console.log('Done. Rendering photo.');
							readyForDownload(buf);
						}
						else {
							compose(i + 1, pos + this.result.byteLength);
						}
					};
					reader.readAsArrayBuffer(parts[i]);
				};
				compose(0, 0);
			}
		};
	}

	function receiveDataChrome() {
		var buf;
		var count;
		return function onmessage(event) {
			if(typeof event.data === 'string') {
				buf = window.buf = new Uint8ClampedArray(parseInt(event.data));
				count = 0;
				console.log('Expecting a total of ' + buf.byteLength + ' bytes');
				return;
			}

			var data = new Uint8ClampedArray(event.data);
			buf.set(data, count);

			count += data.byteLength;
			console.log('Count: ' + count);

			if (count === buf.byteLength) {
				console.log('Done, file getting ready for download');
				readyForDownload(buf);
			}
		};
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
	function sendData(fileInput) {

		//Split datachannel message into proper sized chunks, getting the number of chunks
		var chunkLen = 16000;
		var file = fileInput.files[0];
		var len = file.data.byteLength;
		var n = len / chunkLen | 0;

		console.log('Sending a total of ' + len + ' bytes');
		dataChannel.send(len);

		//Now split the file and send each chunk
		for(var i = 0; i < n; i++) {
			var start = i * chunkLen;
			var end = (i + 1) * chunkLen;

			console.log(start + ' - ' + (end - 1));
			dataChannel.send(file.data.subarray(start, end));
		}

		//If there are remainders
		if( len % chunkLen) {
			console.log('last ' + len % chunkLen + ' byte(s)');
			dataChannel.send(file.data.subarray(n * chunkLen));
		}
		
	}

	function readyForDownload(data) {
		var fileURL = URL.createObjectURL(data);
		var text = 'Click to download ' + file.name + ' of size ' + file.size + ' bytes';
		downloadLink.innerHTML = text;
		downloadLink.href = fileURL;
	}


}