from flask_wtf import Form
from wtforms import TextField, PasswordField, SelectField
from wtforms.validators import DataRequired, Length, EqualTo

class LoginForm(Form):
	username = TextField('Username', validators=[DataRequired()])
	password = PasswordField('Password', validators=[DataRequired()])


class RegisterForm(Form):
	firstname = TextField(
		'firstname',
		validators=[DataRequired()]
	)
	lastname = TextField(
		'lastname',
		validators=[DataRequired()]
	)
	hostel = SelectField(
		'hostel',
		choices=[('ambera', 'Amber A'), ('amberb', 'Amber B'), ('garneta', 'Garnet A'), ('garnetb', 'Garnet B'), ('garnetc', 'Garnet C'), ('zircona', 'Zircon A'), ('zirconb', 'Zircon B'), ('zirconc', 'Zircon C'),  ('agate', 'Agate'), ('diamond', 'Diamond'), ('coral', 'Coral'), ('jade', 'Jade')],
		validators=[DataRequired()]
	)
	room = TextField(
		'room',
		validators=[DataRequired()]
	)
	year = SelectField(
		'year',
		choices=[('first', 'First'), ('second', 'Second'), ('third', 'Third'), ('fourth', 'Fourth')],
		validators=[DataRequired()]
	)
	username = TextField(
		'username',
		validators=[DataRequired(), Length(min=3, max=25)]
	)
	password = PasswordField(
		'password',
		validators=[DataRequired(), Length(min=3, max=25)]
	)
	confirm = PasswordField(
		'Repeat Password',
		validators=[DataRequired(), EqualTo('password', message='Passwords must match.')]
	)


class SearchForm(Form):
	search = TextField('search', validators=[DataRequired()])