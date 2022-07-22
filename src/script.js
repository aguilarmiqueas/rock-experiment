import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { gsap } from 'gsap'
import { VectorKeyframeTrack } from 'three'


/**
 * Base
 */
let loaded = false;
// Debug
const gui = new dat.GUI()
gui.close()
const cursorDom = document.querySelector('.cursor')
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.fog = new THREE.Fog('#dbc787', 1, 125)
const loader = new OBJLoader();
const textLoader = new THREE.TextureLoader();
const rgbeLoader = new RGBELoader();

rgbeLoader.load('/models/env.hdr', texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
})
const rocksToLoad = ['rock1', 'rock2', 'rock3', 'rock4'];
let text = textLoader.load('/models/text2.jpg');
let disp = textLoader.load('/models/disp.jpg')
let bg = textLoader.load('/models/bg.jpg');
let cloud = textLoader.load('/models/cloud.png')
scene.background = bg;

for (let [i, rock] of rocksToLoad.entries()) {
    console.log(rock)
    let ao = textLoader.load(`/models/${rock}/${rock}_ao.png`);
    let normal = textLoader.load(`/models/${rock}/${rock}_normal.png`);
    let curve = textLoader.load(`/models/${rock}/${rock}_curve.png`);
    loader.load(`/models/${rock}/${rock}.obj`, mesh => {
        let obj = mesh.children[0]
        obj.material.aoMap = ao;
        obj.material.normalMap = normal;
        obj.material.displacementScale = .5;
        obj.material.map = text;
        obj.material.bumpMap = text;
        obj.material.normalScale = new THREE.Vector2(2, 2)
        obj.castShadow = true;

        let newMeshGeo = obj.geometry;
        let newMeshMat = obj.material;

        for(let v = 0; v < 12; v++) {
            let newMesh = new THREE.Mesh(newMeshGeo.clone(), newMeshMat.clone())
            let scale = 0.01 * (Math.random()  + .5);
            newMesh.scale.set(scale, scale, scale);
            let num = Math.random() * Math.PI * 2
            newMesh.position.x = 1 + ((v + 1) * 2.25) * Math.cos(num);
            newMesh.position.z = 1 + ((v + 1) * 2.25) * Math.sin(num);
            newMesh.rotation.y = Math.random() * Math.PI * 2;
            newMesh.castShadow = true;
            newMesh.receiveShadow = true;
            newMesh.position.y = -.75;
            scene.add(newMesh)
            objects.push(newMesh)
        }
    });
}

const objects = []
const gltfLoader = new GLTFLoader();
gltfLoader.load('/models/environ/environ-cyl.gltf', obj => {
    let o = obj.scene
    o.children[0].visible = false;

    o.children[1].material = new THREE.MeshPhongMaterial({
        map: text,
        roughness: 1,
        aoMap: text,
        bumpMap: text,
        bumpScale: 0.005
    })
    o.children[1].receiveShadow = true;
    o.children[1].castShadow = true

    o.children[1].scale.set(500, 500, 500)
    scene.add(o.children[1])
});

/**
 * Lights
 */


const hemisphereLight = new THREE.HemisphereLight('#7e7872', '#844e1f', .5);
scene.add(hemisphereLight);

const spotLight = new THREE.SpotLight('#734228', 1.5, 0, Math.PI/8, 1)
spotLight.position.set(5,1,5);
scene.add(spotLight)
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024 * 4
spotLight.shadow.mapSize.height = 1024 * 4
spotLight.shadow.bias = 0.0000001
/**
 * Objects
 */
// Material
const material = new THREE.MeshPhongMaterial()
material.map = text;
material.roughness = 1;
material.metalness = 0;
material.shininess = 1;
material.normalMap = text;
material.displacementMap = text;
material.roughness = 0.4
material.receiveShadow = true;

// Objects
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(105, 105),
    material
)
plane.castShadow = true;
plane.receiveShadow = true;
plane.rotation.x = - Math.PI * 0.5
plane.position.y = - 1.85

scene.add(plane)

/**
 * Particles
 */
const particleCount = 175;
const particleGeo = new THREE.PlaneGeometry(72, 72)
const particleMaterial = new THREE.MeshLambertMaterial({
    map: cloud,
    color: '#7b4b24',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
})

let particles = []
const radius = 140
for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(particleGeo, particleMaterial)
    let particleSeedX = 10 * Math.random()
    let particleSeedZ = 10 * Math.random()
    particle.position.x = (Math.cos(particleSeedX)+.1) * radius
    particle.position.z = (Math.sin(particleSeedZ)+.1) * radius
    particle.position.y = 15 + Math.random() * 15
    particle.lookAt(0,0,0)
    scene.add(particle)
    particles.push([particle, particleSeedX, particleSeedZ])
}



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000)
camera.position.x = 3
camera.position.y = 4
camera.position.z = 3
let cameraTarget = new THREE.Vector3(0, 0, 0)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true
// controls.enabled = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Click event handler
 */
let cursor = new THREE.Vector2()
let lerpedCursor = {
    x: cursor.x,
    y: cursor.y
}
const raycaster = new THREE.Raycaster()
let isHovered = false;
window.addEventListener('pointermove', e => {
    cursor.x = (e.clientX / sizes.width)*2-1;
    cursor.y = -(e.clientY / sizes.height)*2+1;

    raycaster.setFromCamera(cursor, camera)
    const intersection = raycaster.intersectObjects(objects)

    if (intersection.length) {
        if (!isHovered) {
            cursorDom.classList.add('hovered');
        }
    } else {
        cursorDom.classList.remove('hovered');
    }

})

const card = document.querySelector('.card');
const cardParams = {
    target: {position: new THREE.Vector3(0,0,0)},
    visible: false,
    distance: 0
}

let oldTl = new gsap.timeline()

window.addEventListener('pointerdown', e => {
    if (loaded) {
        raycaster.setFromCamera(cursor, camera)
        const intersection = raycaster.intersectObjects(objects)
        let tl = new gsap.timeline()
        let cardTitle = document.querySelector('.card h2');
        let cardPosition = document.querySelector('.position')
        let cardRotation = document.querySelector('.rotation')
        let cardMaterial = document.querySelector('.material')
        let cardGeometry = document.querySelector('.geometry')

        if (intersection.length) {
            if (intersection[0].object !== cardParams.target) {
                let obj = intersection[0].object
                console.log(obj)
                obj.material.color = new THREE.Color('#dc871e')
                obj.material.wireframe = true;

                if (cardParams.visible) {
                    tl.to(
                        [cardTitle, cardPosition, cardRotation, cardMaterial, cardGeometry], 
                    {
                        opacity: 0,
                        duration: .1,
                        stagger: .025,
                        ease: "pow4.inOut"
                    })
                    tl.to(card, {
                        scaleX: 0,
                        duration: .5,
                        ease: "pow4.inOut"
                    })
                    tl.set(cardParams, {
                        target: obj, 
                    })
                    tl.add(() => {
                        oldTl.kill()
                        oldTl = tl;
                    })
                }
                tl.to(cameraTarget, {
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z,
                    duration: 2
                }, 0)
                tl.to(camera.position, {
                    x: obj.position.x + 5,
                    z: obj.position.z + 5,
                    y: 4,
                    duration: 3.5,
                    ease: "pow2.in"
                }, 0)
                tl.set(card, {
                    transformOrigin: 'center left'
                })
                tl.add(() => {
                    cardTitle.innerHTML = 'ROCK' + obj.id
                    cardPosition.innerHTML = `POSITION ${obj.position.x.toFixed(3)} ${obj.position.y.toFixed(3)} ${obj.position.z.toFixed(3)}`
                    console.log(obj.rotation)
                    cardRotation.innerHTML = `ROTATION ${obj.rotation.x, obj.rotation.y, obj.rotation.z}`
                    cardMaterial.innerHTML = `MATERIAL ${obj.material.type}`
                    cardGeometry.innerHTML = `GEOMETRY ${obj.geometry.type}`
                }
                )
                tl.set(cardParams, {
                    target: obj,
                    visible: true,
                }, ">-1")
                tl.fromTo(card, {scaleX: 0}, {
                    scaleX: 1,
                    duration: .5,
                    ease: "pow4.inOut"
                }, ">-.1")
                tl.fromTo([cardTitle, cardPosition, cardRotation, cardMaterial, cardGeometry], {opacity: 0}, {
                    opacity: 1,
                    duration: .15,
                    stagger: .05,
                    ease: "pow4.inOut"
                })
                }
           
        } else {
            tl.to(
                [cardTitle, cardPosition, cardRotation, cardMaterial, cardGeometry], 
            {
                opacity: 0,
                duration: .1,
                stagger: .025,
                ease: "pow4.inOut"
            })
            tl.to(card, {
                scaleX: 0,
                duration: .5,
                ease: "pow4.inOut"
            })
            tl.add(() => {
                oldTl.kill()
                oldTl = tl;
            })
        }
}})


/**
 * Post-processing
 */
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 0.204, 0.78, 0.201)

composer.addPass(renderPass)
composer.addPass(bloomPass)

const params = { exposure: 1, bloomThreshold: 1, bloomStrength: 1, bloomRadius: 1, }
gui.add(params, 'exposure', 0.1, 2).onChange(value => {
    renderer.toneMappingExposure = Math.pow(value, 4.0);
})
gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {

    bloomPass.threshold = Number( value );

} );

gui.add( params, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {

    bloomPass.strength = Number( value );

} );

gui.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

    bloomPass.radius = Number( value );

} );
/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    lerpedCursor = {
        x: THREE.MathUtils.lerp(lerpedCursor.x, cursor.x, .2),
        y: THREE.MathUtils.lerp(lerpedCursor.y, cursor.y, .2)
    }
    spotLight.position.set(Math.cos(elapsedTime * .1) * 64, 24, Math.sin(elapsedTime * .1) * 64);
    spotLight.lookAt(0, 0, 0)

    let rect = cursorDom.getBoundingClientRect();
    let cursorDomPos = {
        x: (lerpedCursor.x * sizes.width)/2+(sizes.width/2),
        y: -(lerpedCursor.y * sizes.height)/2+(sizes.height/2)
    }
    cursorDomPos.x -= cursorDom.offsetWidth / 2
    cursorDomPos.y -= cursorDom.offsetHeight / 2


    cursorDom.style.left = cursorDomPos.x + 'px';
    cursorDom.style.top =  cursorDomPos.y + 'px';


    camera.lookAt(cameraTarget)
    camera.rotateY(-lerpedCursor.x * .95)
    camera.rotateX(lerpedCursor.y * .95)
    // controls.update()

    for (let particle of particles) {
        particle[0].position.x = radius * (Math.cos(particle[1] + elapsedTime * .01) + .1)
        particle[0].position.z = radius * (Math.sin(particle[2] + elapsedTime * .01) + .1)
        particle[0].rotation.z = Math.cos(elapsedTime) * Math.PI * 2
        particle[0].lookAt(0,0,0)
    }

    if (cardParams.visible) {
        let newPos = cardParams.target.position.clone()
        newPos.project(camera);
        newPos.x = ( newPos.x * sizes.width / 2 ) + sizes.width / 2
        newPos.y = - ( newPos.y * sizes.height / 2 ) + sizes.height / 2

        newPos.x += card.offsetWidth / 4
        newPos.y -= card.offsetHeight / 1.5

        card.style.left = newPos.x + 'px';
        card.style.top = newPos.y + 'px';

        let distanceFactor = Math.max((1-((camera.position.distanceTo(cardParams.target.position))/cardParams.distance)) * 200, 50);

    }

    // Render
    composer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

window.onload = () => {
    let main = document.querySelector('.intro')
    let title = document.querySelector('.intro h1')
    let button = document.querySelector('.intro button')
    let buttonLeftBar = document.querySelector('.button-before')
    let buttonRightBar = document.querySelector('.button-after')
    let loader = document.querySelector('.loader')
    
    button.onclick = () => {
        let tl = new gsap.timeline()
        tl.to(main, {
            opacity: 0,
            duration: .25,
            ease: "pow4.inOut"
        })
        tl.set(main, {
            display: 'none'
        }, '>');
        tl.add(() => {
            loaded = true
        })
    }

    button.addEventListener('pointerover', () => {
        cursorDom.classList.add('hovered')
    })
    button.addEventListener('pointerout', () => {
        cursorDom.classList.remove('hovered')
    })

    let tl = new gsap.timeline();
    tl.to(loader, {
        opacity: 0,
        duration: 1,
        ease: "pow2.in"
    })
    tl.set(loader, { display: 'none '})
    tl.set(title, { display: 'block '}, ">")
    tl.from(title, {
        yPercent: 20,
        opacity: 0,
        rotation: "90_cw",
        transformOrigin: "left top",
        duration: 1.5,
        ease: "pow4.inOut"
    }, ">-1")
    tl.set(button, { display: 'block' }, ">-.15")
    tl.from(button, {
        yPercent: 70,
        opacity: 0,
        rotation: "20_cw",
        transformOrigin: "left top",
        duration: .5,
        ease: "pow4.inOut"
    }, ">-.15");
    tl.from(buttonLeftBar, {
        opacity: 0,
        width: 0,
        duration: .1
    }, ">");
    tl.from(buttonRightBar, {
        opacity: 0,
        width: 0,
        duration: .1,
    }, "<");
}