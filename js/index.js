// Create a scene
var faker = require("@faker-js/faker").fakerID_ID;
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
renderer.domElement.style.pointerEvents = 'none';
renderer.domElement.style.filter = 'blur(2px)';
document.body.appendChild(renderer.domElement);

//warning and label overlays
var labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

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

//selection outline
var outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.pulsePeriod = 2;
composer.addPass(outlinePass);

//fix colors
var gamma_correction = new THREE.ShaderPass(THREE.GammaCorrectionShader);
composer.addPass(gamma_correction);

//pollution fog 
scene.fog = new THREE.FogExp2(0xcccccc, 0.01);

// Render the scene
function animate() {
    controls.update();
    composer.render(scene, camera);
    labelRenderer.render(scene, camera);

    cleanVehicles();
    if (typeof tool != "undefined") (tool.category == "Supply" || tool.category == "Demolish Underground") ? setModelVisibility(false) : setModelVisibility(true);

    requestAnimationFrame(animate);
    drawRain();
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
    labelRenderer.setSize(window.innerWidth, window.innerHeight);

    floatingDiv.style.display = 'none';
    outlinePass.selectedObjects = [];

    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
    resizeRain();
}

window.addEventListener('resize', onWindowResize, false);