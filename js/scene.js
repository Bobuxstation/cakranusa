function newBlankScene(terrainSize, seed) {
    let ImprovedNoise = new THREE.ImprovedNoise();
    let scene = [];
    let index = 0;

    // traverse size
    for (var x = 0; x < terrainSize; x++) {
        scene[x] = scene[x] ? scene[x] : [];
        for (var y = 0; y < terrainSize; y++) {
            let random = mulberry32(parseInt(`${x}${y}${seed}`));
            let random2 = mulberry32(parseInt(`${index}${seed}`));
            let type = 0; // plains
            let additionalData = {};
            let height = parseFloat(ImprovedNoise.noise(x / 20, seed, y / 20).toFixed(3));

            if (x == Math.floor(terrainSize / 2)) {
                type = 2; // road
                additionalData.quality = randomIntFromInterval(90, 100);
                additionalData.qualityState = 100;
                additionalData.qualityTick = 0;
                additionalData.model = 'assets/roads/plainroad';
            } else {
                if (random < 0.25) {
                    type = 1; // foliage
                    additionalData["foliageType"] = foliage[Math.floor(random2 * foliage.length)];
                }
            }

            scene[x][y] = { type: type, index: index, height: height, ...additionalData };
            index++;
        }
    }

    return scene;
};

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
            color.set((x + y) % 2 === 0 ? 0x008000 : 0x007000);
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
                loaded[itemData.foliageType] ??= await gltfloader.loadAsync(itemData.foliageType);

                let cloned = loaded[itemData.foliageType].scene.clone();
                cloned.position.set(posX, itemData.height, posZ);
                cloned.traverse((child) => {
                    if (!child.isMesh) return;
                    child.castShadow = true;
                    child.receiveShadow = true;
                })

                meshLocations[index] = cloned;
                scene.add(cloned);
            } else if (itemData.type == 2) placeRoad(itemData, { model: itemData.model });
            index++;
        }
    }

    scene.add(instance);
};

let meshLocations, gridInstance
let sceneData, worldSeed, citizens = {};
let simulationSpeed = 1000;
let money = 500_000_000;
let date = 0;
let taxes = {

}

async function initScene() {
    worldSeed = Math.random();
    meshLocations = {};
    sceneData = newBlankScene(64, Math.floor(worldSeed * 100000));

    await generateGrid(sceneData);
    allOfTheLights(scene);
    citizenSimulation(worldSeed);

    let calcSupply = calculateSupplied();
    setSupplyStat(calcSupply, calcSupply)
};
initScene()