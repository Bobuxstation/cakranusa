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

    tile.buildingModel = buildingType;
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

    tile.buildingModel = buildingType;
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
    matches = matches.filter(item => allZones[item.zone][item.buildingModel].level <= data.education);
    matches.sort((a, b) => Math.abs(data.education - allZones[a.zone][a.buildingModel].level) - Math.abs(data.education - allZones[b.zone][b.buildingModel].level));

    // shuffle matches with same closest level
    let i = 0;
    while (i < matches.length) {
        let j = i + 1;
        while (j < matches.length && Math.abs(data.education - allZones[matches[i].zone][matches[i].buildingModel].level) === Math.abs(data.education - allZones[matches[j].zone][matches[j].buildingModel].level)) { j++; }
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
function findSchool(level, checkNews = false) {
    //find school tile
    let matches = sceneData.flat().filter(item => (item.type == 4 & item.buildingType == "education"));
    matches = matches.filter(item => structures[item.building].education === level);

    //shuffle results
    for (let i = matches.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }

    //check if not full
    for (let match of matches) {
        if (match.occupied == true & (checkNews ? true : (checkStudents(match).length < eval(structures[match.building].slots)))) return match;
    }

    return false;
}

//find facility
function findFacility(type) {
    //find school tile
    let matches = sceneData.flat().filter(item => (item.type == 4 & item.buildingType == type));
    matches = matches.filter(item => eval(structures[item.building].slots) > citizensInTile(item));

    //shuffle results
    for (let i = matches.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }

    //check if not full
    for (let match of matches) return match;
    return false;
}

function tourismProfit(amount = false) {
    let matches = sceneData.flat().filter(item => (item.type == 4 & item.buildingType == "tourism"));
    if (amount) {
        return (calculatePollution() < 0.2) ? matches.length * 50_000 : 0;
    } else {
        return (calculatePollution() < 0.2) ? matches.length : 0;
    }
}

//calculate pollution rates
function calculatePollution() {
    let factories = sceneData.flat().filter(item => item.zone == 'industrial' && item.type == 3 && item.occupied == true).length;
    let pollutionRate = factories / 64;

    return pollutionRate;
}

//check number of citizens in tile
function citizensInTile(tile, value = false) {
    let tileCoordinate = findTileCoordinate(sceneData, tile);
    return value ? Object.values(citizens).flat().filter(item => item.location.x == tileCoordinate.x && item.location.y == tileCoordinate.y) : Object.values(citizens).flat().filter(item => item.location.x == tileCoordinate.x && item.location.y == tileCoordinate.y).length;
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
    if (citizenFlat.length == 0) return booleanMode ? false : 1;

    let employed = citizenFlat.filter(item => item.job != false);
    let employmentRate = employed.length / citizenFlat.length;
    let candidate = [];
    let employmentTarget = 0.75;
    let lowEducationThreshold = 3;

    if (employmentRate < employmentTarget) {
        candidate = citizenFlat.filter(data => (data.job == false || data.job == null) && Math.floor(data.education) <= lowEducationThreshold);
    } else {
        let sceneFlat = sceneData.flat();
        candidate = employed.filter(data => {
            const building = sceneFlat.find(item => item.uuid == data.job);
            if (!building) return false;
            const level = allZones[building.zone][building.buildingModel].level;
            return level < Math.floor(data.education);
        });
    }

    if (booleanMode) return candidate.length > 0;
    let majorityVal = getMajorityValue(candidate, 'education');
    return (majorityVal == null) ? 1 : parseInt(majorityVal);
}

//cleanup vehicles not linked to drivers
function cleanVehicles() {
    Object.keys(vehicles).forEach(key => {
        if (Object.values(citizens).flat().filter(citizen => citizen.uuid === key).length != 0 || key.includes('firedept')) return;
        scene.remove(vehicles[key]);
        delete vehicles[key];
    });
};

//calculate days for date counter
function calculateDate(days, noDate = false) {
    const date = new Date(Date.UTC(2026, 0, 1)); // game lore starts in January 1 2026
    date.setUTCDate(date.getUTCDate() + days);

    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    return noDate ? `${mm}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
}

//calculate facility benefits from neighbors
function calculateFacilityAddition(y, x, moralMode = false) {
    let directions = moralMode ? 10 : 0.1;
    let addition = moralMode ? 2 : 0.02;

    if (sceneData[y + 1]) {
        if (sceneData[y + 1][x] && sceneData[y + 1][x].buildingType == 'leisure') directions += addition;
        if (sceneData[y + 1][x + 1] && sceneData[y + 1][x + 1].buildingType == 'leisure') directions += addition;
        if (sceneData[y + 1][x - 1] && sceneData[y + 1][x - 1].buildingType == 'leisure') directions += addition;
    }

    if (sceneData[y - 1]) {
        if (sceneData[y - 1][x] && sceneData[y - 1][x].buildingType == 'leisure') directions += addition;
        if (sceneData[y - 1][x + 1] && sceneData[y - 1][x + 1].buildingType == 'leisure') directions += addition;
        if (sceneData[y - 1][x - 1] && sceneData[y - 1][x - 1].buildingType == 'leisure') directions += addition;
    }

    if (sceneData[y][x + 1] && sceneData[y][x + 1].buildingType == 'leisure') directions += addition;
    if (sceneData[y][x - 1] && sceneData[y][x - 1].buildingType == 'leisure') directions += addition;

    return parseFloat(directions.toFixed(2));
}

//set citizen into moving mode
function startMoving(type, route, data) {
    data.isWalking = shouldWalk(route);
    data.targetDir = "";
    data.roadWait = 0;
    data.sessionTick = 0;
    data.status = "moving";
    data.targetType = type; // set to work mode when arrived
    data.targetRoute = route;
}

//return vehicle back home if stuck
function vehicleTimeout(data, flatScene) {
    data.status = "home";
    data.location = findTileCoordinate(sceneData, flatScene.find(item => item.uuid == data.home));
    if (vehicles[data.uuid]) { scene.remove(vehicles[data.uuid]); delete vehicles[data.uuid]; }
}

//subtract taxes from salary then subtract city budget from taxes
function processSalary(data, paycheck) {
    let maxBudget = Object.keys(budget).length * 1.5;
    let budgetPercentage = calcFundingSpent(budget) / maxBudget;
    let taxed = Math.floor(paycheck * taxes.salary);

    data.wallet += Math.floor(paycheck - taxed);
    money += taxed - (taxed * budgetPercentage);
    todayEarnings += taxed - (taxed * budgetPercentage);
}

//load vehicle model (blank placeholder while loading)
async function initVehicle(data, currentStep) {
    //create blank placeholder
    const placeholder = new THREE.Object3D();
    vehicles[data.uuid] = placeholder;
    scene.add(placeholder);

    //put vehicle to starting position
    vehicles[data.uuid].position.set(getNextPosition(data, data.targetRoute.at(currentStep - 1), currentStep));

    //start loading model
    let object = await loadWMat(data.isWalking ? `./assets/default/walker` : `${data.vehicle}`);
    object.traverse(obj => { if (obj.isMesh) obj.material.opacity = 0 })
    object.scale.setScalar(0.156);
    placeholder.add(object);
}

//calculate funding for departments
function calcFundingSpent(budget) {
    return Object.keys(budget).reduce((acc, cur) => { return acc + budget[cur] }, 0);
}

//facility construction corruption
function bureaucratCorruption(citizen, budget) {
    let taxRate = 1 - Object.values(taxes).reduce((a, b) => a + b, 0);
    let education = citizen.education / highestEducation;
    let moral = citizen.moral / 100;

    let corruption = ((1 - moral) * 0.5 + (1 - education) * 0.3 + (1 - taxRate) * 0.2) * (2 - budget);
    corruption = Math.max(0, Math.min(corruption, 1));
    return { workQuality: Math.round((education * 50 + moral * 50) * (1 - corruption)), priceMarkup: +(corruption * 0.5).toFixed(2) };
}