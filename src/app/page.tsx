'use client';

import { v4, validate, version } from 'uuid';
import { AlertType } from '@/types/alerts';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CopyToClipboard } from '@/components/ui/copy-to-clipboard';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AlertPopUp = ({
    alert,
    onAlertClose,
    alertShift,
}: {
    alert: AlertType;
    onAlertClose: (id: string) => void;
    alertShift: number;
}) => {
    console.log(alertShift);
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
            }}
            style={{ bottom: `${alertShift}px` }}
            className="fixed right-0 md:right-10 w-full md:w-1/2 lg:w-1/5 h-fit p-2"
        >
            <Alert>
                <Terminal className={`bg-${alert.color}-200 h-4 w-4`} />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
                <Button
                    className="absolute top-1/4 right-2"
                    onClick={() => {
                        onAlertClose(alert.id);
                    }}
                >
                    X
                </Button>
            </Alert>
        </motion.div>
    );
};

function isValidUUID(uuidString: string): boolean {
    return validate(uuidString) && version(uuidString) !== null;
}

export default function Home() {
    let [alerts, setAlerts] = useState<AlertType[]>([]);
    let codeInput = useRef<HTMLInputElement>(null);
    const colors = ['white', 'black'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // useEffect gets HTML elements on mount.
    // useEffect(() => {
    //     codeInput = document.querySelector<HTMLInputElement>('#codeInput');
    // }, []);

    const createAlert = ({
        message: message,
        title: title,
        color: color,
    }: {
        message: string;
        title: string;
        color: string;
    }) => {
        const newAlert = {
            id: v4(),
            title: title,
            message: message,
            color: color,
        };
        setAlerts((prevItems) => [...prevItems, newAlert]);
    };

    const onAlertClose = (id: string) => {
        setAlerts((prevItems) => prevItems.filter((item) => item.id != id));
    };

    const onCreateGameClick = () => {
        const newGameCode = v4();

        window.location.replace(`/white?code=${newGameCode}`);
    };

    const onJoinGameClick = () => {
        const gameCode = codeInput.current?.value;
        if (!gameCode || gameCode.trim() === '' || !isValidUUID(gameCode)) {
            createAlert({
                message: 'You have inserted in an invalid code.',
                title: 'Error!',
                color: 'red',
            });
        } else {
            // socket?.emit('join-game', { code: gameCode });
            window.location.replace(`/black?code=${gameCode}`);
        }
    };

    return (
        <>
            <div className="flex text-center justify-center py-30">
                <div>
                    <h2 className="text-4xl font-bold py-10">Chess Game</h2>
                    <Tabs defaultValue="createGame" className="md:w-[400px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger
                                value="createGame"
                                className="transition-colors duration-200"
                            >
                                Create Game
                            </TabsTrigger>
                            <TabsTrigger
                                value="joinGame"
                                className="transition-colors duration-200"
                            >
                                Join Game
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="createGame">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Create Game</CardTitle>
                                    <CardDescription>
                                        A new game code will be generated which
                                        you then will be able to share with your
                                        friends to play together.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                </CardContent>
                                <CardFooter className="flex justify-center items-center">
                                    <Button
                                        id="createGame"
                                        className="cursor-pointer"
                                        onClick={() => {
                                            onCreateGameClick();
                                        }}
                                    >
                                        Proceed
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                        <TabsContent value="joinGame">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Join Game</CardTitle>
                                    <CardDescription>
                                        Enter the code that was sent to you by
                                        your friend so that you can connect to
                                        their game and play with them.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-center">
                                    <div className="space-y-1">
                                        <Label htmlFor="new">Game Code</Label>
                                        <Input id="codeInput" type="text" ref={codeInput} />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-center items-center">
                                    <Button
                                        id="joinGame"
                                        className="cursor-pointer"
                                        onClick={() => {
                                            onJoinGameClick();
                                        }}
                                    >
                                        Proceed
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <div id="alerts" className="fixed bottom-0 right-0">
                <AnimatePresence>
                    {alerts.map((alert, index) => (
                        <AlertPopUp
                            key={alert.id}
                            alert={alert}
                            onAlertClose={onAlertClose}
                            alertShift={index * 75} // shift each alert 16px more than the previous
                        />
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}
