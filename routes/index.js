const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(projectController.getHome));

router.get('/projects', catchErrors(projectController.getProjects));
router.get('/add-project', authController.isLoggedIn, projectController.addProject);
router.get('/projects/page/:page', catchErrors(projectController.getProjects));
router.get('/projects/:id/edit', catchErrors(projectController.editProject));
router.get('/project/:slug', catchErrors(projectController.getProjectBySlug));

router.get('/contact', projectController.contactPage);
router.get('/about', projectController.aboutPage);

router.post('/add-project',
  projectController.upload,
  catchErrors(projectController.resize),
  catchErrors(projectController.createProject)
);
router.post('/delete-project/:id', catchErrors(projectController.deleteProject));

router.post('/add-project/:id',
  projectController.upload,
  catchErrors(projectController.resize),
  catchErrors(projectController.updateProject)
);

router.get('/tags', catchErrors(projectController.getSProjectsByTag));
router.get('/tags/:tag', catchErrors(projectController.getSProjectsByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

// 1. Validate the registration data
// 2. register the user
// 3. we need to log them in
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);

router.get('/top', catchErrors(projectController.getTopProjects));

/*
  API
*/

router.get('/api/search', catchErrors(projectController.searchProjects));
router.get('/api/projects/near', catchErrors(projectController.mapProjects));

module.exports = router;
