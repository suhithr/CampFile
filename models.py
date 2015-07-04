from app import db

class filestable(db.Model):
	__tablename__ = 'filestable3'

	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String, nullable=False)
	filetype = db.Column(db.String, nullable=False)
	size = db.Column(db.String, nullable=False)
	#Movie, music, picture,etc
	mediatype = db.Column(db.String, nullable=False)

	def __init__(self, name, filetype, size, mediatype):
		self.name = name
		self.filetype  = filetype
		self.size = size
		self.mediatype = mediatype

	def __repr__(self):
		return "<Filename is '%s'" % (self.name)

class User(db.Model):
	__tablename__ = 'user1'

	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String, nullable=False)
	password = db.Column(db.String, nullable=False)

	def __init__(self, username, password):
		self.username = username
		self.password = password

	def __repr__(self):
		return "<Username is '%s'" % (self.username)