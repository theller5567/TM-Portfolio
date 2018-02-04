const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a project name!'
    },
    slug: String,
    short_description: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    link: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
}, {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    });

// Define our indexes
projectSchema.index({
    name: 'text',
    description: 'text'
});

projectSchema.pre('save', async function (next) {
    if (!this.isModified('name')) {
        next(); // skip it
        return; // stop this function from running
    }
    this.slug = slug(this.name);
    // find other projects that have a slug of wes, wes-1, wes-2
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const projectsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (projectsWithSlug.length) {
        this.slug = `${this.slug}-${projectsWithSlug.length + 1}`;
    }
    next();
    // TODO make more resiliant so slugs are unique
});

projectSchema.statics.getTagsList = function () {
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
};

projectSchema.statics.getTopProjects = function () {
    return this.aggregate([
        // Lookup Projects and populate their reviews
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'project', as: 'reviews' } },
        // filter for only items that have 2 or more reviews
        { $match: { 'reviews.1': { $exists: true } } },
        // Add the average reviews field
        {
            $project: {
                photo: '$$ROOT.photo',
                name: '$$ROOT.name',
                reviews: '$$ROOT.reviews',
                slug: '$$ROOT.slug',
                averageRating: { $avg: '$reviews.rating' }
            }
        },
        // sort it by our new field, highest reviews first
        { $sort: { averageRating: -1 } },
        // limit to at most 10
        { $limit: 10 }
    ]);
}

// find reviews where the projects _id property === reviews project property
projectSchema.virtual('reviews', {
    ref: 'Review', // what model to link?
    localField: '_id', // which field on the project?
    foreignField: 'project' // which field on the review?
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}

projectSchema.pre('find', autopopulate);
projectSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Project', projectSchema);
