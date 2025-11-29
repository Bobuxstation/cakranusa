// Create a scene
var scene = new THREE.Scene();

// isometric camera
var d = 20;
var camera = new THREE.OrthographicCamera(-d * window.innerWidth / window.innerHeight, d * window.innerWidth / window.innerHeight, d, -d, 1, 9999);
camera.position.set(30, 30, 30);

// Create a renderer
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.mouseButtons.LEFT = 2;
controls.mouseButtons.RIGHT = 3;
controls.touches.ONE = 2;
controls.touches.TWO = 1;

var composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

// pixelated filter
var renderPixelatedPass = new THREE.RenderPixelatedPass(2, scene, camera);
renderPixelatedPass.depthEdgeStrength = 0.1;
renderPixelatedPass.normalEdgeStrength = 0.1;
//composer.addPass(renderPixelatedPass);

// Render the scene
function animate() {
    controls.update()
    composer.render(scene, camera);
    requestAnimationFrame(animate)
}

animate();

//resize window
function onWindowResize() {
    camera.left = -d * window.innerWidth / window.innerHeight;
    camera.right = d * window.innerWidth / window.innerHeight;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);