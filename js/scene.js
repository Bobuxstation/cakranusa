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
                additionalData["foliageType"] = Object.keys(foliage)[Math.floor(worley01Seeded(x, y, 1, seed) * Object.keys(foliage).length)];
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

            //tile mesh pos
            let posX = (x - (terrainSize / 2));
            let posZ = (y - (terrainSize / 2));
            itemData["posX"] = posX;
            itemData["posY"] = itemData.height;
            itemData["posZ"] = posZ;

            //spawn existing pipes
            Object.keys(underground).forEach(item => {
                if (!itemData[item]) return;
                let neighbors = checkNeighborForPipes(itemData["posX"], itemData["posZ"], item);
                setPipeModel(neighbors, itemData, item);
            })

            //spawn existing models
            switch (itemData.type) {
                case 4:
                    var object = await loadWMat(itemData.buildingData.model);
                    positionTile(checkNeighborForRoads(itemData["posX"], itemData["posZ"], true), itemData, object)
                    animMove(object, true);
                    setInstanceColor(0x555555, gridInstance, itemData.index);

                    meshLocations[itemData.index] = object;
                    scene.add(object);
                    break;
                case 3:
                    var object = await loadWMat(itemData.buildingModel);
                    positionTile(checkNeighborForRoads(itemData["posX"], itemData["posZ"], true), itemData, object)
                    animMove(object, true);
                    setInstanceColor(0x555555, gridInstance, itemData.index);

                    meshLocations[itemData.index] = object;
                    scene.add(object);
                    break;
                case 2:
                    placeRoad(itemData, { model: itemData.model })
                    break;
                case 1:
                    placeFoliage(itemData, itemData.foliageType);
                    break;
            }

            index++;
        }
    }

    scene.add(instance);
};

//will not be on the save file
let meshLocations = {}, gridInstance;
let simulationSpeed = 0;

//will be on the save file
let sceneData, citizens = {}, money = 100_000_000, date = 0, worldSeed;
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

function gameUI() {
    document.getElementById("newsContent").style.display = "flex";
    document.getElementById("topNav").style.display = "flex";
    document.getElementById("tabButtons").style.display = "flex";
    document.getElementById("titleOverlay").style.display = "none";
    document.getElementById("intro").style.display = "none";

    setSpeed(1000);
    renderer.domElement.style.pointerEvents = 'unset';
    renderer.domElement.style.filter = 'unset';
    rainCanvas.style.filter = 'unset';
}

function titleUI() {
    document.getElementById("newsContent").style.display = "none";
    document.getElementById("topNav").style.display = "none";
    document.getElementById("tabButtons").style.display = "none";
    document.getElementById("titleOverlay").style.display = "flex";
    document.getElementById("intro").style.display = "flex";

    initScene(false);
    openTab('', 'tab', true);
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.filter = 'blur(2px)';
    rainCanvas.style.filter = 'blur(2px)';
}

function newGame() {
    document.getElementById("titleButtons").style.display = "none";
    document.getElementById("titleLoad").style.display = "block";
    initScene(true);
}

function quitGame() {
    titleUI();

    //temporary blank scene
    rainCanvas.style.display = "none";
    scene.remove.apply(scene, scene.children);
    document.getElementById("Posts").innerHTML = '';

    Object.keys(warningLabels).forEach(label => { if (document.getElementById(`tile-${label}`)) document.getElementById(`tile-${label}`).remove(); scene.remove(warningLabels[label]); delete warningLabels[label]; });
    openTab('', 'tab', true);
    allOfTheLights(scene);
}

let studioLogo = false;
async function initScene(isNewGame, savefile = false) {
    //pause simulation
    document.getElementById("titleButtons").style.display = "none";
    document.getElementById("titleLoad").style.display = "block";
    simulationRunning = false;
    setSpeed(0);

    setTimeout(async () => {
        //reshow title buttons
        document.getElementById("titleButtons").style.display = "block";
        document.getElementById("titleLoad").style.display = "none";
        if (!studioLogo) {
            studioLogo = true;
            document.getElementById("logoImage").src = "assets/logo.png";
            document.getElementById("titleOverlay").style.display = "flex";
        }

        //set data
        dayTick = 0;
        vehicles = {};
        meshLocations = {};
        worldSeed = savefile.worldSeed || Math.random();
        sceneData = savefile.sceneData || newBlankScene(32, Math.floor(worldSeed * 100000));
        if (savefile) {
            citizens = savefile.citizens;
            money = savefile.money;
            date = savefile.date;
        }

        //reload model and menus
        scene.remove.apply(scene, scene.children);
        allOfTheLights(scene);
        loadUnderground();
        await generateGrid(sceneData);
        valueSliders(savefile.taxes || taxes, "taxes", "To collect land and vehicle taxes, build a tax office.", 20, true);
        valueSliders(savefile.budget || budget, "Budget", "High budgets will consume funds, While low budgets will encourage corruption and bribery.", 150, false);
        setSupplyStat(calculateSupplied(), calculateSupplied())
        refreshInfo();

        //pollution and rain start
        scene.fog.density = 0.001 * (calculatePollution() * 25);
        rainCanvas.style.display = isRaining(worldSeed, date) ? "block" : "none";

        //start simulation
        simulationRunning = true;
        citizenSimulation(worldSeed);

        //show ui
        if (savefile || isNewGame) gameUI();
        newPost(sosmedPosts.intro, { username: 'cakranusa', bio: 'For tutorials, check the help menu', name: "Cakranusa" }, false);
    }, 3000);
}; initScene(false)