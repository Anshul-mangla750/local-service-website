const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required().min(0),
<<<<<<< HEAD
    image: Joi.object({
        url: Joi.string(),
        filename: Joi.string()
    }).optional(),
=======
>>>>>>> f18e5a6e32fca98a21fff606ebe71830bc5919ba
    location: Joi.string().required(),
    category: Joi.string().required(),
});
