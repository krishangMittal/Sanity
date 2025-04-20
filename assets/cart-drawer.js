class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
    
    // Force refresh cart when the drawer is initialized
    this.refreshCart();
  }

  // Add method to refresh the cart
  refreshCart() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        if (cart.item_count > 0) {
          // If there are items but the drawer shows empty, refresh it
          if (this.classList.contains('is-empty')) {
            this.classList.remove('is-empty');
            
            const drawerInner = this.querySelector('.drawer__inner');
            if (drawerInner && drawerInner.classList.contains('is-empty')) {
              drawerInner.classList.remove('is-empty');
            }
            
            // Fetch the updated cart drawer sections
            fetch('/?sections=cart-drawer,cart-icon-bubble')
              .then(response => response.json())
              .then(sections => {
                this.renderContents({
                  sections: sections,
                  id: cart.items[0].id
                });
                
                // Update free shipping bar
                this.updateFreeShippingBar(cart);
              })
              .catch(error => console.error('Error fetching cart sections:', error));
          } else {
            // Just update the free shipping bar if drawer isn't empty
            this.updateFreeShippingBar(cart);
          }
        }
      })
      .catch(error => console.error('Error fetching cart:', error));
  }
  
  // Add method to update the free shipping bar
  updateFreeShippingBar(cart) {
    const freeShippingThreshold = 300000; // ₹3000 (in cents)
    const currentCartTotal = cart.total_price;
    const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentCartTotal);
    
    // Update progress bar width
    const progressBar = this.querySelector('.free-shipping-progress');
    if (progressBar) {
      const progressPercentage = Math.min(100, (currentCartTotal / freeShippingThreshold) * 100);
      progressBar.style.width = `${progressPercentage}%`;
    }
    
    // Update message
    const messageElement = this.querySelector('.free-shipping-message');
    if (messageElement) {
      if (remainingForFreeShipping > 0) {
        const formattedAmount = (remainingForFreeShipping / 100).toFixed(2);
        messageElement.textContent = `You're ₹${formattedAmount} away from Free Standard Shipping`;
      } else {
        messageElement.textContent = `You've qualified for Free Standard Shipping!`;
      }
    }
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return; // Check in case the element doesn't exist
    
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      // Refresh cart before opening
      this.refreshCart();
      setTimeout(() => {
        this.open(cartLink);
      }, 100);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    
    // Refresh cart data before opening
    this.refreshCart();
    
    // Animation timeout
    setTimeout(() => {this.classList.add('animate', 'active')});

    this.addEventListener('transitionend', () => {
      // When drawer finishes opening, check again if it has content
      setTimeout(() => {
        if (this.classList.contains('active') && this.classList.contains('is-empty')) {
          // Double check if cart actually has items
          fetch('/cart.js')
            .then(response => response.json())
            .then(cart => {
              if (cart.item_count > 0) {
                this.refreshCart();
              }
            });
        }
      }, 100);
      
      const containerToTrapFocusOn = this.classList.contains('is-empty') ? this.querySelector('.drawer__inner-empty') : document.getElementById('CartDrawer');
      const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if(cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    const drawerInner = this.querySelector('.drawer__inner');
    if (drawerInner && drawerInner.classList.contains('is-empty')) {
      drawerInner.classList.remove('is-empty');
    }
    
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      if (sectionElement && parsedState.sections && parsedState.sections[section.id]) {
        sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      }
    }));

    setTimeout(() => {
      const overlay = this.querySelector('#CartDrawer-Overlay');
      if (overlay) {
        overlay.addEventListener('click', this.close.bind(this));
      }
      
      // Force update the free shipping bar
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          this.updateFreeShippingBar(cart);
        })
        .catch(error => console.error('Error updating shipping bar:', error));
    }, 100);
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer'
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ];
  }
  
  updateQuantity(line, quantity, name) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const cartDrawer = document.querySelector('cart-drawer');
        
        // Update cart drawer contents
        this.getSectionsToRender().forEach((section => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
          elementToReplace.innerHTML =
            this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
        }));
        
        // Update free shipping bar
        if (cartDrawer && typeof cartDrawer.updateFreeShippingBar === 'function') {
          fetch('/cart.js')
            .then(response => response.json())
            .then(cart => {
              cartDrawer.updateFreeShippingBar(cart);
            })
            .catch(error => console.error('Error updating shipping bar:', error));
        }

        this.disableLoading();
        
        // Update live regions for screen readers
        const cartStatus = document.getElementById('cart-live-region-text');
        if (cartStatus) {
          cartStatus.setAttribute('aria-hidden', false);
          setTimeout(() => {
            cartStatus.setAttribute('aria-hidden', true);
          }, 1000);
        }
      }).catch((e) => {
        this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        if (errors) {
          errors.textContent = window.cartStrings.error;
        }
        this.disableLoading();
      });
  }
}

document.querySelectorAll('.menu-drawer__tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    // deactivate all tabs/panels
    document.querySelectorAll('.menu-drawer__tabs button')
      .forEach(b => b.setAttribute('aria-selected','false'));
    document.querySelectorAll('.menu-drawer__panel')
      .forEach(p => p.setAttribute('hidden',''));

    // activate this tab + matching panel
    btn.setAttribute('aria-selected','true');
    document.getElementById('drawer-panel-' + btn.dataset.tab)
      .removeAttribute('hidden');
  });
});

// close on overlay or close-button click
document.querySelectorAll('[data-action="close"]').forEach(el => {
  el.addEventListener('click', () => {
    document.getElementById('Details-menu-drawer-container').removeAttribute('open');
  });
});

customElements.define('cart-drawer-items', CartDrawerItems);

// The existing code ends with this line

// Add the new code here
// Directly handle cart additions by listening for the 'add_to_cart' event
document.addEventListener('click', function(event) {
  // Check if the clicked element is an add to cart button
  if (event.target.closest('form[action*="/cart/add"] [type="submit"]')) {
    const form = event.target.closest('form[action*="/cart/add"]');
    
    if (form) {
      event.preventDefault();
      
      // Show loading state on the button
      const submitButton = form.querySelector('[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.textContent = 'Adding...';
        submitButton.disabled = true;
      }
      
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
        if (submitButton) {
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }
        
        // Force a full cart refresh before opening the drawer
        fetch('/cart.js')
          .then(response => response.json())
          .then(cart => {
            // Get the cart drawer sections
            return fetch('/?sections=cart-drawer,cart-icon-bubble')
              .then(response => response.json())
              .then(sections => {
                // Open the cart drawer after a small delay to ensure the content is ready
                setTimeout(() => {
                  const cartDrawer = document.querySelector('cart-drawer');
                  if (cartDrawer) {
                    // Manually update the cart drawer with the fetched sections
                    cartDrawer.renderContents({
                      sections: sections,
                      id: data.id
                    });
                  }
                }, 300);
              });
          });
      })
      .catch(error => {
        console.error('Error:', error);
        if (submitButton) {
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }
      });
    }
  }
}, true);