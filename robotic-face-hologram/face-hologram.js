/**
 * Humanoid Robotic Face Hologram
 * Real head scan + android chrome material, glowing eyes, panel seams
 */
(function () {
    'use strict';

    const MODEL_URL = 'assets/head.glb';
    const MODEL_FALLBACK = 'https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';

    const THEMES = [
        { chrome: 0x8ea8b8, accent: 0x00ffff, glow: 0x00eeff },
        { chrome: 0xa898b8, accent: 0xff00cc, glow: 0xff44dd },
        { chrome: 0x88b8a0, accent: 0x00ff88, glow: 0x44ffaa },
        { chrome: 0xb8a888, accent: 0xff8800, glow: 0xffaa44 },
    ];

    let scene, camera, renderer, faceGroup, particleSystem;
    let headMesh = null;
    let headMaterial = null;
    let wireOverlay = null;
    let holoShell = null;
    let scanLines = [];
    let roboEyes = [];
    let seamMeshes = [];
    let accentMeshes = [];
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

    function accentMat(opts = {}) {
        const t = theme();
        return new THREE.MeshStandardMaterial({
            color: opts.color ?? t.accent,
            emissive: t.glow,
            emissiveIntensity: opts.intensity ?? 0.9,
            metalness: 0.85,
            roughness: 0.15,
            transparent: true,
            opacity: opts.opacity ?? 0.95,
        });
    }

    function glowMat(intensity = 1.5) {
        const t = theme();
        return new THREE.MeshBasicMaterial({
            color: t.glow,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }

    function androidHeadMaterial(original) {
        const t = theme();
        const mat = new THREE.MeshStandardMaterial({
            color: t.chrome,
            metalness: 0.94,
            roughness: 0.12,
            emissive: t.accent,
            emissiveIntensity: 0.12,
            wireframe: wireframeMode,
        });

        if (original && original.normalMap) {
            mat.normalMap = original.normalMap;
            mat.normalScale = original.normalScale ? original.normalScale.clone() : new THREE.Vector2(0.6, 0.6);
        }

        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uGlow = { value: new THREE.Color(t.glow) };
            shader.uniforms.uAccent = { value: new THREE.Color(t.accent) };

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                uniform float uTime;
                uniform vec3 uGlow;
                uniform vec3 uAccent;`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
                float fresnel = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);
                gl_FragColor.rgb += uAccent * fresnel * 0.45;
                float scan = sin((vViewPosition.y + vViewPosition.x * 0.3) * 55.0 - uTime * 2.5);
                gl_FragColor.rgb += uGlow * max(scan, 0.0) * 0.06;
                float grid = step(0.92, fract(vViewPosition.y * 18.0)) * step(0.92, fract(vViewPosition.x * 18.0));
                gl_FragColor.rgb += uAccent * grid * 0.04;`
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
                if (orig && orig.dispose) orig.dispose();
                tag(child, 'head');
            }
        });
    }

    function fitModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.sub(center);
        const scale = 2.15 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        return new THREE.Box3().setFromObject(model);
    }

    function addSeam(parent, points, radius = 0.004) {
        const curve = new THREE.CatmullRomCurve3(points);
        const mesh = tag(
            new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 6, false), accentMat({ intensity: 0.75 })),
            'seam'
        );
        parent.add(mesh);
        seamMeshes.push(mesh);
        return mesh;
    }

    function addRoboticOverlay(parent, box) {
        const size = box.getSize(new THREE.Vector3());
        const cx = (box.min.x + box.max.x) * 0.5;
        const cy = (box.min.y + box.max.y) * 0.5;
        const cz = box.max.z;
        const s = Math.max(size.x, size.y, size.z);

        const overlay = new THREE.Group();

        // Android eyes — replace closed human eyelids
        roboEyes = [];
        [-1, 1].forEach((side) => {
            const eye = new THREE.Group();
            eye.position.set(cx + side * size.x * 0.19, cy + size.y * 0.06, cz - s * 0.02);

            const socket = new THREE.Mesh(
                new THREE.SphereGeometry(s * 0.055, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0x050508, metalness: 0.9, roughness: 0.1 })
            );
            socket.scale.set(1.2, 0.7, 0.35);
            eye.add(socket);

            const iris = tag(new THREE.Mesh(
                new THREE.TorusGeometry(s * 0.028, s * 0.007, 10, 32),
                accentMat({ intensity: 1.1 })
            ), 'accent');
            iris.rotation.x = Math.PI / 2;
            iris.position.z = s * 0.018;
            eye.add(iris);

            const pupil = tag(new THREE.Mesh(
                new THREE.SphereGeometry(s * 0.014, 12, 12),
                glowMat()
            ), 'pupil');
            pupil.position.z = s * 0.022;
            eye.add(pupil);
            roboEyes.push(pupil);

            const brow = new THREE.Mesh(
                new THREE.BoxGeometry(s * 0.11, s * 0.018, s * 0.012),
                accentMat({ intensity: 0.35, opacity: 0.7 })
            );
            brow.position.set(0, s * 0.045, s * 0.01);
            eye.add(brow);
            accentMeshes.push(brow);

            overlay.add(eye);
        });

        // Forehead android panel
        const forehead = tag(new THREE.Mesh(
            new THREE.BoxGeometry(size.x * 0.35, size.y * 0.06, s * 0.015),
            accentMat({ intensity: 0.25, opacity: 0.55, color: theme().chrome })
        ), 'accent');
        forehead.position.set(cx, cy + size.y * 0.28, cz - s * 0.01);
        overlay.add(forehead);
        accentMeshes.push(forehead);

        // Temple ports
        [-1, 1].forEach((side) => {
            const port = tag(new THREE.Mesh(
                new THREE.CylinderGeometry(s * 0.018, s * 0.018, s * 0.025, 10),
                accentMat({ intensity: 0.85 })
            ), 'accent');
            port.rotation.z = Math.PI / 2;
            port.position.set(cx + side * size.x * 0.42, cy + size.y * 0.12, cz - size.z * 0.35);
            overlay.add(port);
            accentMeshes.push(port);
        });

        // Jaw actuator line
        addSeam(overlay, [
            new THREE.Vector3(cx - size.x * 0.22, cy - size.y * 0.22, cz - s * 0.03),
            new THREE.Vector3(cx, cy - size.y * 0.28, cz),
            new THREE.Vector3(cx + size.x * 0.22, cy - size.y * 0.22, cz - s * 0.03),
        ], s * 0.003);

        // Central cranial seam
        addSeam(overlay, [
            new THREE.Vector3(cx, cy + size.y * 0.38, cz - size.z * 0.2),
            new THREE.Vector3(cx, cy + size.y * 0.1, cz),
            new THREE.Vector3(cx, cy - size.y * 0.15, cz - s * 0.02),
        ], s * 0.003);

        // Cheek panel seams
        [-1, 1].forEach((side) => {
            addSeam(overlay, [
                new THREE.Vector3(cx + side * size.x * 0.12, cy + size.y * 0.15, cz),
                new THREE.Vector3(cx + side * size.x * 0.28, cy, cz - s * 0.01),
                new THREE.Vector3(cx + side * size.x * 0.18, cy - size.y * 0.18, cz - s * 0.04),
            ], s * 0.0025);
        });

        // Lip energy seam (horizontal, neutral)
        const lipLine = tag(new THREE.Mesh(
            new THREE.BoxGeometry(size.x * 0.18, s * 0.003, s * 0.008),
            accentMat({ intensity: 0.55, opacity: 0.75 })
        ), 'accent');
        lipLine.position.set(cx, cy - size.y * 0.14, cz - s * 0.005);
        overlay.add(lipLine);
        accentMeshes.push(lipLine);

        parent.add(overlay);
    }

    function addHoloEffects(parent, radius) {
        holoShell = tag(new THREE.Mesh(
            new THREE.SphereGeometry(radius * 1.1, 32, 32),
            new THREE.MeshBasicMaterial({
                color: theme().glow,
                transparent: true,
                opacity: 0.045,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        ), 'shell');
        parent.add(holoShell);

        scanLines = [];
        for (let i = 0; i < 4; i++) {
            const sl = tag(new THREE.Mesh(
                new THREE.PlaneGeometry(radius * 1.8, 0.01),
                new THREE.MeshBasicMaterial({
                    color: theme().glow,
                    transparent: true,
                    opacity: 0.14,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                })
            ), 'scan');
            sl.userData.phase = i * 1.6;
            parent.add(sl);
            scanLines.push(sl);
        }
    }

    function buildFaceFromModel(gltf) {
        seamMeshes = [];
        accentMeshes = [];
        roboEyes = [];

        const group = new THREE.Group();
        const model = gltf.scene;

        applyAndroidMaterial(model);
        const box = fitModel(model);
        group.add(model);

        model.traverse((child) => {
            if (child.isMesh && !headMesh) headMesh = child;
        });

        addRoboticOverlay(group, box);

        const size = box.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) * 0.55;

        if (headMesh) {
            wireOverlay = tag(new THREE.Mesh(
                headMesh.geometry,
                new THREE.MeshBasicMaterial({
                    color: theme().accent,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.07,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            ), 'wireOverlay');
            wireOverlay.visible = true;
            headMesh.parent.add(wireOverlay);
        }

        addHoloEffects(group, radius);
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
            console.warn('Local model failed, trying CDN', e);
            setLoading('Loading from CDN…');
            gltf = await loadModel(MODEL_FALLBACK);
        }
        hideLoading();
        return buildFaceFromModel(gltf);
    }

    function addParticles() {
        const count = 350;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const c = new THREE.Color(theme().accent);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 5;
            positions[i + 1] = (Math.random() - 0.5) * 5;
            positions[i + 2] = (Math.random() - 0.5) * 3;
            colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.02,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
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
            if (headMaterial.userData.shader) {
                headMaterial.userData.shader.uniforms.uGlow.value.setHex(t.glow);
                headMaterial.userData.shader.uniforms.uAccent.value.setHex(t.accent);
            }
        }
        accentMeshes.forEach((m) => {
            if (m.material.emissive) {
                m.material.color.setHex(m.userData.role === 'accent' ? t.accent : t.chrome);
                m.material.emissive.setHex(t.glow);
            }
        });
        seamMeshes.forEach((m) => {
            m.material.color.setHex(t.accent);
            m.material.emissive.setHex(t.glow);
        });
        roboEyes.forEach((p) => p.material.color.setHex(t.glow));
        if (faceGroup) {
            faceGroup.traverse((ch) => {
                if (ch.userData.role === 'shell' || ch.userData.role === 'scan') {
                    ch.material.color.setHex(t.glow);
                }
                if (ch.userData.role === 'wireOverlay') ch.material.color.setHex(t.accent);
            });
        }
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
        if (wireOverlay) wireOverlay.material.opacity = enabled ? 0.14 : 0.07;
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
        scene.background = new THREE.Color(0x020208);
        scene.fog = new THREE.FogExp2(0x020208, 0.06);

        camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 0, 3.8);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        try {
            faceGroup = await createHumanoidFace();
            scene.add(faceGroup);
        } catch (err) {
            console.error(err);
            setLoading('Could not load 3D model.');
            return;
        }

        scene.add(new THREE.AmbientLight(0x334455, 0.4));
        scene.add(new THREE.HemisphereLight(0x446688, 0x080412, 0.5));

        const t = theme();
        const key = new THREE.DirectionalLight(0xaaccff, 0.7);
        key.position.set(2, 3, 5);
        scene.add(key);

        const accentKey = new THREE.DirectionalLight(t.accent, 0.35);
        accentKey.position.set(-3, 1, 2);
        scene.add(accentKey);

        const fill = new THREE.PointLight(t.accent, 0.9, 20);
        fill.position.set(-2, 1, 3);
        fill.name = 'fillLight';
        scene.add(fill);

        const rim = new THREE.PointLight(t.glow, 0.7, 15);
        rim.position.set(0, 0, -2);
        rim.name = 'rimLight';
        scene.add(rim);

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
                if (ch instanceof THREE.PointLight) {
                    if (ch.name === 'fillLight') ch.color.setHex(th.accent);
                    if (ch.name === 'rimLight') ch.color.setHex(th.glow);
                }
            });
        });
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (faceGroup) faceGroup.rotation.set(0, 0, 0);
            camera.position.set(0, 0, 3.8);
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
            pupil.position.x = lookTarget.x * 0.012;
            pupil.position.y = lookTarget.y * 0.008;
            if (pupil.material.opacity !== undefined) {
                pupil.material.opacity = 0.85 + 0.15 * Math.sin(jumpTime * 2.5 + i);
            }
        });

        seamMeshes.forEach((s, i) => {
            s.material.emissiveIntensity = 0.55 + 0.4 * Math.sin(jumpTime * 3 + i * 0.8);
        });

        scanLines.forEach((sl) => {
            sl.position.y = Math.sin(jumpTime * 1.3 + sl.userData.phase) * 0.6;
            sl.material.opacity = 0.06 + 0.1 * (0.5 + 0.5 * Math.sin(jumpTime * 2 + sl.userData.phase));
        });

        if (holoShell) holoShell.material.opacity = 0.03 + 0.025 * Math.sin(jumpTime);

        if (headMaterial) {
            headMaterial.emissiveIntensity = 0.1 + 0.05 * Math.sin(jumpTime * 1.5);
        }

        if (particleSystem) particleSystem.rotation.y += 0.0008;

        renderer.render(scene, camera);
    }

    window.addEventListener('load', () => { if (typeof THREE !== 'undefined') init(); });
})();
