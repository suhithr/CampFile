#!/usr/bin/python
from flask import Flask, render_template, url_for, request, session, redirect, flash
from werkzeug import secure_filename
from flask.ext.sqlalchemy import SQLAlchemy
#from flask.ext.uploads import save, Upload, delete
import os
import json
from forms import LoginForm

ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])

#TODO
#Build on Homepage a way to upload the file details and display -Done
#Now, save to postgres database - Done
#Make login possible 
#Make it to see only your hostel stuff and friends
#Add search
#See how big the files can go
#Add personal instant file sharing with WebRTC


#Creating the flask app and pointing to the config
app = Flask(__name__)
app.config.from_object('config.DevelopmentConfig')

#create database object
db = SQLAlchemy(app)

from models import *

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET', 'POST'])
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
		'''
		listoffiles = request.files.getlist("files[]")
		#len(listoffiles) tells how many files are uploaded
		print listoffiles
		for uploaded_files in listoffiles:
			if uploaded_files:
				print uploaded_files.filename
				print uploaded_files.content_length
				secure_uploaded_files = secure_filename(uploaded_files.filename)
				qry = filestable(secure_uploaded_files, uploaded_files.mimetype, uploaded_files.content_length, 'image')
				db.session.add(qry)
				db.session.commit()

		result = filestable.query.all()
		print result
		return render_template('index.html', listoffiles=listoffiles)
		'''

	return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
	error = ''
	form = LoginForm(request.form)
	if request.method == 'POST': 
		if form.validate_on_submit():
			user = User.query.filter_by(username=request.form['username']).first()
			if user is not None:
				session['logged_in'] = True
				flash('You are now logged.')
				return redirect(url_for('home'))
			else:
				error = "Invalid Credentials, try again"
		else:
			render_template('login.html', form=form, error=error)
	return render_template('login.html', form=form)


#start the server with the run method
if __name__ == '__main__':
	app.run()