import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken"

// Fetch all posts
export const getPosts = async (req, res) => {
  const query = req.query;
  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
    });
    setTimeout(()=>{
      res.status(200).json(posts);
    },3000)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// Fetch a single post by ID
export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    const token = req.cookies?.token;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (!err) {
          const saved = await prisma.savedPost.findUnique({
            where: {
              userId_postId: {
                postId: id,
                userId: payload.id,
              },
            },
          });
          res.status(200).json({ ...post, isSaved: saved ? true : false });
        }
      });
    }
    res.status(200).json({ ...post, isSaved: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};
// Add a new post
export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId; // Extract `userId` from token (via middleware)
  try {
    const newPost = await prisma.post.create({
      data: {
        ...body.postData,
        userId: tokenUserId,
        postDetail: {
          create: body.postDetail,
        },
      },
    });
    res.status(200).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// Update an existing post
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { body } = req;
  const tokenUserId = req.userId;
  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId !== tokenUserId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { ...body },
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update post" });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    // Fetch the post to ensure it exists and belongs to the user
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    // Delete the associated PostDetail first
    await prisma.postDetail.delete({
      where: { postId: id },
    });

    // Then delete the Post
    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};