const message = (en, ar) => ({ en, ar });
const person = (en, ar) => ({ en, ar });

export const ACTIVE_SMS_SCENARIOS = [
  {
    id: "SMS-PHISH-001",
    classification: "phishing",
    category: "SPL delivery address update",
    difficulty: "medium",
    sender: {
      names: [person("SPL", "البريد السعودي | سبل")],
      displayNumber: "SPL",
      sourceType: "external",
      verificationLabel: person("SPL delivery notice", "إشعار توصيل من سبل")
    },
    messageTemplates: [message(
      "Delivery of shipment {trackingNumber} could not be completed because the address details need updating. Review the shipment to arrange another delivery.",
      "تعذّر إكمال تسليم شحنتك رقم {trackingNumber} بسبب عدم اكتمال بيانات العنوان. يرجى مراجعة التفاصيل لتحديد موعد التسليم الجديد."
    )],
    messageContext: message(
      "You have no matching expected delivery in this scenario.",
      "لا توجد لديك شحنة متوقعة تطابق هذه الرسالة في هذا السيناريو."
    ),
    link: {
      exists: true,
      displayTexts: ["https://spl-delivery.test/track/{trackingNumber}"],
      destinations: ["https://spl-delivery.test/track/{trackingNumber}"],
      sourceLabel: "spl-delivery.test"
    },
    expectedDecision: "report"
  },
  {
    id: "SMS-PHISH-002",
    classification: "phishing",
    category: "Al Rajhi Bank new-device alert",
    difficulty: "medium",
    sender: {
      names: [person("AlRajhi", "الراجحي")],
      displayNumber: "AlRajhi",
      sourceType: "external",
      verificationLabel: person("Bank security alert", "تنبيه أمان مصرفي")
    },
    messageTemplates: [message(
      "A request to register a new device was recorded on your account. If you did not initiate it, review the details using the link.",
      "تم تسجيل طلب لإضافة جهاز جديد إلى حسابك. إذا لم تكن أنت من بدأ الطلب، يمكنك مراجعة التفاصيل من خلال الرابط."
    )],
    messageContext: message(
      "You did not initiate a new-device registration.",
      "لم تبدأ طلب تسجيل جهاز جديد."
    ),
    link: {
      exists: true,
      displayTexts: ["https://alrajhi-device.test/review"],
      destinations: ["https://alrajhi-device.test/review"],
      sourceLabel: "alrajhi-device.test"
    },
    expectedDecision: "report"
  },
  {
    id: "SMS-PHISH-003",
    classification: "phishing",
    category: "STC rewards notification",
    difficulty: "medium",
    sender: {
      names: [person("stc rewards", "مكافآت stc")],
      displayNumber: "stc rewards",
      sourceType: "external",
      verificationLabel: person("Unverified rewards sender", "مرسل مكافآت غير موثّق")
    },
    messageTemplates: [message(
      "You have a reward available in this month's offers. View the reward details and expiration date using the link.",
      "لديك مكافأة ضمن عروض هذا الشهر. يمكنك الاطلاع على تفاصيل المكافأة وتاريخ انتهاء الاستفادة منها عبر الرابط."
    )],
    messageContext: message(
      "You did not request or expect a reward offer in this scenario.",
      "لم تطلب ولم تتوقع عرض مكافأة في هذا السيناريو."
    ),
    link: {
      exists: true,
      displayTexts: ["https://rewards-stc.test/claim"],
      destinations: ["https://rewards-stc.test/claim"],
      sourceLabel: "rewards-stc.test"
    },
    expectedDecision: "report"
  },
  {
    id: "SMS-PHISH-004",
    classification: "phishing",
    category: "Noon refund update",
    difficulty: "medium",
    sender: {
      names: [person("noon", "نون")],
      displayNumber: "noon",
      sourceType: "external",
      verificationLabel: person("Unverified order notice", "إشعار طلب غير موثّق")
    },
    messageTemplates: [message(
      "Your refund request status has been updated. Review the refund amount and payment method in your order details.",
      "تم تحديث حالة طلب الاسترجاع الخاص بك. يمكنك مراجعة المبلغ وطريقة إعادة الدفع من خلال تفاصيل الطلب."
    )],
    messageContext: message(
      "You have no matching refund request in this scenario.",
      "لا يوجد لديك طلب استرجاع مطابق في هذا السيناريو."
    ),
    link: {
      exists: true,
      displayTexts: ["https://noon-refund.test/orders"],
      destinations: ["https://noon-refund.test/orders"],
      sourceLabel: "noon-refund.test"
    },
    expectedDecision: "report"
  },
  {
    id: "SMS-PHISH-005",
    classification: "phishing",
    category: "Health event invitation",
    difficulty: "medium",
    sender: {
      names: [person("Health Events", "فعاليات صحية")],
      displayNumber: "Health Events",
      sourceType: "external",
      verificationLabel: person("Unverified event organizer", "منظّم فعالية غير موثّق")
    },
    messageTemplates: [message(
      "You are invited to the Health Innovation Forum. Registration is open for the remaining seats. View event details and location using the link.",
      "ندعوك للمشاركة في ملتقى الابتكار الصحي. التسجيل متاح للمقاعد المتبقية، ويمكن الاطلاع على تفاصيل الفعالية وموقعها عبر الرابط."
    )],
    messageContext: message(
      "You have no prior registration or invitation for this event.",
      "لا يوجد لديك تسجيل أو دعوة سابقة لهذه الفعالية."
    ),
    link: {
      exists: true,
      displayTexts: ["https://health-events-sa.test/register"],
      destinations: ["https://health-events-sa.test/register"],
      sourceLabel: "health-events-sa.test"
    },
    expectedDecision: "report"
  },
  {
    id: "SMS-LEGIT-001",
    classification: "legitimate",
    category: "Mobily monthly bill",
    difficulty: "easy",
    sender: {
      names: [person("Mobily", "موبايلي")],
      displayNumber: "Mobily",
      sourceType: "external",
      verificationLabel: person("Verified Mobily account", "حساب موبايلي موثّق")
    },
    messageTemplates: [message(
      "Your monthly bill is available. You can review the bill details through your Mobily account.",
      "صدرت فاتورتك لهذا الشهر. يمكنك الاطلاع على تفاصيل الفاتورة من خلال حسابك في موقع موبايلي."
    )],
    messageContext: message(
      "You have a matching monthly bill in the account activity for this scenario.",
      "لديك فاتورة شهرية مطابقة في نشاط الحساب لهذا السيناريو."
    ),
    link: {
      exists: true,
      displayTexts: ["https://www.mobily.com.sa"],
      destinations: ["https://www.mobily.com.sa/"],
      sourceLabel: "mobily.com.sa"
    },
    expectedDecision: "continue"
  },
  {
    id: "SMS-LEGIT-002",
    classification: "legitimate",
    category: "Zain package offer",
    difficulty: "easy",
    sender: {
      names: [person("Zain KSA", "زين السعودية")],
      displayNumber: "Zain KSA",
      sourceType: "external",
      verificationLabel: person("Verified Zain website", "موقع زين موثّق")
    },
    messageTemplates: [message(
      "Explore the packages available for your number this month. View the details and terms on Zain's website.",
      "اكتشف الباقات المتاحة لرقمك هذا الشهر، واطلع على التفاصيل والشروط عبر موقع زين."
    )],
    messageContext: message(
      "The offer is available through the verified public site and does not request unexpected sensitive information.",
      "العرض متاح عبر الموقع العام الموثّق ولا يطلب معلومات حساسة غير متوقعة."
    ),
    link: {
      exists: true,
      displayTexts: ["https://sa.zain.com"],
      destinations: ["https://sa.zain.com/"],
      sourceLabel: "sa.zain.com"
    },
    expectedDecision: "continue"
  },
  {
    id: "SMS-LEGIT-003",
    classification: "legitimate",
    category: "Amazon delivery update",
    difficulty: "easy",
    sender: {
      names: [person("Amazon", "أمازون")],
      displayNumber: "Amazon",
      sourceType: "external",
      verificationLabel: person("Verified Amazon order", "طلب أمازون موثّق")
    },
    messageTemplates: [message(
      "The delivery date for order {orderNumber} has been updated. Track the order status through your account.",
      "تم تحديث موعد تسليم طلبك رقم {orderNumber}. يمكنك متابعة حالة الطلب من خلال حسابك."
    )],
    messageContext: message(
      "You have a matching order in the account activity for this scenario.",
      "لديك طلب مطابق في نشاط الحساب لهذا السيناريو."
    ),
    link: {
      exists: true,
      displayTexts: ["https://www.amazon.sa"],
      destinations: ["https://www.amazon.sa/"],
      sourceLabel: "amazon.sa"
    },
    expectedDecision: "continue"
  },
  {
    id: "SMS-LEGIT-004",
    classification: "legitimate",
    category: "NAQEL shipment tracking",
    difficulty: "easy",
    sender: {
      names: [person("NAQEL", "ناقل")],
      displayNumber: "NAQEL",
      sourceType: "external",
      verificationLabel: person("Verified NAQEL shipment", "شحنة ناقل موثّقة")
    },
    messageTemplates: [message(
      "Your shipment {trackingNumber} is out for delivery. View tracking updates and the estimated arrival time.",
      "شحنتك رقم {trackingNumber} قيد التوصيل. يمكنك الاطلاع على تحديثات التتبع وموعد الوصول المتوقع."
    )],
    messageContext: message(
      "You expect this shipment and can match its reference to the trusted delivery record.",
      "تتوقع هذه الشحنة ويمكنك مطابقة مرجعها مع سجل التوصيل الموثوق."
    ),
    link: {
      exists: true,
      displayTexts: ["https://www.naqelexpress.com"],
      destinations: ["https://www.naqelexpress.com/"],
      sourceLabel: "naqelexpress.com"
    },
    expectedDecision: "continue"
  },
  {
    id: "SMS-LEGIT-005",
    classification: "legitimate",
    category: "Noon order confirmation",
    difficulty: "easy",
    sender: {
      names: [person("noon", "نون")],
      displayNumber: "noon",
      sourceType: "external",
      verificationLabel: person("Verified Noon order", "طلب نون موثّق")
    },
    messageTemplates: [message(
      "Your order {orderNumber} has been confirmed. View the order details and estimated delivery date through your account.",
      "تم تأكيد طلبك رقم {orderNumber}. يمكنك الاطلاع على تفاصيل الطلب وموعد التوصيل المتوقع عبر حسابك."
    )],
    messageContext: message(
      "You placed a matching order in this scenario and the destination is the verified reference site.",
      "لقد أجريت طلبًا مطابقًا في هذا السيناريو والوجهة هي الموقع المرجعي الموثّق."
    ),
    link: {
      exists: true,
      displayTexts: ["https://www.noon.com/saudi-ar/"],
      destinations: ["https://www.noon.com/saudi-ar/"],
      sourceLabel: "noon.com"
    },
    expectedDecision: "continue"
  }
];
