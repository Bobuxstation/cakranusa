// Create a scene
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000000);
camera.position.set(5, 5, 0);
camera.lookAt(scene.position);

// Create a renderer
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

let composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

const renderPixelatedPass = new THREE.RenderPixelatedPass(4, scene, camera);
//composer.addPass(renderPixelatedPass);

var controls = new THREE.OrbitControls(camera, renderer.domElement);

function mulberry32(a) {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// Render the scene
function animate() {
    controls.update()
    composer.render(scene, camera);
    requestAnimationFrame(animate)
}
animate();

// select tiles
function select(event, duration) {
    if (duration > 250) return;

    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        var selectedObject = intersects[0].object;

        if (selectedObject instanceof THREE.InstancedMesh) {
            console.log(intersects[0].instanceId)
        }
    }
}

let st = 0;
renderer.domElement.addEventListener('mousedown', () => {st = Date.now();});
renderer.domElement.addEventListener('mouseup', (e) => {if (st) select(e, Date.now() - st);});

//resize window
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);