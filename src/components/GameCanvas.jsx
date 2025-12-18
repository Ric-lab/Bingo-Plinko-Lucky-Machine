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

    useImperativeHandle(ref, () => ({
        dropBall: (colIdx) => {
            if (!engineRef.current || !renderRef.current) return;

            const width = renderRef.current.options.width;
            const binW = width / 5;
            // Start center of the chosen column
            const startX = (colIdx * binW) + binW / 2;

            const ball = Bodies.circle(startX, -20, 9, {
                restitution: 0.6,
                friction: 0.005,
                density: 0.04,
                render: { fillStyle: COLORS.ball, strokeStyle: '#fff', lineWidth: 2 },
                label: 'player-ball',
                isSensor: false
            });

            // Random slight x velocity (chaos)
            Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * 3, y: 0 });

            Composite.add(engineRef.current.world, ball);
        }
    }));

    useEffect(() => {
        if (!sceneRef.current) return;

        // dimensions
        const width = sceneRef.current.clientWidth;
        const height = sceneRef.current.clientHeight;

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
                wireframes: false, // Set to true to debug physics bodies
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

        // Pegs (Staggered Grid)
        const pegRadius = 3.5;
        const rows = 14;
        const startY = 40;
        const endY = height - 80; // Leave room for buckets
        const gapY = (endY - startY) / rows;

        // Tighter Grid
        const cols = 9;
        const gapX = width / cols;

        for (let r = 0; r < rows; r++) {
            const isOffset = (r % 2 === 1);
            const colsInRow = isOffset ? cols - 1 : cols;

            for (let c = 0; c < colsInRow; c++) {
                let px = (c * gapX) + (gapX / 2);
                if (isOffset) px += (gapX / 2);

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

            // Separators (Walls between columns)
            if (i > 0) {
                // Short separators to guide ball but not block view
                Composite.add(engine.world, Bodies.rectangle(x, height - bucketHeight / 2, wallThick, bucketHeight, {
                    isStatic: true,
                    render: { fillStyle: '#ccc', opacity: 0.0 } // Invisible, visual handled by BucketRow
                }));
            }

            // Sensor (The Trigger) - DEEP INSIDE / BELOW MOUTH
            // Position: Center of column, slightly BELOW the visual "bottom" of the screen
            // allowing the ball to fully "enter" the pipe visually before triggering.
            // GameCanvas is likely overlaying the BucketRow or behind it.
            // If BucketRow is at bottom, we want sensor at `height`.
            const pipeX = x + binW / 2;
            const sensorY = height + 10; // Trigger JUST as it leaves the visual area

            const sensor = Bodies.rectangle(pipeX, sensorY, binW - 10, 20, {
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

                if (bodyA.label === 'player-ball') ball = bodyA;
                else if (bodyB.label === 'player-ball') ball = bodyB;

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

                    // 4. Trigger Game Logic
                    if (onBallLanded) onBallLanded(binIdx);

                    // 5. Visual Cleanup (The "Fade" Effect)
                    // Disable physics collisions so it falls through everything (no bouncing back up)
                    ball.collisionFilter.mask = 0;

                    // Optional: Shrink animation loop before removing
                    const fadeDuration = 300;
                    const startTime = Date.now();

                    const animateDespawn = () => {
                        if (!engineRef.current) return;
                        const elapsed = Date.now() - startTime;

                        if (elapsed > fadeDuration) {
                            Composite.remove(engine.world, ball);
                            // Cleanup ID from set to keep memory clean (optional, but good for long sessions)
                            processedBalls.current.delete(ball.id);
                            return;
                        }

                        // Smooth shrink
                        const progress = elapsed / fadeDuration;
                        const scale = 1 - (progress * 0.5); // Shrink to 50%

                        // Matter.js scaling is multiplicative, so we reset standard scale is tricky.
                        // Instead, we just set scale factor relative to previous frame? 
                        // Actually, frequent scaling in Matter can be unstable.
                        // Better to just let it fall 'through' the floor (since mask=0)

                        requestAnimationFrame(animateDespawn);
                    };
                    animateDespawn();
                }
            });
        });

        Runner.run(Runner.create(), engine);
        Render.run(render);

        // Cleanup
        return () => {
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
