from flask import Flask, render_template, redirect, url_for, request, session, flash
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# In-memory storage for users (use a database in a real application)
users = {}

# Route for the signup page
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        # Handle the signup form submission here
        username = request.form['signup-username']
        password = request.form['signup-password']
        confirm_password = request.form['signup-confirm-password']
        
        # Check if the username already exists
        if username in users:
            flash('Username already exists. Please choose a different one.')
            return redirect(url_for('signup'))
        
        # Validate password and confirm password match
        if password != confirm_password:
            flash('Passwords do not match. Please try again.')
            return redirect(url_for('signup'))
        
        # Hash the password before storing it
        hashed_password = generate_password_hash(password, method='sha256')
        # Save the user details in the in-memory storage (replace with a database in production)
        users[username] = hashed_password
        
        # Flash success message and redirect to login
        flash('Signup successful! Please login.')
        return redirect(url_for('login'))
    
    return render_template('signup.html')

# Route for the login page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Handle the login form submission here
        username = request.form['username']
        password = request.form['password']

        # Validate login credentials
        if username not in users or not check_password_hash(users[username], password):
            flash('Invalid username or password. Please try again.')
            return redirect(url_for('login'))
        
        # If successful, store the user session and redirect to the home page
        session['user'] = username
        flash(f'Welcome, {username}!')
        return redirect(url_for('index'))

    return render_template('login.html')

# Route for the home page
@app.route('/')
def index():
    if 'user' in session:
        username = session['user']
        return render_template('index.html', username=username)
    else:
        return redirect(url_for('login'))

# Route for logging out
@app.route('/logout')
def logout():
    session.pop('user', None)
    flash('You have been logged out.')
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
