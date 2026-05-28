import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FruitNinjaGameProps {
  onClose: () => void;
  isDark: boolean;
}

function drawVectorShape(ctx: CanvasRenderingContext2D, typeIdx: number, cx: number, cy: number, radius: number, isDark: boolean) {
  ctx.save();
  ctx.translate(cx, cy);

  if (typeIdx === 0) { // Stator
    // Base ring
    ctx.fillStyle = isDark ? '#475569' : '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner cutout
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Copper coils (highly detailed)
    ctx.fillStyle = '#b45309'; // bronze/amber coils
    const numCoils = 12;
    for (let i = 0; i < numCoils; i++) {
        const angle = (i / numCoils) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        // Shape of coil segment
        ctx.moveTo(radius * 0.65, radius * 0.12);
        ctx.lineTo(radius * 0.95, radius * 0.16);
        ctx.lineTo(radius * 0.95, -radius * 0.16);
        ctx.lineTo(radius * 0.65, -radius * 0.12);
        ctx.fill();
        
        ctx.strokeStyle = '#d97706'; // copper highlight
        ctx.lineWidth = radius * 0.02;
        
        // Wrap lines
        for(let j=1; j<=4; j++){
           let xPos = radius * 0.65 + (radius * 0.3 * j / 5);
           ctx.beginPath();
           ctx.moveTo(xPos, radius * 0.13);
           ctx.lineTo(xPos, -radius * 0.13);
           ctx.stroke();
        }

        ctx.restore();
    }
    
    // Outer casing rim
    ctx.lineWidth = radius * 0.05;
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    
    // Bolt holes
    ctx.fillStyle = '#334155';
    for (let i = 0; i < 4; i++) {
       const angle = (i / 4) * Math.PI * 2 + Math.PI/4;
       ctx.beginPath();
       ctx.arc(Math.cos(angle)*radius*0.85, Math.sin(angle)*radius*0.85, radius*0.06, 0, Math.PI*2);
       ctx.fill();
    }
  } else if (typeIdx === 1) { // Wheel (Straight blades)
    ctx.fillStyle = '#94a3b8'; // Back plate
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring edge
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = radius * 0.04;
    ctx.beginPath();
    ctx.arc(0, 0, radius*0.98, 0, Math.PI*2);
    ctx.stroke();
    
    // Straight Blades
    ctx.fillStyle = '#e2e8f0'; 
    for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        ctx.beginPath();
        ctx.moveTo(radius * 0.1, -radius * 0.08);
        ctx.lineTo(radius * 0.95, -radius * 0.08);
        ctx.lineTo(radius * 0.95, radius * 0.08);
        ctx.lineTo(radius * 0.1, radius * 0.08);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = radius * 0.02;
        ctx.stroke();
        ctx.restore();
    }
    
    // Center hub cone
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bolt in center
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    // hex shape
    for(let i=0; i<6; i++) {
        const a = i * Math.PI / 3;
        const x = Math.cos(a) * radius * 0.12;
        const y = Math.sin(a) * radius * 0.12;
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (typeIdx === 2) { // Impeller
    ctx.fillStyle = '#94a3b8'; // Back plate
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring edge
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = radius * 0.04;
    ctx.beginPath();
    ctx.arc(0, 0, radius*0.98, 0, Math.PI*2);
    ctx.stroke();
    
    // Blades
    ctx.fillStyle = '#e2e8f0'; 
    for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(radius * 0.4, radius * 0.6, radius * 0.95, radius * 0.1);
        ctx.quadraticCurveTo(radius * 0.5, radius * 0.2, 0, 0);
        ctx.fill();
        
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = radius * 0.02;
        ctx.stroke();
        ctx.restore();
    }
    
    // Center hub cone
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bolt in center
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    // hex shape
    for(let i=0; i<6; i++) {
        const a = i * Math.PI / 3;
        const x = Math.cos(a) * radius * 0.12;
        const y = Math.sin(a) * radius * 0.12;
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

const QUESTIONS = [
  { text: "Сколько будет 5 + 7?", options: ["10", "11", "12", "13"], correct: "12" },
  { text: "Вычислите 15 - 8", options: ["6", "7", "8", "9"], correct: "7" },
  { text: "Чему равно 6 * 4?", options: ["20", "22", "24", "26"], correct: "24" }
];

interface Circle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  text: string;
  sliced: boolean;
  imageIdx: number;
  isCorrect: boolean;
  rotation: number;
  vRot: number;
  sliceAngle?: number;
  sliceProgress?: number;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}


export default function FruitNinjaGame({ onClose, isDark }: FruitNinjaGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [circles, setCircles] = useState<Circle[]>([]);
  const circlesRef = useRef<Circle[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const [pointerTrail, setPointerTrail] = useState<{x: number, y: number}[]>([]);
  const pointerTrailRef = useRef<{x: number, y: number}[]>([]);
  const isSlicing = useRef(false);
  const pointerDown = useRef(false);
  const [isDone, setIsDone] = useState(false);
  const [canSlice, setCanSlice] = useState(true);

  // Initialize circles for a question
  useEffect(() => {
    if (isDone || !containerRef.current) return;
    
    // setTimeout to ensure dimensions are ready if it just mounted
    const init = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      
      if (w === 0 || h === 0) {
        setTimeout(init, 50);
        return;
      }
      
      const r = Math.min(w, h) * 0.12 * 0.8; // Circle radius decreased by 20%
      
      const currentQ = QUESTIONS[currentQuestionIdx];
      if (!currentQ) return;
      
      const gravity = Math.max(h * 1.5, 800) * 0.64;
      
      const newCircles: Circle[] = currentQ.options.map((opt, i) => {
        // Base X to distribute somewhat across the screen, with slight random offset
        const xOffset = w * 0.6 / (currentQ.options.length - 1 || 1);
        const baseX = w * 0.2 + (i * xOffset);
        let x = baseX + (Math.random() - 0.5) * (xOffset * 0.3);
        x = Math.max(r, Math.min(w - r, x)); // keep within bounds

        // Start them at varied depths below the screen so they appear sequentially and chaotically
        const startYDepth = Math.random() * (h * 0.5); 
        
        // Target peak height (randomized between 15% and 25% from top)
        const peakHeightTop = h * 0.15 + (Math.random() * h * 0.1);
        const distanceToPeak = (h + r + 10 + startYDepth) - peakHeightTop;

        return {
          id: `c-${i}`,
          x,
          y: h + r + 10 + startYDepth, // start below bottom at different depths
          vx: (Math.random() - 0.5) * (w * 0.1), // Predominantly vertical trajectory
          vy: -Math.sqrt(2 * gravity * distanceToPeak), // Calculate velocity to reach target peak
          radius: r,
          text: opt,
          sliced: false,
          imageIdx: i % 3,
          isCorrect: opt === currentQ.correct,
          rotation: Math.random() * Math.PI * 2,
          vRot: 2 + Math.random() * 3, // initial speed 2-5 radians per second
        };
      });
      circlesRef.current = newCircles;
      setCanSlice(true);
    };
    init();
  }, [currentQuestionIdx, isDone]);

  // Main game loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const loop = (time: number) => {
      if (!containerRef.current || !canvasRef.current) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      // limit max dt to avoid jumps if tab was inactive, reduce speed by 15%
      const dt = Math.min((time - lastTime) / 1000, 0.1) * 0.85;
      lastTime = time;
      
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const gravity = Math.max(h * 1.5, 800) * 0.64; // Gravity in px/sec^2
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      
      // Update Physics
      const currentCircles = circlesRef.current;
      let allFallen = true;
      let anyNotSliced = false;
      
      for (let i = 0; i < currentCircles.length; i++) {
        const c = currentCircles[i];
        
        c.vy += gravity * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rotation += c.vRot * dt;
        c.vRot *= Math.max(0.1, 1 - 0.4 * dt); // damp angular velocity
        
        if (!c.sliced) {
          anyNotSliced = true;
          // Walls
          if (c.x < c.radius) { c.x = c.radius; c.vx = Math.abs(c.vx); }
          if (c.x > w - c.radius) { c.x = w - c.radius; c.vx = -Math.abs(c.vx); }
          
          if (c.y <= h + c.radius) {
            allFallen = false;
          } else {
            // Wait at bottom
            c.y = h + c.radius + 5;
            c.vy = 0;
            c.vx = 0;
          }
        } else {
          // Sliced parts separate slowly
          c.sliceProgress = (c.sliceProgress || 0) + dt * 2;
        }
      }

      // Throw all together if they have all fallen
      if (allFallen && anyNotSliced) {
        currentCircles.forEach(c => {
          if (!c.sliced) {
            const peakHeightTop = h * 0.15 + (Math.random() * h * 0.25);
            const distanceToPeak = (h + c.radius) - peakHeightTop;
            c.vy = -Math.sqrt(2 * gravity * distanceToPeak);
            c.vx = (Math.random() - 0.5) * (w * 0.1);
            c.vRot = 2 + Math.random() * 3;
          }
        });
      }
      
      // Circle collisions
      for (let i = 0; i < currentCircles.length; i++) {
        for (let j = i + 1; j < currentCircles.length; j++) {
          const c1 = currentCircles[i];
          const c2 = currentCircles[j];
          if (c1.sliced || c2.sliced) continue;
          
          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = c1.radius + c2.radius;
          
          if (dist < minDist) {
            // Collision resolution
            const angle = Math.atan2(dy, dx);
            const moveDist = (minDist - dist) / 2;
            c1.x -= Math.cos(angle) * moveDist;
            c1.y -= Math.sin(angle) * moveDist;
            c2.x += Math.cos(angle) * moveDist;
            c2.y += Math.sin(angle) * moveDist;
            
            // Simple velocity exchange along normal with slight dampening for less explosive chaos
            const nx = dx / dist;
            const ny = dy / dist;
            const p = 1.5 * (c1.vx * nx + c1.vy * ny - c2.vx * nx - c2.vy * ny) / 2;
            c1.vx -= p * nx;
            c1.vy -= p * ny;
            c2.vx += p * nx;
            c2.vy += p * ny;
          }
        }
      }
      
      // Update Sparks
      const currentSparks = sparksRef.current;
      for (let i = currentSparks.length - 1; i >= 0; i--) {
        const s = currentSparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += gravity * 0.5 * dt; // less gravity for sparks
        s.life -= dt;
        if (s.life < 0) {
          currentSparks.splice(i, 1);
        }
      }
      
      // Update trail
      const trail = pointerTrailRef.current;
      if (!pointerDown.current && trail.length > 0) {
         trail.shift();
         if (trail.length > 0) trail.shift(); // fade out faster
      }
      
      // Draw everything
      ctx.clearRect(0, 0, w, h);
      
      // Draw circles
      currentCircles.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.translate(-c.x, -c.y);
        
        if (!c.sliced) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
          ctx.clip();
          
          drawVectorShape(ctx, c.imageIdx, c.x, c.y, c.radius, isDark);
          
          ctx.restore();
          
          // outline
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
          ctx.lineWidth = 4;
          ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
          ctx.stroke();
          
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(-c.rotation);
          ctx.translate(-c.x, -c.y);
          
          // Text styling with shadow for readability
          ctx.font = `bold ${Math.floor(c.radius * 0.5)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw a subtle dark semi-transparent band behind the text so it's readable over images
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';

          ctx.fillText(c.text, c.x, c.y);
          
          ctx.restore();
  
        } else {
          // Draw sliced
          const splitDist = (c.sliceProgress || 0) * 50;
          const angle = c.sliceAngle || 0;
          const dx = Math.cos(angle + Math.PI/2) * splitDist;
          const dy = Math.sin(angle + Math.PI/2) * splitDist;
          
          ctx.save();
          
          // Half 1
          ctx.beginPath();
          ctx.arc(c.x - dx, c.y - dy, c.radius, angle, angle + Math.PI);
          ctx.save();
          ctx.clip();
          drawVectorShape(ctx, c.imageIdx, c.x - dx, c.y - dy, c.radius, isDark);
          ctx.restore();

          ctx.lineWidth = 4;
          ctx.strokeStyle = c.isCorrect ? '#22c55e' : '#ef4444'; // Green if correct, red if incorrect
          ctx.stroke();
          
          // Text half 1
          ctx.save();
          ctx.rect(c.x - dx - c.radius, c.y - dy - c.radius, c.radius * 2, c.radius * 2);
          ctx.clip();
          ctx.translate(-dx, -dy);
          
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(-c.rotation);
          ctx.translate(-c.x, -c.y);
          
          // Text styling with shadow for readability
          ctx.font = `bold ${Math.floor(c.radius * 0.5)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw a subtle dark semi-transparent band behind the text so it's readable over images
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';

          ctx.fillText(c.text, c.x, c.y);
  
          ctx.restore();
          ctx.restore();
          
          // Half 2
          ctx.beginPath();
          ctx.arc(c.x + dx, c.y + dy, c.radius, angle + Math.PI, angle + Math.PI * 2);
          ctx.save();
          ctx.clip();
          drawVectorShape(ctx, c.imageIdx, c.x + dx, c.y + dy, c.radius, isDark);
          ctx.restore();

          ctx.lineWidth = 4;
          ctx.strokeStyle = c.isCorrect ? '#22c55e' : '#ef4444'; // Green if correct, red if incorrect
          ctx.stroke();
          
          // Text half 2
          ctx.save();
          ctx.rect(c.x + dx - c.radius, c.y + dy - c.radius, c.radius * 2, c.radius * 2);
          ctx.clip();
          ctx.translate(dx, dy);
          
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(-c.rotation);
          ctx.translate(-c.x, -c.y);
          
          // Text styling with shadow for readability
          ctx.font = `bold ${Math.floor(c.radius * 0.5)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw a subtle dark semi-transparent band behind the text so it's readable over images
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';

          ctx.fillText(c.text, c.x, c.y);
  
          ctx.restore();
          ctx.restore();
          
          ctx.restore();
        }
        
        ctx.restore(); // Restore rotation transform
      });
      
      // Draw sparks
      currentSparks.forEach(s => {
        ctx.beginPath();
        const a = Math.max(0, s.life * 2); // fade out
        ctx.fillStyle = `rgba(252, 211, 77, ${a})`; // yellowish sparks
        ctx.arc(s.x, s.y, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw trail
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for(let i=1; i<trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.5)" : "rgba(100, 116, 139, 0.3)";
        ctx.stroke();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = isDark ? "rgba(226, 232, 240, 1)" : "rgba(30, 41, 59, 1)"; // graphite color (slate-800)
        ctx.stroke();
      }
      
      // Check for slicing
      if (canSlice && trail.length >= 2) {
        const last = trail[trail.length - 1];
        const prev = trail[trail.length - 2];
        
        currentCircles.forEach((c) => {
          if (c.sliced) return;
          
          // check line intersection with circle
          const dist = distToSegment(c, prev, last);
          if (dist < c.radius) {
            // Slice it!
            setCanSlice(false);
            
            const currentQ = QUESTIONS[currentQuestionIdx];
            if (c.text === currentQ.correct) {
              setCorrectCount(prev => prev + 1);
            }

            c.sliced = true;
            c.vy = -10; // pop up slightly when sliced
            c.sliceAngle = Math.atan2(last.y - prev.y, last.x - prev.x);
            c.sliceProgress = 0;
            
            // Generate sparks
            for(let i=0; i<30; i++) {
              currentSparks.push({
                id: Math.random(),
                x: c.x + (Math.random() - 0.5) * c.radius,
                y: c.y + (Math.random() - 0.5) * c.radius,
                vx: (Math.random() - 0.5) * 800 + (last.x - prev.x) * 10,
                vy: (Math.random() - 0.5) * 800 + (last.y - prev.y) * 10,
                life: 0.5 + Math.random() * 0.5,
                color: ''
              });
            }
            
            // Advance to next question after delay
            setTimeout(() => {
              if (currentQuestionIdx < QUESTIONS.length - 1) {
                setCurrentQuestionIdx(idx => idx + 1);
              } else {
                setIsDone(true);
              }
            }, 1500);
          }
        });
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };
    
    animationFrameId = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentQuestionIdx, isDone, canSlice, isDark]);
  
  // Helpers for line segment distance
  const distToSegmentSquared = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
    const l2 = (w.x - v.x)*(w.x - v.x) + (w.y - v.y)*(w.y - v.y);
    if (l2 === 0) return (p.x - v.x)*(p.x - v.x) + (p.y - v.y)*(p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return (p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2;
  }
  const distToSegment = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
    return Math.sqrt(distToSegmentSquared(p, v, w));
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDown.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      pointerTrailRef.current = [{x: e.clientX - rect.left, y: e.clientY - rect.top}];
    }
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      pointerTrailRef.current.push({x: e.clientX - rect.left, y: e.clientY - rect.top});
      if (pointerTrailRef.current.length > 20) {
        pointerTrailRef.current.shift();
      }
    }
  };
  
  const handlePointerUp = () => {
    pointerDown.current = false;
  };

  if (isDone) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(248,250,252,0.95)' }}>
        <div className="text-center w-full max-w-sm">
          <h2 className={`text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Итоги игры</h2>
          
          <div className={`p-8 rounded-[2.5rem] mt-8 mb-8 border backdrop-blur-md relative overflow-hidden group
            ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-sm uppercase tracking-widest font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Верных ответов</p>
            <div className={`text-8xl font-black mb-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              <span className="text-6xl">{correctCount}</span>
              <span className={`text-2xl text-slate-500 ml-1`}>/ {QUESTIONS.length}</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-[0.98] transition-all
              ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10 shadow-black/20' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-200'}`}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 z-50 overflow-hidden" 
      style={{ 
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        touchAction: 'none'
      }}
    >
      <div className="absolute top-8 left-0 right-0 flex justify-center px-4 pointer-events-none z-10">
         <div className={`p-4 rounded-xl max-w-lg w-full text-center shadow-lg border backdrop-blur-sm
           ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'} block mb-2`}>
              Вопрос {currentQuestionIdx + 1} из {QUESTIONS.length}
            </span>
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {QUESTIONS[currentQuestionIdx]?.text}
            </h2>
         </div>
      </div>
      
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/20 flex items-center justify-center z-20 text-white backdrop-blur-md"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div 
        ref={containerRef} 
        className="w-full h-full cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block touch-none"
        />
      </div>
    </div>
  );
}
