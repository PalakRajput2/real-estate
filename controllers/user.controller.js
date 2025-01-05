import prisma from "../lib/prisma.js";
import bcrypt from"bcrypt"
// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Failed to get users!" });
  }
};

// Get a single user
export const getUser = async (req, res) => {
  const { id } = req.params; // Extract user ID from request parameters

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      // If user is not found, respond and exit the function
      return res.status(404).json({ message: "User not found!" });
    }

    // If user is found, send the user data and exit the function
    return res.status(200).json(user);
  } catch (error) {
    // Log the error and send an appropriate response
    console.error("Error fetching user:", error);

    // Exit after sending the error response
    return res.status(500).json({ message: "Failed to get user!" });
  }
};



// Update user details
export const updateUser = async (req, res) => {
  const { id } = req.params; // Extract user ID from request parameters
  const tokenUserId = req.userId; // Assuming this comes from middleware
  const { password, avatar, ...inputs } = req.body; // The new user data to update

  // Authorization check
  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not authorized!" });
  }
  
  let updatedPassword = null;
  try {
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(updatedPassword && { password: updatedPassword }),
        ...(avatar && { avatar }),
      },
    });

    // Remove the password from the response before sending it back
    const { password: userPassword, ...rest } = updatedUser;

    return res.status(200).json(rest); // Send back the updated user without password
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Failed to update user!" });
  }
};
// Delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params; // Extract user ID from request parameters
  const tokenUserId = req.userId; // Assuming this comes from middleware

  // Authorization check
  if (id !== tokenUserId) {
    return res.status(403).json({ message: "Not authorized!" });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    return res.status(200).json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Failed to delete user!" });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  if (!postId || !tokenUserId) {
    return res.status(400).json({ message: "Post ID and User ID are required." });
  }

  try {
    const existingSavedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (existingSavedPost) {
      await prisma.savedPost.delete({
        where: {
          id: existingSavedPost.id,
        },
      });
      return res.status(200).json({ message: "Post removed from saved list." });
    } else {
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });
      return res.status(200).json({ message: "Post saved successfully." });
    }
  } catch (error) {
    console.error("Error saving/removing post:", error);
    return res.status(500).json({ message: "Failed to save/remove post." });
  }
};

export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const userPosts = await prisma.post.findMany({
      where: { userId: tokenUserId },
    });
    const saved = await prisma.savedPost.findMany({
      where: { userId: tokenUserId },
      include: {
        post: true,
      },
    });

    const savedPosts = saved.map((item) => item.post);
    res.status(200).json({ userPosts, savedPosts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};

export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const number = await prisma.chat.count({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
        NOT: {
          seenBy: {
            hasSome: [tokenUserId],
          },
        },
      },
    });
    res.status(200).json(number);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get notifications!" });
  }
};