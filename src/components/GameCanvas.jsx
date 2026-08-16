import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import Matter from 'matter-js';

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Vector } = Matter;

// ============================================================================
// PHYSICS_CONFIG — tune the gameplay feel here. All ratios scale with screen.
// ============================================================================
const PHYSICS_CONFIG = {
    // --- Ball ---
    BALL_RADIUS_RATIO: 0.03,       // % of canvas width
    BALL_RESTITUTION: 0.59,         // bounciness on collision (0-1)
    BALL_FRICTION: 0.005,
    BALL_FRICTION_AIR: 0.01,
    BALL_DENSITY: 2.0,              // heavier mass = more momentum
    BALL_INITIAL_X_CHAOS: 3,        // max abs horizontal velocity at drop (prevents straight fall)

    // --- Pegs ---
    PEG_RADIUS_RATIO: 0.021,        // large pegs (even rows)
    PEG_RADIUS_SMALL_RATIO: 0.013,  // small pegs (odd rows, interleaved)
    PEG_RESTITUTION_LARGE: 0.9,     // bouncy but loses energy
    PEG_RESTITUTION_SMALL: 1.0,     // perfect bounce
    PEG_ACTIVE_FORCE: 0.05,         // extra kick on hit
    PEG_COLS: 7,                    // horizontal density

    // --- Rows are computed dynamically ---
    PEG_ROW_GAP_RATIO: 2.4,
    PEG_ROWS_MIN: 10,
    PEG_ROWS_MAX: 16,

    // --- Walls ---
    WALL_RESTITUTION: 1.3,
    WALL_KICK_X: 0.15,
    WALL_KICK_Y: -0.05,

    // --- World ---
    GRAVITY_Y: 1.2,
};

// Canvas owns physics only. Every permanent visual is supplied as a theme asset.
const GameCanvas = forwardRef(({
    onBallLanded,
    onPegHit,
    vibrationLevel = 1,
    backgroundImage,
    ballImage,
    pegImage,
    dividerImage
}, ref) => {
    const sceneRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);
    const processedBalls = useRef(new Set());

    const onBallLandedRef = useRef(onBallLanded);
    const playHitRef = useRef(onPegHit);
    const litPegs = useRef(new Map()); // Map<ID, {x, y, time}>
    const assetsRef = useRef({ background: null, ball: null, peg: null, divider: null });

    const [shake, setShake] = useState(false);

    useEffect(() => {
        onBallLandedRef.current = onBallLanded;
        playHitRef.current = onPegHit;
    }, [onBallLanded, onPegHit]);

    useEffect(() => {
        const load = (name, src) => {
            const image = new Image();
            image.onload = () => { assetsRef.current[name] = image; };
            image.src = src;
        };

        load('background', backgroundImage);
        load('ball', ballImage);
        load('peg', pegImage);
        load('divider', dividerImage);
    }, [backgroundImage, ballImage, pegImage, dividerImage]);

    useImperativeHandle(ref, () => ({
        dropBall: (colIdx, isFireBall = false, level = 1, winStreak = 0, gameMode = 'FINGO') => {
            if (!engineRef.current || !renderRef.current) return;

            const width = renderRef.current.options.width;
            const pegSpacing = width / PHYSICS_CONFIG.PEG_COLS;

            let startX;
            if (isFireBall) {
                const TOTAL_BINS = 5;
                const binW = width / TOTAL_BINS;
                startX = (colIdx * binW) + (binW / 2);
            } else {
                const targetPegCol = colIdx + 1;
                startX = (targetPegCol * pegSpacing) + (pegSpacing / 2);
            }

            const ballRadius = width * PHYSICS_CONFIG.BALL_RADIUS_RATIO;
            const ball = Bodies.circle(startX, -20, ballRadius, {
                restitution: isFireBall ? 0.0 : PHYSICS_CONFIG.BALL_RESTITUTION,
                friction: isFireBall ? 0 : PHYSICS_CONFIG.BALL_FRICTION,
                frictionAir: isFireBall ? 0.07 : PHYSICS_CONFIG.BALL_FRICTION_AIR,
                density: PHYSICS_CONFIG.BALL_DENSITY,
                // All bodies render transparent — premium drawing is in afterRender
                render: {
                    fillStyle: 'rgba(0,0,0,0)',
                    strokeStyle: 'rgba(0,0,0,0)',
                    lineWidth: 0
                },
                label: isFireBall ? 'fireball' : 'player-ball',
                isSensor: isFireBall,
                customLevel: level,
                targetColIdx: colIdx,
                customWinStreak: winStreak,
                customGameMode: gameMode
            });

            if (!isFireBall) {
                const chaosMultiplier = Math.min(2.5, 1 + (level / 100));
                Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * PHYSICS_CONFIG.BALL_INITIAL_X_CHAOS * chaosMultiplier, y: 0 });
            } else {
                Matter.Body.setVelocity(ball, { x: 0, y: 5 });
            }

            Composite.add(engineRef.current.world, ball);
        }
    }));

    useEffect(() => {
        if (!sceneRef.current) return;

        const timer = setTimeout(() => {
            if (!sceneRef.current) return;

            const width = sceneRef.current.clientWidth;
            const height = sceneRef.current.clientHeight;

            const engine = Engine.create();
            engine.world.gravity.y = PHYSICS_CONFIG.GRAVITY_Y;
            engineRef.current = engine;

            const render = Render.create({
                element: sceneRef.current,
                engine: engine,
                options: {
                    width,
                    height,
                    wireframes: false,
                    background: 'transparent', // Canvas 2D cleared each frame; afterRender draws bg
                    pixelRatio: window.devicePixelRatio
                }
            });
            renderRef.current = render;

            // Walls (invisible — pure physics boundary)
            const wallRender = { fillStyle: 'rgba(0,0,0,0)', strokeStyle: 'rgba(0,0,0,0)', lineWidth: 0 };
            const wallThick = 60;
            const walls = [
                Bodies.rectangle(-wallThick / 2, height / 2, wallThick, height * 2,
                    { isStatic: true, label: 'wall-left', friction: 0, restitution: PHYSICS_CONFIG.WALL_RESTITUTION, render: wallRender }),
                Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height * 2,
                    { isStatic: true, label: 'wall-right', friction: 0, restitution: PHYSICS_CONFIG.WALL_RESTITUTION, render: wallRender }),
                Bodies.rectangle(width / 2, height + 25, width, 50,
                    { isStatic: true, label: 'floor', render: wallRender })
            ];
            Composite.add(engine.world, walls);

            // ── PEGS (transparent physics bodies — drawn in afterRender)
            const pegRadius = width * PHYSICS_CONFIG.PEG_RADIUS_RATIO;
            const pegRadiusSmall = width * PHYSICS_CONFIG.PEG_RADIUS_SMALL_RATIO;

            const startY = 25;
            const endY = height - 100;
            const ballDiameter = width * PHYSICS_CONFIG.BALL_RADIUS_RATIO * 2;
            const targetGapY = ballDiameter * PHYSICS_CONFIG.PEG_ROW_GAP_RATIO;
            const computedRows = Math.floor((endY - startY) / targetGapY) + 1;
            const rows = Math.max(PHYSICS_CONFIG.PEG_ROWS_MIN, Math.min(PHYSICS_CONFIG.PEG_ROWS_MAX, computedRows));
            const gapY = (endY - startY) / (rows - 1);

            const TOTAL_BINS = 5;
            const binW = width / TOTAL_BINS;
            const PEG_COLS = PHYSICS_CONFIG.PEG_COLS;
            const pegSpacing = width / PEG_COLS;

            const invisibleRender = { fillStyle: 'rgba(0,0,0,0)', strokeStyle: 'rgba(0,0,0,0)', lineWidth: 0 };

            for (let r = 0; r < rows; r++) {
                const isEven = (r % 2 === 0);
                if (isEven) {
                    for (let c = 0; c <= PEG_COLS; c++) {
                        const px = c * pegSpacing;
                        const peg = Bodies.circle(px, startY + (r * gapY), pegRadius, {
                            isStatic: true,
                            render: invisibleRender,
                            restitution: PHYSICS_CONFIG.PEG_RESTITUTION_LARGE,
                            label: 'peg'
                        });
                        Composite.add(engine.world, peg);
                    }
                } else {
                    for (let c = 0; c < PEG_COLS; c++) {
                        const px = (c * pegSpacing) + (pegSpacing / 2);
                        const peg = Bodies.circle(px, startY + (r * gapY), pegRadiusSmall, {
                            isStatic: true,
                            render: invisibleRender,
                            restitution: PHYSICS_CONFIG.PEG_RESTITUTION_SMALL,
                            label: 'peg'
                        });
                        Composite.add(engine.world, peg);
                    }
                }
            }

            // ── DIVIDERS / Funnels (transparent physics — drawn in afterRender)
            const funnelHeight = 90;
            const funnelRender = { fillStyle: 'rgba(0,0,0,0)', strokeStyle: 'rgba(0,0,0,0)', lineWidth: 0 };

            for (let i = 0; i < TOTAL_BINS; i++) {
                const x = i * binW;
                const internalOptions = {
                    isStatic: true,
                    friction: 0,
                    frictionStatic: 0,
                    render: funnelRender,
                    label: 'funnel-internal',
                    restitution: 0.5
                };

                Composite.add(engine.world, Bodies.trapezoid(x, height - 20, 40, funnelHeight, 1, internalOptions));
                if (i === 4) {
                    Composite.add(engine.world, Bodies.trapezoid(x + binW, height - 20, 40, funnelHeight, 1, internalOptions));
                }

                // Sensor (score trigger)
                const pipeX = x + binW / 2;
                const sensorHeight = 10;
                const sensorY = height - 20;
                const sensor = Bodies.rectangle(pipeX, sensorY, binW + 2, sensorHeight, {
                    isStatic: true,
                    isSensor: true,
                    label: `bin-${i}`,
                    render: { visible: false, fillStyle: 'rgba(255,0,0,0)' }
                });
                Composite.add(engine.world, sensor);
            }

            // ── COLLISION EVENTS
            Events.on(engine, 'collisionStart', (evt) => {
                evt.pairs.forEach(pair => {
                    const { bodyA, bodyB } = pair;

                    let ball = null;
                    let sensor = null;

                    if (bodyA.label === 'player-ball' || bodyA.label === 'fireball') ball = bodyA;
                    else if (bodyB.label === 'player-ball' || bodyB.label === 'fireball') ball = bodyB;

                    if (bodyA.label.startsWith('bin-')) sensor = bodyA;
                    else if (bodyB.label.startsWith('bin-')) sensor = bodyB;

                    const isFloor = bodyA.label === 'floor' || bodyB.label === 'floor';
                    const peg = (bodyA.label === 'peg' ? bodyA : (bodyB.label === 'peg' ? bodyB : null));

                    const isFunnel = bodyA.label.includes('funnel') || bodyB.label.includes('funnel');
                    if (isFunnel) return;

                    // Active bumper kick
                    if (ball && peg) {
                        const normal = Vector.normalise(Vector.sub(ball.position, peg.position));
                        let force = Vector.mult(normal, PHYSICS_CONFIG.PEG_ACTIVE_FORCE);

                        // Anti-victory vector (near-miss illusion)
                        if (ball.customLevel > 0 && ball.label !== 'fireball') {
                            const w = renderRef.current.options.width;
                            const bW = w / 5;
                            const targetCenter = (ball.targetColIdx * bW) + (bW / 2);
                            if (Math.abs(ball.position.x - targetCenter) < bW) {
                                const pushDir = ball.position.x > targetCenter ? 1 : -1;
                                let vectorForce = ball.customGameMode === 'SPINGO' ? 0.02 : 0.01;
                                if (ball.customWinStreak >= 3) {
                                    vectorForce = ball.customGameMode === 'SPINGO' ? 0.06 : 0.03;
                                }
                                force.x += pushDir * vectorForce;
                            }
                        }

                        Body.applyForce(ball, ball.position, force);

                        if (playHitRef.current && ball.label !== 'fireball') playHitRef.current();
                        if (vibrationLevel > 0 && navigator.vibrate) navigator.vibrate(15 * vibrationLevel);

                        // Light up the peg (visual feedback in afterRender)
                        litPegs.current.set(peg.id, { x: peg.position.x, y: peg.position.y, time: Date.now() });
                    }

                    // Wall kick
                    if (ball) {
                        const hitLeft  = (bodyA.label === 'wall-left'  || bodyB.label === 'wall-left');
                        const hitRight = (bodyA.label === 'wall-right' || bodyB.label === 'wall-right');
                        if (hitLeft)  Body.applyForce(ball, ball.position, { x:  PHYSICS_CONFIG.WALL_KICK_X, y: PHYSICS_CONFIG.WALL_KICK_Y });
                        if (hitRight) Body.applyForce(ball, ball.position, { x: -PHYSICS_CONFIG.WALL_KICK_X, y: PHYSICS_CONFIG.WALL_KICK_Y });
                    }

                    // Bin landing
                    if (ball && sensor) {
                        if (processedBalls.current.has(ball.id)) return;
                        processedBalls.current.add(ball.id);
                        const binIdx = parseInt(sensor.label.split('-')[1]);
                        if (onBallLandedRef.current) onBallLandedRef.current(binIdx, ball.label === 'fireball');
                        if (ball.label === 'fireball') {
                            if (vibrationLevel > 0 && navigator.vibrate) navigator.vibrate([100 * vibrationLevel, 50 * vibrationLevel, 100 * vibrationLevel]);
                            setShake(true);
                            setTimeout(() => setShake(false), 500);
                        }
                        setTimeout(() => { Composite.remove(engine.world, ball); }, 1000);
                    } else if (ball && isFloor) {
                        if (!ball.hasHitFloor) {
                            if (playHitRef.current && ball.label !== 'fireball') playHitRef.current();
                            if (vibrationLevel > 0 && navigator.vibrate) navigator.vibrate(10 * vibrationLevel);
                            ball.hasHitFloor = true;
                        }
                        if (!processedBalls.current.has(ball.id)) Composite.remove(engine.world, ball);
                    }
                });
            });

            // ── FIREBALL PARTICLE SYSTEM
            const particles = [];

            const emitParticles = (x, y) => {
                // Core fire
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: x + (Math.random() - 0.5) * 10,
                        y: y + (Math.random() - 0.5) * 10,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() * -3) - 1,
                        life: 1.0, decay: 0.05 + Math.random() * 0.05,
                        size: 6 + Math.random() * 6, type: 'core'
                    });
                }
                // Sparks
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x, y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 1.0, decay: 0.02 + Math.random() * 0.02,
                        size: 2 + Math.random() * 2, type: 'spark'
                    });
                }
                // Smoke
                if (Math.random() > 0.5) {
                    particles.push({
                        x: x + (Math.random() - 0.5) * 20, y,
                        vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random(),
                        life: 1.0, decay: 0.015,
                        size: 10 + Math.random() * 10, type: 'smoke'
                    });
                }
            };

            // ── AFTER RENDER — asset-driven visual pipeline
            // Order: background → dividers → pegs → balls → particles
            const GLOW_DURATION = 380;

            Events.on(render, 'afterRender', () => {
                const ctx = render.context;
                const bodies = Composite.allBodies(engine.world);
                const w = render.options.width;
                const h = render.options.height;
                const now = Date.now();

                const assets = assetsRef.current;
                const drawCentered = (image, x, y, width, height, alpha = 1) => {
                    if (!image?.complete || !image.naturalWidth) return;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
                    ctx.restore();
                };

                // Background is a single theme image, not a hard-coded canvas gradient.
                if (assets.background?.complete && assets.background.naturalWidth) {
                    ctx.drawImage(assets.background, 0, 0, w, h);
                }

                // ────────────────────────────────────────────────────────────
                // LAYER 1 — Gem Dividers (below pegs and ball)
                // ────────────────────────────────────────────────────────────
                bodies.forEach(body => {
                    if (body.label === 'funnel-internal') {
                        const minX = Math.min(...body.vertices.map(vertex => vertex.x));
                        const maxX = Math.max(...body.vertices.map(vertex => vertex.x));
                        const minY = Math.min(...body.vertices.map(vertex => vertex.y));
                        const maxY = Math.max(...body.vertices.map(vertex => vertex.y));
                        drawCentered(assets.divider, (minX + maxX) / 2, (minY + maxY) / 2, maxX - minX + 20, maxY - minY + 20);
                    }
                });

                // ────────────────────────────────────────────────────────────
                // LAYER 2 — Gold Pegs (with hit-glow state)
                // ────────────────────────────────────────────────────────────
                bodies.forEach(body => {
                    if (body.label !== 'peg') return;

                    const litData = litPegs.current.get(body.id);
                    let isLit = false;
                    let litAlpha = 0;

                    if (litData) {
                        const elapsed = now - litData.time;
                        if (elapsed < GLOW_DURATION) {
                            isLit = true;
                            litAlpha = 1 - (elapsed / GLOW_DURATION); // linear fade out
                        } else {
                            litPegs.current.delete(body.id);
                        }
                    }

                    const visualDiameter = body.circleRadius * 4;
                    drawCentered(assets.peg, body.position.x, body.position.y, visualDiameter, visualDiameter, isLit ? 1 : 0.9);
                });

                // Player balls use the active theme sprite.
                bodies.forEach(body => {
                    if (body.label !== 'player-ball' && body.label !== 'fireball') return;
                    const visualDiameter = body.circleRadius * 2.8;
                    drawCentered(assets.ball, body.position.x, body.position.y, visualDiameter, visualDiameter);
                });

                // Fireball keeps particle feedback, but its body remains the ball asset.
                bodies.forEach(body => {
                    if (body.label !== 'fireball') return;

                    emitParticles(body.position.x, body.position.y);

                    const fx = body.position.x;
                    const fy = body.position.y;
                    const gradient = ctx.createRadialGradient(fx, fy, 5, fx, fy, 45);
                    gradient.addColorStop(0,   'rgba(255,255,255,1)');
                    gradient.addColorStop(0.2, 'rgba(255,200,0,0.8)');
                    gradient.addColorStop(0.5, 'rgba(255,69,0,0.4)');
                    gradient.addColorStop(1,   'rgba(255,0,0,0)');
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(fx, fy, 45, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.globalCompositeOperation = 'source-over';
                });

                // ────────────────────────────────────────────────────────────
                // LAYER 5 — Particle trail (fireball comet tail)
                // ────────────────────────────────────────────────────────────
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= p.decay;
                    if (p.life <= 0) { particles.splice(i, 1); continue; }

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    if (p.type === 'core') {
                        const green = Math.floor(255 * p.life);
                        ctx.fillStyle = `rgba(255,${green},0,${p.life})`;
                    } else if (p.type === 'spark') {
                        ctx.fillStyle = `rgba(255,255,200,${p.life})`;
                    } else if (p.type === 'smoke') {
                        ctx.fillStyle = `rgba(50,50,50,${p.life * 0.5})`;
                    }
                    ctx.fill();
                }
            });

            Runner.run(Runner.create(), engine);
            Render.run(render);

        }, 100);

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
