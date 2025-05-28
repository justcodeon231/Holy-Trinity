// Configuration
const AIRTABLE_CONFIG = {
    API_KEY: 'YOUR_API_KEY', // Replace with your Airtable API key
    BASE_ID: 'YOUR_BASE_ID', // Replace with your base ID
    TABLE_NAME: 'Signups'
};

// Toast notification helper
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger reflow for animation
    toast.offsetHeight;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Theme Management with smooth transitions
    const themeToggle = document.querySelector('.theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    let isThemeTransitioning = false;

    function setTheme(theme, shouldScroll = true) {
        if (isThemeTransitioning) return;
        isThemeTransitioning = true;

        const root = document.documentElement;
        const currentScroll = window.scrollY;
        
        // Start transition
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Animate icon
        updateThemeIcon(theme);
        
        // Handle scroll position
        if (shouldScroll) {
            setTimeout(() => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 50);
        }

        // Reset transition lock
        setTimeout(() => {
            isThemeTransitioning = false;
        }, 300);
    }

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            icon.style.transform = 'rotate(0deg)';
        }, 150);
    }

    // Set initial theme
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        setTheme(currentTheme, false);
    } else if (prefersDarkScheme.matches) {
        setTheme('dark', false);
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
    });

    // Mobile Navigation Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Sticky Navbar
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            navbar.classList.remove('scrolled-down');
            return;
        }
        
        if (currentScroll > lastScroll && !navbar.classList.contains('scrolled-down')) {
            navbar.classList.add('scrolled-down');
        } else if (currentScroll < lastScroll && navbar.classList.contains('scrolled-down')) {
            navbar.classList.remove('scrolled-down');
        }
        
        lastScroll = currentScroll;
    });    // Form submission to Airtable with enhanced handling
    async function submitToAirtable(formData) {
        try {
            const submitButton = document.querySelector('.cta-button');
            submitButton.disabled = true;
            submitButton.textContent = 'Joining...';

            const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLE_NAME}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        'First Name': formData.get('firstName'),
                        'Last Name': formData.get('lastName'),
                        'Gender Interest': formData.get('gender'),
                        'Email': formData.get('email'),
                        'Phone': formData.get('phone'),
                        'Joined Date': new Date().toISOString()
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            showToast('Welcome to the Trinity family! 🙏');
            localStorage.setItem('formSubmitted', 'true');
            return true;
        } catch (error) {
            console.error('Error:', error);
            showToast('Something went wrong. Please try again.', 'error');
            return false;
        } finally {
            const submitButton = document.querySelector('.cta-button');
            submitButton.disabled = false;
            submitButton.textContent = 'Join The Trinity';
        }
    }

    // Form Handling
    const signupForm = document.getElementById('signupForm');
    const successMessage = document.getElementById('successMessage');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form
        const formData = new FormData(signupForm);
        let isValid = true;
        
        formData.forEach((value) => {
            if (!value.trim()) {
                isValid = false;
            }
        });

        if (isValid) {
            // Submit to Airtable
            const success = await submitToAirtable(formData);
            
            if (success) {
                // Show success message
                successMessage.classList.remove('hidden');
                signupForm.reset();

                // Hide success message after 5 seconds
                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 5000);
            } else {
                alert('There was an error submitting the form. Please try again.');
            }
        }
    });

    // Form field validation
    function validateFormField(input) {
        const field = input.getAttribute('name');
        const value = input.value.trim();
        
        let isValid = true;
        let errorMessage = '';
        
        switch(field) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                errorMessage = 'Please enter a valid email address';
                break;
            case 'phone':
                const phoneRegex = /^\+?[\d\s-]{10,}$/;
                isValid = phoneRegex.test(value);
                errorMessage = 'Please enter a valid phone number';
                break;
            default:
                isValid = value.length > 0;
                errorMessage = 'This field is required';
        }
        
        const errorElement = input.parentElement.querySelector('.error-message')
            || createErrorElement(input.parentElement);
        
        errorElement.textContent = isValid ? '' : errorMessage;
        return isValid;
    }

    function createErrorElement(parent) {
        const error = document.createElement('div');
        error.className = 'error-message';
        parent.appendChild(error);
        return error;
    }

    // Event Listeners for form fields
    const formInputs = document.querySelectorAll('.form-group input, .form-group select');
    formInputs.forEach(input => {
        input.addEventListener('blur', () => validateFormField(input));
        input.addEventListener('input', () => validateFormField(input));
    });

    // Check if form was already submitted
    if (localStorage.getItem('formSubmitted') === 'true') {
        const submitButton = document.querySelector('.cta-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Already Joined ✓';
    }

    // Smooth Scroll for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                navLinks.classList.remove('active');
            }
        });
    });
});
