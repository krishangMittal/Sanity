document.addEventListener('DOMContentLoaded', function () {
  const menus = document.querySelectorAll('details.mega-menu');
  const body = document.body;

  function setupMegaMenuBehavior(menus) {
    if (window.innerWidth < 750) return;

    menus.forEach(menu => {
      const summary = menu.querySelector('summary');
      const menuText = summary ? summary.textContent.trim() : 'Menu';

      menu.addEventListener('mouseenter', () => {
        menus.forEach(m => m !== menu && m.removeAttribute('open'));
        menu.setAttribute('open', true);
        body.classList.add('mega-menu-blur-active');
      });

      menu.addEventListener('mouseleave', () => {
        setTimeout(() => {
          const stillHovered = Array.from(menus).some(m =>
            m.matches(':hover') ||
            m.querySelector('.mega-menu__content')?.matches(':hover')
          );
          if (!stillHovered) {
            menu.removeAttribute('open');
            body.classList.remove('mega-menu-blur-active');
          }
        }, 50);
      });

      const menuContent = menu.querySelector('.mega-menu__content');
      if (menuContent) {
        menuContent.addEventListener('mouseenter', () => {
          body.classList.add('mega-menu-blur-active');
        });
        menuContent.addEventListener('mouseleave', () => {
          if (!menu.matches(':hover')) {
            body.classList.remove('mega-menu-blur-active');
          }
        });
      }
    });
  }

  if (menus.length > 0) setupMegaMenuBehavior(menus);

  window.addEventListener('resize', () => {
    if (window.innerWidth < 750) {
      body.classList.remove('mega-menu-blur-active');
    }
  });
});
