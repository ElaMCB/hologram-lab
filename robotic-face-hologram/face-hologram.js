/**
 * Futuristic android face hologram with forced-perspective (anamorphic) display.
 * The screen is treated as a window — camera projection matches viewer eye position.
 */
(function () {
    'use strict';

    const MODEL_URL = 'assets/head.glb';
    const MODEL_FALLBACK = 'https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';

    const THEMES = [
        { chrome: 0x586878, accent: 0x00e8ff, glow: 0x66f0ff, rim: 0xff44cc },
        { chrome: 0x645870, accent: 0xff00aa, glow: 0xff66dd, rim: 0x00eeff },
        { chrome: 0x587068, accent: 0x00ffaa, glow: 0x66ffcc, rim: 0x0088ff },
        { chrome: 0x706858, accent: 0xffaa00, glow: 0xffcc66, rim: 0xff3366 },
    ];

    /** Physical display model — units are metres */
    const DISPLAY = {
        screenWidth: 0.40,
        eyeZ: 0.55,
        eyeZMin: 0.32,
        eyeZMax: 0.85,
        maxEyeX: 0.16,
        maxEyeY: 0.11,
        holoDepth: 0.08,
        smooth: 0.14,
    };

    let scene, camera, renderer, faceGroup, particleSystem, canvasContainer;
    let headMesh = null;
    let headMaterial = null;
    let wireOverlay = null;
    let screenFrame = null;
    let isRotating = false;
    let wireframeMode = true;
    let themeIndex = 0;
    let jumpTime = 0;
    let dragging = false;
    let screenSize = { width: DISPLAY.screenWidth, height: DISPLAY.screenWidth * 0.5625 };

    let eyePos = { x: 0, y: 0, z: DISPLAY.eyeZ };
    let eyeTarget = { x: 0, y: 0, z: DISPLAY.eyeZ };

    let webcamActive = false;
    let webcamVideo = null;
    let webcamStream = null;
    let faceDetector = null;
    let webcamLoopId = null;
    let metalEnvMap = null;

    function theme() { return THEMES[themeIndex]; }

    function tag(obj, role) {
        obj.userData.role = role;
        return obj;
    }

    function screenHeightForAspect(aspect) {
        return DISPLAY.screenWidth / aspect;
    }

    function updateScreenSize() {
        if (!canvasContainer) return;
        const aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
        screenSize.height = screenHeightForAspect(aspect);
        if (screenFrame) {
            screenFrame.geometry.dispose();
            screenFrame.geometry = new THREE.PlaneGeometry(screenSize.width, screenSize.height);
        }
    }

    /**
     * Off-axis (anamorphic) projection — frustum passes through viewer eye and screen edges.
     * See head-coupled perspective / forced-perspective display techniques.
     */
    function applyForcedPerspective(cam, eye, sw, sh) {
        const near = cam.near;
        const far = cam.far;
        const ez = Math.max(eye.z, near + 0.02);

        const left = (-sw / 2 - eye.x) * near / ez;
        const right = (sw / 2 - eye.x) * near / ez;
        const bottom = (-sh / 2 - eye.y) * near / ez;
        const top = (sh / 2 - eye.y) * near / ez;

        cam.position.set(eye.x, eye.y, eye.z);
        cam.up.set(0, 1, 0);
        cam.lookAt(eye.x, eye.y, 0);
        cam.updateMatrixWorld(true);

        cam.projectionMatrix.makePerspective(left, right, top, bottom, near, far);
        cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    }

    function setEyeFromNormalized(nx, ny) {
        eyeTarget.x = nx * DISPLAY.maxEyeX;
        eyeTarget.y = ny * DISPLAY.maxEyeY;
    }

    function updateEyeFromPointer(clientX, clientY) {
        if (webcamActive) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        setEyeFromNormalized(
            (clientX / w - 0.5) * 2,
            -((clientY / h - 0.5) * 2)
        );
    }

    function createMetalEnvMap() {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileCubemapShader();

        const envScene = new THREE.Scene();
        const sky = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            [
                new THREE.MeshBasicMaterial({ color: 0x667788 }),
                new THREE.MeshBasicMaterial({ color: 0x445566 }),
                new THREE.MeshBasicMaterial({ color: 0xb0c0d8 }),
                new THREE.MeshBasicMaterial({ color: 0x101018 }),
                new THREE.MeshBasicMaterial({ color: 0x556677 }),
                new THREE.MeshBasicMaterial({ color: 0x334455 }),
            ]
        );
        envScene.add(sky);

        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(1.5, 2, 1);
        envScene.add(key);
        const fill = new THREE.DirectionalLight(0x88aacc, 1.1);
        fill.position.set(-2, 0.5, -1);
        envScene.add(fill);

        const map = pmrem.fromScene(envScene, 0.04).texture;
        pmrem.dispose();
        sky.geometry.dispose();
        sky.material.forEach((m) => m.dispose());
        return map;
    }

    function androidHeadMaterial(original) {
        const t = theme();
        const mat = new THREE.MeshPhysicalMaterial({
            color: t.chrome,
            metalness: 1.0,
            roughness: 0.16,
            clearcoat: 0.92,
            clearcoatRoughness: 0.08,
            envMap: metalEnvMap,
            envMapIntensity: 1.65,
            emissive: t.accent,
            emissiveIntensity: 0.008,
            wireframe: false,
        });

        if (original?.normalMap) {
            mat.normalMap = original.normalMap;
            mat.normalScale = new THREE.Vector2(0.06, 0.06);
        }

        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uSolid = { value: 0 };
            shader.uniforms.uGlow = { value: new THREE.Color(t.glow) };
            shader.uniforms.uAccent = { value: new THREE.Color(t.accent) };
            shader.uniforms.uRim = { value: new THREE.Color(t.rim) };

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                uniform float uTime;
                uniform float uSolid;
                uniform vec3 uGlow;
                uniform vec3 uAccent;
                uniform vec3 uRim;`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
                vec3 viewDir = normalize(vViewPosition);
                vec3 n = normalize(normal);
                float fresnel = pow(1.0 - max(dot(n, -viewDir), 0.0), 3.2);
                float holoMix = mix(1.0, 0.12, uSolid);
                gl_FragColor.rgb += mix(uAccent, uRim, fresnel * 0.6) * fresnel * 0.55 * holoMix;

                float scan = smoothstep(0.92, 1.0, sin(vViewPosition.y * 38.0 - uTime * 1.8));
                gl_FragColor.rgb += uGlow * scan * 0.07 * holoMix;

                float holoBand = smoothstep(0.97, 1.0, sin(vViewPosition.y * 12.0 + uTime * 0.8));
                gl_FragColor.rgb += uAccent * holoBand * 0.04 * holoMix;

                if (uSolid > 0.5) {
                    float brush = sin(dot(vViewPosition, vec3(48.0, 6.0, 18.0))) * 0.035;
                    gl_FragColor.rgb += vec3(brush);

                    float panel = smoothstep(0.965, 1.0, abs(sin(vViewPosition.y * 26.0)))
                                * smoothstep(0.965, 1.0, abs(sin(vViewPosition.x * 22.0)));
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.82 + uAccent * 0.18, panel * 0.22);
                } else {
                    gl_FragColor.rgb = mix(gl_FragColor.rgb, uGlow, fresnel * 0.08);
                }`
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
        model.scale.setScalar(0.24 / Math.max(...box.getSize(new THREE.Vector3()).toArray()));
        return new THREE.Box3().setFromObject(model);
    }

    function addScreenFrame() {
        const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(screenSize.width, screenSize.height));
        screenFrame = tag(new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({
                color: 0x00e8ff,
                transparent: true,
                opacity: 0.22,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        ), 'screenFrame');
        screenFrame.position.z = 0;
        scene.add(screenFrame);

        const glass = tag(new THREE.Mesh(
            new THREE.PlaneGeometry(screenSize.width, screenSize.height),
            new THREE.MeshBasicMaterial({
                color: 0x88eeff,
                transparent: true,
                opacity: 0.018,
                side: THREE.DoubleSide,
                depthWrite: false,
            })
        ), 'screenGlass');
        glass.position.z = 0.001;
        scene.add(glass);
    }

    function buildFaceFromModel(gltf) {
        const group = new THREE.Group();
        const model = gltf.scene;

        applyAndroidMaterial(model);
        const box = fitModel(model);
        group.add(model);

        group.position.z = DISPLAY.holoDepth;

        model.traverse((child) => {
            if (child.isMesh && !headMesh) headMesh = child;
        });

        if (headMesh) {
            wireOverlay = tag(new THREE.Mesh(
                headMesh.geometry,
                new THREE.MeshBasicMaterial({
                    color: theme().accent,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            ), 'wireOverlay');
            wireOverlay.visible = wireframeMode;
            headMesh.parent.add(wireOverlay);
        }

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
            positions[i] = (Math.random() - 0.5) * 0.45;
            positions[i + 1] = (Math.random() - 0.5) * 0.45;
            positions[i + 2] = (Math.random() - 0.5) * 0.25 + DISPLAY.holoDepth * 0.5;
            colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        particleSystem = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.004,
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

    function applyMaterialMode(enabled) {
        if (!headMaterial) return;
        headMaterial.transparent = enabled;
        headMaterial.opacity = enabled ? 0.28 : 1;
        headMaterial.emissiveIntensity = enabled ? 0.03 : 0.008;
        headMaterial.metalness = enabled ? 0.45 : 1.0;
        headMaterial.roughness = enabled ? 0.4 : 0.16;
        headMaterial.envMapIntensity = enabled ? 0.35 : 1.65;
        headMaterial.clearcoat = enabled ? 0 : 0.92;
        headMaterial.clearcoatRoughness = enabled ? 0.5 : 0.08;
        if (headMaterial.normalScale) {
            headMaterial.normalScale.setScalar(enabled ? 0.15 : 0.06);
        }
        const sh = headMaterial.userData.shader;
        if (sh?.uniforms?.uSolid) sh.uniforms.uSolid.value = enabled ? 0 : 1;
    }

    function setWireframe(enabled) {
        wireframeMode = enabled;
        applyMaterialMode(enabled);
        if (wireOverlay) wireOverlay.visible = enabled;
    }

    function setTrackingStatus(text) {
        const el = document.getElementById('tracking-status');
        if (el) el.textContent = text;
    }

    async function startWebcamTracking() {
        if (webcamActive) {
            stopWebcamTracking();
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setTrackingStatus('Webcam unavailable — use mouse to move viewpoint');
            return;
        }

        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 320, height: 240 },
                audio: false,
            });
        } catch (err) {
            console.warn(err);
            setTrackingStatus('Camera denied — mouse tracking active');
            return;
        }

        webcamVideo = document.createElement('video');
        webcamVideo.srcObject = webcamStream;
        webcamVideo.playsInline = true;
        webcamVideo.muted = true;
        await webcamVideo.play();

        if ('FaceDetector' in window) {
            try {
                faceDetector = new FaceDetector({ maxDetectedFaces: 1, fastMode: true });
            } catch (err) {
                console.warn(err);
            }
        }

        webcamActive = true;
        document.getElementById('track-btn')?.classList.add('active');
        setTrackingStatus(faceDetector
            ? 'Webcam head tracking — move your head'
            : 'Webcam on (basic) — move your head; best in Chrome/Edge');

        webcamLoopId = setInterval(trackFaceFromWebcam, 66);
    }

    function stopWebcamTracking() {
        webcamActive = false;
        if (webcamLoopId) {
            clearInterval(webcamLoopId);
            webcamLoopId = null;
        }
        if (webcamStream) {
            webcamStream.getTracks().forEach((t) => t.stop());
            webcamStream = null;
        }
        webcamVideo = null;
        faceDetector = null;
        document.getElementById('track-btn')?.classList.remove('active');
        setTrackingStatus('Mouse forced-perspective — move cursor to shift viewpoint');
        eyeTarget.x = 0;
        eyeTarget.y = 0;
    }

    async function trackFaceFromWebcam() {
        if (!webcamActive || !webcamVideo) return;

        const vw = webcamVideo.videoWidth;
        const vh = webcamVideo.videoHeight;
        if (!vw || !vh) return;

        if (faceDetector) {
            try {
                const faces = await faceDetector.detect(webcamVideo);
                if (faces.length > 0) {
                    const box = faces[0].boundingBox;
                    const cx = (box.x + box.width * 0.5) / vw;
                    const cy = (box.y + box.height * 0.5) / vh;
                    setEyeFromNormalized((0.5 - cx) * 2.2, (cy - 0.5) * 2.2);
                    return;
                }
            } catch (err) {
                console.warn(err);
            }
        }

        // Fallback: centre-weighted motion proxy when FaceDetector is missing
        setEyeFromNormalized(0, 0);
    }

    async function init() {
        canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer || typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
            setLoading('Failed to load Three.js or GLTFLoader.');
            return;
        }

        const width = canvasContainer.clientWidth || window.innerWidth;
        const height = canvasContainer.clientHeight || window.innerHeight;
        updateScreenSize();

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x010108);
        scene.fog = new THREE.FogExp2(0x010108, 1.8);

        camera = new THREE.PerspectiveCamera(40, width / height, 0.008, 12);
        applyForcedPerspective(camera, eyePos, screenSize.width, screenSize.height);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.45;
        canvasContainer.appendChild(renderer.domElement);

        metalEnvMap = createMetalEnvMap();
        scene.environment = metalEnvMap;

        addScreenFrame();

        try {
            faceGroup = await createHumanoidFace();
            scene.add(faceGroup);
        } catch (err) {
            console.error(err);
            setLoading('Could not load 3D model.');
            return;
        }

        scene.add(new THREE.AmbientLight(0x1a2233, 0.15));
        scene.add(new THREE.HemisphereLight(0x446688, 0x080810, 0.22));

        const t = theme();
        const key = new THREE.DirectionalLight(0xf0f8ff, 1.05);
        key.position.set(0.2, 0.45, 0.55);
        scene.add(key);

        const spec = new THREE.DirectionalLight(0xffffff, 0.75);
        spec.position.set(-0.35, 0.25, 0.45);
        scene.add(spec);

        const rim = new THREE.DirectionalLight(t.glow, 0.35);
        rim.position.set(-0.25, 0, -0.35);
        scene.add(rim);

        const fill = new THREE.PointLight(t.accent, 0.35, 3);
        fill.position.set(-0.2, 0.08, 0.35);
        fill.name = 'fillLight';
        scene.add(fill);

        const glow = new THREE.PointLight(t.glow, 0.25, 2);
        glow.position.set(0, 0.05, 0.2);
        glow.name = 'glowLight';
        scene.add(glow);

        addParticles();
        setWireframe(true);
        setupControls(renderer.domElement);
        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', (e) => updateEyeFromPointer(e.clientX, e.clientY));
        window.addEventListener('deviceorientation', onDeviceOrientation, true);

        document.getElementById('rotate-btn')?.addEventListener('click', () => { isRotating = !isRotating; });
        document.getElementById('wireframe-btn')?.addEventListener('click', () => {
            wireframeMode = !wireframeMode;
            setWireframe(wireframeMode);
        });
        document.getElementById('color-btn')?.addEventListener('click', () => {
            themeIndex = (themeIndex + 1) % THEMES.length;
            applyTheme();
            applyMaterialMode(wireframeMode);
            const th = theme();
            scene.children.forEach((ch) => {
                if (ch instanceof THREE.PointLight && ch.name === 'fillLight') ch.color.setHex(th.accent);
                if (ch instanceof THREE.PointLight && ch.name === 'glowLight') ch.color.setHex(th.glow);
            });
        });
        document.getElementById('track-btn')?.addEventListener('click', () => {
            if (webcamActive) stopWebcamTracking();
            else startWebcamTracking();
        });
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            if (faceGroup) faceGroup.rotation.set(0, 0, 0);
            eyeTarget = { x: 0, y: 0, z: DISPLAY.eyeZ };
            eyePos = { ...eyeTarget };
            if (webcamActive) stopWebcamTracking();
        });

        setTrackingStatus('Forced-perspective display — move mouse to shift viewpoint');
        animate();
    }

    function onDeviceOrientation(e) {
        if (webcamActive || dragging) return;
        if (e.beta == null || e.gamma == null) return;
        setEyeFromNormalized(
            THREE.MathUtils.clamp(e.gamma / 25, -1, 1),
            THREE.MathUtils.clamp((e.beta - 45) / 35, -1, 1)
        );
    }

    function setupControls(canvas) {
        let prev = { x: 0, y: 0 };

        canvas.addEventListener('mousedown', (e) => {
            dragging = true;
            prev = { x: e.clientX, y: e.clientY };
        });
        canvas.addEventListener('mousemove', (e) => {
            updateEyeFromPointer(e.clientX, e.clientY);
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
            eyeTarget.z = Math.max(
                DISPLAY.eyeZMin,
                Math.min(DISPLAY.eyeZMax, eyeTarget.z + e.deltaY * 0.00025)
            );
        }, { passive: false });

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                dragging = true;
                prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                updateEyeFromPointer(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                updateEyeFromPointer(e.touches[0].clientX, e.touches[0].clientY);
                if (dragging && faceGroup) {
                    faceGroup.rotation.y += (e.touches[0].clientX - prev.x) * 0.006;
                    faceGroup.rotation.x += (e.touches[0].clientY - prev.y) * 0.006;
                    prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
            }
        }, { passive: true });
        canvas.addEventListener('touchend', () => { dragging = false; });
    }

    function onResize() {
        if (!canvasContainer || !camera || !renderer) return;
        updateScreenSize();
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!renderer || !scene || !camera || !faceGroup) return;

        jumpTime += 0.02;

        eyePos.x += (eyeTarget.x - eyePos.x) * DISPLAY.smooth;
        eyePos.y += (eyeTarget.y - eyePos.y) * DISPLAY.smooth;
        eyePos.z += (eyeTarget.z - eyePos.z) * DISPLAY.smooth;

        applyForcedPerspective(camera, eyePos, screenSize.width, screenSize.height);

        const breathe = 0.004 * Math.sin(jumpTime * 0.9);
        faceGroup.position.z = DISPLAY.holoDepth + breathe;

        if (isRotating) {
            faceGroup.rotation.y += 0.003;
        }

        if (headMaterial?.userData.shader) {
            headMaterial.userData.shader.uniforms.uTime.value = jumpTime;
        }

        if (headMaterial) {
            headMaterial.emissiveIntensity = wireframeMode
                ? 0.03 + 0.02 * Math.sin(jumpTime * 1.2)
                : 0.008 + 0.003 * Math.sin(jumpTime * 1.2);
        }

        if (particleSystem) particleSystem.rotation.y += 0.0004;

        renderer.render(scene, camera);
    }

    window.addEventListener('load', () => { if (typeof THREE !== 'undefined') init(); });
})();
