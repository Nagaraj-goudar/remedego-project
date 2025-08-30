package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.Message;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import com.medapp.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class MessageController {
    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);
    
    @Autowired
    private MessageService messageService;
    
    @Autowired
    private UserRepository userRepository;

    // DTO for frontend
    public static class MessageDTO {
        public String id;
        public String senderId;
        public String senderName;
        public String receiverId;
        public String receiverName;
        public String content;
        public String sentAt;
        public boolean isRead;
        public boolean isEdited;

        public MessageDTO(Message m) {
            this.id = m.getId() != null ? m.getId().toString() : "";
            this.senderId = m.getSender() != null && m.getSender().getId() != null 
                ? m.getSender().getId().toString() : "";
            this.senderName = m.getSender() != null ? m.getSender().getName() : "";
            this.receiverId = m.getReceiver() != null && m.getReceiver().getId() != null 
                ? m.getReceiver().getId().toString() : "";
            this.receiverName = m.getReceiver() != null ? m.getReceiver().getName() : "";
            this.content = m.getContent();
            this.sentAt = m.getSentAt() != null ? m.getSentAt().toString() : "";
            this.isRead = m.isRead();
            this.isEdited = m.isEdited();
        }
    }

    public static class UserDTO {
        public String id;
        public String name;
        public String email;
        public String role;

        public UserDTO(User u) {
            this.id = u.getId() != null ? u.getId().toString() : "";
            this.name = u.getName();
            this.email = u.getEmail();
            this.role = u.getRole() != null ? u.getRole().name() : "";
        }
    }

    /**
     * Send a message
     * POST /api/chat/send
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<MessageDTO>> sendMessage(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Send message request from user: {}", userDetails.getUsername());
        try {
            Long receiverId = Long.valueOf(body.get("receiverId").toString());
            String content = body.get("content").toString();
            
            Message message = messageService.sendMessage(userDetails.getUsername(), receiverId, content);
            
            logger.info("Message sent successfully: {}", message.getId());
            return ResponseEntity.ok(ApiResponse.success(
                new MessageDTO(message), 
                "Message sent successfully"
            ));
        } catch (Exception e) {
            logger.error("Failed to send message: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get conversation with another user
     * GET /api/chat/conversation/{userId}
     */
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getConversation(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Get conversation request from user: {} with user: {}", userDetails.getUsername(), userId);
        try {
            List<Message> messages = messageService.getConversation(userDetails.getUsername(), userId);
            List<MessageDTO> dtos = messages.stream()
                .map(MessageDTO::new)
                .collect(Collectors.toList());
            
            logger.info("Retrieved {} messages in conversation", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Conversation retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get conversation: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get available users to chat with
     * GET /api/chat/users
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAvailableChatUsers(
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Get available chat users request from user: {}", userDetails.getUsername());
        try {
            List<User> users = messageService.getAvailableChatUsers(userDetails.getUsername());
            List<UserDTO> dtos = users.stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
            
            logger.info("Found {} available chat users", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Available chat users retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get available chat users: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get conversation partners (users you've chatted with)
     * GET /api/chat/conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getConversationPartners(
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Get conversation partners request from user: {}", userDetails.getUsername());
        try {
            List<User> partners = messageService.getConversationPartners(userDetails.getUsername());
            List<UserDTO> dtos = partners.stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
            
            logger.info("Found {} conversation partners", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Conversation partners retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get conversation partners: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get unread message count
     * GET /api/chat/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadMessageCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            long unreadCount = messageService.getUnreadMessageCount(userDetails.getUsername());
            
            return ResponseEntity.ok(ApiResponse.success(
                Map.of("unreadCount", unreadCount), 
                "Unread message count retrieved successfully"
            ));
        } catch (Exception e) {
            logger.error("Failed to get unread message count: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Edit a message
     * PUT /api/chat/messages/{messageId}
     */
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageDTO>> editMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Edit message request from user: {} for message: {}", userDetails.getUsername(), messageId);
        try {
            String newContent = body.get("content");
            if (newContent == null || newContent.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Message content cannot be empty"));
            }
            
            Message updatedMessage = messageService.editMessage(userDetails.getUsername(), messageId, newContent.trim());
            
            logger.info("Message edited successfully: {}", messageId);
            return ResponseEntity.ok(ApiResponse.success(
                new MessageDTO(updatedMessage), 
                "Message edited successfully"
            ));
        } catch (Exception e) {
            logger.error("Failed to edit message: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Delete a message
     * DELETE /api/chat/messages/{messageId}
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<String>> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Delete message request from user: {} for message: {}", userDetails.getUsername(), messageId);
        try {
            messageService.deleteMessage(userDetails.getUsername(), messageId);
            
            logger.info("Message deleted successfully: {}", messageId);
            return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", "Message deleted successfully"));
        } catch (Exception e) {
            logger.error("Failed to delete message: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}