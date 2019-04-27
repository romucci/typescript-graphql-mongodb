import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

const auth = {
  // REGISTER
  register: async (newUser, models) => {
    const user = newUser;

    // CHECK IF PASSWORDS MATCH
    if (user.password === user.confirm) {
      // CHECK IF EMAIL EXISTS
      const validEmail = await models.User.findOne({ email: user.email });
      if (validEmail) {
        throw new Error("Email is already taken");
      }

      // HASH PASSWORD AND CREATE USER
      user.password = await bcrypt.hash(user.password, 12);
      return await models.User.create(user);
    }

    throw new Error("Passwords do not match");
  },
  // LOGIN
  login: async (email, password, models, SECRET) => {
    // CHECK IF EMAIL EXISTS
    const user = await models.User.findOne({ email });
    if (!user) {
      throw new Error("Email does not exist");
    }

    // CHECK IF PASSWORD MATCHES
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Wrong password");
    }

    // GET THE TOKENS AND RETURN THEM ALONG WITH USER
    const [token, refreshToken] = await auth.createTokens(user, SECRET);

    return {
      isAdmin: user.isAdmin,
      token,
      refreshToken
    };
  },

  // GET TOKEN
  createTokens: async ({ _id, isAdmin }, SECRET) => {
    // CREATE TOKEN
    const createToken = jwt.sign({ user: { _id, isAdmin } }, SECRET, {
      expiresIn: "20m"
    });

    // CREATE REFRESH TOKEN
    const createRefreshToken = jwt.sign({ user: { _id } }, SECRET, {
      expiresIn: "7d"
    });

    return Promise.all([createToken, createRefreshToken]);
  },

  // REFRESH TOKENS
  refreshTokens: async (token, refreshToken, models, SECRET) => {
    let userId = -1;

    // VERIFY TOKEN
    try {
      const {
        user: { _id }
      } = await jwt.verify(refreshToken, SECRET);
      userId = _id;
    } catch (err) {
      return {};
    }

    // CREATE NEW TOKENS
    const user = await models.User.findOne({ _id: userId });
    const [newToken, newRefreshToken] = await auth.createTokens(user, SECRET);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      user
    };
  },

  // ADD USER TO CONTEXT
  addUser: async (req, res, next, models, SECRET) => {
    // GET TOKEN FROM HEADERS
    const token = req.headers["x-token"];
    // CHECK IF TOKEN IS VALID
    if (token) {
      try {
        const { user } = await jwt.verify(token, SECRET);
        req.user = user;
      } catch (err) {
        // GET REFRESH TOKEN AND REFRESH THE TOKENS
        const refreshToken = req.headers["x-refresh-token"];
        const newTokens = await auth.refreshTokens(
          token,
          refreshToken,
          models,
          SECRET
        );
        // SET NEW TOKENS TO HEADERS
        if (newTokens.token && newTokens.refreshToken) {
          res.set("Access-Control-Expose-Headers", "x-token, x-refresh-token");
          res.set("x-token", newTokens.token);
          res.set("x-refresh-token", newTokens.refreshToken);
        }
        req.user = newTokens.user;
      }
    }
    next();
  },

  // UPDATE USER LAST LOGIN
  updateLastLogin: async user => {
    user.online = true;
    user.lastLogin = Date.now();
    await user.save();
  },

  logout: async (models, user) => {
    const id = user._id;
    return await models.User.findOneAndUpdate(
      { _id: id },
      { online: false },
      { new: true }
    );
  }
};
export default auth;
