from app import db, bcrypt

from flask.ext.sqlalchemy import SQLAlchemy, BaseQuery
from sqlalchemy_searchable import SearchQueryMixin, make_searchable
from sqlalchemy_utils.types import TSVectorType



class NameQuery(BaseQuery, SearchQueryMixin):
	pass



class filestable(db.Model):
	query_class = NameQuery
	__tablename__ = 'filestable3'

	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.UnicodeText, nullable=False)
	filetype = db.Column(db.String, nullable=False)
	size = db.Column(db.String, nullable=False)
	#Movie, music, picture,etc
	mediatype = db.Column(db.String, nullable=False)
	search_vector = db.Column(TSVectorType('name'))

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
		self.password = bcrypt.generate_password_hash(password)

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