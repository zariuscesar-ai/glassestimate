'use client'; import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Client { id: number; name: string; }
interface WallSeg { id: number; x1: number; y1: number; x2: number; y2: number; style: string; lengthFt: number; }
interface DoorSeg { id: number; x: number; y: number; width: number; height: number; type: string; }

const WALL_STYLES = [
  { id: 'frameless-half', name: '1/2" Frameless Glass', color: '#3b82f6', priceFt: 85, glass: '1/2"', frame: 'U-Channel' },
  { id: 'framed', name: 'Framed Glass Partition', color: '#94a3b8', priceFt: 55, glass: '1/4"', frame: 'Aluminum Frame' },
  { id: 'storefront', name: 'Storefront System', color: '#1e40af', priceFt: 95, glass: '1/4"', frame: 'Storefront' },
  { id: 'sheetrock', name: 'Sheetrock Wall', color: '#78716c', priceFt: 25, glass: 'N/A', frame: 'Metal Stud' },
  { id: 'floor-ceiling', name: 'Floor-to-Ceiling', color: '#7c3aed', priceFt: 95, glass: '1/2"', frame: 'Base Shoe' },
];

const DOOR_TYPES = [
  { id: 'single-swing', name: 'Single Swing Door', price: 2800, width: 3, icon: '🚪' },
  { id: 'double-swing', name: 'Double Swing Door', price: 4800, width: 6, icon: '🚪🚪' },
  { id: 'sliding', name: 'Sliding Door', price: 4200, width: 4, icon: '🪟' },
];

const GLASS_BLOCKS = [
  { name: '3ft Panel', wall: { x1:0,y1:0,x2:60,y2:0 }, style: 'frameless-half', label: '3\'' },
  { name: '5ft Panel', wall: { x1:0,y1:0,x2:100,y2:0 }, style: 'frameless-half', label: '5\'' },
  { name: '3ft + Door', walls: [{ x1:0,y1:0,x2:30,y2:0,style:'frameless-half' },{ x1:90,y1:0,x2:120,y2:0,style:'frameless-half' }], door: { type:'single-swing',x:30,y:0,width:60,height:15 }, label: '3\'+🚪' },
  { name: '5ft Storefront', wall: { x1:0,y1:0,x2:100,y2:0 }, style: 'storefront', label: '5\' SF' },
  { name: 'Corner L', walls: [{ x1:0,y1:0,x2:80,y2:0,style:'framed' },{ x1:80,y1:0,x2:80,y2:-80,style:'framed' }], label: 'L 4\'' },
  { name: '8ft Wall', wall: { x1:0,y1:0,x2:160,y2:0 }, style: 'framed', label: '8\'' },
];

const TEMPLATES = [
  { name: '20ft Storefront', walls: [{ x1: 50, y1: 300, x2: 650, y2: 300, style: 'storefront' }], doors: [{ x: 250, y: 300, width: 200, height: 20, type: 'double-swing' }] },
  { name: 'Office Partition', walls: [{ x1: 50, y1: 200, x2: 350, y2: 200, style: 'frameless-half' }, { x1: 350, y1: 200, x2: 350, y2: 400, style: 'frameless-half' }], doors: [{ x: 175, y: 200, width: 60, height: 15, type: 'single-swing' }] },
  { name: 'L-Shape Glass Wall', walls: [{ x1: 100, y1: 150, x2: 500, y2: 150, style: 'framed' }, { x1: 500, y1: 150, x2: 500, y2: 400, style: 'framed' }], doors: [{ x: 250, y: 150, width: 60, height: 15, type: 'single-swing' }] },
  { name: 'Empty Canvas', walls: [], doors: [] },
];

export default function VisualEstimatorPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vizRef = useRef<HTMLCanvasElement>(null);

  // Client info
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [showViz, setShowViz] = useState(false);

  // Canvas
  const [photo, setPhoto] = useState<string | null>(null);
  const [walls, setWalls] = useState<WallSeg[]>([]);
  const [doors, setDoors] = useState<DoorSeg[]>([]);
  const [activeStyle, setActiveStyle] = useState('frameless-half');
  const [activeTool, setActiveTool] = useState<'draw'|'line'|'door'|'erase'>('line');
  const [drawing, setDrawing] = useState<{pts: {x:number;y:number}[]} | null>(null);
  const [cursor, setCursor] = useState<{x:number;y:number}|null>(null);
  const [scaleMode, setScaleMode] = useState(false);
  const [scaleP1, setScaleP1] = useState<{x:number;y:number}|null>(null);
  const [scaleP2, setScaleP2] = useState<{x:number;y:number}|null>(null);
  const [pxPerFt, setPxPerFt] = useState(0);
  const [photoOpacity, setPhotoOpacity] = useState(70);
  const [saving, setSaving] = useState(false);

  // Load clients
  useEffect(() => { fetch('/api/clients').then(r=>r.json()).then(d=>{if(Array.isArray(d))setClients(d)}).catch(()=>{}); }, []);

  const getCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return {x:0,y:0};
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { const img = new Image(); img.onload = () => { const c = canvasRef.current; if (c) { c.width = Math.min(img.width, 800); c.height = (img.height/img.width)*c.width; } setPhoto(reader.result as string); }; img.src = reader.result as string; };
    reader.readAsDataURL(f);
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setWalls(t.walls.map(w=>({...w, id: Date.now()+Math.random(), lengthFt:0})));
    setDoors(t.doors.map(d=>({...d, id: Date.now()+Math.random()*2})));
    setPhoto(null);
  };

  // Pointer (touch + mouse) handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const {x,y} = getCoords(e);
    if (scaleMode) {
      if (!scaleP1) { setScaleP1({x,y}); setScaleP2(null); return; }
      setScaleP2({x,y});
      const px = Math.sqrt((x-scaleP1.x)**2 + (y-scaleP1.y)**2);
      const ft = parseFloat(prompt('Line length in feet?','10')||'0');
      if (ft>0) setPxPerFt(px/ft);
      setScaleMode(false); setScaleP1(null); setScaleP2(null); return;
    }
    if (activeTool === 'draw') setDrawing({pts:[{x,y}]});
    if (activeTool === 'line') setDrawing({pts:[{x,y}]});
    if (activeTool === 'door') {
      const dType = DOOR_TYPES[0].id;
      const wPx = DOOR_TYPES[0].width * (pxPerFt || 20);
      setDoors([...doors, { id: Date.now(), x: x-wPx/2, y: y, width: wPx, height: 15, type: dType }]);
    }
    if (activeTool === 'erase') {
      const nearWall = walls.find(w=>Math.sqrt(((w.x1+w.x2)/2-x)**2+((w.y1+w.y2)/2-y)**2)<25);
      if (nearWall) setWalls(walls.filter(w=>w.id!==nearWall.id));
      const nearDoor = doors.find(d=>Math.sqrt((d.x-x)**2+(d.y-y)**2)<30);
      if (nearDoor) setDoors(doors.filter(d=>d.id!==nearDoor.id));
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const {x,y} = getCoords(e); setCursor({x,y});
    if (scaleMode && scaleP1) setScaleP2({x,y});
    if (drawing) setDrawing({pts:[...drawing.pts,{x,y}]});
  };

  const handlePointerUp = () => {
    if (!drawing || drawing.pts.length < 3) { setDrawing(null); return; }
    if (activeTool === 'line') {
      const p1 = drawing.pts[0], p2 = drawing.pts[drawing.pts.length-1];
      const dist = Math.sqrt((p2.x-p1.x)**2+(p2.y-p1.y)**2);
      if (dist<10) { setDrawing(null); return; }
      const len = pxPerFt>0 ? Math.round(dist/pxPerFt*100)/100 : 0;
      setWalls([...walls, { id: Date.now(), x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, style:activeStyle, lengthFt:len }]);
    }
    if (activeTool === 'draw') {
      // Simplify freehand to line segments
      const pts = drawing.pts;
      let lastPt = pts[0];
      for (let i=10; i<pts.length; i+=10) {
        const dist = Math.sqrt((pts[i].x-lastPt.x)**2+(pts[i].y-lastPt.y)**2);
        if (dist>15) {
          const len = pxPerFt>0 ? Math.round(dist/pxPerFt*100)/100 : 0;
          setWalls(prev=>[...prev, { id: Date.now()+i, x1:lastPt.x, y1:lastPt.y, x2:pts[i].x, y2:pts[i].y, style:activeStyle, lengthFt:len }]);
          lastPt = pts[i];
        }
      }
    }
    setDrawing(null);
  };

  const removeWall = (id:number)=>setWalls(walls.filter(w=>w.id!==id));
  const removeDoor = (id:number)=>setDoors(doors.filter(d=>d.id!==id));
  const clearAll = ()=>{if(confirm('Clear all?')){setWalls([]);setDoors([]);setShowViz(false);}};

  const dropBlock = (block: typeof GLASS_BLOCKS[0], clickX: number, clickY: number) => {
    const px = pxPerFt || 20;
    const style = ('style' in block) ? block.style : ((block as any).walls?.[0]?.style || 'frameless-half');
    if ((block as any).wall && !(block as any).walls) {
      const w = (block as any).wall;
      const len = Math.abs((w.x2-w.x1)||60) * (px/20);
      setWalls([...walls, { id: Date.now(), x1: clickX-w.x1, y1: clickY-w.y1, x2: clickX-w.x1+len, y2: clickY-w.y1, style, lengthFt: pxPerFt>0 ? Math.round(len/pxPerFt*100)/100 : 0 }]);
    } else if ((block as any).walls) {
      const newWalls = (block as any).walls.map((w:any) => {
        const len = Math.abs((w.x2-w.x1)||60) * (px/20);
        return { id: Date.now()+Math.random(), x1: clickX-w.x1, y1: clickY-w.y1, x2: clickX-w.x1+len, y2: clickY-w.y1, style: w.style||style, lengthFt: 0 };
      });
      setWalls([...walls, ...newWalls]);
    }
    if ((block as any).door) {
      const d = (block as any).door;
      setDoors(prev => [...prev, { id: Date.now()+Math.random(), x: clickX+d.x, y: clickY+d.y, width: d.width||60, height: d.height||15, type: d.type||'single-swing' }]);
    }
  };

  const exportFloorPlan = () => {
    const c = vizRef.current; if (!c) return;
    const link = document.createElement('a');
    link.download = `${projectName||'floor-plan'}.png`;
    link.href = c.toDataURL('image/png');
    link.click();
  };

  // Canvas render
  useEffect(()=>{
    const c = canvasRef.current; if(!c)return;
    const ctx=c.getContext('2d');if(!ctx)return;
    const img=new Image();
    const render=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      if(photo){ctx.globalAlpha=photoOpacity/100;ctx.drawImage(img,0,0,c.width,c.height);ctx.globalAlpha=1;}
      else{ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,c.width,c.height);
        for(let i=0;i<c.width;i+=40){ctx.strokeStyle='#e2e8f0';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,c.height);ctx.stroke();
          ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(c.width,i);ctx.stroke();}}
      for(const w of walls){
        const s=WALL_STYLES.find(x=>x.id===w.style);
        ctx.beginPath();ctx.moveTo(w.x1,w.y1);ctx.lineTo(w.x2,w.y2);
        ctx.strokeStyle=s?.color||'#000';ctx.lineWidth=5;ctx.lineCap='round';ctx.stroke();
        if(w.lengthFt>0){const mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2;ctx.font='bold 11px sans-serif';const l=`${w.lengthFt.toFixed(1)}ft`;const tw=ctx.measureText(l).width;ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(mx-tw/2-5,my-19,tw+10,18);ctx.fillStyle='#fff';ctx.fillText(l,mx-tw/2,my-5);}
      }
      for(const d of doors){
        ctx.fillStyle='rgba(234,179,8,0.7)';ctx.fillRect(d.x,d.y-d.height,d.width,d.height);
        ctx.strokeStyle='#b45309';ctx.lineWidth=2;ctx.strokeRect(d.x,d.y-d.height,d.width,d.height);
        ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';const dt=DOOR_TYPES.find(x=>x.id===d.type);
        ctx.fillText(dt?.icon||'🚪',d.x+d.width/2-10,d.y-d.height/2+4);
      }
      if(drawing&&drawing.pts.length>1){
        ctx.beginPath();ctx.moveTo(drawing.pts[0].x,drawing.pts[0].y);
        for(let i=1;i<drawing.pts.length;i++)ctx.lineTo(drawing.pts[i].x,drawing.pts[i].y);
        ctx.strokeStyle='#3b82f6';ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
      }
      if(scaleP1){ctx.beginPath();ctx.moveTo(scaleP1.x,scaleP1.y);const e=scaleP2||cursor||scaleP1;ctx.lineTo(e.x,e.y);ctx.strokeStyle='#ef4444';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.stroke();ctx.setLineDash([]);}
    };
    if(photo){img.onload=render;img.src=photo;}else render();
  },[photo,walls,doors,drawing,scaleP1,scaleP2,cursor]);

  // Floor Plan Visualization
  const generateViz = () => {
    setShowViz(true);
    setTimeout(()=>{
      const c=vizRef.current;if(!c)return;
      const ctx=c.getContext('2d');if(!ctx)return;
      c.width=700;c.height=450;
      ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
      // Grid
      ctx.strokeStyle='#f1f5f9';ctx.lineWidth=0.5;
      for(let i=0;i<700;i+=20){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,450);ctx.stroke();}
      for(let i=0;i<450;i+=20){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(700,i);ctx.stroke();}
      // Title
      ctx.fillStyle='#1e293b';ctx.font='bold 16px sans-serif';ctx.fillText(projectName||'Floor Plan',20,30);
      ctx.fillStyle='#64748b';ctx.font='11px sans-serif';ctx.fillText(`Scale: ~${pxPerFt>0?(pxPerFt).toFixed(0):'?'} px/ft  •  ${walls.length} walls  •  ${doors.length} doors`,20,46);
      // Walls
      for(const w of walls){
        const s=WALL_STYLES.find(x=>x.id===w.style);
        ctx.beginPath();ctx.moveTo(w.x1,w.y1);ctx.lineTo(w.x2,w.y2);
        ctx.strokeStyle=s?.color||'#000';ctx.lineWidth=6;ctx.lineCap='round';ctx.stroke();
        if(w.lengthFt>0){const mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2;ctx.font='bold 11px sans-serif';const l=`${w.lengthFt.toFixed(1)}ft`;const tw=ctx.measureText(l).width;ctx.fillStyle='#fff';ctx.fillRect(mx-tw/2-3,my-8,tw+6,16);ctx.fillStyle='#1e293b';ctx.fillText(l,mx-tw/2,my+3);}
      }
      // Doors
      for(const d of doors){
        const dt=DOOR_TYPES.find(x=>x.id===d.type);
        ctx.fillStyle='#fef3c7';ctx.fillRect(d.x,d.y-d.height,d.width,d.height);
        ctx.strokeStyle='#d97706';ctx.lineWidth=2;ctx.strokeRect(d.x,d.y-d.height,d.width,d.height);
        ctx.fillStyle='#92400e';ctx.font='bold 10px sans-serif';
        const label=`${dt?.name} (${dt?.width}ft)`;
        const tw=ctx.measureText(label).width;
        ctx.fillText(label,d.x+d.width/2-tw/2,d.y-d.height/2+3);
        // Swing arc
        ctx.beginPath();ctx.arc(d.x,d.y,d.width*0.7,Math.PI,Math.PI*1.5);ctx.strokeStyle='#d97706';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);
      }
      // Legend
      ctx.fillStyle='#fff';ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;
      ctx.fillRect(520,10,170,20+WALL_STYLES.length*18);
      ctx.strokeRect(520,10,170,20+WALL_STYLES.length*18);
      ctx.fillStyle='#1e293b';ctx.font='bold 10px sans-serif';ctx.fillText('LEGEND',530,28);
      WALL_STYLES.forEach((s,i)=>{
        ctx.fillStyle=s.color;ctx.fillRect(530,36+i*18,14,4);
        ctx.fillStyle='#1e293b';ctx.font='9px sans-serif';ctx.fillText(s.name,548,40+i*18);
      });
    },50);
  };

  // Calculations
  const totals=WALL_STYLES.map(s=>{const ft=walls.filter(w=>w.style===s.id).reduce((sum,w)=>sum+w.lengthFt,0);return{...s,totalFt:ft,wallCost:ft*s.priceFt};}).filter(t=>t.totalFt>0);
  const wallTotal=totals.reduce((s,t)=>s+t.wallCost,0);
  const doorTotal=doors.reduce((s,d)=>{const dt=DOOR_TYPES.find(x=>x.id===d.type);return s+(dt?.price||0);},0);
  const laborHrs=totals.reduce((s,t)=>s+t.totalFt*0.5,0);
  const laborCost=laborHrs*65;
  const grandTotal=wallTotal+doorTotal+laborCost;
  const tax=grandTotal*0.0825;
  const totalWithTax=grandTotal+tax;
  const totalFt=totals.reduce((s,t)=>s+t.totalFt,0);
  const fmt=(n:number)=>{try{return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n||0);}catch{return'$0.00';}};

  const handleCreateEstimate=async()=>{
    if(!clientId){alert('Select a client first.');return;}
    if(walls.length===0){alert('Draw at least one wall.');return;}
    setSaving(true);
    try{
      const items:{description:string;quantity:number;unit_price:number}[]=[];
      for(const t of totals)items.push({description:`${t.name} — ${t.totalFt.toFixed(1)} ft`,quantity:Math.round(t.totalFt*100)/100,unit_price:t.priceFt});
      if(laborHrs>0)items.push({description:'Installation Labor',quantity:Math.round(laborHrs*10)/10,unit_price:65});
      for(const d of doors){const dt=DOOR_TYPES.find(x=>x.id===d.type);if(dt)items.push({description:`${dt.name} (${dt.width}ft)`,quantity:1,unit_price:dt.price});}
      const today=new Date().toISOString().split('T')[0];
      const due=new Date(Date.now()+30*86400000).toISOString().split('T')[0];
      const res=await fetch('/api/invoices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:parseInt(clientId),issue_date:today,due_date:due,type:'estimate',items,tax_rate:8.25,notes:projectNotes||`Visual estimate for ${projectName||'glass project'}. ${totalFt.toFixed(1)} ft of walls, ${doors.length} door(s).`,terms:'50% deposit required. Estimate valid 30 days.'})});
      if(!res.ok){alert('Failed');return;}
      const inv=await res.json();router.push(`/invoices/${inv.id}`);
    }catch{alert('Error');}
    finally{setSaving(false);}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Visual Estimator</h1>
        <div className="flex gap-2 flex-wrap">
          <label className="btn-primary btn-sm cursor-pointer"><input type="file" accept="image/*" onChange={handlePhoto} className="hidden"/>📷 Upload Photo</label>
          <button onClick={()=>{setScaleMode(!scaleMode);setScaleP1(null);setScaleP2(null);}} className={`btn-sm ${scaleMode?'btn-primary':'btn-secondary'}`}>📏 {scaleMode?'Click 2 points...':'Set Scale'}</button>
          {pxPerFt>0&&<span className="btn-ghost btn-sm text-xs text-green-600 font-medium">✓ {pxPerFt.toFixed(1)}px/ft</span>}
          <button onClick={generateViz} className="btn-secondary btn-sm" disabled={walls.length===0}>🏗 Generate Floor Plan</button>
          {(walls.length>0||doors.length>0)&&<button onClick={clearAll} className="btn-ghost btn-sm text-red-500">Clear</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LEFT: Client + Templates + Controls */}
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Client & Project</h2>
            <select className="select text-sm mb-2" value={clientId} onChange={e=>setClientId(e.target.value)}>
              <option value="">Select client...</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input text-sm mb-2" placeholder="Project name" value={projectName} onChange={e=>setProjectName(e.target.value)}/>
            <textarea className="input text-xs" rows={2} placeholder="Notes (optional)" value={projectNotes} onChange={e=>setProjectNotes(e.target.value)}/>
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Quick Templates</h2>
            {TEMPLATES.map(t=><button key={t.name} onClick={()=>applyTemplate(t)} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-slate-50 border border-slate-200 mb-1">{t.name}</button>)}
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Glass Blocks <span className="text-slate-400 text-[10px]">(click to drop)</span></h2>
            <div className="grid grid-cols-3 gap-1">
              {GLASS_BLOCKS.map(b=><button key={b.name} onClick={()=>{setActiveTool('line'); dropBlock(b, 200+Math.random()*300, 200+Math.random()*150);}} className="text-center p-1.5 rounded text-[10px] hover:bg-slate-50 border border-slate-200 leading-tight" title={`Drop ${b.name}`}>{b.label}<br/><span className="text-slate-400">{b.label.split('\'')[1]||b.name.split(' ')[0]}</span></button>)}
            </div>
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Wall Style</h2>
            {WALL_STYLES.map(s=><button key={s.id} onClick={()=>{setActiveStyle(s.id);setActiveTool('line');}} className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 flex items-center gap-2 ${activeStyle===s.id?'bg-navy-100 text-navy-900 font-medium ring-1 ring-navy-500':'hover:bg-slate-50 text-slate-700'}`}><span className="w-3 h-3 rounded-full shrink-0" style={{background:s.color}}/>{s.name}<span className="ml-auto text-slate-400">${s.priceFt}/ft</span></button>)}
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Tools</h2>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={()=>setActiveTool('line')} className={`btn-xs ${activeTool==='line'?'btn-primary':'btn-secondary'}`}>📏 Line</button>
              <button onClick={()=>setActiveTool('draw')} className={`btn-xs ${activeTool==='draw'?'btn-primary':'btn-secondary'}`}>✏️ Freehand</button>
              <button onClick={()=>setActiveTool('door')} className={`btn-xs ${activeTool==='door'?'btn-primary':'btn-secondary'}`}>🚪 Door</button>
              <button onClick={()=>setActiveTool('erase')} className={`btn-xs ${activeTool==='erase'?'btn-primary':'btn-secondary'}`}>🗑 Erase</button>
            </div>
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Door Types</h2>
            {DOOR_TYPES.map(dt=><div key={dt.id} className="text-xs text-slate-500 mb-1 flex justify-between"><span>{dt.icon} {dt.name}</span><span>{fmt(dt.price)}</span></div>)}
          </div>
        </div>

        {/* CENTER: Canvas + Viz */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden border-2 border-slate-200">
            {!photo&&walls.length===0?(
              <div className="text-center py-24 cursor-pointer" onClick={()=>(document.querySelector('input[type=file]')as HTMLInputElement)?.click()}>
                <p className="text-5xl mb-3">📷</p><p className="text-slate-500 font-medium">Upload photo or use a template</p>
                <p className="text-slate-400 text-sm mt-1">Then draw walls on the canvas</p>
                <label className="btn-primary btn-sm mt-4 cursor-pointer inline-block"><input type="file" accept="image/*" onChange={handlePhoto} className="hidden"/>Choose Photo</label>
              </div>
            ):(
              <canvas ref={canvasRef} style={{touchAction:'none'}} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={()=>setDrawing(null)} className="w-full block"/>
            )}
          </div>
          <p className="text-xs text-slate-400 text-center">
            {pxPerFt===0?'⚠ Set scale with 📏 first':`Drawing: ${WALL_STYLES.find(s=>s.id===activeStyle)?.name}`}
            {activeTool==='draw'&&' — Freehand mode'} {activeTool==='door'&&' — Click to place door'}
          </p>
          {photo && (
            <div className="flex items-center gap-2 justify-center mt-1">
              <span className="text-xs text-slate-400">Photo opacity:</span>
              <input type="range" min={10} max={100} value={photoOpacity} onChange={e=>setPhotoOpacity(parseInt(e.target.value))} className="w-24 h-4 accent-navy-600" />
              <span className="text-xs text-slate-400 w-8">{photoOpacity}%</span>
            </div>
          )}

          {showViz&&(
            <div className="card overflow-hidden border-2 border-navy-200 mt-4">
              <div className="px-4 py-2 bg-navy-50 border-b border-navy-100 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-navy-900">🏗 Floor Plan Visualization</h2>
                <div className="flex gap-2">
                  <button onClick={exportFloorPlan} className="text-xs bg-navy-600 text-white px-3 py-1 rounded hover:bg-navy-700">📥 Download PNG</button>
                  <button onClick={()=>setShowViz(false)} className="text-xs text-navy-500 hover:text-navy-700">Hide</button>
                </div>
              </div>
              <canvas ref={vizRef} width={700} height={450} className="w-full"/>
              <div className="px-4 py-2 bg-navy-50 text-xs text-navy-600 text-center">Ready to share with client — includes all walls, doors, and dimensions</div>
            </div>
          )}
        </div>

        {/* RIGHT: Estimate */}
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h2 className="text-sm font-semibold mb-2">Estimate</h2>
            {totals.length===0&&doors.length===0?<p className="text-xs text-slate-400">Draw walls to see pricing.</p>:(
              <div className="space-y-2 text-xs">
                {totals.map(t=><div key={t.id} className="flex justify-between border-b border-slate-100 pb-1"><div><span className="w-2 h-2 rounded-full inline-block mr-1" style={{background:t.color}}/>{t.name}</div><div className="font-medium">{t.totalFt.toFixed(1)}ft·{fmt(t.wallCost)}</div></div>)}
                {doors.map(d=>{const dt=DOOR_TYPES.find(x=>x.id===d.type);return dt?<div key={d.id} className="flex justify-between border-b border-slate-100 pb-1"><span>{dt.icon} {dt.name}</span><span className="font-medium">{fmt(dt.price)}</span></div>:null;})}
                <div className="flex justify-between"><span className="text-slate-500">Materials</span><span>{fmt(wallTotal+doorTotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Labor ({laborHrs.toFixed(1)}hrs)</span><span>{fmt(laborCost)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tax (8.25%)</span><span>{fmt(tax)}</span></div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200"><span>Total</span><span>{fmt(totalWithTax)}</span></div>
              </div>
            )}
          </div>

          <button onClick={handleCreateEstimate} className="btn-primary w-full" disabled={saving||!clientId||walls.length===0}>{saving?'Creating...':'📋 Create Estimate'}</button>

          {(walls.length>0||doors.length>0)&&(
            <div className="card p-3">
              <h2 className="text-sm font-semibold mb-2">Elements</h2>
              <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                {walls.map((w,i)=>{const s=WALL_STYLES.find(st=>st.id===w.style);return(
                  <div key={w.id} className="flex items-center justify-between py-0.5 border-b border-slate-100"><div className="flex items-center gap-1.5"><span className="text-slate-400">{i+1}.</span><span className="w-2 h-2 rounded-full" style={{background:s?.color}}/>{s?.name}</div><div className="flex items-center gap-1"><span className="font-medium">{w.lengthFt>0?`${w.lengthFt.toFixed(1)}ft`:'—'}</span><button onClick={()=>removeWall(w.id)} className="text-red-400 font-bold">×</button></div></div>
                );})}
                {doors.map(d=>{const dt=DOOR_TYPES.find(x=>x.id===d.type);return(
                  <div key={d.id} className="flex items-center justify-between py-0.5 border-b border-slate-100"><span>{dt?.icon} {dt?.name}</span><button onClick={()=>removeDoor(d.id)} className="text-red-400 font-bold">×</button></div>
                );})}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
