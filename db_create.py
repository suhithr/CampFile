from app import db
from models import *

#Configure the mappers BEFORE create_all()
db.configure_mappers()
db.create_all()


db.session.add(User('admin', 'admin', 'admin', 'admin', 'admin', 'admin', 'admin'))
db.session.add(User('aaa', 'aaa', 'a', 'a', 'agate', '1', 'first'))
db.session.add(User('bbb', 'bbb', 'b', 'b', 'bbb', '2', 'first'))
db.session.add(filestable(name=u'gravity', filetype='mp4', size='14444', mediatype='movie', ownerid='1', ownerhostel='agate'))
db.session.commit()