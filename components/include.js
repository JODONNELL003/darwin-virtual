// Components include script
document.addEventListener('DOMContentLoaded', async function() {
    // Load header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        try {
            const headerResponse = await fetch('/components/header.html');
            const headerHtml = await headerResponse.text();
            headerContainer.innerHTML = headerHtml;
            
            // Initialize mobile menu after loading header
            initializeMobileMenu();
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }
    
    // Load footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        try {
            const footerResponse = await fetch('/components/footer.html');
            const footerHtml = await footerResponse.text();
            footerContainer.innerHTML = footerHtml;
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }
    
    // Initialize mobile menu functionality
    function initializeMobileMenu() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mainMenu = document.querySelector('.main-menu');
        const closeMenu = document.querySelector('.close-menu');
        const body = document.body;
        
        if (mobileMenuToggle && mainMenu) {
            // Toggle menu
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenuToggle.classList.toggle('active');
                mainMenu.classList.toggle('active');
                body.classList.toggle('menu-open');
            });
            
            // Close menu with X button
            if (closeMenu) {
                closeMenu.addEventListener('click', () => {
                    mobileMenuToggle.classList.remove('active');
                    mainMenu.classList.remove('active');
                    body.classList.remove('menu-open');
                });
            }
            
            // Close menu when clicking a link
            const menuLinks = mainMenu.querySelectorAll('a:not(.dropdown > a)');
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuToggle.classList.remove('active');
                    mainMenu.classList.remove('active');
                    body.classList.remove('menu-open');
                });
            });
        }
    }
}); 