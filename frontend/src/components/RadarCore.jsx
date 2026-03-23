import { useRef, useEffect, useState, useCallback } from 'react';

export default function RadarCore({ coins, selectedCoinId, onBubbleClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [bubblePositions, setBubblePositions] = useState([]);
  const sweepAngleRef = useRef(0);
  const timeRef = useRef(0);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Calculate bubble positions
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const maxRadius = Math.min(cx, cy) * 0.78;

    const positions = coins.map((coin) => {
      const distance = maxRadius * (1 - coin.hypeScore / 120);
      const angleRad = (coin.angle * Math.PI) / 180;
      const x = cx + distance * Math.cos(angleRad);
      const y = cy + distance * Math.sin(angleRad);
      const size = 36 + (coin.hypeScore / 100) * 36;
      return { ...coin, x, y, size };
    });
    setBubblePositions(positions);
  }, [coins, dimensions]);

  // Canvas radar drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width || !dimensions.height) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const maxRadius = Math.min(cx, cy) * 0.85;

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw concentric circles
      for (let i = 1; i <= 5; i++) {
        const r = (maxRadius / 5) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.04 + i * 0.01})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw cross lines
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.04)';
      ctx.lineWidth = 1;
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxRadius * Math.cos(rad), cy + maxRadius * Math.sin(rad));
        ctx.stroke();
      }

      // Radar sweep
      sweepAngleRef.current = (sweepAngleRef.current + 0.8) % 360;
      const sweepRad = (sweepAngleRef.current * Math.PI) / 180;

      // Sweep gradient trail
      const trailAngle = 40;
      const startAngle = sweepRad - (trailAngle * Math.PI) / 180;

      const gradient = ctx.createConicGradient(startAngle, cx, cy);
      gradient.addColorStop(0, 'rgba(0, 255, 136, 0)');
      gradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.06)');
      gradient.addColorStop(1, 'rgba(0, 255, 136, 0.15)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, startAngle, sweepRad);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxRadius * Math.cos(sweepRad), cy + maxRadius * Math.sin(sweepRad));
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
      ctx.fill();

      // Glow rings when sweep passes bubbles
      timeRef.current += 0.016;
      bubblePositions.forEach(bubble => {
        const bubbleAngle = Math.atan2(bubble.y - cy, bubble.x - cx);
        let angleDiff = sweepRad - bubbleAngle;
        if (angleDiff < 0) angleDiff += Math.PI * 2;
        if (angleDiff > Math.PI * 2) angleDiff -= Math.PI * 2;

        if (angleDiff < 0.15 && angleDiff > 0) {
          const glowRadius = bubble.size / 2 + 8;
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, glowRadius, 0, Math.PI * 2);
          const color = bubble.sentiment === 'positive' ? '0, 255, 136' :
                        bubble.sentiment === 'negative' ? '255, 51, 102' : '255, 204, 0';
          ctx.strokeStyle = `rgba(${color}, ${0.6 - angleDiff * 4})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, bubblePositions]);

  return (
    <div className="radar-container" ref={containerRef}>
      <canvas className="radar-canvas" ref={canvasRef} />
      <div className="radar-bubbles">
        {bubblePositions.map((bubble) => {
          const floatOffset = Math.sin(Date.now() / 2000 + bubble.angle) * 3;
          return (
            <div
              key={bubble.id}
              id={`radar-bubble-${bubble.symbol}`}
              className={`coin-bubble ${bubble.sentiment} ${selectedCoinId === bubble.id ? 'selected' : ''}`}
              style={{
                left: bubble.x - bubble.size / 2,
                top: bubble.y - bubble.size / 2 + floatOffset,
                width: bubble.size,
                height: bubble.size,
                animation: `breathe ${2.5 + Math.random()}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
              onClick={() => onBubbleClick(bubble.id)}
            >
              <span className="bubble-emoji">{bubble.emoji}</span>
              <span className="bubble-symbol">{bubble.symbol}</span>
              <span className="bubble-score">{bubble.hypeScore}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
