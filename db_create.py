from app import db
from models import *

db.create_all()

db.session.commit()