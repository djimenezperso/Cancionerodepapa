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
 ".ed{position:relative;z-index:3;background:var(--sheet);border:2px solid var(--beat-odd);border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;gap:6px;box-shadow:0 -4px 16px rgb(0 0 0 / .12)}"+
 ".ed button{font-size:13px!important;padding:3px 8px!important;min-height:32px!important;border-radius:7px!important}"+
 ".ed .sepv{width:1px;align-self:stretch;background:var(--line);margin:0 2px}"+
 ".ed .live{font-size:14px;color:var(--muted);min-height:1.2em;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
 ".ed .done{font-size:14px;font-weight:700;color:var(--beat-even);margin:0}"+
 ".ed .help{font-size:13px;color:var(--muted);margin:0}"+
 ".ed .r{display:flex;flex-wrap:wrap;gap:6px;align-items:center}"+
 ".ed .t{font-weight:700;font-size:15px}"+
 ".ed button.on{background:var(--beat-odd);color:var(--sheet);border-color:var(--beat-odd)}"+
 ".ed button.nchip{color:var(--note);font-family:var(--f-hand);font-size:18px}"+
 ".ed button.nchip.on{background:var(--note);border-color:var(--note);color:var(--sheet)}"+
 ".ed .big{font-family:var(--f-hand);font-weight:700;font-size:22px;color:var(--note);min-width:2.6em;text-align:center}"+
 ".ed select,.ed input{font:inherit;font-size:16px;border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:var(--bg);color:var(--ink);min-height:40px}"+
 ".ed input{width:9em}";
css.textContent+=
 "html,body{height:100%;overflow:hidden}"+
 "#app{height:100vh;overflow:auto;box-sizing:border-box;padding:0 2px 30px}"+
 ".lay.wide{display:grid;grid-template-columns:minmax(0,1fr) 200px;gap:14px;align-items:start}"+
 ".lay.wide .side{position:sticky;top:8px;display:flex;flex-direction:column;gap:10px;max-height:calc(100vh - 16px);overflow:auto}"+
 ".lay.wide .rbar{position:static;flex-direction:column;align-items:stretch;border-bottom:0;padding:0;margin:0}"+
 ".lay.wide .rbar .grp{display:flex;gap:4px;align-items:center;justify-content:space-between}"+
 ".lay.wide .rbar .grp button{flex:1}"+
 ".lay.wide .ed{margin:0} .lay.wide .ed .r{gap:4px} .lay.wide .ed button{padding:5px 8px;font-size:14px;min-height:36px}"+
 ".lay.wide .ed select,.lay.wide .ed input{width:100%}"+
 ".lay.wide .hint{margin:0}"+
 ".lay:not(.wide) .side{position:sticky;top:0;z-index:4;background:var(--bg)}"+
 ".lay:not(.wide) .rbar{gap:4px;padding:6px 0;margin-bottom:8px}"+
 ".lay:not(.wide) .rbar button{font-size:13px;padding:3px 8px;min-height:34px}"+
 ".lay:not(.wide) .rbar .grp{display:inline-flex;gap:3px;align-items:center}"+
 ".lay .bottom{position:sticky;bottom:0;z-index:4;background:var(--bg);padding-top:6px}"+
 ".lay .bottom .ed{max-height:34vh;overflow:auto;margin:0}";
document.head.appendChild(css);

var NAMES=["Do","Re","Mi","Fa","Sol","La","Si"],SH=["Do","Do#","Re","Re#","Mi","Fa","Fa#","Sol","Sol#","La","La#","Si"],FL=["Do","Reb","Re","Mib","Mi","Fa","Solb","Sol","Lab","La","Sib","Si"];
var DURS=[["redonda",4],["blanca con puntillo",3],["blanca",2],["negra con puntillo",1.5],["negra",1],["corchea con puntillo",0.75],["corchea",0.5],["semicorchea",0.25]];
var DSHORT=[["Redonda",4],["Blanca·",3],["Blanca",2],["Negra·",1.5],["Negra",1],["Corchea·",0.75],["Corchea",0.5],["Semi",0.25]];
var st=window.__vst||(window.__vst={i:-1,k:0,size:22,bpm:80,click:true,mel:true,score:false,edit:false});
var PREF="cdp-visor-v1";
try{ var sv=JSON.parse(localStorage.getItem(PREF)||"{}"); ["score","size","click","mel","edit"].forEach(function(k){ if(k in sv) st[k]=sv[k]; }); }catch(e){}
function savePrefs(){ try{ localStorage.setItem(PREF,JSON.stringify({score:st.score,size:st.size,click:st.click,mel:st.mel,edit:st.edit})); }catch(e){} }
var dict={on:false,rec:null,interim:"",last:"",undo:[],err:""};
var S,pl=window.__vpl||(window.__vpl=new CORE.Player()),root=document.getElementById("app"),lastEl=null,dirty=false,selPath=null,selNote=0,selPaths=[],multi=false,ligar=false,showHelp=false;

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
  pl.stop(); savePrefs(); var s=S[st.i]; var keepScroll=root.scrollTop; root.replaceChildren(); document.documentElement.style.setProperty("--size",st.size+"px");
  var wide=root.clientWidth>=760; lastWide=wide;
  var lay=document.createElement("div"); lay.className="lay"+(wide?" wide":""); var main=document.createElement("div"),side=document.createElement("div"); side.className="side";
  var panel=side; // en estrecho, los paneles van abajo y fijos
  if(wide){ lay.append(main,side); } else { var bottom=document.createElement("div"); bottom.className="bottom"; lay.append(side,main,bottom); panel=bottom; }
  root.appendChild(lay);
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
  function grp(){ var g=document.createElement("div"); g.className="grp"; for(var i=0;i<arguments.length;i++) g.appendChild(arguments[i]); return g; }
  bar.append(pb,grp(sp("♩=","lbl"),b("−",function(){st.bpm=Math.max(30,st.bpm-4);show();},"","Más lento"),sp(st.bpm),b("+",function(){st.bpm=Math.min(240,st.bpm+4);show();},"","Más rápido")),
    grp(b("Metrónomo",function(){st.click=!st.click;show();},st.click?"":"off"),b("Melodía",function(){st.mel=!st.mel;show();},st.mel?"":"off")),
    grp(sp("Tono","lbl"),b("−",function(){st.k=Math.max(-12,st.k-1);show();},"","Bajar medio tono"),sp((st.k>0?"+":"")+st.k),b("+",function(){st.k=Math.min(12,st.k+1);show();},"","Subir medio tono")),
    grp(b("A−",function(){st.size=Math.max(14,st.size-2);show();},"","Letra más pequeña"),b("A+",function(){st.size=Math.min(40,st.size+2);show();},"","Letra más grande")));
  side.appendChild(bar);
  if(dict.err){ var er=document.createElement("p"); er.className="hint"; er.textContent=dict.err; side.appendChild(er); dict.err=""; }
  if(dict.on) panel.appendChild(dictPanel());
  else if(st.edit&&!selPath){ var h=document.createElement("p"); h.className="hint"; h.textContent="Toca la nota que quieras cambiar."+(st.k?" (Para cambiar notas, pon el tono a 0.)":""); side.appendChild(h); }
  var pg=document.createElement("div"); pg.className="page"+(st.edit?" editing":""); main.appendChild(pg);
  if(st.score&&window.SCORE){ pg.classList.add("plain"); SCORE.render(s,pg,{transpose:st.k}); }
  else CORE.render(s,pg,{transpose:st.k});
  if(st.edit&&!st.k){
    pg.addEventListener("click",function(e){ var t=e.target.closest("[data-p]"); if(!t||!t.dataset.p) return;
      var p=t.dataset.p;
      if(multi&&selPath){ var all=allPaths(),a=all.indexOf(selPath),z=all.indexOf(p); selPaths=all.slice(Math.min(a,z),Math.max(a,z)+1); }
      else { selPath=p; selPaths=[p]; }
      selNote=0; show(); });
    if(selPath&&dict.on){ pg.querySelectorAll('[data-p="'+selPath+'"]').forEach(function(x){x.classList.add("sel"); setTimeout(function(){ x.scrollIntoView({block:"center",behavior:"smooth"}); },30);}); }
    else if(selPath){
      if(!selPaths.length||selPaths.indexOf(selPath)<0) selPaths=[selPath];
      var se=[]; selPaths.forEach(function(sp2){ pg.querySelectorAll('[data-p="'+sp2+'"]').forEach(function(x){ x.classList.add("sel"); se.push(x); }); });
      var ed=selPaths.length>1?multiEditor(s):editor(s); panel.appendChild(ed);
      if(!wide&&se.length) setTimeout(function(){ se[0].scrollIntoView({block:"center",behavior:"smooth"}); },30);
    }
  }
  root.scrollTop=keepScroll;
  if(!window.EMBEDDED){ try{ navigator.wakeLock&&navigator.wakeLock.request("screen").catch(function(){}); }catch(e){} }
}
function durRow(apply,cur){
  var r=document.createElement("div"); r.className="r";
  r.append(sp(cur!==undefined?("Duración: "+(cur?durText(cur):"—")):"Duración:","lbl"));
  DSHORT.forEach(function(d){ var bt=b(d[0],function(){ apply(d[1],ligar); ligar=false; changed(); }); bt.title=DURS.filter(function(x){return x[1]===d[1];})[0][0]; r.append(bt); });
  r.append(b(ligar?"+ ligar ✓":"+ ligar",function(){ ligar=!ligar; show(); },ligar?"on":""),b("✕",function(){ apply(null); changed(); },"","Quitar duración"));
  return r;
}
function navRow(){
  var r=document.createElement("div"); r.className="r";
  var rb=document.createElement("div"); rb.className="r";
  if(selPaths.length<=1) rb.append(b("1 aquí",oneHere,"","Poner el primer tiempo del compás en esta nota"));
  rb.append(sp("Compás","lbl"),b("◀",function(){ shiftBeats(-1); },"","Correr las barras un tiempo a la izquierda"),b("▶",function(){ shiftBeats(1); },"","Correr las barras un tiempo a la derecha"),
    b("◀ ½",function(){ shiftBeats(-0.5); },"","Correr medio tiempo a la izquierda"),b("½ ▶",function(){ shiftBeats(0.5); },"","Correr medio tiempo a la derecha"));
  r.append(b("◀",function(){ move(-1); },"","Anterior"),b("▶",function(){ move(1); },"","Siguiente"),
    b(multi?"Varias ✓":"Varias",function(){ multi=!multi; if(!multi){ selPaths=[selPath]; } show(); },multi?"on":""),
    b("Cerrar",function(){ selPath=null; selPaths=[]; multi=false; show(); }));
  if(dirty) r.append(b("💾 Guardar",save,"pri"));
  var w=document.createElement("div"); w.style.display="contents"; w.append(rb,r);
  return w;
}
function editor(s){
  var u=unitAt(selPath),M=CORE.beatsPerBar(s.ts),ed=document.createElement("div"); ed.className="ed";
  if(!u.n) u.n=[];
  var top=document.createElement("div"); top.className="r";
  top.append(sp("«"+(u.t||"")+"»","t"));
  u.n.forEach(function(n,i){ top.append(b(n,function(){ selNote=i; show(); },"nchip"+(i===selNote?" on":""))); });
  top.append(b("+",function(){ u.n.push(u.n.length?u.n[u.n.length-1]:"Do"); selNote=u.n.length-1; changed(); },"","Añadir nota a esta sílaba"));
  if(u.n.length>1) top.append(b("−",function(){ u.n.splice(selNote,1); selNote=0; changed(); },"","Quitar esta nota"));
  var bsel=document.createElement("select"); bsel.setAttribute("aria-label","Tiempo"); bsel.append(new Option("T: —",""));
  for(var i=1;i<=M;i++) bsel.append(new Option("T: "+i,String(i))); bsel.value=u.b?String(u.b):"";
  bsel.onchange=function(){ if(bsel.value) u.b=+bsel.value; else delete u.b; delete u.pos; changed(); };
  bsel.style.width="auto"; top.append(bsel);
  ed.append(top);
  if(u.n.length){
    var p=parse(u.n[selNote]);
    var setp=function(np){ u.n[selNote]=fmt(np); beep(u.n[selNote]); changed(); };
    var r1=document.createElement("div"); r1.className="r";
    NAMES.forEach(function(nm){ r1.append(b(nm,function(){ setp({l:nm,a:p.a,o:p.o}); },p.l===nm?"on":"")); });
    r1.append(el2("sepv"));
    [["","♮"],["#","♯"],["b","♭"]].forEach(function(a){ r1.append(b(a[1],function(){ setp({l:p.l,a:a[0],o:p.o}); },p.a===a[0]?"on":"")); });
    ed.append(r1);
    var r2=document.createElement("div"); r2.className="r";
    r2.append(sp(fmt(p),"big"),b("▼",function(){ setp(fromMidi(midiOf(p)-1,false)); },"","Bajar medio tono"),b("▲",function(){ setp(fromMidi(midiOf(p)+1,true)); },"","Subir medio tono"),
      el2("sepv"),sp("Oct.","lbl"),b("−",function(){ setp({l:p.l,a:p.a,o:Math.max(1,p.o-1)}); },"","Octava más baja"),sp(String(p.o)),b("+",function(){ setp({l:p.l,a:p.a,o:Math.min(7,p.o+1)}); },"","Octava más alta"),
      b("🔊",function(){ beep(u.n[selNote]); },"","Oír la nota"));
    ed.append(r2);
  }
  ed.append(durRow(function(v,add){ if(v===null){ delete u.d; return; } u.d=add&&u.d?Math.round((u.d+v)*100)/100:v; },u.d||0));
  ed.append(navRow());
  return ed;
}
function multiEditor(s){
  var ed=document.createElement("div"),units=selPaths.map(unitAt); ed.className="ed";
  var top=document.createElement("div"); top.className="r";
  top.append(sp(units.length+" notas: «"+(units[0].t||"")+"» … «"+(units[units.length-1].t||"")+"»","t"));
  ed.append(top);
  function shiftAll(k){ units.forEach(function(u){ u.n=(u.n||[]).map(function(n){ var p=parse(n); return fmt(fromMidi(midiOf(p)+k,k>0)); }); }); changed(); }
  function octAll(k){ units.forEach(function(u){ u.n=(u.n||[]).map(function(n){ var p=parse(n); p.o=Math.max(1,Math.min(7,p.o+k)); return fmt(p); }); }); changed(); }
  var r=document.createElement("div"); r.className="r";
  r.append(sp("Todas:","lbl"),b("▼ medio tono",function(){ shiftAll(-1); }),b("▲ medio tono",function(){ shiftAll(1); }),el2("sepv"),b("Octava −",function(){ octAll(-1); }),b("Octava +",function(){ octAll(1); }));
  ed.append(r);
  ed.append(durRow(function(v,add){ units.forEach(function(u){ if(v===null) delete u.d; else u.d=add&&u.d?Math.round((u.d+v)*100)/100:v; }); }));
  var h=document.createElement("p"); h.className="help"; h.textContent="Con «Varias» activado, toca la primera y la última nota del trozo."; ed.append(h);
  ed.append(navRow());
  return ed;
}
/* mover las barras de compás: se recalculan los números de tiempo de todas las sílabas */
function shiftBeats(delta){
  var s=S[st.i],M=CORE.beatsPerBar(s.ts),tl=CORE.timeline(s),paths=allPaths(),intD=Math.abs(delta-Math.round(delta))<1e-6;
  paths.forEach(function(p,i){
    var u=unitAt(p),it=tl.items[i]; if(!it) return;
    if(typeof u.pos==="number"){ u.pos=Math.round((u.pos+delta)*1000)/1000; if(typeof u.e==="number") u.e=Math.round((u.e+delta)*1000)/1000; }
    var ns=it.start-tl.origin+delta;
    if(Math.abs(ns-Math.round(ns))<1e-6) u.b=((Math.round(ns)%M)+M)%M+1; else delete u.b;
    if(u.u){ if(intD) u.u=((((u.u-1+Math.round(delta))%M)+M)%M)+1; else delete u.u; }
  });
  changed();
}
function oneHere(){
  var s=S[st.i],M=CORE.beatsPerBar(s.ts),tl=CORE.timeline(s),i=allPaths().indexOf(selPath); if(i<0) return;
  var pos=tl.items[i].start-tl.origin,m=((pos%M)+M)%M; if(Math.abs(m)<1e-6) return;
  shiftBeats(m<=M/2?-m:M-m);
}
function el2(c){ var e=document.createElement("span"); e.className=c; return e; }
function durText(v){
  // descompone en figuras para mostrarlo: 5.5 → "redonda + negra con puntillo"
  var out=[],left=v; DURS.forEach(function(d){ while(left>=d[1]-1e-6){ out.push(d[0]); left=Math.round((left-d[1])*1000)/1000; } });
  return (out.length?out.join(" + "):"")+" ("+(Math.round(v*100)/100)+" pulsos)";
}
function move(dir){
  var all=[],s=S[st.i]; s.sections.forEach(function(sec,si){ sec.lines.forEach(function(l,li){ l.units.forEach(function(u,ui){ all.push(si+"."+li+"."+ui); }); }); });
  var i=all.indexOf(selPath)+dir; if(i>=0&&i<all.length){ selPath=all[i]; selPaths=[selPath]; selNote=0; show(); }
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
  var u=selPath?unitAt(selPath):null;
  r1.append(sp("🎙","t"),sp(u?("«"+(u.t||"")+"» "+((u.n||[]).join("-")||"—")+(u.d?" · "+durText(u.d).replace(/ \(.*$/,""):"")):"","t"));
  r1.append(el2("sepv"),b("◀",function(){ move(-1); },"","Anterior"),b("▶",function(){ move(1); },"","Siguiente"),b("↩",undoCmd,"","Deshacer"),b("?",function(){ showHelp=!showHelp; show(); },showHelp?"on":"","Ayuda"));
  if(dirty) r1.append(b("💾 Guardar",save,"pri"));
  d.append(r1);
  var live=document.createElement("p"); live.id="dict-live"; live.className="live"; live.textContent=dict.interim?"… "+dict.interim:(dict.last?"":"Habla: «Fa negra», «Sol corchea»…"); d.append(live);
  if(dict.last){ var la=document.createElement("p"); la.className="done"; la.textContent="✔ "+dict.last; d.append(la); }
  if(showHelp){ var h=document.createElement("p"); h.className="help";
    h.textContent="Nota y figura, y pasa sola a la siguiente: «Fa negra», «Si bemol blanca», «Do cuatro corchea», «redonda ligada a negra con puntillo», «igual corchea». Varias seguidas: «Sol corchea, La negra, Sol negra». Otras: «siguiente», «anterior», «ir a love», «silencio de negra», «tiempo uno», «deshacer».";
    d.append(h); }
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
var lastWide=null,rsz=null;
window.addEventListener("resize",function(){ clearTimeout(rsz); rsz=setTimeout(function(){ if(st.i>=0&&S&&S.length&&((root.clientWidth>=760)!==lastWide)) show(); },150); });
function start(){
  S=JSON.parse(JSON.stringify(window.SONGS||[])); dirty=false; selPath=null;
  if(!S.length){ root.textContent="No hay canciones."; return; }
  if(S.length===1){ st.i=0; if(!window.__vstarted) st.bpm=S[0].tempo||80; window.__vstarted=true; show(); } else list();
}
window.__viewerStart=start;
window.__dictTest=function(t){ st.edit=true; if(!selPath) selPath=allPaths()[0]; runCmd(t); return {song:S[st.i],sel:selPath,last:dict.last}; };
start();
})();
