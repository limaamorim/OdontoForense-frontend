document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebarMobile = document.querySelector('.sidebar-mobile');

  if (menuToggle && sidebarMobile) {
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
  }
});

// Ativa item do menu ao clicar
const menuItem = document.querySelectorAll('.item-menu');

function selectLink() {
  menuItem.forEach((item) =>
    item.classList.remove('ativo')
  );
  this.classList.add('ativo');
}

menuItem.forEach((item) =>
  item.addEventListener('click', selectLink)
);

// Expansão do menu lateral com salvamento no localStorage
const btnExp = document.querySelector('#btn-exp');
const menuSide = document.querySelector('.menu-lateral');

btnExp?.addEventListener('click', () => {
  menuSide.classList.toggle('expandir');
  localStorage.setItem('menuExpandido', menuSide.classList.contains('expandir'));
});

// Aplica o estado salvo do menu
document.addEventListener('DOMContentLoaded', () => {
  const estadoSalvo = localStorage.getItem('menuExpandido');
  if (estadoSalvo === 'true') {
    menuSide.classList.add('expandir');
  }
});

