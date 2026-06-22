// Client-side 3D-shaded vector texture generator for Bingo Plinko Lucky Machine.
// Generates data URLs for Matter.js sprites on client startup.

export function getBallTexture(skin) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const r = 64; // radius
    const cx = 64;
    const cy = 64;

    if (skin === 'Beach') {
        // Beach Ball
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.clip();
        
        // Base white
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Red stripe
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, -Math.PI/3, 0);
        ctx.fill();

        // Blue stripe
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, Math.PI/3, Math.PI*2/3);
        ctx.fill();

        // Yellow stripe
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, -Math.PI, -Math.PI*2/3);
        ctx.fill();

        ctx.restore();
        
        // Add 3D shading layer
        const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.fill();

    } else if (skin === 'Pets') {
        // Yarn Ball
        ctx.save();
        // Base pink sphere
        const baseGrad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
        baseGrad.addColorStop(0, '#f472b6'); // Light pink
        baseGrad.addColorStop(0.8, '#db2777'); // Deep pink
        baseGrad.addColorStop(1, '#9d174d'); // Dark pink shadow
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw overlapping curved yarn threads
        ctx.strokeStyle = '#fbcfe8'; // Light pink highlight threads
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        // Draw curved lines
        for (let i = -r; i < r; i += 15) {
            ctx.beginPath();
            ctx.arc(cx + i/2, cy, r - Math.abs(i)/2 - 4, -Math.PI/2, Math.PI/2);
            ctx.stroke();
        }
        for (let i = -r; i < r; i += 15) {
            ctx.beginPath();
            ctx.arc(cx, cy + i/2, r - Math.abs(i)/2 - 4, 0, Math.PI);
            ctx.stroke();
        }
        ctx.restore();

    } else if (skin === 'Royal Bingo') {
        // Royal Ruby Ball with Golden Filigree
        ctx.save();
        // Ruby red base
        const baseGrad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
        baseGrad.addColorStop(0, '#f87171'); // Bright red
        baseGrad.addColorStop(0.7, '#b91c1c'); // Crimson red
        baseGrad.addColorStop(1, '#450a0a'); // Deep dark red
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.fill();

        // Golden center ring
        ctx.strokeStyle = '#fbbf24'; // Gold
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Specular highlight
        const shineGrad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, 2, cx - r*0.3, cy - r*0.3, r*0.5);
        shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.arc(cx - r*0.3, cy - r*0.3, r*0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

    } else {
        // Default / Normal: Glossy Orange Ball (Candy Crush / Slots style)
        ctx.save();
        const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
        grad.addColorStop(0, '#ffedd5'); // Specular highlight
        grad.addColorStop(0.3, '#f97316'); // Bright orange
        grad.addColorStop(0.8, '#ea580c'); // Mid orange
        grad.addColorStop(1, '#7c2d12'); // Shadow
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.fill();

        // Glass glint arc at top
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx - r*0.2, cy - r*0.4, r*0.4, r*0.2, -Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    return canvas.toDataURL();
}

export function getPegTexture(skin) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const r = 32;
    const cx = 32;
    const cy = 32;

    if (skin === 'Beach') {
        // Starfish Peg
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = '#f97316'; // Orange base
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        const numPoints = 5;
        const outerRadius = r - 4;
        const innerRadius = r * 0.4;
        for (let i = 0; i < numPoints * 2; i++) {
            const angle = (i * Math.PI) / numPoints - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw small yellow dots (bumps)
        ctx.fillStyle = '#fde047';
        for (let i = 0; i < numPoints; i++) {
            const angle = (i * Math.PI * 2) / numPoints - Math.PI / 2;
            const x = Math.cos(angle) * (outerRadius * 0.6);
            const y = Math.sin(angle) * (outerRadius * 0.6);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        // Center glow
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

    } else if (skin === 'Pets') {
        // Paw Print Peg
        ctx.save();
        ctx.fillStyle = '#ec4899'; // Pink paw
        
        // Main Pad
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4 Toe Pads
        ctx.beginPath();
        ctx.ellipse(cx - 10, cy - 4, 4.5, 6, -Math.PI/6, 0, Math.PI * 2); // left outer
        ctx.ellipse(cx - 4, cy - 9, 4.5, 6.5, -Math.PI/12, 0, Math.PI * 2); // left inner
        ctx.ellipse(cx + 4, cy - 9, 4.5, 6.5, Math.PI/12, 0, Math.PI * 2); // right inner
        ctx.ellipse(cx + 10, cy - 4, 4.5, 6, Math.PI/6, 0, Math.PI * 2); // right outer
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(cx - 2, cy + 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

    } else if (skin === 'Royal Bingo') {
        // Gold Crown Peg
        ctx.save();
        ctx.translate(cx, cy);
        
        const goldGrad = ctx.createLinearGradient(-15, -15, 15, 15);
        goldGrad.addColorStop(0, '#fbbf24'); // Yellow gold
        goldGrad.addColorStop(0.5, '#d97706'); // Orange gold
        goldGrad.addColorStop(1, '#78350f'); // Dark gold
        ctx.fillStyle = goldGrad;
        
        ctx.beginPath();
        ctx.moveTo(-18, 10);
        ctx.lineTo(-18, -4);
        ctx.lineTo(-10, 2);
        ctx.lineTo(0, -12); // center peak
        ctx.lineTo(10, 2);
        ctx.lineTo(18, -4);
        ctx.lineTo(18, 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-18, 8, 36, 4);

        // Jewels on crown peaks
        ctx.fillStyle = '#ef4444'; // Ruby red
        ctx.beginPath();
        ctx.arc(-18, -4, 3, 0, Math.PI * 2);
        ctx.arc(0, -12, 3, 0, Math.PI * 2);
        ctx.arc(18, -4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

    } else {
        // Default / Normal: Chrome ring with a glowing cyan center
        ctx.save();
        // Chrome rim
        const chromeGrad = ctx.createLinearGradient(0, 0, 64, 64);
        chromeGrad.addColorStop(0, '#ffffff');
        chromeGrad.addColorStop(0.4, '#94a3b8');
        chromeGrad.addColorStop(0.6, '#475569');
        chromeGrad.addColorStop(1, '#0f172a');
        
        ctx.lineWidth = 6;
        ctx.strokeStyle = chromeGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
        ctx.stroke();

        // Cyan glow core
        const glowGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r - 8);
        glowGrad.addColorStop(0, '#ffffff');
        glowGrad.addColorStop(0.2, '#22d3ee'); // Neon cyan
        glowGrad.addColorStop(0.8, '#0891b2');
        glowGrad.addColorStop(1, 'rgba(8, 145, 178, 0)');
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    return canvas.toDataURL();
}

export function getTriangleTexture(skin) {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    const w = 80;
    const h = 180;

    if (skin === 'Beach') {
        // Conch / Spiral Sea Shell Triangle Bumper
        ctx.save();
        const shellGrad = ctx.createLinearGradient(0, h, w, 0);
        shellGrad.addColorStop(0, '#fecdd3'); // Coral rose
        shellGrad.addColorStop(0.5, '#fda4af');
        shellGrad.addColorStop(1, '#fff1f2'); // Bright white tip
        ctx.fillStyle = shellGrad;

        ctx.beginPath();
        ctx.moveTo(w / 2, 10);
        ctx.quadraticCurveTo(w * 0.9, h * 0.7, w * 0.8, h - 10);
        ctx.lineTo(w * 0.2, h - 10);
        ctx.quadraticCurveTo(w * 0.1, h * 0.7, w / 2, 10);
        ctx.closePath();
        ctx.fill();

        // Shell rib details
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        for (let i = 1; i <= 5; i++) {
            const factor = i / 6;
            ctx.beginPath();
            ctx.moveTo(w / 2, 10);
            ctx.quadraticCurveTo(w * (0.5 + (factor - 0.5) * 0.8), h * (1 - factor), w * factor, h - 10);
            ctx.stroke();
        }
        ctx.restore();

    } else if (skin === 'Pets') {
        // Red Roof Dog House Triangle Bumper
        ctx.save();
        const woodGrad = ctx.createLinearGradient(0, h, w, 0);
        woodGrad.addColorStop(0, '#78350f');
        woodGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = woodGrad;
        ctx.beginPath();
        ctx.moveTo(15, h - 10);
        ctx.lineTo(15, h * 0.45);
        ctx.lineTo(w - 15, h * 0.45);
        ctx.lineTo(w - 15, h - 10);
        ctx.closePath();
        ctx.fill();

        // Red Roof
        const roofGrad = ctx.createLinearGradient(0, 0, w, h * 0.45);
        roofGrad.addColorStop(0, '#ef4444');
        roofGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(w / 2, 10);
        ctx.lineTo(w - 5, h * 0.5);
        ctx.lineTo(5, h * 0.5);
        ctx.closePath();
        ctx.fill();

        // Round black opening (door)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(w / 2, h - 20, 15, 0, Math.PI, true);
        ctx.lineTo(w / 2 + 15, h - 10);
        ctx.lineTo(w / 2 - 15, h - 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

    } else if (skin === 'Royal Bingo') {
        // Stack of Gold Bullion Bars
        ctx.save();
        const goldGrad = ctx.createLinearGradient(0, h, w, 0);
        goldGrad.addColorStop(0, '#f59e0b');
        goldGrad.addColorStop(0.5, '#fbbf24');
        goldGrad.addColorStop(1, '#fef3c7');

        ctx.fillStyle = goldGrad;
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;

        const drawBar = (bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.rect(bx, by, bw, bh);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.3;
            ctx.fillRect(bx + 2, by + 2, bw - 4, 3);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = goldGrad;
        };

        // Bottom row: 3 bars
        drawBar(5, h - 35, 22, 25);
        drawBar(29, h - 35, 22, 25);
        drawBar(53, h - 35, 22, 25);

        // Middle row: 2 bars
        drawBar(17, h - 75, 22, 25);
        drawBar(41, h - 75, 22, 25);

        // Top bar: 1 bar
        drawBar(29, h - 115, 22, 25);

        // Crown on top of the bars
        ctx.translate(w / 2, h - 140);
        ctx.fillStyle = goldGrad;
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-5, 4);
        ctx.lineTo(0, -6);
        ctx.lineTo(5, 4);
        ctx.lineTo(10, 0);
        ctx.lineTo(10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

    } else {
        // Default / Normal: Sleek metallic triangle with cyan glow lines
        ctx.save();
        const metallicGrad = ctx.createLinearGradient(0, h, w, 0);
        metallicGrad.addColorStop(0, '#334155');
        metallicGrad.addColorStop(0.5, '#64748b');
        metallicGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = metallicGrad;

        ctx.beginPath();
        ctx.moveTo(w / 2, 10);
        ctx.lineTo(w - 10, h - 10);
        ctx.lineTo(10, h - 10);
        ctx.closePath();
        ctx.fill();

        // Neon cyan glow stroke
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(w / 2, 25);
        ctx.lineTo(w - 20, h - 20);
        ctx.lineTo(20, h - 20);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    return canvas.toDataURL();
}
