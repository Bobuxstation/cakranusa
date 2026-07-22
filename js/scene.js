//create new game (blank scene)
function newBlankScene(terrainSize, seed) {
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
                additionalData.roadType = 'road';
            } else if (random < 0.3) {
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
    instance.castShadow = false;
    instance.receiveShadow = true;

    // traverse data
    let index = 0;
    gridInstance = instance;
    return new Promise(async (resolve) => {
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

                //spawn existing models
                switch (itemData.type) {
                    case 4:
                        if (!structures[itemData.building]) { cleanTileData(itemData, true); break; };

                        var object = await loadWMat(structures[itemData.building].model);
                        positionTile(checkNeighborForRoads(itemData["posX"], itemData["posZ"], true), itemData, object)
                        animMove(object, true);
                        setInstanceColor(0x555555, gridInstance, itemData.index);

                        meshLocations[itemData.index] = object;
                        scene.add(object);
                        break;
                    case 3:
                        if (!itemData.occupied || !allZones[itemData.zone][itemData.buildingModel]) {
                            placeZone(false, itemData, itemData.zone ? itemData.zone : "housing");
                        } else {
                            var object = await loadWMat(itemData.buildingModel);
                            positionTile(checkNeighborForRoads(itemData["posX"], itemData["posZ"], true), itemData, object)
                            animMove(object, true);
                            setInstanceColor(0x555555, gridInstance, itemData.index);

                            meshLocations[itemData.index] = object;
                            scene.add(object);
                        };
                        break;
                    case 2:
                        if (!structures[itemData.roadType]) { cleanTileData(itemData, true); break; };
                        placeRoad(false, itemData, itemData.roadType);
                        break;
                    case 1:
                        if (!structures[itemData.foliageType]) { cleanTileData(itemData, true); break; };
                        placeFoliage(false, itemData, itemData.foliageType);
                        break;
                }

                //spawn existing pipes
                underground.forEach(item => {
                    if (!itemData[item]) return;
                    let neighbors = checkNeighborForPipes(itemData["posX"], itemData["posZ"], item);
                    setPipeModel(neighbors, itemData, item);
                })

                index++;
            }
        }

        scene.add(instance);
        resolve();
    });
};

//will not be on the save file
let meshLocations = {}, gridInstance;
let simulationSpeed = 0;
let finishLoading = false;

//will be on the save file
let sceneData, citizens = {}, money = 1_000_000_000, date = 0, worldSeed;
let officials, budget, taxes;

function gameUI() {
    document.getElementById("newsContent").style.display = "flex";
    document.getElementById("topNav").style.display = "flex";
    document.getElementById("tabButtons").style.display = "flex";
    document.getElementById("titleMain").style.display = "none";
    document.getElementById("intro").style.display = "none";
    setSpeed(1000);

    renderer.domElement.style.pointerEvents = 'unset';
    renderer.domElement.style.filter = 'unset';
    labelRenderer.domElement.style.filter = 'unset';
    rainCanvas.style.filter = 'unset';
}

function titleUI() {
    document.getElementById("newsContent").style.display = "none";
    document.getElementById("topNav").style.display = "none";
    document.getElementById("tabButtons").style.display = "none";
    document.getElementById("titleMain").style.display = "block";
    document.getElementById("intro").style.display = "flex";

    initScene(false);
    openTab('', 'tab', true);
    openTab('', 'titleTab', true)
    renderer.domElement.style.pointerEvents = 'none';
}

function newGame() {
    document.getElementById("logoImage").style.display = "none";
    document.getElementById("splashtext").style.display = "none";
    document.getElementById("titleButtons").style.display = "none";
    document.getElementById("titleLoad").style.display = "block";
    initScene(true);
}

function quitGame() {
    document.getElementById("logoImage").style.display = "none";
    document.getElementById("splashtext").style.display = "none";
    openTab('', 'titleTab', true)
    openTab('', 'tab', true);
    titleUI();
}

let studioLogo = false;
async function initScene(isNewGame, savefile = false) {
    //pause simulation
    document.getElementById("titleButtons").style.display = "none";
    document.getElementById("titleLoad").style.display = "block";
    simulationRunning = false;
    finishLoading = false;
    setSpeed(0);
    
    setTimeout(async () => {
        //reshow title buttons
        document.getElementById("logoImage").style.display = "block";
        document.getElementById("splashtext").style.display = "block";
        document.getElementById("titleButtons").style.display = "block";
        document.getElementById("titleLoad").style.display = "none";
        if (!studioLogo) {
            studioLogo = true;
            await startAutomaticTranslation();
            document.getElementById("logoImage").src = "assets/logo.png";
            document.getElementById("titleMain").style.display = "block";
        };

        //show ui
        if (savefile || isNewGame) {
            document.getElementById("Posts").innerHTML = '';
            document.getElementById("increase").innerHTML = '...';
            gameUI();

            setTimeout(() => openTab('Guide', 'tab', true), 500);
        };

        //splash text
        typewrite(document.getElementById("splashtext"), `"${splashtext[Math.floor(Math.random() * splashtext.length)]}"`, true);

        //random seed
        let seed = Math.floor(Math.random() * 100000);
        if (document.getElementById("worldseed").value.trim() != "") {
            seed = document.getElementById("worldseed").value.split("").map(letter => letter.charCodeAt(0) - 96).reduce((accumulator, currentValue) => `${accumulator}${currentValue * currentValue}`, 0);
            document.getElementById("worldseed").value = "";
        };

        //reset simulation sectioning
        simulationIndex = 0;
        facilityIndex = 0;
        zoneIndex = 0;
        roadIndex = 0;

        //reset other simulation variables
        updateInfo = 0;
        dayTick = 0;
        vehicles = {};
        meshLocations = {};
        lastCandidates = [];
        lastShuffle = [];

        //set data based on init type
        if (savefile) {
            worldSeed = savefile.worldSeed || parseInt(seed);
            sceneData = savefile.sceneData || newBlankScene(document.getElementById("citysize").value, worldSeed);
            citizens = savefile.citizens || {};
            money = savefile.money || 1_000_000_000;
            date = savefile.date || 0;
            taxes = savefile.taxes || { salary: 0.10, land: 0.05, transportation: 0.05, };
            budget = savefile.budget || { healthcare: 0.75, police: 0.75, firefighter: 0.75, education: 0.75, construction: 0.75 };
            officials = savefile.officials || { healthcare: false, police: false, firefighter: false, education: false, construction: false };
        } else {
            worldSeed = parseInt(seed);
            sceneData = newBlankScene(document.getElementById("citysize").value, worldSeed);
            citizens = {};
            money = 1_000_000_000;
            date = 0;
            taxes = { salary: 0.10, land: 0.05, transportation: 0.05, };
            budget = { healthcare: 0.75, police: 0.75, firefighter: 0.75, education: 0.75, construction: 0.75 };
            officials = { healthcare: false, police: false, firefighter: false, education: false, construction: false };
        }

        //reload model and menus
        scene.remove.apply(scene, scene.children);
        loadSettings();
        loadTutorial();
        allOfTheLights(scene);
        loadUnderground();
        await generateGrid(sceneData);
        ministerTab(officials, 'Ministers')
        valueSliders(taxes, "taxes", langData.toast.taxes || "", 20, true);
        valueSliders(budget, "Budget", langData.toast.budget || "", 150, false);
        setSupplyStat(calculateSupplied(), calculateSupplied());

        //reset zoom
        camera.zoom = 2;
        camera.updateProjectionMatrix(); 

        //clear warning labels
        Object.keys(warningLabels).forEach(label => {
            if (document.getElementById(`tile-${label}`));
            document.getElementById(`tile-${label}`).remove();
            scene.remove(warningLabels[label]);
            delete warningLabels[label];
        });

        //pollution and rain start
        scene.fog.density = 0.001 * (calculatePollution() * 25);
        rainCanvas.style.display = isRaining(worldSeed, date) ? "block" : "none";

        //start simulation
        finishLoading = true;
        simulationRunning = true;
        allStep();
    }, 2000);
}; 

initScene(false);
//initScene(false, JSON.parse(fs.readFileSync(`C:/Users/User/AppData/Roaming/cakranusa/saves/largegridcity.json`, 'utf-8')));