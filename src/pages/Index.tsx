import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facingRight: boolean;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
  experienceToNext: number;
  attacking: boolean;
  casting: boolean;
  animationFrame: number;
  animationTimer: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: 'skeleton' | 'shadow';
  facingRight: boolean;
  ai: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'stone' | 'wood' | 'metal';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'inventory'>('menu');
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [keys, setKeys] = useState<Set<string>>(new Set());
  
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    onGround: false,
    facingRight: true,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    attacking: false,
    casting: false,
    animationFrame: 0,
    animationTimer: 0
  });

  const [enemies, setEnemies] = useState<Enemy[]>([
    { id: 1, x: 400, y: 300, health: 30, maxHealth: 30, type: 'skeleton', facingRight: false, ai: 0 },
    { id: 2, x: 700, y: 200, health: 50, maxHealth: 50, type: 'shadow', facingRight: false, ai: 0 }
  ]);

  const [particles, setParticles] = useState<Particle[]>([]);

  const platforms: Platform[] = [
    // Ground platforms
    { x: 0, y: 350, width: 200, height: 50, type: 'stone' },
    { x: 300, y: 350, width: 200, height: 50, type: 'stone' },
    { x: 600, y: 350, width: 200, height: 50, type: 'stone' },
    // Elevated platforms
    { x: 250, y: 250, width: 100, height: 20, type: 'wood' },
    { x: 450, y: 200, width: 100, height: 20, type: 'wood' },
    { x: 650, y: 150, width: 100, height: 20, type: 'metal' },
    // Walls
    { x: 0, y: 0, width: 20, height: 400, type: 'stone' },
    { x: 780, y: 0, width: 20, height: 400, type: 'stone' }
  ];

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

  // Add particles
  const addParticle = useCallback((x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 60,
        maxLife: 60,
        color,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Collision detection
  const checkCollision = (x: number, y: number, width: number, height: number) => {
    return platforms.find(platform => 
      x < platform.x + platform.width &&
      x + width > platform.x &&
      y < platform.y + platform.height &&
      y + height > platform.y
    );
  };

  // Player physics and controls
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updatePlayer = () => {
      setPlayer(prev => {
        let newPlayer = { ...prev };
        
        // Animation timer
        newPlayer.animationTimer++;
        if (newPlayer.animationTimer > 8) {
          newPlayer.animationTimer = 0;
          newPlayer.animationFrame = (newPlayer.animationFrame + 1) % 4;
        }

        // Horizontal movement
        if (keys.has('a') || keys.has('arrowleft')) {
          newPlayer.vx = Math.max(newPlayer.vx - 0.8, -6);
          newPlayer.facingRight = false;
        } else if (keys.has('d') || keys.has('arrowright')) {
          newPlayer.vx = Math.min(newPlayer.vx + 0.8, 6);
          newPlayer.facingRight = true;
        } else {
          newPlayer.vx *= 0.8; // Friction
        }

        // Jumping
        if ((keys.has('w') || keys.has(' ')) && newPlayer.onGround) {
          newPlayer.vy = -15;
          newPlayer.onGround = false;
        }

        // Attacking
        if (keys.has('j') && !newPlayer.attacking && !newPlayer.casting) {
          newPlayer.attacking = true;
          setTimeout(() => {
            setPlayer(p => ({ ...p, attacking: false }));
          }, 300);
        }

        // Magic casting
        if (keys.has('k') && !newPlayer.casting && !newPlayer.attacking && newPlayer.mana >= 10) {
          newPlayer.casting = true;
          newPlayer.mana -= 10;
          addParticle(newPlayer.x + (newPlayer.facingRight ? 40 : -40), newPlayer.y + 10, '#4f46e5', 8);
          setTimeout(() => {
            setPlayer(p => ({ ...p, casting: false }));
          }, 500);
        }

        // Gravity
        newPlayer.vy += 0.8;
        
        // Apply velocity
        newPlayer.x += newPlayer.vx;
        newPlayer.y += newPlayer.vy;

        // Ground collision
        newPlayer.onGround = false;
        const collision = checkCollision(newPlayer.x - 16, newPlayer.y - 16, 32, 32);
        
        if (collision) {
          if (newPlayer.vy > 0 && newPlayer.y - 16 < collision.y) {
            newPlayer.y = collision.y - 16;
            newPlayer.vy = 0;
            newPlayer.onGround = true;
          } else if (newPlayer.vy < 0 && newPlayer.y + 16 > collision.y + collision.height) {
            newPlayer.y = collision.y + collision.height + 16;
            newPlayer.vy = 0;
          } else if (newPlayer.vx > 0) {
            newPlayer.x = collision.x - 16;
            newPlayer.vx = 0;
          } else if (newPlayer.vx < 0) {
            newPlayer.x = collision.x + collision.width + 16;
            newPlayer.vx = 0;
          }
        }

        // Mana regeneration
        if (newPlayer.mana < newPlayer.maxMana) {
          newPlayer.mana = Math.min(newPlayer.mana + 0.1, newPlayer.maxMana);
        }

        // Bounds checking
        if (newPlayer.x < 20) newPlayer.x = 20;
        if (newPlayer.x > 780) newPlayer.x = 780;
        if (newPlayer.y > 600) {
          newPlayer.health -= 10;
          newPlayer.x = 100;
          newPlayer.y = 300;
          addParticle(newPlayer.x, newPlayer.y, '#dc2626', 10);
        }

        return newPlayer;
      });
    };

    const interval = setInterval(updatePlayer, 16);
    return () => clearInterval(interval);
  }, [keys, gameState, addParticle]);

  // Update particles
  useEffect(() => {
    if (gameState !== 'playing') return;

    const updateParticles = () => {
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * 0.98,
          vy: particle.vy * 0.98,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
      );
    };

    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [gameState]);

  // Camera follow player
  useEffect(() => {
    setCamera({
      x: Math.max(0, Math.min(player.x - 400, 400)),
      y: Math.max(0, Math.min(player.y - 300, 200))
    });
  }, [player.x, player.y]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear with dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      // Draw platforms
      platforms.forEach(platform => {
        let color = '#4a5568';
        if (platform.type === 'wood') color = '#8b4513';
        if (platform.type === 'metal') color = '#718096';
        
        ctx.fillStyle = color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform details
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(platform.x, platform.y, platform.width, 4);
      });

      // Draw enemies
      enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        
        if (enemy.type === 'skeleton') {
          // Skeleton body
          ctx.fillStyle = '#f7fafc';
          ctx.fillRect(-8, -20, 16, 20);
          
          // Skeleton head
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-6, -28, 12, 8);
          
          // Eyes
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-4, -26, 2, 2);
          ctx.fillRect(2, -26, 2, 2);
        } else {
          // Shadow enemy
          ctx.fillStyle = 'rgba(79, 70, 229, 0.8)';
          ctx.fillRect(-10, -24, 20, 24);
          
          // Shadow aura
          ctx.fillStyle = 'rgba(79, 70, 229, 0.3)';
          ctx.fillRect(-12, -26, 24, 26);
        }
        
        // Health bar
        if (enemy.health < enemy.maxHealth) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-12, -35, 24, 4);
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(-12, -35, (enemy.health / enemy.maxHealth) * 24, 4);
        }
        
        ctx.restore();
      });

      // Draw particles
      particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
        ctx.restore();
      });

      // Draw player
      ctx.save();
      ctx.translate(player.x, player.y);
      if (!player.facingRight) ctx.scale(-1, 1);

      // Player body
      if (player.attacking) {
        ctx.fillStyle = '#fbbf24'; // Golden when attacking
      } else if (player.casting) {
        ctx.fillStyle = '#8b5cf6'; // Purple when casting
      } else {
        ctx.fillStyle = '#eea47f'; // Normal skin tone
      }
      
      ctx.fillRect(-8, -20, 16, 20);

      // Player armor
      ctx.fillStyle = '#374151';
      ctx.fillRect(-10, -18, 20, 16);
      
      // Player head
      ctx.fillStyle = '#eea47f';
      ctx.fillRect(-6, -28, 12, 8);
      
      // Helmet
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-7, -30, 14, 6);
      
      // Eyes
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-4, -26, 2, 2);
      ctx.fillRect(2, -26, 2, 2);

      // Weapon (sword)
      if (player.attacking || player.casting) {
        ctx.fillStyle = '#d1d5db';
        ctx.fillRect(8, -25, 3, 20);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(8, -28, 3, 3);
      }

      ctx.restore();

      ctx.restore();

      // UI Elements
      drawUI(ctx);
    };

    const drawUI = (ctx: CanvasRenderingContext2D) => {
      // Health bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, 20, 204, 24);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(22, 22, 200, 20);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(22, 22, (player.health / player.maxHealth) * 200, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText(`HP: ${Math.floor(player.health)}/${player.maxHealth}`, 30, 36);

      // Mana bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, 50, 204, 24);
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(22, 52, 200, 20);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(22, 52, (player.mana / player.maxMana) * 200, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`MP: ${Math.floor(player.mana)}/${player.maxMana}`, 30, 66);

      // Level and XP
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, 80, 204, 24);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(22, 82, (player.experience / player.experienceToNext) * 200, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Level ${player.level} - XP: ${player.experience}/${player.experienceToNext}`, 30, 96);

      // Controls
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, canvas.height - 80, 300, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText('WASD/Стрелки - движение', 30, canvas.height - 60);
      ctx.fillText('J - атака мечом', 30, canvas.height - 45);
      ctx.fillText('K - магическая атака', 30, canvas.height - 30);
      ctx.fillText('I - инвентарь', 30, canvas.height - 15);
    };

    render();
  }, [player, enemies, particles, camera, gameState]);

  const startGame = () => {
    setGameState('playing');
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const openInventory = () => {
    setGameState('inventory');
  };

  const closeInventory = () => {
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      <div className="relative">
        
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-purple-600 pixel-border"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <Card className="bg-gray-900 border-4 border-purple-600 p-8 text-center pixel-border max-w-md">
              <h1 className="text-4xl font-bold text-purple-400 mb-2 pixel-title">
                SHADOWBOUND
              </h1>
              <h2 className="text-xl text-gray-300 mb-6">
                Легенда о Затерянном Королевстве
              </h2>
              
              <div className="text-sm text-gray-400 mb-8 text-left">
                <p className="mb-2">Мрачное королевство окутано древним проклятием...</p>
                <p className="mb-2">Воин Каэль должен исследовать опасные земли,</p>  
                <p>сражаться с темными силами и снять проклятие.</p>
              </div>
              
              <Button 
                onClick={startGame}
                className="w-full bg-purple-600 hover:bg-purple-700 border-2 border-purple-400 text-white text-xl py-3 pixel-btn mb-4"
              >
                НАЧАТЬ ПРИКЛЮЧЕНИЕ
              </Button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <div>WASD/Стрелки - движение и прыжки</div>
                <div>J - атака мечом, K - магия</div>
                <div>I - инвентарь и характеристики</div>
              </div>
            </Card>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <Card className="bg-gray-900 border-4 border-yellow-500 p-8 text-center pixel-border">
              <h2 className="text-4xl font-bold text-yellow-400 mb-6 pixel-title">
                ПАУЗА
              </h2>
              
              <div className="space-y-4">
                <Button 
                  onClick={resumeGame}
                  className="w-full bg-green-600 hover:bg-green-700 border-2 border-green-400 text-white text-lg py-2 pixel-btn"
                >
                  ПРОДОЛЖИТЬ
                </Button>
                
                <Button 
                  onClick={openInventory}
                  className="w-full bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 text-white text-lg py-2 pixel-btn"
                >
                  ИНВЕНТАРЬ
                </Button>
                
                <Button 
                  onClick={() => setGameState('menu')}
                  className="w-full bg-red-600 hover:bg-red-700 border-2 border-red-400 text-white text-lg py-2 pixel-btn"
                >
                  В МЕНЮ
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Inventory Screen */}
        {gameState === 'inventory' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <Card className="bg-gray-900 border-4 border-blue-500 p-8 pixel-border max-w-lg">
              <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center pixel-title">
                КАЭЛЬ - ВОИН ТЕНИ
              </h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg text-yellow-400 mb-3">Характеристики:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Уровень:</span>
                      <span className="text-purple-400">{player.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Здоровье:</span>
                      <span className="text-red-400">{player.maxHealth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Мана:</span>
                      <span className="text-blue-400">{player.maxMana}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Опыт:</span>
                      <span className="text-green-400">{player.experience}/{player.experienceToNext}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg text-yellow-400 mb-3">Снаряжение:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Оружие:</span>
                      <span className="text-gray-300">Стальной меч</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Броня:</span>
                      <span className="text-gray-300">Кожаная куртка</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Шлем:</span>
                      <span className="text-gray-300">Железный шлем</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Заклинания:</span>
                      <span className="text-purple-300">Огненный шар</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button 
                  onClick={closeInventory}
                  className="bg-green-600 hover:bg-green-700 border-2 border-green-400 text-white pixel-btn"
                >
                  ЗАКРЫТЬ
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* In-game controls */}
        {gameState === 'playing' && (
          <div className="absolute top-4 right-4 space-x-2">
            <Button 
              onClick={pauseGame}
              className="bg-yellow-600 hover:bg-yellow-700 border-2 border-yellow-400 text-white pixel-btn"
            >
              ПАУЗА
            </Button>
            <Button 
              onClick={openInventory}
              className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-400 text-white pixel-btn"
            >
              I
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;