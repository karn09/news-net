'use strict';

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'ngMaterial']);

app.config(function ($urlRouterProvider, $locationProvider, $mdThemingProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });

    $mdThemingProvider.theme('default').primaryPalette('blue-grey').accentPalette('blue-grey');
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'app/home/home.html'
    });
});
app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'app/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
        controller: function controller($scope, SecretStash) {
            SecretStash.getStash().then(function (stash) {
                $scope.stash = stash;
            });
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.factory('SecretStash', function ($http) {

    var getStash = function getStash() {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('pages', {
        url: '/pages',
        templateUrl: 'app/pages/pages.html', //Still need to make
        controller: 'PagesCtrl'
    });
});

app.controller('PagesCtrl', function ($scope, PagesFactory) {

    PagesFactory.getSaved().then(function (response) {
        $scope.pages = response;
    });
});
app.config(function ($stateProvider) {

    $stateProvider.state('parser', {
        url: '/parser',
        templateUrl: 'app/parser/parser.html',
        controller: 'ParserCtrl'
    });
});

app.controller('ParserCtrl', function ($scope, $state, ParserFactory, Session) {

    $scope.parseUrl = function () {

        //console.log("inside parserCtrl parseUrl: session user: ", Session.user._id);

        ParserFactory.parseUrl($scope.url, Session.user._id).then(function (response) {
            console.log(response);
            $scope.parsed = response;
        });
    };
});

app.controller('dialogFormCtrl', function ($mdDialog, ParserFactory, Session) {
    this.close = function () {
        $mdDialog.cancel();
    };
    this.submit = function (type, data) {
        // if type category, send to category api
        // if type url, send to url api
        if (type === 'url') {
            ParserFactory.parseUrl(data, Session.user._id).then(function (response) {
                $mdDialog.hide();
                $scope.parsed = response;
            });
        } else if (type === 'category') {
            // not set up yet
            $mdDialog.hide();
        }
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('articles', {
        url: '/articles',
        templateUrl: 'app/articles/articles.html'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('article', {
        url: '/article',
        templateUrl: 'app/article-view/article-view.html',
        resolve: {
            current: function current(ArticleViewFactory) {
                return ArticleViewFactory.getArticleById();
            }
        },
        controller: 'ArticleViewCtrl'
    });
});

app.controller('ArticleViewCtrl', function ($scope, current, $compile) {
    $scope.current = current;
    $scope.title = current.title;
    $scope.content = current.content;
});

app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.', 'Gimme 3 mins... I just grabbed this really dope frittata', 'If Cooper could offer only one piece of advice, it would be to nevSQUIRREL!'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

app.factory('articleDetailFactory', function ($http) {
    var detailObj = {};

    detailObj.fetchAll = function () {
        return $http.get("/api/pages").then(function (response) {
            return response.data;
        });
    };

    detailObj.fetchAllByCategory = function (category) {
        // return all titles and summaries associated with current category
    };

    detailObj.fetchOneById = function (id) {
        return $http.get("/api/pages/" + id).then(function (response) {
            return response.data;
        });
    };

    detailObj.addArticle = function (category) {
        // add one article to category
    };

    detailObj.removeArticleByID = function () {
        // remove on article by ID
    };

    detailObj.saveArticleByUrl = function (url, category) {
        // default to all, or optional category
    };

    return detailObj;
});

app.factory('ArticleViewFactory', function ($http) {
    var articleViewObj = {};

    articleViewObj.getArticleById = function (id) {
        return tempArticleObj;
    };

    articleViewObj.removeArticleById = function (id) {};

    articleViewObj.addArticleCategory = function (id, cat) {};

    return articleViewObj;
});

var tempArticleObj = {
    "__v": 0,
    "content": "<div><article class=\"content link-underline relative body-copy\">\n\n\t\t\t<p>In 1932, the Dutch astronomer Jan Oort tallied the stars in the Milky Way and found that they came up short. Judging by the way the stars bob up and down like horses on a carousel as they go around the plane of the galaxy, Oort calculated that there ought to be twice as much matter gravitationally propelling them as he could see. He postulated the presence of hidden &#x201C;dark matter&#x201D; to make up the difference and surmised that it must be concentrated in a disk to explain the stars&#x2019; motions.</p>\n\n\n<p>But credit for the discovery of dark matter&#x2014;the invisible, unidentified stuff that comprises five-sixths of the universe&#x2019;s mass&#x2014;usually goes to the Swiss-American astronomer Fritz Zwicky, who inferred its existence from the relative motions of galaxies in 1933. Oort is passed over on the grounds that he was trailing a false clue. By 2000, updated, Oort-style inventories of the Milky Way determined that its &#x201C;missing&#x201D; mass consists of faint stars, gas and dust, with no need for a dark disk. Eighty years of hints suggest that dark matter, whatever it is, forms spherical clouds called &#x201C;halos&#x201D; around galaxies.</p>\n<p>Or so most dark matter hunters have it. Though it fell out of favor, the dark disk idea never completely went away. And recently, it has found a high-profile champion in <a href=\"https://www.physics.harvard.edu/people/facpages/randall\" target=\"_blank\">Lisa Randall</a>, a professor of physics at Harvard University, who has rescued the disk from scientific oblivion and given it an active role on the galactic stage.</p>\n<p>Since <a href=\"http://arxiv.org/pdf/1303.1521v2.pdf\" target=\"_blank\">proposing the model</a> in 2013, Randall and her collaborators have argued that a dark disk might explain gamma rays coming from the galactic center, the <a href=\"http://www.nature.com/nature/journal/v511/n7511/full/nature13481.html\" target=\"_blank\">planar distribution of dwarf galaxies</a> orbiting the Andromeda galaxy and the Milky Way, and even <a href=\"https://physics.aps.org/featured-article-pdf/10.1103/PhysRevLett.112.161301\" target=\"_blank\">periodic upticks of comet impacts</a> and mass extinctions on Earth, discussed in Randall&#x2019;s 2015 popular-science book, <em>Dark Matter and the Dinosaurs</em>.</p>\n<p>But astrophysicists who do inventories of the Milky Way have protested, arguing that the galaxy&#x2019;s total mass and the bobbing motions of its stars match up too well to leave room for a dark disk. &#x201C;It&#x2019;s more strongly constrained than Lisa Randall pretends,&#x201D; said <a href=\"http://astro.utoronto.ca/~bovy/\" target=\"_blank\">Jo Bovy</a>, an astrophysicist at the University of Toronto.</p>\n<p>Now, Randall, who has devised influential ideas about several of the <a href=\"https://www.quantamagazine.org/20150803-physics-theories-map/\" target=\"_blank\">biggest questions in fundamental physics</a>, is fighting back. In <a href=\"http://arxiv.org/abs/1604.01407\" target=\"_blank\">a paper</a> posted online last week that has been accepted for publication in <em>The Astrophysical Journal</em>, Randall and her student, Eric Kramer, report a disk-shaped loophole in the Milky Way analysis: &#x201C;There is an important detail that has so far been overlooked,&#x201D; they write. &#x201C;The disk can actually make room for itself.&#x201D;</p>\n<figure class=\"wp-caption landscape alignnone fader relative\"><img class=\"size-text-column-width wp-image-2022255\" src=\"https://www.wired.com/wp-content/uploads/2016/05/061014_randall_1627_310575_904518-615x410-482x321.jpg\" alt=\"061014_Randall_1627.jpg\" width=\"482\"><figcaption class=\"wp-caption-text link-underline\">Lisa Randall of Harvard University is a high-profile supporter of the controversial dark disk idea.<span class=\"credit link-underline-sm\">Rose Lincoln/Harvard University</span></figcaption></figure>\n<p>If there is a thin dark disk coursing through the &#x201C;midplane&#x201D; of the galaxy, Randall and Kramer argue, then it will gravitationally pinch other matter inward, resulting in a higher density of stars, gas and dust at the midplane than above and below. Researchers typically estimate the total visible mass of the Milky Way by extrapolating outward from the midplane density; if there&#x2019;s a pinching effect, then this extrapolation leads to an overestimation of the visible mass, making it seem as if the mass matches up to the stars&#x2019; motions. &#x201C;That&#x2019;s the reason why a lot of these previous studies did not see evidence for a dark disk,&#x201D; Kramer said. He and Randall find that a thin dark disk is possible&#x2014;and in one way of redoing the analysis, slightly favored over no dark disk.</p>\n<p>&#x201C;Lisa&#x2019;s work has reopened the case,&#x201D; said <a href=\"http://astronomy.swin.edu.au/staff/cflynn.html\" target=\"_blank\">Chris Flynn</a> of Swinburne University of Technology in Melbourne, Australia, who, with Johan Holmberg, conducted a series of Milky Way inventories in the early aughts that seemed to <a href=\"http://onlinelibrary.wiley.com/doi/10.1046/j.1365-8711.2000.02905.x/abstract\">robustly sweep it clean</a> of a dark disk.</p>\n<p>Bovy disagrees. Even taking the pinching effect into account, he estimates that at most 2 percent of the total amount of dark matter can lie in a dark disk, while the rest must form a halo. &#x201C;I think most people want to figure out what 98 percent of the dark matter is about, not what 2 percent of it is about,&#x201D; he said.</p>\n<p>The debate&#x2014;and the fate of the dark disk&#x2014;will probably be decided soon. The European Space Agency&#x2019;s Gaia satellite is currently surveying the positions and velocities of one billion stars, and a definitive inventory of the Milky Way could be completed as soon as next summer.</p>\n<p>The discovery of a dark disk, of any size, would be enormously revealing. If one exists, dark matter is far more complex than researchers have long thought. Matter settles into a disk shape only if it is able to shed energy, and the easiest way for it to shed sufficient energy is if it forms atoms. The existence of dark atoms would mean dark protons and dark electrons that are charged in a similar style as visible protons and electrons, interacting with each other via a dark force that is conveyed by dark photons. Even if 98 percent of dark matter is inert, and forms halos, the existence of even a thin dark disk would imply a rich &#x201C;dark sector&#x201D; of unknown particles as diverse, perhaps, as the visible universe. &#x201C;Normal matter is pretty complex; there&#x2019;s stuff that plays a role in atoms and there&#x2019;s stuff that doesn&#x2019;t,&#x201D; said <a href=\"http://www.physics.uci.edu/~bullock/\" target=\"_blank\">James Bullock</a>, an astrophysicist at the University of California, Irvine. &#x201C;So it&#x2019;s not crazy to imagine that the other five-sixths [of the matter in the universe] is pretty complex, and that there&#x2019;s some piece of that dark sector that winds up in bound atoms.&#x201D;</p>\n<p>The notion that <a href=\"https://www.quantamagazine.org/20150820-the-case-for-complex-dark-matter/\" target=\"_blank\">dark matter might be complex</a> has gained traction in recent years, aided by astrophysical anomalies that do not gel with the long-reigning profile of dark matter as passive, sluggish &#x201C;weakly interacting massive particles.&#x201D; These anomalies, plus the failure of &#x201C;WIMPs&#x201D; to show up in exhaustive experimental searches all over the world, have weakened the WIMP paradigm, and ushered in a new, free-for-all era, in which the nature of the dark beast is anybody&#x2019;s guess.</p>\n<p>The field started opening up around 2008, when an experiment called PAMELA detected an excess of positrons over electrons coming from space&#x2014;an asymmetry that fueled interest in &#x201C;<a href=\"http://arxiv.org/abs/0901.4117\" target=\"_blank\">asymmetric dark matter</a>,&#x201D; a now-popular model proposed by <a href=\"http://www-theory.lbl.gov/wordpress/?page_id=6851\" target=\"_blank\">Kathryn Zurek</a> and collaborators. At the time, there were few ideas other than WIMPs in play. &#x201C;There were model-builders like me who realized that dark matter was just extraordinarily underdeveloped in this direction,&#x201D; said Zurek, now of Lawrence Berkeley National Laboratory in California. &#x201C;So we dove in.&#x201D;</p>\n<figure class=\"wp-caption landscape alignnone fader relative\"><img class=\"size-text-column-width wp-image-2022259\" src=\"https://www.wired.com/wp-content/uploads/2016/05/024_ProfBullock-615x500-482x392.jpg\" alt=\"James Bullock of the University of California, Irvine, sees dark matter as potentially complex and self-interacting, but not necessarily concentrated in thin disks.\" width=\"482\"><figcaption class=\"wp-caption-text link-underline\">James Bullock of the University of California, Irvine, sees dark matter as potentially complex and self-interacting, but not necessarily concentrated in thin disks.<span class=\"credit link-underline-sm\">Jonathan Alcorn for Quanta Magazine</span></figcaption></figure>\n<p>Another trigger has been the density of dwarf galaxies. When researchers try to simulate their formation, dwarf galaxies typically turn out too dense in their centers, unless researchers assume that dark matter particles interact with one another via dark forces. Add too much interactivity, however, and you muck up simulations of structure formation in the early universe. &#x201C;What we&#x2019;re trying to do is figure out what is allowed,&#x201D; said Bullock, who builds such simulations. Most modelers add weak interactions that don&#x2019;t affect the halo shape of dark matter. But &#x201C;remarkably,&#x201D; Bullock said, &#x201C;there is a class of dark matter that allows for disks.&#x201D; In that case, only a tiny fraction of dark matter particles interact, but they do so strongly enough to dissipate energy&#x2014;and then form disks.</p>\n<p>Randall and her collaborators JiJi Fan, Andrey Katz and Matthew Reece made their way to this idea in 2013 by the same path as Oort: They were trying to explain an apparent Milky Way anomaly. Known as the &#x201C;Fermi line,&#x201D; it was an excess of gamma rays of a certain frequency coming from the galactic center. &#x201C;Ordinary dark matter wouldn&#x2019;t annihilate enough&#x201D; to produce the Fermi line, Randall said, &#x201C;so we thought, what if it was much denser?&#x201D; The dark disk was reborn. The Fermi line vanished as more data accumulated, but the disk idea seemed worth exploring anyway. In 2014, Randall and Reece hypothesized that the disk might account for possible 30- to 35-million-year intervals between escalated meteor and comet activity, a statistically weak signal that some scientists have tentatively tied to periodic mass extinctions. Each time the solar system bobs up or down through the dark disk on the Milky Way carousel, they argued, the disk&#x2019;s gravitational effect might destabilize rocks and comets in the Oort cloud&#x2014;a scrapyard on the outskirts of the solar system named for Jan Oort. These objects would go hurtling toward the inner solar system, some striking Earth.</p>\n<p>But Randall and her team did only a cursory&#x2014;and incorrect&#x2014;analysis of how much room there is for a dark disk in the Milky Way&#x2019;s mass budget, judging by the motions of stars. &#x201C;They made some kind of outrageous claims,&#x201D; Bovy said.</p>\n<p>Randall, who stands out (according to Reece) for &#x201C;her persistence,&#x201D; put Kramer on the case, seeking to address the critics and, she said, &#x201C;to iron out all the wrinkles&#x201D; in the analysis before Gaia data becomes available. Her and Kramer&#x2019;s new analysis shows that the dark disk, if it exists, cannot be as dense as her team initially thought possible. But there is indeed wiggle room for a thin dark disk yet, due both to its pinching effect and to additional uncertainty caused by a net drift in the Milky Way stars that have been monitored thus far.</p>\n\n\n\n<p>Now there&#x2019;s a new problem, <a href=\"http://iopscience.iop.org/article/10.1088/0004-637X/814/1/13\" target=\"_blank\">raised</a> in <em>The Astrophysical Journal</em> by <a href=\"http://astro.berkeley.edu/faculty-profile/chris-mckee\" target=\"_blank\">Chris McKee</a> of the University of California, Berkeley, and collaborators. McKee concedes that a thin dark disk can still be squeezed into the Milky Way&#x2019;s mass budget. But the disk might be so thin that it would collapse. Citing research from the 1960s and &#x2019;70s, McKee and colleagues argue that disks cannot be significantly thinner than the disk of visible gas in the Milky Way without fragmenting. &#x201C;It is possible that the dark matter they consider has some property that is different from ordinary matter and prevents this from happening, but I don&#x2019;t know what that could be,&#x201D; McKee said.</p>\n<p>Randall has not yet parried this latest attack, calling it &#x201C;a tricky issue&#x201D; that is &#x201C;under consideration now.&#x201D; She has also taken on the point raised by Bovy&#x2014;that a disk of charged dark atoms is irrelevant next to the nature of 98 percent of dark matter. She is now investigating the possibility that all dark matter might be charged under the same dark force, but because of a surplus of dark protons over dark electrons, only a tiny fraction become bound in atoms and wind up in a disk. In that case, the disk and halo would be made of the same ingredients, &#x201C;which would be more economical,&#x201D; she said. &#x201C;We thought that would be ruled out, but it wasn&#x2019;t.&#x201D;</p>\n<p>The dark disk survives, for now&#x2014;a symbol of all that isn&#x2019;t known about the dark side of the universe. &#x201C;I think it&#x2019;s very, very healthy for the field that you have people thinking about all kinds of different ideas,&#x201D; said Bullock. &#x201C;Because it&#x2019;s quite true that we don&#x2019;t know what the heck that dark matter is, and you need to be open-minded about it.&#x201D;</p>\n<p><em><a href=\"https://www.quantamagazine.org/20160412-debate-intensifies-over-dark-disk-theory/\" target=\"_blank\">Original story</a> reprinted with permission from <a href=\"https://www.quantamagazine.org\" target=\"_blank\">Quanta Magazine</a>, an editorially independent publication of the <a href=\"https://www.simonsfoundation.org\" target=\"_blank\">Simons Foundation</a> whose mission is to enhance public understanding of science by covering research developments and trends in mathematics and the physical and life sciences.</em></p>\n\n\t\t\t<a class=\"visually-hidden skip-to-text-link focusable bg-white\" href=\"http://www.wired.com/2016/06/debate-intensifies-dark-disk-theory/#start-of-content\">Go Back to Top. Skip To: Start of Article.</a>\n\n\t\t\t\n\t\t</article>\n\n\t\t</div>",
    "datePublished": "2016-06-04 00:00:00",
    "domain": "www.wired.com",
    "excerpt": "In 1932, the Dutch astronomer Jan Oort tallied the stars in the Milky Way and found that they came up short. Judging by the way the stars bob up and down like horses on a carousel as they go around&hellip;",
    "leadImageUrl": "https://www.wired.com/wp-content/uploads/2016/05/061014_randall_1627_310575_904518-615x410-482x321.jpg",
    "title": "A Disk of Dark Matter Might Run Through Our Galaxy",
    "url": "http://www.wired.com/2016/06/debate-intensifies-dark-disk-theory/",
    "_id": "5752ee5522afb2d40b85f267"
};

app.factory('PagesFactory', function ($http) {
    var PagesFactory = {};

    PagesFactory.getSaved = function () {
        return $http.get("/api/pages").then(function (response) {
            return response.data;
        });
    };

    return PagesFactory;
});
app.factory('ParserFactory', function ($http) {

    var ParserFactory = {};

    ParserFactory.parseUrl = function (url, userid, categories) {
        //1. parse the Url
        //2. post to pages
        //3. add page to user's list
        //4. add page to categories

        var encoded = encodeURIComponent(url);
        return $http.get("/api/parser/" + encoded).then(function (result) {
            //console.log("userid: ", userid);
            return $http.post("/api/pages", result.data).then(function (pageResponse) {
                //console.log("page parsed: ", pageResponse.data);
                return $http.put("/api/users/addPage/" + userid, { page: pageResponse.data._id }).then(function (res) {
                    if (categories) {
                        var toUpdate = [];
                        for (var i = 0; i < categories.length; i++) {
                            //console.log("adding page to category: ", categories[i]);
                            toUpdate.push($http.put("/api/categories/addPage/" + categories[i], { page: pageResponse.data._id }));
                        }
                        console.log("toUpdate: ", toUpdate);
                        return Promise.all(toUpdate).then(function (response) {
                            //console.log("all categories updated");
                            return pageResponse.data;
                        });
                    } else {
                        return pageResponse.data;
                    }
                });
            });
        });
    };

    return ParserFactory;
});

app.directive('articleDetail', function () {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/common/directives/articleDetailCard/detail.html',
        link: function link(scope, element, attribute) {}

    };
});

app.directive('bindCompiledHtml', ['$compile', function ($compile) {
    return {
        template: '<div></div>',
        scope: {
            rawHtml: '=bindCompiledHtml'
        },
        link: function link(scope, elem) {
            var imgs = [];
            scope.$watch('rawHtml', function (value) {
                if (!value) return;
                var newElem = $compile(value)(scope.$parent);
                elem.contents().remove();
                imgs = newElem.find('img');
                for (var i = 0; i < imgs.length; i++) {

                    imgs[i].addClass = 'floatRight';
                }
                elem.append(newElem);
            });
        }
    };
}]);

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'app/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, $mdSidenav, $mdInkRipple) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/common/directives/navbar/navbar.html',
        link: function link(scope, element) {

            scope.toggle = function () {
                $mdSidenav("left").toggle();
            };

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'Parser', state: 'parser' }, { label: 'Pages', state: 'pages' }, { label: 'Members Only', state: 'membersOnly', auth: true }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'app/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
app.directive('sidebar', function () {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/common/directives/sidebar/sidebar.html',
        link: function link(scope) {
            $(".menu-up").click(function () {
                if ($(this).css('transform') !== 'none') {
                    $(this).css("transform", "");
                    if ($(this).attr('id') === 'subscriptions-icon') $('#subscriptions').show(400);
                    if ($(this).attr('id') === 'folders-icon') $('#folders').show(400);
                } else {
                    $(this).css("transform", "rotate(180deg)");
                    if ($(this).attr('id') === 'subscriptions-icon') $('#subscriptions').hide(400);
                    if ($(this).attr('id') === 'folders-icon') $('#folders').hide(400);
                }
            });
        }
    };
});

app.directive('speedDial', function ($mdDialog, $state, $rootScope) {
    return {
        restrict: 'E',
        scope: {},
        controller: function controller($state, $rootScope) {
            // $watch($state.current, function(val) {
            // 	console.log(val)
            // })
            // console.log($state.current)
            // $rootScope.$watch($state.current.name, function (oldVal, newVal) {
            // 	console.log(this)
            // 	console.log(oldVal, newVal)
            // })
        },
        templateUrl: '/app/common/directives/speed-dial/speed-dial.html',
        link: function link(scope, element, attribute) {
            scope.isOpen = false;
            scope.count = 0;
            scope.hidden = false;
            scope.hover = false;
            console.log(scope);
            scope.items = [{
                name: "Add URL",
                icon: "/assets/icons/ic_add_white_36px.svg",
                type: "url",
                direction: "top"
            }, {
                name: "Add Category",
                type: "category",
                icon: "/assets/icons/ic_playlist_add_white_36px.svg",
                direction: "bottom"
            }];

            scope.openDialog = function ($event, item) {
                $mdDialog.show({
                    scope: this,
                    preserveScope: true,
                    clickOutsideToClose: true,
                    controller: 'dialogFormCtrl',
                    controllerAs: 'dialog',
                    templateUrl: '/app/popup-dialog/popup-dialog.html',
                    targetEvent: $event,
                    locals: {
                        item: item
                    }
                });
            };
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZzYS9mc2EtcHJlLWJ1aWx0LmpzIiwiaG9tZS9ob21lLmpzIiwibG9naW4vbG9naW4uanMiLCJtZW1iZXJzLW9ubHkvbWVtYmVycy1vbmx5LmpzIiwicGFnZXMvcGFnZXMuanMiLCJwYXJzZXIvcGFyc2VyLmpzIiwicG9wdXAtZGlhbG9nL3BvcHVwLWRpYWxvZy5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVEZXRhaWwuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVWaWV3LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9wYWdlcy5mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9wYXJzZXIuZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FydGljbGVEZXRhaWxDYXJkL2RldGFpbC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2JpbmRDb21waWxlZEh0bWwvYmluZENvbXBpbGVkSHRtbC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2lkZWJhci9zaWRlYmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc3BlZWQtZGlhbC9zcGVlZC1kaWFsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBLE9BQUEsR0FBQSxHQUFBLFFBQUEsTUFBQSxDQUFBLHVCQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxDQUFBLENBQUE7O0FBRUEs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QUEsQ0FBQTtBQUNBLHNCQUFBLFNBREE7QUFFQSxzQkFBQSxxQ0FGQTtBQUdBLHNCQUFBLEtBSEE7QUFJQSwyQkFBQTtBQUpBLGFBQUEsRUFLQTtBQUNBLHNCQUFBLGNBREE7QUFFQSxzQkFBQSxVQUZBO0FBR0Esc0JBQUEsOENBSEE7QUFJQSwyQkFBQTtBQUpBLGFBTEEsQ0FBQTs7QUFhQSxrQkFBQSxVQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsMEJBQUEsSUFBQSxDQUFBO0FBQ0EsMkJBQUEsSUFEQTtBQUVBLG1DQUFBLElBRkE7QUFHQSx5Q0FBQSxJQUhBO0FBSUEsZ0NBQUEsZ0JBSkE7QUFLQSxrQ0FBQSxRQUxBO0FBTUEsaUNBQUEscUNBTkE7QUFPQSxpQ0FBQSxNQVBBO0FBUUEsNEJBQUE7QUFDQSw4QkFBQTtBQURBO0FBUkEsaUJBQUE7QUFZQSxhQWJBO0FBZUE7QUFoREEsS0FBQTtBQWtEQSxDQW5EQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ25nTWF0ZXJpYWwnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRtZFRoZW1pbmdQcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xuXG4gICAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdkZWZhdWx0JylcbiAgICAgICAgLnByaW1hcnlQYWxldHRlKCdibHVlLWdyZXknKVxuICAgICAgICAuYWNjZW50UGFsZXR0ZSgnYmx1ZS1ncmV5Jyk7XG5cbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2hvbWUvaG9tZS5odG1sJ1xuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpe1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwYWdlcycsIHtcblx0ICAgIHVybDogJy9wYWdlcycsXG5cdCAgICB0ZW1wbGF0ZVVybDogJ2FwcC9wYWdlcy9wYWdlcy5odG1sJywgLy9TdGlsbCBuZWVkIHRvIG1ha2Vcblx0ICAgIGNvbnRyb2xsZXI6ICdQYWdlc0N0cmwnXG5cdH0pO1xuXG59KVxuXG5hcHAuY29udHJvbGxlcignUGFnZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBQYWdlc0ZhY3Rvcnkpe1xuXG5cdFBhZ2VzRmFjdG9yeS5nZXRTYXZlZCgpXG5cdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHQkc2NvcGUucGFnZXMgPSByZXNwb25zZTtcblx0fSlcblxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BhcnNlcicsIHtcbiAgICAgICAgdXJsOiAnL3BhcnNlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL3BhcnNlci9wYXJzZXIuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQYXJzZXJDdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1BhcnNlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIFBhcnNlckZhY3RvcnksIFNlc3Npb24pIHtcblxuICAgICRzY29wZS5wYXJzZVVybCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5zaWRlIHBhcnNlckN0cmwgcGFyc2VVcmw6IHNlc3Npb24gdXNlcjogXCIsIFNlc3Npb24udXNlci5faWQpO1xuXG4gICAgICAgIFBhcnNlckZhY3RvcnkucGFyc2VVcmwoJHNjb3BlLnVybCwgU2Vzc2lvbi51c2VyLl9pZClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgJHNjb3BlLnBhcnNlZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuXG4gICAgfTtcblxufSk7XG5cblxuIiwiYXBwLmNvbnRyb2xsZXIoJ2RpYWxvZ0Zvcm1DdHJsJywgZnVuY3Rpb24gKCRtZERpYWxvZywgUGFyc2VyRmFjdG9yeSwgU2Vzc2lvbikge1xuXHR0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuXHRcdCRtZERpYWxvZy5jYW5jZWwoKTtcblx0fTtcblx0dGhpcy5zdWJtaXQgPSBmdW5jdGlvbiAodHlwZSwgZGF0YSkge1xuXHRcdC8vIGlmIHR5cGUgY2F0ZWdvcnksIHNlbmQgdG8gY2F0ZWdvcnkgYXBpXG5cdFx0Ly8gaWYgdHlwZSB1cmwsIHNlbmQgdG8gdXJsIGFwaVxuXHRcdGlmICh0eXBlID09PSAndXJsJykge1xuXHRcdFx0UGFyc2VyRmFjdG9yeS5wYXJzZVVybChkYXRhLCBTZXNzaW9uLnVzZXIuX2lkKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkbWREaWFsb2cuaGlkZSgpO1xuXHRcdFx0XHRcdCRzY29wZS5wYXJzZWQgPSByZXNwb25zZTtcblx0XHRcdFx0fSk7XG5cdFx0fSBlbHNlIGlmICh0eXBlID09PSAnY2F0ZWdvcnknKSB7XG4gICAgICAvLyBub3Qgc2V0IHVwIHlldFxuXHRcdFx0JG1kRGlhbG9nLmhpZGUoKTtcblx0XHR9XG5cdH1cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlcycsIHtcbiAgICAgICAgdXJsOiAnL2FydGljbGVzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJ0aWNsZXMvYXJ0aWNsZXMuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlJywge1xuICAgICAgICB1cmw6ICcvYXJ0aWNsZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FydGljbGUtdmlldy9hcnRpY2xlLXZpZXcuaHRtbCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICBjdXJyZW50OiBmdW5jdGlvbihBcnRpY2xlVmlld0ZhY3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnRpY2xlVmlld0ZhY3RvcnkuZ2V0QXJ0aWNsZUJ5SWQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBcnRpY2xlVmlld0N0cmwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0FydGljbGVWaWV3Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgY3VycmVudCwgJGNvbXBpbGUpIHtcbiAgICAkc2NvcGUuY3VycmVudCA9IGN1cnJlbnQ7XG4gICAgJHNjb3BlLnRpdGxlID0gY3VycmVudC50aXRsZTtcbiAgICAkc2NvcGUuY29udGVudCA9IGN1cnJlbnQuY29udGVudDtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuICIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdhcnRpY2xlRGV0YWlsRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG4gIHZhciBkZXRhaWxPYmogPSB7fTtcblxuICBkZXRhaWxPYmouZmV0Y2hBbGwgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhZ2VzXCIpXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfSlcbiAgfVxuXG4gIGRldGFpbE9iai5mZXRjaEFsbEJ5Q2F0ZWdvcnkgPSBmdW5jdGlvbihjYXRlZ29yeSkge1xuICAgIC8vIHJldHVybiBhbGwgdGl0bGVzIGFuZCBzdW1tYXJpZXMgYXNzb2NpYXRlZCB3aXRoIGN1cnJlbnQgY2F0ZWdvcnlcbiAgfTtcblxuICBkZXRhaWxPYmouZmV0Y2hPbmVCeUlkID0gZnVuY3Rpb24oaWQpIHtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KFwiL2FwaS9wYWdlcy9cIiArIGlkKVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pXG4gIH07XG5cbiAgZGV0YWlsT2JqLmFkZEFydGljbGUgPSBmdW5jdGlvbihjYXRlZ29yeSkge1xuICAgIC8vIGFkZCBvbmUgYXJ0aWNsZSB0byBjYXRlZ29yeVxuICB9O1xuXG4gIGRldGFpbE9iai5yZW1vdmVBcnRpY2xlQnlJRCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHJlbW92ZSBvbiBhcnRpY2xlIGJ5IElEXG4gIH07XG5cbiAgZGV0YWlsT2JqLnNhdmVBcnRpY2xlQnlVcmwgPSBmdW5jdGlvbih1cmwsIGNhdGVnb3J5KSB7XG4gICAgLy8gZGVmYXVsdCB0byBhbGwsIG9yIG9wdGlvbmFsIGNhdGVnb3J5XG4gIH1cblxuICByZXR1cm4gZGV0YWlsT2JqO1xufSlcbiIsImFwcC5mYWN0b3J5KCdBcnRpY2xlVmlld0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcblx0dmFyIGFydGljbGVWaWV3T2JqID0ge307XG5cblx0YXJ0aWNsZVZpZXdPYmouZ2V0QXJ0aWNsZUJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICByZXR1cm4gdGVtcEFydGljbGVPYmo7XG5cdH07XG5cblx0YXJ0aWNsZVZpZXdPYmoucmVtb3ZlQXJ0aWNsZUJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcblxuXHR9O1xuXG4gIGFydGljbGVWaWV3T2JqLmFkZEFydGljbGVDYXRlZ29yeSA9IGZ1bmN0aW9uIChpZCwgY2F0KSB7XG5cbiAgfTtcblxuXHRyZXR1cm4gYXJ0aWNsZVZpZXdPYmo7XG59KVxuXG5cbnZhciB0ZW1wQXJ0aWNsZU9iaiA9XG4gIHtcblx0XHRcIl9fdlwiOiAwLFxuXHRcdFwiY29udGVudFwiOiBcIjxkaXY+PGFydGljbGUgY2xhc3M9XFxcImNvbnRlbnQgbGluay11bmRlcmxpbmUgcmVsYXRpdmUgYm9keS1jb3B5XFxcIj5cXG5cXG5cXHRcXHRcXHQ8cD5JbiAxOTMyLCB0aGUgRHV0Y2ggYXN0cm9ub21lciBKYW4gT29ydCB0YWxsaWVkIHRoZSBzdGFycyBpbiB0aGUgTWlsa3kgV2F5IGFuZCBmb3VuZCB0aGF0IHRoZXkgY2FtZSB1cCBzaG9ydC4gSnVkZ2luZyBieSB0aGUgd2F5IHRoZSBzdGFycyBib2IgdXAgYW5kIGRvd24gbGlrZSBob3JzZXMgb24gYSBjYXJvdXNlbCBhcyB0aGV5IGdvIGFyb3VuZCB0aGUgcGxhbmUgb2YgdGhlIGdhbGF4eSwgT29ydCBjYWxjdWxhdGVkIHRoYXQgdGhlcmUgb3VnaHQgdG8gYmUgdHdpY2UgYXMgbXVjaCBtYXR0ZXIgZ3Jhdml0YXRpb25hbGx5IHByb3BlbGxpbmcgdGhlbSBhcyBoZSBjb3VsZCBzZWUuIEhlIHBvc3R1bGF0ZWQgdGhlIHByZXNlbmNlIG9mIGhpZGRlbiAmI3gyMDFDO2RhcmsgbWF0dGVyJiN4MjAxRDsgdG8gbWFrZSB1cCB0aGUgZGlmZmVyZW5jZSBhbmQgc3VybWlzZWQgdGhhdCBpdCBtdXN0IGJlIGNvbmNlbnRyYXRlZCBpbiBhIGRpc2sgdG8gZXhwbGFpbiB0aGUgc3RhcnMmI3gyMDE5OyBtb3Rpb25zLjwvcD5cXG5cXG5cXG48cD5CdXQgY3JlZGl0IGZvciB0aGUgZGlzY292ZXJ5IG9mIGRhcmsgbWF0dGVyJiN4MjAxNDt0aGUgaW52aXNpYmxlLCB1bmlkZW50aWZpZWQgc3R1ZmYgdGhhdCBjb21wcmlzZXMgZml2ZS1zaXh0aHMgb2YgdGhlIHVuaXZlcnNlJiN4MjAxOTtzIG1hc3MmI3gyMDE0O3VzdWFsbHkgZ29lcyB0byB0aGUgU3dpc3MtQW1lcmljYW4gYXN0cm9ub21lciBGcml0eiBad2lja3ksIHdobyBpbmZlcnJlZCBpdHMgZXhpc3RlbmNlIGZyb20gdGhlIHJlbGF0aXZlIG1vdGlvbnMgb2YgZ2FsYXhpZXMgaW4gMTkzMy4gT29ydCBpcyBwYXNzZWQgb3ZlciBvbiB0aGUgZ3JvdW5kcyB0aGF0IGhlIHdhcyB0cmFpbGluZyBhIGZhbHNlIGNsdWUuIEJ5IDIwMDAsIHVwZGF0ZWQsIE9vcnQtc3R5bGUgaW52ZW50b3JpZXMgb2YgdGhlIE1pbGt5IFdheSBkZXRlcm1pbmVkIHRoYXQgaXRzICYjeDIwMUM7bWlzc2luZyYjeDIwMUQ7IG1hc3MgY29uc2lzdHMgb2YgZmFpbnQgc3RhcnMsIGdhcyBhbmQgZHVzdCwgd2l0aCBubyBuZWVkIGZvciBhIGRhcmsgZGlzay4gRWlnaHR5IHllYXJzIG9mIGhpbnRzIHN1Z2dlc3QgdGhhdCBkYXJrIG1hdHRlciwgd2hhdGV2ZXIgaXQgaXMsIGZvcm1zIHNwaGVyaWNhbCBjbG91ZHMgY2FsbGVkICYjeDIwMUM7aGFsb3MmI3gyMDFEOyBhcm91bmQgZ2FsYXhpZXMuPC9wPlxcbjxwPk9yIHNvIG1vc3QgZGFyayBtYXR0ZXIgaHVudGVycyBoYXZlIGl0LiBUaG91Z2ggaXQgZmVsbCBvdXQgb2YgZmF2b3IsIHRoZSBkYXJrIGRpc2sgaWRlYSBuZXZlciBjb21wbGV0ZWx5IHdlbnQgYXdheS4gQW5kIHJlY2VudGx5LCBpdCBoYXMgZm91bmQgYSBoaWdoLXByb2ZpbGUgY2hhbXBpb24gaW4gPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucGh5c2ljcy5oYXJ2YXJkLmVkdS9wZW9wbGUvZmFjcGFnZXMvcmFuZGFsbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkxpc2EgUmFuZGFsbDwvYT4sIGEgcHJvZmVzc29yIG9mIHBoeXNpY3MgYXQgSGFydmFyZCBVbml2ZXJzaXR5LCB3aG8gaGFzIHJlc2N1ZWQgdGhlIGRpc2sgZnJvbSBzY2llbnRpZmljIG9ibGl2aW9uIGFuZCBnaXZlbiBpdCBhbiBhY3RpdmUgcm9sZSBvbiB0aGUgZ2FsYWN0aWMgc3RhZ2UuPC9wPlxcbjxwPlNpbmNlIDxhIGhyZWY9XFxcImh0dHA6Ly9hcnhpdi5vcmcvcGRmLzEzMDMuMTUyMXYyLnBkZlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnByb3Bvc2luZyB0aGUgbW9kZWw8L2E+IGluIDIwMTMsIFJhbmRhbGwgYW5kIGhlciBjb2xsYWJvcmF0b3JzIGhhdmUgYXJndWVkIHRoYXQgYSBkYXJrIGRpc2sgbWlnaHQgZXhwbGFpbiBnYW1tYSByYXlzIGNvbWluZyBmcm9tIHRoZSBnYWxhY3RpYyBjZW50ZXIsIHRoZSA8YSBocmVmPVxcXCJodHRwOi8vd3d3Lm5hdHVyZS5jb20vbmF0dXJlL2pvdXJuYWwvdjUxMS9uNzUxMS9mdWxsL25hdHVyZTEzNDgxLmh0bWxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5wbGFuYXIgZGlzdHJpYnV0aW9uIG9mIGR3YXJmIGdhbGF4aWVzPC9hPiBvcmJpdGluZyB0aGUgQW5kcm9tZWRhIGdhbGF4eSBhbmQgdGhlIE1pbGt5IFdheSwgYW5kIGV2ZW4gPGEgaHJlZj1cXFwiaHR0cHM6Ly9waHlzaWNzLmFwcy5vcmcvZmVhdHVyZWQtYXJ0aWNsZS1wZGYvMTAuMTEwMy9QaHlzUmV2TGV0dC4xMTIuMTYxMzAxXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cGVyaW9kaWMgdXB0aWNrcyBvZiBjb21ldCBpbXBhY3RzPC9hPiBhbmQgbWFzcyBleHRpbmN0aW9ucyBvbiBFYXJ0aCwgZGlzY3Vzc2VkIGluIFJhbmRhbGwmI3gyMDE5O3MgMjAxNSBwb3B1bGFyLXNjaWVuY2UgYm9vaywgPGVtPkRhcmsgTWF0dGVyIGFuZCB0aGUgRGlub3NhdXJzPC9lbT4uPC9wPlxcbjxwPkJ1dCBhc3Ryb3BoeXNpY2lzdHMgd2hvIGRvIGludmVudG9yaWVzIG9mIHRoZSBNaWxreSBXYXkgaGF2ZSBwcm90ZXN0ZWQsIGFyZ3VpbmcgdGhhdCB0aGUgZ2FsYXh5JiN4MjAxOTtzIHRvdGFsIG1hc3MgYW5kIHRoZSBib2JiaW5nIG1vdGlvbnMgb2YgaXRzIHN0YXJzIG1hdGNoIHVwIHRvbyB3ZWxsIHRvIGxlYXZlIHJvb20gZm9yIGEgZGFyayBkaXNrLiAmI3gyMDFDO0l0JiN4MjAxOTtzIG1vcmUgc3Ryb25nbHkgY29uc3RyYWluZWQgdGhhbiBMaXNhIFJhbmRhbGwgcHJldGVuZHMsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm8udXRvcm9udG8uY2EvfmJvdnkvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Sm8gQm92eTwvYT4sIGFuIGFzdHJvcGh5c2ljaXN0IGF0IHRoZSBVbml2ZXJzaXR5IG9mIFRvcm9udG8uPC9wPlxcbjxwPk5vdywgUmFuZGFsbCwgd2hvIGhhcyBkZXZpc2VkIGluZmx1ZW50aWFsIGlkZWFzIGFib3V0IHNldmVyYWwgb2YgdGhlIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZy8yMDE1MDgwMy1waHlzaWNzLXRoZW9yaWVzLW1hcC9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5iaWdnZXN0IHF1ZXN0aW9ucyBpbiBmdW5kYW1lbnRhbCBwaHlzaWNzPC9hPiwgaXMgZmlnaHRpbmcgYmFjay4gSW4gPGEgaHJlZj1cXFwiaHR0cDovL2FyeGl2Lm9yZy9hYnMvMTYwNC4wMTQwN1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmEgcGFwZXI8L2E+IHBvc3RlZCBvbmxpbmUgbGFzdCB3ZWVrIHRoYXQgaGFzIGJlZW4gYWNjZXB0ZWQgZm9yIHB1YmxpY2F0aW9uIGluIDxlbT5UaGUgQXN0cm9waHlzaWNhbCBKb3VybmFsPC9lbT4sIFJhbmRhbGwgYW5kIGhlciBzdHVkZW50LCBFcmljIEtyYW1lciwgcmVwb3J0IGEgZGlzay1zaGFwZWQgbG9vcGhvbGUgaW4gdGhlIE1pbGt5IFdheSBhbmFseXNpczogJiN4MjAxQztUaGVyZSBpcyBhbiBpbXBvcnRhbnQgZGV0YWlsIHRoYXQgaGFzIHNvIGZhciBiZWVuIG92ZXJsb29rZWQsJiN4MjAxRDsgdGhleSB3cml0ZS4gJiN4MjAxQztUaGUgZGlzayBjYW4gYWN0dWFsbHkgbWFrZSByb29tIGZvciBpdHNlbGYuJiN4MjAxRDs8L3A+XFxuPGZpZ3VyZSBjbGFzcz1cXFwid3AtY2FwdGlvbiBsYW5kc2NhcGUgYWxpZ25ub25lIGZhZGVyIHJlbGF0aXZlXFxcIj48aW1nIGNsYXNzPVxcXCJzaXplLXRleHQtY29sdW1uLXdpZHRoIHdwLWltYWdlLTIwMjIyNTVcXFwiIHNyYz1cXFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzA2MTAxNF9yYW5kYWxsXzE2MjdfMzEwNTc1XzkwNDUxOC02MTV4NDEwLTQ4MngzMjEuanBnXFxcIiBhbHQ9XFxcIjA2MTAxNF9SYW5kYWxsXzE2MjcuanBnXFxcIiB3aWR0aD1cXFwiNDgyXFxcIj48ZmlnY2FwdGlvbiBjbGFzcz1cXFwid3AtY2FwdGlvbi10ZXh0IGxpbmstdW5kZXJsaW5lXFxcIj5MaXNhIFJhbmRhbGwgb2YgSGFydmFyZCBVbml2ZXJzaXR5IGlzIGEgaGlnaC1wcm9maWxlIHN1cHBvcnRlciBvZiB0aGUgY29udHJvdmVyc2lhbCBkYXJrIGRpc2sgaWRlYS48c3BhbiBjbGFzcz1cXFwiY3JlZGl0IGxpbmstdW5kZXJsaW5lLXNtXFxcIj5Sb3NlIExpbmNvbG4vSGFydmFyZCBVbml2ZXJzaXR5PC9zcGFuPjwvZmlnY2FwdGlvbj48L2ZpZ3VyZT5cXG48cD5JZiB0aGVyZSBpcyBhIHRoaW4gZGFyayBkaXNrIGNvdXJzaW5nIHRocm91Z2ggdGhlICYjeDIwMUM7bWlkcGxhbmUmI3gyMDFEOyBvZiB0aGUgZ2FsYXh5LCBSYW5kYWxsIGFuZCBLcmFtZXIgYXJndWUsIHRoZW4gaXQgd2lsbCBncmF2aXRhdGlvbmFsbHkgcGluY2ggb3RoZXIgbWF0dGVyIGlud2FyZCwgcmVzdWx0aW5nIGluIGEgaGlnaGVyIGRlbnNpdHkgb2Ygc3RhcnMsIGdhcyBhbmQgZHVzdCBhdCB0aGUgbWlkcGxhbmUgdGhhbiBhYm92ZSBhbmQgYmVsb3cuIFJlc2VhcmNoZXJzIHR5cGljYWxseSBlc3RpbWF0ZSB0aGUgdG90YWwgdmlzaWJsZSBtYXNzIG9mIHRoZSBNaWxreSBXYXkgYnkgZXh0cmFwb2xhdGluZyBvdXR3YXJkIGZyb20gdGhlIG1pZHBsYW5lIGRlbnNpdHk7IGlmIHRoZXJlJiN4MjAxOTtzIGEgcGluY2hpbmcgZWZmZWN0LCB0aGVuIHRoaXMgZXh0cmFwb2xhdGlvbiBsZWFkcyB0byBhbiBvdmVyZXN0aW1hdGlvbiBvZiB0aGUgdmlzaWJsZSBtYXNzLCBtYWtpbmcgaXQgc2VlbSBhcyBpZiB0aGUgbWFzcyBtYXRjaGVzIHVwIHRvIHRoZSBzdGFycyYjeDIwMTk7IG1vdGlvbnMuICYjeDIwMUM7VGhhdCYjeDIwMTk7cyB0aGUgcmVhc29uIHdoeSBhIGxvdCBvZiB0aGVzZSBwcmV2aW91cyBzdHVkaWVzIGRpZCBub3Qgc2VlIGV2aWRlbmNlIGZvciBhIGRhcmsgZGlzaywmI3gyMDFEOyBLcmFtZXIgc2FpZC4gSGUgYW5kIFJhbmRhbGwgZmluZCB0aGF0IGEgdGhpbiBkYXJrIGRpc2sgaXMgcG9zc2libGUmI3gyMDE0O2FuZCBpbiBvbmUgd2F5IG9mIHJlZG9pbmcgdGhlIGFuYWx5c2lzLCBzbGlnaHRseSBmYXZvcmVkIG92ZXIgbm8gZGFyayBkaXNrLjwvcD5cXG48cD4mI3gyMDFDO0xpc2EmI3gyMDE5O3Mgd29yayBoYXMgcmVvcGVuZWQgdGhlIGNhc2UsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm9ub215LnN3aW4uZWR1LmF1L3N0YWZmL2NmbHlubi5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Q2hyaXMgRmx5bm48L2E+IG9mIFN3aW5idXJuZSBVbml2ZXJzaXR5IG9mIFRlY2hub2xvZ3kgaW4gTWVsYm91cm5lLCBBdXN0cmFsaWEsIHdobywgd2l0aCBKb2hhbiBIb2xtYmVyZywgY29uZHVjdGVkIGEgc2VyaWVzIG9mIE1pbGt5IFdheSBpbnZlbnRvcmllcyBpbiB0aGUgZWFybHkgYXVnaHRzIHRoYXQgc2VlbWVkIHRvIDxhIGhyZWY9XFxcImh0dHA6Ly9vbmxpbmVsaWJyYXJ5LndpbGV5LmNvbS9kb2kvMTAuMTA0Ni9qLjEzNjUtODcxMS4yMDAwLjAyOTA1LngvYWJzdHJhY3RcXFwiPnJvYnVzdGx5IHN3ZWVwIGl0IGNsZWFuPC9hPiBvZiBhIGRhcmsgZGlzay48L3A+XFxuPHA+Qm92eSBkaXNhZ3JlZXMuIEV2ZW4gdGFraW5nIHRoZSBwaW5jaGluZyBlZmZlY3QgaW50byBhY2NvdW50LCBoZSBlc3RpbWF0ZXMgdGhhdCBhdCBtb3N0IDIgcGVyY2VudCBvZiB0aGUgdG90YWwgYW1vdW50IG9mIGRhcmsgbWF0dGVyIGNhbiBsaWUgaW4gYSBkYXJrIGRpc2ssIHdoaWxlIHRoZSByZXN0IG11c3QgZm9ybSBhIGhhbG8uICYjeDIwMUM7SSB0aGluayBtb3N0IHBlb3BsZSB3YW50IHRvIGZpZ3VyZSBvdXQgd2hhdCA5OCBwZXJjZW50IG9mIHRoZSBkYXJrIG1hdHRlciBpcyBhYm91dCwgbm90IHdoYXQgMiBwZXJjZW50IG9mIGl0IGlzIGFib3V0LCYjeDIwMUQ7IGhlIHNhaWQuPC9wPlxcbjxwPlRoZSBkZWJhdGUmI3gyMDE0O2FuZCB0aGUgZmF0ZSBvZiB0aGUgZGFyayBkaXNrJiN4MjAxNDt3aWxsIHByb2JhYmx5IGJlIGRlY2lkZWQgc29vbi4gVGhlIEV1cm9wZWFuIFNwYWNlIEFnZW5jeSYjeDIwMTk7cyBHYWlhIHNhdGVsbGl0ZSBpcyBjdXJyZW50bHkgc3VydmV5aW5nIHRoZSBwb3NpdGlvbnMgYW5kIHZlbG9jaXRpZXMgb2Ygb25lIGJpbGxpb24gc3RhcnMsIGFuZCBhIGRlZmluaXRpdmUgaW52ZW50b3J5IG9mIHRoZSBNaWxreSBXYXkgY291bGQgYmUgY29tcGxldGVkIGFzIHNvb24gYXMgbmV4dCBzdW1tZXIuPC9wPlxcbjxwPlRoZSBkaXNjb3Zlcnkgb2YgYSBkYXJrIGRpc2ssIG9mIGFueSBzaXplLCB3b3VsZCBiZSBlbm9ybW91c2x5IHJldmVhbGluZy4gSWYgb25lIGV4aXN0cywgZGFyayBtYXR0ZXIgaXMgZmFyIG1vcmUgY29tcGxleCB0aGFuIHJlc2VhcmNoZXJzIGhhdmUgbG9uZyB0aG91Z2h0LiBNYXR0ZXIgc2V0dGxlcyBpbnRvIGEgZGlzayBzaGFwZSBvbmx5IGlmIGl0IGlzIGFibGUgdG8gc2hlZCBlbmVyZ3ksIGFuZCB0aGUgZWFzaWVzdCB3YXkgZm9yIGl0IHRvIHNoZWQgc3VmZmljaWVudCBlbmVyZ3kgaXMgaWYgaXQgZm9ybXMgYXRvbXMuIFRoZSBleGlzdGVuY2Ugb2YgZGFyayBhdG9tcyB3b3VsZCBtZWFuIGRhcmsgcHJvdG9ucyBhbmQgZGFyayBlbGVjdHJvbnMgdGhhdCBhcmUgY2hhcmdlZCBpbiBhIHNpbWlsYXIgc3R5bGUgYXMgdmlzaWJsZSBwcm90b25zIGFuZCBlbGVjdHJvbnMsIGludGVyYWN0aW5nIHdpdGggZWFjaCBvdGhlciB2aWEgYSBkYXJrIGZvcmNlIHRoYXQgaXMgY29udmV5ZWQgYnkgZGFyayBwaG90b25zLiBFdmVuIGlmIDk4IHBlcmNlbnQgb2YgZGFyayBtYXR0ZXIgaXMgaW5lcnQsIGFuZCBmb3JtcyBoYWxvcywgdGhlIGV4aXN0ZW5jZSBvZiBldmVuIGEgdGhpbiBkYXJrIGRpc2sgd291bGQgaW1wbHkgYSByaWNoICYjeDIwMUM7ZGFyayBzZWN0b3ImI3gyMDFEOyBvZiB1bmtub3duIHBhcnRpY2xlcyBhcyBkaXZlcnNlLCBwZXJoYXBzLCBhcyB0aGUgdmlzaWJsZSB1bml2ZXJzZS4gJiN4MjAxQztOb3JtYWwgbWF0dGVyIGlzIHByZXR0eSBjb21wbGV4OyB0aGVyZSYjeDIwMTk7cyBzdHVmZiB0aGF0IHBsYXlzIGEgcm9sZSBpbiBhdG9tcyBhbmQgdGhlcmUmI3gyMDE5O3Mgc3R1ZmYgdGhhdCBkb2VzbiYjeDIwMTk7dCwmI3gyMDFEOyBzYWlkIDxhIGhyZWY9XFxcImh0dHA6Ly93d3cucGh5c2ljcy51Y2kuZWR1L35idWxsb2NrL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkphbWVzIEJ1bGxvY2s8L2E+LCBhbiBhc3Ryb3BoeXNpY2lzdCBhdCB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBJcnZpbmUuICYjeDIwMUM7U28gaXQmI3gyMDE5O3Mgbm90IGNyYXp5IHRvIGltYWdpbmUgdGhhdCB0aGUgb3RoZXIgZml2ZS1zaXh0aHMgW29mIHRoZSBtYXR0ZXIgaW4gdGhlIHVuaXZlcnNlXSBpcyBwcmV0dHkgY29tcGxleCwgYW5kIHRoYXQgdGhlcmUmI3gyMDE5O3Mgc29tZSBwaWVjZSBvZiB0aGF0IGRhcmsgc2VjdG9yIHRoYXQgd2luZHMgdXAgaW4gYm91bmQgYXRvbXMuJiN4MjAxRDs8L3A+XFxuPHA+VGhlIG5vdGlvbiB0aGF0IDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZy8yMDE1MDgyMC10aGUtY2FzZS1mb3ItY29tcGxleC1kYXJrLW1hdHRlci9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5kYXJrIG1hdHRlciBtaWdodCBiZSBjb21wbGV4PC9hPiBoYXMgZ2FpbmVkIHRyYWN0aW9uIGluIHJlY2VudCB5ZWFycywgYWlkZWQgYnkgYXN0cm9waHlzaWNhbCBhbm9tYWxpZXMgdGhhdCBkbyBub3QgZ2VsIHdpdGggdGhlIGxvbmctcmVpZ25pbmcgcHJvZmlsZSBvZiBkYXJrIG1hdHRlciBhcyBwYXNzaXZlLCBzbHVnZ2lzaCAmI3gyMDFDO3dlYWtseSBpbnRlcmFjdGluZyBtYXNzaXZlIHBhcnRpY2xlcy4mI3gyMDFEOyBUaGVzZSBhbm9tYWxpZXMsIHBsdXMgdGhlIGZhaWx1cmUgb2YgJiN4MjAxQztXSU1QcyYjeDIwMUQ7IHRvIHNob3cgdXAgaW4gZXhoYXVzdGl2ZSBleHBlcmltZW50YWwgc2VhcmNoZXMgYWxsIG92ZXIgdGhlIHdvcmxkLCBoYXZlIHdlYWtlbmVkIHRoZSBXSU1QIHBhcmFkaWdtLCBhbmQgdXNoZXJlZCBpbiBhIG5ldywgZnJlZS1mb3ItYWxsIGVyYSwgaW4gd2hpY2ggdGhlIG5hdHVyZSBvZiB0aGUgZGFyayBiZWFzdCBpcyBhbnlib2R5JiN4MjAxOTtzIGd1ZXNzLjwvcD5cXG48cD5UaGUgZmllbGQgc3RhcnRlZCBvcGVuaW5nIHVwIGFyb3VuZCAyMDA4LCB3aGVuIGFuIGV4cGVyaW1lbnQgY2FsbGVkIFBBTUVMQSBkZXRlY3RlZCBhbiBleGNlc3Mgb2YgcG9zaXRyb25zIG92ZXIgZWxlY3Ryb25zIGNvbWluZyBmcm9tIHNwYWNlJiN4MjAxNDthbiBhc3ltbWV0cnkgdGhhdCBmdWVsZWQgaW50ZXJlc3QgaW4gJiN4MjAxQzs8YSBocmVmPVxcXCJodHRwOi8vYXJ4aXYub3JnL2Ficy8wOTAxLjQxMTdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5hc3ltbWV0cmljIGRhcmsgbWF0dGVyPC9hPiwmI3gyMDFEOyBhIG5vdy1wb3B1bGFyIG1vZGVsIHByb3Bvc2VkIGJ5IDxhIGhyZWY9XFxcImh0dHA6Ly93d3ctdGhlb3J5LmxibC5nb3Yvd29yZHByZXNzLz9wYWdlX2lkPTY4NTFcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5LYXRocnluIFp1cmVrPC9hPiBhbmQgY29sbGFib3JhdG9ycy4gQXQgdGhlIHRpbWUsIHRoZXJlIHdlcmUgZmV3IGlkZWFzIG90aGVyIHRoYW4gV0lNUHMgaW4gcGxheS4gJiN4MjAxQztUaGVyZSB3ZXJlIG1vZGVsLWJ1aWxkZXJzIGxpa2UgbWUgd2hvIHJlYWxpemVkIHRoYXQgZGFyayBtYXR0ZXIgd2FzIGp1c3QgZXh0cmFvcmRpbmFyaWx5IHVuZGVyZGV2ZWxvcGVkIGluIHRoaXMgZGlyZWN0aW9uLCYjeDIwMUQ7IHNhaWQgWnVyZWssIG5vdyBvZiBMYXdyZW5jZSBCZXJrZWxleSBOYXRpb25hbCBMYWJvcmF0b3J5IGluIENhbGlmb3JuaWEuICYjeDIwMUM7U28gd2UgZG92ZSBpbi4mI3gyMDFEOzwvcD5cXG48ZmlndXJlIGNsYXNzPVxcXCJ3cC1jYXB0aW9uIGxhbmRzY2FwZSBhbGlnbm5vbmUgZmFkZXIgcmVsYXRpdmVcXFwiPjxpbWcgY2xhc3M9XFxcInNpemUtdGV4dC1jb2x1bW4td2lkdGggd3AtaW1hZ2UtMjAyMjI1OVxcXCIgc3JjPVxcXCJodHRwczovL3d3dy53aXJlZC5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMTYvMDUvMDI0X1Byb2ZCdWxsb2NrLTYxNXg1MDAtNDgyeDM5Mi5qcGdcXFwiIGFsdD1cXFwiSmFtZXMgQnVsbG9jayBvZiB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBJcnZpbmUsIHNlZXMgZGFyayBtYXR0ZXIgYXMgcG90ZW50aWFsbHkgY29tcGxleCBhbmQgc2VsZi1pbnRlcmFjdGluZywgYnV0IG5vdCBuZWNlc3NhcmlseSBjb25jZW50cmF0ZWQgaW4gdGhpbiBkaXNrcy5cXFwiIHdpZHRoPVxcXCI0ODJcXFwiPjxmaWdjYXB0aW9uIGNsYXNzPVxcXCJ3cC1jYXB0aW9uLXRleHQgbGluay11bmRlcmxpbmVcXFwiPkphbWVzIEJ1bGxvY2sgb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLCBzZWVzIGRhcmsgbWF0dGVyIGFzIHBvdGVudGlhbGx5IGNvbXBsZXggYW5kIHNlbGYtaW50ZXJhY3RpbmcsIGJ1dCBub3QgbmVjZXNzYXJpbHkgY29uY2VudHJhdGVkIGluIHRoaW4gZGlza3MuPHNwYW4gY2xhc3M9XFxcImNyZWRpdCBsaW5rLXVuZGVybGluZS1zbVxcXCI+Sm9uYXRoYW4gQWxjb3JuIGZvciBRdWFudGEgTWFnYXppbmU8L3NwYW4+PC9maWdjYXB0aW9uPjwvZmlndXJlPlxcbjxwPkFub3RoZXIgdHJpZ2dlciBoYXMgYmVlbiB0aGUgZGVuc2l0eSBvZiBkd2FyZiBnYWxheGllcy4gV2hlbiByZXNlYXJjaGVycyB0cnkgdG8gc2ltdWxhdGUgdGhlaXIgZm9ybWF0aW9uLCBkd2FyZiBnYWxheGllcyB0eXBpY2FsbHkgdHVybiBvdXQgdG9vIGRlbnNlIGluIHRoZWlyIGNlbnRlcnMsIHVubGVzcyByZXNlYXJjaGVycyBhc3N1bWUgdGhhdCBkYXJrIG1hdHRlciBwYXJ0aWNsZXMgaW50ZXJhY3Qgd2l0aCBvbmUgYW5vdGhlciB2aWEgZGFyayBmb3JjZXMuIEFkZCB0b28gbXVjaCBpbnRlcmFjdGl2aXR5LCBob3dldmVyLCBhbmQgeW91IG11Y2sgdXAgc2ltdWxhdGlvbnMgb2Ygc3RydWN0dXJlIGZvcm1hdGlvbiBpbiB0aGUgZWFybHkgdW5pdmVyc2UuICYjeDIwMUM7V2hhdCB3ZSYjeDIwMTk7cmUgdHJ5aW5nIHRvIGRvIGlzIGZpZ3VyZSBvdXQgd2hhdCBpcyBhbGxvd2VkLCYjeDIwMUQ7IHNhaWQgQnVsbG9jaywgd2hvIGJ1aWxkcyBzdWNoIHNpbXVsYXRpb25zLiBNb3N0IG1vZGVsZXJzIGFkZCB3ZWFrIGludGVyYWN0aW9ucyB0aGF0IGRvbiYjeDIwMTk7dCBhZmZlY3QgdGhlIGhhbG8gc2hhcGUgb2YgZGFyayBtYXR0ZXIuIEJ1dCAmI3gyMDFDO3JlbWFya2FibHksJiN4MjAxRDsgQnVsbG9jayBzYWlkLCAmI3gyMDFDO3RoZXJlIGlzIGEgY2xhc3Mgb2YgZGFyayBtYXR0ZXIgdGhhdCBhbGxvd3MgZm9yIGRpc2tzLiYjeDIwMUQ7IEluIHRoYXQgY2FzZSwgb25seSBhIHRpbnkgZnJhY3Rpb24gb2YgZGFyayBtYXR0ZXIgcGFydGljbGVzIGludGVyYWN0LCBidXQgdGhleSBkbyBzbyBzdHJvbmdseSBlbm91Z2ggdG8gZGlzc2lwYXRlIGVuZXJneSYjeDIwMTQ7YW5kIHRoZW4gZm9ybSBkaXNrcy48L3A+XFxuPHA+UmFuZGFsbCBhbmQgaGVyIGNvbGxhYm9yYXRvcnMgSmlKaSBGYW4sIEFuZHJleSBLYXR6IGFuZCBNYXR0aGV3IFJlZWNlIG1hZGUgdGhlaXIgd2F5IHRvIHRoaXMgaWRlYSBpbiAyMDEzIGJ5IHRoZSBzYW1lIHBhdGggYXMgT29ydDogVGhleSB3ZXJlIHRyeWluZyB0byBleHBsYWluIGFuIGFwcGFyZW50IE1pbGt5IFdheSBhbm9tYWx5LiBLbm93biBhcyB0aGUgJiN4MjAxQztGZXJtaSBsaW5lLCYjeDIwMUQ7IGl0IHdhcyBhbiBleGNlc3Mgb2YgZ2FtbWEgcmF5cyBvZiBhIGNlcnRhaW4gZnJlcXVlbmN5IGNvbWluZyBmcm9tIHRoZSBnYWxhY3RpYyBjZW50ZXIuICYjeDIwMUM7T3JkaW5hcnkgZGFyayBtYXR0ZXIgd291bGRuJiN4MjAxOTt0IGFubmloaWxhdGUgZW5vdWdoJiN4MjAxRDsgdG8gcHJvZHVjZSB0aGUgRmVybWkgbGluZSwgUmFuZGFsbCBzYWlkLCAmI3gyMDFDO3NvIHdlIHRob3VnaHQsIHdoYXQgaWYgaXQgd2FzIG11Y2ggZGVuc2VyPyYjeDIwMUQ7IFRoZSBkYXJrIGRpc2sgd2FzIHJlYm9ybi4gVGhlIEZlcm1pIGxpbmUgdmFuaXNoZWQgYXMgbW9yZSBkYXRhIGFjY3VtdWxhdGVkLCBidXQgdGhlIGRpc2sgaWRlYSBzZWVtZWQgd29ydGggZXhwbG9yaW5nIGFueXdheS4gSW4gMjAxNCwgUmFuZGFsbCBhbmQgUmVlY2UgaHlwb3RoZXNpemVkIHRoYXQgdGhlIGRpc2sgbWlnaHQgYWNjb3VudCBmb3IgcG9zc2libGUgMzAtIHRvIDM1LW1pbGxpb24teWVhciBpbnRlcnZhbHMgYmV0d2VlbiBlc2NhbGF0ZWQgbWV0ZW9yIGFuZCBjb21ldCBhY3Rpdml0eSwgYSBzdGF0aXN0aWNhbGx5IHdlYWsgc2lnbmFsIHRoYXQgc29tZSBzY2llbnRpc3RzIGhhdmUgdGVudGF0aXZlbHkgdGllZCB0byBwZXJpb2RpYyBtYXNzIGV4dGluY3Rpb25zLiBFYWNoIHRpbWUgdGhlIHNvbGFyIHN5c3RlbSBib2JzIHVwIG9yIGRvd24gdGhyb3VnaCB0aGUgZGFyayBkaXNrIG9uIHRoZSBNaWxreSBXYXkgY2Fyb3VzZWwsIHRoZXkgYXJndWVkLCB0aGUgZGlzayYjeDIwMTk7cyBncmF2aXRhdGlvbmFsIGVmZmVjdCBtaWdodCBkZXN0YWJpbGl6ZSByb2NrcyBhbmQgY29tZXRzIGluIHRoZSBPb3J0IGNsb3VkJiN4MjAxNDthIHNjcmFweWFyZCBvbiB0aGUgb3V0c2tpcnRzIG9mIHRoZSBzb2xhciBzeXN0ZW0gbmFtZWQgZm9yIEphbiBPb3J0LiBUaGVzZSBvYmplY3RzIHdvdWxkIGdvIGh1cnRsaW5nIHRvd2FyZCB0aGUgaW5uZXIgc29sYXIgc3lzdGVtLCBzb21lIHN0cmlraW5nIEVhcnRoLjwvcD5cXG48cD5CdXQgUmFuZGFsbCBhbmQgaGVyIHRlYW0gZGlkIG9ubHkgYSBjdXJzb3J5JiN4MjAxNDthbmQgaW5jb3JyZWN0JiN4MjAxNDthbmFseXNpcyBvZiBob3cgbXVjaCByb29tIHRoZXJlIGlzIGZvciBhIGRhcmsgZGlzayBpbiB0aGUgTWlsa3kgV2F5JiN4MjAxOTtzIG1hc3MgYnVkZ2V0LCBqdWRnaW5nIGJ5IHRoZSBtb3Rpb25zIG9mIHN0YXJzLiAmI3gyMDFDO1RoZXkgbWFkZSBzb21lIGtpbmQgb2Ygb3V0cmFnZW91cyBjbGFpbXMsJiN4MjAxRDsgQm92eSBzYWlkLjwvcD5cXG48cD5SYW5kYWxsLCB3aG8gc3RhbmRzIG91dCAoYWNjb3JkaW5nIHRvIFJlZWNlKSBmb3IgJiN4MjAxQztoZXIgcGVyc2lzdGVuY2UsJiN4MjAxRDsgcHV0IEtyYW1lciBvbiB0aGUgY2FzZSwgc2Vla2luZyB0byBhZGRyZXNzIHRoZSBjcml0aWNzIGFuZCwgc2hlIHNhaWQsICYjeDIwMUM7dG8gaXJvbiBvdXQgYWxsIHRoZSB3cmlua2xlcyYjeDIwMUQ7IGluIHRoZSBhbmFseXNpcyBiZWZvcmUgR2FpYSBkYXRhIGJlY29tZXMgYXZhaWxhYmxlLiBIZXIgYW5kIEtyYW1lciYjeDIwMTk7cyBuZXcgYW5hbHlzaXMgc2hvd3MgdGhhdCB0aGUgZGFyayBkaXNrLCBpZiBpdCBleGlzdHMsIGNhbm5vdCBiZSBhcyBkZW5zZSBhcyBoZXIgdGVhbSBpbml0aWFsbHkgdGhvdWdodCBwb3NzaWJsZS4gQnV0IHRoZXJlIGlzIGluZGVlZCB3aWdnbGUgcm9vbSBmb3IgYSB0aGluIGRhcmsgZGlzayB5ZXQsIGR1ZSBib3RoIHRvIGl0cyBwaW5jaGluZyBlZmZlY3QgYW5kIHRvIGFkZGl0aW9uYWwgdW5jZXJ0YWludHkgY2F1c2VkIGJ5IGEgbmV0IGRyaWZ0IGluIHRoZSBNaWxreSBXYXkgc3RhcnMgdGhhdCBoYXZlIGJlZW4gbW9uaXRvcmVkIHRodXMgZmFyLjwvcD5cXG5cXG5cXG5cXG48cD5Ob3cgdGhlcmUmI3gyMDE5O3MgYSBuZXcgcHJvYmxlbSwgPGEgaHJlZj1cXFwiaHR0cDovL2lvcHNjaWVuY2UuaW9wLm9yZy9hcnRpY2xlLzEwLjEwODgvMDAwNC02MzdYLzgxNC8xLzEzXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cmFpc2VkPC9hPiBpbiA8ZW0+VGhlIEFzdHJvcGh5c2ljYWwgSm91cm5hbDwvZW0+IGJ5IDxhIGhyZWY9XFxcImh0dHA6Ly9hc3Ryby5iZXJrZWxleS5lZHUvZmFjdWx0eS1wcm9maWxlL2NocmlzLW1ja2VlXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Q2hyaXMgTWNLZWU8L2E+IG9mIHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIEJlcmtlbGV5LCBhbmQgY29sbGFib3JhdG9ycy4gTWNLZWUgY29uY2VkZXMgdGhhdCBhIHRoaW4gZGFyayBkaXNrIGNhbiBzdGlsbCBiZSBzcXVlZXplZCBpbnRvIHRoZSBNaWxreSBXYXkmI3gyMDE5O3MgbWFzcyBidWRnZXQuIEJ1dCB0aGUgZGlzayBtaWdodCBiZSBzbyB0aGluIHRoYXQgaXQgd291bGQgY29sbGFwc2UuIENpdGluZyByZXNlYXJjaCBmcm9tIHRoZSAxOTYwcyBhbmQgJiN4MjAxOTs3MHMsIE1jS2VlIGFuZCBjb2xsZWFndWVzIGFyZ3VlIHRoYXQgZGlza3MgY2Fubm90IGJlIHNpZ25pZmljYW50bHkgdGhpbm5lciB0aGFuIHRoZSBkaXNrIG9mIHZpc2libGUgZ2FzIGluIHRoZSBNaWxreSBXYXkgd2l0aG91dCBmcmFnbWVudGluZy4gJiN4MjAxQztJdCBpcyBwb3NzaWJsZSB0aGF0IHRoZSBkYXJrIG1hdHRlciB0aGV5IGNvbnNpZGVyIGhhcyBzb21lIHByb3BlcnR5IHRoYXQgaXMgZGlmZmVyZW50IGZyb20gb3JkaW5hcnkgbWF0dGVyIGFuZCBwcmV2ZW50cyB0aGlzIGZyb20gaGFwcGVuaW5nLCBidXQgSSBkb24mI3gyMDE5O3Qga25vdyB3aGF0IHRoYXQgY291bGQgYmUsJiN4MjAxRDsgTWNLZWUgc2FpZC48L3A+XFxuPHA+UmFuZGFsbCBoYXMgbm90IHlldCBwYXJyaWVkIHRoaXMgbGF0ZXN0IGF0dGFjaywgY2FsbGluZyBpdCAmI3gyMDFDO2EgdHJpY2t5IGlzc3VlJiN4MjAxRDsgdGhhdCBpcyAmI3gyMDFDO3VuZGVyIGNvbnNpZGVyYXRpb24gbm93LiYjeDIwMUQ7IFNoZSBoYXMgYWxzbyB0YWtlbiBvbiB0aGUgcG9pbnQgcmFpc2VkIGJ5IEJvdnkmI3gyMDE0O3RoYXQgYSBkaXNrIG9mIGNoYXJnZWQgZGFyayBhdG9tcyBpcyBpcnJlbGV2YW50IG5leHQgdG8gdGhlIG5hdHVyZSBvZiA5OCBwZXJjZW50IG9mIGRhcmsgbWF0dGVyLiBTaGUgaXMgbm93IGludmVzdGlnYXRpbmcgdGhlIHBvc3NpYmlsaXR5IHRoYXQgYWxsIGRhcmsgbWF0dGVyIG1pZ2h0IGJlIGNoYXJnZWQgdW5kZXIgdGhlIHNhbWUgZGFyayBmb3JjZSwgYnV0IGJlY2F1c2Ugb2YgYSBzdXJwbHVzIG9mIGRhcmsgcHJvdG9ucyBvdmVyIGRhcmsgZWxlY3Ryb25zLCBvbmx5IGEgdGlueSBmcmFjdGlvbiBiZWNvbWUgYm91bmQgaW4gYXRvbXMgYW5kIHdpbmQgdXAgaW4gYSBkaXNrLiBJbiB0aGF0IGNhc2UsIHRoZSBkaXNrIGFuZCBoYWxvIHdvdWxkIGJlIG1hZGUgb2YgdGhlIHNhbWUgaW5ncmVkaWVudHMsICYjeDIwMUM7d2hpY2ggd291bGQgYmUgbW9yZSBlY29ub21pY2FsLCYjeDIwMUQ7IHNoZSBzYWlkLiAmI3gyMDFDO1dlIHRob3VnaHQgdGhhdCB3b3VsZCBiZSBydWxlZCBvdXQsIGJ1dCBpdCB3YXNuJiN4MjAxOTt0LiYjeDIwMUQ7PC9wPlxcbjxwPlRoZSBkYXJrIGRpc2sgc3Vydml2ZXMsIGZvciBub3cmI3gyMDE0O2Egc3ltYm9sIG9mIGFsbCB0aGF0IGlzbiYjeDIwMTk7dCBrbm93biBhYm91dCB0aGUgZGFyayBzaWRlIG9mIHRoZSB1bml2ZXJzZS4gJiN4MjAxQztJIHRoaW5rIGl0JiN4MjAxOTtzIHZlcnksIHZlcnkgaGVhbHRoeSBmb3IgdGhlIGZpZWxkIHRoYXQgeW91IGhhdmUgcGVvcGxlIHRoaW5raW5nIGFib3V0IGFsbCBraW5kcyBvZiBkaWZmZXJlbnQgaWRlYXMsJiN4MjAxRDsgc2FpZCBCdWxsb2NrLiAmI3gyMDFDO0JlY2F1c2UgaXQmI3gyMDE5O3MgcXVpdGUgdHJ1ZSB0aGF0IHdlIGRvbiYjeDIwMTk7dCBrbm93IHdoYXQgdGhlIGhlY2sgdGhhdCBkYXJrIG1hdHRlciBpcywgYW5kIHlvdSBuZWVkIHRvIGJlIG9wZW4tbWluZGVkIGFib3V0IGl0LiYjeDIwMUQ7PC9wPlxcbjxwPjxlbT48YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNjA0MTItZGViYXRlLWludGVuc2lmaWVzLW92ZXItZGFyay1kaXNrLXRoZW9yeS9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5PcmlnaW5hbCBzdG9yeTwvYT4gcmVwcmludGVkIHdpdGggcGVybWlzc2lvbiBmcm9tIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZ1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlF1YW50YSBNYWdhemluZTwvYT4sIGFuIGVkaXRvcmlhbGx5IGluZGVwZW5kZW50IHB1YmxpY2F0aW9uIG9mIHRoZSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5zaW1vbnNmb3VuZGF0aW9uLm9yZ1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlNpbW9ucyBGb3VuZGF0aW9uPC9hPiB3aG9zZSBtaXNzaW9uIGlzIHRvIGVuaGFuY2UgcHVibGljIHVuZGVyc3RhbmRpbmcgb2Ygc2NpZW5jZSBieSBjb3ZlcmluZyByZXNlYXJjaCBkZXZlbG9wbWVudHMgYW5kIHRyZW5kcyBpbiBtYXRoZW1hdGljcyBhbmQgdGhlIHBoeXNpY2FsIGFuZCBsaWZlIHNjaWVuY2VzLjwvZW0+PC9wPlxcblxcblxcdFxcdFxcdDxhIGNsYXNzPVxcXCJ2aXN1YWxseS1oaWRkZW4gc2tpcC10by10ZXh0LWxpbmsgZm9jdXNhYmxlIGJnLXdoaXRlXFxcIiBocmVmPVxcXCJodHRwOi8vd3d3LndpcmVkLmNvbS8yMDE2LzA2L2RlYmF0ZS1pbnRlbnNpZmllcy1kYXJrLWRpc2stdGhlb3J5LyNzdGFydC1vZi1jb250ZW50XFxcIj5HbyBCYWNrIHRvIFRvcC4gU2tpcCBUbzogU3RhcnQgb2YgQXJ0aWNsZS48L2E+XFxuXFxuXFx0XFx0XFx0XFxuXFx0XFx0PC9hcnRpY2xlPlxcblxcblxcdFxcdDwvZGl2PlwiLFxuXHRcdFwiZGF0ZVB1Ymxpc2hlZFwiOiBcIjIwMTYtMDYtMDQgMDA6MDA6MDBcIixcblx0XHRcImRvbWFpblwiOiBcInd3dy53aXJlZC5jb21cIixcblx0XHRcImV4Y2VycHRcIjogXCJJbiAxOTMyLCB0aGUgRHV0Y2ggYXN0cm9ub21lciBKYW4gT29ydCB0YWxsaWVkIHRoZSBzdGFycyBpbiB0aGUgTWlsa3kgV2F5IGFuZCBmb3VuZCB0aGF0IHRoZXkgY2FtZSB1cCBzaG9ydC4gSnVkZ2luZyBieSB0aGUgd2F5IHRoZSBzdGFycyBib2IgdXAgYW5kIGRvd24gbGlrZSBob3JzZXMgb24gYSBjYXJvdXNlbCBhcyB0aGV5IGdvIGFyb3VuZCZoZWxsaXA7XCIsXG5cdFx0XCJsZWFkSW1hZ2VVcmxcIjogXCJodHRwczovL3d3dy53aXJlZC5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMTYvMDUvMDYxMDE0X3JhbmRhbGxfMTYyN18zMTA1NzVfOTA0NTE4LTYxNXg0MTAtNDgyeDMyMS5qcGdcIixcblx0XHRcInRpdGxlXCI6IFwiQSBEaXNrIG9mIERhcmsgTWF0dGVyIE1pZ2h0IFJ1biBUaHJvdWdoIE91ciBHYWxheHlcIixcblx0XHRcInVybFwiOiBcImh0dHA6Ly93d3cud2lyZWQuY29tLzIwMTYvMDYvZGViYXRlLWludGVuc2lmaWVzLWRhcmstZGlzay10aGVvcnkvXCIsXG5cdFx0XCJfaWRcIjogXCI1NzUyZWU1NTIyYWZiMmQ0MGI4NWYyNjdcIlxuXHR9O1xuIiwiYXBwLmZhY3RvcnkoJ1BhZ2VzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKXtcblx0dmFyIFBhZ2VzRmFjdG9yeSA9IHt9XG5cblx0UGFnZXNGYWN0b3J5LmdldFNhdmVkID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KFwiL2FwaS9wYWdlc1wiKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gUGFnZXNGYWN0b3J5O1xufSkiLCJhcHAuZmFjdG9yeSgnUGFyc2VyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKXtcblxuXHR2YXIgUGFyc2VyRmFjdG9yeSA9IHt9O1xuXG5cdFBhcnNlckZhY3RvcnkucGFyc2VVcmwgPSBmdW5jdGlvbih1cmwsIHVzZXJpZCwgY2F0ZWdvcmllcykge1xuXHRcdC8vMS4gcGFyc2UgdGhlIFVybFxuXHRcdC8vMi4gcG9zdCB0byBwYWdlc1xuXHRcdC8vMy4gYWRkIHBhZ2UgdG8gdXNlcidzIGxpc3Rcblx0XHQvLzQuIGFkZCBwYWdlIHRvIGNhdGVnb3JpZXNcblxuXHRcdHZhciBlbmNvZGVkID0gZW5jb2RlVVJJQ29tcG9uZW50KHVybCk7XG5cdFx0cmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFyc2VyL1wiICsgZW5jb2RlZClcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhcInVzZXJpZDogXCIsIHVzZXJpZCk7XG5cdFx0XHRyZXR1cm4gJGh0dHAucG9zdChcIi9hcGkvcGFnZXNcIiwgcmVzdWx0LmRhdGEpXG5cdFx0XHQudGhlbihmdW5jdGlvbihwYWdlUmVzcG9uc2UpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcInBhZ2UgcGFyc2VkOiBcIiwgcGFnZVJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAucHV0KFwiL2FwaS91c2Vycy9hZGRQYWdlL1wiICsgdXNlcmlkLCB7cGFnZTogcGFnZVJlc3BvbnNlLmRhdGEuX2lkfSlcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xuXHRcdFx0XHRcdFx0aWYgKGNhdGVnb3JpZXMpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHRvVXBkYXRlID0gW107XG5cdFx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2F0ZWdvcmllcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJhZGRpbmcgcGFnZSB0byBjYXRlZ29yeTogXCIsIGNhdGVnb3JpZXNbaV0pO1xuXHRcdFx0XHRcdFx0XHRcdHRvVXBkYXRlLnB1c2goJGh0dHAucHV0KFwiL2FwaS9jYXRlZ29yaWVzL2FkZFBhZ2UvXCIgKyBjYXRlZ29yaWVzW2ldLCB7cGFnZTogcGFnZVJlc3BvbnNlLmRhdGEuX2lkfSkpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwidG9VcGRhdGU6IFwiLCB0b1VwZGF0ZSk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBQcm9taXNlLmFsbCh0b1VwZGF0ZSlcblx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiYWxsIGNhdGVnb3JpZXMgdXBkYXRlZFwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBwYWdlUmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHBhZ2VSZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdH0pO1xuXHR9O1xuXG5cblxuXHRyZXR1cm4gUGFyc2VyRmFjdG9yeTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdhcnRpY2xlRGV0YWlsJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge30sXG4gICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvYXJ0aWNsZURldGFpbENhcmQvZGV0YWlsLmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlKSB7XG5cbiAgICB9XG5cbiAgfVxufSlcbiIsImFwcC5kaXJlY3RpdmUoJ2JpbmRDb21waWxlZEh0bWwnLCBbJyRjb21waWxlJywgZnVuY3Rpb24oJGNvbXBpbGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0ZW1wbGF0ZTogJzxkaXY+PC9kaXY+JyxcbiAgICBzY29wZToge1xuICAgICAgcmF3SHRtbDogJz1iaW5kQ29tcGlsZWRIdG1sJ1xuICAgIH0sXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0pIHtcbiAgICAgIHZhciBpbWdzID0gW107XG4gICAgICBzY29wZS4kd2F0Y2goJ3Jhd0h0bWwnLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgICAgIHZhciBuZXdFbGVtID0gJGNvbXBpbGUodmFsdWUpKHNjb3BlLiRwYXJlbnQpO1xuICAgICAgICBlbGVtLmNvbnRlbnRzKCkucmVtb3ZlKCk7XG4gICAgICAgIGltZ3MgPSBuZXdFbGVtLmZpbmQoJ2ltZycpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAgIGltZ3NbaV0uYWRkQ2xhc3MgPSAnZmxvYXRSaWdodCdcbiAgICAgICAgfVxuICAgICAgICBlbGVtLmFwcGVuZChuZXdFbGVtKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1dKTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlLCAkbWRTaWRlbmF2LCAkbWRJbmtSaXBwbGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG5cbiAgICAgICAgICAgIHNjb3BlLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRtZFNpZGVuYXYoXCJsZWZ0XCIpLnRvZ2dsZSgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1BhcnNlcicsIHN0YXRlOiAncGFyc2VyJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQYWdlcycsIHN0YXRlOiAncGFnZXMnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ01lbWJlcnMgT25seScsIHN0YXRlOiAnbWVtYmVyc09ubHknLCBhdXRoOiB0cnVlIH1cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCdzaWRlYmFyJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0c2NvcGU6IHt9LFxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL3NpZGViYXIvc2lkZWJhci5odG1sJyxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSkge1xuXHRcdCAgICAkKFwiLm1lbnUtdXBcIikuY2xpY2soZnVuY3Rpb24oKXtcblx0XHQgICAgXHRpZigkKHRoaXMpLmNzcygndHJhbnNmb3JtJylcdCE9PSAnbm9uZScpe1xuXHRcdCAgICBcdFx0JCh0aGlzKS5jc3MoXCJ0cmFuc2Zvcm1cIiwgXCJcIik7XG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdzdWJzY3JpcHRpb25zLWljb24nKVxuXHRcdCAgICBcdFx0XHQkKCcjc3Vic2NyaXB0aW9ucycpLnNob3coNDAwKTtcblx0XHQgICAgXHRcdGlmKCQodGhpcykuYXR0cignaWQnKSA9PT0gJ2ZvbGRlcnMtaWNvbicpXG5cdFx0ICAgIFx0XHRcdCQoJyNmb2xkZXJzJykuc2hvdyg0MDApO1xuXHRcdCAgICBcdH1cblx0XHQgICAgXHRlbHNle1xuXHRcdFx0XHRcdCQodGhpcykuY3NzKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDE4MGRlZylcIik7XG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdzdWJzY3JpcHRpb25zLWljb24nKVxuXHRcdCAgICBcdFx0XHQkKCcjc3Vic2NyaXB0aW9ucycpLmhpZGUoNDAwKTtcblx0XHQgICAgXHRcdGlmKCQodGhpcykuYXR0cignaWQnKSA9PT0gJ2ZvbGRlcnMtaWNvbicpXG5cdFx0ICAgIFx0XHRcdCQoJyNmb2xkZXJzJykuaGlkZSg0MDApO1x0XHRcdFx0XG5cdFx0ICAgIFx0fVxuXHRcdFx0fSk7XG5cblx0XHR9XG5cdH1cbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdzcGVlZERpYWwnLCBmdW5jdGlvbiAoJG1kRGlhbG9nLCAkc3RhdGUsICRyb290U2NvcGUpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiBmdW5jdGlvbiAoJHN0YXRlLCAkcm9vdFNjb3BlKSB7XG5cdFx0XHQvLyAkd2F0Y2goJHN0YXRlLmN1cnJlbnQsIGZ1bmN0aW9uKHZhbCkge1xuXHRcdFx0Ly8gXHRjb25zb2xlLmxvZyh2YWwpXG5cdFx0XHQvLyB9KVxuXHRcdFx0Ly8gY29uc29sZS5sb2coJHN0YXRlLmN1cnJlbnQpXG5cdFx0XHQvLyAkcm9vdFNjb3BlLiR3YXRjaCgkc3RhdGUuY3VycmVudC5uYW1lLCBmdW5jdGlvbiAob2xkVmFsLCBuZXdWYWwpIHtcblx0XHRcdC8vIFx0Y29uc29sZS5sb2codGhpcylcblx0XHRcdC8vIFx0Y29uc29sZS5sb2cob2xkVmFsLCBuZXdWYWwpXG5cdFx0XHQvLyB9KVxuXHRcdH0sXG5cdFx0dGVtcGxhdGVVcmw6ICcvYXBwL2NvbW1vbi9kaXJlY3RpdmVzL3NwZWVkLWRpYWwvc3BlZWQtZGlhbC5odG1sJyxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xuXHRcdFx0c2NvcGUuaXNPcGVuID0gZmFsc2U7XG5cdFx0XHRzY29wZS5jb3VudCA9IDA7XG5cdFx0XHRzY29wZS5oaWRkZW4gPSBmYWxzZTtcblx0XHRcdHNjb3BlLmhvdmVyID0gZmFsc2U7XG5cdFx0XHRjb25zb2xlLmxvZyhzY29wZSlcblx0XHRcdHNjb3BlLml0ZW1zID0gW3tcblx0XHRcdFx0bmFtZTogXCJBZGQgVVJMXCIsXG5cdFx0XHRcdGljb246IFwiL2Fzc2V0cy9pY29ucy9pY19hZGRfd2hpdGVfMzZweC5zdmdcIixcblx0XHRcdFx0dHlwZTogXCJ1cmxcIixcblx0XHRcdFx0ZGlyZWN0aW9uOiBcInRvcFwiXG5cdFx0XHR9LCB7XG5cdFx0XHRcdG5hbWU6IFwiQWRkIENhdGVnb3J5XCIsXG5cdFx0XHRcdHR5cGU6IFwiY2F0ZWdvcnlcIixcblx0XHRcdFx0aWNvbjogXCIvYXNzZXRzL2ljb25zL2ljX3BsYXlsaXN0X2FkZF93aGl0ZV8zNnB4LnN2Z1wiLFxuXHRcdFx0XHRkaXJlY3Rpb246IFwiYm90dG9tXCJcblx0XHRcdH1dO1xuXG5cblx0XHRcdHNjb3BlLm9wZW5EaWFsb2cgPSBmdW5jdGlvbiAoJGV2ZW50LCBpdGVtKSB7XG5cdFx0XHRcdCRtZERpYWxvZy5zaG93KHtcblx0XHRcdFx0XHRzY29wZTogdGhpcyxcblx0XHRcdFx0XHRwcmVzZXJ2ZVNjb3BlOiB0cnVlLFxuXHRcdFx0XHRcdGNsaWNrT3V0c2lkZVRvQ2xvc2U6IHRydWUsXG5cdFx0XHRcdFx0Y29udHJvbGxlcjogJ2RpYWxvZ0Zvcm1DdHJsJyxcblx0XHRcdFx0XHRjb250cm9sbGVyQXM6ICdkaWFsb2cnLFxuXHRcdFx0XHRcdHRlbXBsYXRlVXJsOiAnL2FwcC9wb3B1cC1kaWFsb2cvcG9wdXAtZGlhbG9nLmh0bWwnLFxuXHRcdFx0XHRcdHRhcmdldEV2ZW50OiAkZXZlbnQsXG5cdFx0XHRcdFx0bG9jYWxzOiB7XG5cdFx0XHRcdFx0XHRpdGVtOiBpdGVtXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXG5cdFx0fVxuXHR9XG59KVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
