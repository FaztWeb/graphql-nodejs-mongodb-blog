const { GraphQLString, GraphQLID, GraphQLNonNull } = require("graphql");
const { User, Post, Comment } = require("../models");
const { auth, bcrypt } = require("../util");
const { PostType, CommentType } = require("./types");

const register = {
  type: GraphQLString,
  args: {
    username: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    displayName: { type: new GraphQLNonNull(GraphQLString) },
  },
  async resolve(_, { username, email, password, displayName }) {
    const user = new User({ username, email, password, displayName });
    user.password = await bcrypt.encryptPassword(user.password);
    await user.save();

    const token = auth.createJWTToken({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    });
    return token;
  },
};

const login = {
  type: GraphQLString,
  args: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
  },
  async resolve(_, { email, password }) {
    const user = await User.findOne({ email }).select("+password");

    if (!user) throw new Error("Invalid Username");

    const validPassword = await bcrypt.comparePassword(password, user.password);

    if (!validPassword) throw new Error("Invalid Password");

    const token = auth.createJWTToken({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    });

    return token;
  },
};

const createPost = {
  type: PostType,
  description: "create a new blog post",
  args: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    body: { type: new GraphQLNonNull(GraphQLString) },
  },
  async resolve(_, args, { verifiedUser }) {
    if (!verifiedUser) throw new Error("You must be logged in to do that");

    const userFound = await User.findById(verifiedUser._id);
    if (!userFound) throw new Error("Unauthorized");

    const post = new Post({
      authorId: verifiedUser._id,
      title: args.title,
      body: args.body,
    });

    return post.save();
  },
};

const updatePost = {
  type: PostType,
  description: "update a blog post",
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    body: { type: new GraphQLNonNull(GraphQLString) },
  },
  async resolve(_, { id, title, body }, { verifiedUser }) {
    if (!verifiedUser) throw new Error("Unauthorized");

    const postUpdated = await Post.findOneAndUpdate(
      { _id: id, authorId: verifiedUser._id },
      { title, body },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!postUpdated) throw new Error("No post for given id");

    return postUpdated;
  },
};

const deletePost = {
  type: GraphQLString,
  description: "Delete post",
  args: {
    postId: { type: new GraphQLNonNull(GraphQLID) },
  },
  async resolve(_, args, { verifiedUser }) {
    const postDeleted = await Post.findOneAndDelete({
      _id: args.postId,
      authorId: verifiedUser._id,
    });
    if (!postDeleted)
      throw new Error("No post with given ID Found for the author");

    return "Post deleted";
  },
};

const addComment = {
  type: CommentType,
  description: "Create a new comment for a blog post",
  args: {
    comment: { type: new GraphQLNonNull(GraphQLString) },
    postId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve(_, { postId, comment }, { verifiedUser }) {
    const newComment = new Comment({
      userId: verifiedUser._id,
      postId,
      comment,
    });
    return newComment.save();
  },
};

const updateComment = {
  type: CommentType,
  description: "update a comment",
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    comment: { type: new GraphQLNonNull(GraphQLString) },
  },
  async resolve(_, { id, comment }, { verifiedUser }) {
    if (!verifiedUser) throw new Error("UnAuthorized");

    const commentUpdated = await Comment.findOneAndUpdate(
      {
        _id: id,
        userId: verifiedUser._id,
      },
      {
        comment,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!commentUpdated) throw new Error("No comment with the given ID");

    return commentUpdated;
  },
};

const deleteComment = {
  type: GraphQLString,
  description: "delete a comment",
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  async resolve(_, { id }, { verifiedUser }) {
    if (!verifiedUser) throw new Error("Unauthorized");

    const commentDelete = await Comment.findOneAndDelete({
      _id: id,
      userId: verifiedUser._id,
    });

    if (!commentDelete)
      throw new Error("No comment with the given ID for the user");

    return "Comment deleted";
  },
};

module.exports = {
  register,
  login,
  createPost,
  addComment,
  updatePost,
  deletePost,
  updateComment,
  deleteComment,
};
