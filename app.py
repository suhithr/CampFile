#!/usr/bin/python
from flask import Flask, render_template, url_for, request, session, redirect, flash
from werkzeug import secure_filename
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.bcrypt import Bcrypt
from flask.ext.socketio import SocketIO, emit, send, join_room, leave_room
from flask.ext.login import LoginManager, login_user, login_required, logout_user
#from flask.ext.uploads import save, Upload, delete
import os
import json
from forms import LoginForm, RegisterForm


#TODO
#Check why stuff is happening out of order - Done, cuz it's working
#Build on Homepage a way to upload the file details and display -Done
#Now, save to postgres database - Done
#Make login possible - Done
#Make it check passwords on line 81 - Done
#Allow folder upload in Chrome (USER FRIENDLINESS IS KING) - Done
#Find limits of folder upload 
#Read the flask-wtf docs on CSRF for sending it with the AJAX request
#Add an option to view the files in the index in the home page (after login that is)
#Add an option to change file names before uploading
#Add personal instant file sharing with WebRTC
#Make it to see only your hostel stuff and friends
#Add search
#See how big the files can go - Done, 100GB At once possible to be read by browser, not just make javascript break up the file while sending


#Creating the flask app and pointing to the config
app = Flask(__name__)
app.config.from_object('config.DevelopmentConfig')

#create database object
db = SQLAlchemy(app)

#create brypt object
bcrypt = Bcrypt(app)

#Create socketio server instance
socketio = SocketIO(app)

#create instance of Login Manager
login_manager = LoginManager()
login_manager.init_app(app)

from models import *

@app.route('/', methods=['GET', 'POST'])
@login_required
def home():
	if request.method == 'POST':
		receivedNames = request.json["names"]
		receivedSizes = request.json["sizes"]
		receivedExtns = request.json["extensions"]
		
		for i in range(0, len(receivedNames)):
			securename = secure_filename(receivedNames[i])
			qry = filestable(securename, receivedExtns[i], receivedSizes[i], 'misc')
			db.session.add(qry)
			db.session.commit()

		result = filestable.query.all()
		print result
		return render_template('index.html')
	return render_template('index.html')


login_manager.login_view = "login"
login_manager.login_message = "Please login to view this page"

@login_manager.user_loader
def load_user(userid):
	return User.query.filter(User.id == int(userid)).first()

@app.route('/login', methods=['GET', 'POST'])
def login():

	error = ''
	form = LoginForm(request.form)
	if request.method == 'POST': 
		if form.validate_on_submit():
			user = User.query.filter_by(username=request.form['username']).first()
			if user is not None and bcrypt.check_password_hash( user.password, request.form['password'] ):
				#session['logged_in'] = True
				result = login_user(user)
				print result
				flash('You are now logged in.')
				return redirect(url_for('home'))
			else:
				error = "Invalid Credentials, try again"
		else:
			render_template('login.html', form=form, error=error)
	return render_template('login.html', form=form)

@app.route('/newuser', methods=['GET', 'POST'])
def newuser():
	form = RegisterForm()
	if form.validate_on_submit():
		user = User(
			username=form.username.data,
			password=form.password.data
		)
		db.session.add(user)
		db.session.commit()
		login_user(user)
		return redirect(url_for('home'))
	return render_template('newuser.html', form=form)

@app.route('/logout')
@login_required
def logout():
	logout_user()
	flash('You have been logged out')
	return redirect(url_for('login'))


@app.route('/filetransfer')
def filetransfer():
	return render_template('filetransfer.html')

clients = {}

def logger(text):
	array = ['Message from server: ']
	array.append(text)
	emit('logger', array)

@socketio.on('got connected')
def handle_got_connected():
	print request.namespace.socket.sessid
	print('Received id: ' + str(request.namespace.socket.sessid))

@socketio.on('create or join')
def create_or_join(room):
	print 'Received request from clientid' + request.namespace.socket.sessid + ' to create or join room ' + room
	if str(room) in clients:
		clients[str(room)].append(request.namespace.socket.sessid)
		print 'Dictionary being updated'
	else:
		clients.update({ str(room): [request.namespace.socket.sessid]})
		print 'Dictionary entry being created'

	numClients = len(clients[str(room)])
	print numClients
	if numClients <= 1:
		join_room(str(room))
		logger('Client ID ' + request.namespace.socket.sessid + ' created room ' + str(room))
		print 'Client ID ' + request.namespace.socket.sessid + ' created room ' + room
		emit('created', room, request.namespace.socket.sessid)
	elif numClients == 2:
		logger('Client ID ' + request.namespace.socket.sessid + ' joined room ' + str(room))
		print 'Client ID ' + request.namespace.socket.sessid + ' joined room ' + room
		join_room(str(room))
		emit('joined', room, request.namespace.socket.sessid)
		emit('nowready', room=room) #This sends it to all the clients FROM the server since the socketio
	else:#Max 2 clients
		print "Room is full"
		emit('full', room)

@socketio.on('message')
def message(message):
	logger('Client said: ' + str(message))
	emit('message', message, broadcast=True)

@socketio.on('on_disconnect')
def on_disconnect(room):
	print 'Client id '+ request.namespace.socket.sessid +' disconnected'
	if str(room) in clients:
		if request.namespace.socket.sessid in clients[str(room)] is not None:
			print 'Removed'
			clients[room].remove(request.namespace.socket.sessid)

@socketio.on('leave')
def on_leave(room):
	if str(room) in clients:
		if request.namespace.socket.sessid in clients[str(room)]:
			logger('Client id ' + request.namespace.socket.sessid + ' has left the room ' + room)
			print 'Client id ' + request.namespace.socket.sessid + ' has left the room ' + room
			leave_room(str(room))
			clients[str(room)].remove(request.namespace.socket.sessid)


#start the server with the run method
if __name__ == '__main__':
	socketio.run(app)