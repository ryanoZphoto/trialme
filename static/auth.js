// Event listener for showing the signup form
document.getElementById('show-signup').addEventListener('click', function(event) {
    event.preventDefault();
    document.querySelector('.login-section').classList.add('hidden');
    document.querySelector('.signup-section').classList.remove('hidden');
});

// Event listener for showing the login form
document.getElementById('show-login').addEventListener('click', function(event) {
    event.preventDefault();
    document.querySelector('.signup-section').classList.add('hidden');
    document.querySelector('.login-section').classList.remove('hidden');
});

// Event listener for signup form submission
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Perform signup logic here (e.g., send data to server)
    console.log('Signup:', { username, password });

    // Redirect to login page after successful signup
    document.querySelector('.signup-section').classList.add('hidden');
    document.querySelector('.login-section').classList.remove('hidden');
});

// Event listener for the signup form
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    // Perform signup logic here (e.g., send data to server)
    console.log('Signup:', { username, password });

    // Redirect to login page after successful signup
    document.querySelector('.signup-section').classList.add('hidden');
    document.querySelector('.login-section').classList.remove('hidden');
});

// Combined window.onload function
window.onload = function() {
    if (typeof google === 'undefined') {
        console.error("Google Sign-In library not loaded.");
        return;
    }
    google.accounts.id.initialize({
        client_id: 'YOUR_CLIENT_ID_HERE',
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.querySelector('.g_id_signin'),
        { theme: 'outline', size: 'large' }
    );
    google.accounts.id.prompt(); // Display One Tap
};

function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    // Here you would typically send this response to your server
}
