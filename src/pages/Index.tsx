import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';


interface Position {
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

const Index = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'settings' | 'gameover'>('menu');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 50, y: 80 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [explosion, setExplosion] = useState<Position | null>(null);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.key));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key);
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

  // Player movement
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const movePlayer = () => {
      setPlayerPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        if (keys.has('ArrowLeft') || keys.has('a')) newX = Math.max(0, newX - 2);
        if (keys.has('ArrowRight') || keys.has('d')) newX = Math.min(100, newX + 2);
        if (keys.has('ArrowUp') || keys.has('w')) newY = Math.max(0, newY - 2);
        if (keys.has('ArrowDown') || keys.has('s')) newY = Math.min(100, newY + 2);
        
        return { x: newX, y: newY };
      });
    };
    
    const interval = setInterval(movePlayer, 16);
    return () => clearInterval(interval);
  }, [keys, gameState]);

  // Enemy spawning and movement
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const spawnEnemy = () => {
      const newEnemy: Enemy = {
        id: Date.now(),
        x: Math.random() * 100,
        y: -5,
        dx: (Math.random() - 0.5) * 1,
        dy: 0.5 + Math.random() * 0.5
      };
      setEnemies(prev => [...prev, newEnemy]);
    };
    
    const spawnInterval = setInterval(spawnEnemy, 2000 / gameSpeed);
    
    const moveEnemies = () => {
      setEnemies(prev => prev
        .map(enemy => ({
          ...enemy,
          x: enemy.x + enemy.dx * gameSpeed,
          y: enemy.y + enemy.dy * gameSpeed
        }))
        .filter(enemy => enemy.y < 110)
      );
    };
    
    const moveInterval = setInterval(moveEnemies, 16);
    
    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [gameState, gameSpeed]);

  // Collision detection
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const checkCollisions = () => {
      enemies.forEach(enemy => {
        const distance = Math.sqrt(
          Math.pow(enemy.x - playerPos.x, 2) + Math.pow(enemy.y - playerPos.y, 2)
        );
        
        if (distance < 5) {
          setExplosion({ x: playerPos.x, y: playerPos.y });
          setGameState('gameover');
          setTimeout(() => setExplosion(null), 1000);
        }
      });
    };
    
    const interval = setInterval(checkCollisions, 16);
    return () => clearInterval(interval);
  }, [enemies, playerPos, gameState]);

  // Score update
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setScore(prev => prev + 1);
    }, 100);
    
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setPlayerPos({ x: 50, y: 80 });
    setEnemies([]);
    setScore(0);
    setExplosion(null);
  };

  const resetGame = () => {
    setGameState('menu');
    setEnemies([]);
    setExplosion(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono game-bg">
      
      {/* Game Canvas */}
      <div className="relative w-full h-screen overflow-hidden">
        
        {/* Stars Background */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white opacity-70 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Game Area */}
        {gameState === 'playing' && (
          <>
            {/* Player Aircraft */}
            <div
              className="absolute w-8 h-8 transition-all duration-75 z-10"
              style={{
                left: `${playerPos.x}%`,
                top: `${playerPos.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-full h-full bg-blue-500 relative pixel-plane">
                <div className="absolute top-0 left-1/2 w-2 h-6 bg-blue-400 transform -translate-x-1/2"></div>
                <div className="absolute top-2 left-0 w-8 h-2 bg-blue-600"></div>
                <div className="absolute bottom-1 left-1 w-6 h-1 bg-red-500"></div>
              </div>
            </div>

            {/* Enemy Aircraft */}
            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className="absolute w-6 h-6 z-5"
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-full h-full bg-red-500 relative pixel-enemy">
                  <div className="absolute top-0 left-1/2 w-1 h-4 bg-red-400 transform -translate-x-1/2"></div>
                  <div className="absolute top-1 left-0 w-6 h-2 bg-red-600"></div>
                  <div className="absolute bottom-0 left-1 w-4 h-1 bg-yellow-500"></div>
                </div>
              </div>
            ))}

            {/* Explosion Effect */}
            {explosion && (
              <div
                className="absolute w-16 h-16 z-20 animate-ping"
                style={{
                  left: `${explosion.x}%`,
                  top: `${explosion.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-full h-full bg-red-500 rounded-full opacity-80"></div>
                <div className="absolute top-2 left-2 w-12 h-12 bg-yellow-500 rounded-full opacity-60"></div>
                <div className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full opacity-40"></div>
              </div>
            )}

            {/* HUD */}
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-black bg-opacity-80 p-4 border-2 border-red-500 pixel-border">
                <div className="text-xl text-red-400 mb-2">СЧЁТ: {score}</div>
                <div className="text-sm text-blue-400">СКОРОСТЬ: {gameSpeed.toFixed(1)}x</div>
                <div className="text-xs text-gray-400 mt-2">WASD / Стрелки</div>
              </div>
            </div>
          </>
        )}

        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center z-40">
            <Card className="bg-black border-4 border-red-500 p-8 text-center pixel-border">
              <h1 className="text-6xl font-bold text-red-500 mb-4 pixel-title">
                АВИА СИМУЛЯТОР
              </h1>
              <p className="text-xl text-blue-400 mb-8">Уклоняйся от врагов!</p>
              
              <div className="space-y-4">
                <Button 
                  onClick={startGame}
                  className="w-full bg-red-600 hover:bg-red-700 border-2 border-red-400 text-white text-xl py-3 pixel-btn"
                >
                  НАЧАТЬ ИГРУ
                </Button>
                
                <Button 
                  onClick={() => setGameState('settings')}
                  className="w-full bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 text-white text-lg py-2 pixel-btn"
                >
                  НАСТРОЙКИ
                </Button>
              </div>
              
              <div className="mt-8 text-xs text-gray-500">
                Управление: WASD или стрелки
              </div>
            </Card>
          </div>
        )}

        {/* Settings Screen */}
        {gameState === 'settings' && (
          <div className="absolute inset-0 flex items-center justify-center z-40">
            <Card className="bg-black border-4 border-blue-500 p-8 pixel-border max-w-md">
              <h2 className="text-4xl font-bold text-blue-400 mb-6 text-center pixel-title">
                НАСТРОЙКИ
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-yellow-400 text-lg">Скорость игры:</label>
                  <Slider
                    value={[gameSpeed]}
                    onValueChange={([value]) => setGameSpeed(value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-right text-sm text-gray-400">{gameSpeed.toFixed(1)}x</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-yellow-400 text-lg">Звук:</label>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => setGameState('menu')}
                className="w-full mt-8 bg-green-600 hover:bg-green-700 border-2 border-green-400 text-white text-lg py-2 pixel-btn"
              >
                НАЗАД
              </Button>
            </Card>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center z-40">
            <Card className="bg-black border-4 border-red-600 p-8 text-center pixel-border">
              <h2 className="text-5xl font-bold text-red-500 mb-4 pixel-title animate-pulse">
                ВЗРЫВ!
              </h2>
              <p className="text-2xl text-yellow-400 mb-2">Финальный счёт:</p>
              <p className="text-4xl text-blue-400 mb-8 font-bold">{score}</p>
              
              <div className="space-y-4">
                <Button 
                  onClick={startGame}
                  className="w-full bg-red-600 hover:bg-red-700 border-2 border-red-400 text-white text-xl py-3 pixel-btn"
                >
                  ИГРАТЬ СНОВА
                </Button>
                
                <Button 
                  onClick={resetGame}
                  className="w-full bg-gray-600 hover:bg-gray-700 border-2 border-gray-400 text-white text-lg py-2 pixel-btn"
                >
                  В МЕНЮ
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>


    </div>
  );
};

export default Index;