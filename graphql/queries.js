const { GraphQLList, GraphQLID } = require("graphql");
const { UserType, PostType, CommentType } = require("./types");
const { User, Post, Comment } = require("../models");

const users = {
  type: new GraphQLList(UserType),
  description: "Retrieves a list of users",
  resolve(parent, args) {
    return User.find();
  },
};

const user = {
  type: UserType,
  description: "retrieves a single user",
  args: {
    id: { type: GraphQLID },
  },
  resolve(parent, args) {
    return User.findById(args.id);
  },
};

const posts = {
  type: new GraphQLList(PostType),
  description: "retrieves a list of posts",
  resolve() {
    return Post.find();
  },
};

const post = {
  type: PostType,
  description: "retrieves a single post",
  args: { id: { type: GraphQLID } },
  resolve(_, args) {
    return Post.findById(args.id);
  },
};

const comments = {
  type: new GraphQLList(CommentType),
  description: "Retrieves list of commnets",
  resolve() {
    return Comment.find();
  },
};

const comment = {
  type: CommentType,
  description: "Retrieves a single comment",
  args: {
    id: { type: GraphQLID },
  },
  resolve() {
    return Comment.findById(args.id);
  },
};

module.exports = { users, user, posts, post, comments, comment };
