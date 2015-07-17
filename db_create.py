from app import db
from models import *

#Configure the mappers BEFORE create_all()
db.configure_mappers()
db.create_all()


db.session.add(User('admin', 'admin', 'admin', 'admin', 'admin', 'admin', 'admin'))
db.session.add(filestable(name=u'gravity', filetype='mp4', size='14444', mediatype='movie'))
db.session.commit()
print filestable.query.search(u'gravity').all()