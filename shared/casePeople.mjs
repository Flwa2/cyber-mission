export const text = (en, ar) => ({en, ar});
export const PEOPLE = [
 {id:'nora',name:text('Nora','نورة'),department:text('Operations','العمليات'),device:'WS-27',account:'nora@example.com'},
 {id:'sami',name:text('Sami','سامي'),department:text('Employee Services','خدمات الموظفين'),device:'WS-14',account:'sami@example.com'},
 {id:'reem',name:text('Reem','ريم'),department:text('Finance','المالية'),device:'WS-09',account:'reem@example.com'},
 {id:'mazen',name:text('Mazen','مازن'),department:text('Planning','التخطيط'),device:'WS-31',account:'mazen@example.com'}
];
export const CONTAINMENT = [
 {id:'report',label:text('Report through the cybersecurity channel','الإبلاغ عبر قناة الأمن السيبراني')},
 {id:'stop',label:text('Stop using the workstation and contact support','التوقف عن استخدام الجهاز والتواصل مع الدعم')},
 {id:'account',label:text('Ask support to secure the affected account','طلب تأمين الحساب المتأثر من الدعم')},
 {id:'preserve',label:text('Preserve the evidence for the response team','حفظ الأدلة لفريق الاستجابة')},
 {id:'delete',label:text('Delete the files and clear the activity history','حذف الملفات ومسح سجل النشاط')},
 {id:'retry',label:text('Open the material again to check what it does','فتح المحتوى مجددًا لمعرفة ما يفعله')}
];
