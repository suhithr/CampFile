from app import db, bcrypt

from flask.ext.sqlalchemy import SQLAlchemy, BaseQuery
from sqlalchemy_searchable import SearchQueryMixin, make_searchable
from sqlalchemy_utils.types import TSVectorType



class NameQuery(BaseQuery, SearchQueryMixin):
	pass


class filestable(db.Model):
	query_class = NameQuery
	__tablename__ = 'filestable'

	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.UnicodeText, nullable=False)
	filetype = db.Column(db.String, nullable=False)
	size = db.Column(db.String, nullable=False)
	#Movie, music, picture,etc
	mediatype = db.Column(db.String, nullable=False)
	ownerid = db.Column(db.String, nullable=False)
	ownerhostel = db.Column(db.String, nullable=False)
	search_vector = db.Column(TSVectorType('name'))

	def __init__(self, name, filetype, size, mediatype, ownerid, ownerhostel):
		self.name = name
		self.filetype  = filetype
		self.size = size
		self.mediatype = mediatype
		self.ownerid = ownerid
		self.ownerhostel = ownerhostel

	def __repr__(self):
		return "<Filename is '%s'" % (self.name)


class User(db.Model):
	__tablename__ = 'user'

	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String, nullable=False)
	password = db.Column(db.String, nullable=False)
	firstname = db.Column(db.String, nullable=False)
	lastname = db.Column(db.String, nullable=False)
	hostel = db.Column(db.String, nullable=False)
	room = db.Column(db.String, nullable=False)
	year = db.Column(db.String, nullable=False)


	def __init__(self, username, password, firstname, lastname, hostel, room, year):
		self.username = username
		self.password = bcrypt.generate_password_hash(password)
		self.firstname = firstname
		self.lastname = lastname
		self.hostel = hostel
		self.room = room
		self.year = year


	def is_authenticated(self):
		return True

	def is_active(self):
		return True

	def is_anonymous(self):
		return False

	def get_id(self):
		return unicode(self.id)

	def __repr__(self):
		return "<Username is '%s'" % (self.username)