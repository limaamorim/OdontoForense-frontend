// Adicione isso antes do fechamento do </body>
    document.addEventListener('DOMContentLoaded', function() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebarMobile = document.querySelector('.sidebar-mobile');
        
        menuToggle.addEventListener('click', function() {
            sidebarMobile.classList.toggle('active');
        });
        
        // Fechar o menu quando um item for clicado
        const navLinks = document.querySelectorAll('.sidebar-mobile .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                sidebarMobile.classList.remove('active');
            });
        });
    });
