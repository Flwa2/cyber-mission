import { useState } from 'react';
import { boothRequest } from './boothApi.js';
import './booth.css';
export default function Recovery(){
 const [id,setId]=useState(''),[device,setDevice]=useState(''),[station,setStation]=useState('2'),[result,setResult]=useState(null),[error,setError]=useState('');
 async function run(action){try{setResult(await action());setError('');}catch(e){setError(e.message);}}
 return <main className="booth-screen"><h1>Development recovery</h1><p>Release moves an active mission into recovery; it does not delete it.</p><label>Mission ID<input value={id} onChange={e=>setId(e.target.value.toUpperCase())}/></label><button onClick={()=>run(()=>boothRequest(`/recovery/${encodeURIComponent(id)}`))}>LOOK UP</button><label>Target device ID<input value={device} onChange={e=>setDevice(e.target.value)}/></label><button onClick={()=>run(()=>boothRequest(`/recovery/${encodeURIComponent(id)}/resume`,{deviceId:device}))}>RESUME AT CORRECT STATION</button><label>Station to release<select value={station} onChange={e=>setStation(e.target.value)}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label><button onClick={()=>run(()=>boothRequest(`/recovery/stations/${station}/release`,{}))}>RELEASE STATION</button>{error&&<p role="alert">{error}</p>}<pre>{result&&JSON.stringify(result,null,2)}</pre></main>;
}
