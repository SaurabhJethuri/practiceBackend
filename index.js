const express = require('express');
const app = express();
const port = 3000; // You can choose any available port
const mongoose = require('mongoose');
const Product = require("./models/datatype.js");
const path = require("path");
const methodOverride = require("method-override");
const ExpressError = require('./utils/ExpressError.js');
const wrapAsync = require('./utils/wrapAsync.js');
const session = require('express-session');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedin, saveredirectUrl, isowner } = require("./middleware.js");


main()
    .then(() => {
        console.log("DB connected");
    })
    .catch((err) => {
        console.log(err)
    });

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/amazonproduct');
}
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.set(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));



//session associate without website
const sessionOption = {
    secret: "Rahul@7900",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
//here we told npm passport to we use localstrategy and impliment authentication on my model
passport.use(new LocalStrategy(User.authenticate()));

// serializeUser() Generates a function that is used by Passport to serialize users into the session
// deserializeUser() Generates a function that is used by Passport to deserialize users into the session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

app.post("/signin", wrapAsync(async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeUser = await User.register(newUser, password);
        req.login(registeUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "user was registered and logged in successfully");
            res.redirect("/products");

        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");

    };

}));

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.post("/login",
    saveredirectUrl,
    passport.authenticate("local",
        {
            failureRedirect: "/login",
            failureFlash: true,
        }
    ),
    async (req, res) => {
        req.flash("success", "you login successfully");
        const saveUrl = (res.locals.redirectUrl || "/products")
        // console.log(res.locals.redirectUrl);
        res.redirect(saveUrl);

    });

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you are logged out");
        res.redirect("/products");

    })
})



app.get("/products", wrapAsync(async (req, res) => {
    const allproducts = await Product.find({});
    res.render("products.ejs", { allproducts });
}));

app.get('/products/new', isLoggedin, (req, res) => {
    res.render("new.ejs");
})

app.get("/products/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let product = await Product.findById(id).populate("owner");
    if (!product) {
        req.flash("error", " this product not exist");
        res.redirect("/products");
    }
    console.log(product);
    res.render("product.ejs", { product });
}));
app.post("/products", isLoggedin, wrapAsync(async (req, res, next) => {
    let product = req.body.product;
    if (!product) {
        throw new ExpressError(400, "send valid data");
    };
    const newProduct = new Product(product);
    newProduct.owner = req.user._id;
    await newProduct.save();
    req.flash("success", " New Product added");
    res.redirect("/products");


    // let { productName, description, imageURL, price } = req.body;
    // let sampleproduct = new Product({
    //     productName: productName,
    //     description: description,
    //     image: imageURL,
    //     price: price,

    // });
    // await sampleproduct.save();
    // const newProduct = new Product(req.body.product);
    // await newProduct.save();



}));
app.get("/products/edit/:id", isLoggedin, isowner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let product = await Product.findById(id);
    res.render("edit.ejs", { product });
}));

app.put("/products/:id", isLoggedin, isowner, wrapAsync(async (req, res) => {
    let product = req.body.product;
    if (!product) {
        throw new ExpressError(400, "send valid data");
    };
    let { id } = req.params;
    await Product.findByIdAndUpdate(id, { ...req.body.product });
    res.redirect("/products");

}));
app.delete("/products/:id", isLoggedin, isowner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.redirect("/products");


}));


app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not Found"))
})


app.use((err, req, res, next) => {
    let { status = 500, message = "Something went Wrong" } = err;
    res.status(status).send(message);

})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/products`);
});