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
        "price": 150_000
    },
    'Oak Forest': {
        "model": "assets/trees/j2",
        "price": 150_000
    },
    'Acacia Forest': {
        "model": "assets/trees/j3",
        "price": 150_000
    },
    'Pine Forest': {
        "model": "assets/trees/j4",
        "price": 150_000
    },
    'Swamp forest': {
        "model": "assets/trees/j5",
        "price": 150_000
    },
    //Zoning
    "housing": {
        "model": "assets/zoning/housing",
        "price": 100_000
    },
    "commercial": {
        "model": "assets/zoning/commercial",
        "price": 100_000
    },
    "industrial": {
        "model": "assets/zoning/industrial",
        "price": 100_000
    },
    "farm": {
        "model": "assets/zoning/farm",
        "price": 100_000
    },
    //Transport
    "road": {
        "model": "assets/roads/plainroad",
        "variableModel": true,
        "price": 1_500_000,
        "walkable": false
    },
    "road with sidewalks": {
        "model": "assets/roads/road",
        "variableModel": true,
        "price": 3_000_000,
        "walkable": true
    },
    //Healthcare
    "hospital": {
        "model": "assets/facility/hospital",
        "type": "medical",
        "slots": 'Math.floor(8 * budget.healthcare)',
        "price": 150_000_000
    },
    //Police
    "police station": {
        "model": "assets/facility/polisi",
        "type": "police",
        "slots": 'Math.floor(8 * budget.police)',
        "price": 120_000_000
    },
    "tax office": {
        "model": "assets/facility/polisi",
        "type": "taxoffice",
        "price": 120_000_000
    },
    //Fire Dept
    "fire department": {
        "model": "assets/facility/damkar",
        "type": "firedept",
        "slots": 'Math.floor(8 * budget.firefighter)',
        "price": 100_000_000
    },
    //Religion
    "masjid": {
        "model": "assets/facility/mosque",
        "type": "religion",
        "slots": 16,
        "price": 150_000_000
    },
    "cathedral": {
        "model": "assets/facility/katedral",
        "type": "religion",
        "slots": 16,
        "price": 150_000_000
    },
    //Education
    "elementary school": {
        "model": "assets/facility/school",
        "type": "education",
        "education": 1,
        "slots": 'Math.floor(16 * budget.education)',
        "price": 100_000_000
    },
    "middle school": {
        "model": "assets/facility/school",
        "type": "education",
        "education": 2,
        "slots": 'Math.floor(16 * budget.education)',
        "price": 110_000_000
    },
    "high school": {
        "model": "assets/facility/school",
        "type": "education",
        "education": 3,
        "slots": 'Math.floor(16 * budget.education)',
        "price": 120_000_000
    },
    //Leisure
    "Bus stop": {
        "model": "assets/facility/halte",
        "type": "leisure",
        "price": 20_000_000
    },
    "Football field": {
        "model": "assets/facility/football",
        "type": "leisure",
        "price": 25_000_000
    },
    "Padel Field": {
        "model": "assets/facility/padel",
        "type": "leisure",
        "price": 25_000_000
    },
    "Park": {
        "model": "assets/facility/park",
        "type": "tourism",
        "price": 25_000_000
    },
    "Fountain Monument": {
        "model": "assets/facility/monumen",
        "type": "tourism",
        "price": 25_000_000
    },
    //Services
    "recycling plant": {
        "model": "assets/facility/recycle plant",
        "type": "waste",
        "capacity": 2400,
        "price": 150_000_000
    },
    "wind turbine": {
        "model": "assets/facility/kincir",
        "type": "electric cable",
        "capacity": 150,
        "price": 50_000_000
    },
    "solar panel": {
        "model": "assets/facility/PLTS",
        "type": "electric cable",
        "capacity": 150,
        "price": 50_000_000
    },
    "water pump": {
        "model": "assets/facility/watertreatment",
        "type": "water pipe",
        "capacity": 150,
        "price": 50_000_000
    },
    //Supply
    "electric cable": {
        "model": "assets/pipe/cable",
        "capacity": 150,
        "label": "Electricity",
        "variableModel": true,
        "price": 100_000
    },
    "water pipe": {
        "model": "assets/pipe/pipe",
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
    underground.forEach(async item => {
        let button = document.createElement("button");
        button.innerText = await translate(item);
        button.onclick = () => setTool(item, 'Demolish Underground');

        document.getElementById("demolishUnderground").appendChild(button);
        undergroundGroups[item] = {};
    })
};

//fill build menu
Object.keys(buildmenu).forEach(async (item, i) => {
    const button = document.createElement("button");
    button.className = 'buildTabButton';
    button.innerText = await translate(item);
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

        subItemButton.innerHTML = `${await translate(subItemKey)}<i class="price">~${subItem.price ? subItem.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }) : await translate("Free")}*</i>`;
        subItemButton.onclick = () => { setTool(subItemKey, item) };
        subItemButton.onmouseout = () => { document.getElementById("hint").style.display = "none"; };
        subItemButton.onmouseover = async () => {
            Object.values(document.getElementsByClassName("hintPreview")).forEach(element => element.style.display = element.id == `${subItemKey}` ? "block" : "none");
            document.getElementById("imageSide").style.display = "block";
            document.getElementById("hintTitle").innerText = await translate(subItemKey);
            document.getElementById("hintContent").innerText = `
                ${await translate(`desc-${subItemKey}`)}
                *${await translate('pricedisclamer')}`;
            document.getElementById("hint").style.display = "block";
        };

        renderThumbnail(subItem, subItemKey);
    });

    document.getElementById("buildLeft").appendChild(button);
    document.getElementById("buildRight").appendChild(tab);
});

var splashtext = [
    "With corruption!",
    "100% Not rushed",
    "Where are the promised housing zones?",
    "Disasters coming soon!",
    "Electricity not included",
    "0% Employment rates!",
    "Write it down, @poskita",
    "Yes, we will fix the broken roads",
    "32 Road tiles!",
    "has the keys!",
    "Stop cutting down those trees!",
    "Water not included",
    "Models by TAR",
    "Brought to you by Perintis Interactive"
];