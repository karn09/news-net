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
        templateUrl: 'html/article-list/articles.html'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('article', {
        url: '/article',
        templateUrl: 'html/article-view/article-view.html',
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
        templateUrl: 'html/home/home.html'
    });
});
app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'html/login/login.html',
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
app.factory('PagesFactory', function ($http) {
    var PagesFactory = {};

    PagesFactory.getSaved = function () {
        return $http.get("/api/pages").then(function (response) {
            return response.data;
        });
    };

    return PagesFactory;
});
app.config(function ($stateProvider) {

    $stateProvider.state('pages', {
        url: '/pages',
        templateUrl: 'html/pages/pages.html', //Still need to make
        controller: 'PagesCtrl'
    });
});

app.controller('PagesCtrl', function ($scope, PagesFactory) {

    PagesFactory.getSaved().then(function (response) {
        $scope.pages = response;
    });
});
app.factory('ParserFactory', function ($http) {

    var ParserFactory = {};

    ParserFactory.parseUrl = function (url) {

        var encoded = encodeURIComponent(url);
        //console.log("encoded: ", encoded);
        return $http.get("/api/parser/" + encoded).then(function (result) {
            //return result.data;
            console.log("parser result: ", result.data);
            return $http.post("/api/pages", result.data).then(function (response) {
                console.log("post response: ", response.data);
                return response.data;
            });
        });
    };

    return ParserFactory;
});

app.config(function ($stateProvider) {

    $stateProvider.state('parser', {
        url: '/parser',
        templateUrl: 'html/parser/parser.html',
        controller: 'ParserCtrl'
    });
});

app.controller('ParserCtrl', function ($scope, $state, ParserFactory) {

    $scope.parseUrl = function () {

        //console.log("inside parserCtrl parseUrl: ", $scope.url);
        ParserFactory.parseUrl($scope.url).then(function (response) {
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

    detailObj.fetchAllByCategory = function (category) {
        // return all titles and summaries associated with current category
    };

    detailObj.fetchOneById = function (id) {};

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

app.directive('articleDetail', function () {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'html/article-detail/detail.html',
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
        templateUrl: 'html/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, $mdSidenav) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'html/common/directives/navbar/navbar.html',
        link: function link(scope, element) {

            scope.toggle = function () {
                $mdSidenav("left").toggle().then(function () {
                    // btn.toggleClass('md-focused')
                });
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
        templateUrl: 'html/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
app.directive('sidebar', function () {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/sidebar/sidebar.html'
    };
});

app.directive('speedDial', function () {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'html/speed-dial/speed-dial.html',
        link: function link(scope, element, attribute) {
            scope.isOpen = false;
            scope.count = 0;
            scope.hidden = false;
            scope.hover = false;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJwYWdlcy9wYWdlcy5mYWN0b3J5LmpzIiwicGFnZXMvcGFnZXMuanMiLCJwYXJzZXIvcGFyc2VyLmZhY3RvcnkuanMiLCJwYXJzZXIvcGFyc2VyLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVEZXRhaWwuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVWaWV3LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYXJ0aWNsZURldGFpbENhcmQvZGV0YWlsLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYmluZENvbXBpbGVkSHRtbC9iaW5kQ29tcGlsZWRIdG1sLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zcGVlZC1kaWFsL3NwZWVkLWRpYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQTs7QUFFQSxzQkFBQSxTQUFBLENBQUEsSUFBQTs7QUFFQSx1QkFBQSxTQUFBLENBQUEsR0FBQTs7QUFFQSx1QkFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0EsZUFBQSxRQUFBLENBQUEsTUFBQTtBQUNBLEtBRkE7QUFHQSxDQVRBOzs7QUFZQSxJQUFBLEdBQUEsQ0FBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7QUFHQSxRQUFBLCtCQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLE1BQUEsSUFBQSxJQUFBLE1BQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxLQUZBOzs7O0FBTUEsZUFBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBOztBQUVBLFlBQUEsQ0FBQSw2QkFBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0E7QUFDQTs7QUFFQSxZQUFBLFlBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBO0FBQ0E7OztBQUdBLGNBQUEsY0FBQTs7QUFFQSxvQkFBQSxlQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsZ0JBQUEsSUFBQSxFQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLFFBQUEsSUFBQSxFQUFBLFFBQUE7QUFDQSxhQUZBLE1BRUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsT0FBQTtBQUNBO0FBQ0EsU0FUQTtBQVdBLEtBNUJBO0FBOEJBLENBdkNBOztBQ2ZBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLGFBQUEsV0FEQTtBQUVBLHFCQUFBO0FBRkEsS0FBQTtBQUlBLENBTEE7O0FBT0EsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0EsYUFBQSxVQURBO0FBRUEscUJBQUEscUNBRkE7QUFHQSxpQkFBQTtBQUNBLHFCQUFBLGlCQUFBLGtCQUFBLEVBQUE7QUFDQSx1QkFBQSxtQkFBQSxjQUFBLEVBQUE7QUFDQTtBQUhBLFNBSEE7QUFRQSxvQkFBQTtBQVJBLEtBQUE7QUFVQSxDQVhBOztBQWFBLElBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsT0FBQSxHQUFBLE9BQUE7QUFDQSxXQUFBLEtBQUEsR0FBQSxRQUFBLEtBQUE7QUFDQSxXQUFBLE9BQUEsR0FBQSxRQUFBLE9BQUE7QUFDQSxDQUpBOztBQ3BCQSxDQUFBLFlBQUE7O0FBRUE7Ozs7QUFHQSxRQUFBLENBQUEsT0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBOztBQUVBLFFBQUEsTUFBQSxRQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBOztBQUVBLFFBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsWUFBQSxDQUFBLE9BQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQTtBQUNBLGVBQUEsT0FBQSxFQUFBLENBQUEsT0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0EsS0FIQTs7Ozs7QUFRQSxRQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxzQkFBQSxvQkFEQTtBQUVBLHFCQUFBLG1CQUZBO0FBR0EsdUJBQUEscUJBSEE7QUFJQSx3QkFBQSxzQkFKQTtBQUtBLDBCQUFBLHdCQUxBO0FBTUEsdUJBQUE7QUFOQSxLQUFBOztBQVNBLFFBQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFlBQUEsYUFBQTtBQUNBLGlCQUFBLFlBQUEsZ0JBREE7QUFFQSxpQkFBQSxZQUFBLGFBRkE7QUFHQSxpQkFBQSxZQUFBLGNBSEE7QUFJQSxpQkFBQSxZQUFBO0FBSkEsU0FBQTtBQU1BLGVBQUE7QUFDQSwyQkFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSwyQkFBQSxVQUFBLENBQUEsV0FBQSxTQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUE7QUFDQSx1QkFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUE7QUFDQTtBQUpBLFNBQUE7QUFNQSxLQWJBOztBQWVBLFFBQUEsTUFBQSxDQUFBLFVBQUEsYUFBQSxFQUFBO0FBQ0Esc0JBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBREEsRUFFQSxVQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLFVBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUE7QUFDQSxTQUpBLENBQUE7QUFNQSxLQVBBOztBQVNBLFFBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxFQUFBLEVBQUE7O0FBRUEsaUJBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxnQkFBQSxPQUFBLFNBQUEsSUFBQTtBQUNBLG9CQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsRUFBQSxLQUFBLElBQUE7QUFDQSx1QkFBQSxVQUFBLENBQUEsWUFBQSxZQUFBO0FBQ0EsbUJBQUEsS0FBQSxJQUFBO0FBQ0E7Ozs7QUFJQSxhQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxDQUFBLFFBQUEsSUFBQTtBQUNBLFNBRkE7O0FBSUEsYUFBQSxlQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7Ozs7Ozs7Ozs7QUFVQSxnQkFBQSxLQUFBLGVBQUEsTUFBQSxlQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsSUFBQSxDQUFBLFFBQUEsSUFBQSxDQUFBO0FBQ0E7Ozs7O0FBS0EsbUJBQUEsTUFBQSxHQUFBLENBQUEsVUFBQSxFQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLEtBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsSUFBQTtBQUNBLGFBRkEsQ0FBQTtBQUlBLFNBckJBOztBQXVCQSxhQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLE1BQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLEVBQ0EsSUFEQSxDQUNBLGlCQURBLEVBRUEsS0FGQSxDQUVBLFlBQUE7QUFDQSx1QkFBQSxHQUFBLE1BQUEsQ0FBQSxFQUFBLFNBQUEsNEJBQUEsRUFBQSxDQUFBO0FBQ0EsYUFKQSxDQUFBO0FBS0EsU0FOQTs7QUFRQSxhQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsTUFBQSxHQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esd0JBQUEsT0FBQTtBQUNBLDJCQUFBLFVBQUEsQ0FBQSxZQUFBLGFBQUE7QUFDQSxhQUhBLENBQUE7QUFJQSxTQUxBO0FBT0EsS0FyREE7O0FBdURBLFFBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxPQUFBLElBQUE7O0FBRUEsbUJBQUEsR0FBQSxDQUFBLFlBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsaUJBQUEsT0FBQTtBQUNBLFNBRkE7O0FBSUEsbUJBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFlBQUE7QUFDQSxpQkFBQSxPQUFBO0FBQ0EsU0FGQTs7QUFJQSxhQUFBLEVBQUEsR0FBQSxJQUFBO0FBQ0EsYUFBQSxJQUFBLEdBQUEsSUFBQTs7QUFFQSxhQUFBLE1BQUEsR0FBQSxVQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLEdBQUEsU0FBQTtBQUNBLGlCQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FIQTs7QUFLQSxhQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsaUJBQUEsRUFBQSxHQUFBLElBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLFNBSEE7QUFLQSxLQXpCQTtBQTJCQSxDQXBJQTs7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxhQUFBLEdBREE7QUFFQSxxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBO0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsbUJBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLGFBQUEsUUFEQTtBQUVBLHFCQUFBLHVCQUZBO0FBR0Esb0JBQUE7QUFIQSxLQUFBO0FBTUEsQ0FSQTs7QUFVQSxJQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBLEtBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLEdBQUEsSUFBQTs7QUFFQSxXQUFBLFNBQUEsR0FBQSxVQUFBLFNBQUEsRUFBQTs7QUFFQSxlQUFBLEtBQUEsR0FBQSxJQUFBOztBQUVBLG9CQUFBLEtBQUEsQ0FBQSxTQUFBLEVBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxtQkFBQSxFQUFBLENBQUEsTUFBQTtBQUNBLFNBRkEsRUFFQSxLQUZBLENBRUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsR0FBQSw0QkFBQTtBQUNBLFNBSkE7QUFNQSxLQVZBO0FBWUEsQ0FqQkE7QUNWQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxtQkFBQSxLQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0EsYUFBQSxlQURBO0FBRUEsa0JBQUEsbUVBRkE7QUFHQSxvQkFBQSxvQkFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0Esd0JBQUEsUUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHVCQUFBLEtBQUEsR0FBQSxLQUFBO0FBQ0EsYUFGQTtBQUdBLFNBUEE7OztBQVVBLGNBQUE7QUFDQSwwQkFBQTtBQURBO0FBVkEsS0FBQTtBQWVBLENBakJBOztBQW1CQSxJQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsUUFBQSxXQUFBLFNBQUEsUUFBQSxHQUFBO0FBQ0EsZUFBQSxNQUFBLEdBQUEsQ0FBQSwyQkFBQSxFQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLG1CQUFBLFNBQUEsSUFBQTtBQUNBLFNBRkEsQ0FBQTtBQUdBLEtBSkE7O0FBTUEsV0FBQTtBQUNBLGtCQUFBO0FBREEsS0FBQTtBQUlBLENBWkE7QUNuQkEsSUFBQSxPQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsUUFBQSxlQUFBLEVBQUE7O0FBRUEsaUJBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLE1BQUEsR0FBQSxDQUFBLFlBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLElBQUE7QUFDQSxTQUhBLENBQUE7QUFJQSxLQUxBOztBQU9BLFdBQUEsWUFBQTtBQUNBLENBWEE7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxtQkFBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsYUFBQSxRQURBO0FBRUEscUJBQUEsdUJBRkEsRTtBQUdBLG9CQUFBO0FBSEEsS0FBQTtBQU1BLENBUkE7O0FBVUEsSUFBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQTs7QUFFQSxpQkFBQSxRQUFBLEdBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxLQUFBLEdBQUEsUUFBQTtBQUNBLEtBSEE7QUFLQSxDQVBBO0FDVkEsSUFBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsZ0JBQUEsRUFBQTs7QUFFQSxrQkFBQSxRQUFBLEdBQUEsVUFBQSxHQUFBLEVBQUE7O0FBRUEsWUFBQSxVQUFBLG1CQUFBLEdBQUEsQ0FBQTs7QUFFQSxlQUFBLE1BQUEsR0FBQSxDQUFBLGlCQUFBLE9BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7O0FBRUEsb0JBQUEsR0FBQSxDQUFBLGlCQUFBLEVBQUEsT0FBQSxJQUFBO0FBQ0EsbUJBQUEsTUFBQSxJQUFBLENBQUEsWUFBQSxFQUFBLE9BQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHdCQUFBLEdBQUEsQ0FBQSxpQkFB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LGdCQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxzQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLGFBRkE7O0FBSUE7O0FBRUEsdUJBQUEsR0FBQSxDQUFBLFlBQUEsWUFBQSxFQUFBLE9BQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsWUFBQSxhQUFBLEVBQUEsVUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxVQUFBO0FBRUE7O0FBaERBLEtBQUE7QUFvREEsQ0F0REE7O0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEsMkRBRkE7QUFHQSxjQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBO0FDQUEsSUFBQSxTQUFBLENBQUEsU0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBO0FBSEEsS0FBQTtBQUtBLENBTkE7O0FDQUEsSUFBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBLGlDQUhBO0FBSUEsY0FBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBO0FBQ0Esa0JBQUEsTUFBQSxHQUFBLEtBQUE7QUFDQSxrQkFBQSxLQUFBLEdBQUEsQ0FBQTtBQUNBLGtCQUFBLE1BQUEsR0FBQSxLQUFBO0FBQ0Esa0JBQUEsS0FBQSxHQUFBLEtBQUE7QUFDQTtBQVRBLEtBQUE7QUFXQSxDQVpBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICduZ01hdGVyaWFsJ10pO1xyXG5cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xyXG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxyXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXHJcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxyXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXHJcbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxyXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcclxuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcclxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xyXG5cclxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcclxuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cclxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXHJcbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XHJcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cclxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxyXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXHJcbiAgICAgICAgICAgIGlmICh1c2VyKSB7XHJcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FydGljbGVzJywge1xyXG4gICAgICAgIHVybDogJy9hcnRpY2xlcycsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2FydGljbGUtbGlzdC9hcnRpY2xlcy5odG1sJ1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlJywge1xyXG4gICAgICAgIHVybDogJy9hcnRpY2xlJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvYXJ0aWNsZS12aWV3L2FydGljbGUtdmlldy5odG1sJyxcclxuICAgICAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgICBjdXJyZW50OiBmdW5jdGlvbihBcnRpY2xlVmlld0ZhY3RvcnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEFydGljbGVWaWV3RmFjdG9yeS5nZXRBcnRpY2xlQnlJZCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29udHJvbGxlcjogJ0FydGljbGVWaWV3Q3RybCdcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdBcnRpY2xlVmlld0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGN1cnJlbnQsICRjb21waWxlKSB7XHJcbiAgJHNjb3BlLmN1cnJlbnQgPSBjdXJyZW50O1xyXG4gICRzY29wZS50aXRsZSA9IGN1cnJlbnQudGl0bGU7XHJcbiAgJHNjb3BlLmNvbnRlbnQgPSBjdXJyZW50LmNvbnRlbnQ7XHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXHJcbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XHJcblxyXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcclxuXHJcbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXHJcbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxyXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cclxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XHJcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcclxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcclxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXHJcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXHJcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxyXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcclxuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcclxuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxyXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXHJcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXHJcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxuXHJcbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XHJcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXHJcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXHJcbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxyXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcclxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXHJcbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cclxuXHJcbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxyXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxyXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cclxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxyXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXHJcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XHJcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcclxuICAgICAgICB9O1xyXG5cclxuICAgIH0pO1xyXG5cclxufSkoKTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xyXG4gICAgICAgIHVybDogJy8nLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9ob21lL2hvbWUuaHRtbCdcclxuICAgIH0pO1xyXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcclxuICAgICAgICB1cmw6ICcvbG9naW4nLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9sb2dpbi9sb2dpbi5odG1sJyxcclxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgJHNjb3BlLmxvZ2luID0ge307XHJcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xyXG5cclxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XHJcblxyXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XHJcblxyXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xyXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XHJcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXHJcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXHJcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcclxuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXHJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxyXG4gICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xyXG5cclxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXHJcbiAgICB9O1xyXG5cclxufSk7IiwiYXBwLmZhY3RvcnkoJ1BhZ2VzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKXtcclxuXHR2YXIgUGFnZXNGYWN0b3J5ID0ge31cclxuXHJcblx0UGFnZXNGYWN0b3J5LmdldFNhdmVkID0gZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhZ2VzXCIpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdHJldHVybiBQYWdlc0ZhY3Rvcnk7XHJcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcil7XHJcblxyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwYWdlcycsIHtcclxuXHQgICAgdXJsOiAnL3BhZ2VzJyxcclxuXHQgICAgdGVtcGxhdGVVcmw6ICdodG1sL3BhZ2VzL3BhZ2VzLmh0bWwnLCAvL1N0aWxsIG5lZWQgdG8gbWFrZVxyXG5cdCAgICBjb250cm9sbGVyOiAnUGFnZXNDdHJsJ1xyXG5cdH0pO1xyXG5cclxufSlcclxuXHJcbmFwcC5jb250cm9sbGVyKCdQYWdlc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFBhZ2VzRmFjdG9yeSl7XHJcblxyXG5cdFBhZ2VzRmFjdG9yeS5nZXRTYXZlZCgpXHJcblx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0JHNjb3BlLnBhZ2VzID0gcmVzcG9uc2U7XHJcblx0fSlcclxuXHJcbn0pIiwiYXBwLmZhY3RvcnkoJ1BhcnNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XHJcblxyXG5cdHZhciBQYXJzZXJGYWN0b3J5ID0ge307XHJcblxyXG5cdFBhcnNlckZhY3RvcnkucGFyc2VVcmwgPSBmdW5jdGlvbih1cmwpIHtcclxuXHJcblx0XHR2YXIgZW5jb2RlZCA9IGVuY29kZVVSSUNvbXBvbmVudCh1cmwpO1xyXG5cdFx0Ly9jb25zb2xlLmxvZyhcImVuY29kZWQ6IFwiLCBlbmNvZGVkKTtcclxuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhcnNlci9cIiArIGVuY29kZWQpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpe1xyXG5cdFx0XHQvL3JldHVybiByZXN1bHQuZGF0YTtcclxuXHRcdFx0Y29uc29sZS5sb2coXCJwYXJzZXIgcmVzdWx0OiBcIiwgcmVzdWx0LmRhdGEpO1xyXG5cdFx0XHRyZXR1cm4gJGh0dHAucG9zdChcIi9hcGkvcGFnZXNcIiwgcmVzdWx0LmRhdGEpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhcInBvc3QgcmVzcG9uc2U6IFwiLCByZXNwb25zZS5kYXRhKTtcclxuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHRcdFx0fSlcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHJldHVybiBQYXJzZXJGYWN0b3J5O1xyXG5cclxufSk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblxyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BhcnNlcicsIHtcclxuICAgICAgICB1cmw6ICcvcGFyc2VyJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvcGFyc2VyL3BhcnNlci5odG1sJyxcclxuICAgICAgICBjb250cm9sbGVyOiAnUGFyc2VyQ3RybCdcclxuICAgIH0pO1xyXG5cclxufSk7XHJcblxyXG5hcHAuY29udHJvbGxlcignUGFyc2VyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgUGFyc2VyRmFjdG9yeSkge1xyXG5cclxuICAgICRzY29wZS5wYXJzZVVybCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcImluc2lkZSBwYXJzZXJDdHJsIHBhcnNlVXJsOiBcIiwgJHNjb3BlLnVybCk7XHJcbiAgICAgICAgUGFyc2VyRmFjdG9yeS5wYXJzZVVybCgkc2NvcGUudXJsKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAkc2NvcGUucGFyc2VkID0gcmVzcG9uc2U7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICB9O1xyXG5cclxufSk7XHJcblxyXG5cclxuIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXHJcbiAgICBdO1xyXG59KTtcclxuICIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcclxuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcclxuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXHJcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXHJcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcclxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcclxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxyXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcclxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcclxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcclxuICAgICAgICAnOkQnLFxyXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXHJcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcclxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcclxuICAgIF07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcclxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0pO1xyXG4iLCJhcHAuZmFjdG9yeSgnYXJ0aWNsZURldGFpbEZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xyXG4gIHZhciBkZXRhaWxPYmogPSB7fTtcclxuXHJcbiAgZGV0YWlsT2JqLmZldGNoQWxsQnlDYXRlZ29yeSA9IGZ1bmN0aW9uKGNhdGVnb3J5KSB7XHJcbiAgICAvLyByZXR1cm4gYWxsIHRpdGxlcyBhbmQgc3VtbWFyaWVzIGFzc29jaWF0ZWQgd2l0aCBjdXJyZW50IGNhdGVnb3J5XHJcbiAgfTtcclxuXHJcbiAgZGV0YWlsT2JqLmZldGNoT25lQnlJZCA9IGZ1bmN0aW9uKGlkKSB7XHJcblxyXG4gIH07XHJcblxyXG4gIGRldGFpbE9iai5hZGRBcnRpY2xlID0gZnVuY3Rpb24oY2F0ZWdvcnkpIHtcclxuICAgIC8vIGFkZCBvbmUgYXJ0aWNsZSB0byBjYXRlZ29yeVxyXG4gIH07XHJcblxyXG4gIGRldGFpbE9iai5yZW1vdmVBcnRpY2xlQnlJRCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gcmVtb3ZlIG9uIGFydGljbGUgYnkgSURcclxuICB9O1xyXG5cclxuICBkZXRhaWxPYmouc2F2ZUFydGljbGVCeVVybCA9IGZ1bmN0aW9uKHVybCwgY2F0ZWdvcnkpIHtcclxuICAgIC8vIGRlZmF1bHQgdG8gYWxsLCBvciBvcHRpb25hbCBjYXRlZ29yeVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRldGFpbE9iajtcclxufSlcclxuIiwiYXBwLmZhY3RvcnkoJ0FydGljbGVWaWV3RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xyXG5cdHZhciBhcnRpY2xlVmlld09iaiA9IHt9O1xyXG5cclxuXHRhcnRpY2xlVmlld09iai5nZXRBcnRpY2xlQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgcmV0dXJuIHRlbXBBcnRpY2xlT2JqO1xyXG5cdH07XHJcblxyXG5cdGFydGljbGVWaWV3T2JqLnJlbW92ZUFydGljbGVCeUlkID0gZnVuY3Rpb24gKGlkKSB7XHJcblxyXG5cdH07XHJcblxyXG4gIGFydGljbGVWaWV3T2JqLmFkZEFydGljbGVDYXRlZ29yeSA9IGZ1bmN0aW9uIChpZCwgY2F0KSB7XHJcblxyXG4gIH07XHJcblxyXG5cdHJldHVybiBhcnRpY2xlVmlld09iajtcclxufSlcclxuXHJcblxyXG52YXIgdGVtcEFydGljbGVPYmogPVxyXG4gIHtcclxuXHRcdFwiX192XCI6IDAsXHJcblx0XHRcImNvbnRlbnRcIjogXCI8ZGl2PjxhcnRpY2xlIGNsYXNzPVxcXCJjb250ZW50IGxpbmstdW5kZXJsaW5lIHJlbGF0aXZlIGJvZHktY29weVxcXCI+XFxuXFxuXFx0XFx0XFx0PHA+SW4gMTkzMiwgdGhlIER1dGNoIGFzdHJvbm9tZXIgSmFuIE9vcnQgdGFsbGllZCB0aGUgc3RhcnMgaW4gdGhlIE1pbGt5IFdheSBhbmQgZm91bmQgdGhhdCB0aGV5IGNhbWUgdXAgc2hvcnQuIEp1ZGdpbmcgYnkgdGhlIHdheSB0aGUgc3RhcnMgYm9iIHVwIGFuZCBkb3duIGxpa2UgaG9yc2VzIG9uIGEgY2Fyb3VzZWwgYXMgdGhleSBnbyBhcm91bmQgdGhlIHBsYW5lIG9mIHRoZSBnYWxheHksIE9vcnQgY2FsY3VsYXRlZCB0aGF0IHRoZXJlIG91Z2h0IHRvIGJlIHR3aWNlIGFzIG11Y2ggbWF0dGVyIGdyYXZpdGF0aW9uYWxseSBwcm9wZWxsaW5nIHRoZW0gYXMgaGUgY291bGQgc2VlLiBIZSBwb3N0dWxhdGVkIHRoZSBwcmVzZW5jZSBvZiBoaWRkZW4gJiN4MjAxQztkYXJrIG1hdHRlciYjeDIwMUQ7IHRvIG1ha2UgdXAgdGhlIGRpZmZlcmVuY2UgYW5kIHN1cm1pc2VkIHRoYXQgaXQgbXVzdCBiZSBjb25jZW50cmF0ZWQgaW4gYSBkaXNrIHRvIGV4cGxhaW4gdGhlIHN0YXJzJiN4MjAxOTsgbW90aW9ucy48L3A+XFxuXFxuXFxuPHA+QnV0IGNyZWRpdCBmb3IgdGhlIGRpc2NvdmVyeSBvZiBkYXJrIG1hdHRlciYjeDIwMTQ7dGhlIGludmlzaWJsZSwgdW5pZGVudGlmaWVkIHN0dWZmIHRoYXQgY29tcHJpc2VzIGZpdmUtc2l4dGhzIG9mIHRoZSB1bml2ZXJzZSYjeDIwMTk7cyBtYXNzJiN4MjAxNDt1c3VhbGx5IGdvZXMgdG8gdGhlIFN3aXNzLUFtZXJpY2FuIGFzdHJvbm9tZXIgRnJpdHogWndpY2t5LCB3aG8gaW5mZXJyZWQgaXRzIGV4aXN0ZW5jZSBmcm9tIHRoZSByZWxhdGl2ZSBtb3Rpb25zIG9mIGdhbGF4aWVzIGluIDE5MzMuIE9vcnQgaXMgcGFzc2VkIG92ZXIgb24gdGhlIGdyb3VuZHMgdGhhdCBoZSB3YXMgdHJhaWxpbmcgYSBmYWxzZSBjbHVlLiBCeSAyMDAwLCB1cGRhdGVkLCBPb3J0LXN0eWxlIGludmVudG9yaWVzIG9mIHRoZSBNaWxreSBXYXkgZGV0ZXJtaW5lZCB0aGF0IGl0cyAmI3gyMDFDO21pc3NpbmcmI3gyMDFEOyBtYXNzIGNvbnNpc3RzIG9mIGZhaW50IHN0YXJzLCBnYXMgYW5kIGR1c3QsIHdpdGggbm8gbmVlZCBmb3IgYSBkYXJrIGRpc2suIEVpZ2h0eSB5ZWFycyBvZiBoaW50cyBzdWdnZXN0IHRoYXQgZGFyayBtYXR0ZXIsIHdoYXRldmVyIGl0IGlzLCBmb3JtcyBzcGhlcmljYWwgY2xvdWRzIGNhbGxlZCAmI3gyMDFDO2hhbG9zJiN4MjAxRDsgYXJvdW5kIGdhbGF4aWVzLjwvcD5cXG48cD5PciBzbyBtb3N0IGRhcmsgbWF0dGVyIGh1bnRlcnMgaGF2ZSBpdC4gVGhvdWdoIGl0IGZlbGwgb3V0IG9mIGZhdm9yLCB0aGUgZGFyayBkaXNrIGlkZWEgbmV2ZXIgY29tcGxldGVseSB3ZW50IGF3YXkuIEFuZCByZWNlbnRseSwgaXQgaGFzIGZvdW5kIGEgaGlnaC1wcm9maWxlIGNoYW1waW9uIGluIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnBoeXNpY3MuaGFydmFyZC5lZHUvcGVvcGxlL2ZhY3BhZ2VzL3JhbmRhbGxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5MaXNhIFJhbmRhbGw8L2E+LCBhIHByb2Zlc3NvciBvZiBwaHlzaWNzIGF0IEhhcnZhcmQgVW5pdmVyc2l0eSwgd2hvIGhhcyByZXNjdWVkIHRoZSBkaXNrIGZyb20gc2NpZW50aWZpYyBvYmxpdmlvbiBhbmQgZ2l2ZW4gaXQgYW4gYWN0aXZlIHJvbGUgb24gdGhlIGdhbGFjdGljIHN0YWdlLjwvcD5cXG48cD5TaW5jZSA8YSBocmVmPVxcXCJodHRwOi8vYXJ4aXYub3JnL3BkZi8xMzAzLjE1MjF2Mi5wZGZcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5wcm9wb3NpbmcgdGhlIG1vZGVsPC9hPiBpbiAyMDEzLCBSYW5kYWxsIGFuZCBoZXIgY29sbGFib3JhdG9ycyBoYXZlIGFyZ3VlZCB0aGF0IGEgZGFyayBkaXNrIG1pZ2h0IGV4cGxhaW4gZ2FtbWEgcmF5cyBjb21pbmcgZnJvbSB0aGUgZ2FsYWN0aWMgY2VudGVyLCB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL3d3dy5uYXR1cmUuY29tL25hdHVyZS9qb3VybmFsL3Y1MTEvbjc1MTEvZnVsbC9uYXR1cmUxMzQ4MS5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cGxhbmFyIGRpc3RyaWJ1dGlvbiBvZiBkd2FyZiBnYWxheGllczwvYT4gb3JiaXRpbmcgdGhlIEFuZHJvbWVkYSBnYWxheHkgYW5kIHRoZSBNaWxreSBXYXksIGFuZCBldmVuIDxhIGhyZWY9XFxcImh0dHBzOi8vcGh5c2ljcy5hcHMub3JnL2ZlYXR1cmVkLWFydGljbGUtcGRmLzEwLjExMDMvUGh5c1JldkxldHQuMTEyLjE2MTMwMVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnBlcmlvZGljIHVwdGlja3Mgb2YgY29tZXQgaW1wYWN0czwvYT4gYW5kIG1hc3MgZXh0aW5jdGlvbnMgb24gRWFydGgsIGRpc2N1c3NlZCBpbiBSYW5kYWxsJiN4MjAxOTtzIDIwMTUgcG9wdWxhci1zY2llbmNlIGJvb2ssIDxlbT5EYXJrIE1hdHRlciBhbmQgdGhlIERpbm9zYXVyczwvZW0+LjwvcD5cXG48cD5CdXQgYXN0cm9waHlzaWNpc3RzIHdobyBkbyBpbnZlbnRvcmllcyBvZiB0aGUgTWlsa3kgV2F5IGhhdmUgcHJvdGVzdGVkLCBhcmd1aW5nIHRoYXQgdGhlIGdhbGF4eSYjeDIwMTk7cyB0b3RhbCBtYXNzIGFuZCB0aGUgYm9iYmluZyBtb3Rpb25zIG9mIGl0cyBzdGFycyBtYXRjaCB1cCB0b28gd2VsbCB0byBsZWF2ZSByb29tIGZvciBhIGRhcmsgZGlzay4gJiN4MjAxQztJdCYjeDIwMTk7cyBtb3JlIHN0cm9uZ2x5IGNvbnN0cmFpbmVkIHRoYW4gTGlzYSBSYW5kYWxsIHByZXRlbmRzLCYjeDIwMUQ7IHNhaWQgPGEgaHJlZj1cXFwiaHR0cDovL2FzdHJvLnV0b3JvbnRvLmNhL35ib3Z5L1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkpvIEJvdnk8L2E+LCBhbiBhc3Ryb3BoeXNpY2lzdCBhdCB0aGUgVW5pdmVyc2l0eSBvZiBUb3JvbnRvLjwvcD5cXG48cD5Ob3csIFJhbmRhbGwsIHdobyBoYXMgZGV2aXNlZCBpbmZsdWVudGlhbCBpZGVhcyBhYm91dCBzZXZlcmFsIG9mIHRoZSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNTA4MDMtcGh5c2ljcy10aGVvcmllcy1tYXAvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+YmlnZ2VzdCBxdWVzdGlvbnMgaW4gZnVuZGFtZW50YWwgcGh5c2ljczwvYT4sIGlzIGZpZ2h0aW5nIGJhY2suIEluIDxhIGhyZWY9XFxcImh0dHA6Ly9hcnhpdi5vcmcvYWJzLzE2MDQuMDE0MDdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5hIHBhcGVyPC9hPiBwb3N0ZWQgb25saW5lIGxhc3Qgd2VlayB0aGF0IGhhcyBiZWVuIGFjY2VwdGVkIGZvciBwdWJsaWNhdGlvbiBpbiA8ZW0+VGhlIEFzdHJvcGh5c2ljYWwgSm91cm5hbDwvZW0+LCBSYW5kYWxsIGFuZCBoZXIgc3R1ZGVudCwgRXJpYyBLcmFtZXIsIHJlcG9ydCBhIGRpc2stc2hhcGVkIGxvb3Bob2xlIGluIHRoZSBNaWxreSBXYXkgYW5hbHlzaXM6ICYjeDIwMUM7VGhlcmUgaXMgYW4gaW1wb3J0YW50IGRldGFpbCB0aGF0IGhhcyBzbyBmYXIgYmVlbiBvdmVybG9va2VkLCYjeDIwMUQ7IHRoZXkgd3JpdGUuICYjeDIwMUM7VGhlIGRpc2sgY2FuIGFjdHVhbGx5IG1ha2Ugcm9vbSBmb3IgaXRzZWxmLiYjeDIwMUQ7PC9wPlxcbjxmaWd1cmUgY2xhc3M9XFxcIndwLWNhcHRpb24gbGFuZHNjYXBlIGFsaWdubm9uZSBmYWRlciByZWxhdGl2ZVxcXCI+PGltZyBjbGFzcz1cXFwic2l6ZS10ZXh0LWNvbHVtbi13aWR0aCB3cC1pbWFnZS0yMDIyMjU1XFxcIiBzcmM9XFxcImh0dHBzOi8vd3d3LndpcmVkLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxNi8wNS8wNjEwMTRfcmFuZGFsbF8xNjI3XzMxMDU3NV85MDQ1MTgtNjE1eDQxMC00ODJ4MzIxLmpwZ1xcXCIgYWx0PVxcXCIwNjEwMTRfUmFuZGFsbF8xNjI3LmpwZ1xcXCIgd2lkdGg9XFxcIjQ4MlxcXCI+PGZpZ2NhcHRpb24gY2xhc3M9XFxcIndwLWNhcHRpb24tdGV4dCBsaW5rLXVuZGVybGluZVxcXCI+TGlzYSBSYW5kYWxsIG9mIEhhcnZhcmQgVW5pdmVyc2l0eSBpcyBhIGhpZ2gtcHJvZmlsZSBzdXBwb3J0ZXIgb2YgdGhlIGNvbnRyb3ZlcnNpYWwgZGFyayBkaXNrIGlkZWEuPHNwYW4gY2xhc3M9XFxcImNyZWRpdCBsaW5rLXVuZGVybGluZS1zbVxcXCI+Um9zZSBMaW5jb2xuL0hhcnZhcmQgVW5pdmVyc2l0eTwvc3Bhbj48L2ZpZ2NhcHRpb24+PC9maWd1cmU+XFxuPHA+SWYgdGhlcmUgaXMgYSB0aGluIGRhcmsgZGlzayBjb3Vyc2luZyB0aHJvdWdoIHRoZSAmI3gyMDFDO21pZHBsYW5lJiN4MjAxRDsgb2YgdGhlIGdhbGF4eSwgUmFuZGFsbCBhbmQgS3JhbWVyIGFyZ3VlLCB0aGVuIGl0IHdpbGwgZ3Jhdml0YXRpb25hbGx5IHBpbmNoIG90aGVyIG1hdHRlciBpbndhcmQsIHJlc3VsdGluZyBpbiBhIGhpZ2hlciBkZW5zaXR5IG9mIHN0YXJzLCBnYXMgYW5kIGR1c3QgYXQgdGhlIG1pZHBsYW5lIHRoYW4gYWJvdmUgYW5kIGJlbG93LiBSZXNlYXJjaGVycyB0eXBpY2FsbHkgZXN0aW1hdGUgdGhlIHRvdGFsIHZpc2libGUgbWFzcyBvZiB0aGUgTWlsa3kgV2F5IGJ5IGV4dHJhcG9sYXRpbmcgb3V0d2FyZCBmcm9tIHRoZSBtaWRwbGFuZSBkZW5zaXR5OyBpZiB0aGVyZSYjeDIwMTk7cyBhIHBpbmNoaW5nIGVmZmVjdCwgdGhlbiB0aGlzIGV4dHJhcG9sYXRpb24gbGVhZHMgdG8gYW4gb3ZlcmVzdGltYXRpb24gb2YgdGhlIHZpc2libGUgbWFzcywgbWFraW5nIGl0IHNlZW0gYXMgaWYgdGhlIG1hc3MgbWF0Y2hlcyB1cCB0byB0aGUgc3RhcnMmI3gyMDE5OyBtb3Rpb25zLiAmI3gyMDFDO1RoYXQmI3gyMDE5O3MgdGhlIHJlYXNvbiB3aHkgYSBsb3Qgb2YgdGhlc2UgcHJldmlvdXMgc3R1ZGllcyBkaWQgbm90IHNlZSBldmlkZW5jZSBmb3IgYSBkYXJrIGRpc2ssJiN4MjAxRDsgS3JhbWVyIHNhaWQuIEhlIGFuZCBSYW5kYWxsIGZpbmQgdGhhdCBhIHRoaW4gZGFyayBkaXNrIGlzIHBvc3NpYmxlJiN4MjAxNDthbmQgaW4gb25lIHdheSBvZiByZWRvaW5nIHRoZSBhbmFseXNpcywgc2xpZ2h0bHkgZmF2b3JlZCBvdmVyIG5vIGRhcmsgZGlzay48L3A+XFxuPHA+JiN4MjAxQztMaXNhJiN4MjAxOTtzIHdvcmsgaGFzIHJlb3BlbmVkIHRoZSBjYXNlLCYjeDIwMUQ7IHNhaWQgPGEgaHJlZj1cXFwiaHR0cDovL2FzdHJvbm9teS5zd2luLmVkdS5hdS9zdGFmZi9jZmx5bm4uaHRtbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkNocmlzIEZseW5uPC9hPiBvZiBTd2luYnVybmUgVW5pdmVyc2l0eSBvZiBUZWNobm9sb2d5IGluIE1lbGJvdXJuZSwgQXVzdHJhbGlhLCB3aG8sIHdpdGggSm9oYW4gSG9sbWJlcmcsIGNvbmR1Y3RlZCBhIHNlcmllcyBvZiBNaWxreSBXYXkgaW52ZW50b3JpZXMgaW4gdGhlIGVhcmx5IGF1Z2h0cyB0aGF0IHNlZW1lZCB0byA8YSBocmVmPVxcXCJodHRwOi8vb25saW5lbGlicmFyeS53aWxleS5jb20vZG9pLzEwLjEwNDYvai4xMzY1LTg3MTEuMjAwMC4wMjkwNS54L2Fic3RyYWN0XFxcIj5yb2J1c3RseSBzd2VlcCBpdCBjbGVhbjwvYT4gb2YgYSBkYXJrIGRpc2suPC9wPlxcbjxwPkJvdnkgZGlzYWdyZWVzLiBFdmVuIHRha2luZyB0aGUgcGluY2hpbmcgZWZmZWN0IGludG8gYWNjb3VudCwgaGUgZXN0aW1hdGVzIHRoYXQgYXQgbW9zdCAyIHBlcmNlbnQgb2YgdGhlIHRvdGFsIGFtb3VudCBvZiBkYXJrIG1hdHRlciBjYW4gbGllIGluIGEgZGFyayBkaXNrLCB3aGlsZSB0aGUgcmVzdCBtdXN0IGZvcm0gYSBoYWxvLiAmI3gyMDFDO0kgdGhpbmsgbW9zdCBwZW9wbGUgd2FudCB0byBmaWd1cmUgb3V0IHdoYXQgOTggcGVyY2VudCBvZiB0aGUgZGFyayBtYXR0ZXIgaXMgYWJvdXQsIG5vdCB3aGF0IDIgcGVyY2VudCBvZiBpdCBpcyBhYm91dCwmI3gyMDFEOyBoZSBzYWlkLjwvcD5cXG48cD5UaGUgZGViYXRlJiN4MjAxNDthbmQgdGhlIGZhdGUgb2YgdGhlIGRhcmsgZGlzayYjeDIwMTQ7d2lsbCBwcm9iYWJseSBiZSBkZWNpZGVkIHNvb24uIFRoZSBFdXJvcGVhbiBTcGFjZSBBZ2VuY3kmI3gyMDE5O3MgR2FpYSBzYXRlbGxpdGUgaXMgY3VycmVudGx5IHN1cnZleWluZyB0aGUgcG9zaXRpb25zIGFuZCB2ZWxvY2l0aWVzIG9mIG9uZSBiaWxsaW9uIHN0YXJzLCBhbmQgYSBkZWZpbml0aXZlIGludmVudG9yeSBvZiB0aGUgTWlsa3kgV2F5IGNvdWxkIGJlIGNvbXBsZXRlZCBhcyBzb29uIGFzIG5leHQgc3VtbWVyLjwvcD5cXG48cD5UaGUgZGlzY292ZXJ5IG9mIGEgZGFyayBkaXNrLCBvZiBhbnkgc2l6ZSwgd291bGQgYmUgZW5vcm1vdXNseSByZXZlYWxpbmcuIElmIG9uZSBleGlzdHMsIGRhcmsgbWF0dGVyIGlzIGZhciBtb3JlIGNvbXBsZXggdGhhbiByZXNlYXJjaGVycyBoYXZlIGxvbmcgdGhvdWdodC4gTWF0dGVyIHNldHRsZXMgaW50byBhIGRpc2sgc2hhcGUgb25seSBpZiBpdCBpcyBhYmxlIHRvIHNoZWQgZW5lcmd5LCBhbmQgdGhlIGVhc2llc3Qgd2F5IGZvciBpdCB0byBzaGVkIHN1ZmZpY2llbnQgZW5lcmd5IGlzIGlmIGl0IGZvcm1zIGF0b21zLiBUaGUgZXhpc3RlbmNlIG9mIGRhcmsgYXRvbXMgd291bGQgbWVhbiBkYXJrIHByb3RvbnMgYW5kIGRhcmsgZWxlY3Ryb25zIHRoYXQgYXJlIGNoYXJnZWQgaW4gYSBzaW1pbGFyIHN0eWxlIGFzIHZpc2libGUgcHJvdG9ucyBhbmQgZWxlY3Ryb25zLCBpbnRlcmFjdGluZyB3aXRoIGVhY2ggb3RoZXIgdmlhIGEgZGFyayBmb3JjZSB0aGF0IGlzIGNvbnZleWVkIGJ5IGRhcmsgcGhvdG9ucy4gRXZlbiBpZiA5OCBwZXJjZW50IG9mIGRhcmsgbWF0dGVyIGlzIGluZXJ0LCBhbmQgZm9ybXMgaGFsb3MsIHRoZSBleGlzdGVuY2Ugb2YgZXZlbiBhIHRoaW4gZGFyayBkaXNrIHdvdWxkIGltcGx5IGEgcmljaCAmI3gyMDFDO2Rhcmsgc2VjdG9yJiN4MjAxRDsgb2YgdW5rbm93biBwYXJ0aWNsZXMgYXMgZGl2ZXJzZSwgcGVyaGFwcywgYXMgdGhlIHZpc2libGUgdW5pdmVyc2UuICYjeDIwMUM7Tm9ybWFsIG1hdHRlciBpcyBwcmV0dHkgY29tcGxleDsgdGhlcmUmI3gyMDE5O3Mgc3R1ZmYgdGhhdCBwbGF5cyBhIHJvbGUgaW4gYXRvbXMgYW5kIHRoZXJlJiN4MjAxOTtzIHN0dWZmIHRoYXQgZG9lc24mI3gyMDE5O3QsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vd3d3LnBoeXNpY3MudWNpLmVkdS9+YnVsbG9jay9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5KYW1lcyBCdWxsb2NrPC9hPiwgYW4gYXN0cm9waHlzaWNpc3QgYXQgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLiAmI3gyMDFDO1NvIGl0JiN4MjAxOTtzIG5vdCBjcmF6eSB0byBpbWFnaW5lIHRoYXQgdGhlIG90aGVyIGZpdmUtc2l4dGhzIFtvZiB0aGUgbWF0dGVyIGluIHRoZSB1bml2ZXJzZV0gaXMgcHJldHR5IGNvbXBsZXgsIGFuZCB0aGF0IHRoZXJlJiN4MjAxOTtzIHNvbWUgcGllY2Ugb2YgdGhhdCBkYXJrIHNlY3RvciB0aGF0IHdpbmRzIHVwIGluIGJvdW5kIGF0b21zLiYjeDIwMUQ7PC9wPlxcbjxwPlRoZSBub3Rpb24gdGhhdCA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNTA4MjAtdGhlLWNhc2UtZm9yLWNvbXBsZXgtZGFyay1tYXR0ZXIvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+ZGFyayBtYXR0ZXIgbWlnaHQgYmUgY29tcGxleDwvYT4gaGFzIGdhaW5lZCB0cmFjdGlvbiBpbiByZWNlbnQgeWVhcnMsIGFpZGVkIGJ5IGFzdHJvcGh5c2ljYWwgYW5vbWFsaWVzIHRoYXQgZG8gbm90IGdlbCB3aXRoIHRoZSBsb25nLXJlaWduaW5nIHByb2ZpbGUgb2YgZGFyayBtYXR0ZXIgYXMgcGFzc2l2ZSwgc2x1Z2dpc2ggJiN4MjAxQzt3ZWFrbHkgaW50ZXJhY3RpbmcgbWFzc2l2ZSBwYXJ0aWNsZXMuJiN4MjAxRDsgVGhlc2UgYW5vbWFsaWVzLCBwbHVzIHRoZSBmYWlsdXJlIG9mICYjeDIwMUM7V0lNUHMmI3gyMDFEOyB0byBzaG93IHVwIGluIGV4aGF1c3RpdmUgZXhwZXJpbWVudGFsIHNlYXJjaGVzIGFsbCBvdmVyIHRoZSB3b3JsZCwgaGF2ZSB3ZWFrZW5lZCB0aGUgV0lNUCBwYXJhZGlnbSwgYW5kIHVzaGVyZWQgaW4gYSBuZXcsIGZyZWUtZm9yLWFsbCBlcmEsIGluIHdoaWNoIHRoZSBuYXR1cmUgb2YgdGhlIGRhcmsgYmVhc3QgaXMgYW55Ym9keSYjeDIwMTk7cyBndWVzcy48L3A+XFxuPHA+VGhlIGZpZWxkIHN0YXJ0ZWQgb3BlbmluZyB1cCBhcm91bmQgMjAwOCwgd2hlbiBhbiBleHBlcmltZW50IGNhbGxlZCBQQU1FTEEgZGV0ZWN0ZWQgYW4gZXhjZXNzIG9mIHBvc2l0cm9ucyBvdmVyIGVsZWN0cm9ucyBjb21pbmcgZnJvbSBzcGFjZSYjeDIwMTQ7YW4gYXN5bW1ldHJ5IHRoYXQgZnVlbGVkIGludGVyZXN0IGluICYjeDIwMUM7PGEgaHJlZj1cXFwiaHR0cDovL2FyeGl2Lm9yZy9hYnMvMDkwMS40MTE3XFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+YXN5bW1ldHJpYyBkYXJrIG1hdHRlcjwvYT4sJiN4MjAxRDsgYSBub3ctcG9wdWxhciBtb2RlbCBwcm9wb3NlZCBieSA8YSBocmVmPVxcXCJodHRwOi8vd3d3LXRoZW9yeS5sYmwuZ292L3dvcmRwcmVzcy8/cGFnZV9pZD02ODUxXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+S2F0aHJ5biBadXJlazwvYT4gYW5kIGNvbGxhYm9yYXRvcnMuIEF0IHRoZSB0aW1lLCB0aGVyZSB3ZXJlIGZldyBpZGVhcyBvdGhlciB0aGFuIFdJTVBzIGluIHBsYXkuICYjeDIwMUM7VGhlcmUgd2VyZSBtb2RlbC1idWlsZGVycyBsaWtlIG1lIHdobyByZWFsaXplZCB0aGF0IGRhcmsgbWF0dGVyIHdhcyBqdXN0IGV4dHJhb3JkaW5hcmlseSB1bmRlcmRldmVsb3BlZCBpbiB0aGlzIGRpcmVjdGlvbiwmI3gyMDFEOyBzYWlkIFp1cmVrLCBub3cgb2YgTGF3cmVuY2UgQmVya2VsZXkgTmF0aW9uYWwgTGFib3JhdG9yeSBpbiBDYWxpZm9ybmlhLiAmI3gyMDFDO1NvIHdlIGRvdmUgaW4uJiN4MjAxRDs8L3A+XFxuPGZpZ3VyZSBjbGFzcz1cXFwid3AtY2FwdGlvbiBsYW5kc2NhcGUgYWxpZ25ub25lIGZhZGVyIHJlbGF0aXZlXFxcIj48aW1nIGNsYXNzPVxcXCJzaXplLXRleHQtY29sdW1uLXdpZHRoIHdwLWltYWdlLTIwMjIyNTlcXFwiIHNyYz1cXFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzAyNF9Qcm9mQnVsbG9jay02MTV4NTAwLTQ4MngzOTIuanBnXFxcIiBhbHQ9XFxcIkphbWVzIEJ1bGxvY2sgb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLCBzZWVzIGRhcmsgbWF0dGVyIGFzIHBvdGVudGlhbGx5IGNvbXBsZXggYW5kIHNlbGYtaW50ZXJhY3RpbmcsIGJ1dCBub3QgbmVjZXNzYXJpbHkgY29uY2VudHJhdGVkIGluIHRoaW4gZGlza3MuXFxcIiB3aWR0aD1cXFwiNDgyXFxcIj48ZmlnY2FwdGlvbiBjbGFzcz1cXFwid3AtY2FwdGlvbi10ZXh0IGxpbmstdW5kZXJsaW5lXFxcIj5KYW1lcyBCdWxsb2NrIG9mIHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIElydmluZSwgc2VlcyBkYXJrIG1hdHRlciBhcyBwb3RlbnRpYWxseSBjb21wbGV4IGFuZCBzZWxmLWludGVyYWN0aW5nLCBidXQgbm90IG5lY2Vzc2FyaWx5IGNvbmNlbnRyYXRlZCBpbiB0aGluIGRpc2tzLjxzcGFuIGNsYXNzPVxcXCJjcmVkaXQgbGluay11bmRlcmxpbmUtc21cXFwiPkpvbmF0aGFuIEFsY29ybiBmb3IgUXVhbnRhIE1hZ2F6aW5lPC9zcGFuPjwvZmlnY2FwdGlvbj48L2ZpZ3VyZT5cXG48cD5Bbm90aGVyIHRyaWdnZXIgaGFzIGJlZW4gdGhlIGRlbnNpdHkgb2YgZHdhcmYgZ2FsYXhpZXMuIFdoZW4gcmVzZWFyY2hlcnMgdHJ5IHRvIHNpbXVsYXRlIHRoZWlyIGZvcm1hdGlvbiwgZHdhcmYgZ2FsYXhpZXMgdHlwaWNhbGx5IHR1cm4gb3V0IHRvbyBkZW5zZSBpbiB0aGVpciBjZW50ZXJzLCB1bmxlc3MgcmVzZWFyY2hlcnMgYXNzdW1lIHRoYXQgZGFyayBtYXR0ZXIgcGFydGljbGVzIGludGVyYWN0IHdpdGggb25lIGFub3RoZXIgdmlhIGRhcmsgZm9yY2VzLiBBZGQgdG9vIG11Y2ggaW50ZXJhY3Rpdml0eSwgaG93ZXZlciwgYW5kIHlvdSBtdWNrIHVwIHNpbXVsYXRpb25zIG9mIHN0cnVjdHVyZSBmb3JtYXRpb24gaW4gdGhlIGVhcmx5IHVuaXZlcnNlLiAmI3gyMDFDO1doYXQgd2UmI3gyMDE5O3JlIHRyeWluZyB0byBkbyBpcyBmaWd1cmUgb3V0IHdoYXQgaXMgYWxsb3dlZCwmI3gyMDFEOyBzYWlkIEJ1bGxvY2ssIHdobyBidWlsZHMgc3VjaCBzaW11bGF0aW9ucy4gTW9zdCBtb2RlbGVycyBhZGQgd2VhayBpbnRlcmFjdGlvbnMgdGhhdCBkb24mI3gyMDE5O3QgYWZmZWN0IHRoZSBoYWxvIHNoYXBlIG9mIGRhcmsgbWF0dGVyLiBCdXQgJiN4MjAxQztyZW1hcmthYmx5LCYjeDIwMUQ7IEJ1bGxvY2sgc2FpZCwgJiN4MjAxQzt0aGVyZSBpcyBhIGNsYXNzIG9mIGRhcmsgbWF0dGVyIHRoYXQgYWxsb3dzIGZvciBkaXNrcy4mI3gyMDFEOyBJbiB0aGF0IGNhc2UsIG9ubHkgYSB0aW55IGZyYWN0aW9uIG9mIGRhcmsgbWF0dGVyIHBhcnRpY2xlcyBpbnRlcmFjdCwgYnV0IHRoZXkgZG8gc28gc3Ryb25nbHkgZW5vdWdoIHRvIGRpc3NpcGF0ZSBlbmVyZ3kmI3gyMDE0O2FuZCB0aGVuIGZvcm0gZGlza3MuPC9wPlxcbjxwPlJhbmRhbGwgYW5kIGhlciBjb2xsYWJvcmF0b3JzIEppSmkgRmFuLCBBbmRyZXkgS2F0eiBhbmQgTWF0dGhldyBSZWVjZSBtYWRlIHRoZWlyIHdheSB0byB0aGlzIGlkZWEgaW4gMjAxMyBieSB0aGUgc2FtZSBwYXRoIGFzIE9vcnQ6IFRoZXkgd2VyZSB0cnlpbmcgdG8gZXhwbGFpbiBhbiBhcHBhcmVudCBNaWxreSBXYXkgYW5vbWFseS4gS25vd24gYXMgdGhlICYjeDIwMUM7RmVybWkgbGluZSwmI3gyMDFEOyBpdCB3YXMgYW4gZXhjZXNzIG9mIGdhbW1hIHJheXMgb2YgYSBjZXJ0YWluIGZyZXF1ZW5jeSBjb21pbmcgZnJvbSB0aGUgZ2FsYWN0aWMgY2VudGVyLiAmI3gyMDFDO09yZGluYXJ5IGRhcmsgbWF0dGVyIHdvdWxkbiYjeDIwMTk7dCBhbm5paGlsYXRlIGVub3VnaCYjeDIwMUQ7IHRvIHByb2R1Y2UgdGhlIEZlcm1pIGxpbmUsIFJhbmRhbGwgc2FpZCwgJiN4MjAxQztzbyB3ZSB0aG91Z2h0LCB3aGF0IGlmIGl0IHdhcyBtdWNoIGRlbnNlcj8mI3gyMDFEOyBUaGUgZGFyayBkaXNrIHdhcyByZWJvcm4uIFRoZSBGZXJtaSBsaW5lIHZhbmlzaGVkIGFzIG1vcmUgZGF0YSBhY2N1bXVsYXRlZCwgYnV0IHRoZSBkaXNrIGlkZWEgc2VlbWVkIHdvcnRoIGV4cGxvcmluZyBhbnl3YXkuIEluIDIwMTQsIFJhbmRhbGwgYW5kIFJlZWNlIGh5cG90aGVzaXplZCB0aGF0IHRoZSBkaXNrIG1pZ2h0IGFjY291bnQgZm9yIHBvc3NpYmxlIDMwLSB0byAzNS1taWxsaW9uLXllYXIgaW50ZXJ2YWxzIGJldHdlZW4gZXNjYWxhdGVkIG1ldGVvciBhbmQgY29tZXQgYWN0aXZpdHksIGEgc3RhdGlzdGljYWxseSB3ZWFrIHNpZ25hbCB0aGF0IHNvbWUgc2NpZW50aXN0cyBoYXZlIHRlbnRhdGl2ZWx5IHRpZWQgdG8gcGVyaW9kaWMgbWFzcyBleHRpbmN0aW9ucy4gRWFjaCB0aW1lIHRoZSBzb2xhciBzeXN0ZW0gYm9icyB1cCBvciBkb3duIHRocm91Z2ggdGhlIGRhcmsgZGlzayBvbiB0aGUgTWlsa3kgV2F5IGNhcm91c2VsLCB0aGV5IGFyZ3VlZCwgdGhlIGRpc2smI3gyMDE5O3MgZ3Jhdml0YXRpb25hbCBlZmZlY3QgbWlnaHQgZGVzdGFiaWxpemUgcm9ja3MgYW5kIGNvbWV0cyBpbiB0aGUgT29ydCBjbG91ZCYjeDIwMTQ7YSBzY3JhcHlhcmQgb24gdGhlIG91dHNraXJ0cyBvZiB0aGUgc29sYXIgc3lzdGVtIG5hbWVkIGZvciBKYW4gT29ydC4gVGhlc2Ugb2JqZWN0cyB3b3VsZCBnbyBodXJ0bGluZyB0b3dhcmQgdGhlIGlubmVyIHNvbGFyIHN5c3RlbSwgc29tZSBzdHJpa2luZyBFYXJ0aC48L3A+XFxuPHA+QnV0IFJhbmRhbGwgYW5kIGhlciB0ZWFtIGRpZCBvbmx5IGEgY3Vyc29yeSYjeDIwMTQ7YW5kIGluY29ycmVjdCYjeDIwMTQ7YW5hbHlzaXMgb2YgaG93IG11Y2ggcm9vbSB0aGVyZSBpcyBmb3IgYSBkYXJrIGRpc2sgaW4gdGhlIE1pbGt5IFdheSYjeDIwMTk7cyBtYXNzIGJ1ZGdldCwganVkZ2luZyBieSB0aGUgbW90aW9ucyBvZiBzdGFycy4gJiN4MjAxQztUaGV5IG1hZGUgc29tZSBraW5kIG9mIG91dHJhZ2VvdXMgY2xhaW1zLCYjeDIwMUQ7IEJvdnkgc2FpZC48L3A+XFxuPHA+UmFuZGFsbCwgd2hvIHN0YW5kcyBvdXQgKGFjY29yZGluZyB0byBSZWVjZSkgZm9yICYjeDIwMUM7aGVyIHBlcnNpc3RlbmNlLCYjeDIwMUQ7IHB1dCBLcmFtZXIgb24gdGhlIGNhc2UsIHNlZWtpbmcgdG8gYWRkcmVzcyB0aGUgY3JpdGljcyBhbmQsIHNoZSBzYWlkLCAmI3gyMDFDO3RvIGlyb24gb3V0IGFsbCB0aGUgd3JpbmtsZXMmI3gyMDFEOyBpbiB0aGUgYW5hbHlzaXMgYmVmb3JlIEdhaWEgZGF0YSBiZWNvbWVzIGF2YWlsYWJsZS4gSGVyIGFuZCBLcmFtZXImI3gyMDE5O3MgbmV3IGFuYWx5c2lzIHNob3dzIHRoYXQgdGhlIGRhcmsgZGlzaywgaWYgaXQgZXhpc3RzLCBjYW5ub3QgYmUgYXMgZGVuc2UgYXMgaGVyIHRlYW0gaW5pdGlhbGx5IHRob3VnaHQgcG9zc2libGUuIEJ1dCB0aGVyZSBpcyBpbmRlZWQgd2lnZ2xlIHJvb20gZm9yIGEgdGhpbiBkYXJrIGRpc2sgeWV0LCBkdWUgYm90aCB0byBpdHMgcGluY2hpbmcgZWZmZWN0IGFuZCB0byBhZGRpdGlvbmFsIHVuY2VydGFpbnR5IGNhdXNlZCBieSBhIG5ldCBkcmlmdCBpbiB0aGUgTWlsa3kgV2F5IHN0YXJzIHRoYXQgaGF2ZSBiZWVuIG1vbml0b3JlZCB0aHVzIGZhci48L3A+XFxuXFxuXFxuXFxuPHA+Tm93IHRoZXJlJiN4MjAxOTtzIGEgbmV3IHByb2JsZW0sIDxhIGhyZWY9XFxcImh0dHA6Ly9pb3BzY2llbmNlLmlvcC5vcmcvYXJ0aWNsZS8xMC4xMDg4LzAwMDQtNjM3WC84MTQvMS8xM1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnJhaXNlZDwvYT4gaW4gPGVtPlRoZSBBc3Ryb3BoeXNpY2FsIEpvdXJuYWw8L2VtPiBieSA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm8uYmVya2VsZXkuZWR1L2ZhY3VsdHktcHJvZmlsZS9jaHJpcy1tY2tlZVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkNocmlzIE1jS2VlPC9hPiBvZiB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBCZXJrZWxleSwgYW5kIGNvbGxhYm9yYXRvcnMuIE1jS2VlIGNvbmNlZGVzIHRoYXQgYSB0aGluIGRhcmsgZGlzayBjYW4gc3RpbGwgYmUgc3F1ZWV6ZWQgaW50byB0aGUgTWlsa3kgV2F5JiN4MjAxOTtzIG1hc3MgYnVkZ2V0LiBCdXQgdGhlIGRpc2sgbWlnaHQgYmUgc28gdGhpbiB0aGF0IGl0IHdvdWxkIGNvbGxhcHNlLiBDaXRpbmcgcmVzZWFyY2ggZnJvbSB0aGUgMTk2MHMgYW5kICYjeDIwMTk7NzBzLCBNY0tlZSBhbmQgY29sbGVhZ3VlcyBhcmd1ZSB0aGF0IGRpc2tzIGNhbm5vdCBiZSBzaWduaWZpY2FudGx5IHRoaW5uZXIgdGhhbiB0aGUgZGlzayBvZiB2aXNpYmxlIGdhcyBpbiB0aGUgTWlsa3kgV2F5IHdpdGhvdXQgZnJhZ21lbnRpbmcuICYjeDIwMUM7SXQgaXMgcG9zc2libGUgdGhhdCB0aGUgZGFyayBtYXR0ZXIgdGhleSBjb25zaWRlciBoYXMgc29tZSBwcm9wZXJ0eSB0aGF0IGlzIGRpZmZlcmVudCBmcm9tIG9yZGluYXJ5IG1hdHRlciBhbmQgcHJldmVudHMgdGhpcyBmcm9tIGhhcHBlbmluZywgYnV0IEkgZG9uJiN4MjAxOTt0IGtub3cgd2hhdCB0aGF0IGNvdWxkIGJlLCYjeDIwMUQ7IE1jS2VlIHNhaWQuPC9wPlxcbjxwPlJhbmRhbGwgaGFzIG5vdCB5ZXQgcGFycmllZCB0aGlzIGxhdGVzdCBhdHRhY2ssIGNhbGxpbmcgaXQgJiN4MjAxQzthIHRyaWNreSBpc3N1ZSYjeDIwMUQ7IHRoYXQgaXMgJiN4MjAxQzt1bmRlciBjb25zaWRlcmF0aW9uIG5vdy4mI3gyMDFEOyBTaGUgaGFzIGFsc28gdGFrZW4gb24gdGhlIHBvaW50IHJhaXNlZCBieSBCb3Z5JiN4MjAxNDt0aGF0IGEgZGlzayBvZiBjaGFyZ2VkIGRhcmsgYXRvbXMgaXMgaXJyZWxldmFudCBuZXh0IHRvIHRoZSBuYXR1cmUgb2YgOTggcGVyY2VudCBvZiBkYXJrIG1hdHRlci4gU2hlIGlzIG5vdyBpbnZlc3RpZ2F0aW5nIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGFsbCBkYXJrIG1hdHRlciBtaWdodCBiZSBjaGFyZ2VkIHVuZGVyIHRoZSBzYW1lIGRhcmsgZm9yY2UsIGJ1dCBiZWNhdXNlIG9mIGEgc3VycGx1cyBvZiBkYXJrIHByb3RvbnMgb3ZlciBkYXJrIGVsZWN0cm9ucywgb25seSBhIHRpbnkgZnJhY3Rpb24gYmVjb21lIGJvdW5kIGluIGF0b21zIGFuZCB3aW5kIHVwIGluIGEgZGlzay4gSW4gdGhhdCBjYXNlLCB0aGUgZGlzayBhbmQgaGFsbyB3b3VsZCBiZSBtYWRlIG9mIHRoZSBzYW1lIGluZ3JlZGllbnRzLCAmI3gyMDFDO3doaWNoIHdvdWxkIGJlIG1vcmUgZWNvbm9taWNhbCwmI3gyMDFEOyBzaGUgc2FpZC4gJiN4MjAxQztXZSB0aG91Z2h0IHRoYXQgd291bGQgYmUgcnVsZWQgb3V0LCBidXQgaXQgd2FzbiYjeDIwMTk7dC4mI3gyMDFEOzwvcD5cXG48cD5UaGUgZGFyayBkaXNrIHN1cnZpdmVzLCBmb3Igbm93JiN4MjAxNDthIHN5bWJvbCBvZiBhbGwgdGhhdCBpc24mI3gyMDE5O3Qga25vd24gYWJvdXQgdGhlIGRhcmsgc2lkZSBvZiB0aGUgdW5pdmVyc2UuICYjeDIwMUM7SSB0aGluayBpdCYjeDIwMTk7cyB2ZXJ5LCB2ZXJ5IGhlYWx0aHkgZm9yIHRoZSBmaWVsZCB0aGF0IHlvdSBoYXZlIHBlb3BsZSB0aGlua2luZyBhYm91dCBhbGwga2luZHMgb2YgZGlmZmVyZW50IGlkZWFzLCYjeDIwMUQ7IHNhaWQgQnVsbG9jay4gJiN4MjAxQztCZWNhdXNlIGl0JiN4MjAxOTtzIHF1aXRlIHRydWUgdGhhdCB3ZSBkb24mI3gyMDE5O3Qga25vdyB3aGF0IHRoZSBoZWNrIHRoYXQgZGFyayBtYXR0ZXIgaXMsIGFuZCB5b3UgbmVlZCB0byBiZSBvcGVuLW1pbmRlZCBhYm91dCBpdC4mI3gyMDFEOzwvcD5cXG48cD48ZW0+PGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnLzIwMTYwNDEyLWRlYmF0ZS1pbnRlbnNpZmllcy1vdmVyLWRhcmstZGlzay10aGVvcnkvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+T3JpZ2luYWwgc3Rvcnk8L2E+IHJlcHJpbnRlZCB3aXRoIHBlcm1pc3Npb24gZnJvbSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5RdWFudGEgTWFnYXppbmU8L2E+LCBhbiBlZGl0b3JpYWxseSBpbmRlcGVuZGVudCBwdWJsaWNhdGlvbiBvZiB0aGUgPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cuc2ltb25zZm91bmRhdGlvbi5vcmdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5TaW1vbnMgRm91bmRhdGlvbjwvYT4gd2hvc2UgbWlzc2lvbiBpcyB0byBlbmhhbmNlIHB1YmxpYyB1bmRlcnN0YW5kaW5nIG9mIHNjaWVuY2UgYnkgY292ZXJpbmcgcmVzZWFyY2ggZGV2ZWxvcG1lbnRzIGFuZCB0cmVuZHMgaW4gbWF0aGVtYXRpY3MgYW5kIHRoZSBwaHlzaWNhbCBhbmQgbGlmZSBzY2llbmNlcy48L2VtPjwvcD5cXG5cXG5cXHRcXHRcXHQ8YSBjbGFzcz1cXFwidmlzdWFsbHktaGlkZGVuIHNraXAtdG8tdGV4dC1saW5rIGZvY3VzYWJsZSBiZy13aGl0ZVxcXCIgaHJlZj1cXFwiaHR0cDovL3d3dy53aXJlZC5jb20vMjAxNi8wNi9kZWJhdGUtaW50ZW5zaWZpZXMtZGFyay1kaXNrLXRoZW9yeS8jc3RhcnQtb2YtY29udGVudFxcXCI+R28gQmFjayB0byBUb3AuIFNraXAgVG86IFN0YXJ0IG9mIEFydGljbGUuPC9hPlxcblxcblxcdFxcdFxcdFxcblxcdFxcdDwvYXJ0aWNsZT5cXG5cXG5cXHRcXHQ8L2Rpdj5cIixcclxuXHRcdFwiZGF0ZVB1Ymxpc2hlZFwiOiBcIjIwMTYtMDYtMDQgMDA6MDA6MDBcIixcclxuXHRcdFwiZG9tYWluXCI6IFwid3d3LndpcmVkLmNvbVwiLFxyXG5cdFx0XCJleGNlcnB0XCI6IFwiSW4gMTkzMiwgdGhlIER1dGNoIGFzdHJvbm9tZXIgSmFuIE9vcnQgdGFsbGllZCB0aGUgc3RhcnMgaW4gdGhlIE1pbGt5IFdheSBhbmQgZm91bmQgdGhhdCB0aGV5IGNhbWUgdXAgc2hvcnQuIEp1ZGdpbmcgYnkgdGhlIHdheSB0aGUgc3RhcnMgYm9iIHVwIGFuZCBkb3duIGxpa2UgaG9yc2VzIG9uIGEgY2Fyb3VzZWwgYXMgdGhleSBnbyBhcm91bmQmaGVsbGlwO1wiLFxyXG5cdFx0XCJsZWFkSW1hZ2VVcmxcIjogXCJodHRwczovL3d3dy53aXJlZC5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMTYvMDUvMDYxMDE0X3JhbmRhbGxfMTYyN18zMTA1NzVfOTA0NTE4LTYxNXg0MTAtNDgyeDMyMS5qcGdcIixcclxuXHRcdFwidGl0bGVcIjogXCJBIERpc2sgb2YgRGFyayBNYXR0ZXIgTWlnaHQgUnVuIFRocm91Z2ggT3VyIEdhbGF4eVwiLFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwOi8vd3d3LndpcmVkLmNvbS8yMDE2LzA2L2RlYmF0ZS1pbnRlbnNpZmllcy1kYXJrLWRpc2stdGhlb3J5L1wiLFxyXG5cdFx0XCJfaWRcIjogXCI1NzUyZWU1NTIyYWZiMmQ0MGI4NWYyNjdcIlxyXG5cdH07XHJcbiIsImFwcC5kaXJlY3RpdmUoJ2FydGljbGVEZXRhaWwnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgIHNjb3BlOiB7fSxcclxuICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9hcnRpY2xlLWRldGFpbC9kZXRhaWwuaHRtbCcsXHJcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgfVxyXG59KVxyXG4iLCJhcHAuZGlyZWN0aXZlKCdiaW5kQ29tcGlsZWRIdG1sJywgWyckY29tcGlsZScsIGZ1bmN0aW9uKCRjb21waWxlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHRlbXBsYXRlOiAnPGRpdj48L2Rpdj4nLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgcmF3SHRtbDogJz1iaW5kQ29tcGlsZWRIdG1sJ1xyXG4gICAgfSxcclxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtKSB7XHJcbiAgICAgIHZhciBpbWdzID0gW107XHJcbiAgICAgIHNjb3BlLiR3YXRjaCgncmF3SHRtbCcsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBuZXdFbGVtID0gJGNvbXBpbGUodmFsdWUpKHNjb3BlLiRwYXJlbnQpO1xyXG4gICAgICAgIGVsZW0uY29udGVudHMoKS5yZW1vdmUoKTtcclxuICAgICAgICBpbWdzID0gbmV3RWxlbS5maW5kKCdpbWcnKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICBpbWdzW2ldLmFkZENsYXNzID0gJ2Zsb2F0UmlnaHQnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZW0uYXBwZW5kKG5ld0VsZW0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59XSk7XHJcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXHJcbiAgICB9O1xyXG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUsICRtZFNpZGVuYXYpIHtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgc2NvcGU6IHt9LFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xyXG5cclxuICAgICAgICAgICAgc2NvcGUudG9nZ2xlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgJG1kU2lkZW5hdihcImxlZnRcIikudG9nZ2xlKClcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBidG4udG9nZ2xlQ2xhc3MoJ21kLWZvY3VzZWQnKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcclxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1BhcnNlcicsIHN0YXRlOiAncGFyc2VyJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1BhZ2VzJywgc3RhdGU6ICdwYWdlcycgfSxcclxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHNldFVzZXIoKTtcclxuXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxufSk7XHJcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2lkZWJhcicsIGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHNjb3BlOiB7fSxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvc2lkZWJhci9zaWRlYmFyLmh0bWwnLFxyXG5cdH1cclxufSlcclxuIiwiYXBwLmRpcmVjdGl2ZSgnc3BlZWREaWFsJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICBzY29wZToge30sXHJcbiAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvc3BlZWQtZGlhbC9zcGVlZC1kaWFsLmh0bWwnLFxyXG4gICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGUpIHtcclxuICAgICAgc2NvcGUuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgIHNjb3BlLmNvdW50ID0gMDtcclxuICAgICAgc2NvcGUuaGlkZGVuID0gZmFsc2U7XHJcbiAgICAgIHNjb3BlLmhvdmVyID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
