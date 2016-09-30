##CampFile
This is a website, that is meant to make filesharing easier in institutions where access to high-speed connectivity like LAN is limited. It allows users to share files securely P2P directly between their respective browsers. This is more secure and also saves on server bandwidth.

####Download Index
With this part of the app, the metadata (Filename, Type, Size, Owner, etc) gets uploaded. Multi-Folder Upload is supported only in Google Chrome. 

####P2P File Transfer
Selected files of limited size can be sent between users via WebRTC DataChannels.

####Running For Multiple Clients:
This Works better with a gunicorn server. Instead of running `$ python app.py`
run `gunicorn --worker-class socketio.sgunicorn.GeventSocketIOWorker app:app`

######Usage:
* The route is `/filetransfer` 
* Create 2 connections(open 2 tabs at this route)
* Check `console` for message `DataChannel is OPEN`.
* Now browse your file system and select a file to send
* Click `send` and watch progress from the receiver's `console`
* When transfer is complete right click the link and click `Save Link As..`, in Firefox some files can be viewed in the browser itself, by `Open Link in New Tab`

##TODO:
- [ ] Show User Progress of indexing
- [ ] Allow users to request for files as a community
- [ ] Put gunicorn behind nginx, to protect against DDOS