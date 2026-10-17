window.CORE=(function(){
  var PC={"do":0,"re":2,"mi":4,"fa":5,"sol":7,"la":9,"si":11};
  var NS=["Do","Do#","Re","Re#","Mi","Fa","Fa#","Sol","Sol#","La","La#","Si"],NF=["Do","Reb","Re","Mib","Mi","Fa","Solb","Sol","Lab","La","Sib","Si"];
  function parseNote(s){
    var m=String(s||"").trim().match(/^(do|re|mi|fa|sol|la|si)\s*(#|♯|b|♭)?\s*([0-8])?(.*)$/i);
    if(!m) return null;
    var acc=m[2]==="♯"?"#":m[2]==="♭"?"b":(m[2]||"");
    var pc=PC[m[1].toLowerCase()]+(acc==="#"?1:acc==="b"?-1:0);
    var oct=m[3]!==undefined&&m[3]!==""?parseInt(m[3],10):null;
    return {pc:(pc+12)%12,acc:acc,oct:oct,rest:m[4]||"",midi:12*((oct===null?3:oct)+1)+pc};
  }
  function trNote(s,k){
    var p=parseNote(s); if(!p) return {name:String(s),oct:null};
    if(!k) return {name:String(s).trim().replace(/\s*([0-8])(\s*)$/,"").replace(/[0-8](?=\s*$)/,""),oct:p.oct,raw:p};
    var m=p.midi+k,pc=((m%12)+12)%12,oct=Math.floor(m/12)-1;
    var names=p.acc==="b"?NF:p.acc==="#"?NS:(k>0?NS:NF);
    return {name:names[pc],oct:(p.oct!==null||oct!==3)?oct:null};
  }
  function noteLabel(s,k){
    var p=parseNote(s); if(!p) return {base:String(s),oct:""};
    var m=p.midi+(k||0),pc=((m%12)+12)%12,oct=Math.floor(m/12)-1,base;
    if(!k){ var mm=String(s).trim().match(/^(do|re|mi|fa|sol|la|si)\s*(#|♯|b|♭)?/i); base=mm[1].charAt(0).toUpperCase()+mm[1].slice(1).toLowerCase()+(p.acc); }
    else base=(p.acc==="b"?NF:p.acc==="#"?NS:(k>0?NS:NF))[pc];
    var showOct=k?(p.oct!==null||oct!==3):p.oct!==null;
    return {base:base,oct:showOct?String(oct):""};
  }
  function beatsPerBar(ts){ var n=parseInt(String(ts||"4/4"),10); return n>0&&n<=12?n:4; }
  function flatten(song){
    var out=[];(song.sections||[]).forEach(function(s,si){(s.lines||[]).forEach(function(l,li){(l.units||[]).forEach(function(u,ui){out.push({u:u,path:si+"."+li+"."+ui});});});});
    return out;
  }
  function timeline(song,noDur){
    var M=beatsPerBar(song.ts),f=flatten(song),n=f.length,st=new Array(n).fill(null),heldEnd=new Array(n).fill(null),last=null,any=false;
    var hasPos=f.some(function(x){return typeof x.u.pos==="number";});
    var hasDur=!noDur&&!hasPos&&f.some(function(x){return typeof x.u.d==="number"&&x.u.d>0;});
    if(hasDur){
      // duraciones: posiciones seguidas y se encaja el primer número de tiempo de la hoja (anacrusa).
      // Las sílabas sin duración usan la que sale de los números de tiempo.
      var base=timeline(song,true).items,t=0,durEnd=new Array(n);
      for(var di=0;di<n;di++){ var bd=di+1<n?base[di+1].start-base[di].start:base[di].end-base[di].start; if(!(bd>0)) bd=1;
        var dd=(typeof f[di].u.d==="number"&&f[di].u.d>0)?f[di].u.d:Math.round(bd*4)/4||1; st[di]=t; durEnd[di]=t+dd; t+=dd+((typeof f[di].u.r==="number"&&f[di].u.r>0)?f[di].u.r:0); }
      var shift=0; for(var fi=0;fi<n;fi++){ var fb=+f[fi].u.b; if(fb>=1&&fb<=M){ shift=(((fb-1-st[fi])%M)+M)%M; break; } }
      var itemsD=[];
      for(var xi=0;xi<n;xi++) itemsD.push({path:f[xi].path,start:st[xi]+shift,end:durEnd[xi]+shift,notes:(f[xi].u.n||[])});
      return {items:itemsD,M:M,origin:0};
    }
    for(var i=0;i<n;i++){
      if(hasPos){ if(typeof f[i].u.pos==="number"){ st[i]=f[i].u.pos; any=true; } continue; }
      var b=+f[i].u.b; if(!(b>=1&&b<=M)) continue; any=true;
      var k; if(last===null) k=b-1; else { k=last+1; while(((k%M)+M)%M!==b-1) k++; }
      st[i]=k; last=k;
      var uu=+f[i].u.u; if(uu>=1&&uu<=M){ var e=k+1; while(((e%M)+M)%M!==uu-1) e++; heldEnd[i]=e; last=e; }
    }
    if(!any){ for(var j=0;j<n;j++) st[j]=j; }
    else{
      var i2=0;
      while(i2<n){
        if(st[i2]!==null){ i2++; continue; }
        var a=i2; while(i2<n&&st[i2]===null) i2++; var z=i2; // run [a,z)
        var p=a-1,q=z<n?z:-1,cnt=z-a;
        if(p>=0&&q>=0){ var lo=heldEnd[p]!==null?heldEnd[p]:st[p],hi=st[q]; if(hi<=lo) hi=lo+cnt+1; for(var r=0;r<cnt;r++) st[a+r]=lo+(hi-lo)*(r+1)/(cnt+1); }
        else if(q>=0){ for(var r2=0;r2<cnt;r2++) st[a+r2]=st[q]-(cnt-r2); }
        else { var lo2=p>=0?(heldEnd[p]!==null?heldEnd[p]:st[p]):0; for(var r3=0;r3<cnt;r3++) st[a+r3]=lo2+r3+1; }
      }
    }
    var items=[];
    for(var x=0;x<n;x++){
      var end=x+1<n?st[x+1]:(heldEnd[x]!==null?heldEnd[x]+1:st[x]+2);
      var ue=f[x].u.e; if(typeof ue==="number"&&ue>st[x]) end=x+1<n?Math.min(end,ue):ue;
      if(end<=st[x]) end=st[x]+0.5;
      items.push({path:f[x].path,start:st[x],end:end,notes:(f[x].u.n||[])});
    }
    var minS=items.length?Math.min.apply(null,items.map(function(t){return t.start;})):0;
    return {items:items,M:M,origin:Math.floor(minS/M)*M};
  }
  function el(t,c,txt){ var e=document.createElement(t); if(c) e.className=c; if(txt!==undefined) e.textContent=txt; return e; }
  function render(song,root,o){
    o=o||{}; var k=o.transpose||0,M=beatsPerBar(song.ts);
    root.replaceChildren(); var sv=el("div","sv"+(o.edit?" editing":"")); root.appendChild(sv);
    var head=el("div","sv-head"); head.appendChild(el("h2","sv-title",song.title||"Sin título"));
    var meta=el("div","sv-meta");
    function mi(lbl,val){ var s=el("span"); s.appendChild(document.createTextNode(lbl+" ")); s.appendChild(el("b","",val)); meta.appendChild(s); }
    mi("Compás",song.ts||"4/4"); if(song.tempo) mi("♩ =",String(song.tempo)); if(song.page) mi("Hoja",String(song.page)); if(k) mi("Tono",(k>0?"+":"")+k);
    head.appendChild(meta); sv.appendChild(head);
    var secs=song.sections||[];
    if(!secs.length||!secs.some(function(s){return (s.lines||[]).length;})) sv.appendChild(el("p","sv-empty","Esta canción no tiene versos todavía."));
    secs.forEach(function(s,si){
      var sec=el("div","sv-sec"); if(s.label) sec.appendChild(el("div","sv-lab",s.label));
      (s.lines||[]).forEach(function(l,li){
        var line=el("div","sv-line"),units=el("div","sv-units");
        (l.units||[]).forEach(function(u,ui){
          var b=+u.b,hasB=b>=1&&b<=M;
          var U=el(o.edit?"button":"div","u"+(hasB&&b===1?" bar":"")+(u.pause?" pz":"")+(/-$/.test(u.t||"")?" join":""));
          U.dataset.p=si+"."+li+"."+ui; if(o.edit) U.type="button";
          var bt=el("span","bt"+(hasB?(b%2?" odd":" even")+(b===1?" one":""):""),hasB?(b+(+u.u>=1&&+u.u<=M?"–"+u.u:"")):" ");
          var nt=el("span","nt"+(u.mark?" mk":""));
          var ns=(u.n||[]).filter(function(x){return String(x).trim();});
          if(ns.length){ ns.forEach(function(nn,ix){ if(ix) nt.appendChild(document.createTextNode("–")); var L=noteLabel(nn,k); nt.appendChild(document.createTextNode(L.base)); if(L.oct){ var sp=el("sup","",L.oct); nt.appendChild(sp);} }); }
          else nt.textContent=" ";
          if(u.x){ nt.appendChild(el("span","x",String(u.x))); }
          var ly=el("span","ly"+(u.acc?" acc":""),u.t||" ");
          U.appendChild(bt);U.appendChild(nt);U.appendChild(ly);
          if(o.edit&&o.onUnit) U.addEventListener("click",function(){o.onUnit(si,li,ui);});
          units.appendChild(U);
        });
        line.appendChild(units);
        var cues=(l.cues||[]).filter(function(c){return String(c).trim();});
        if(cues.length){ var cw=el("div","sv-cues"); cues.forEach(function(c){cw.appendChild(el("span","cue",c));}); line.appendChild(cw); }
        if(o.edit&&o.onLine){ var la=el("div","lineadd"),b1=el("button","btn sm","Apuntes del verso"); b1.type="button"; b1.onclick=function(){o.onLine(si,li);}; la.appendChild(b1); line.appendChild(la); }
        sec.appendChild(line);
      });
      if(o.edit&&o.onAddLine){ var ab=el("button","btn sm","+ Añadir verso"); ab.type="button"; ab.onclick=function(){o.onAddLine(si);}; sec.appendChild(ab); }
      sv.appendChild(sec);
    });
    var gen=(song.general||[]).filter(function(c){return String(c).trim();});
    if(gen.length){ var g=el("div","sv-general"); gen.forEach(function(c){g.appendChild(el("span","cue",c));}); sv.appendChild(g); }
    return sv;
  }
  /* sonido de piano sencillo: armónicos con ataque rápido que se van apagando, y un filtro que lo suaviza */
  function pianoNote(ctx,out,f,s,dur){
    var len=Math.min(3.2,Math.max(0.5,dur+0.35)),lp=ctx.createBiquadFilter(),g=ctx.createGain();
    lp.type="lowpass"; lp.frequency.setValueAtTime(Math.min(9000,f*9),s); lp.frequency.exponentialRampToValueAtTime(Math.max(400,f*2.2),s+len);
    g.gain.setValueAtTime(0.0001,s); g.gain.exponentialRampToValueAtTime(0.32,s+0.006); g.gain.exponentialRampToValueAtTime(0.12,s+0.25);
    g.gain.exponentialRampToValueAtTime(0.0001,s+len);
    if(dur+0.12<len){ g.gain.setTargetAtTime(0.0001,s+dur+0.05,0.08); } // al soltar la tecla
    lp.connect(g); g.connect(out);
    [[1,1,0],[2,0.45,3],[3,0.22,-4],[4,0.12,2],[5,0.06,0]].forEach(function(h){
      var os=ctx.createOscillator(),hg=ctx.createGain(); os.type="sine"; os.frequency.value=f*h[0]; os.detune.value=h[2];
      hg.gain.value=h[1]*(h[0]>1?Math.exp(-(h[0]-1)*f/2500):1); os.connect(hg); hg.connect(lp); os.start(s); os.stop(s+len+0.05);
    });
  }
  function Player(){
    var ctx=null,raf=0,self=this; this.playing=false;
    this.stop=function(){ self.playing=false; cancelAnimationFrame(raf); if(ctx){ try{ctx.close();}catch(e){} ctx=null; } if(self.onEnd) self.onEnd(); };
    this.play=function(song,o){
      self.stop(); var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
      ctx=new AC(); self.playing=true; self.onEnd=o.onEnd;
      var tl=timeline(song),M=tl.M,spb=60/Math.max(30,Math.min(240,o.tempo||80)),t0=ctx.currentTime+0.15,k=o.transpose||0;
      var minStart=tl.items.length?Math.min.apply(null,tl.items.map(function(i){return i.start;})):0;
      var ref=o.click===false?minStart:tl.origin-M; // sin metrónomo no hay compás de cuenta: empieza en la primera nota
      function T(abs){ return t0+(abs-ref)*spb; }
      var lastEnd=tl.items.length?Math.max.apply(null,tl.items.map(function(i){return i.end;})):M;
      var master=ctx.createGain(); master.gain.value=0.9; master.connect(ctx.destination);
      if(o.click!==false){
        for(var a=tl.origin-M;a<Math.ceil(lastEnd);a++){
          var t=T(a),acc=((a%M)+M)%M===0,os=ctx.createOscillator(),g=ctx.createGain();
          os.type="square"; os.frequency.value=acc?1760:1180; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(acc?0.22:0.12,t+0.002); g.gain.exponentialRampToValueAtTime(0.0001,t+0.05);
          os.connect(g); g.connect(master); os.start(t); os.stop(t+0.06);
        }
      }
      if(o.melody!==false){
        tl.items.forEach(function(it){
          var ns=it.notes.map(function(n){return parseNote(n);}).filter(Boolean); if(!ns.length) return;
          var d=(it.end-it.start)/ns.length;
          ns.forEach(function(p,ix){
            var s=T(it.start+ix*d),dur=Math.max(0.12,d*spb*0.94),f=440*Math.pow(2,(p.midi+k-69)/12);
            if(o.piano){ pianoNote(ctx,master,f,s,dur); return; }
            [[1,"triangle",0.16],[2,"sine",0.04]].forEach(function(h){
              var os=ctx.createOscillator(),g=ctx.createGain(); os.type=h[1]; os.frequency.value=f*h[0];
              g.gain.setValueAtTime(0.0001,s); g.gain.exponentialRampToValueAtTime(h[2],s+0.03); g.gain.exponentialRampToValueAtTime(h[2]*0.55,s+Math.min(0.4,dur*0.5));
              g.gain.setValueAtTime(h[2]*0.55,s+dur-0.06); g.gain.exponentialRampToValueAtTime(0.0001,s+dur);
              os.connect(g); g.connect(master); os.start(s); os.stop(s+dur+0.02);
            });
          });
        });
      }
      var endT=T(Math.ceil(lastEnd))+0.2,cur=null;
      (function loop(){
        if(!ctx) return; var now=ctx.currentTime,p=null;
        for(var i=0;i<tl.items.length;i++){ var it=tl.items[i]; if(now>=T(it.start)&&now<T(it.end)){ p=it.path; break; } }
        if(p!==cur){ cur=p; if(o.onTick) o.onTick(p); }
        if(now>endT){ self.stop(); return; }
        raf=requestAnimationFrame(loop);
      })();
      return true;
    };
  }
  return {render:render,timeline:timeline,Player:Player,pianoNote:pianoNote,parseNote:parseNote,beatsPerBar:beatsPerBar};
})();
