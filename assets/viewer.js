(function(){
var css=document.createElement("style");
css.textContent=
 "body{margin:0;background:var(--bg);font-family:var(--f-text);padding:0 max(12px,env(safe-area-inset-left,0px)) 40px max(12px,env(safe-area-inset-right,0px))}"+
 "h1{font-family:var(--f-hand);font-size:30px;margin:14px 0 10px;color:var(--ink)}"+
 ".rbar{position:sticky;top:0;background:var(--bg);display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 0;z-index:2;border-bottom:1px solid var(--line);margin-bottom:12px}"+
 ".rbar button,.ed button{font:inherit;font-weight:700;font-size:15px;border:1px solid var(--line);background:var(--sheet);color:var(--ink);border-radius:9px;padding:6px 11px;min-height:40px;cursor:pointer}"+
 ".rbar button.pri,.ed button.pri{background:var(--beat-odd);color:var(--sheet);border-color:var(--beat-odd)}"+
 ".rbar button.ok{background:var(--beat-even);color:var(--sheet);border-color:var(--beat-even)}"+
 ".rbar button.off{opacity:.5}"+
 ".rbar button.sw,.rbar button.edon{border-color:var(--beat-odd);color:var(--beat-odd)}"+
 ".rbar button.edon{background:var(--rule)}"+
 "button:focus-visible,li button:focus-visible{outline:2px solid var(--beat-odd);outline-offset:2px}"+
 ".v{min-width:2.6em;text-align:center;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}"+
 ".lbl{font-size:13px;color:var(--muted)}"+
 ".hint{font-size:14px;color:var(--beat-odd);background:var(--rule);border-radius:8px;padding:8px 10px;margin:0 0 10px}"+
 "ul{list-style:none;margin:0;padding:0;background:var(--sheet);border-radius:10px;border:1px solid var(--line)} li+li{border-top:1px solid var(--line)}"+
 "li button{all:unset;display:flex;justify-content:space-between;gap:10px;width:100%;box-sizing:border-box;padding:14px 12px;font-weight:700;text-transform:uppercase;font-size:16px;cursor:pointer;color:var(--ink)}"+
 "li span{color:var(--muted);font-weight:400;text-transform:none;font-size:14px}"+
 ".page.plain{background-image:none;padding:18px 12px 20px}"+
 ".page{background:var(--sheet);border:1px solid var(--line);border-radius:10px;padding:20px 16px 24px 30px;"+
 "background-image:linear-gradient(90deg,transparent 16px,var(--margin) 16px,var(--margin) 18px,transparent 18px),repeating-linear-gradient(180deg,transparent 0 31px,var(--rule) 31px 32px)}"+
 ".editing [data-p]{cursor:pointer} .editing .u:hover{background:var(--rule)} .editing .sn:hover .head{fill:var(--beat-odd)}"+
 ".sel{background:var(--now)!important;outline:2px solid var(--beat-odd);outline-offset:1px;border-radius:6px} .sn.sel .head{fill:var(--beat-odd);stroke:var(--beat-odd)}"+
 ".ed{position:relative;z-index:3;margin-bottom:12px;background:var(--sheet);border:2px solid var(--beat-odd);border-radius:12px;padding:12px;margin-top:12px;display:flex;flex-direction:column;gap:10px;box-shadow:0 -4px 16px rgb(0 0 0 / .12)}"+
 ".ed .r{display:flex;flex-wrap:wrap;gap:6px;align-items:center}"+
 ".ed .t{font-weight:700;font-size:17px}"+
 ".ed button.on{background:var(--beat-odd);color:var(--sheet);border-color:var(--beat-odd)}"+
 ".ed button.nchip{color:var(--note);font-family:var(--f-hand);font-size:18px}"+
 ".ed button.nchip.on{background:var(--note);border-color:var(--note);color:var(--sheet)}"+
 ".ed .big{font-family:var(--f-hand);font-weight:700;font-size:30px;color:var(--note);min-width:3.2em;text-align:center}"+
 ".ed select,.ed input{font:inherit;font-size:16px;border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:var(--bg);color:var(--ink);min-height:40px}"+
 ".ed input{width:9em}";
document.head.appendChild(css);

var NAMES=["Do","Re","Mi","Fa","Sol","La","Si"],SH=["Do","Do#","Re","Re#","Mi","Fa","Fa#","Sol","Sol#","La","La#","Si"],FL=["Do","Reb","Re","Mib","Mi","Fa","Solb","Sol","Lab","La","Sib","Si"];
var DURS=[["redonda",4],["blanca con puntillo",3],["blanca",2],["negra con puntillo",1.5],["negra",1],["corchea con puntillo",0.75],["corchea",0.5],["semicorchea",0.25]];
var st=window.__vst||(window.__vst={i:-1,k:0,size:22,bpm:80,click:true,mel:true,score:false,edit:false});
var PREF="cdp-visor-v1";
try{ var sv=JSON.parse(localStorage.getItem(PREF)||"{}"); ["score","size","click","mel","edit"].forEach(function(k){ if(k in sv) st[k]=sv[k]; }); }catch(e){}
function savePrefs(){ try{ localStorage.setItem(PREF,JSON.stringify({score:st.score,size:st.size,click:st.click,mel:st.mel,edit:st.edit})); }catch(e){} }
var dict={on:false,rec:null,interim:"",last:"",undo:[],err:""};
var S,pl=window.__vpl||(window.__vpl=new CORE.Player()),root=document.getElementById("app"),lastEl=null,dirty=false,selPath=null,selNote=0;

function b(t,f,c,lab){ var e=document.createElement("button"); e.type="button"; e.textContent=t; e.onclick=f; if(c) e.className=c; if(lab) e.setAttribute("aria-label",lab); return e; }
function sp(t,c){ var e=document.createElement("span"); e.className=c||"v"; e.textContent=t; return e; }
function unitAt(p){ var a=p.split(".").map(Number),s=S[st.i]; return s.sections[a[0]].lines[a[1]].units[a[2]]; }
function parse(n){ var m=String(n||"").trim().match(/^(do|re|mi|fa|sol|la|si)\s*(#|b)?\s*([0-8])?/i); if(!m) return {l:"Do",a:"",o:3}; return {l:m[1].charAt(0).toUpperCase()+m[1].slice(1).toLowerCase(),a:m[2]||"",o:m[3]?+m[3]:3}; }
function fmt(p){ return p.l+p.a+(p.o!==3?p.o:""); }
function midiOf(p){ var pc={Do:0,Re:2,Mi:4,Fa:5,Sol:7,La:9,Si:11}[p.l]+(p.a==="#"?1:p.a==="b"?-1:0); return 12*(p.o+1)+pc; }
function fromMidi(m,up){ var n=(up?SH:FL)[((m%12)+12)%12],mm=n.match(/^(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?$/); return {l:mm[1],a:mm[2]||"",o:Math.floor(m/12)-1}; }
var actx=null;
function beep(n){ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); var p=parse(n),f=440*Math.pow(2,(midiOf(p)+st.k-69)/12),t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain(); o.type="triangle"; o.frequency.value=f; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.25,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+.7); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+.75); }catch(e){} }

function list(){
  pl.stop(); root.replaceChildren();
  var h=document.createElement("h1"); h.textContent="Cancionero de Papá"; root.appendChild(h);
  var ul=document.createElement("ul");
  S.map(function(s,i){return {s:s,i:i};}).sort(function(a,c){return (a.s.title||"").localeCompare(c.s.title||"","es");}).forEach(function(o){
    var li=document.createElement("li"),bt=b("",function(){ st.i=o.i; st.k=0; st.bpm=o.s.tempo||80; show(); });
    bt.append(document.createTextNode(o.s.title||"Sin título"),sp((o.s.ts||"")+(o.s.page?" · hoja "+o.s.page:""),"")); li.appendChild(bt); ul.appendChild(li);
  });
  root.appendChild(ul);
}
function show(){
  pl.stop(); savePrefs(); var s=S[st.i]; root.replaceChildren(); document.documentElement.style.setProperty("--size",st.size+"px");
  var bar=document.createElement("div"); bar.className="rbar";
  var pb=b("▶ Escuchar",function(){
    if(pl.playing){ pl.stop(); return; }
    if(pl.play(s,{tempo:st.bpm,transpose:st.k,click:st.click,melody:st.mel,onTick:tick,onEnd:function(){ pb.textContent="▶ Escuchar"; tick(null); }})) pb.textContent="■ Parar";
  },"pri");
  if(S.length>1) bar.append(b("← Lista",list));
  bar.append(b(st.score?"📝 Como en la hoja":"🎼 Partitura",function(){ st.score=!st.score; show(); },"sw"));
  if(window.EDITABLE) bar.append(b(st.edit?"✏️ Terminar":"✏️ Cambiar notas",function(){ st.edit=!st.edit; selPath=null; if(!st.edit) stopDict(); show(); },st.edit?"edon":""));
  if(window.EDITABLE&&SR) bar.append(b(dict.on?"⏹ Parar dictado":"🎤 Dictar",function(){ if(dict.on) stopDict(); else startDict(); show(); },dict.on?"ok":""));
  if(dirty){ bar.append(b("💾 Guardar cambios",save,"ok"),b("Deshacer",function(){ S=JSON.parse(JSON.stringify(window.SONGS)); dirty=false; selPath=null; show(); })); }
  bar.append(pb,sp("♩=","lbl"),b("−",function(){st.bpm=Math.max(30,st.bpm-4);show();},"","Más lento"),sp(st.bpm),b("+",function(){st.bpm=Math.min(240,st.bpm+4);show();},"","Más rápido"),
    b("Metrónomo",function(){st.click=!st.click;show();},st.click?"":"off"),b("Melodía",function(){st.mel=!st.mel;show();},st.mel?"":"off"),
    sp("Tono","lbl"),b("−",function(){st.k=Math.max(-12,st.k-1);show();},"","Bajar medio tono"),sp((st.k>0?"+":"")+st.k),b("+",function(){st.k=Math.min(12,st.k+1);show();},"","Subir medio tono"),
    b("A−",function(){st.size=Math.max(14,st.size-2);show();},"","Letra más pequeña"),b("A+",function(){st.size=Math.min(40,st.size+2);show();},"","Letra más grande"));
  root.appendChild(bar);
  if(dict.err){ var er=document.createElement("p"); er.className="hint"; er.textContent=dict.err; root.appendChild(er); dict.err=""; }
  if(dict.on) root.appendChild(dictPanel());
  else if(st.edit){ var h=document.createElement("p"); h.className="hint"; h.textContent="Toca la nota que quieras cambiar."+(st.k?" (Para cambiar notas, pon el tono a 0.)":""); root.appendChild(h); }
  var pg=document.createElement("div"); pg.className="page"+(st.edit?" editing":""); root.appendChild(pg);
  if(st.score&&window.SCORE){ pg.classList.add("plain"); SCORE.render(s,pg,{transpose:st.k}); }
  else CORE.render(s,pg,{transpose:st.k});
  if(st.edit&&!st.k){
    pg.addEventListener("click",function(e){ var t=e.target.closest("[data-p]"); if(!t||!t.dataset.p) return; selPath=t.dataset.p; selNote=0; show(); });
    if(selPath&&dict.on){ pg.querySelectorAll('[data-p="'+selPath+'"]').forEach(function(x){x.classList.add("sel"); setTimeout(function(){ x.scrollIntoView({block:"center",behavior:"smooth"}); },30);}); }
    else if(selPath){
      var se=pg.querySelectorAll('[data-p="'+selPath+'"]'); se.forEach(function(x){x.classList.add("sel");});
      var ed=editor(s),anchor=se.length?(se[0].closest(".sv-line")||se[0].closest("svg")):null;
      if(anchor) anchor.after(ed); else root.appendChild(ed);
      setTimeout(function(){ ed.scrollIntoView({block:"nearest",behavior:"smooth"}); },30);
    }
  }
  if(!window.EMBEDDED){ try{ navigator.wakeLock&&navigator.wakeLock.request("screen").catch(function(){}); }catch(e){} }
}
function editor(s){
  var u=unitAt(selPath),M=CORE.beatsPerBar(s.ts),ed=document.createElement("div"); ed.className="ed";
  if(!u.n) u.n=[];
  var top=document.createElement("div"); top.className="r";
  top.append(sp("«"+(u.t||"")+"»","t"));
  u.n.forEach(function(n,i){ top.append(b(n,function(){ selNote=i; show(); },"nchip"+(i===selNote?" on":""))); });
  top.append(b("+ nota",function(){ u.n.push(u.n.length?u.n[u.n.length-1]:"Do"); selNote=u.n.length-1; changed(); }));
  if(u.n.length) top.append(b("Quitar nota",function(){ u.n.splice(selNote,1); selNote=0; changed(); }));
  ed.append(top);
  if(u.n.length){
    var p=parse(u.n[selNote]);
    function setp(np){ u.n[selNote]=fmt(np); beep(u.n[selNote]); changed(); }
    var r1=document.createElement("div"); r1.className="r";
    NAMES.forEach(function(nm){ r1.append(b(nm,function(){ setp({l:nm,a:p.a,o:p.o}); },p.l===nm?"on":"")); });
    ed.append(r1);
    var r2=document.createElement("div"); r2.className="r";
    [["",'natural'],["#","♯ sostenido"],["b","♭ bemol"]].forEach(function(a){ r2.append(b(a[1],function(){ setp({l:p.l,a:a[0],o:p.o}); },p.a===a[0]?"on":"")); });
    r2.append(sp(fmt(p),"big"));
    r2.append(b("▼ medio tono",function(){ setp(fromMidi(midiOf(p)-1,false)); }),b("▲ medio tono",function(){ setp(fromMidi(midiOf(p)+1,true)); }));
    ed.append(r2);
    var r3=document.createElement("div"); r3.className="r";
    r3.append(sp("Octava","lbl"),b("−",function(){ setp({l:p.l,a:p.a,o:Math.max(1,p.o-1)}); },"","Octava más baja"),sp(String(p.o)),b("+",function(){ setp({l:p.l,a:p.a,o:Math.min(7,p.o+1)}); },"","Octava más alta"),b("🔊 Oír",function(){ beep(u.n[selNote]); }));
    ed.append(r3);
  }
  var r4=document.createElement("div"); r4.className="r";
  var bsel=document.createElement("select"); bsel.setAttribute("aria-label","Tiempo"); bsel.append(new Option("Tiempo: —",""));
  for(var i=1;i<=M;i++) bsel.append(new Option("Tiempo: "+i,String(i))); bsel.value=u.b?String(u.b):"";
  bsel.onchange=function(){ if(bsel.value) u.b=+bsel.value; else delete u.b; delete u.pos; changed(); };
  var txt=document.createElement("input"); txt.value=u.t||""; txt.setAttribute("aria-label","Sílaba");
  txt.onchange=function(){ u.t=txt.value; changed(); };
  r4.append(bsel,sp("Sílaba","lbl"),txt);
  ed.append(r4);
  // duración: se tocan figuras y se suman (ligaduras)
  var r6=document.createElement("div"); r6.className="r";
  r6.append(sp("Duración: "+(u.d?durText(u.d):"sin poner"),"t"));
  ed.append(r6);
  var r7=document.createElement("div"); r7.className="r";
  r7.append(sp(u.d?"Sumar (ligar):":"Elige:","lbl"));
  DURS.forEach(function(d){ r7.append(b(d[0],function(){ u.d=Math.round(((u.d||0)+d[1])*100)/100; changed(); })); });
  if(u.d) r7.append(b("Borrar duración",function(){ delete u.d; changed(); }));
  ed.append(r7);
  var r5=document.createElement("div"); r5.className="r";
  r5.append(b("◀ Anterior",function(){ move(-1); }),b("Siguiente ▶",function(){ move(1); }),b("Cerrar",function(){ selPath=null; show(); }));
  if(dirty) r5.append(b("💾 Guardar cambios",save,"pri"));
  ed.append(r5);
  return ed;
}
function durText(v){
  // descompone en figuras para mostrarlo: 5.5 → "redonda + negra con puntillo"
  var out=[],left=v; DURS.forEach(function(d){ while(left>=d[1]-1e-6){ out.push(d[0]); left=Math.round((left-d[1])*1000)/1000; } });
  return (out.length?out.join(" + "):"")+" ("+(Math.round(v*100)/100)+" pulsos)";
}
function move(dir){
  var all=[],s=S[st.i]; s.sections.forEach(function(sec,si){ sec.lines.forEach(function(l,li){ l.units.forEach(function(u,ui){ all.push(si+"."+li+"."+ui); }); }); });
  var i=all.indexOf(selPath)+dir; if(i>=0&&i<all.length){ selPath=all[i]; selNote=0; show(); }
}
function changed(){ dirty=true; show(); }

/* ---------- dictado en directo (reconocimiento de voz del navegador) ---------- */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function allPaths(){ var all=[],s=S[st.i]; s.sections.forEach(function(sec,si){ sec.lines.forEach(function(l,li){ l.units.forEach(function(u,ui){ all.push(si+"."+li+"."+ui); }); }); }); return all; }
function startDict(){
  if(!SR) return;
  if(st.k) st.k=0;
  st.edit=true; dict.on=true; dict.err=""; dict.interim=""; if(!selPath) selPath=allPaths()[0]; selNote=0;
  var r=new SR(); r.lang="es-ES"; r.continuous=true; r.interimResults=true; dict.rec=r;
  r.onresult=function(e){
    var inter="";
    for(var i=e.resultIndex;i<e.results.length;i++){ var t=e.results[i][0].transcript; if(e.results[i].isFinal) runCmd(t); else inter+=t; }
    dict.interim=inter; var el=document.getElementById("dict-live"); if(el) el.textContent=inter?"… "+inter:"";
  };
  r.onerror=function(e){ if(e.error==="not-allowed"||e.error==="service-not-allowed"){ dict.err="No hay permiso para usar el micrófono. Permítelo en el navegador y vuelve a pulsar «Dictar»."; dict.on=false; show(); } };
  r.onend=function(){ if(dict.on){ try{ r.start(); }catch(e){} } };
  try{ r.start(); }catch(e){}
}
function stopDict(){ dict.on=false; if(dict.rec){ try{ dict.rec.stop(); }catch(e){} } dict.rec=null; }
function dictPanel(){
  var d=document.createElement("div"); d.className="ed";
  var r1=document.createElement("div"); r1.className="r";
  r1.append(sp("🎙 Escuchando…","t"));
  if(selPath){ var u=unitAt(selPath); r1.append(sp("Ahora: «"+(u.t||"")+"» "+((u.n||[]).join("-")||"—")+(u.d?" · "+durText(u.d):""),"lbl")); }
  d.append(r1);
  var live=document.createElement("p"); live.id="dict-live"; live.className="lbl"; live.textContent=dict.interim?"… "+dict.interim:""; d.append(live);
  if(dict.last){ var la=document.createElement("p"); la.className="t"; la.textContent="✔ "+dict.last; d.append(la); }
  var r2=document.createElement("div"); r2.className="r";
  r2.append(b("◀ Anterior",function(){ move(-1); }),b("Siguiente ▶",function(){ move(1); }),b("↩ Deshacer",undoCmd));
  if(dirty) r2.append(b("💾 Guardar cambios",save,"pri"));
  d.append(r2);
  var h=document.createElement("p"); h.className="lbl";
  h.textContent="Di nota y figura y pasa sola a la siguiente: «Fa negra», «Si bemol blanca», «redonda ligada a negra con puntillo», «igual corchea». También: «siguiente», «anterior», «ir a love», «silencio de negra», «tiempo uno», «deshacer».";
  d.append(h);
  return d;
}
var NUMW={uno:1,un:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,doce:12};
var DURW={redonda:4,redondas:4,blanca:2,blancas:2,negra:1,negras:1,corchea:0.5,corcheas:0.5,semicorchea:0.25,semicorcheas:0.25,fusa:0.125};
var NOTEW={"do":"Do","re":"Re","mi":"Mi","fa":"Fa","sol":"Sol","la":"La","si":"Si","sí":"Si"};
function norm(t){ return String(t).toLowerCase().replace(/[áàä]/g,"a").replace(/[éè]/g,"e").replace(/[íì]/g,"i").replace(/[óò]/g,"o").replace(/[úü]/g,"u").replace(/[.,;:!¿?¡]/g," ").replace(/\s+/g," ").trim(); }
function undoCmd(){ if(!dict.undo.length) return; var u=dict.undo.pop(); S[st.i]=u.song; selPath=u.sel; dict.last="Deshecho"; dirty=true; show(); }
function runCmd(raw){
  var w=norm(raw).split(" ").filter(Boolean); if(!w.length) return;
  // trocear en órdenes: tras una figura, una nota nueva (o «igual») empieza la sílaba siguiente
  var segs=[],cur=[],seenDur=false;
  for(var i=0;i<w.length;i++){
    var x=w[i],isNote=!!NOTEW[x]||/^(do|re|mi|fa|sol|la|si)(#|b)?([1-7])?$/.test(x)||x==="igual"||x==="misma"||x==="mismo";
    if(seenDur&&isNote&&w[i-1]!=="silencio"){ segs.push(cur); cur=[]; seenDur=false; }
    cur.push(x); if(DURW[x]) seenDur=true;
  }
  if(cur.length) segs.push(cur);
  for(var k=0;k<segs.length;k++){ if(applyTokens(segs[k],segs.length>1?segs[k].join(" "):raw)===false) break; }
  show();
}
function applyTokens(w,raw){
  var s=S[st.i],paths=allPaths(); if(!selPath) selPath=paths[0];
  var snapshot={song:JSON.parse(JSON.stringify(s)),sel:selPath};
  var notes=[],dur=0,hasDur=false,rest=null,beat=null,nav=0,go=null,keep=false,clear=false,did=[];
  for(var i=0;i<w.length;i++){
    var x=w[i];
    if(x==="deshacer"||x==="deshaz"){ undoCmd(); return false; }
    if(x==="siguiente"||x==="adelante"||x==="vale"){ nav=1; continue; }
    if(x==="anterior"||x==="atras"||x==="volver"){ nav=-1; continue; }
    if((x==="ir"&&w[i+1]==="a")||x==="busca"||x==="buscar"){ var target=w[x==="ir"?i+2:i+1]; if(target){ go=target; i+=x==="ir"?2:1; } continue; }
    if(x==="igual"||x==="misma"||x==="mismo"){ keep=true; continue; }
    if(x==="borrar"||x==="quitar"){ clear=true; continue; }
    if(x==="tiempo"&&w[i+1]){ var bn=NUMW[w[i+1]]||parseInt(w[i+1],10); if(bn){ beat=bn; i++; } continue; }
    if(x==="silencio"){ var j=i+1; if(w[j]==="de") j++; if(DURW[w[j]]){ var rv=DURW[w[j]]; if(w[j+1]==="con"&&w[j+2]==="puntillo"){ rv*=1.5; j+=2; } else if(w[j+1]==="puntillo"){ rv*=1.5; j++; } rest=rv; i=j; } else rest=1; continue; }
    if(DURW[x]){ var dv=DURW[x]; if(w[i+1]==="con"&&w[i+2]==="puntillo"){ dv*=1.5; i+=2; } else if(w[i+1]==="puntillo"||w[i+1]==="punto"){ dv*=1.5; i++; } dur+=dv; hasDur=true; continue; }
    if(NOTEW[x]){
      var nt={l:NOTEW[x],a:"",o:null};
      if(w[i+1]==="sostenido"||w[i+1]==="#"){ nt.a="#"; i++; } else if(w[i+1]==="bemol"){ nt.a="b"; i++; }
      if(w[i+1]&&/^[1-7]$/.test(w[i+1])){ nt.o=+w[i+1]; i++; }
      else if(w[i+1]==="octava"&&w[i+2]&&(NUMW[w[i+2]]||/^[1-7]$/.test(w[i+2]))){ nt.o=NUMW[w[i+2]]||+w[i+2]; i+=2; }
      notes.push(nt); continue;
    }
    var mm=x.match(/^(do|re|mi|fa|sol|la|si)(#|b)?([1-7])?$/); if(mm){ notes.push({l:NOTEW[mm[1]],a:mm[2]||"",o:mm[3]?+mm[3]:null}); continue; }
  }
  if(go){ var idx=paths.indexOf(selPath),found=null;
    for(var k=1;k<=paths.length;k++){ var p=paths[(idx+k)%paths.length],t=norm(unitAt(p).t||"").replace(/-/g,""); if(t.indexOf(go)===0){ found=p; break; } }
    if(found){ selPath=found; selNote=0; dict.last="Ir a «"+unitAt(found).t+"»"; } else { dict.last="No encuentro «"+go+"»"; }
    return; }
  var u=unitAt(selPath),changedSome=false;
  if(clear){ delete u.d; delete u.r; changedSome=true; did.push("sin duración"); }
  if(notes.length&&!keep){
    var prev=(u.n||[]).map(parse);
    u.n=notes.map(function(nt,ix){ var o=nt.o; if(o===null){ var pv=prev[ix]||prev[0]; o=pv?pv.o:3; if(pv&&pv.l===nt.l) o=pv.o; } return fmt({l:nt.l,a:nt.a,o:o}); });
    beep(u.n[0]); changedSome=true; did.push(u.n.join("-"));
  }
  if(hasDur){ u.d=Math.round(dur*1000)/1000; delete u.pos; delete u.e; changedSome=true; did.push(durText(u.d)); }
  if(rest!==null){ u.r=rest; changedSome=true; did.push("silencio "+durText(rest)); }
  if(beat){ u.b=beat; changedSome=true; did.push("tiempo "+beat); }
  if(changedSome){ dict.undo.push(snapshot); if(dict.undo.length>50) dict.undo.shift(); dirty=true; dict.last="«"+(u.t||"")+"»: "+did.join(", "); }
  if(nav) { var ix2=paths.indexOf(selPath)+nav; if(ix2>=0&&ix2<paths.length){ selPath=paths[ix2]; selNote=0; } }
  else if(changedSome&&(notes.length||hasDur)){ var ix3=paths.indexOf(selPath)+1; if(ix3<paths.length){ selPath=paths[ix3]; selNote=0; } }
  if(!changedSome&&!nav){ dict.last="No he entendido: «"+raw.trim()+"»"; }
}
function save(){ stopDict(); if(window.onSongEdit){ window.onSongEdit(S[st.i]); dirty=false; selPath=null; st.edit=false; show(); } }
function tick(p){ if(lastEl) lastEl.classList.remove("now"); lastEl=null; if(!p) return; var e=document.querySelector('[data-p="'+p+'"]'); if(e){ e.classList.add("now"); lastEl=e; var r=e.getBoundingClientRect(); if(r.top<70||r.bottom>innerHeight-40) e.scrollIntoView({block:"center",behavior:"smooth"}); } }
function start(){
  S=JSON.parse(JSON.stringify(window.SONGS||[])); dirty=false; selPath=null;
  if(!S.length){ root.textContent="No hay canciones."; return; }
  if(S.length===1){ st.i=0; if(!window.__vstarted) st.bpm=S[0].tempo||80; window.__vstarted=true; show(); } else list();
}
window.__viewerStart=start;
window.__dictTest=function(t){ st.edit=true; if(!selPath) selPath=allPaths()[0]; runCmd(t); return {song:S[st.i],sel:selPath,last:dict.last}; };
start();
})();
