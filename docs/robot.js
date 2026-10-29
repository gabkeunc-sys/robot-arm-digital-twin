import * as T from './three.module.js';
export const L1=.95,L2=.85,TOOL=.34,SHOULDER=new T.Vector3(0,.52,0);
export const limits=[[-180,180],[-35,155],[-155,5],[-180,180],[-120,120],[-180,180]];
export const names=['베이스 회전','어깨','팔꿈치','손목 롤','손목 피치','툴 회전'];
const axis=[new T.Vector3(1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,0,1)];
const q=(i,a)=>new T.Quaternion().setFromAxisAngle(axis[i],a);
export function forward(a){const [yaw,s,e,rx,ry,rz]=a;const elbow=new T.Vector3(Math.cos(yaw)*L1*Math.cos(s),.52+L1*Math.sin(s),Math.sin(yaw)*L1*Math.cos(s));const wrist=elbow.clone().add(new T.Vector3(Math.cos(yaw)*L2*Math.cos(s+e),L2*Math.sin(s+e),Math.sin(yaw)*L2*Math.cos(s+e)));const fore=q(1,-yaw).multiply(q(2,s+e));const rotation=fore.clone().multiply(q(0,rx)).multiply(q(1,ry)).multiply(q(2,rz));return {elbow,wrist,fore,rotation,tcp:wrist.clone().add(new T.Vector3(0,0,TOOL).applyQuaternion(rotation))}}
export function inverse(tcp,rotation){const w=tcp.clone().sub(new T.Vector3(0,0,TOOL).applyQuaternion(rotation)),d=w.sub(SHOULDER),len=d.length(),r=Math.hypot(d.x,d.z);if(len>L1+L2-.005||len<Math.abs(L1-L2)+.005)return null;const e=-Math.acos(T.MathUtils.clamp((len*len-L1*L1-L2*L2)/(2*L1*L2),-1,1));const s=Math.atan2(d.y,r)-Math.atan2(L2*Math.sin(e),L1+L2*Math.cos(e)),yaw=Math.atan2(d.z,d.x);const local=q(1,-yaw).multiply(q(2,s+e)).invert().multiply(rotation);const wristEuler=new T.Euler().setFromQuaternion(local,'XYZ');const a=[yaw,s,e,wristEuler.x,wristEuler.y,wristEuler.z];return a.every((v,i)=>v>=limits[i][0]*Math.PI/180-1e-6&&v<=limits[i][1]*Math.PI/180+1e-6)?a:null}
export function makeRobot(scene){
const root=new T.Group();scene.add(root);const M=c=>new T.MeshStandardMaterial({color:c,metalness:.55,roughness:.28});const white=M('#dde5ea'),blue=M('#1696bc'),dark=M('#223244'),steel=M('#8a9eaf'),rubber=M('#0c1721'),gold=M('#f4bc57');
function part(g,m,p,parent=root){const o=new T.Mesh(g,m);o.position.copy(p);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),cyl=(r,h)=>new T.CylinderGeometry(r,r,h,24),box=(x,y,z)=>new T.BoxGeometry(x,y,z);
part(cyl(.34,.10),dark,v(0,.05,0));part(cyl(.27,.16),steel,v(0,.16,0));part(cyl(.22,.19),white,v(0,.31,0));
for(let i=0;i<8;i++){let t=i*Math.PI/4;part(cyl(.022,.018),gold,v(.29*Math.cos(t),.11,.29*Math.sin(t)))}
const pedestal=new T.Group();root.add(pedestal);part(box(.32,.23,.30),blue,v(0,.44,0),pedestal);
function arm(length,width){const g=new T.Group();root.add(g);part(box(length-.12,width,width*.82),white,v(length/2,0,0),g);part(box(length-.23,width*.56,.018),blue,v(length/2,0,width*.43),g);part(box(length-.23,width*.56,.018),blue,v(length/2,0,-width*.43),g);for(const x of [.1,length-.1]){const cap=part(cyl(width*.65,width*1.02),dark,v(x,0,0),g);cap.rotation.x=Math.PI/2;const ring=part(cyl(width*.43,width*1.1),steel,v(x,0,0),g);ring.rotation.x=Math.PI/2}return g}
const upper=arm(L1,.23),lower=arm(L2,.18);const wristRoot=new T.Group();root.add(wristRoot);const w4=new T.Group(),w5=new T.Group(),w6=new T.Group();wristRoot.add(w4);w4.add(w5);w5.add(w6);
function ring(radius,material,parent,rotation){const o=part(new T.TorusGeometry(radius,.024,8,24),material,v(),parent);o.rotation.set(...rotation);return o}
ring(.145,blue,wristRoot,[0,Math.PI/2,0]);ring(.115,white,w4,[Math.PI/2,0,0]);ring(.087,gold,w5,[0,0,0]);part(new T.SphereGeometry(.065,12,8),dark,v(),w6);
const flange=part(cyl(.092,.065),steel,v(0,0,.065),w6);flange.rotation.x=Math.PI/2;
part(box(.32,.14,.105),dark,v(0,0,.14),w6);part(box(.24,.145,.025),blue,v(0,0,.09),w6);part(box(.29,.035,.035),steel,v(0,0,.20),w6);
const fingers=[-1,1].map(sign=>{const g=new T.Group();w6.add(g);part(box(.045,.11,.19),steel,v(0,0,.29),g);part(box(.03,.115,.085),rubber,v(-sign*.03,0,.34),g);part(box(.075,.13,.05),white,v(0,0,.205),g);return g});
const tip=new T.AxesHelper(.16);tip.position.z=TOOL;w6.add(tip);
const cable=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:0x151d29}));root.add(cable);
let opening=.38;
return {root,update(a,closed,held,dt){const f=forward(a);pedestal.rotation.y=-a[0];upper.position.copy(SHOULDER);upper.quaternion.copy(q(1,-a[0]).multiply(q(2,a[1])));lower.position.copy(f.elbow);lower.quaternion.copy(f.fore);wristRoot.position.copy(f.wrist);wristRoot.quaternion.copy(f.fore);w4.rotation.x=a[3];w5.rotation.y=a[4];w6.rotation.z=a[5];const goal=closed?(held?.22:.018):.38;opening+=(goal-opening)*Math.min(1,dt*12);fingers.forEach((o,i)=>o.position.x=(i?1:-1)*(opening/2+.045));const points=[SHOULDER.clone().add(v(0,0,.17)),f.elbow.clone().add(v(0,.16,.13)),f.wrist.clone().add(v(0,.10,.12))];const curve=new T.CatmullRomCurve3(points);cable.geometry.dispose();cable.geometry=new T.BufferGeometry().setFromPoints(curve.getPoints(20));return {...f,opening};}}}
