/*<script src="https://cdn.jsdelivr.net/gh/studio-freight/lenis@1/bundled/lenis.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/vallafederico/glsl-gradient-webflow@master/dist/app.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/vallafederico/hacking-webflow@master/dist/text-split.03.js"></script>
<script async src="https://unpkg.com/es-module-shims@1.6.3/dist/es-module-shims.js"></script>
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three/build/three.module.js",
    "three/": "https://unpkg.com/three/"
  }
}
</script>
<script type="module">*/
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import MeshTransmissionMaterialImpl from 'https://afterlight.sfo2.digitaloceanspaces.com/shared/troika/transmissionMaterial.js'

let logoModel
let logoTextModel
let scene, camera, canvas, composer, renderer, clock, renderPass
let spotLight, spotLight2, areaLight
let sickassGlass
let mouseX, mouseY, sparkles1, sparkles2

const bloomparams = {
	exposure: 1,
	bloomStrength: 0.5,
	bloomThreshold: 0.85,
	bloomRadius: 0.33
}

const initLenis = () => {
    const lenis = new Lenis({ duration: 1.3, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), orientation: 'vertical', gestureOrientation: 'vertical', smoothWheel: true, smoothTouch: false, touchMultiplier: 2, infinite: false,})
    function raf(time) {
        lenis.raf(time)
        requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
}

init()
function init() {

	initLenis()
  
  const objectsDistance = 3
  let scrollY = window.scrollY
  
  window.addEventListener('scroll', () => {
  	scrollY = window.scrollY
  })
  
  var width = window.innerWidth
  var height = window.innerHeight
  let mouseX = 0
  let mouseY = 0

  document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
  })
  
  const textureLoader = new THREE.TextureLoader()

  canvas = document.querySelector('canvas.webgl')
  renderer = new THREE.WebGLRenderer({
  	alpha: true,
    canvas: canvas,
    antialias: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) )
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMappingExposure = 1
  renderer.gammaInput = true
  renderer.gammaOutput = true
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  renderer.toneMapping = THREE.ReinhardToneMapping

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set( 0, 0, 4.5 )
  camera.lookAt( 0, 0, 0 )
  scene.add(camera)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.enableZoom = false
  controls.minAzimuthAngle = -(Math.PI / 10)
  controls.maxAzimuthAngle = Math.PI / 10
  controls.enabled = false

  areaLight = new THREE.HemisphereLight( 0xffffff, 0x000000, 20 )
  //scene.add(areaLight)

  const al = new THREE.AmbientLight(0x2a2a2a, 20);
  scene.add( al )

  spotLight = new THREE.SpotLight( 0xffffff, 10 )
  spotLight.position.set( 0, 0, 0 )
  spotLight.angle = Math.PI / 3
  spotLight.penumbra = 1
  spotLight.distance = 50
  spotLight.intensity = 100.0
  spotLight.focus = 1.0
  spotLight.decay = 1
  spotLight.castShadow = false
  spotLight.target.position.set(0, 0, -20)
  camera.add( spotLight )
  camera.add( spotLight.target )
  
  const video = document.getElementById( 'video' )
  const videoTex = new THREE.VideoTexture( video )
  const plane = new THREE.PlaneGeometry(5, 2)
  const material = new THREE.MeshBasicMaterial({ map: videoTex })
  const backdrop = new THREE.Mesh(plane, material)
  backdrop.scale.multiplyScalar(2)
  backdrop.position.set( 0,0,0 )
  backdrop.position.z = -7
  scene.add(backdrop)
  //backdrop.position.y = 100//- ( window.innerHeight / 2 ) / 1.5
  
  const hdrEquirect = new RGBELoader().load(
    "https://afterlight.sfo2.digitaloceanspaces.com/shared/troika/dancing_hall_1k.hdr",
    () => {
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
  )

  const textMat = new THREE.MeshPhysicalMaterial({
      metalness: 1.0,
      roughness: 0.1,
      thickness: 0.1,
      side: THREE.DoubleSide,
  })
	
  //let otherNormal = "https://afterlight.sfo2.digitaloceanspaces.com/shared/troika/normal.jpg"
	const normalMapTex = textureLoader.load("https://uploads-ssl.webflow.com/640267beea11d62d4c670caa/64562480fc489551f75c6ad0_normal-min.jpg")
  normalMapTex.wrapS = THREE.RepeatWrapping
  normalMapTex.wrapT = THREE.RepeatWrapping
  normalMapTex.repeat.set(4, 4)
  sickassGlass = Object.assign(new MeshTransmissionMaterialImpl(10), {
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      transmission: 1,
      chromaticAberration: 0.02,
      anistropy: 0.4,
      roughness: 0.08,
      envMap: hdrEquirect,
      envMapIntensity: 1.5,
      thickness: 3,
      ior: 1.1,
      distortion: 0.5,
      distortionScale: 0.4,
      temporalDistortion: 0.6,
      //normalScale: new THREE.Vector2(2),
      //normalMap: normalMapTex,
  })

  const getRandomParticelPos = (particleCount) => {
      const arr = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
      	arr[i] = (Math.random() - 0.5) * 10;
      }
      return arr;
  }

  const sparkleGeos = [new THREE.BufferGeometry(), new THREE.BufferGeometry()]
  sparkleGeos[0].setAttribute("position",new THREE.BufferAttribute(getRandomParticelPos(350), 3))
  sparkleGeos[1].setAttribute("position",new THREE.BufferAttribute(getRandomParticelPos(1500), 3))
  const sparkleMats = [
  	new THREE.PointsMaterial({size: 0.05,map: textureLoader.load("https://uploads-ssl.webflow.com/640267beea11d62d4c670caa/6456e474861910efcebc5cae_sparkle1.png"),transparent: true}),
    new THREE.PointsMaterial({size: 0.075,map: textureLoader.load("https://uploads-ssl.webflow.com/640267beea11d62d4c670caa/6456e47757b421045d4ea093_sparkle2.png"),transparent: true})
  ]

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    bloomparams.bloomStrength,
    bloomparams.bloomRadius,
    bloomparams.bloomThreshold
  )

  sparkles1 = new THREE.Points(sparkleGeos[0], sparkleMats[0])
  sparkles2 = new THREE.Points(sparkleGeos[1], sparkleMats[1])
  scene.add(sparkles1)
  scene.add(sparkles2)

  renderPass = new RenderPass( scene, camera )
  renderPass.clearColor = new THREE.Color( 0, 0, 0 )
  renderPass.clearAlpha = 0
  
  const fxaaPass = new ShaderPass( FXAAShader )

  composer = new EffectComposer( renderer )
  composer.setSize( window.innerWidth, window.innerHeight )
  composer.setPixelRatio( window.devicePixelRatio, 2 )
	composer.addPass( renderPass )
  composer.addPass( fxaaPass )
  composer.addPass( bloomPass )

  const chroma = new ShaderPass( RGBShiftShader )
  chroma.uniforms['amount'].value = 0.0005
  composer.addPass( chroma )
	
  const gltfLoader = new GLTFLoader()
  gltfLoader.load('https://afterlight.sfo2.digitaloceanspaces.com/shared/troika/alvlogo.glb', (gltf) => {
    gltf.scene.scale.multiplyScalar( 1 / 100 )
    gltf.scene.traverse( function ( obj ) {
    console.log( obj )
      if ( obj instanceof THREE.Mesh ) {
        obj.castShadow = false
        obj.receiveShadow = false
        const model = obj          
        if ( model.name == 'Logo' ) {
          logoModel = model
          logoModel.material = sickassGlass
          logoModel.position.y = - ( window.innerHeight / 2 ) / 1.5
        }
        if ( model.name == 'Text' ) {
          logoTextModel = model
          logoTextModel.material = textMat
          logoTextModel.position.y = - ( window.innerHeight / 2 ) / 1.6
        }
      }
    })
    scene.add( gltf.scene )
    animate()
  })
  
  const newTarget = new THREE.Vector3()

  const render = (time) => {
      sparkles1.position.x = mouseX * 0.0001
      sparkles1.position.y = mouseY * -0.0001
      sparkles2.position.x = mouseX * 0.0001
      sparkles2.position.y = mouseY * -0.0001
      camera.position.y =  - (scrollY / window.innerHeight) * 4
      requestAnimationFrame( render )
  }
  
  requestAnimationFrame( render )
	window.addEventListener( 'resize', onWindowResize, false )

}

function animate() {  
  if (logoModel) { 
      logoModel.rotation.x += 0.001
      logoModel.rotation.y += 0.002
  }
	const time = performance.now() / 3000
  requestAnimationFrame( animate )
  composeRender()
}

function composeRender() {
	composer.render()
}

function onWindowResize() {
  const width = window.innerWidth
  const height = window.innerHeight
  const canvas = renderer.domElement
  camera.aspect = canvas.clientWidth/canvas.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize( width, height )
  renderer.setPixelRatio( window.devicePixelRatio, 2 )
  composer.setSize( width, height )
  composer.setPixelRatio( window.devicePixelRatio, 2 )
}

function planeCurve(g, z){
	
  let p = g.parameters;
  let hw = p.width * 0.5;
  
  let a = new THREE.Vector2(-hw, 0);
  let b = new THREE.Vector2(0, z);
  let c = new THREE.Vector2(hw, 0);
  
  let ab = new THREE.Vector2().subVectors(a, b);
  let bc = new THREE.Vector2().subVectors(b, c);
  let ac = new THREE.Vector2().subVectors(a, c);
  
  let r = (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));
  
  let center = new THREE.Vector2(0, z - r);
  let baseV = new THREE.Vector2().subVectors(a, center);
  let baseAngle = baseV.angle() - (Math.PI * 0.5);
  let arc = baseAngle * 2;
  
  let uv = g.attributes.uv;
  let pos = g.attributes.position;
  let mainV = new THREE.Vector2();
  for (let i = 0; i < uv.count; i++){
  	let uvRatio = 1 - uv.getX(i);
    let y = pos.getY(i);
    mainV.copy(c).rotateAround(center, (arc * uvRatio));
    pos.setXYZ(i, mainV.x, y, -mainV.y);
  }
  pos.needsUpdate = true;
}

//</script>