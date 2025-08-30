package com.medapp.repository;

import com.medapp.model.Message;
import com.medapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    
    /**
     * Find all messages between two users, ordered by sent time
     */
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.sentAt ASC")
    List<Message> findMessagesBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    /**
     * Find all conversations for a user (distinct conversation partners)
     */
    @Query("SELECT DISTINCT " +
           "CASE WHEN m.sender = :user THEN m.receiver ELSE m.sender END " +
           "FROM Message m WHERE m.sender = :user OR m.receiver = :user")
    List<User> findConversationPartners(@Param("user") User user);
    
    /**
     * Find the latest message between two users
     */
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.sentAt DESC")
    List<Message> findLatestMessageBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    /**
     * Count unread messages for a user
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver = :user AND m.isRead = false")
    long countUnreadMessages(@Param("user") User user);
    
    /**
     * Count unread messages between two specific users
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender = :sender AND m.receiver = :receiver AND m.isRead = false")
    long countUnreadMessagesBetweenUsers(@Param("sender") User sender, @Param("receiver") User receiver);
    
    /**
     * Find messages sent to a user that are unread
     */
    List<Message> findByReceiverAndIsReadOrderBySentAtDesc(User receiver, boolean isRead);
    
    /**
     * Delete all messages sent by a user
     */
    @Modifying
    @Query("DELETE FROM Message m WHERE m.sender = :user")
    void deleteBySender(@Param("user") User user);
    
    /**
     * Delete all messages received by a user
     */
    @Modifying
    @Query("DELETE FROM Message m WHERE m.receiver = :user")
    void deleteByReceiver(@Param("user") User user);
    
    /**
     * Delete all messages involving a user (as sender or receiver)
     */
    @Modifying
    @Query("DELETE FROM Message m WHERE m.sender = :user OR m.receiver = :user")
    void deleteAllMessagesInvolvingUser(@Param("user") User user);
}