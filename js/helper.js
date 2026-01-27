//========================
// Helper Functions - UI
//========================

//toast notifications
function newNotification(text) {
    let toast = document.createElement('div');
    toast.innerHTML = `<span>${text}</span>`;
    toast.className = 'notification';
    toast.style.animation = 'slideInUp 0.25s both';

    document.getElementById("notifications").appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.5s both';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

//innerhtml but slower (typewriter)
function typewrite(target, text) {
    let i = 0;
    target.innerHTML = '';

    function type() {
        if (i >= text.length) return;
        target.innerHTML += text.charAt(i);
        i++; setTimeout(type, 50);
    }; type();
}

// open tab
var lastTab = {};
function openTab(tabname, tabGroup, doubleClickHide = false, inAnim = 'slideInUp', outAnim = 'slideOutDown') {
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
            element.style.animation = `${outAnim} 0.25s both`;
            lastTab[tabGroup] = '';

            setTimeout(() => {
                element.style.display = "none";
                element.style.animation = `${inAnim} 0.25s both`;
            }, 250);
        } else {
            element.style.display = action;
        }
    });
}

//update education stats
function updateEducationStats() {
    let educationTab = document.getElementById("education");
    educationTab.innerHTML = '';

    Object.keys(education).filter(key => education[key].type == "education").forEach(key => {
        let item = education[key];
        let citizensFlat = Object.values(citizens).flat();

        let textElem = document.createElement('p');
        textElem.innerHTML = `Graduated ${key} <span class="price">${citizensFlat.filter(i => i.education >= item.education + 1).length} / ${citizensFlat.length}</span>`
        educationTab.appendChild(textElem);

        let percentageLabel = document.createElement("p");
        educationTab.appendChild(percentageLabel);

        let percentageProgress = document.createElement("progress");
        percentageProgress.max = 100;
        percentageProgress.value = ((citizensFlat.filter(i => i.education >= item.education + 1).length / citizensFlat.length) || 0) * 100;
        percentageLabel.appendChild(percentageProgress);

        let percentageSpan = document.createElement("span");
        percentageSpan.className = 'price';
        percentageSpan.innerText = `${Math.floor(((citizensFlat.filter(i => i.education >= item.education + 1).length / citizensFlat.length) || 0) * 100)}%`
        percentageLabel.appendChild(percentageSpan);
    })
}

//summarize all built tiles
function summarizeBuilt() {
    let tiles = sceneData.flat().filter(item => item.type != 0 && item.type !== 1);
    let sum = {};

    tiles.forEach((tile, i) => {
        switch (tile.type) {
            case 3:
                sum[`${tile.zone} (zone)`] = (sum[`${tile.zone} (zone)`] || 0) + 1;
                break;
            case 4:
                sum[tile.building] = (sum[tile.building] || 0) + 1;
                break;
            case 2:
                sum['road'] = (sum['road'] || 0) + 1;
                break;
        }

        if (i == tiles.length - 1) {
            document.getElementById('built').innerHTML = '';
            Object.keys(sum).forEach(type => {
                let label = document.createElement('p');
                label.innerHTML = `${type}<span class="price">${sum[type]}</span>`;
                document.getElementById('built').appendChild(label);
            });
        }
    });
}

//sync taxes with ui
function valueSliders(arr, div, infoText, max, showApproval) {
    document.getElementById(div).innerHTML = '';

    //tax office notice
    let info = document.createElement("p");
    info.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${infoText}`;
    document.getElementById(div).appendChild(info);

    //approval rates label
    let approval = document.createElement("p");
    approval.innerHTML = 'Approval rate';
    let approvalSpan = document.createElement("span");
    approvalSpan.className = 'price';
    approvalSpan.id = 'taxesApprovalLabel';
    let approvalProgress = document.createElement("progress");
    approvalProgress.id = 'taxesApproval';
    approvalProgress.max = 100;

    //add input
    Object.keys(arr).forEach(item => {
        let elem = document.createElement("p");
        elem.innerText = item;

        let label = document.createElement("span");
        label.innerText = `${(arr[item] * 100).toFixed(1)}%`;
        label.className = "price";

        let input = document.createElement("input");
        input.type = "range";
        input.value = arr[item] * 100;
        input.max = max;
        input.step = 0.5;
        input.oninput = (e) => {
            arr[item] = parseFloat(e.target.value) / 100;
            label.innerText = `${(arr[item] * 100).toFixed(1)}%`;

            //update approval rates
            let total = Object.values(arr).reduce((sum, val) => { return sum + val }, 0);
            approvalProgress.value = (1 - total) * 100;
            approvalSpan.innerText = `${Math.floor((1 - total) * 100)}%`;
        };

        elem.appendChild(input);
        elem.appendChild(label);
        document.getElementById(div).appendChild(elem);
    });

    //set approval
    if (showApproval) document.getElementById(div).appendChild(approval);
    approval.appendChild(approvalProgress);
    approval.appendChild(approvalSpan);

    //set approval rates
    let total = Object.values(arr).reduce((sum, val) => { return sum + val }, 0);
    approvalProgress.value = (1 - total) * 100;
    approvalSpan.innerText = `${Math.floor((1 - total) * 100)}%`;
}

//========================
// Helper Functions - Math & Data
//========================

//biased random
function mulberry32(a) {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// lerp animation function (ease)
function lerp(a, b, t) {
    return a + (b - a) * t;
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

//========================
// Helper Functions - 3D Effects
//========================

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

//toggle all model visibility
var undergroundGroups = {};
function setModelVisibility(val) {
    [...Object.values(meshLocations).filter(i => i.visible == !val),
    ...Object.values(vehicles).filter(i => i.visible == !val)].forEach(item => item.visible = val);
    if (typeof undergroundGroups[tool.type] != "undefined" && (tool.category == "Supply" || tool.category == "Demolish Underground")) Object.values(undergroundGroups[tool.type]).forEach(element => element.visible = !val);

    let otherUnderground = Object.keys(undergroundGroups).filter(i => i != tool.type);
    Object.values(otherUnderground).forEach(i => Object.values(undergroundGroups[i]).forEach(element => element.visible = false));
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
function lerpVehicle(oldPos, targetPos, targetRot, data) {
    let startTime = performance.now();
    function lerpAnim() {
        let t = Math.min((performance.now() - startTime) / simulationSpeed, 1);
        try {
            vehicles[data.uuid].position.set(lerp(oldPos.x, targetPos.x, t), lerp(oldPos.y, targetPos.y, t), lerp(oldPos.z, targetPos.z, t));
            vehicles[data.uuid].rotation.y = targetRot;
        } catch (e) { } //sometimes broken idk why
        if (t < 1) requestAnimationFrame(lerpAnim);
    }; lerpAnim();
}