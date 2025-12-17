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
    if (!checkHome) { delete data; return }

    //apply new job if there is none
    let jobTile = findJob(data);
    if (jobTile != false & data.job == false) { data.job = jobTile.uuid; return }

    //check if job still exists
    let checkJob = sceneData.flat().find(item => item.uuid == data.job);
    if (!checkJob) { data.job = false; return }

    //simulation steps
    switch (data.status) {
        case "home":
            //find way to work after 10 ticks at home
            if (data.job == false || data.sessionTick <= 10) break;
            let pathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkJob);

            //generate route to work
            let route = astar(pathMap);
            if (route == null) break;

            //set route and change to moving mode
            data.targetDir = "";
            data.sessionTick = 0;
            data.status = "moving";
            data.targetType = "work"; // set to work mode when arrived
            data.targetRoute = route;
            break;
        case "moving":
            //create vehicle if first step
            let currentStep = data.targetRoute.indexOf(data.location);
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
                let targetPosX = data.location.x - (sceneData[0].length / 2);
                let targetPosY = data.location.y - (sceneData[0].length / 2);
                let targetPos = data.targetRoute[currentStep + 1];

                //move conditions (is home, is final target or vehicle obstructing path)
                let isHome = data.location.x === data.targetRoute[0].x && data.location.y === data.targetRoute[0].y;
                let finalTarget = data.targetRoute.at(-1);
                let isFinalTarget = targetPos.x === finalTarget.x && targetPos.y === finalTarget.y;
                let vehicleInTarget = Object.values(citizens).flat().some(item => item.location.x === targetPos.x && item.location.y === targetPos.y && item.location.direction === targetPos.direction);
                if (vehicleInTarget && !isFinalTarget && !isHome) break;

                //shift to correct lane
                if (targetPos.direction == "left") targetPosY -= 0.10;
                if (targetPos.direction == "right") targetPosY += 0.10;
                if (targetPos.direction == "down") targetPosX -= 0.10;
                if (targetPos.direction == "up") targetPosX += 0.10;
                data.location = targetPos;

                //set vehicle position (first step) or animate movement
                if (currentStep == 0) { vehicles[data.uuid].position.set(targetPosY, 0.16, targetPosX); break; }
                let oldPos = vehicles[data.uuid].position.clone();
                let startTime = performance.now();
                let lerpAnim = () => {
                    let t = Math.min((performance.now() - startTime) / 500, 1);
                    let lerpX = lerp(oldPos.x, targetPosY, t);
                    let lerpZ = lerp(oldPos.z, targetPosX, t);
                    try { vehicles[data.uuid].position.set(lerpX, vehicles[data.uuid].position.y, lerpZ); } catch (e) { } //sometimes broken idk why
                    if (t < 1) requestAnimationFrame(lerpAnim);
                };

                lerpAnim()
            }
            break;
        case "work":
            //after 15 ticks find path home
            if (data.sessionTick <= 15) break;
            let homePathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome);
            let routeHome = astar(homePathMap);

            if (routeHome == null) break;

            //set route and change to moving mode
            data.sessionTick = 0;
            data.status = "moving";
            data.targetType = "home"; //set mode to home when arrived
            data.targetRoute = routeHome;
            data.wallet += 50000;
            break;
        default:
            //if invalid, teleport to home
            data.location = findTileCoordinate(sceneData, checkHome),
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

    //update stats
    document.getElementById("populationData").innerText = Object.values(citizens).flat().length;
    document.getElementById("unemployedData").innerText = Object.values(citizens).flat().filter(item => item.job == false).length;
    setTimeout(citizenSimulation, 500);
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