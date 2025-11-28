// src/Utils/Task/CommentApi.js

const API_BASE_URL = "http://127.0.0.1:8000/api/";

/**
 * Get all comments for a specific task
 * @param {string} taskId - The task ID
 * @returns {Promise} Promise with comments data
 */
export const getTaskComments = async (taskId) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}comments/${taskId}/`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching task comments:', error);
        throw error;
    }
};

/**
 * Create a new comment
 * @param {Object} commentData - Comment data
 * @param {string} commentData.task_id - Task ID
 * @param {string} commentData.user_id - User ID
 * @param {string} commentData.user_full_name - User full name
 * @param {string} commentData.content - Comment content
 * @param {string} commentData.comment_type - Type of comment (text/code)
 * @param {string} commentData.language - Programming language for code comments
 * @param {string} commentData.mentioned_user_ids - Comma-separated user IDs
 * @param {string} commentData.mentioned_usernames - Comma-separated usernames
 * @returns {Promise} Promise with created comment data
 */
export const createComment = async (commentData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}comments/add/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_id: commentData.task_id,
            user_id: commentData.user_id,
            content: commentData.content,
            comment_type: commentData.comment_type,
            language: commentData.language,
            mentioned_usernames: commentData.mentioned_usernames || '',
            mentioned_user_ids: commentData.mentioned_user_ids || ''
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

/**
 * Create a reply to a comment with attachments
 * @param {Object} replyData - Reply data
 * @param {string} replyData.parent_comment_id - Parent comment ID
 * @param {string} replyData.task_id - Task ID
 * @param {string} replyData.user_id - User ID
 * @param {string} replyData.user_full_name - User full name
 * @param {string} replyData.content - Reply content
 * @param {File[]} replyData.attachments - Array of attachment files
 * @returns {Promise} Promise with created reply data
 */
export const createReply = async (replyData) => {
    try {
        const formData = new FormData();

        // Add text fields
        formData.append('parent_comment_id', replyData.parent_comment_id);
        formData.append('task_id', replyData.task_id);
        formData.append('user_id', replyData.user_id);
        formData.append('user_full_name', replyData.user_full_name);
        formData.append('content', replyData.content);

        // Add attachments if any
        if (replyData.attachments && replyData.attachments.length > 0) {
            replyData.attachments.forEach((file, index) => {
                formData.append('attachments', file);
            });
        }

        const response = await fetch(
            `${API_BASE_URL}comments/reply/`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating reply:', error);
        throw error;
    }
};

/**
 * Upload attachments for a comment
 * @param {Object} uploadData - Upload data
 * @param {string} uploadData.comment_id - Comment ID
 * @param {string} uploadData.uploaded_by - User ID who uploaded
 * @param {File} uploadData.file - File to upload
 * @returns {Promise} Promise with upload result
 */
export const uploadCommentAttachment = async (uploadData) => {
    try {
        const formData = new FormData();
        formData.append('comment_id', uploadData.comment_id);
        formData.append('uploaded_by', uploadData.uploaded_by);
        formData.append('file', uploadData.file);

        const response = await fetch(
            `${API_BASE_URL}comments/attachments/upload/`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error uploading comment attachment:', error);
        throw error;
    }
};

/**
 * Upload multiple attachments for a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @param {File[]} files - Array of files to upload
 * @returns {Promise} Promise with upload results
 */
export const uploadMultipleAttachments = async (commentId, userId, files) => {
    try {
        const uploadPromises = files.map(file =>
            uploadCommentAttachment({
                comment_id: commentId,
                uploaded_by: userId,
                file: file
            })
        );

        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('Error uploading multiple attachments:', error);
        throw error;
    }
};

/**
 * Create comment with attachments in two steps:
 * 1. First create comment via /comments/add/
 * 2. Then upload attachments via /comments/attachments/upload/
 * @param {Object} commentData - Comment data for first API
 * @param {File[]} files - Array of files to upload
 * @returns {Promise} Promise with combined result
 */
export const createCommentWithAttachments = async (commentData, files = []) => {
    try {
        const commentResult = await createComment(commentData);

        if (!commentResult.success) {
            throw new Error('Failed to create comment');
        }

        // ✅ Log the response to inspect its structure
        console.log("createComment response:", commentResult);

        // ✅ Try to extract comment_id safely
        const commentId =
            commentResult.comment?.comment_id ||
            commentResult.comment_id ||
            commentResult.data?.comment_id;

        if (!commentId) {
            throw new Error('Missing comment_id in createComment response');
        }

        if (files.length > 0) {
            const currentUserId = sessionStorage.getItem("user_id");
            const uploadPromises = files.map(file =>
                uploadCommentAttachment({
                    comment_id: commentId,
                    uploaded_by: currentUserId,
                    file: file
                })
            );

            const attachmentResults = await Promise.all(uploadPromises);

            return {
                ...commentResult,
                attachments: attachmentResults
            };
        }

        return commentResult;
    } catch (error) {
        console.error('Error creating comment with attachments:', error);
        throw error;
    }
};


/**
 * Add a reaction to a comment
 * @param {Object} reactionData - Reaction data
 * @param {string} reactionData.comment_id - Comment ID
 * @param {string} reactionData.user_id - User ID
 * @param {string} reactionData.reaction - Emoji reaction
 * @returns {Promise} Promise with reaction data
 */
export const addReaction = async (reactionData) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}comments/react/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reactionData),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding reaction:', error);
        throw error;
    }
};

/**
 * Remove a reaction from a comment
 * @param {Object} reactionData - Reaction data
 * @param {string} reactionData.comment_id - Comment ID
 * @param {string} reactionData.user_id - User ID
 * @param {string} reactionData.reaction - Emoji reaction to remove
 * @returns {Promise} Promise with removal result
 */
export const removeReaction = async (reactionData) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}comments/unreact/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reactionData),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error removing reaction:', error);
        throw error;
    }
};

// Add this to your Utils/Task/CommentApi.js or create a new API file
export const getTaskUsers = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}comments/task-users/${taskId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch task users');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching task users:', error);
      throw error;
    }
  };

export default {
    getTaskComments,
    createComment,
    createReply,
    addReaction,
    removeReaction,
    uploadCommentAttachment,
    uploadMultipleAttachments,
};