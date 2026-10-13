import {bidiSegments} from '../utils/bidi.mjs';
import './BidiText.css';

// Isolates LTR runs inside Arabic text. English text is returned untouched.
export default function BidiText({text,language}){
 if(language!=='ar'||typeof text!=='string')return text??null;
 return bidiSegments(text).map((part,index)=>part.ltr?<bdi key={index} dir="ltr" className="bidi-ltr">{part.text}</bdi>:part.text);
}
