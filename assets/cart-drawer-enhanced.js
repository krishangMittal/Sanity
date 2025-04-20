
function ensureCartIsLoaded() {
  return new Promise((resolve) => {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        if (cart && cart.items) {
          // Cart is loaded and contains items data
          resolve(cart);
        } else {
          // Try again after a short delay
          setTimeout(() => {
            fetch('/cart.js')
              .then(response => response.json())
              .then(cart => resolve(cart))
              .catch(error => {
                console.error('Error loading cart:', error);
                resolve(null);
              });
          }, 500);
        }
      })
      .catch(error => {
        console.error('Error loading cart:', error);
        resolve(null);
      });
  });
}
// Enhanced Cart Drawer Functionality
document.addEventListener('DOMContentLoaded', function() {
  // References to cart drawer
  const cartDrawer = document.querySelector('cart-drawer');
  
  // Fix Add to Cart functionality by catching all add to cart forms
  setupAddToCartForms();
  
  // Initialize quantity inputs and remove buttons
  initializeCartControls();
  
  // Setup free shipping bar on page load
  updateFreeShippingBar();
  
  /**
   * Set up add to cart forms to open drawer on submission
   */
  function setupAddToCartForms() {
    const addToCartForms = document.querySelectorAll('form[action*="/cart/add"]');
    
    if (addToCartForms.length > 0) {
      addToCartForms.forEach(form => {
        form.addEventListener('submit', function(event) {
          event.preventDefault();
          
          // Show loading state on the button
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
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then(data => {
              // Reset button state
              submitButton.textContent = originalText;
              submitButton.disabled = false;
              
              // Update cart and open drawer
              refreshCart();
            })
            .catch(error => {
              console.error('Error:', error);
              submitButton.textContent = originalText;
              submitButton.disabled = false;
              
              // Display error message if needed
              const errorContainer = form.querySelector('.product-form__error-message-wrapper');
              if (errorContainer) {
                const errorMessage = errorContainer.querySelector('.product-form__error-message');
                if (errorMessage) {
                  errorMessage.textContent = 'Error adding item to cart. Please try again.';
                  errorContainer.classList.remove('hidden');
                  
                  // Hide error after 5 seconds
                  setTimeout(() => {
                    errorContainer.classList.add('hidden');
                  }, 5000);
                }
              }
            });
          }
        });
      });
    }
  }
  
  /**
   * Refresh cart contents and open drawer
   */
  function refreshCart() {
    fetch('/?sections=cart-drawer,cart-icon-bubble')
      .then(response => response.json())
      .then(sections => {
        // Update cart drawer HTML
        if (sections['cart-drawer']) {
          const cartDrawerElement = document.getElementById('CartDrawer');
          const parsedDrawer = new DOMParser()
            .parseFromString(sections['cart-drawer'], 'text/html')
            .querySelector('#CartDrawer');
          
          if (cartDrawerElement && parsedDrawer) {
            cartDrawerElement.innerHTML = parsedDrawer.innerHTML;
          }
        }
        
        // Update cart icon/bubble count
        if (sections['cart-icon-bubble']) {
          const cartIconBubble = document.getElementById('cart-icon-bubble');
          const parsedIcon = new DOMParser()
            .parseFromString(sections['cart-icon-bubble'], 'text/html')
            .querySelector('.shopify-section');
          
          if (cartIconBubble && parsedIcon) {
            cartIconBubble.innerHTML = parsedIcon.innerHTML;
          }
        }
        
        // Open cart drawer
        if (cartDrawer && typeof cartDrawer.open === 'function') {
          cartDrawer.open();
        } else if (cartDrawer && cartDrawer.classList) {
          // Fallback if open method is not available
          cartDrawer.classList.add('animate', 'active');
          document.body.classList.add('overflow-hidden');
        }
        
        // Re-initialize cart controls after refreshing content
        initializeCartControls();
        
        // Update free shipping bar
        updateFreeShippingBar();
      })
      .catch(error => console.error('Error refreshing cart:', error));
  }
  
  /**
   * Initialize quantity inputs and remove buttons
   */
  function initializeCartControls() {
    // Set up cart quantity change handlers
    const quantityInputs = document.querySelectorAll('.quantity__input');
    if (quantityInputs.length > 0) {
      quantityInputs.forEach(input => {
        input.addEventListener('change', debounce(function() {
          const line = input.dataset.index;
          const quantity = parseInt(input.value);
          
          if (line && quantity >= 0) {
            updateCartItemQuantity(line, quantity);
          }
        }, 300));
      });
    }
    
    // Set up quantity button handlers
    const quantityButtons = document.querySelectorAll('.quantity__button');
    if (quantityButtons.length > 0) {
      quantityButtons.forEach(button => {
        button.addEventListener('click', function() {
          const input = button.parentElement.querySelector('.quantity__input');
          if (!input) return;
          
          const currentValue = parseInt(input.value);
          const isPlus = button.name === 'plus';
          const newValue = isPlus ? currentValue + 1 : Math.max(currentValue - 1, 1);
          
          input.value = newValue;
          input.dispatchEvent(new Event('change'));
        });
      });
    }
    
    // Set up remove buttons
    const removeButtons = document.querySelectorAll('cart-remove-button button');
    if (removeButtons.length > 0) {
      removeButtons.forEach(button => {
        button.addEventListener('click', function() {
          const parent = button.closest('cart-remove-button');
          if (parent && parent.dataset.index) {
            updateCartItemQuantity(parent.dataset.index, 0);
          }
        });
      });
    }
  }
  
  /**
   * Update cart item quantity
   */
  function updateCartItemQuantity(line, quantity) {
    const body = JSON.stringify({
      updates: {
        [line]: quantity
      },
      sections: ['cart-drawer', 'cart-icon-bubble']
    });
    
    // Show loading spinner on the item being updated
    const lineItemError = document.getElementById(`CartDrawer-LineItemError-${line}`);
    const loadingOverlay = document.querySelector(`#CartDrawer-Item-${line} .loading-overlay`);
    
    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    fetch('/cart/update.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    })
    .then(response => response.json())
    .then(state => {
      // Update cart drawer content
      refreshCart();
      
      // Hide loading spinner
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      
      // Hide loading spinner
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
      }
      
      // Show error message
      if (lineItemError) {
        lineItemError.querySelector('.cart-item__error-text').textContent = 
          'Error updating quantity. Please try again.';
        lineItemError.classList.remove('hidden');
        
        // Hide error after 5 seconds
        setTimeout(() => {
          lineItemError.classList.add('hidden');
        }, 5000);
      }
    });
  }
  
  /**
   * Update free shipping progress bar
   */
  function updateFreeShippingBar() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const freeShippingThreshold = 300000; // ₹3000 (in cents) - adjust this value as needed
        const currentCartTotal = cart.total_price;
        const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentCartTotal);
        
        // Update progress bar width
        const progressBar = document.querySelector('.free-shipping-progress');
        if (progressBar) {
          const progressPercentage = Math.min(100, (currentCartTotal / freeShippingThreshold) * 100);
          progressBar.style.width = `${progressPercentage}%`;
        }
        
        // Update message
        const messageElement = document.querySelector('.free-shipping-message');
        if (messageElement) {
          if (remainingForFreeShipping > 0) {
            const formattedAmount = (remainingForFreeShipping / 100).toFixed(2);
            messageElement.textContent = `You're ₹${formattedAmount} away from Free Standard Shipping`;
          } else {
            messageElement.textContent = `You've qualified for Free Standard Shipping!`;
          }
        }
      })
      .catch(error => console.error('Error fetching cart:', error));
  }
  
  /**
   * Debounce function to prevent multiple rapid calls
   */
  function debounce(fn, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(context, args), delay);
    };
  }
});