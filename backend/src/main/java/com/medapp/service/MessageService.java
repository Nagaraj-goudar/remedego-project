package com.medapp.service;

import com.medapp.model.Message;
import com.medapp.model.User;
import com.medapp.repository.MessageRepository;
import com.medapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.ArrayList;

@Service
@Transactional
public class MessageService {
    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);

    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;

    /**
     * Send a message from one user to another
     */
    public Message sendMessage(String senderEmail, Long receiverId, String content) {
        logger.info("Sending message from {} to user ID {}", senderEmail, receiverId);
        
        // Find sender
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        
        // Find receiver
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));
        
        // Validate that sender and receiver are different
        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("Cannot send message to yourself");
        }
        
        // Validate that it's a valid patient-pharmacist conversation
        validateConversationPermission(sender, receiver);
        
        // Create message
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content.trim());
        
        Message savedMessage = messageRepository.save(message);
        logger.info("Message sent successfully with ID: {}", savedMessage.getId());
        
        return savedMessage;
    }

    /**
     * Get conversation between two users
     */
    public List<Message> getConversation(String userEmail, Long otherUserId) {
        logger.info("Getting conversation between {} and user ID {}", userEmail, otherUserId);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Other user not found"));
        
        // Validate conversation permission
        validateConversationPermission(user, otherUser);
        
        List<Message> messages = messageRepository.findMessagesBetweenUsers(user, otherUser);
        
        // Mark messages as read for the requesting user
        markMessagesAsRead(otherUser, user);
        
        logger.info("Retrieved {} messages in conversation", messages.size());
        return messages;
    }

    /**
     * Get all conversation partners for a user
     */
    public List<User> getConversationPartners(String userEmail) {
        logger.info("Getting conversation partners for user: {}", userEmail);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<User> partners = messageRepository.findConversationPartners(user);
        
        logger.info("Found {} conversation partners", partners.size());
        return partners;
    }

    /**
     * Get unread message count for a user
     */
    public long getUnreadMessageCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return messageRepository.countUnreadMessages(user);
    }

    /**
     * Mark messages as read between two users
     */
    public void markMessagesAsRead(User sender, User receiver) {
        List<Message> unreadMessages = messageRepository.findByReceiverAndIsReadOrderBySentAtDesc(receiver, false)
                .stream()
                .filter(message -> message.getSender().getId().equals(sender.getId()))
                .toList();
        
        for (Message message : unreadMessages) {
            message.setRead(true);
        }
        
        if (!unreadMessages.isEmpty()) {
            messageRepository.saveAll(unreadMessages);
            logger.info("Marked {} messages as read", unreadMessages.size());
        }
    }

    /**
     * Get available users to chat with (based on role)
     */
    public List<User> getAvailableChatUsers(String userEmail) {
        logger.info("Getting available chat users for: {}", userEmail);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<User> availableUsers;
        
        if (user.getRole() == User.Role.PATIENT) {
            // Patients can chat with pharmacists
            availableUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.PHARMACIST && u.isActive())
                    .toList();
        } else if (user.getRole() == User.Role.PHARMACIST) {
            // Pharmacists can chat with patients and admins
            availableUsers = userRepository.findAll().stream()
                    .filter(u -> (u.getRole() == User.Role.PATIENT || u.getRole() == User.Role.ADMIN) && u.isActive())
                    .toList();
        } else if (user.getRole() == User.Role.ADMIN) {
            // Admins can chat with pharmacists
            availableUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.PHARMACIST && u.isActive())
                    .toList();
        } else {
            // Default: no available users
            availableUsers = new ArrayList<>();
        }
        
        logger.info("Found {} available chat users", availableUsers.size());
        return availableUsers;
    }

    /**
     * Validate that users are allowed to have a conversation
     */
    private void validateConversationPermission(User user1, User user2) {
        // Allow patient-pharmacist conversations
        if ((user1.getRole() == User.Role.PATIENT && user2.getRole() == User.Role.PHARMACIST) ||
            (user1.getRole() == User.Role.PHARMACIST && user2.getRole() == User.Role.PATIENT)) {
            return;
        }
        
        // Allow admin-pharmacist conversations
        if ((user1.getRole() == User.Role.ADMIN && user2.getRole() == User.Role.PHARMACIST) ||
            (user1.getRole() == User.Role.PHARMACIST && user2.getRole() == User.Role.ADMIN)) {
            return;
        }
        
        throw new RuntimeException("Invalid conversation: Only patient-pharmacist and admin-pharmacist conversations are allowed");
    }

    /**
     * Get conversation summary with latest message and unread count
     */
    public ConversationSummary getConversationSummary(String userEmail, Long otherUserId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Other user not found"));
        
        List<Message> latestMessages = messageRepository.findLatestMessageBetweenUsers(user, otherUser);
        Message latestMessage = latestMessages.isEmpty() ? null : latestMessages.get(0);
        
        long unreadCount = messageRepository.countUnreadMessagesBetweenUsers(otherUser, user);
        
        return new ConversationSummary(otherUser, latestMessage, unreadCount);
    }

    /**
     * Conversation summary DTO
     */
    public static class ConversationSummary {
        public final User otherUser;
        public final Message latestMessage;
        public final long unreadCount;

        public ConversationSummary(User otherUser, Message latestMessage, long unreadCount) {
            this.otherUser = otherUser;
            this.latestMessage = latestMessage;
            this.unreadCount = unreadCount;
        }
    }

    /**
     * Edit a message (only the sender can edit their own messages)
     */
    public Message editMessage(String userEmail, Long messageId, String newContent) {
        logger.info("Editing message {} by user: {}", messageId, userEmail);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        // Only the sender can edit their own messages
        if (!message.getSender().getId().equals(user.getId())) {
            throw new RuntimeException("You can only edit your own messages");
        }
        
        // Check if message is not too old (e.g., within 5 minutes)
        long messageAgeMinutes = java.time.Duration.between(message.getSentAt(), java.time.LocalDateTime.now()).toMinutes();
        if (messageAgeMinutes > 5) {
            throw new RuntimeException("Messages can only be edited within 5 minutes of sending");
        }
        
        message.setContent(newContent);
        message.setEdited(true);
        Message updatedMessage = messageRepository.save(message);
        
        logger.info("Message edited successfully: {}", messageId);
        return updatedMessage;
    }

    /**
     * Delete a message (only the sender can delete their own messages)
     */
    public void deleteMessage(String userEmail, Long messageId) {
        logger.info("Deleting message {} by user: {}", messageId, userEmail);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        // Only the sender can delete their own messages
        if (!message.getSender().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own messages");
        }
        
        // Check if message is not too old (e.g., within 10 minutes)
        long messageAgeMinutes = java.time.Duration.between(message.getSentAt(), java.time.LocalDateTime.now()).toMinutes();
        if (messageAgeMinutes > 10) {
            throw new RuntimeException("Messages can only be deleted within 10 minutes of sending");
        }
        
        messageRepository.delete(message);
        logger.info("Message deleted successfully: {}", messageId);
    }
}