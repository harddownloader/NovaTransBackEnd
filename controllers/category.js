const Category = require("../models/Category");
const _ = require("lodash");

exports.categoryById = async (req, res, next, id) => {
  const category = await Category.findById(id);

  if (!category) {
    return res.status(400).json({
      error: "Category not found"
    });
  }
  req.category = category; // adds category object in req with category info
  next();
};

exports.add = async (req, res) => {
  const category = new Category(req.body);

  await category.save();

  res.json(category);
};

exports.getCategories = async (req, res) => {
  const category = await Category.find({}).sort({ name: 1 });

  res.json(category);
};

exports.read = async (req, res) => {
  res.json(req.category);
};

exports.update = async (req, res) => {
  let category = req.category;

  category = _.extend(category, req.body);

  await category.save();

  res.json(category);
};

exports.remove = async (req, res) => {
  let category = req.category;

  await category.remove();

  res.json({ message: "Category removed successfully" });
};
