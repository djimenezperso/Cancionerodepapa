/* Partitura en pentagrama (SVG propio, funciona sin internet).
   Usa los tiempos de la hoja (CORE.timeline) para calcular duraciones a semicorcheas. */
(function(){
var NS="http://www.w3.org/2000/svg",S=10,LETTERS="CDEFGAB";
var SH=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],FL=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
var SOL={"do":"C","re":"D","mi":"E","fa":"F","sol":"G","la":"A","si":"B"};
function E(tag,attrs,parent){ var e=document.createElementNS(NS,tag); for(var k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }
function T(txt,attrs,parent){ var e=E("text",attrs,parent); e.textContent=txt; return e; }

function spell(raw,k){
  var p=CORE.parseNote(raw); if(!p) return null;
  var midi=p.midi+(k||0);
  if(!k){
    var m=String(raw).trim().match(/^(do|re|mi|fa|sol|la|si)/i);
    var letter=SOL[m[1].toLowerCase()],acc=p.acc,oct=p.oct===null?3:p.oct;
    return {midi:midi,letter:letter,acc:acc,oct:oct};
  }
  var pc=((midi%12)+12)%12,pref=p.acc==="b"?FL:p.acc==="#"?SH:(k>0?SH:FL),n=pref[pc];
  return {midi:midi,letter:n[0],acc:n.slice(1),oct:Math.floor(midi/12)-1};
}
var DURS=[16,12,8,6,4,3,2,1];
function split(d){ var out=[]; while(d>0){ for(var i=0;i<DURS.length;i++){ if(DURS[i]<=d){ out.push(DURS[i]); d-=DURS[i]; break; } } } return out; }

/* ---------- modelo: compases con notas y silencios ---------- */
function build(song,k){
  var tl=CORE.timeline(song),M=tl.M,den=parseInt(String(song.ts||"4/4").split("/")[1],10)||4,U=den===8?2:4,B=M*U;
  var flat=[];(song.sections||[]).forEach(function(s,si){(s.lines||[]).forEach(function(l,li){(l.units||[]).forEach(function(u,ui){flat.push({u:u,first:ui===0,cues:ui===0?(l.cues||[]):[]});});});});
  var ev=[],prevE=0;
  tl.items.forEach(function(it,i){
    var notes=(it.notes||[]).map(function(n){return spell(n,k);}).filter(Boolean);
    var s=Math.max(prevE,Math.round((it.start-tl.origin)*U));
    ev.push({s:s,notes:notes,u:flat[i].u,cues:flat[i].cues,path:it.path,endBeat:it.end});
    prevE=s+(notes.length?1:0);
  });
  // fin de cada evento = inicio del siguiente; notas de una sílaba se reparten
  for(var i=0;i<ev.length;i++){
    var e=ev[i],nx=ev[i+1];
    var end=Math.round((e.endBeat-tl.origin)*U); if(nx) end=Math.min(end,nx.s); end=Math.max(end,e.s+1);
    if(e.notes.length>1&&end-e.s<e.notes.length){ var need=e.s+e.notes.length; for(var j=i+1;j<ev.length&&ev[j].s<need+(j-i-1);j++) ev[j].s=need+(j-i-1); end=nx?nx.s:need; }
    e.e=end;
  }
  // línea de tiempo plana de piezas (nota o silencio) con su sílaba
  var pieces=[],cur=0;
  ev.forEach(function(e){
    if(!e.notes.length){ // sílaba sin nota: se pega a la nota anterior como texto extra
      if(pieces.length){ var last=pieces[pieces.length-1]; last.extraLyric=(last.extraLyric?last.extraLyric+" ":"")+(e.u.t||""); }
      return;
    }
    if(e.s>cur) pieces.push({rest:true,s:cur,d:e.s-cur});
    var n=e.notes.length,len=e.e-e.s,each=Math.max(1,Math.floor(len/n)),t=e.s;
    e.notes.forEach(function(nt,ix){
      var d=ix===n-1?e.e-t:each;
      pieces.push({rest:false,s:t,d:d,note:nt,lyric:ix===0?(e.u.t||""):null,mel:ix>0,cues:ix===0?e.cues:[],path:e.path,mark:!!e.u.mark,pause:ix===n-1&&!!e.u.pause});
      t+=d;
    });
    cur=e.e;
  });
  var total=Math.max(cur,B),nb=Math.ceil(total/B);
  if(cur<nb*B) pieces.push({rest:true,s:cur,d:nb*B-cur});
  // trocear por compases y duraciones escribibles
  var bars=[];for(var b=0;b<nb;b++) bars.push([]);
  pieces.forEach(function(p){
    var t=p.s,left=p.d,firstSeg=true;
    while(left>0){
      var bi=Math.floor(t/B),room=(bi+1)*B-t,take=Math.min(room,left);
      var parts=split(take);
      parts.forEach(function(d,pi){
        var seg={rest:p.rest,d:d,note:p.note,path:p.path,mark:p.mark};
        if(firstSeg){ seg.lyric=p.lyric; seg.extraLyric=p.extraLyric; seg.cues=p.cues; seg.mel=p.mel; }
        else if(!p.rest) seg.cont=true;
        firstSeg=false;
        if(!p.rest&&(left-d>0)) seg.tie=true;
        if(!p.rest&&left-d===0&&p.pause) seg.pause=true;
        bars[bi].push(seg); left-=d; t+=d;
      });
    }
  });
  // un compás entero en silencio = silencio de redonda
  bars=bars.map(function(bar){ return bar.every(function(x){return x.rest;})?[{rest:true,d:B,whole:true}]:bar; });
  // quitar compases vacíos del principio
  while(bars.length>1&&bars[0].length===1&&bars[0][0].whole) bars.shift();
  // anacrusa: si el primer compás empieza con silencio, se escribe incompleto (solo las notas de antes del 1)
  var pickup=false;
  if(bars.length>1&&bars[0].length&&bars[0][0].rest&&bars[0].some(function(x){return !x.rest;})){ while(bars[0][0].rest) bars[0].shift(); pickup=true; }
  var mids=[];pieces.forEach(function(p){ if(!p.rest) mids.push(p.note.midi); }); mids.sort(function(a,b){return a-b;});
  var median=mids.length?mids[Math.floor(mids.length/2)]:64;
  return {bars:bars,M:M,den:den,U:U,B:B,octUp:median<65,pickup:pickup};
}

/* ---------- dibujo ---------- */
function posOf(n,octUp){ return (n.oct+(octUp?1:0))*7+LETTERS.indexOf(n.letter); } // E4 = 30 = línea inferior
function yOf(pos){ return 40-(pos-30)*S/2; }
var ACC={"#":"♯","b":"♭","n":"♮"};

function itemWidth(it){
  var w=16+9*Math.sqrt(it.d)+(it.showAcc?9:0);
  var txt=((it.lyric||"").replace(/-$/,"")+(it.extraLyric?" "+it.extraLyric:""));
  if(txt) w=Math.max(w,txt.length*7.6+8);
  return w;
}
function clef(g,x,octUp){
  var c=E("g",{transform:"translate("+x+",0)","class":"clef"},g);
  E("path",{d:"M13,-7 C21,-3 19,8 11,14 C4,20 1,26 3,32 C5,41 19,43 21,34 C23,26 14,21 9,26 C5,31 9,37 14,35",fill:"none","stroke-width":"2.3","stroke-linecap":"round"},c);
  E("path",{d:"M13,-7 C8,-2 9,6 11,14 L15,46 C16,52 9,54 7,50",fill:"none","stroke-width":"2","stroke-linecap":"round"},c);
  E("circle",{cx:7.5,cy:49,r:2.8,"class":"fillink"},c);
  if(octUp) T("8",{x:10,y:62,"class":"small"},c);
}
function rest(g,x,d,whole){
  var r=E("g",{transform:"translate("+x+",0)"},g),base=whole?16:d,dotted=[3,6,12].indexOf(base)>=0,core=dotted?base*2/3:base;
  if(core>=16){ E("rect",{x:-6,y:10,width:12,height:5,"class":"fillink"},r); }
  else if(core===8){ E("rect",{x:-6,y:15,width:12,height:5,"class":"fillink"},r); }
  else if(core===4){ E("path",{d:"M-2,7 L4,14 L0,20 L5,27 C0,25 -2,29 2,33 C-5,30 -4,23 2,24 L-3,18 L1,13 Z","class":"fillink"},r); }
  else { // corchea / semicorchea
    var flags=core===2?1:2;
    for(var f=0;f<flags;f++){ var yy=14+f*8; E("circle",{cx:-2,cy:yy,r:2.4,"class":"fillink"},r); E("path",{d:"M-2,"+(yy+1)+" C1,"+(yy+1)+" 4,"+(yy-1)+" 5,"+(yy-3),fill:"none","stroke-width":"1.6"},r); }
    E("line",{x1:5,y1:11,x2:0,y2:30+(flags-1)*6,"stroke-width":"1.6"},r);
  }
  if(dotted) E("circle",{cx:9,cy:15,r:1.8,"class":"fillink"},r);
}
function drawNote(g,x,it,octUp,noStem){
  var n=it.note,pos=posOf(n,octUp),y=yOf(pos),base=it.d,dotted=[3,6,12].indexOf(base)>=0,core=dotted?base*2/3:base;
  var grp=E("g",{"class":"sn"+(it.mark?" mk":""),"data-p":it.path||""},g);
  var upS=pos<34; E("rect",{x:x-12,y:upS?y-38:y-10,width:24,height:48,"class":"hit"},grp); // zona para tocar con el dedo
  if(it.mark) E("rect",{x:x-9,y:y-7,width:18,height:14,rx:3,"class":"hl"},grp);
  // líneas adicionales
  for(var p=28;p>=pos;p-=2) E("line",{x1:x-10,x2:x+10,y1:yOf(p),y2:yOf(p),"stroke-width":"1.2"},grp);
  for(var q=40;q<=pos;q+=2) E("line",{x1:x-10,x2:x+10,y1:yOf(q),y2:yOf(q),"stroke-width":"1.2"},grp);
  if(it.showAcc) T(ACC[it.showAcc],{x:x-17,y:y+6,"class":"acc"},grp);
  var hollow=core>=8;
  E("ellipse",{cx:x,cy:y,rx:5.8,ry:4.1,transform:"rotate(-20 "+x+" "+y+")","class":hollow?"head hollow":"head","stroke-width":hollow?"1.7":"0"},grp);
  var up=pos<34,sx=up?x+5.2:x-5.2,len=34;
  if(core<16&&!noStem){
    var y2=up?y-len:y+len; E("line",{x1:sx,y1:y+(up?-1:1),x2:sx,y2:y2,"stroke-width":"1.4"},grp);
    var flags=core===2?1:core===1?2:0;
    for(var f=0;f<flags;f++){ var fy=y2+(up?f*8:-f*8); E("path",{d:up?("M"+sx+","+fy+" c1,7 10,9 8,19"):("M"+sx+","+fy+" c1,-7 10,-9 8,-19"),fill:"none","stroke-width":"1.6"},grp); }
  }
  if(dotted) E("circle",{cx:x+10,cy:pos%2===0?y-4:y,r:1.9,"class":"fillink"},grp);
  return {x:x,y:y,up:up,pos:pos,core:core,grp:grp};
}

/* grupos de corcheas/semicorcheas unidas por barra: dentro de un mismo tiempo (en 6/8, cada tres corcheas) */
function beamGroups(bar,m,startOff){
  var W=m.den===8?6:m.U,groups=[],cur=[],curWin=null,off=startOff;
  bar.forEach(function(it,ix){
    var base=it.d,dotted=[3,6,12].indexOf(base)>=0,core=dotted?base*2/3:base,win=Math.floor(off/W);
    var beamable=!it.rest&&it.note&&core<4&&!it.whole;
    if(beamable&&curWin===win){ cur.push(ix); }
    else { if(cur.length>1) groups.push(cur); cur=beamable?[ix]:[]; curWin=beamable?win:null; }
    off+=it.d;
  });
  if(cur.length>1) groups.push(cur);
  return groups;
}
function drawBeams(svg,notes){
  var up=notes.reduce(function(a,n){return a+n.pos;},0)/notes.length<34,dir=up?-1:1;
  var f=notes[0],l=notes[notes.length-1],sx=function(n){return up?n.x+5.2:n.x-5.2;};
  var y1=f.y+dir*32,y2=l.y+dir*32,dx=sx(l)-sx(f)||1,slope=Math.max(-0.12,Math.min(0.12,(y2-y1)/dx));
  var by=function(x){return y1+slope*(x-sx(f));};
  // que ninguna plica quede más corta de 26
  var fix=0; notes.forEach(function(n){ var need=up?(by(sx(n))-(n.y-26)):((n.y+26)-by(sx(n))); if(need>fix) fix=need; });
  y1+=dir*fix;
  notes.forEach(function(n){ E("line",{x1:sx(n),y1:n.y+(up?-1:1),x2:sx(n),y2:by(sx(n)),"stroke-width":"1.4"},n.grp); });
  var t=4.6;
  function beam(xa,xb,lvl){ var off=-dir*lvl*7.5,ya=by(xa)+off,yb=by(xb)+off;
    E("path",{d:"M"+xa+","+ya+" L"+xb+","+yb+" L"+xb+","+(yb-dir*t)+" L"+xa+","+(ya-dir*t)+" Z","class":"fillink"},svg); }
  beam(sx(f),sx(l),0);
  // segunda barra para las semicorcheas
  notes.forEach(function(n,i){
    if(n.core!==1) return;
    var nx=notes[i+1],pv=notes[i-1];
    if(nx&&nx.core===1) beam(sx(n),sx(nx),1);
    else if(!(pv&&pv.core===1)){ var stub=8; if(nx) beam(sx(n),sx(n)+stub,1); else beam(sx(n)-stub,sx(n),1); }
  });
}

function render(song,root,o){
  o=o||{}; var k=o.transpose||0,m=build(song,k);
  root.replaceChildren();
  var wrap=document.createElement("div"); wrap.className="score"; root.appendChild(wrap);
  var h=document.createElement("h2"); h.className="sv-title"; h.textContent=song.title||"Sin título"; wrap.appendChild(h);
  var meta=document.createElement("div"); meta.className="sv-meta";
  meta.textContent="♩ = "+(song.tempo||80)+(k?"   ·   Tono "+(k>0?"+":"")+k:"")+(m.octUp?"   ·   Clave de sol octava baja (voz de hombre)":"");
  wrap.appendChild(meta);
  // alteraciones a mostrar (se reinician en cada compás)
  m.bars.forEach(function(bar){ var state={}; bar.forEach(function(it){ if(it.rest||!it.note) return; var key=it.note.letter+it.note.oct,acc=it.note.acc||"n",prev=state[key]||"n"; if(it.cont){ state[key]=acc; return; } it.showAcc=acc!==prev?acc:null; state[key]=acc; }); });
  var W=Math.max(300,(root.clientWidth||wrap.clientWidth||700)-4),HEAD=46,TS=22;
  var bw=m.bars.map(function(bar){ return 14+bar.reduce(function(a,it){ return a+itemWidth(it); },0); });
  var systems=[],cur=[],used=0;
  bw.forEach(function(w,i){ var head=HEAD+(systems.length===0&&cur.length===0?TS:0); if(cur.length&&used+w>W-head){ systems.push(cur); cur=[]; used=0; } cur.push(i); used+=w; });
  if(cur.length) systems.push(cur);
  var pending=null; // ligadura que cruza de sistema
  systems.forEach(function(sys,si){
    var first=si===0,head=HEAD+(first?TS:0),natural=sys.reduce(function(a,i){return a+bw[i];},0);
    var stretch=(si<systems.length-1||natural>(W-head)*0.7)?(W-head)/natural:1;
    // altura según notas más graves / agudas
    var topY=-6,botY=46;
    sys.forEach(function(bi){ m.bars[bi].forEach(function(it){ if(!it.rest&&it.note){ var p=posOf(it.note,m.octUp),y=yOf(p),up=p<34;
      topY=Math.min(topY,up?y-36:y-8); botY=Math.max(botY,up?y+8:y+36); } }); });
    var hasCue=sys.some(function(bi){return m.bars[bi].some(function(it){return it.cues&&it.cues.length;});});
    var top=Math.ceil(-topY+8+(hasCue?18:0)),lyrY=Math.ceil(botY+18);
    var svg=E("svg",{width:W,height:top+lyrY+26,viewBox:"0 "+(-top)+" "+W+" "+(top+lyrY+26),"class":"sys",role:"img","aria-label":"Pentagrama"});
    wrap.appendChild(svg);
    for(var l=0;l<5;l++) E("line",{x1:0,x2:W,y1:l*S,y2:l*S,"stroke-width":"1","class":"staff"},svg);
    E("line",{x1:0.5,x2:0.5,y1:0,y2:40,"stroke-width":"1.2"},svg);
    clef(svg,6,m.octUp);
    if(first){ T(String(m.M),{x:HEAD+2,y:18,"class":"ts"},svg); T(String(m.den),{x:HEAD+2,y:38,"class":"ts"},svg); }
    var x=head,heads=[],lyr=[];
    if(pending){ E("path",{d:"M"+(head-14)+","+(pending.y+(pending.up?7:-7))+" Q"+(head-6)+","+(pending.y+(pending.up?12:-12))+" "+(head+2)+","+(pending.y+(pending.up?7:-7)),fill:"none","stroke-width":"1.3"},svg); pending=null; }
    sys.forEach(function(bi,bix){
      x+=7*stretch;
      var barItems=m.bars[bi],tot=barItems.reduce(function(a,x){return a+x.d;},0);
      var groups=beamGroups(barItems,m,(bi===0&&m.pickup)?Math.max(0,m.B-tot):0),inBeam={},drawn={};
      groups.forEach(function(g,gi){ g.forEach(function(ix){ inBeam[ix]=gi; }); });
      barItems.forEach(function(it,ix){
        var w=itemWidth(it)*stretch,cx=x+Math.min(w/2,(it.showAcc?18:12)+4*Math.sqrt(it.d));
        if(it.rest) rest(svg,cx,it.d,it.whole);
        else{
          var r=drawNote(svg,cx,it,m.octUp,inBeam[ix]!==undefined); r.it=it; heads.push(r); drawn[ix]=r;
          var txt=it.lyric||"";
          if(txt||it.extraLyric){ var hy=/-$/.test(txt),clean=txt.replace(/-$/,"")+(it.extraLyric?" "+it.extraLyric:""); lyr.push({x:cx,t:clean,hy:hy}); }
          if(it.cues&&it.cues.length) T(it.cues.join(" · "),{x:cx-6,y:-top+12,"class":"cueTxt"},svg);
          if(it.pause) T("’",{x:cx+12,y:-6,"class":"breath"},svg);
        }
        x+=w;
      });
      groups.forEach(function(g){ drawBeams(svg,g.map(function(ix){return drawn[ix];})); });
      x+=7*stretch;
      var last=bix===sys.length-1&&si===systems.length-1;
      E("line",{x1:x,x2:x,y1:0,y2:40,"stroke-width":last?"1.2":"1"},svg);
      if(last) E("rect",{x:x+3,y:0,width:4,height:40,"class":"fillink"},svg);
    });
    // ligaduras
    heads.forEach(function(h,i){ if(!h.it.tie) return; var nx=heads[i+1],dy=h.up?7:-7,cy=h.up?14:-14;
      if(nx) E("path",{d:"M"+(h.x+4)+","+(h.y+dy)+" Q"+((h.x+nx.x)/2)+","+(h.y+cy)+" "+(nx.x-4)+","+(nx.y+dy),fill:"none","stroke-width":"1.3"},svg);
      else { E("path",{d:"M"+(h.x+4)+","+(h.y+dy)+" Q"+(h.x+14)+","+(h.y+cy)+" "+(W-2)+","+(h.y+dy),fill:"none","stroke-width":"1.3"},svg); pending={y:h.y,up:h.up}; } });
    // letra
    lyr.forEach(function(L,i){ T(L.t,{x:L.x,y:lyrY,"class":"lyr","text-anchor":"middle"},svg); if(L.hy){ var nx=lyr[i+1],hx=nx?(L.x+nx.x)/2:L.x+L.t.length*4+10; T("-",{x:hx,y:lyrY,"class":"lyr","text-anchor":"middle"},svg); } });
  });
  var note=document.createElement("p"); note.className="score-note";
  note.textContent="Duraciones calculadas a partir de los tiempos de la hoja; pueden necesitar algún retoque.";
  wrap.appendChild(note);
}
window.SCORE={render:render,build:build};
})();
