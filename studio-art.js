/* Deterministic, event-driven material details; no animation loop or random noise. */
(()=>{'use strict';
 function grain(ctx,x,y,w,h,round=false){ctx.save();ctx.beginPath();if(round)ctx.arc(x+w/2,y+h/2,w/2,0,Math.PI*2);else ctx.roundRect(x,y,w,h,8);ctx.clip();ctx.lineWidth=.65;for(let i=0;i<28;i++){const yy=y+(i+.5)*h/28;ctx.strokeStyle=i%3?'#182d4910':'#ffffff28';ctx.beginPath();ctx.moveTo(x,yy);ctx.bezierCurveTo(x+w*.28,yy+Math.sin(i*1.9)*3,x+w*.7,yy-2,x+w,yy+Math.cos(i)*2);ctx.stroke()}ctx.restore()}
 function bevel(ctx,x,y,w,h,r=5){ctx.save();const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#ffffff75');g.addColorStop(.5,'#ffffff10');g.addColorStop(1,'#102a4029');ctx.strokeStyle=g;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x+1,y+1,w-2,h-2,r);ctx.stroke();ctx.restore()}
 function glint(ctx,x,y,r){ctx.save();ctx.strokeStyle='#ffffff8a';ctx.lineWidth=Math.max(.8,r*.08);ctx.lineCap='round';ctx.beginPath();ctx.ellipse(x-r*.12,y-r*.18,r*.7,r*.44,-.2,3.5,5.6);ctx.stroke();ctx.restore()}
 globalThis.StudioArt={grain,bevel,glint};
})();
