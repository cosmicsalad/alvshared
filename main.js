import * as THREE from 'https://cdn.skypack.dev/three'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/RGBELoader.js'
import { Lensflare, LensflareElement } from "https://cdn.jsdelivr.net/npm/three/examples/jsm/objects/Lensflare.js"
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/shaders/FXAAShader.js'
import { RGBShiftShader } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/shaders/RGBShiftShader.js'
import MeshTransmissionMaterialImpl from 'https://afterlight.sfo2.digitaloceanspaces.com/shared/troika/transmissionMaterial.js'
import * as dat from 'https://cdn.skypack.dev/pin/dat.gui@v0.7.9-2wtQAdFH5SRwnJLDWGNz/mode=imports/optimized/dat.gui.js'

// Texture Loading
const textureLoader = new THREE.TextureLoader()

let logoModel, logoTextModel
let scene, camera, canvas, composer, renderer, renderPass
let sickassGlass
let sparkles1, sparkles2, mouseX, mouseY

const bloomparams = {
	exposure: 0.6,
	bloomStrength: 0.3,
	bloomThreshold: 0.8,
	bloomRadius: 0.4
}

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

function init() {

	const objectsDistance = 2
	let scrollY = window.scrollY
	mouseX = 0
	mouseY = 0

	window.addEventListener('scroll', () => { scrollY = window.scrollY })
	document.addEventListener("mousemove", (e) => {
		mouseX = e.clientX
		mouseY = e.clientY
	})

	canvas = document.querySelector('canvas.webgl')
	renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas, antialias: true })
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) )
	renderer.toneMappingExposure = 1.15
	renderer.outputColorSpace = THREE.SRGBColorSpace
	renderer.toneMapping = THREE.ACESFilmicToneMapping
	renderer.useLegacyLights = false
	renderer.shadowMap.enabled = true

	scene = new THREE.Scene()

	camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
	camera.position.set( 0, 0, 3.5 )
	camera.lookAt( 0, 0, 0 )
	scene.add(camera)

	// Video tex
	const video1 = document.getElementById( 'video1' )
	const video2 = document.getElementById( 'video2' )
	const video3 = document.getElementById( 'video3' )
	const videoTex1 = new THREE.VideoTexture( video1 )
	const videoTex2 = new THREE.VideoTexture( video2 )
	const videoTex3 = new THREE.VideoTexture( video3 )
	const videoMat1 = new THREE.MeshBasicMaterial({ 
		map: videoTex1
	})
	const videoMat2 = new THREE.MeshBasicMaterial({ 
		map: videoTex2
	})
	const videoMat3 = new THREE.MeshBasicMaterial({ 
		map: videoTex3
	})
	
	const getRandomParticelPos = (particleCount) => {
		const arr = new Float32Array(particleCount * 3)
		for (let i = 0; i < particleCount; i++) {
			arr[i] = (Math.random() - 0.5) * 10;
		}
		return arr;
	}

	const sparkleGeos = [new THREE.BufferGeometry(), new THREE.BufferGeometry()]
	sparkleGeos[0].setAttribute("position", new THREE.BufferAttribute(getRandomParticelPos(950), 3))
	sparkleGeos[1].setAttribute("position", new THREE.BufferAttribute(getRandomParticelPos(650), 3))
	const sparkleMats = [
		new THREE.PointsMaterial({size: 0.05, map: textureLoader.load("https://uploads-ssl.webflow.com/640267beea11d62d4c670caa/6456e47757b421045d4ea093_sparkle2.png"),transparent: true}),
		new THREE.PointsMaterial({size: 0.075, map: textureLoader.load("https://uploads-ssl.webflow.com/640267beea11d62d4c670caa/6456e474861910efcebc5cae_sparkle1.png"),transparent: true})
	]

	// ADD MODELS
	let envMapLoader = new THREE.PMREMGenerator( renderer )
	new RGBELoader().load("https://afterlight.sfo2.digitaloceanspaces.com/shared/troika/dancing_hall_1k.hdr",
		function(hdrmap) {
			let envmap = envMapLoader.fromCubemap(hdrmap)
			hdrmap.mapping = THREE.EquirectangularReflectionMapping
			sickassGlass = Object.assign(new MeshTransmissionMaterialImpl(10), {
				clearcoat: 1,
				clearcoatRoughness: 0.1,
				transmission: 1,
				chromaticAberration: 0.02,
				anistropy: 0.3,
				roughness: 0.275,
				envMap: envmap.texture,
				envMapIntensity: 1.5,
				thickness: 3,
				ior: 1.03,
				distortion: 0.5,
				distortionScale: 0.9,
				temporalDistortion: 0.6
			})
			const textMat = new THREE.MeshPhysicalMaterial({
				metalness: 1.0,
				roughness: 0.21,
				clearcoat: 1.0,
				envMap: envmap.texture,
				envMapIntensity: 1.0,
				side: THREE.DoubleSide,
			})
			const gltfLoader = new GLTFLoader()
			gltfLoader.load(
				'https://afterlight.sfo2.digitaloceanspaces.com/shared/troika/alvlogo.glb',
				(gltf) => {
				gltf.scene.scale.multiplyScalar( 1 / 100 )
				gltf.scene.traverse( function ( obj ) {
					if ( obj instanceof THREE.Mesh ) {
						const model = obj          
						if ( model.name == 'Logo' ) {
							logoModel = model
							logoModel.material = sickassGlass
							logoModel.rotation.x = 1.5
							logoModel.rotation.z = 0.4
						}
						if ( model.name == 'Text' ) {
							logoTextModel = model
							logoTextModel.material = textMat
							logoTextModel.position.y = -385//-( Math.min(sizes.height / 2) / 1.3 )
						}
					}
				})
				scene.add( gltf.scene )
				gltf.scene.scale.set(0.0055,0.0055,0.0055)
				gltf.scene.position.z = 1
				logoModel.position.y = 0
				setTimeout( () => {
					if (logoModel) {
						logoModel.position.y = -400
					}
				}, 10)
				
				animate()
			})
		}
	)

	// ADD VIDEOS
	const planeMat = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} )
	const planeGeo = new THREE.PlaneGeometry( 1,1.75 )
	const vPlane1 = new THREE.Mesh( planeGeo, videoMat1 )
	const vPlane2 = new THREE.Mesh( planeGeo, videoMat2 )
	const vPlane3 = new THREE.Mesh( planeGeo, videoMat3 )

	vPlane1.position.set( -1.5, -2.9, -1.3 )
	vPlane2.position.set( 1.2, -3.6, -0.9 )
	vPlane3.position.set( -0.2, -4.0, -2.0 )
	scene.add( vPlane1 )
	scene.add( vPlane2 )
	scene.add( vPlane3 )

	// ADD SPARKLES
	sparkles1 = new THREE.Points(sparkleGeos[0], sparkleMats[0])
	sparkles2 = new THREE.Points(sparkleGeos[1], sparkleMats[1])
	scene.add(sparkles1)
	scene.add(sparkles2)
	console.log("sparkles1 Y position: ", sparkles1.position.y)

	// RENDERPASS
	renderPass = new RenderPass( scene, camera )
	renderPass.clearColor = new THREE.Color( 0, 0, 0 )
	renderPass.clearAlpha = 0

	composer = new EffectComposer( renderer )
	composer.setSize( sizes.width, sizes.height )
	composer.setPixelRatio( window.devicePixelRatio, 2 )
	composer.addPass( renderPass )
	
	const chroma = new ShaderPass( RGBShiftShader )
	chroma.uniforms['amount'].value = 0.0005

	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2(sizes.width, sizes.height),
		bloomparams.bloomStrength,
		bloomparams.bloomRadius,
		bloomparams.bloomThreshold
	)

	composer.addPass( chroma )
	//composer.addPass( bloomPass )

	const render = (time) => {
		sparkles1.position.x = mouseX * 0.00005
		sparkles1.position.y = mouseY * -0.00005
		sparkles2.position.x = mouseX * 0.00005
		sparkles2.position.y = mouseY * -0.00005
		//vPlane1.rotation.y = mouseX * 0.0001
		//vPlane2.rotation.y = mouseX * 0.0001
		camera.position.y =  - scrollY / sizes.height * objectsDistance
		window.addEventListener('resize', resizeCanvasToDisplaySize)
		requestAnimationFrame( render )
	}
	requestAnimationFrame( render )
}

init()

function animate() {  
	if (logoModel) { 
		logoModel.rotation.x += 0.0008
		logoModel.rotation.y += 0.001
	}
	const time = performance.now() / 3000
	requestAnimationFrame( animate )
	composeRender()
}

function composeRender() {
	composer.render()
}

function resizeCanvasToDisplaySize() {
	// Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

	// Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

	// Update renderer/composer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) )
	composer.setSize(sizes.width, sizes.height)
	composer.setPixelRatio( Math.min(window.devicePixelRatio, 2) )
}