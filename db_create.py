from app import db
from models import *

db.create_all()
db.session.add(User('admin', 'admin'))
db.session.commit()