// JavaScript for Footer Dropdowns - No Toggle for About Section
document.addEventListener('DOMContentLoaded', function() {
  // Only apply the mobile dropdowns if we're on a mobile screen
  function setupFooterDropdowns() {
    const isMobile = window.innerWidth <= 750;
    
    // Get all footer columns
    const footerColumns = document.querySelectorAll('.footer-column');
    
    footerColumns.forEach(column => {
      // Skip the about section completely - it should never be a dropdown
      if (column.classList.contains('footer-about')) {
        // Always ensure the about section is open and has no dropdown behavior
        column.classList.add('mobile-footer-dropdown');
        column.classList.add('open');
        return; // Skip the rest of the loop for the about section
      }
      
      // Add the mobile dropdown class to other sections
      column.classList.add('mobile-footer-dropdown');
      
      // For desktop view
      if (!isMobile) {
        // On desktop, ensure all dropdowns are "open"
        column.classList.add('open');
        
        // Make sure headings don't have the click handler
        const heading = column.querySelector('h3');
        if (heading) {
          // Remove any existing after pseudo-element by forcing it empty via style
          heading.style.setProperty('--after-content', 'none');
        }
      } 
      // For mobile view
      else {
        // Remove open class first (in case it was previously set)
        column.classList.remove('open');
        
        const heading = column.querySelector('h3');
        if (heading) {
          // Remove any existing listeners
          const newHeading = heading.cloneNode(true);
          heading.parentNode.replaceChild(newHeading, heading);
          
          // Add click handler
          newHeading.addEventListener('click', function() {
            column.classList.toggle('open');
          });
        }
      }
    });
  }
  
  // Run on page load
  setupFooterDropdowns();
  
  // Run when window is resized
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(setupFooterDropdowns, 100);
  });
});