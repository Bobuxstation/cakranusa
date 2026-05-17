var { fakerID_ID } = require("@faker-js/faker");
var housingDemand = 0, commercialDemand = 0, IndustrialDemand = 0, FarmlandDemand = 0;
var simulationIndex = 0;
var vehicles = {};
var dayTick = 0;
var simulationRunning = true;
var todayEarnings = 0;
var warningLabels = {};

//========================
// Citizen & City Simulation
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
        targetRoute: [],
        vehicle: Object.keys(vehicleModels)[Math.floor(Math.random() * Object.keys(vehicleModels).length)],

        sessionTick: 0,
        lastPaid: calculateDate(date, true)
    }

    return data;
}

// cheat a bit and limit the amount citizens being simulated per frame
function sectionStep(flatScene) {
    // prioritize moving citizens to avoid traffic
    const movingCitizens = Object.values(citizens).flat().filter(data => data.status == "moving");
    const lowPriorityCitizens = Object.values(citizens).flat().filter(data => data.status != "moving");
    const endIndex = Math.min(simulationIndex + 20, lowPriorityCitizens.length);

    for (let i = 0; i < movingCitizens.length; i++) citizenStep(movingCitizens[i], i, flatScene);
    for (let i = simulationIndex; i < endIndex; i++) citizenStep(lowPriorityCitizens[i], i, flatScene);
    simulationIndex = endIndex >= lowPriorityCitizens.length ? 0 : endIndex;
}

//simulate individual citizen
async function citizenStep(data, index, flatScene) {
    let checkHome;

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
            //find way to work after 10-15 ticks at home
            if (data.sessionTick <= randomIntFromInterval(10, 15)) break;
            if (data.health <= 95) data.health += randomIntFromInterval(2, 5);

            //go to hospital if health less than 50
            let hospitalTile = findFacility("medical");
            if (data.health < 50 && hospitalTile) {
                route = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], hospitalTile));
                if (route != null) startMoving("hospital", route, data); break;
            }

            // if education is not high, 25% chance of going to school instead of work
            let schoolTile = flatScene.find(item => item.uuid == data.school);
            if ((data.education != structures[highestEducation].education + 1 & data.school != false) && (Math.random() > 0.25)) {
                route = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], schoolTile));
                if (route != null) startMoving("learn", route, data); break;
            }

            // pray
            let masjidTile = findFacility("religion");
            if (Math.random() < 0.25 && masjidTile) {
                route = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], masjidTile));
                if (route != null) startMoving("pray", route, data); break;
            }

            //go to work if employed
            let jobTile = flatScene.find(item => item.uuid == data.job);
            if (data.job != false) {
                route = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], jobTile));
                if (route != null) startMoving("work", route, data); break;
            }
            break;
        case "moving":
            //create vehicle if first step
            let findPos = data.targetRoute.find(item => item.x == data.location.x && item.y == data.location.y);
            let currentStep = data.targetRoute.indexOf(findPos) == -1 ? 0 : data.targetRoute.indexOf(findPos);
            let vehicleIsNew = false;
            if (!vehicles[data.uuid]) { initVehicle(data, currentStep); vehicleIsNew = true; };

            //delay step if road quality is low (driving only)
            let hasArrived = data.location.x === data.targetRoute.at(-1).x && data.location.y === data.targetRoute.at(-1).y;
            let delayTime = Math.floor((100 - sceneData[data.targetRoute[currentStep].y][data.targetRoute[currentStep].x].qualityState || 100) / 10);
            if (delayTime != 0 && !hasArrived && !vehicleIsNew && !data.isWalking) {
                data.roadWait = (data.roadWait < delayTime - 1) ? data.roadWait + 1 : 0;
                if (data.roadWait < delayTime - 1) break;
            }

            //steps
            if (hasArrived) {
                //drive to destination building & delete vehicle model (final step)
                try { lerpVehicle(vehicles[data.uuid].position.clone(), getNextPosition(data, data.targetRoute.at(-1), currentStep), data.targetRoute[currentStep].rot, data, true); } catch (error) { }
            } else {
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
                if (vehicleIsNew) {
                    vehicles[data.uuid].position.set(changePos.x, changePos.y, changePos.z);
                } else {
                    lerpVehicle(vehicles[data.uuid].position.clone(), changePos, data.targetRoute[currentStep].rot, data);
                }
            }
            break;
        case "work":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;

            //find route and change to moving mode
            routeHome = astar(convertPathfind(sceneData, sceneData[data.location.y][data.location.x], checkHome));
            if (routeHome != null) startMoving("home", routeHome, data); else break;

            //tiredness and paycheck
            let currentJob = flatScene.find(item => item.uuid == data.job);
            let paycheck = currentJob ? allZones[currentJob.zone][currentJob.buildingModel].pay : 0;
            data.health -= randomIntFromInterval(20, 25);
            data.wallet += Math.floor(paycheck * (1 - taxes.salary));

            //paycheck tax
            let paycheckTax = Math.floor(paycheck * taxes.salary)
            money += paycheckTax;
            todayEarnings += paycheckTax;
            break;
        case "learn":
            //after 15-25 ticks find path home
            if (data.sessionTick <= randomIntFromInterval(15, 25)) break;

            //find route and change to moving mode
            let addition = data.education + calculateFacilityAddition(data.location.y, data.location.x) * budget.education;
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
            if (data.health < 100) data.health = budget.healthcare * 100;
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
function allStep(seed) {
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

        //simulate citizen and workpalce tiles
        let calcSupply = calculateSupplied();
        let originalSupply = JSON.parse(JSON.stringify(calcSupply));
        let zoneTiles = flatScene.filter(item => (item.type == 3 && item.occupied));
        zoneTiles.forEach((workplace, i) => zoneTileTick(workplace, calcSupply, originalSupply, (zoneTiles.length - 1 == i)));

        //simulate citizen and workpalce tiles
        flatScene.filter(item => (typeof item.quality != "undefined")).forEach(tile => qualityDegrade(tile));
        flatScene.filter(item => (item.type == 4)).forEach(facility => facilityTick(facility));
        sectionStep(flatScene);

        //update stats
        let citizensFlat = Object.values(citizens).flat();
        document.getElementById("money").innerText = money.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
        document.getElementById("populationData").innerText = citizensFlat.length;
        document.getElementById("touristData").innerText = tourismProfit();
        document.getElementById("airquality").innerText = `Air Quality: ${((1 - calculatePollution()) * 100).toFixed(1)}%`;
        document.getElementById("population").innerText = `Population: ${citizensFlat.length}`;
        document.getElementById("unemployedData").innerText = citizensFlat.filter(item => item.job == false).length;
        document.getElementById("unemploymentVal").innerText = `${Math.floor(((citizensFlat.filter(item => item.job == false).length / citizensFlat.length) || 0) * 100)}%`;
        document.getElementById("unemploymentRate").value = ((citizensFlat.filter(item => item.job == false).length / citizensFlat.length) || 0) * 100;
        tileInfo(sceneData.flat()[updateInfo]);

        //stats menu
        updateEducationStats();
        summarizeBuilt();

        //pollution
        scene.fog.density = 0.001 * (calculatePollution() * 25);

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

            //weather for that day
            rainCanvas.style.display = isRaining(seed, date) ? "block" : "none";

            //update average earnings
            console.log(todayEarnings);
            todayEarnings = 0;
        }
    } catch (error) { console.log(error) }

    //loop simulation
    if (simulationRunning) setTimeout(() => requestAnimationFrame(allStep), simulationSpeed);
}

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

//simulation for facility buildings
async function facilityTick(tile) {
    if (tile.buildingType == 'firedept') {
        if (tile.buildingData.working & (typeof vehicles[`firedept-${tile.uuid}`] != "undefined")) {
            if (tile.buildingData.step >= tile.buildingData.route.length - 1) {
                //arrived at burning building
                tile.buildingData.working = false;
                tile.buildingData.step = 0;
                tile.buildingData.target.burning = false;
                tile.buildingData.target.burningCount = 0;

                //delete vehicle model
                scene.remove(vehicles[`firedept-${tile.uuid}`]);
                delete vehicles[`firedept-${tile.uuid}`];
            } else {
                //driving to burning building
                let from = tile.buildingData.route[tile.buildingData.step]
                let to = tile.buildingData.route[tile.buildingData.step + 1];
                let start = performance.now();

                //lerp vehicle
                function anim() {
                    let t = Math.min((performance.now() - start) / (simulationSpeed * 1.1), 1);
                    try {
                        vehicles[`firedept-${tile.uuid}`].position.set(lerp(from.y - sceneData[0].length / 2, to.y - sceneData[0].length / 2, t), lerp(sceneData[from.y][from.x].height + 0.16, sceneData[to.y][to.x].height + 0.16, t), lerp(from.x - sceneData[0].length / 2, to.x - sceneData[0].length / 2, t));
                        vehicles[`firedept-${tile.uuid}`].rotation.set(0, to.rot, 0);
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
            vehicles[`firedept-${tile.uuid}`] = mesh;
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
function zoneTileTick(tile, calcSupply, originalSupply, isLast) {
    let warnings = [];
    if (!tile.age) tile.age = 0;

    if (tile.zone == "housing") {
        //employment info
        let tileJobless = citizens[tile.index] ? citizens[tile.index].filter(u => u.job == false).length : 0;
        if (tileJobless != 0) warnings.push(`${tileJobless} citizen(s) unemployed!`);

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
    if (randomChance < 0.005 && !tile.burning && citizensInTile(tile) == 0) {
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