//========================
// Helper Functions
//========================

//toast notifications
function newNotification(text) {
    let toast = document.createElement('div');
    toast.innerHTML = `<span>${text}</span>`;
    toast.className = 'notification';
    toast.style.animation = 'bounceInUp 0.5s both';

    document.getElementById("notifications").appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.5s both';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

//biased random
function mulberry32(a) {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// Set up lights and sky
function allOfTheLights(scene, addsky = true) {
    // create hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // create directional light
    const dir = 50;
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-1.5, 1.5, -1.5);
    dirLight.position.multiplyScalar(30);
    dirLight.shadow.mapSize.set(4096, 4096);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -dir;
    dirLight.shadow.camera.right = dir;
    dirLight.shadow.camera.top = dir;
    dirLight.shadow.camera.bottom = -dir;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.radius = 0;
    scene.add(dirLight);

    // create ambient light
    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);

    // create sky
    const sky = new THREE.Sky();
    sky.scale.setScalar(450000);
    if (addsky) scene.add(sky);
    Object.assign(sky.material.uniforms, {
        turbidity: { value: 10 },
        rayleigh: { value: 3 },
        mieCoefficient: { value: 0.005 },
        mieDirectionalG: { value: 0.7 }
    });

    // create sun on sky
    const sun = new THREE.Vector3();
    sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 2), THREE.MathUtils.degToRad(180));
    sky.material.uniforms.sunPosition.value.copy(sun);
}

// open tab
var lastTab = {};
function openTab(tabname, tabGroup, doubleClickHide = false) {
    document.getElementById("hint").style.display = "none";
    floatingDiv.style.display = 'none';
    outlinePass.selectedObjects = [];
    lastTab[tabGroup] = tabname;

    let tabButton = document.getElementsByClassName(`${tabGroup}Button`);
    Object.values(tabButton).forEach(element => {
        if (element.innerText != tabname) element.classList.remove("selected");
        else if (doubleClickHide & element.className.includes("selected")) element.classList.remove("selected");
        else element.classList.add("selected");
    });

    let tabs = document.getElementsByClassName(tabGroup);
    Object.values(tabs).forEach(element => {
        let action = (element.id == tabname) ? "block" : "none";
        let prev = element.style.display;

        if (doubleClickHide & prev == action & action == "block") {
            element.style.animation = "slideOutDown 0.25s both";
            lastTab[tabGroup] = '';

            setTimeout(() => {
                element.style.display = "none";
                element.style.animation = "bounceInUp 0.5s both";
            }, 250);
        } else {
            element.style.display = action;
        }
    });
}

//scale, rotate and move building to tile
function positionTile(connectedRoad, tile, object) {
    object.position.set(tile["posX"], tile["posY"] + 0.12, tile["posZ"]);
    object.rotation.set(0, connectedRoad.rot || -Math.PI, 0);
    object.scale.setScalar(0.156);
}

// building (up) and demolishing (down) animation
function animMove(target, isUp, playSound = true) {
    const startY = target.position.y;
    const height = target.scale.y;
    const startTime = performance.now();

    if (!isUp) {
        spawnSmoke(target.position, 3000);
        if (playSound) (new Audio("assets/audio/829103__squirrel_404__smasheddemolished-brick-wall-crumblingcaving-in.mp3")).play();
    };

    function lerpAnim() {
        const t = Math.min((performance.now() - startTime) / 500, 1);

        if (isUp) {
            target.position.set(
                target.position.x,
                lerp(startY - height, startY, t),
                target.position.z
            );
        } else {
            target.position.set(
                target.position.x,
                lerp(startY, startY - height, t),
                target.position.z
            );
        }

        if (t < 1) requestAnimationFrame(lerpAnim);
    };

    lerpAnim();
}

// lerp animation function (ease)
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// set color of tile
function setInstanceColor(color, instance, index) {
    instance.setColorAt(index, (new THREE.Color()).set(color));
    instance.instanceColor.needsUpdate = true;
}

// generate smoke
let smokeTexture = (new THREE.TextureLoader()).load("assets/clouds_1.png")
function spawnSmoke(position, duration = 3000) {
    const material = new THREE.SpriteMaterial({
        map: smokeTexture,
        transparent: true,
        opacity: 1,
        depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 0.5;
    sprite.scale.setScalar(1.5);
    scene.add(sprite);

    const startTime = performance.now();
    function update() {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = elapsed / duration;

        if (t >= 1) {
            scene.remove(sprite);
            sprite.material.dispose();
        } else {
            sprite.material.opacity = 1 - t;
            sprite.position.y += 0.002;
            sprite.material.rotation += 0.002;

            requestAnimationFrame(update);
        }
    }
    update();
}

//vehicle movement animation
function lerpVehicle(oldPos, targetPosX, targetPosY, targetPosHeight, startTime, data, speed = simulationSpeed) {
    function lerpAnim() {
        let t = Math.min((performance.now() - startTime) / speed, 1);
        let lerpX = lerp(oldPos.x, targetPosY, t);
        let lerpZ = lerp(oldPos.z, targetPosX, t);
        let lerpHeight = lerp(oldPos.y, targetPosHeight, t);
        try { vehicles[data.uuid].position.set(lerpX, lerpHeight, lerpZ); } catch (e) { } //sometimes broken idk why
        if (t < 1) requestAnimationFrame(lerpAnim);
    };
    lerpAnim();
}

// load obj building models
async function loadWMat(location) {
    let mtlloader = new THREE.MTLLoader();
    loaded[`${location}.mtl`] ??= await mtlloader.loadAsync(`${location}.mtl`)

    let objloader = new THREE.OBJLoader();
    objloader.setMaterials(loaded[`${location}.mtl`]);
    loaded[`${location}.obj`] ??= await objloader.loadAsync(`${location}.obj`);

    let object = loaded[`${location}.obj`].clone();
    object.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
    })

    return object;
}

// make unique id from array
function makeUniqueId(array, networkMode = false) {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let maxAttempts = 1000;
    let attempts = 0;
    let length = 4;
    let id;

    function generateId(len) {
        let result = '';
        for (let i = 0; i < len; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    function idExists(id) {
        if (networkMode) return array.some(obj => obj[`${networkMode}_type`] === id);
        else return array.some(obj => obj["uuid"] === id);
    }

    while (true) {
        id = generateId(length);
        if (!idExists(id)) return id;
        attempts++;
        if (attempts >= maxAttempts) {
            length++;
            attempts = 0;
        }
    }
}

//random between two values
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// get majority value from set data
function getMajorityValue(arr, prop) {
    if (arr.length === 0) return null;

    const counts = {};
    let maxCount = 0;
    let majorityValue = null;
    const n = arr.length;

    // Count the occurrences of each value
    for (const item of arr) {
        const value = item[prop];
        counts[value] = (counts[value] || 0) + 1;
    }

    // Find the value with the highest count
    for (const value in counts) {
        if (counts[value] > maxCount) {
            maxCount = counts[value];
            majorityValue = value;
        }
    }

    // Return majority if it exists, otherwise return first value
    return (maxCount > n / 2) ? majorityValue : arr[0][prop];
}

//toggle all model visibility
var undergroundGroups = {};
function setModelVisibility(val) {
    [...Object.values(meshLocations).filter(i => i.visible == !val),
    ...Object.values(vehicles).filter(i => i.visible == !val)].forEach(item => item.visible = val);

    if (typeof gridInstance != "undefined") gridInstance.material.opacity = val ? 1 : 0.25;
    if (typeof undergroundGroups[tool.type] != "undefined" && (tool.category == "Supply" || tool.category == "Demolish Underground")) Object.values(undergroundGroups[tool.type]).forEach(element => element.visible = !val);

    let otherUnderground = Object.keys(undergroundGroups).filter(i => i != tool.type);
    Object.values(otherUnderground).forEach(i => Object.values(undergroundGroups[i]).forEach(element => element.visible = false));
}