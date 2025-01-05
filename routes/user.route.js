import express from "express";
import { getUser, getUsers, updateUser, deleteUser ,savePost ,profilePosts , getNotificationNumber} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js"; 

const router = express.Router();

router.get("/", getUsers); // Route to fetch all users
//router.get("/:id", verifyToken, getUser); // Route to fetch a single user by ID
router.put("/:id", verifyToken, updateUser); // Route to update a user
router.delete("/:id", verifyToken, deleteUser); // Route to delete a user
router.post("/save",verifyToken,savePost);
router.get("/profilePosts",verifyToken,profilePosts);
router.get("/notification",verifyToken,getNotificationNumber);


export default router;
