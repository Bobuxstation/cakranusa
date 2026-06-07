var { fakerID_ID } = require("@faker-js/faker");

//========================
// Citizen Individual Simulation
//========================

//create new citizen data
function createNewCitizen(tile) {
    let seed = Math.floor(Math.random() * 100000);

    fakerID_ID.seed(seed);
    let username = fakerID_ID.internet.username();
    let fullName = fakerID_ID.person.fullName();
    let bio = fakerID_ID.person.bio();

    let data = {
        home: tile.uuid,
        uuid: makeUniqueId(Object.values(citizens).flat()),
        job: false,
        school: false,
        wallet: 100000, // start with 100k
        health: 100,
        education: (Math.random() > 0.15) ? 1 : randomIntFromInterval(0, structures[highestEducation].education) + 1, // basic education or educated migrant (15% chance)
        moral: randomIntFromInterval(50, 100),

        username: username,
        name: fullName,
        bio: bio,

        location: findTileCoordinate(sceneData, tile),
        status: "home",
        targetType: "",
        targetDir: "",
        vehicle: Object.keys(vehicleModels)[Math.floor(Math.random() * Object.keys(vehicleModels).length)],

        sessionTick: 0,
        lastPaid: calculateDate(date, true)
    }

    return data;
}

// cheat a bit and limit the amount citizens being simulated per frame
var simulationIndex = 0;
function sectionStep(flatScene) {
    // prioritize moving citizens to avoid traffic
    const citizensFlat = Object.values(citizens).flat();
    const movingCitizens = citizensFlat.filter(data => data.status == "moving");
    const lowPriorityCitizens = citizensFlat.filter(data => data.status != "moving");
    const endIndex = Math.min(simulationIndex + 20, lowPriorityCitizens.length);

    for (let i = 0; i < movingCitizens.length; i++) citizenStep(movingCitizens[i], i, flatScene);
    for (let i = simulationIndex; i < endIndex; i++) citizenStep(lowPriorityCitizens[i], i, flatScene);
    for (let i = 0; i < citizensFlat.length; i++) citizensFlat[i].sessionTick++;
    simulationIndex = endIndex >= lowPriorityCitizens.length ? 0 : endIndex;
}

//simulate individual citizen
var todayEarnings = 0;
var vehicles = {};
async function citizenStep(data, index, flatScene) {
    let checkHome, routeHome;

    //dont do if moving, to avoid lag
    if (data.status != "moving") {
        //if health 0, disappear. if house is destroyed, disappear
        checkHome = flatScene.find(item => item.uuid == data.home);
        if (data.health <= 0) { deleteCitizen(data); return; };
        if (!checkHome) { deleteCitizen(data); return; };

        //apply new job if there is none or if there is a better job
        let jobTile = findJob(data);
        let currentJob = flatScene.find(item => item.uuid == data.job);
        let currentJobLevel = (typeof currentJob !== "undefined") ? allZones[currentJob.zone][currentJob.buildingModel].level : 0;
        if ((jobTile != false && data.job == false) || (jobTile ? currentJobLevel < allZones[jobTile.zone][jobTile.buildingModel].level : false)) data.job = jobTile.uuid;
        if (!flatScene.find(item => item.uuid == data.job)) data.job = false;

        //add school if there is none
        let schoolTile = findSchool(Math.floor(data.education));
        if (schoolTile != false & data.school == false) data.school = schoolTile.uuid;
        if (!flatScene.find(item => item.uuid == data.school)) data.school = false;

        //pay taxes
        if (data.lastPaid != calculateDate(date, true)) {
            data.lastPaid = calculateDate(date, true);
            let transportTax = (vehicleModels[data.vehicle] || 0) * taxes.transportation;
            let landTax = ((houses[checkHome.buildingModel].price / houses[checkHome.buildingModel].slots) || 0) * taxes.land;

            if (findFacility("taxoffice")) {
                todayEarnings += transportTax + landTax;
                money += transportTax + landTax;
                data.money -= transportTax + landTax;
            }

            //pay budgets
            if (index == Object.values(citizens).flat().length - 1) {
                Object.values(budget).forEach(i => {
                    if (money - i * 1_000_000 <= 0) return;
                    money -= i * 1_000_000;
                })
            }
        }
    }

    //simulation steps
    switch (data.status) {
        case "home":
            //skip until session time finishes
            if (data.sessionTick <= randomIntFromInterval(10, 15)) break;
            if (data.health <= 95) data.health += randomIntFromInterval(2, 5);
            data.location = findTileCoordinate(sceneData, checkHome);

            //go to hospital if health less than 50
            let hospitalTile = findFacility("medical");
            if (data.health < 50 && hospitalTile) if ((route = pathfind(sceneData, sceneData[data.location.y][data.location.x], hospitalTile))) {
                startMoving("hospital", route, data); break;
            }

            // if education is not high, 50% chance of going to school instead of work
            let schoolTile = flatScene.find(item => item.uuid == data.school);
            if ((data.education != structures[highestEducation].education + 1 & data.school != false) && (Math.random() > 0.5)) if ((route = pathfind(sceneData, sceneData[data.location.y][data.location.x], schoolTile))) {
                startMoving("learn", route, data); break;
            }

            // pray
            let masjidTile = findFacility("religion");
            if (Math.random() < 0.25 && masjidTile) if ((route = pathfind(sceneData, sceneData[data.location.y][data.location.x], masjidTile))) {
                startMoving("pray", route, data); break;
            };

            //go to work if employed
            let jobTile = flatScene.find(item => item.uuid == data.job);
            let isMinister = Object.values(officials).includes(data.uuid);
            if (!isMinister && data.job != false && (route = pathfind(sceneData, sceneData[data.location.y][data.location.x], jobTile))) {
                startMoving("work", route, data); break;
            } else data.job = false;
            break;
        case "moving":
            // moving timeout and init vehicle
            if (data.sessionTick > 100) { vehicleTimeout(data, flatScene); break; };

            //create vehicle if new
            let newVehicle = false;
            let findPos = data.targetRoute.find(item => item.x == data.location.x && item.y == data.location.y);
            let currentStep = data.targetRoute.indexOf(findPos) == -1 ? 0 : data.targetRoute.indexOf(findPos);
            if (!vehicles[data.uuid]) { initVehicle(data.uuid, data.isWalking ? `./assets/default/walker` : `${data.vehicle}`, getNextPosition(data, data.targetRoute.at(currentStep - 1), currentStep)); newVehicle = true };

            //delay step if road quality is low (driving only)
            let hasArrived = data.location.x === data.targetRoute.at(-1).x && data.location.y === data.targetRoute.at(-1).y;
            let delayTime = Math.floor((100 - sceneData[data.targetRoute[currentStep].y][data.targetRoute[currentStep].x].qualityState || 100) / 10);
            if (delayTime != 0 && !hasArrived && !(currentStep == 0) && !data.isWalking) {
                data.roadWait = (data.roadWait < delayTime - 1) ? data.roadWait + 1 : 0;
                //if (data.roadWait < delayTime - 1) break;
            }

            //steps
            if (hasArrived) lerpVehicle(vehicles[data.uuid].position.clone(), getNextPosition(data, data.targetRoute.at(-1), currentStep), data, true);
            else {
                //move conditions (is home, is final target or vehicle obstructing path)
                let targetPos = data.targetRoute[currentStep + 1];
                let isHome = (data.location.x === data.targetRoute[0].x && data.location.y === data.targetRoute[0].y);
                let isFinalTarget = (targetPos.x === data.targetRoute.at(-1).x && targetPos.y === data.targetRoute.at(-1).y);
                let vehicleInTarget = data.isWalking ? false : Object.values(citizens).flat().some(item => item.location.x === targetPos.x && item.location.y === targetPos.y && item.location.direction === targetPos.direction);
                if (vehicleInTarget && !isFinalTarget && !isHome) break;

                //set target position & shift to correct lane
                let changePos = getNextPosition(data, targetPos, currentStep);
                data.location = targetPos;

                //set vehicle position (first step) or animate movement
                if (newVehicle) vehicles[data.uuid].position.set(changePos.x, changePos.y, changePos.z);
                else lerpVehicle(vehicles[data.uuid].position.clone(), changePos, data, false);
            }
            break;
        case "work":
            //skip until session time finishes
            if (data.sessionTick <= randomIntFromInterval(30, 40)) break;

            //go home
            routeHome = pathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome);
            if (routeHome) startMoving("home", routeHome, data); else vehicleTimeout(data, flatScene);

            //tiredness and paycheck
            let currentJob = flatScene.find(item => item.uuid == data.job);
            let paycheck = currentJob ? allZones[currentJob.zone][currentJob.buildingModel].pay : 0;
            data.health -= randomIntFromInterval(20, 25);
            processSalary(data, paycheck);
            break;
        case "learn":
            //skip until session time finishes
            if (data.sessionTick <= randomIntFromInterval(30, 40)) break;

            //go home
            routeHome = pathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome);
            if (routeHome) startMoving("home", routeHome, data); else vehicleTimeout(data, flatScene);

            //add to data
            let addition = data.education + calculateFacilityAddition(data.location.y, data.location.x) * budget.education;
            if (data.moral <= 90) data.moral += calculateFacilityAddition(data.location.y, data.location.x, true);
            if (data.health > 0) data.health -= randomIntFromInterval(5, 10);
            if (addition >= Math.floor(data.education) + 1) { data.school = false; data.education = Math.floor(data.education) + 1 } else { data.education = addition; };
            break;
        case "hospital":
            //skip until session time finishes
            if (data.sessionTick <= randomIntFromInterval(30, 40)) break;

            //go home
            routeHome = pathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome);
            if (routeHome) startMoving("home", routeHome, data); else vehicleTimeout(data, flatScene);

            //add to data
            if (data.health < 100) data.health = budget.healthcare * 100;
            break;
        case "pray":
            //skip until session time finishes
            if (data.sessionTick <= randomIntFromInterval(30, 40)) break;

            //go home
            routeHome = pathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome);
            if (routeHome) startMoving("home", routeHome, data); else vehicleTimeout(data, flatScene);

            //add to data
            if (data.moral <= 90) data.moral += calculateFacilityAddition(data.location.y, data.location.x, true);
            break;
        default:
            //if invalid, teleport to home
            data.location = findTileCoordinate(sceneData, checkHome);
            data.status = "home";
            break;
    }
}

//========================
// World simulation (call others)
//========================

//set game speed
function setSpeed(speed) {
    simulationSpeed = speed;
    Object.values(document.getElementsByClassName("timeButton")).forEach(element => {
        if (element.value == speed) element.classList.add("selected");
        else element.classList.remove("selected");
    });
}

//simulate world
var dayTick = 0;
var simulationRunning = true;
var housingDemand = 0, commercialDemand = 0, IndustrialDemand = 0, FarmlandDemand = 0;
function allStep() {
    if (!simulationRunning) return;
    try {
        //skip if paused
        if (simulationSpeed == 0 && simulationRunning) { requestAnimationFrame(allStep); return; };

        // find empty land
        let housingtile = findZone("housing", true, true);
        let commercialtile = findZone("commercial", true, true);
        let industrialtile = findZone("industrial", true, true);
        let farmlandtile = findZone("farm", true, true);
        let flatScene = sceneData.flat();

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

        //simulate citizen and facility tiles
        let calcSupply = calculateSupplied();
        qualityDegrade(flatScene.filter(item => (typeof item.quality != "undefined")));
        zoneTileStep(flatScene.filter(item => (item.type == 3 && item.occupied)), calcSupply, JSON.parse(JSON.stringify(calcSupply)));
        facilityStep(flatScene.filter(item => (item.type == 4)));
        sectionStep(flatScene);

        //update stats
        let citizensFlat = Object.values(citizens).flat();
        document.getElementById("money").innerText = money.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
        document.getElementById("populationData").innerText = citizensFlat.length;
        document.getElementById("airquality").innerText = `Air Quality: ${((1 - calculatePollution()) * 100).toFixed(1)}%`;
        
        //population tab stats
        document.getElementById("population").innerText = `Population: ${citizensFlat.length}`;
        document.getElementById("touristData").innerText = tourismProfit();
        document.getElementById("unemployedData").innerText = `${citizensFlat.filter(item => item.job == false).length} / ${citizensFlat.length}`;
        document.getElementById("unemploymentVal").innerText = `${Math.floor(((citizensFlat.filter(item => item.job == false).length / citizensFlat.length) || 0) * 100)}%`;
        document.getElementById("unemploymentRate").value = ((citizensFlat.filter(item => item.job == false).length / citizensFlat.length) || 0) * 100;
        document.getElementById("currentlyworking").innerText = `${citizensFlat.filter(item => item.status == "work").length} / ${citizensFlat.filter(item => item.job != false).length}`;
        document.getElementById("workVal").innerText = `${Math.floor(((citizensFlat.filter(item => item.status == "work").length / citizensFlat.filter(item => item.job != false).length) || 0) * 100)}%`;
        document.getElementById("workRate").value = (((citizensFlat.filter(item => item.status == "work").length / citizensFlat.filter(item => item.job != false).length) || 0) || 0) * 100;
        tileInfo(sceneData.flat()[updateInfo]);

        //stats menu
        updateMinisterTab(citizensFlat, officials);
        updateEducationStats();
        summarizeBuilt();

        //weather for that day
        let rainingToday = isRaining(date);
        let lowFog = rainingToday ? 0.005 : 0.001;
        rainCanvas.style.display = rainingToday ? "block" : "none";
        scene.fog.density = Math.max(lowFog, (0.001 * (calculatePollution() * 25))); //pollution

        //day cycle
        document.getElementById("dateProgress").style.width = `${document.getElementById("date").getBoundingClientRect().width}px`;
        document.getElementById("dateString").innerText = calculateDate(date);
        document.getElementById("dateProgress").value = dayTick;
        if (dayTick < 40) dayTick += 1;
        else {
            let todayTourismProfit = tourismProfit(true);
            todayEarnings += todayTourismProfit
            money += todayTourismProfit;
            dayTick = 0;
            date += 1;
            pickMessage();

            //update average earnings
            document.getElementById("increase").innerText = ` +${todayEarnings.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}`;
            todayEarnings = 0;
        }
    } catch (error) { console.log(error) }

    //loop simulation
    if (simulationRunning) setTimeout(() => requestAnimationFrame(allStep), simulationSpeed);
}

//========================
// Building Simulation
//========================

//section facilities for simulation
var facilityIndex = 0;
function facilityStep(allFacilities) {
    // prioritize moving citizens to avoid traffic
    const workingFacility = allFacilities.filter(tile => tile.buildingData && tile.buildingData.working);
    const lowPriorityFacility = allFacilities.filter(tile => tile.buildingData && !tile.buildingData.working);
    const endIndex = Math.min(facilityIndex + 20, lowPriorityFacility.length);

    for (let i = 0; i < workingFacility.length; i++) facilityTick(workingFacility[i]);
    for (let i = facilityIndex; i < endIndex; i++) facilityTick(lowPriorityFacility[i]);
    facilityIndex = endIndex >= lowPriorityFacility.length ? 0 : endIndex;
}

//simulation for facility buildings
async function facilityTick(tile) {
    if (tile.buildingType == 'firedept') {
        if (tile.buildingData.working & (typeof vehicles[`firedept-${tile.uuid}`] != "undefined")) {
            //driving to burning building
            let from = tile.buildingData.route[tile.buildingData.step];
            let to = tile.buildingData.route[tile.buildingData.step + 1];
            let start = performance.now();
            let anim = () => {
                //set data
                let time = Math.min((performance.now() - start) / simulationSpeed, 1);
                let fromX = from.y - sceneData[0].length / 2;
                let toX = to.y - sceneData[0].length / 2
                let fromY = from.x - sceneData[0].length / 2;
                let toY = to.x - sceneData[0].length / 2
                let fromH = sceneData[from.y][from.x].height + 0.16;
                let toH = sceneData[to.y][to.x].height + 0.16;

                //lerp model
                if (vehicles[`firedept-${tile.uuid}`]) {
                    //vehicle opacity (intro/outro)
                    if (tile.buildingData.step >= tile.buildingData.route.length - 2) vehicles[`firedept-${tile.uuid}`].traverse(obj => { if (obj.isMesh) obj.material.opacity = lerp(obj.material.opacity, 0, time) });
                    else vehicles[`firedept-${tile.uuid}`].traverse(obj => { if (obj.isMesh) obj.material.opacity = lerp(obj.material.opacity, 1, time) });

                    //vehicle pos and rot
                    vehicles[`firedept-${tile.uuid}`].rotation.set(0, Math.atan2(toX - fromX, toY - fromY), 0);
                    vehicles[`firedept-${tile.uuid}`].position.set(lerp(fromX, toX, time), lerp(fromH, toH, time), lerp(fromY, toY, time));
                }

                //loop animation or delete vehicle if set
                if (time < 1) requestAnimationFrame(anim);
                else if (tile.buildingData.step >= tile.buildingData.route.length - 2) {
                    //arrived at burning building
                    tile.buildingData.working = false;
                    tile.buildingData.step = 0;
                    tile.buildingData.target.burning = false;
                    tile.buildingData.target.burningCount = 0;

                    //delete vehicle model
                    scene.remove(vehicles[`firedept-${tile.uuid}`]);
                    delete vehicles[`firedept-${tile.uuid}`];
                } else tile.buildingData.step++;
            }; anim();
        } else {
            //find burning building
            let burning, route;
            if (!(route = (burning = sceneData.flat().find(item => item.burning)) ? pathfind(sceneData, tile, burning) : false)) return;

            //set data
            initVehicle(`firedept-${tile.uuid}`, 'assets/vehicles/FIRETRUCK', { x: tile.posX, y: 0, z: tile.posY })
            tile.buildingData.working = true;
            tile.buildingData.step = 0;
            tile.buildingData.route = route;
            tile.buildingData.target = burning;
        }
    };
};

//corruption affects tile
var roadIndex = 0;
function qualityDegrade(tiles) {
    let endIndex = Math.min(roadIndex + 20, tiles.length);
    let tile

    for (let i = roadIndex; i < endIndex; i++) {
        tile = tiles[i];
        if (tile.qualityTick >= randomIntFromInterval(35, 95)) {
            tile.qualityTick = 0;
            if (tile.qualityState > tile.quality) tile.qualityState--;
        }; tile.qualityTick++;
    };

    roadIndex = endIndex >= tiles.length ? 0 : endIndex;
}

//section zoned buildings for simulation
var zoneIndex = 0;
function zoneTileStep(allZoneTile, calcSupply, originalSupply) {
    const endIndex = Math.min(zoneIndex + 20, allZoneTile.length);
    for (let i = zoneIndex; i < endIndex; i++) zoneTileTick(allZoneTile[i], calcSupply, originalSupply, (i >= allZoneTile.length - 1));
    zoneIndex = endIndex >= allZoneTile.length ? 0 : endIndex;
}

//simulation for zoned tiles
var warningLabels = {};
function zoneTileTick(tile, calcSupply, originalSupply, isLast) {
    try {
        let warnings = [];
        if (!tile.age) tile.age = 0;
        if (tile.zone == "housing") {
            //employment info
            let tileJobless = citizens[tile.index] ? citizens[tile.index].filter(u => u.job == false).length : 0;
            if (tileJobless != 0) warnings.push(`${tileJobless} citizen(s) unemployed!`);

            // if building is empty, sell tile
            if (checkResidents(tile).length == 0) {
                warnings.push("Building abandoned!");
                cleanTileData(tile, true, true);
            };
        } else {
            if (checkEmployees(tile).length == 0) {
                // count how long tile is empty, if no employees for 120 ticks (3 days), sell tile
                if (typeof tile.emptyTick == "undefined") { tile.emptyTick = 0; return; } else { tile.emptyTick++; }
                if (tile.emptyTick > 120) cleanTileData(tile, true, true);
                warnings.push(`No workers!`);
            } else {
                // reset counter if there is an employee
                if (tile.emptyTick) delete tile.emptyTick;
            }
        }

        //consume supply
        Object.keys(allZones[tile.zone][tile.buildingModel].consumption).forEach(item => {
            if (!calcSupply[item]) return;
            if (!calcSupply[item][tile[`${item}_network`]]) {
                warnings.push(`Unavailable: ${structures[item].label}`);
                return;
            };

            //subtract consumption from supply
            if (calcSupply[item][tile[`${item}_network`]] - allZones[tile.zone][tile.buildingModel].consumption[item] >= 0) {
                calcSupply[item][tile[`${item}_network`]] -= allZones[tile.zone][tile.buildingModel].consumption[item];
            } else {
                calcSupply[item][tile[`${item}_network`]] = 0;
                warnings.push(`Not Enough: ${structures[item].label}`);
            };
        })

        //random chance of building catching on fire
        let randomChance = Math.random()
        if (randomChance < 0.0001 && !tile.burning && citizensInTile(tile) == 0) {
            warnings.push("Building is on fire!");
            tile.burning = true;
            tile.burningCount = 0;
        } else if (tile.burning) {
            warnings.push("Building is on fire!");
            tile.burning++;
            spawnSmoke({ x: tile.posX, y: tile.posY, z: tile.posZ }, 3000);
            if (tile.burning > 60) cleanTileData(tile, true, true);
        }

        if (tile.age > 30) {
            if (warnings.length != 0 && typeof warningLabels[tile.index] == "undefined") {
                let element = document.createElement('div');
                element.id = `tile-${tile.index}`;
                element.innerHTML = `<i class="fa-solid fa-bullhorn"></i>`;
                element.className = "warningLabel";
                element.onclick = (event) => { tileSelection(tile, event) };

                if (meshLocations[tile.index]) {
                    let label = new THREE.CSS2DObject(element);
                    meshLocations[tile.index].add(label);
                    warningLabels[tile.index] = label;
                }
            } else if (warnings.length == 0 && typeof warningLabels[tile.index] != "undefined") {
                if (meshLocations[tile.index]) {
                    meshLocations[tile.index].remove(warningLabels[tile.index]);
                    if (document.getElementById(`tile-${tile.index}`)) document.getElementById(`tile-${tile.index}`).remove();
                    delete warningLabels[tile.index];
                };
            }
        }

        //add to stats
        tile.warnings = warnings;
        tile.age++;
        if (isLast) setSupplyStat(calcSupply, originalSupply);
    } catch (error) { }
}

//========================
// Supply Simulation
//========================

//calculate total capacity of all supply networks
function calculateSupplied() {
    let totalSupplied = {};
    underground.forEach(key => {
        totalSupplied[key] ??= {};

        let suppliers = sceneData.flat().filter(item => (item.type == 4));
        suppliers = suppliers.filter(item => (structures[item.building].type == key && item[key]));
        suppliers.forEach(item => {
            totalSupplied[key][item[`${key}_network`]] ??= 0;
            totalSupplied[key][item[`${key}_network`]] += structures[item.building].capacity;
        });
    });

    return totalSupplied;
}

//calculate leftover values from supply networks
function setSupplyStat(calcSupply, originalSupply) {
    let supplyStat = document.getElementById("supply");
    supplyStat.innerHTML = '';
    Object.keys(calcSupply).forEach(key => {
        let heading = document.createElement("p");
        heading.innerHTML = `<b>${structures[key].label}</b>`;
        supplyStat.appendChild(heading);

        if (Object.keys(calcSupply[key]).length == 0) {
            let text = document.createElement("p");
            text.innerText = `Nothing here!`;
            supplyStat.appendChild(text);
        }

        Object.keys(calcSupply[key]).forEach(item => {
            let usedAmount = originalSupply[key][item] - calcSupply[key][item];
            let text = document.createElement("p");
            text.innerText = item;
            supplyStat.appendChild(text);

            let percentageProgress = document.createElement("progress");
            percentageProgress.max = 100;
            percentageProgress.value = ((usedAmount / originalSupply[key][item]) || 0) * 100;
            text.appendChild(percentageProgress);

            let percentageSpan = document.createElement("span");
            percentageSpan.className = 'price';
            percentageSpan.innerText = `${Math.floor(((usedAmount / originalSupply[key][item]) || 0) * 100)}%`
            text.appendChild(percentageSpan);
        })
    })
}