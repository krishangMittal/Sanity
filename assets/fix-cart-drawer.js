// fix-cart-drawer.js
(() => {
  let isProcessingAddToCart = false;

  async function handleAddToCart(event) {
    event.preventDefault();
    if (isProcessingAddToCart) return;

    isProcessingAddToCart = true;
    const form = event.currentTarget;
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';

    // show loading state
    if (submitBtn) {
      submitBtn.textContent = 'Adding…';
      submitBtn.disabled = true;
    }

    try {
      // 1) add to cart
      await fetch('/cart/add.js', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams(new FormData(form))
      }).then(r => r.json());

      // 2) fetch both sections in one call
      const sections = await fetch('/?sections=cart-drawer,cart-icon-bubble', {
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      }).then(r => r.json());

      // 3a) replace drawer HTML
      const drawerWrapper = document.getElementById('CartDrawer');
      if (drawerWrapper && sections['cart-drawer']) {
        const temp = document.createElement('div');
        temp.innerHTML = sections['cart-drawer'];
        const newDrawer = temp.querySelector('#CartDrawer');
        drawerWrapper.innerHTML = newDrawer.innerHTML;
      }

      // 3b) replace bubble HTML
      const bubble = document.querySelector('#cart-icon-bubble');
      if (bubble && sections['cart-icon-bubble']) {
        const temp2 = document.createElement('div');
        temp2.innerHTML = sections['cart-icon-bubble'];
        const newBubble = temp2.querySelector('#cart-icon-bubble');
        bubble.innerHTML = newBubble.innerHTML;
      }

      // 4) open the drawer
      const cartDrawerEl = document.querySelector('cart-drawer');
      if (cartDrawerEl) {
        // re-run animation & focus trap
        cartDrawerEl.open(form);
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
    } finally {
      // reset button + flag
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
      isProcessingAddToCart = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('form[action*="/cart/add"]')
      .forEach(form => form.addEventListener('submit', handleAddToCart));
  });
})();
