let loaded = {};

//========================
// Zoned buildings preset
//========================

//residential buildings
let houses = {
    'assets/residential/house-1': {
        "level": 2,
        "slots": 3,
    },
    'assets/residential/house-2': {
        "level": 3,
        "slots": 4
    }
};

//commercial buildings
let commercial = {
    'assets/commercial/shop-1': {
        "level": 2,
        "slots": 3,
        "pay": 30000
    },
    'assets/commercial/shop-2': {
        "level": 3,
        "slots": 6,
        "pay": 30000
    }
};

//industrial buildings
let industrial = {
    'assets/industrial/industrial-1': {
        "level": 4,
        "slots": 6,
        "pay": 30000
    }
};

//farm buildings
let farm = {
    'assets/farm/farm-1': {
        "level": 1,
        "slots": 5,
        "pay": 30000
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
        "model": "assets/roads/road"
    }
}

//govt facility
let facility = {
    "hospital": {
        "model": "assets/facility/hospital",
        "type": "medical",
        "range": 8
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

let highestEducation = Object.keys(facility)
.filter(key => typeof facility[key].education === "number")
.reduce((maxKey, key) => facility[key].education > facility[maxKey].education ? key : maxKey);

//for build menu
let buildmenu = {
    "Zones": zones,
    "Transport": transport,
    "Facility": facility
}

//policy template
let policyTemplate = {

}

//fill build menu
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

        tab.appendChild(subItemButton);
    });

    document.getElementById("buildLeft").appendChild(button);
    document.getElementById("buildRight").appendChild(tab);
});