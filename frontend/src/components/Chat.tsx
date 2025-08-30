import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatUser } from '../types';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedUser) {
      loadConversation();
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAvailableUsers = async () => {
    try {
      setIsLoading(true);
      const users = await apiService.getAvailableChatUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Failed to load available users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async () => {
    if (!selectedUser) return;
    
    try {
      setIsLoading(true);
      const conversation = await apiService.getConversation(selectedUser.id);
      setMessages(conversation);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;

    try {
      setIsSending(true);
      const message = await apiService.sendMessage(selectedUser.id, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (message: Message) => {
    if (!editContent.trim()) return;

    try {
      setIsEditing(true);
      const updatedMessage = await apiService.editMessage(message.id, editContent.trim());
      setMessages(prev => prev.map(m => m.id === message.id ? updatedMessage : m));
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to edit message:', error);
      alert('Failed to edit message. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, message: Message) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditMessage(message);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      setIsDeleting(true);
      await apiService.deleteMessage(message.id);
      setMessages(prev => prev.filter(m => m.id !== message.id));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = (message: Message) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const canEditMessage = (message: Message) => {
    const currentUserId = user?.id?.toString();
    const senderId = message.senderId?.toString();
    const isOwnMessage = currentUserId === senderId;
    
    // Check if message is not too old (within 5 minutes)
    const messageTime = new Date(message.sentAt);
    const now = new Date();
    const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    
    return isOwnMessage && timeDiffMinutes <= 5;
  };

  const canDeleteMessage = (message: Message) => {
    const currentUserId = user?.id?.toString();
    const senderId = message.senderId?.toString();
    const isOwnMessage = currentUserId === senderId;
    
    // Check if message is not too old (within 10 minutes)
    const messageTime = new Date(message.sentAt);
    const now = new Date();
    const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    
    return isOwnMessage && timeDiffMinutes <= 10;
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageAgeIndicator = (message: Message) => {
    const messageTime = new Date(message.sentAt);
    const now = new Date();
    const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    
    if (timeDiffMinutes <= 5) {
      return <span className="text-xs text-green-500 ml-1">•</span>;
    } else if (timeDiffMinutes <= 10) {
      return <span className="text-xs text-yellow-500 ml-1">•</span>;
    } else {
      return <span className="text-xs text-gray-400 ml-1">•</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-96 flex">
        {/* User List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : availableUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No users available to chat
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {availableUsers.map((chatUser) => (
                  <button
                    key={chatUser.id}
                    onClick={() => setSelectedUser(chatUser)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedUser?.id === chatUser.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{chatUser.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{chatUser.role.toLowerCase()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h4 className="font-semibold text-gray-900">{selectedUser.name}</h4>
                <p className="text-sm text-gray-500 capitalize">{selectedUser.role.toLowerCase()}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Chatting as: {user?.role?.toLowerCase()}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((message) => {
                  // Handle different ID formats (string vs number)
                  const currentUserId = user?.id?.toString();
                  const senderId = message.senderId?.toString();
                  const isCurrentUser = currentUserId === senderId;
                  const isEditingThisMessage = editingMessage?.id === message.id;
                  
                  return (
                  <div
                    key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2 group`}
                    >
                      <div className="relative">
                        {isEditingThisMessage ? (
                          <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm bg-yellow-100 border border-yellow-300">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-sm"
                              autoFocus
                              onKeyPress={(e) => handleEditKeyPress(e, message)}
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <button
                                onClick={() => handleEditMessage(message)}
                                disabled={isEditing}
                                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                              >
                                {isEditing ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm relative ${
                              isCurrentUser
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-200 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            {/* Message Actions (only show on hover for own messages) */}
                            {isCurrentUser && (
                              <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border p-1 flex space-x-1">
                                {canEditMessage(message) && (
                                  <button
                                    onClick={() => startEditing(message)}
                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    title="Edit message"
                                  >
                                    ✏️
                                  </button>
                                )}
                                {canDeleteMessage(message) && (
                                  <button
                                    onClick={() => handleDeleteMessage(message)}
                                    disabled={isDeleting}
                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                                    title="Delete message"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            )}
                            
                            <p className="text-sm break-words">
                              {message.content}
                              {message.isEdited && (
                                <span className="text-xs opacity-75 ml-1">(edited)</span>
                              )}
                            </p>
                      <p
                        className={`text-xs mt-1 ${
                                isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                              {formatMessageTime(message.sentAt)} {getMessageAgeIndicator(message)}
                      </p>
                          </div>
                        )}
                    </div>
                  </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isSending ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a user to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;