import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: string[];
    typingUsers: Map<string, string[]>; // conversationId -> userIds
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    onlineUsers: [],
    typingUsers: new Map()
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());

    useEffect(() => {
        if (!user || !token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Connect to socket server
        const newSocket = io('http://localhost:4000', {
            transports: ['websocket', 'polling'],
            autoConnect: true
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            // Join user's personal room
            newSocket.emit('join', (user as any).id || (user as any).accountId);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        // Online users
        newSocket.on('online-users', (users: string[]) => {
            setOnlineUsers(users);
        });

        newSocket.on('user-online', (userId: string) => {
            setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
        });

        newSocket.on('user-offline', (userId: string) => {
            setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

        // Typing indicators
        newSocket.on('user-typing', ({ conversationId, senderId }: { conversationId: string; senderId: string }) => {
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                const current = newMap.get(conversationId) || [];
                if (!current.includes(senderId)) {
                    newMap.set(conversationId, [...current, senderId]);
                }
                return newMap;
            });
        });

        newSocket.on('user-stop-typing', ({ conversationId, senderId }: { conversationId: string; senderId: string }) => {
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                const current = newMap.get(conversationId) || [];
                newMap.set(conversationId, current.filter(id => id !== senderId));
                return newMap;
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user, token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers, typingUsers }}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketContext;
