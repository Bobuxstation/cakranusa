//========================
// Social Media Posts
//========================

let sosmedPosts = {
    "taxesComplain": [
        "taxes-complain-1",
        "taxes-complain-2",
    ],
    "random": [
        "Unboxing my switch (not that new anymore)",
        "Just moved in, why is the mayor a bit tilted?",
        "Bro memiliki kunci untuk semua pintu, nahhh get outttt :emot_tengkorak:",
    ],
    "intro": "Welcome to Cakranusa! Social media posts and news will show up here."
}

//========================
// Social Media News
//========================

let sosmedNews = {

}

let newsAccounts = {
    "CNChannel": {
        "bio": "Trusted and independent local news agency",
        "username": "CN.channel"
    },
    "Kabar Cakranusa": {
        "bio": "Trusted and independent local news agency",
        "username": "CN.channel"
    },
}

//========================
// Social Media Post
//========================

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
function newPost(text, username, bio, displayName, thumbnail) {
    document.getElementById("newsDetails").style.display = 'block';
    typewrite(document.getElementById("newsContent"), `@${username}: ${text}`);

    let postDiv = document.createElement("div");
    postDiv.className = 'post';
    postDiv.onmouseover = () => {
        console.log("a")
    }

    let top = document.createElement("p");
    top.className = 'postTop';
    top.innerHTML = `
        <img src="assets/profile.webp">
        <b>${displayName}</b><br>
        <span>@${username}</span>
    `;

    let content = document.createElement("p");
    content.innerHTML = `
        ${(thumbnail ? `<img src="${thumbnail}">` : '')}
        <span>${text}</span>
    `;
    
    document.getElementById("posts").prepend(postDiv);
    postDiv.appendChild(top);
    postDiv.appendChild(content);

    document.getElementById("newsContent").onclick = () => {
        document.getElementById("newsDetails").style.display = 'none';
        openTab('sosmed', 'tab', true, "slideInDown", "slideOutUp");
    }
}

//pick what to show in the news
function pickMessage() {
    if (Math.random > 0.25) {
        //sosmed post
        let taxRate = 1 - Object.values(taxes).reduce((sum, val) => { return sum + val }, 0);

        if (taxRate < 0.75) {

        } else if (taxRate < 0.5) {

        }

    } else {
        //news post (more urgent)

    }
}