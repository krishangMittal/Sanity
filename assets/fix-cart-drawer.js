// Create a file called fix-cart-drawer.js and add this code
// Add this flag at the top of the file
let isProcessingAddToCart = false;



document.addEventListener('DOMContentLoaded', function() {
  // Function to refresh cart contents
  function forceRefreshCart() {
    // Get cart data
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        // Skip if cart is empty
        if (cart.item_count === 0) return;
        
        // If cart has items but drawer shows empty, fix it
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer && cartDrawer.classList.contains('is-empty')) {
          cartDrawer.classList.remove('is-empty');
          
          // Also remove is-empty from inner elements
          const drawerItemsElement = cartDrawer.querySelector('cart-drawer-items');
          if (drawerItemsElement && drawerItemsElement.classList.contains('is-empty')) {
            drawerItemsElement.classList.remove('is-empty');
          }
          
          // Force a reload of the cart drawer
          fetch('/?sections=cart-drawer')
            .then(response => response.json())
            .then(sections => {
              const drawerContent = document.getElementById('CartDrawer');
              if (drawerContent && sections['cart-drawer']) {
                const tempElement = document.createElement('div');
                tempElement.innerHTML = sections['cart-drawer'];
                const newContent = tempElement.querySelector('#CartDrawer');
                if (newContent) {
                  drawerContent.innerHTML = newContent.innerHTML;
                  
                  // Update subtotal
                  const totalElement = document.querySelector('.totals__subtotal-value');
                  if (totalElement) {
                    totalElement.textContent = 'Rs. ' + (cart.total_price / 100).toFixed(2);
                  }
                  
                  // Enable checkout button
                  const checkoutButton = document.getElementById('CartDrawer-Checkout');
                  if (checkoutButton) {
                    checkoutButton.disabled = false;
                  }
                }
              }
            });
        }
      });
  }
  
  // Override the add to cart behavior
  const addToCartForms = document.querySelectorAll('form[action*="/cart/add"]');
  
  if (addToCartForms.length > 0) {
    addToCartForms.forEach(form => {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show loading state
        const submitButton = form.querySelector('[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : '';
        if (submitButton) {
          submitButton.textContent = 'Adding...';
          submitButton.disabled = true;
        }
        
        // Add to cart using fetch
        fetch('/cart/add.js', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: new URLSearchParams(new FormData(form))
        })
        .then(response => response.json())
        .then(data => {
          // Reset button
          if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
          }
          
          // Wait a bit to ensure cart is updated
          setTimeout(() => {
            forceRefreshCart();
            
            // Open cart drawer
            const cartDrawer = document.querySelector('cart-drawer');
            if (cartDrawer) {
              cartDrawer.classList.add('animate', 'active');
              document.body.classList.add('overflow-hidden');
            }
          }, 500);
        })
        .catch(error => {
          console.error('Error:', error);
          if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
          }
        });
      });
    });
  }
  
  // Also refresh cart when clicking cart icon
  const cartIcon = document.getElementById('cart-icon-bubble');
  if (cartIcon) {
    cartIcon.addEventListener('click', function(event) {
      forceRefreshCart();
    }, true);
  }
  
  // Run immediately in case cart already has items
  forceRefreshCart();
});