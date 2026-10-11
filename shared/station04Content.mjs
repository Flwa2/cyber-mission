// Public presentation only. Expected responses and points live on the server.
const text=(en,ar)=>({en,ar});
export const FIRST_RESPONSES=[
 {id:'notify_cybersecurity',icon:'security',label:text('Notify the cybersecurity team immediately','أبلغ فريق الأمن السيبراني فورًا')},
 {id:'delete_suspicious_content',icon:'delete',label:text('Delete the suspicious files and messages','أحذف الملفات والرسائل المشبوهة')},
 {id:'investigate_myself',icon:'search',label:text('Continue investigating it myself','أحاول التحقيق بنفسي بشكل أكبر')},
 {id:'share_with_colleagues',icon:'people',label:text('Share the details with colleagues and ask them','أشارك التفاصيل مع زملائي وأسألهم')}
];
export const EVIDENCE_RESPONSES=[
 {id:'preserve_and_follow_instructions',icon:'choice',label:text("Preserve the evidence and follow the cybersecurity team's instructions",'أترك الأدلة كما هي وأتبع تعليمات فريق الأمن السيبراني')},
 {id:'delete_evidence',icon:'delete',label:text('Delete the suspicious messages and files','أحذف الرسائل والملفات المشبوهة')},
 {id:'change_settings_myself',icon:'actions',label:text('Change the settings and try to fix the problem myself','أغيّر الإعدادات وأحاول معالجة المشكلة بنفسي')},
 {id:'share_incident_details',icon:'people',label:text('Share the incident details in the work group','أشارك تفاصيل الحادث في مجموعة العمل')}
];
