// Enhanced Cart Drawer Functionality
document.addEventListener('DOMContentLoaded', function() {
  // References to cart drawer
  const cartDrawer = document.querySelector('cart-drawer');
  
  // Fix Add to Cart functionality
  setupAddToCartForms();
  
  // Force a cart refresh when the page loads
  refreshCart(false);
  
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
              
              // Wait a moment to ensure the cart is updated server-side
              setTimeout(() => {
                // Update cart and open drawer
                refreshCart(true);
              }, 300);
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
  }
  
  /**
   * Refresh cart contents and optionally open drawer
   */
  function refreshCart(openDrawer = false) {
    // First get the latest cart data
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        // Now get the rendered sections
        return fetch('/?sections=cart-drawer,cart-icon-bubble')
          .then(response => response.json())
          .then(sections => {
            // Check if we have valid section data
            if (sections && sections['cart-drawer']) {
              // Update cart drawer HTML
              const cartDrawerElement = document.getElementById('CartDrawer');
              if (cartDrawerElement) {
                const parsedDrawer = new DOMParser()
                  .parseFromString(sections['cart-drawer'], 'text/html')
                  .querySelector('#CartDrawer');
                
                if (parsedDrawer) {
                  cartDrawerElement.innerHTML = parsedDrawer.innerHTML;
                  
                  // Make sure all empty cart warnings are visible/hidden properly
                  const isEmptyCart = cart.item_count === 0;
                  const cartDrawerElement = document.querySelector('cart-drawer');
                  
                  if (cartDrawerElement) {
                    if (isEmptyCart) {
                      cartDrawerElement.classList.add('is-empty');
                    } else {
                      cartDrawerElement.classList.remove('is-empty');
                    }
                  }
                }
              }
              
              // Update cart icon/bubble count
              const cartIconBubble = document.getElementById('cart-icon-bubble');
              if (cartIconBubble && sections['cart-icon-bubble']) {
                const parsedIcon = new DOMParser()
                  .parseFromString(sections['cart-icon-bubble'], 'text/html')
                  .querySelector('.shopify-section');
                
                if (parsedIcon) {
                  cartIconBubble.innerHTML = parsedIcon.innerHTML;
                }
              }
              
              // Update free shipping bar
              updateFreeShippingBar(cart);
              
              // Open cart drawer if requested
              if (openDrawer && cart.item_count > 0) {
                if (cartDrawer && typeof cartDrawer.open === 'function') {
                  cartDrawer.open();
                } else if (cartDrawer && cartDrawer.classList) {
                  cartDrawer.classList.add('animate', 'active');
                  document.body.classList.add('overflow-hidden');
                }
              }
              
              // Re-initialize cart controls after refreshing content
              initializeCartControls();
            }
          });
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
        button.addEventListener('click', function(event) {
          event.preventDefault();
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
    .then(cart => {
      // Update the cart UI directly without a full refresh
      refreshCart(false);
      
      // Update the free shipping progress bar based on the new cart total
      updateFreeShippingBar(cart);
      
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
      
      // Show error message if available
      const lineItemError = document.getElementById(`CartDrawer-LineItemError-${line}`);
      if (lineItemError) {
        const errorText = lineItemError.querySelector('.cart-item__error-text');
        if (errorText) {
          errorText.textContent = 'Error updating quantity. Please try again.';
        }
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
  function updateFreeShippingBar(cart) {
    const freeShippingThreshold = 300000; // ₹3000 (in cents)
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
  
  // Add an event listener to ensure the cart drawer displays properly when opened
  if (cartDrawer) {
    // Ensure proper initialization when drawer is opened
    cartDrawer.addEventListener('click', function(event) {
      // Check if it's the cart icon or another element that should open the cart
      if (event.target.closest('#cart-icon-bubble') || event.target.id === 'cart-icon-bubble') {
        setTimeout(() => {
          // Force refresh the cart to ensure content is up to date
          refreshCart(true);
        }, 100);
      }
    }, true);
    
    // Also listen for the drawer becoming active
    cartDrawer.addEventListener('transitionend', function(event) {
      if (this.classList.contains('active') && this.classList.contains('animate')) {
        // If drawer is empty but we know there are items, force a refresh
        const emptyIndicator = this.querySelector('.cart-drawer__empty-content');
        const cartItemCount = document.querySelector('.cart-count-bubble');
        
        if (emptyIndicator && cartItemCount) {
          refreshCart(false);
        }
      }
    });
  }
});