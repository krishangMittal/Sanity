// Enhanced Cart Drawer Functionality

// Make sure DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // References to cart elements
  const cartDrawer = document.querySelector('cart-drawer');
  const addToCartForms = document.querySelectorAll('form[action*="/cart/add"]');
  const cartCheckoutButton = document.getElementById('CartDrawer-Checkout');
  
  // Fix Add to Cart functionality
  if (addToCartForms.length > 0) {
    addToCartForms.forEach(form => {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show loading state
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
          const originalText = submitButton.textContent;
          submitButton.textContent = 'Adding...';
          submitButton.disabled = true;
          
          // Use Fetch API to add to cart
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
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Update cart and open drawer
            updateCart();
          })
          .catch(error => {
            console.error('Error:', error);
            submitButton.textContent = originalText;
            submitButton.disabled = false;
          });
        }
      });
    });
  }
  
  // Function to update cart and open drawer
  function updateCart() {
    fetch('/cart.js', {
      credentials: 'same-origin',
      method: 'GET',
    })
    .then(response => response.json())
    .then(cart => {
      // Update free shipping progress bar
      updateFreeShippingProgress(cart);
      
      // Refresh cart contents
      refreshCartContents();
      
      // Open cart drawer
      if (cartDrawer) {
        cartDrawer.open();
      }
    })
    .catch(error => console.error('Error:', error));
  }
  
  // Function to refresh cart contents
  function refreshCartContents() {
    fetch('/?sections=cart-drawer,cart-icon-bubble')
      .then(response => response.json())
      .then(sections => {
        const cartDrawerElement = document.getElementById('CartDrawer');
        const cartIconBubble = document.getElementById('cart-icon-bubble');
        
        if (cartDrawerElement && sections['cart-drawer']) {
          const parsedDrawer = new DOMParser()
            .parseFromString(sections['cart-drawer'], 'text/html')
            .querySelector('#CartDrawer');
          
          if (parsedDrawer) {
            cartDrawerElement.innerHTML = parsedDrawer.innerHTML;
          }
        }
        
        if (cartIconBubble && sections['cart-icon-bubble']) {
          const parsedIcon = new DOMParser()
            .parseFromString(sections['cart-icon-bubble'], 'text/html')
            .querySelector('.shopify-section');
          
          if (parsedIcon) {
            cartIconBubble.innerHTML = parsedIcon.innerHTML;
          }
        }
        
        // Re-initialize quantity inputs and remove buttons after refreshing content
        initializeCartControls();
      })
      .catch(error => console.error('Error:', error));
  }
  
  // Function to initialize cart controls after cart updates
  function initializeCartControls() {
    // Initialize quantity inputs
    document.querySelectorAll('quantity-input').forEach(input => {
      if (typeof input.initialize === 'function') {
        input.initialize();
      }
    });
    
    // Initialize remove buttons
    document.querySelectorAll('cart-remove-button').forEach(button => {
      button.addEventListener('click', function() {
        const lineItem = button.closest('tr');
        if (lineItem && lineItem.dataset.index) {
          updateQuantity(lineItem.dataset.index, 0);
        }
      });
    });
  }
  
  // Function to update item quantity
  function updateQuantity(line, quantity) {
    const body = JSON.stringify({
      updates: {
        [line]: quantity
      },
      sections: ['cart-drawer', 'cart-icon-bubble']
    });
    
    fetch('/cart/update.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    })
    .then(response => response.json())
    .then(data => {
      updateFreeShippingProgress(data);
      refreshCartContents();
    })
    .catch(error => console.error('Error:', error));
  }
  
  // Update free shipping progress
  function updateFreeShippingProgress(cart) {
    // Check if the free shipping elements exist
    const shippingBarContainer = document.querySelector('.free-shipping-bar-container');
    if (!shippingBarContainer) return;
    
    const freeShippingThreshold = 5000; // $50.00 (in cents)
    const currentCartTotal = cart.total_price;
    const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentCartTotal);
    
    // Update progress bar width
    const progressBar = document.querySelector('.free-shipping-progress');
    const progressPercentage = Math.min(100, (currentCartTotal / freeShippingThreshold) * 100);
    
    if (progressBar) {
      progressBar.style.width = `${progressPercentage}%`;
    }
    
    // Update message
    const messageElement = document.querySelector('.free-shipping-message');
    if (messageElement) {
      if (remainingForFreeShipping > 0) {
        const formattedAmount = (remainingForFreeShipping / 100).toFixed(2);
        messageElement.textContent = `You're $${formattedAmount} away from Free Standard Shipping`;
      } else {
        messageElement.textContent = `You've qualified for Free Standard Shipping!`;
      }
    }
  }
  
  // Initial setup
  initializeCartControls();
  
  // Initial cart check to setup free shipping bar
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      updateFreeShippingProgress(cart);
    })
    .catch(error => console.error('Error:', error));
});