let loaded = {};

//========================
// Vehicles preset
//========================

let vehicleModels = {
    'assets/vehicles/CAR1': 85_000_000,
    'assets/vehicles/CAR2': 98_000_000,
    'assets/vehicles/CAR3': 67_000_000,
    'assets/vehicles/CAR4': 100_000_000,
    'assets/vehicles/BIKE1': 15_000_000,
    'assets/vehicles/BIKE2': 15_000_000,
    'assets/vehicles/BIKE3': 15_000_000,
    'assets/vehicles/BIKE4': 15_000_000,
    'assets/vehicles/BIKE5': 15_000_000,
    'assets/vehicles/BIKE6': 15_000_000
};

//========================
// Zoned buildings preset
//========================

//residential buildings
let houses = {
    'assets/zoning/residential/house-1': {
        "slots": 3,
        "price": 850_000_000,
        "consumption": {
            "electric cable": 10,
            "water pipe": 10
        }
    },
    'assets/zoning/residential/house-2': {
        "slots": 4,
        "price": 900_000_000,
        "consumption": {
            "electric cable": 15,
            "water pipe": 15
        }
    },
    'assets/zoning/residential/house-3': {
        "slots": 6,
        "price": 1_200_000_000,
        "consumption": {
            "electric cable": 15,
            "water pipe": 15
        }
    },
    'assets/zoning/residential/house-4': {
        "slots": 4,
        "price": 900_000_000,
        "consumption": {
            "electric cable": 15,
            "water pipe": 15
        }
    },
    'assets/zoning/residential/house-5': {
        "slots": 6,
        "price": 1_200_000_000,
        "consumption": {
            "electric cable": 15,
            "water pipe": 15
        }
    },
    'assets/zoning/residential/kost-1': {
        "slots": 12,
        "price": 4_000_000_000,
        "consumption": {
            "electric cable": 35,
            "water pipe": 35
        }
    }
};

//commercial buildings
let commercial = {
    'assets/zoning/commercial/shop-1': {
        "level": 2,
        "slots": 3,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 15,
            "water pipe": 15
        }
    },
    'assets/zoning/commercial/shop-2': {
        "level": 3,
        "slots": 6,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/commercial/shop-3': {
        "level": 3,
        "slots": 12,
        "pay": 60000 * 8,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/commercial/shop-4': {
        "level": 3,
        "slots": 12,
        "pay": 60000 * 8,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/commercial/shop-5': {
        "level": 3,
        "slots": 12,
        "pay": 60000 * 8,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    }
};

//industrial buildings
let industrial = {
    'assets/zoning/industrial/industrial-1': {
        "level": 4,
        "slots": 6,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/industrial/industrial-2': {
        "level": 3,
        "slots": 6,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/industrial/industrial-3': {
        "level": 1,
        "slots": 6,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    }
};

//farm buildings
let farm = {
    'assets/zoning/farm/farm-1': {
        "level": 1,
        "slots": 5,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15
        }
    },
    'assets/zoning/farm/farm-2': {
        "level": 1,
        "slots": 5,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15
        }
    },
    'assets/zoning/farm/farm-3': {
        "level": 1,
        "slots": 5,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15
        }
    },
    'assets/zoning/farm/farm-4': {
        "level": 1,
        "slots": 8,
        "pay": 30000 * 8,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15
        }
    }
};

let allZones = { "housing": houses, "commercial": commercial, "industrial": industrial, "farm": farm };

//========================
// Structure Data
//========================

let structures = {
    //Foliage
    'Forest': {
        "model": "assets/trees/j1",
        "description": "Trees for the environment and rainwater absorption",
        "price": 150_000
    },
    'Oak Forest': {
        "model": "assets/trees/j2",
        "description": "Trees for the environment and rainwater absorption",
        "price": 150_000
    },
    'Acacia Forest': {
        "model": "assets/trees/j3",
        "description": "Trees for the environment and rainwater absorption",
        "price": 150_000
    },
    'Pine Forest': {
        "model": "assets/trees/j4",
        "description": "Trees for the environment and rainwater absorption",
        "price": 150_000
    },
    'Swamp forest': {
        "model": "assets/trees/j5",
        "description": "Trees for the environment and rainwater absorption",
        "price": 150_000
    },
    //Zoning
    "housing": {
        "model": "assets/zoning/housing",
        "description": "Allocate selected land(s) for citizen housing",
        "price": 100_000
    },
    "commercial": {
        "model": "assets/zoning/commercial",
        "description": "Allocate selected land(s) for commercial workplaces",
        "price": 100_000
    },
    "industrial": {
        "model": "assets/zoning/industrial",
        "description": "Allocate selected land(s) for industrial workplaces, Affects the environment",
        "price": 100_000
    },
    "farm": {
        "model": "assets/zoning/farm",
        "description": "Allocate selected land(s) for farmland workplaces",
        "price": 100_000
    },
    //Transport
    "road": {
        "model": "assets/roads/plainroad",
        "description": "Connect buildings with each other",
        "variableModel": true,
        "price": 1_500_000,
        "walkable": false
    },
    "road with sidewalks": {
        "model": "assets/roads/road",
        "description": "Connect buildings with each other",
        "variableModel": true,
        "price": 3_000_000,
        "walkable": true
    },
    //Healthcare
    "hospital": {
        "model": "assets/facility/hospital",
        "description": "Keeps citizens healthy",
        "type": "medical",
        "slots": 'Math.floor(8 * budget.healthcare)',
        "price": 150_000_000
    },
    //Police
    "police station": {
        "model": "assets/facility/polisi",
        "description": "Keeps the city safe",
        "type": "police",
        "slots": 'Math.floor(8 * budget.police)',
        "price": 120_000_000
    },
    "tax office": {
        "model": "assets/facility/polisi",
        "description": "Collects taxes from citizens",
        "type": "taxoffice",
        "price": 120_000_000
    },
    //Fire Dept
    "fire department": {
        "model": "assets/facility/damkar",
        "description": "Extinguish any building fires",
        "type": "firedept",
        "slots": 'Math.floor(8 * budget.firefighter)',
        "price": 100_000_000
    },
    //Religion
    "masjid": {
        "model": "assets/facility/mosque",
        "description": "Increase religious and moral values",
        "type": "religion",
        "slots": 16,
        "price": 150_000_000
    },
    "cathedral": {
        "model": "assets/facility/katedral",
        "description": "Increase religious and moral values",
        "type": "religion",
        "slots": 16,
        "price": 150_000_000
    },
    //Education
    "elementary school": {
        "model": "assets/facility/school",
        "description": "Increase citizens education and moral values",
        "type": "education",
        "education": 1,
        "slots": 'Math.floor(16 * budget.education)',
        "price": 100_000_000
    },
    "middle school": {
        "model": "assets/facility/school",
        "description": "Increase citizens education and moral values",
        "type": "education",
        "education": 2,
        "slots": 'Math.floor(16 * budget.education)',
        "price": 110_000_000
    },
    "high school": {
        "model": "assets/facility/school",
        "description": "Increase citizens education and moral values",
        "type": "education",
        "education": 3,
        "slots": 'Math.floor(16 * budget.education)',
        "price": 120_000_000
    },
    //Leisure
    "Bus stop": {
        "model": "assets/facility/halte",
        "description": "Decoration for now",
        "type": "leisure",
        "price": 20_000_000
    },
    "Football field": {
        "model": "assets/facility/football",
        "description": "Field for playing football",
        "type": "leisure",
        "price": 25_000_000
    },
    "Padel Field": {
        "model": "assets/facility/padel",
        "description": "Field for playing padel",
        "type": "leisure",
        "price": 25_000_000
    },
    "Park": {
        "model": "assets/facility/park",
        "description": "Green space for the city",
        "type": "tourism",
        "price": 25_000_000
    },
    "Fountain Monument": {
        "model": "assets/facility/monumen",
        "description": "Green space for the city",
        "type": "tourism",
        "price": 25_000_000
    },
    //Services
    "recycling plant": {
        "model": "assets/facility/recycle plant",
        "description": "Recycle citizens waste to avoid pollution",
        "type": "waste",
        "capacity": 2400,
        "price": 150_000_000
    },
    "wind turbine": {
        "model": "assets/facility/kincir",
        "description": "Wind turbine for electricity",
        "type": "electric cable",
        "capacity": 150,
        "price": 50_000_000
    },
    "solar panel": {
        "model": "assets/facility/PLTS",
        "description": "Solar panel for electricity",
        "type": "electric cable",
        "capacity": 150,
        "price": 50_000_000
    },
    "water pump": {
        "model": "assets/facility/watertreatment",
        "description": "Pumps water from underground",
        "type": "water pipe",
        "capacity": 150,
        "price": 50_000_000
    },
    //Supply
    "electric cable": {
        "model": "assets/pipe/cable",
        "description": "Supplies electricity to buildings",
        "capacity": 150,
        "label": "Electricity",
        "variableModel": true,
        "price": 100_000
    },
    "water pipe": {
        "model": "assets/pipe/pipe",
        "description": "Supplies water to buildings",
        "capacity": 150,
        "label": "Water",
        "variableModel": true,
        "price": 100_000
    },
};

//========================
// Build Menu
//========================

//trees
let foliage = [
    "Forest",
    "Oak Forest",
    "Acacia Forest",
    "Pine Forest",
    "Swamp forest"
];

//zone types
let zones = [
    "housing",
    "commercial",
    "industrial",
    "farm"
];

//transport types
let transport = [
    "road",
    "road with sidewalks"
];

//govt facility
let facility = [
    "hospital",
    "police station",
    "fire department",
    "tax office",
    "masjid",
    "cathedral"
];

//schools and libraries
let education = [
    "elementary school",
    "middle school",
    "high school"
];

//schools and libraries
let leisure = [
    "Bus stop",
    "Football field",
    "Padel Field"
];

//govt facility
let services = [
    "recycling plant",
    "wind turbine",
    "solar panel",
    "water pump"
];

//tourism
let tourism = [
    "Park",
    "Fountain Monument"
];

//underground supplies
let underground = [
    "electric cable",
    "water pipe"
];

//========================
// Build Menu Definitions
//========================

//for build menu
let buildmenu = {
    "Zones": zones,
    "Transport": transport,
    "Facility": facility,
    "Services": services,
    "Supply": underground,
    "Education": education,
    "Leisure": leisure,
    "Foliage": foliage,
    "Tourism": tourism
}

//for build menu
let buildMethod = {
    "Zones": placeZone,
    "Transport": placeRoad,
    "Facility": placeFacility,
    "Education": placeFacility,
    "Leisure": placeFacility,
    "Foliage": placeFoliage,
    "Services": placeFacility,
    "Supply": buildUnderground,
    "Tourism": placeFacility
}

//========================
// build preview renderer
//========================

//build menu preview
var previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
previewRenderer.setSize(512, 512);
previewRenderer.outputEncoding = THREE.sRGBEncoding;
previewRenderer.shadowMap.enabled = true;
previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

//build menu preview
async function renderThumbnail(item, itemKey) {
    let previewScene = new THREE.Scene();
    let previewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 700);
    previewCamera.position.set(0.05, 0.5, -1.77);
    previewCamera.rotation.set(-3.14, 0, 3.14);

    let variableModelStr = item.variableModel ? '_straight' : '';
    let model = await loadWMat(item.model + variableModelStr);
    model.scale.setScalar(0.30);
    model.rotation.set(0, -(Math.PI / 2), 0);

    previewScene.add(model);
    allOfTheLights(previewScene, false);

    setTimeout(() => {
        previewRenderer.render(previewScene, previewCamera);

        let img = document.createElement("img");
        img.src = previewRenderer.domElement.toDataURL();
        img.className = "hintPreview";
        img.id = `${itemKey}`;
        document.getElementById("imageSide").appendChild(img);
    }, 250);
}

//========================
// fill build menu
//========================

//special categories
let highestEducation = education.filter(key => typeof structures[key].education === "number").reduce((maxKey, key) => structures[key].education > structures[maxKey].education ? key : maxKey);

//underground demolish categories
function loadUnderground() {
    document.getElementById("demolishUnderground").innerHTML = '';
    underground.forEach(item => {
        let button = document.createElement("button");
        button.innerText = item;
        button.onclick = () => setTool(item, 'Demolish Underground');

        document.getElementById("demolishUnderground").appendChild(button);
        undergroundGroups[item] = {};
    })
};

//fill build menu
Object.keys(buildmenu).forEach((item, i) => {
    const button = document.createElement("button");
    button.className = 'buildTabButton';
    button.innerText = item;
    button.name = item;
    button.onclick = () => { openTab(`${item}`, 'buildTab') };

    const tab = document.createElement("div");
    tab.className = "buildTab innertab";
    tab.id = item;
    if (i == 0) { tab.style.display = "block"; button.classList.add("selected") };

    buildmenu[item].forEach(async subItemKey => {
        const subItem = structures[subItemKey];
        const subItemButton = document.createElement("button");
        tab.appendChild(subItemButton);

        subItemButton.innerHTML = `${subItemKey}<span class="price">~${subItem.price ? subItem.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }) : "Free"}</span>`;
        subItemButton.onclick = () => { setTool(subItemKey, item) };
        subItemButton.onmouseout = () => { document.getElementById("hint").style.display = "none"; };
        subItemButton.onmouseover = async () => {
            Object.values(document.getElementsByClassName("hintPreview")).forEach(element => element.style.display = element.id == `${subItemKey}` ? "block" : "none");
            document.getElementById("imageSide").style.display = "block";
            document.getElementById("hintTitle").innerText = subItemKey;
            document.getElementById("hintContent").innerText = subItem.description || "No Description";
            document.getElementById("hint").style.display = "block";
        };

        renderThumbnail(subItem, subItemKey);
    });

    document.getElementById("buildLeft").appendChild(button);
    document.getElementById("buildRight").appendChild(tab);
});