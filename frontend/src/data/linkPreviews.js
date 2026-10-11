// Destination content is selected by scenario ID, never by a visible classification.
export const LINK_PREVIEWS = {
  'SMS-PHISH-001': { brand:'SPL DELIVERY', title:'Address confirmation', description:'Confirm the delivery address and pay a small rescheduling fee to arrange another delivery.', facts:[['Shipment','Address update required'],['Payment','Rescheduling fee']], fields:['Address','Payment card'], action:'CONFIRM DELIVERY' },
  'SMS-PHISH-002': { brand:'ALRAJHI SECURITY', title:'New device review', description:'Verify the new-device request before access is restored.', facts:[['Alert','New device registration'],['Status','Verification required']], fields:['Account number','Password'], action:'VERIFY ACCOUNT' },
  'SMS-PHISH-003': { brand:'STC REWARDS', title:'Reward claim', description:'Enter your details to claim the reward before the offer expires.', facts:[['Offer','Monthly reward'],['Expiry','Limited time']], fields:['Mobile number'], action:'CLAIM REWARD' },
  'SMS-PHISH-004': { brand:'NOON REFUNDS', title:'Refund status', description:'Review the refund status and verify a payment method to receive the amount.', facts:[['Request','Refund update'],['Payment','Method verification']], fields:['Payment card'], action:'VERIFY REFUND' },
  'SMS-PHISH-005': { brand:'HEALTH EVENTS', title:'Health Innovation Forum', description:'Register for the remaining seats and provide contact details for the event.', facts:[['Event','Innovation forum'],['Seats','Remaining availability']], fields:['Email','Mobile number'], action:'REGISTER NOW' },
  'SMS-LEGIT-001': { brand:'MOBILY', title:'Monthly bill', description:'Review the current bill through the verified Mobily account page.', facts:[['Account','Monthly bill'],['Access','Verified public site']], action:'VIEW BILL' },
  'SMS-LEGIT-002': { brand:'ZAIN KSA', title:'Package offers', description:'Browse the packages available for your number and review their terms.', facts:[['Offer','Available packages'],['Access','Verified public site']], action:'VIEW PACKAGES' },
  'SMS-LEGIT-003': { brand:'AMAZON SAUDI ARABIA', title:'Order delivery update', description:'Track the delivery date and status for your order.', facts:[['Order','Delivery date updated'],['Access','Verified account site']], action:'TRACK ORDER' },
  'SMS-LEGIT-004': { brand:'NAQEL', title:'Shipment tracking', description:'View the latest tracking update and estimated arrival time.', facts:[['Shipment','Out for delivery'],['Access','Verified carrier site']], action:'VIEW TRACKING' },
  'SMS-LEGIT-005': { brand:'NOON', title:'Order confirmation', description:'Review the confirmed order details and estimated delivery date.', facts:[['Order','Confirmed'],['Access','Verified account site']], action:'VIEW ORDER' }
};

const ARABIC_PREVIEWS = {
  'SMS-PHISH-001': { brand:'توصيل سبل', title:'تأكيد العنوان', description:'أكّد عنوان التوصيل وسدّد رسومًا بسيطة لإعادة جدولة التسليم.', facts:[['الشحنة','يلزم تحديث العنوان'],['الدفع','رسوم إعادة الجدولة']], fields:['العنوان','بطاقة الدفع'], action:'تأكيد التوصيل' },
  'SMS-PHISH-002': { brand:'أمان الراجحي', title:'مراجعة جهاز جديد', description:'تحقق من طلب تسجيل الجهاز الجديد قبل استعادة الوصول.', facts:[['التنبيه','تسجيل جهاز جديد'],['الحالة','يلزم التحقق']], fields:['رقم الحساب','كلمة المرور'], action:'التحقق من الحساب' },
  'SMS-PHISH-003': { brand:'مكافآت stc', title:'المطالبة بالمكافأة', description:'أدخل بياناتك للمطالبة بالمكافأة قبل انتهاء العرض.', facts:[['العرض','مكافأة الشهر'],['الانتهاء','لفترة محدودة']], fields:['رقم الجوال'], action:'المطالبة بالمكافأة' },
  'SMS-PHISH-004': { brand:'استرجاع نون', title:'حالة الاسترجاع', description:'راجع حالة الاسترجاع وتحقق من طريقة الدفع لاستلام المبلغ.', facts:[['الطلب','تحديث الاسترجاع'],['الدفع','يلزم التحقق من الطريقة']], fields:['بطاقة الدفع'], action:'التحقق من الاسترجاع' },
  'SMS-PHISH-005': { brand:'فعاليات صحية', title:'ملتقى الابتكار الصحي', description:'سجّل في المقاعد المتبقية وقدّم بيانات التواصل للفعالية.', facts:[['الفعالية','ملتقى الابتكار'],['المقاعد','متاحة لفترة محدودة']], fields:['البريد الإلكتروني','رقم الجوال'], action:'التسجيل الآن' },
  'SMS-LEGIT-001': { brand:'موبايلي', title:'الفاتورة الشهرية', description:'راجع الفاتورة الحالية من خلال صفحة حساب موبايلي الموثّقة.', facts:[['الحساب','فاتورة شهرية'],['الوصول','موقع عام موثّق']], action:'عرض الفاتورة' },
  'SMS-LEGIT-002': { brand:'زين السعودية', title:'الباقات المتاحة', description:'تصفّح الباقات المتاحة لرقمك وراجع شروطها.', facts:[['العرض','باقات متاحة'],['الوصول','موقع عام موثّق']], action:'عرض الباقات' },
  'SMS-LEGIT-003': { brand:'أمازون السعودية', title:'تحديث توصيل الطلب', description:'تابع موعد التوصيل وحالة طلبك.', facts:[['الطلب','تم تحديث موعد التوصيل'],['الوصول','موقع الحساب الموثّق']], action:'تتبع الطلب' },
  'SMS-LEGIT-004': { brand:'ناقل', title:'تتبع الشحنة', description:'اطلع على آخر تحديث للتتبع وموعد الوصول المتوقع.', facts:[['الشحنة','قيد التوصيل'],['الوصول','موقع الناقل الموثّق']], action:'عرض التتبع' },
  'SMS-LEGIT-005': { brand:'نون', title:'تأكيد الطلب', description:'راجع تفاصيل الطلب المؤكد وموعد التوصيل المتوقع.', facts:[['الطلب','تم التأكيد'],['الوصول','موقع الحساب الموثّق']], action:'عرض الطلب' }
};

export function getLinkPreview(id, language = 'en') {
  return language === 'ar' ? ARABIC_PREVIEWS[id] || LINK_PREVIEWS[id] : LINK_PREVIEWS[id];
}
