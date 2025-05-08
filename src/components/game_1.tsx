'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from "chess.js";
import { io, Socket } from 'socket.io-client';


export default function Game(initialColor: string) {
    const [game, setGame] = useState(new Chess());
    const searchParams = useSearchParams();
    const gameCode = searchParams.get('code');


      const makeAMove = (move: any) => {
        const gameCopy = new Chess(game.fen());
        const result = gameCopy.move(move);
        setGame(gameCopy);
        return result; // null if the move was illegal, the move object if the move was legal
      }
    
          useEffect(() => {
            const newSocket = io('http://localhost:3037', {
                transports: ['websocket'],
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
    
            newSocket.on('connect', () => {
                console.log('Connected to server');
                if (gameCode) {
                    newSocket.emit('join-game', { code: gameCode }); // Correct event name!
                }
            });
    
            newSocket.on('start-game', () => {
                console.log('Game started!');
            });
    
            // newSocket.on('new-move', (move: ChessMove) => {
            //     const newGame = new Chess(game.fen());
            //     newGame.move(move);
            //     setGame(newGame);
            //     updateStatus();
            // });
            // newSocket.on('new-move', (move: ChessMove) => {
            //     setGame((prevGame) => {
            //         const newGame = new Chess(prevGame.fen()); // clone last known state
            //         const result = newGame.move(move); // apply move
            //         if (result) {
            //             setFen(newGame.fen());
            //             updateStatus(); // update status outside to keep it clean
            //         } else {
            //             console.warn('Invalid move received:', move);
            //         }
            //         return newGame;
            //     });
            // });
            
            
    
            // newSocket.on('game-overisconnect', () => {
            //     setGameOver(true);
            //     appendAlert(
            //         'Opponent Left',
            //         'Your opponent has disconnected',
            //         'warning'
            //     );
            //     updateStatus();
            // });
    
            // newSocket.on('connect_error', () => {
            //     setConnectionStatus('Connection error - check server');
            // });
    
            // setSocket(newSocket);
            // return () => {
            //     newSocket.disconnect(); // ✅ this is the correct cleanup
            // };
        }, []);
        function onDrop(sourceSquare: any, targetSquare: any) {
            const move = makeAMove({
              from: sourceSquare,
              to: targetSquare,
              promotion: "q", // always promote to a queen for example simplicity
            });
        
            // illegal move
            if (move === null) return false;
            setTimeout(makeRandomMove, 200);
            return true;
          }
        
          return <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            autoPromoteToQueen={true} // always promote to a queen for example simplicity
          />;
}