// Fixed menu drawer script with working tabs
document.addEventListener('DOMContentLoaded', () => {
  // Get key elements
  const drawerContainer = document.getElementById('Details-menu-drawer-container');
  if (!drawerContainer) return;

  // Helper function to unlock scrolling
  function unlockScroll() {
    // Remove Shopify scroll-lock classes
    document.body.classList.remove('overflow-hidden', 'scroll-lock', 'fixed', 'menu-drawer-open');
    document.documentElement.classList.remove('overflow-hidden', 'scroll-lock', 'fixed');
    
    // Clear any inline style attribute
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    // Force a reflow + restore position
    void document.body.offsetHeight;
    window.scrollTo(window.scrollX, window.scrollY);
    
    // Force the header to stay sticky
    const header = document.querySelector('.header-wrapper');
    if (header) {
      header.style.position = 'fixed';
      header.style.top = '0';
      header.style.width = '100%';
      header.style.zIndex = '990';
    }
    
    // Fix specific Dawn theme header classes
    const stickyHeader = document.querySelector('sticky-header');
    if (stickyHeader) {
      stickyHeader.style.position = 'fixed';
      stickyHeader.style.top = '0';
      stickyHeader.style.width = '100%';
      stickyHeader.classList.add('shopify-section-header-sticky');
      stickyHeader.classList.remove('shopify-section-header-hidden');
    }
  }

  // Lock scrolling when menu is open
  function lockScroll() {
    document.body.classList.add('menu-drawer-open');
    document.body.style.overflow = 'hidden';
  }

  // Watch for drawer opening/closing
  drawerContainer.addEventListener('toggle', () => {
    if (drawerContainer.open) {
      lockScroll();
    } else {
      unlockScroll();
    }
  });

  // Set up tab navigation - FIXED VERSION
  const setupTabs = () => {
    const tabButtons = document.querySelectorAll('.menu-drawer__tabs button');
    if (!tabButtons.length) return;
    
    // Important: Replace all buttons with new ones to clear any existing event handlers
    tabButtons.forEach(oldBtn => {
      // Clone button without event listeners
      const newBtn = oldBtn.cloneNode(true);
      // Replace old with new
      if (oldBtn.parentNode) {
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      }
      
      // Add fresh click handler
      newBtn.addEventListener('click', function(e) {
        // Prevent any bubbling that might close the drawer
        e.stopPropagation();
        e.preventDefault();
        
        // Get the tab ID from the button's data attribute
        const tabId = this.getAttribute('data-tab');
        
        // Deactivate all tabs
        document.querySelectorAll('.menu-drawer__tabs button').forEach(btn => {
          btn.setAttribute('aria-selected', 'false');
        });
        
        // Hide all panels
        document.querySelectorAll('.menu-drawer__panel').forEach(panel => {
          panel.setAttribute('hidden', '');
        });
        
        // Activate this tab
        this.setAttribute('aria-selected', 'true');
        
        // Show the corresponding panel
        const panel = document.getElementById('drawer-panel-' + tabId);
        if (panel) {
          panel.removeAttribute('hidden');
        }
        
        // CRITICAL: prevent event from closing the drawer
        return false;
      });
    });
  };

  // Set up close buttons
  const setupCloseButtons = () => {
    const closeButtons = document.querySelectorAll('[data-action="close"]');
    
    // Replace all close buttons with new ones
    closeButtons.forEach(oldBtn => {
      // Clone button without event listeners
      const newBtn = oldBtn.cloneNode(true);
      // Replace old with new
      if (oldBtn.parentNode) {
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      }
      
      // Add fresh click handler
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        drawerContainer.open = false;
        unlockScroll();
      });
    });
  };

  // Prevent links inside the drawer from closing it
  const preventLinkPropagation = () => {
    // All links inside drawer need to have propagation stopped
    const allDrawerLinks = document.querySelectorAll('.menu-drawer a');
    allDrawerLinks.forEach(link => {
      // Skip close buttons
      if (link.getAttribute('data-action') === 'close') return;
      
      // Replace with cloned element to remove existing listeners
      const newLink = link.cloneNode(true);
      if (link.parentNode) {
        link.parentNode.replaceChild(newLink, link);
      }
      
      // Add click handler that stops propagation
      newLink.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    });
  };

  // Setup ESC key to close menu
  const setupKeyboardControls = () => {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerContainer.open) {
        drawerContainer.open = false;
        unlockScroll();
      }
    });
  };

  // Dawn-specific header fix
  const fixDawnHeader = () => {
    // Ensure the header is sticky
    const header = document.querySelector('.header-wrapper');
    if (header) {
      header.style.position = 'fixed';
      header.style.top = '0';
      header.style.width = '100%';
      header.style.zIndex = '990';
    }
    
    // Set body padding to match header height
    const headerHeight = header ? header.offsetHeight : 80;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    document.body.style.paddingTop = `${headerHeight}px`;
    
    // Fix all Dawn header classes
    const stickyHeader = document.querySelector('sticky-header');
    if (stickyHeader) {
      stickyHeader.classList.add('shopify-section-header-sticky');
      stickyHeader.classList.remove('shopify-section-header-hidden');
    }
  };

  // Initialize everything
  const init = () => {
    setupTabs();
    setupCloseButtons();
    preventLinkPropagation();
    setupKeyboardControls();
    fixDawnHeader();
    unlockScroll(); // Ensure scrolling is enabled on page load
  };
  
  // Run initialization
  init();
  
  // Re-run after window loads and on resize
  window.addEventListener('load', fixDawnHeader);
  window.addEventListener('resize', () => {
    fixDawnHeader();
  });
  
  // Also check if the drawer is open periodically to make sure it stays open
  // This prevents tabs from accidentally closing the drawer
  setInterval(() => {
    const isOpen = drawerContainer.hasAttribute('open');
    const summary = drawerContainer.querySelector('summary');
    
    if (isOpen && summary && summary.getAttribute('aria-expanded') !== 'true') {
      summary.setAttribute('aria-expanded', 'true');
    }
  }, 100);
});