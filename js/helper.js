//========================
// Helper Functions
//========================

//biased random
function mulberry32(a) {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// open tab
var lastTab = {};
function openTab(tabname, tabGroup, doubleClickHide = false) {
    let tabs = document.getElementsByClassName(tabGroup);

    lastTab[tabGroup] = tabname;
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

// remove additional information from tile
function cleanTileData(tile, resetType = false) {
    if (tile.building) delete tile.building;
    if (tile.zone) delete tile.zone;
    if (tile.foliageType) delete tile.foliageType;
    if (tile.level) delete tile.level;
    if (tile.uuid) delete tile.uuid;

    if (Object.keys(citizens).find(item => item == tile.index)) {
        delete citizens[tile.index];
    }

    if (resetType & typeof meshLocations[tile.index] != "undefined") {
        animMove(meshLocations[tile.index], false);
        setTimeout(() => {
            // update neighboring roads
            Object.values(checkNeighborForRoads(tile["posX"], tile["posZ"], false, true)).forEach(tile => {
                setRoadModel(checkNeighborForRoads(tile["posX"], tile["posZ"], false, true), tile, true);
            });

            setInstanceColor((tile.posX + tile.posZ) % 2 === 0 ? 0x008000 : 0x007000, gridInstance, tile.index);
            if (meshLocations[tile.index]) {
                scene.remove(meshLocations[tile.index]);
                delete meshLocations[tile.index];
            };
        }, 500);
    } else {
        setInstanceColor((tile.posX + tile.posZ) % 2 === 0 ? 0x008000 : 0x007000, gridInstance, tile.index);
        if (meshLocations[tile.index]) scene.remove(meshLocations[tile.index]);
    }

    if (resetType) {
        tile.type = 0; // plains
        tile.occupied = false;
    }
}

//scale, rotate and move building to tile
function positionTile(connectedRoad, tile, object) {
    object.position.set(tile["posX"], tile["posY"] + 0.12, tile["posZ"]);
    object.rotation.set(0, connectedRoad.rot || -Math.PI, 0);
    object.scale.setScalar(0.156);
}

// building (up) and demolishing (down) animation
function animMove(target, isUp) {
    const startY = target.position.y;
    const height = target.scale.y;
    const startTime = performance.now();

    if (!isUp) {
        spawnSmoke(target.position, 3000);
        (new Audio("assets/audio/829103__squirrel_404__smasheddemolished-brick-wall-crumblingcaving-in.mp3")).play();
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
function lerpVehicle(oldPos, targetPosX, targetPosY, targetPosHeight, startTime, data) {
    function lerpAnim() {
        let t = Math.min((performance.now() - startTime) / simulationSpeed, 1);
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
function makeUniqueId(array) {
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
        return array.some(obj => obj["uuid"] === id);
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