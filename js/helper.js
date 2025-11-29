
// building (up) and demolishing (down) animation
function animMove(target, isUp) {
    const startY = target.position.y;
    const height = target.scale.y;
    const startTime = performance.now();

    spawnSmoke(target.position, 3000);
    function lerpAnim() {
        const t = Math.min((performance.now() - startTime) / 500, 1);

        if (isUp) {
            target.position.set(
                target.position.x,
                lerp(startY - height, startY, t),
                target.position.z
            );
        } else {
            target.position.set(
                target.position.x,
                lerp(startY, startY - height, t),
                target.position.z
            );
        }

        if (t < 1) requestAnimationFrame(lerpAnim);
    };

    lerpAnim();
}

// lerp animation function (ease)
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// set color of tile
function setInstanceColor(color, instance, index) {
    instance.setColorAt(index, (new THREE.Color()).set(color));
    instance.instanceColor.needsUpdate = true;
}


// generate smoke
let smokeTexture = (new THREE.TextureLoader()).load("assets/clouds_1.png")
function spawnSmoke(position, duration = 3000) {
    const material = new THREE.SpriteMaterial({
        map: smokeTexture,
        transparent: true,
        opacity: 1,
        depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 0.5;
    sprite.scale.setScalar(1.5);
    scene.add(sprite);

    const startTime = performance.now();
    function update() {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = elapsed / duration;

        if (t >= 1) {
            scene.remove(sprite);
            sprite.material.dispose();
        } else {
            sprite.material.opacity = 1 - t;
            sprite.position.y += 0.002;
            sprite.material.rotation += 0.002;

            requestAnimationFrame(update);
        }
    }
    update();
}

// load obj building models
async function loadWMat(location) {
    let mtlloader = new THREE.MTLLoader();
    loaded[`${location}.mtl`] ??= await mtlloader.loadAsync(`${location}.mtl`)

    let objloader = new THREE.OBJLoader();
    objloader.setMaterials(loaded[`${location}.mtl`]);
    loaded[`${location}.obj`] ??= await objloader.loadAsync(`${location}.obj`);

    let object = loaded[`${location}.obj`].clone();
    object.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
    })

    return object;
}