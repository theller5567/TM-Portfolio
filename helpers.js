/*
  This is a file of data and helper functions
*/

// FS is a built in module to node that let's us read files from the system we're running on
const fs = require('fs');

// moment.js is a handy library for displaying dates
exports.moment = require('moment');

// Dump is a handy debugging function
exports.dump = (obj) => JSON.stringify(obj, null, 2);

// inserting an SVG
exports.icon = (name) => fs.readFileSync(`./public/images/icons/${name}.svg`);

// Some details about the site
exports.siteName = `TMH Portfolio`;

exports.menu = [
  { slug: '/projects', title: 'Work', icon: 'project', },
  { slug: '/about', title: 'About', icon: 'about', },
  { slug: '/contact', title: 'Contact', icon: 'contact', }
];
