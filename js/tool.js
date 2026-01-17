//========================
// Tool Selector
//========================

// build tab mode
let tool = {};
function setTool(type, category) {
    let toolDiv = document.getElementById("tabButtons");
    let selectDiv = document.getElementById("toolOverlay");
    let toolname = document.getElementById("toolname");
    let lastmenu = lastTab['tab'];

    //animations and text
    renderer.domElement.style.cursor = 'crosshair';
    toolDiv.style.animation = "slideOutDown 0.25s both";
    toolname.innerText = `${category}${type ? ` - ${type}` : ""}`;

    // hide tabs and activate tool
    openTab('', 'tab', true);
    tool["type"] = type;
    tool["category"] = category;

    //set price
    if (buildmenu[category]) tool["price"] = buildmenu[category][type].price || 0;
    else tool["price"] = 0;

    //show selection overlay
    setTimeout(() => {
        selectDiv.style.display = "flex";
        toolDiv.style.display = "none";
        toolDiv.style.animation = "";
    }, 250);

    //close tool button
    document.getElementById("hideTool").onclick = () => {
        selectDiv.style.animation = "slideOutDown 0.25s both";
        renderer.domElement.style.cursor = 'unset';

        openTab(lastmenu, 'tab', true);
        tool["type"] = '';
        tool["category"] = '';
        tool["price"] = 0;

        setTimeout(() => {
            selectDiv.style.display = "none";
            selectDiv.style.animation = "";
            toolDiv.style.display = "flex";
        }, 250);
    };
}

// capture mouse for selection
let floatingDiv = document.getElementById('floatingDiv');
controls.addEventListener('change', () => { floatingDiv.style.display = 'none'; outlinePass.selectedObjects = []; });

// select tiles
let moved = false;
async function select(event) {
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersectsGrid = false;
    var intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length == 0 || moved) return;

    intersects.forEach(async item => {
        if (item.object != gridInstance || intersectsGrid) return;
        let tile = sceneData.flat().find((element) => element.index == item.instanceId);
        intersectsGrid = true;

        //call corresponding tool function
        if (tool.category && tool.category != 'Transport') {
            let categoryWhitelist = !["Demolish", "Demolish Underground", "Supply"].includes(tool.category);
            let hasRoadConnection = checkNeighborForRoads(tile.posX, tile.posZ, true) == false || !(tile.type == 0 || tile.type == 1);
            if (categoryWhitelist && hasRoadConnection) {
                newNotification(!(tile.type == 0 || tile.type == 1) ? errors.occupiedTile : errors.roadConnection);
                return;
            };
        }

        //subtract from money
        if (tool.category) {
            if (money - tool.price >= 0) money -= tool.price;
            else { newNotification(errors.noMoney); return; };
            if (tool.price != 0) newNotification(`-${tool.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}`);
        }

        //call corresponding tool function
        switch (tool.category) {
            case "Demolish": cleanTileData(tile, true); break;
            case "Demolish Underground": cleanUnderground(tile); break;
            default: if (tool.category) buildMethod[tool.category](tile); else tileSelection(tile, event); break;
        }
    })
}

//canvas events
renderer.domElement.addEventListener('pointermove', () => { moved = true; });
renderer.domElement.addEventListener('pointerdown', () => { moved = false; });
renderer.domElement.addEventListener('pointerup', (e) => { select(e); });

//outline tile if can be built on
var lastHoverId, lastHoverModel;
function hover(event) {
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var intersectsGrid = false;
    var intersects = raycaster.intersectObjects(scene.children, true);

    intersects.forEach(async item => {
        if (item.object != gridInstance || !tool.category || intersectsGrid) {
            if (lastHoverModel && !tool.category) { scene.remove(lastHoverModel); lastHoverModel = null; };
        } else {
            intersectsGrid = true;

            let tile = sceneData.flat().find((element) => element.index == item.instanceId);
            if (tile.index == lastHoverId) return;
            if (lastHoverModel) { scene.remove(lastHoverModel); lastHoverModel = null; };
            lastHoverId = tile.index;

            let condition;
            if (tool.category && !["Demolish", "Demolish Underground", "Supply", "Transport"].includes(tool.category)) {
                condition = checkNeighborForRoads(tile["posX"], tile["posZ"], true) == false || !(tile.type == 0 || tile.type == 1);
            } else {
                condition = false;
            }

            let selectionColor = condition ? 0xff0000 : 0xffffff;
            let mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), new THREE.MeshToonMaterial({ color: selectionColor }));
            mesh.position.set(tile.posX, tile.posY + 0.16, tile.posZ);
            mesh.material.transparent = true;
            mesh.material.opacity = 0.5;

            scene.add(mesh);
            lastHoverModel = mesh;
        };
    })
}

//capture hover
renderer.domElement.addEventListener('mousemove', (e) => { hover(e); });

//========================
// Tool Functions (Demolition)
//========================

//delete underground supplies
function cleanUnderground(tile) {
    if (tile[tool.type]) delete tile[tool.type];
    if (tile[`${tool.type}_network`]) delete tile[`${tool.type}_network`];
    if (undergroundGroups[tool.type][tile.index]) {
        spawnSmoke({ x: tile.posX, y: tile.posY, z: tile.posZ }, 3000);
        scene.remove(undergroundGroups[tool.type][tile.index]);
        delete undergroundGroups[tool.type][tile.index];
    }

    let neighbors = checkNeighborForPipes(tile["posX"], tile["posZ"], tool.type);
    Object.values(neighbors).forEach(tile => setPipeModel(checkNeighborForPipes(tile["posX"], tile["posZ"], tool.type), tile, tool.type, false));

    // Reassign network IDs for disconnected groups
    let allTiles = sceneData.flat().filter(t => t[tool.type] && t[`${tool.type}_network`] === tile[`${tool.type}_network`]);
    let visited = new Set();
    for (let tile of allTiles) {
        if (!visited.has(tile.index)) {
            let group = findConnectedTiles(tile, tool.type, visited);
            let newId = makeUniqueId(sceneData.flat(), tool.type);
            group.forEach(t => t[`${tool.type}_network`] = newId);
        }
    }
}

// demolish tile and clean data
function cleanTileData(tile, resetType = false, reZone = false) {
    let tempZone = tile.zone ? tile.zone : "housing";

    if (tile.occupied) tile.occupied = false;
    if (tile.building) delete tile.building;
    if (tile.zone) delete tile.zone;
    if (tile.foliageType) delete tile.foliageType;
    if (tile.level) delete tile.level;
    if (tile.uuid) delete tile.uuid;
    if (tile.buildingData) delete tile.buildingData;
    if (tile.emptyTick) delete tile.emptyTick;
    if (tile.burning) delete tile.burning;
    if (tile.burningCount) delete tile.burningCount;
    if (tile.quality) delete tile.quality;
    if (tile.qualityState) delete tile.qualityState;
    if (tile.qualityTick) delete tile.qualityState;
    if (tile.age) delete tile.age;
    if (tile.model) delete tile.model;

    if (Object.keys(citizens).find(item => item == tile.index)) delete citizens[tile.index];
    if (typeof meshLocations[tile.index] != "undefined" && typeof warningLabels[tile.index] != "undefined") {
        meshLocations[tile.index].remove(warningLabels[tile.index]);
        delete warningLabels[tile.index];
        if (document.getElementById(`tile-${tile.index}`)) document.getElementById(`tile-${tile.index}`).remove();
    };

    if (resetType & typeof meshLocations[tile.index] != "undefined") {
        animMove(meshLocations[tile.index], false, !reZone);
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

            if (reZone != false) placeZone(tile, tempZone);
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

//========================
// Tool Functions
//========================

//click to show tile info
function tileSelection(tile, event) {
    if (meshLocations[tile.index]) {
        floatingDiv.style.left = `0px`;
        floatingDiv.style.top = `0px`;
        floatingDiv.innerText = '';

        floatingDiv.style.left = `${event.clientX + 10}px`;
        floatingDiv.style.top = `${event.clientY - floatingDiv.offsetHeight - 10}px`;
        floatingDiv.style.display = 'block';

        tileInfo(tile);
        outlinePass.selectedObjects = [meshLocations[tile.index]];
    } else {
        floatingDiv.style.display = 'none';
        outlinePass.selectedObjects = [];
    }
}

// place tile zone
async function placeZone(tile) {
    // remove foliage
    if (tile.type == 3 & tile.zone == tool.type) return;
    cleanTileData(tile)
    tile.type = 3; //zoned for buildings
    tile.zone = tool.type;

    // add billboard to tile
    let object = await loadWMat(zones[tool.type].model);
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    scene.add(object);

    positionTile(connectedRoad, tile, object)
    animMove(object, true);

    meshLocations[tile.index] = object;
}

// place road on tile and update neighbors
function placeRoad(tile, data = { model: buildmenu[tool.category][tool.type].model }) {
    cleanTileData(tile);
    tile.type = 2;
    tile.qualityState = 100;
    tile.qualityTick = 0;
    tile.model = data.model;
    tile.quality = randomIntFromInterval(50, 100);

    let neighbors = checkNeighborForRoads(tile["posX"], tile["posZ"], false, true);
    setRoadModel(neighbors, tile, false);
    setTimeout(() => Object.values(neighbors).forEach(tile => setRoadModel(checkNeighborForRoads(tile["posX"], tile["posZ"], false, true), tile, true)), 500);
}

// government facility
async function placeFacility(tile) {
    if (tile.type == 4 & tile.building == tool.type) return;

    cleanTileData(tile);
    tile.type = 4; // pre made buildings
    tile.building = tool.type;
    tile.occupied = true;
    tile.uuid = makeUniqueId(sceneData.flat());

    var object = await loadWMat(buildmenu[tool.category][tool.type].model);
    tile.buildingType = buildmenu[tool.category][tool.type].type;
    tile.buildingData = buildmenu[tool.category][tool.type];

    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    scene.add(object);

    positionTile(connectedRoad, tile, object)
    animMove(object, true);
    setInstanceColor(0x555555, gridInstance, tile.index);

    meshLocations[tile.index] = object;
}

//build underground supplies
function buildUnderground(tile) {
    tile[tool.type] = true;

    let neighbors = checkNeighborForPipes(tile["posX"], tile["posZ"], tool.type);
    setPipeModel(neighbors, tile, tool.type);
    Object.values(neighbors).forEach(tile => setPipeModel(checkNeighborForPipes(tile["posX"], tile["posZ"], tool.type), tile, tool.type, false));
}

// Helper to find all connected tiles in a network using BFS
function findConnectedTiles(startTile, type, visited) {
    let queue = [startTile];
    let connected = [];
    while (queue.length > 0) {
        let current = queue.shift();
        if (visited.has(current.index)) continue;
        visited.add(current.index);
        connected.push(current);

        let neighbors = checkNeighborForPipes(current.posX, current.posZ, type);
        Object.values(neighbors).forEach(neighbor => {
            if (neighbor[type] && !visited.has(neighbor.index) && neighbor[`${type}_network`] === startTile[`${type}_network`]) {
                queue.push(neighbor);
            }
        });
    }
    return connected;
}