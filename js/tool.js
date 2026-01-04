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

        setTimeout(() => {
            selectDiv.style.display = "none";
            selectDiv.style.animation = "";
            toolDiv.style.display = "flex";
        }, 250);
    };
}

// select tiles
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
        switch (tool.category) {
            case "Zones": placeZone(tile, tool.type); break;
            case "Transport": placeTransport(tile); break;
            case "Facility": placeFacility(tile, false); break;
            case "Services": placeFacility(tile, true); break;
            case "Demolish": cleanTileData(tile, true); break;
            case "Demolish Underground": cleanUnderground(tile); break;
            case "Supply": buildUnderground(tile); break;
            default: tileSelection(tile, event); break;
        }
    })
}

// capture mouse for selection
controls.addEventListener('change', () => { floatingDiv.style.display = 'none'; outlinePass.selectedObjects = []; });
renderer.domElement.addEventListener('pointermove', () => { moved = true; });
renderer.domElement.addEventListener('pointerdown', () => { moved = false; });
renderer.domElement.addEventListener('pointerup', (e) => { select(e); });
let floatingDiv = document.getElementById('floatingDiv');
let moved = false;

//========================
// Tool Functions
//========================

function buildUnderground(tile) {
    tile[tool.type] = true;

    let neighbors = checkNeighborForPipes(tile["posX"], tile["posZ"], tool.type);
    setPipeModel(neighbors, tile, tool.type);
    Object.values(neighbors).forEach(tile => setPipeModel(checkNeighborForPipes(tile["posX"], tile["posZ"], tool.type), tile, tool.type, false));
}

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
async function placeZone(tile, type) {
    // remove foliage
    if (tile.type == 3 & tile.zone == type) return;
    cleanTileData(tile)
    tile.type = 3; //zoned for buildings
    tile.zone = type;

    // add billboard to tile
    let object = await loadWMat(zones[type].model);
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    scene.add(object);

    positionTile(connectedRoad, tile, object)
    animMove(object, true);

    meshLocations[tile.index] = object;
}

// place transport
async function placeTransport(tile) {
    switch (tool.type) {
        case "road": placeRoad(tile); break;
    }
}

// place road on tile and update neighbors
function placeRoad(tile) {
    cleanTileData(tile);
    tile.type = 2;
    tile.qualityState = 100;
    tile.qualityTick = 0;
    tile.quality = randomIntFromInterval(50, 100);

    let neighbors = checkNeighborForRoads(tile["posX"], tile["posZ"], false, true);
    setRoadModel(neighbors, tile);
    setTimeout(() => Object.values(neighbors).forEach(tile => setRoadModel(checkNeighborForRoads(tile["posX"], tile["posZ"], false, true), tile, true)), 500);
}

// government facility
async function placeFacility(tile, isService) {
    if (tile.type == 4 & tile.building == tool.type) return;

    cleanTileData(tile);
    tile.type = 4; // pre made buildings
    tile.building = tool.type;
    tile.occupied = true;
    tile.uuid = makeUniqueId(sceneData.flat());

    if (isService) {
        var object = await loadWMat(services[tool.type].model);
        tile.buildingType = services[tool.type].type;
        tile.buildingData = services[tool.type];
    } else {
        var object = await loadWMat(facility[tool.type].model);
        tile.buildingType = facility[tool.type].type;
        tile.buildingData = facility[tool.type];
    }

    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    scene.add(object);

    positionTile(connectedRoad, tile, object)
    animMove(object, true);
    setInstanceColor(0x555555, gridInstance, tile.index);

    meshLocations[tile.index] = object;
}