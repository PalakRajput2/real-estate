import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user and save to database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    console.log("User created:", newUser);
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res
      .status(500)
      .json({ message: "Failed to create user!", error: error.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if the username exists in the database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.warn("Login failed: User not found");
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.warn("Login failed: Incorrect password");
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Generate and send a cookie token to the
    const age = 1000 * 60 * 60 * 24 * 21; // Cookie expiration time (14 days)
    const token = jwt.sign(
      {
        id: user.id,
        isAdmin : false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );
    const { password: userPassword, ...userInfo } = user;

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: age,
      // secure: true, // Uncomment if using HTTPS
    });

    res.status(200).json(userInfo);
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: "Failed to login", error: error.message });
  }
};

export const logout = (req, res) => {
  try {
    // Clear the authentication cookie
    res
      .clearCookie("token", {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: "strict",
        path: "/", // Match the path used when setting the cookie
      })
      .status(200)
      .json({ message: "Logout successful" });

    console.log("User logged out successfully");
  } catch (error) {
    console.error("Error during logout:", error.message);
    res.status(500).json({ message: "Failed to logout", error: error.message });
  }
};
