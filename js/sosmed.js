//========================
// Social Media Posts
//========================

let sosmedPosts = {
    "education": [
        "Cakranusa City lacks complete education facilities",
        "Citizens left uneducated due to lack of education facilities",
    ],
    "religion": [
        "Citizens demand construction of a place of worship",
        "Cakranusa City lacks a proper place of worship",
    ],
    "unemployment": [
        "Citizens are unable to find jobs",
        "Cakranusa City job market is unable to fulfill its population",
    ],
    "taxRate": [
        "Citizens complain about high tax rates",
        "High tax rates raise uncertainty amongst citizens",
    ],
    "hospital": [
        "Cakranusa City still lacks medical facilities",
        "Citizens requiring medical attention are unable to get one",
    ],
    "police": [
        "Cakranusa City still lacks a police department",
        "Streets are still left unguarded, when will a police department be built?",
    ],
    "firedept": [
        "Cakranusa City still lacks a fire department",
        "Citizens are concerned by the lack of a fire department",
    ],
    "unSupplied": [
        "Some houses are still lacking water and electricity supplies",
        "Citizens complain lack of water and electricity in some houses",
    ],
    "noland": [
        "Potential citizens still waiting for Cakranusa city to sell plots",
        "Cakranusa City still at 0, when can citizens start moving in?",
    ],
    "pollution": [
        "City air quality levels are concerningly low - Researches place cause on industries.",
        "Air quality levels hit an all time low - citizens demand less industries",
        "Growing amount of industries puts a burden on air quality levels - researchers say"
    ],
    "random": [
        "Unboxing my switch (not that new anymore)",
        "Just moved in, why is the mayor a bit tilted?",
        "Bro memiliki kunci untuk semua pintu, nahhh get outttt :emot_tengkorak:",
        "They just shot the big K...",
        "If you think about it, old Imran is basically his younger self",
        "Forcing students to do RIS is so Dystopian ngl...",
        "They cut the 2nd tree...",
        "Shaq just bought a share of Google, doubt it'll ever succeed, especially as it's superficial"
    ],
    "intro": "Welcome to Cakranusa! Social media posts and news will show up here."
}

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

function profilePage(citizen) {
    let profileFocus = document.getElementById("Profile");
    profileFocus.innerHTML = `
        <h3>${citizen.name}</h3>
        <span>@${citizen.username}</span><br>
        <i>${citizen.bio}</i>
        <br><br>
        <p>Education: ${Object.keys(education).find(item => education[item].education == Math.floor(citizen.education) - 1) || "basic education"}</p>
        <p>Employed: ${citizen.job ? "Yes" : "No"}</p>
        <p>Currently studying at: ${citizen.school ? Object.keys(education).find(item => education[item].education == Math.floor(citizen.education)) : "-"}</p>
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
    document.getElementById("newsDetails").style.display = 'block';
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
        document.getElementById("newsDetails").style.display = 'none';
        openTab('sosmed', 'tab', true, "slideInDown", "slideOutUp");
        openTab("Posts", "socialTab");
    }
}

//pick what to show in the news
let lastMessage = "";
function pickMessage() {
    let topics = [];

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