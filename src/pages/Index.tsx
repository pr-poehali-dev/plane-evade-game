import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CarPosition {
  x: number;
  y: number;
  angle: number;
  speed: number;
  velocity: { x: number; y: number };
}

interface RaceTrack {
  segments: { x1: number; y1: number; x2: number; y2: number }[];
}

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'racing' | 'paused'>('menu');
  const [car, setCar] = useState<CarPosition>({
    x: 400,
    y: 500,
    angle: 0,
    speed: 0,
    velocity: { x: 0, y: 0 }
  });
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [lapTime, setLapTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);

  // Track definition - simple oval for now
  const track: RaceTrack = {
    segments: [
      // Outer track boundaries
      { x1: 100, y1: 100, x2: 700, y2: 100 }, // top
      { x1: 700, y1: 100, x2: 700, y2: 500 }, // right
      { x1: 700, y1: 500, x2: 100, y2: 500 }, // bottom
      { x1: 100, y1: 500, x2: 100, y2: 100 }, // left
      // Inner track boundaries
      { x1: 200, y1: 200, x2: 600, y2: 200 }, // inner top
      { x1: 600, y1: 200, x2: 600, y2: 400 }, // inner right
      { x1: 600, y1: 400, x2: 200, y2: 400 }, // inner bottom
      { x1: 200, y1: 400, x2: 200, y2: 200 }, // inner left
    ]
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.key.toLowerCase()));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Car physics and movement
  useEffect(() => {
    if (gameState !== 'racing') return;

    const updateCar = () => {
      setCar(prevCar => {
        let newSpeed = prevCar.speed;
        let newAngle = prevCar.angle;
        
        // Acceleration/Deceleration
        if (keys.has('w') || keys.has('arrowup')) {
          newSpeed = Math.min(newSpeed + 0.5, 8);
        } else if (keys.has('s') || keys.has('arrowdown')) {
          newSpeed = Math.max(newSpeed - 0.5, -4);
        } else {
          // Natural deceleration
          newSpeed *= 0.95;
          if (Math.abs(newSpeed) < 0.1) newSpeed = 0;
        }

        // Steering (only when moving)
        if (Math.abs(newSpeed) > 0.1) {
          if (keys.has('a') || keys.has('arrowleft')) {
            newAngle -= 0.08 * Math.abs(newSpeed) / 8;
          }
          if (keys.has('d') || keys.has('arrowright')) {
            newAngle += 0.08 * Math.abs(newSpeed) / 8;
          }
        }

        // Braking
        if (keys.has(' ')) {
          newSpeed *= 0.85;
        }

        // Calculate velocity based on angle and speed
        const newVelocity = {
          x: Math.cos(newAngle) * newSpeed,
          y: Math.sin(newAngle) * newSpeed
        };

        // Update position
        let newX = prevCar.x + newVelocity.x;
        let newY = prevCar.y + newVelocity.y;

        // Simple collision detection with canvas bounds
        if (newX < 50) newX = 50;
        if (newX > 750) newX = 750;
        if (newY < 50) newY = 50;
        if (newY > 550) newY = 550;

        return {
          x: newX,
          y: newY,
          angle: newAngle,
          speed: newSpeed,
          velocity: newVelocity
        };
      });
    };

    const interval = setInterval(updateCar, 16); // ~60fps
    return () => clearInterval(interval);
  }, [keys, gameState]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#2a5a2a'; // Grass green
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw track
      ctx.fillStyle = '#333333'; // Asphalt
      ctx.fillRect(100, 100, 600, 400);

      // Draw track inner hole
      ctx.fillStyle = '#2a5a2a';
      ctx.fillRect(200, 200, 400, 200);

      // Draw track markings
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      
      // Center line
      ctx.beginPath();
      ctx.rect(150, 150, 500, 300);
      ctx.stroke();

      // Draw start/finish line
      ctx.setLineDash([]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100, 300);
      ctx.lineTo(200, 300);
      ctx.stroke();

      // Draw car
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Car body
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(-20, -10, 40, 20);

      // Car details
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(-18, -8, 36, 4); // Top stripe
      ctx.fillRect(-18, 4, 36, 4);  // Bottom stripe

      // Windshield
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(15, -6, 4, 12);

      // Wheels
      ctx.fillStyle = '#222222';
      const wheelRotation = (car.speed * 0.5) % (Math.PI * 2);
      
      // Front wheels
      ctx.save();
      ctx.translate(12, -12);
      ctx.rotate(wheelRotation);
      ctx.fillRect(-3, -2, 6, 4);
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -2, 6, 4);
      ctx.restore();

      ctx.save();
      ctx.translate(12, 12);
      ctx.rotate(wheelRotation);
      ctx.fillRect(-3, -2, 6, 4);
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -2, 6, 4);
      ctx.restore();

      // Rear wheels
      ctx.save();
      ctx.translate(-12, -12);
      ctx.rotate(wheelRotation);
      ctx.fillRect(-3, -2, 6, 4);
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -2, 6, 4);
      ctx.restore();

      ctx.save();
      ctx.translate(-12, 12);
      ctx.rotate(wheelRotation);
      ctx.fillRect(-3, -2, 6, 4);
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -2, 6, 4);
      ctx.restore();

      // Car outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(-20, -10, 40, 20);

      ctx.restore();

      // Draw speed indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px monospace';
      ctx.fillText(`Скорость: ${Math.abs(car.speed * 20).toFixed(0)} км/ч`, 20, 40);
      
      if (gameState === 'racing') {
        ctx.fillText(`Время: ${(lapTime / 1000).toFixed(1)}с`, 20, 70);
      }

      if (bestTime !== null) {
        ctx.fillText(`Лучшее: ${(bestTime / 1000).toFixed(1)}с`, 20, 100);
      }
    };

    render();
  }, [car, gameState, lapTime, bestTime]);

  // Lap timer
  useEffect(() => {
    if (gameState !== 'racing') return;

    const interval = setInterval(() => {
      setLapTime(prev => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  const startRace = () => {
    setGameState('racing');
    setCar({
      x: 150,
      y: 300,
      angle: 0,
      speed: 0,
      velocity: { x: 0, y: 0 }
    });
    setLapTime(0);
  };

  const pauseRace = () => {
    setGameState('paused');
  };

  const resumeRace = () => {
    setGameState('racing');
  };

  const resetRace = () => {
    setGameState('menu');
    if (lapTime > 0 && (bestTime === null || lapTime < bestTime)) {
      setBestTime(lapTime);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono game-bg">
      <div className="relative">
        
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-yellow-500 pixel-border"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <Card className="bg-black border-4 border-red-500 p-8 text-center pixel-border">
              <h1 className="text-6xl font-bold text-red-500 mb-4 pixel-title">
                ПИКСЕЛЬ ГОНКИ
              </h1>
              <p className="text-xl text-yellow-400 mb-8">Гони по трассе с максимальной скоростью!</p>
              
              <div className="space-y-4 mb-6">
                <Button 
                  onClick={startRace}
                  className="w-full bg-green-600 hover:bg-green-700 border-2 border-green-400 text-white text-xl py-3 pixel-btn"
                >
                  СТАРТ ГОНКИ
                </Button>
              </div>
              
              <div className="text-sm text-gray-400 space-y-1">
                <div>WASD / Стрелки - управление</div>
                <div>Пробел - тормоз</div>
                <div>W/↑ - газ, S/↓ - назад</div>
                <div>A/← - влево, D/→ - вправо</div>
              </div>
              
              {bestTime && (
                <div className="mt-4 text-lg text-blue-400">
                  Лучшее время: {(bestTime / 1000).toFixed(1)}с
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <Card className="bg-black border-4 border-yellow-500 p-8 text-center pixel-border">
              <h2 className="text-4xl font-bold text-yellow-400 mb-6 pixel-title">
                ПАУЗА
              </h2>
              
              <div className="space-y-4">
                <Button 
                  onClick={resumeRace}
                  className="w-full bg-green-600 hover:bg-green-700 border-2 border-green-400 text-white text-lg py-2 pixel-btn"
                >
                  ПРОДОЛЖИТЬ
                </Button>
                
                <Button 
                  onClick={resetRace}
                  className="w-full bg-red-600 hover:bg-red-700 border-2 border-red-400 text-white text-lg py-2 pixel-btn"
                >
                  В МЕНЮ
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* In-game controls */}
        {gameState === 'racing' && (
          <div className="absolute top-4 right-4">
            <Button 
              onClick={pauseRace}
              className="bg-yellow-600 hover:bg-yellow-700 border-2 border-yellow-400 text-white pixel-btn"
            >
              ПАУЗА
            </Button>
          </div>
        )}

        {/* Track map mini-view */}
        {gameState === 'racing' && (
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-black bg-opacity-80 border-2 border-white">
            <div className="relative w-full h-full">
              {/* Mini track */}
              <div className="absolute inset-1 bg-gray-600"></div>
              <div className="absolute top-2 left-2 right-2 bottom-2 bg-green-800"></div>
              <div className="absolute" style={{
                left: `${(car.x / 800) * 100}%`,
                top: `${(car.y / 600) * 100}%`,
                width: '4px',
                height: '4px',
                backgroundColor: '#ff4444',
                transform: 'translate(-50%, -50%)'
              }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;