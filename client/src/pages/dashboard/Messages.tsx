import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { MailIcon, SendIcon, SearchIcon, UsersIcon } from '../../components/ui/Icons';
import styles from './Messages.module.css';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    name: string;
  };
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export default function Messages() {
  const { user, token } = useAuth();
  const { socket, isConnected, onlineUsers, typingUsers } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    fetchConversations();
    fetchUsers();

    // Check for conversation param
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedConversation(conversationId);
    }
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', ({ conversationId, message }: { conversationId: string; message: Message }) => {
      // Update conversations list
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === conversationId);
        if (idx === -1) {
          fetchConversations(); // New conversation, refetch
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          lastMessage: message,
          updatedAt: new Date().toISOString(),
          unreadCount: conversationId === selectedConversation ? 0 : updated[idx].unreadCount + 1
        };
        // Move to top
        return [updated[idx], ...updated.slice(0, idx), ...updated.slice(idx + 1)];
      });

      // Add to messages if current conversation
      if (conversationId === selectedConversation) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      socket.off('new-message');
    };
  }, [socket, selectedConversation]);

  // Join conversation room when selected
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    socket.emit('join-conversation', selectedConversation);
    fetchMessages(selectedConversation);

    return () => {
      socket.emit('leave-conversation', selectedConversation);
    };
  }, [socket, selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/chat/conversations/${conversationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/chat/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const startConversation = async (recipientId: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId })
      });
      if (response.ok) {
        const { id } = await response.json();
        setSelectedConversation(id);
        setShowNewChat(false);
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Stop typing indicator
    if (socket) {
      socket.emit('stop-typing', { conversationId: selectedConversation, senderId: (user as any)?.id });
    }

    try {
      const response = await fetch(`http://localhost:4000/api/chat/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      if (!response.ok) {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!socket || !selectedConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { conversationId: selectedConversation, senderId: (user as any)?.id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing', { conversationId: selectedConversation, senderId: (user as any)?.id });
    }, 2000);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== (user as any)?.id) || conversation.participants[0];
  };

  const isUserOnline = (userId: string) => onlineUsers.includes(userId);

  const getTypingIndicator = () => {
    if (!selectedConversation) return null;
    const typing = typingUsers.get(selectedConversation);
    if (!typing || typing.length === 0) return null;

    const conv = conversations.find(c => c.id === selectedConversation);
    if (!conv) return null;

    const typingUser = conv.participants.find(p => typing.includes(p.id));
    if (!typingUser) return null;

    return `${typingUser.name} is typing...`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherParticipant = selectedConv ? getOtherParticipant(selectedConv) : null;
  const typingIndicator = getTypingIndicator();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1><MailIcon size={28} /> Messages</h1>
          <div className={styles.connectionStatus}>
            <span className={`${styles.statusDot} ${isConnected ? styles.online : styles.offline}`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
        <button className={styles.newChatBtn} onClick={() => setShowNewChat(true)}>
          + New Chat
        </button>
      </div>

      <div className={styles.chatContainer}>
        {/* Conversations Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Conversations</h3>
          </div>

          {conversations.length === 0 ? (
            <div className={styles.emptyConversations}>
              <UsersIcon size={40} />
              <p>No conversations yet</p>
              <button onClick={() => setShowNewChat(true)}>Start a chat</button>
            </div>
          ) : (
            <div className={styles.conversationList}>
              {conversations.map(conv => {
                const other = getOtherParticipant(conv);
                const isActive = conv.id === selectedConversation;
                const online = isUserOnline(other.id);

                return (
                  <div
                    key={conv.id}
                    className={`${styles.conversationItem} ${isActive ? styles.active : ''}`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <div className={styles.avatarWrapper}>
                      <div className={styles.avatar}>
                        {other.name.charAt(0).toUpperCase()}
                      </div>
                      {online && <span className={styles.onlineIndicator} />}
                    </div>
                    <div className={styles.conversationInfo}>
                      <div className={styles.conversationTop}>
                        <span className={styles.conversationName}>{other.name}</span>
                        {conv.lastMessage && (
                          <span className={styles.conversationTime}>
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className={styles.conversationPreview}>
                        {conv.lastMessage?.content || 'No messages yet'}
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={styles.chatArea}>
          {!selectedConversation ? (
            <div className={styles.noChat}>
              <MailIcon size={64} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar or start a new chat</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderInfo}>
                  <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                      {otherParticipant?.name.charAt(0).toUpperCase()}
                    </div>
                    {otherParticipant && isUserOnline(otherParticipant.id) && (
                      <span className={styles.onlineIndicator} />
                    )}
                  </div>
                  <div>
                    <h4>{otherParticipant?.name}</h4>
                    <span className={styles.chatHeaderStatus}>
                      {typingIndicator || (otherParticipant && isUserOnline(otherParticipant.id) ? 'Online' : 'Offline')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <div className={styles.noMessages}>
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map(message => {
                    const isOwn = message.sender.id === (user as any)?.id;
                    return (
                      <div
                        key={message.id}
                        className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
                      >
                        <div className={styles.messageContent}>
                          {message.content}
                        </div>
                        <div className={styles.messageTime}>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              {typingIndicator && (
                <div className={styles.typingIndicator}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span>{typingIndicator}</span>
                </div>
              )}

              {/* Input */}
              <form className={styles.inputArea} onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                  className={styles.messageInput}
                />
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon size={20} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className={styles.modal} onClick={() => setShowNewChat(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Start New Chat</h2>
            <div className={styles.searchBox}>
              <SearchIcon size={18} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.userList}>
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  className={styles.userItem}
                  onClick={() => startConversation(u.id)}
                >
                  <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    {isUserOnline(u.id) && <span className={styles.onlineIndicator} />}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{u.name}</span>
                    <span className={styles.userRole}>{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.cancelBtn} onClick={() => setShowNewChat(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
