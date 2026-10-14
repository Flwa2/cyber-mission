import {PEOPLE,text} from '../../shared/casePeople.mjs';

// New-gameplay marker. Missions created before it keep their original content.
export const usesRefinedContent=record=>record?.scoreModel==='bonus-v1'||record?.scoreModel==='fair-v2';

const office={id:'office',name:text('Office Coordination','تنسيق المكاتب'),role:text('Administration','الشؤون الإدارية')};

// Maps the four case workstations onto the randomized narrative people.
// The incident workstation always belongs to the associated person.
export function mapCasePeople(definition,assignment){
 const primary=assignment.choices.find(p=>p.id===assignment.associatedPersonId);
 const remaining=[...assignment.choices.filter(p=>p.id!==primary.id),office];
 return PEOPLE.map(p=>({...p,person:p.id===definition.personId?primary:remaining.shift()}));
}

// Simultaneous replacement so one legacy name never cascades into another.
export function localizeLegacyNames(value,mapped){
 const table=new Map();
 for(const entry of mapped)for(const lang of ['en','ar'])table.set(entry.name[lang],entry.person.name[lang]);
 const pattern=new RegExp([...table.keys()].sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
 const walk=v=>typeof v==='string'?v.replace(pattern,m=>table.get(m)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x)])):v;
 return walk(value);
}
