from app import app
import unittest

#The first word of the method has to be test
class FlaskTestCase(unittest.TestCase):
	#Ensure Flask was set up correctly
	def test_index(self):
		tester = app.test_client(self)
		response = tester.get('/login', content_type='html/text')
		self.assertEqual(response.status_code, 200)

	# Ensure logout behaves correctly
	def test_logout(self):
		tester = app.test_client()
		tester.post('/login', data=dict(username="admin", password="admin"), follow_redirects=True)
		response = tester.get('/logout', follow_redirects=True)
		self.assertIn(b'You have been logged out', response.data)

	#Ensure main page needs user login
	def test_main_route_requires_login(self):
		tester = app.test_client()
		response = tester.get('/', follow_redirects=True)
		self.assertIn(b'Please login to view this page', response.data)


	#Ensure the uploading is there on the main page
	def test_uploading_exists_on_main_page(self):
		tester = app.test_client()
		response = tester.post(
			'/login',
			data=dict(username="admin", password="admin"),
			follow_redirects=True
		)
		self.assertIn(b'Pick a file to add', response.data)

if __name__ == '__main__':
	unittest.main() 	