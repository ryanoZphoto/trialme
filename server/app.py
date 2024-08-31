import webbrowser
from flask import Flask, render_template, redirect, url_for, request, session, jsonify, flash
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with your actual secret key

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

# Create the database and tables
with app.app_context():
    db.create_all()

# Configuration variables
GOOGLE_CLIENT_ID = '56209455098-a7n40s97s18n2eln2e11h72qooqblbji.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = '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'
GOOGLE_OAUTH_REDIRECT_URI = 'http://localhost:8000/auth/callback'

# OAuth setup
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
    redirect_uri=GOOGLE_OAUTH_REDIRECT_URI,
)

# Route for the signup page
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['signup-username']
        password = request.form['signup-password']
        confirm_password = request.form['signup-confirm-password']
        
        # Check if passwords match
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return redirect(url_for('signup'))
        
        # Check if username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('Username already exists', 'error')
            return redirect(url_for('signup'))

        # Hash the password and create a new user
        hashed_password = generate_password_hash(password, method='sha256')
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/')
def home():
    if 'profile' not in session:
        return render_template('login.html')  # Render login page if not logged in
    else:
        return redirect(url_for('calculator'))  # Otherwise redirect to calculator

@app.route('/login')
def login():
    redirect_uri = url_for('authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/callback')
def authorize():
    token = google.authorize_access_token()
    user_info = google.parse_id_token(token, nonce=token.get('nonce'))  # Ensure nonce is passed safely
    session['profile'] = user_info
    return redirect(url_for('calculator'))

# Route for the calculator page
@app.route('/calculator')
def calculator():
    # Ensure user is logged in before accessing this page
    if 'profile' not in session:
        return redirect(url_for('login'))

    return render_template('index.html')

# Route to log out the user
@app.route('/logout')
def logout():
    session.pop('profile', None)
    return redirect(url_for('login'))

# API route to provide protected data
@app.route('/api/protected-data')
def protected_data():
    # Return some protected data here
    return jsonify({"message": "This is protected data"})

@app.route('/api/data')
def data():
    # Return data used for charts, for example:
    return jsonify({
        "actual": [198, 30, 60],  # Example data for actual macros
        "goal": [200, 50, 75]  # Example data for goal macros
    })

# API route to provide data
@app.route('/api/data')
def data():
    # Example data
    data = {
        "macro_data": [
            {"name": "Protein", "value": 198.0},
            {"name": "Fat", "value": 50.0},
            {"name": "Carbs", "value": 150.0}
        ]
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=8000)  
    webbrowser.open('http://localhost:8000', new=2)  # 'new=2' opens it in a new tab, if possible
