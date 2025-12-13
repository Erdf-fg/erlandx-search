'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface EasterEggProps {
    type: 'barrel-roll' | 'flip' | 'confetti' | 'matrix' | 'pac-man' | 'snake' | 'dino';
    onClose?: () => void;
}

// Confetti particle
const Confetti = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8'];
    const [particles] = useState(() =>
        Array.from({ length: 150 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 3,
            duration: 2 + Math.random() * 2,
            size: 5 + Math.random() * 10
        }))
    );

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute animate-fall"
                    style={{
                        left: `${p.x}%`,
                        top: '-20px',
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '0',
                        animation: `fall ${p.duration}s linear ${p.delay}s infinite`,
                        transform: `rotate(${Math.random() * 360}deg)`
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

// Matrix rain effect
const Matrix = ({ onClose }: { onClose?: () => void }) => {
    useEffect(() => {
        const timeout = setTimeout(() => onClose?.(), 8000);
        return () => clearTimeout(timeout);
    }, [onClose]);

    const columns = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: i * 2,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 5,
        chars: Array.from({ length: 20 }, () =>
            String.fromCharCode(0x30A0 + Math.random() * 96)
        ).join('')
    }));

    return (
        <div className="fixed inset-0 bg-black z-50 overflow-hidden" onClick={onClose}>
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-green-500 text-sm z-10">
                Click anywhere to exit
            </p>
            {columns.map(col => (
                <div
                    key={col.id}
                    className="absolute text-green-500 font-mono text-sm whitespace-pre animate-matrix"
                    style={{
                        left: `${col.x}%`,
                        top: '-100%',
                        animation: `matrix ${col.duration}s linear ${col.delay}s infinite`,
                        textShadow: '0 0 10px #0f0'
                    }}
                >
                    {col.chars.split('').map((char, i) => (
                        <div key={i} style={{ opacity: 1 - (i * 0.05) }}>{char}</div>
                    ))}
                </div>
            ))}
            <style jsx>{`
                @keyframes matrix {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
            `}</style>
        </div>
    );
};

// Simple Snake Game
const SnakeGame = ({ onClose }: { onClose?: () => void }) => {
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState({ x: 15, y: 15 });
    const [direction, setDirection] = useState({ x: 1, y: 0 });
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': setDirection({ x: 0, y: -1 }); break;
                case 'ArrowDown': setDirection({ x: 0, y: 1 }); break;
                case 'ArrowLeft': setDirection({ x: -1, y: 0 }); break;
                case 'ArrowRight': setDirection({ x: 1, y: 0 }); break;
                case 'Escape': onClose?.(); break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    useEffect(() => {
        if (gameOver) return;

        const interval = setInterval(() => {
            setSnake(prev => {
                const head = prev[0];
                const newHead = {
                    x: (head.x + direction.x + 20) % 20,
                    y: (head.y + direction.y + 20) % 20
                };

                // Check self collision
                if (prev.some(p => p.x === newHead.x && p.y === newHead.y)) {
                    setGameOver(true);
                    return prev;
                }

                const newSnake = [newHead, ...prev];

                // Check food
                if (newHead.x === food.x && newHead.y === food.y) {
                    setFood({
                        x: Math.floor(Math.random() * 20),
                        y: Math.floor(Math.random() * 20)
                    });
                    setScore(s => s + 10);
                } else {
                    newSnake.pop();
                }

                return newSnake;
            });
        }, 150);

        return () => clearInterval(interval);
    }, [direction, food, gameOver]);

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
            <div className="text-white mb-4 flex gap-8">
                <span>🐍 Score: {score}</span>
                <span className="text-gray-400 text-sm">Arrow keys to move • ESC to exit</span>
            </div>

            <div className="grid gap-0 bg-gray-800 p-2 rounded-lg"
                style={{ gridTemplateColumns: 'repeat(20, 20px)' }}>
                {Array.from({ length: 400 }, (_, i) => {
                    const x = i % 20;
                    const y = Math.floor(i / 20);
                    const isSnake = snake.some(p => p.x === x && p.y === y);
                    const isHead = snake[0].x === x && snake[0].y === y;
                    const isFood = food.x === x && food.y === y;

                    return (
                        <div
                            key={i}
                            className={`w-5 h-5 rounded-sm ${isHead ? 'bg-green-400' :
                                    isSnake ? 'bg-green-600' :
                                        isFood ? 'bg-red-500' :
                                            'bg-gray-700'
                                }`}
                        />
                    );
                })}
            </div>

            {gameOver && (
                <div className="mt-4 text-center">
                    <p className="text-red-400 text-xl">Game Over!</p>
                    <button
                        onClick={() => {
                            setSnake([{ x: 10, y: 10 }]);
                            setDirection({ x: 1, y: 0 });
                            setGameOver(false);
                            setScore(0);
                        }}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                    >
                        Play Again
                    </button>
                </div>
            )}

            <button
                onClick={onClose}
                className="mt-4 text-gray-400 hover:text-white"
            >
                ← Back to Search
            </button>
        </div>
    );
};

// Dino Game (Simple Jump)
const DinoGame = ({ onClose }: { onClose?: () => void }) => {
    const [jumping, setJumping] = useState(false);
    const [obstacleX, setObstacleX] = useState(100);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [dinoY, setDinoY] = useState(0);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.key === ' ' || e.key === 'ArrowUp') && !jumping && !gameOver) {
                setJumping(true);
                setDinoY(60);
                setTimeout(() => setDinoY(0), 300);
                setTimeout(() => setJumping(false), 600);
            }
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [jumping, gameOver, onClose]);

    useEffect(() => {
        if (gameOver) return;

        const interval = setInterval(() => {
            setObstacleX(prev => {
                const newX = prev - 5;
                if (newX < -10) {
                    setScore(s => s + 1);
                    return 100;
                }

                // Collision detection
                if (newX < 15 && newX > 0 && dinoY < 30) {
                    setGameOver(true);
                }

                return newX;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [gameOver, dinoY]);

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
            <div className="text-gray-800 mb-4">
                🦖 Score: {score} • Press SPACE to jump • ESC to exit
            </div>

            <div className="relative w-96 h-40 bg-gray-100 rounded-lg overflow-hidden border-b-4 border-gray-400">
                {/* Ground */}
                <div className="absolute bottom-0 w-full h-1 bg-gray-400"></div>

                {/* Dino */}
                <div
                    className="absolute bottom-1 left-8 text-4xl transition-transform duration-150"
                    style={{ transform: `translateY(-${dinoY}px)` }}
                >
                    🦖
                </div>

                {/* Obstacle */}
                <div
                    className="absolute bottom-1 text-2xl"
                    style={{ left: `${obstacleX}%` }}
                >
                    🌵
                </div>
            </div>

            {gameOver && (
                <div className="mt-4 text-center">
                    <p className="text-red-500 text-xl">Game Over!</p>
                    <button
                        onClick={() => {
                            setObstacleX(100);
                            setGameOver(false);
                            setScore(0);
                        }}
                        className="mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg"
                    >
                        Try Again
                    </button>
                </div>
            )}

            <button onClick={onClose} className="mt-4 text-gray-500 hover:text-gray-800">
                ← Back to Search
            </button>
        </div>
    );
};

// Main Easter Egg Component
export default function EasterEgg({ type, onClose }: EasterEggProps) {
    useEffect(() => {
        if (type === 'barrel-roll') {
            document.body.style.transition = 'transform 2s ease-in-out';
            document.body.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                document.body.style.transform = 'none';
                onClose?.();
            }, 2000);
        } else if (type === 'flip') {
            document.body.style.transition = 'transform 1s ease-in-out';
            document.body.style.transform = 'scaleY(-1)';
            setTimeout(() => {
                document.body.style.transform = 'none';
                onClose?.();
            }, 2000);
        }

        return () => {
            document.body.style.transform = 'none';
            document.body.style.transition = 'none';
        };
    }, [type, onClose]);

    switch (type) {
        case 'confetti':
            return <Confetti />;
        case 'matrix':
            return <Matrix onClose={onClose} />;
        case 'snake':
            return <SnakeGame onClose={onClose} />;
        case 'dino':
            return <DinoGame onClose={onClose} />;
        default:
            return null;
    }
}

// Easter Egg triggers
export const EASTER_EGG_TRIGGERS: Record<string, EasterEggProps['type']> = {
    'do a barrel roll': 'barrel-roll',
    'barrel roll': 'barrel-roll',
    'flip': 'flip',
    'terbalik': 'flip',
    'party': 'confetti',
    'confetti': 'confetti',
    'pesta': 'confetti',
    'matrix': 'matrix',
    'neo': 'matrix',
    'snake': 'snake',
    'ular': 'snake',
    'snake game': 'snake',
    'dino': 'dino',
    'dinosaur': 'dino',
    't-rex': 'dino',
    'dinosaurus': 'dino',
};
