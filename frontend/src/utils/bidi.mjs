// Splits text into runs that must keep left-to-right order (emails, domains,
// filenames, codes, numbers, English phrases) and ordinary runs.
const TOKEN=/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+|[A-Za-z][A-Za-z0-9]*(?:[-_.,:/][A-Za-z0-9]+)*(?:[ ][A-Za-z0-9]+(?:[-_.,:/][A-Za-z0-9]+)*)*|[0-9]+(?:[-_.,:/–][0-9]+)*/g;

export function bidiSegments(text){
 const value=typeof text==='string'?text:'';
 const parts=[];let last=0;
 for(const match of value.matchAll(TOKEN)){
  if(match.index>last)parts.push({text:value.slice(last,match.index),ltr:false});
  parts.push({text:match[0],ltr:true});
  last=match.index+match[0].length;
 }
 if(last<value.length)parts.push({text:value.slice(last),ltr:false});
 return parts;
}
