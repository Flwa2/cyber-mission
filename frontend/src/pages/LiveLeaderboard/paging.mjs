export const PAGE_INTERVAL=10000;
export function pageRows(entries,page,size){const rest=entries.slice(3),pages=Math.max(1,Math.ceil(rest.length/size));const index=page%pages;return {top:entries.slice(0,3),lower:rest.slice(index*size,(index+1)*size),pages,index};}
