let housingDemand = 0, commercialDemand = 0, IndustrialDemand = 0, FarmlandDemand = 0;

//========================
// Citizen & City Simulation
//========================

//create new citizen data
function createNewCitizen(tile) {
    let seed = Math.floor(Math.random() * 100000);

    faker.seed(seed);
    let username = faker.internet.username();
    let fullName = faker.person.fullName();
    let bio = faker.person.bio();

    let data = {
        home: tile.uuid,
        uuid: makeUniqueId(Object.values(citizens).flat()),
        job: false,
        school: false,
        wallet: 100000, // start with 100k
        health: 100,
        education: 1, // basic education
        moral: randomIntFromInterval(50, 100),

        username: username,
        name: fullName,
        bio: bio,

        location: findTileCoordinate(sceneData, tile),
        status: "home",
        targetType: "",
        targetDir: "",
        targetRoute: [],
        vehicle: Object.keys(vehicleModels)[Math.floor(Math.random() * Object.keys(vehicleModels).length)],

        sessionTick: 0,
        lastPaid: calculateDate(date, true)
    }

    return data;
}

//simulate individual citizen
let vehicles = {};
async function citizenStep(data) {
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

    //pay taxes
    if (data.lastPaid != calculateDate(date, true)) {
        data.lastPaid = calculateDate(date, true);

        let transportTax = (vehicleModels[data.vehicle] || 0) * taxes.transportation;
        let landTax = ((houses[checkHome.buildingModel].price / houses[checkHome.buildingModel].slots) || 0) * taxes.land;
        if (findFacility("taxoffice")) {
            money += transportTax + landTax;
            data.money -= transportTax + landTax;
        }
    }

    //simulation steps
    switch (data.status) {
        case "home":
            //find way to work after 10-15 ticks at home
            if (data.sessionTick <= randomIntFromInterval(10, 15)) break;
            if (data.health <= 95) data.health += randomIntFromInterval(2, 5);

            //go to hospital if health less than 50
            let hospitalTile = findFacility("medical");
            if (data.health < 50 && hospitalTile) {
                route = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], hospitalTile));
                if (route != null) startMoving("hospital", route, data); break;
            }

            // if education is not high, 15% chance of going to school instead of work
            if ((data.education != education[highestEducation].education + 1 & data.school != false) && (Math.random() > 0.15)) {
                route = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], sceneData.flat().find(item => item.uuid == data.school)));
                if (route != null) startMoving("learn", route, data); break;
            }

            // pray
            let masjidTile = findFacility("religion");
            if (Math.random() < 0.25 && masjidTile) {
                route = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], masjidTile));
                if (route != null) startMoving("pray", route, data); break;
            }

            //go to work if employed
            if (data.job != false) {
                route = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], sceneData.flat().find(item => item.uuid == data.job)));
                if (route != null) startMoving("work", route, data); break;
            }
            break;
        case "moving":
            //create vehicle if first step
            let currentStep = data.targetRoute.indexOf(data.location) == -1 ? 0 : data.targetRoute.indexOf(data.location);
            if (!vehicles[data.uuid]) { let mesh = await loadWMat(data.vehicle); mesh.scale.setScalar(0.156); scene.add(mesh); vehicles[data.uuid] = mesh; }

            //delay step if road quality is low
            let hasArrived = data.location.x === data.targetRoute.at(-1).x && data.location.y === data.targetRoute.at(-1).y;
            let delayTime = Math.floor((100 - sceneData[data.targetRoute[currentStep].y][data.targetRoute[currentStep].x].qualityState || 100) / 10);
            if (delayTime != 0 && !hasArrived) { data.roadWait = (data.roadWait < delayTime - 1) ? data.roadWait + 1 : 0; if (data.roadWait < delayTime - 1) break; }

            //steps
            if (hasArrived) {
                //delete vehicle model (final step)
                data.status = data.targetType;
                scene.remove(vehicles[data.uuid]);
                delete vehicles[data.uuid];
            } else {
                //move conditions (is home, is final target or vehicle obstructing path)
                let targetPos = data.targetRoute[currentStep + 1];
                let isHome = (data.location.x === data.targetRoute[0].x && data.location.y === data.targetRoute[0].y);
                let isFinalTarget = (targetPos.x === data.targetRoute.at(-1).x && targetPos.y === data.targetRoute.at(-1).y);
                let vehicleInTarget = Object.values(citizens).flat().some(item => item.location.x === targetPos.x && item.location.y === targetPos.y && item.location.direction === targetPos.direction);
                if (vehicleInTarget && !isFinalTarget && !isHome) break;

                //set target position & shift to correct lane
                let changePos = { x: data.location.y - (sceneData[0].length / 2), y: sceneData[data.location.y][data.location.x].height + 0.125, z: data.location.x - (sceneData[0].length / 2) };
                if (targetPos.direction == "left") changePos.x -= 0.15;
                if (targetPos.direction == "right") changePos.x += 0.15;
                if (targetPos.direction == "down") changePos.z -= 0.15;
                if (targetPos.direction == "up") changePos.z += 0.15;
                data.location = targetPos;

                //set vehicle position (first step) or animate movement
                if (currentStep == 0) { vehicles[data.uuid].position.set(changePos.x, changePos.y, changePos.z); break; }
                else { lerpVehicle(vehicles[data.uuid].position.clone(), changePos, data.targetRoute[currentStep].rot, data); }
            }
            break;
        case "work":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;

            //find route and change to moving mode
            routeHome = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome));
            if (routeHome != null) startMoving("home", routeHome, data); else break;

            //tiredness and paycheck
            let paycheck = sceneData.flat().find(item => item.uuid == data.job) ? sceneData.flat().find(item => item.uuid == data.job).buildingData.pay : 0;
            data.health -= randomIntFromInterval(20, 25);
            data.wallet += Math.floor(paycheck * (1 - taxes.salary));
            money += Math.floor(paycheck * taxes.salary);
            break;
        case "learn":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;

            //find route and change to moving mode
            let addition = data.education + calculateFacilityAddition(data.location.y, data.location.x);
            routeHome = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome));
            if (routeHome != null) startMoving("home", routeHome, data); else break;
            if (data.moral <= 90) data.moral += calculateFacilityAddition(data.location.y, data.location.x, true);
            if (data.health > 0) data.health -= randomIntFromInterval(5, 10);
            if (addition >= Math.floor(data.education) + 1) { data.school = false; data.education = Math.floor(data.education) + 1 } else { data.education = addition; };
            break;
        case "hospital":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;

            //find route and change to moving mode
            routeHome = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome));
            if (routeHome != null) startMoving("home", routeHome, data); else break;
            if (data.health < 100) data.health = 100;
            break;
        case "pray":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;

            //find route and change to moving mode
            routeHome = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome));
            if (routeHome != null) startMoving("home", routeHome, data); else break;
            if (data.moral <= 90) data.moral += calculateFacilityAddition(data.location.y, data.location.x, true);
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
async function citizenSimulation(seed) {
    try {
        //skip if paused
        if (simulationSpeed == 0) { requestAnimationFrame(citizenSimulation); return; };

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
        let calcSupply = calculateSupplied();
        let originalSupply = JSON.parse(JSON.stringify(calcSupply));
        let zoneTiles = sceneData.flat().filter(item => (item.type == 3 && item.occupied));
        zoneTiles.forEach((workplace, i) => zoneTileTick(workplace, calcSupply, originalSupply, (zoneTiles.length - 1 == i)));

        //simulate citizen and workpalce tiles
        sceneData.flat().filter(item => (typeof item.quality != "undefined")).forEach(tile => qualityDegrade(tile));
        sceneData.flat().filter(item => (item.type == 4)).forEach(facility => facilityTick(facility));
        Object.values(citizens).flat().forEach(citizen => citizenStep(citizen));

        //update stats
        let citizensFlat = Object.values(citizens).flat();
        document.getElementById("populationData").innerText = citizensFlat.length;
        document.getElementById("population").innerText = citizensFlat.length;
        document.getElementById("unemployedData").innerText = citizensFlat.filter(item => item.job == false).length;
        document.getElementById("unemploymentVal").innerText = `${Math.floor(((citizensFlat.filter(item => item.job == false).length / citizensFlat.length) || 0) * 100)}%`;
        document.getElementById("unemploymentRate").value = ((citizensFlat.filter(item => item.job == false).length / citizensFlat.length) || 0) * 100;
        updateEducationStats();
        summarizeBuilt();

        //day cycle
        document.getElementById("dateProgress").style.width = `${document.getElementById("date").getBoundingClientRect().width}px`;
        document.getElementById("dateString").innerText = calculateDate(date);
        document.getElementById("dateProgress").value = dayTick;
        if (dayTick < 40) dayTick += 1;
        else { dayTick = 0; date += 1; pickMessage(); }
    } catch (error) { }

    //loop simulation
    setTimeout(() => requestAnimationFrame(citizenSimulation), simulationSpeed);
}

//calculate total capacity of all supply networks
function calculateSupplied() {
    let totalSupplied = {};
    Object.keys(underground).forEach(key => {
        totalSupplied[key] ??= {};

        let suppliers = sceneData.flat().filter(item => (item.type == 4));
        suppliers = suppliers.filter(item => (item.buildingData.type == key && item[key]));
        suppliers.forEach(item => {
            totalSupplied[key][item[`${key}_network`]] ??= 0;
            totalSupplied[key][item[`${key}_network`]] += item.buildingData.capacity;
        });
    });

    return totalSupplied;
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
                    try {
                        tile.buildingData.mesh.position.set(lerp(from.y - sceneData[0].length / 2, to.y - sceneData[0].length / 2, t), lerp(sceneData[from.y][from.x].height + 0.16, sceneData[to.y][to.x].height + 0.16, t), lerp(from.x - sceneData[0].length / 2, to.x - sceneData[0].length / 2, t));
                        tile.buildingData.mesh.rotation.set(0, to.rot, 0);
                    } catch (e) { } //sometimes broken idk why
                    if (t < 1) { requestAnimationFrame(anim) } else { tile.buildingData.step++; }
                }; anim();
            }
        } else {
            let burning = sceneData.flat().find(item => item.burning);
            let route = burning ? astar(convertPathfind(sceneData, tile, burning)) : false;
            if (!route) return;

            //set data
            let mesh = await loadWMat('assets/vehicles/FIRETRUCK');
            mesh.scale.setScalar(0.156);
            scene.add(mesh);

            //set data
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
    if (tile.qualityTick >= randomIntFromInterval(35, 95)) {
        tile.qualityTick = 0;
        if (tile.qualityState > tile.quality) tile.qualityState--;
    }; tile.qualityTick++;
}

//simulation for zoned tiles
var warningLabels = {};
function zoneTileTick(tile, calcSupply, originalSupply, isLast) {
    let warnings = [];
    if (!tile.age) tile.age = 0;

    if (tile.zone == "housing") {
        //employment info
        let tileJobless = citizens[tile.index] ? citizens[tile.index].filter(u => u.job == false).length : 0;
        if (tileJobless != 0) warnings.push(`${tileJobless} citizen(s) unemployed!`);

        //medical info
        let tileHealth = citizens[tile.index] ? citizens[tile.index].filter(u => u.health < 50).length : 0;
        if (tileHealth != 0) warnings.push(`${tileHealth} citizen(s) require medical attention!`);

        // if building is empty, sell tile
        if (checkResidents(tile).length == 0) {
            warnings.push("Building abandoned!");
            cleanTileData(tile, true, true)
        };
    } else {
        if (checkEmployees(tile).length == 0) {
            // count how long tile is empty, if no employees for 30 ticks, sell tile
            if (typeof tile.emptyTick == "undefined") { tile.emptyTick = 0; return; } else { tile.emptyTick++; }
            if (tile.emptyTick > 30) cleanTileData(tile, true, true);
            warnings.push(`No workers!`);
        } else {
            // reset counter if there is an employee
            if (tile.emptyTick) delete tile.emptyTick;
        }
    }

    //consume supply
    Object.keys(tile.consumption).forEach(item => {
        if (!calcSupply[item]) return;
        if (!calcSupply[item][tile[`${item}_network`]]) {
            warnings.push(`Unavailable: ${underground[item].label}`);
            return;
        };

        //subtract consumption from supply
        if (calcSupply[item][tile[`${item}_network`]] - tile.consumption[item] >= 0) {
            calcSupply[item][tile[`${item}_network`]] -= tile.consumption[item];
        } else {
            calcSupply[item][tile[`${item}_network`]] = 0;
            warnings.push(`Not Enough: ${underground[item].label}`);
        };
    })

    //random chance of building catching on fire
    let randomChance = Math.random()
    if (randomChance < 0.0005 && !tile.burning && citizensInTile(tile) == 0) {
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
            element.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
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
}

//calculate leftover values from supply networks
function setSupplyStat(calcSupply, originalSupply) {
    let supplyStat = document.getElementById("supply");
    supplyStat.innerHTML = '';
    Object.keys(calcSupply).forEach(key => {
        let heading = document.createElement("p");
        heading.innerHTML = `<b>${underground[key].label}</b>`;
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