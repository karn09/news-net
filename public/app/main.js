'use strict';

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'ngMaterial']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
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

    ParserFactory.parseUrl = function (url, userid) {

        var encoded = encodeURIComponent(url);
        //console.log("encoded: ", encoded);
        return $http.get("/api/parser/" + encoded).then(function (result) {
            //return result.data
            //console.log("parser result: ", result.data);
            result.data.userid = userid;
            console.log("userid: ", userid);
            return $http.post("/api/pages", result.data).then(function (response) {
                console.log("post response: ", response.data);
                return response.data;
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

app.directive('speedDial', function () {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/common/directives/speed-dial/speed-dial.html',
        link: function link(scope, element, attribute) {
            scope.isOpen = false;
            scope.hello = "world";
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJwYWdlcy9wYWdlcy5qcyIsInBhcnNlci9wYXJzZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYXJ0aWNsZURldGFpbC5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYXJ0aWNsZVZpZXcuanMiLCJjb21tb24vZmFjdG9yaWVzL3BhZ2VzLmZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL3BhcnNlci5mYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYXJ0aWNsZURldGFpbENhcmQvZGV0YWlsLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYmluZENvbXBpbGVkSHRtbC9iaW5kQ29tcGlsZWRIdG1sLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zcGVlZC1kaWFsL3NwZWVkLWRpYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEs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QUFBLFFBQUEsRUFBQSxXQUFBLEVBQ0EsSUFEQSxDQUNBLGlCQURBLEVBRUEsS0FGQSxDQUVBLFlBQUE7QUFDQSx1QkFBQSxHQUFBLE1BQUEsQ0FBQSxFQUFBLFNBQUEsNEJBQUEsRUFBQSxDQUFBO0FBQ0EsYUFKQSxDQUFBO0FBS0EsU0FOQTs7QUFRQSxhQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsTUFBQSxHQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esd0JBQUEsT0FBQTtBQUNBLDJCQUFBLFVBQUEsQ0FBQSxZQUFBLGFBQUE7QUFDQSxhQUhBLENBQUE7QUFJQSxTQUxBO0FBT0EsS0FyREE7O0FBdURBLFFBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxPQUFBLElBQUE7O0FBRUEsbUJBQUEsR0FBQSxDQUFBLFlBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsaUJBQUEsT0FBQTtBQUNBLFNBRkE7O0FBSUEsbUJBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFlBQUE7QUFDQSxpQkFBQSxPQUFBO0FBQ0EsU0FGQTs7QUFJQSxhQUFBLEVBQUEsR0FBQSxJQUFBO0FBQ0EsYUFBQSxJQUFBLEdBQUEsSUFBQTs7QUFFQSxhQUFBLE1BQUEsR0FBQSxVQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLEdBQUEsU0FBQTtBQUNBLGlCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FIQTs7QUFLQSxhQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsaUJBQUEsRUFBQSxHQUFBLElBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLFNBSEE7QUFLQSxLQXpCQTtBQTJCQSxDQXBJQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLEdBREE7QUFFQSxxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBO0FDQUEs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QUFBLE1BQUEsTUFBQSxFQUFBO0FBQ0Esc0JBQUEsSUFBQSxFQUFBLEdBQUEsQ0FBQSxXQUFBLEVBQUEsRUFBQTtBQUNBLHdCQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLE1BQUEsb0JBQUEsRUFDQSxFQUFBLGdCQUFBLEVBQUEsSUFBQSxDQUFBLEdBQUE7QUFDQSx3QkFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxNQUFBLGNBQUEsRUFDQSxFQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsR0FBQTtBQUNBLGlCQU5BLE1BT0E7QUFDQSxzQkFBQSxJQUFBLEVBQUEsR0FBQSxDQUFBLFdBQUEsRUFBQSxnQkFBQTtBQUNBLHdCQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLE1BQUEsb0JBQUEsRUFDQSxFQUFBLGdCQUFBLEVBQUEsSUFBQSxDQUFBLEdBQUE7QUFDQSx3QkFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxNQUFBLGNBQUEsRUFDQSxFQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0EsYUFmQTtBQWlCQTtBQXRCQSxLQUFBO0FBd0JBLENBekJBOztBQ0FBLElBQUEsU0FBQSxDQUFBLFdBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGtCQUFBLEdBREE7QUFFQSxlQUFBLEVBRkE7QUFHQSxxQkFBQSxrREFIQTtBQUlBLGNBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQTtBQUNBLGtCQUFBLE1BQUEsR0FBQSxLQUFBO0FBQ0Esa0JBQUEsS0FBQSxHQUFBLE9BQUE7QUFDQTtBQVBBLEtBQUE7QUFTQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnbmdNYXRlcmlhbCddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXJ0aWNsZXMnLCB7XG4gICAgICAgIHVybDogJy9hcnRpY2xlcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FydGljbGVzL2FydGljbGVzLmh0bWwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXJ0aWNsZScsIHtcbiAgICAgICAgdXJsOiAnL2FydGljbGUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcnRpY2xlLXZpZXcvYXJ0aWNsZS12aWV3Lmh0bWwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgY3VycmVudDogZnVuY3Rpb24oQXJ0aWNsZVZpZXdGYWN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gQXJ0aWNsZVZpZXdGYWN0b3J5LmdldEFydGljbGVCeUlkKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb250cm9sbGVyOiAnQXJ0aWNsZVZpZXdDdHJsJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBcnRpY2xlVmlld0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGN1cnJlbnQsICRjb21waWxlKSB7XG4gICRzY29wZS5jdXJyZW50ID0gY3VycmVudDtcbiAgJHNjb3BlLnRpdGxlID0gY3VycmVudC50aXRsZTtcbiAgJHNjb3BlLmNvbnRlbnQgPSBjdXJyZW50LmNvbnRlbnQ7XG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2hvbWUvaG9tZS5odG1sJ1xuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpe1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwYWdlcycsIHtcblx0ICAgIHVybDogJy9wYWdlcycsXG5cdCAgICB0ZW1wbGF0ZVVybDogJ2FwcC9wYWdlcy9wYWdlcy5odG1sJywgLy9TdGlsbCBuZWVkIHRvIG1ha2Vcblx0ICAgIGNvbnRyb2xsZXI6ICdQYWdlc0N0cmwnXG5cdH0pO1xuXG59KVxuXG5hcHAuY29udHJvbGxlcignUGFnZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBQYWdlc0ZhY3Rvcnkpe1xuXG5cdFBhZ2VzRmFjdG9yeS5nZXRTYXZlZCgpXG5cdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHQkc2NvcGUucGFnZXMgPSByZXNwb25zZTtcblx0fSlcblxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BhcnNlcicsIHtcbiAgICAgICAgdXJsOiAnL3BhcnNlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL3BhcnNlci9wYXJzZXIuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQYXJzZXJDdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1BhcnNlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIFBhcnNlckZhY3RvcnksIFNlc3Npb24pIHtcblxuICAgICRzY29wZS5wYXJzZVVybCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5zaWRlIHBhcnNlckN0cmwgcGFyc2VVcmw6IHNlc3Npb24gdXNlcjogXCIsIFNlc3Npb24udXNlci5faWQpO1xuICAgICAgICBQYXJzZXJGYWN0b3J5LnBhcnNlVXJsKCRzY29wZS51cmwsIFNlc3Npb24udXNlci5faWQpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICRzY29wZS5wYXJzZWQgPSByZXNwb25zZTtcbiAgICAgICAgfSlcblxuICAgIH07XG5cbn0pO1xuXG5cbiIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiAiLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZmFjdG9yeSgnYXJ0aWNsZURldGFpbEZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICB2YXIgZGV0YWlsT2JqID0ge307XG5cbiAgZGV0YWlsT2JqLmZldGNoQWxsID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gJGh0dHAuZ2V0KFwiL2FwaS9wYWdlc1wiKVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgIH0pXG4gIH1cblxuICBkZXRhaWxPYmouZmV0Y2hBbGxCeUNhdGVnb3J5ID0gZnVuY3Rpb24oY2F0ZWdvcnkpIHtcbiAgICAvLyByZXR1cm4gYWxsIHRpdGxlcyBhbmQgc3VtbWFyaWVzIGFzc29jaWF0ZWQgd2l0aCBjdXJyZW50IGNhdGVnb3J5XG4gIH07XG5cbiAgZGV0YWlsT2JqLmZldGNoT25lQnlJZCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFnZXMvXCIgKyBpZClcbiAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9KVxuICB9O1xuXG4gIGRldGFpbE9iai5hZGRBcnRpY2xlID0gZnVuY3Rpb24oY2F0ZWdvcnkpIHtcbiAgICAvLyBhZGQgb25lIGFydGljbGUgdG8gY2F0ZWdvcnlcbiAgfTtcblxuICBkZXRhaWxPYmoucmVtb3ZlQXJ0aWNsZUJ5SUQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyByZW1vdmUgb24gYXJ0aWNsZSBieSBJRFxuICB9O1xuXG4gIGRldGFpbE9iai5zYXZlQXJ0aWNsZUJ5VXJsID0gZnVuY3Rpb24odXJsLCBjYXRlZ29yeSkge1xuICAgIC8vIGRlZmF1bHQgdG8gYWxsLCBvciBvcHRpb25hbCBjYXRlZ29yeVxuICB9XG5cbiAgcmV0dXJuIGRldGFpbE9iajtcbn0pXG4iLCJhcHAuZmFjdG9yeSgnQXJ0aWNsZVZpZXdGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBhcnRpY2xlVmlld09iaiA9IHt9O1xuXG5cdGFydGljbGVWaWV3T2JqLmdldEFydGljbGVCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgcmV0dXJuIHRlbXBBcnRpY2xlT2JqO1xuXHR9O1xuXG5cdGFydGljbGVWaWV3T2JqLnJlbW92ZUFydGljbGVCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG5cblx0fTtcblxuICBhcnRpY2xlVmlld09iai5hZGRBcnRpY2xlQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoaWQsIGNhdCkge1xuXG4gIH07XG5cblx0cmV0dXJuIGFydGljbGVWaWV3T2JqO1xufSlcblxuXG52YXIgdGVtcEFydGljbGVPYmogPVxuICB7XG5cdFx0XCJfX3ZcIjogMCxcblx0XHRcImNvbnRlbnRcIjogXCI8ZGl2PjxhcnRpY2xlIGNsYXNzPVxcXCJjb250ZW50IGxpbmstdW5kZXJsaW5lIHJlbGF0aXZlIGJvZHktY29weVxcXCI+XFxuXFxuXFx0XFx0XFx0PHA+SW4gMTkzMiwgdGhlIER1dGNoIGFzdHJvbm9tZXIgSmFuIE9vcnQgdGFsbGllZCB0aGUgc3RhcnMgaW4gdGhlIE1pbGt5IFdheSBhbmQgZm91bmQgdGhhdCB0aGV5IGNhbWUgdXAgc2hvcnQuIEp1ZGdpbmcgYnkgdGhlIHdheSB0aGUgc3RhcnMgYm9iIHVwIGFuZCBkb3duIGxpa2UgaG9yc2VzIG9uIGEgY2Fyb3VzZWwgYXMgdGhleSBnbyBhcm91bmQgdGhlIHBsYW5lIG9mIHRoZSBnYWxheHksIE9vcnQgY2FsY3VsYXRlZCB0aGF0IHRoZXJlIG91Z2h0IHRvIGJlIHR3aWNlIGFzIG11Y2ggbWF0dGVyIGdyYXZpdGF0aW9uYWxseSBwcm9wZWxsaW5nIHRoZW0gYXMgaGUgY291bGQgc2VlLiBIZSBwb3N0dWxhdGVkIHRoZSBwcmVzZW5jZSBvZiBoaWRkZW4gJiN4MjAxQztkYXJrIG1hdHRlciYjeDIwMUQ7IHRvIG1ha2UgdXAgdGhlIGRpZmZlcmVuY2UgYW5kIHN1cm1pc2VkIHRoYXQgaXQgbXVzdCBiZSBjb25jZW50cmF0ZWQgaW4gYSBkaXNrIHRvIGV4cGxhaW4gdGhlIHN0YXJzJiN4MjAxOTsgbW90aW9ucy48L3A+XFxuXFxuXFxuPHA+QnV0IGNyZWRpdCBmb3IgdGhlIGRpc2NvdmVyeSBvZiBkYXJrIG1hdHRlciYjeDIwMTQ7dGhlIGludmlzaWJsZSwgdW5pZGVudGlmaWVkIHN0dWZmIHRoYXQgY29tcHJpc2VzIGZpdmUtc2l4dGhzIG9mIHRoZSB1bml2ZXJzZSYjeDIwMTk7cyBtYXNzJiN4MjAxNDt1c3VhbGx5IGdvZXMgdG8gdGhlIFN3aXNzLUFtZXJpY2FuIGFzdHJvbm9tZXIgRnJpdHogWndpY2t5LCB3aG8gaW5mZXJyZWQgaXRzIGV4aXN0ZW5jZSBmcm9tIHRoZSByZWxhdGl2ZSBtb3Rpb25zIG9mIGdhbGF4aWVzIGluIDE5MzMuIE9vcnQgaXMgcGFzc2VkIG92ZXIgb24gdGhlIGdyb3VuZHMgdGhhdCBoZSB3YXMgdHJhaWxpbmcgYSBmYWxzZSBjbHVlLiBCeSAyMDAwLCB1cGRhdGVkLCBPb3J0LXN0eWxlIGludmVudG9yaWVzIG9mIHRoZSBNaWxreSBXYXkgZGV0ZXJtaW5lZCB0aGF0IGl0cyAmI3gyMDFDO21pc3NpbmcmI3gyMDFEOyBtYXNzIGNvbnNpc3RzIG9mIGZhaW50IHN0YXJzLCBnYXMgYW5kIGR1c3QsIHdpdGggbm8gbmVlZCBmb3IgYSBkYXJrIGRpc2suIEVpZ2h0eSB5ZWFycyBvZiBoaW50cyBzdWdnZXN0IHRoYXQgZGFyayBtYXR0ZXIsIHdoYXRldmVyIGl0IGlzLCBmb3JtcyBzcGhlcmljYWwgY2xvdWRzIGNhbGxlZCAmI3gyMDFDO2hhbG9zJiN4MjAxRDsgYXJvdW5kIGdhbGF4aWVzLjwvcD5cXG48cD5PciBzbyBtb3N0IGRhcmsgbWF0dGVyIGh1bnRlcnMgaGF2ZSBpdC4gVGhvdWdoIGl0IGZlbGwgb3V0IG9mIGZhdm9yLCB0aGUgZGFyayBkaXNrIGlkZWEgbmV2ZXIgY29tcGxldGVseSB3ZW50IGF3YXkuIEFuZCByZWNlbnRseSwgaXQgaGFzIGZvdW5kIGEgaGlnaC1wcm9maWxlIGNoYW1waW9uIGluIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnBoeXNpY3MuaGFydmFyZC5lZHUvcGVvcGxlL2ZhY3BhZ2VzL3JhbmRhbGxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5MaXNhIFJhbmRhbGw8L2E+LCBhIHByb2Zlc3NvciBvZiBwaHlzaWNzIGF0IEhhcnZhcmQgVW5pdmVyc2l0eSwgd2hvIGhhcyByZXNjdWVkIHRoZSBkaXNrIGZyb20gc2NpZW50aWZpYyBvYmxpdmlvbiBhbmQgZ2l2ZW4gaXQgYW4gYWN0aXZlIHJvbGUgb24gdGhlIGdhbGFjdGljIHN0YWdlLjwvcD5cXG48cD5TaW5jZSA8YSBocmVmPVxcXCJodHRwOi8vYXJ4aXYub3JnL3BkZi8xMzAzLjE1MjF2Mi5wZGZcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5wcm9wb3NpbmcgdGhlIG1vZGVsPC9hPiBpbiAyMDEzLCBSYW5kYWxsIGFuZCBoZXIgY29sbGFib3JhdG9ycyBoYXZlIGFyZ3VlZCB0aGF0IGEgZGFyayBkaXNrIG1pZ2h0IGV4cGxhaW4gZ2FtbWEgcmF5cyBjb21pbmcgZnJvbSB0aGUgZ2FsYWN0aWMgY2VudGVyLCB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL3d3dy5uYXR1cmUuY29tL25hdHVyZS9qb3VybmFsL3Y1MTEvbjc1MTEvZnVsbC9uYXR1cmUxMzQ4MS5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cGxhbmFyIGRpc3RyaWJ1dGlvbiBvZiBkd2FyZiBnYWxheGllczwvYT4gb3JiaXRpbmcgdGhlIEFuZHJvbWVkYSBnYWxheHkgYW5kIHRoZSBNaWxreSBXYXksIGFuZCBldmVuIDxhIGhyZWY9XFxcImh0dHBzOi8vcGh5c2ljcy5hcHMub3JnL2ZlYXR1cmVkLWFydGljbGUtcGRmLzEwLjExMDMvUGh5c1JldkxldHQuMTEyLjE2MTMwMVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnBlcmlvZGljIHVwdGlja3Mgb2YgY29tZXQgaW1wYWN0czwvYT4gYW5kIG1hc3MgZXh0aW5jdGlvbnMgb24gRWFydGgsIGRpc2N1c3NlZCBpbiBSYW5kYWxsJiN4MjAxOTtzIDIwMTUgcG9wdWxhci1zY2llbmNlIGJvb2ssIDxlbT5EYXJrIE1hdHRlciBhbmQgdGhlIERpbm9zYXVyczwvZW0+LjwvcD5cXG48cD5CdXQgYXN0cm9waHlzaWNpc3RzIHdobyBkbyBpbnZlbnRvcmllcyBvZiB0aGUgTWlsa3kgV2F5IGhhdmUgcHJvdGVzdGVkLCBhcmd1aW5nIHRoYXQgdGhlIGdhbGF4eSYjeDIwMTk7cyB0b3RhbCBtYXNzIGFuZCB0aGUgYm9iYmluZyBtb3Rpb25zIG9mIGl0cyBzdGFycyBtYXRjaCB1cCB0b28gd2VsbCB0byBsZWF2ZSByb29tIGZvciBhIGRhcmsgZGlzay4gJiN4MjAxQztJdCYjeDIwMTk7cyBtb3JlIHN0cm9uZ2x5IGNvbnN0cmFpbmVkIHRoYW4gTGlzYSBSYW5kYWxsIHByZXRlbmRzLCYjeDIwMUQ7IHNhaWQgPGEgaHJlZj1cXFwiaHR0cDovL2FzdHJvLnV0b3JvbnRvLmNhL35ib3Z5L1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkpvIEJvdnk8L2E+LCBhbiBhc3Ryb3BoeXNpY2lzdCBhdCB0aGUgVW5pdmVyc2l0eSBvZiBUb3JvbnRvLjwvcD5cXG48cD5Ob3csIFJhbmRhbGwsIHdobyBoYXMgZGV2aXNlZCBpbmZsdWVudGlhbCBpZGVhcyBhYm91dCBzZXZlcmFsIG9mIHRoZSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNTA4MDMtcGh5c2ljcy10aGVvcmllcy1tYXAvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+YmlnZ2VzdCBxdWVzdGlvbnMgaW4gZnVuZGFtZW50YWwgcGh5c2ljczwvYT4sIGlzIGZpZ2h0aW5nIGJhY2suIEluIDxhIGhyZWY9XFxcImh0dHA6Ly9hcnhpdi5vcmcvYWJzLzE2MDQuMDE0MDdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5hIHBhcGVyPC9hPiBwb3N0ZWQgb25saW5lIGxhc3Qgd2VlayB0aGF0IGhhcyBiZWVuIGFjY2VwdGVkIGZvciBwdWJsaWNhdGlvbiBpbiA8ZW0+VGhlIEFzdHJvcGh5c2ljYWwgSm91cm5hbDwvZW0+LCBSYW5kYWxsIGFuZCBoZXIgc3R1ZGVudCwgRXJpYyBLcmFtZXIsIHJlcG9ydCBhIGRpc2stc2hhcGVkIGxvb3Bob2xlIGluIHRoZSBNaWxreSBXYXkgYW5hbHlzaXM6ICYjeDIwMUM7VGhlcmUgaXMgYW4gaW1wb3J0YW50IGRldGFpbCB0aGF0IGhhcyBzbyBmYXIgYmVlbiBvdmVybG9va2VkLCYjeDIwMUQ7IHRoZXkgd3JpdGUuICYjeDIwMUM7VGhlIGRpc2sgY2FuIGFjdHVhbGx5IG1ha2Ugcm9vbSBmb3IgaXRzZWxmLiYjeDIwMUQ7PC9wPlxcbjxmaWd1cmUgY2xhc3M9XFxcIndwLWNhcHRpb24gbGFuZHNjYXBlIGFsaWdubm9uZSBmYWRlciByZWxhdGl2ZVxcXCI+PGltZyBjbGFzcz1cXFwic2l6ZS10ZXh0LWNvbHVtbi13aWR0aCB3cC1pbWFnZS0yMDIyMjU1XFxcIiBzcmM9XFxcImh0dHBzOi8vd3d3LndpcmVkLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxNi8wNS8wNjEwMTRfcmFuZGFsbF8xNjI3XzMxMDU3NV85MDQ1MTgtNjE1eDQxMC00ODJ4MzIxLmpwZ1xcXCIgYWx0PVxcXCIwNjEwMTRfUmFuZGFsbF8xNjI3LmpwZ1xcXCIgd2lkdGg9XFxcIjQ4MlxcXCI+PGZpZ2NhcHRpb24gY2xhc3M9XFxcIndwLWNhcHRpb24tdGV4dCBsaW5rLXVuZGVybGluZVxcXCI+TGlzYSBSYW5kYWxsIG9mIEhhcnZhcmQgVW5pdmVyc2l0eSBpcyBhIGhpZ2gtcHJvZmlsZSBzdXBwb3J0ZXIgb2YgdGhlIGNvbnRyb3ZlcnNpYWwgZGFyayBkaXNrIGlkZWEuPHNwYW4gY2xhc3M9XFxcImNyZWRpdCBsaW5rLXVuZGVybGluZS1zbVxcXCI+Um9zZSBMaW5jb2xuL0hhcnZhcmQgVW5pdmVyc2l0eTwvc3Bhbj48L2ZpZ2NhcHRpb24+PC9maWd1cmU+XFxuPHA+SWYgdGhlcmUgaXMgYSB0aGluIGRhcmsgZGlzayBjb3Vyc2luZyB0aHJvdWdoIHRoZSAmI3gyMDFDO21pZHBsYW5lJiN4MjAxRDsgb2YgdGhlIGdhbGF4eSwgUmFuZGFsbCBhbmQgS3JhbWVyIGFyZ3VlLCB0aGVuIGl0IHdpbGwgZ3Jhdml0YXRpb25hbGx5IHBpbmNoIG90aGVyIG1hdHRlciBpbndhcmQsIHJlc3VsdGluZyBpbiBhIGhpZ2hlciBkZW5zaXR5IG9mIHN0YXJzLCBnYXMgYW5kIGR1c3QgYXQgdGhlIG1pZHBsYW5lIHRoYW4gYWJvdmUgYW5kIGJlbG93LiBSZXNlYXJjaGVycyB0eXBpY2FsbHkgZXN0aW1hdGUgdGhlIHRvdGFsIHZpc2libGUgbWFzcyBvZiB0aGUgTWlsa3kgV2F5IGJ5IGV4dHJhcG9sYXRpbmcgb3V0d2FyZCBmcm9tIHRoZSBtaWRwbGFuZSBkZW5zaXR5OyBpZiB0aGVyZSYjeDIwMTk7cyBhIHBpbmNoaW5nIGVmZmVjdCwgdGhlbiB0aGlzIGV4dHJhcG9sYXRpb24gbGVhZHMgdG8gYW4gb3ZlcmVzdGltYXRpb24gb2YgdGhlIHZpc2libGUgbWFzcywgbWFraW5nIGl0IHNlZW0gYXMgaWYgdGhlIG1hc3MgbWF0Y2hlcyB1cCB0byB0aGUgc3RhcnMmI3gyMDE5OyBtb3Rpb25zLiAmI3gyMDFDO1RoYXQmI3gyMDE5O3MgdGhlIHJlYXNvbiB3aHkgYSBsb3Qgb2YgdGhlc2UgcHJldmlvdXMgc3R1ZGllcyBkaWQgbm90IHNlZSBldmlkZW5jZSBmb3IgYSBkYXJrIGRpc2ssJiN4MjAxRDsgS3JhbWVyIHNhaWQuIEhlIGFuZCBSYW5kYWxsIGZpbmQgdGhhdCBhIHRoaW4gZGFyayBkaXNrIGlzIHBvc3NpYmxlJiN4MjAxNDthbmQgaW4gb25lIHdheSBvZiByZWRvaW5nIHRoZSBhbmFseXNpcywgc2xpZ2h0bHkgZmF2b3JlZCBvdmVyIG5vIGRhcmsgZGlzay48L3A+XFxuPHA+JiN4MjAxQztMaXNhJiN4MjAxOTtzIHdvcmsgaGFzIHJlb3BlbmVkIHRoZSBjYXNlLCYjeDIwMUQ7IHNhaWQgPGEgaHJlZj1cXFwiaHR0cDovL2FzdHJvbm9teS5zd2luLmVkdS5hdS9zdGFmZi9jZmx5bm4uaHRtbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkNocmlzIEZseW5uPC9hPiBvZiBTd2luYnVybmUgVW5pdmVyc2l0eSBvZiBUZWNobm9sb2d5IGluIE1lbGJvdXJuZSwgQXVzdHJhbGlhLCB3aG8sIHdpdGggSm9oYW4gSG9sbWJlcmcsIGNvbmR1Y3RlZCBhIHNlcmllcyBvZiBNaWxreSBXYXkgaW52ZW50b3JpZXMgaW4gdGhlIGVhcmx5IGF1Z2h0cyB0aGF0IHNlZW1lZCB0byA8YSBocmVmPVxcXCJodHRwOi8vb25saW5lbGlicmFyeS53aWxleS5jb20vZG9pLzEwLjEwNDYvai4xMzY1LTg3MTEuMjAwMC4wMjkwNS54L2Fic3RyYWN0XFxcIj5yb2J1c3RseSBzd2VlcCBpdCBjbGVhbjwvYT4gb2YgYSBkYXJrIGRpc2suPC9wPlxcbjxwPkJvdnkgZGlzYWdyZWVzLiBFdmVuIHRha2luZyB0aGUgcGluY2hpbmcgZWZmZWN0IGludG8gYWNjb3VudCwgaGUgZXN0aW1hdGVzIHRoYXQgYXQgbW9zdCAyIHBlcmNlbnQgb2YgdGhlIHRvdGFsIGFtb3VudCBvZiBkYXJrIG1hdHRlciBjYW4gbGllIGluIGEgZGFyayBkaXNrLCB3aGlsZSB0aGUgcmVzdCBtdXN0IGZvcm0gYSBoYWxvLiAmI3gyMDFDO0kgdGhpbmsgbW9zdCBwZW9wbGUgd2FudCB0byBmaWd1cmUgb3V0IHdoYXQgOTggcGVyY2VudCBvZiB0aGUgZGFyayBtYXR0ZXIgaXMgYWJvdXQsIG5vdCB3aGF0IDIgcGVyY2VudCBvZiBpdCBpcyBhYm91dCwmI3gyMDFEOyBoZSBzYWlkLjwvcD5cXG48cD5UaGUgZGViYXRlJiN4MjAxNDthbmQgdGhlIGZhdGUgb2YgdGhlIGRhcmsgZGlzayYjeDIwMTQ7d2lsbCBwcm9iYWJseSBiZSBkZWNpZGVkIHNvb24uIFRoZSBFdXJvcGVhbiBTcGFjZSBBZ2VuY3kmI3gyMDE5O3MgR2FpYSBzYXRlbGxpdGUgaXMgY3VycmVudGx5IHN1cnZleWluZyB0aGUgcG9zaXRpb25zIGFuZCB2ZWxvY2l0aWVzIG9mIG9uZSBiaWxsaW9uIHN0YXJzLCBhbmQgYSBkZWZpbml0aXZlIGludmVudG9yeSBvZiB0aGUgTWlsa3kgV2F5IGNvdWxkIGJlIGNvbXBsZXRlZCBhcyBzb29uIGFzIG5leHQgc3VtbWVyLjwvcD5cXG48cD5UaGUgZGlzY292ZXJ5IG9mIGEgZGFyayBkaXNrLCBvZiBhbnkgc2l6ZSwgd291bGQgYmUgZW5vcm1vdXNseSByZXZlYWxpbmcuIElmIG9uZSBleGlzdHMsIGRhcmsgbWF0dGVyIGlzIGZhciBtb3JlIGNvbXBsZXggdGhhbiByZXNlYXJjaGVycyBoYXZlIGxvbmcgdGhvdWdodC4gTWF0dGVyIHNldHRsZXMgaW50byBhIGRpc2sgc2hhcGUgb25seSBpZiBpdCBpcyBhYmxlIHRvIHNoZWQgZW5lcmd5LCBhbmQgdGhlIGVhc2llc3Qgd2F5IGZvciBpdCB0byBzaGVkIHN1ZmZpY2llbnQgZW5lcmd5IGlzIGlmIGl0IGZvcm1zIGF0b21zLiBUaGUgZXhpc3RlbmNlIG9mIGRhcmsgYXRvbXMgd291bGQgbWVhbiBkYXJrIHByb3RvbnMgYW5kIGRhcmsgZWxlY3Ryb25zIHRoYXQgYXJlIGNoYXJnZWQgaW4gYSBzaW1pbGFyIHN0eWxlIGFzIHZpc2libGUgcHJvdG9ucyBhbmQgZWxlY3Ryb25zLCBpbnRlcmFjdGluZyB3aXRoIGVhY2ggb3RoZXIgdmlhIGEgZGFyayBmb3JjZSB0aGF0IGlzIGNvbnZleWVkIGJ5IGRhcmsgcGhvdG9ucy4gRXZlbiBpZiA5OCBwZXJjZW50IG9mIGRhcmsgbWF0dGVyIGlzIGluZXJ0LCBhbmQgZm9ybXMgaGFsb3MsIHRoZSBleGlzdGVuY2Ugb2YgZXZlbiBhIHRoaW4gZGFyayBkaXNrIHdvdWxkIGltcGx5IGEgcmljaCAmI3gyMDFDO2Rhcmsgc2VjdG9yJiN4MjAxRDsgb2YgdW5rbm93biBwYXJ0aWNsZXMgYXMgZGl2ZXJzZSwgcGVyaGFwcywgYXMgdGhlIHZpc2libGUgdW5pdmVyc2UuICYjeDIwMUM7Tm9ybWFsIG1hdHRlciBpcyBwcmV0dHkgY29tcGxleDsgdGhlcmUmI3gyMDE5O3Mgc3R1ZmYgdGhhdCBwbGF5cyBhIHJvbGUgaW4gYXRvbXMgYW5kIHRoZXJlJiN4MjAxOTtzIHN0dWZmIHRoYXQgZG9lc24mI3gyMDE5O3QsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vd3d3LnBoeXNpY3MudWNpLmVkdS9+YnVsbG9jay9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5KYW1lcyBCdWxsb2NrPC9hPiwgYW4gYXN0cm9waHlzaWNpc3QgYXQgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLiAmI3gyMDFDO1NvIGl0JiN4MjAxOTtzIG5vdCBjcmF6eSB0byBpbWFnaW5lIHRoYXQgdGhlIG90aGVyIGZpdmUtc2l4dGhzIFtvZiB0aGUgbWF0dGVyIGluIHRoZSB1bml2ZXJzZV0gaXMgcHJldHR5IGNvbXBsZXgsIGFuZCB0aGF0IHRoZXJlJiN4MjAxOTtzIHNvbWUgcGllY2Ugb2YgdGhhdCBkYXJrIHNlY3RvciB0aGF0IHdpbmRzIHVwIGluIGJvdW5kIGF0b21zLiYjeDIwMUQ7PC9wPlxcbjxwPlRoZSBub3Rpb24gdGhhdCA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNTA4MjAtdGhlLWNhc2UtZm9yLWNvbXBsZXgtZGFyay1tYXR0ZXIvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+ZGFyayBtYXR0ZXIgbWlnaHQgYmUgY29tcGxleDwvYT4gaGFzIGdhaW5lZCB0cmFjdGlvbiBpbiByZWNlbnQgeWVhcnMsIGFpZGVkIGJ5IGFzdHJvcGh5c2ljYWwgYW5vbWFsaWVzIHRoYXQgZG8gbm90IGdlbCB3aXRoIHRoZSBsb25nLXJlaWduaW5nIHByb2ZpbGUgb2YgZGFyayBtYXR0ZXIgYXMgcGFzc2l2ZSwgc2x1Z2dpc2ggJiN4MjAxQzt3ZWFrbHkgaW50ZXJhY3RpbmcgbWFzc2l2ZSBwYXJ0aWNsZXMuJiN4MjAxRDsgVGhlc2UgYW5vbWFsaWVzLCBwbHVzIHRoZSBmYWlsdXJlIG9mICYjeDIwMUM7V0lNUHMmI3gyMDFEOyB0byBzaG93IHVwIGluIGV4aGF1c3RpdmUgZXhwZXJpbWVudGFsIHNlYXJjaGVzIGFsbCBvdmVyIHRoZSB3b3JsZCwgaGF2ZSB3ZWFrZW5lZCB0aGUgV0lNUCBwYXJhZGlnbSwgYW5kIHVzaGVyZWQgaW4gYSBuZXcsIGZyZWUtZm9yLWFsbCBlcmEsIGluIHdoaWNoIHRoZSBuYXR1cmUgb2YgdGhlIGRhcmsgYmVhc3QgaXMgYW55Ym9keSYjeDIwMTk7cyBndWVzcy48L3A+XFxuPHA+VGhlIGZpZWxkIHN0YXJ0ZWQgb3BlbmluZyB1cCBhcm91bmQgMjAwOCwgd2hlbiBhbiBleHBlcmltZW50IGNhbGxlZCBQQU1FTEEgZGV0ZWN0ZWQgYW4gZXhjZXNzIG9mIHBvc2l0cm9ucyBvdmVyIGVsZWN0cm9ucyBjb21pbmcgZnJvbSBzcGFjZSYjeDIwMTQ7YW4gYXN5bW1ldHJ5IHRoYXQgZnVlbGVkIGludGVyZXN0IGluICYjeDIwMUM7PGEgaHJlZj1cXFwiaHR0cDovL2FyeGl2Lm9yZy9hYnMvMDkwMS40MTE3XFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+YXN5bW1ldHJpYyBkYXJrIG1hdHRlcjwvYT4sJiN4MjAxRDsgYSBub3ctcG9wdWxhciBtb2RlbCBwcm9wb3NlZCBieSA8YSBocmVmPVxcXCJodHRwOi8vd3d3LXRoZW9yeS5sYmwuZ292L3dvcmRwcmVzcy8/cGFnZV9pZD02ODUxXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+S2F0aHJ5biBadXJlazwvYT4gYW5kIGNvbGxhYm9yYXRvcnMuIEF0IHRoZSB0aW1lLCB0aGVyZSB3ZXJlIGZldyBpZGVhcyBvdGhlciB0aGFuIFdJTVBzIGluIHBsYXkuICYjeDIwMUM7VGhlcmUgd2VyZSBtb2RlbC1idWlsZGVycyBsaWtlIG1lIHdobyByZWFsaXplZCB0aGF0IGRhcmsgbWF0dGVyIHdhcyBqdXN0IGV4dHJhb3JkaW5hcmlseSB1bmRlcmRldmVsb3BlZCBpbiB0aGlzIGRpcmVjdGlvbiwmI3gyMDFEOyBzYWlkIFp1cmVrLCBub3cgb2YgTGF3cmVuY2UgQmVya2VsZXkgTmF0aW9uYWwgTGFib3JhdG9yeSBpbiBDYWxpZm9ybmlhLiAmI3gyMDFDO1NvIHdlIGRvdmUgaW4uJiN4MjAxRDs8L3A+XFxuPGZpZ3VyZSBjbGFzcz1cXFwid3AtY2FwdGlvbiBsYW5kc2NhcGUgYWxpZ25ub25lIGZhZGVyIHJlbGF0aXZlXFxcIj48aW1nIGNsYXNzPVxcXCJzaXplLXRleHQtY29sdW1uLXdpZHRoIHdwLWltYWdlLTIwMjIyNTlcXFwiIHNyYz1cXFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzAyNF9Qcm9mQnVsbG9jay02MTV4NTAwLTQ4MngzOTIuanBnXFxcIiBhbHQ9XFxcIkphbWVzIEJ1bGxvY2sgb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLCBzZWVzIGRhcmsgbWF0dGVyIGFzIHBvdGVudGlhbGx5IGNvbXBsZXggYW5kIHNlbGYtaW50ZXJhY3RpbmcsIGJ1dCBub3QgbmVjZXNzYXJpbHkgY29uY2VudHJhdGVkIGluIHRoaW4gZGlza3MuXFxcIiB3aWR0aD1cXFwiNDgyXFxcIj48ZmlnY2FwdGlvbiBjbGFzcz1cXFwid3AtY2FwdGlvbi10ZXh0IGxpbmstdW5kZXJsaW5lXFxcIj5KYW1lcyBCdWxsb2NrIG9mIHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIElydmluZSwgc2VlcyBkYXJrIG1hdHRlciBhcyBwb3RlbnRpYWxseSBjb21wbGV4IGFuZCBzZWxmLWludGVyYWN0aW5nLCBidXQgbm90IG5lY2Vzc2FyaWx5IGNvbmNlbnRyYXRlZCBpbiB0aGluIGRpc2tzLjxzcGFuIGNsYXNzPVxcXCJjcmVkaXQgbGluay11bmRlcmxpbmUtc21cXFwiPkpvbmF0aGFuIEFsY29ybiBmb3IgUXVhbnRhIE1hZ2F6aW5lPC9zcGFuPjwvZmlnY2FwdGlvbj48L2ZpZ3VyZT5cXG48cD5Bbm90aGVyIHRyaWdnZXIgaGFzIGJlZW4gdGhlIGRlbnNpdHkgb2YgZHdhcmYgZ2FsYXhpZXMuIFdoZW4gcmVzZWFyY2hlcnMgdHJ5IHRvIHNpbXVsYXRlIHRoZWlyIGZvcm1hdGlvbiwgZHdhcmYgZ2FsYXhpZXMgdHlwaWNhbGx5IHR1cm4gb3V0IHRvbyBkZW5zZSBpbiB0aGVpciBjZW50ZXJzLCB1bmxlc3MgcmVzZWFyY2hlcnMgYXNzdW1lIHRoYXQgZGFyayBtYXR0ZXIgcGFydGljbGVzIGludGVyYWN0IHdpdGggb25lIGFub3RoZXIgdmlhIGRhcmsgZm9yY2VzLiBBZGQgdG9vIG11Y2ggaW50ZXJhY3Rpdml0eSwgaG93ZXZlciwgYW5kIHlvdSBtdWNrIHVwIHNpbXVsYXRpb25zIG9mIHN0cnVjdHVyZSBmb3JtYXRpb24gaW4gdGhlIGVhcmx5IHVuaXZlcnNlLiAmI3gyMDFDO1doYXQgd2UmI3gyMDE5O3JlIHRyeWluZyB0byBkbyBpcyBmaWd1cmUgb3V0IHdoYXQgaXMgYWxsb3dlZCwmI3gyMDFEOyBzYWlkIEJ1bGxvY2ssIHdobyBidWlsZHMgc3VjaCBzaW11bGF0aW9ucy4gTW9zdCBtb2RlbGVycyBhZGQgd2VhayBpbnRlcmFjdGlvbnMgdGhhdCBkb24mI3gyMDE5O3QgYWZmZWN0IHRoZSBoYWxvIHNoYXBlIG9mIGRhcmsgbWF0dGVyLiBCdXQgJiN4MjAxQztyZW1hcmthYmx5LCYjeDIwMUQ7IEJ1bGxvY2sgc2FpZCwgJiN4MjAxQzt0aGVyZSBpcyBhIGNsYXNzIG9mIGRhcmsgbWF0dGVyIHRoYXQgYWxsb3dzIGZvciBkaXNrcy4mI3gyMDFEOyBJbiB0aGF0IGNhc2UsIG9ubHkgYSB0aW55IGZyYWN0aW9uIG9mIGRhcmsgbWF0dGVyIHBhcnRpY2xlcyBpbnRlcmFjdCwgYnV0IHRoZXkgZG8gc28gc3Ryb25nbHkgZW5vdWdoIHRvIGRpc3NpcGF0ZSBlbmVyZ3kmI3gyMDE0O2FuZCB0aGVuIGZvcm0gZGlza3MuPC9wPlxcbjxwPlJhbmRhbGwgYW5kIGhlciBjb2xsYWJvcmF0b3JzIEppSmkgRmFuLCBBbmRyZXkgS2F0eiBhbmQgTWF0dGhldyBSZWVjZSBtYWRlIHRoZWlyIHdheSB0byB0aGlzIGlkZWEgaW4gMjAxMyBieSB0aGUgc2FtZSBwYXRoIGFzIE9vcnQ6IFRoZXkgd2VyZSB0cnlpbmcgdG8gZXhwbGFpbiBhbiBhcHBhcmVudCBNaWxreSBXYXkgYW5vbWFseS4gS25vd24gYXMgdGhlICYjeDIwMUM7RmVybWkgbGluZSwmI3gyMDFEOyBpdCB3YXMgYW4gZXhjZXNzIG9mIGdhbW1hIHJheXMgb2YgYSBjZXJ0YWluIGZyZXF1ZW5jeSBjb21pbmcgZnJvbSB0aGUgZ2FsYWN0aWMgY2VudGVyLiAmI3gyMDFDO09yZGluYXJ5IGRhcmsgbWF0dGVyIHdvdWxkbiYjeDIwMTk7dCBhbm5paGlsYXRlIGVub3VnaCYjeDIwMUQ7IHRvIHByb2R1Y2UgdGhlIEZlcm1pIGxpbmUsIFJhbmRhbGwgc2FpZCwgJiN4MjAxQztzbyB3ZSB0aG91Z2h0LCB3aGF0IGlmIGl0IHdhcyBtdWNoIGRlbnNlcj8mI3gyMDFEOyBUaGUgZGFyayBkaXNrIHdhcyByZWJvcm4uIFRoZSBGZXJtaSBsaW5lIHZhbmlzaGVkIGFzIG1vcmUgZGF0YSBhY2N1bXVsYXRlZCwgYnV0IHRoZSBkaXNrIGlkZWEgc2VlbWVkIHdvcnRoIGV4cGxvcmluZyBhbnl3YXkuIEluIDIwMTQsIFJhbmRhbGwgYW5kIFJlZWNlIGh5cG90aGVzaXplZCB0aGF0IHRoZSBkaXNrIG1pZ2h0IGFjY291bnQgZm9yIHBvc3NpYmxlIDMwLSB0byAzNS1taWxsaW9uLXllYXIgaW50ZXJ2YWxzIGJldHdlZW4gZXNjYWxhdGVkIG1ldGVvciBhbmQgY29tZXQgYWN0aXZpdHksIGEgc3RhdGlzdGljYWxseSB3ZWFrIHNpZ25hbCB0aGF0IHNvbWUgc2NpZW50aXN0cyBoYXZlIHRlbnRhdGl2ZWx5IHRpZWQgdG8gcGVyaW9kaWMgbWFzcyBleHRpbmN0aW9ucy4gRWFjaCB0aW1lIHRoZSBzb2xhciBzeXN0ZW0gYm9icyB1cCBvciBkb3duIHRocm91Z2ggdGhlIGRhcmsgZGlzayBvbiB0aGUgTWlsa3kgV2F5IGNhcm91c2VsLCB0aGV5IGFyZ3VlZCwgdGhlIGRpc2smI3gyMDE5O3MgZ3Jhdml0YXRpb25hbCBlZmZlY3QgbWlnaHQgZGVzdGFiaWxpemUgcm9ja3MgYW5kIGNvbWV0cyBpbiB0aGUgT29ydCBjbG91ZCYjeDIwMTQ7YSBzY3JhcHlhcmQgb24gdGhlIG91dHNraXJ0cyBvZiB0aGUgc29sYXIgc3lzdGVtIG5hbWVkIGZvciBKYW4gT29ydC4gVGhlc2Ugb2JqZWN0cyB3b3VsZCBnbyBodXJ0bGluZyB0b3dhcmQgdGhlIGlubmVyIHNvbGFyIHN5c3RlbSwgc29tZSBzdHJpa2luZyBFYXJ0aC48L3A+XFxuPHA+QnV0IFJhbmRhbGwgYW5kIGhlciB0ZWFtIGRpZCBvbmx5IGEgY3Vyc29yeSYjeDIwMTQ7YW5kIGluY29ycmVjdCYjeDIwMTQ7YW5hbHlzaXMgb2YgaG93IG11Y2ggcm9vbSB0aGVyZSBpcyBmb3IgYSBkYXJrIGRpc2sgaW4gdGhlIE1pbGt5IFdheSYjeDIwMTk7cyBtYXNzIGJ1ZGdldCwganVkZ2luZyBieSB0aGUgbW90aW9ucyBvZiBzdGFycy4gJiN4MjAxQztUaGV5IG1hZGUgc29tZSBraW5kIG9mIG91dHJhZ2VvdXMgY2xhaW1zLCYjeDIwMUQ7IEJvdnkgc2FpZC48L3A+XFxuPHA+UmFuZGFsbCwgd2hvIHN0YW5kcyBvdXQgKGFjY29yZGluZyB0byBSZWVjZSkgZm9yICYjeDIwMUM7aGVyIHBlcnNpc3RlbmNlLCYjeDIwMUQ7IHB1dCBLcmFtZXIgb24gdGhlIGNhc2UsIHNlZWtpbmcgdG8gYWRkcmVzcyB0aGUgY3JpdGljcyBhbmQsIHNoZSBzYWlkLCAmI3gyMDFDO3RvIGlyb24gb3V0IGFsbCB0aGUgd3JpbmtsZXMmI3gyMDFEOyBpbiB0aGUgYW5hbHlzaXMgYmVmb3JlIEdhaWEgZGF0YSBiZWNvbWVzIGF2YWlsYWJsZS4gSGVyIGFuZCBLcmFtZXImI3gyMDE5O3MgbmV3IGFuYWx5c2lzIHNob3dzIHRoYXQgdGhlIGRhcmsgZGlzaywgaWYgaXQgZXhpc3RzLCBjYW5ub3QgYmUgYXMgZGVuc2UgYXMgaGVyIHRlYW0gaW5pdGlhbGx5IHRob3VnaHQgcG9zc2libGUuIEJ1dCB0aGVyZSBpcyBpbmRlZWQgd2lnZ2xlIHJvb20gZm9yIGEgdGhpbiBkYXJrIGRpc2sgeWV0LCBkdWUgYm90aCB0byBpdHMgcGluY2hpbmcgZWZmZWN0IGFuZCB0byBhZGRpdGlvbmFsIHVuY2VydGFpbnR5IGNhdXNlZCBieSBhIG5ldCBkcmlmdCBpbiB0aGUgTWlsa3kgV2F5IHN0YXJzIHRoYXQgaGF2ZSBiZWVuIG1vbml0b3JlZCB0aHVzIGZhci48L3A+XFxuXFxuXFxuXFxuPHA+Tm93IHRoZXJlJiN4MjAxOTtzIGEgbmV3IHByb2JsZW0sIDxhIGhyZWY9XFxcImh0dHA6Ly9pb3BzY2llbmNlLmlvcC5vcmcvYXJ0aWNsZS8xMC4xMDg4LzAwMDQtNjM3WC84MTQvMS8xM1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnJhaXNlZDwvYT4gaW4gPGVtPlRoZSBBc3Ryb3BoeXNpY2FsIEpvdXJuYWw8L2VtPiBieSA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm8uYmVya2VsZXkuZWR1L2ZhY3VsdHktcHJvZmlsZS9jaHJpcy1tY2tlZVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkNocmlzIE1jS2VlPC9hPiBvZiB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBCZXJrZWxleSwgYW5kIGNvbGxhYm9yYXRvcnMuIE1jS2VlIGNvbmNlZGVzIHRoYXQgYSB0aGluIGRhcmsgZGlzayBjYW4gc3RpbGwgYmUgc3F1ZWV6ZWQgaW50byB0aGUgTWlsa3kgV2F5JiN4MjAxOTtzIG1hc3MgYnVkZ2V0LiBCdXQgdGhlIGRpc2sgbWlnaHQgYmUgc28gdGhpbiB0aGF0IGl0IHdvdWxkIGNvbGxhcHNlLiBDaXRpbmcgcmVzZWFyY2ggZnJvbSB0aGUgMTk2MHMgYW5kICYjeDIwMTk7NzBzLCBNY0tlZSBhbmQgY29sbGVhZ3VlcyBhcmd1ZSB0aGF0IGRpc2tzIGNhbm5vdCBiZSBzaWduaWZpY2FudGx5IHRoaW5uZXIgdGhhbiB0aGUgZGlzayBvZiB2aXNpYmxlIGdhcyBpbiB0aGUgTWlsa3kgV2F5IHdpdGhvdXQgZnJhZ21lbnRpbmcuICYjeDIwMUM7SXQgaXMgcG9zc2libGUgdGhhdCB0aGUgZGFyayBtYXR0ZXIgdGhleSBjb25zaWRlciBoYXMgc29tZSBwcm9wZXJ0eSB0aGF0IGlzIGRpZmZlcmVudCBmcm9tIG9yZGluYXJ5IG1hdHRlciBhbmQgcHJldmVudHMgdGhpcyBmcm9tIGhhcHBlbmluZywgYnV0IEkgZG9uJiN4MjAxOTt0IGtub3cgd2hhdCB0aGF0IGNvdWxkIGJlLCYjeDIwMUQ7IE1jS2VlIHNhaWQuPC9wPlxcbjxwPlJhbmRhbGwgaGFzIG5vdCB5ZXQgcGFycmllZCB0aGlzIGxhdGVzdCBhdHRhY2ssIGNhbGxpbmcgaXQgJiN4MjAxQzthIHRyaWNreSBpc3N1ZSYjeDIwMUQ7IHRoYXQgaXMgJiN4MjAxQzt1bmRlciBjb25zaWRlcmF0aW9uIG5vdy4mI3gyMDFEOyBTaGUgaGFzIGFsc28gdGFrZW4gb24gdGhlIHBvaW50IHJhaXNlZCBieSBCb3Z5JiN4MjAxNDt0aGF0IGEgZGlzayBvZiBjaGFyZ2VkIGRhcmsgYXRvbXMgaXMgaXJyZWxldmFudCBuZXh0IHRvIHRoZSBuYXR1cmUgb2YgOTggcGVyY2VudCBvZiBkYXJrIG1hdHRlci4gU2hlIGlzIG5vdyBpbnZlc3RpZ2F0aW5nIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGFsbCBkYXJrIG1hdHRlciBtaWdodCBiZSBjaGFyZ2VkIHVuZGVyIHRoZSBzYW1lIGRhcmsgZm9yY2UsIGJ1dCBiZWNhdXNlIG9mIGEgc3VycGx1cyBvZiBkYXJrIHByb3RvbnMgb3ZlciBkYXJrIGVsZWN0cm9ucywgb25seSBhIHRpbnkgZnJhY3Rpb24gYmVjb21lIGJvdW5kIGluIGF0b21zIGFuZCB3aW5kIHVwIGluIGEgZGlzay4gSW4gdGhhdCBjYXNlLCB0aGUgZGlzayBhbmQgaGFsbyB3b3VsZCBiZSBtYWRlIG9mIHRoZSBzYW1lIGluZ3JlZGllbnRzLCAmI3gyMDFDO3doaWNoIHdvdWxkIGJlIG1vcmUgZWNvbm9taWNhbCwmI3gyMDFEOyBzaGUgc2FpZC4gJiN4MjAxQztXZSB0aG91Z2h0IHRoYXQgd291bGQgYmUgcnVsZWQgb3V0LCBidXQgaXQgd2FzbiYjeDIwMTk7dC4mI3gyMDFEOzwvcD5cXG48cD5UaGUgZGFyayBkaXNrIHN1cnZpdmVzLCBmb3Igbm93JiN4MjAxNDthIHN5bWJvbCBvZiBhbGwgdGhhdCBpc24mI3gyMDE5O3Qga25vd24gYWJvdXQgdGhlIGRhcmsgc2lkZSBvZiB0aGUgdW5pdmVyc2UuICYjeDIwMUM7SSB0aGluayBpdCYjeDIwMTk7cyB2ZXJ5LCB2ZXJ5IGhlYWx0aHkgZm9yIHRoZSBmaWVsZCB0aGF0IHlvdSBoYXZlIHBlb3BsZSB0aGlua2luZyBhYm91dCBhbGwga2luZHMgb2YgZGlmZmVyZW50IGlkZWFzLCYjeDIwMUQ7IHNhaWQgQnVsbG9jay4gJiN4MjAxQztCZWNhdXNlIGl0JiN4MjAxOTtzIHF1aXRlIHRydWUgdGhhdCB3ZSBkb24mI3gyMDE5O3Qga25vdyB3aGF0IHRoZSBoZWNrIHRoYXQgZGFyayBtYXR0ZXIgaXMsIGFuZCB5b3UgbmVlZCB0byBiZSBvcGVuLW1pbmRlZCBhYm91dCBpdC4mI3gyMDFEOzwvcD5cXG48cD48ZW0+PGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnLzIwMTYwNDEyLWRlYmF0ZS1pbnRlbnNpZmllcy1vdmVyLWRhcmstZGlzay10aGVvcnkvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+T3JpZ2luYWwgc3Rvcnk8L2E+IHJlcHJpbnRlZCB3aXRoIHBlcm1pc3Npb24gZnJvbSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5RdWFudGEgTWFnYXppbmU8L2E+LCBhbiBlZGl0b3JpYWxseSBpbmRlcGVuZGVudCBwdWJsaWNhdGlvbiBvZiB0aGUgPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cuc2ltb25zZm91bmRhdGlvbi5vcmdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5TaW1vbnMgRm91bmRhdGlvbjwvYT4gd2hvc2UgbWlzc2lvbiBpcyB0byBlbmhhbmNlIHB1YmxpYyB1bmRlcnN0YW5kaW5nIG9mIHNjaWVuY2UgYnkgY292ZXJpbmcgcmVzZWFyY2ggZGV2ZWxvcG1lbnRzIGFuZCB0cmVuZHMgaW4gbWF0aGVtYXRpY3MgYW5kIHRoZSBwaHlzaWNhbCBhbmQgbGlmZSBzY2llbmNlcy48L2VtPjwvcD5cXG5cXG5cXHRcXHRcXHQ8YSBjbGFzcz1cXFwidmlzdWFsbHktaGlkZGVuIHNraXAtdG8tdGV4dC1saW5rIGZvY3VzYWJsZSBiZy13aGl0ZVxcXCIgaHJlZj1cXFwiaHR0cDovL3d3dy53aXJlZC5jb20vMjAxNi8wNi9kZWJhdGUtaW50ZW5zaWZpZXMtZGFyay1kaXNrLXRoZW9yeS8jc3RhcnQtb2YtY29udGVudFxcXCI+R28gQmFjayB0byBUb3AuIFNraXAgVG86IFN0YXJ0IG9mIEFydGljbGUuPC9hPlxcblxcblxcdFxcdFxcdFxcblxcdFxcdDwvYXJ0aWNsZT5cXG5cXG5cXHRcXHQ8L2Rpdj5cIixcblx0XHRcImRhdGVQdWJsaXNoZWRcIjogXCIyMDE2LTA2LTA0IDAwOjAwOjAwXCIsXG5cdFx0XCJkb21haW5cIjogXCJ3d3cud2lyZWQuY29tXCIsXG5cdFx0XCJleGNlcnB0XCI6IFwiSW4gMTkzMiwgdGhlIER1dGNoIGFzdHJvbm9tZXIgSmFuIE9vcnQgdGFsbGllZCB0aGUgc3RhcnMgaW4gdGhlIE1pbGt5IFdheSBhbmQgZm91bmQgdGhhdCB0aGV5IGNhbWUgdXAgc2hvcnQuIEp1ZGdpbmcgYnkgdGhlIHdheSB0aGUgc3RhcnMgYm9iIHVwIGFuZCBkb3duIGxpa2UgaG9yc2VzIG9uIGEgY2Fyb3VzZWwgYXMgdGhleSBnbyBhcm91bmQmaGVsbGlwO1wiLFxuXHRcdFwibGVhZEltYWdlVXJsXCI6IFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzA2MTAxNF9yYW5kYWxsXzE2MjdfMzEwNTc1XzkwNDUxOC02MTV4NDEwLTQ4MngzMjEuanBnXCIsXG5cdFx0XCJ0aXRsZVwiOiBcIkEgRGlzayBvZiBEYXJrIE1hdHRlciBNaWdodCBSdW4gVGhyb3VnaCBPdXIgR2FsYXh5XCIsXG5cdFx0XCJ1cmxcIjogXCJodHRwOi8vd3d3LndpcmVkLmNvbS8yMDE2LzA2L2RlYmF0ZS1pbnRlbnNpZmllcy1kYXJrLWRpc2stdGhlb3J5L1wiLFxuXHRcdFwiX2lkXCI6IFwiNTc1MmVlNTUyMmFmYjJkNDBiODVmMjY3XCJcblx0fTtcbiIsImFwcC5mYWN0b3J5KCdQYWdlc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XG5cdHZhciBQYWdlc0ZhY3RvcnkgPSB7fVxuXG5cdFBhZ2VzRmFjdG9yeS5nZXRTYXZlZCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFnZXNcIilcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIFBhZ2VzRmFjdG9yeTtcbn0pIiwiYXBwLmZhY3RvcnkoJ1BhcnNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XG5cblx0dmFyIFBhcnNlckZhY3RvcnkgPSB7fTtcblxuXHRQYXJzZXJGYWN0b3J5LnBhcnNlVXJsID0gZnVuY3Rpb24odXJsLCB1c2VyaWQpIHtcblxuXHRcdHZhciBlbmNvZGVkID0gZW5jb2RlVVJJQ29tcG9uZW50KHVybCk7XG5cdFx0Ly9jb25zb2xlLmxvZyhcImVuY29kZWQ6IFwiLCBlbmNvZGVkKTtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KFwiL2FwaS9wYXJzZXIvXCIgKyBlbmNvZGVkKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG5cdFx0XHQvL3JldHVybiByZXN1bHQuZGF0YVxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcInBhcnNlciByZXN1bHQ6IFwiLCByZXN1bHQuZGF0YSk7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS51c2VyaWQgPSB1c2VyaWQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVzZXJpZDogXCIsIHVzZXJpZCk7XG5cdFx0XHRyZXR1cm4gJGh0dHAucG9zdChcIi9hcGkvcGFnZXNcIiwgcmVzdWx0LmRhdGEpXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwicG9zdCByZXNwb25zZTogXCIsIHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH07XG5cblx0cmV0dXJuIFBhcnNlckZhY3Rvcnk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYXJ0aWNsZURldGFpbCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgc2NvcGU6IHt9LFxuICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL2FydGljbGVEZXRhaWxDYXJkL2RldGFpbC5odG1sJyxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xuXG4gICAgfVxuXG4gIH1cbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdiaW5kQ29tcGlsZWRIdG1sJywgWyckY29tcGlsZScsIGZ1bmN0aW9uKCRjb21waWxlKSB7XG4gIHJldHVybiB7XG4gICAgdGVtcGxhdGU6ICc8ZGl2PjwvZGl2PicsXG4gICAgc2NvcGU6IHtcbiAgICAgIHJhd0h0bWw6ICc9YmluZENvbXBpbGVkSHRtbCdcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtKSB7XG4gICAgICB2YXIgaW1ncyA9IFtdO1xuICAgICAgc2NvcGUuJHdhdGNoKCdyYXdIdG1sJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB2YXIgbmV3RWxlbSA9ICRjb21waWxlKHZhbHVlKShzY29wZS4kcGFyZW50KTtcbiAgICAgICAgZWxlbS5jb250ZW50cygpLnJlbW92ZSgpO1xuICAgICAgICBpbWdzID0gbmV3RWxlbS5maW5kKCdpbWcnKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWdzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgICBpbWdzW2ldLmFkZENsYXNzID0gJ2Zsb2F0UmlnaHQnXG4gICAgICAgIH1cbiAgICAgICAgZWxlbS5hcHBlbmQobmV3RWxlbSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59XSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgJG1kU2lkZW5hdiwgJG1kSW5rUmlwcGxlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xuXG4gICAgICAgICAgICBzY29wZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkbWRTaWRlbmF2KFwibGVmdFwiKS50b2dnbGUoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQYXJzZXInLCBzdGF0ZTogJ3BhcnNlcicgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnUGFnZXMnLCBzdGF0ZTogJ3BhZ2VzJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2lkZWJhcicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHNjb3BlOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuaHRtbCcsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcblx0XHQgICAgJChcIi5tZW51LXVwXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0ICAgIFx0aWYoJCh0aGlzKS5jc3MoJ3RyYW5zZm9ybScpXHQhPT0gJ25vbmUnKXtcblx0XHQgICAgXHRcdCQodGhpcykuY3NzKFwidHJhbnNmb3JtXCIsIFwiXCIpO1xuXHRcdCAgICBcdFx0aWYoJCh0aGlzKS5hdHRyKCdpZCcpID09PSAnc3Vic2NyaXB0aW9ucy1pY29uJylcblx0XHQgICAgXHRcdFx0JCgnI3N1YnNjcmlwdGlvbnMnKS5zaG93KDQwMCk7XG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdmb2xkZXJzLWljb24nKVxuXHRcdCAgICBcdFx0XHQkKCcjZm9sZGVycycpLnNob3coNDAwKTtcblx0XHQgICAgXHR9XG5cdFx0ICAgIFx0ZWxzZXtcblx0XHRcdFx0XHQkKHRoaXMpLmNzcyhcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgxODBkZWcpXCIpO1xuXHRcdCAgICBcdFx0aWYoJCh0aGlzKS5hdHRyKCdpZCcpID09PSAnc3Vic2NyaXB0aW9ucy1pY29uJylcblx0XHQgICAgXHRcdFx0JCgnI3N1YnNjcmlwdGlvbnMnKS5oaWRlKDQwMCk7XG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdmb2xkZXJzLWljb24nKVxuXHRcdCAgICBcdFx0XHQkKCcjZm9sZGVycycpLmhpZGUoNDAwKTtcdFx0XHRcdFxuXHRcdCAgICBcdH1cblx0XHRcdH0pO1xuXG5cdFx0fVxuXHR9XG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnc3BlZWREaWFsJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge30sXG4gICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvc3BlZWQtZGlhbC9zcGVlZC1kaWFsLmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlKSB7XG4gICAgICBzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgIHNjb3BlLmhlbGxvID0gXCJ3b3JsZFwiXG4gICAgfVxuICB9XG59KVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
