import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Matter from 'matter-js';

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Vector } = Matter;

const COLORS = {
    peg: '#eeff00ff',
    ball: '#ff0055ff'
};

const GameCanvas = forwardRef(({ onBallLanded, onPegHit, vibrationEnabled = true, getImage }, ref) => {
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);
    // Track balls that have already triggered a score to prevent double-counting/crashes
    const processedBalls = useRef(new Set());

    // Fix Stale Closure: Keep track of the latest callback
    const onBallLandedRef = useRef(onBallLanded);

    // Audio & Visual Refs
    // const { play: playHit } = useSound('/Audio/peg.mp3', { volume: 1.0, multi: true }); // Moved to App.jsx
    const playHitRef = useRef(onPegHit);
    const litPegs = useRef(new Map()); // Map<ID, {x, y, time}>

    // Shake State
    const [shake, setShake] = useState(false);

    useEffect(() => {
        onBallLandedRef.current = onBallLanded;
        playHitRef.current = onPegHit;
    }, [onBallLanded, onPegHit]);

    useImperativeHandle(ref, () => ({
        dropBall: (colIdx, isFireBall = false) => {
            if (!engineRef.current || !renderRef.current) return;

            const width = renderRef.current.options.width;

            // --- GRID LOGIC ---
            // Buckets: 5 (Standard)
            // const TOTAL_BINS = 5; // Unused for drop logic now

            // PEG DENSITY (Decoupled from Bins)
            // We want 7 columns of pegs to keep it "tight"
            const PEG_COLS = 7;
            const pegSpacing = width / PEG_COLS;

            // FIXED DROP POINTS (B-I-N-G-O)
            // User requested specific alignment:
            // B (0) -> Col 1 (2nd small peg row)
            // I (1) -> Col 2 (3rd small peg row)
            // N (2) -> Col 3 (4th small peg row - Center)
            // G (3) -> Col 4 (5th small peg row)
            // O (4) -> Col 5 (6th small peg row)

            let startX;

            if (isFireBall) {
                // FIREBALL: Perfect Center of the Bin (Advantage)
                const TOTAL_BINS = 5;
                const binW = width / TOTAL_BINS;
                startX = (colIdx * binW) + (binW / 2);
            } else {
                // NORMAL BALL: Aligned to specific Peg Columns (Challenge)
                // Map colIdx (0-4) to Peg Column Index (1-5)
                const targetPegCol = colIdx + 1;
                // Start center of the chosen PEG column
                startX = (targetPegCol * pegSpacing) + (pegSpacing / 2);
            }

            const ballRadius = width * 0.027;
            const ball = Bodies.circle(startX, -20, ballRadius, {
                restitution: isFireBall ? 0.0 : 0.75, // Less bouncy (heavier feel)
                friction: isFireBall ? 0 : 0.005,
                frictionAir: isFireBall ? 0.07 : 0.01, // Lower resistance for better glide
                density: 1.5, // Heavier mass
                render: isFireBall ? {
                    fillStyle: '#ff4d00',
                    strokeStyle: '#ffae00',
                    lineWidth: 4
                } : {
                    sprite: {
                        texture: getImage('ball.png'),
                        xScale: (ballRadius * 2) / 128, // Image is now 128px
                        yScale: (ballRadius * 2) / 128
                    }
                },
                label: isFireBall ? 'fireball' : 'player-ball',
                isSensor: isFireBall // FIREBALL IGNORES ALL COLLISIONS (But triggers events)
            });

            // Random slight x velocity (chaos) ONLY IF NOT FIREBALL
            if (!isFireBall) {
                Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * 3, y: 0 });
            } else {
                Matter.Body.setVelocity(ball, { x: 0, y: 5 }); // Push it down
            }

            Composite.add(engineRef.current.world, ball);
        }
    }));

    useEffect(() => {
        if (!sceneRef.current) return;

        // CRITICAL FIX: Delay initialization to ensure layout is stable
        // The container might be resizing (flexbox) when this runs immediately.
        const timer = setTimeout(() => {
            if (!sceneRef.current) return;

            // dimensions (Check freshly)
            const width = sceneRef.current.clientWidth;
            const height = sceneRef.current.clientHeight;

            // Setup Matter JS
            const engine = Engine.create();
            engine.world.gravity.y = 1.2;
            engineRef.current = engine;

            const render = Render.create({
                element: sceneRef.current,
                engine: engine,
                options: {
                    width,
                    height,
                    wireframes: false, // SHOW ACTUAL BODIES (Solids)
                    background: 'transparent',
                    pixelRatio: window.devicePixelRatio
                }
            });
            renderRef.current = render;

            // Walls (Edges of the screen)
            const wallThick = 60;
            const walls = [
                Bodies.rectangle(-wallThick / 2, height / 2, wallThick, height * 2, { isStatic: true, label: 'wall-left', friction: 0, restitution: 1.3 }),
                Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 2, { isStatic: true, label: 'wall-right', friction: 0, restitution: 1.3 }),
                Bodies.rectangle(width / 2, height + 25, width, 50, { isStatic: true, label: 'floor' })
            ];
            Composite.add(engine.world, walls);

            // ... (rest of code)

            // (Skipping to return statement for border removal)
            // But this tool only does one contiguous block. 
            // I will do the render change first, then the border removal in a separate call or just rely on the user seeing the ramps inside the border.
            // Actually, I'll do two replace calls. This one is for Render options.


            // Pegs (Aligned Grid)
            // Dynamic Peg Radius (Baseline 7px -> larger for impact)
            const pegRadius = width * 0.021;
            const pegRadiusSmall = width * 0.013; // Smaller for "Odd Columns" (Interleaved)
            // Rows: Adjust count for density. 
            // 16 rows makes it denser and harder.
            const rows = 14;
            const startY = 25; // Closer to top (Glued to divider)
            const endY = height - 100; // Stop above the funnels
            const gapY = (endY - startY) / (rows - 1);

            // Unit Width
            const TOTAL_BINS = 5;
            const binW = width / TOTAL_BINS;

            // PEG DENSITY (Decoupled from Bins)
            // We want 7 columns of pegs to keep it "tight"
            const PEG_COLS = 7;
            const pegSpacing = width / PEG_COLS;

            for (let r = 0; r < rows; r++) {
                const isEven = (r % 2 === 0);

                // Row Logic:
                // Grid driven by PEG_COLS (7), not BINS (5).

                if (isEven) {
                    // EDGE ALIGNED (0 to PEG_COLS)
                    for (let c = 0; c <= PEG_COLS; c++) {
                        const px = c * pegSpacing;

                        const peg = Bodies.circle(px, startY + (r * gapY), pegRadius, {
                            isStatic: true,
                            render: {
                                sprite: {
                                    texture: getImage('peg.png'),
                                    xScale: (pegRadius * 2) / 64, // Assume 64px image
                                    yScale: (pegRadius * 2) / 64
                                }
                            },
                            restitution: 0.9,
                            label: 'peg'
                        });
                        Composite.add(engine.world, peg);
                    }
                } else {
                    // CENTER ALIGNED
                    for (let c = 0; c < PEG_COLS; c++) {
                        const px = (c * pegSpacing) + (pegSpacing / 2);

                        const peg = Bodies.circle(px, startY + (r * gapY), pegRadiusSmall, {
                            isStatic: true,
                            render: {
                                sprite: {
                                    texture: getImage('peg.png'),
                                    xScale: (pegRadiusSmall * 2) / 64,
                                    yScale: (pegRadiusSmall * 2) / 64
                                }
                            },
                            restitution: 1.5,
                            label: 'peg'
                        });
                        Composite.add(engine.world, peg);
                    }
                }
            }

            // Physical Separators & Sensors
            // These must MATCH THE VISUAL BUCKETS (5 Cols)

            // VISUAL DEBUG MARKERS (DROP POINTS)
            // Show where the balls will drop for B-I-N-G-O (Inputs 0-4)
            for (let i = 0; i < 5; i++) {
                const targetPegCol = i + 1; // Map 0..4 -> 1..5
                const markerX = (targetPegCol * pegSpacing) + (pegSpacing / 2);
                const markerY = 10; // Very top

                const marker = Bodies.circle(markerX, markerY, 5, {
                    isStatic: true,
                    isSensor: true, // Ghost (no collision)
                    label: `drop-marker-${i}`,
                    render: {
                        fillStyle: '#00ff00', // Bright Green
                        opacity: 0.8
                    }
                });
                Composite.add(engine.world, marker);
            }

            const bucketHeight = 60;

            for (let i = 0; i < TOTAL_BINS; i++) {
                // i = 0..4
                const x = i * binW; // Left edge of this bin

                // Separators (Walls/Funnels between columns)
                // NOW INCLUDING EDGES (i=0 to 5) to handle "side gaps"
                // We want funnels at: 0*W (Left), 1*W, 2*W, 3*W, 4*W, 5*W (Right)
                // But the loop is 0..4 (5 cols).
                // We can add the Left funnel on i=0. The Right funnel triggers on i=4 (at x+binW).

                const funnelWidth = binW * 0.5; // Dynamic width (50% of bin width)
                const funnelHeight = 90; // Normalized height

                // Standard VISIBLE Funnel (Internal) - DEBUGGING POSITION
                const internalOptions = {
                    isStatic: true,
                    friction: 0,
                    frictionStatic: 0,
                    render: {
                        sprite: {
                            texture: getImage('triangle.png'),
                            xScale: 40 / 80, // Target 40px width. Adjust if image is not 80px.
                            yScale: 90 / 180 // Target 90px height. Adjust if image is not 180px.
                        }
                    },
                    label: 'funnel-internal',
                    restitution: 0.5 // Bouncy tip
                };



                // 1. Funnel on the LEFT of the current bin (at x)
                // This covers:
                // i=0: Left Wall (x=0)
                // i=1..4: Internal Dividers
                Composite.add(engine.world, Bodies.trapezoid(x, height - 20, 40, funnelHeight, 1, internalOptions));

                // 2. Funnel on the RIGHT of the LAST bin (at x + binW)
                // This covers: Right Wall (x=width)
                if (i === 4) {
                    Composite.add(engine.world, Bodies.trapezoid(x + binW, height - 20, 40, funnelHeight, 1, internalOptions));
                }

                // (Ramp logic removed - replaced by Trapezoids above)

                // Sensor (The Trigger) - LARGE CATCHER
                // Position: Centered lower to ensure capture.
                // extending from roughly the bottom of the visible pipe down.
                const pipeX = x + binW / 2;
                const sensorHeight = 10; // Thin sensor at the very bottom
                const sensorY = height - 20; // Trigger slightly earlier (was -5)

                // CRITICAL FIX: Make Sensor FULL WIDTH of the bin
                // Using binW + 2 to slight overlap
                const sensor = Bodies.rectangle(pipeX, sensorY, binW + 2, sensorHeight, {
                    isStatic: true,
                    isSensor: true, // Specific trigger
                    label: `bin-${i}`, // Encodes the Index: 0, 1, 2, 3, 4
                    render: {
                        visible: false, // Debug: set true to see sensor
                        fillStyle: 'red' // visible for debug
                    }
                });
                Composite.add(engine.world, sensor);
            }

            // Collision Event
            Events.on(engine, 'collisionStart', (evt) => {
                evt.pairs.forEach(pair => {
                    const { bodyA, bodyB } = pair;

                    // Identify ball and sensor
                    let ball = null;
                    let sensor = null;

                    if (bodyA.label === 'player-ball' || bodyA.label === 'fireball') ball = bodyA;
                    else if (bodyB.label === 'player-ball' || bodyB.label === 'fireball') ball = bodyB;

                    if (bodyA.label.startsWith('bin-')) sensor = bodyA;
                    else if (bodyB.label.startsWith('bin-')) sensor = bodyB;

                    const isFloor = bodyA.label === 'floor' || bodyB.label === 'floor';
                    const peg = (bodyA.label === 'peg' ? bodyA : (bodyB.label === 'peg' ? bodyB : null));

                    // Explicitly IGNORE separators/funnels for sound
                    const isFunnel = bodyA.label.includes('funnel') || bodyB.label.includes('funnel');
                    if (isFunnel) return;

                    // ACTIVE BUMPER LOGIC
                    if (ball && peg) {
                        // Calculate vector from peg to ball
                        const normal = Vector.normalise(Vector.sub(ball.position, peg.position));
                        // Apply active force (Kick)
                        // Adjust magnitude to taste. 0.05 is significant for this size.
                        const force = Vector.mult(normal, 0.05);
                        Body.applyForce(ball, ball.position, force);

                        // --- FEEDBACK SECTION ---
                        // 1. Audio
                        // FIREBALL IS SILENT (For now)
                        if (playHitRef.current && ball.label !== 'fireball') {
                            playHitRef.current();
                        }

                        // 2. Haptic
                        if (vibrationEnabled && navigator.vibrate) navigator.vibrate(15);

                        // 3. Visual (Light Up)
                        // Save the peg position and time to the map
                        litPegs.current.set(peg.id, {
                            x: peg.position.x,
                            y: peg.position.y,
                            time: Date.now()
                        });
                    }

                    // ACTIVE WALL KICK (Keep it in the center!)
                    if (ball) {
                        const hitLeft = (bodyA.label === 'wall-left' || bodyB.label === 'wall-left');
                        const hitRight = (bodyA.label === 'wall-right' || bodyB.label === 'wall-right');

                        if (hitLeft) {
                            // Kick RIGHT
                            Body.applyForce(ball, ball.position, { x: 0.15, y: -0.05 }); // Slight lift too
                        } else if (hitRight) {
                            // Kick LEFT
                            Body.applyForce(ball, ball.position, { x: -0.15, y: -0.05 }); // Slight lift too
                        }
                    }

                    // VALID COLLISION LOGIC
                    if (ball && sensor) {
                        // 1. CRITICAL: Check Duplicate Logic
                        if (processedBalls.current.has(ball.id)) {
                            return; // Already processed this ball. IGNORE.
                        }

                        // 2. Mark as processed immediately
                        processedBalls.current.add(ball.id);

                        // 3. Extract Index
                        const binIdx = parseInt(sensor.label.split('-')[1]);

                        // 4. Trigger Game Logic (Use Ref to get latest state)
                        if (onBallLandedRef.current) {
                            onBallLandedRef.current(binIdx, ball.label === 'fireball');
                        }

                        // --- FIREBALL IMPACT EFFECT ---
                        if (ball.label === 'fireball') {
                            // 1. Heavy Vibrate
                            if (vibrationEnabled && navigator.vibrate) {
                                navigator.vibrate([100, 50, 100]); // 100ms vib, 50ms pause, 100ms vib
                            }
                            // 2. Trigger Shake
                            setShake(true);
                            setTimeout(() => setShake(false), 500); // Reset after anim
                        }

                        // 5. DELAYED REMOVAL (Let user see it land)
                        setTimeout(() => {
                            Composite.remove(engine.world, ball);
                        }, 1000); // 2.0s delay (User requested longer time)
                    } else if (ball && isFloor) {
                        // FEEDBACK: Play sound/haptics on floor hit (ONCE)
                        if (!ball.hasHitFloor) {
                            // FIREBALL IS SILENT
                            if (playHitRef.current && ball.label !== 'fireball') {
                                playHitRef.current();
                            }
                            if (vibrationEnabled && navigator.vibrate) navigator.vibrate(10);
                            ball.hasHitFloor = true;
                        }

                        // Cleanup on floor hit (ONLY if missed sensor)
                        // If it hit the sensor, it's in processedBalls, so we let the timeout handle it.
                        if (!processedBalls.current.has(ball.id)) {
                            Composite.remove(engine.world, ball);
                        }
                    }

                });
            });

            // --- ADVANCED PARTICLE SYSTEM FOR FIREBALLS (COMET) ---
            const particles = [];

            // Helper to add particles
            const emitParticles = (x, y) => {
                // 1. Core Fire (Intense, Fast)
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: x + (Math.random() - 0.5) * 10,
                        y: y + (Math.random() - 0.5) * 10,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() * -3) - 1, // Upward bias relative to ball (which falls down, effectively trail stays behind)
                        life: 1.0,
                        decay: 0.05 + Math.random() * 0.05,
                        size: 6 + Math.random() * 6,
                        color: '255, 100, 0', // OrangeBase
                        type: 'core'
                    });
                }

                // 2. Sparks (Wide spread, long life)
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: x,
                        y: y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 1.0,
                        decay: 0.02 + Math.random() * 0.02,
                        size: 2 + Math.random() * 2,
                        color: '255, 255, 0', // Yellow
                        type: 'spark'
                    });
                }

                // 3. Smoke (Rising, Dark)
                if (Math.random() > 0.5) {
                    particles.push({
                        x: x + (Math.random() - 0.5) * 20,
                        y: y,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -2 - Math.random(), // Floats up
                        life: 1.0,
                        decay: 0.015,
                        size: 10 + Math.random() * 10,
                        color: '50, 50, 50', // Gray
                        type: 'smoke'
                    });
                }
            };

            Events.on(render, 'afterRender', () => {
                const ctx = render.context;
                const bodies = Composite.allBodies(engine.world);

                // 1. EMIT from active fireballs
                bodies.forEach(body => {
                    if (body.label === 'fireball') {
                        emitParticles(body.position.x, body.position.y);

                        // Draw Glowing Head
                        const x = body.position.x;
                        const y = body.position.y;

                        // Intense Core Glow
                        const gradient = ctx.createRadialGradient(x, y, 5, x, y, 40);
                        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                        gradient.addColorStop(0.2, 'rgba(255, 200, 0, 0.8)');
                        gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.4)');
                        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

                        ctx.globalCompositeOperation = 'screen'; // Additive blending for glow
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(x, y, 45, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over'; // Reset
                    }
                });

                // 2. DRAW LIT PEGS (Visual Feedback)
                const now = Date.now();
                const GLOW_DURATION = 350; // slightly longer fade

                litPegs.current.forEach((data, id) => {
                    const elapsed = now - data.time;
                    if (elapsed > GLOW_DURATION) {
                        litPegs.current.delete(id);
                        return;
                    }

                    // Ease out cubic for smoother fade
                    const t = elapsed / GLOW_DURATION;
                    const alpha = 1 - t; // Linear fade is fine for subtle effects

                    // Draw Glow - Soft & Subtle
                    // Using 'source-over' instead of 'screen' for less "burning" white intensity
                    ctx.globalCompositeOperation = 'source-over';

                    ctx.beginPath();
                    // Match peg size roughly (approx 12-15px depending on screen)
                    // We just add a small rim
                    ctx.arc(data.x, data.y, 16, 0, 2 * Math.PI);

                    // Softer Gold/Orange, low opacity
                    ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.5})`;
                    ctx.fill();

                    // No inner white core - keeps it flat and subtle
                });

                // 2. UPDATE & DRAW Particles
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= p.decay;

                    if (p.life <= 0) {
                        particles.splice(i, 1);
                        continue;
                    }

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);

                    // Dynamic colors based on life/type
                    if (p.type === 'core') {
                        // Fade from Yellow to Red
                        const red = 255;
                        const green = Math.floor(255 * p.life); // 255 -> 0
                        const blue = 0;
                        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${p.life})`;
                    } else if (p.type === 'spark') {
                        ctx.fillStyle = `rgba(255, 255, 200, ${p.life})`;
                    } else if (p.type === 'smoke') {
                        ctx.fillStyle = `rgba(50, 50, 50, ${p.life * 0.5})`;
                    }

                    ctx.fill();
                }
            });

            // DEBUG: Log all bodies to verify existence
            // console.log("PHYSICS WORLD CREATED. BODIES:", Composite.allBodies(engine.world).map(b => b.label));

            Runner.run(Runner.create(), engine);
            Render.run(render);

        }, 100); // 100ms delay for layout stability

        // Cleanup
        return () => {
            clearTimeout(timer);
            if (renderRef.current) {
                Render.stop(renderRef.current);
                if (renderRef.current.canvas) renderRef.current.canvas.remove();
            }
            if (engineRef.current) Engine.clear(engineRef.current);
            processedBalls.current.clear();
        };
    }, []);

    return (
        <div ref={sceneRef} className={`w-full h-full relative ${shake ? 'animate-shake-heavy' : ''}`} />
    );
});

export default GameCanvas;
