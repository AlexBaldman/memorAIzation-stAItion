/** Optional Three.js visualization adapter. Deterministic roll results come from RollKit. */
// Loaded on demand only; the core lab and 2D dice remain offline-capable.
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
export async function mountDiceThree(host,{skin='neon'}={}) {
  const THREE = await import(/* @vite-ignore */ CDN);
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(38,1,.1,100);
  camera.position.set(0,3.6,8.6);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  renderer.domElement.setAttribute('aria-label','Three dimensional view of two 10-sided dice; numeric result also available in text');
  renderer.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff,0x1c1938,2.1));
  const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(-3,6,8);scene.add(light);
  const reusable=[];
  const up=new THREE.Vector3(0,1,0),bottom=new THREE.Vector3(0,-1,0),cos=Math.cos(Math.PI/5),a=.115,h=a*(1+cos)/(1-cos);
  const U=[],L=[];
  for(let i=0;i<5;i++){let theta=i*2*Math.PI/5;U.push(new THREE.Vector3(Math.cos(theta),a,Math.sin(theta)));theta+=Math.PI/5;L.push(new THREE.Vector3(Math.cos(theta),-a,Math.sin(theta)));}
  const faceVerts=[];
  for(let i=0;i<5;i++)faceVerts.push([new THREE.Vector3(0,h,0),U[i],L[i],U[(i+1)%5]]);
  for(let i=0;i<5;i++)faceVerts.push([new THREE.Vector3(0,-h,0),L[i],U[(i+1)%5],L[(i+1)%5]]);
  const normalFor=points=>{
    const v=new THREE.Vector3().subVectors(points[1],points[0]);const w=new THREE.Vector3().subVectors(points[2],points[0]);
    const n=new THREE.Vector3().crossVectors(v,w).normalize();const center=points.reduce((p,v)=>p.add(v),new THREE.Vector3()).multiplyScalar(.25);
    if(n.dot(center)<0)n.negate();return {normal:n,center};
  };
  const normals=faceVerts.map(x=>normalFor(x).normal);
  const makeFace=(group,vertices,label,color)=>{
    const {normal,center}=normalFor(vertices);
    const geometry=new THREE.BufferGeometry();const tri=[0,1,2,0,2,3];const positions=[];
    for(const i of tri)positions.push(...vertices[i].toArray());
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({color,metalness:.38,roughness:.3,side:THREE.DoubleSide,flatShading:true});
    const face=new THREE.Mesh(geometry,material);group.add(face);reusable.push(geometry,material);
    const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');
    ctx.clearRect(0,0,256,256);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 180px system-ui';ctx.lineWidth=7;ctx.strokeStyle='#1c2235';ctx.strokeText(String(label),128,124);ctx.fillStyle='#ffffff';ctx.fillText(String(label),128,124);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    const textMat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});const quad=new THREE.PlaneGeometry(.46,.46);
    const textMesh=new THREE.Mesh(quad,textMat);textMesh.position.copy(center).addScaledVector(normal,.025);
    textMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);group.add(textMesh);reusable.push(texture,textMat,quad);
  };
  const dice=[];
  for(let d=0;d<2;d++){
    const group=new THREE.Group();group.position.x=d===0?-1.28:1.28;scene.add(group);
    for(let f=0;f<10;f++)makeFace(group,faceVerts[f],f, d===0?'#e068ae':'#40cfe6');
    dice.push(group);
  }
  const camDir=camera.position.clone().normalize();let targets=[0,0];let t=0;let animationId=0;let destroyed=false;
  const palettes={neon:['#e068ae','#40cfe6'],phosphor:['#9aed71','#55bf7c'],ember:['#ef7f64','#ffc36e'],ice:['#8aaeff','#6de4fc']};
  // Each die's 10 face meshes follow insertion order, interleaved with digit planes.
  function setSkin(name){const palette=palettes[name]??palettes.neon;for(let d=0;d<2;d++)for(let i=0;i<10;i++)dice[d].children[2*i].material.color.set(palette[d]);}
  function setDigits(tens,ones){for(const n of [tens,ones])if(!Number.isInteger(n)||n<0||n>9)throw new RangeError('3D face must be 0..9');
    targets=[tens,ones];t=performance.now();
  }
  function frame(now){if(destroyed)return;const since=now-t;const turn=Math.min(1,since/890);const ease=turn*turn*(3-2*turn);
    for(let i=0;i<2;i++){
      const die=dice[i];const desired=new THREE.Quaternion().setFromUnitVectors(normals[targets[i]],camDir);
      if(since<890){const extra=new THREE.Quaternion().setFromEuler(new THREE.Euler((1-ease)*Math.PI*4,(1-ease)*Math.PI*3,0));die.quaternion.copy(desired).multiply(extra);}else die.quaternion.copy(desired);
      die.position.y=since<890?Math.sin(turn*Math.PI)*.29:0;
    }
    renderer.render(scene,camera);animationId=requestAnimationFrame(frame);
  }
  function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(Math.max(w,1),Math.max(h,1),false);camera.aspect=Math.max(w,1)/Math.max(h,1);camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();setSkin(skin);setDigits(0,0);animationId=requestAnimationFrame(frame);
  return {setDigits,setSkin,dispose(){destroyed=true;cancelAnimationFrame(animationId);observer.disconnect();renderer.domElement.remove();for(const item of reusable)item.dispose();renderer.dispose();}};
}