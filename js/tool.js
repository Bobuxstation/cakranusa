//========================
// Tool Selector
//========================

// build tab mode
let tool = {};
function setTool(type, category) {
    let toolDiv = document.getElementById("tools");
    let selectDiv = document.getElementById("toolselected");
    let toolname = document.getElementById("toolname");
    let lastmenu = lastTab['tab'];

    renderer.domElement.style.cursor = 'crosshair';
    toolDiv.style.animation = "slideOutDown 0.25s both";
    toolname.innerText = `${category}${type ? ` - ${type}` : ""}`;

    openTab('', 'tab', true);
    tool["type"] = type;
    tool["category"] = category;

    setTimeout(() => {
        selectDiv.style.display = "block";
        toolDiv.style.display = "none";
        toolDiv.style.animation = "";
    }, 250);

    document.getElementById("hideTool").onclick = () => {
        selectDiv.style.animation = "slideOutDown 0.25s both";
        renderer.domElement.style.cursor = 'unset';

        openTab(lastmenu, 'tab', true);
        tool["type"] = '';
        tool["category"] = '';

        setTimeout(() => {
            selectDiv.style.display = "none";
            selectDiv.style.animation = "";
            toolDiv.style.display = "block";
        }, 250);
    };
}

// select tiles
async function select(event, duration) {
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera)

    var intersectsGrid = false;
    var intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length == 0 || duration > 250) return;

    intersects.forEach(async item => {
        if (item.object != gridInstance || intersectsGrid) return;
        let tile = sceneData.flat().find((element) => element.index == item.instanceId);
        intersectsGrid = true;

        //call corresponding tool function
        switch (tool.category) {
            case "Zones": placeZone(tile); break;
            case "Transport": placeTransport(tile); break;
            case "Facility": placeFacility(tile); break;
            case "demolish": cleanTileData(tile, true); break;
        }
    })
}

// capture mouse for selection
renderer.domElement.addEventListener('mousedown', () => { st = Date.now(); });
renderer.domElement.addEventListener('mouseup', (e) => { if (st) select(e, Date.now() - st); });
let st = 0;

//========================
// Tool Functions
//========================

// place tile zone
async function placeZone(tile) {
    // remove foliage
    if (tile.type == 3 & tile.zone == tool.type) return;
    cleanTileData(tile)
    tile.type = 3; //zoned for buildings
    tile.zone = tool.type;
    tile.occupied = false;

    // add billboard to tile
    let object = await loadWMat(zones[tool.type].model);
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

// government facility
async function placeFacility(tile) {
    if (tile.type == 4 & tile.building == tool.type) return;
    cleanTileData(tile);
    tile.type = 4; // pre made buildings
    tile.building = tool.type;

    let object = await loadWMat(facility[tool.type].model);
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    scene.add(object);

    positionTile(connectedRoad, tile, object)
    animMove(object, true);
    setInstanceColor(0x555555, gridInstance, tile.index);
    
    meshLocations[tile.index] = object;
}