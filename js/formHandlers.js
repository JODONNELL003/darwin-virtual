// Form handling extra functionality
document.addEventListener('DOMContentLoaded', function() {
    // This file only adds additional form functionality that's not in script.js
    // The main form handling is in script.js
    
    // Add a hidden timestamp field to the contact form if it doesn't exist
    const contactForm = document.querySelector('.contact-form');
    if (contactForm && !contactForm.querySelector('input[name="timestamp"]')) {
        const timestampInput = document.createElement('input');
        timestampInput.type = 'hidden';
        timestampInput.name = 'timestamp';
        contactForm.appendChild(timestampInput);
    }
}); 