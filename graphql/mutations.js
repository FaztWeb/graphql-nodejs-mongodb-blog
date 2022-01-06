const { GraphQLString, GraphQLID, GraphQLNonNull } = require("graphql");
const { User, Post, Comment } = require("../models");
const { createJWTToken } = require("../util/auth");
const { PostType, CommentType } = require("./types");

const register = {
  type: GraphQLString,
  args: {
    username: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    displayName: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const { username, email, password, displayName } = args;
    const user = new User({ username, email, password, displayName });

    console.log(args);

    await user.save();
    const token = createJWTToken(user);

    return token;
  },
};

const login = {
  type: GraphQLString,
  args: {
    email: { type: GraphQLString },
    password: { type: GraphQLString },
  },
  async resolve(parent, args) {
    const user = await User.findOne({ email: args.email }).select("+password");
    if (!user || args.password !== user.password) {
      throw new Error("Invalid Credentials");
    }

    const token = createJWTToken(user);
    return token;
  },
};

const createPost = {
  type: PostType,
  description: "create a new blog post",
  args: {
    title: { type: GraphQLString },
    body: { type: GraphQLString },
  },
  async resolve(parent, args, { verifiedUser }) {
    if (!verifiedUser) {
      throw new Error("You must be logged in to do that");
    }

    const userFound = await User.findById(verifiedUser._id);
    if (!userFound) throw new Error("UnAuthorized");

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
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    body: { type: GraphQLString },
  },
  async resolve(parent, args, { verifiedUser }) {
    if (!verifiedUser) throw new Error("Unauthorized");

    const postUpdated = await Post.findOneAndUpdate(
      { _id: args.id, authorId: verifiedUser._id },
      { title: args.title, body: args.body },
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
    postId: { type: GraphQLID },
  },
  async resolve(parent, args, { verifiedUser }) {
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
    comment: { type: GraphQLString },
    postId: { type: GraphQLID },
  },
  resolve(parent, args, { verifiedUser }) {
    const comment = new Comment({
      userId: verifiedUser._id,
      postId: args.postId,
      comment: args.comment,
    });
    return comment.save();
  },
};

const updateComment = {
  type: CommentType,
  description: "update a comment",
  args: {
    id: { type: GraphQLID },
    comment: { type: new GraphQLNonNull(GraphQLString) },
  },
  async resolve(parent, args, { verifiedUser }) {
    if (!verifiedUser) throw new Error("UnAuthorized");

    const commentUpdated = await Comment.findOneAndUpdate(
      {
        _id: args.id,
        userId: verifiedUser._id,
      },
      {
        comment: args.comment,
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
    commentId: { type: new GraphQLNonNull(GraphQLID) },
  },
  async resolve(parent, args, { verifiedUser }) {
    console.log(args);
    if (!verifiedUser) throw new Error("Unauthorized");

    const commentDelete = await Comment.findOneAndDelete({
      _id: args.commentId,
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
