let loaded = {};

//========================
// Zoned buildings preset
//========================

//residential buildings
let houses = {
    'assets/residential/house-1': {
        "level": 2,
        "slots": 3,
        "consumption": {
            "electric cable": 10,
            "water pipe": 10,
            "sewage pipe": 10
        }
    },
    'assets/residential/house-2': {
        "level": 3,
        "slots": 4,
        "consumption": {
            "electric cable": 15,
            "water pipe": 15,
            "sewage pipe": 15
        }
    }
};

//commercial buildings
let commercial = {
    'assets/commercial/shop-1': {
        "level": 2,
        "slots": 3,
        "pay": 30000,
        "consumption": {
            "electric cable": 15,
            "water pipe": 15,
            "sewage pipe": 15
        }
    },
    'assets/commercial/shop-2': {
        "level": 3,
        "slots": 6,
        "pay": 30000,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30,
            "sewage pipe": 30
        }
    }
};

//industrial buildings
let industrial = {
    'assets/industrial/industrial-1': {
        "level": 4,
        "slots": 6,
        "pay": 30000,
        "consumption": {
            "electric cable": 30,
            "water pipe": 30,
            "sewage pipe": 30
        }
    }
};

//farm buildings
let farm = {
    'assets/farm/farm-1': {
        "level": 1,
        "slots": 5,
        "pay": 30000,
        "consumption": {
            "electric cable": 5,
            "water pipe": 15,
            "sewage pipe": 5
        }
    }
};

//========================
// Build Menu
//========================

let foliage = [
    //'assets/Tree.glb',
    //'assets/Tree2.glb',
    'assets/Tree3.glb'
];

//zone types
let zones = {
    "housing": {
        "model": "assets/zoning/housing"
    },
    "commercial": {
        "model": "assets/zoning/commercial"
    },
    "industrial": {
        "model": "assets/zoning/industrial"
    },
    "farm": {
        "model": "assets/zoning/farm"
    },
}

//transport types
let transport = {
    "road": {
        "model": "assets/roads/road",
        "variableModel": true
    }
}

//govt facility
let facility = {
    "hospital": {
        "model": "assets/facility/hospital",
        "type": "medical",
        "slots": 8
    },
    "masjid": {
        "model": "assets/facility/hospital",
        "type": "religion",
        "slots": 16
    },
    "fire department": {
        "model": "assets/facility/hospital",
        "type": "firedept",
        "slots": 8
    },
    "elementary school": {
        "model": "assets/facility/sd",
        "type": "education",
        "education": 1,
        "slots": 16
    },
    "middle school": {
        "model": "assets/facility/sd",
        "type": "education",
        "education": 2,
        "slots": 16
    },
    "high school": {
        "model": "assets/facility/sd",
        "type": "education",
        "education": 3,
        "slots": 16
    }
}

//govt facility
let services = {
    "recycling plant": {
        "model": "assets/facility/hospital",
        "type": "waste",
        "capacity": 2400
    },
    "wind turbine": {
        "model": "assets/facility/hospital",
        "type": "electric cable",
        "capacity": 150
    },
    "solar panel": {
        "model": "assets/facility/hospital",
        "type": "electric cable",
        "capacity": 150
    },
    "water pump": {
        "model": "assets/facility/sd",
        "type": "water pipe",
        "capacity": 150
    },
    "water treatment": {
        "model": "assets/facility/sd",
        "type": "sewage pipe",
        "capacity": 150
    }
}

let highestEducation = Object.keys(facility)
    .filter(key => typeof facility[key].education === "number")
    .reduce((maxKey, key) => facility[key].education > facility[maxKey].education ? key : maxKey);

//========================
// underground category
//========================

let underground = {
    "electric cable": {
        "model": "assets/pipe/cable",
        "capacity": 150,
        "label": "Electricity",
        "variableModel": true
    },
    "water pipe": {
        "model": "assets/pipe/pipe",
        "capacity": 150,
        "label": "Water",
        "variableModel": true
    },
    "sewage pipe": {
        "model": "assets/pipe/sewage",
        "capacity": 150,
        "label": "Sewage",
        "variableModel": true
    }
}

Object.keys(underground).forEach(item => {
    let button = document.createElement("button");
    button.innerText = item;
    button.onclick = () => setTool(item, 'Demolish Underground');

    document.getElementById("demolishMenu").appendChild(button);
    undergroundGroups[item] = {};
})

//========================
// Build Menu Definitions
//========================

//for build menu
let buildmenu = {
    "Zones": zones,
    "Transport": transport,
    "Facility": facility,
    "Services": services,
    "Supply": underground
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
async function renderPreview(model) {
    var previewScene = new THREE.Scene();
    var previewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 700);
    previewCamera.position.set(-1, 1, -1);
    previewCamera.rotation.set(-2.2, -0.7, -2.4);

    var model = (await loadWMat(model)).clone();
    model.scale.setScalar(0.156);
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.5;
            child.material.needsUpdate = true;
        }
    });

    previewScene.add(model);
    allOfTheLights(previewScene, false);
    return new Promise((resolve) => {
        setTimeout(() => {
            previewRenderer.render(previewScene, previewCamera);
            resolve(previewRenderer.domElement.toDataURL());
        }, 1000);
    });
}

//========================
// fill build menu
//========================
Object.keys(buildmenu).forEach((item, i) => {
    const button = document.createElement("button");
    button.innerText = item;
    button.onclick = () => { openTab(`${item}`, 'buildTab') };

    const tab = document.createElement("div");
    tab.className = "buildTab innertab";
    tab.id = item;
    if (i == 0) tab.style.display = "block";

    Object.keys(buildmenu[item]).forEach(subItem => {
        const subItemButton = document.createElement("button");
        subItemButton.innerText = subItem;
        subItemButton.onclick = () => { setTool(subItem, item) };

        if (buildmenu[item][subItem].variableModel) renderPreview(buildmenu[item][subItem].model + '_straight').then(data => subItemButton.style.backgroundImage = `url(${data})`)
        else renderPreview(buildmenu[item][subItem].model).then(data => subItemButton.style.backgroundImage = `url(${data})`)

        tab.appendChild(subItemButton);
    });

    document.getElementById("buildLeft").appendChild(button);
    document.getElementById("buildRight").appendChild(tab);
});