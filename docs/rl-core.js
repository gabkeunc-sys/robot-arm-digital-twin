// Browser-local DQN: 3 relative-position observations, 32 tanh units, 6 actions.
export const bounds=[[.45,1.15],[.32,1.0],[-.45,.45]],step=.045;
export function move(p,a){return p.map((v,i)=>Math.max(bounds[i][0],Math.min(bounds[i][1],v+(Math.floor(a/2)===i?(a%2?-step:step):0))))}
export const obs=(p,g)=>g.map((v,i)=>(v-p[i])*2);
export const distance=(p,g)=>Math.hypot(...p.map((v,i)=>v-g[i]));
export class Net{
 constructor(r=Math.random){this.w=Array.from({length:32},()=>Array.from({length:3},()=> (r()-.5)*.8));this.b=Array(32).fill(0);this.v=Array.from({length:6},()=>Array.from({length:32},()=> (r()-.5)*.3));this.c=Array(6).fill(0)}
 q(x){const h=this.w.map((w,j)=>Math.tanh(w.reduce((s,v,i)=>s+v*x[i],this.b[j])));return {h,q:this.v.map((w,a)=>w.reduce((s,v,j)=>s+v*h[j],this.c[a]))}}
 action(x){const q=this.q(x).q;return q.indexOf(Math.max(...q))}
 fit(x,a,y){const {h,q}=this.q(x),e=Math.max(-1,Math.min(1,q[a]-y)),old=[...this.v[a]],lr=.002;for(let j=0;j<32;j++){this.v[a][j]-=lr*e*h[j];const d=e*old[j]*(1-h[j]*h[j]);for(let i=0;i<3;i++)this.w[j][i]-=lr*d*x[i];this.b[j]-=lr*d}this.c[a]-=lr*e}
 json(){return {w:this.w,b:this.b,v:this.v,c:this.c}}
 load(o){for(const [k,rows,cols] of [['w',32,3],['v',6,32]])if(!Array.isArray(o[k])||o[k].length!==rows||o[k].some(r=>!Array.isArray(r)||r.length!==cols||r.some(v=>!Number.isFinite(v))))throw Error('잘못된 가중치');if(!Array.isArray(o.b)||o.b.length!==32||!Array.isArray(o.c)||o.c.length!==6||[...o.b,...o.c].some(v=>!Number.isFinite(v)))throw Error('잘못된 바이어스');for(const k of ['w','b','v','c'])this[k]=structuredClone(o[k]);return this}
}
export function rng(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}}
export function sample(r){return bounds.map(([a,b])=>a+(b-a)*r())}
export function evaluate(net){const r=rng(9841);let wins=0;for(let n=0;n<100;n++){let p=sample(r),g=sample(r);for(let t=0;t<80;t++){if(distance(p,g)<.06){wins++;break}p=move(p,net.action(obs(p,g)))}}return wins}
