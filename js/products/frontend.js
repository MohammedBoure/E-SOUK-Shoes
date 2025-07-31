document.addEventListener('DOMContentLoaded', function() {
  let algeriaData = [];
  let products = {};
  let selectedProduct = null;
  let deliveryPrices = { price_to_office: 0, price_to_home: 0 };
  let currentQuantity = 1;
  let isLoading = false;

  const isProductsPage = window.location.pathname.includes('products.html') || window.location.pathname.endsWith('/');
  const isIndexPage = window.location.pathname.includes('index.html');

  function checkFormValidity() {
      let isFormValid = true;
      const errors = [];
      
      const requiredInputs = document.querySelectorAll('#orderForm input[required], #orderForm select[required]');
      
      requiredInputs.forEach(input => {
        const value = input.value.trim();
        const label = input.previousElementSibling?.textContent || input.name;
        
        if (!value || input.disabled) {
          isFormValid = false;
          input.classList.add('is-invalid');
          if (!input.disabled && !errors.includes(label)) {
            errors.push(label);
          }
        } else {
          input.classList.remove('is-invalid');
          input.classList.add('is-valid');
        }
      });
      
      const customerName = document.getElementById('customer_name')?.value.trim();
      const sizeInput = document.getElementById('size');
      const colorInput = document.getElementById('color');
      const size = sizeInput?.value;
      const color = colorInput?.value;
      
      if (!customerName) {
        isFormValid = false;
        showNotification('اسم الزبون مطلوب', 'error');
      }
      
      // Validate size and color only if there are multiple options available
      const hasSizeOptions = selectedProduct?.sizes?.length > 1; // أكثر من خيار واحد
      const hasColorOptions = selectedProduct?.colors?.length > 1;
      
      if (hasSizeOptions && !size) {
        isFormValid = false;
        showNotification('حجم الحذاء مطلوب', 'error');
        sizeInput?.classList.add('is-invalid');
      } else if (sizeInput) {
        sizeInput.classList.remove('is-invalid');
        sizeInput.classList.add('is-valid');
      }
      
      if (hasColorOptions && !color) {
        isFormValid = false;
        showNotification('لون الحذاء مطلوب', 'error');
        colorInput?.classList.add('is-invalid');
      } else if (colorInput) {
        colorInput.classList.remove('is-invalid');
        colorInput.classList.add('is-valid');
      }
      
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = !isFormValid;
        if (isFormValid) {
          submitBtn.classList.remove('btn-secondary');
          submitBtn.classList.add('btn-primary', 'pulse-button');
        } else {
          submitBtn.classList.remove('btn-primary', 'pulse-button');
          submitBtn.classList.add('btn-secondary');
        }
      }
  }

  const animateElement = (element, animation, duration = 300) => {
    element.style.animation = `${animation} ${duration}ms ease-in-out`;
    setTimeout(() => {
      element.style.animation = '';
    }, duration);
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 10000;
          transform: translateX(400px);
          transition: transform 0.3s ease;
          border: 1px solid #ddd;
          max-width: 90%;
        }
        .notification.show {
          transform: translateX(0);
        }
        .notification-success {
          border-color: #28a745;
        }
        .notification-error {
          border-color: #dc3545;
        }
        .notification-content {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          font-size: 14px;
          font-family: Arial, sans-serif;
        }
        .notification-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #666;
        }
        .request-btn, .whatsapp-btn {
          position: fixed;
          width: 50px;
          height: 50px;
          border: none;
          border-radius: 4px;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .request-btn {
          bottom: 20px;
          right: 20px;
          background: #007bff;
          color: white;
        }
        .whatsapp-btn {
          bottom: 80px;
          right: 20px;
          background: #25D366;
          color: white;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .loading-spinner {
          text-align: center;
          padding: 20px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .no-image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          background: #f5f5f5;
          color: #666;
          font-family: Arial, sans-serif;
        }
        .no-image-placeholder i {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .old-price {
          color: #999;
          text-decoration: line-through;
          font-size: 0.9em;
        }
        .current-price {
          color: #333;
          font-weight: bold;
        }
        .carousel-thumbnails {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }
        .carousel-thumbnails img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border: 2px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .carousel-thumbnails img.active {
          border-color: #007bff;
          transform: scale(1.1);
        }
        .carousel-thumbnails img:hover {
          border-color: #007bff;
        }
        .image-count {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
        }
        .option-button {
          margin: 5px;
          padding: 8px 15px;
          border: 2px solid #ddd;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }
        .option-button.active {
          border-color: #007bff;
          background: #007bff;
          color: white;
        }
        .option-button:hover {
          border-color: #0056b3;
          background: #f8f9fa;
        }
        .color-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin: 5px;
          border: 2px solid #ddd;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .color-button.active {
          border-color: #007bff;
          transform: scale(1.2);
        }
        .color-button:hover {
          border-color: #0056b3;
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    
    const closeBtn = notification.querySelector('.notification-close');
    const closeNotification = () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeNotification);
    setTimeout(closeNotification, 5000);
  };

  const setLoadingState = (element, loading) => {
    if (loading) {
      element.classList.add('loading');
      element.style.pointerEvents = 'none';
    } else {
      element.classList.remove('loading');
      element.style.pointerEvents = '';
    }
  };

  window.frontend = {
    getSelectedProduct: () => selectedProduct,
    getFormData: () => ({
      customerName: document.getElementById('customer_name')?.value.trim(),
      phone: document.getElementById('phone')?.value.trim(),
      deliveryType: document.getElementById('delivery_type')?.value,
      wilaya: document.getElementById('wilaya')?.value,
      commune: document.getElementById('commune')?.value,
      address: document.getElementById('address')?.value.trim(),
      units: currentQuantity,
      size: document.getElementById('size')?.value,
      color: document.getElementById('color')?.value
    }),
    resetForm: () => {
      const form = document.getElementById('orderForm');
      const communeSelect = document.getElementById('commune');
      const submitBtn = document.getElementById('submitBtn');
      const unitsInput = document.getElementById('units');
      const sizeButtons = document.querySelectorAll('#sizeButtons .option-button');
      const colorButtons = document.querySelectorAll('#colorButtons .color-button');
      const sizeInput = document.getElementById('size');
      const colorInput = document.getElementById('color');
      
      if (form) {
        form.reset();
        animateElement(form, 'fadeIn');
      }
      
      if (communeSelect) {
        communeSelect.innerHTML = '<option value="">اختر البلدية</option>';
        communeSelect.disabled = true;
      }
      
      sizeButtons.forEach(button => button.classList.remove('active'));
      colorButtons.forEach(button => button.classList.remove('active'));
      if (sizeInput) sizeInput.value = '';
      if (colorInput) colorInput.value = '';
      
      currentQuantity = 1;
      if (unitsInput) unitsInput.value = '1';
      deliveryPrices = { price_to_office: 0, price_to_home: 0 };
      updateDeliveryAndTotalPrice();
      checkFormValidity();
      
      showNotification('تم إعادة تعيين النموذج بنجاح', 'success');
    },
    disableSubmitButton: (disable) => {
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = disable;
        submitBtn.classList.toggle('pulse-button', !disable);
        submitBtn.innerHTML = disable ? 
          '<i class="fas fa-spinner fa-spin me-2"></i>جاري الإرسال...' : 
          '<i class="fas fa-paper-plane me-2"></i>إرسال الطلب';
        setLoadingState(submitBtn, disable);
      }
    },
    showNotification,
    animateElement
  };

  const loadProductsWithAnimation = () => {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'products-loading';
    loadingElement.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>جاري تحميل المنتجات...</p>
      </div>
    `;
    
    if (!document.querySelector('#loading-styles')) {
      const styles = document.createElement('style');
      styles.id = 'loading-styles';
      styles.textContent = `
        .products-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          flex-direction: column;
        }
        .loading-spinner {
          text-align: center;
        }
        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(styles);
    }
    
    return loadingElement;
  };

  fetch('/static/products.json')
    .then(response => {
      if (!response.ok) throw new Error(`Failed to fetch products.json: ${response.status}`);
      return response.json();
    })
    .then(data => {
      products = data;
      if (isProductsPage) {
        loadProductFromURL();
        displayOtherProducts();
      } else if (isIndexPage) {
        displayAllProducts();
      }
      showNotification('تم تحميل المنتجات بنجاح', 'success');
    })
    .catch(error => {
      console.error('Error loading products:', error);
      showNotification('خطأ في تحميل المنتجات. الرجاء المحاولة لاحقاً.', 'error');
      
      if (isProductsPage) {
        document.getElementById('productName').textContent = 'خطأ في تحميل المنتجات';
      } else if (isIndexPage) {
        const grid = document.getElementById('productsGrid');
        if (grid) {
          grid.innerHTML = `
            <div class="error-message">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>خطأ في تحميل المنتجات</h3>
              <p>الرجاء المحاولة لاحقاً أو تحديث الصفحة</p>
              <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-redo me-2"></i>إعادة المحاولة
              </button>
            </div>
          `;
        }
      }
    });

  if (isProductsPage) {
    fetch('/static/algeria_municipalities_first_five_states.json')
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        return response.json();
      })
      .then(data => {
        algeriaData = data;
        populateWilayas();
        showNotification('تم تحميل بيانات الولايات بنجاح', 'success');
      })
      .catch(error => {
        console.error('Error loading Algeria data:', error);
        showNotification('خطأ في تحميل بيانات الولايات', 'error');
        
        algeriaData = {
          states: [
            { id: 1, name: "01 - أدرار", municipalities: ["أدرار", "تامست"] },
            { id: 2, name: "02 - الشلف", municipalities: ["الشلف", "تنس"] },
            { id: 3, name: "03 - الأغواط", municipalities: ["الأغواط", "آفلو"] }
          ]
        };
        populateWilayas();
      });
  }

  function loadProductFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || Object.keys(products)[0];
    
    if (productId && products[productId]) {
      selectedProduct = products[productId];
      document.title = `طلب منتج: ${selectedProduct.name} - إي سوق`;
      
      const productName = document.getElementById('productName');
      const productDescription = document.getElementById('productDescription');
      const productPrice = document.getElementById('productPrice');
      
      if (productName) {
        productName.textContent = selectedProduct.name;
        animateElement(productName, 'fadeIn');
      }
      
      if (productDescription) {
        productDescription.textContent = selectedProduct.description;
        animateElement(productDescription, 'slideInUp');
      }
      
      if (productPrice) {
        const discount = Math.round(((selectedProduct.priceBeforeDiscount - selectedProduct.priceAfterDiscount) / selectedProduct.priceBeforeDiscount) * 100);
        productPrice.innerHTML = `
          <div class="price-display">
            <span class="current-price">${selectedProduct.priceAfterDiscount} دج</span>
            <span class="old-price">${selectedProduct.priceBeforeDiscount} دج</span>
            ${discount > 0 ? `<span class="discount-badge">خصم ${discount}%</span>` : ''}
          </div>
        `;
        animateElement(productPrice, 'fadeIn');
      }
      
      setupEnhancedCarousel(selectedProduct.images);
      populateSizeAndColorOptions();
      updateDeliveryAndTotalPrice();
    } else {
      document.getElementById('productName').textContent = 'المنتج غير موجود';
      showNotification('المنتج المطلوب غير موجود', 'error');
      
      if (Object.keys(products).length > 0) {
        setTimeout(() => {
          window.location.search = `?id=${Object.keys(products)[0]}`;
        }, 2000);
      }
    }
  }

  function populateSizeAndColorOptions() {
    const sizeButtonsContainer = document.getElementById('sizeButtons');
    const colorButtonsContainer = document.getElementById('colorButtons');
    const sizeInput = document.getElementById('size');
    const colorInput = document.getElementById('color');

    if (!sizeButtonsContainer || !colorButtonsContainer || !selectedProduct) return;

    // Clear previous buttons
    sizeButtonsContainer.innerHTML = '';
    colorButtonsContainer.innerHTML = '';

    // Handle sizes
    if (!selectedProduct.sizes || selectedProduct.sizes.length === 0) {
      sizeButtonsContainer.style.display = 'none';
      if (sizeInput) sizeInput.value = '';
    } else if (selectedProduct.sizes.length === 1) {
      sizeInput.value = selectedProduct.sizes[0];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-button active';
      button.textContent = selectedProduct.sizes[0];
      button.disabled = true;
      sizeButtonsContainer.appendChild(button);
    } else {
      sizeButtonsContainer.style.display = '';
      selectedProduct.sizes.forEach(size => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-button';
        button.textContent = size;
        button.addEventListener('click', () => {
          sizeButtonsContainer.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          sizeInput.value = size;
          checkFormValidity();
        });
        sizeButtonsContainer.appendChild(button);
      });
    }

    // Handle colors
    if (!selectedProduct.colors || selectedProduct.colors.length === 0) {
      colorButtonsContainer.style.display = 'none';
      if (colorInput) colorInput.value = '';
    } else if (selectedProduct.colors.length === 1) {
      colorInput.value = selectedProduct.colors[0];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-button active';
      button.style.backgroundColor = selectedProduct.colors[0];
      button.disabled = true;
      colorButtonsContainer.appendChild(button);
    } else {
      colorButtonsContainer.style.display = '';
      selectedProduct.colors.forEach(color => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'color-button';
        button.style.backgroundColor = color;
        button.addEventListener('click', () => {
          colorButtonsContainer.querySelectorAll('.color-button').forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          colorInput.value = color;
          checkFormValidity();
        });
        colorButtonsContainer.appendChild(button);
      });
    }

    checkFormValidity();
  }

  function setupEnhancedCarousel(images) {
    const carouselImages = document.getElementById('carouselImages');
    const carouselIndicators = document.getElementById('carouselIndicators');
    
    if (!carouselImages || !carouselIndicators) return;
    
    carouselImages.innerHTML = '';
    carouselIndicators.innerHTML = '';
    
    if (!images || images.length === 0) {
      carouselImages.innerHTML = `
        <div class="carousel-item active">
          <div class="no-image-placeholder">
            <i class="fas fa-image"></i>
            <p>لا توجد صورة متاحة</p>
          </div>
        </div>
      `;
      return;
    }

    images.forEach((imgSrc, index) => {
      const slide = document.createElement('div');
      slide.className = `carousel-item ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `
        <div class="image-container">
          <img src="${imgSrc}" 
               class="d-block w-100 product-image" 
               alt="${selectedProduct.name} - صورة ${index + 1}"
               loading="lazy"
               onclick="openImageModal('${imgSrc}')"
               onerror="this.parentElement.innerHTML='<div class=\\'no-image-placeholder\\'><i class=\\'fas fa-image\\'></i><p>خطأ في تحميل الصورة</p></div>'">
          <div class="image-count">${index + 1}/${images.length}</div>
        </div>
      `;
      carouselImages.appendChild(slide);

      const indicator = document.createElement('button');
      indicator.type = 'button';
      indicator.setAttribute('data-bs-target', '#carousel');
      indicator.setAttribute('data-bs-slide-to', index);
      indicator.className = index === 0 ? 'active' : '';
      indicator.setAttribute('aria-label', `الصورة ${index + 1}`);
      carouselIndicators.appendChild(indicator);
    });

    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.className = 'carousel-thumbnails';
    images.forEach((imgSrc, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = imgSrc;
      thumbnail.className = index === 0 ? 'active' : '';
      thumbnail.alt = `Thumbnail ${index + 1}`;
      thumbnail.setAttribute('data-bs-target', '#carousel');
      thumbnail.setAttribute('data-bs-slide-to', index);
      thumbnail.addEventListener('click', () => {
        const carouselInstance = bootstrap.Carousel.getInstance(document.querySelector('#carousel'));
        carouselInstance.to(index);
        document.querySelectorAll('.carousel-thumbnails img').forEach(img => img.classList.remove('active'));
        thumbnail.classList.add('active');
      });
      thumbnailsContainer.appendChild(thumbnail);
    });
    carouselImages.after(thumbnailsContainer);

    const carouselElement = document.querySelector('#carousel');
    if (carouselElement && !bootstrap.Carousel.getInstance(carouselElement)) {
      new bootstrap.Carousel(carouselElement, {
        interval: false,
        wrap: true,
        touch: true
      });
    }

    enhanceCarouselNavigation();
  }

  function enhanceCarouselNavigation() {
    const carousel = document.querySelector('#carousel');
    if (!carousel) return;

    let startX = 0;
    let endX = 0;

    carousel.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    carousel.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      handleSwipe();
    });

    function handleSwipe() {
      const threshold = 50;
      startX - endX > threshold ? bootstrap.Carousel.getInstance(carousel).next() : endX - startX > threshold && bootstrap.Carousel.getInstance(carousel).prev();
    }

    carousel.addEventListener('slid.bs.carousel', (e) => {
      document.querySelectorAll('.carousel-thumbnails img').forEach((thumb, i) => thumb.classList.toggle('active', i === e.to));
    });

    carousel.addEventListener('keydown', (e) => {
      const carouselInstance = bootstrap.Carousel.getInstance(carousel);
      if (e.key === 'ArrowLeft') carouselInstance.prev();
      else if (e.key === 'ArrowRight') carouselInstance.next();
    });
  }

  window.openImageModal = function(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="closeImageModal()"></div>
      <div class="modal-content">
        <img src="${imageSrc}" alt="صورة مكبرة">
        <button class="modal-close" onclick="closeImageModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s ease';
      requestAnimationFrame(() => {
        modal.style.opacity = '1';
      });
    });

    // Pinch-to-zoom support
    let scale = 1;
    let startDistance = 0;
    let translateX = 0;
    let translateY = 0;
    const modalImage = modal.querySelector('img');

    modalImage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        startDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
      }
    });

    modalImage.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        scale = Math.min(Math.max(1, (distance / startDistance) * scale), 4);
        modalImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
      }
    });
  };

  window.closeImageModal = function() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  };

  function displayAllProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    const loadingElement = loadProductsWithAnimation();
    productsGrid.appendChild(loadingElement);

    setTimeout(() => {
      productsGrid.innerHTML = '';
      
      Object.keys(products).forEach((id, index) => {
        const product = products[id];
        const discount = Math.round(((product.priceBeforeDiscount - product.priceAfterDiscount) / product.priceBeforeDiscount) * 100);
        
        const card = document.createElement('div');
        card.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        card.innerHTML = `
          <div class="product-card">
            <div class="product-card-image">
              <img src="${product.images[0] || 'https://placehold.co/300x300/e9ecef/6c757d?text=لا+توجد+صورة'}" 
                   alt="${product.name}" 
                   loading="lazy">
              ${discount > 0 ? `<div class="product-badge">خصم ${discount}%</div>` : ''}
            </div>
            <div class="product-card-info">
              <h3>${product.name}</h3>
              <div class="product-card-price">
                <span class="current-price">${product.priceAfterDiscount} دج</span>
                <span class="old-price">${product.priceBeforeDiscount} دج</span>
              </div>
              <button class="product-card-action" onclick="location.href='products.html?id=${id}'">
                <i class="fas fa-shopping-cart me-2"></i>اطلب الآن
              </button>
            </div>
          </div>
        `;
        
        card.onclick = () => window.location.href = `products.html?id=${id}`;
        productsGrid.appendChild(card);

        setTimeout(() => {
          card.style.transition = 'all 0.6s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100);
      });
    }, 500);
  }

  function displayOtherProducts() {
    const otherProductsDiv = document.getElementById('otherProducts');
    if (!otherProductsDiv) return;

    const currentProductId = new URLSearchParams(window.location.search).get('id') || Object.keys(products)[0];
    otherProductsDiv.innerHTML = '';

    Object.keys(products).forEach((id, index) => {
      if (id !== currentProductId) {
        const product = products[id];
        const discount = Math.round(((product.priceBeforeDiscount - product.priceAfterDiscount) / product.priceBeforeDiscount) * 100);
        
        const card = document.createElement('div');
        card.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
        
        card.innerHTML = `
          <div class="product-card">
            <div class="product-card-image">
              <img src="${product.images[0] || 'https://placehold.co/300x300/e9ecef/6c757d?text=لا+توجد+صورة'}" 
                   alt="${product.name}" 
                   loading="lazy">
              ${discount > 0 ? `<div class="product-badge">خصم ${discount}%</div>` : ''}
            </div>
            <div class="product-card-info">
              <h3>${product.name}</h3>
              <div class="product-card-price">
                <span class="current-price">${product.priceAfterDiscount} دج</span>
                <span class="old-price">${product.priceBeforeDiscount} دج</span>
              </div>
              <button class="product-card-action" onclick="location.href='products.html?id=${id}'">
                <i class="fas fa-eye me-2"></i>عرض التفاصيل
              </button>
            </div>
          </div>
        `;
        
        card.onclick = () => window.location.href = `products.html?id=${id}`;
        otherProductsDiv.appendChild(card);

        setTimeout(() => {
          animateElement(card, 'slideInUp', 600);
        }, index * 100);
      }
    });
  }

  function populateWilayas() {
    const wilayaSelect = document.getElementById('wilaya');
    if (!wilayaSelect) return;
    
    wilayaSelect.innerHTML = '<option value="">اختر الولاية</option>';
    
    algeriaData.states.forEach(state => {
      const option = document.createElement('option');
      option.value = state.name;
      option.textContent = state.name;
      option.dataset.stateId = state.id;
      wilayaSelect.appendChild(option);
    });
    
    wilayaSelect.addEventListener('focus', () => {
      animateElement(wilayaSelect, 'pulse');
    });
    
    if (isProductsPage && typeof checkFormValidity === 'function') {
      checkFormValidity();
    }
  }

  async function updateDeliveryAndTotalPrice() {
    const elements = {
      wilaya: document.getElementById('wilaya'),
      deliveryType: document.getElementById('delivery_type'),
      units: document.getElementById('units'),
      deliveryPrice: document.getElementById('deliveryPrice'),
      totalPrice: document.getElementById('totalPrice'),
      productPriceSummary: document.getElementById('productPriceSummary')
    };

    if (!Object.values(elements).every(el => el) || !selectedProduct) {
      return;
    }

    const { wilaya, deliveryType, deliveryPrice: deliveryPriceEl, totalPrice: totalPriceEl, productPriceSummary } = elements;
    const stateName = wilaya.value;
    const deliveryTypeValue = deliveryType.value;
    const units = currentQuantity;

    setLoadingState(deliveryPriceEl, true);
    setLoadingState(totalPriceEl, true);
    setLoadingState(productPriceSummary, true);

    if (stateName) {
      try {
        const stateId = parseInt(stateName.split(' - ')[0]);
        const productId = new URLSearchParams(window.location.search).get('id') || Object.keys(products)[0];
        
        const prices = await window.backend.fetchDeliveryPrice(productId, stateId);
        
        if (prices) {
          deliveryPrices = prices;
          const deliveryPrice = deliveryTypeValue === 'توصيل لباب المنزل' ? prices.price_to_home : prices.price_to_office;
          const productTotal = selectedProduct.priceAfterDiscount * units;
          const totalPrice = productTotal + deliveryPrice;
          
          deliveryPriceEl.innerHTML = `
            <div class="pricing-item">
              <i class="fas fa-truck"></i>
              <span>سعر التوصيل: ${deliveryPrice} دج</span>
            </div>
          `;
          
          totalPriceEl.innerHTML = `
            <div class="pricing-item total">
              <i class="fas fa-calculator"></i>
              <span>السعر الكلي: ${totalPrice} دج</span>
            </div>
          `;
          
          productPriceSummary.innerHTML = `
            <div class="pricing-item">
              <span class="current-price">${selectedProduct.priceAfterDiscount} دج</span>
              <span class="old-price">${selectedProduct.priceBeforeDiscount} دج</span>
            </div>
          `;
          
          animateElement(deliveryPriceEl, 'fadeIn');
          animateElement(totalPriceEl, 'fadeIn');
          animateElement(productPriceSummary, 'fadeIn');
        } else {
          throw new Error('Unable to fetch delivery prices');
        }
      } catch (error) {
        console.error('Error fetching delivery price:', error);
        deliveryPriceEl.innerHTML = `
          <div class="pricing-item error">
            <i class="fas fa-exclamation-triangle"></i>
            <span>سعر التوصيل: غير متوفر</span>
          </div>
        `;
        totalPriceEl.innerHTML = `
          <div class="pricing-item">
            <i class="fas fa-calculator"></i>
            <span>السعر الكلي: ${selectedProduct.priceAfterDiscount * units} دج</span>
          </div>
        `;
        productPriceSummary.innerHTML = `
          <div class="pricing-item">
            <span class="current-price">${selectedProduct.priceAfterDiscount} دج</span>
            <span class="old-price">${selectedProduct.priceBeforeDiscount} دج</span>
          </div>
        `;
      }
    } else {
      deliveryPriceEl.innerHTML = `
        <div class="pricing-item pending">
          <i class="fas fa-info-circle"></i>
          <span>سعر التوصيل: يتم حسابه بعد اختيار الولاية</span>
        </div>
      `;
      totalPriceEl.innerHTML = `
        <div class="pricing-item">
          <i class="fas fa-calculator"></i>
          <span>السعر الكلي: ${selectedProduct.priceAfterDiscount * units} دج</span>
        </div>
      `;
      productPriceSummary.innerHTML = `
        <div class="pricing-item">
          <span class="current-price">${selectedProduct.priceAfterDiscount} دج</span>
          <span class="old-price">${selectedProduct.priceBeforeDiscount} دج</span>
        </div>
      `;
    }

    setLoadingState(deliveryPriceEl, false);
    setLoadingState(totalPriceEl, false);
    setLoadingState(productPriceSummary, false);
  }

  if (isProductsPage) {
    const elements = {
      wilaya: document.getElementById('wilaya'),
      deliveryType: document.getElementById('delivery_type'),
      increaseBtn: document.getElementById('increaseQuantity'),
      decreaseBtn: document.getElementById('decreaseQuantity'),
      form: document.getElementById('orderForm')
    };

    elements.wilaya?.addEventListener('change', async function() {
      const wilayaName = this.value;
      const communeSelect = document.getElementById('commune');
      if (!communeSelect) return;
      
      setLoadingState(communeSelect, true);
      communeSelect.innerHTML = '<option value="">جاري التحميل...</option>';
      communeSelect.disabled = true;
      
      if (wilayaName) {
        const selectedState = algeriaData.states.find(state => state.name === wilayaName);
        if (selectedState && selectedState.municipalities) {
          setTimeout(() => {
            communeSelect.innerHTML = '<option value="">اختر البلدية</option>';
            selectedState.municipalities.forEach(commune => {
              const option = document.createElement('option');
              option.value = commune;
              option.textContent = commune;
              communeSelect.appendChild(option);
            });
            communeSelect.disabled = false;
            setLoadingState(communeSelect, false);
            animateElement(communeSelect, 'slideInUp');
          }, 300);
        }
      } else {
        communeSelect.innerHTML = '<option value="">اختر البلدية</option>';
        setLoadingState(communeSelect, false);
      }
      
      await updateDeliveryAndTotalPrice();
      checkFormValidity();
    });

    elements.deliveryType?.addEventListener('change', async () => {
      await updateDeliveryAndTotalPrice();
      animateElement(elements.deliveryType, 'pulse');
    });

    elements.increaseBtn?.addEventListener('click', () => {
      currentQuantity++;
      const unitsInput = document.getElementById('units');
      if (unitsInput) {
        unitsInput.value = currentQuantity;
        animateElement(unitsInput, 'pulse');
      }
      updateDeliveryAndTotalPrice();
      checkFormValidity();
      
      if (currentQuantity > 1) {
        elements.decreaseBtn.disabled = false;
      }
    });

    elements.decreaseBtn?.addEventListener('click', () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        const unitsInput = document.getElementById('units');
        if (unitsInput) {
          unitsInput.value = currentQuantity;
          animateElement(unitsInput, 'pulse');
        }
        updateDeliveryAndTotalPrice();
        checkFormValidity();
        
        if (currentQuantity === 1) {
          elements.decreaseBtn.disabled = true;
        }
      }
    });

    const requiredInputs = elements.form?.querySelectorAll('input[required], select[required]');

    requiredInputs?.forEach(input => {
      input.addEventListener('input', checkFormValidity);
      input.addEventListener('blur', checkFormValidity);
      
      input.addEventListener('focus', () => {
        animateElement(input, 'pulse');
      });
    });

    const decreaseBtn = elements.decreaseBtn;
    if (decreaseBtn && currentQuantity === 1) {
      decreaseBtn.disabled = true;
    }
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function() {
      const isActive = nav.classList.toggle('active');
      menuToggle.innerHTML = isActive ? 
        '<i class="fas fa-times"></i>' : 
        '<i class="fas fa-bars"></i>';
      
      document.body.style.overflow = isActive ? 'hidden' : '';
      
      if (isActive) {
        const menuItems = nav.querySelectorAll('a');
        menuItems.forEach((item, index) => {
          item.style.opacity = '0';
          item.style.transform = 'translateX(-20px)';
          setTimeout(() => {
            item.style.transition = 'all 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
          }, index * 100);
        });
      }
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuToggle.contains(e.target) && nav.classList.contains('active')) {
        nav.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
      }
    });
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.product-card, .section-header, .product-info').forEach(el => {
    observer.observe(el);
  });

  document.querySelectorAll('.form-control, .form-select').forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });
  });

  document.addEventListener('touchstart', function() {}, {passive: true});

  document.addEventListener('DOMContentLoaded', function() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    
    window.addEventListener('resize', function() {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    });
    
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        window.scrollTo(0, 0);
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
      });
      
      input.addEventListener('blur', function() {
        document.body.style.height = '';
        document.body.style.overflow = '';
      });
    });
  });

  document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
      const img = e.target;
      img.style.display = 'none';
      
      const placeholder = document.createElement('div');
      placeholder.className = 'no-image-placeholder';
      placeholder.innerHTML = `
        <i class="fas fa-image"></i>
        <p>خطأ في تحميل الصورة</p>
      `;
      
      img.parentNode.insertBefore(placeholder, img);
    }
  }, true);

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.querySelector('.image-modal');
      if (modal) {
        window.closeImageModal();
      }
      
      if (nav && nav.classList.contains('active')) {
        nav.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
      }
    }
  });

  const requestBtn = document.createElement('button');
  requestBtn.className = 'request-btn';
  requestBtn.innerHTML = '<i class="fas fa-shopping-cart"></i>';
  requestBtn.setAttribute('aria-label', 'طلب المنتج');
  document.body.appendChild(requestBtn);

  const whatsappBtn = document.createElement('button');
  whatsappBtn.className = 'whatsapp-btn';
  whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i>';
  whatsappBtn.setAttribute('aria-label', 'تواصل عبر واتساب');
  whatsappBtn.addEventListener('click', () => {
    window.open('https://wa.me/+213123456789', '_blank');
  });
  document.body.appendChild(whatsappBtn);

  window.addEventListener('scroll', () => {
    const isScrolled = window.pageYOffset > 100;
    
    requestBtn.style.bottom = isScrolled ? '20px' : '80px';
    whatsappBtn.style.bottom = isScrolled ? '90px' : '150px';
    
    if (isScrolled) {
      requestBtn.classList.add('visible');
      whatsappBtn.classList.add('visible');
    } else {
      requestBtn.classList.remove('visible');
      whatsappBtn.classList.remove('visible');
    }
  });

  requestBtn.addEventListener('click', () => {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
      orderForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    if (!document.querySelector('#loaded-styles')) {
      const styles = document.createElement('style');
      styles.id = 'loaded-styles';
      styles.textContent = `
        body {
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        body.loaded {
          opacity: 1;
        }
      `;
      document.head.appendChild(styles);
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.classList.add('pulse-button');
    }
  });

  console.log('Classic frontend loaded successfully ✨');
});