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
            scope.hello = "world";
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJwYWdlcy9wYWdlcy5mYWN0b3J5LmpzIiwicGFnZXMvcGFnZXMuanMiLCJwYXJzZXIvcGFyc2VyLmZhY3RvcnkuanMiLCJwYXJzZXIvcGFyc2VyLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVEZXRhaWwuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVWaWV3LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYXJ0aWNsZURldGFpbENhcmQvZGV0YWlsLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYmluZENvbXBpbGVkSHRtbC9iaW5kQ29tcGlsZWRIdG1sLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zcGVlZC1kaWFsL3NwZWVkLWRpYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQTs7QUFFQSxzQkFB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QUEsV0FBQSxTQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUE7QUFDQSx1QkFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUE7QUFDQTtBQUpBLFNBQUE7QUFNQSxLQWJBOztBQWVBLFFBQUEsTUFBQSxDQUFBLFVBQUEsYUFBQSxFQUFBO0FBQ0Esc0JBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBREEsRUFFQSxVQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLFVBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUE7QUFDQSxTQUpBLENBQUE7QUFNQSxLQVBBOztBQVNBLFFBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxFQUFBLEVBQUE7O0FBRUEsaUJBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxnQkFBQSxPQUFBLFNBQUEsSUFBQTtBQUNBLG9CQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsRUFBQSxLQUFBLElBQUE7QUFDQSx1QkFBQSxVQUFBLENBQUEsWUFBQSxZQUFBO0FBQ0EsbUJBQUEsS0FBQSxJQUFBO0FBQ0E7Ozs7QUFJQSxhQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxDQUFBLFFBQUEsSUFBQTtBQUNBLFNBRkE7O0FBSUEsYUFBQSxlQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7Ozs7Ozs7Ozs7QUFVQSxnQkFBQSxLQUFBLGVBQUEsTUFBQSxlQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsSUFBQSxDQUFBLFFBQUEsSUFBQSxDQUFBO0FBQ0E7Ozs7O0FBS0EsbUJBQUEsTUFBQSxHQUFBLENBQUEsVUFBQSxFQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLEtBQUEsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsSUFBQTtBQUNBLGFBRkEsQ0FBQTtBQUlBLFNBckJBOztBQXVCQSxhQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLE1BQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLEVB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LEtBSkE7O0FBTUEsV0FBQTtBQUNBLGtCQUFBO0FBREEsS0FBQTtBQUlBLENBWkE7QUNuQkEsSUFBQSxPQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsUUFBQSxlQUFBLEVBQUE7O0FBRUEsaUJBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLE1BQUEsR0FBQSxDQUFBLFlBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLElBQUE7QUFDQSxTQUhBLENBQUE7QUFJQSxLQUxBOztBQU9BLFdBQUEsWUFBQTtBQUNBLENBWEE7QUNBQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxtQkFBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsYUFBQSxRQURBO0FBRUEscUJBQUEsdUJBRkEsRTtBQUdBLG9CQUFBO0FBSEEsS0FBQTtBQU1BLENBUkE7O0FBVUEsSUFBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQTs7QUFFQSxpQkFBQSxRQUFBLEdBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxLQUFBLEdBQUEsUUFBQTtBQUNBLEtBSEE7QUFLQSxDQVBBO0FDVkEsSUFBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsZ0JBQUEsRUFBQTs7QUFFQSxrQkFBQSxRQUFBLEdBQUEsVUFBQSxHQUFBLEVBQUE7O0FBRUEsWUFBQSxVQUFBLG1CQUFBLEdBQUEsQ0FBQTs7QUFFQSxlQUFBLE1BQUEsR0FBQSxDQUFBLGlCQUFBLE9BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7O0FBRUEsb0JBQUEsR0FBQSxDQUFBLGlCQUFBLEVBQUEsT0FBQSxJQUFBO0FBQ0EsbUJBQUEsTUFBQSxJQUFBLENBQUEsWUFBQSxFQUFBLE9BQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHdCQUFBLEdBQUEsQ0FBQSxpQkFB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LGdCQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxzQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLGFBRkE7O0FBSUE7O0FBRUEsdUJBQUEsR0FBQSxDQUFBLFlBQUEsWUFBQSxFQUFBLE9BQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsWUFBQSxhQUFBLEVBQUEsVUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxVQUFBO0FBRUE7O0FBaERBLEtBQUE7QUFvREEsQ0F0REE7O0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxrQkFBQSxHQURBO0FBRUEscUJBQUEsMkRBRkE7QUFHQSxjQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsUUFBQSxHQUFBLGdCQUFBLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBO0FDQUEsSUFBQSxTQUFBLENBQUEsU0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBO0FBSEEsS0FBQTtBQUtBLENBTkE7O0FDQUEsSUFBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBLGlDQUhBO0FBSUEsY0FBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBO0FBQ0Esa0JBQUEsTUFBQSxHQUFBLEtBQUE7QUFDQSxrQkFBQSxLQUFBLEdBQUEsT0FBQTtBQUNBO0FBUEEsS0FBQTtBQVNBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0Jztcclxud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ25nTWF0ZXJpYWwnXSk7XHJcblxyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XHJcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXHJcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XHJcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cclxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcclxuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXHJcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cclxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xyXG5cclxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXHJcbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xyXG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxyXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XHJcblxyXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xyXG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxyXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcclxuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cclxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcclxuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxyXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXHJcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cclxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcclxuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0pO1xyXG5cclxufSk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXJ0aWNsZXMnLCB7XHJcbiAgICAgICAgdXJsOiAnL2FydGljbGVzJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvYXJ0aWNsZS1saXN0L2FydGljbGVzLmh0bWwnXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FydGljbGUnLCB7XHJcbiAgICAgICAgdXJsOiAnL2FydGljbGUnLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9hcnRpY2xlLXZpZXcvYXJ0aWNsZS12aWV3Lmh0bWwnLFxyXG4gICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgIGN1cnJlbnQ6IGZ1bmN0aW9uKEFydGljbGVWaWV3RmFjdG9yeSkge1xyXG4gICAgICAgICAgICByZXR1cm4gQXJ0aWNsZVZpZXdGYWN0b3J5LmdldEFydGljbGVCeUlkKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb250cm9sbGVyOiAnQXJ0aWNsZVZpZXdDdHJsJ1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ0FydGljbGVWaWV3Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgY3VycmVudCwgJGNvbXBpbGUpIHtcclxuICAkc2NvcGUuY3VycmVudCA9IGN1cnJlbnQ7XHJcbiAgJHNjb3BlLnRpdGxlID0gY3VycmVudC50aXRsZTtcclxuICAkc2NvcGUuY29udGVudCA9IGN1cnJlbnQuY29udGVudDtcclxufSk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cclxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcclxuXHJcbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xyXG5cclxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcclxuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cclxuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXHJcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxyXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcclxuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxyXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxyXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcclxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcclxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXHJcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXHJcbiAgICB9KTtcclxuXHJcbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xyXG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xyXG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXHJcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcclxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcclxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcclxuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcclxuICAgICAgICAgICAgJyRpbmplY3RvcicsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cclxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXHJcbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxyXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cclxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxyXG5cclxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXHJcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXHJcbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxyXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXHJcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcclxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcclxuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcclxuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSk7XHJcblxyXG59KSgpO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XHJcbiAgICAgICAgdXJsOiAnLycsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2hvbWUvaG9tZS5odG1sJ1xyXG4gICAgfSk7XHJcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblxyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xyXG4gICAgICAgIHVybDogJy9sb2dpbicsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2xvZ2luL2xvZ2luLmh0bWwnLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgICAkc2NvcGUubG9naW4gPSB7fTtcclxuICAgICRzY29wZS5lcnJvciA9IG51bGw7XHJcblxyXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcclxuXHJcbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XHJcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcclxuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcclxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcclxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xyXG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG5cclxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XHJcblxyXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcclxuICAgIH07XHJcblxyXG59KTsiLCJhcHAuZmFjdG9yeSgnUGFnZXNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApe1xyXG5cdHZhciBQYWdlc0ZhY3RvcnkgPSB7fVxyXG5cclxuXHRQYWdlc0ZhY3RvcnkuZ2V0U2F2ZWQgPSBmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFnZXNcIilcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIFBhZ2VzRmFjdG9yeTtcclxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKXtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BhZ2VzJywge1xyXG5cdCAgICB1cmw6ICcvcGFnZXMnLFxyXG5cdCAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvcGFnZXMvcGFnZXMuaHRtbCcsIC8vU3RpbGwgbmVlZCB0byBtYWtlXHJcblx0ICAgIGNvbnRyb2xsZXI6ICdQYWdlc0N0cmwnXHJcblx0fSk7XHJcblxyXG59KVxyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ1BhZ2VzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgUGFnZXNGYWN0b3J5KXtcclxuXHJcblx0UGFnZXNGYWN0b3J5LmdldFNhdmVkKClcclxuXHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcblx0XHQkc2NvcGUucGFnZXMgPSByZXNwb25zZTtcclxuXHR9KVxyXG5cclxufSkiLCJhcHAuZmFjdG9yeSgnUGFyc2VyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKXtcclxuXHJcblx0dmFyIFBhcnNlckZhY3RvcnkgPSB7fTtcclxuXHJcblx0UGFyc2VyRmFjdG9yeS5wYXJzZVVybCA9IGZ1bmN0aW9uKHVybCkge1xyXG5cclxuXHRcdHZhciBlbmNvZGVkID0gZW5jb2RlVVJJQ29tcG9uZW50KHVybCk7XHJcblx0XHQvL2NvbnNvbGUubG9nKFwiZW5jb2RlZDogXCIsIGVuY29kZWQpO1xyXG5cdFx0cmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFyc2VyL1wiICsgZW5jb2RlZClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XHJcblx0XHRcdC8vcmV0dXJuIHJlc3VsdC5kYXRhO1xyXG5cdFx0XHRjb25zb2xlLmxvZyhcInBhcnNlciByZXN1bHQ6IFwiLCByZXN1bHQuZGF0YSk7XHJcblx0XHRcdHJldHVybiAkaHR0cC5wb3N0KFwiL2FwaS9wYWdlc1wiLCByZXN1bHQuZGF0YSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwicG9zdCByZXNwb25zZTogXCIsIHJlc3BvbnNlLmRhdGEpO1xyXG5cdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cdFx0XHR9KVxyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0cmV0dXJuIFBhcnNlckZhY3Rvcnk7XHJcblxyXG59KTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncGFyc2VyJywge1xyXG4gICAgICAgIHVybDogJy9wYXJzZXInLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9wYXJzZXIvcGFyc2VyLmh0bWwnLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQYXJzZXJDdHJsJ1xyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdQYXJzZXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBQYXJzZXJGYWN0b3J5KSB7XHJcblxyXG4gICAgJHNjb3BlLnBhcnNlVXJsID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5zaWRlIHBhcnNlckN0cmwgcGFyc2VVcmw6IFwiLCAkc2NvcGUudXJsKTtcclxuICAgICAgICBQYXJzZXJGYWN0b3J5LnBhcnNlVXJsKCRzY29wZS51cmwpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICRzY29wZS5wYXJzZWQgPSByZXNwb25zZTtcclxuICAgICAgICB9KVxyXG5cclxuICAgIH07XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcclxuICAgIF07XHJcbn0pO1xyXG4gIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xyXG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xyXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcclxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcclxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxyXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxyXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXHJcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxyXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxyXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxyXG4gICAgICAgICc6RCcsXHJcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcclxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxyXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxyXG4gICAgXTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxyXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSk7XHJcbiIsImFwcC5mYWN0b3J5KCdhcnRpY2xlRGV0YWlsRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XHJcbiAgdmFyIGRldGFpbE9iaiA9IHt9O1xyXG5cclxuICBkZXRhaWxPYmouZmV0Y2hBbGxCeUNhdGVnb3J5ID0gZnVuY3Rpb24oY2F0ZWdvcnkpIHtcclxuICAgIC8vIHJldHVybiBhbGwgdGl0bGVzIGFuZCBzdW1tYXJpZXMgYXNzb2NpYXRlZCB3aXRoIGN1cnJlbnQgY2F0ZWdvcnlcclxuICB9O1xyXG5cclxuICBkZXRhaWxPYmouZmV0Y2hPbmVCeUlkID0gZnVuY3Rpb24oaWQpIHtcclxuXHJcbiAgfTtcclxuXHJcbiAgZGV0YWlsT2JqLmFkZEFydGljbGUgPSBmdW5jdGlvbihjYXRlZ29yeSkge1xyXG4gICAgLy8gYWRkIG9uZSBhcnRpY2xlIHRvIGNhdGVnb3J5XHJcbiAgfTtcclxuXHJcbiAgZGV0YWlsT2JqLnJlbW92ZUFydGljbGVCeUlEID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvLyByZW1vdmUgb24gYXJ0aWNsZSBieSBJRFxyXG4gIH07XHJcblxyXG4gIGRldGFpbE9iai5zYXZlQXJ0aWNsZUJ5VXJsID0gZnVuY3Rpb24odXJsLCBjYXRlZ29yeSkge1xyXG4gICAgLy8gZGVmYXVsdCB0byBhbGwsIG9yIG9wdGlvbmFsIGNhdGVnb3J5XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGV0YWlsT2JqO1xyXG59KVxyXG4iLCJhcHAuZmFjdG9yeSgnQXJ0aWNsZVZpZXdGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XHJcblx0dmFyIGFydGljbGVWaWV3T2JqID0ge307XHJcblxyXG5cdGFydGljbGVWaWV3T2JqLmdldEFydGljbGVCeUlkID0gZnVuY3Rpb24gKGlkKSB7XHJcbiAgICByZXR1cm4gdGVtcEFydGljbGVPYmo7XHJcblx0fTtcclxuXHJcblx0YXJ0aWNsZVZpZXdPYmoucmVtb3ZlQXJ0aWNsZUJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuXHJcblx0fTtcclxuXHJcbiAgYXJ0aWNsZVZpZXdPYmouYWRkQXJ0aWNsZUNhdGVnb3J5ID0gZnVuY3Rpb24gKGlkLCBjYXQpIHtcclxuXHJcbiAgfTtcclxuXHJcblx0cmV0dXJuIGFydGljbGVWaWV3T2JqO1xyXG59KVxyXG5cclxuXHJcbnZhciB0ZW1wQXJ0aWNsZU9iaiA9XHJcbiAge1xyXG5cdFx0XCJfX3ZcIjogMCxcclxuXHRcdFwiY29udGVudFwiOiBcIjxkaXY+PGFydGljbGUgY2xhc3M9XFxcImNvbnRlbnQgbGluay11bmRlcmxpbmUgcmVsYXRpdmUgYm9keS1jb3B5XFxcIj5cXG5cXG5cXHRcXHRcXHQ8cD5JbiAxOTMyLCB0aGUgRHV0Y2ggYXN0cm9ub21lciBKYW4gT29ydCB0YWxsaWVkIHRoZSBzdGFycyBpbiB0aGUgTWlsa3kgV2F5IGFuZCBmb3VuZCB0aGF0IHRoZXkgY2FtZSB1cCBzaG9ydC4gSnVkZ2luZyBieSB0aGUgd2F5IHRoZSBzdGFycyBib2IgdXAgYW5kIGRvd24gbGlrZSBob3JzZXMgb24gYSBjYXJvdXNlbCBhcyB0aGV5IGdvIGFyb3VuZCB0aGUgcGxhbmUgb2YgdGhlIGdhbGF4eSwgT29ydCBjYWxjdWxhdGVkIHRoYXQgdGhlcmUgb3VnaHQgdG8gYmUgdHdpY2UgYXMgbXVjaCBtYXR0ZXIgZ3Jhdml0YXRpb25hbGx5IHByb3BlbGxpbmcgdGhlbSBhcyBoZSBjb3VsZCBzZWUuIEhlIHBvc3R1bGF0ZWQgdGhlIHByZXNlbmNlIG9mIGhpZGRlbiAmI3gyMDFDO2RhcmsgbWF0dGVyJiN4MjAxRDsgdG8gbWFrZSB1cCB0aGUgZGlmZmVyZW5jZSBhbmQgc3VybWlzZWQgdGhhdCBpdCBtdXN0IGJlIGNvbmNlbnRyYXRlZCBpbiBhIGRpc2sgdG8gZXhwbGFpbiB0aGUgc3RhcnMmI3gyMDE5OyBtb3Rpb25zLjwvcD5cXG5cXG5cXG48cD5CdXQgY3JlZGl0IGZvciB0aGUgZGlzY292ZXJ5IG9mIGRhcmsgbWF0dGVyJiN4MjAxNDt0aGUgaW52aXNpYmxlLCB1bmlkZW50aWZpZWQgc3R1ZmYgdGhhdCBjb21wcmlzZXMgZml2ZS1zaXh0aHMgb2YgdGhlIHVuaXZlcnNlJiN4MjAxOTtzIG1hc3MmI3gyMDE0O3VzdWFsbHkgZ29lcyB0byB0aGUgU3dpc3MtQW1lcmljYW4gYXN0cm9ub21lciBGcml0eiBad2lja3ksIHdobyBpbmZlcnJlZCBpdHMgZXhpc3RlbmNlIGZyb20gdGhlIHJlbGF0aXZlIG1vdGlvbnMgb2YgZ2FsYXhpZXMgaW4gMTkzMy4gT29ydCBpcyBwYXNzZWQgb3ZlciBvbiB0aGUgZ3JvdW5kcyB0aGF0IGhlIHdhcyB0cmFpbGluZyBhIGZhbHNlIGNsdWUuIEJ5IDIwMDAsIHVwZGF0ZWQsIE9vcnQtc3R5bGUgaW52ZW50b3JpZXMgb2YgdGhlIE1pbGt5IFdheSBkZXRlcm1pbmVkIHRoYXQgaXRzICYjeDIwMUM7bWlzc2luZyYjeDIwMUQ7IG1hc3MgY29uc2lzdHMgb2YgZmFpbnQgc3RhcnMsIGdhcyBhbmQgZHVzdCwgd2l0aCBubyBuZWVkIGZvciBhIGRhcmsgZGlzay4gRWlnaHR5IHllYXJzIG9mIGhpbnRzIHN1Z2dlc3QgdGhhdCBkYXJrIG1hdHRlciwgd2hhdGV2ZXIgaXQgaXMsIGZvcm1zIHNwaGVyaWNhbCBjbG91ZHMgY2FsbGVkICYjeDIwMUM7aGFsb3MmI3gyMDFEOyBhcm91bmQgZ2FsYXhpZXMuPC9wPlxcbjxwPk9yIHNvIG1vc3QgZGFyayBtYXR0ZXIgaHVudGVycyBoYXZlIGl0LiBUaG91Z2ggaXQgZmVsbCBvdXQgb2YgZmF2b3IsIHRoZSBkYXJrIGRpc2sgaWRlYSBuZXZlciBjb21wbGV0ZWx5IHdlbnQgYXdheS4gQW5kIHJlY2VudGx5LCBpdCBoYXMgZm91bmQgYSBoaWdoLXByb2ZpbGUgY2hhbXBpb24gaW4gPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucGh5c2ljcy5oYXJ2YXJkLmVkdS9wZW9wbGUvZmFjcGFnZXMvcmFuZGFsbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkxpc2EgUmFuZGFsbDwvYT4sIGEgcHJvZmVzc29yIG9mIHBoeXNpY3MgYXQgSGFydmFyZCBVbml2ZXJzaXR5LCB3aG8gaGFzIHJlc2N1ZWQgdGhlIGRpc2sgZnJvbSBzY2llbnRpZmljIG9ibGl2aW9uIGFuZCBnaXZlbiBpdCBhbiBhY3RpdmUgcm9sZSBvbiB0aGUgZ2FsYWN0aWMgc3RhZ2UuPC9wPlxcbjxwPlNpbmNlIDxhIGhyZWY9XFxcImh0dHA6Ly9hcnhpdi5vcmcvcGRmLzEzMDMuMTUyMXYyLnBkZlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnByb3Bvc2luZyB0aGUgbW9kZWw8L2E+IGluIDIwMTMsIFJhbmRhbGwgYW5kIGhlciBjb2xsYWJvcmF0b3JzIGhhdmUgYXJndWVkIHRoYXQgYSBkYXJrIGRpc2sgbWlnaHQgZXhwbGFpbiBnYW1tYSByYXlzIGNvbWluZyBmcm9tIHRoZSBnYWxhY3RpYyBjZW50ZXIsIHRoZSA8YSBocmVmPVxcXCJodHRwOi8vd3d3Lm5hdHVyZS5jb20vbmF0dXJlL2pvdXJuYWwvdjUxMS9uNzUxMS9mdWxsL25hdHVyZTEzNDgxLmh0bWxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5wbGFuYXIgZGlzdHJpYnV0aW9uIG9mIGR3YXJmIGdhbGF4aWVzPC9hPiBvcmJpdGluZyB0aGUgQW5kcm9tZWRhIGdhbGF4eSBhbmQgdGhlIE1pbGt5IFdheSwgYW5kIGV2ZW4gPGEgaHJlZj1cXFwiaHR0cHM6Ly9waHlzaWNzLmFwcy5vcmcvZmVhdHVyZWQtYXJ0aWNsZS1wZGYvMTAuMTEwMy9QaHlzUmV2TGV0dC4xMTIuMTYxMzAxXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cGVyaW9kaWMgdXB0aWNrcyBvZiBjb21ldCBpbXBhY3RzPC9hPiBhbmQgbWFzcyBleHRpbmN0aW9ucyBvbiBFYXJ0aCwgZGlzY3Vzc2VkIGluIFJhbmRhbGwmI3gyMDE5O3MgMjAxNSBwb3B1bGFyLXNjaWVuY2UgYm9vaywgPGVtPkRhcmsgTWF0dGVyIGFuZCB0aGUgRGlub3NhdXJzPC9lbT4uPC9wPlxcbjxwPkJ1dCBhc3Ryb3BoeXNpY2lzdHMgd2hvIGRvIGludmVudG9yaWVzIG9mIHRoZSBNaWxreSBXYXkgaGF2ZSBwcm90ZXN0ZWQsIGFyZ3VpbmcgdGhhdCB0aGUgZ2FsYXh5JiN4MjAxOTtzIHRvdGFsIG1hc3MgYW5kIHRoZSBib2JiaW5nIG1vdGlvbnMgb2YgaXRzIHN0YXJzIG1hdGNoIHVwIHRvbyB3ZWxsIHRvIGxlYXZlIHJvb20gZm9yIGEgZGFyayBkaXNrLiAmI3gyMDFDO0l0JiN4MjAxOTtzIG1vcmUgc3Ryb25nbHkgY29uc3RyYWluZWQgdGhhbiBMaXNhIFJhbmRhbGwgcHJldGVuZHMsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm8udXRvcm9udG8uY2EvfmJvdnkvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Sm8gQm92eTwvYT4sIGFuIGFzdHJvcGh5c2ljaXN0IGF0IHRoZSBVbml2ZXJzaXR5IG9mIFRvcm9udG8uPC9wPlxcbjxwPk5vdywgUmFuZGFsbCwgd2hvIGhhcyBkZXZpc2VkIGluZmx1ZW50aWFsIGlkZWFzIGFib3V0IHNldmVyYWwgb2YgdGhlIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZy8yMDE1MDgwMy1waHlzaWNzLXRoZW9yaWVzLW1hcC9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5iaWdnZXN0IHF1ZXN0aW9ucyBpbiBmdW5kYW1lbnRhbCBwaHlzaWNzPC9hPiwgaXMgZmlnaHRpbmcgYmFjay4gSW4gPGEgaHJlZj1cXFwiaHR0cDovL2FyeGl2Lm9yZy9hYnMvMTYwNC4wMTQwN1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmEgcGFwZXI8L2E+IHBvc3RlZCBvbmxpbmUgbGFzdCB3ZWVrIHRoYXQgaGFzIGJlZW4gYWNjZXB0ZWQgZm9yIHB1YmxpY2F0aW9uIGluIDxlbT5UaGUgQXN0cm9waHlzaWNhbCBKb3VybmFsPC9lbT4sIFJhbmRhbGwgYW5kIGhlciBzdHVkZW50LCBFcmljIEtyYW1lciwgcmVwb3J0IGEgZGlzay1zaGFwZWQgbG9vcGhvbGUgaW4gdGhlIE1pbGt5IFdheSBhbmFseXNpczogJiN4MjAxQztUaGVyZSBpcyBhbiBpbXBvcnRhbnQgZGV0YWlsIHRoYXQgaGFzIHNvIGZhciBiZWVuIG92ZXJsb29rZWQsJiN4MjAxRDsgdGhleSB3cml0ZS4gJiN4MjAxQztUaGUgZGlzayBjYW4gYWN0dWFsbHkgbWFrZSByb29tIGZvciBpdHNlbGYuJiN4MjAxRDs8L3A+XFxuPGZpZ3VyZSBjbGFzcz1cXFwid3AtY2FwdGlvbiBsYW5kc2NhcGUgYWxpZ25ub25lIGZhZGVyIHJlbGF0aXZlXFxcIj48aW1nIGNsYXNzPVxcXCJzaXplLXRleHQtY29sdW1uLXdpZHRoIHdwLWltYWdlLTIwMjIyNTVcXFwiIHNyYz1cXFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzA2MTAxNF9yYW5kYWxsXzE2MjdfMzEwNTc1XzkwNDUxOC02MTV4NDEwLTQ4MngzMjEuanBnXFxcIiBhbHQ9XFxcIjA2MTAxNF9SYW5kYWxsXzE2MjcuanBnXFxcIiB3aWR0aD1cXFwiNDgyXFxcIj48ZmlnY2FwdGlvbiBjbGFzcz1cXFwid3AtY2FwdGlvbi10ZXh0IGxpbmstdW5kZXJsaW5lXFxcIj5MaXNhIFJhbmRhbGwgb2YgSGFydmFyZCBVbml2ZXJzaXR5IGlzIGEgaGlnaC1wcm9maWxlIHN1cHBvcnRlciBvZiB0aGUgY29udHJvdmVyc2lhbCBkYXJrIGRpc2sgaWRlYS48c3BhbiBjbGFzcz1cXFwiY3JlZGl0IGxpbmstdW5kZXJsaW5lLXNtXFxcIj5Sb3NlIExpbmNvbG4vSGFydmFyZCBVbml2ZXJzaXR5PC9zcGFuPjwvZmlnY2FwdGlvbj48L2ZpZ3VyZT5cXG48cD5JZiB0aGVyZSBpcyBhIHRoaW4gZGFyayBkaXNrIGNvdXJzaW5nIHRocm91Z2ggdGhlICYjeDIwMUM7bWlkcGxhbmUmI3gyMDFEOyBvZiB0aGUgZ2FsYXh5LCBSYW5kYWxsIGFuZCBLcmFtZXIgYXJndWUsIHRoZW4gaXQgd2lsbCBncmF2aXRhdGlvbmFsbHkgcGluY2ggb3RoZXIgbWF0dGVyIGlud2FyZCwgcmVzdWx0aW5nIGluIGEgaGlnaGVyIGRlbnNpdHkgb2Ygc3RhcnMsIGdhcyBhbmQgZHVzdCBhdCB0aGUgbWlkcGxhbmUgdGhhbiBhYm92ZSBhbmQgYmVsb3cuIFJlc2VhcmNoZXJzIHR5cGljYWxseSBlc3RpbWF0ZSB0aGUgdG90YWwgdmlzaWJsZSBtYXNzIG9mIHRoZSBNaWxreSBXYXkgYnkgZXh0cmFwb2xhdGluZyBvdXR3YXJkIGZyb20gdGhlIG1pZHBsYW5lIGRlbnNpdHk7IGlmIHRoZXJlJiN4MjAxOTtzIGEgcGluY2hpbmcgZWZmZWN0LCB0aGVuIHRoaXMgZXh0cmFwb2xhdGlvbiBsZWFkcyB0byBhbiBvdmVyZXN0aW1hdGlvbiBvZiB0aGUgdmlzaWJsZSBtYXNzLCBtYWtpbmcgaXQgc2VlbSBhcyBpZiB0aGUgbWFzcyBtYXRjaGVzIHVwIHRvIHRoZSBzdGFycyYjeDIwMTk7IG1vdGlvbnMuICYjeDIwMUM7VGhhdCYjeDIwMTk7cyB0aGUgcmVhc29uIHdoeSBhIGxvdCBvZiB0aGVzZSBwcmV2aW91cyBzdHVkaWVzIGRpZCBub3Qgc2VlIGV2aWRlbmNlIGZvciBhIGRhcmsgZGlzaywmI3gyMDFEOyBLcmFtZXIgc2FpZC4gSGUgYW5kIFJhbmRhbGwgZmluZCB0aGF0IGEgdGhpbiBkYXJrIGRpc2sgaXMgcG9zc2libGUmI3gyMDE0O2FuZCBpbiBvbmUgd2F5IG9mIHJlZG9pbmcgdGhlIGFuYWx5c2lzLCBzbGlnaHRseSBmYXZvcmVkIG92ZXIgbm8gZGFyayBkaXNrLjwvcD5cXG48cD4mI3gyMDFDO0xpc2EmI3gyMDE5O3Mgd29yayBoYXMgcmVvcGVuZWQgdGhlIGNhc2UsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm9ub215LnN3aW4uZWR1LmF1L3N0YWZmL2NmbHlubi5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Q2hyaXMgRmx5bm48L2E+IG9mIFN3aW5idXJuZSBVbml2ZXJzaXR5IG9mIFRlY2hub2xvZ3kgaW4gTWVsYm91cm5lLCBBdXN0cmFsaWEsIHdobywgd2l0aCBKb2hhbiBIb2xtYmVyZywgY29uZHVjdGVkIGEgc2VyaWVzIG9mIE1pbGt5IFdheSBpbnZlbnRvcmllcyBpbiB0aGUgZWFybHkgYXVnaHRzIHRoYXQgc2VlbWVkIHRvIDxhIGhyZWY9XFxcImh0dHA6Ly9vbmxpbmVsaWJyYXJ5LndpbGV5LmNvbS9kb2kvMTAuMTA0Ni9qLjEzNjUtODcxMS4yMDAwLjAyOTA1LngvYWJzdHJhY3RcXFwiPnJvYnVzdGx5IHN3ZWVwIGl0IGNsZWFuPC9hPiBvZiBhIGRhcmsgZGlzay48L3A+XFxuPHA+Qm92eSBkaXNhZ3JlZXMuIEV2ZW4gdGFraW5nIHRoZSBwaW5jaGluZyBlZmZlY3QgaW50byBhY2NvdW50LCBoZSBlc3RpbWF0ZXMgdGhhdCBhdCBtb3N0IDIgcGVyY2VudCBvZiB0aGUgdG90YWwgYW1vdW50IG9mIGRhcmsgbWF0dGVyIGNhbiBsaWUgaW4gYSBkYXJrIGRpc2ssIHdoaWxlIHRoZSByZXN0IG11c3QgZm9ybSBhIGhhbG8uICYjeDIwMUM7SSB0aGluayBtb3N0IHBlb3BsZSB3YW50IHRvIGZpZ3VyZSBvdXQgd2hhdCA5OCBwZXJjZW50IG9mIHRoZSBkYXJrIG1hdHRlciBpcyBhYm91dCwgbm90IHdoYXQgMiBwZXJjZW50IG9mIGl0IGlzIGFib3V0LCYjeDIwMUQ7IGhlIHNhaWQuPC9wPlxcbjxwPlRoZSBkZWJhdGUmI3gyMDE0O2FuZCB0aGUgZmF0ZSBvZiB0aGUgZGFyayBkaXNrJiN4MjAxNDt3aWxsIHByb2JhYmx5IGJlIGRlY2lkZWQgc29vbi4gVGhlIEV1cm9wZWFuIFNwYWNlIEFnZW5jeSYjeDIwMTk7cyBHYWlhIHNhdGVsbGl0ZSBpcyBjdXJyZW50bHkgc3VydmV5aW5nIHRoZSBwb3NpdGlvbnMgYW5kIHZlbG9jaXRpZXMgb2Ygb25lIGJpbGxpb24gc3RhcnMsIGFuZCBhIGRlZmluaXRpdmUgaW52ZW50b3J5IG9mIHRoZSBNaWxreSBXYXkgY291bGQgYmUgY29tcGxldGVkIGFzIHNvb24gYXMgbmV4dCBzdW1tZXIuPC9wPlxcbjxwPlRoZSBkaXNjb3Zlcnkgb2YgYSBkYXJrIGRpc2ssIG9mIGFueSBzaXplLCB3b3VsZCBiZSBlbm9ybW91c2x5IHJldmVhbGluZy4gSWYgb25lIGV4aXN0cywgZGFyayBtYXR0ZXIgaXMgZmFyIG1vcmUgY29tcGxleCB0aGFuIHJlc2VhcmNoZXJzIGhhdmUgbG9uZyB0aG91Z2h0LiBNYXR0ZXIgc2V0dGxlcyBpbnRvIGEgZGlzayBzaGFwZSBvbmx5IGlmIGl0IGlzIGFibGUgdG8gc2hlZCBlbmVyZ3ksIGFuZCB0aGUgZWFzaWVzdCB3YXkgZm9yIGl0IHRvIHNoZWQgc3VmZmljaWVudCBlbmVyZ3kgaXMgaWYgaXQgZm9ybXMgYXRvbXMuIFRoZSBleGlzdGVuY2Ugb2YgZGFyayBhdG9tcyB3b3VsZCBtZWFuIGRhcmsgcHJvdG9ucyBhbmQgZGFyayBlbGVjdHJvbnMgdGhhdCBhcmUgY2hhcmdlZCBpbiBhIHNpbWlsYXIgc3R5bGUgYXMgdmlzaWJsZSBwcm90b25zIGFuZCBlbGVjdHJvbnMsIGludGVyYWN0aW5nIHdpdGggZWFjaCBvdGhlciB2aWEgYSBkYXJrIGZvcmNlIHRoYXQgaXMgY29udmV5ZWQgYnkgZGFyayBwaG90b25zLiBFdmVuIGlmIDk4IHBlcmNlbnQgb2YgZGFyayBtYXR0ZXIgaXMgaW5lcnQsIGFuZCBmb3JtcyBoYWxvcywgdGhlIGV4aXN0ZW5jZSBvZiBldmVuIGEgdGhpbiBkYXJrIGRpc2sgd291bGQgaW1wbHkgYSByaWNoICYjeDIwMUM7ZGFyayBzZWN0b3ImI3gyMDFEOyBvZiB1bmtub3duIHBhcnRpY2xlcyBhcyBkaXZlcnNlLCBwZXJoYXBzLCBhcyB0aGUgdmlzaWJsZSB1bml2ZXJzZS4gJiN4MjAxQztOb3JtYWwgbWF0dGVyIGlzIHByZXR0eSBjb21wbGV4OyB0aGVyZSYjeDIwMTk7cyBzdHVmZiB0aGF0IHBsYXlzIGEgcm9sZSBpbiBhdG9tcyBhbmQgdGhlcmUmI3gyMDE5O3Mgc3R1ZmYgdGhhdCBkb2VzbiYjeDIwMTk7dCwmI3gyMDFEOyBzYWlkIDxhIGhyZWY9XFxcImh0dHA6Ly93d3cucGh5c2ljcy51Y2kuZWR1L35idWxsb2NrL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkphbWVzIEJ1bGxvY2s8L2E+LCBhbiBhc3Ryb3BoeXNpY2lzdCBhdCB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBJcnZpbmUuICYjeDIwMUM7U28gaXQmI3gyMDE5O3Mgbm90IGNyYXp5IHRvIGltYWdpbmUgdGhhdCB0aGUgb3RoZXIgZml2ZS1zaXh0aHMgW29mIHRoZSBtYXR0ZXIgaW4gdGhlIHVuaXZlcnNlXSBpcyBwcmV0dHkgY29tcGxleCwgYW5kIHRoYXQgdGhlcmUmI3gyMDE5O3Mgc29tZSBwaWVjZSBvZiB0aGF0IGRhcmsgc2VjdG9yIHRoYXQgd2luZHMgdXAgaW4gYm91bmQgYXRvbXMuJiN4MjAxRDs8L3A+XFxuPHA+VGhlIG5vdGlvbiB0aGF0IDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZy8yMDE1MDgyMC10aGUtY2FzZS1mb3ItY29tcGxleC1kYXJrLW1hdHRlci9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5kYXJrIG1hdHRlciBtaWdodCBiZSBjb21wbGV4PC9hPiBoYXMgZ2FpbmVkIHRyYWN0aW9uIGluIHJlY2VudCB5ZWFycywgYWlkZWQgYnkgYXN0cm9waHlzaWNhbCBhbm9tYWxpZXMgdGhhdCBkbyBub3QgZ2VsIHdpdGggdGhlIGxvbmctcmVpZ25pbmcgcHJvZmlsZSBvZiBkYXJrIG1hdHRlciBhcyBwYXNzaXZlLCBzbHVnZ2lzaCAmI3gyMDFDO3dlYWtseSBpbnRlcmFjdGluZyBtYXNzaXZlIHBhcnRpY2xlcy4mI3gyMDFEOyBUaGVzZSBhbm9tYWxpZXMsIHBsdXMgdGhlIGZhaWx1cmUgb2YgJiN4MjAxQztXSU1QcyYjeDIwMUQ7IHRvIHNob3cgdXAgaW4gZXhoYXVzdGl2ZSBleHBlcmltZW50YWwgc2VhcmNoZXMgYWxsIG92ZXIgdGhlIHdvcmxkLCBoYXZlIHdlYWtlbmVkIHRoZSBXSU1QIHBhcmFkaWdtLCBhbmQgdXNoZXJlZCBpbiBhIG5ldywgZnJlZS1mb3ItYWxsIGVyYSwgaW4gd2hpY2ggdGhlIG5hdHVyZSBvZiB0aGUgZGFyayBiZWFzdCBpcyBhbnlib2R5JiN4MjAxOTtzIGd1ZXNzLjwvcD5cXG48cD5UaGUgZmllbGQgc3RhcnRlZCBvcGVuaW5nIHVwIGFyb3VuZCAyMDA4LCB3aGVuIGFuIGV4cGVyaW1lbnQgY2FsbGVkIFBBTUVMQSBkZXRlY3RlZCBhbiBleGNlc3Mgb2YgcG9zaXRyb25zIG92ZXIgZWxlY3Ryb25zIGNvbWluZyBmcm9tIHNwYWNlJiN4MjAxNDthbiBhc3ltbWV0cnkgdGhhdCBmdWVsZWQgaW50ZXJlc3QgaW4gJiN4MjAxQzs8YSBocmVmPVxcXCJodHRwOi8vYXJ4aXYub3JnL2Ficy8wOTAxLjQxMTdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5hc3ltbWV0cmljIGRhcmsgbWF0dGVyPC9hPiwmI3gyMDFEOyBhIG5vdy1wb3B1bGFyIG1vZGVsIHByb3Bvc2VkIGJ5IDxhIGhyZWY9XFxcImh0dHA6Ly93d3ctdGhlb3J5LmxibC5nb3Yvd29yZHByZXNzLz9wYWdlX2lkPTY4NTFcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5LYXRocnluIFp1cmVrPC9hPiBhbmQgY29sbGFib3JhdG9ycy4gQXQgdGhlIHRpbWUsIHRoZXJlIHdlcmUgZmV3IGlkZWFzIG90aGVyIHRoYW4gV0lNUHMgaW4gcGxheS4gJiN4MjAxQztUaGVyZSB3ZXJlIG1vZGVsLWJ1aWxkZXJzIGxpa2UgbWUgd2hvIHJlYWxpemVkIHRoYXQgZGFyayBtYXR0ZXIgd2FzIGp1c3QgZXh0cmFvcmRpbmFyaWx5IHVuZGVyZGV2ZWxvcGVkIGluIHRoaXMgZGlyZWN0aW9uLCYjeDIwMUQ7IHNhaWQgWnVyZWssIG5vdyBvZiBMYXdyZW5jZSBCZXJrZWxleSBOYXRpb25hbCBMYWJvcmF0b3J5IGluIENhbGlmb3JuaWEuICYjeDIwMUM7U28gd2UgZG92ZSBpbi4mI3gyMDFEOzwvcD5cXG48ZmlndXJlIGNsYXNzPVxcXCJ3cC1jYXB0aW9uIGxhbmRzY2FwZSBhbGlnbm5vbmUgZmFkZXIgcmVsYXRpdmVcXFwiPjxpbWcgY2xhc3M9XFxcInNpemUtdGV4dC1jb2x1bW4td2lkdGggd3AtaW1hZ2UtMjAyMjI1OVxcXCIgc3JjPVxcXCJodHRwczovL3d3dy53aXJlZC5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMTYvMDUvMDI0X1Byb2ZCdWxsb2NrLTYxNXg1MDAtNDgyeDM5Mi5qcGdcXFwiIGFsdD1cXFwiSmFtZXMgQnVsbG9jayBvZiB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBJcnZpbmUsIHNlZXMgZGFyayBtYXR0ZXIgYXMgcG90ZW50aWFsbHkgY29tcGxleCBhbmQgc2VsZi1pbnRlcmFjdGluZywgYnV0IG5vdCBuZWNlc3NhcmlseSBjb25jZW50cmF0ZWQgaW4gdGhpbiBkaXNrcy5cXFwiIHdpZHRoPVxcXCI0ODJcXFwiPjxmaWdjYXB0aW9uIGNsYXNzPVxcXCJ3cC1jYXB0aW9uLXRleHQgbGluay11bmRlcmxpbmVcXFwiPkphbWVzIEJ1bGxvY2sgb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLCBzZWVzIGRhcmsgbWF0dGVyIGFzIHBvdGVudGlhbGx5IGNvbXBsZXggYW5kIHNlbGYtaW50ZXJhY3RpbmcsIGJ1dCBub3QgbmVjZXNzYXJpbHkgY29uY2VudHJhdGVkIGluIHRoaW4gZGlza3MuPHNwYW4gY2xhc3M9XFxcImNyZWRpdCBsaW5rLXVuZGVybGluZS1zbVxcXCI+Sm9uYXRoYW4gQWxjb3JuIGZvciBRdWFudGEgTWFnYXppbmU8L3NwYW4+PC9maWdjYXB0aW9uPjwvZmlndXJlPlxcbjxwPkFub3RoZXIgdHJpZ2dlciBoYXMgYmVlbiB0aGUgZGVuc2l0eSBvZiBkd2FyZiBnYWxheGllcy4gV2hlbiByZXNlYXJjaGVycyB0cnkgdG8gc2ltdWxhdGUgdGhlaXIgZm9ybWF0aW9uLCBkd2FyZiBnYWxheGllcyB0eXBpY2FsbHkgdHVybiBvdXQgdG9vIGRlbnNlIGluIHRoZWlyIGNlbnRlcnMsIHVubGVzcyByZXNlYXJjaGVycyBhc3N1bWUgdGhhdCBkYXJrIG1hdHRlciBwYXJ0aWNsZXMgaW50ZXJhY3Qgd2l0aCBvbmUgYW5vdGhlciB2aWEgZGFyayBmb3JjZXMuIEFkZCB0b28gbXVjaCBpbnRlcmFjdGl2aXR5LCBob3dldmVyLCBhbmQgeW91IG11Y2sgdXAgc2ltdWxhdGlvbnMgb2Ygc3RydWN0dXJlIGZvcm1hdGlvbiBpbiB0aGUgZWFybHkgdW5pdmVyc2UuICYjeDIwMUM7V2hhdCB3ZSYjeDIwMTk7cmUgdHJ5aW5nIHRvIGRvIGlzIGZpZ3VyZSBvdXQgd2hhdCBpcyBhbGxvd2VkLCYjeDIwMUQ7IHNhaWQgQnVsbG9jaywgd2hvIGJ1aWxkcyBzdWNoIHNpbXVsYXRpb25zLiBNb3N0IG1vZGVsZXJzIGFkZCB3ZWFrIGludGVyYWN0aW9ucyB0aGF0IGRvbiYjeDIwMTk7dCBhZmZlY3QgdGhlIGhhbG8gc2hhcGUgb2YgZGFyayBtYXR0ZXIuIEJ1dCAmI3gyMDFDO3JlbWFya2FibHksJiN4MjAxRDsgQnVsbG9jayBzYWlkLCAmI3gyMDFDO3RoZXJlIGlzIGEgY2xhc3Mgb2YgZGFyayBtYXR0ZXIgdGhhdCBhbGxvd3MgZm9yIGRpc2tzLiYjeDIwMUQ7IEluIHRoYXQgY2FzZSwgb25seSBhIHRpbnkgZnJhY3Rpb24gb2YgZGFyayBtYXR0ZXIgcGFydGljbGVzIGludGVyYWN0LCBidXQgdGhleSBkbyBzbyBzdHJvbmdseSBlbm91Z2ggdG8gZGlzc2lwYXRlIGVuZXJneSYjeDIwMTQ7YW5kIHRoZW4gZm9ybSBkaXNrcy48L3A+XFxuPHA+UmFuZGFsbCBhbmQgaGVyIGNvbGxhYm9yYXRvcnMgSmlKaSBGYW4sIEFuZHJleSBLYXR6IGFuZCBNYXR0aGV3IFJlZWNlIG1hZGUgdGhlaXIgd2F5IHRvIHRoaXMgaWRlYSBpbiAyMDEzIGJ5IHRoZSBzYW1lIHBhdGggYXMgT29ydDogVGhleSB3ZXJlIHRyeWluZyB0byBleHBsYWluIGFuIGFwcGFyZW50IE1pbGt5IFdheSBhbm9tYWx5LiBLbm93biBhcyB0aGUgJiN4MjAxQztGZXJtaSBsaW5lLCYjeDIwMUQ7IGl0IHdhcyBhbiBleGNlc3Mgb2YgZ2FtbWEgcmF5cyBvZiBhIGNlcnRhaW4gZnJlcXVlbmN5IGNvbWluZyBmcm9tIHRoZSBnYWxhY3RpYyBjZW50ZXIuICYjeDIwMUM7T3JkaW5hcnkgZGFyayBtYXR0ZXIgd291bGRuJiN4MjAxOTt0IGFubmloaWxhdGUgZW5vdWdoJiN4MjAxRDsgdG8gcHJvZHVjZSB0aGUgRmVybWkgbGluZSwgUmFuZGFsbCBzYWlkLCAmI3gyMDFDO3NvIHdlIHRob3VnaHQsIHdoYXQgaWYgaXQgd2FzIG11Y2ggZGVuc2VyPyYjeDIwMUQ7IFRoZSBkYXJrIGRpc2sgd2FzIHJlYm9ybi4gVGhlIEZlcm1pIGxpbmUgdmFuaXNoZWQgYXMgbW9yZSBkYXRhIGFjY3VtdWxhdGVkLCBidXQgdGhlIGRpc2sgaWRlYSBzZWVtZWQgd29ydGggZXhwbG9yaW5nIGFueXdheS4gSW4gMjAxNCwgUmFuZGFsbCBhbmQgUmVlY2UgaHlwb3RoZXNpemVkIHRoYXQgdGhlIGRpc2sgbWlnaHQgYWNjb3VudCBmb3IgcG9zc2libGUgMzAtIHRvIDM1LW1pbGxpb24teWVhciBpbnRlcnZhbHMgYmV0d2VlbiBlc2NhbGF0ZWQgbWV0ZW9yIGFuZCBjb21ldCBhY3Rpdml0eSwgYSBzdGF0aXN0aWNhbGx5IHdlYWsgc2lnbmFsIHRoYXQgc29tZSBzY2llbnRpc3RzIGhhdmUgdGVudGF0aXZlbHkgdGllZCB0byBwZXJpb2RpYyBtYXNzIGV4dGluY3Rpb25zLiBFYWNoIHRpbWUgdGhlIHNvbGFyIHN5c3RlbSBib2JzIHVwIG9yIGRvd24gdGhyb3VnaCB0aGUgZGFyayBkaXNrIG9uIHRoZSBNaWxreSBXYXkgY2Fyb3VzZWwsIHRoZXkgYXJndWVkLCB0aGUgZGlzayYjeDIwMTk7cyBncmF2aXRhdGlvbmFsIGVmZmVjdCBtaWdodCBkZXN0YWJpbGl6ZSByb2NrcyBhbmQgY29tZXRzIGluIHRoZSBPb3J0IGNsb3VkJiN4MjAxNDthIHNjcmFweWFyZCBvbiB0aGUgb3V0c2tpcnRzIG9mIHRoZSBzb2xhciBzeXN0ZW0gbmFtZWQgZm9yIEphbiBPb3J0LiBUaGVzZSBvYmplY3RzIHdvdWxkIGdvIGh1cnRsaW5nIHRvd2FyZCB0aGUgaW5uZXIgc29sYXIgc3lzdGVtLCBzb21lIHN0cmlraW5nIEVhcnRoLjwvcD5cXG48cD5CdXQgUmFuZGFsbCBhbmQgaGVyIHRlYW0gZGlkIG9ubHkgYSBjdXJzb3J5JiN4MjAxNDthbmQgaW5jb3JyZWN0JiN4MjAxNDthbmFseXNpcyBvZiBob3cgbXVjaCByb29tIHRoZXJlIGlzIGZvciBhIGRhcmsgZGlzayBpbiB0aGUgTWlsa3kgV2F5JiN4MjAxOTtzIG1hc3MgYnVkZ2V0LCBqdWRnaW5nIGJ5IHRoZSBtb3Rpb25zIG9mIHN0YXJzLiAmI3gyMDFDO1RoZXkgbWFkZSBzb21lIGtpbmQgb2Ygb3V0cmFnZW91cyBjbGFpbXMsJiN4MjAxRDsgQm92eSBzYWlkLjwvcD5cXG48cD5SYW5kYWxsLCB3aG8gc3RhbmRzIG91dCAoYWNjb3JkaW5nIHRvIFJlZWNlKSBmb3IgJiN4MjAxQztoZXIgcGVyc2lzdGVuY2UsJiN4MjAxRDsgcHV0IEtyYW1lciBvbiB0aGUgY2FzZSwgc2Vla2luZyB0byBhZGRyZXNzIHRoZSBjcml0aWNzIGFuZCwgc2hlIHNhaWQsICYjeDIwMUM7dG8gaXJvbiBvdXQgYWxsIHRoZSB3cmlua2xlcyYjeDIwMUQ7IGluIHRoZSBhbmFseXNpcyBiZWZvcmUgR2FpYSBkYXRhIGJlY29tZXMgYXZhaWxhYmxlLiBIZXIgYW5kIEtyYW1lciYjeDIwMTk7cyBuZXcgYW5hbHlzaXMgc2hvd3MgdGhhdCB0aGUgZGFyayBkaXNrLCBpZiBpdCBleGlzdHMsIGNhbm5vdCBiZSBhcyBkZW5zZSBhcyBoZXIgdGVhbSBpbml0aWFsbHkgdGhvdWdodCBwb3NzaWJsZS4gQnV0IHRoZXJlIGlzIGluZGVlZCB3aWdnbGUgcm9vbSBmb3IgYSB0aGluIGRhcmsgZGlzayB5ZXQsIGR1ZSBib3RoIHRvIGl0cyBwaW5jaGluZyBlZmZlY3QgYW5kIHRvIGFkZGl0aW9uYWwgdW5jZXJ0YWludHkgY2F1c2VkIGJ5IGEgbmV0IGRyaWZ0IGluIHRoZSBNaWxreSBXYXkgc3RhcnMgdGhhdCBoYXZlIGJlZW4gbW9uaXRvcmVkIHRodXMgZmFyLjwvcD5cXG5cXG5cXG5cXG48cD5Ob3cgdGhlcmUmI3gyMDE5O3MgYSBuZXcgcHJvYmxlbSwgPGEgaHJlZj1cXFwiaHR0cDovL2lvcHNjaWVuY2UuaW9wLm9yZy9hcnRpY2xlLzEwLjEwODgvMDAwNC02MzdYLzgxNC8xLzEzXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cmFpc2VkPC9hPiBpbiA8ZW0+VGhlIEFzdHJvcGh5c2ljYWwgSm91cm5hbDwvZW0+IGJ5IDxhIGhyZWY9XFxcImh0dHA6Ly9hc3Ryby5iZXJrZWxleS5lZHUvZmFjdWx0eS1wcm9maWxlL2NocmlzLW1ja2VlXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Q2hyaXMgTWNLZWU8L2E+IG9mIHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIEJlcmtlbGV5LCBhbmQgY29sbGFib3JhdG9ycy4gTWNLZWUgY29uY2VkZXMgdGhhdCBhIHRoaW4gZGFyayBkaXNrIGNhbiBzdGlsbCBiZSBzcXVlZXplZCBpbnRvIHRoZSBNaWxreSBXYXkmI3gyMDE5O3MgbWFzcyBidWRnZXQuIEJ1dCB0aGUgZGlzayBtaWdodCBiZSBzbyB0aGluIHRoYXQgaXQgd291bGQgY29sbGFwc2UuIENpdGluZyByZXNlYXJjaCBmcm9tIHRoZSAxOTYwcyBhbmQgJiN4MjAxOTs3MHMsIE1jS2VlIGFuZCBjb2xsZWFndWVzIGFyZ3VlIHRoYXQgZGlza3MgY2Fubm90IGJlIHNpZ25pZmljYW50bHkgdGhpbm5lciB0aGFuIHRoZSBkaXNrIG9mIHZpc2libGUgZ2FzIGluIHRoZSBNaWxreSBXYXkgd2l0aG91dCBmcmFnbWVudGluZy4gJiN4MjAxQztJdCBpcyBwb3NzaWJsZSB0aGF0IHRoZSBkYXJrIG1hdHRlciB0aGV5IGNvbnNpZGVyIGhhcyBzb21lIHByb3BlcnR5IHRoYXQgaXMgZGlmZmVyZW50IGZyb20gb3JkaW5hcnkgbWF0dGVyIGFuZCBwcmV2ZW50cyB0aGlzIGZyb20gaGFwcGVuaW5nLCBidXQgSSBkb24mI3gyMDE5O3Qga25vdyB3aGF0IHRoYXQgY291bGQgYmUsJiN4MjAxRDsgTWNLZWUgc2FpZC48L3A+XFxuPHA+UmFuZGFsbCBoYXMgbm90IHlldCBwYXJyaWVkIHRoaXMgbGF0ZXN0IGF0dGFjaywgY2FsbGluZyBpdCAmI3gyMDFDO2EgdHJpY2t5IGlzc3VlJiN4MjAxRDsgdGhhdCBpcyAmI3gyMDFDO3VuZGVyIGNvbnNpZGVyYXRpb24gbm93LiYjeDIwMUQ7IFNoZSBoYXMgYWxzbyB0YWtlbiBvbiB0aGUgcG9pbnQgcmFpc2VkIGJ5IEJvdnkmI3gyMDE0O3RoYXQgYSBkaXNrIG9mIGNoYXJnZWQgZGFyayBhdG9tcyBpcyBpcnJlbGV2YW50IG5leHQgdG8gdGhlIG5hdHVyZSBvZiA5OCBwZXJjZW50IG9mIGRhcmsgbWF0dGVyLiBTaGUgaXMgbm93IGludmVzdGlnYXRpbmcgdGhlIHBvc3NpYmlsaXR5IHRoYXQgYWxsIGRhcmsgbWF0dGVyIG1pZ2h0IGJlIGNoYXJnZWQgdW5kZXIgdGhlIHNhbWUgZGFyayBmb3JjZSwgYnV0IGJlY2F1c2Ugb2YgYSBzdXJwbHVzIG9mIGRhcmsgcHJvdG9ucyBvdmVyIGRhcmsgZWxlY3Ryb25zLCBvbmx5IGEgdGlueSBmcmFjdGlvbiBiZWNvbWUgYm91bmQgaW4gYXRvbXMgYW5kIHdpbmQgdXAgaW4gYSBkaXNrLiBJbiB0aGF0IGNhc2UsIHRoZSBkaXNrIGFuZCBoYWxvIHdvdWxkIGJlIG1hZGUgb2YgdGhlIHNhbWUgaW5ncmVkaWVudHMsICYjeDIwMUM7d2hpY2ggd291bGQgYmUgbW9yZSBlY29ub21pY2FsLCYjeDIwMUQ7IHNoZSBzYWlkLiAmI3gyMDFDO1dlIHRob3VnaHQgdGhhdCB3b3VsZCBiZSBydWxlZCBvdXQsIGJ1dCBpdCB3YXNuJiN4MjAxOTt0LiYjeDIwMUQ7PC9wPlxcbjxwPlRoZSBkYXJrIGRpc2sgc3Vydml2ZXMsIGZvciBub3cmI3gyMDE0O2Egc3ltYm9sIG9mIGFsbCB0aGF0IGlzbiYjeDIwMTk7dCBrbm93biBhYm91dCB0aGUgZGFyayBzaWRlIG9mIHRoZSB1bml2ZXJzZS4gJiN4MjAxQztJIHRoaW5rIGl0JiN4MjAxOTtzIHZlcnksIHZlcnkgaGVhbHRoeSBmb3IgdGhlIGZpZWxkIHRoYXQgeW91IGhhdmUgcGVvcGxlIHRoaW5raW5nIGFib3V0IGFsbCBraW5kcyBvZiBkaWZmZXJlbnQgaWRlYXMsJiN4MjAxRDsgc2FpZCBCdWxsb2NrLiAmI3gyMDFDO0JlY2F1c2UgaXQmI3gyMDE5O3MgcXVpdGUgdHJ1ZSB0aGF0IHdlIGRvbiYjeDIwMTk7dCBrbm93IHdoYXQgdGhlIGhlY2sgdGhhdCBkYXJrIG1hdHRlciBpcywgYW5kIHlvdSBuZWVkIHRvIGJlIG9wZW4tbWluZGVkIGFib3V0IGl0LiYjeDIwMUQ7PC9wPlxcbjxwPjxlbT48YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNjA0MTItZGViYXRlLWludGVuc2lmaWVzLW92ZXItZGFyay1kaXNrLXRoZW9yeS9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5PcmlnaW5hbCBzdG9yeTwvYT4gcmVwcmludGVkIHdpdGggcGVybWlzc2lvbiBmcm9tIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZ1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlF1YW50YSBNYWdhemluZTwvYT4sIGFuIGVkaXRvcmlhbGx5IGluZGVwZW5kZW50IHB1YmxpY2F0aW9uIG9mIHRoZSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5zaW1vbnNmb3VuZGF0aW9uLm9yZ1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlNpbW9ucyBGb3VuZGF0aW9uPC9hPiB3aG9zZSBtaXNzaW9uIGlzIHRvIGVuaGFuY2UgcHVibGljIHVuZGVyc3RhbmRpbmcgb2Ygc2NpZW5jZSBieSBjb3ZlcmluZyByZXNlYXJjaCBkZXZlbG9wbWVudHMgYW5kIHRyZW5kcyBpbiBtYXRoZW1hdGljcyBhbmQgdGhlIHBoeXNpY2FsIGFuZCBsaWZlIHNjaWVuY2VzLjwvZW0+PC9wPlxcblxcblxcdFxcdFxcdDxhIGNsYXNzPVxcXCJ2aXN1YWxseS1oaWRkZW4gc2tpcC10by10ZXh0LWxpbmsgZm9jdXNhYmxlIGJnLXdoaXRlXFxcIiBocmVmPVxcXCJodHRwOi8vd3d3LndpcmVkLmNvbS8yMDE2LzA2L2RlYmF0ZS1pbnRlbnNpZmllcy1kYXJrLWRpc2stdGhlb3J5LyNzdGFydC1vZi1jb250ZW50XFxcIj5HbyBCYWNrIHRvIFRvcC4gU2tpcCBUbzogU3RhcnQgb2YgQXJ0aWNsZS48L2E+XFxuXFxuXFx0XFx0XFx0XFxuXFx0XFx0PC9hcnRpY2xlPlxcblxcblxcdFxcdDwvZGl2PlwiLFxyXG5cdFx0XCJkYXRlUHVibGlzaGVkXCI6IFwiMjAxNi0wNi0wNCAwMDowMDowMFwiLFxyXG5cdFx0XCJkb21haW5cIjogXCJ3d3cud2lyZWQuY29tXCIsXHJcblx0XHRcImV4Y2VycHRcIjogXCJJbiAxOTMyLCB0aGUgRHV0Y2ggYXN0cm9ub21lciBKYW4gT29ydCB0YWxsaWVkIHRoZSBzdGFycyBpbiB0aGUgTWlsa3kgV2F5IGFuZCBmb3VuZCB0aGF0IHRoZXkgY2FtZSB1cCBzaG9ydC4gSnVkZ2luZyBieSB0aGUgd2F5IHRoZSBzdGFycyBib2IgdXAgYW5kIGRvd24gbGlrZSBob3JzZXMgb24gYSBjYXJvdXNlbCBhcyB0aGV5IGdvIGFyb3VuZCZoZWxsaXA7XCIsXHJcblx0XHRcImxlYWRJbWFnZVVybFwiOiBcImh0dHBzOi8vd3d3LndpcmVkLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxNi8wNS8wNjEwMTRfcmFuZGFsbF8xNjI3XzMxMDU3NV85MDQ1MTgtNjE1eDQxMC00ODJ4MzIxLmpwZ1wiLFxyXG5cdFx0XCJ0aXRsZVwiOiBcIkEgRGlzayBvZiBEYXJrIE1hdHRlciBNaWdodCBSdW4gVGhyb3VnaCBPdXIgR2FsYXh5XCIsXHJcblx0XHRcInVybFwiOiBcImh0dHA6Ly93d3cud2lyZWQuY29tLzIwMTYvMDYvZGViYXRlLWludGVuc2lmaWVzLWRhcmstZGlzay10aGVvcnkvXCIsXHJcblx0XHRcIl9pZFwiOiBcIjU3NTJlZTU1MjJhZmIyZDQwYjg1ZjI2N1wiXHJcblx0fTtcclxuIiwiYXBwLmRpcmVjdGl2ZSgnYXJ0aWNsZURldGFpbCcsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgc2NvcGU6IHt9LFxyXG4gICAgdGVtcGxhdGVVcmw6ICdodG1sL2FydGljbGUtZGV0YWlsL2RldGFpbC5odG1sJyxcclxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICB9XHJcbn0pXHJcbiIsImFwcC5kaXJlY3RpdmUoJ2JpbmRDb21waWxlZEh0bWwnLCBbJyRjb21waWxlJywgZnVuY3Rpb24oJGNvbXBpbGUpIHtcclxuICByZXR1cm4ge1xyXG4gICAgdGVtcGxhdGU6ICc8ZGl2PjwvZGl2PicsXHJcbiAgICBzY29wZToge1xyXG4gICAgICByYXdIdG1sOiAnPWJpbmRDb21waWxlZEh0bWwnXHJcbiAgICB9LFxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0pIHtcclxuICAgICAgdmFyIGltZ3MgPSBbXTtcclxuICAgICAgc2NvcGUuJHdhdGNoKCdyYXdIdG1sJywgZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIG5ld0VsZW0gPSAkY29tcGlsZSh2YWx1ZSkoc2NvcGUuJHBhcmVudCk7XHJcbiAgICAgICAgZWxlbS5jb250ZW50cygpLnJlbW92ZSgpO1xyXG4gICAgICAgIGltZ3MgPSBuZXdFbGVtLmZpbmQoJ2ltZycpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgIGltZ3NbaV0uYWRkQ2xhc3MgPSAnZmxvYXRSaWdodCdcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlbS5hcHBlbmQobmV3RWxlbSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn1dKTtcclxuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcclxuICAgIH07XHJcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgJG1kU2lkZW5hdikge1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICBzY29wZToge30sXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXHJcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XHJcblxyXG4gICAgICAgICAgICBzY29wZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAkbWRTaWRlbmF2KFwibGVmdFwiKS50b2dnbGUoKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIGJ0bi50b2dnbGVDbGFzcygnbWQtZm9jdXNlZCcpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xyXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnUGFyc2VyJywgc3RhdGU6ICdwYXJzZXInIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnUGFnZXMnLCBzdGF0ZTogJ3BhZ2VzJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ01lbWJlcnMgT25seScsIHN0YXRlOiAnbWVtYmVyc09ubHknLCBhdXRoOiB0cnVlIH1cclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc2V0VXNlcigpO1xyXG5cclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG59KTtcclxuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxyXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xyXG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KTsiLCJhcHAuZGlyZWN0aXZlKCdzaWRlYmFyJywgZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0c2NvcGU6IHt9LFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuaHRtbCcsXHJcblx0fVxyXG59KVxyXG4iLCJhcHAuZGlyZWN0aXZlKCdzcGVlZERpYWwnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgIHNjb3BlOiB7fSxcclxuICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9zcGVlZC1kaWFsL3NwZWVkLWRpYWwuaHRtbCcsXHJcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xyXG4gICAgICBzY29wZS5pc09wZW4gPSBmYWxzZTtcclxuICAgICAgc2NvcGUuaGVsbG8gPSBcIndvcmxkXCJcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
