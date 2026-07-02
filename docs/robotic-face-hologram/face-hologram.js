/**
 * Futuristic android face hologram — scanned head with shader-based holo treatment
 */
(function () {
    'use strict';

    const MODEL_URL = 'assets/head.glb';
    const MODEL_FALLBACK = 'https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';

    const THEMES = [
        { chrome: 0x1a2838, accent: 0x00e8ff, glow: 0x66f0ff, rim: 0xff44cc },
        { chrome: 0x241a30, accent: 0xff00aa, glow: 0xff66dd, rim: 0x00eeff },
        { chrome: 0x1a3028, accent: 0x00ffaa, glow: 0x66ffcc, rim: 0x0088ff },
        { chrome: 0x302818, accent: 0xffaa00, glow: 0xffcc66, rim: 0xff3366 },
    ];

    let scene, camera, renderer, faceGroup, particleSystem;
    let headMesh = null;
    let headMaterial = null;
    let wireOverlay = null;
    let holoRim = null;
    let roboEyes = [];
    let eyeRings = [];
    let isRotating = false;
    let wireframeMode = false;
    let themeIndex = 0;
    let jumpTime = 0;
    let lookTarget = { x: 0, y: 0 };
    let dragging = false;

    const JUMP_SPEED = 0.02;
    const JUMP_DEPTH = 0.07;

    function theme() { return THEMES[themeIndex]; }

    function tag(obj, role) {
        obj.userData.role = role;
        return obj;
    }

    function androidHeadMaterial(original) {
        const t = theme();
        const mat = new THREE.MeshStandardMaterial({
            color: t.chrome,
            metalness: 0.97,
            roughness: 0.06,
            emissive: t.accent,
            emissiveIntensity: 0.08,
            wireframe: wireframeMode,
        });

        if (original?.normalMap) {
            mat.normalMap = original.normalMap;
            mat.normalScale = new THREE.Vector2(0.35, 0.35);
        }

        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uGlow = { value: new THREE.Color(t.glow) };
            shader.uniforms.uAccent = { value: new THREE.Color(t.accent) };
            shader.uniforms.uRim = { value: new THREE.Color(t.rim) };

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                uniform float uTime;
                uniform vec3 uGlow;
                uniform vec3 uAccent;
                uniform vec3 uRim;`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
                vec3 viewDir = normalize(vViewPosition);
                vec3 n = normalize(normal);
                float fresnel = pow(1.0 - max(dot(n, -viewDir), 0.0), 2.8);
                gl_FragColor.rgb += mix(uAccent, uRim, fresnel * 0.6) * fresnel * 0.55;

                float scan = smoothstep(0.92, 1.0, sin(vViewPosition.y * 38.0 - uTime * 1.8));
                gl_FragColor.rgb += uGlow * scan * 0.07;

                float holoBand = smoothstep(0.97, 1.0, sin(vViewPosition.y * 12.0 + uTime * 0.8));
                gl_FragColor.rgb += uAccent * holoBand * 0.04;

                gl_FragColor.rgb = mix(gl_FragColor.rgb, uGlow, fresnel * 0.08);`
            );

            mat.userData.shader = shader;
        };

        tag(mat, 'headMat');
        return mat;
    }

    function applyAndroidMaterial(root) {
        root.traverse((child) => {
            if (child.isMesh) {
                const orig = child.material;
                headMaterial = androidHeadMaterial(orig);
                child.material = headMaterial;
                if (orig?.dispose) orig.dispose();
                tag(child, 'head');
            }
        });
    }

    function fitModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.scale.setScalar(2.15 / Math.max(...box.getSize(new THREE.Vector3()).toArray()));
        return new THREE.Box3().setFromObject(model);
    }

    function addFuturisticEyes(parent, box) {
        const size = box.getSize(new THREE.Vector3());
        const cx = (box.min.x + box.max.x) * 0.5;
        const cy = (box.min.y + box.max.y) * 0.5;
        const cz = box.max.z;
        const s = Math.max(size.x, size.y, size.z);
        const t = theme();

        roboEyes = [];
        eyeRings = [];

        [-1, 1].forEach((side) => {
            const eye = new THREE.Group();
            eye.position.set(cx + side * size.x * 0.19, cy + size.y * 0.06, cz + s * 0.01);

            const ring = tag(new THREE.Mesh(
                new THREE.RingGeometry(s * 0.022, s * 0.038, 48),
                new THREE.MeshBasicMaterial({
                    color: t.glow,
                    transparent: true,
                    opacity: 0.85,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                })
            ), 'eyeRing');
            eye.add(ring);
            eyeRings.push(ring);

            const inner = tag(new THREE.Mesh(
                new THREE.CircleGeometry(s * 0.018, 32),
                new THREE.MeshBasicMaterial({
                    color: t.accent,
                    transparent: true,
                    opacity: 0.95,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            ), 'pupil');
            inner.position.z = 0.002;
            eye.add(inner);
            roboEyes.push(inner);

            const highlight = new THREE.Mesh(
                new THREE.CircleGeometry(s * 0.005, 16),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            highlight.position.set(side * -s * 0.006, s * 0.005, 0.003);
            eye.add(highlight);

            parent.add(eye);
        });
    }

    function addHoloRim(parent, radius) {
        holoRim = tag(new THREE.Mesh(
            new THREE.SphereGeometry(radius * 1.02, 48, 48),
            new THREE.MeshBasicMaterial({
                color: theme().glow,
                transparent: true,
                opacity: 0.025,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        ), 'shell');
        parent.add(holoRim);
    }

    function buildFaceFromModel(gltf) {
        roboEyes = [];
        eyeRings = [];

        const group = new THREE.Group();
        const model = gltf.scene;

        applyAndroidMaterial(model);
        const box = fitModel(model);
        group.add(model);

        model.traverse((child) => {
            if (child.isMesh && !headMesh) headMesh = child;
        });

        addFuturisticEyes(group, box);

        const radius = Math.max(...box.getSize(new THREE.Vector3()).toArray()) * 0.55;

        if (headMesh) {
            wireOverlay = tag(new THREE.Mesh(
                headMesh.geometry,
                new THREE.MeshBasicMaterial({
                    color: theme().accent,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.04,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            ), 'wireOverlay');
            wireOverlay.visible = false;
            headMesh.parent.add(wireOverlay);
        }

        addHoloRim(group, radius);
        return group;
    }

    function loadModel(url) {
        return new Promise((resolve, reject) => {
            new THREE.GLTFLoader().load(url, resolve, undefined, reject);
        });
    }

    function setLoading(text) {
        const el = document.getElementById('loading-status');
        if (el) el.textContent = text;
    }

    function hideLoading() {
        const el = document.getElementById('loading-status');
        if (el) el.style.display = 'none';
    }

    async function createHumanoidFace() {
        setLoading('Loading 3D head model…');
        let gltf;
        try {
            gltf = await loadModel(MODEL_URL);
        } catch (e) {
            setLoading('Loading from CDN…');
            gltf = await loadModel(MODEL_FALLBACK);
        }
        hideLoading();
        return buildFaceFromModel(gltf);
    }

    function addParticles() {
        const count = 120;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const c = new THREE.Color(theme().accent);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 4;
            positions[i + 1] = (Math.random() - 0.5) * 4;
            positions[i + 2] = (Math.random() - 0.5) * 2.5;
            colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.012,
            vertexColors: true,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
        scene.add(particleSystem);
    }

    function applyTheme() {
        const t = theme();
        if (headMaterial) {
            headMaterial.color.setHex(t.chrome);
            headMaterial.emissive.setHex(t.accent);
            const sh = headMaterial.userData.shader;
            if (sh) {
                sh.uniforms.uGlow.value.setHex(t.glow);
                sh.uniforms.uAccent.value.setHex(t.accent);
                sh.uniforms.uRim.value.setHex(t.rim);
            }
        }
        roboEyes.forEach((p) => p.material.color.setHex(t.accent));
        eyeRings.forEach((r) => r.material.color.setHex(t.glow));
        if (holoRim) holoRim.material.color.setHex(t.glow);
        if (wireOverlay) wireOverlay.material.color.setHex(t.accent);
        if (particleSystem) {
            const c = new THREE.Color(t.accent);
            const arr = particleSystem.geometry.attributes.color.array;
            for (let i = 0; i < arr.length; i += 3) {
                arr[i] = c.r; arr[i + 1] = c.g; arr[i + 2] = c.b;
            }
            particleSystem.geometry.attributes.color.needsUpdate = true;
        }
    }

    function setWireframe(enabled) {
        if (headMaterial) headMaterial.wireframe = enabled;
        if (wireOverlay) wireOverlay.visible = enabled;
    }

    async function init() {
        const container = document.getElementById('canvas-container');
        if (!container || typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
            setLoading('Failed to load Three.js or GLTFLoader.');
            return;
        }

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x010108);
        scene.fog = new THREE.FogExp2(0x010108, 0.045);

        camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
        camera.position.set(0, 0, 3.75);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;
        container.appendChild(renderer.domElement);

        try {
            faceGroup = await createHumanoidFace();
            scene.add(faceGroup);
        } catch (err) {
            console.error(err);
            setLoading('Could not load 3D model.');
            return;
        }

        scene.add(new THREE.AmbientLight(0x223344, 0.35));
        scene.add(new THREE.HemisphereLight(0x335566, 0x020208, 0.45));

        const t = theme();
        const key = new THREE.DirectionalLight(0xcceeff, 0.55);
        key.position.set(1, 2, 4);
        scene.add(key);

        const rim = new THREE.DirectionalLight(t.glow, 0.45);
        rim.position.set(-2, 0, -3);
        scene.add(rim);

        const fill = new THREE.PointLight(t.accent, 0.65, 18);
        fill.position.set(-1.5, 0.5, 2.5);
        fill.name = 'fillLight';
        scene.add(fill);

        const glow = new THREE.PointLight(t.glow, 0.5, 12);
        glow.position.set(0, 0.3, 1);
        glow.name = 'glowLight';
        scene.add(glow);

        addParticles();
        setupControls(renderer.domElement);
        window.addEventListener('resize', onResize);

        document.getElementById('rotate-btn')?.addEventListener('click', () => { isRotating = !isRotating; });
        document.getElementById('wireframe-btn')?.addEventListener('click', () => {
            wireframeMode = !wireframeMode;
            setWireframe(wireframeMode);
        });
        document.getElementById('color-btn')?.addEventListener('click', () => {
            themeIndex = (themeIndex + 1) % THEMES.length;
            applyTheme();
            const th = theme();
            scene.children.forEach((ch) => {
                if (ch instanceof THREE.PointLight && ch.name === 'fillLight') ch.color.setHex(th.accent);
                if (ch instanceof THREE.PointLight && ch.name === 'glowLight') ch.color.setHex(th.glow);
            });
        });
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (faceGroup) faceGroup.rotation.set(0, 0, 0);
            camera.position.set(0, 0, 3.75);
            lookTarget = { x: 0, y: 0 };
        });

        animate();
    }

    function setupControls(canvas) {
        let prev = { x: 0, y: 0 };
        canvas.addEventListener('mousedown', (e) => { dragging = true; prev = { x: e.clientX, y: e.clientY }; });
        canvas.addEventListener('mousemove', (e) => {
            lookTarget.x = (e.clientX / window.innerWidth - 0.5) * 0.14;
            lookTarget.y = -(e.clientY / window.innerHeight - 0.5) * 0.1;
            if (dragging && faceGroup) {
                faceGroup.rotation.y += (e.clientX - prev.x) * 0.006;
                faceGroup.rotation.x += (e.clientY - prev.y) * 0.006;
                prev = { x: e.clientX, y: e.clientY };
            }
        });
        canvas.addEventListener('mouseup', () => { dragging = false; });
        canvas.addEventListener('mouseleave', () => { dragging = false; });
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            camera.position.z = Math.max(2.4, Math.min(6, camera.position.z + e.deltaY * 0.004));
        }, { passive: false });
    }

    function onResize() {
        const container = document.getElementById('canvas-container');
        if (!container || !camera || !renderer) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!renderer || !scene || !camera || !faceGroup) return;

        jumpTime += JUMP_SPEED;
        faceGroup.position.z = JUMP_DEPTH * Math.sin(jumpTime) * Math.sin(jumpTime);

        if (isRotating) {
            faceGroup.rotation.y += 0.003;
        } else if (!dragging) {
            faceGroup.rotation.y += (lookTarget.x - faceGroup.rotation.y) * 0.045;
            faceGroup.rotation.x += (lookTarget.y - faceGroup.rotation.x) * 0.045;
        }

        if (headMaterial?.userData.shader) {
            headMaterial.userData.shader.uniforms.uTime.value = jumpTime;
        }

        roboEyes.forEach((pupil, i) => {
            pupil.position.x = lookTarget.x * 0.01;
            pupil.position.y = lookTarget.y * 0.007;
            pupil.material.opacity = 0.8 + 0.2 * Math.sin(jumpTime * 2 + i);
        });

        eyeRings.forEach((ring, i) => {
            ring.material.opacity = 0.65 + 0.25 * Math.sin(jumpTime * 1.6 + i * 0.5);
            ring.scale.setScalar(0.98 + 0.04 * Math.sin(jumpTime * 2.2 + i));
        });

        if (holoRim) {
            holoRim.material.opacity = 0.018 + 0.012 * Math.sin(jumpTime * 0.9);
        }

        if (headMaterial) {
            headMaterial.emissiveIntensity = 0.06 + 0.04 * Math.sin(jumpTime * 1.2);
        }

        if (particleSystem) particleSystem.rotation.y += 0.0004;

        renderer.render(scene, camera);
    }

    window.addEventListener('load', () => { if (typeof THREE !== 'undefined') init(); });
})();
