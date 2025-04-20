class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
    
    // Add this new line - force refresh cart when the drawer is initialized
    this.refreshCart();
  }

  // Add this new method to refresh the cart
  refreshCart() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        if (cart.item_count > 0) {
          // If there are items but the drawer shows empty, refresh it
          if (this.classList.contains('is-empty')) {
            this.classList.remove('is-empty');
            this.querySelector('.drawer__inner').classList.remove('is-empty');
            
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
              });
          }
        }
      })
      .catch(error => console.error('Error fetching cart:', error));
  }
  
  // Add this method to update the free shipping bar
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
    if (!cartLink) return; // Add this check in case the element doesn't exist
    
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      // Add this line - refresh cart before opening
      this.refreshCart();
      this.open(cartLink);
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
    
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {this.classList.add('animate', 'active')});

    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.classList.contains('is-empty') ? this.querySelector('.drawer__inner-empty') : document.getElementById('CartDrawer');
      const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });

    document.body.classList.add('overflow-hidden');
  }

  // The rest of your existing methods...

  renderContents(parsedState) {
    if (this.querySelector('.drawer__inner').classList.contains('is-empty')) {
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    }
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      if (sectionElement && parsedState.sections[section.id]) {
        sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      }
    }));

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
      
      // Force update the free shipping bar
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          this.updateFreeShippingBar(cart);
        });
    });
  }
}

// The rest of your code remains the same...