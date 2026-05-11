import { useState, useCallback, useEffect } from "react";

const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const pct = (n) => Math.round(n) + "%";
const UNIDADES = ["g","kg","ml","L","unid","taza","cdta","cda"];
const TABS = ["🍪 Recetas","📦 Packs","💰 Ventas","📊 Resumen","🛒 Materias primas","⚙️ Costos fijos"];
const CANALES = ["Feria","Pedido directo","Caja completa","Otro"];
const C = { rosa:"#f48fb1", rosaOsc:"#c2185b", rosaPale:"#fce4ec", rosaMed:"#f8bbd0", crema:"#fff8f9", verde:"#2e7d32", verdePale:"#e8f5e9", rojo:"#c62828", naranja:"#e65100", naranjaPale:"#fff3e0" };

function toBase(val,u){const v=parseFloat(val)||0,m={kg:1000,g:1,L:1000,ml:1,unid:1,taza:240,cdta:5,cda:15};return v*(m[u]||1);}
function calcCostoIng(mp,cantidad,unidad){
  if(!mp)return 0;
  const fR=toBase(cantidad,unidad),fMP=toBase(mp.cantidad,mp.unidad);
  if(!fMP)return 0;
  return(fR/fMP)*(parseFloat(mp.precio)||0);
}
function costoIngredientes(r,mps){
  return r.ingredientes.reduce((a,ing)=>{const mp=mps.find(m=>m.id===ing.mpId);return a+calcCostoIng(mp,ing.cantidad,ing.unidad);},0);
}
function costoPorcion(r,mps,totalCFR){
  return (costoIngredientes(r,mps)+totalCFR)/(r.porciones||1);
}

const S={
  wrap:{maxWidth:740,margin:"0 auto",padding:"0 0 40px",fontFamily:"system-ui,sans-serif",color:"#2a1a1a"},
  header:{background:"linear-gradient(135deg,#f48fb1,#f06292,#e91e8c)",padding:"28px 24px 24px",borderRadius:"0 0 24px 24px"},
  body:{padding:"0 16px"},
  card:{background:"#fff",border:"1.5px solid #f8bbd0",borderRadius:16,padding:20,marginBottom:14,boxShadow:"0 2px 8px #f48fb122"},
  inp:{width:"100%",padding:"9px 12px",border:"1.5px solid #f8bbd0",borderRadius:10,fontSize:14,color:"#2a1a1a",background:"#fff",boxSizing:"border-box"},
  inpErr:{width:"100%",padding:"9px 12px",border:"2px solid #e91e8c",borderRadius:10,fontSize:14,color:"#2a1a1a",background:"#fff8fb",boxSizing:"border-box",boxShadow:"0 0 0 3px #f48fb155"},
  inpLock:{width:"100%",padding:"9px 12px",border:"1.5px solid #f8bbd0",borderRadius:10,fontSize:14,color:"#888",background:"#fce4ec",boxSizing:"border-box"},
  btn:{padding:"9px 18px",borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer",border:"1.5px solid #f48fb1",background:"#fff",color:"#c2185b"},
  btnP:{padding:"9px 18px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",border:"none",background:"linear-gradient(135deg,#f48fb1,#e91e8c)",color:"#fff",boxShadow:"0 2px 6px #f48fb155"},
  btnD:{padding:"4px 10px",borderRadius:8,fontSize:12,cursor:"pointer",border:"1.5px solid #f48fb1",background:"#fff",color:"#c2185b"},
  btnEdit:{padding:"4px 10px",borderRadius:8,fontSize:12,cursor:"pointer",border:"1.5px solid #90caf9",background:"#fff",color:"#1565c0"},
  lbl:{display:"block",fontSize:13,color:"#c2185b",marginBottom:4,fontWeight:500},
  errTxt:{display:"block",fontSize:12,color:"#e91e8c",marginTop:4,fontWeight:500},
  info:{background:"#fce4ec",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",gap:16,flexWrap:"wrap",fontSize:13,border:"1px solid #f8bbd0"},
  infoBlue:{background:"#e3f2fd",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,border:"1px solid #90caf9"},
  th:{padding:"8px 10px",textAlign:"left",color:"#c2185b",fontWeight:600,borderBottom:"2px solid #f8bbd0",fontSize:13,background:"#fce4ec"},
  td:{padding:"9px 10px",borderBottom:"1px solid #fce4ec",fontSize:13,verticalAlign:"middle"},
};

function Toast({onHide}){
  useEffect(()=>{const t=setTimeout(onHide,3000);return()=>clearTimeout(t);},[]);
  return <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"#1a1a1a",color:"#fff",padding:"12px 24px",borderRadius:14,boxShadow:"0 4px 20px rgba(0,0,0,0.4)",fontSize:14,fontWeight:600,whiteSpace:"nowrap"}}>{"Hay campos obligatorios sin completar"}</div>;
}
function F({lbl,err,children}){return <div><span style={S.lbl}>{lbl}</span>{children}{err?<span style={S.errTxt}>{err}</span>:null}</div>;}

function IngRow({ing,idx,mps,onChange,onDelete}){
  const mp=mps.find(m=>m.id===ing.mpId);
  const costo=calcCostoIng(mp,ing.cantidad,ing.unidad);
  return(
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 80px 1fr 36px",gap:8,marginBottom:8,alignItems:"center"}}>
      <select style={S.inp} value={ing.mpId||""} onChange={e=>{const id=e.target.value?Number(e.target.value):"";const m=mps.find(x=>x.id===id);onChange(idx,{...ing,mpId:id,unidad:m?m.unidad:ing.unidad});}}>
        <option value="">{"Seleccionar..."}</option>
        {mps.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
      </select>
      <input style={S.inp} type="number" placeholder="Cantidad" value={ing.cantidad} onChange={e=>onChange(idx,{...ing,cantidad:e.target.value})}/>
      <select style={S.inp} value={ing.unidad} onChange={e=>onChange(idx,{...ing,unidad:e.target.value})}>
        {UNIDADES.map(u=><option key={u}>{u}</option>)}
      </select>
      <div style={{...S.inp,background:"#fce4ec",color:costo>0?"#c2185b":"#ccc",display:"flex",alignItems:"center",fontWeight:costo>0?600:400}}>{costo>0?fmt(costo):"—"}</div>
      <button style={S.btnD} onClick={()=>onDelete(idx)}>{"x"}</button>
    </div>
  );
}

function FijadorPrecio({r,costoU,onFijar,label}){
  const[open,setOpen]=useState(false);
  const[modo,setModo]=useState("margen");
  const[mg,setMg]=useState(30);
  const[manual,setManual]=useState(Math.ceil(costoU/0.7));
  const precio=modo==="margen"?Math.ceil(costoU/(1-mg/100)):manual;
  const margenR=precio>0?((precio-costoU)/precio)*100:0;
  const util=precio-costoU;
  if(!open)return(
    <button onClick={()=>setOpen(true)} style={{...S.btn,fontSize:13,padding:"6px 14px",marginTop:10,background:r.precioFijo?"linear-gradient(135deg,#f48fb1,#e91e8c)":"#fff",color:r.precioFijo?"#fff":"#c2185b"}}>
      {r.precioFijo?"Precio fijado: "+fmt(r.precioFijo)+" v":"Fijar precio "+(label||"")+" v"}
    </button>
  );
  return(
    <div style={{marginTop:12,background:"#fce4ec",borderRadius:14,padding:18,border:"1.5px solid #f48fb1"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:15,color:"#c2185b"}}>{"Fijador de precio"}</div>
        <button onClick={()=>setOpen(false)} style={{...S.btnD,border:"none",color:"#aaa"}}>{"cerrar"}</button>
      </div>
      <div style={{background:"#fff",borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:14,border:"1px solid #f8bbd0"}}>
        {"Costo: "}<strong>{fmt(costoU)}</strong>{" — minimo: "}<strong style={{color:"#c2185b"}}>{fmt(Math.ceil(costoU))}</strong>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <button onClick={()=>setModo("margen")} style={{...S.btn,background:modo==="margen"?"linear-gradient(135deg,#f48fb1,#e91e8c)":"#fff",color:modo==="margen"?"#fff":"#c2185b"}}>{"Por margen %"}</button>
        <button onClick={()=>setModo("manual")} style={{...S.btn,background:modo==="manual"?"linear-gradient(135deg,#f48fb1,#e91e8c)":"#fff",color:modo==="manual"?"#fff":"#c2185b"}}>{"Precio directo"}</button>
      </div>
      {modo==="margen"&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,color:"#c2185b",fontWeight:500,marginBottom:8}}>{"Margen objetivo:"}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {[20,30,40,50].map(v=><button key={v} onClick={()=>setMg(v)} style={{...S.btn,background:mg===v?"linear-gradient(135deg,#f48fb1,#e91e8c)":"#fff",color:mg===v?"#fff":"#c2185b"}}>{v+"%"}</button>)}
            <input type="number" value={mg} onChange={e=>setMg(Number(e.target.value))} style={{...S.inp,width:70}}/>
          </div>
        </div>
      )}
      {modo==="manual"&&(
        <div style={{marginBottom:14}}>
          <span style={S.lbl}>{"Precio de venta"}</span>
          <input style={{...S.inp,maxWidth:200}} type="number" value={manual} onChange={e=>setManual(Number(e.target.value))}/>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Precio",v:fmt(precio),c:"#c2185b"},{l:"Utilidad",v:fmt(util),c:util>=0?"#2e7d32":"#c62828"},{l:"Margen",v:pct(margenR),c:margenR>=0?"#2e7d32":"#c62828"}].map(m=>(
          <div key={m.l} style={{background:"#fff",borderRadius:10,padding:12,border:"1px solid #f8bbd0",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#aaa",marginBottom:4}}>{m.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:m.c}}>{m.v}</div>
          </div>
        ))}
      </div>
      <button style={S.btnP} onClick={()=>{onFijar(precio);setOpen(false);}}>{"Confirmar "+fmt(precio)}</button>
    </div>
  );
}

function SeccionCostos({titulo,items,onSave,onDelete,color}){
  const[form,setForm]=useState({nombre:"",monto:""});
  const[editId,setEditId]=useState(null);
  const[err,setErr]=useState({});
  const total=items.reduce((a,c)=>a+(parseFloat(c.monto)||0),0);
  function save(){
    const e={};
    if(!form.nombre.trim())e.nombre="Obligatorio";
    if(!form.monto||parseFloat(form.monto)<=0)e.monto="Obligatorio";
    if(Object.keys(e).length){setErr(e);return;}
    setErr({});
    onSave(editId,form.nombre,parseFloat(form.monto));
    setForm({nombre:"",monto:""});setEditId(null);
  }
  function startEdit(c){setEditId(c.id);setForm({nombre:c.nombre,monto:String(c.monto)});}
  function cancel(){setEditId(null);setForm({nombre:"",monto:""});setErr({});}
  return(
    <div style={S.card}>
      <div style={{fontWeight:700,fontSize:15,color:color||"#c2185b",marginBottom:14}}>{titulo}</div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr auto",gap:10,alignItems:"flex-start",marginBottom:14}}>
        <F lbl="Concepto" err={err.nombre}><input style={err.nombre?S.inpErr:S.inp} placeholder="Ej: Gas del horno" value={form.nombre} onChange={e=>{setForm(p=>({...p,nombre:e.target.value}));setErr(p=>({...p,nombre:""}));}}/></F>
        <F lbl="Monto ($)" err={err.monto}><input style={err.monto?S.inpErr:S.inp} type="number" value={form.monto} onChange={e=>{setForm(p=>({...p,monto:e.target.value}));setErr(p=>({...p,monto:""}));}}/></F>
        <div style={{display:"flex",gap:8,paddingTop:22}}>
          <button style={S.btnP} onClick={save}>{editId?"Actualizar":"Agregar"}</button>
          {editId&&<button style={S.btn} onClick={cancel}>{"Cancelar"}</button>}
        </div>
      </div>
      {items.length>0&&(
        <>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><th style={S.th}>{"Concepto"}</th><th style={{...S.th,textAlign:"right"}}>{"Monto"}</th><th style={{...S.th,textAlign:"right"}}>{"% del total"}</th><th></th></tr></thead>
            <tbody>{items.map((c,i)=>(
              <tr key={c.id} style={{background:editId===c.id?"#fffde7":i%2===0?"#fff":"#fff8f9"}}>
                <td style={S.td}>{c.nombre}</td>
                <td style={{...S.td,textAlign:"right",fontWeight:600}}>{fmt(c.monto)}</td>
                <td style={{...S.td,textAlign:"right",color:"#bbb"}}>{total>0?pct(c.monto/total*100):"0%"}</td>
                <td style={S.td}><div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                  <button style={S.btnEdit} onClick={()=>startEdit(c)}>{"Editar"}</button>
                  <button style={S.btnD} onClick={()=>onDelete(c.id)}>{"x"}</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{marginTop:10,textAlign:"right",fontSize:13}}>{"Total: "}<strong style={{color:color||"#c2185b",fontSize:15}}>{fmt(total)}</strong></div>
        </>
      )}
    </div>
  );
}

const MPS_INIT=[
  {id:1,nombre:"Mantequilla sin sal",cantidad:250,unidad:"g",precio:1800},
  {id:2,nombre:"Harina de trigo",cantidad:1,unidad:"kg",precio:1200},
  {id:3,nombre:"Azucar blanco",cantidad:1,unidad:"kg",precio:900},
  {id:4,nombre:"Azucar moreno",cantidad:1,unidad:"kg",precio:1100},
  {id:5,nombre:"Huevos",cantidad:1,unidad:"unid",precio:180},
  {id:6,nombre:"Chips de chocolate",cantidad:100,unidad:"g",precio:950},
  {id:7,nombre:"Oreo molida",cantidad:100,unidad:"g",precio:800},
  {id:8,nombre:"Chocolate en polvo",cantidad:100,unidad:"g",precio:600},
  {id:9,nombre:"Chips chocolate oscuro",cantidad:100,unidad:"g",precio:900},
  {id:10,nombre:"Chips chocolate blanco",cantidad:100,unidad:"g",precio:950},
  {id:11,nombre:"Nutella",cantidad:100,unidad:"g",precio:1200},
  {id:12,nombre:"Chispitas de colores",cantidad:100,unidad:"g",precio:700},
];
const RECETAS_INIT=[
  {id:1,nombre:"Choco Chips",porciones:5,precioFijo:null,ingredientes:[{id:101,mpId:1,cantidad:60,unidad:"g"},{id:102,mpId:2,cantidad:170,unidad:"g"},{id:103,mpId:3,cantidad:50,unidad:"g"},{id:104,mpId:4,cantidad:50,unidad:"g"},{id:105,mpId:5,cantidad:1,unidad:"unid"},{id:106,mpId:6,cantidad:100,unidad:"g"}]},
  {id:2,nombre:"Oreo",porciones:5,precioFijo:null,ingredientes:[{id:201,mpId:1,cantidad:60,unidad:"g"},{id:202,mpId:2,cantidad:170,unidad:"g"},{id:203,mpId:3,cantidad:50,unidad:"g"},{id:204,mpId:4,cantidad:50,unidad:"g"},{id:205,mpId:5,cantidad:1,unidad:"unid"},{id:206,mpId:7,cantidad:70,unidad:"g"}]},
  {id:3,nombre:"Triple Chocolate",porciones:5,precioFijo:null,ingredientes:[{id:301,mpId:1,cantidad:60,unidad:"g"},{id:302,mpId:2,cantidad:170,unidad:"g"},{id:303,mpId:3,cantidad:50,unidad:"g"},{id:304,mpId:4,cantidad:50,unidad:"g"},{id:305,mpId:5,cantidad:1,unidad:"unid"},{id:306,mpId:8,cantidad:80,unidad:"g"},{id:307,mpId:9,cantidad:100,unidad:"g"},{id:308,mpId:10,cantidad:60,unidad:"g"}]},
  {id:4,nombre:"Churro",porciones:4,precioFijo:null,ingredientes:[{id:401,mpId:1,cantidad:60,unidad:"g"},{id:402,mpId:2,cantidad:170,unidad:"g"},{id:403,mpId:3,cantidad:50,unidad:"g"},{id:404,mpId:4,cantidad:50,unidad:"g"},{id:405,mpId:5,cantidad:1,unidad:"unid"},{id:406,mpId:11,cantidad:30,unidad:"g"}]},
  {id:5,nombre:"Confeti",porciones:5,precioFijo:null,ingredientes:[{id:501,mpId:1,cantidad:60,unidad:"g"},{id:502,mpId:2,cantidad:170,unidad:"g"},{id:503,mpId:3,cantidad:50,unidad:"g"},{id:504,mpId:4,cantidad:50,unidad:"g"},{id:505,mpId:5,cantidad:1,unidad:"unid"},{id:506,mpId:12,cantidad:90,unidad:"g"}]},
];
const PACKS_INIT=[
  {id:1,nombre:"Pack 2",tamano:2,precioFijo:null},
  {id:2,nombre:"Pack 3",tamano:3,precioFijo:null},
  {id:3,nombre:"Pack 6",tamano:6,precioFijo:null},
  {id:4,nombre:"Pack 10",tamano:10,precioFijo:null},
];

export default function App(){
  const[tab,setTab]=useState(0);
  const[toast,setToast]=useState(false);
  const[errR,setErrR]=useState({});
  const[errV,setErrV]=useState({});
  const[errMp,setErrMp]=useState({});

  const[mps,setMps]=useState(MPS_INIT);
  const[mpForm,setMpForm]=useState({nombre:"",cantidad:"",unidad:"kg",precio:""});
  const[editMpId,setEditMpId]=useState(null);

  const[cfRecetas,setCfRecetas]=useState([{id:1,nombre:"Gas del horno",monto:200}]);
  const[cfOtros,setCfOtros]=useState([{id:1,nombre:"Empaques",monto:300},{id:2,nombre:"Etiquetas",monto:150}]);
  const totalCFR=cfRecetas.reduce((a,c)=>a+(parseFloat(c.monto)||0),0);
  const totalCFO=cfOtros.reduce((a,c)=>a+(parseFloat(c.monto)||0),0);

  function handleSaveCF(lista,setLista,editId,nombre,monto){
    if(editId){setLista(prev=>prev.map(c=>c.id===editId?{...c,nombre,monto}:c));}
    else{setLista(prev=>[...prev,{id:Date.now(),nombre,monto}]);}
  }
  function handleDeleteCF(lista,setLista,id){setLista(prev=>prev.filter(c=>c.id!==id));}

  const[recetas,setRecetas]=useState(RECETAS_INIT);
  const[editRecetaId,setEditRecetaId]=useState(null);
  const[rNombre,setRNombre]=useState("");
  const[rPorciones,setRPorciones]=useState("");
  const[ings,setIngs]=useState([{id:Date.now(),mpId:"",cantidad:"",unidad:"g"}]);

  const[packs,setPacks]=useState(PACKS_INIT);
  function fijarPrecioPack(id,precio){setPacks(prev=>prev.map(p=>p.id===id?{...p,precioFijo:precio}:p));}

  const[ventas,setVentas]=useState([]);
  const[vTipo,setVTipo]=useState("pack");
  const[vPackId,setVPackId]=useState("");
  const[vGalletasEleg,setVGalletasEleg]=useState([]);
  const[vRecetaId,setVRecetaId]=useState("");
  const[vCantReceta,setVCantReceta]=useState("");
  const[vDescPct,setVDescPct]=useState("");
  const[vDescRazon,setVDescRazon]=useState("");
  const[vCanal,setVCanal]=useState("Feria");

  const onIngChange=useCallback((idx,val)=>setIngs(prev=>prev.map((x,i)=>i===idx?val:x)),[]);
  const onIngDelete=useCallback((idx)=>setIngs(prev=>prev.length>1?prev.filter((_,i)=>i!==idx):prev),[]);
  function addIng(){setIngs(prev=>[...prev,{id:Date.now(),mpId:"",cantidad:"",unidad:"g"}]);}
  function fijarPrecio(id,precio){setRecetas(prev=>prev.map(r=>r.id===id?{...r,precioFijo:precio}:r));}
  function iniciarEditReceta(r){setEditRecetaId(r.id);setRNombre(r.nombre);setRPorciones(String(r.porciones));setIngs(JSON.parse(JSON.stringify(r.ingredientes)));window.scrollTo({top:0,behavior:"smooth"});}
  function cancelarReceta(){setEditRecetaId(null);setRNombre("");setRPorciones("");setIngs([{id:Date.now(),mpId:"",cantidad:"",unidad:"g"}]);setErrR({});}

  function guardarReceta(){
    const e={};
    if(!rNombre.trim())e.nombre="El nombre es obligatorio";
    if(!rPorciones||parseFloat(rPorciones)<=0)e.porciones="Indica cuantas galletas produce";
    if(Object.keys(e).length){setErrR(e);setToast(true);return;}
    setErrR({});
    const datos={nombre:rNombre.trim(),porciones:parseFloat(rPorciones),ingredientes:JSON.parse(JSON.stringify(ings))};
    if(editRecetaId){setRecetas(prev=>prev.map(r=>r.id===editRecetaId?{...r,...datos}:r));}
    else{setRecetas(prev=>[...prev,{id:Date.now(),...datos,precioFijo:null}]);}
    cancelarReceta();
  }

  function toggleGalleta(recetaId){
    const pk=packs.find(p=>p.id===parseInt(vPackId));
    if(!pk)return;
    const count=vGalletasEleg.filter(id=>id===recetaId).length;
    const total=vGalletasEleg.length;
    if(count>0){const idx=vGalletasEleg.lastIndexOf(recetaId);setVGalletasEleg(prev=>[...prev.slice(0,idx),...prev.slice(idx+1)]);}
    else if(total<pk.tamano){setVGalletasEleg(prev=>[...prev,recetaId]);}
  }

  function costoPack(galletasIds){return galletasIds.reduce((a,rid)=>{const r=recetas.find(x=>x.id===rid);if(!r)return a;return a+costoPorcion(r,mps,totalCFR);},0);}
  function costoPackConOtros(galletasIds){return costoPack(galletasIds)+totalCFO;}

  function guardarVenta(){
    const e={};
    if(vTipo==="pack"){
      if(!vPackId)e.pack="Selecciona un pack";
      const pk=packs.find(p=>p.id===parseInt(vPackId));
      if(pk&&vGalletasEleg.length!==pk.tamano)e.galletas="Selecciona las "+pk.tamano+" galletas del pack";
      if(pk&&!pk.precioFijo)e.pack="Este pack no tiene precio fijo";
    } else {
      if(!vRecetaId)e.receta="Selecciona una galleta";
      if(!vCantReceta||parseFloat(vCantReceta)<=0)e.cantR="Indica la cantidad";
      const r=recetas.find(x=>x.id===parseInt(vRecetaId));
      if(r&&!r.precioFijo)e.receta="Esta galleta no tiene precio fijo";
    }
    if(Object.keys(e).length){setErrV(e);setToast(true);return;}
    setErrV({});
    const desc=parseFloat(vDescPct)||0;
    if(vTipo==="pack"){
      const pk=packs.find(p=>p.id===parseInt(vPackId));
      const precioFinal=Math.round(pk.precioFijo*(1-desc/100));
      const costoU=costoPackConOtros(vGalletasEleg);
      const desglose={};
      vGalletasEleg.forEach(rid=>{const r=recetas.find(x=>x.id===rid);if(r)desglose[r.nombre]=(desglose[r.nombre]||0)+1;});
      setVentas(prev=>[...prev,{id:Date.now(),tipo:"pack",nombre:pk.nombre,tamano:pk.tamano,desglose,precioOriginal:pk.precioFijo,descPct:desc,descRazon:vDescRazon,precioFinal,ingreso:precioFinal,costo:costoU,canal:vCanal,fecha:new Date().toLocaleDateString("es-CL"),cantidad:1}]);
      setVPackId("");setVGalletasEleg([]);
    } else {
      const r=recetas.find(x=>x.id===parseInt(vRecetaId));
      const cant=parseFloat(vCantReceta);
      const precioFinal=Math.round(r.precioFijo*(1-desc/100));
      const costoU=costoPorcion(r,mps,totalCFR);
      setVentas(prev=>[...prev,{id:Date.now(),tipo:"galleta",nombre:r.nombre,cantidad:cant,precioOriginal:r.precioFijo,descPct:desc,descRazon:vDescRazon,precioFinal,ingreso:cant*precioFinal,costo:costoU*cant,canal:vCanal,fecha:new Date().toLocaleDateString("es-CL")}]);
      setVRecetaId("");setVCantReceta("");
    }
    setVDescPct("");setVDescRazon("");setVCanal("Feria");
  }

  function saveMp(){
    const e={};
    if(!mpForm.nombre.trim())e.nombre="El nombre es obligatorio";
    if(!mpForm.cantidad||parseFloat(mpForm.cantidad)<=0)e.cantidad="Ingresa una cantidad valida";
    if(!mpForm.precio||parseFloat(mpForm.precio)<=0)e.precio="Ingresa un precio valido";
    if(Object.keys(e).length){setErrMp(e);setToast(true);return;}
    setErrMp({});
    if(editMpId){setMps(prev=>prev.map(m=>m.id===editMpId?{...m,...mpForm,cantidad:parseFloat(mpForm.cantidad),precio:parseFloat(mpForm.precio)}:m));setEditMpId(null);}
    else{setMps(prev=>[...prev,{id:Date.now(),...mpForm,cantidad:parseFloat(mpForm.cantidad),precio:parseFloat(mpForm.precio)}]);}
    setMpForm({nombre:"",cantidad:"",unidad:"kg",precio:""});
  }

  const prevCIng=ings.reduce((a,ing)=>{const mp=mps.find(m=>m.id===ing.mpId);return a+calcCostoIng(mp,ing.cantidad,ing.unidad);},0);
  const prevTotal=prevCIng+totalCFR;
  const prevPorcion=rPorciones?prevTotal/parseFloat(rPorciones):0;
  const pkSel=packs.find(p=>p.id===parseInt(vPackId));
  const pkCosto=costoPackConOtros(vGalletasEleg);
  const pkDesc=parseFloat(vDescPct)||0;
  const pkPrecioFinal=pkSel?.precioFijo?Math.round(pkSel.precioFijo*(1-pkDesc/100)):0;
  const rSel=recetas.find(x=>x.id===parseInt(vRecetaId));
  const rPrecioFinal=rSel?.precioFijo?Math.round(rSel.precioFijo*(1-parseFloat(vDescPct||0)/100)):0;
  const rCostoU=rSel?costoPorcion(rSel,mps,totalCFR):0;
  const rIngreso=rPrecioFinal*(parseFloat(vCantReceta)||0);
  const rCosto=rCostoU*(parseFloat(vCantReceta)||0);
  const totalIng=ventas.reduce((a,v)=>a+v.ingreso,0);
  const totalCos=ventas.reduce((a,v)=>a+v.costo,0);
  const totalUt=totalIng-totalCos;
  const margen=totalIng>0?(totalUt/totalIng)*100:0;
  const galletasPorPack={};
  ventas.filter(v=>v.tipo==="pack").forEach(v=>{if(v.desglose)Object.entries(v.desglose).forEach(([n,cnt])=>{galletasPorPack[n]=(galletasPorPack[n]||0)+cnt;});});
  const maxGalleta=Math.max(...Object.values(galletasPorPack),1);

  return(
    <div style={S.wrap}>
      {toast&&<Toast onHide={()=>setToast(false)}/>}
      <div style={S.header}>
        <div style={{fontSize:26,fontWeight:700,color:"#fff",marginBottom:4}}>{"🍪 Fabrica de galletas"}</div>
        <div style={{fontSize:14,color:"#fce4ec"}}>{"Galletas Laura — control de costos e ingresos"}</div>
      </div>
      <div style={{display:"flex",background:"#fff",overflowX:"auto",padding:"0 16px"}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{...S.btn,border:"none",borderBottom:tab===i?"3px solid #c2185b":"3px solid transparent",borderRadius:0,padding:"12px 12px",fontWeight:tab===i?700:400,color:tab===i?"#c2185b":"#aaa",whiteSpace:"nowrap",fontSize:12,background:"transparent"}}>{t}</button>)}
      </div>
      <div style={S.body}>

      {tab===0&&(
        <div>
          <div style={S.card}>
            <div style={{fontWeight:700,fontSize:16,color:"#c2185b",marginBottom:16}}>{editRecetaId?"Editando receta":"Nueva receta"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <F lbl="Nombre" err={errR.nombre}><input style={errR.nombre?S.inpErr:S.inp} value={rNombre} onChange={e=>{setRNombre(e.target.value);setErrR(p=>({...p,nombre:""}));}} placeholder="Ej: Choco Chips"/></F>
              <F lbl="Galletas que produce" err={errR.porciones}><input style={errR.porciones?S.inpErr:S.inp} type="number" value={rPorciones} onChange={e=>{setRPorciones(e.target.value);setErrR(p=>({...p,porciones:""}));}} placeholder="Ej: 5"/></F>
            </div>
            <div style={{fontWeight:600,fontSize:13,color:"#c2185b",marginBottom:10}}>{"Ingredientes"}</div>
            {ings.map((ing,idx)=><IngRow key={ing.id} ing={ing} idx={idx} mps={mps} onChange={onIngChange} onDelete={onIngDelete}/>)}
            {prevCIng>0&&(
              <div style={{...S.info,flexDirection:"column",gap:6}}>
                <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                  <span>{"Ingredientes: "}<strong>{fmt(prevCIng)}</strong></span>
                  <span>{"Gas: "}<strong>{fmt(totalCFR)}</strong></span>
                  <span>{"Total lote: "}<strong>{fmt(prevTotal)}</strong></span>
                </div>
                {rPorciones&&<div style={{borderTop:"1px solid #f8bbd0",paddingTop:6}}>{"Costo por galleta: "}<strong style={{fontSize:15,color:"#c2185b"}}>{fmt(prevPorcion)}</strong></div>}
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <button style={S.btn} onClick={addIng}>{"+ Ingrediente"}</button>
              <button style={S.btnP} onClick={guardarReceta}>{editRecetaId?"Actualizar":"Guardar receta"}</button>
              {editRecetaId&&<button style={S.btn} onClick={cancelarReceta}>{"Cancelar"}</button>}
            </div>
          </div>
          {recetas.map((r,i)=>{
            const cIng=costoIngredientes(r,mps),cTotal=cIng+totalCFR,cU=costoPorcion(r,mps,totalCFR);
            const mg=r.precioFijo?((r.precioFijo-cU)/r.precioFijo)*100:null;
            return(
              <div key={r.id} style={{...S.card,border:editRecetaId===r.id?"2px solid #90caf9":S.card.border}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:"#c2185b",marginBottom:3}}>{r.nombre}</div>
                    <div style={{fontSize:13,color:"#888",marginBottom:2}}>{r.porciones+" galletas por lote"}</div>
                    <div style={{fontSize:13,display:"flex",gap:16,flexWrap:"wrap"}}>
                      <span>{"Ing: "}<strong>{fmt(cIng)}</strong></span>
                      <span>{"Gas: "}<strong>{fmt(totalCFR)}</strong></span>
                      <span>{"Total: "}<strong>{fmt(cTotal)}</strong></span>
                      <span style={{color:"#c2185b",fontWeight:700}}>{"Costo/ud: "}<strong>{fmt(cU)}</strong></span>
                    </div>
                    {r.precioFijo&&<div style={{fontSize:13,marginTop:2,color:"#2e7d32",fontWeight:700}}>{"Precio: "+fmt(r.precioFijo)+" — Margen: "+pct(mg)}</div>}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button style={S.btnEdit} onClick={()=>iniciarEditReceta(r)}>{"Editar"}</button>
                    <button style={S.btnD} onClick={()=>setRecetas(prev=>prev.filter((_,j)=>j!==i))}>{"Eliminar"}</button>
                  </div>
                </div>
                <FijadorPrecio r={r} costoU={cU} onFijar={(p)=>fijarPrecio(r.id,p)}/>
              </div>
            );
          })}
        </div>
      )}

      {tab===1&&(
        <div>
          {packs.map((pk)=>{
            const costoPromedio=recetas.length>0?recetas.reduce((a,r)=>a+costoPorcion(r,mps,totalCFR),0)/recetas.length:0;
            const costoEstPack=costoPromedio*pk.tamano+totalCFO;
            const mg=pk.precioFijo?((pk.precioFijo-costoEstPack)/pk.precioFijo)*100:null;
            return(
              <div key={pk.id} style={S.card}>
                <div style={{fontWeight:700,fontSize:16,color:"#c2185b",marginBottom:3}}>{"📦 "+pk.nombre}</div>
                <div style={{fontSize:13,color:"#888",marginBottom:6}}>{pk.tamano+" galletas a eleccion"}</div>
                <div style={{fontSize:13,display:"flex",gap:16,flexWrap:"wrap",marginBottom:4}}>
                  <span>{"Costo galletas: "}<strong>{fmt(costoPromedio*pk.tamano)}</strong></span>
                  <span>{"Empaques: "}<strong>{fmt(totalCFO)}</strong></span>
                  <span style={{color:"#c2185b",fontWeight:700}}>{"Costo pack: "}<strong>{fmt(costoEstPack)}</strong></span>
                </div>
                {pk.precioFijo&&<div style={{fontSize:13,color:"#2e7d32",fontWeight:700,marginBottom:4}}>{"Precio: "+fmt(pk.precioFijo)+" — Margen est.: "+pct(mg)}</div>}
                <FijadorPrecio r={pk} costoU={costoEstPack} onFijar={(p)=>fijarPrecioPack(pk.id,p)} label={pk.nombre}/>
              </div>
            );
          })}
          <div style={S.infoBlue}>{"El costo usa el promedio de todas las galletas. Al registrar la venta se eligen las galletas exactas."}</div>
        </div>
      )}

      {tab===2&&(
        <div>
          <div style={S.card}>
            <div style={{fontWeight:700,fontSize:16,color:"#c2185b",marginBottom:16}}>{"Registrar venta"}</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <button onClick={()=>{setVTipo("pack");setErrV({});}} style={{...S.btn,fontSize:14,padding:"10px 20px",background:vTipo==="pack"?"linear-gradient(135deg,#f48fb1,#e91e8c)":"#fff",color:vTipo==="pack"?"#fff":"#c2185b"}}>{"📦 Pack"}</button>
              <button onClick={()=>{setVTipo("galleta");setErrV({});}} style={{...S.btn,fontSize:14,padding:"10px 20px",background:vTipo==="galleta"?"linear-gradient(135deg,#f48fb1,#e91e8c)":"#fff",color:vTipo==="galleta"?"#fff":"#c2185b"}}>{"🍪 Galleta individual"}</button>
            </div>
            {vTipo==="pack"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <F lbl="Tipo de pack" err={errV.pack}>
                    <select style={errV.pack?S.inpErr:S.inp} value={vPackId} onChange={e=>{setVPackId(e.target.value);setVGalletasEleg([]);setErrV(p=>({...p,pack:""}));}}>
                      <option value="">{"Seleccionar pack..."}</option>
                      {packs.map(p=><option key={p.id} value={p.id}>{p.nombre+(p.precioFijo?" — "+fmt(p.precioFijo):" (sin precio)")}</option>)}
                    </select>
                  </F>
                  <F lbl="Canal"><select style={S.inp} value={vCanal} onChange={e=>setVCanal(e.target.value)}>{CANALES.map(c=><option key={c}>{c}</option>)}</select></F>
                </div>
                {pkSel&&(
                  <div style={{marginBottom:14}}>
                    <div style={{...S.lbl,marginBottom:10}}>
                      {"Elige las "+pkSel.tamano+" galletas "}
                      <span style={{background:vGalletasEleg.length===pkSel.tamano?"#2e7d32":"#c2185b",color:"#fff",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}}>
                        {vGalletasEleg.length+"/"+pkSel.tamano}
                      </span>
                    </div>
                    {errV.galletas&&<span style={S.errTxt}>{errV.galletas}</span>}
                    <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                      {recetas.map(r=>{
                        const cnt=vGalletasEleg.filter(id=>id===r.id).length;
                        const selectable=vGalletasEleg.length<pkSel.tamano||cnt>0;
                        return(
                          <button key={r.id} onClick={()=>toggleGalleta(r.id)}
                            style={{padding:"12px 18px",borderRadius:12,fontSize:14,fontWeight:600,cursor:selectable?"pointer":"not-allowed",border:"2px solid "+(cnt>0?"#2e7d32":"#f8bbd0"),background:cnt>0?"#e8f5e9":"#fff",color:cnt>0?"#2e7d32":"#c2185b",opacity:selectable?1:0.4,position:"relative"}}>
                            {r.nombre}
                            {cnt>0&&<span style={{position:"absolute",top:-8,right:-8,background:"#2e7d32",color:"#fff",borderRadius:99,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{cnt}</span>}
                          </button>
                        );
                      })}
                    </div>
                    {vGalletasEleg.length===pkSel.tamano&&(
                      <div style={{...S.info,marginTop:12}}>
                        <span>{"Costo pack: "}<strong>{fmt(pkCosto)}</strong></span>
                        {pkSel.precioFijo&&<span>{"Precio: "}<strong>{fmt(pkPrecioFinal)}</strong></span>}
                        {pkSel.precioFijo&&<span>{"Utilidad: "}<strong style={{color:"#2e7d32"}}>{fmt(pkPrecioFinal-pkCosto)}</strong></span>}
                      </div>
                    )}
                  </div>
                )}
                {pkSel&&(
                  <div style={{marginBottom:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div><span style={S.lbl}>{"Precio fijo"}</span><div style={S.inpLock}>{pkSel.precioFijo?fmt(pkSel.precioFijo):"Sin precio — fijalo en Packs"}</div></div>
                      <div><span style={S.lbl}>{"Descuento % (opcional)"}</span><input style={S.inp} type="number" min="0" max="100" value={vDescPct} onChange={e=>setVDescPct(e.target.value)} placeholder="Ej: 10"/></div>
                    </div>
                    {pkDesc>0&&pkSel.precioFijo&&(<div style={{marginTop:10}}><span style={S.lbl}>{"Razon del descuento"}</span><input style={S.inp} value={vDescRazon} onChange={e=>setVDescRazon(e.target.value)} placeholder="Ej: Cliente frecuente..."/></div>)}
                  </div>
                )}
              </>
            )}
            {vTipo==="galleta"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                  <F lbl="Galleta" err={errV.receta}>
                    <select style={errV.receta?S.inpErr:S.inp} value={vRecetaId} onChange={e=>{setVRecetaId(e.target.value);setErrV(p=>({...p,receta:""}));}}>
                      <option value="">{"Seleccionar..."}</option>
                      {recetas.map(r=><option key={r.id} value={r.id}>{r.nombre+(r.precioFijo?" — "+fmt(r.precioFijo):" (sin precio)")}</option>)}
                    </select>
                  </F>
                  <F lbl="Cantidad" err={errV.cantR}><input style={errV.cantR?S.inpErr:S.inp} type="number" value={vCantReceta} onChange={e=>{setVCantReceta(e.target.value);setErrV(p=>({...p,cantR:""}));}} placeholder="Ej: 3"/></F>
                  <F lbl="Canal"><select style={S.inp} value={vCanal} onChange={e=>setVCanal(e.target.value)}>{CANALES.map(c=><option key={c}>{c}</option>)}</select></F>
                </div>
                {rSel&&vCantReceta&&rSel.precioFijo&&(
                  <div style={S.info}>
                    <span>{"Ingreso: "}<strong>{fmt(rIngreso)}</strong></span>
                    <span>{"Costo: "}<strong>{fmt(rCosto)}</strong></span>
                    <span>{"Utilidad: "}<strong style={{color:"#2e7d32"}}>{fmt(rIngreso-rCosto)}</strong></span>
                  </div>
                )}
                {rSel&&<div style={{marginBottom:12}}><span style={S.lbl}>{"Precio fijo"}</span><div style={S.inpLock}>{rSel.precioFijo?fmt(rSel.precioFijo):"Sin precio — fijalo en Recetas"}</div></div>}
              </>
            )}
            <button style={S.btnP} onClick={guardarVenta}>{"Guardar venta"}</button>
          </div>
          {ventas.length>0&&(
            <div style={S.card}>
              <div style={{fontWeight:700,fontSize:15,color:"#c2185b",marginBottom:14}}>{"Historial de ventas"}</div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><th style={S.th}>{"Fecha"}</th><th style={S.th}>{"Producto"}</th><th style={S.th}>{"Galletas"}</th><th style={S.th}>{"Canal"}</th><th style={S.th}>{"Precio"}</th><th style={{...S.th,textAlign:"right"}}>{"Utilidad"}</th><th></th></tr></thead>
                <tbody>
                  {ventas.map((v,i)=>{const ut=v.ingreso-v.costo;return(
                    <tr key={v.id} style={{background:i%2===0?"#fff":"#fff8f9"}}>
                      <td style={{...S.td,color:"#aaa"}}>{v.fecha}</td>
                      <td style={{...S.td,fontWeight:600}}>{v.nombre}</td>
                      <td style={{...S.td,fontSize:12,color:"#888"}}>{v.desglose?Object.entries(v.desglose).map(([n,c])=>n+(c>1?" x"+c:"")).join(", "):v.nombre+" x"+v.cantidad}</td>
                      <td style={S.td}><span style={{background:"#f8bbd0",color:"#c2185b",borderRadius:8,padding:"2px 8px",fontSize:11,fontWeight:600}}>{v.canal}</span></td>
                      <td style={S.td}>{v.descPct>0?<><span style={{textDecoration:"line-through",color:"#ccc",fontSize:11}}>{fmt(v.precioOriginal)}</span>{" "}<strong>{fmt(v.precioFinal)}</strong></>:fmt(v.precioFinal)}</td>
                      <td style={{...S.td,textAlign:"right",fontWeight:700,color:ut>=0?"#2e7d32":"#c62828"}}>{fmt(ut)}</td>
                      <td style={S.td}><button style={S.btnD} onClick={()=>setVentas(prev=>prev.filter((_,j)=>j!==i))}>{"x"}</button></td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab===3&&(()=>{
        const gP={},gC={};
        ventas.forEach(v=>{
          const key=v.nombre;
          if(!gP[key])gP[key]={ing:0,cos:0,uds:0};
          gP[key].ing+=v.ingreso;gP[key].cos+=v.costo;gP[key].uds+=v.cantidad||1;
          if(!gC[v.canal])gC[v.canal]={ing:0,cos:0,uds:0};
          gC[v.canal].ing+=v.ingreso;gC[v.canal].cos+=v.costo;gC[v.canal].uds+=v.cantidad||1;
        });
        const maxCanal=Math.max(...Object.values(gC).map(v=>v.ing),1);
        const COLS=["#f48fb1","#f06292","#e91e8c","#ad1457","#880e4f","#fce4ec"];
        const prodE=Object.entries(gP),canalE=Object.entries(gC);
        return(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:16}}>
              {[
                {l:"Ingresos totales",v:fmt(totalIng),c:"#c2185b",bg:"linear-gradient(135deg,#fce4ec,#f8bbd0)"},
                {l:"Costos totales",v:fmt(totalCos),c:"#555",bg:"linear-gradient(135deg,#f5f5f5,#eee)"},
                {l:"Utilidad neta",v:fmt(totalUt),c:totalUt>=0?"#2e7d32":"#c62828",bg:totalUt>=0?"linear-gradient(135deg,#e8f5e9,#c8e6c9)":"linear-gradient(135deg,#ffebee,#ffcdd2)"},
                {l:"Margen",v:pct(margen),c:margen>=0?"#2e7d32":"#c62828",bg:margen>=0?"linear-gradient(135deg,#e8f5e9,#c8e6c9)":"linear-gradient(135deg,#ffebee,#ffcdd2)"},
              ].map(m=>(
                <div key={m.l} style={{background:m.bg,borderRadius:16,padding:"18px 20px",boxShadow:"0 2px 8px #f48fb122"}}>
                  <div style={{fontSize:13,color:m.c,fontWeight:600,marginBottom:8}}>{m.l}</div>
                  <div style={{fontSize:28,fontWeight:800,color:m.c}}>{m.v}</div>
                  {m.l==="Margen"&&totalIng>0&&<div style={{marginTop:10,height:8,background:"#fff",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(Math.abs(margen),100)+"%",background:"linear-gradient(90deg,#66bb6a,#2e7d32)",borderRadius:99}}/></div>}
                </div>
              ))}
            </div>
            {Object.keys(galletasPorPack).length>0&&(
              <div style={S.card}>
                <div style={{fontWeight:700,fontSize:15,color:"#c2185b",marginBottom:14}}>{"Galletas mas elegidas en packs"}</div>
                {Object.entries(galletasPorPack).sort((a,b)=>b[1]-a[1]).map(([n,cnt])=>(
                  <div key={n} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                      <span style={{fontWeight:600}}>{n}</span>
                      <span style={{color:"#c2185b",fontWeight:700}}>{cnt+" unidades"}</span>
                    </div>
                    <div style={{height:10,background:"#fce4ec",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:(cnt/maxGalleta*100)+"%",background:"linear-gradient(90deg,#f48fb1,#e91e8c)",borderRadius:99}}/></div>
                  </div>
                ))}
              </div>
            )}
            {canalE.length>0&&(
              <div style={S.card}>
                <div style={{fontWeight:700,fontSize:14,color:"#c2185b",marginBottom:14}}>{"Ingresos por canal"}</div>
                {canalE.map(([n,v])=>(
                  <div key={n} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{fontWeight:600}}>{n}</span><span style={{color:"#c2185b",fontWeight:700}}>{fmt(v.ing)}</span></div>
                    <div style={{height:10,background:"#fce4ec",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:(v.ing/maxCanal*100)+"%",background:"linear-gradient(90deg,#f48fb1,#e91e8c)",borderRadius:99}}/></div>
                    <div style={{fontSize:11,color:"#aaa",marginTop:2}}>{(v.uds||0)+" ventas — util. "+fmt(v.ing-v.cos)}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={S.card}>
              <div style={{fontWeight:700,fontSize:15,color:"#c2185b",marginBottom:14}}>{"Costo y precio por galleta"}</div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><th style={S.th}>{"Galleta"}</th><th style={S.th}>{"Uds."}</th><th style={S.th}>{"Ing."}</th><th style={S.th}>{"Gas"}</th><th style={S.th}>{"Costo/ud."}</th><th style={S.th}>{"Precio"}</th><th style={{...S.th,textAlign:"right"}}>{"Margen"}</th></tr></thead>
                <tbody>{recetas.map((r,i)=>{const cI=costoIngredientes(r,mps),cU=costoPorcion(r,mps,totalCFR),mg=r.precioFijo?((r.precioFijo-cU)/r.precioFijo)*100:null;return(
                  <tr key={r.id} style={{background:i%2===0?"#fff":"#fff8f9"}}>
                    <td style={{...S.td,fontWeight:600}}>{r.nombre}</td><td style={{...S.td,color:"#aaa"}}>{r.porciones}</td>
                    <td style={S.td}>{fmt(cI)}</td><td style={{...S.td,color:"#aaa"}}>{fmt(totalCFR)}</td>
                    <td style={{...S.td,fontWeight:600,color:"#c2185b"}}>{fmt(cU)}</td>
                    <td style={S.td}>{r.precioFijo?<strong style={{color:"#2e7d32"}}>{fmt(r.precioFijo)}</strong>:<span style={{color:"#c62828",fontSize:12}}>{"Sin fijar"}</span>}</td>
                    <td style={{...S.td,textAlign:"right",fontWeight:700,color:mg>=0?"#2e7d32":"#c62828"}}>{mg!==null?pct(mg):"—"}</td>
                  </tr>
                );})}</tbody>
              </table>
            </div>
            <div style={S.card}>
              <div style={{fontWeight:700,fontSize:15,color:"#c2185b",marginBottom:14}}>{"Costos y precios — Packs"}</div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><th style={S.th}>{"Pack"}</th><th style={S.th}>{"Galletas"}</th><th style={S.th}>{"Costo est."}</th><th style={S.th}>{"Empaque"}</th><th style={S.th}>{"Precio"}</th><th style={{...S.th,textAlign:"right"}}>{"Margen"}</th></tr></thead>
                <tbody>{packs.map((pk,i)=>{
                  const cp=recetas.length>0?recetas.reduce((a,r)=>a+costoPorcion(r,mps,totalCFR),0)/recetas.length:0;
                  const ce=cp*pk.tamano+totalCFO;
                  const mg=pk.precioFijo?((pk.precioFijo-ce)/pk.precioFijo)*100:null;
                  return(
                    <tr key={pk.id} style={{background:i%2===0?"#fff":"#fff8f9"}}>
                      <td style={{...S.td,fontWeight:600}}>{pk.nombre}</td><td style={{...S.td,color:"#aaa"}}>{pk.tamano}</td>
                      <td style={S.td}>{fmt(cp*pk.tamano)}</td><td style={{...S.td,color:"#aaa"}}>{fmt(totalCFO)}</td>
                      <td style={S.td}>{pk.precioFijo?<strong style={{color:"#2e7d32"}}>{fmt(pk.precioFijo)}</strong>:<span style={{color:"#c62828",fontSize:12}}>{"Sin fijar"}</span>}</td>
                      <td style={{...S.td,textAlign:"right",fontWeight:700,color:mg>=0?"#2e7d32":"#c62828"}}>{mg!==null?pct(mg):"—"}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            {ventas.length===0&&<div style={{textAlign:"center",color:"#dbb",padding:32}}>{"Registra ventas para ver el resumen."}</div>}
          </div>
        );
      })()}

      {tab===4&&(
        <div>
          <div style={S.card}>
            <div style={{fontWeight:700,fontSize:16,color:"#c2185b",marginBottom:16}}>{editMpId?"Editar":"Agregar"}{" materia prima"}</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 80px 1fr auto",gap:10,alignItems:"flex-start"}}>
              <F lbl="Nombre" err={errMp.nombre}><input style={errMp.nombre?S.inpErr:S.inp} placeholder="Ej: Harina" value={mpForm.nombre} onChange={e=>{setMpForm({...mpForm,nombre:e.target.value});setErrMp(p=>({...p,nombre:""}));}}/></F>
              <F lbl="Cantidad" err={errMp.cantidad}><input style={errMp.cantidad?S.inpErr:S.inp} type="number" value={mpForm.cantidad} onChange={e=>{setMpForm({...mpForm,cantidad:e.target.value});setErrMp(p=>({...p,cantidad:""}));}}/></F>
              <div><span style={S.lbl}>{"Unidad"}</span><select style={S.inp} value={mpForm.unidad} onChange={e=>setMpForm({...mpForm,unidad:e.target.value})}>{UNIDADES.map(u=><option key={u}>{u}</option>)}</select></div>
              <F lbl="Precio" err={errMp.precio}><input style={errMp.precio?S.inpErr:S.inp} type="number" value={mpForm.precio} onChange={e=>{setMpForm({...mpForm,precio:e.target.value});setErrMp(p=>({...p,precio:""}));}}/></F>
              <div style={{display:"flex",gap:8,paddingTop:22}}>
                <button style={S.btnP} onClick={saveMp}>{editMpId?"Actualizar":"Agregar"}</button>
                {editMpId&&<button style={S.btn} onClick={()=>{setEditMpId(null);setMpForm({nombre:"",cantidad:"",unidad:"kg",precio:""});setErrMp({});}}>{"Cancelar"}</button>}
              </div>
            </div>
          </div>
          <div style={S.card}>
            <div style={{fontWeight:700,fontSize:15,color:"#c2185b",marginBottom:14}}>{"Lista de materias primas"}</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><th style={S.th}>{"Nombre"}</th><th style={S.th}>{"Cantidad"}</th><th style={{...S.th,textAlign:"right"}}>{"Precio"}</th><th></th></tr></thead>
              <tbody>{mps.map((m,i)=>(
                <tr key={m.id} style={{background:editMpId===m.id?"#fffde7":i%2===0?"#fff":"#fff8f9"}}>
                  <td style={{...S.td,fontWeight:600}}>{m.nombre}</td>
                  <td style={{...S.td,color:"#aaa"}}>{m.cantidad+" "+m.unidad}</td>
                  <td style={{...S.td,textAlign:"right",fontWeight:600}}>{fmt(m.precio)}</td>
                  <td style={S.td}><div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    <button style={S.btnEdit} onClick={()=>{setEditMpId(m.id);setMpForm({nombre:m.nombre,cantidad:String(m.cantidad),unidad:m.unidad,precio:String(m.precio)});setErrMp({});}}>{"Editar"}</button>
                    <button style={S.btnD} onClick={()=>setMps(prev=>prev.filter(x=>x.id!==m.id))}>{"x"}</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab===5&&(
        <div>
          <SeccionCostos
            titulo="Costos Fijos Recetas"
            items={cfRecetas}
            onSave={(editId,nombre,monto)=>handleSaveCF(cfRecetas,setCfRecetas,editId,nombre,monto)}
            onDelete={(id)=>handleDeleteCF(cfRecetas,setCfRecetas,id)}
          />
          <div style={{...S.infoBlue,marginBottom:14}}>{"Estos costos se distribuyen entre las galletas de cada lote."}</div>
          <SeccionCostos
            titulo="Otros Costos Fijos"
            items={cfOtros}
            onSave={(editId,nombre,monto)=>handleSaveCF(cfOtros,setCfOtros,editId,nombre,monto)}
            onDelete={(id)=>handleDeleteCF(cfOtros,setCfOtros,id)}
            color={"#6a1b9a"}
          />
          <div style={{...S.infoBlue,marginBottom:14}}>{"Empaques y etiquetas se suman al costo de cada pack vendido."}</div>
          {recetas.length>0&&(
            <div style={S.card}>
              <div style={{fontWeight:700,fontSize:14,color:"#c2185b",marginBottom:12}}>{"Impacto del gas por galleta"}</div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr><th style={S.th}>{"Galleta"}</th><th style={S.th}>{"Uds./lote"}</th><th style={{...S.th,textAlign:"right"}}>{"Gas por unidad"}</th></tr></thead>
                <tbody>{recetas.map((r,i)=>(
                  <tr key={r.id} style={{background:i%2===0?"#fff":"#fff8f9"}}>
                    <td style={S.td}>{r.nombre}</td>
                    <td style={{...S.td,color:"#aaa"}}>{r.porciones}</td>
                    <td style={{...S.td,textAlign:"right",fontWeight:700,color:"#c2185b"}}>{fmt(totalCFR/r.porciones)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
}
