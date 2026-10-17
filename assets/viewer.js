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
 ".lay .bottom{display:flex;flex-direction:column;gap:4px;max-height:38vh;overflow:auto}"+
 ".lay .bottom .ed{margin:0}"+
 ".lay .bottom .fold{align-self:flex-end;font:inherit;font-size:13px;font-weight:700;border:1px solid var(--line);background:var(--sheet);color:var(--ink);border-radius:7px;padding:2px 10px;min-height:28px;cursor:pointer}"+
 ".lay .bottom.folded .ed{display:none}"+
 ".ed .one{display:flex;gap:6px;align-items:center;flex-wrap:nowrap;overflow:hidden}"+
 ".ed .one .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}";
document.head.appendChild(css);

var NAMES=["Do","Re","Mi","Fa","Sol","La","Si"],SH=["Do","Do#","Re","Re#","Mi","Fa","Fa#","Sol","Sol#","La","La#","Si"],FL=["Do","Reb","Re","Mib","Mi","Fa","Solb","Sol","Lab","La","Sib","Si"];
var DURS=[["redonda",4],["blanca con puntillo",3],["blanca",2],["negra con puntillo",1.5],["negra",1],["corchea con puntillo",0.75],["corchea",0.5],["semicorchea",0.25]];
var DSHORT=[["Redonda",4],["Blanca·",3],["Blanca",2],["Negra·",1.5],["Negra",1],["Corchea·",0.75],["Corchea",0.5],["Semi",0.25]];
var st=window.__vst||(window.__vst={i:-1,k:0,size:22,bpm:80,click:true,mel:true,score:false,edit:false});
var PREF="cdp-visor-v1";
try{ var sv=JSON.parse(localStorage.getItem(PREF)||"{}"); ["score","size","click","mel","edit"].forEach(function(k){ if(k in sv) st[k]=sv[k]; }); }catch(e){}
function savePrefs(){ try{ localStorage.setItem(PREF,JSON.stringify({score:st.score,size:st.size,click:st.click,mel:st.mel,edit:st.edit})); }catch(e){} }
var dict={on:false,rec:null,interim:"",last:"",undo:[],err:""};
var S,pl=window.__vpl||(window.__vpl=new CORE.Player()),root=document.getElementById("app"),lastEl=null,dirty=false,selPath=null,selNote=0,selPaths=[],multi=false,ligar=false,showHelp=false,selRest=false,folded=false;

function b(t,f,c,lab){ var e=document.createElement("button"); e.type="button"; e.textContent=t; e.onclick=f; if(c) e.className=c; if(lab) e.setAttribute("aria-label",lab); return e; }
function sp(t,c){ var e=document.createElement("span"); e.className=c||"v"; e.textContent=t; return e; }
function unitAt(p){ var a=p.split(".").map(Number),s=S[st.i]; return s.sections[a[0]].lines[a[1]].units[a[2]]; }
function parse(n){ var m=String(n||"").trim().match(/^(do|re|mi|fa|sol|la|si)\s*(#|b)?\s*([0-8])?/i); if(!m) return {l:"Do",a:"",o:3}; return {l:m[1].charAt(0).toUpperCase()+m[1].slice(1).toLowerCase(),a:m[2]||"",o:m[3]?+m[3]:3}; }
function fmt(p){ return p.l+p.a+(p.o!==3?p.o:""); }
function midiOf(p){ var pc={Do:0,Re:2,Mi:4,Fa:5,Sol:7,La:9,Si:11}[p.l]+(p.a==="#"?1:p.a==="b"?-1:0); return 12*(p.o+1)+pc; }
function fromMidi(m,up){ var n=(up?SH:FL)[((m%12)+12)%12],mm=n.match(/^(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?$/); return {l:mm[1],a:mm[2]||"",o:Math.floor(m/12)-1}; }
var actx=null;
function beep(n){ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); var p=parse(n),f=440*Math.pow(2,(midiOf(p)+st.k-69)/12); CORE.pianoNote(actx,actx.destination,f,actx.currentTime+0.01,0.6); }catch(e){} }

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
  savePrefs(); var s=S[st.i]; var keepScroll=root.scrollTop; root.replaceChildren(); document.documentElement.style.setProperty("--size",st.size+"px");
  var wide=root.clientWidth>=760; lastWide=wide;
  var lay=document.createElement("div"); lay.className="lay"+(wide?" wide":""); var main=document.createElement("div"),side=document.createElement("div"); side.className="side";
  var panel=side; // en estrecho, los paneles van abajo y fijos
  if(wide){ lay.append(main,side); } else {
    var bottom=document.createElement("div"); bottom.className="bottom"+(folded?" folded":""); lay.append(side,main,bottom); panel=bottom;
    if(dict.on||selPath){ var fb=b(folded?"▴ Mostrar panel":"▾",function(){ folded=!folded; show(); },"fold",folded?"Mostrar panel":"Plegar panel"); bottom.appendChild(fb); }
  }
  root.appendChild(lay);
  var bar=document.createElement("div"); bar.className="rbar";
  // 🎹 Piano y 🥁 Metrónomo se encienden y apagan; si alguno está encendido, suena
  var kb=b(play.piano?"🎹 Piano ■":"🎹 Piano",function(){ play.piano=!play.piano; restartPlay(s); show(); },play.piano?"pri":"");
  var mb=b(play.click?"🥁 Metrónomo ■":"🥁 Metrónomo",function(){ play.click=!play.click; restartPlay(s); show(); },play.click?"pri":"");
  if(S.length>1) bar.append(b("← Lista",list));
  bar.append(b(st.score?"📝 Como en la hoja":"🎼 Partitura",function(){ st.score=!st.score; show(); },"sw"));
  if(window.EDITABLE) bar.append(b(st.edit?(dirty?"✏️ Terminar y guardar":"✏️ Terminar"):"✏️ Cambiar notas",function(){
    if(st.edit&&dirty){ save(); return; }
    st.edit=!st.edit; selPath=null; selPaths=[]; if(!st.edit) stopDict(); show(); },st.edit?"edon":""));
  if(window.EDITABLE&&SR) bar.append(b(dict.on?"⏹ Parar dictado":"🎤 Dictar",function(){ if(dict.on) stopDict(); else startDict(); show(); },dict.on?"ok":""));
  if(dirty){ bar.append(b("💾 Guardar cambios",save,"ok"),b("Deshacer",function(){ S=JSON.parse(JSON.stringify(window.SONGS)); dirty=false; selPath=null; show(); })); }
  function grp(){ var g=document.createElement("div"); g.className="grp"; for(var i=0;i<arguments.length;i++) g.appendChild(arguments[i]); return g; }
  var moreOpen=wide||st.more;
  bar.append(kb,mb);
  if(!wide) bar.append(b(st.more?"⋯ Menos":"⋯",function(){ st.more=!st.more; show(); },"","Más controles"));
  if(moreOpen) bar.append(grp(sp("♩=","lbl"),b("−",function(){st.bpm=Math.max(30,st.bpm-4);restartPlay(s);show();},"","Más lento"),sp(st.bpm),b("+",function(){st.bpm=Math.min(240,st.bpm+4);restartPlay(s);show();},"","Más rápido")),
    grp(sp("Tono","lbl"),b("−",function(){st.k=Math.max(-12,st.k-1);restartPlay(s);show();},"","Bajar medio tono toda la partitura"),sp((st.k>0?"+":"")+st.k),b("+",function(){st.k=Math.min(12,st.k+1);restartPlay(s);show();},"","Subir medio tono toda la partitura")));
  if(st.k&&window.EDITABLE) bar.append(b("Guardar en este tono",function(){ transposeAll(st.k); st.k=0; changed(); },"ok"));
  if(moreOpen) bar.append(
    grp(b("A−",function(){st.size=Math.max(14,st.size-2);show();},"","Letra más pequeña"),b("A+",function(){st.size=Math.min(40,st.size+2);show();},"","Letra más grande")));
  side.appendChild(bar);
  if(dict.err){ var er=document.createElement("p"); er.className="hint"; er.textContent=dict.err; side.appendChild(er); dict.err=""; }
  if(dict.on) panel.appendChild(dictPanel());
  if(st.edit&&!st.k&&(!SR||dict.needText)) panel.appendChild(textDict()); // solo de recambio, si el dictado no funciona
  else if(st.edit&&!selPath){ var h=document.createElement("p"); h.className="hint"; h.textContent="Toca la nota que quieras cambiar."+(st.k?" (Para cambiar notas, pon el tono a 0.)":""); side.appendChild(h); }
  var pg=document.createElement("div"); pg.className="page"+(st.edit?" editing":""); main.appendChild(pg);
  if(st.score&&window.SCORE){ pg.classList.add("plain"); SCORE.render(s,pg,{transpose:st.k}); }
  else CORE.render(s,pg,{transpose:st.k});
  if(st.edit&&!st.k){
    pg.addEventListener("click",function(e){
      var tr=e.target.closest("[data-rp]"); if(tr&&tr.dataset.rp){ selPath=tr.dataset.rp; selPaths=[selPath]; selRest=true; multi=false; show(); return; }
      var t=e.target.closest("[data-p]"); if(!t||!t.dataset.p) return; selRest=false;
      var p=t.dataset.p;
      if(multi&&selPath){ var all=allPaths(),a=all.indexOf(selPath),z=all.indexOf(p); selPaths=all.slice(Math.min(a,z),Math.max(a,z)+1); }
      else { selPath=p; selPaths=[p]; }
      selNote=0; show(); });
    if(selPath&&dict.on&&!selRest){ pg.querySelectorAll('[data-p="'+selPath+'"]').forEach(function(x){x.classList.add("sel"); setTimeout(function(){ x.scrollIntoView({block:"center",behavior:"smooth"}); },30);}); }
    else if(selPath){
      if(selRest){ pg.querySelectorAll('[data-rp="'+selPath+'"]').forEach(function(x){ x.classList.add("sel"); }); if(!dict.on) panel.appendChild(restEditor()); }
      else {
      if(!selPaths.length||selPaths.indexOf(selPath)<0) selPaths=[selPath];
      var se=[]; selPaths.forEach(function(sp2){ pg.querySelectorAll('[data-p="'+sp2+'"]').forEach(function(x){ x.classList.add("sel"); se.push(x); }); });
      var ed=selPaths.length>1?multiEditor(s):editor(s); panel.appendChild(ed);
      if(!wide&&se.length) setTimeout(function(){ se[0].scrollIntoView({block:"center",behavior:"smooth"}); },30); }
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
  top.append(b("🗑",function(){ delSelected(); show(); },"","Eliminar esta nota"));
  top.append(b("+ Palabra",addWordAsk,"","Añadir una palabra a la derecha"));
  top.append(b("✂ Separar",function(){ if(splitUnit(selPath)){ selPaths=[selPath]; changed(); } },"","Separar la palabra en sílabas, una nota en cada una"),
    b("Unir ▶",function(){ if(joinUnit(selPath)) changed(); },"","Unir con la sílaba siguiente"));
  top.append(b("+",function(){ u.n.push(u.n.length?u.n[u.n.length-1]:"Do"); delete u.nd; selNote=u.n.length-1; changed(); },"","Añadir nota a esta sílaba"));
  if(u.n.length>1) top.append(b("−",function(){ u.n.splice(selNote,1); delete u.nd; selNote=0; changed(); },"","Quitar esta nota"));
  var bsel=document.createElement("select"); bsel.setAttribute("aria-label","Tiempo"); bsel.append(new Option("T: —",""));
  for(var i=1;i<=M;i++) bsel.append(new Option("T: "+i,String(i))); bsel.value=u.b?String(u.b):"";
  bsel.onchange=function(){ if(bsel.value) u.b=+bsel.value; else delete u.b; delete u.pos; changed(); };
  bsel.style.width="auto"; top.append(bsel);
  var txt=document.createElement("input"); txt.value=u.t||""; txt.setAttribute("aria-label","Sílaba"); txt.placeholder="Sílaba"; txt.style.width="7em";
  txt.onchange=function(){ u.t=txt.value; changed(); };
  txt.onkeydown=function(e){ if(e.key==="Enter"){ e.preventDefault(); txt.blur(); } };
  top.append(txt);
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
  if(u.n.length>1){
    var cd=u.nd&&u.nd.length===u.n.length?u.nd[selNote]:0;
    ed.append(durRow(function(v,add){ if(v===null){ delete u.nd; delete u.d; return; } setNoteDur(u,selNote,add&&cd?cd+v:v); },cd));
  } else ed.append(durRow(function(v,add){ if(v===null){ delete u.d; return; } u.d=add&&u.d?Math.round((u.d+v)*100)/100:v; },u.d||0));
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
function restEditor(){
  var u=unitAt(selPath),ed=document.createElement("div"); ed.className="ed";
  var top=document.createElement("div"); top.className="r";
  top.append(sp("Silencio detrás de «"+(u.t||"")+"»","t"),sp(u.r?durText(u.r).replace(/ \(.*$/,""):"(hueco)","lbl"),
    b("🗑 Quitar",function(){ delete u.r; delete u.e; delete u.pos; selRest=false; changed(); },"pri"),
    b("✕",function(){ selRest=false; selPath=null; selPaths=[]; show(); },"","Cerrar"));
  if(dirty&&!dict.on) top.append(b("💾",save,"pri","Guardar"));
  ed.append(top);
  if(dict.on){ top.className="r one"; return ed; } // dictando: los cambios se dicen («añadir silencio de negra», «quitar silencio»)
  var r=document.createElement("div"); r.className="r"; r.append(sp("Cambiar a:","lbl"));
  DSHORT.forEach(function(d){ r.append(b(d[0],function(){ u.r=d[1]; delete u.e; changed(); })); });
  ed.append(r);
  var r2=document.createElement("div"); r2.className="r"; r2.append(sp("Añadir:","lbl"));
  DSHORT.forEach(function(d){ r2.append(b("+"+d[0],function(){ u.r=Math.round(((u.r||0)+d[1])*1000)/1000; delete u.e; changed(); })); });
  ed.append(r2);
  return ed;
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
var play=window.__vplay||(window.__vplay={piano:false,click:false});
function restartPlay(s){
  pl.__stopping=true; pl.stop(); pl.__stopping=false; tick(null);
  if(!play.piano&&!play.click) return;
  pl.play(s,{tempo:st.bpm,transpose:st.k,click:play.click,melody:play.piano,piano:true,onTick:tick,
    onEnd:function(){ if(pl.__stopping) return; play.piano=false; play.click=false; tick(null); show(); }});
}
function transposeAll(k){
  allPaths().forEach(function(p){ var u=unitAt(p); u.n=(u.n||[]).map(function(n){ var q=parse(n); return fmt(fromMidi(midiOf(q)+k,k>0)); }); });
}
/* separar una palabra en sílabas (una por nota) y unir sílabas */
function syllables(word,n){
  var w=String(word||""),V=/[aeiouyáéíóúü]/i,idx=[],parts=[];
  for(var i=0;i<w.length;i++){ if(V.test(w[i])&&(i===0||!V.test(w[i-1]))) idx.push(i); }
  if(idx.length<2) return null;
  var cuts=[];
  for(var g=1;g<idx.length;g++){
    var endPrev=idx[g-1]; while(endPrev+1<w.length&&V.test(w[endPrev+1])) endPrev++;
    var cons=w.slice(endPrev+1,idx[g]),c=endPrev+1;
    if(cons.length===1) c=endPrev+1;
    else if(cons.length>=2){ var last2=cons.slice(-2).toLowerCase(); c=idx[g]-(/^[bcdfgkpt][lr]$/.test(last2)||last2==="ch"||last2==="ll"||last2==="rr"?2:1); }
    cuts.push(c);
  }
  // nos quedamos con tantas sílabas como notas, cortando por los primeros huecos
  cuts=cuts.slice(0,Math.max(1,n-1));
  var prev=0; cuts.forEach(function(c){ parts.push(w.slice(prev,c)); prev=c; }); parts.push(w.slice(prev));
  return parts.filter(function(x){return x;});
}
function splitUnit(path){
  var a=path.split(".").map(Number),line=S[st.i].sections[a[0]].lines[a[1]],u=line.units[a[2]],notes=(u.n||[]).slice();
  var n=Math.max(2,notes.length),parts=syllables((u.t||"").replace(/-$/,""),n);
  if(!parts||parts.length<2) return false;
  var trail=/-$/.test(u.t||"");
  var news=parts.map(function(t,i){ var nu={t:t+(i<parts.length-1||trail?"-":""),n:[notes[i]||notes[notes.length-1]||"Do"]}; return nu; });
  news[0].b=u.b; if(!news[0].b) delete news[0].b;
  if(u.d){ var each=Math.round(u.d/news.length*4)/4||0.5; news.forEach(function(x){ x.d=each; }); }
  if(u.mark) news.forEach(function(x){ x.mark=true; });
  if(u.nd&&u.nd.length===news.length) news.forEach(function(x,i){ x.d=u.nd[i]; });
  if(u.r) news[news.length-1].r=u.r; if(u.pause) news[news.length-1].pause=true;
  line.units.splice.apply(line.units,[a[2],1].concat(news));
  return news.length;
}
function joinUnit(path){
  var a=path.split(".").map(Number),line=S[st.i].sections[a[0]].lines[a[1]],u=line.units[a[2]],nx=line.units[a[2]+1];
  if(!nx) return false;
  u.t=(u.t||"").replace(/-$/,"")+(nx.t||""); u.n=(u.n||[]).concat(nx.n||[]); delete u.nd;
  if(u.d||nx.d) u.d=(u.d||0)+(nx.d||0); if(nx.r) u.r=nx.r; if(nx.pause) u.pause=true;
  line.units.splice(a[2]+1,1); return true;
}

/* ---------- dictado en directo (reconocimiento de voz del navegador) ---------- */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function allPaths(){ var all=[],s=S[st.i]; s.sections.forEach(function(sec,si){ sec.lines.forEach(function(l,li){ l.units.forEach(function(u,ui){ all.push(si+"."+li+"."+ui); }); }); }); return all; }
function startDict(){
  if(!SR) return;
  if(st.k) st.k=0;
  st.edit=true; dict.on=true; dict.err=""; dict.interim=""; dict.fails=0; if(!selPath) selPath=allPaths()[0]; selPaths=[selPath]; selNote=0;
  listen();
  clearInterval(dict.watch);
  // vigilante: si el navegador ha cortado la escucha y no ha vuelto, se reactiva
  dict.watch=setInterval(function(){ if(!dict.on){ clearInterval(dict.watch); return; } if(!dict.active&&Date.now()-(dict.lastStart||0)>2500) listen(); },2000);
}
function listen(){
  if(!dict.on) return;
  try{ if(dict.rec){ dict.rec.onend=null; dict.rec.abort(); } }catch(e){}
  var r=new SR(); r.lang="es-ES"; r.continuous=true; r.interimResults=true; r.maxAlternatives=1; dict.rec=r;
  dict.lastStart=Date.now();
  r.onstart=function(){ dict.active=true; dict.fails=0; setStatus("🎙 Escuchando"); };
  r.onresult=function(e){
    var inter="";
    for(var i=e.resultIndex;i<e.results.length;i++){ var t=e.results[i][0].transcript; if(e.results[i].isFinal) runCmd(t); else inter+=t; }
    dict.interim=inter; var el=document.getElementById("dict-live"); if(el) el.textContent=inter?"… "+inter:(dict.last?"✔ "+dict.last:"");
  };
  r.onerror=function(e){
    if(e.error==="not-allowed"||e.error==="service-not-allowed"){ dict.err="No hay permiso para usar el micrófono. Permítelo en el navegador y vuelve a pulsar «Dictar»."; stopDict(); show(); return; }
    if(e.error!=="no-speech"&&e.error!=="aborted") dict.fails=(dict.fails||0)+1;
  };
  r.onend=function(){
    dict.active=false;
    if(!dict.on) return;
    setStatus("🔄 Reconectando…");
    if((dict.fails||0)>6){ dict.err="El reconocimiento de voz del navegador se ha cortado varias veces. Puedes usar el cuadro «Dictar con el teclado» de abajo."; dict.needText=true; stopDict(); show(); return; }
    setTimeout(listen,250);
  };
  try{ r.start(); }catch(e){ dict.active=false; }
}
function textDict(){
  var d=document.createElement("div"); d.className="ed";
  var r=document.createElement("div"); r.className="r";
  r.append(sp("⌨️ Dictar con el teclado","t"));
  d.append(r);
  var ta=document.createElement("textarea"); ta.id="tdict"; ta.rows=2; ta.placeholder="Pulsa aquí y usa el micrófono del teclado del móvil, o escribe: «Fa negra, Sol corchea, cuatro corcheas, bien, silencio de negra…»";
  ta.style.cssText="width:100%;box-sizing:border-box;font:inherit;font-size:15px;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--bg);color:var(--ink);resize:vertical";
  ta.value=window.__tdict||""; ta.oninput=function(){ window.__tdict=ta.value; };
  d.append(ta);
  var r2=document.createElement("div"); r2.className="r";
  r2.append(b("Aplicar desde «"+(selPath?(unitAt(selPath).t||""):"el principio")+"»",function(){
    var t=ta.value.trim(); if(!t) return;
    if(!selPath){ selPath=allPaths()[0]; selPaths=[selPath]; }
    window.__tdict=""; runCmd(t);
  },"pri"),sp("Se aplica en orden, nota a nota, desde la seleccionada.","lbl"));
  d.append(r2);
  return d;
}
function setStatus(t){ var el=document.getElementById("dict-status"); if(el) el.textContent=t.indexOf("Escuch")>=0?"🎙":"🔄"; }
function stopDict(){ dict.on=false; dict.active=false; clearInterval(dict.watch); if(dict.rec){ try{ dict.rec.onend=null; dict.rec.stop(); }catch(e){} } dict.rec=null; }
function dictPanel(){
  var d=document.createElement("div"); d.className="ed";
  var u=selPath?unitAt(selPath):null;
  var r1=document.createElement("div"); r1.className="r one";
  var stEl=sp(dict.active?"🎙":"🔄","lbl"); stEl.id="dict-status";
  var cur=u&&selRest?("Silencio detrás de «"+(u.t||"")+"»: "+(u.r?durText(u.r).replace(/ \(.*$/,""):"hueco")):u?("«"+(u.t||"")+"» "+((u.n||[]).length>1?((u.n||[]).map(function(x,i){return i===selNote?"["+x+"]":x;}).join("-")):((u.n||[]).join("-")||"—"))+(u.d?" · "+durText(u.d).replace(/ \(.*$/,""):"")):"";
  r1.append(stEl,sp(cur,"t"),b("◀",function(){ move(-1); },"","Anterior"),b("▶",function(){ move(1); },"","Siguiente"),b("↩",undoCmd,"","Deshacer"),b("?",function(){ showHelp=!showHelp; show(); },showHelp?"on":"","Ayuda"));
  if(dirty) r1.append(b("💾",save,"pri","Guardar"));
  d.append(r1);
  var live=document.createElement("p"); live.id="dict-live"; live.className="live";
  live.textContent=dict.interim?"… "+dict.interim:(dict.last?"✔ "+dict.last:"Habla: «Fa negra», «bien», «silencio de negra», «guardar»…");
  d.append(live);
  if(showHelp){ var h=document.createElement("p"); h.className="help";
    h.textContent="Nota y figura, y pasa sola a la siguiente: «Fa negra», «Si bemol blanca», «Do cuatro corchea», «redonda ligada a negra con puntillo», «igual corchea». Varias seguidas: «Sol corchea, La negra». «Bien» deja la nota igual. «Cuatro corcheas» pone corchea a las 4 siguientes. «Añadir silencio de negra», «añadir Fa negra». «Añadir palabra can» mete esa palabra a la derecha y luego le dices su nota. «Cinco notas» pone 5 notas en la sílaba marcada y luego las dices una a una. «Bemol», «sostenido» o «natural» solos cambian la nota que acabas de decir. «Octava arriba» / «octava abajo» sube o baja la nota marcada una octava («medio tono arriba/abajo» también). «Eliminar» borra lo marcado (un silencio, una nota o la sílaba entera). «Separar», «unir», «una sola nota». «Silencio de negra», «quitar silencio», «anterior», «ir a love», «deshacer», «guardar».";
    d.append(h); }
  return d;
}
var DELW={eliminar:1,elimina:1,eliminalo:1,eliminala:1,borrar:1,borra:1,borralo:1,borrala:1,quitar:1,quita:1,quitalo:1,quitala:1,suprimir:1,suprime:1,fuera:1,sobra:1};
/* «eliminar»: borra lo que está marcado (un silencio, una de las notas de la sílaba o la sílaba entera) */
/* «añadir palabra can»: mete una sílaba nueva a la derecha de la marcada (o del silencio marcado) y la deja marcada para dictarle la nota */
function addWordAsk(){
  // sin cuadros emergentes: se añade «…» y queda marcada para escribirle el texto en «Sílaba»
  addWord("…"); dict.last=""; show();
  setTimeout(function(){ var inp=document.querySelector('.ed input[aria-label="Sílaba"]'); if(inp){ inp.focus(); inp.select(); } },50);
}
function addWord(txt,snapshot){
  var s=S[st.i],a=selPath.split(".").map(Number),line=s.sections[a[0]].lines[a[1]],u=line.units[a[2]];
  var nu={t:txt,n:[(u.n||["Do"])[(u.n||[]).length-1]||"Do"]};
  if(u.r&&!selRest){ nu.r=u.r; delete u.r; }
  line.units.splice(a[2]+1,0,nu);
  dict.undo.push(snapshot||{song:JSON.parse(JSON.stringify(s)),sel:selPath}); dirty=true;
  selPath=a[0]+"."+a[1]+"."+(a[2]+1); selPaths=[selPath]; selRest=false; selNote=0; lastApplied=null;
  dict.last="Añadida la palabra «"+txt+"». Ahora dime su nota (por ejemplo «Fa corchea»)";
  return false;
}
/* duración de cada nota dentro de una sílaba con varias notas (nd) y total (d) */
function setNoteDur(u,ix,v){
  var n=(u.n||[]).length; if(n<2){ u.d=v; return; }
  if(!u.nd||u.nd.length!==n){ var each=(u.d||n*0.5)/n; u.nd=u.n.map(function(){ return each; }); if(ix===0) u.nd=u.n.map(function(){ return v; }); }
  u.nd[ix]=v; u.nd=u.nd.map(function(x){ return Math.round(x*1000)/1000; });
  u.d=Math.round(u.nd.reduce(function(a,x){return a+x;},0)*1000)/1000;
}
function delSelected(snapshot){
  var s=S[st.i],u=unitAt(selPath),a=selPath.split(".").map(Number);
  dict.undo.push(snapshot||{song:JSON.parse(JSON.stringify(s)),sel:selPath}); dirty=true;
  if(selRest){ delete u.r; delete u.e; delete u.pos; selRest=false; dict.last="Silencio eliminado detrás de «"+(u.t||"")+"»"; return false; }
  if((u.n||[]).length>1){ var gone=u.n.splice(Math.min(selNote,u.n.length-1),1); delete u.nd; selNote=0; dict.last="Nota "+gone[0]+" eliminada de «"+(u.t||"")+"»"; return false; }
  var sec=s.sections[a[0]],line=sec.lines[a[1]],name=u.t||((u.n||[]).join("-"));
  line.units.splice(a[2],1);
  if(!line.units.length){ sec.lines.splice(a[1],1); if(!sec.lines.length) s.sections.splice(a[0],1); }
  var all=allPaths(); selPath=all.length?(all.indexOf(selPath)>=0?selPath:all[Math.min(all.length-1,0)]):null;
  if(selPath&&!all.includes(selPath)) selPath=all[all.length-1];
  selPaths=selPath?[selPath]:[]; selNote=0;
  dict.last="Eliminada «"+name+"»";
  return false;
}
var OKW={bien:1,ok:1,okey:1,vale:1,correcto:1,correcta:1,perfecto:1,sigue:1,siguiente:1};
var lastApplied=null;
var NUMW={uno:1,un:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,doce:12};
var DURW={redonda:4,redondas:4,blanca:2,blancas:2,negra:1,negras:1,corchea:0.5,corcheas:0.5,semicorchea:0.25,semicorcheas:0.25,fusa:0.125};
var NOTEW={"do":"Do","re":"Re","mi":"Mi","fa":"Fa","sol":"Sol","la":"La","si":"Si","sí":"Si"};
function norm(t){ return String(t).toLowerCase().replace(/[áàä]/g,"a").replace(/[éè]/g,"e").replace(/[íì]/g,"i").replace(/[óò]/g,"o").replace(/[úü]/g,"u").replace(/[.,;:!¿?¡]/g," ").replace(/\s+/g," ").trim(); }
function undoCmd(){ if(!dict.undo.length) return; var u=dict.undo.pop(); S[st.i]=u.song; selPath=u.sel; dict.last="Deshecho"; dirty=true; show(); }
var SAVEW={guardar:1,guarda:1,guardalo:1,guardala:1,guardame:1,graba:1,grabar:1,terminar:1,termina:1,terminado:1};
function fixAcc(w){
  var out=[];
  for(var i=0;i<w.length;i++){
    var x=w[i];
    if((x==="be"||x==="ve"||x==="b")&&w[i+1]==="mol"){ out.push("bemol"); i++; continue; }
    if(/^(vemol|bemoll|bemoles|bemol|bmol|bemos|vemos)$/.test(x)&&(x!=="vemos"||NOTEW[w[i-1]])&&(x!=="bemos"||NOTEW[w[i-1]])){ out.push("bemol"); continue; }
    if((x==="b"||x==="be")&&(NOTEW[w[i-1]]||i===0)){ out.push("bemol"); continue; }
    if(x==="mol"&&(i===0||out[out.length-1]==="bemol")){ if(out[out.length-1]!=="bemol") out.push("bemol"); continue; }
    if(/^(sostenido|sostenida|sostenidos|sostenidas|sostendo|sostenio)$/.test(x)){ out.push("sostenido"); continue; }
    if(x==="#"&&NOTEW[w[i-1]]){ out.push("sostenido"); continue; }
    if(x==="becuadro"||x==="becuadros"||x==="natural"||x==="naturales"){ out.push("natural"); continue; }
    if(x==="mí"||x==="me"&&(DURW[w[i+1]]||w[i+1]==="bemol"||w[i+1]==="sostenido")){ out.push("mi"); continue; }
    out.push(x);
  }
  return out;
}
function runCmd(raw){
  var w=fixAcc(norm(raw).split(" ").filter(Boolean)); if(!w.length) return;
  var wantSave=w.some(function(x){ return SAVEW[x]; });
  if(wantSave){
    w=w.filter(function(x){ return !SAVEW[x]&&x!=="cambios"&&x!=="los"&&x!=="todo"; });
    if(w.length) runCmd(w.join(" "));
    if(dirty){ dict.last="Guardando…"; save(); } else { dict.last="No hay cambios que guardar"; show(); }
    return;
  }
  // «cuatro corcheas» → cuatro órdenes «igual corchea»; «tres bien» → tres «bien»
  var ex=[],multiMsg="";
  for(var q=0;q<w.length;q++){
    var nw=w[q],cnt=NUMW[nw]||(/^\d{1,2}$/.test(nw)?parseInt(nw,10):0),prevW=w[q-1]||"";
    var afterNote=!!NOTEW[prevW]||prevW==="tiempo"||prevW==="octava"||prevW==="sostenido"||prevW==="bemol";
    if(cnt>1&&cnt<=32&&!afterNote&&(DURW[w[q+1]]||OKW[w[q+1]])){
      if(OKW[w[q+1]]){ for(var c1=0;c1<cnt;c1++) ex.push("bien"); q+=1; continue; }
      var dt=[w[q+1]],j2=q+2;
      if(w[j2]==="con"&&w[j2+1]==="puntillo"){ dt.push("con","puntillo"); j2+=2; } else if(w[j2]==="puntillo"){ dt.push("puntillo"); j2++; }
      for(var c2=0;c2<cnt;c2++) ex.push("igual",...dt);
      multiMsg=cnt+" notas → "+dt.join(" ").replace(/s\b/g,"");
      q=j2-1; continue;
    }
    ex.push(nw);
  }
  w=ex;
  // trocear en órdenes: tras una figura, una nota nueva (o «igual») empieza la sílaba siguiente
  var segs=[],cur=[],seenDur=false;
  var pw=w.indexOf("palabra"); if(pw<0) pw=w.indexOf("silaba");
  if(pw>0&&/^(anadir|añadir|anade|añade|agrega|agregar|pon|poner|mas|la|una|un|el)$/.test(w[pw-1])){ var pre=w.slice(0,pw-1); while(pre.length&&/^(anadir|añadir|anade|añade|agrega|agregar|pon|poner|mas|la|una|un|el)$/.test(pre[pre.length-1])) pre.pop();
    if(pre.length) runCmd(pre.join(" ")); applyTokens(["añadir"].concat(w.slice(pw)),raw); show(); return; }
  for(var i=0;i<w.length;i++){
    var x=w[i],isNote=!!NOTEW[x]||/^(do|re|mi|fa|sol|la|si)(#|b)?([1-7])?$/.test(x)||x==="igual"||x==="misma"||x==="mismo";
    if(OKW[x]||/^(separar|separa|dividir|divide|partir|parte|unir|une|junta|juntar)$/.test(x)){ if(cur.length) segs.push(cur); segs.push([x]); cur=[]; seenDur=false; continue; }
    if(x==="esta"&&OKW[w[i+1]]) continue; // «está bien»
    if(seenDur&&isNote&&w[i-1]!=="silencio"&&w[i-1]!=="de"){ segs.push(cur); cur=[]; seenDur=false; }
    cur.push(x); if(DURW[x]) seenDur=true;
  }
  if(cur.length) segs.push(cur);
  for(var k=0;k<segs.length;k++){ if(applyTokens(segs[k],segs.length>1?segs[k].join(" "):raw)===false) break; }
  if(multiMsg) dict.last=multiMsg;
  show();
}
function shiftCmd(w){
  // «octava arriba/abajo», «sube una octava», «medio tono arriba/abajo»: cambia la nota marcada sin pasar a la siguiente
  var up=w.some(function(x){return /^(arriba|alta|alto|subir|sube|subela|subelo|encima|aguda)$/.test(x);}),down=w.some(function(x){return /^(abajo|baja|bajo|bajar|bajala|bajalo|debajo|grave)$/.test(x);});
  var oct=w.indexOf("octava")>=0||w.indexOf("octavas")>=0,semi=w.indexOf("tono")>=0||w.indexOf("semitono")>=0;
  if(!(oct||semi)||up===down) return 0;
  return (up?1:-1)*(oct?12:1);
}
function applyTokens(w,raw){
  var accW=w.filter(function(x){ return x==="bemol"||x==="sostenido"||x==="natural"; });
  if(accW.length&&w.every(function(x){ return x==="bemol"||x==="sostenido"||x==="natural"||x==="la"||x==="en"||x==="es"||x==="con"||x==="nota"||x==="ponle"||x==="pon"||x==="hazla"; })){
    var paths0=allPaths(),tp=selPath;
    if(lastApplied&&paths0.indexOf(lastApplied)===paths0.indexOf(selPath)-1) tp=lastApplied; // la nota que se acaba de dictar
    var tu=unitAt(tp); if(!(tu.n||[]).length) return;
    dict.undo.push({song:JSON.parse(JSON.stringify(S[st.i])),sel:selPath}); dirty=true;
    var ixA=tp===selPath&&tu.n.length>1?Math.min(selNote,tu.n.length-1):(tu.n.length>1&&tp!==selPath?tu.n.length-1:0);
    var pa=parse(tu.n[ixA]); pa.a=accW[accW.length-1]==="bemol"?"b":accW[accW.length-1]==="sostenido"?"#":"";
    tu.n[ixA]=fmt(pa); beep(tu.n[ixA]);
    dict.last="«"+(tu.t||"")+"»: "+tu.n[ixA];
    return;
  }
  var sh=shiftCmd(w);
  if(sh&&selPath&&!selRest){
    var su=unitAt(selPath); if(!(su.n||[]).length) return;
    dict.undo.push({song:JSON.parse(JSON.stringify(S[st.i])),sel:selPath}); dirty=true;
    var ix=(su.n.length>1)?Math.min(selNote,su.n.length-1):0;
    su.n[ix]=fmt(fromMidi(midiOf(parse(su.n[ix]))+sh,sh>0)); beep(su.n[ix]);
    dict.last="«"+(su.t||"")+"»: "+su.n[ix]+(Math.abs(sh)===12?(sh>0?" (octava arriba)":" (octava abajo)"):(sh>0?" (medio tono arriba)":" (medio tono abajo)"));
    return;
  }
  var s=S[st.i],paths=allPaths(); if(!selPath) selPath=paths[0];
  var snapshot={song:JSON.parse(JSON.stringify(s)),sel:selPath};
  var notes=[],dur=0,hasDur=false,rest=null,beat=null,nav=0,go=null,keep=false,clear=false,did=[],melisDone=false,single=0,addMode=false,melCount=0,strayAcc=null;
  for(var i=0;i<w.length;i++){
    var x=w[i];
    if(x==="deshacer"||x==="deshaz"){ undoCmd(); return false; }
    if(x==="separar"||x==="separa"||x==="dividir"||x==="divide"||x==="partir"||x==="parte"){ var pre=JSON.parse(JSON.stringify(s)),ns=splitUnit(selPath); if(ns){ dict.undo.push({song:pre,sel:selPath}); dirty=true; dict.last="Separada en "+ns+" sílabas"; } else dict.last="No sé separar «"+(unitAt(selPath).t||"")+"»"; return; }
    if(x==="unir"||x==="une"||x==="junta"||x==="juntar"){ var pre2=JSON.parse(JSON.stringify(s)); if(joinUnit(selPath)){ dict.undo.push({song:pre2,sel:selPath}); dirty=true; dict.last="Unida con la siguiente"; } return; }
    var cntN=NUMW[x]||(/^\d{1,2}$/.test(x)?parseInt(x,10):0);
    if(cntN>1&&cntN<=16&&(w[i+1]==="notas"||w[i+1]==="nota")){ melCount=cntN; i++; continue; }
    if((x==="una"&&(w[i+1]==="nota"||w[i+1]==="sola"))||(x==="solo"&&w[i+1]==="una")){ single=1; i++; while(w[i+1]==="nota"||w[i+1]==="sola"||w[i+1]==="una") i++; continue; }
    if((x==="quitar"||x==="borrar"||x==="quita"||x==="borra")&&w[i+1]==="nota"){ single=2; i++; continue; }
    if(OKW[x]||x==="adelante"){ nav=1; continue; }
    if((x==="quitar"||x==="borrar")&&(w[i+1]==="silencio"||(w[i+1]==="el"&&w[i+2]==="silencio"))){ rest=0; i+=w[i+1]==="el"?2:1; continue; }
    if(x==="anterior"||x==="atras"||x==="volver"){ nav=-1; continue; }
    if((x==="ir"&&w[i+1]==="a")||x==="busca"||x==="buscar"){ var target=w[x==="ir"?i+2:i+1]; if(target){ go=target; i+=x==="ir"?2:1; } continue; }
    if(x==="igual"||x==="misma"||x==="mismo"){ keep=true; continue; }
    if(DELW[x]){
      var obj=w[i+1]==="la"||w[i+1]==="el"||w[i+1]==="esto"||w[i+1]==="esta"||w[i+1]==="este"?w[i+2]:w[i+1];
      if(obj==="duracion"||obj==="figura"){ clear=true; i++; continue; }
      if(obj==="silencio"){ rest=0; i+=(w[i+1]==="silencio")?1:2; continue; }
      if(obj==="nota"){ single=2; i+=(w[i+1]==="nota")?1:2; continue; }
      return delSelected(snapshot);
    }
    if(x==="tiempo"&&w[i+1]){ var bn=NUMW[w[i+1]]||parseInt(w[i+1],10); if(bn){ beat=bn; i++; } continue; }
    if(x==="anadir"||x==="añadir"||x==="anade"||x==="añade"||x==="mas"||x==="agrega"||x==="agregar"||x==="pon"||x==="poner"){
      var nxw=w[i+1]; if(nxw==="la"||nxw==="el"||nxw==="una"||nxw==="un") nxw=w[i+2];
      if(nxw==="palabra"||nxw==="silaba"||nxw==="sílaba"||nxw==="letra"){
        var from=w.indexOf(nxw,i)+1,txt=w.slice(from).join(" ");
        if(txt) return addWord(txt,snapshot);
        dict.last="Dime qué palabra: «añadir palabra can»"; return;
      }
      addMode=true; continue; }
    if(x==="silencio"){ var j=i+1; if(w[j]==="de") j++; if(DURW[w[j]]){ var rv=DURW[w[j]]; if(w[j+1]==="con"&&w[j+2]==="puntillo"){ rv*=1.5; j+=2; } else if(w[j+1]==="puntillo"){ rv*=1.5; j++; } rest=rv; i=j; } else rest=1; continue; }
    if(DURW[x]){ var dv=DURW[x]; if(w[i+1]==="con"&&w[i+2]==="puntillo"){ dv*=1.5; i+=2; } else if(w[i+1]==="puntillo"||w[i+1]==="punto"){ dv*=1.5; i++; } dur+=dv; hasDur=true; continue; }
    if(NOTEW[x]){
      var nt={l:NOTEW[x],a:"",o:null};
      if(w[i+1]==="sostenido"||w[i+1]==="#"){ nt.a="#"; i++; } else if(w[i+1]==="bemol"){ nt.a="b"; i++; }
      if(w[i+1]&&/^[1-7]$/.test(w[i+1])){ nt.o=+w[i+1]; i++; }
      else if(NUMW[w[i+1]]&&NUMW[w[i+1]]<=7&&!(DURW[w[i+2]]&&/s$/.test(w[i+2]))){ nt.o=NUMW[w[i+1]]; i++; }
      else if(w[i+1]==="octava"&&w[i+2]&&(NUMW[w[i+2]]||/^[1-7]$/.test(w[i+2]))){ nt.o=NUMW[w[i+2]]||+w[i+2]; i+=2; }
      notes.push(nt); continue;
    }
    if((x==="bemol"||x==="sostenido"||x==="natural")&&!notes.length){ strayAcc=x==="bemol"?"b":x==="sostenido"?"#":""; continue; }
    var mm=x.match(/^(do|re|mi|fa|sol|la|si)(#|b)?([1-7])?$/); if(mm){ notes.push({l:NOTEW[mm[1]],a:mm[2]||"",o:mm[3]?+mm[3]:null}); continue; }
  }
  if(go){ var idx=paths.indexOf(selPath),found=null;
    for(var k=1;k<=paths.length;k++){ var p=paths[(idx+k)%paths.length],t=norm(unitAt(p).t||"").replace(/-/g,""); if(t.indexOf(go)===0){ found=p; break; } }
    if(found){ selPath=found; selNote=0; dict.last="Ir a «"+unitAt(found).t+"»"; } else { dict.last="No encuentro «"+go+"»"; }
    return; }
  var u=unitAt(selPath),changedSome=false;
  if(clear){ delete u.d; delete u.r; changedSome=true; did.push("sin duración"); }
  if(strayAcc!==null&&!notes.length&&(u.n||[]).length){
    var ixS=u.n.length>1?Math.min(selNote,u.n.length-1):0,pS=parse(u.n[ixS]); pS.a=strayAcc; u.n[ixS]=fmt(pS);
    changedSome=true; did.push(u.n[ixS]);
  }
  if(melCount){
    var base=(u.n||[]).length?u.n.slice():["Do"];
    while(base.length<melCount) base.push(base[base.length-1]);
    u.n=base.slice(0,melCount); delete u.nd; selNote=0; changedSome=true; did.push(melCount+" notas en esta sílaba: dícelas una a una");
    dict.undo.push(snapshot); dirty=true; dict.last="«"+(u.t||"")+"»: "+melCount+" notas. Dime la 1ª (por ejemplo «Fa corchea»)."; return;
  }
  if(single&&(u.n||[]).length>1){
    var keepN=single===1?u.n[0]:null;
    if(single===1) u.n=[keepN]; else u.n.splice(Math.min(selNote,u.n.length-1),1);
    delete u.nd;
    selNote=0; changedSome=true; did.push("una sola nota: "+u.n.join("-"));
  }
  if(addMode&&notes.length){
    var ap=selPath.split(".").map(Number),line=s.sections[ap[0]].lines[ap[1]];
    var nu={t:"",n:notes.map(function(nt){ return fmt({l:nt.l,a:nt.a,o:nt.o===null?3:nt.o}); })};
    if(hasDur) nu.d=Math.round(dur*1000)/1000;
    if(u.r&&!selRest){ nu.r=u.r; delete u.r; } // con una nota marcada, la nueva va pegada a ella; con un silencio marcado, va detrás del silencio
    line.units.splice(ap[2]+1,0,nu);
    dict.undo.push(snapshot); dirty=true; beep(nu.n[0]);
    selPath=ap[0]+"."+ap[1]+"."+(ap[2]+1); selPaths=[selPath]; selRest=false; lastApplied=selPath;
    dict.last="Añadida "+nu.n.join("-")+(nu.d?" "+durText(nu.d).replace(/ \(.*$/,""):"")+" detrás de «"+(u.t||"")+"»";
    return;
  }
  var melis=(u.n||[]).length>1&&notes.length<=1; // palabra con varias notas: se dicta nota a nota dentro de ella
  if(melis&&selNote>=(u.n||[]).length) selNote=0;
  if(notes.length===1&&!keep&&melis){
    var pvm=parse(u.n[selNote]),ntm=notes[0],om=ntm.o;
    if(om===null) om=3; // como en su hoja: sin número, octava 3; la de arriba se dice «cuatro» u «octava arriba»
    u.n[selNote]=fmt({l:ntm.l,a:ntm.a,o:om}); beep(u.n[selNote]); changedSome=true; did.push("nota "+(selNote+1)+": "+u.n[selNote]);
    notes=[]; melisDone=true;
  }
  if(notes.length&&!keep){
    var prev=(u.n||[]).map(parse);
    u.n=notes.map(function(nt){ return fmt({l:nt.l,a:nt.a,o:nt.o===null?3:nt.o}); });
    beep(u.n[0]); changedSome=true; did.push(u.n.join("-"));
  }
  if(hasDur){
    if(melis){ setNoteDur(u,selNote,dur); did.push("nota "+(selNote+1)+" de "+u.n.length+": "+durText(dur).replace(/ \(.*$/,"")); }
    else { u.d=Math.round(dur*1000)/1000; did.push(durText(u.d)); }
    delete u.pos; delete u.e; changedSome=true; }
  if(rest!==null){
    // un silencio dicho solo va detrás de la nota que se acaba de dictar
    var target=u,onlyRest=!notes.length&&!hasDur&&beat===null&&!clear;
    if(onlyRest&&!selRest&&lastApplied&&paths.indexOf(lastApplied)===paths.indexOf(selPath)-1){ target=unitAt(lastApplied); }
    if(rest>0&&addMode){ target.r=Math.round(((target.r||0)+rest)*1000)/1000; did.push("añadido silencio de "+durText(rest).replace(/ \(.*$/,"")+" detrás de «"+(target.t||"")+"»"); }
    else if(rest>0){ target.r=rest; did.push("silencio de "+durText(rest).replace(/ \(.*$/,"")+" detrás de «"+(target.t||"")+"»"); }
    else { delete target.r; did.push("sin silencio detrás de «"+(target.t||"")+"»"); }
    changedSome=true; if(target!==u){ u=target; }
  }
  if(beat){ u.b=beat; changedSome=true; did.push("tiempo "+beat); }
  if(changedSome){ dict.undo.push(snapshot); if(dict.undo.length>50) dict.undo.shift(); dirty=true; dict.last="«"+(u.t||"")+"»: "+did.join(", "); }
  if(changedSome&&hasDur) lastApplied=selPath;
  if(nav>0&&!changedSome&&(u.n||[]).length>1&&selNote<u.n.length-1){ selNote++; dict.last="«"+(u.t||"")+"» nota "+selNote+" bien → nota "+(selNote+1); return; }
  if(nav) { if(nav>0) lastApplied=selPath; var ix2=paths.indexOf(selPath)+nav; if(ix2>=0&&ix2<paths.length){ selPath=paths[ix2]; selNote=0; } if(!changedSome) dict.last="«"+(unitAt(paths[Math.max(0,ix2-nav)]).t||"")+"» bien → siguiente"; }
  else if(changedSome&&(hasDur||(melisDone&&hasDur))){
    if(melis&&selNote<u.n.length-1&&(hasDur||melisDone)){ selNote++; }
    else { var ix3=paths.indexOf(selPath)+1; if(ix3<paths.length){ selPath=paths[ix3]; selNote=0; } } }
  selPaths=[selPath];
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
window.__viewerStart=start; window.__dict=function(){ return {on:dict.on,active:dict.active,err:dict.err}; };
window.__dictTest=function(t){ st.edit=true; if(!selPath) selPath=allPaths()[0]; runCmd(t); return {song:S[st.i],sel:selPath,last:dict.last}; };
start();
})();
