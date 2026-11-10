/* Presentation-only adapter: rendering never owns turns, RNG, storage or network. */
(()=>{'use strict';
 function createDiceView({canvas,kind,rules:E,getState}){
 let ctx=canvas.getContext('2d');const points=[],targets=[],reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;let game,look,animation,selected,interactive,inspection,surface=null,surfaceKey='',encounterSurface=null,encounterKey='',surfaceBuilds=0,lastEffect=null;
 const fa=n=>String(n).replace(/[\u06f0-\u06f9\u0660-\u0669]/g,d=>String(d.charCodeAt(0)-(d.charCodeAt(0)>=0x6f0?0x6f0:0x660))),rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),mix=(a,b,k)=>'#'+rgb(a).map((n,i)=>Math.round(n+(rgb(b)[i]-n)*k).toString(16).padStart(2,'0')).join('');
 const contrast=c=>{const[r,g,b]=rgb(c);return r*.2126+g*.7152+b*.0722>155?'#29415d':'#f1f6ff'},color=p=>look.colors[p],name=p=>getState().name(p),canPlay=()=>interactive,qSeat=q=>game.players===4?q:q===0?0:q===2?1:null,qColor=q=>qSeat(q)===null?'#b9c8ce':color(qSeat(q));
 const PATH=[[1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],[6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6]];
 function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
 function circle(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
 function text(s,x,y,size,c,weight='normal'){ctx.fillStyle=c;ctx.font=weight+' '+size+'px Tahoma';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y)}
 function token(x,y,r,c,label,glow=false,ghost=false){if(window.TabletopArt){window.TabletopArt.pawn(ctx,x,y,r,c,label,glow,ghost);return}ctx.save();if(ghost)ctx.globalAlpha=.65;if(glow){circle(x,y,r*1.7,mix(c,'#ffffff',.72));ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(x,y,r*1.65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}ctx.shadowColor='#20385544';ctx.shadowBlur=r*.55;ctx.shadowOffsetY=r*.4;ctx.beginPath();ctx.ellipse(x,y+r*.55,r,r*.65,0,0,7);ctx.fillStyle=mix(c,'#172e4e',.3);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;const gradient=ctx.createRadialGradient(x-r*.3,y-r*.65,r*.1,x,y,r*1.2);gradient.addColorStop(0,mix(c,'#ffffff',.65));gradient.addColorStop(.45,c);gradient.addColorStop(1,mix(c,'#132c50',.25));ctx.fillStyle=gradient;ctx.beginPath();ctx.roundRect(x-r*.72,y-r*.7,r*1.44,r*1.4,r*.55);ctx.fill();circle(x,y-r*.6,r*.6,gradient);circle(x-r*.2,y-r*.84,r*.17,'#ffffff6b');window.StudioArt?.glint(ctx,x,y-r*.6,r*.55);text(label,x,y+r*.07,r*.85,contrast(c),'bold');ctx.restore()}
 function ludoPoint(p,pawn,progress=game.pawns[p][pawn]){const q=E.quadrant(game,p);if(progress===-1){const origin=[[0,0],[9,0],[9,9],[0,9]][q];return{x:(origin[0]+[1.8,4.2,1.8,4.2][pawn])*50,y:(origin[1]+[1.8,1.8,4.2,4.2][pawn])*50}}if(progress<=50){const[x,y]=PATH[E.ring(game,p,progress)];return{x:(x+.5)*50,y:(y+.5)*50}}const n=progress-50,xy=q===0?[n,7]:q===1?[7,n]:q===2?[14-n,7]:[7,14-n];return{x:(xy[0]+.5)*50,y:(xy[1]+.5)*50}}
 function snakePoint(n){if(n<=0)return{x:37.5,y:735};const row=Math.floor((n-1)/10),col=row%2?9-(n-1)%10:(n-1)%10;return{x:col*75+37.5,y:(9-row)*75+37.5}}
 function curve(from,to,index){const a=snakePoint(from),b=snakePoint(to),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,bend=Math.min(72,length*.3)*(index%2?1:-1),nx=-dy/length,ny=dx/length;return{a,b,c:{x:a.x+dx*.28+nx*bend,y:a.y+dy*.3+ny*bend},d:{x:a.x+dx*.72-nx*bend,y:a.y+dy*.7-ny*bend}}}
 function curveAt(c,t){const k=1-t;return{x:k*k*k*c.a.x+3*k*k*t*c.c.x+3*k*t*t*c.d.x+t*t*t*c.b.x,y:k*k*k*c.a.y+3*k*k*t*c.c.y+3*k*t*t*c.d.y+t*t*t*c.b.y}}
 function draw(now=performance.now()){const rect=canvas.getBoundingClientRect();if(!rect.width)return;const dpr=Math.min(devicePixelRatio||1,kind==='snakes'&&!(navigator.deviceMemory&&navigator.deviceMemory<=4)?3:2),size=Math.round(rect.width*dpr);if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size}ctx.setTransform(size/750,0,0,size/750,0,0);ctx.clearRect(0,0,750,750);points.length=0;if(kind==='ludo')drawLudo(now);else drawSnakes(now)}
 function drawLudo(now){roundRect(0,0,750,750,14,look.board);const quadrants=[[0,0],[450,0],[450,450],[0,450]];for(let q=0;q<4;q++){const[x,y]=quadrants[q],c=qColor(q),seat=qSeat(q);window.TabletopArt.home(ctx,x,y,c,seat===null?'':name(seat),seat===null)}
  for(let i=0;i<PATH.length;i++){const[x,y]=PATH[i],start=[0,13,26,39].indexOf(i);roundRect(x*50+1,y*50+1,48,48,3,start>=0?mix(qColor(start),'#ffffff',.25):(x+y)%2?mix(look.board,'#d9e5f1',.35):'#ffffff','#d8e2ee');if(E.SAFE.includes(i))text('✦',x*50+25,y*50+26,23,start>=0?mix(qColor(start),'#183353',.28):'#91a8bf')}
  for(let q=0;q<4;q++)for(let n=1;n<=6;n++){const[x,y]=q===0?[n,7]:q===1?[7,n]:q===2?[14-n,7]:[7,14-n];roundRect(x*50+1,y*50+1,48,48,3,mix(qColor(q),'#ffffff',n===6?.06:.4),'#ffffff90');if(n===6)text('◆',x*50+25,y*50+25,20,'#ffffff')}
  const tris=[[[300,300],[300,450],[375,375]],[[300,300],[450,300],[375,375]],[[450,300],[450,450],[375,375]],[[300,450],[450,450],[375,375]]];tris.forEach((a,q)=>{ctx.beginPath();ctx.moveTo(...a[0]);a.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=qColor(q);ctx.fill()});circle(375,375,13,'#ffffff');text('★',375,375,16,'#e9b64d');
  const groups=new Map(),event=animation?.event,t=animation?Math.max(0,Math.min(1,(now-animation.start)/Math.max(1,animation.duration))):1;
  targets.length=0;if(canPlay())for(const pawn of E.legal(game)){const event=E.preview(game,pawn),p=ludoPoint(game.turn,pawn,event.to);let target=targets.find(v=>v.x===p.x&&v.y===p.y);if(!target){target={...p,pawns:[],finish:event.to===E.FINISH,safe:event.to>E.FINISH-6||E.SAFE.includes(E.ring(game,game.turn,event.to)),capture:event.captured.length};targets.push(target)}target.pawns.push(pawn)}
  for(const target of targets){const chosen=target.pawns.includes(selected);circle(target.x,target.y,23,mix(color(game.turn),'#ffffff',.78));ctx.strokeStyle=color(game.turn);ctx.lineWidth=chosen?4:2;ctx.beginPath();ctx.arc(target.x,target.y,23,0,Math.PI*2);ctx.stroke();text(target.finish?'⚑':target.capture?'×':target.safe?'✦':target.pawns.map(i=>fa(i+1)).join('/'),target.x,target.y,17,contrast(mix(color(game.turn),'#ffffff',.78)),'bold')}
  for(let p=0;p<game.players;p++)for(let i=0;i<4;i++){let point=ludoPoint(p,i);if(event?.type==='move'&&event.captured.some(c=>c.seat===p&&c.pawn===i)&&t<1){const global=E.ring(game,event.seat,event.to),prior=(global-E.quadrant(game,p)*13+52)%52,a=ludoPoint(p,i,prior),b=ludoPoint(p,i,-1),k=Math.max(0,(t-.72)/.28);point={x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k-Math.sin(k*Math.PI)*22}}if(event?.type==='move'&&event.seat===p&&event.pawn===i&&t<1){const travel=event.captured.length?Math.min(1,t/.72):t,span=event.from===-1?1:event.to-event.from,at=travel*span,from=event.from===-1?ludoPoint(p,i,-1):ludoPoint(p,i,event.from+Math.floor(at)),to=ludoPoint(p,i,event.from===-1?0:Math.min(event.to,event.from+Math.floor(at)+1)),f=at%1;point={x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f-Math.sin(f*Math.PI)*9}}const id=Math.round(point.x)+','+Math.round(point.y);if(!groups.has(id))groups.set(id,[]);groups.get(id).push({...point,p,i})}
  for(const group of [...groups.values()].sort((a,b)=>a[0].y-b[0].y))group.forEach((v,j)=>{const count=group.length,columns=Math.ceil(Math.sqrt(count)),r=count===1?24:count<=4?17:12,offset=count===1?{x:0,y:0}:{x:(j%columns-(columns-1)/2)*r*1.65,y:(Math.floor(j/columns)-(Math.ceil(count/columns)-1)/2)*r*1.5},x=v.x+offset.x,y=v.y+offset.y,legal=canPlay()&&v.p===game.turn&&E.legal(game).includes(v.i);token(x,y,r,color(v.p),fa(v.i+1),legal&&selected===v.i);points.push({x,y,r,groupX:v.x,groupY:v.y,seat:v.p,pawn:v.i})});
  if(selected!==null){const v=E.preview(game,selected);if(v){const p=ludoPoint(game.turn,selected,v.to);token(p.x,p.y,21,color(game.turn),'✓',true,true)}}
 }
 function snakeBody(from,to,index,pose=null){
  const c=curve(from,to,index),species=index%4,col=['#847044','#667344','#aa4934','#574a36'][species],samples=72;
  if(pose){const dx=pose.head.x-c.a.x,dy=pose.head.y-c.a.y;c.a={...pose.head};c.c={x:c.c.x+dx*.65,y:c.c.y+dy*.65};c.d={x:c.d.x+dx*.15,y:c.d.y+dy*.15}}
  const at=t=>{const p=curveAt(c,t),wave=pose?Math.sin(t*15-pose.time*18)*pose.wave*Math.sin(t*Math.PI):0;return{x:p.x+wave,y:p.y+wave*.4}};
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();for(let i=0;i<=samples;i++){const p=at(i/samples);if(i)ctx.lineTo(p.x+3,p.y+6);else ctx.moveTo(p.x+3,p.y+6)}ctx.strokeStyle='#173a4830';ctx.lineWidth=20;ctx.stroke();
  for(let i=samples-1;i>=0;i--){
   const a=at(i/samples),b=at((i+1)/samples),radius=1.2+8.8*Math.pow(1-i/samples,.65),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
   const paint=ctx.createLinearGradient(a.x-nx*radius,a.y-ny*radius,a.x+nx*radius,a.y+ny*radius);
   const skin=species===2?['#a94732','#23231f','#d4bd83','#23231f'][Math.floor(i/5)%4]:col;
   paint.addColorStop(0,mix(skin,'#151b16',.6));paint.addColorStop(.3,skin);paint.addColorStop(.48,mix(skin,'#f1dfad',.32));paint.addColorStop(.75,skin);paint.addColorStop(1,mix(skin,'#151b16',.55));
   ctx.strokeStyle=paint;ctx.lineWidth=radius*2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  // Natural saddles, mottling and fine scale seams, inspired by the reference.
  for(let i=5;i<66;i+=3){const a=at(i/samples),b=at((i+1)/samples),radius=1.2+8.8*Math.pow(1-i/samples,.65);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));
   if(species!==2){for(const side of [-1,1]){const y=side*radius*.38,w=2.5+Math.sin(i*1.7+side)*.9,h=radius*(.38+.1*Math.cos(i));ctx.beginPath();ctx.moveTo(-w,y-h*.3);ctx.bezierCurveTo(-w-1,y-h,w*.5,y-h,w,y-h*.2);ctx.bezierCurveTo(w+1,y+h*.8,-w*.4,y+h,-w,y-h*.3);ctx.fillStyle=species===1?'#273126':'#28251d';ctx.fill();ctx.strokeStyle=species===1?'#a1a16c':'#c4a96d';ctx.lineWidth=.65;ctx.stroke()}if(species===3&&i%2){ctx.beginPath();ctx.ellipse(1,0,2.4,radius*.42,.2,0,Math.PI*2);ctx.fillStyle='#b09a68';ctx.fill()}}
   ctx.strokeStyle='#f2e2b32e';ctx.lineWidth=.45;for(const side of [-1,1]){ctx.beginPath();ctx.arc(0,side*radius*.65,1.5,0,Math.PI);ctx.stroke()}ctx.restore()}
  // Head faces away from the body; eyes and forked tongue follow its direction.
  ctx.translate(c.a.x,c.a.y);ctx.rotate(pose?pose.angle:Math.atan2(c.a.y-c.c.y,c.a.x-c.c.x));
  ctx.strokeStyle='#663e39';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(20,0);ctx.moveTo(20,0);ctx.lineTo(23,-1.8);ctx.moveTo(20,0);ctx.lineTo(23,1.8);ctx.stroke();
  const head=ctx.createRadialGradient(-2,-4,1,1,0,18);head.addColorStop(0,mix(col,'#e4d4a3',.35));head.addColorStop(.5,col);head.addColorStop(1,mix(col,'#151c16',.65));
  ctx.shadowColor='#17231960';ctx.shadowBlur=3;ctx.shadowOffsetY=2;ctx.fillStyle=head;ctx.strokeStyle='#292c20';ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(-11,-5);ctx.bezierCurveTo(-8,-11,1,-10,9,-6);ctx.quadraticCurveTo(16,-4,16,0);ctx.quadraticCurveTo(16,4,9,6);ctx.bezierCurveTo(1,10,-8,11,-11,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowColor='transparent';
  for(const side of [-1,1]){ctx.save();ctx.scale(1,side);
   // Small lateral eyes and a closed jaw, without cartoon brows or exposed fangs.
   ctx.strokeStyle='#24291b';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-7,6);ctx.lineTo(4,5.7);ctx.stroke();circle(3,6,2,'#bfa057');ctx.fillStyle='#111b13';ctx.beginPath();ctx.ellipse(3.4,6,.65,1.65,0,0,Math.PI*2);ctx.fill();circle(3.6,5.5,.4,'#f1e7bd');
   ctx.strokeStyle=mix(col,'#172015',.6);ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(5,6.8);ctx.quadraticCurveTo(12,5,15,1.8);ctx.stroke();circle(12,2.5,.7,'#27301f');ctx.restore()}
  ctx.strokeStyle=mix(col,'#e2cf9c',.35);ctx.lineWidth=.6;for(const [x,y,w,h]of [[-6,0,5,5],[0,0,6,5],[6,0,4,3]]){ctx.beginPath();ctx.ellipse(x,y,w/2,h/2,0,0,Math.PI*2);ctx.stroke()}
  if(pose?.bite>0){const gape=1+pose.bite*6;ctx.fillStyle='#352c25';ctx.beginPath();ctx.moveTo(8,-gape);ctx.quadraticCurveTo(21,0,8,gape);ctx.closePath();ctx.fill();ctx.strokeStyle='#e9d9ab';ctx.lineWidth=1.1;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(11,side*gape*.7);ctx.lineTo(14,side*.8);ctx.stroke()}}ctx.restore();
 }
 function ladder(from,to){
  const p=snakePoint(from),q=snakePoint(to),dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(dy,dx));
  ctx.lineCap='round';ctx.strokeStyle='#163c4930';ctx.lineWidth=10;
  for(const y of [-10,10]){ctx.beginPath();ctx.moveTo(3,y+4);ctx.lineTo(len+3,y+4);ctx.stroke()}
  for(let x=14;x<len-7;x+=23){const paint=ctx.createLinearGradient(x-3,0,x+3,0);paint.addColorStop(0,'#9f6a35');paint.addColorStop(.4,'#ffe8a9');paint.addColorStop(1,'#b87e3d');roundRect(x-3,-10,6,20,2,paint)}
  for(const y of [-10,10]){const paint=ctx.createLinearGradient(0,y-4,0,y+4);paint.addColorStop(0,'#fff0b9');paint.addColorStop(.4,'#e4b86b');paint.addColorStop(1,'#9c6c38');roundRect(-3,y-4,len+6,8,4,paint);for(const x of [3,len-3])circle(x,y,1.7,'#805d36')}
  ctx.restore();
 }
 function snakeSurface(excluded=null){
  const key=look.board+':'+canvas.width+':'+excluded;
  if(excluded===null&&surface&&surfaceKey===key)return surface;
  if(excluded!==null&&encounterSurface&&encounterKey===key)return encounterSurface;
  const layer=document.createElement('canvas');layer.width=layer.height=canvas.width;surfaceBuilds++;
  const live=ctx;ctx=layer.getContext('2d');ctx.setTransform(canvas.width/750,0,0,canvas.width/750,0,0);
  try{
   roundRect(0,0,750,750,10,mix(look.board,'#25483f',.28));
   for(let n=1;n<=100;n++){
    const p=snakePoint(n),row=Math.floor((n-1)/10),col=(n-1)%10;
    const c=n===100?'#badbc2':(row+col)%2?mix(look.board,'#68a99d',.23):mix(look.board,'#fff0cd',.32);
    roundRect(p.x-36.5,p.y-35,73,72,5,mix(c,'#183c3d',.23));
    const paint=ctx.createLinearGradient(p.x-36,p.y-36,p.x+36,p.y+36);paint.addColorStop(0,mix(c,'#ffffff',.22));paint.addColorStop(1,c);
    roundRect(p.x-36.5,p.y-36.5,73,70,5,paint);
    ctx.strokeStyle='#ffffffa0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-31,p.y-35);ctx.lineTo(p.x+30,p.y-35);ctx.stroke();
   }
   for(const[a,b]of Object.entries(E.LADDERS))ladder(+a,b);
   Object.entries(E.SNAKES).forEach(([a,b],i)=>{if(+a!==excluded)snakeBody(+a,b,i)});
  }finally{ctx=live}
  if(excluded===null){surface=layer;surfaceKey=key}else{encounterSurface=layer;encounterKey=key}return layer;
 }
 const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
 const seatOffset=p=>game.players===4?[[-13,0],[13,0],[-13,18],[13,18]][p]:p===0?[-11,8]:[11,8];
 function snakeEncounter(now){
  const e=animation?.event;if(reduced||!e||e.type!=='roll'||e.portal!=='snake'||e.overshoot)return null;
  const t=Math.max(0,Math.min(1,(now-animation.start)/Math.max(1,animation.duration))),index=Object.keys(E.SNAKES).indexOf(String(e.landing)),c=curve(e.landing,e.to,index),offset=seatOffset(e.seat),restAngle=Math.atan2(c.a.y-c.c.y,c.a.x-c.c.x);
  let phase='walk',travel=0,pawn=null,head={...c.a},angle=restAngle,bite=0,wave=0;
  if(t>=.38){const grab=ease((t-.38)/.14);phase=t<.52?'bite':t<.84?'carry':'release';travel=t<.52?0:t<.84?ease((t-.52)/.32):1;const p=curveAt(c,travel),next=curveAt(c,Math.min(1,travel+.01)),prev=curveAt(c,Math.max(0,travel-.01)),heading=Math.atan2(next.y-prev.y,next.x-prev.x);pawn={x:p.x+offset[0],y:p.y+offset[1]};const target={x:pawn.x-Math.cos(heading)*14,y:pawn.y-Math.sin(heading)*14};
   head={x:c.a.x+(target.x-c.a.x)*grab,y:c.a.y+(target.y-c.a.y)*grab};angle=restAngle+Math.atan2(Math.sin(heading-restAngle),Math.cos(heading-restAngle))*grab;bite=phase==='bite'?Math.sin(grab*Math.PI):phase==='carry'?.25:0;wave=phase==='carry'?4:Math.sin(grab*Math.PI)*2;
   if(phase==='release'){const back=ease((t-.84)/.16);head={x:head.x+(c.a.x-head.x)*back,y:head.y+(c.a.y-head.y)*back};angle=heading+Math.atan2(Math.sin(restAngle-heading),Math.cos(restAngle-heading))*back;wave=Math.sin(back*Math.PI)*3}
  }
  return{phase,travel,pawn,head,angle,bite,wave,time:t,index,from:e.landing,to:e.to};
 }
 function drawSnakes(now){
  const effect=snakeEncounter(now);lastEffect=effect?{phase:effect.phase,travel:effect.travel,head:{...effect.head},pawn:effect.pawn?{...effect.pawn}:null,from:effect.from,to:effect.to}:null;
  ctx.drawImage(snakeSurface(effect?effect.from:null),0,0,750,750);
  if(effect)snakeBody(effect.from,effect.to,effect.index,effect.phase==='walk'?null:effect);
  const inspectedTo=E.LADDERS[inspection]||E.SNAKES[inspection];
  if(inspectedTo){const a=snakePoint(inspection),b=snakePoint(inspectedTo);ctx.save();ctx.strokeStyle='#155c9c';ctx.lineWidth=5;ctx.setLineDash([10,7]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);circle(b.x,b.y,31,'#e2f4ffb0');ctx.strokeStyle='#155c9c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(b.x,b.y,31,0,Math.PI*2);ctx.stroke();ctx.restore()}
  for(let n=1;n<=100;n++){
   const p=snakePoint(n);
   if(inspection===n||game.last?.type==='roll'&&(game.last.to===n||game.last.portal&&game.last.landing===n)){
    ctx.save();ctx.strokeStyle=inspection===n?'#1b66b5':color(game.last.seat);ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(p.x-33,p.y-33,66,66,7);ctx.stroke();ctx.restore();
   }
   // Numbers sit above the decorative models, not underneath a snake or rung.
   const w=n===100?43:34;
   roundRect(p.x-33,p.y-33,w,25,5,'#fffdf1ed');
   text(fa(n),p.x-33+w/2,p.y-20,22,'#29463e','bold');
  }
  const e=animation?.event,t=animation?Math.max(0,Math.min(1,(now-animation.start)/Math.max(1,animation.duration))):1;
  for(let p=0;p<game.players;p++){
   let point=snakePoint(game.positions[p]);
   if(e?.type==='roll'&&e.seat===p&&t<1&&!e.overshoot){const walkEnd=e.portal==='snake'?.38:.62;
    if(e.portal&&t>=walkEnd){const k=(t-walkEnd)/(1-walkEnd);if(e.portal==='snake')point=curveAt(curve(e.landing,e.to,Object.keys(E.SNAKES).indexOf(String(e.landing))),k);else{const a=snakePoint(e.landing),b=snakePoint(e.to);point={x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k}}}
    else{const k=e.portal?t/walkEnd:t,at=Math.min(e.face,k*e.face),a=snakePoint(Math.min(e.landing,e.from+Math.floor(at))),b=snakePoint(Math.min(e.landing,e.from+Math.floor(at)+1)),f=at%1;point={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f-Math.sin(f*Math.PI)*9}}
   }
   const atStart=game.positions[p]===0&&!(e?.seat===p&&t<1),offset=game.players===4&&atStart?[[-13,-16],[13,-16],[-13,4],[13,4]][p]:seatOffset(p),carried=effect&&e.seat===p?effect.pawn:null;
   token(carried?carried.x:point.x+offset[0],carried?carried.y:point.y+offset[1],game.players===4?12:17,color(p),fa(p+1),game.winner===p);
  }
  text('★',snakePoint(100).x+18,snakePoint(100).y+10,24,'#739d59');
 }
 return {points,targets,get stats(){return{surfaceBuilds,pixels:canvas.width,effect:lastEffect?JSON.parse(JSON.stringify(lastEffect)):null}},draw(now=performance.now()){const s=getState();game=s.game;look=s.look;animation=s.animation;selected=s.selected;interactive=s.interactive;inspection=s.inspection;draw(now);if(!reduced&&animation?.event.type==='roll'&&now<animation.start)window.TabletopArt.die(ctx,375,375,86,animation.event.face,Math.max(0,Math.min(1,(now-animation.start+420)/420)))}};
 }
 window.createDiceView=createDiceView;
})();
