let housingDemand = 0, commercialDemand = 0, IndustrialDemand = 0, FarmlandDemand = 0;

//========================
// Citizen & City Simulation
//========================

//create new citizen data
function createNewCitizen(tile) {
    let data = {
        home: tile.uuid,
        uuid: makeUniqueId(Object.values(citizens).flat()),
        job: false,
        school: false,
        wallet: 100000, // start with 100k
        health: 100,
        education: 1, // basic education

        location: findTileCoordinate(sceneData, tile),
        status: "home",
        targetType: "",
        targetDir: "",
        targetRoute: [],

        sessionTick: 0
    }

    return data;
}

//simulate individual citizen
let vehicles = {}
function citizenStep(data) {
    //if house is destroyed, disappear
    let checkHome = sceneData.flat().find(item => item.uuid == data.home);
    if (!checkHome) { delete data; return; }

    //apply new job if there is none
    let jobTile = findJob(data);
    if (jobTile != false & data.job == false) data.job = jobTile.uuid;
    if (!sceneData.flat().find(item => item.uuid == data.job)) data.job = false;

    //add school if there is none
    let schoolTile = findSchool(Math.floor(data.education));
    if (schoolTile != false & data.school == false) data.school = schoolTile.uuid;
    if (!sceneData.flat().find(item => item.uuid == data.school)) data.school = false;

    //simulation steps
    switch (data.status) {
        case "home":
            //find way to work after 10-15 ticks at home
            if (data.sessionTick <= randomIntFromInterval(10, 15)) break;
            if (data.education != facility[highestEducation].education + 1 & data.school != false) {
                // if education is not high, 50% chance of going to school instead of work
                if (Math.random() > 0.15) {
                    pathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], sceneData.flat().find(item => item.uuid == data.school));
                    route = astar(pathMap);
                    if (route == null) break;

                    data.targetDir = "";
                    data.sessionTick = 0;
                    data.status = "moving";
                    data.targetType = "learn"; // set to work mode when arrived
                    data.targetRoute = route;
                    break;
                }
            }

            //if has job
            if (data.job != false) {
                //generate route to work
                pathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], sceneData.flat().find(item => item.uuid == data.job));
                route = astar(pathMap);
                if (route == null) break;

                //set route and change to moving mode
                data.targetDir = "";
                data.sessionTick = 0;
                data.status = "moving";
                data.targetType = "work"; // set to work mode when arrived
                data.targetRoute = route;
                break;
            }
            break;
        case "moving":
            //create vehicle if first step
            let currentStep = data.targetRoute.indexOf(data.location) == -1 ? 0 : data.targetRoute.indexOf(data.location);
            if (!vehicles[data.uuid]) {
                let material = new THREE.MeshToonMaterial({ color: 0xffffff });
                let geometry = new THREE.BoxGeometry(0.20, 0.20, 0.20);
                let mesh = new THREE.Mesh(geometry, material);
                vehicles[data.uuid] = mesh;
                scene.add(mesh);
            }

            //steps
            if (currentStep == data.targetRoute.length - 1) {
                //delete vehicle model (final step)
                scene.remove(vehicles[data.uuid]);
                delete vehicles[data.uuid];

                //change to target mode
                data.status = data.targetType;
                data.targetRoute = [];
                data.sessionTick = 0;
                data.targetType = "";
            } else {
                //set coordinates for vehicle
                let targetPos = data.targetRoute[currentStep + 1];
                let finalTarget = data.targetRoute.at(-1);
                let citizensUnsorted = Object.values(citizens).flat()

                //move conditions (is home, is final target or vehicle obstructing path)
                let isHome = (data.location.x === data.targetRoute[0].x && data.location.y === data.targetRoute[0].y);
                let isFinalTarget = (targetPos.x === finalTarget.x && targetPos.y === finalTarget.y);
                let vehicleInTarget = citizensUnsorted.some(item => item.location.x === targetPos.x && item.location.y === targetPos.y && item.location.direction === targetPos.direction);
                if (vehicleInTarget && !isFinalTarget && !isHome) break;

                //shift to correct lane
                let targetPosY = data.location.y - (sceneData[0].length / 2);
                if (targetPos.direction == "left") targetPosY -= 0.10;
                if (targetPos.direction == "right") targetPosY += 0.10;

                //shift to correct lane
                let targetPosX = data.location.x - (sceneData[0].length / 2);
                if (targetPos.direction == "down") targetPosX -= 0.10;
                if (targetPos.direction == "up") targetPosX += 0.10;

                //shift to road height
                let targetPosHeight = sceneData[data.location.y][data.location.x].height + 0.16;
                data.location = targetPos;

                //set vehicle position (first step) or animate movement
                if (currentStep == 0) { vehicles[data.uuid].position.set(targetPosY, targetPosHeight, targetPosX); break; }
                else { lerpVehicle(vehicles[data.uuid].position.clone(), targetPosX, targetPosY, targetPosHeight, performance.now(), data); }
            }
            break;
        case "work":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;
            homePathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome);
            routeHome = astar(homePathMap);

            if (routeHome == null) break;

            //set route and change to moving mode
            data.sessionTick = 0;
            data.status = "moving";
            data.targetType = "home"; //set mode to home when arrived
            data.targetRoute = routeHome;
            data.wallet += 50000;
            break;
        case "learn":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;
            homePathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome);
            routeHome = astar(homePathMap);

            if (routeHome == null) break;

            let addition = data.education + 0.1;
            if (parseFloat(addition.toFixed(1)) == Math.floor(data.education) + 1) data.school = false;

            data.sessionTick = 0;
            data.status = "moving";
            data.targetType = "home"; //set mode to home when arrived
            data.targetRoute = routeHome;
            data.education = parseFloat(addition.toFixed(1));
            break;
        default:
            //if invalid, teleport to home
            data.location = findTileCoordinate(sceneData, checkHome);
            data.status = "home";
            break;
    }

    //increase timer for session
    data.sessionTick += 1;
}

//simulate world
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
    Object.values(citizens).flat().forEach(citizen => citizenStep(citizen));

    //update edu stats
    let educationTab = document.getElementById("education");
    educationTab.innerHTML = '';
    Object.keys(facility).filter(key => facility[key].type == "education").forEach(key => {
        let item = facility[key];
        let textElem = document.createElement('span');
        textElem.innerHTML = `${key}: ${Object.values(citizens).flat().filter(i => i.education > item.education + 1).length} / ${Object.values(citizens).flat().length}<br>`
        educationTab.appendChild(textElem);
    })

    //update stats
    document.getElementById("populationData").innerText = Object.values(citizens).flat().length;
    document.getElementById("unemployedData").innerText = Object.values(citizens).flat().filter(item => item.job == false).length;
    setTimeout(citizenSimulation, simulationSpeed);
}

//========================
// Simulation Helpers
//========================

//occupy resizential tile
async function occupyHouse(tile) {
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    let buildingType = Object.keys(houses)[Math.floor(Math.random() * Object.keys(houses).length)];
    tile.road = connectedRoad.road;
    tile.occupied = true;
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
    let connectedRoad = checkNeighborForRoads(tile["posX"], tile["posZ"], true);
    let buildingType = Object.keys(type)[Math.floor(Math.random() * Object.keys(type).length)];
    tile.road = connectedRoad.road;
    tile.slot = type[buildingType]["slots"];
    tile.occupied = true;
    tile.uuid = makeUniqueId(sceneData.flat());
    tile.level = type[buildingType]["level"];
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
    //find workplace tile
    const matches = sceneData.flat().filter(item => (
        (item.zone === "commercial" || item.zone === "industrial" || item.zone === "farm") & data.education >= item.level
    ));

    //shuffle results
    for (let i = matches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]];
    }

    //check if not full
    for (const match of matches) {
        if (match.occupied == true & (checkEmployees(match).length < match.slot)) return match;
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

//check students of tile
function checkStudents(tile) {
    return Object.values(citizens).flat().filter(citizen => citizen.school === tile.uuid);
}

//check employees of tile
function checkEmployees(tile) {
    return Object.values(citizens).flat().filter(citizen => citizen.job === tile.uuid);
}

//cleanup vehicles not linked to drivers
function cleanVehicles() {
    Object.keys(vehicles).forEach(key => {
        if (Object.values(citizens).flat().filter(citizen => citizen.uuid === key).length != 0) return;
        scene.remove(vehicles[key]);
        delete vehicles[key];
    });
    requestAnimationFrame(cleanVehicles);
}; cleanVehicles()