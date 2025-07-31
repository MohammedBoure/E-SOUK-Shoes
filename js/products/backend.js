import { SUPABASE_URL, SUPABASE_KEY, CLIENT_ID } from '../config.js';

document.addEventListener('DOMContentLoaded', function() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  window.backend = {
    fetchDeliveryPrice: async (productId, stateId) => {
      try {
        const { data, error } = await supabase
          .from('delivery_prices')
          .select('price_to_office, price_to_home')
          .eq('client_id', CLIENT_ID)
          .eq('product_id', productId)
          .eq('state_id', stateId)
          .single();
        if (error || !data) {
          console.error('Fetch Delivery Price Error:', error);
          return null;
        }
        return data;
      } catch (error) {
        console.error('Fetch Delivery Price Error:', error);
        return null;
      }
    },
  submitOrder: async () => {
    const selectedProduct = window.frontend?.getSelectedProduct();
    if (!selectedProduct) {
      alert('يرجى الانتظار حتى يتم تحميل المنتج بالكامل.');
      return false;
    }

    window.frontend.disableSubmitButton(true);

    const { customerName, phone, deliveryType, wilaya, commune, address, units, size, color } = window.frontend.getFormData();

    // التحقق من الحقول الأساسية
    if (!customerName) {
      alert('اسم الزبون مطلوب.');
      window.frontend.disableSubmitButton(false);
      return false;
    }

    const phoneRegex = /^(05|06|07)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      alert('رقم الهاتف غير صالح. يجب أن يبدأ بـ 05, 06, أو 07 ويتكون من 10 أرقام.');
      window.frontend.disableSubmitButton(false);
      return false;
    }

    // التحقق من وجود الحجم واللون
    if (!size || !color) {
      alert('يرجى تحديد حجم ولون الحذاء.');
      window.frontend.disableSubmitButton(false);
      return false;
    }

    try {
      const stateId = parseInt(wilaya.split(' - ')[0]);
      // إدراج الطلب في جدول orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: CLIENT_ID,
          customer_name: customerName,
          product_id: new URLSearchParams(window.location.search).get('id'),
          quantity: units,
          state_id: stateId,
          city: commune,
          address: address,
          phone: phone,
          delivery_method: deliveryType === 'توصيل لباب المنزل' ? 'home' : 'office',
          status: 'قيد المعالجة',
          created_at: new Date().toISOString()
        })
        .select('id') // استرجاع معرف الطلب
        .single();

      if (orderError || !orderData) {
        alert('فشل في إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.');
        console.error('Supabase Order Error:', orderError);
        window.frontend.disableSubmitButton(false);
        return false;
      }

      // إدراج خيارات الطلب (الحجم واللون) في جدول order_options
      const orderId = orderData.id;
      const optionInserts = [
        { order_id: orderId, option_type: 'size', option_value: size },
        { order_id: orderId, option_type: 'color', option_value: color }
      ];

      const { error: optionsError } = await supabase
        .from('order_options')
        .insert(optionInserts);

      if (optionsError) {
        alert('فشل في إضافة خيارات الطلب. يرجى المحاولة مرة أخرى.');
        console.error('Supabase Options Error:', optionsError);
        window.frontend.disableSubmitButton(false);
        return false;
      }

      alert('تم إرسال الطلب بنجاح! سيتم التواصل معك قريباً لتأكيد الطلب.');
      window.frontend.resetForm();
      return true;
    } catch (error) {
      alert('فشل في إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.');
      console.error('Submission Error:', error);
      window.frontend.disableSubmitButton(false);
      return false;
    }
  }
  };

  if (window.location.pathname.includes('products.html') || window.location.pathname.endsWith('/')) {
    const form = document.getElementById('orderForm');
    
    form?.addEventListener('submit', async function(e) {
      e.preventDefault();
      await window.backend.submitOrder();
    });
  }
});