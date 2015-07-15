##CampFile(Under Construction)
This is a Flask App, that is meant to make filesharing easier in institutions where access to high-speed connectivity like LAN is limited.
####Download Index
With this part of the app, the metadata (Filename, Type, Size, Owner, etc) gets uploaded. Multi-Folder Upload is supported only in Google Chrome. 

####P2P File Transfer
Selected files of limited size can be sent between users via WebRTC DataChannels.

##TODO:
- [x] Fetch metadata of files
- [x] Implement Ajax Request to send Data to Database
- [x] Implement multi-folder upload
- [ ] Show User Progress of indexing
- [x] Create Peer Connection and DataChannel
- [x] Implement sending of text between peers
- [x] Implement sending of files between peers
- [x] Chunking and Assembling of Files
- [x] Provide Chrome Functionality
- [ ] Provide cross-browser functionality *Done to a limited extent*
- [ ] Integrate with login for CampFile