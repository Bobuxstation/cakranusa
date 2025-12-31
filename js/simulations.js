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
    //if health 0, disappear
    if (data.health <= 0) { deleteCitizen(data); return; };

    //if house is destroyed, disappear
    let checkHome = sceneData.flat().find(item => item.uuid == data.home);
    if (!checkHome) { deleteCitizen(data); return; };

    //apply new job if there is none or if there is a better job
    let jobTile = findJob(data);
    let currentJobLevel = sceneData.flat().find(item => item.uuid == data.job) ? sceneData.flat().find(item => item.uuid == data.job).buildingData.level : 0;
    if ((jobTile != false && data.job == false) || (jobTile ? currentJobLevel < jobTile.buildingData.level : false)) data.job = jobTile.uuid;
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
            if (data.health <= 95) data.health += randomIntFromInterval(2, 5);

            //go to hospital if health less than 50
            let hospitalTile = findFacility("medical");
            if (data.health < 50 && hospitalTile) {
                pathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], hospitalTile);
                route = astar(pathMap);
                if (route == null) break;
                data.targetDir = "";
                data.roadWait = 0;
                data.sessionTick = 0;
                data.status = "moving";
                data.targetType = "hospital"; // set to work mode when arrived
                data.targetRoute = route;
                break;
            }

            if (data.education != facility[highestEducation].education + 1 & data.school != false) {
                // if education is not high, 15% chance of going to school instead of work
                if (Math.random() > 0.15) {
                    pathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], sceneData.flat().find(item => item.uuid == data.school));
                    route = astar(pathMap);
                    if (route != null) {
                        data.targetDir = "";
                        data.roadWait = 0;
                        data.sessionTick = 0;
                        data.status = "moving";
                        data.targetType = "learn"; // set to work mode when arrived
                        data.targetRoute = route;
                        break;
                    };
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
                data.roadWait = 0;
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
            let roadQuality = sceneData[data.targetRoute[currentStep].y][data.targetRoute[currentStep].x].qualityState || 100;
            if (!vehicles[data.uuid]) {
                let material = new THREE.MeshToonMaterial({ color: 0xffffff });
                let geometry = new THREE.BoxGeometry(0.20, 0.20, 0.20);
                let mesh = new THREE.Mesh(geometry, material);
                vehicles[data.uuid] = mesh;
                scene.add(mesh);
            }

            //steps
            if (data.roadWait != Math.floor((100 - roadQuality) / 5)) { data.roadWait++; break; } else { data.roadWait = 0; };
            if (currentStep == data.targetRoute.length - 1) {
                //delete vehicle model (final step)
                let finalTarget = data.targetRoute.at(-1);
                let targetPosX = finalTarget.x - (sceneData[0].length / 2);
                let targetPosY = sceneData[finalTarget.y][finalTarget.x].height + 0.16;
                let targetPosZ = finalTarget.y - (sceneData[0].length / 2);
                lerpVehicle(vehicles[data.uuid].position.clone(), targetPosX, targetPosZ, targetPosY, performance.now(), data);

                //discard vehicle after arrival
                setTimeout(() => {
                    scene.remove(vehicles[data.uuid]);
                    delete vehicles[data.uuid];

                    //change to target mode
                    data.status = data.targetType;
                    data.targetRoute = [];
                    data.sessionTick = 0;
                    data.roadWait = 0;
                    data.targetType = "";
                }, simulationSpeed);
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
            data.roadWait = 0;
            data.status = "moving";
            data.targetType = "home"; //set mode to home when arrived
            data.targetRoute = routeHome;
            data.health -= randomIntFromInterval(20, 25)
            data.wallet += sceneData.flat().find(item => item.uuid == data.job) ? sceneData.flat().find(item => item.uuid == data.job).buildingData.pay : 0;
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
            data.roadWait = 0;
            data.status = "moving";
            data.targetType = "home"; //set mode to home when arrived
            data.targetRoute = routeHome;
            data.health -= randomIntFromInterval(5, 10)
            data.education = parseFloat(addition.toFixed(1));
            break;
        case "hospital":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;
            homePathMap = convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome);
            routeHome = astar(homePathMap);
            if (routeHome == null) break;

            //set route and change to moving mode
            data.sessionTick = 0;
            data.roadWait = 0;
            data.status = "moving";
            data.targetType = "home"; //set mode to home when arrived
            data.targetRoute = routeHome;
            data.health = 100;
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

    // anyone unemployed for job creation or better job needed from citizens
    let needBetterJob = findOpportunity(true);
    let jobless = typeof Object.values(citizens).flat().find(item => item.job == false) !== "undefined";
    let eligibleWorkplace = [];

    // pick one work tile to build workplace on if eligible
    if (commercialtile != false & (jobless || needBetterJob) & commercialDemand >= 25) eligibleWorkplace.push(() => occupyWorkplace(commercialtile, commercial));
    if ((jobless || needBetterJob) & commercialDemand < 100) commercialDemand += 10;
    if (industrialtile != false & (jobless || needBetterJob) & IndustrialDemand >= 25) eligibleWorkplace.push(() => occupyWorkplace(industrialtile, industrial));
    if ((jobless || needBetterJob) & IndustrialDemand < 100) IndustrialDemand += 10;
    if (farmlandtile != false & (jobless || needBetterJob) & FarmlandDemand >= 25) eligibleWorkplace.push(() => occupyWorkplace(farmlandtile, farm));
    if ((jobless || needBetterJob) & FarmlandDemand < 100) FarmlandDemand += 10;
    if (eligibleWorkplace.length != 0) eligibleWorkplace[Math.floor(Math.random() * eligibleWorkplace.length)]();

    //simulate citizen and workpalce tiles
    sceneData.flat().filter(item => (typeof item.quality != "undefined")).forEach(tile => qualityDegrade(tile));
    sceneData.flat().filter(item => (item.type == 3 && item.occupied)).forEach(workplace => zoneTileTick(workplace));
    sceneData.flat().filter(item => (item.type == 4)).forEach(facility => facilityTick(facility));
    Object.values(citizens).flat().forEach(citizen => citizenStep(citizen));

    //update edu stats
    let educationTab = document.getElementById("education");
    educationTab.innerHTML = '';
    Object.keys(facility).filter(key => facility[key].type == "education").forEach(key => {
        let item = facility[key];
        let textElem = document.createElement('span');
        textElem.innerHTML = `${key}: ${Object.values(citizens).flat().filter(i => i.education >= item.education + 1).length} / ${Object.values(citizens).flat().length}<br>`
        educationTab.appendChild(textElem);
    })

    //update stats
    document.getElementById("populationData").innerText = Object.values(citizens).flat().length;
    document.getElementById("unemployedData").innerText = Object.values(citizens).flat().filter(item => item.job == false).length;
    setTimeout(() => requestAnimationFrame(citizenSimulation), simulationSpeed);
}

//simulation for facility buildings
async function facilityTick(tile) {
    if (tile.buildingType == 'firedept') {
        if (tile.buildingData.working) {
            if (tile.buildingData.step >= tile.buildingData.route.length - 1) {
                //arrived at burning building
                tile.buildingData.working = false;
                tile.buildingData.step = 0;
                tile.buildingData.target.burning = false;
                tile.buildingData.target.burningCount = 0;
                scene.remove(tile.buildingData.mesh);
            } else {
                //driving to burning building
                let from = tile.buildingData.route[tile.buildingData.step]
                let to = tile.buildingData.route[tile.buildingData.step + 1];
                let start = performance.now();

                //lerp vehicle
                function anim() {
                    let t = Math.min((performance.now() - start) / simulationSpeed, 1);
                    let lerpX = lerp(from.y - sceneData[0].length / 2, to.y - sceneData[0].length / 2, t);
                    let lerpY = lerp(sceneData[from.y][from.x].height + 0.16, sceneData[to.y][to.x].height + 0.16, t);
                    let lerpZ = lerp(from.x - sceneData[0].length / 2, to.x - sceneData[0].length / 2, t);
                    try { tile.buildingData.mesh.position.set(lerpX, lerpY, lerpZ); } catch (e) { }
                    if (t < 1) { requestAnimationFrame(anim) } else { tile.buildingData.step++; }
                }; anim();
                if (tile.buildingData.step == 0) scene.add(tile.buildingData.mesh);
            }
        } else {
            let burning = sceneData.flat().find(item => item.burning);
            let route = burning ? astar(convertPathfind(sceneData, tile, burning)) : false;
            if (!route) return;

            //set data
            let mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshToonMaterial({ color: 0xff3300 }));
            tile.buildingData.route = route;
            tile.buildingData.target = burning;
            tile.buildingData.working = true;
            tile.buildingData.step = 0;
            tile.buildingData.mesh = mesh;
        }
    };
};

//corruption affects tile
function qualityDegrade(tile) {
    if (tile.qualityTick == randomIntFromInterval(35, 95)) {
        tile.qualityTick = 0;
        if (tile.qualityState > tile.quality) tile.qualityState--;
    }; tile.qualityTick++;
}

//simulation for zoned tiles
function zoneTileTick(tile) {
    if (tile.zone == "housing") {
        //if house is empty, sell tile
        if (Object.values(citizens).flat().filter(item => item.home == tile.uuid).length == 0) cleanTileData(tile, true, true);
    } else {
        if (checkEmployees(tile).length == 0) {
            // count how long tile is empty, if no employees for 30 ticks, sell tile
            if (typeof tile.emptyTick == "undefined") { tile.emptyTick = 0; return; } else { tile.emptyTick++; }
            if (tile.emptyTick > 30) cleanTileData(tile, true, true)
        } else {
            // reset counter if there is an employee
            if (tile.emptyTick) delete tile.emptyTick;
        }
    }

    //random chance of building catching on fire
    let randomChance = Math.random()
    if (randomChance < 0.0005 && !tile.burning && citizensInTile(tile) == 0) {
        tile.burning = true;
        tile.burningCount = 0;
    } else if (tile.burning) {
        tile.burning++;
        spawnSmoke({ x: tile.posX, y: tile.posY, z: tile.posZ }, 3000);
        if (tile.burning > 60) cleanTileData(tile, true, true);
    }
}