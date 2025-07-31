document.addEventListener('DOMContentLoaded', function() {
  let products = {};
  const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');

  // Animation utilities
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

  // Enhanced loading state
  const setLoadingState = (element, loading) => {
    if (loading) {
      element.classList.add('loading');
      element.style.pointerEvents = 'none';
    } else {
      element.classList.remove('loading');
      element.style.pointerEvents = '';
    }
  };

  // Enhanced product loading with animations
  const loadProductsWithAnimation = () => {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'products-loading';
    loadingElement.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>جاري تحميل المنتجات...</p>
      </div>
    `;
    return loadingElement;
  };

  if (isIndexPage) {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
      const loadingElement = loadProductsWithAnimation();
      productsGrid.appendChild(loadingElement);
    }

    fetch('/static/products.json')
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch products.json: ${response.status}`);
        return response.json();
      })
      .then(data => {
        products = data;
        displayAllProducts();
        showNotification('تم تحميل المنتجات بنجاح', 'success');
      })
      .catch(error => {
        console.error('Error loading products:', error);
        showNotification('خطأ في تحميل المنتجات. الرجاء المحاولة لاحقاً.', 'error');
        
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
          productsGrid.innerHTML = `
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
      });
  }

  function displayAllProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    const formatPrice = (price) => {
      return price.toLocaleString('ar-DZ', { style: 'currency', currency: 'DZD' });
    };

    Object.keys(products).forEach((id, index) => {
      const product = products[id];
      if (!product.name || !product.priceAfterDiscount || !product.images || product.images.length === 0) {
        console.warn(`Product with ID ${id} has missing or invalid data.`);
        return;
      }

      const discount = Math.round(((product.priceBeforeDiscount - product.priceAfterDiscount) / product.priceBeforeDiscount) * 100);
      
      // Process description: take first line and limit to 100 characters
      const firstLine = product.description.split(/[\n\r]+/)[0];
      const shortDescription = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;

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
            <p class="product-description">${shortDescription}</p>
            <div class="product-card-price">
              <span class="current-price">${formatPrice(product.priceAfterDiscount)}</span>
              ${discount > 0 ? `<span class="old-price">${formatPrice(product.priceBeforeDiscount)}</span>` : ''}
            </div>
            <div class="product-specs">
              <span class="size-list">${product.sizes.join(', ')}</span>
              <div class="color-circles">
                ${product.colors.map(color => `<span class="color-circle" style="background-color: ${color};"></span>`).join('')}
              </div>
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
  }

  // Enhanced mobile menu functionality
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

  const scrollToTopBtn = document.createElement('button');
  scrollToTopBtn.className = 'scroll-to-top';
  scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  scrollToTopBtn.setAttribute('aria-label', 'العودة للأعلى');
  document.body.appendChild(scrollToTopBtn);
  
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });

  console.log('Enhanced frontend loaded successfully ✨');
});