//========================
// Simulation Helpers
//========================

//delete citizen
function deleteCitizen(data) {
    for (const [key, arr] of Object.entries(citizens)) {
        const idx = arr.findIndex(item => item.uuid === data.uuid);
        if (idx !== -1) {
            arr.splice(idx, 1);
            // If the array is empty after removal, delete the key
            if (arr.length === 0) delete citizens[key];
            break;
        }
    }
}

//occupy resizential tile
async function occupyHouse(tile) {
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    let buildingType = Object.keys(houses)[Math.floor(Math.random() * Object.keys(houses).length)];
    
    tile.consumption = houses[buildingType]["consumption"];
    tile.road = connectedRoad;
    tile.occupied = true;
    tile.slot = houses[buildingType]["slots"];
    tile.uuid = makeUniqueId(sceneData.flat());
    setInstanceColor(0x555555, gridInstance, tile.index);

    //create new citizens
    for (let i = 0; i < houses[buildingType]["slots"]; i++) {
        citizens[tile.index] ??= [];
        citizens[tile.index].push(createNewCitizen(tile));
    }

    let object = await loadWMat(buildingType);
    scene.remove(meshLocations[tile.index]);
    scene.add(object);

    meshLocations[tile.index] = object;
    positionTile(connectedRoad, tile, object)
    animMove(object, true);
}

//occupy commercial/industrial/farm tile
async function occupyWorkplace(tile, type) {
    //find connected road
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    let filterBuildings = Object.keys(type).filter(item => type[item].level == findOpportunity());
    let buildingType = filterBuildings[Math.floor(Math.random() * Object.keys(filterBuildings).length)];
    if (filterBuildings.length == 0) return;

    tile.consumption = type[buildingType]["consumption"];
    tile.buildingData = type[buildingType];
    tile.road = connectedRoad;
    tile.slot = type[buildingType]["slots"];
    tile.occupied = true;
    tile.uuid = makeUniqueId(sceneData.flat());
    setInstanceColor(0x555555, gridInstance, tile.index);

    let object = await loadWMat(buildingType);
    scene.remove(meshLocations[tile.index]);
    scene.add(object);

    meshLocations[tile.index] = object;
    positionTile(connectedRoad, tile, object)
    animMove(object, true);
}

// find zone for citizens
function findZone(zone, occupied, checkRoad) {
    //check zones
    const matches = sceneData.flat().filter(item => item.zone === zone);

    //shuffle results
    for (let i = matches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }

    //if not occupied, has road connection then return tile
    for (const match of matches) {
        if (match.occupied & occupied) continue;
        if (checkRoad && !checkNeighborForRoads(match.posX, match.posZ, true)) continue;
        return match;
    }

    return false;
}

//find vacant jobs
function findJob(data) {
    // find workplace tile
    let matches = sceneData.flat().filter(item => (item.zone === "commercial" || item.zone === "industrial" || item.zone === "farm") && item.occupied);
    matches = matches.filter(item => item.buildingData.level <= data.education);
    matches.sort((a, b) => Math.abs(data.education - a.buildingData.level) - Math.abs(data.education - b.buildingData.level));

    // shuffle matches with same closest level
    let i = 0;
    while (i < matches.length) {
        let j = i + 1;
        while (j < matches.length && Math.abs(data.education - matches[i].buildingData.level) === Math.abs(data.education - matches[j].buildingData.level)) { j++; }
        for (let k = j - 1; k > i; k--) {
            const l = i + Math.floor(Math.random() * (k - i + 1));
            [matches[k], matches[l]] = [matches[l], matches[k]];
        }
        i = j;
    }

    // check if not full
    for (const match of matches) {
        if (checkEmployees(match).length < match.slot) return match;
    }

    return false;
}

//find schools
function findSchool(level) {
    //find school tile
    let matches = sceneData.flat().filter(item => (item.type == 4 & item.buildingType == "education" & typeof item.buildingData != "undefined"));
    matches = matches.filter(item => item.buildingData.education === level);

    //shuffle results
    for (let i = matches.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }

    //check if not full
    for (let match of matches) {
        if (match.occupied == true & (checkStudents(match).length < match.buildingData.slots)) return match;
    }

    return false;
}

//find facility
function findFacility(type) {
    //find school tile
    let matches = sceneData.flat().filter(item => (item.type == 4 & item.buildingType == type & typeof item.buildingData != "undefined"));
    matches = matches.filter(item => item.buildingData.slots > citizensInTile(item));

    //shuffle results
    for (let i = matches.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }

    //check if not full
    for (let match of matches) return match;
    return false;
}

//check number of citizens in tile
function citizensInTile(tile) {
    let tileCoordinate = findTileCoordinate(sceneData, tile);
    return Object.values(citizens).flat().filter(item => item.location.x == tileCoordinate.x && item.location.y == tileCoordinate.y).length;
}

//check students of tile
function checkStudents(tile) {
    return Object.values(citizens).flat().filter(citizen => citizen.school === tile.uuid);
}

//check employees of tile
function checkEmployees(tile) {
    return Object.values(citizens).flat().filter(citizen => citizen.job === tile.uuid);
}

//check residents of tile
function checkResidents(tile) {
    return Object.values(citizens).flat().filter(citizen => citizen.home === tile.uuid);
}

//find unfilled job level
function findOpportunity(booleanMode = false) {
    let citizenFlat = Object.values(citizens).flat();
    if (citizenFlat.length != 0) {
        if (citizenFlat.filter(item => item.job != false).length == 0) return booleanMode ? false : 1;

        let citizen = citizenFlat.filter(item => item.job != false);
        let sceneFlat = sceneData.flat();
        citizen = citizen.filter(data => (typeof sceneFlat.find(item => item.uuid == data.job) != "undefined") ? (sceneFlat.find(item => item.uuid == data.job).buildingData.level < Math.floor(data.education)) : false);

        let majorityVal = getMajorityValue(citizen, 'education');
        if (booleanMode) return (citizen.length == 0) ? false : true;
        return (majorityVal == null) ? 1 : parseInt(majorityVal);
    }

    return booleanMode ? false : 1;
}

//cleanup vehicles not linked to drivers
function cleanVehicles() {
    Object.keys(vehicles).forEach(key => {
        if (Object.values(citizens).flat().filter(citizen => citizen.uuid === key).length != 0) return;
        scene.remove(vehicles[key]);
        delete vehicles[key];
    });
};