//create new game (blank scene)
function newBlankScene(terrainSize, seed) {
    let ImprovedNoise = new THREE.ImprovedNoise();
    let scene = [];
    let index = 0;

    // traverse size
    for (var x = 0; x < terrainSize; x++) {
        scene[x] = scene[x] ? scene[x] : [];
        for (var y = 0; y < terrainSize; y++) {
            let random = worley01Seeded(x, y, 10, seed);
            let type = 0; // plains
            let additionalData = {};

            if (x == Math.floor(terrainSize / 2)) {
                type = 2; // road
                additionalData.quality = randomIntFromInterval(90, 100);
                additionalData.qualityState = 100;
                additionalData.qualityTick = 0;
                additionalData.model = 'assets/roads/plainroad';
            } else if (random < 0.25) {
                type = 1; // foliage
                additionalData["foliageType"] = foliage[Math.floor(worley01Seeded(x, y, 1, seed) * foliage.length)];
            }

            scene[x][y] = { type: type, index: index, height: 0, ...additionalData };
            index++;
        }
    }

    return scene;
};

//generate grass grid
async function generateGrid(data) {
    // instance for checkerboard grid
    let terrainSize = data.length;
    let material = new THREE.MeshToonMaterial({ color: 0xffffff });
    let geometry = new THREE.BoxGeometry(1, 1, 1);
    let instance = new THREE.InstancedMesh(geometry, material, terrainSize * terrainSize);
    instance.material.transparent = true;
    instance.castShadow = true;
    instance.receiveShadow = true;

    // traverse data
    let index = 0;
    gridInstance = instance
    for (var x = 0; x < terrainSize; x++) {
        for (var y = 0; y < terrainSize; y++) {
            let itemData = data[x][y];

            // checkerboard geometry
            let dummy = new THREE.Object3D();
            dummy.position.set((x - (terrainSize / 2)), itemData.height - 0.38, (y - (terrainSize / 2)));
            dummy.updateMatrix();
            instance.setMatrixAt(index, dummy.matrix);

            //checkerboard color
            let color = new THREE.Color();
            color.set((x + y) % 2 === 0 ? 0x005000 : 0x004000);
            instance.setColorAt(index, color);

            //spawn things above it
            let gltfloader = new THREE.GLTFLoader();

            //tile mesh pos
            let posX = (x - (terrainSize / 2));
            let posZ = (y - (terrainSize / 2));
            itemData["posX"] = posX;
            itemData["posY"] = itemData.height;
            itemData["posZ"] = posZ;

            if (itemData.type == 1) {
                let object = await loadWMat(itemData.foliageType);
                positionTile({}, itemData, object)
                meshLocations[index] = object;
                scene.add(object);
            } else if (itemData.type == 2) placeRoad(itemData, { model: itemData.model });
            index++;
        }
    }

    scene.add(instance);
};

//will not be on the save file
let meshLocations, gridInstance;
let simulationSpeed = 1000;
let worldSeed;

//will be on the save file
let sceneData, citizens = {}, money = 100_000_000, date = 0;
let officials = {
    transport: false,
    facility: false,
    education: false,
    police: false
};
let budget = {
    healthcare: 0.75,
    police: 0.75,
    firefighter: 0.75,
    education: 0.75,
    transportation: 0.75
}
let taxes = {
    salary: 0.10,
    land: 0.05,
    transportation: 0.05,
};

async function initScene() {
    worldSeed = Math.random();
    meshLocations = {};
    sceneData = newBlankScene(32, Math.floor(worldSeed * 100000));

    await generateGrid(sceneData);
    allOfTheLights(scene);
    citizenSimulation(worldSeed);
    valueSliders(taxes, "taxes", "To collect land and vehicle taxes, build a tax office.", 20, true);
    valueSliders(budget, "Budget", "High budgets will consume funds, While low budgets will encourage corruption and bribery.", 150, false);
    
    document.getElementById("posts").innerHTML = '';
    newPost(sosmedPosts.intro, 'cakranusa', 'For tutorials, check the help menu', "Cakranusa", false);

    let calcSupply = calculateSupplied();
    setSupplyStat(calcSupply, calcSupply)
}; initScene()