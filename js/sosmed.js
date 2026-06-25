//========================
// Social Media News
//========================

let newsAccounts = {
    "Cakranusa News": {
        "bio": "Trusted and independent local news agency",
        "username": "CN.channel",
        "name": "Cakranusa News"
    },
    "Kabar Cakranusa": {
        "bio": "Trusted and independent local news agency",
        "username": "CN.channel",
        "name": "Kabar Cakranusa"
    },
    "Pagi Viral": {
        "bio": "Covering all viral local news.",
        "username": "cnviral",
        "name": "Pagi Viral"
    },
    "Pos Kita": {
        "bio": "Daily dose of knowledge and information",
        "username": "poskita",
        "name": "Pos Kita"
    },
}

//========================
// Social Media Post
//========================

async function profilePage(citizen) {
    let profileFocus = document.getElementById("Profile");
    profileFocus.innerHTML = `
        <button style="width: 32px;" onclick='openTab("Posts", "socialTab")'>🡠</button>
        <h3 style="display: inline; margin-left: 5px;">${citizen.name}</h3>
        <span>@${citizen.username}</span><br><br>
        <i>${citizen.bio}</i>
        <br><br>
        <p>${await translate("Education")}: ${education.find(item => structures[item].education == Math.floor(citizen.education) - 1) || await translate("basic education")}</p>
        <p>${await translate("Moral Points")}: ${citizen.moral} / 100</p>
        <p>${await translate("Employed")}: ${(Object.values(officials).includes(citizen.uuid) || citizen.job) ? await translate("Yes") : await translate("No")}</p>
        <p>${await translate("Currently studying at")}: ${citizen.school ? education.find(item => structures[item].education == Math.floor(citizen.education)) : "-"}</p>
    `;

    openTab("Profile", "socialTab");
    if (document.getElementById("sosmed").style.display == "none") openTab('sosmed', 'tab', true, "slideInDown", "slideOutUp");
}

function dragElement(elmnt) {
    var pos3 = 0, pos4 = 0;
    document.getElementById(elmnt.id + "header").onmousedown = (e) => {
        e.preventDefault();

        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };

        document.onmousemove = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;

            elmnt.style.top = (elmnt.offsetTop - (pos4 - e.clientY)) + "px";
            elmnt.style.left = (elmnt.offsetLeft - (pos3 - e.clientX)) + "px";
        };
    };
}

//social media post
function newPost(text, citizen, thumbnail = false) {
    typewrite(document.getElementById("newsContent"), `@${citizen.username}: ${text}`);

    let postDiv = document.createElement("div");
    postDiv.className = 'post';

    let top = document.createElement("p");
    top.className = 'postTop';
    top.onclick = () => { profilePage(citizen) }
    top.innerHTML = `
        <img src="assets/profile.webp">
        <b>${citizen.name}</b><br>
        <span>@${citizen.username}</span>
    `;

    let content = document.createElement("p");
    content.innerHTML = `
        ${(thumbnail ? `<img src="${thumbnail}">` : '')}
        <span>${text}</span><br>
        <span class="postDate">${calculateDate(date)}</span>
    `;

    document.getElementById("Posts").prepend(postDiv);
    postDiv.appendChild(top);
    postDiv.appendChild(content);

    document.getElementById("newsContent").onclick = () => {
        openTab('sosmed', 'tab', true, "slideInDown", "slideOutUp");
        openTab("Posts", "socialTab");
    }
}

//pick what to show in the news
let lastMessage = "";
function pickMessage() {
    let topics = [];
    let sosmedPosts = langData.sosmed;

    if (Object.values(citizens).flat().length == 0) {
        topics.push("noland")
    } else {
        if (calculatePollution() > 0.2) topics.push("pollution");
        if ((1 - Object.values(taxes).reduce((sum, val) => { return sum + val }, 0)) <= 0.5) topics.push("taxRate");
        if (!findFacility("medical")) topics.push("hospital");
        if (!findFacility("police")) topics.push("police");
        if (!findFacility("firedept")) topics.push("firedept");
        if (!findFacility("religion")) topics.push("religion");
        if (!findSchool(1, true) || !findSchool(2, true) || !findSchool(3, true)) topics.push("education");
        if (sceneData.flat().filter(item => Array.isArray(item.warnings) && (item.warnings.includes("Unavailable: Electricity") || item.warnings.includes("Unavailable: Water"))).length > 0) topics.push("unSupplied");
        if (Object.values(citizens).flat().filter(item => item.job == false).length > 0) topics.push("unemployment");
    }

    topics = topics.filter(item => item != lastMessage);
    if (topics.length > 0) {
        let randomTopic = topics[Math.floor(Math.random() * topics.length)];
        let randomPost = sosmedPosts[randomTopic][Math.floor(Math.random() * sosmedPosts[randomTopic].length)];
        let newsAgency = Object.values(newsAccounts)[Math.floor(Math.random() * Object.values(newsAccounts).length)];

        lastMessage = randomTopic;
        newPost(randomPost, newsAgency, false);
    } else {
        let citizensFlat = Object.values(citizens).flat();
        let randomPost = sosmedPosts.random[Math.floor(Math.random() * sosmedPosts.random.length)];
        let randomCitizen = citizensFlat[Math.floor(Math.random() * citizensFlat.length)];

        if (!randomCitizen) return;
        newPost(randomPost, randomCitizen, false);
    }
}