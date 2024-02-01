
const Product = require("./models/datatype.js");

module.exports.isLoggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in first");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveredirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isowner = async (req, res, next) => {
    let { id } = req.params;
    let product = await Product.findById(id);
    if (!product.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "you have not owner");
        return res.redirect(`/products/${id}`);
    }
    next();
};