const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
    productName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;