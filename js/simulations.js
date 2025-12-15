let housingDemand = 0, commercialDemand = 0, IndustrialDemand = 0, FarmlandDemand = 0;

//========================
// Citizen & City Simulation
//========================

//create new citizen object
function createNewCitizen(tile) {
    let data = {
        home: tile.uuid,
        job: false,
        wallet: 100000, // start with 100k
        health: 100,
        education: 1 // basic education
    }

    return data;
}

//simulate individual citizen
function citizenStep(data, time) {
    //find job
    if (data.job == false) {
        let commercialtile = findJob(data);
        if (commercialtile != false) data.job = commercialtile.uuid;
    } else {
        //refresh job, if workplace is destroyed reset the job
        let checkJob = sceneData.flat().find(item => item.uuid == data.job);
        if (!checkJob) data.job = false;
    }

    //if house is destroyed, disappear
    let checkJob = sceneData.flat().find(item => item.uuid == data.home);
    if (!checkJob) delete data;
}

//simulate world
let step = 0;
async function citizenSimulation(seed) {
    // find empty land
    let housingtile = findZone("housing", true, true);
    let commercialtile = findZone("commercial", true, true);
    let industrialtile = findZone("industrial", true, true);
    let farmlandtile = findZone("farm", true, true);

    // occupy a house
    if (housingtile != false & housingDemand >= 25) occupyHouse(housingtile);
    if (housingtile != false & housingDemand < 100) housingDemand += 10;

    //occupy commercial
    let jobless = typeof Object.values(citizens).flat().find(item => item.job == false) !== "undefined";
    if (commercialtile != false & jobless & commercialDemand >= 25) occupyWorkplace(commercialtile, commercial);
    if (jobless != false & commercialDemand < 100) commercialDemand += 10;

    //occupy industrial
    if (industrialtile != false & jobless & IndustrialDemand >= 25) occupyWorkplace(industrialtile, industrial);
    if (jobless != false & IndustrialDemand < 100) IndustrialDemand += 10;

    //occupy farmland
    if (farmlandtile != false & jobless & FarmlandDemand >= 25) occupyWorkplace(farmlandtile, farm);
    if (jobless != false & FarmlandDemand < 100) FarmlandDemand += 10;

    //simulate citizen
    Object.values(citizens).flat().forEach(citizen => citizenStep(citizen, step));

    if (step < 4) {
        step++
    } else {
        step -= 1;
    }

    //update stats
    document.getElementById("populationData").innerText = Object.values(citizens).flat().length;
    document.getElementById("unemployedData").innerText = Object.values(citizens).flat().filter(item => item.job == false).length;
    setTimeout(citizenSimulation, 1000);
}

//========================
// Simulation Helpers
//========================

//occupy resizential tile
async function occupyHouse(tile) {
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    if (!connectedRoad) return;

    let buildingType = Object.keys(houses)[Math.floor(Math.random() * Object.keys(houses).length)];
    tile.road = connectedRoad.road;
    tile.occupied = true;
    tile.uuid = makeUniqueId(sceneData.flat());
    setInstanceColor(0x555555, gridInstance, tile.index);

    for (let i = 0; i < houses[buildingType]["slots"]; i++) {
        citizens[tile.index] ??= [];
        citizens[tile.index].push(createNewCitizen(tile));
    }

    let object = await loadWMat(buildingType);
    positionTile(connectedRoad, tile, object)

    scene.remove(meshLocations[tile.index]);
    scene.add(object);
    meshLocations[tile.index] = object;
    animMove(object, true);
}

//occupy commercial/industrial/farm tile
async function occupyWorkplace(tile, type) {
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    if (!connectedRoad) return;

    let buildingType = Object.keys(type)[Math.floor(Math.random() * Object.keys(type).length)];
    tile.road = connectedRoad.road;
    tile.slot = type[buildingType]["slots"];
    tile.occupied = true;
    tile.uuid = makeUniqueId(sceneData.flat());
    setInstanceColor(0x555555, gridInstance, tile.index);

    let object = await loadWMat(buildingType);
    positionTile(connectedRoad, tile, object)

    scene.remove(meshLocations[tile.index]);
    scene.add(object);
    meshLocations[tile.index] = object;
    animMove(object, true);
}

// find zone for citizens
function findZone(zone, occupied, checkRoad) {
    const matches = sceneData.flat().filter(item => item.zone === zone);

    for (let i = matches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }

    for (const match of matches) {
        if (match.occupied & occupied) continue;
        if (checkRoad && !checkNeighborForRoads(match.posX, match.posZ, true)) continue;
        return match;
    }

    return false;
}

//find vacant jobs
function findJob(data) {
    const matches = sceneData.flat().filter(item => (
        item.zone === "commercial" || item.zone === "industrial" || item.zone === "farm"
    ));

    for (let i = matches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }

    for (const match of matches) {
        if (match.occupied == true & (checkEmployees(match).length < match.slot)) return match;
    }

    return false;
}

//check employees of tile
function checkEmployees(tile) {
    return Object.values(citizens).flat().filter(citizen => citizen.job === tile.uuid);
}