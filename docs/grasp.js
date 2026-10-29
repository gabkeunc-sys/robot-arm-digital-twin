import * as T from './three.module.js';
// Evaluate a box in the gripper frame; all dimensions are metres.
export function graspInfo(tcp,rotation,position,boxRotation){
 const inv=rotation.clone().invert(),local=position.clone().sub(tcp).applyQuaternion(inv);
 const rel=inv.clone().multiply(boxRotation),m=new T.Matrix4().makeRotationFromQuaternion(rel).elements;
 const half=[0,1,2].map(i=>.11*(Math.abs(m[i])+Math.abs(m[i+4])+Math.abs(m[i+8])));
 const width=half[0]*2,down=new T.Vector3(0,0,1).applyQuaternion(rotation);
 let reason='';
 if(down.y>-.9)reason='그리퍼가 아래를 향하도록 자세를 맞추세요.';
 else if(width>.325)reason='상자 폭이 최대 파지 폭을 넘습니다.';
 else if(Math.abs(local.z)>Math.min(.085,half[2]-.025))reason='높이가 맞지 않습니다. 상자를 클릭하거나 상자에 맞추기를 누르세요.';
 else if(Math.abs(local.y)>.08)reason='상자가 손가락 앞뒤로 벗어났습니다. 상자 중심에 맞추세요.';
 else if(Math.abs(local.x)>Math.min(.07,(.38-width)/2-.005))reason='상자가 두 손가락 사이 중심에서 벗어났습니다.';
 return {ok:!reason,reason,width,local};
}
