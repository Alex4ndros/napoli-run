import * as THREE from './vendor/three.module.js';

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const lanes = [-3, 0, 3], PLAYER_Z = 4;
const districts = [
  {name:'Via Toledo',desc:'La precedenza? A chi tiene più fame.',colors:[0xf8c67e,0xe7a38d,0xffdba3,0xf2b166]},
  {name:'Quartieri Spagnoli',desc:'Diego ci guarda. La nonna pure.',colors:[0xe88764,0xf4ca77,0xcf8c76,0xe7ae66]},
  {name:'Lungomare Caracciolo',desc:'O mare, o sole… o motorino!',colors:[0xf8e0b3,0xf3c48b,0xffe9c6,0xeeb5a0]},
  {name:'Spaccanapoli',desc:'Una sfogliatella e passa la paura.',colors:[0xdbad7f,0xe9bc82,0xe1a192,0xf0cd9e]}
];
const powerDefs = {
  pizza:{name:'SUPER PIZZA',icon:'🍕',color:0xffc849,duration:4,line:'PIZZA SCUDO! NUN ME TUCCÀ!'},
  maradona:{name:'MARADONA MODE',icon:'⚽',color:0x3cd5ef,duration:3,line:'LA MANO? NO, IL PIEDE DE DIOS!'},
  espresso:{name:'ESPRESSO BOOST',icon:'☕',color:0xeb7952,duration:3.5,line:'NA TAZZULELLA… E SI VOLA!'},
  magnet:{name:'CORNICELLO MAGNET',icon:'🌶️',color:0xef4b4d,duration:5,line:'MALOCCHIO VIA. PIZZE A ME!'}
};
let best = 0; try { best = Number(localStorage.getItem('napoli-run-best-v1')) || 0; } catch {}
$('bestMenu').textContent = best.toLocaleString('it-IT');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});
} catch (e) { $('error').classList.remove('hidden'); throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9dddec); scene.fog = new THREE.Fog(0xb0dfe5,80,210);
const camera = new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,270);
scene.add(new THREE.HemisphereLight(0xd8f8ff,0xbf9671,1.8));
const sun = new THREE.DirectionalLight(0xffecc3,2.8);sun.position.set(-28,46,24);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-17;sun.shadow.camera.right=17;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.camera.far=100;sun.shadow.bias=-.001;scene.add(sun);sun.target.position.set(0,0,-12);scene.add(sun.target);
const mats = new Map();
function material(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));return mats.get(color);}
const boxGeo = new THREE.BoxGeometry(1,1,1), sphereGeo = new THREE.SphereGeometry(1,12,9), cylinderGeo = new THREE.CylinderGeometry(1,1,1,12), coneGeo = new THREE.ConeGeometry(1,1,12);
function mesh(geo,color,x,y,z,sx=1,sy=sx,sz=sx,parent=scene){const o=new THREE.Mesh(geo,material(color));o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
function box(p,c,x,y,z,w,h,d){return mesh(boxGeo,c,x,y,z,w,h,d,p);}
function ball(p,c,x,y,z,r,sY=1,sZ=1){return mesh(sphereGeo,c,x,y,z,r,r*sY,r*sZ,p);}
function cyl(p,c,x,y,z,r,h){return mesh(cylinderGeo,c,x,y,z,r,h,r,p);}
function group(parent=scene){const g=new THREE.Group();parent.add(g);return g;}
function limb(parent,c,x,y,z,w,h,d){const g=group(parent);g.position.set(x,y,z);box(g,c,0,-h/2,0,w,h,d);return g;}
function shadow(p,rx,rz){const m=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x183744,transparent:true,opacity:.18,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.035;m.scale.set(rx,rz,1);p.add(m);return m;}
const textureCache=new Map();
function textTexture(text,bg='#fff0cd',fg='#073a4a',small=''){
  const key=text+bg+fg+small;if(textureCache.has(key))return textureCache.get(key);
  const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,192);ctx.strokeStyle=fg;ctx.lineWidth=6;ctx.strokeRect(8,8,496,176);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${text.length<=3?140:text.length>22?26:text.length>16?32:45}px Arial`;ctx.fillText(text,256,small?76:96,475);if(small){ctx.font='bold 18px Arial';ctx.fillText(small,256,133,470);}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textureCache.set(key,tex);return tex;
}
function sign(p,text,x,y,z,w=3,h=1,bg,fg,small,rot=0){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:textTexture(text,bg,fg,small)}));m.position.set(x,y,z);m.rotation.y=rot;p.add(m);return m;}
function pizza(p,x,y,z,r=.6){const g=group(p);g.position.set(x,y,z);const crust=cyl(g,0xd58b38,0,0,0,r,.13);cyl(g,0xf9cf68,0,.08,0,r*.88,.055);for(let i=0;i<5;i++){const a=i*2.4;ball(g,0xe55336,Math.cos(a)*r*.5,.13,Math.sin(a)*r*.5,r*.17,.35);}for(let i=0;i<3;i++){const a=i*2;ball(g,0x398d5d,Math.cos(a)*r*.35,.14,Math.sin(a)*r*.35,r*.1,.25);}return g;}
function slice(p){const g=group(p);const shape=new THREE.Shape();shape.moveTo(-.42,.38);shape.lineTo(.42,.38);shape.lineTo(0,-.5);shape.closePath();const m=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:1,steps:1}),material(0xffcd46));g.add(m);const crust=box(g,0xdc8932,0,.38,.055,.9,.15,.17);crust.rotation.z=-.015;ball(g,0xed5938,-.14,.17,.15,.1,1,.4);ball(g,0xed5938,.13,.06,.15,.09,1,.4);ball(g,0x35965f,0,-.2,.15,.06,1,.3);return g;}
function face(g,y,z,scale=1,nonna=false){const skin=nonna?0xe8b48d:0xeeb687;ball(g,skin,0,y,z,.34*scale,1.1,.93);ball(g,0xd9946a,0,y-.03*scale,z+.3*scale,.09*scale,.8,1.15);for(const x of [-.13,.13]){ball(g,0xfffcf0,x*scale,y+.07*scale,z+.285*scale,.065*scale,.9,.5);ball(g,0x17343d,x*scale,y+.07*scale,z+.32*scale,.027*scale);}const smile=new THREE.Mesh(new THREE.TorusGeometry(.12*scale,.023*scale,5,12,Math.PI),material(0x713a2e));smile.rotation.z=Math.PI;smile.position.set(0,y-.08*scale,z+.3*scale);g.add(smile);if(nonna){ball(g,0xe5e5de,0,y+.28*scale,z-.02*scale,.3*scale,.6);ball(g,0xdadbd6,0,y+.4*scale,z-.15*scale,.15*scale);for(const x of [-.13,.13]){const glass=new THREE.Mesh(new THREE.TorusGeometry(.08*scale,.016*scale,5,12),material(0x313d43));glass.position.set(x*scale,y+.065*scale,z+.34*scale);g.add(glass);}}else{ball(g,0x493b32,0,y+.27*scale,z-.035*scale,.33*scale,.45,.93);}}
function human(p,color=0x12a9c7,nonna=false){const g=group(p);box(g,color,0,1.2,0,.63,.75,.45);face(g,1.95,0,1,nonna);limb(g,0x34455c,-.18,.85,0,.23,.7,.25);limb(g,0x34455c,.18,.85,0,.23,.7,.25);const a=limb(g,0xeeb687,-.43,1.5,0,.2,.6,.22);const b=limb(g,0xeeb687,.43,1.5,0,.2,.6,.22);a.rotation.z=-.4;b.rotation.z=.4;return g;}
function scooter(p,variant=0){const g=group(p);const colors=[0xef6d4e,0x4bb8b4,0xf7c946,0x6cbad3,0xf4eee0,0xa5a2d6,0x74b46e,0xdc827a];const c=colors[variant%8];shadow(g,.9,1.65);
  const wheels=[];for(const z of [-.85,.85]){const wg=group(g);wg.position.set(0,.43,z);const wheel=cyl(wg,0x24313b,0,0,0,.36,.21);wheel.rotation.z=Math.PI/2;const hub=cyl(wg,0xe4e8df,.12,0,0,.18,.04);hub.rotation.z=Math.PI/2;for(let n=0;n<3;n++){const spoke=box(wg,0x7b9298,.15,0,0,.025,.035,.5);spoke.rotation.x=n*Math.PI/3;}wheels.push(wg);}g.userData.wheels=wheels;
  box(g,c,0,.65,-.35,.8,.5,1.35);ball(g,c,0,.9,.65,.48,1.2,.55);box(g,c,0,1.16,.67,.66,.85,.2);box(g,0x4a4940,0,1,-.35,.65,.17,.76);box(g,0xbac5c6,0,1.6,.69,1,.08,.09);for(const x of [-.52,.52]){cyl(g,0x4b4c49,x,1.63,.69,.065,.2);const mirror=cyl(g,0x4a595a,x,1.85,.66,.02,.42);ball(g,0xb7e8ee,x,2.08,.66,.12,.75,.3);}ball(g,0xfff5bd,0,1.3,.8,.19,.75,.35);ball(g,0xfbc850,0,1.42,.73,.16,.65,.3);
  const rider=group(g);const belly=variant===0||variant===5;const nonna=variant===2;
  ball(rider,nonna?0x9b77a3:variant===5?0x009fc5:0xf3e8c5,0,1.6,-.25,belly?.57:.4,1.15,.95);face(rider,2.4,-.17,belly?1.15:1,nonna);box(rider,0x304f6d,-.37,1.13,-.14,.2,.5,.3);box(rider,0x304f6d,.37,1.13,-.14,.2,.5,.3);for(const x of [-.4,.4]){const arm=box(rider,0xeeb687,x,1.9,.2,.2,.18,.72);arm.rotation.y=x>0?-.15:.15;}
  if(variant===0){const pie=pizza(rider,.7,2.08,.1,.62);pie.rotation.z=-.25;}
  if(variant===1){const fritta=ball(rider,0xda9748,.65,2.22,.12,.4,1.3,.5);fritta.rotation.z=.4;}
  if(variant===2){for(const x of [-.75,.75]){box(rider,0xedc779,x,1.1,-.3,.4,.6,.4);const handle=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,5,10),material(0x825d42));handle.position.set(x,1.46,-.3);rider.add(handle);}}
  if(variant===3){mesh(coneGeo,0xdf9c52,.62,2.1,.1,.15,.36,.15,rider).rotation.z=Math.PI;ball(rider,0xf7ccd7,.62,2.36,.1,.2);ball(rider,0xf6e4a3,.62,2.58,.1,.17);}
  if(variant===4){for(let i=0;i<6;i++){const bx=box(rider,i%2?0xf5eee0:0xe3c59b,Math.sin(i)*.05,1.35+i*.18,-.95,.95,.16,.85);box(rider,0xe85942,.49,1.35+i*.18,-.95,.02,.05,.4);}sign(rider,'PIZZA',0,2.42,-.48,.8,.3,'#f7dbab','#d84432');}
  if(variant===5){sign(rider,'N',0,1.7,.26,.36,.35,'#009fc5','#ffffff');for(const x of [-.16,.16])box(rider,0x1c2e37,x,2.49,.17,.25,.13,.055);}
  if(variant===6){face(rider,2.58,-.76,.82);box(rider,0xf2a340,0,1.9,-.78,.5,.6,.4);face(rider,2.36,-1.12,.7);}
  if(variant===7){const hand=limb(rider,0xeeb687,.48,2.3,-.15,.16,.5,.16);hand.rotation.z=-1.6;box(rider,0x293f4b,.37,2.42,-.12,.13,.3,.07);}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.userData.rider=rider;g.userData.variant=variant;return g;
}

const runner=group();runner.position.set(0,0,PLAYER_Z);const runnerShadow=shadow(runner,.6,.43);const body=group(runner);body.rotation.y=Math.PI;
box(body,0x059fca,0,1.25,0,.64,.79,.42);box(body,0xf2eee0,0,1.67,0,.62,.1,.44);sign(body,'N',0,1.28,.219,.34,.34,'#059fca','#ffffff');sign(body,'10',0,1.28,-.219,.44,.44,'#059fca','#ffffff','',Math.PI);
const legs=[limb(body,0x174b70,-.19,.89,0,.25,.63,.29),limb(body,0x174b70,.19,.89,0,.25,.63,.29)];for(const l of legs){box(l,0xeeb687,0,-.69,0,.19,.2,.22);box(l,0xf9f0dd,0,-.81,.09,.29,.18,.48);box(l,0xf2744e,0,-.83,.2,.3,.08,.25);}
const arms=[limb(body,0xeeb687,-.43,1.55,0,.2,.65,.23),limb(body,0xeeb687,.43,1.55,0,.2,.65,.23)];for(const a of arms){box(a,0x059fca,0,-.12,0,.25,.27,.27);ball(a,0xeeb687,0,-.69,0,.12);}
face(body,2.06,0,1.06);const cap=ball(body,0xe85c3c,0,2.36,0,.38,.44,.98);box(body,0xe85c3c,0,2.34,.31,.46,.08,.4);box(body,0x46382d,0,2.26,.3,.44,.15,.08);
runner.traverse(o=>{if(o.isMesh)o.castShadow=true;});runnerShadow.castShadow=false;
const shield = new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:0xffce56,wireframe:true,transparent:true,opacity:.26}));shield.scale.set(1.18,1.6,1.18);shield.position.y=1.2;runner.add(shield);shield.visible=false;
const auraPizza=pizza(runner,0,1.1,0,1.1);auraPizza.visible=false;
const football=ball(runner,0xfff5de,.58,.35,-1,.32);for(let i=0;i<6;i++){const p=ball(football,0x183844,Math.sin(i*2)*.85,Math.cos(i*2)*.8,.5,.22,.7,.3);}football.visible=false;

function groundTexture(dark=false){const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=dark?'#5c6260':'#9e9f92';ctx.fillRect(0,0,256,512);for(let y=0;y<512;y+=32)for(let x=-24;x<256;x+=49){const ox=(y/32)%2?24:0;ctx.fillStyle=dark?((x+y)%3?'#81847b':'#757b77'):((x+y)%3?'#b5b3a1':'#aaa998');ctx.fillRect(x+ox+1,y+1,46,29);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t;}
const roadMat=new THREE.MeshStandardMaterial({map:groundTexture(),roughness:1});
const historicRoadMat=new THREE.MeshStandardMaterial({map:groundTexture(true),roughness:1});
function historicStoneTexture(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#827d70';x.fillRect(0,0,256,256);for(let y=0;y<256;y+=32)for(let n=-1;n<5;n++){x.fillStyle=['#c5b99f','#b6ac94','#cbbda4','#bfb299'][(n+y/32+5)%4];x.fillRect(n*64+(y%64?32:0)+2,y+2,60,28);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,3);return t;}
const historicStoneMat=new THREE.MeshStandardMaterial({map:historicStoneTexture(),roughness:1});
const skyGroup=group();
const mountainProfile=[new THREE.Vector2(0,0),new THREE.Vector2(28,0),new THREE.Vector2(23,5),new THREE.Vector2(11,14),new THREE.Vector2(7,17),new THREE.Vector2(4,15.5),new THREE.Vector2(0,15.2)];const volcano=mesh(new THREE.LatheGeometry(mountainProfile,20),0x6e94aa,31,-.7,-150,1,1,.68,skyGroup);mesh(coneGeo,0x879ead,13,5,-155,16,13,11,skyGroup);
for(let i=0;i<8;i++){const c=group(skyGroup);c.position.set(-70+i*22,27+(i%3)*6,-100-i%2*30);for(let j=0;j<3;j++)ball(c,0xffffff,j*3,Math.sin(j)*.7,0,3.2, .6,1);}
const sea=box(scene,0x23afc9,55,-.3,-85,100,.2,240);sea.visible=false;
function palm(p,x,z){const g=group(p);g.position.set(x,0,z);cyl(g,0xa8895d,0,3.35,0,.17,6.7);for(let n=0;n<9;n++){cyl(g,n%2?0xb69a71:0x94794e,0,.8+n*.65,0,.19,.06);}ball(g,0x776d3e,0,6.6,0,.32,.8);for(let n=0;n<9;n++){const a=n*Math.PI*2/9;const pos=[],norm=[],uv=[];const pts=[];for(let k=0;k<6;k++){const f=k/5,len=f*2.6,width=Math.sin(f*Math.PI)*.38;const y=6.7+Math.sin(f*Math.PI)*.65-f*f*.9;pts.push([Math.sin(a)*len+Math.cos(a)*width,y,Math.cos(a)*len-Math.sin(a)*width],[Math.sin(a)*len-Math.cos(a)*width,y,Math.cos(a)*len+Math.sin(a)*width]);}for(let k=0;k<5;k++)for(const ix of [k*2,k*2+1,k*2+2,k*2+1,k*2+3,k*2+2]){pos.push(...pts[ix]);uv.push(ix%2,Math.floor(ix/2)/5);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const mat=material(n%2?0x2d8e5e:0x459c69);mat.side=THREE.DoubleSide;g.add(new THREE.Mesh(geo,mat));}return g;}
function napoliFlagTexture(){const c=document.createElement('canvas');c.width=384;c.height=256;const x=c.getContext('2d');x.fillStyle='#079fda';x.fillRect(0,0,384,256);x.fillStyle='#0875b9';x.beginPath();x.arc(192,128,88,0,Math.PI*2);x.fill();x.strokeStyle='#ffffff';x.lineWidth=7;x.stroke();x.fillStyle='#ffffff';x.font='italic bold 146px Georgia';x.textAlign='center';x.textBaseline='middle';x.fillText('N',190,135);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const napoliFlagMat=new THREE.MeshBasicMaterial({map:napoliFlagTexture(),side:THREE.DoubleSide});
function flag(p,x,y,z,napoli=false){const g=group(p);g.position.set(x,y,z);box(g,0x6d6a54,0,0,0,.035,1.4,.035);if(napoli){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.75,4,1),napoliFlagMat);m.position.set(.56,.3,0);const pos=m.geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getX(i)*6)*.055);m.geometry.computeVertexNormals();g.add(m);}else{box(g,0x239563,.15,.3,0,.28,.55,.025);box(g,0xfff5e5,.43,.3,0,.28,.55,.025);box(g,0xe75d4b,.71,.3,0,.28,.55,.025);}return g;}
function muralTexture(){const c=document.createElement('canvas');c.width=384;c.height=512;const x=c.getContext('2d');x.fillStyle='#087ba9';x.fillRect(0,0,384,512);for(let i=0;i<24;i++){x.fillStyle=i%2?'#1296bf':'#1989b0';x.fillRect((i*71)%384,0,9,512);}x.fillStyle='#f7e9bc';x.font='900 46px Arial';x.textAlign='center';x.fillText('DIEGO',192,60);x.fillStyle='#85dcf4';x.beginPath();x.moveTo(48,480);x.quadraticCurveTo(60,300,192,305);x.quadraticCurveTo(330,305,338,480);x.fill();x.fillStyle='#e7ac84';x.beginPath();x.ellipse(192,219,77,100,0,0,7);x.fill();x.fillStyle='#302d32';for(let i=0;i<22;i++){x.beginPath();x.arc(192+Math.cos(i*.75)*75,155+Math.sin(i*.75)*44,25,0,7);x.fill();}x.fillStyle='#302d32';x.fillRect(146,208,35,8);x.fillRect(205,208,35,8);x.fillRect(151,222,14,8);x.fillRect(214,222,14,8);x.fillRect(176,274,36,7);x.fillStyle='#f7e9bc';x.font='900 105px Arial';x.fillText('10',192,450);x.font='900 17px Arial';x.fillText('NAPOLI TI AMA',192,498);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const diegoMat=new THREE.MeshBasicMaterial({map:muralTexture()});
const muralURL='./assets/diego-mural.jpg';new THREE.TextureLoader().load(muralURL,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities?.getMaxAnisotropy?.()||1,8);diegoMat.map=t;diegoMat.needsUpdate=true;});
const totoMats=['./assets/toto-principe.jpg','./assets/toto-matta.jpg'].map((url,index)=>{const m=new THREE.MeshBasicMaterial({color:0xffffff});new THREE.TextureLoader().load(url,t=>{if(index===0){t.repeat.set(455/639,380/425);t.offset.set(170/639,30/425);}else{t.repeat.set(.575,1);t.offset.set(.235,0);}t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities?.getMaxAnisotropy?.()||1,8);m.map=t;m.needsUpdate=true;});return m;});
const segments=[];const segmentLength=18, segmentCount=13;
const shopNames=['PIZZERIA DA GIGI','BAR • NU CAFÈ','SFUGLIATELLE','O’ RE DEL BABÀ','FORZA NAPOLI','FRIGGITORIA','GELATI E FELICITÀ'];
function architecturalArch(p,x,y,z,r,side,color=0xf6dfbb){const arch=new THREE.Mesh(new THREE.TorusGeometry(r,.09,4,12,Math.PI),material(color));arch.rotation.y=side===-1?Math.PI/2:-Math.PI/2;arch.position.set(x,y,z);p.add(arch);}
function streetLamp(p,x,z,ornate=false){const g=group(p);g.position.set(x,0,z);cyl(g,0x334d50,0,2.15,0,.055,4.3);cyl(g,0x334d50,0,.25,0,.15,.5);for(const dx of ornate?[-.4,0,.4]:[0]){box(g,0x334d50,dx/2,4.1,0,Math.abs(dx)+.1,.06,.06);box(g,0xffe7a3,dx,4.35,0,.23,.42,.23);box(g,0x334d50,dx,4.6,0,.32,.08,.32);}return g;}
function cafeTable(p,x,z,seed){const g=group(p);g.position.set(x,.2,z);cyl(g,0xf1deae,0,.88,0,.58,.1);cyl(g,0x556a62,0,.45,0,.05,.86);for(const dx of [-.83,.83]){box(g,seed%2?0x3d9f9d:0xe87352,dx,.48,0,.53,.08,.55);box(g,seed%2?0x3d9f9d:0xe87352,dx,.8,-.26,.53,.6,.07);for(const zz of [-.2,.2])box(g,0x52655d,dx,.22,zz,.045,.46,.045);}cyl(g,0xfff4df,.12,.98,0,.1,.15);cyl(g,0x643b25,.12,1.06,0,.07,.015);return g;}
function boat(p,x,z,seed){const g=group(p);g.position.set(x,.04,z);const hull=ball(g,seed%2?0xe9e5c9:0x427da5,0,0,0,.65,.35,2.3);box(g,0xdfbd82,0,.17,0,.6,.1,1.4);if(seed%2){cyl(g,0xc4b99a,0,1.3,0,.035,2.6);const shape=new THREE.Shape();shape.moveTo(.05,.1);shape.lineTo(.05,2.35);shape.lineTo(1.35,.1);const sail=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(0xfff3dc));sail.position.y=.2;sail.rotation.y=-.6;g.add(sail);}return g;}
function castelOvo(p){const g=group(p);g.name='castel-dell-ovo';g.position.set(20,0,0);
  ball(g,0xb7b4a2,0,-.1,0,8.7,.15,.8);for(let n=0;n<14;n++){const a=n*2.4;ball(g,n%2?0xc6c2ac:0xa6aa9d,Math.cos(a)*7.2,.12,Math.sin(a)*5.5,.7,.65,1.2);}
  box(g,0xc3a574,0,2.1,0,13,4.2,8.5);box(g,0xe0c595,0,4.32,0,13.4,.35,8.8);
  box(g,0xc7ab7e,-3.5,5.7,1.3,5.2,4,5.2);box(g,0xe0c595,-3.5,7.85,1.3,5.5,.3,5.5);
  box(g,0xc7ae83,4,4.75,-1.1,4.5,3.2,5.3);box(g,0xe5cda2,4,6.45,-1.1,4.8,.3,5.6);
  box(g,0xd1b887,1,5.2,-2.7,4,1.7,2.2);box(g,0x6e6d59,.7,1.35,4.28,1.7,2.7,.045);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(.85,.18,4,14,Math.PI),material(0xe3c897));arch.position.set(.7,2.62,4.34);g.add(arch);
  for(let n=0;n<10;n++){box(g,0xd7bd91,-5.9+n*1.3,4.7,4.12,.55,.7,.7);box(g,0xd7bd91,-5.9+n*1.3,4.7,-4.12,.55,.7,.7);}
  for(let n=0;n<4;n++){box(g,0xe0c595,-5.7+n*1.4,8.15,3.7,.55,.6,.55);box(g,0xe0c595,2.3+n*1.1,6.75,1.3,.5,.5,.55);}
  for(let floor=0;floor<2;floor++)for(let w=0;w<3;w++){box(g,0x6d756a,-4.9+w*1.45,5.1+floor*1.65,3.93,.25,.67,.025);box(g,0x6e786a,2.5+w*1.5,4.65,1.57,.3,.65,.025);}
  for(let n=0;n<35;n++){const row=Math.floor(n/7);box(g,n%2?0xd5b98a:0xbda072,-5.8+(n%7)*1.85+(row%2)*.35,.5+row*.72,4.26,1.5,.025,.02);}
  box(g,0xd6c39b,-9.7,.52,1,7,.4,2.1);for(let n=0;n<6;n++)box(g,0xc1b693,-12.8+n*1.2,.95,1.97,.13,.7,.13);
  flag(g,-3.8,8.8,1);sign(g,'CASTEL DELL’OVO',0,3.2,4.4,4.5,.55,'#e6cea0','#716142');
}
function diegoShrine(p){const g=group(p);g.name='maradona-shrine';g.position.set(-6.8,0,0);g.rotation.y=Math.PI/3;
  box(g,0xd5a688,0,4.8,-1.1,6.4,9.6,2.2);box(g,0xf7dfb0,0,9.7,-1.1,6.8,.25,2.6);
  const mural=new THREE.Mesh(new THREE.PlaneGeometry(5.7,7.6),diegoMat);mural.position.set(0,5.55,.025);g.add(mural);
  sign(g,'DIEGO VIVE',0,1.3,.16,5.8,.65,'#0294bc','#fff1d0');box(g,0xc49c6d,0,.55,.4,5.8,.35,1.3);
  for(let n=0;n<10;n++){const x=-2.4+n*.52;cyl(g,n%2?0xfff6da:0xe5654b,x,.95,.5,.08,.4+(n%3)*.1);ball(g,0xffbf3c,x,1.2+(n%3)*.05,.5,.05,1.7);}
  for(let n=0;n<3;n++){flag(g,-3+n*3,3.8,.2,true);sign(g,'10',-2+n*2,2.6,.14,.7,.8,'#0c9ec5','#ffffff');}
  const fan=human(p,0x079bc3);fan.position.set(-5.4,.2,4);fan.rotation.y=-1.7;fan.children[fan.children.length-1].rotation.z=-1.5;box(fan,0x334d55,.55,2.2,.25,.18,.3,.07);
  const tourist=human(p,0xedbd54);tourist.position.set(-6.8,.2,3.3);tourist.rotation.y=-1;box(tourist,0x584f47,.5,2.15,.2,.04,.9,.04);box(tourist,0x334d55,.5,2.62,.2,.2,.3,.05);
}
function church(p,side){const g=group(p);g.name='historic-church';g.position.set(side*9.3,0,0);g.rotation.y=side===-1?Math.PI/2:-Math.PI/2;
  box(g,0xe3c79a,0,4,-1,7.8,8,4);box(g,0xf6dfb6,0,8,-.8,8.2,.35,4.5);const pediment=mesh(coneGeo,0xe5c99a,0,9,-.8,5.3,2,1.4,g);pediment.rotation.y=Math.PI/4;
  for(const x of [-3.2,-2.4,2.4,3.2]){cyl(g,0xf3dfb5,x,4.5,1.13,.15,6.4);box(g,0xf6e9c9,x,1.3,1.13,.44,.3,.45);}
  box(g,0x665445,0,1.65,1.06,1.8,3.3,.08);const rose=new THREE.Mesh(new THREE.TorusGeometry(.65,.11,6,20),material(0xf6e2be));rose.position.set(0,6.3,1.07);g.add(rose);ball(g,0x77989c,0,6.3,1.04,.57,1,.08);box(g,0xf4e0b4,0,6.3,1.12,.08,1.2,.08);box(g,0xf4e0b4,0,6.3,1.12,1.2,.08,.08);
  box(g,0xdfbf8d,4.7,5,-1,1.8,10,1.9);mesh(coneGeo,0xa97659,4.7,10.8,-1,1.4,1.6,1.4,g).rotation.y=Math.PI/4;box(g,0x6f786c,4.7,8.3,.02,.65,1.2,.03);box(g,0xf9e3b8,0,10.6,-.7,.12,1.5,.12);box(g,0xf9e3b8,0,10.9,-.7,.9,.12,.12);
}
function facade(p,side,z,seed,zone){const palette=[...districts[zone].colors,0xe5aa82,0xf2d8ad,0xdb9e82,0xe3c17c];const front=p.userData.plazaSides?.includes(side)?10.3:zone===1?5.85:zone===3?6.9:7.8;const floors=zone===3?1+(seed%2):2+(seed%3),h=3.35+floors*2.75,depth=5.8;
  const faceX=side*(front+((seed%3)-1)*.18);const g=group(p);g.position.z=z;
  const wall=box(g,palette[seed%palette.length],faceX+side*2.8,h/2,0,5.6,h,depth);if(zone===3){wall.material=historicStoneMat;for(const dx of [-1.45,1.45]){const roof=box(g,seed%2?0xac795d:0xb48368,faceX+side*2.8+dx,h+.48,0,3.05,.15,6.2);roof.rotation.z=dx<0?.27:-.27;}};box(g,0xead8b9,faceX+side*.03,1.4,0,.12,2.8,depth);box(g,0xf9e2bc,faceX+side*2.7,h+.13,0,5.9,.26,6.05);
  const shutter=[0x337d70,0x6c7f7a,0x746d7c,0x387a90][seed%4];
  for(let floor=0;floor<floors;floor++)for(const wz of [-1.45,1.45]){const y=4.05+floor*2.75;box(g,0x36515b,faceX-side*.025,y,wz,.06,1.5,.94);for(const off of [-.67,.67]){box(g,shutter,faceX-side*.1,y,wz+off,.12,1.65,.3);for(let n=0;n<4;n++)box(g,0x294b4b,faceX-side*.17,y-.52+n*.34,wz+off,.015,.025,.23);}box(g,0xffe7bf,faceX-side*.12,y-.82,wz,.22,.12,1.8);
    if((floor+seed)%2===0){box(g,0xb7a58a,faceX-side*.5,y-.94,wz,.95,.13,1.95);box(g,0x374b4b,faceX-side*.96,y-.4,wz,.04,.045,1.95);for(let n=0;n<5;n++)box(g,0x374b4b,faceX-side*.96,y-.65,wz-.9+n*.45,.035,.5,.035);if((floor+seed)%3===0){cyl(g,0xb96c4d,faceX-side*.68,y-.68,wz+.6,.14,.28);ball(g,0x4b9a63,faceX-side*.68,y-.43,wz+.6,.22,.8);}}
  }
  for(const wz of [-1.4,1.4]){box(g,0x354f53,faceX-side*.03,1.15,wz,.06,2.3,1.7);architecturalArch(g,faceX-side*.07,2.3,wz,.84,side);}
  if(seed%3!==0){const awningC=[0xd86f51,0x178c8e,0xd3a64c][seed%3];for(let a=0;a<5;a++){const aZ=-2.55+a*1.12;const top=box(g,a%2?0xffe4b7:awningC,faceX-side*.65,2.65,aZ,1.35,.07,.55);top.rotation.z=side*.14;box(g,a%2?0xffe4b7:awningC,faceX-side*1.27,2.51,aZ,.07,.3,.55);}}
  sign(g,zone===3?['LIBRERIA NILO','PRESEPI E MERAVIGLIE','PIZZA A PORTAFOGLIO','BOTTEGA DEI CORNICELLI','PASTA FATTA IN CASA','CUOPPO FRITTO'][seed%6]:shopNames[seed%shopNames.length],faceX-side*.12,3.05,0,5,.62,'#fff0cc',seed%2?'#b45339':'#236c69','',side===-1?Math.PI/2:-Math.PI/2);
  if(seed%4===1){cyl(g,0x70695b,faceX+side*2,h+1,1.5,.025,1.8);box(g,0x70695b,faceX+side*2,h+1.5,1.5,.025,.03,1.2);}
  if(seed%5===0){const dish=ball(g,0xeee2c9,faceX+side*.5,h+.6,1.5,.42,.8,.18);dish.rotation.y=-side*.7;}
  if(seed%3===0||zone===1&&seed%2===0){flag(g,faceX-side*.2,6.8,.5,seed%4!==0);const nonna=human(g,0xb38eac,true);nonna.position.set(faceX-side*.45,5.85,1.45);nonna.rotation.y=-side*Math.PI/2;nonna.scale.setScalar(.58);}
  if(seed%4===0){const shopper=human(g,[0xeac25c,0xe88666,0x209aaf,0xf1e0be][seed%4],seed%8===0);shopper.position.set(faceX-side*.62,.19,1);shopper.scale.setScalar(.8);shopper.rotation.y=-side*.3;}
}
function totoMural(p,side,index){const g=group(p);g.name='toto-mural-'+index;g.position.set(side*7.9,0,0);g.rotation.y=-side*Math.PI/3;box(p,0xe2be98,side*14,5,0,5,10,18);
  const w=index===0?6.6:3.65,h=index===0?5.5:8.45,wallH=index===0?9:10.4;box(g,index===0?0xcabda9:0xe1b390,0,wallH/2,-.7,w+.55,wallH,1.4);box(g,0xf5ddad,0,wallH+.1,-.7,w+.9,.25,1.7);
  const mural=new THREE.Mesh(new THREE.PlaneGeometry(w,h),totoMats[index]);mural.position.set(0,index===0?5.2:5.5,.025);g.add(mural);
  sign(g,index===0?'TOTÒ • IL PRINCIPE':'TOTÒ • A MATT’!',0,index===0?1.45:.8,.08,w,.6,'#2c5366','#fff0cb');sign(g,'VICO TOTÒ',0,wallH-.2,.04,3.4,.45,'#fff0d5','#62544b');
  for(const x of [-2.2,2.2]){cyl(g,0xba7252,x,.5,.7,.28,.65);ball(g,0x508957,x,1,.7,.48,1.25);}const fan=human(g,0xf4c254);fan.position.set(index===0?2.6:-2.6,.2,2);fan.scale.setScalar(.8);fan.rotation.y=index===0?-.7:.7;box(fan,0x263c47,.45,2.2,.4,.2,.3,.06);flag(g,-w/2,3,.1,true);
}
const toledoShops=[
  {name:'ZARA',kind:'fashion',bg:'#fff9ef',fg:'#252d31'},
  {name:'MINISO',kind:'toys',bg:'#e83f42',fg:'#ffffff'},
  {name:'INTESA SANPAOLO',kind:'bank',bg:'#1d7661',fg:'#ffffff'},
  {name:'H&M',kind:'fashion',bg:'#fff9ef',fg:'#c33136'},
  {name:'LEOPOLDO INFANTE',kind:'pastry',bg:'#c35270',fg:'#fff1dc'},
  {name:'KIKO MILANO',kind:'beauty',bg:'#222c38',fg:'#ffffff'},
  {name:'BERSHKA',kind:'fashion',bg:'#fff9ef',fg:'#252d31'},
  {name:'OTTICA TOLEDO',kind:'optician',bg:'#386e71',fg:'#ffffff'},
  {name:'BAR • ESPRESSO',kind:'cafe',bg:'#327b70',fg:'#fff1cf'},
  {name:'CALZATURE',kind:'shoes',bg:'#9e583d',fg:'#fff3da'},
  {name:'SFUGLIATELLE',kind:'pastry',bg:'#a9543b',fg:'#fff1dc'}
];
function retailFacade(p,side,z,seed,tall){const g=group(p);g.position.set(side*8,0,z);g.rotation.y=side===-1?Math.PI/2:-Math.PI/2;const shop=toledoShops[((seed%toledoShops.length)+toledoShops.length)%toledoShops.length],brand=shop.name,h=tall?8.5+(seed%2)*2:4.5;p.userData.shops??=[];p.userData.shops.push(brand);
  box(g,seed%2?0xf1d4ae:0xeddcbd,0,h/2,-2.2,8.7,h,4.5);box(g,0xf8e8ca,0,h+.12,-2.2,9,.24,4.7);box(g,0x304c51,0,1.65,.06,8.2,3.2,.09);
  for(const x of [-3,-1.5,0,1.5,3]){box(g,0x8ac5ca,x,1.55,.12,1.3,2.75,.05);box(g,0xd4bd97,x-.71,1.7,.16,.12,3.4,.14);box(g,0xdef4e8,x,2.78,.16,1.15,.035,.02);}
  for(const x of [-2.3,2.3]){box(g,0xd4a261,x,.24,.38,1.1,.25,.7);
    if(shop.kind==='fashion'){ball(g,0xf4e5d0,x,2.1,.26,.15);box(g,seed%2?0x1aa5c5:0xe99870,x,1.52,.24,.48,.85,.14);box(g,0x294d62,x-.13,.81,.24,.16,.57,.13);box(g,0x294d62,x+.13,.81,.24,.16,.57,.13);}
    if(shop.kind==='toys'){for(const dx of [-.3,.3]){const c=dx<0?0xf0d5b8:0xf0c2d1;ball(g,c,x+dx,1,.28,.26,1.2,.55);ball(g,c,x+dx,1.42,.28,.25,1,.65);for(const e of [-.19,.19])ball(g,c,x+dx+e,1.61,.28,.1,1,.6);for(const e of [-.07,.07])ball(g,0x36454d,x+dx+e,1.44,.46,.026);}}
    if(shop.kind==='pastry'||shop.kind==='cafe'){for(let n=0;n<4;n++){box(g,0xffe2b1,x,1+n*.34,.3,1.2,.06,.55);for(const dx of [-.35,0,.35]){if(n%2)mesh(coneGeo,0xd99b50,x+dx,1.13+n*.34,.35,.15,.21,.14,g);else ball(g,0xd89a4d,x+dx,1.12+n*.34,.35,.13,1.25,.75);}}}
    if(shop.kind==='beauty'){for(let n=0;n<3;n++){box(g,0xeee4da,x,1+n*.5,.3,1.2,.07,.4);for(let k=0;k<5;k++){box(g,0x252f39,x-.45+k*.22,1.22+n*.5,.38,.09,.35,.09);ball(g,[0xdd557a,0xc83745,0xdf956b][n],x-.45+k*.22,1.42+n*.5,.38,.055,1.2,.8);}}}
    if(shop.kind==='optician'){for(let n=0;n<3;n++)for(const dx of [-.16,.16]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.13,.025,4,10),material(0x202e36));rim.position.set(x+dx,1+n*.5,.3);g.add(rim);}}
    if(shop.kind==='shoes'){for(let n=0;n<3;n++){box(g,0xe9d2ad,x,1+n*.5,.3,1.3,.07,.4);for(const dx of [-.3,.3])box(g,n%2?0x934c39:0xfff0d5,x+dx,1.14+n*.5,.3,.27,.18,.43);}}
  }
  if(shop.kind==='bank'){box(g,0xf4ede1,0,1.7,.2,2.2,3.2,.25);box(g,0x317c71,0,1.65,.38,1.3,2.3,.3);box(g,0x203c49,0,1.93,.56,.88,.61,.04);box(g,0x91d3c8,0,1.93,.59,.7,.42,.02);box(g,0x273f4b,0,1.21,.56,.65,.08,.05);sign(g,'BANCOMAT',0,2.65,.56,1.6,.28,'#1d7661','#ffffff');for(const x of [-2.3,2.3]){cyl(g,0xf4ede1,x,1.8,.35,.24,3.6);box(g,0xf4ede1,x,3.5,.35,.7,.25,.7);}}
  sign(g,brand,0,3.8,.14,8,.8,shop.bg,shop.fg);
  for(const y of [4.4,h-.35])box(g,0xd7b78c,0,y,.08,8.9,.18,.25);for(const x of [-4.1,4.1])box(g,0xf9e6c4,x,h/2,.12,.25,h,.25);
  for(let y=5.25;y<h-.5;y+=2.7)for(const x of [-2.7,0,2.7]){box(g,0x425f68,x,y,.04,1.35,1.6,.08);box(g,0xe6c59a,x,y-.86,.15,1.65,.12,.22);box(g,0xf7e8c9,x,y,.15,.07,1.6,.1);box(g,0xd0b28b,x,y+.86,.15,1.65,.15,.25);for(const dx of [-.76,.76])box(g,0xf9e6c4,x+dx,y,.14,.09,1.8,.16);}
  // Projecting shop sign faces the approaching player and stays above the pavement.
  sign(p,brand,side*7.7,3.7,z+4.35,2.8,.72,shop.bg,shop.fg);
  if(shop.kind==='pastry'||shop.kind==='cafe'){for(let n=0;n<6;n++){const aw=box(g,n%2?0xf7dfb6:0x23938b,-3.7+n*1.45,3.15,.75,1.4,.09,1.5);aw.rotation.x=.12;}cafeTable(p,side*6.7,z,seed);}
  if(seed%3===0){flag(p,side*7.9,6.3,z+2,seed%4!==0);const shopper=human(p,0xdf9977);shopper.position.set(side*6.3,.2,z+2);shopper.scale.setScalar(.8);box(shopper,0xf8dfaf,.5,.7,0,.4,.5,.25);}
}
function shoppingArcade(p,side){const g=group(p);g.name='galleria-umberto';g.position.set(side*9.6,0,0);g.rotation.y=side===-1?Math.PI/2:-Math.PI/2;
  box(g,0xe8cfaa,0,6.3,-2,16,12.6,5);box(g,0xf2debb,0,12.6,-2,16.6,.4,5.5);box(g,0x385969,0,4.1,.56,5.9,8.2,.08);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(3,.24,5,22,Math.PI),material(0xf6e3be));arch.position.set(0,8.1,.7);g.add(arch);for(const x of [-3.1,3.1,-6.8,6.8]){cyl(g,0xf6e3be,x,4.8,.7,.2,9.6);box(g,0xf5dfb9,x,.4,.7,.8,.6,.8);}
  for(const x of [-5,5])for(const y of [3,6.4,10])box(g,0x5e7e83,x,y,.56,1.3,1.9,.08);for(let n=0;n<5;n++)box(g,0x76abb4,-2.2+n*1.1,4.3,.7,.055,7.4,.08);
  const roof=ball(g,0x7facb2,0,13.1,-1.7,4.1,.65,.8);for(let n=0;n<7;n++){const rib=new THREE.Mesh(new THREE.TorusGeometry(4.16,.055,4,20,Math.PI),material(0x475f66));rib.position.set(0,13,-1.7);rib.rotation.y=n*Math.PI/7;rib.scale.y=.65;g.add(rib);}sign(g,'GALLERIA UMBERTO I',0,10.7,.78,11,.8,'#e9d3ae','#624e38');
  sign(p,'GALLERIA UMBERTO I',side*8,6.5,6.3,4.5,.7,'#f2dfbe','#68563f');
}
function seafrontRestaurant(p,seed){const g=group(p);g.name='lungomare-dehors';g.position.set(-9.6,0,0);g.rotation.y=Math.PI/2;const eatery=seed%3!==2;
  if(!eatery){box(g,0xf0d6b0,0,2.2,-3,16,4.4,6);sign(g,'GRANITA & BABÀ',0,3.6,.1,10,.7,'#367e83','#fff3cf');for(const x of [-5,0,5]){box(g,0x548487,x,1.7,.04,2.6,2.8,.07);const aw=box(g,0xe6a65f,x,2.9,1,3.2,.14,2);aw.rotation.x=.1;}for(const z of [-4,4])cafeTable(p,-6.7,z,seed);palm(p,-7.1,0);return;}
  box(g,seed%2?0xf6d9b1:0xf1c397,0,2.25,-2.2,16,4.5,4.5);box(g,0xf6e7cc,0,4.55,-2.2,16.4,.22,4.8);for(let x=-6;x<=6;x+=3){box(g,0x43656a,x,1.55,.06,2.3,2.8,.08);}
  const label=seed%3===0?'PIZZERIA • SUL MARE':'CAFFÈ CARACCIOLO';sign(g,label,0,3.8,.15,14,.7,'#b74736','#fff1cf');
  for(let n=0;n<8;n++)box(g,n%2?0xf6e4bc:0xcd6752,-7+n*2,3.15,1.3,1.9,.1,2.5);for(const x of [-7,0,7])cyl(g,0x6d7b63,x,1.65,2.4,.055,3.3);
  for(const z of [-5,0,5])cafeTable(p,-6.5,z,seed);sign(p,seed%3===0?'PIZZERIA':'GELATO & CAFÈ',-7.8,3.6,7.2,3.9,.7,'#b74736','#fff1cf');
  // A little wood-fired oven behind the open counter.
  const oven=ball(g,0xd08e65,5,1.25,.5,1.1,1,.55);ball(g,0x493f36,5,1.05,1.08,.6,.7,.05);ball(g,0xffa44c,5,.85,1.14,.35,.4,.05);pizza(g,3,.9,1,.45);const chef=human(g,0xfaf1da);chef.position.set(1,.1,.5);chef.scale.setScalar(.78);
}
// Each landmark occupies two road sections; the following section leaves its frontage open.
function seafrontHotel(p,kind){const g=group(p);g.name='hotel-'+kind;g.position.set(-8.7,0,-9);g.rotation.y=Math.PI/2;const modern=kind==='royal',excelsior=kind==='excelsior',height=modern?18.5:excelsior?22:20.2,width=34;
  const wall=modern?0xf1f0de:excelsior?0xf0d4a6:0xe7d1b2,trim=0xffeccc;
  box(g,wall,0,height/2,-4.5,width,height,9);box(g,0xbca58b,0,1.7,.05,width,3.4,.2);box(g,trim,0,height+.2,-4.5,width+.8,.4,9.6);
  for(let floor=0;floor<(modern?5:6);floor++){const y=5.1+floor*2.8;box(g,modern?0xf8f5df:0xd3b993,0,y+1.25,.16,width+.25,modern?.28:.13,.4);
    for(let n=0;n<11;n++){const x=-15+n*3;box(g,0x456975,x,y,.17,modern?2.5:1.45,1.9,.12);box(g,0x83b6bb,x-.23,y+.25,.25,.11,1.3,.02);
      if(!modern){box(g,trim,x,y+1.02,.3,1.85,.18,.4);for(const dx of [-.85,.85])box(g,trim,x+dx,y,.28,.14,2.1,.2);if(floor===0||floor===3){box(g,trim,x,y-1,.55,2.1,.18,.95);box(g,0x4f615d,x,y-.55,1,2,.055,.055);for(const dx of [-.9,-.45,0,.45,.9])box(g,0x4f615d,x+dx,y-.74,1,.035,.44,.035);}}
    }
    if(modern){box(g,0x9bc0c1,0,y-.55,.7,width,.58,.12);box(g,0xf8f5df,0,y-.95,.45,width+.7,.18,1.25);}
    for(const side of [-1,1]){const x=side*(width/2+.06);box(g,trim,x,y+1.25,-4.5,.3,.17,9.4);for(const z of [-7.3,-4.5,-1.7]){box(g,0x456975,x,y,z,.12,1.85,1.4);box(g,trim,x+side*.08,y+1,z,.2,.16,1.8);box(g,trim,x+side*.08,y-1,z,.25,.15,1.8);if(modern)box(g,0x9bc0c1,x+side*.1,y-.6,z,.15,.55,1.8);else for(const dz of [-.8,.8])box(g,trim,x+side*.08,y,z+dz,.16,2,.12);}}
  }
  for(const side of [-1,1])for(const z of [-8.7,-.3])box(g,trim,side*(width/2+.12),height/2,z,.35,height,.35);
  if(modern){box(g,0xe7e8dc,-11,height/2+.9,-6.5,10,height+1.8,11);for(let y=4.8;y<19;y+=2.8){box(g,0x759ca8,-11,y,.2,9,1.7,.1);box(g,0xf7f2dc,-11,y-1,.5,10,.2,1);}sign(g,'ROYAL CONTINENTAL',3,19.2,.4,23,1,'#f1efdb','#315b73');}
  else{for(const x of [-16,16]){box(g,trim,x,height/2,.35,.65,height,.65);for(let y=3.5;y<height;y+=1)box(g,0xd7c1a2,x,y,.7,.75,.12,.12);}for(const x of [-4.6,4.6])cyl(g,trim,x,2,.75,.32,4);
    if(excelsior){for(const x of [-14,14]){cyl(g,wall,x,11,-.2,2.1,22);for(let y=5;y<21;y+=2.8){box(g,0x456975,x,y,1.94,1.2,1.8,.08);cyl(g,trim,x,y-1,-.2,2.25,.16);}const roof=ball(g,0x6e8e87,x,23,-.2,2.3,.8);cyl(g,0xb29563,x,25,-.2,.08,1);ball(g,0xb29563,x,25.6,-.2,.14);}sign(g,'EXCELSIOR',0,21.3,.5,19,1,'#f0d4a6','#795c36');}
    else{box(g,0xf3e5ca,0,height+1.1,-3.2,27,1.6,5.5);for(let x=-12;x<=12;x+=3){cyl(g,0xd1b985,x,height+2.1,-.6,.07,2);box(g,0xf3e5ca,x,height+2.8,-3.2,3.1,.15,5.5);}sign(g,'GRAND HOTEL VESUVIO',0,19.6,.45,27,1,'#e7d1b2','#6b5536');sign(g,'CARUSO • ROOF GARDEN',0,22.7,-.25,14,.55,'#f3e5ca','#6b5536');}
  }
  box(g,0x304a54,0,1.7,.22,4,3.4,.15);box(g,0xcda861,0,1.7,.35,.08,3.4,.12);const canopy=box(g,modern?0x417f89:0x996140,0,3.5,1.5,9,.25,3);for(const x of [-4,4])cyl(g,0x9e8867,x,1.8,2.7,.07,3.6);
  sign(g,modern?'ROYAL CONTINENTAL':excelsior?'HOTEL EXCELSIOR':'GRAND HOTEL VESUVIO',0,3,.5,8,.45,modern?'#417f89':'#996140','#fff1d0');sign(g,modern||excelsior?'★★★★':'★★★★★',0,4.1,.45,3,.45,'#f0dbb7','#94723d');
  sign(p,modern?'ROYAL CONTINENTAL':excelsior?'EXCELSIOR':'VESUVIO',-8.1,6,7,5.5,.8,'#254b5a','#ffe5a7',modern||excelsior?'★★★★':'★★★★★');
  for(const x of [-12,12]){cyl(g,0xe0c99c,x,.55,1.2,.65,.9);ball(g,0x3d8662,x,1.5,1.2,.85,1.3);}const porter=human(g,modern?0x2b6676:0x9a4240);porter.position.set(2.8,.2,1.5);porter.scale.setScalar(.85);box(porter,0x9a4240,0,2.3,0,.65,.13,.5);box(g,0xb89b70,-2.7,.65,1.6,.8,1.1,.6);box(g,0x876c57,-2.7,1.45,1.6,1,.45,.65);
}
function marketStall(p,x,z,seed){const g=group(p);g.name='historic-market';g.position.set(x,0,z);box(g,0x9d7452,0,.65,0,1.25,1.1,2.8);box(g,0xd4a76b,0,1.22,0,1.4,.14,3);for(const dz of [-1.3,1.3])cyl(g,0x735f49,0,1.75,dz,.04,3.5);
  for(let n=0;n<6;n++)box(g,n%2?0xeee0b8:0xa95843,0,3.35,-1.25+n*.5,1.8,.08,.48);
  if(seed%3===0){for(let n=0;n<16;n++){const book=box(g,[0xb9604c,0xe4bd6e,0x376f77][n%3],-.4+(n%3)*.35,1.4+(n%2)*.06,-1.15+Math.floor(n/3)*.44,.24,.27,.34);book.rotation.z=(n%3-1)*.1;}sign(g,'LIBRI USATI',0,2.9,1.55,2,.45,'#ede0ba','#4c695f');}
  else if(seed%3===1){for(let n=0;n<12;n++){ball(g,n%2?0xf4d14e:0xd9563e,-.4+(n%3)*.4,1.44,-1+Math.floor(n/3)*.6,.2,.85);}sign(g,'POMODORI & LIMONI',0,2.9,1.55,2.2,.45,'#ede0ba','#96462e');}
  else{for(let n=0;n<9;n++){const horn=mesh(coneGeo,0xd44738,-.4+(n%3)*.4,1.65,-1+Math.floor(n/3)*.85,.09,.65,.09,g);horn.rotation.z=.22;}sign(g,'SCIO’ SCIO’',0,2.9,1.55,2,.45,'#ede0ba','#96462e');}
}
function historicSquare(p,side){const g=group(p);g.name='piazza-del-gesu';g.position.set(side*9,0,0);box(g,0xd9c8a5,0,.02,0,7,.25,18);box(g,0xbda789,0,.65,0,3.3,1.3,3.3);box(g,0xe7d6b2,0,1.4,0,2.7,.25,2.7);box(g,0xc3ad89,0,4,0,1.4,5.2,1.4);cyl(g,0xe5d2a8,0,7,0,.8,.4);mesh(coneGeo,0xc9b38c,0,9,0,.7,4,.7,g);ball(g,0x91a395,0,11.4,0,.32,1.5);for(const y of [2,5.7,7.5,9.5]){box(g,0xe7d6b2,0,y,0,2.3-(y*.1),.22,2.3-(y*.1));for(const x of [-.65,.65])for(const z of [-.65,.65])ball(g,0xd8c7a5,x,y+.32,z,.22,1.5);}sign(g,'PIAZZA DEL GESÙ',0,2.3,1,3.7,.55,'#ecdfc0','#6d604c');for(const z of [-5,5]){cafeTable(p,side*6.3,z,3);marketStall(p,side*9.5,z,3);}
}

function buildSegment(g,idx,zone){g.userData.zone=zone;g.userData.shops=[];const course=g.userData.courseDistance??idx*18;const seed=Math.floor(course/18);const local=course%450;const landmark=Math.abs(local-180)<8;g.userData.hotel=zone===2?({126:'vesuvio',270:'royal',378:'excelsior'}[local]||null):null;g.userData.plazaSides=zone===1?((local>=36&&local<=90)||(local>=108&&local<=180)?[-1]:local>=252&&local<=306?[1]:[]):zone===3&&local>=252&&local<=324?[1]:[];g.userData.plaza=g.userData.plazaSides.includes(-1);g.userData.landmark=landmark?(zone===2?'castle':zone===1?'diego':zone===3?'church':'galleria'):null;g.userData.toto=zone===1&&(Math.abs(local-90)<8||Math.abs(local-306)<8)?(local<150?'left':'right'):null;g.userData.signature=['shopping','vicoli','promenade','botteghe'][zone];
  box(g,zone===2?0xe4d3b0:0xc6b99c,zone===2?-9:0,-.36,0,zone===2?32:60,.2,18);
  const road=new THREE.Mesh(new THREE.BoxGeometry(10,.2,18),zone===2?material(0x929b95):zone===0?material(0x96958c):zone===3?historicRoadMat:roadMat);road.position.y=-.12;road.receiveShadow=true;g.add(road);
  for(const side of [-1,1]){box(g,zone===2?0xf2dfb9:0xdccbaa,side*(zone===2?6.1:5.6),.03,0,zone===2?2.4:1.3,.3,18);box(g,0xf1e3c3,side*4.98,.14,0,.16,.32,18);for(let j=0;j<3;j++)box(g,zone===2?0xffefcb:0xe5dcc0,side*1.5,.005,-7+j*6,.055,.015,1.2);
    if(zone===2&&side===1){box(g,0xdbc59e,7.4,.4,0,.25,.75,18);box(g,0xf0dfbd,7.4,.82,0,.4,.13,18);for(let k=0;k<6;k++){box(g,0xc6b38d,7.4,.47,-7.5+k*3,.3,.75,.3);ball(g,0xc9c8b7,8.05,-.05,-7.5+k*3,.65,.6);}
      if(seed%2===0)palm(g,6.5,-5);if(seed%3===0)streetLamp(g,6.4,5,true);if(seed%4===1)cafeTable(g,6.2,-1,seed);if(seed%3===1){const p=human(g,0xf2c168);p.position.set(6.6,.2,4);p.rotation.y=1.6;p.scale.setScalar(.83);}
      for(let n=0;n<4;n++)box(g,0x8ce0e5,11+(n%2)*8,.015,-6+n*3.5,2+n*.5,.018,.1);
      if(seed%3===0)boat(g,12+(seed%4)*4,-5,seed);continue;
    }
    if(g.userData.plazaSides.includes(side))box(g,0xd8c9ab,side*8,.025,0,6,.3,18);
    if(zone===0){if(landmark&&side===1)shoppingArcade(g,side);else{retailFacade(g,side,-4.5,seed*3+(side+1),seed%3!==0);retailFacade(g,side,4.5,seed*3+(side+1)+1,true);}if(seed%3===0)streetLamp(g,side*6.3,6,true);continue;}
    if(zone===2){if(g.userData.hotel)seafrontHotel(g,g.userData.hotel);else if(![144,288,396].includes(local))seafrontRestaurant(g,seed);continue;}
    if(g.userData.toto&&(g.userData.toto==='left'?-1:1)===side){totoMural(g,side,g.userData.toto==='left'?0:1);continue;}
    if(zone===3&&Math.abs(local-324)<8&&side===1){historicSquare(g,side);continue;}
    if(zone===1&&landmark&&side===-1){diegoShrine(g);facade(g,side,-6,seed*7,zone);continue;}
    if(zone===3&&landmark&&side===-1){church(g,side);continue;}
    for(let j=0;j<3;j++)facade(g,side,-6+j*6,seed*7+j+(side+1)*3,zone);
    if(zone===3&&seed%2===0)marketStall(g,side*5.85,2,seed);
    if(seed%3===2){streetLamp(g,side*5.35,6.8,zone===0);if(zone!==1)cafeTable(g,side*5.65,-3,seed);}
  }
  if(zone===1&&seed%2===0){box(g,0x5f6055,0,7.1,-5,12,.025,.025);for(let n=0;n<6;n++){const cloth=box(g,[0xf9e8c6,0x3fa3c3,0xe47b61,0xf1bc52][n%4],-4+n*1.6,6.65-Math.sin(n)*.15,-5,.75,1,.035);cloth.rotation.z=Math.sin(n)*.1;}}
  if(zone===1&&seed%3===0){flag(g,-5.6,4.4,3,true);flag(g,5.6,5.4,0,true);for(let n=0;n<8;n++){const pennant=mesh(coneGeo,n%2?0x06a4cc:0xfff0cd,-4+n*1.15,8,-2,.32,.55,.035,g);pennant.rotation.z=Math.PI;}sign(g,'FORZA NAPOLI',5.65,4.2,-1,3.7,.65,'#049ac2','#fff1ce','',-Math.PI/2);}
  if(zone===2&&landmark)castelOvo(g);
  if(zone!==0&&zone!==2&&seed%5===0&&!(zone===1&&(landmark||g.userData.toto))){const stall=group(g);stall.position.set(-6.2,0,5.8);box(stall,0x249b88,0,.8,0,1.5,1.3,2);box(stall,0xfbd457,0,1.5,0,1.7,.15,2.2);for(let n=0;n<8;n++)ball(stall,0xffd246,-.35+(n%2)*.7,1.7+(n%3)*.06,-.65+Math.floor(n/2)*.43,.17,.8);sign(stall,'LIMONATA',.9,2.6,0,2.6,.8,'#ffe39c','#187c72','A COSCE APERTE',-Math.PI/2);const vendor=human(stall,0xf5efe0);vendor.position.set(-.2,.1,-1.2);vendor.scale.setScalar(.8);}
  if(zone===0&&seed%7===2){const performer=human(g,0x4b6571);performer.position.set(-5.5,.2,0);performer.rotation.y=1.1;const sax=cyl(performer,0xecc059,.32,1.2,.3,.08,.65);sax.rotation.z=.45;ball(performer,0xecc059,.48,.96,.3,.15,.7);sign(g,'NU CAFÈ E NA CANZONE',-5.62,2.6,-1,2.8,.6,'#f6dc9e','#6d5b43','',Math.PI/2);}
  batchStatic(g);
}
// Bake static city geometry by material: hundreds of props become a handful of draws.
function batchStatic(g){
  g.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(g.matrixWorld).invert();const batches=new Map(),oldGeometries=new Set();
  g.traverse(o=>{if(!o.isMesh)return;let bucket=batches.get(o.material);if(!bucket){bucket={positions:[],normals:[],uvs:[]};batches.set(o.material,bucket);}const geom=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geom.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));for(const [key,name] of [['positions','position'],['normals','normal'],['uvs','uv']]){const a=geom.getAttribute(name);if(a)for(const value of a.array)bucket[key].push(value);}geom.dispose();if(![boxGeo,sphereGeo,cylinderGeo,coneGeo].includes(o.geometry))oldGeometries.add(o.geometry);});
  g.clear();oldGeometries.forEach(geo=>geo.dispose());for(const [mat,b] of batches){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(b.normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(b.uvs,2));geo.computeBoundingSphere();const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;g.add(m);}
}

function disposeSegment(g){const geo=new Set(),mt=new Set();g.traverse(o=>{if(o.isMesh){if(![boxGeo,sphereGeo,cylinderGeo,coneGeo].includes(o.geometry))geo.add(o.geometry);if(o.material!==roadMat&&o.material!==historicRoadMat&&o.material!==historicStoneMat&&o.material!==diegoMat&&o.material!==napoliFlagMat&&!totoMats.includes(o.material)&&!Array.from(mats.values()).includes(o.material))mt.add(o.material);}});geo.forEach(x=>x.dispose());mt.forEach(x=>x.dispose());g.clear();}
for(let i=0;i<segmentCount;i++){const g=group();g.position.z=28-i*segmentLength;g.userData.index=i;g.userData.courseDistance=i*18;buildSegment(g,i,0);segments.push(g);}

const menuTraffic=group();const demoA=scooter(menuTraffic,0);demoA.position.set(2.5,0,-7);const demoB=scooter(menuTraffic,4);demoB.position.set(-3,0,-22);const demoC=scooter(menuTraffic,2);demoC.position.set(0,0,-39);
const objects=[],particles=[];
function createObstacle(type,lane,z,variant=0){let g;
  if(type==='scooter')g=scooter(scene,variant);
  else{g=group();shadow(g,.9,.75);
    if(type==='laundry'){box(g,0x615749,-1.15,1.5,0,.08,3,.08);box(g,0x615749,1.15,1.5,0,.08,3,.08);box(g,0x615749,0,2.7,0,2.4,.04,.04);box(g,0xfff2d6,0,2.02,0,1.5,1.35,.07);box(g,0x169ec5,-.62,2.03,.06,.32,1.3,.08);box(g,0x169ec5,.62,2.03,.06,.32,1.3,.08);sign(g,'↓',0,2.07,.1,.42,.42,'#fff2d6','#125875');}
    else if(type==='pothole'){const hole=cyl(g,0x283a41,0,.02,0,1.02,.045);hole.scale.z=1.4;for(let i=0;i<9;i++){const a=i*7;const rock=box(g,0xb0a997,Math.cos(a)*1.05,.12,Math.sin(a)*1.35,.28,.2,.4);rock.rotation.y=a;}}
    else if(type==='crate'){box(g,0xae784b,0,.42,0,1.45,.8,1.15);for(let i=0;i<4;i++){box(g,0xd9ac6d,0,.15+i*.19,.59,1.53,.12,.07);}for(let i=0;i<9;i++)ball(g,variant%2?0xfdd351:0xeb5840,-.48+(i%3)*.48,.88,-.35+Math.floor(i/3)*.35,.21,.8);}
    else if(type==='pizza'){for(let i=0;i<3;i++){box(g,0xe0b57b,0,.12+i*.2,0,1.6,.18,1.3);box(g,0xe5543e,0,.12+i*.2,.66,1.1,.07,.03);}pizza(g,0,.73,0,.66);}
    else if(type==='rubbish'){for(let i=0;i<3;i++){ball(g,0x3c5250,-.4+i*.4,.4,.12*(i%2),.49,1.2,.85);mesh(coneGeo,0x3c5250,-.4+i*.4,.98,.12*(i%2),.13,.23,.13,g);}box(g,0xd8b98e,.65,.33,-.2,.7,.6,.65);}
    else if(type==='chair'){box(g,0xe85f48,0,.75,0,1.1,.12,1.1);box(g,0xe85f48,0,1.25,-.48,1.1,.9,.12);for(const x of [-.43,.43])for(const zz of [-.43,.43])box(g,0xe85f48,x,.35,zz,.12,.7,.12);}
    else if(type==='cart'){box(g,0x49a396,0,.9,0,1.8,1.2,1.4);box(g,0xf9d775,0,1.55,0,2,.15,1.6);for(const x of [-.8,.8]){const w=cyl(g,0x314950,x,.3,0,.28,.13);w.rotation.z=Math.PI/2;}for(let n=0;n<5;n++)ball(g,0xf5ce49,-.65+n*.32,1.75,0,.2);sign(g,'LIMONI!',0,1,.72,1.5,.5,'#fff0c5','#207c6c');}
  }
  g.position.set(lanes[lane],0,z);const o={type,lane,z,mesh:g,passed:false,variant,driveSpeed:type==='scooter'?7+variant*.5:0};objects.push(o);return o;
}
function createCoin(lane,z,y=1.1){const g=slice(scene);g.position.set(lanes[lane],y,z);objects.push({type:'coin',lane,z,mesh:g,passed:false,baseY:y});}
function createPower(key,lane,z){const g=group();const def=powerDefs[key];const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),new THREE.MeshStandardMaterial({color:def.color,emissive:def.color,emissiveIntensity:.4,transparent:true,opacity:.55,roughness:.3}));g.add(orb);const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.045,6,24),material(def.color));ring.rotation.x=.3;g.add(ring);sign(g,def.icon,0,0,.7,.75,.75,'#fff2da','#153947');g.position.set(lanes[lane],1.6,z);objects.push({type:'power',key,lane,z,mesh:g,passed:false,baseY:1.6});}
function removeObject(o){scene.remove(o.mesh);disposeSegment(o.mesh);const i=objects.indexOf(o);if(i>=0)objects.splice(i,1);}
function burst(x,y,z,color=0xffc34d,n=14){for(let i=0;i<n;i++){const p=box(scene,color,x,y,z,.12,.12,.12);particles.push({mesh:p,v:new THREE.Vector3((Math.random()-.5)*7,Math.random()*5+1,(Math.random()-.5)*7),life:.55+Math.random()*.45});}}

let state='menu',distance=0,distancePoints=0,score=0,coins=0,speed=18,lane=1,playerX=0,jumpY=0,velocityY=0,slide=0,elapsed=0,combo=0,lastNear=-20,bonus=0,spawnDistance=36,row=0,power=null,powerLeft=0,powerSerial=0,nextPowerTime=18,zone=0,crashTime=0,toastUntil=0,countdown=0;
const quotes=['UÈ UÈ!','GUAGLIÒ, STATTE ACCORTO!','MARONN’ MIA!','UEEE, LEVATE!','MA CHE STAI FACENNO?!','FORZA NAPOLI!','A PIZZAAA!'];
const assetURLs={mural:'./assets/diego-mural.jpg',music:'./assets/tarantella.wav',engine:'./assets/audio/scooter-loop.mp3',market:'./assets/audio/napoli-market.mp3',horn:'./assets/audio/clacson.mp3'};
const voiceSamples={
  "annunciazione": {
    "url": "./assets/audio/annunciazione.mp3",
    "text": "ANNUNCIAZIONE! ANNUNCIAZIONE!",
    "speaker": "Lello Arena · La Smorfia",
    "duration": 3.05
  },
  "andiamo": {
    "url": "./assets/audio/andiamo.mp3",
    "text": "VA BENE. CHIARO? ANDIAMO!",
    "speaker": "Totò e Carlo Croccolo",
    "duration": 1.92
  },
  "sei-sordo": {
    "url": "./assets/audio/sei-sordo.mp3",
    "text": "GONDRANO! SEI SORDO? VIENI QUA.",
    "speaker": "Totò e Carlo Croccolo",
    "duration": 4.49
  },
  "io-pago": {
    "url": "./assets/audio/io-pago.mp3",
    "text": "E IO PAGO! E IO PAGO!",
    "speaker": "Totò",
    "duration": 4.52
  },
  "vai-vai": {
    "url": "./assets/audio/vai-vai.mp3",
    "text": "VAI, VAI!",
    "speaker": "Totò",
    "duration": 3.9
  },
  "che-mangiamo": {
    "url": "./assets/audio/che-mangiamo.mp3",
    "text": "E OGGI CHE MANGIAMO? COME, OGGI CHE MANGIAMO?",
    "speaker": "Carlo Croccolo e Totò",
    "duration": 2.91
  },
  "mo-segno": {
    "url": "./assets/audio/mo-segno.mp3",
    "text": "SÌ, SÌ… MO’ ME LO SEGNO PROPRIO! NON VI PREOCCUPATE.",
    "speaker": "Massimo Troisi",
    "duration": 5.68
  },
  "ricordati": {
    "url": "./assets/audio/ricordati.mp3",
    "text": "RICORDATI CHE DEVI MORIRE… VA BENE. MO’ ME LO SEGNO PROPRIO!",
    "speaker": "Non ci resta che piangere · Troisi e il frate",
    "duration": 17.45
  },
  "scio": {
    "url": "./assets/audio/scio.mp3",
    "text": "SCIÒ, SCIÒ, CIUCCIUÈ!",
    "speaker": "Scongiuro di strada · Napoli",
    "duration": 6.96
  },
  "malocchio": {
    "url": "./assets/audio/malocchio.mp3",
    "text": "UOCCHIO, MALUOCCHIO… AGLIO, FRAVAGLIO, FATTURA CA NUN QUAGLIA!",
    "speaker": "Scongiuro di strada · Napoli",
    "duration": 5.32
  },
  "hai-scritto": {
    "url": "./assets/audio/hai-scritto.mp3",
    "text": "HAI SCRITTO? UN MOMENTO… CARTA, CALAMAIO E PENNA!",
    "speaker": "Totò e Peppino · La lettera",
    "duration": 6.16
  },
  "signorina": {
    "url": "./assets/audio/signorina.mp3",
    "text": "SIGNORINA! QUALE SIGNORINA?",
    "speaker": "Totò e Peppino · La lettera",
    "duration": 5.06
  },
  "abbondiamo": {
    "url": "./assets/audio/abbondiamo.mp3",
    "text": "PUNTO. DUE PUNTI! MA SÌ, FAI VEDERE CHE ABBONDIAMO!",
    "speaker": "Totò e Peppino · La lettera",
    "duration": 8.56
  },
  "insalata": {
    "url": "./assets/audio/insalata.mp3",
    "text": "CON L’INSALATA? NON LO CAPITE IL FILO CHE C’È?",
    "speaker": "Totò e Peppino · La lettera",
    "duration": 9.45
  },
  "faticata": {
    "url": "./assets/audio/faticata.mp3",
    "text": "MA CHE STAI FACENDO LA FATICATA? ASCIUGATI IL SUDORE!",
    "speaker": "Totò e Peppino · La lettera",
    "duration": 2.97
  },
  "parentesi": {
    "url": "./assets/audio/parentesi.mp3",
    "text": "HAI APERTO LA PARENTESI? CHIUDILA!",
    "speaker": "Totò e Peppino · La lettera",
    "duration": 2.96
  },
  "aggiungere": {
    "url": "./assets/audio/aggiungere.mp3",
    "text": "ECCO FATTO. VUOI AGGIUNGERE QUALCOSA?",
    "speaker": "Totò e Peppino · La lettera",
    "duration": 4.86
  },
  "addio": {
    "url": "./assets/audio/addio.mp3",
    "text": "ECCO FATTO. CHIUDI. ADDIO!",
    "speaker": "Totò e Peppino · La lettera",
    "duration": 3.42
  },
  "buongiorno": {
    "url": "./assets/audio/buongiorno.mp3",
    "text": "SAN GENNÀ, BUONGIORNO!",
    "speaker": "La Smorfia · San Gennaro",
    "duration": 4.96
  },
  "cliente": {
    "url": "./assets/audio/cliente.mp3",
    "text": "SAN GENNÀ… IO SONO CLIENTE QUA!",
    "speaker": "Massimo Troisi · La Smorfia",
    "duration": 6.35
  },
  "grazia": {
    "url": "./assets/audio/grazia.mp3",
    "text": "SAN GENNÀ… LA PRATICA DELLA GRAZIA!",
    "speaker": "Massimo Troisi · La Smorfia",
    "duration": 7.62
  },
  "lavorare": {
    "url": "./assets/audio/lavorare.mp3",
    "text": "SAN GENNÀ, TU LO SAI… IO NON POSSO LAVORARE!",
    "speaker": "La Smorfia · San Gennaro",
    "duration": 6.67
  },
  "soldi": {
    "url": "./assets/audio/soldi.mp3",
    "text": "SAN GENNÀ, HO BISOGNO DI QUEI SOLDI!",
    "speaker": "La Smorfia · San Gennaro",
    "duration": 5.41
  },
  "aiutare": {
    "url": "./assets/audio/aiutare.mp3",
    "text": "SAN GENNÀ… TU A ME MI PUOI AIUTARE!",
    "speaker": "La Smorfia · San Gennaro",
    "duration": 6.85
  },
  "raccomando": {
    "url": "./assets/audio/raccomando.mp3",
    "text": "SAN GENNÀ, MI RACCOMANDO!",
    "speaker": "La Smorfia · San Gennaro",
    "duration": 6.62
  },
  "importante": {
    "url": "./assets/audio/importante.mp3",
    "text": "DEVO FARE UNA COSA IMPORTANTE!",
    "speaker": "Massimo Troisi · La Smorfia",
    "duration": 4.88
  },
  "aspetta": {
    "url": "./assets/audio/aspetta.mp3",
    "text": "ASPETTA, ASPETTA!",
    "speaker": "Massimo Troisi · La Smorfia",
    "duration": 2.15
  },
  "celestiale": {
    "url": "./assets/audio/celestiale.mp3",
    "text": "MI HA MANDATO GABRIELE. DEVO CREARE L’ATMOSFERA CELESTIALE!",
    "speaker": "La Smorfia · L’annunciazione",
    "duration": 7.6
  }
};
const voiceEvents={
  go:['annunciazione','raccomando','buongiorno','andiamo','importante','cliente'],
  near:['sei-sordo','aspetta','signorina','hai-scritto','insalata','faticata','cliente','importante'],
  crash:['ricordati'],
  pizza:['che-mangiamo','io-pago','abbondiamo','insalata','aggiungere'],
  power:['celestiale','grazia','raccomando','andiamo','vai-vai','abbondiamo'],
  magnet:['malocchio','scio','grazia','aiutare','raccomando'],
  nonna:['sei-sordo','signorina','aspetta','faticata','hai-scritto'],
  landmark:['abbondiamo','aggiungere','celestiale','buongiorno','cliente']
};
const audio={ctx:null,enabled:true,gain:null,bgm:null,engine:null,market:null,horns:[],clips:{},currentVoice:null,currentJob:null,pending:[],history:[],lastVoice:-100000,nextVoiceAt:0,gapUntil:0,lastHorn:-100000,nextTrafficHorn:0,started:false,mix:{music:.23,voices:.9,ambience:.62},preview:0};
try{const saved=JSON.parse(localStorage.getItem('napoli-run-mix')||'null');for(const k of ['music','voices','ambience'])if(Number.isFinite(saved?.[k]))audio.mix[k]=clamp(saved[k],0,1);}catch{}
function audioElement(url,id,loop=false){const a=new Audio(url);a.loop=loop;a.preload='auto';a.id=id;a.hidden=true;document.body.appendChild(a);return a;}
function primeAudio(){
  if(typeof Audio==='undefined'||audio.bgm)return;
  audio.bgm=audioElement(assetURLs.music,'tarantella',true);audio.engine=audioElement(assetURLs.engine,'motore-reale',true);audio.engine.preservesPitch=false;audio.market=audioElement(assetURLs.market,'mercato-napoli',true);
  for(let i=0;i<2;i++){const horn=audioElement(assetURLs.horn,'clacson-'+i);horn.preservesPitch=false;horn.playbackRate=i===0?1:.87;audio.horns.push(horn);}
  for(const [key,sample] of Object.entries(voiceSamples)){const clip=audioElement(sample.url,'voce-'+key);clip.volume=audio.mix.voices;clip.onended=()=>finishVoice(clip);clip.onerror=()=>finishVoice(clip);audio.clips[key]=clip;}
  applyAudioMix(true);
}
function initAudio(){primeAudio();if(!audio.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)try{audio.ctx=new AC();audio.gain=audio.ctx.createGain();audio.gain.gain.value=.15;audio.gain.connect(audio.ctx.destination);}catch{audio.ctx=null;}}audio.ctx?.resume()?.catch(()=>{});}
function previewLabel(){const b=$('sampleVoice');if(b){b.disabled=!!audio.currentVoice;b.textContent=audio.currentVoice?'IN ASCOLTO… FINO ALL’ULTIMA PAROLA':'ASCOLTA LA PROSSIMA VOCE ♫';}}
function finishVoice(clip){if(audio.currentVoice!==clip)return;audio.currentVoice=null;audio.currentJob=null;audio.gapUntil=performance.now()+450;audio.nextVoiceAt=performance.now()+9000+Math.random()*4000;$('voiceCaption').classList.remove('show');previewLabel();applyAudioMix(true);}
// Only a failed media play is cancelled. Game events never stop or rewind speech.
function stopVoice(){if(audio.currentVoice){const clip=audio.currentVoice;clip.pause();finishVoice(clip);}audio.pending.length=0;}
function applyAudioMix(immediate=false){
  const speaking=!!audio.currentVoice&&!audio.currentVoice.paused,nearest=objects.filter(o=>o.type==='scooter'&&o.z>-42&&o.z<14).sort((a,b)=>Math.abs(a.z-PLAYER_Z)-Math.abs(b.z-PLAYER_Z))[0],proximity=nearest?Math.max(0,1-Math.abs(nearest.z-PLAYER_Z)/42):0;
  const adjust=(element,target)=>{if(element)element.volume=clamp(immediate?target:lerp(element.volume,target,.12),0,1);};
  adjust(audio.bgm,audio.enabled?audio.mix.music*(speaking?.23:1):0);
  adjust(audio.engine,audio.enabled?audio.mix.ambience*(.48+proximity*.5)*(speaking?.38:1):0);
  adjust(audio.market,audio.enabled?audio.mix.ambience*(zone===2?.12:zone===1?.48:.32)*(speaking?.3:1):0);
  if(audio.currentVoice)audio.currentVoice.volume=audio.enabled?audio.mix.voices:0;
  for(const horn of audio.horns)horn.volume=audio.enabled?audio.mix.ambience*.8*(speaking?.35:1):0;
  if(audio.engine)audio.engine.playbackRate=clamp(.88+speed*.004+proximity*.24,.93,1.6);
}
function syncAudio(){
  const active=audio.enabled&&(state==='running'||state==='countdown');
  for(const element of [audio.bgm,audio.engine,audio.market]){if(!element)continue;if(active)element.play().catch(()=>{});else element.pause();}
  if(!active)for(const horn of audio.horns)horn.pause();
  if(audio.currentVoice){if(!audio.enabled||state==='paused'||audio.mix.voices===0)audio.currentVoice.pause();else if(audio.currentVoice.paused)audio.currentVoice.play().catch(()=>{});}
  applyAudioMix(true);
}
function chooseVoice(event){
  const choices=(voiceEvents[event]||[event]).filter(k=>audio.clips[k]);if(!choices.length)return null;
  // Prefer the least recently heard group. History survives retries and menu visits.
  let candidates=choices.filter(k=>!audio.history.slice(-8).includes(k));
  if(!candidates.length){let oldest=Infinity;candidates=[];for(const k of choices){const rank=audio.history.lastIndexOf(k);if(rank<oldest){oldest=rank;candidates=[k];}else if(rank===oldest)candidates.push(k);}}
  return candidates[Math.floor(Math.random()*candidates.length)];
}
function pumpVoices(){
  if(audio.currentVoice||!audio.enabled||audio.mix.voices===0||state==='paused')return;
  const now=performance.now();audio.pending=audio.pending.filter(j=>j.expires>now);
  if(now<audio.gapUntil||!audio.pending.length)return;
  const job=audio.pending.shift(),key=chooseVoice(job.event);if(!key)return;
  const clip=audio.clips[key];audio.currentVoice=clip;audio.currentJob=job;audio.lastVoice=now;audio.history.push(key);if(audio.history.length>40)audio.history.shift();
  clip.currentTime=0;clip.volume=audio.mix.voices;const sample=voiceSamples[key];$('voiceText').textContent=sample.text;$('voiceSpeaker').textContent=sample.speaker;$('voiceCaption').classList.add('show');previewLabel();
  clip.play().then(()=>{if(audio.currentVoice===clip)applyAudioMix(true);}).catch(()=>finishVoice(clip));applyAudioMix(true);
}
function voice(event,priority=false){
  if(!audio.enabled||audio.mix.voices===0||state==='paused')return false;
  const now=performance.now();if(!priority&&(audio.currentVoice||now<audio.nextVoiceAt||audio.pending.length))return false;
  if(!(voiceEvents[event]||[event]).some(k=>audio.clips[k]))return false;
  if(audio.currentJob?.event===event||audio.pending.some(j=>j.event===event))return false;
  const lasting=event==='go'||!!voiceSamples[event];const job={event,expires:event==='crash'?Infinity:now+(lasting?20000:priority?5000:3000)};
  if(event==='crash')audio.pending=audio.pending.filter(j=>j.event==='go'||j.event==='annunciazione');
  if(audio.pending.length>=2)audio.pending.pop();audio.pending.push(job);pumpVoices();return true;
}
function trafficHorn(){
  const now=performance.now();if(!audio.enabled||state!=='running'||audio.mix.ambience===0||now-audio.lastHorn<4500)return false;
  const horn=audio.horns.find(h=>h.paused||h.ended);if(!horn)return false;
  audio.lastHorn=now;horn.currentTime=0;horn.playbackRate=.88+Math.random()*.18;applyAudioMix(true);horn.play().catch(()=>{});return true;
}
function tickAudio(){pumpVoices();if(state==='running'&&performance.now()>audio.nextTrafficHorn){audio.nextTrafficHorn=performance.now()+7500+Math.random()*6500;trafficHorn();}}
function voiceForText(text){const t=text.toUpperCase();if(t.includes('MALOCCHIO'))voice('magnet');else if(t.includes('FORZA')||t.includes('PIEDE DE DIOS')||t.includes('TAZZULELLA'))voice('power');else if(t.includes('PIZZA')||t.includes('PIZZAAA'))voice('pizza');else if(t.includes('MA CHE')||t.includes('UÈ')||t.includes('UEEE'))voice('near');}
function tone(freq,duration=.1,type='sine',vol=.3,delay=0,finish){if(!audio.enabled||!audio.ctx)return;const t=audio.ctx.currentTime+delay;const o=audio.ctx.createOscillator(),g=audio.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(finish)o.frequency.exponentialRampToValueAtTime(Math.max(20,finish),t+duration);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(audio.gain);o.start(t);o.stop(t+duration+.02);}
function sound(kind){if(kind==='coin'){tone(740,.09,'sine',.25);tone(1110,.14,'sine',.2,.07);}if(kind==='jump')tone(210,.15,'triangle',.3,0,520);if(kind==='slide')tone(140,.14,'triangle',.2,0,65);if(kind==='horn')trafficHorn();if(kind==='crash'){tone(180,.35,'sawtooth',.25,0,30);tone(560,.4,'triangle',.3,.15,70);}if(kind==='power'){[392,494,587,784].forEach((f,i)=>tone(f,.2,'triangle',.25,i*.08));}if(kind==='near'){tone(880,.12,'triangle',.25);tone(1175,.2,'triangle',.2,.09);}}
function music(){applyAudioMix();}
function toast(text,duration=1.7,speak=true){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=performance.now()+duration*1000;if(speak)voiceForText(text);}
function updateDistrict(force=false){const next=Math.floor(distance/450)%4;if(next!==zone||force){zone=next;const d=districts[zone];$('districtName').textContent=d.name;$('districtDesc').textContent=d.desc;$('districtIndex').textContent=`0${zone+1} / IL GIRO DI NAPOLI`;document.querySelectorAll('.district-track i').forEach((e,i)=>e.classList.toggle('active',i===zone));sea.visible=zone===2;if(!force)toast(`BENVENUTO A ${d.name.toUpperCase()}!`,2.3);}}
function multiplier(){return (1+Math.min(combo,4))*(power==='espresso'?2:1);}
function updateHUD(){score=Math.floor(distancePoints+bonus);$('score').textContent=String(score).padStart(5,'0');$('distance').textContent=Math.floor(distance);$('coins').textContent=coins;$('multiplier').textContent='×'+multiplier();$('powerHud').classList.toggle('expiring',!!power&&powerLeft<=1.2);if(power){$('powerTime').style.width=(powerLeft/powerDefs[power].duration*100)+'%';}}
function setState(next){state=next;document.body.classList.toggle('playing',next==='running'||next==='paused'||next==='countdown');$('menu').classList.toggle('hidden',next!=='menu');$('hud').classList.toggle('hidden',next==='menu');$('pause').classList.toggle('hidden',next==='menu'||next==='over'||next==='crashed');$('touch').classList.toggle('hidden',next!=='running');menuTraffic.visible=next==='menu';syncAudio();}
function closeModal(){$('modal').classList.add('hidden');}
function showModal(html,allowClose=true){$('modalContent').innerHTML=html;$('modalContent').querySelector('h2').id='modalTitle';$('modal').classList.remove('hidden');$('closeModal').classList.toggle('hidden',!allowClose);const focus=$('modalContent').querySelector('button');if(focus)focus.focus();}
function reset(){audio.pending.length=0;for(const o of [...objects])removeObject(o);for(const p of particles)scene.remove(p.mesh);particles.length=0;distance=distancePoints=score=coins=bonus=elapsed=row=combo=0;speed=18;lane=1;playerX=jumpY=velocityY=slide=0;lastNear=-20;spawnDistance=32;power=null;powerLeft=0;powerSerial=0;nextPowerTime=18;zone=0;runner.position.set(0,0,PLAYER_Z);body.rotation.set(0,Math.PI,0);body.scale.set(1,1,1);shield.visible=auraPizza.visible=football.visible=false;$('powerHud').classList.add('hidden');for(let i=0;i<segments.length;i++){const g=segments[i];g.position.z=28-i*18;g.userData.courseDistance=i*18;disposeSegment(g);buildSegment(g,i,0);}updateDistrict(true);updateHUD();}
function start(){initAudio();const ending=audio.pending.filter(j=>j.event==='crash');closeModal();reset();audio.pending=ending;setState('countdown');countdown=2.4;audio.nextTrafficHorn=performance.now()+5000;voice(audio.started?'go':'annunciazione',true);audio.started=true;$('countdown').textContent='3';$('toast').classList.remove('show');}
function pauseGame(){if(state==='running'){setState('paused');showModal(`<div class="modal-eyebrow">NA TAZZULELLA ’E CAFÈ?</div><h2>UN ATTIMO DI PACE.</h2><p>Pure i motorini, ogni tanto, si fermano.</p><button class="primary" id="resume">RIPRENDI <span>▶</span></button><button class="secondary" id="backMenu">TORNA AL MENU</button>`,false);$('resume').onclick=resume;$('backMenu').onclick=goMenu;}else if(state==='paused')resume();}
function resume(){closeModal();setState('running');}
function goMenu(){closeModal();reset();setState('menu');$('bestMenu').textContent=best.toLocaleString('it-IT');}
function instructions(){showModal(`<div class="modal-eyebrow">LA CITTÀ È TUA. PIÙ O MENO.</div><h2>STATTE ACCORTO!</h2><p>Corri, raccogli pizze e schiva i motorini. La strada cambia ogni 450 metri.</p><div class="instruction-row"><b>Cambia corsia</b><span><kbd>A</kbd><kbd>D</kbd> / <kbd>←</kbd><kbd>→</kbd></span></div><div class="instruction-row"><b>Salta casse e buche</b><span><kbd>SPAZIO</kbd> / <kbd>W</kbd></span></div><div class="instruction-row"><b>Scivola sotto il bucato</b><span><kbd>↓</kbd> / <kbd>S</kbd></span></div><div class="instruction-row"><b>Pausa</b><span><kbd>P</kbd> / <kbd>ESC</kbd></span></div><div class="power-list">🍕 <b>Super Pizza:</b> 4 secondi di invincibilità.<br>⚽ <b>Maradona:</b> rarissimo: 3 secondi per liberare la strada.<br>☕ <b>Espresso:</b> 3,5 secondi di velocità e punti doppi.<br>🌶️ <b>Cornicello:</b> attira le fette per 5 secondi.</div><p>I bonus lampeggiano quando stanno per finire. La velocità continua a crescere: statte accorto!</p><p>Su telefono: scorri nelle quattro direzioni o usa i pulsanti. Sfiora i motorini per aumentare il moltiplicatore!</p><div class="audio-mix"><b>IL SUONO DEL VICO</b><label>Musica <input id="mixMusic" type="range" min="0" max="100" aria-label="Volume musica" value="${Math.round(audio.mix.music*100)}"></label><label>Voci vere <input id="mixVoices" type="range" min="0" max="100" aria-label="Volume voci" value="${Math.round(audio.mix.voices*100)}"></label><label>Motorini e strada <input id="mixAmbience" type="range" min="0" max="100" aria-label="Volume ambiente" value="${Math.round(audio.mix.ambience*100)}"></label><button class="sample-button" id="sampleVoice">ASCOLTA LA PROSSIMA VOCE ♫</button><p class="audio-credits" id="sampleCaption" aria-live="polite"></p><p class="audio-credits">28 campioni umani: Totò, Peppino, Troisi, La Smorfia e scongiuri di strada. Ogni battuta arriva fino in fondo; la prossima aspetta il suo turno. Le scritte comiche del gioco restano nostre.<br>Fonti: <a href="https://www.youtube.com/watch?v=JfQo52M08qA" target="_blank" rel="noopener">Totò e Croccolo</a> · <a href="https://www.youtube.com/watch?v=eBP9QDSr0HI" target="_blank" rel="noopener">Troisi</a> · <a href="https://www.youtube.com/watch?v=SzrEfkjdzgw" target="_blank" rel="noopener">La lettera</a> · <a href="https://www.youtube.com/watch?v=XzM4Mbrp14U" target="_blank" rel="noopener">La Smorfia / Rai</a> · <a href="https://www.youtube.com/watch?v=jnMySGnMWV0" target="_blank" rel="noopener">L’annunciazione</a> · <a href="https://www.youtube.com/watch?v=0_KVeQpHjWY" target="_blank" rel="noopener">Sciò sciò</a>.<br>Mercato di Porta Nolana: Arnaud Coutancier, <a href="https://freesound.org/people/arnaud%20coutancier/sounds/46298/" target="_blank" rel="noopener">CC BY-NC 3.0</a>. Gilera Runner: <a href="https://freesound.org/people/lovretta/sounds/140384/" target="_blank" rel="noopener">lovretta, CC0</a>. Clacson: <a href="https://freesound.org/people/KRAFTWERK2K1/sounds/32417/" target="_blank" rel="noopener">KRAFTWERK2K1, CC0</a>.</p></div><button class="primary" id="gotIt">AGGIO CAPITO! <span>✓</span></button>`);$('gotIt').onclick=closeModal;for(const [id,key] of [['mixMusic','music'],['mixVoices','voices'],['mixAmbience','ambience']])$(id).oninput=e=>{audio.mix[key]=Number(e.target.value)/100;syncAudio();try{localStorage.setItem('napoli-run-mix',JSON.stringify(audio.mix));}catch{}};$('sampleVoice').onclick=()=>{initAudio();if(!audio.enabled){audio.enabled=true;$('audioState').textContent='ON';$('audio').setAttribute('aria-label','Disattiva audio');syncAudio();}if(audio.currentVoice)return;const keys=Object.keys(voiceSamples),key=keys[audio.preview++%keys.length];voice(key,true);$('sampleCaption').textContent=voiceSamples[key].speaker+' — '+voiceSamples[key].text;};previewLabel();$('modalContent').parentElement.scrollTop=0;$('modalTitle').tabIndex=-1;$('modalTitle').focus({preventScroll:true});}
function crash(){if(state!=='running')return;setState('crashed');crashTime=.85;sound('crash');toast('MARONN’ MIA!',1.2);voice('crash',true);burst(playerX,1.5,PLAYER_Z,0xffe3a1,25);}
function gameOver(){setState('over');const previous=best;best=Math.max(best,score);try{localStorage.setItem('napoli-run-best-v1',String(best));}catch{}showModal(`<div class="modal-eyebrow">${score>previous?'NUOVO RECORD. SEI ’NU FENOMENO!':'IL MOTORINO AVEVA LA PRECEDENZA.'}</div><h2>MARONN’ MIA!</h2><p>T’aggio ditto ’e sta’ accorto!<br>La pizza è salva. L’orgoglio, un po’ meno.</p><div class="result-score">${score.toLocaleString('it-IT')}</div><div class="result-label">PUNTI DI PURO CAOS</div><div class="result-stats"><div><small>RECORD</small><b>${best.toLocaleString('it-IT')}</b></div><div><small>DISTANZA</small><b>${Math.floor(distance)} m</b></div><div><small>PIZZE</small><b>🍕 ${coins}</b></div></div><button class="primary" id="retry">RIPROVA <span>↻</span></button><button class="secondary" id="backMenu">TORNA AL MENU</button>`,false);$('retry').onclick=start;$('backMenu').onclick=goMenu;}
function action(a){if(state!=='running'&&state!=='countdown')return;if(a==='left')lane=Math.max(0,lane-1);if(a==='right')lane=Math.min(2,lane+1);if(a==='jump'&&jumpY<.025&&velocityY<=0){slide=0;velocityY=10.8;sound('jump');}if(a==='slide'&&jumpY<.25){slide=.83;sound('slide');}}
function activatePower(key){power=key;powerLeft=powerDefs[key].duration;const def=powerDefs[key];$('powerHud').classList.remove('hidden','expiring');$('powerName').textContent=def.name;$('powerIcon').textContent=def.icon;sound('power');toast(def.line,2.3,false);voice(key==='magnet'?'magnet':key==='pizza'?'pizza':'power',true);burst(playerX,1.5,PLAYER_Z,def.color,22);}
function collect(o){coins++;bonus+=50*multiplier();sound('coin');burst(o.mesh.position.x,o.mesh.position.y,o.mesh.position.z,0xffc746,6);removeObject(o);}
function spawnRow(){row++;const safe=row<3?1:Math.floor(Math.random()*3);const blocked=[0,1,2].filter(l=>l!==safe);const count=row<3?1:Math.random()<Math.min(.8,.35+distance/1800)?2:1;
  for(let i=0;i<count;i++){let type='scooter';if(row>3&&Math.random()<.38){const types=['crate','pothole','pizza','rubbish','chair','laundry','cart'];type=types[Math.floor(Math.random()*types.length)];}const variant=Math.floor(Math.random()*8);const drive=type==='scooter'?7+variant*.5:0;createObstacle(type,blocked[i],-122-drive*(126/speed),variant);}
  for(let i=0;i<5;i++)createCoin(safe,-120-i*2.4,1.05);
  if(elapsed>=nextPowerTime){const roll=Math.random();const key=roll<.06?'maradona':roll<.27?'pizza':roll<.62?'espresso':'magnet';createPower(key,safe,-122);powerSerial++;nextPowerTime=elapsed+22+Math.random()*12;}
  spawnDistance+=Math.max(30,speed*(1.48-Math.min(.28,distance/10000)))+Math.random()*6;
}
function animateRunner(t,dt){const running=state==='running'||state==='countdown'||state==='menu';const stride=running?Math.sin(t*(state==='menu'?7:12+speed*.13)):0;for(let i=0;i<2;i++){legs[i].rotation.x=jumpY>.1?(i===0?-.8:.65):slide>0?-.8:stride*(i===0?.8:-.8);arms[i].rotation.x=jumpY>.1?-1.7:stride*(i===0?-.7:.7);arms[i].rotation.z=i===0?.12:-.12;}
  if(state!=='crashed'&&state!=='over'){body.position.y=slide>0?-.4:Math.abs(stride)*.055;body.scale.y=lerp(body.scale.y,slide>0?.55:1,1-Math.exp(-20*dt));body.rotation.x=lerp(body.rotation.x,slide>0?-.45:.08,1-Math.exp(-15*dt));body.rotation.z=lerp(body.rotation.z,(playerX-lanes[lane])*.09,1-Math.exp(-12*dt));}
}
function update(dt,t){
  tickAudio();
  if(performance.now()>toastUntil)$('toast').classList.remove('show');
  if(state==='countdown'){countdown-=dt;$('countdown').textContent=countdown>1.6?'3':countdown>.8?'2':countdown>0?'1':'VAI!';if(countdown<=-.35){$('countdown').textContent='';setState('running');toast('GUAGLIÒ, STATTE ACCORTO!',1.6);}}
  const isMoving=state==='running';
  if(isMoving){elapsed+=dt;const baseSpeed=18+distance/190;speed=baseSpeed*(power==='espresso'?1.23:1);const dz=speed*dt;distance+=dz;distancePoints+=dz*10*multiplier();
    playerX=lerp(playerX,lanes[lane],1-Math.exp(-13*dt));if(jumpY>0||velocityY>0){jumpY+=velocityY*dt;velocityY-=27*dt;if(jumpY<=0){jumpY=velocityY=0;}}if(slide>0)slide-=dt;runner.position.set(playerX,jumpY,PLAYER_Z);
    if(distance>spawnDistance)spawnRow();
    if(elapsed-lastNear>8)combo=0;
    if(power){powerLeft-=dt;if(powerLeft<=0){power=null;$('powerHud').classList.add('hidden');}}
    const effectVisible=powerLeft>1.2||Math.floor(powerLeft*10)%2===0;shield.visible=power==='pizza'&&effectVisible;auraPizza.visible=power==='pizza'&&effectVisible;football.visible=power==='maradona'&&effectVisible;if(shield.visible){shield.rotation.y=t;shield.material.opacity=.2+Math.sin(t*7)*.07;auraPizza.rotation.y=t*2;auraPizza.rotation.z=Math.sin(t*3)*.08;}if(football.visible){football.position.x=.6+Math.sin(t*7)*.3;football.rotation.x=t*8;}
    for(const seg of segments){seg.position.z+=dz;if(seg.position.z>46){seg.position.z-=segmentCount*segmentLength;seg.userData.courseDistance+=segmentCount*segmentLength;const nextZone=Math.floor(seg.userData.courseDistance/450)%4;disposeSegment(seg);buildSegment(seg,seg.userData.index,nextZone);}}
    for(const o of [...objects]){
      const oldZ=o.z;o.z+=dz+(o.driveSpeed||0)*dt;o.mesh.position.z=o.z;const xDiff=Math.abs(o.mesh.position.x-playerX);
      if(o.type==='coin'||o.type==='power'){o.mesh.rotation.y=Math.sin(t*2+o.z)*.35;o.mesh.position.y=o.baseY+Math.sin(t*4+o.z)*.1;if(power==='magnet'&&o.type==='coin'&&o.z>-16&&o.z<PLAYER_Z+2){o.mesh.position.x=lerp(o.mesh.position.x,playerX,dt*9);o.mesh.position.y=lerp(o.mesh.position.y,jumpY+1,dt*9);}const pickX=Math.abs(o.mesh.position.x-playerX);if(Math.abs(o.z-PLAYER_Z)<1.5&&pickX<1.15&&(o.type==='power'||Math.abs(o.mesh.position.y-(jumpY+1.05))<1.6)){if(o.type==='coin')collect(o);else{activatePower(o.key);removeObject(o);}continue;}}
      else{
        if(o.type==='scooter'){for(const wheel of o.mesh.userData.wheels||[])wheel.rotation.x-=dt*(o.driveSpeed||7)*3;o.mesh.rotation.z=Math.sin(t*5+o.variant)*.035;const rider=o.mesh.userData.rider;if(rider)rider.rotation.z=Math.sin(t*7+o.variant)*.045;if(!o.honked&&o.z>-22){o.honked=true;if(o.variant===2)voice('nonna');if(Math.random()<.38)sound('horn');}}
        if(power==='maradona'&&o.z>-23&&o.z<PLAYER_Z+1){burst(o.mesh.position.x,1.4,o.z,0x73e4f1,10);bonus+=80;removeObject(o);continue;}
        // Swept crossing covers even a slow frame; only one reaction is evaluated per object.
        if(!o.passed&&oldZ<PLAYER_Z+1.1&&o.z>=PLAYER_Z-1.1){
          const hit=xDiff<1.0;const low=['crate','pothole','pizza','rubbish'].includes(o.type);const evaded=o.type==='laundry'?slide>0&&jumpY<.3:low?jumpY>1.05:false;
          if(hit&&!evaded){if(power==='pizza'){burst(o.mesh.position.x,1,o.z,0xffcd4b,14);bonus+=60;removeObject(o);continue;}crash();break;}
          if(o.z>=PLAYER_Z){o.passed=true;if(o.type==='scooter'&&xDiff<3.45){combo=elapsed-lastNear<8?Math.min(combo+1,4):1;lastNear=elapsed;bonus+=100*multiplier();toast(`${quotes[Math.floor(Math.random()*quotes.length)]}  +${100*multiplier()}`,1.3);sound('near');}else if(hit&&evaded){bonus+=40*multiplier();burst(playerX,.4,PLAYER_Z,0xffedb5,5);}}
        }
      }
      if(o.z>15)removeObject(o);
    }
    updateDistrict();updateHUD();music();
  }
  if(state==='crashed'){crashTime-=dt;body.rotation.z+=dt*7;body.rotation.x-=dt*2;runner.position.y=Math.max(0,Math.sin((.85-crashTime)*4)*1.2);if(crashTime<=0)gameOver();}
  if(state==='menu'){runner.position.x=-1.7;demoA.position.z=-80+((t*6+70)%96);demoB.position.z=-90+((t*5+42)%106);demoC.position.z=-85+((t*7+15)%101);for(const demo of [demoA,demoB,demoC])for(const wheel of demo.userData.wheels||[])wheel.rotation.x-=dt*18;demoA.rotation.z=Math.sin(t*2)*.035;demoA.userData.rider.rotation.z=Math.sin(t*2)*.06;demoB.rotation.z=Math.sin(t*2+2)*.035;}
  if(state!=='paused')animateRunner(t,dt);
  for(const p of [...particles]){p.life-=dt;p.v.y-=12*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.x+=dt*4;p.mesh.rotation.z+=dt*6;p.mesh.scale.setScalar(Math.max(.03,p.life*.18));if(p.life<=0){scene.remove(p.mesh);particles.splice(particles.indexOf(p),1);}}
  const menu=state==='menu';const portrait=innerWidth<750;const cameraX=menu?(portrait?-3.9:-4.5):playerX*.13;
  camera.position.x=lerp(camera.position.x,cameraX,1-Math.exp(-4*dt));camera.position.y=lerp(camera.position.y,menu?6.3:portrait?7.5:6.6,1-Math.exp(-4*dt));camera.position.z=lerp(camera.position.z,menu?14.5:portrait?17.6:13.7,1-Math.exp(-4*dt));camera.lookAt(camera.position.x,1.2,-21);
}
camera.position.set(-4.5,6.3,14.5);camera.lookAt(-4.5,1.2,-21);
function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<750?65:56;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();updateDistrict(true);
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.045);last=now;update(dt,now/1000);renderer.render(scene,camera);}requestAnimationFrame(frame);
$('play').onclick=start;$('instructions').onclick=instructions;$('pause').onclick=pauseGame;$('home').onclick=e=>{e.preventDefault();if(state==='running')pauseGame();else if(state==='menu')closeModal();};$('closeModal').onclick=closeModal;
$('audio').onclick=()=>{initAudio();audio.enabled=!audio.enabled;$('audioState').textContent=audio.enabled?'ON':'OFF';$('audio').setAttribute('aria-label',audio.enabled?'Disattiva audio':'Attiva audio');syncAudio();if(audio.enabled)sound('coin');};
addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown',' ','escape'].includes(key))e.preventDefault();if(e.repeat)return;if(key==='p'||key==='escape'){if(!$('modal').classList.contains('hidden')&&state==='menu')closeModal();else pauseGame();return;}if(!$('modal').classList.contains('hidden'))return;const map={a:'left',arrowleft:'left',d:'right',arrowright:'right',w:'jump',arrowup:'jump',' ':'jump',s:'slide',arrowdown:'slide'};if(map[key])action(map[key]);});
addEventListener('blur',()=>{if(state==='running')pauseGame();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pauseGame();});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();action(b.dataset.action);}));
let touchStart=null;$('world').addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};});$('world').addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;action(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy<0?'jump':'slide');});

// Optional browser agent tools operate the same public game actions.
const modelContext=document.modelContext;
if(modelContext?.registerTool){const lifecycle=new AbortController();const tools=[{name:'read_game_state',description:'Read the current Napoli Run score, district, and game status.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({state,score,distance:Math.floor(distance),coins,best,district:districts[zone].name})},{name:'start_napoli_run',description:'Start or restart Napoli Run from the main menu or game-over screen.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:()=>{if(!['menu','over'].includes(state))throw new Error('La partita è già in corso.');start();return {state};}}];for(const tool of tools)try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}

// Preload recordings before the first click; playback starts only on user interaction.
primeAudio();

// Read-only diagnostics for repeatable local validation.
window.napoliRun={getState:()=>({state,distance,score,coins,best,speed,lane,playerX,jumpY,slide,power,combo,zone,audio:{voice:audio.currentVoice?.id||null,voiceTime:audio.currentVoice?.currentTime||0,pending:audio.pending.map(j=>j.event),voices:Object.keys(voiceSamples).length,engineVolume:audio.engine?.volume||0,history:audio.history.slice(-8)},objects:objects.map(o=>({type:o.type,lane:o.lane,z:o.z,key:o.key,driveSpeed:o.driveSpeed}))})};

