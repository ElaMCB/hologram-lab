/**
 * Stereo-barrier parallax hologram effect
 * Creates a glasses-free 3D illusion that jumps out of the screen
 */

(function() {
    'use strict';

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Find container or create one
    const container = document.getElementById('hologram-container') || document.body;
    const canvasContainer = container.querySelector('#canvas-container') || container;
    canvasContainer.appendChild(renderer.domElement);

    // Try to load stereo pair images, fallback to procedural generation
    let texL, texR;
    const texLoader = new THREE.TextureLoader();

    // Fallback: Create procedural stereo pair if images not available
    function createProceduralStereoPair() {
        // Create a simple procedural pattern for demo
        const canvasL = document.createElement('canvas');
        canvasL.width = canvasL.height = 512;
        const ctxL = canvasL.getContext('2d');
        
        // Left eye: cyan background with magenta circle offset left
        ctxL.fillStyle = '#00ffff';
        ctxL.fillRect(0, 0, 512, 512);
        ctxL.fillStyle = '#ff00ff';
        ctxL.beginPath();
        ctxL.arc(230, 256, 150, 0, Math.PI * 2);
        ctxL.fill();
        
        const canvasR = document.createElement('canvas');
        canvasR.width = canvasR.height = 512;
        const ctxR = canvasR.getContext('2d');
        
        // Right eye: cyan background with magenta circle offset right
        ctxR.fillStyle = '#00ffff';
        ctxR.fillRect(0, 0, 512, 512);
        ctxR.fillStyle = '#ff00ff';
        ctxR.beginPath();
        ctxR.arc(282, 256, 150, 0, Math.PI * 2); // Offset for stereo
        ctxR.fill();
        
        texL = new THREE.CanvasTexture(canvasL);
        texR = new THREE.CanvasTexture(canvasR);
    }

    // Try loading stereo pair images
    let leftLoaded = false;
    let rightLoaded = false;

    try {
        texL = texLoader.load(
            'assets/left.png',
            function() { leftLoaded = true; },
            undefined,
            function() {
                console.warn('Could not load left.png, using procedural fallback');
                if (!rightLoaded) createProceduralStereoPair();
            }
        );
        
        texR = texLoader.load(
            'assets/right.png',
            function() { rightLoaded = true; },
            undefined,
            function() {
                console.warn('Could not load right.png, using procedural fallback');
                if (!leftLoaded) createProceduralStereoPair();
            }
        );
    } catch (e) {
        console.warn('Stereo images not available, creating procedural pair');
        createProceduralStereoPair();
    }

    // If neither loads, create procedural
    setTimeout(() => {
        if (!leftLoaded || !rightLoaded) {
            createProceduralStereoPair();
        }
    }, 1000);

    // Left-eye plane
    const planeL = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: texL || new THREE.CanvasTexture(document.createElement('canvas')), color: 0xffffff })
    );
    planeL.position.x = -0.5;
    scene.add(planeL);

    // Right-eye plane
    const planeR = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: texR || new THREE.CanvasTexture(document.createElement('canvas')), color: 0xffffff })
    );
    planeR.position.x = 0.5;
    scene.add(planeR);

    // Parallax-barrier mask (slanted pattern)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fill with black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 512, 512);

    // Draw white slits (1 pixel slits, 1 pixel gaps)
    ctx.fillStyle = 'white';
    for (let i = 0; i < 512; i += 2) {
        ctx.fillRect(i, 0, 1, 512);
    }

    const barrierTex = new THREE.CanvasTexture(canvas);
    barrierTex.minFilter = THREE.LinearFilter;
    barrierTex.magFilter = THREE.LinearFilter;

    const barrier = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ 
            map: barrierTex, 
            transparent: true, 
            opacity: 0.8 
        })
    );
    barrier.position.z = 0.01; // 1 cm in front
    scene.add(barrier);

    // Camera position
    camera.position.z = 2;
    camera.position.y = 0;
    camera.position.x = 0;

    // Jump animation parameters
    let time = 0;
    const jumpDepth = 0.04; // 4 cm pop-out
    const jumpSpeed = 0.02;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        time += jumpSpeed;
        
        // Jump-out animation: smooth pop-out and back
        const z = jumpDepth * Math.sin(time) * Math.sin(time);
        planeL.position.z = z;
        planeR.position.z = z;
        
        renderer.render(scene, camera);
    }

    // Mouse parallax - follows mouse movement
    let mouseX = 0;
    let mouseY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 0.02;
        mouseY = -(e.clientY / window.innerHeight - 0.5) * 0.02;
        camera.position.x = mouseX;
        camera.position.y = mouseY;
    });

    // Touch parallax for mobile
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const touchX = (e.touches[0].clientX / window.innerWidth - 0.5) * 0.02;
            const touchY = -(e.touches[0].clientY / window.innerHeight - 0.5) * 0.02;
            camera.position.x = touchX;
            camera.position.y = touchY;
        }
    }, { passive: true });

    // Device orientation (gyroscope) for mobile
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            if (e.gamma !== null && e.beta !== null) {
                // Convert device orientation to camera position
                const gamma = THREE.MathUtils.degToRad(e.gamma) * 0.02;
                const beta = THREE.MathUtils.degToRad(e.beta) * 0.02;
                camera.position.x = gamma;
                camera.position.y = beta;
            }
        }, { passive: true });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start animation when Three.js is loaded
    if (typeof THREE !== 'undefined') {
        animate();
    } else {
        window.addEventListener('load', animate);
    }

    // Export for potential external control
    window.hologramScene = scene;
    window.hologramCamera = camera;
    window.hologramRenderer = renderer;

})();
