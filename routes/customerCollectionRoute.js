const router = require('express').Router();
const passport = require('../config/passportConfig');


module.exports = (customerDetail, rentalCar) => {

    //DON'T erase the below code yet !
    //middleware function. checks if a user is logged in
    // const isLoggedIn = (req, res, next) => {
    //     if (req.isAuthenticated()) return next(); //go through
    //     res.redirect('/'); //if not, redirect to index
    // };

    router.use(function (req, res, next) {
        console.log("/" + req.method);
        // console.log(req.user);
        next();
    });

    router.get('/', (request, response) => {

        customerDetail.find({}, (err, customers) => {
            if (err)
                console.log(err);
            response.send(customers);
        })
    });

    router.get('/loginfail', (request, response) => {
        // send a flash error message that's in the request object from here
        response.render('index');
    });

    router.get('/loggedout', (request, response) => {
        response.render('index');
    });

    //customer gets sent here when the registration is done
    router.get('/registered', (request, response) => {
        response.render('index');
    });

    //when click on register link
    router.get('/register', (request, response) => {
        response.render('registerForm', {title: 'Register', bodytag: 'registerBody'});
    });

    //check login
    router.post('/registeruser', (request, response) => {

        var name = request.body.name;
        var email = request.body.email;
        var username = request.body.username;
        var phone = request.body.phone;
        var password = request.body.password;
        var password2 = request.body.password2;

        //Validation
        request.checkBody('name', 'Name is required').notEmpty();
        request.checkBody('email', 'Email is required').notEmpty();
        request.checkBody('email', 'Email is not mail').isEmail();
        request.checkBody('username', 'Username is required').notEmpty();
        request.checkBody('password', 'Password is required').notEmpty();
        request.checkBody('password2', 'Passwords do not match').equals(request.body.password);

        var errors = request.validationErrors();

        if (errors) {
            console.log(errors);
            response.render('registerForm', {errors: errors, bodytag: 'registerBodyFaulty'});
        }

        else {

            var newCustomer = new customerDetail({
                name: name,
                email: email,
                phone: phone,
                username: username,
                password: password
            });
            customerDetail.createUser(newCustomer, (err, user) => {
                if (err) throw err;
                console.log(user);
            });

            response.redirect('registered');
        }
    });

    // login
    router.post('/login',
        passport.authenticate('local', {successRedirect: '/', failureRedirect: 'loginfail'})
    );

    router.get('/logout', (request, response) => {
        request.logout();
        response.redirect('/')
    });

    router.post('/checkout', (request, response) => {

        var carIds = request.body.carIds,
            startdate = request.body.startdate,
            enddate = request.body.enddate,
            user = request.user;

        rentalCar.find({
                '_id': {$in: carIds}
            },
            (err, cars) => {
                cars.push(cars);
                console.log(cars);
                response.render('checkoutForm', {
                    bodytag: 'registerBody',
                    carIds: carIds,
                    cars: cars,
                    user: user,
                    confirmed: false, //newly added
                    startdate: startdate,
                    enddate: enddate
                });
            }
        );
    });

    router.post('/confirm', (request, response) => {

        var user = request.user;
        var userId;

        if (user) {
            userId = request.user.id;
        }

        var selectedcarIds = JSON.parse(request.body.selectedcarIds);
        var confirmedenddate = request.body.confirmedenddate;
        var confirmedstartdate = request.body.confirmedstartdate;


        rentalCar.findByIdAndUpdate(
            {$in: selectedcarIds}, {
                startdate: confirmedstartdate,
                enddate: confirmedenddate,
                bookerid: userId,
                booked: true
            }, {new: true},
            (err, cars) => {

                if (err)
                    throw err;

                response.render('checkoutForm', {
                    bodytag: 'registerBody',
                    user: user,
                    cars: cars,
                    confirmed: true,
                    confirmedenddate: confirmedenddate,
                    confirmedstartdate: confirmedstartdate
                });
            }
        );
    });

    router.get('/member', (request, response) => {
        response.render('memberPage', {bodytag: 'registerBody'});

    });

    router.post('/summary', (request, response) => {

        var user = request.user;
        if (user) {

            userId = request.user.id;
        }

        rentalCar.find({'bookerid': userId},

            (err, cars) => {

            var isEmpty = false;

                if (err)
                    console.log(err);

                if(cars.length === 0)
                    isEmpty = true;
                else
                    isEmpty = false;

                console.log(isEmpty);
                console.log(cars);
                response.render('orderSummary', {bodytag: 'registerBody', cars: cars, isEmpty: isEmpty})
            }
        );

    });

    router.post('/cancel', (request, response) => {

        var user = request.user;
        var userId;
        var carId = request.body.carId;

        console.log(carId);

        if (user) {

            userId = request.user.id;
        }

        rentalCar.findByIdAndUpdate(
            carId,

            {
                startdate: null,
                enddate: null,
                bookerid: "",
                booked: false
            },
            {
                new: true
            },
            (err, car) => {
                if (err)
                    throw error;

                console.log("this is the car that is updated", car);

                response.render('index', {
                    bodytag: 'registerBody',
                    user: user,
                    canceled: true,
                    cancelMessage: "you booking was canceled"
                });
            }
        );

    });

    return router;
};
