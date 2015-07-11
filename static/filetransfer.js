'use strict'
$(document).ready(readyFunction);

function readyFunction() {
	/*document.querySelector('input[type=file]').onchange = function() {
		var file = this.files[0];
	};*/

	/* Initial Setup */
	var configuration = {
		'iceServers': [{
			'url': 'stun:stun.l.google.com:19302'
		}]
	};
	var roomURL = document.getElementById('url');
	var sendTextArea = document.getElementById('sendText');
	var receiveTextArea = document.getElementById('receiveText');

	var startButton = document.getElementById('startButton');
	var sendButton = document.getElementById('sendButton');
	var closeButton = document.getElementById('closeButton');

	startButton.disabled = false;
	sendButton.disabled = true;
	closeButton.disabled = true;

	startButton.onclick = createPeerConnection();

	var pC, dataChannel;
	var isInitiator;

	/* Signalling Server */
	var namespace = '';
	var socket = io.connect($SCRIPT_ROOT + namespace);

	var room = 'test';

	socket.on('connect', function() {
		console.log(this.socket.sessionid)
		socket.emit('got connected', this.socket.sessionid);
	});

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
		inInitiator = false;
		allowTextEntry();
	});

	socket.on('full', function(room) {
		console.log('Room : ' + room + 'is full. A new room will be created for you.');
		window.location.hash = '';
		window.location.reload();
	});

	socket.on('ready', function() {
		createPeerConnection(isInitiator, configuration);
	});

	socket.on('log', function(array) {
		console.log.apply(console, array);
	});

	socket.on('message', function(message) {
		console.log('Client received message:' + message);
		signallingMessageCallback(message);
	});

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
			pC.setRemoteDescription(new RTCSessionDescription(message), function() {}, logError);
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

	function createPeerConnection(isInitiator, configuration) {
		console.log('Creating peer connection, initiator' + isInitiator + ' config: ' + configuration);
		pC = new RTCPeerConnection(configuration);

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
			dataChannel = pC.createDataChannel('text');
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

	function onDataChannelCreated(dataChannel) {
		console.log('onDataChannelCreated : ' + dataChannel);

		dataChannel.onopen = function() {
			console.log('The data channel : '+ dataChannel + ' is OPEN');
		};

		dataChannel.onmessage = handleMessage;
	}

	function handleMessage(event) {
		console.log('The received message is ' + event.data);
		receiveTextArea.value = event.data;
	}


	function allowTextEntry() {
		console.log('Starting to allow Text Entry');
		sendTextArea.disabled = false;
		sendTextArea.placeholder = "";
	}

	function logError(error) {
		console.log(error.toString(), error);
	}
}