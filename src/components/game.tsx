'use client';

import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';

interface GameProps {
    initialColor?: 'white' | 'black';
}

interface ChessMove {
    from: string;
    to: string;
    promotion?: 'q' | 'r' | 'b' | 'n';
}

interface Alert {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
}

const alertStyles = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
};

export default function Game({ initialColor = 'white' }: GameProps) {
    const [game, setGame] = useState<Chess>(new Chess());
    const [socket, setSocket] = useState<Socket | null>(null);
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>(
        initialColor
    );
    let [moveColor, setMoveColor] = useState<'w' | 'b'>('w');
    const [gameHasStarted, setGameHasStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [status, setStatus] = useState('Waiting for opponent to join');
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [pgn, setPgn] = useState('');
    const [fen, setFen] = useState(game.fen());
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    let [legalPiece, setLegalPiece] = useState(true);
    const searchParams = useSearchParams();
    const gameCode = searchParams.get('code');

    const appendAlert = (
        title: string,
        message: string,
        type: Alert['type']
    ): void => {
        setAlerts((prev) => [...prev, { title, message, type }]);
        setTimeout(() => {
            setAlerts((prev) =>
                prev.filter((a) => a.title !== title || a.message !== message)
            );
        }, 5000);
    };

    const updateStatus = (): void => {
        let statusText = '';
        setMoveColor(game.turn());
        let moveColorString = moveColor === 'w' ? 'White' : 'Black';

        if (game.isCheckmate()) {
            statusText = 'Game over, ' + moveColorString + ' is in checkmate.';
            appendAlert('Game Over', statusText, 'success');
            setGameOver(true);
        } else if (game.isDraw()) {
            statusText = 'Game over, drawn position';
            appendAlert('Draw', statusText, 'success');
            setGameOver(true);
        } else if (gameOver) {
            statusText = 'Opponent disconnected, you win!';
        } else if (!gameHasStarted) {
            statusText = 'Waiting for opponent to join';
        } else {
            statusText = moveColorString + ' to move';
            if (game.isCheck())
                statusText += ', ' + moveColorString + ' is in check';
        }

        setStatus(statusText);
        setPgn(game.pgn());
    };

    const makeAMove = (move: any) => {
        const gameCopy = new Chess(game.fen());
        console.log(move);
        const result = gameCopy.move(move);
        setGame(gameCopy);
        setFen(gameCopy.fen());

        return result;
    };

    const onDrop = (source: string, target: string): boolean => {
        const move = makeAMove({
            from: source,
            to: target,
            promotion: 'q',
        });
        console.log(move);

        if (move === null) return false;

        socket?.emit('move', {
            from: source,
            to: target,
            promotion: 'q',
        });
        updateStatus();
        return true;
    };

    const onDragStart = (piece: string): void => {
        const currentTurn = game.turn(); // 'w' or 'b'
        const playerTurn = playerColor === 'white' ? 'w' : 'b';

        // Only allow dragging own pieces on your turn
        const isOwnPiece =
            (piece[0] == 'w' && playerColor === 'white') ||
            (piece.startsWith('b') && playerColor === 'black');

        const isMyTurn = currentTurn === playerTurn;

        setLegalPiece(isOwnPiece && isMyTurn && gameHasStarted && !gameOver);
    };

    const isDraggablePiece = ({
        piece,
        sourceSquare,
    }: {
        piece: string;
        sourceSquare: string;
    }): boolean => {
        if (piece.startsWith(playerColor[0])) {
            return true;
        }
        return false;
    };

    const pieces = [
        'wP',
        'wN',
        'wB',
        'wR',
        'wQ',
        'wK',
        'bP',
        'bN',
        'bB',
        'bR',
        'bQ',
        'bK',
    ];
    const customPieces = useMemo(() => {
        const pieceComponents: {
            [key: string]: React.FC<{ squareWidth: number }>;
        } = {};
        pieces.forEach((piece) => {
            pieceComponents[piece] = ({ squareWidth }) => (
                <div
                    style={{
                        width: squareWidth,
                        height: squareWidth,
                        backgroundImage: `url(/${piece}.png)`,
                        backgroundSize: '100%',
                    }}
                />
            );
        });
        return pieceComponents;
    }, []);

    useEffect(() => {
        const newSocket = io('http://localhost:3037', {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Connected to server');
            setConnectionStatus('Connected');
            if (gameCode) {
                newSocket.emit('join-game', { code: gameCode }); // Correct event name!
            }
        });

        newSocket.on('start-game', () => {
            console.log('Game started!');
            setGameHasStarted(true);
            updateStatus();
            appendAlert('Game Started', 'Your opponent has joined!', 'success');
        });

        newSocket.on('new-move', (move: ChessMove) => {
            const result = game.move(move);
            if (result) {
                setGame(game);
                updateStatus();
            } else {
                console.warn('Invalid move received:', move);
            }
        });

        newSocket.on('game-overisconnect', () => {
            setGameOver(true);
            appendAlert(
                'Opponent Left',
                'Your opponent has disconnected',
                'warning'
            );
            updateStatus();
        });

        newSocket.on('connect_error', () => {
            setConnectionStatus('Connection error - check server');
        });

        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        updateStatus();
    }, [game, gameHasStarted, gameOver]);

    useEffect(() => {
        setGame(new Chess());
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-4">
                    <div className="mb-2 p-2 border-2 border-zinc-100 rounded-xl flex items-center justify-center">
                        <Link
                            href={'/'}
                            className="flex items-center gap-2 hover:text-blue-500 transition-colors duration-200"
                        >
                            <Home className="h-5 w-5" />
                            Return to home.
                        </Link>
                    </div>
                    {/* {alerts.length > 0 && (
                        <div className="mb-4">
                            {alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className={`p-2 mb-2 rounded-xl ${
                                        alertStyles[alert.type]
                                    }`}
                                >
                                    {alert.title}: {alert.message}
                                    <button
                                        className="float-right"
                                        onClick={() =>
                                            setAlerts(
                                                alerts.filter(
                                                    (_, i) => i !== index
                                                )
                                            )
                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )} */}

                    {connectionStatus !== 'Connected' && (
                        <div className="mb-2 p-2 bg-yellow-100 rounded-xl">
                            <strong>Status:</strong> {connectionStatus}
                        </div>
                    )}

                    {gameCode && (
                        <div className="mb-2 p-2 border-2 border-zinc-100 rounded-xl text-center">
                            Game Code: <CopyToClipboard text={`${gameCode}`} />
                            Game Link:{' '}
                            <CopyToClipboard
                                text={`${
                                    playerColor === 'white'
                                        ? 'localhost:3000/black?code='
                                        : 'localhost:3000/white?code='
                                }${gameCode}`}
                            />
                        </div>
                    )}

                    <div className="p-2 border-2 border-zinc-100 rounded-xl">
                        <p>
                            <strong>Status:</strong> {status}
                        </p>
                        <p>
                            <strong>Playing as:</strong> {playerColor}
                        </p>
                    </div>
                </div>

                <div className="mb-4">
                    <Chessboard
                        id="myBoard"
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        onPieceDragBegin={onDragStart}
                        isDraggablePiece={isDraggablePiece}
                        boardOrientation={playerColor}
                        customBoardStyle={{
                            borderRadius: '15px',
                        }}
                        customDarkSquareStyle={{
                            backgroundColor: '#779952',
                        }}
                        customLightSquareStyle={{
                            backgroundColor: '#edeed1',
                        }}
                        customPieces={customPieces}
                    />
                </div>

                <div className="mb-4 p-2 bg-gray-100 rounded-2xl overflow-auto max-h-40">
                    <p>
                        <strong>PGN:</strong>
                    </p>
                    <pre>{pgn}</pre>
                </div>
            </div>
        </div>
    );
}
