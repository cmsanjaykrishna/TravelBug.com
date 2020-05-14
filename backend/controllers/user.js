const _ = require("lodash");
const User = require("../models/user");

exports.userById = (req, res, next, userId) => {
  User.findById(userId).exec((err, user) => {
    if (err || !user) {
      res.status(400).json({
        error: "User not found",
      });
    }
    req.profile = user;
    next();
  });
};

exports.hasAuthorisation = (req, res, next) => {
  const authorised = req.profile && req.auth && req.profile.id == req.auth.id;
  if (!authorised) {
    return res.status(403).json({
      error: "User not authorised",
    });
  }
};

exports.allUsers = (req, res) => {
  User.find((err, users) => {
    if (err) {
      return res.status(400).json({
        error: "error getting users",
      });
    }
    res.json(users);
  }).select("name email role");
};

exports.allUsersWPg = async (req, res) => {
  // get current page from req.query or use default value of 1
  const currentPage = req.query.page || 1;
  // return 10 users per page
  const perPage = 10;
  let totalItems;
  const users = await User.find()
    // countDocuments() gives you total count of trips
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return User.find()
        .skip((currentPage - 1) * perPage)
        .sort({ name: -1 })
        .limit(perPage)
        .select("name email role");
    })
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => console.log(err));
};

exports.getUser = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.updateUser = (req, res, next) => {
  let user = req.profile;
  user = _.extend(user, req.body);
  user.updated = Date.now();
  console.log(user);
  user.save((err) => {
    if (err) {
      return res.status(400).json({
        error: "You are not authorised to perform this action",
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({ user });
  });
};

exports.deleteUser = (req, res, next) => {
  let user = req.profile;
  user.remove((err, user) => {
    if (err) {
      return res.status(400).json({
        error: err,
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({ user });
  });
};
