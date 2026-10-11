const person=(id,en,ar,roleEn,roleAr,presentation,portrait)=>({id,name:{en,ar},role:{en:roleEn,ar:roleAr},presentation,avatarId:`narrative-${id}`,portrait});
// Curated fictional identities. Presentation is explicit, never inferred from player names.
export const NARRATIVE_CHARACTERS=[
 person('sara','Sara','سارة','Finance','المالية','female',{style:'long',skin:'#c9906f',hair:'#352622',coat:'#294966',back:'#bdced9'}),
 person('nora','Nora','نورة','Operations','العمليات','female',{style:'scarf',skin:'#e1b498',hair:'#485d70',coat:'#364e60',back:'#d2dce1'}),
 person('reem','Reem','ريم','Procurement','المشتريات','female',{style:'bob',skin:'#b87c5d',hair:'#312a27',coat:'#48605c',back:'#c2d5d0'}),
 person('lama','Lama','لمى','Project Management','إدارة المشاريع','female',{style:'long',skin:'#e6ba96',hair:'#665041',coat:'#5e526c',back:'#d5cedd',glasses:true}),
 person('huda','Huda','هدى','Employee Services','خدمات الموظفين','female',{style:'scarf',skin:'#a9694f',hair:'#71657b',coat:'#344c60',back:'#c8d4df'}),
 person('dana','Dana','دانا','Communications','الاتصال المؤسسي','female',{style:'bob',skin:'#d59b78',hair:'#514132',coat:'#665762',back:'#dfd0d8'}),
 person('omar','Omar','عمر','Finance','المالية','male',{style:'short',skin:'#c89068',hair:'#302724',coat:'#35465b',back:'#c7d5df'}),
 person('fahad','Fahad','فهد','Operations','العمليات','male',{style:'short',skin:'#aa7153',hair:'#242423',coat:'#536052',back:'#d0d8ca',beard:true}),
 person('mohammed','Mohammed','محمد','Procurement','المشتريات','male',{style:'short',skin:'#e2b791',hair:'#544637',coat:'#555b6c',back:'#d1d5e1',glasses:true}),
 person('khalid','Khalid','خالد','Planning','التخطيط','male',{style:'short',skin:'#b98164',hair:'#3d3430',coat:'#2e5360',back:'#c5d8db',beard:true}),
 person('ahmed','Ahmed','أحمد','IT Services','خدمات تقنية المعلومات','male',{style:'short',skin:'#d4a07b',hair:'#655242',coat:'#53566b',back:'#d5d4df'}),
 person('nawaf','Nawaf','نواف','Project Management','إدارة المشاريع','male',{style:'short',skin:'#955f48',hair:'#252424',coat:'#555f62',back:'#c9d5d5',glasses:true})
];
export const narrativeAvatarPath=id=>`/assets/narrative-avatars/${id}.svg`;
