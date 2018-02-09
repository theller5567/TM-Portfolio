const mongoose = require('mongoose');
const Project = mongoose.model('Project');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next({ message: 'That filetype isn\'t allowed!' }, false);
        }
    }
};

exports.getHome = async (req, res) => {
    res.render('home', { title: `Travis M Heller`});
};

exports.getProjects = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 6;
    const skip = (page * limit) - limit;

    // 1. Query the database for a list of all projects
    const projectsPromise = Project
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' });

    const countPromise = Project.count();

    const [projects, count] = await Promise.all([projectsPromise, countPromise]);
    const pages = Math.ceil(count / limit);
    if (!projects.length && skip) {
        req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
        res.redirect(`/projects/page/${pages}`);
        return;
    }

    res.render('projects', { title: 'Projects', projects, page, pages, count });
};

exports.addProject = (req, res) => {
    res.render('editProject', { title: 'Add Project' });
};

exports.createProject = async (req, res) => {
    req.body.author = req.user._id;
    const project = await (new Project(req.body)).save();
    //req.flash('success', `Successfully Created ${project.name}. Care to leave a review?`);
    res.redirect(`/project/${project.slug}`);
};

exports.deleteProject = async (req,res) => {
    // 1. Find the store given the ID
    const project = await Project.deleteOne({ _id: req.params.id });
    console.log('PROJECT TO DELETE: ', project);
    res.redirect('/projects');
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // check if there is no new file to resize
    if (!req.file) {
        next(); // skip to the next middleware
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/projects/${req.body.photo}`);
    next();
};

exports.editProject = async (req, res) => {
    // 1. Find the project given the ID
    const project = await Project.findOne({ _id: req.params.id });
    // 2. confirm they are the owner of the projects
    confirmOwner(project, req.user);
    // 3. Render out the edit form so the user can update their projects
    res.render('editProject', { title: `Edit ${project.name}`, project });
};

exports.updateProject = async (req, res) => {
    // find and update the projects
    const project = await Project.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, // return the new projects instead of the old one
        runValidators: true
    }).exec();
    //req.flash('success', `Successfully updated <strong>${project.name}</strong>. <a href="/projects/${project.slug}">View Project →</a>`);
    res.render('project', { project, title: project.name });
    // Redriect them to projects and tell them it worked
};

exports.getProjectBySlug = async (req, res, next) => {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) return next();
    res.render('project', { project, title: project.name });
};

exports.contactPage = (req, res) => {
    res.render('contact', { title: 'Contact Me' });
};

exports.aboutPage = (req, res) => {
    res.render('about', { title: 'About Me' });
};

const confirmOwner = (project, user) => {
    if (!project.author.equals(user._id)) {
        throw Error('You must own a project in order to edit it!');
    }
};
