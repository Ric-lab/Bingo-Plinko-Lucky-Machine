import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Matter from 'matter-js';

const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

const COLORS = {
    peg: '#795548',
    ball: '#e91e63'
};

const GameCanvas = forwardRef(({ onBallLanded }, ref) => {
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);
    // Track balls that have already triggered a score to prevent double-counting/crashes
    const processedBalls = useRef(new Set());

    // Fix Stale Closure: Keep track of the latest callback
    const onBallLandedRef = useRef(onBallLanded);

    useEffect(() => {
        onBallLandedRef.current = onBallLanded;
    }, [onBallLanded]);

    useImperativeHandle(ref, () => ({
        dropBall: (colIdx, isFireBall = false) => {
            if (!engineRef.current || !renderRef.current) return;

            const width = renderRef.current.options.width;
            const binW = width / 5;
            // Start center of the chosen column
            const startX = (colIdx * binW) + binW / 2;

            const ball = Bodies.circle(startX, -20, 12, {
                restitution: isFireBall ? 0.0 : 0.7, // No bounce for fire
                friction: isFireBall ? 0 : 0.03,
                frictionAir: isFireBall ? 0.02 : 0, // Fall slightly steadier?
                density: 0.25,
                render: {
                    fillStyle: isFireBall ? '#ff4d00' : COLORS.ball,
                    strokeStyle: isFireBall ? '#ffae00' : '#fff',
                    lineWidth: isFireBall ? 4 : 2
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

            console.log(`CANVAS INIT SIZE: ${width}x${height}`);

            // Setup Matter JS
            const engine = Engine.create();
            engine.world.gravity.y = 1.3;
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

            // Walls
            const walls = [
                Bodies.rectangle(-25, height / 2, 50, height * 2, { isStatic: true }),
                Bodies.rectangle(width + 25, height / 2, 50, height * 2, { isStatic: true }),
                Bodies.rectangle(width / 2, height + 25, width, 50, { isStatic: true }) // Floor
            ];
            Composite.add(engine.world, walls);

            // ... (rest of code)

            // (Skipping to return statement for border removal)
            // But this tool only does one contiguous block. 
            // I will do the render change first, then the border removal in a separate call or just rely on the user seeing the ramps inside the border.
            // Actually, I'll do two replace calls. This one is for Render options.


            // Pegs (Staggered Grid)
            const pegRadius = 3.5;
            const rows = 14;
            const startY = 40;
            const endY = height - 80; // Leave room for buckets
            const gapY = (endY - startY) / rows;

            // Edge-to-Edge Grid (Pins on Wall)
            // Fixes "Stuck" (Convex shape) AND "Free Fall" (No gap)
            const cols = 9;
            const gapX = width / (cols - 1);

            for (let r = 0; r < rows; r++) {
                const isOffset = (r % 2 === 1);
                const colsInRow = isOffset ? cols - 1 : cols;

                // Even: 0..width (starts at 0)
                // Odd:  Offset by half gap
                const startX = isOffset ? gapX / 2 : 0;

                for (let c = 0; c < colsInRow; c++) {
                    const px = startX + (c * gapX);

                    const peg = Bodies.circle(px, startY + (r * gapY), pegRadius, {
                        isStatic: true,
                        render: { fillStyle: COLORS.peg },
                        restitution: 0.5,
                        label: 'peg'
                    });
                    Composite.add(engine.world, peg);
                }
            }

            // Physical Separators for Buckets
            const binW = width / 5;
            const wallThick = 4;
            const bucketHeight = 60; // Physical height of separators

            for (let i = 0; i < 5; i++) {
                const x = i * binW;

                // Separators (Walls/Funnels between columns)
                // NOW INCLUDING EDGES (i=0 to 5) to handle "side gaps"
                // We want funnels at: 0*W (Left), 1*W, 2*W, 3*W, 4*W, 5*W (Right)
                // But the loop is 0..4 (5 cols).
                // We can add the Left funnel on i=0. The Right funnel triggers on i=4 (at x+binW).

                const funnelWidth = 40; // Double width (was 20)
                const funnelHeight = 100; // Normalized height

                // Standard VISIBLE PINK Funnel (Internal) - DEBUGGING POSITION
                const internalOptions = {
                    isStatic: true,
                    friction: 0,
                    frictionStatic: 0,
                    render: {
                        fillStyle: '#FF1493',
                        opacity: 0,           // INVISIBLE
                        visible: false
                    },
                    label: 'funnel-internal'
                };

                // White Visible Funnel (Edges)
                // MOVED TO UI (BucketRow.jsx) for Z-Index visibility.
                // Keeping physics body but making invisible.
                const edgeOptions = {
                    isStatic: true,
                    friction: 0,
                    frictionStatic: 0,
                    render: {
                        fillStyle: '#FF1493',
                        opacity: 0.0,         // INVISIBLE (Handled by UI)
                        visible: false
                    },
                    label: 'funnel-edge'
                };

                // 1. Funnel on the LEFT of the current bin (at x)
                // Only for i > 0 (internal dividers)
                if (i > 0) {
                    // Using Trapezoid as a "Wedge"
                    // Position: Center aligned with the gap. 
                    // ADJUSTMENT: Lowered to height-40 (was height-60) to avoid jamming with low pegs.
                    Composite.add(engine.world, Bodies.trapezoid(x, height - 40, 40, 120, 1, internalOptions));
                }

                // 2. Edge Funnels (Left Wall and Right Wall) using Rotated Rectangles
                // This creates a solid "Ramp" that is mathematically simpler and unavoidable.
                const rampLength = 120;
                const rampThick = 20;

                // CORRECTION: Move ramps UP to the "Mouth" of the pipe.
                // Pipe is ~80px tall. Previous -30 was at the bottom.
                // New position: -80 guarantees we catch it at the top rim.
                const rampY = height - 85;

                if (i === 0) {
                    // Left Ramp ( / shape )
                    // Positioned higher to catch ball early
                    const ramp = Bodies.rectangle(0, rampY, rampLength, rampThick, {
                        isStatic: true,
                        angle: Math.PI / 4, // 45 degrees
                        friction: 0,
                        render: {
                            fillStyle: '#FF1493',
                            opacity: 0,       // INVISIBLE
                            visible: false
                        },
                        label: 'ramp-left'
                    });
                    Composite.add(engine.world, ramp);
                }
                if (i === 4) {
                    // Right Ramp ( \ shape )
                    // Positioned higher to catch ball early
                    const ramp = Bodies.rectangle(width, rampY, rampLength, rampThick, {
                        isStatic: true,
                        angle: -Math.PI / 4, // -45 degrees
                        friction: 0,
                        render: {
                            fillStyle: '#FF1493',
                            opacity: 0,       // INVISIBLE
                            visible: false
                        },
                        label: 'ramp-right'
                    });
                    Composite.add(engine.world, ramp);
                }

                // Sensor (The Trigger) - AT THE MOUTH
                // Position: Slightly inside the mouth so it looks like it enters.
                // Previous height-85 was too high (disappeared above rim).
                // Lowering to height-65.
                const pipeX = x + binW / 2;
                const sensorY = height - 35;

                // CRITICAL FIX: Make Sensor FULL WIDTH of the bin
                // Previously binW - 20 left gaps. Now using binW + 2 (slight overlap) to ensure capture.
                const sensor = Bodies.rectangle(pipeX, sensorY, binW + 2, 20, {
                    isStatic: true,
                    isSensor: true, // Specific trigger
                    label: `bin-${i}`, // Encodes the Index: 0, 1, 2, 3, 4
                    render: {
                        visible: false, // Debug: set true to see sensor
                        fillStyle: 'red'
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
                            onBallLandedRef.current(binIdx);
                        }

                        // 5. INSTANT REMOVAL (No Fade, No Delay)
                        Composite.remove(engine.world, ball);
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
            console.log("PHYSICS WORLD CREATED. BODIES:", Composite.allBodies(engine.world).map(b => b.label));

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
        <div ref={sceneRef} className="w-full h-full relative" />
    );
});

export default GameCanvas;
