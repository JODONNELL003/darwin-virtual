// Hero Slider functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log("Hero slider script loaded");
    // Hero Slider functionality
    const slides = document.querySelectorAll('.hero-slide');
    console.log("Found slides:", slides.length);
    let currentSlide = 0;
    
    function showSlide(index) {
        console.log("Showing slide", index);
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    // Show first slide immediately
    showSlide(0);
    
    // Rotate slides every 5 seconds
    setInterval(nextSlide, 5000);
    
    // Scroll indicator functionality
    const scrollIndicator = document.querySelector('.hero-scroll');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const showcase = document.querySelector('.showcase');
            if (showcase) {
                showcase.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Add intersection observer for transformation items
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.transformation-item').forEach(item => {
        observer.observe(item);
    });
}); 