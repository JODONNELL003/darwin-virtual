// Security utility functions
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    // More thorough sanitization
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[^\w\s.,!?@-]/gi, '') // Only allow safe characters
        .trim();
}

function validateUrl(url) {
    try {
        const parsedUrl = new URL(url);
        // Whitelist of allowed domains
        const allowedDomains = [
            'darwinscans.com',
            'my.matterport.com',
            'cdnjs.cloudflare.com'
        ];
        // Check if URL is in allowed domains
        return allowedDomains.some(domain => parsedUrl.hostname.endsWith(domain)) &&
               (parsedUrl.protocol === 'https:' || 
                (parsedUrl.protocol === 'http:' && parsedUrl.hostname === 'localhost'));
    } catch {
        return false;
    }
}

// Resource access validation
function validateResourceAccess(path) {
    // Prevent directory traversal
    const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
    if (normalizedPath.includes('../') || 
        normalizedPath.includes('..\\') || 
        normalizedPath.includes('//')) {
        return false;
    }
    
    // Whitelist of allowed file extensions and paths
    const allowedExtensions = ['.html', '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const allowedPaths = ['/', '/about', '/contact', '/services', '/pages/about.html', '/pages/contact.html', '/pages/services/virtual-tours.html'];
    
    return allowedExtensions.some(ext => normalizedPath.endsWith(ext)) || 
           allowedPaths.includes(normalizedPath) ||
           normalizedPath.startsWith('/pages/');
}

document.addEventListener('DOMContentLoaded', function() {
    // Store initial viewport height
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Update viewport height on resize
    window.addEventListener('resize', () => {
        vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });

    // Update viewport height on orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }, 100);
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
    });

    // Add CSRF token to all AJAX requests
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
        document.addEventListener('ajax:beforeSend', function(e) {
            const xhr = e.detail[0];
            xhr.setRequestHeader('X-CSRF-Token', csrfToken);
        });
    }

    // Secure link handling
    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = link.getAttribute('href');
            if (!validateUrl(href) && !validateResourceAccess(href)) {
                e.preventDefault();
                console.error('Invalid resource access attempted');
                return;
            }
        });
    });

    // Secure image loading
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            // Replace broken images with a default
            img.src = 'images/placeholder.jpg';
        });
    });

    // Contact form submission with enhanced security
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Enhanced input sanitization
            const formData = new FormData(contactForm);
            let hasInvalidInput = false;
            
            for (let [key, value] of formData.entries()) {
                // Skip CSRF token and honeypot
                if (key === 'csrf_token' || key === 'website') continue;
                
                // Validate email separately
                if (key === 'email') {
                    if (!validateEmail(value)) {
                        hasInvalidInput = true;
                        break;
                    }
                    continue;
                }
                
                // Validate phone separately
                if (key === 'phone') {
                    if (value && !validatePhone(value)) {
                        hasInvalidInput = true;
                        break;
                    }
                    continue;
                }
                
                // General sanitization for other fields
                const sanitized = sanitizeInput(value);
                if (sanitized !== value || !validateLength(key, sanitized)) {
                    hasInvalidInput = true;
                    break;
                }
                formData.set(key, sanitized);
            }
            
            if (hasInvalidInput) {
                alert('Please check your input and try again.');
                return;
            }
            
            // Check honeypot
            if (formData.get('website')) {
                console.error('Bot submission detected');
                return;
            }
            
            // Rate limiting
            const lastSubmission = localStorage.getItem('lastFormSubmission');
            const now = Date.now();
            if (lastSubmission && now - parseInt(lastSubmission) < 60000) {
                alert('Please wait a minute before submitting again.');
                return;
            }
            
            // Store submission time
            localStorage.setItem('lastFormSubmission', now.toString());
            
            // Proceed with form submission
            submitForm(formData);
        });
    }

    // Instantly hide preloader if page is already loaded
    if (document.readyState === 'complete') {
        hidePreloader();
    } else {
        // Otherwise, hide it when the page loads
        window.addEventListener('load', hidePreloader);
        
        // Force hide preloader after max 300ms regardless of load state
        setTimeout(hidePreloader, 300);
    }
    
    // Function to hide preloader
    function hidePreloader() {
        const preloader = document.querySelector('.preloader');
        if (preloader && !preloader.classList.contains('loaded')) {
            preloader.classList.add('loaded');
            // Remove preloader from DOM after animation
            setTimeout(() => {
                if (preloader.parentNode) {
                    preloader.parentNode.removeChild(preloader);
                }
            }, 500);
        }
    }
    
    // Carousel functionality
    initCarousel();
    
    function initCarousel() {
        const carouselContainer = document.querySelector('.carousel-container');
        if (!carouselContainer) return;
        
        const slides = document.querySelectorAll('.carousel-slide');
        const prevBtn = document.querySelector('.carousel-control.prev');
        const nextBtn = document.querySelector('.carousel-control.next');
        const indicators = document.querySelectorAll('.carousel-indicators .indicator');
        
        let currentSlide = 0;
        let autoplayInterval;
        const autoplayDelay = 5000; // 5 seconds
        
        // Start autoplay
        startAutoplay();
        
        // Stop autoplay on hover
        carouselContainer.addEventListener('mouseenter', stopAutoplay);
        carouselContainer.addEventListener('mouseleave', startAutoplay);
        
        // Button controls
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                goToSlide(currentSlide - 1);
                stopAutoplay();
                setTimeout(startAutoplay, 10000); // Restart after 10 seconds of inactivity
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                goToSlide(currentSlide + 1);
                stopAutoplay();
                setTimeout(startAutoplay, 10000); // Restart after 10 seconds of inactivity
            });
        }
        
        // Indicator controls
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                goToSlide(index);
                stopAutoplay();
                setTimeout(startAutoplay, 10000); // Restart after 10 seconds of inactivity
            });
        });
        
        // Touch events for swipe
        let touchStartX = 0;
        let touchEndX = 0;
        
        carouselContainer.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        carouselContainer.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const threshold = 50; // Minimum swipe distance
            if (touchStartX - touchEndX > threshold) {
                // Swipe left, go next
                goToSlide(currentSlide + 1);
            } else if (touchEndX - touchStartX > threshold) {
                // Swipe right, go previous
                goToSlide(currentSlide - 1);
            }
        }
        
        function goToSlide(index) {
            // Handle wrapping around
            if (index < 0) {
                index = slides.length - 1;
            } else if (index >= slides.length) {
                index = 0;
            }
            
            // Remove active class from current slide and indicator
            slides[currentSlide].classList.remove('active');
            indicators[currentSlide].classList.remove('active');
            
            // Set new current slide and add active class
            currentSlide = index;
            slides[currentSlide].classList.add('active');
            indicators[currentSlide].classList.add('active');
        }
        
        function startAutoplay() {
            stopAutoplay(); // Clear any existing interval
            autoplayInterval = setInterval(() => {
                goToSlide(currentSlide + 1);
            }, autoplayDelay);
        }
        
        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        }
    }
    
    // Add instant page transitions
    document.querySelectorAll('a[href^="pages/"], a[href^="../"], a[href="index.html"], a[href="../index.html"], a[href="../../index.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            // Only intercept same-site links
            if (link.hostname === window.location.hostname) {
                // Store the href for navigation
                const href = link.getAttribute('href');
                // Start loading the new page in the background
                const xhr = new XMLHttpRequest();
                xhr.open('GET', href, true);
                xhr.send();
                
                // Show cursor feedback
                document.body.style.cursor = 'progress';
                
                // Allow the current page to begin transition (slight delay for visual feedback)
                setTimeout(() => {
                    window.location.href = href;
                }, 50);
                
                e.preventDefault();
            }
        });
    });
    
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainMenu = document.querySelector('.main-menu');
    const body = document.body;
    
    if (mobileMenuToggle && mainMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            mainMenu.parentElement.classList.toggle('active');
            body.style.overflow = mainMenu.parentElement.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mainMenu.parentElement.classList.contains('active') && 
                !mainMenu.contains(e.target) && 
                !mobileMenuToggle.contains(e.target)) {
                mobileMenuToggle.classList.remove('active');
                mainMenu.parentElement.classList.remove('active');
                body.style.overflow = '';
            }
        });

        // Close menu when clicking a link
        const menuLinks = mainMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                mainMenu.parentElement.classList.remove('active');
                body.style.overflow = '';
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                mobileMenuToggle.classList.remove('active');
                mainMenu.parentElement.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }
    
    // Mobile Dropdown Menus
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        if (window.innerWidth <= 768) {
            const link = dropdown.querySelector('a');
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });
    
    // Window resize handler
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
            mainMenu.classList.remove('active');
        }
    });
    
    // Add active class to current menu item
    const currentLocation = window.location.href;
    const menuItems = document.querySelectorAll('.main-menu a');
    
    menuItems.forEach(item => {
        if (item.href === currentLocation) {
            item.classList.add('active');
        }
    });
    
    // Lazy load background images
    const lazyBackgrounds = document.querySelectorAll('.project-image, .before-image, .after-image, .member-image');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const style = img.currentStyle || window.getComputedStyle(img, false);
                    const bgUrl = style.backgroundImage.slice(4, -1).replace(/"/g, '');
                    
                    if (bgUrl && bgUrl !== 'none') {
                        const tempImg = new Image();
                        tempImg.onload = function() {
                            img.classList.add('loaded');
                        };
                        tempImg.src = bgUrl;
                    }
                    
                    observer.unobserve(img);
                }
            });
        });
        
        lazyBackgrounds.forEach(bg => {
            bg.classList.add('lazy-image');
            imageObserver.observe(bg);
        });
    }
    
    // Reveal content on scroll
    const revealElements = document.querySelectorAll('.values-grid > *, .tech-feature, .feature-list > *, .project-card');
    
    if ('IntersectionObserver' in window) {
        const contentObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        revealElements.forEach(el => {
            el.classList.add('reveal-content');
            contentObserver.observe(el);
        });
    }
    
    // Simple fade-in animation for sections
    const sections = document.querySelectorAll('section');
    
    const fadeInOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
    };
    
    const fadeInObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, fadeInOptions);
    
    sections.forEach(section => {
        section.classList.add('fade-effect');
        fadeInObserver.observe(section);
    });
    
    // Update CSS for fade effect (since it wasn't in the CSS file)
    const style = document.createElement('style');
    style.textContent = `
        .fade-effect {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .fade-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
});

// Input validation helpers
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9+\-\s()]{10,20}$/;
    return phoneRegex.test(phone);
}

function validateLength(field, value) {
    const maxLengths = {
        name: 100,
        email: 254,
        phone: 20,
        subject: 100,
        message: 1000
    };
    return value.length <= (maxLengths[field] || 100);
}

// Secure form submission
function submitForm(formData) {
    const submitEndpoint = '/submit-form';
    
    fetch(submitEndpoint, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': formData.get('csrf_token')
        },
        body: formData,
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Thank you for your message. We will get back to you soon.');
            document.querySelector('.contact-form').reset();
        } else {
            throw new Error(data.message || 'Submission failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was a problem submitting your message. Please try again later.');
    });
} 