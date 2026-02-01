let loaded = {};

//========================
// Vehicles preset
//========================

let vehicleModels = {
    'assets/vehicles/CAR1': 85_000_000,
    'assets/vehicles/CAR2': 98_000_000,
    'assets/vehicles/CAR3': 67_000_000,
    'assets/vehicles/CAR4': 100_000_000,
    'assets/vehicles/BIKE1': 15_000_000
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
        "pay": 30000,
        "consumption": {
            "electric cable": 15,
            "water pipe": 15
        }
    },
    'assets/zoning/commercial/shop-2': {
        "level": 3,
        "slots": 6,
        "pay": 30000,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/commercial/shop-3': {
        "level": 3,
        "slots": 12,
        "pay": 60000,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/commercial/shop-4': {
        "level": 3,
        "slots": 12,
        "pay": 60000,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/commercial/shop-5': {
        "level": 3,
        "slots": 12,
        "pay": 60000,
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
        "pay": 30000,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/industrial/industrial-2': {
        "level": 3,
        "slots": 6,
        "pay": 30000,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30
        }
    },
    'assets/zoning/industrial/industrial-3': {
        "level": 1,
        "slots": 6,
        "pay": 30000,
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
        "pay": 30000,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15
        }
    },
    'assets/zoning/farm/farm-2': {
        "level": 1,
        "slots": 5,
        "pay": 30000,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15
        }
    },
    'assets/zoning/farm/farm-3': {
        "level": 1,
        "slots": 5,
        "pay": 30000,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15
        }
    },
    'assets/zoning/farm/farm-4': {
        "level": 1,
        "slots": 8,
        "pay": 30000,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15
        }
    }
};

//========================
// Build Menu
//========================

let foliage = {
    'Forest': {
        "model": "assets/trees/j1",
        "description": "Trees for the environment and rainwater absorption",
        price: 150_000
    },
    'Oak Forest': {
        "model": "assets/trees/j2",
        "description": "Trees for the environment and rainwater absorption",
        price: 150_000
    },
    'Acacia Forest': {
        "model": "assets/trees/j3",
        "description": "Trees for the environment and rainwater absorption",
        price: 150_000
    },
    'Pine Forest': {
        "model": "assets/trees/j4",
        "description": "Trees for the environment and rainwater absorption",
        price: 150_000
    },
    'Swamp forest': {
        "model": "assets/trees/j5",
        "description": "Trees for the environment and rainwater absorption",
        price: 150_000
    }
};

//zone types
let zones = {
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
    }
}

//transport types
let transport = {
    "road": {
        "model": "assets/roads/plainroad",
        "description": "Connect buildings with each other",
        "variableModel": true,
        "price": 1_500_000
    },
    "road with sidewalks": {
        "model": "assets/roads/road",
        "description": "Connect buildings with each other",
        "variableModel": true,
        "price": 3_000_000
    }
}

//govt facility
let facility = {
    "hospital": {
        "model": "assets/facility/hospital",
        "description": "Keeps citizens healthy",
        "type": "medical",
        "slots": 8
    },
    "police station": {
        "model": "assets/facility/polisi",
        "description": "Keeps the city safe",
        "type": "police",
        "slots": 8
    },
    "fire department": {
        "model": "assets/facility/damkar",
        "description": "Extinguish any building fires",
        "type": "firedept",
        "slots": 8
    },
    "tax office": {
        "model": "assets/facility/polisi",
        "description": "Collects taxes from citizens",
        "type": "taxoffice",
        "slots": 8
    },
    "masjid": {
        "model": "assets/facility/mosque",
        "description": "Increase religious and moral values",
        "type": "religion",
        "slots": 16
    },
    "cathedral": {
        "model": "assets/facility/katedral",
        "description": "Increase religious and moral values",
        "type": "religion",
        "slots": 16
    }
}

//schools and libraries
let education = {
    "elementary school": {
        "model": "assets/facility/school",
        "description": "Increase citizens education and moral values",
        "type": "education",
        "education": 1,
        "slots": 16
    },
    "middle school": {
        "model": "assets/facility/school",
        "description": "Increase citizens education and moral values",
        "type": "education",
        "education": 2,
        "slots": 16
    },
    "high school": {
        "model": "assets/facility/school",
        "description": "Increase citizens education and moral values",
        "type": "education",
        "education": 3,
        "slots": 16
    }
}

//schools and libraries
let leisure = {
    "Bus stop": {
        "model": "assets/facility/halte",
        "description": "Reduces traffic (max. 10 tile range)",
        "type": "leisure",
    },
    "Football field": {
        "model": "assets/facility/football",
        "description": "Field for playing football",
        "type": "leisure",
    },
    "Padel Field": {
        "model": "assets/facility/padel",
        "description": "Field for playing padel",
        "type": "leisure",
    }
}

//govt facility
let services = {
    "recycling plant": {
        "model": "assets/facility/recycle plant",
        "description": "Recycle citizens waste to avoid pollution",
        "type": "waste",
        "capacity": 2400
    },
    "wind turbine": {
        "model": "assets/facility/kincir",
        "description": "Wind turbine for electricity",
        "type": "electric cable",
        "capacity": 150
    },
    "solar panel": {
        "model": "assets/facility/PLTS",
        "description": "Solar panel for electricity",
        "type": "electric cable",
        "capacity": 150
    },
    "water pump": {
        "model": "assets/facility/watertreatment",
        "description": "Pumps water from underground",
        "type": "water pipe",
        "capacity": 150
    }
}

//tourism
let tourism = {
    "Park": {
        "model": "assets/facility/park",
        "description": "Green space for the city",
        "type": "tourism",
    },
    "Fountain Monument": {
        "model": "assets/facility/monumen",
        "description": "Green space for the city",
        "type": "tourism",
    }
}

let highestEducation = Object.keys(education)
    .filter(key => typeof education[key].education === "number")
    .reduce((maxKey, key) => education[key].education > education[maxKey].education ? key : maxKey);

//========================
// underground category
//========================

let underground = {
    "electric cable": {
        "model": "assets/pipe/cable",
        "description": "Supplies electricity to buildings",
        "capacity": 150,
        "label": "Electricity",
        "variableModel": true
    },
    "water pipe": {
        "model": "assets/pipe/pipe",
        "description": "Supplies water to buildings",
        "capacity": 150,
        "label": "Water",
        "variableModel": true
    }
}

function loadUnderground() {
    document.getElementById("demolishUnderground").innerHTML = '';
    Object.keys(underground).forEach(item => {
        let button = document.createElement("button");
        button.innerText = item;
        button.onclick = () => setTool(item, 'Demolish Underground');

        document.getElementById("demolishUnderground").appendChild(button);
        undergroundGroups[item] = {};
    })
};

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
previewRenderer.setSize(1024, 1024);
previewRenderer.outputEncoding = THREE.sRGBEncoding;
previewRenderer.shadowMap.enabled = true;
previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

//build menu preview
async function renderThumbnail(item, subItem) {
    let previewScene = new THREE.Scene();
    let previewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 700);
    previewCamera.position.set(0.05, 0.5, -1.77);
    previewCamera.rotation.set(-3.14, 0, 3.14);

    let variableModelStr = buildmenu[item][subItem].variableModel ? '_straight' : '';
    let model = await loadWMat(buildmenu[item][subItem].model + variableModelStr);
    model.scale.setScalar(0.30);
    model.rotation.set(0, -(Math.PI / 2), 0);

    previewScene.add(model);
    allOfTheLights(previewScene, false);
    return new Promise((resolve) => {
        setTimeout(() => {
            previewRenderer.render(previewScene, previewCamera);
            resolve(previewRenderer.domElement.toDataURL());
        }, 250);
    });
}

//========================
// fill build menu
//========================

//set hint
function setHint(image, title, content) {
    if (image) {
        document.getElementById("imageSide").style.display = "block";
        document.getElementById("hintPreview").src = image;
    } else {
        document.getElementById("imageSide").style.display = "none";
    };

    document.getElementById("hintTitle").innerText = title;
    document.getElementById("hintContent").innerText = content;
    document.getElementById("hint").style.display = "block";
}

//fill build menu
Object.keys(buildmenu).forEach((item, i) => {
    const button = document.createElement("button");
    button.className = 'buildTabButton';
    button.innerText = item;
    button.onclick = () => { openTab(`${item}`, 'buildTab') };

    const tab = document.createElement("div");
    tab.className = "buildTab innertab";
    tab.id = item;
    if (i == 0) { tab.style.display = "block"; button.classList.add("selected") };

    Object.keys(buildmenu[item]).forEach(async (subItem) => {
        const subItemButton = document.createElement("button");
        const thumbnail = await renderThumbnail(item, subItem);
        const price = buildmenu[item][subItem].price ? buildmenu[item][subItem].price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }) : "Free";

        subItemButton.innerHTML = `${subItem}<span class="price">${price}</span>`;
        subItemButton.onclick = () => { setTool(subItem, item) };
        subItemButton.onmouseout = () => { document.getElementById("hint").style.display = "none"; }
        subItemButton.onmouseover = async () => { setHint(thumbnail, subItem, buildmenu[item][subItem].description || "No Description") }
        tab.appendChild(subItemButton);
    });

    document.getElementById("buildLeft").appendChild(button);
    document.getElementById("buildRight").appendChild(tab);
});