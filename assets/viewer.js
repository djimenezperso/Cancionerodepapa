(function(){
var css=document.createElement("style");
css.textContent=
 "body{margin:0;background:var(--bg);font-family:var(--f-text);padding:0 max(12px,env(safe-area-inset-left,0px)) 40px max(12px,env(safe-area-inset-right,0px))}"+
 "h1{font-family:var(--f-hand);font-size:30px;margin:14px 0 10px;color:var(--ink)}"+
 ".rbar{position:sticky;top:0;background:var(--bg);display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 0;z-index:2;border-bottom:1px solid var(--line);margin-bottom:12px}"+
 ".rbar button{font:inherit;font-weight:700;font-size:15px;border:1px solid var(--line);background:var(--sheet);color:var(--ink);border-radius:9px;padding:6px 11px;min-height:40px;cursor:pointer}"+
 ".rbar button.pri{background:var(--beat-odd);color:var(--sheet);border-color:var(--beat-odd)}"+
 ".rbar button.off{opacity:.5}"+
 ".rbar button:focus-visible,li button:focus-visible{outline:2px solid var(--beat-odd);outline-offset:2px}"+
 ".v{min-width:2.6em;text-align:center;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}"+
 ".lbl{font-size:13px;color:var(--muted)}"+
 "ul{list-style:none;margin:0;padding:0;background:var(--sheet);border-radius:10px;border:1px solid var(--line)} li+li{border-top:1px solid var(--line)}"+
 "li button{all:unset;display:flex;justify-content:space-between;gap:10px;width:100%;box-sizing:border-box;padding:14px 12px;font-weight:700;text-transform:uppercase;font-size:16px;cursor:pointer;color:var(--ink)}"+
 "li span{color:var(--muted);font-weight:400;text-transform:none;font-size:14px}"+
 ".rbar button.sw{border-color:var(--beat-odd);color:var(--beat-odd)}"+
 ".page.plain{background-image:none;padding:18px 12px 20px}"+
 ".page{background:var(--sheet);border:1px solid var(--line);border-radius:10px;padding:20px 16px 24px 30px;"+
 "background-image:linear-gradient(90deg,transparent 16px,var(--margin) 16px,var(--margin) 18px,transparent 18px),repeating-linear-gradient(180deg,transparent 0 31px,var(--rule) 31px 32px)}";
document.head.appendChild(css);
var S=window.SONGS||[],st={i:-1,k:0,size:22,bpm:80,click:true,mel:true,score:false},pl=new CORE.Player(),root=document.getElementById("app"),lastEl=null;
function b(t,f,c,lab){ var e=document.createElement("button"); e.type="button"; e.textContent=t; e.onclick=f; if(c) e.className=c; if(lab) e.setAttribute("aria-label",lab); return e; }
function sp(t,c){ var e=document.createElement("span"); e.className=c||"v"; e.textContent=t; return e; }
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
  pl.stop(); var s=S[st.i]; root.replaceChildren(); document.documentElement.style.setProperty("--size",st.size+"px");
  var bar=document.createElement("div"); bar.className="rbar";
  var pb=b(pl.playing?"■ Parar":"▶ Escuchar",function(){
    if(pl.playing){ pl.stop(); return; }
    if(pl.play(s,{tempo:st.bpm,transpose:st.k,click:st.click,melody:st.mel,onTick:tick,onEnd:function(){ pb.textContent="▶ Escuchar"; tick(null); }})) pb.textContent="■ Parar";
  },"pri");
  if(S.length>1) bar.append(b("← Lista",list));
  bar.append(b(st.score?"📝 Como en la hoja":"🎼 Partitura",function(){ st.score=!st.score; show(); },"sw"));
  bar.append(pb,sp("♩=","lbl"),b("−",function(){st.bpm=Math.max(30,st.bpm-4);show();},"","Más lento"),sp(st.bpm),b("+",function(){st.bpm=Math.min(240,st.bpm+4);show();},"","Más rápido"),
    b("Metrónomo",function(){st.click=!st.click;show();},st.click?"":"off"),b("Melodía",function(){st.mel=!st.mel;show();},st.mel?"":"off"),
    sp("Tono","lbl"),b("−",function(){st.k=Math.max(-12,st.k-1);show();},"","Bajar medio tono"),sp((st.k>0?"+":"")+st.k),b("+",function(){st.k=Math.min(12,st.k+1);show();},"","Subir medio tono"),
    b("A−",function(){st.size=Math.max(14,st.size-2);show();},"","Letra más pequeña"),b("A+",function(){st.size=Math.min(40,st.size+2);show();},"","Letra más grande"));
  root.appendChild(bar);
  var pg=document.createElement("div"); pg.className="page"; root.appendChild(pg);
  if(st.score&&window.SCORE){ pg.classList.add("plain"); SCORE.render(s,pg,{transpose:st.k}); }
  else CORE.render(s,pg,{transpose:st.k});
  if(!window.EMBEDDED){ try{ navigator.wakeLock&&navigator.wakeLock.request("screen").catch(function(){}); }catch(e){} }
}
function tick(p){ if(lastEl) lastEl.classList.remove("now"); lastEl=null; if(!p) return; var e=document.querySelector('[data-p="'+p+'"]'); if(e){ e.classList.add("now"); lastEl=e; var r=e.getBoundingClientRect(); if(r.top<70||r.bottom>innerHeight-40) e.scrollIntoView({block:"center",behavior:"smooth"}); } }
if(!S.length){ root.textContent="No hay canciones."; return; }
if(S.length===1){ st.i=0; st.bpm=S[0].tempo||80; show(); } else list();
})();
