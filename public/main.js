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
            scope.items = [{
                name: "Add URL",
                icon: "/icons/ic_add_white_36px.svg"
            }, {
                name: "Add Category",
                icon: "/icons/ic_playlist_add_white_36px.svg"
            }];
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJwYWdlcy9wYWdlcy5mYWN0b3J5LmpzIiwicGFnZXMvcGFnZXMuanMiLCJwYXJzZXIvcGFyc2VyLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVEZXRhaWwuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVWaWV3LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9wYXJzZXIuZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FydGljbGVEZXRhaWxDYXJkL2RldGFpbC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2JpbmRDb21waWxlZEh0bWwvYmluZENvbXBpbGVkSHRtbC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2lkZWJhci9zaWRlYmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc3BlZWQtZGlhbC9zcGVlZC1kaWFsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBLE9BQUEsR0FBQSxHQUFBLFFBQUEsTUFBQSxDQUFBLHVCQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7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QUEsVUFBQSxDQUFBLFdBQUEsU0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBO0FBQ0EsdUJBQUEsR0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBO0FBQ0E7QUFKQSxTQUFBO0FBTUEsS0FiQTs7QUFlQSxRQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHNCQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQURBLEVBRUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsU0FKQSxDQUFBO0FBTUEsS0FQQTs7QUFTQSxRQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsT0FBQSxTQUFBLElBQUE7QUFDQSxvQkFBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsdUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsSUFBQTtBQUNBOzs7O0FBSUEsYUFBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxRQUFBLElBQUE7QUFDQSxTQUZBOztBQUlBLGFBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsZ0JBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLElBQUEsQ0FBQSxRQUFBLElBQUEsQ0FBQTtBQUNBOzs7OztBQUtBLG1CQUFBLE1BQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLElBQUE7QUFDQSxhQUZBLENBQUE7QUFJQSxTQXJCQTs7QUF1QkEsYUFBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxNQUFBLElBQUEsQ0FBQSxRQUFBLEVBQUEsV0FBQSxFQUNBLElBREEsQ0FDQSxpQkFEQSxFQUVBLEtBRkEsQ0FFQSxZQUFBO0FBQ0EsdUJBQUEsR0FBQSxNQUFBLENBQUEsRUFBQSxTQUFBLDRCQUFBLEVBQUEsQ0FBQTtBQUNBLGFBSkEsQ0FBQTtBQUtBLFNBTkE7O0FBUUEsYUFBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLE1BQUEsR0FBQSxDQUFBLFNBQUEsRUFBQSxJQUFBLENBQUEsWUFBQTtBQUNBLHdCQUFBLE9BQUE7QUFDQSwyQkFBQSxVQUFBLENBQUEsWUFBQSxhQUFBO0FBQ0EsYUFIQSxDQUFBO0FBSUEsU0FMQTtBQU9BLEtBckRBOztBQXVEQSxRQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBOztBQUVBLFlBQUEsT0FBQSxJQUFBOztBQUVBLG1CQUFBLEdBQUEsQ0FBQSxZQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLGlCQUFBLE9BQUE7QUFDQSxTQUZBOztBQUlBLG1CQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsaUJBQUEsT0FBQTtBQUNBLFNBRkE7O0FBSUEsYUFBQSxFQUFBLEdBQUEsSUFBQTtBQUNBLGFBQUEsSUFBQSxHQUFBLElBQUE7O0FBRUEsYUFBQSxNQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsaUJBQUEsRUFBQSxHQUFBLFNBQUE7QUFDQSxpQkFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLFNBSEE7O0FBS0EsYUFBQSxPQUFBLEdBQUEsWUFBQTtBQUNBLGlCQUFBLEVBQUEsR0FBQSxJQUFBO0FBQ0EsaUJBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxTQUhBO0FBS0EsS0F6QkE7QUEyQkEsQ0FwSUE7O0FDQUEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsYUFBQSxHQURBO0FBRUEscUJBQUE7QUFGQSxLQUFBO0FBSUEsQ0FMQTtBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLG1CQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxhQUFBLFFBREE7QUFFQSxxQkFBQSx1QkFGQTtBQUdBLG9CQUFBO0FBSEEsS0FBQTtBQU1BLENBUkE7O0FBVUEsSUFBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsV0FBQSxLQUFBLEdBQUEsRUFBQTtBQUNBLFdBQUEsS0FBQSxHQUFBLElBQUE7O0FBRUEsV0FBQSxTQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7O0FBRUEsZUFBQSxLQUFBLEdBQUEsSUFBQTs7QUFFQSxvQkFBQSxLQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsbUJBQUEsRUFBQSxDQUFBLE1BQUE7QUFDQSxTQUZBLEVBRUEsS0FGQSxDQUVBLFlBQUE7QUFDQSxtQkFBQSxLQUFBLEdBQUEsNEJBQUE7QUFDQSxTQUpBO0FBTUEsS0FWQTtBQVlBLENBakJBO0FDVkEsSUFBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsbUJBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLGFBQUEsZUFEQTtBQUVBLGtCQUFBLG1FQUZBO0FBR0Esb0JBQUEsb0JBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLHdCQUFBLFFBQUEsR0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSx1QkFBQSxLQUFBLEdBQUEsS0FBQTtBQUNBLGFBRkE7QUFHQSxTQVBBOzs7QUFVQSxjQUFBO0FBQ0EsMEJBQUE7QUFEQTtBQVZBLEtBQUE7QUFlQSxDQWpCQTs7QUFtQkEsSUFBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsV0FBQSxTQUFBLFFBQUEsR0FBQTtBQUNBLGVBQUEsTUFBQSxHQUFBLENBQUEsMkJBQUEsRUFBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxTQUFBLElBQUE7QUFDQSxTQUZB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ZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICduZ01hdGVyaWFsJ10pO1xyXG5cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xyXG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxyXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXHJcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxyXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXHJcbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxyXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcclxuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcclxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xyXG5cclxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcclxuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cclxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXHJcbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XHJcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cclxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxyXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXHJcbiAgICAgICAgICAgIGlmICh1c2VyKSB7XHJcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FydGljbGVzJywge1xyXG4gICAgICAgIHVybDogJy9hcnRpY2xlcycsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2FydGljbGUtbGlzdC9hcnRpY2xlcy5odG1sJ1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlJywge1xyXG4gICAgICAgIHVybDogJy9hcnRpY2xlJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvYXJ0aWNsZS12aWV3L2FydGljbGUtdmlldy5odG1sJyxcclxuICAgICAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgICBjdXJyZW50OiBmdW5jdGlvbihBcnRpY2xlVmlld0ZhY3RvcnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEFydGljbGVWaWV3RmFjdG9yeS5nZXRBcnRpY2xlQnlJZCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29udHJvbGxlcjogJ0FydGljbGVWaWV3Q3RybCdcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdBcnRpY2xlVmlld0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGN1cnJlbnQsICRjb21waWxlKSB7XHJcbiAgJHNjb3BlLmN1cnJlbnQgPSBjdXJyZW50O1xyXG4gICRzY29wZS50aXRsZSA9IGN1cnJlbnQudGl0bGU7XHJcbiAgJHNjb3BlLmNvbnRlbnQgPSBjdXJyZW50LmNvbnRlbnQ7XHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXHJcbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XHJcblxyXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcclxuXHJcbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXHJcbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxyXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cclxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XHJcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcclxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcclxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXHJcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXHJcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxyXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcclxuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcclxuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxyXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXHJcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXHJcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxuXHJcbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XHJcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXHJcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXHJcbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxyXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcclxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXHJcbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cclxuXHJcbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxyXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxyXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cclxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxyXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXHJcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XHJcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcclxuICAgICAgICB9O1xyXG5cclxuICAgIH0pO1xyXG5cclxufSkoKTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xyXG4gICAgICAgIHVybDogJy8nLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9ob21lL2hvbWUuaHRtbCdcclxuICAgIH0pO1xyXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcclxuICAgICAgICB1cmw6ICcvbG9naW4nLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9sb2dpbi9sb2dpbi5odG1sJyxcclxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgJHNjb3BlLmxvZ2luID0ge307XHJcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xyXG5cclxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XHJcblxyXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XHJcblxyXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xyXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XHJcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXHJcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXHJcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcclxuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXHJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxyXG4gICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xyXG5cclxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXHJcbiAgICB9O1xyXG5cclxufSk7IiwiYXBwLmZhY3RvcnkoJ1BhZ2VzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKXtcclxuXHR2YXIgUGFnZXNGYWN0b3J5ID0ge31cclxuXHJcblx0UGFnZXNGYWN0b3J5LmdldFNhdmVkID0gZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhZ2VzXCIpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdHJldHVybiBQYWdlc0ZhY3Rvcnk7XHJcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcil7XHJcblxyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwYWdlcycsIHtcclxuXHQgICAgdXJsOiAnL3BhZ2VzJyxcclxuXHQgICAgdGVtcGxhdGVVcmw6ICdodG1sL3BhZ2VzL3BhZ2VzLmh0bWwnLCAvL1N0aWxsIG5lZWQgdG8gbWFrZVxyXG5cdCAgICBjb250cm9sbGVyOiAnUGFnZXNDdHJsJ1xyXG5cdH0pO1xyXG5cclxufSlcclxuXHJcbmFwcC5jb250cm9sbGVyKCdQYWdlc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFBhZ2VzRmFjdG9yeSl7XHJcblxyXG5cdFBhZ2VzRmFjdG9yeS5nZXRTYXZlZCgpXHJcblx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0JHNjb3BlLnBhZ2VzID0gcmVzcG9uc2U7XHJcblx0fSlcclxuXHJcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncGFyc2VyJywge1xyXG4gICAgICAgIHVybDogJy9wYXJzZXInLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9wYXJzZXIvcGFyc2VyLmh0bWwnLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQYXJzZXJDdHJsJ1xyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdQYXJzZXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBQYXJzZXJGYWN0b3J5KSB7XHJcblxyXG4gICAgJHNjb3BlLnBhcnNlVXJsID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5zaWRlIHBhcnNlckN0cmwgcGFyc2VVcmw6IFwiLCAkc2NvcGUudXJsKTtcclxuICAgICAgICBQYXJzZXJGYWN0b3J5LnBhcnNlVXJsKCRzY29wZS51cmwpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICRzY29wZS5wYXJzZWQgPSByZXNwb25zZTtcclxuICAgICAgICB9KVxyXG5cclxuICAgIH07XHJcblxyXG59KTtcclxuXHJcblxyXG4iLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcclxuICAgIF07XHJcbn0pO1xyXG4gIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xyXG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xyXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcclxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcclxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxyXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxyXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXHJcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxyXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxyXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxyXG4gICAgICAgICc6RCcsXHJcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcclxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxyXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxyXG4gICAgXTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxyXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSk7XHJcbiIsImFwcC5mYWN0b3J5KCdhcnRpY2xlRGV0YWlsRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XHJcbiAgdmFyIGRldGFpbE9iaiA9IHt9O1xyXG5cclxuICBkZXRhaWxPYmouZmV0Y2hBbGxCeUNhdGVnb3J5ID0gZnVuY3Rpb24oY2F0ZWdvcnkpIHtcclxuICAgIC8vIHJldHVybiBhbGwgdGl0bGVzIGFuZCBzdW1tYXJpZXMgYXNzb2NpYXRlZCB3aXRoIGN1cnJlbnQgY2F0ZWdvcnlcclxuICB9O1xyXG5cclxuICBkZXRhaWxPYmouZmV0Y2hPbmVCeUlkID0gZnVuY3Rpb24oaWQpIHtcclxuXHJcbiAgfTtcclxuXHJcbiAgZGV0YWlsT2JqLmFkZEFydGljbGUgPSBmdW5jdGlvbihjYXRlZ29yeSkge1xyXG4gICAgLy8gYWRkIG9uZSBhcnRpY2xlIHRvIGNhdGVnb3J5XHJcbiAgfTtcclxuXHJcbiAgZGV0YWlsT2JqLnJlbW92ZUFydGljbGVCeUlEID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvLyByZW1vdmUgb24gYXJ0aWNsZSBieSBJRFxyXG4gIH07XHJcblxyXG4gIGRldGFpbE9iai5zYXZlQXJ0aWNsZUJ5VXJsID0gZnVuY3Rpb24odXJsLCBjYXRlZ29yeSkge1xyXG4gICAgLy8gZGVmYXVsdCB0byBhbGwsIG9yIG9wdGlvbmFsIGNhdGVnb3J5XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGV0YWlsT2JqO1xyXG59KVxyXG4iLCJhcHAuZmFjdG9yeSgnQXJ0aWNsZVZpZXdGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XHJcblx0dmFyIGFydGljbGVWaWV3T2JqID0ge307XHJcblxyXG5cdGFydGljbGVWaWV3T2JqLmdldEFydGljbGVCeUlkID0gZnVuY3Rpb24gKGlkKSB7XHJcbiAgICByZXR1cm4gdGVtcEFydGljbGVPYmo7XHJcblx0fTtcclxuXHJcblx0YXJ0aWNsZVZpZXdPYmoucmVtb3ZlQXJ0aWNsZUJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuXHJcblx0fTtcclxuXHJcbiAgYXJ0aWNsZVZpZXdPYmouYWRkQXJ0aWNsZUNhdGVnb3J5ID0gZnVuY3Rpb24gKGlkLCBjYXQpIHtcclxuXHJcbiAgfTtcclxuXHJcblx0cmV0dXJuIGFydGljbGVWaWV3T2JqO1xyXG59KVxyXG5cclxuXHJcbnZhciB0ZW1wQXJ0aWNsZU9iaiA9XHJcbiAge1xyXG5cdFx0XCJfX3ZcIjogMCxcclxuXHRcdFwiY29udGVudFwiOiBcIjxkaXY+PGFydGljbGUgY2xhc3M9XFxcImNvbnRlbnQgbGluay11bmRlcmxpbmUgcmVsYXRpdmUgYm9keS1jb3B5XFxcIj5cXG5cXG5cXHRcXHRcXHQ8cD5JbiAxOTMyLCB0aGUgRHV0Y2ggYXN0cm9ub21lciBKYW4gT29ydCB0YWxsaWVkIHRoZSBzdGFycyBpbiB0aGUgTWlsa3kgV2F5IGFuZCBmb3VuZCB0aGF0IHRoZXkgY2FtZSB1cCBzaG9ydC4gSnVkZ2luZyBieSB0aGUgd2F5IHRoZSBzdGFycyBib2IgdXAgYW5kIGRvd24gbGlrZSBob3JzZXMgb24gYSBjYXJvdXNlbCBhcyB0aGV5IGdvIGFyb3VuZCB0aGUgcGxhbmUgb2YgdGhlIGdhbGF4eSwgT29ydCBjYWxjdWxhdGVkIHRoYXQgdGhlcmUgb3VnaHQgdG8gYmUgdHdpY2UgYXMgbXVjaCBtYXR0ZXIgZ3Jhdml0YXRpb25hbGx5IHByb3BlbGxpbmcgdGhlbSBhcyBoZSBjb3VsZCBzZWUuIEhlIHBvc3R1bGF0ZWQgdGhlIHByZXNlbmNlIG9mIGhpZGRlbiAmI3gyMDFDO2RhcmsgbWF0dGVyJiN4MjAxRDsgdG8gbWFrZSB1cCB0aGUgZGlmZmVyZW5jZSBhbmQgc3VybWlzZWQgdGhhdCBpdCBtdXN0IGJlIGNvbmNlbnRyYXRlZCBpbiBhIGRpc2sgdG8gZXhwbGFpbiB0aGUgc3RhcnMmI3gyMDE5OyBtb3Rpb25zLjwvcD5cXG5cXG5cXG48cD5CdXQgY3JlZGl0IGZvciB0aGUgZGlzY292ZXJ5IG9mIGRhcmsgbWF0dGVyJiN4MjAxNDt0aGUgaW52aXNpYmxlLCB1bmlkZW50aWZpZWQgc3R1ZmYgdGhhdCBjb21wcmlzZXMgZml2ZS1zaXh0aHMgb2YgdGhlIHVuaXZlcnNlJiN4MjAxOTtzIG1hc3MmI3gyMDE0O3VzdWFsbHkgZ29lcyB0byB0aGUgU3dpc3MtQW1lcmljYW4gYXN0cm9ub21lciBGcml0eiBad2lja3ksIHdobyBpbmZlcnJlZCBpdHMgZXhpc3RlbmNlIGZyb20gdGhlIHJlbGF0aXZlIG1vdGlvbnMgb2YgZ2FsYXhpZXMgaW4gMTkzMy4gT29ydCBpcyBwYXNzZWQgb3ZlciBvbiB0aGUgZ3JvdW5kcyB0aGF0IGhlIHdhcyB0cmFpbGluZyBhIGZhbHNlIGNsdWUuIEJ5IDIwMDAsIHVwZGF0ZWQsIE9vcnQtc3R5bGUgaW52ZW50b3JpZXMgb2YgdGhlIE1pbGt5IFdheSBkZXRlcm1pbmVkIHRoYXQgaXRzICYjeDIwMUM7bWlzc2luZyYjeDIwMUQ7IG1hc3MgY29uc2lzdHMgb2YgZmFpbnQgc3RhcnMsIGdhcyBhbmQgZHVzdCwgd2l0aCBubyBuZWVkIGZvciBhIGRhcmsgZGlzay4gRWlnaHR5IHllYXJzIG9mIGhpbnRzIHN1Z2dlc3QgdGhhdCBkYXJrIG1hdHRlciwgd2hhdGV2ZXIgaXQgaXMsIGZvcm1zIHNwaGVyaWNhbCBjbG91ZHMgY2FsbGVkICYjeDIwMUM7aGFsb3MmI3gyMDFEOyBhcm91bmQgZ2FsYXhpZXMuPC9wPlxcbjxwPk9yIHNvIG1vc3QgZGFyayBtYXR0ZXIgaHVudGVycyBoYXZlIGl0LiBUaG91Z2ggaXQgZmVsbCBvdXQgb2YgZmF2b3IsIHRoZSBkYXJrIGRpc2sgaWRlYSBuZXZlciBjb21wbGV0ZWx5IHdlbnQgYXdheS4gQW5kIHJlY2VudGx5LCBpdCBoYXMgZm91bmQgYSBoaWdoLXByb2ZpbGUgY2hhbXBpb24gaW4gPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucGh5c2ljcy5oYXJ2YXJkLmVkdS9wZW9wbGUvZmFjcGFnZXMvcmFuZGFsbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkxpc2EgUmFuZGFsbDwvYT4sIGEgcHJvZmVzc29yIG9mIHBoeXNpY3MgYXQgSGFydmFyZCBVbml2ZXJzaXR5LCB3aG8gaGFzIHJlc2N1ZWQgdGhlIGRpc2sgZnJvbSBzY2llbnRpZmljIG9ibGl2aW9uIGFuZCBnaXZlbiBpdCBhbiBhY3RpdmUgcm9sZSBvbiB0aGUgZ2FsYWN0aWMgc3RhZ2UuPC9wPlxcbjxwPlNpbmNlIDxhIGhyZWY9XFxcImh0dHA6Ly9hcnhpdi5vcmcvcGRmLzEzMDMuMTUyMXYyLnBkZlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnByb3Bvc2luZyB0aGUgbW9kZWw8L2E+IGluIDIwMTMsIFJhbmRhbGwgYW5kIGhlciBjb2xsYWJvcmF0b3JzIGhhdmUgYXJndWVkIHRoYXQgYSBkYXJrIGRpc2sgbWlnaHQgZXhwbGFpbiBnYW1tYSByYXlzIGNvbWluZyBmcm9tIHRoZSBnYWxhY3RpYyBjZW50ZXIsIHRoZSA8YSBocmVmPVxcXCJodHRwOi8vd3d3Lm5hdHVyZS5jb20vbmF0dXJlL2pvdXJuYWwvdjUxMS9uNzUxMS9mdWxsL25hdHVyZTEzNDgxLmh0bWxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5wbGFuYXIgZGlzdHJpYnV0aW9uIG9mIGR3YXJmIGdhbGF4aWVzPC9hPiBvcmJpdGluZyB0aGUgQW5kcm9tZWRhIGdhbGF4eSBhbmQgdGhlIE1pbGt5IFdheSwgYW5kIGV2ZW4gPGEgaHJlZj1cXFwiaHR0cHM6Ly9waHlzaWNzLmFwcy5vcmcvZmVhdHVyZWQtYXJ0aWNsZS1wZGYvMTAuMTEwMy9QaHlzUmV2TGV0dC4xMTIuMTYxMzAxXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cGVyaW9kaWMgdXB0aWNrcyBvZiBjb21ldCBpbXBhY3RzPC9hPiBhbmQgbWFzcyBleHRpbmN0aW9ucyBvbiBFYXJ0aCwgZGlzY3Vzc2VkIGluIFJhbmRhbGwmI3gyMDE5O3MgMjAxNSBwb3B1bGFyLXNjaWVuY2UgYm9vaywgPGVtPkRhcmsgTWF0dGVyIGFuZCB0aGUgRGlub3NhdXJzPC9lbT4uPC9wPlxcbjxwPkJ1dCBhc3Ryb3BoeXNpY2lzdHMgd2hvIGRvIGludmVudG9yaWVzIG9mIHRoZSBNaWxreSBXYXkgaGF2ZSBwcm90ZXN0ZWQsIGFyZ3VpbmcgdGhhdCB0aGUgZ2FsYXh5JiN4MjAxOTtzIHRvdGFsIG1hc3MgYW5kIHRoZSBib2JiaW5nIG1vdGlvbnMgb2YgaXRzIHN0YXJzIG1hdGNoIHVwIHRvbyB3ZWxsIHRvIGxlYXZlIHJvb20gZm9yIGEgZGFyayBkaXNrLiAmI3gyMDFDO0l0JiN4MjAxOTtzIG1vcmUgc3Ryb25nbHkgY29uc3RyYWluZWQgdGhhbiBMaXNhIFJhbmRhbGwgcHJldGVuZHMsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm8udXRvcm9udG8uY2EvfmJvdnkvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Sm8gQm92eTwvYT4sIGFuIGFzdHJvcGh5c2ljaXN0IGF0IHRoZSBVbml2ZXJzaXR5IG9mIFRvcm9udG8uPC9wPlxcbjxwPk5vdywgUmFuZGFsbCwgd2hvIGhhcyBkZXZpc2VkIGluZmx1ZW50aWFsIGlkZWFzIGFib3V0IHNldmVyYWwgb2YgdGhlIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZy8yMDE1MDgwMy1waHlzaWNzLXRoZW9yaWVzLW1hcC9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5iaWdnZXN0IHF1ZXN0aW9ucyBpbiBmdW5kYW1lbnRhbCBwaHlzaWNzPC9hPiwgaXMgZmlnaHRpbmcgYmFjay4gSW4gPGEgaHJlZj1cXFwiaHR0cDovL2FyeGl2Lm9yZy9hYnMvMTYwNC4wMTQwN1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmEgcGFwZXI8L2E+IHBvc3RlZCBvbmxpbmUgbGFzdCB3ZWVrIHRoYXQgaGFzIGJlZW4gYWNjZXB0ZWQgZm9yIHB1YmxpY2F0aW9uIGluIDxlbT5UaGUgQXN0cm9waHlzaWNhbCBKb3VybmFsPC9lbT4sIFJhbmRhbGwgYW5kIGhlciBzdHVkZW50LCBFcmljIEtyYW1lciwgcmVwb3J0IGEgZGlzay1zaGFwZWQgbG9vcGhvbGUgaW4gdGhlIE1pbGt5IFdheSBhbmFseXNpczogJiN4MjAxQztUaGVyZSBpcyBhbiBpbXBvcnRhbnQgZGV0YWlsIHRoYXQgaGFzIHNvIGZhciBiZWVuIG92ZXJsb29rZWQsJiN4MjAxRDsgdGhleSB3cml0ZS4gJiN4MjAxQztUaGUgZGlzayBjYW4gYWN0dWFsbHkgbWFrZSByb29tIGZvciBpdHNlbGYuJiN4MjAxRDs8L3A+XFxuPGZpZ3VyZSBjbGFzcz1cXFwid3AtY2FwdGlvbiBsYW5kc2NhcGUgYWxpZ25ub25lIGZhZGVyIHJlbGF0aXZlXFxcIj48aW1nIGNsYXNzPVxcXCJzaXplLXRleHQtY29sdW1uLXdpZHRoIHdwLWltYWdlLTIwMjIyNTVcXFwiIHNyYz1cXFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzA2MTAxNF9yYW5kYWxsXzE2MjdfMzEwNTc1XzkwNDUxOC02MTV4NDEwLTQ4MngzMjEuanBnXFxcIiBhbHQ9XFxcIjA2MTAxNF9SYW5kYWxsXzE2MjcuanBnXFxcIiB3aWR0aD1cXFwiNDgyXFxcIj48ZmlnY2FwdGlvbiBjbGFzcz1cXFwid3AtY2FwdGlvbi10ZXh0IGxpbmstdW5kZXJsaW5lXFxcIj5MaXNhIFJhbmRhbGwgb2YgSGFydmFyZCBVbml2ZXJzaXR5IGlzIGEgaGlnaC1wcm9maWxlIHN1cHBvcnRlciBvZiB0aGUgY29udHJvdmVyc2lhbCBkYXJrIGRpc2sgaWRlYS48c3BhbiBjbGFzcz1cXFwiY3JlZGl0IGxpbmstdW5kZXJsaW5lLXNtXFxcIj5Sb3NlIExpbmNvbG4vSGFydmFyZCBVbml2ZXJzaXR5PC9zcGFuPjwvZmlnY2FwdGlvbj48L2ZpZ3VyZT5cXG48cD5JZiB0aGVyZSBpcyBhIHRoaW4gZGFyayBkaXNrIGNvdXJzaW5nIHRocm91Z2ggdGhlICYjeDIwMUM7bWlkcGxhbmUmI3gyMDFEOyBvZiB0aGUgZ2FsYXh5LCBSYW5kYWxsIGFuZCBLcmFtZXIgYXJndWUsIHRoZW4gaXQgd2lsbCBncmF2aXRhdGlvbmFsbHkgcGluY2ggb3RoZXIgbWF0dGVyIGlud2FyZCwgcmVzdWx0aW5nIGluIGEgaGlnaGVyIGRlbnNpdHkgb2Ygc3RhcnMsIGdhcyBhbmQgZHVzdCBhdCB0aGUgbWlkcGxhbmUgdGhhbiBhYm92ZSBhbmQgYmVsb3cuIFJlc2VhcmNoZXJzIHR5cGljYWxseSBlc3RpbWF0ZSB0aGUgdG90YWwgdmlzaWJsZSBtYXNzIG9mIHRoZSBNaWxreSBXYXkgYnkgZXh0cmFwb2xhdGluZyBvdXR3YXJkIGZyb20gdGhlIG1pZHBsYW5lIGRlbnNpdHk7IGlmIHRoZXJlJiN4MjAxOTtzIGEgcGluY2hpbmcgZWZmZWN0LCB0aGVuIHRoaXMgZXh0cmFwb2xhdGlvbiBsZWFkcyB0byBhbiBvdmVyZXN0aW1hdGlvbiBvZiB0aGUgdmlzaWJsZSBtYXNzLCBtYWtpbmcgaXQgc2VlbSBhcyBpZiB0aGUgbWFzcyBtYXRjaGVzIHVwIHRvIHRoZSBzdGFycyYjeDIwMTk7IG1vdGlvbnMuICYjeDIwMUM7VGhhdCYjeDIwMTk7cyB0aGUgcmVhc29uIHdoeSBhIGxvdCBvZiB0aGVzZSBwcmV2aW91cyBzdHVkaWVzIGRpZCBub3Qgc2VlIGV2aWRlbmNlIGZvciBhIGRhcmsgZGlzaywmI3gyMDFEOyBLcmFtZXIgc2FpZC4gSGUgYW5kIFJhbmRhbGwgZmluZCB0aGF0IGEgdGhpbiBkYXJrIGRpc2sgaXMgcG9zc2libGUmI3gyMDE0O2FuZCBpbiBvbmUgd2F5IG9mIHJlZG9pbmcgdGhlIGFuYWx5c2lzLCBzbGlnaHRseSBmYXZvcmVkIG92ZXIgbm8gZGFyayBkaXNrLjwvcD5cXG48cD4mI3gyMDFDO0xpc2EmI3gyMDE5O3Mgd29yayBoYXMgcmVvcGVuZWQgdGhlIGNhc2UsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm9ub215LnN3aW4uZWR1LmF1L3N0YWZmL2NmbHlubi5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Q2hyaXMgRmx5bm48L2E+IG9mIFN3aW5idXJuZSBVbml2ZXJzaXR5IG9mIFRlY2hub2xvZ3kgaW4gTWVsYm91cm5lLCBBdXN0cmFsaWEsIHdobywgd2l0aCBKb2hhbiBIb2xtYmVyZywgY29uZHVjdGVkIGEgc2VyaWVzIG9mIE1pbGt5IFdheSBpbnZlbnRvcmllcyBpbiB0aGUgZWFybHkgYXVnaHRzIHRoYXQgc2VlbWVkIHRvIDxhIGhyZWY9XFxcImh0dHA6Ly9vbmxpbmVsaWJyYXJ5LndpbGV5LmNvbS9kb2kvMTAuMTA0Ni9qLjEzNjUtODcxMS4yMDAwLjAyOTA1LngvYWJzdHJhY3RcXFwiPnJvYnVzdGx5IHN3ZWVwIGl0IGNsZWFuPC9hPiBvZiBhIGRhcmsgZGlzay48L3A+XFxuPHA+Qm92eSBkaXNhZ3JlZXMuIEV2ZW4gdGFraW5nIHRoZSBwaW5jaGluZyBlZmZlY3QgaW50byBhY2NvdW50LCBoZSBlc3RpbWF0ZXMgdGhhdCBhdCBtb3N0IDIgcGVyY2VudCBvZiB0aGUgdG90YWwgYW1vdW50IG9mIGRhcmsgbWF0dGVyIGNhbiBsaWUgaW4gYSBkYXJrIGRpc2ssIHdoaWxlIHRoZSByZXN0IG11c3QgZm9ybSBhIGhhbG8uICYjeDIwMUM7SSB0aGluayBtb3N0IHBlb3BsZSB3YW50IHRvIGZpZ3VyZSBvdXQgd2hhdCA5OCBwZXJjZW50IG9mIHRoZSBkYXJrIG1hdHRlciBpcyBhYm91dCwgbm90IHdoYXQgMiBwZXJjZW50IG9mIGl0IGlzIGFib3V0LCYjeDIwMUQ7IGhlIHNhaWQuPC9wPlxcbjxwPlRoZSBkZWJhdGUmI3gyMDE0O2FuZCB0aGUgZmF0ZSBvZiB0aGUgZGFyayBkaXNrJiN4MjAxNDt3aWxsIHByb2JhYmx5IGJlIGRlY2lkZWQgc29vbi4gVGhlIEV1cm9wZWFuIFNwYWNlIEFnZW5jeSYjeDIwMTk7cyBHYWlhIHNhdGVsbGl0ZSBpcyBjdXJyZW50bHkgc3VydmV5aW5nIHRoZSBwb3NpdGlvbnMgYW5kIHZlbG9jaXRpZXMgb2Ygb25lIGJpbGxpb24gc3RhcnMsIGFuZCBhIGRlZmluaXRpdmUgaW52ZW50b3J5IG9mIHRoZSBNaWxreSBXYXkgY291bGQgYmUgY29tcGxldGVkIGFzIHNvb24gYXMgbmV4dCBzdW1tZXIuPC9wPlxcbjxwPlRoZSBkaXNjb3Zlcnkgb2YgYSBkYXJrIGRpc2ssIG9mIGFueSBzaXplLCB3b3VsZCBiZSBlbm9ybW91c2x5IHJldmVhbGluZy4gSWYgb25lIGV4aXN0cywgZGFyayBtYXR0ZXIgaXMgZmFyIG1vcmUgY29tcGxleCB0aGFuIHJlc2VhcmNoZXJzIGhhdmUgbG9uZyB0aG91Z2h0LiBNYXR0ZXIgc2V0dGxlcyBpbnRvIGEgZGlzayBzaGFwZSBvbmx5IGlmIGl0IGlzIGFibGUgdG8gc2hlZCBlbmVyZ3ksIGFuZCB0aGUgZWFzaWVzdCB3YXkgZm9yIGl0IHRvIHNoZWQgc3VmZmljaWVudCBlbmVyZ3kgaXMgaWYgaXQgZm9ybXMgYXRvbXMuIFRoZSBleGlzdGVuY2Ugb2YgZGFyayBhdG9tcyB3b3VsZCBtZWFuIGRhcmsgcHJvdG9ucyBhbmQgZGFyayBlbGVjdHJvbnMgdGhhdCBhcmUgY2hhcmdlZCBpbiBhIHNpbWlsYXIgc3R5bGUgYXMgdmlzaWJsZSBwcm90b25zIGFuZCBlbGVjdHJvbnMsIGludGVyYWN0aW5nIHdpdGggZWFjaCBvdGhlciB2aWEgYSBkYXJrIGZvcmNlIHRoYXQgaXMgY29udmV5ZWQgYnkgZGFyayBwaG90b25zLiBFdmVuIGlmIDk4IHBlcmNlbnQgb2YgZGFyayBtYXR0ZXIgaXMgaW5lcnQsIGFuZCBmb3JtcyBoYWxvcywgdGhlIGV4aXN0ZW5jZSBvZiBldmVuIGEgdGhpbiBkYXJrIGRpc2sgd291bGQgaW1wbHkgYSByaWNoICYjeDIwMUM7ZGFyayBzZWN0b3ImI3gyMDFEOyBvZiB1bmtub3duIHBhcnRpY2xlcyBhcyBkaXZlcnNlLCBwZXJoYXBzLCBhcyB0aGUgdmlzaWJsZSB1bml2ZXJzZS4gJiN4MjAxQztOb3JtYWwgbWF0dGVyIGlzIHByZXR0eSBjb21wbGV4OyB0aGVyZSYjeDIwMTk7cyBzdHVmZiB0aGF0IHBsYXlzIGEgcm9sZSBpbiBhdG9tcyBhbmQgdGhlcmUmI3gyMDE5O3Mgc3R1ZmYgdGhhdCBkb2VzbiYjeDIwMTk7dCwmI3gyMDFEOyBzYWlkIDxhIGhyZWY9XFxcImh0dHA6Ly93d3cucGh5c2ljcy51Y2kuZWR1L35idWxsb2NrL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkphbWVzIEJ1bGxvY2s8L2E+LCBhbiBhc3Ryb3BoeXNpY2lzdCBhdCB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBJcnZpbmUuICYjeDIwMUM7U28gaXQmI3gyMDE5O3Mgbm90IGNyYXp5IHRvIGltYWdpbmUgdGhhdCB0aGUgb3RoZXIgZml2ZS1zaXh0aHMgW29mIHRoZSBtYXR0ZXIgaW4gdGhlIHVuaXZlcnNlXSBpcyBwcmV0dHkgY29tcGxleCwgYW5kIHRoYXQgdGhlcmUmI3gyMDE5O3Mgc29tZSBwaWVjZSBvZiB0aGF0IGRhcmsgc2VjdG9yIHRoYXQgd2luZHMgdXAgaW4gYm91bmQgYXRvbXMuJiN4MjAxRDs8L3A+XFxuPHA+VGhlIG5vdGlvbiB0aGF0IDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZy8yMDE1MDgyMC10aGUtY2FzZS1mb3ItY29tcGxleC1kYXJrLW1hdHRlci9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5kYXJrIG1hdHRlciBtaWdodCBiZSBjb21wbGV4PC9hPiBoYXMgZ2FpbmVkIHRyYWN0aW9uIGluIHJlY2VudCB5ZWFycywgYWlkZWQgYnkgYXN0cm9waHlzaWNhbCBhbm9tYWxpZXMgdGhhdCBkbyBub3QgZ2VsIHdpdGggdGhlIGxvbmctcmVpZ25pbmcgcHJvZmlsZSBvZiBkYXJrIG1hdHRlciBhcyBwYXNzaXZlLCBzbHVnZ2lzaCAmI3gyMDFDO3dlYWtseSBpbnRlcmFjdGluZyBtYXNzaXZlIHBhcnRpY2xlcy4mI3gyMDFEOyBUaGVzZSBhbm9tYWxpZXMsIHBsdXMgdGhlIGZhaWx1cmUgb2YgJiN4MjAxQztXSU1QcyYjeDIwMUQ7IHRvIHNob3cgdXAgaW4gZXhoYXVzdGl2ZSBleHBlcmltZW50YWwgc2VhcmNoZXMgYWxsIG92ZXIgdGhlIHdvcmxkLCBoYXZlIHdlYWtlbmVkIHRoZSBXSU1QIHBhcmFkaWdtLCBhbmQgdXNoZXJlZCBpbiBhIG5ldywgZnJlZS1mb3ItYWxsIGVyYSwgaW4gd2hpY2ggdGhlIG5hdHVyZSBvZiB0aGUgZGFyayBiZWFzdCBpcyBhbnlib2R5JiN4MjAxOTtzIGd1ZXNzLjwvcD5cXG48cD5UaGUgZmllbGQgc3RhcnRlZCBvcGVuaW5nIHVwIGFyb3VuZCAyMDA4LCB3aGVuIGFuIGV4cGVyaW1lbnQgY2FsbGVkIFBBTUVMQSBkZXRlY3RlZCBhbiBleGNlc3Mgb2YgcG9zaXRyb25zIG92ZXIgZWxlY3Ryb25zIGNvbWluZyBmcm9tIHNwYWNlJiN4MjAxNDthbiBhc3ltbWV0cnkgdGhhdCBmdWVsZWQgaW50ZXJlc3QgaW4gJiN4MjAxQzs8YSBocmVmPVxcXCJodHRwOi8vYXJ4aXYub3JnL2Ficy8wOTAxLjQxMTdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5hc3ltbWV0cmljIGRhcmsgbWF0dGVyPC9hPiwmI3gyMDFEOyBhIG5vdy1wb3B1bGFyIG1vZGVsIHByb3Bvc2VkIGJ5IDxhIGhyZWY9XFxcImh0dHA6Ly93d3ctdGhlb3J5LmxibC5nb3Yvd29yZHByZXNzLz9wYWdlX2lkPTY4NTFcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5LYXRocnluIFp1cmVrPC9hPiBhbmQgY29sbGFib3JhdG9ycy4gQXQgdGhlIHRpbWUsIHRoZXJlIHdlcmUgZmV3IGlkZWFzIG90aGVyIHRoYW4gV0lNUHMgaW4gcGxheS4gJiN4MjAxQztUaGVyZSB3ZXJlIG1vZGVsLWJ1aWxkZXJzIGxpa2UgbWUgd2hvIHJlYWxpemVkIHRoYXQgZGFyayBtYXR0ZXIgd2FzIGp1c3QgZXh0cmFvcmRpbmFyaWx5IHVuZGVyZGV2ZWxvcGVkIGluIHRoaXMgZGlyZWN0aW9uLCYjeDIwMUQ7IHNhaWQgWnVyZWssIG5vdyBvZiBMYXdyZW5jZSBCZXJrZWxleSBOYXRpb25hbCBMYWJvcmF0b3J5IGluIENhbGlmb3JuaWEuICYjeDIwMUM7U28gd2UgZG92ZSBpbi4mI3gyMDFEOzwvcD5cXG48ZmlndXJlIGNsYXNzPVxcXCJ3cC1jYXB0aW9uIGxhbmRzY2FwZSBhbGlnbm5vbmUgZmFkZXIgcmVsYXRpdmVcXFwiPjxpbWcgY2xhc3M9XFxcInNpemUtdGV4dC1jb2x1bW4td2lkdGggd3AtaW1hZ2UtMjAyMjI1OVxcXCIgc3JjPVxcXCJodHRwczovL3d3dy53aXJlZC5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMTYvMDUvMDI0X1Byb2ZCdWxsb2NrLTYxNXg1MDAtNDgyeDM5Mi5qcGdcXFwiIGFsdD1cXFwiSmFtZXMgQnVsbG9jayBvZiB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBJcnZpbmUsIHNlZXMgZGFyayBtYXR0ZXIgYXMgcG90ZW50aWFsbHkgY29tcGxleCBhbmQgc2VsZi1pbnRlcmFjdGluZywgYnV0IG5vdCBuZWNlc3NhcmlseSBjb25jZW50cmF0ZWQgaW4gdGhpbiBkaXNrcy5cXFwiIHdpZHRoPVxcXCI0ODJcXFwiPjxmaWdjYXB0aW9uIGNsYXNzPVxcXCJ3cC1jYXB0aW9uLXRleHQgbGluay11bmRlcmxpbmVcXFwiPkphbWVzIEJ1bGxvY2sgb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLCBzZWVzIGRhcmsgbWF0dGVyIGFzIHBvdGVudGlhbGx5IGNvbXBsZXggYW5kIHNlbGYtaW50ZXJhY3RpbmcsIGJ1dCBub3QgbmVjZXNzYXJpbHkgY29uY2VudHJhdGVkIGluIHRoaW4gZGlza3MuPHNwYW4gY2xhc3M9XFxcImNyZWRpdCBsaW5rLXVuZGVybGluZS1zbVxcXCI+Sm9uYXRoYW4gQWxjb3JuIGZvciBRdWFudGEgTWFnYXppbmU8L3NwYW4+PC9maWdjYXB0aW9uPjwvZmlndXJlPlxcbjxwPkFub3RoZXIgdHJpZ2dlciBoYXMgYmVlbiB0aGUgZGVuc2l0eSBvZiBkd2FyZiBnYWxheGllcy4gV2hlbiByZXNlYXJjaGVycyB0cnkgdG8gc2ltdWxhdGUgdGhlaXIgZm9ybWF0aW9uLCBkd2FyZiBnYWxheGllcyB0eXBpY2FsbHkgdHVybiBvdXQgdG9vIGRlbnNlIGluIHRoZWlyIGNlbnRlcnMsIHVubGVzcyByZXNlYXJjaGVycyBhc3N1bWUgdGhhdCBkYXJrIG1hdHRlciBwYXJ0aWNsZXMgaW50ZXJhY3Qgd2l0aCBvbmUgYW5vdGhlciB2aWEgZGFyayBmb3JjZXMuIEFkZCB0b28gbXVjaCBpbnRlcmFjdGl2aXR5LCBob3dldmVyLCBhbmQgeW91IG11Y2sgdXAgc2ltdWxhdGlvbnMgb2Ygc3RydWN0dXJlIGZvcm1hdGlvbiBpbiB0aGUgZWFybHkgdW5pdmVyc2UuICYjeDIwMUM7V2hhdCB3ZSYjeDIwMTk7cmUgdHJ5aW5nIHRvIGRvIGlzIGZpZ3VyZSBvdXQgd2hhdCBpcyBhbGxvd2VkLCYjeDIwMUQ7IHNhaWQgQnVsbG9jaywgd2hvIGJ1aWxkcyBzdWNoIHNpbXVsYXRpb25zLiBNb3N0IG1vZGVsZXJzIGFkZCB3ZWFrIGludGVyYWN0aW9ucyB0aGF0IGRvbiYjeDIwMTk7dCBhZmZlY3QgdGhlIGhhbG8gc2hhcGUgb2YgZGFyayBtYXR0ZXIuIEJ1dCAmI3gyMDFDO3JlbWFya2FibHksJiN4MjAxRDsgQnVsbG9jayBzYWlkLCAmI3gyMDFDO3RoZXJlIGlzIGEgY2xhc3Mgb2YgZGFyayBtYXR0ZXIgdGhhdCBhbGxvd3MgZm9yIGRpc2tzLiYjeDIwMUQ7IEluIHRoYXQgY2FzZSwgb25seSBhIHRpbnkgZnJhY3Rpb24gb2YgZGFyayBtYXR0ZXIgcGFydGljbGVzIGludGVyYWN0LCBidXQgdGhleSBkbyBzbyBzdHJvbmdseSBlbm91Z2ggdG8gZGlzc2lwYXRlIGVuZXJneSYjeDIwMTQ7YW5kIHRoZW4gZm9ybSBkaXNrcy48L3A+XFxuPHA+UmFuZGFsbCBhbmQgaGVyIGNvbGxhYm9yYXRvcnMgSmlKaSBGYW4sIEFuZHJleSBLYXR6IGFuZCBNYXR0aGV3IFJlZWNlIG1hZGUgdGhlaXIgd2F5IHRvIHRoaXMgaWRlYSBpbiAyMDEzIGJ5IHRoZSBzYW1lIHBhdGggYXMgT29ydDogVGhleSB3ZXJlIHRyeWluZyB0byBleHBsYWluIGFuIGFwcGFyZW50IE1pbGt5IFdheSBhbm9tYWx5LiBLbm93biBhcyB0aGUgJiN4MjAxQztGZXJtaSBsaW5lLCYjeDIwMUQ7IGl0IHdhcyBhbiBleGNlc3Mgb2YgZ2FtbWEgcmF5cyBvZiBhIGNlcnRhaW4gZnJlcXVlbmN5IGNvbWluZyBmcm9tIHRoZSBnYWxhY3RpYyBjZW50ZXIuICYjeDIwMUM7T3JkaW5hcnkgZGFyayBtYXR0ZXIgd291bGRuJiN4MjAxOTt0IGFubmloaWxhdGUgZW5vdWdoJiN4MjAxRDsgdG8gcHJvZHVjZSB0aGUgRmVybWkgbGluZSwgUmFuZGFsbCBzYWlkLCAmI3gyMDFDO3NvIHdlIHRob3VnaHQsIHdoYXQgaWYgaXQgd2FzIG11Y2ggZGVuc2VyPyYjeDIwMUQ7IFRoZSBkYXJrIGRpc2sgd2FzIHJlYm9ybi4gVGhlIEZlcm1pIGxpbmUgdmFuaXNoZWQgYXMgbW9yZSBkYXRhIGFjY3VtdWxhdGVkLCBidXQgdGhlIGRpc2sgaWRlYSBzZWVtZWQgd29ydGggZXhwbG9yaW5nIGFueXdheS4gSW4gMjAxNCwgUmFuZGFsbCBhbmQgUmVlY2UgaHlwb3RoZXNpemVkIHRoYXQgdGhlIGRpc2sgbWlnaHQgYWNjb3VudCBmb3IgcG9zc2libGUgMzAtIHRvIDM1LW1pbGxpb24teWVhciBpbnRlcnZhbHMgYmV0d2VlbiBlc2NhbGF0ZWQgbWV0ZW9yIGFuZCBjb21ldCBhY3Rpdml0eSwgYSBzdGF0aXN0aWNhbGx5IHdlYWsgc2lnbmFsIHRoYXQgc29tZSBzY2llbnRpc3RzIGhhdmUgdGVudGF0aXZlbHkgdGllZCB0byBwZXJpb2RpYyBtYXNzIGV4dGluY3Rpb25zLiBFYWNoIHRpbWUgdGhlIHNvbGFyIHN5c3RlbSBib2JzIHVwIG9yIGRvd24gdGhyb3VnaCB0aGUgZGFyayBkaXNrIG9uIHRoZSBNaWxreSBXYXkgY2Fyb3VzZWwsIHRoZXkgYXJndWVkLCB0aGUgZGlzayYjeDIwMTk7cyBncmF2aXRhdGlvbmFsIGVmZmVjdCBtaWdodCBkZXN0YWJpbGl6ZSByb2NrcyBhbmQgY29tZXRzIGluIHRoZSBPb3J0IGNsb3VkJiN4MjAxNDthIHNjcmFweWFyZCBvbiB0aGUgb3V0c2tpcnRzIG9mIHRoZSBzb2xhciBzeXN0ZW0gbmFtZWQgZm9yIEphbiBPb3J0LiBUaGVzZSBvYmplY3RzIHdvdWxkIGdvIGh1cnRsaW5nIHRvd2FyZCB0aGUgaW5uZXIgc29sYXIgc3lzdGVtLCBzb21lIHN0cmlraW5nIEVhcnRoLjwvcD5cXG48cD5CdXQgUmFuZGFsbCBhbmQgaGVyIHRlYW0gZGlkIG9ubHkgYSBjdXJzb3J5JiN4MjAxNDthbmQgaW5jb3JyZWN0JiN4MjAxNDthbmFseXNpcyBvZiBob3cgbXVjaCByb29tIHRoZXJlIGlzIGZvciBhIGRhcmsgZGlzayBpbiB0aGUgTWlsa3kgV2F5JiN4MjAxOTtzIG1hc3MgYnVkZ2V0LCBqdWRnaW5nIGJ5IHRoZSBtb3Rpb25zIG9mIHN0YXJzLiAmI3gyMDFDO1RoZXkgbWFkZSBzb21lIGtpbmQgb2Ygb3V0cmFnZW91cyBjbGFpbXMsJiN4MjAxRDsgQm92eSBzYWlkLjwvcD5cXG48cD5SYW5kYWxsLCB3aG8gc3RhbmRzIG91dCAoYWNjb3JkaW5nIHRvIFJlZWNlKSBmb3IgJiN4MjAxQztoZXIgcGVyc2lzdGVuY2UsJiN4MjAxRDsgcHV0IEtyYW1lciBvbiB0aGUgY2FzZSwgc2Vla2luZyB0byBhZGRyZXNzIHRoZSBjcml0aWNzIGFuZCwgc2hlIHNhaWQsICYjeDIwMUM7dG8gaXJvbiBvdXQgYWxsIHRoZSB3cmlua2xlcyYjeDIwMUQ7IGluIHRoZSBhbmFseXNpcyBiZWZvcmUgR2FpYSBkYXRhIGJlY29tZXMgYXZhaWxhYmxlLiBIZXIgYW5kIEtyYW1lciYjeDIwMTk7cyBuZXcgYW5hbHlzaXMgc2hvd3MgdGhhdCB0aGUgZGFyayBkaXNrLCBpZiBpdCBleGlzdHMsIGNhbm5vdCBiZSBhcyBkZW5zZSBhcyBoZXIgdGVhbSBpbml0aWFsbHkgdGhvdWdodCBwb3NzaWJsZS4gQnV0IHRoZXJlIGlzIGluZGVlZCB3aWdnbGUgcm9vbSBmb3IgYSB0aGluIGRhcmsgZGlzayB5ZXQsIGR1ZSBib3RoIHRvIGl0cyBwaW5jaGluZyBlZmZlY3QgYW5kIHRvIGFkZGl0aW9uYWwgdW5jZXJ0YWludHkgY2F1c2VkIGJ5IGEgbmV0IGRyaWZ0IGluIHRoZSBNaWxreSBXYXkgc3RhcnMgdGhhdCBoYXZlIGJlZW4gbW9uaXRvcmVkIHRodXMgZmFyLjwvcD5cXG5cXG5cXG5cXG48cD5Ob3cgdGhlcmUmI3gyMDE5O3MgYSBuZXcgcHJvYmxlbSwgPGEgaHJlZj1cXFwiaHR0cDovL2lvcHNjaWVuY2UuaW9wLm9yZy9hcnRpY2xlLzEwLjEwODgvMDAwNC02MzdYLzgxNC8xLzEzXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cmFpc2VkPC9hPiBpbiA8ZW0+VGhlIEFzdHJvcGh5c2ljYWwgSm91cm5hbDwvZW0+IGJ5IDxhIGhyZWY9XFxcImh0dHA6Ly9hc3Ryby5iZXJrZWxleS5lZHUvZmFjdWx0eS1wcm9maWxlL2NocmlzLW1ja2VlXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+Q2hyaXMgTWNLZWU8L2E+IG9mIHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIEJlcmtlbGV5LCBhbmQgY29sbGFib3JhdG9ycy4gTWNLZWUgY29uY2VkZXMgdGhhdCBhIHRoaW4gZGFyayBkaXNrIGNhbiBzdGlsbCBiZSBzcXVlZXplZCBpbnRvIHRoZSBNaWxreSBXYXkmI3gyMDE5O3MgbWFzcyBidWRnZXQuIEJ1dCB0aGUgZGlzayBtaWdodCBiZSBzbyB0aGluIHRoYXQgaXQgd291bGQgY29sbGFwc2UuIENpdGluZyByZXNlYXJjaCBmcm9tIHRoZSAxOTYwcyBhbmQgJiN4MjAxOTs3MHMsIE1jS2VlIGFuZCBjb2xsZWFndWVzIGFyZ3VlIHRoYXQgZGlza3MgY2Fubm90IGJlIHNpZ25pZmljYW50bHkgdGhpbm5lciB0aGFuIHRoZSBkaXNrIG9mIHZpc2libGUgZ2FzIGluIHRoZSBNaWxreSBXYXkgd2l0aG91dCBmcmFnbWVudGluZy4gJiN4MjAxQztJdCBpcyBwb3NzaWJsZSB0aGF0IHRoZSBkYXJrIG1hdHRlciB0aGV5IGNvbnNpZGVyIGhhcyBzb21lIHByb3BlcnR5IHRoYXQgaXMgZGlmZmVyZW50IGZyb20gb3JkaW5hcnkgbWF0dGVyIGFuZCBwcmV2ZW50cyB0aGlzIGZyb20gaGFwcGVuaW5nLCBidXQgSSBkb24mI3gyMDE5O3Qga25vdyB3aGF0IHRoYXQgY291bGQgYmUsJiN4MjAxRDsgTWNLZWUgc2FpZC48L3A+XFxuPHA+UmFuZGFsbCBoYXMgbm90IHlldCBwYXJyaWVkIHRoaXMgbGF0ZXN0IGF0dGFjaywgY2FsbGluZyBpdCAmI3gyMDFDO2EgdHJpY2t5IGlzc3VlJiN4MjAxRDsgdGhhdCBpcyAmI3gyMDFDO3VuZGVyIGNvbnNpZGVyYXRpb24gbm93LiYjeDIwMUQ7IFNoZSBoYXMgYWxzbyB0YWtlbiBvbiB0aGUgcG9pbnQgcmFpc2VkIGJ5IEJvdnkmI3gyMDE0O3RoYXQgYSBkaXNrIG9mIGNoYXJnZWQgZGFyayBhdG9tcyBpcyBpcnJlbGV2YW50IG5leHQgdG8gdGhlIG5hdHVyZSBvZiA5OCBwZXJjZW50IG9mIGRhcmsgbWF0dGVyLiBTaGUgaXMgbm93IGludmVzdGlnYXRpbmcgdGhlIHBvc3NpYmlsaXR5IHRoYXQgYWxsIGRhcmsgbWF0dGVyIG1pZ2h0IGJlIGNoYXJnZWQgdW5kZXIgdGhlIHNhbWUgZGFyayBmb3JjZSwgYnV0IGJlY2F1c2Ugb2YgYSBzdXJwbHVzIG9mIGRhcmsgcHJvdG9ucyBvdmVyIGRhcmsgZWxlY3Ryb25zLCBvbmx5IGEgdGlueSBmcmFjdGlvbiBiZWNvbWUgYm91bmQgaW4gYXRvbXMgYW5kIHdpbmQgdXAgaW4gYSBkaXNrLiBJbiB0aGF0IGNhc2UsIHRoZSBkaXNrIGFuZCBoYWxvIHdvdWxkIGJlIG1hZGUgb2YgdGhlIHNhbWUgaW5ncmVkaWVudHMsICYjeDIwMUM7d2hpY2ggd291bGQgYmUgbW9yZSBlY29ub21pY2FsLCYjeDIwMUQ7IHNoZSBzYWlkLiAmI3gyMDFDO1dlIHRob3VnaHQgdGhhdCB3b3VsZCBiZSBydWxlZCBvdXQsIGJ1dCBpdCB3YXNuJiN4MjAxOTt0LiYjeDIwMUQ7PC9wPlxcbjxwPlRoZSBkYXJrIGRpc2sgc3Vydml2ZXMsIGZvciBub3cmI3gyMDE0O2Egc3ltYm9sIG9mIGFsbCB0aGF0IGlzbiYjeDIwMTk7dCBrbm93biBhYm91dCB0aGUgZGFyayBzaWRlIG9mIHRoZSB1bml2ZXJzZS4gJiN4MjAxQztJIHRoaW5rIGl0JiN4MjAxOTtzIHZlcnksIHZlcnkgaGVhbHRoeSBmb3IgdGhlIGZpZWxkIHRoYXQgeW91IGhhdmUgcGVvcGxlIHRoaW5raW5nIGFib3V0IGFsbCBraW5kcyBvZiBkaWZmZXJlbnQgaWRlYXMsJiN4MjAxRDsgc2FpZCBCdWxsb2NrLiAmI3gyMDFDO0JlY2F1c2UgaXQmI3gyMDE5O3MgcXVpdGUgdHJ1ZSB0aGF0IHdlIGRvbiYjeDIwMTk7dCBrbm93IHdoYXQgdGhlIGhlY2sgdGhhdCBkYXJrIG1hdHRlciBpcywgYW5kIHlvdSBuZWVkIHRvIGJlIG9wZW4tbWluZGVkIGFib3V0IGl0LiYjeDIwMUQ7PC9wPlxcbjxwPjxlbT48YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNjA0MTItZGViYXRlLWludGVuc2lmaWVzLW92ZXItZGFyay1kaXNrLXRoZW9yeS9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5PcmlnaW5hbCBzdG9yeTwvYT4gcmVwcmludGVkIHdpdGggcGVybWlzc2lvbiBmcm9tIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZ1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlF1YW50YSBNYWdhemluZTwvYT4sIGFuIGVkaXRvcmlhbGx5IGluZGVwZW5kZW50IHB1YmxpY2F0aW9uIG9mIHRoZSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5zaW1vbnNmb3VuZGF0aW9uLm9yZ1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlNpbW9ucyBGb3VuZGF0aW9uPC9hPiB3aG9zZSBtaXNzaW9uIGlzIHRvIGVuaGFuY2UgcHVibGljIHVuZGVyc3RhbmRpbmcgb2Ygc2NpZW5jZSBieSBjb3ZlcmluZyByZXNlYXJjaCBkZXZlbG9wbWVudHMgYW5kIHRyZW5kcyBpbiBtYXRoZW1hdGljcyBhbmQgdGhlIHBoeXNpY2FsIGFuZCBsaWZlIHNjaWVuY2VzLjwvZW0+PC9wPlxcblxcblxcdFxcdFxcdDxhIGNsYXNzPVxcXCJ2aXN1YWxseS1oaWRkZW4gc2tpcC10by10ZXh0LWxpbmsgZm9jdXNhYmxlIGJnLXdoaXRlXFxcIiBocmVmPVxcXCJodHRwOi8vd3d3LndpcmVkLmNvbS8yMDE2LzA2L2RlYmF0ZS1pbnRlbnNpZmllcy1kYXJrLWRpc2stdGhlb3J5LyNzdGFydC1vZi1jb250ZW50XFxcIj5HbyBCYWNrIHRvIFRvcC4gU2tpcCBUbzogU3RhcnQgb2YgQXJ0aWNsZS48L2E+XFxuXFxuXFx0XFx0XFx0XFxuXFx0XFx0PC9hcnRpY2xlPlxcblxcblxcdFxcdDwvZGl2PlwiLFxyXG5cdFx0XCJkYXRlUHVibGlzaGVkXCI6IFwiMjAxNi0wNi0wNCAwMDowMDowMFwiLFxyXG5cdFx0XCJkb21haW5cIjogXCJ3d3cud2lyZWQuY29tXCIsXHJcblx0XHRcImV4Y2VycHRcIjogXCJJbiAxOTMyLCB0aGUgRHV0Y2ggYXN0cm9ub21lciBKYW4gT29ydCB0YWxsaWVkIHRoZSBzdGFycyBpbiB0aGUgTWlsa3kgV2F5IGFuZCBmb3VuZCB0aGF0IHRoZXkgY2FtZSB1cCBzaG9ydC4gSnVkZ2luZyBieSB0aGUgd2F5IHRoZSBzdGFycyBib2IgdXAgYW5kIGRvd24gbGlrZSBob3JzZXMgb24gYSBjYXJvdXNlbCBhcyB0aGV5IGdvIGFyb3VuZCZoZWxsaXA7XCIsXHJcblx0XHRcImxlYWRJbWFnZVVybFwiOiBcImh0dHBzOi8vd3d3LndpcmVkLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxNi8wNS8wNjEwMTRfcmFuZGFsbF8xNjI3XzMxMDU3NV85MDQ1MTgtNjE1eDQxMC00ODJ4MzIxLmpwZ1wiLFxyXG5cdFx0XCJ0aXRsZVwiOiBcIkEgRGlzayBvZiBEYXJrIE1hdHRlciBNaWdodCBSdW4gVGhyb3VnaCBPdXIgR2FsYXh5XCIsXHJcblx0XHRcInVybFwiOiBcImh0dHA6Ly93d3cud2lyZWQuY29tLzIwMTYvMDYvZGViYXRlLWludGVuc2lmaWVzLWRhcmstZGlzay10aGVvcnkvXCIsXHJcblx0XHRcIl9pZFwiOiBcIjU3NTJlZTU1MjJhZmIyZDQwYjg1ZjI2N1wiXHJcblx0fTtcclxuIiwiYXBwLmZhY3RvcnkoJ1BhcnNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XHJcblxyXG5cdHZhciBQYXJzZXJGYWN0b3J5ID0ge307XHJcblxyXG5cdFBhcnNlckZhY3RvcnkucGFyc2VVcmwgPSBmdW5jdGlvbih1cmwpIHtcclxuXHJcblx0XHR2YXIgZW5jb2RlZCA9IGVuY29kZVVSSUNvbXBvbmVudCh1cmwpO1xyXG5cdFx0Ly9jb25zb2xlLmxvZyhcImVuY29kZWQ6IFwiLCBlbmNvZGVkKTtcclxuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhcnNlci9cIiArIGVuY29kZWQpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpe1xyXG5cdFx0XHQvL3JldHVybiByZXN1bHQuZGF0YTtcclxuXHRcdFx0Y29uc29sZS5sb2coXCJwYXJzZXIgcmVzdWx0OiBcIiwgcmVzdWx0LmRhdGEpO1xyXG5cdFx0XHRyZXR1cm4gJGh0dHAucG9zdChcIi9hcGkvcGFnZXNcIiwgcmVzdWx0LmRhdGEpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhcInBvc3QgcmVzcG9uc2U6IFwiLCByZXNwb25zZS5kYXRhKTtcclxuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHRcdFx0fSlcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHJldHVybiBQYXJzZXJGYWN0b3J5O1xyXG5cclxufSk7XHJcbiIsImFwcC5kaXJlY3RpdmUoJ2FydGljbGVEZXRhaWwnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgIHNjb3BlOiB7fSxcclxuICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9hcnRpY2xlLWRldGFpbC9kZXRhaWwuaHRtbCcsXHJcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgfVxyXG59KVxyXG4iLCJhcHAuZGlyZWN0aXZlKCdiaW5kQ29tcGlsZWRIdG1sJywgWyckY29tcGlsZScsIGZ1bmN0aW9uKCRjb21waWxlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHRlbXBsYXRlOiAnPGRpdj48L2Rpdj4nLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgcmF3SHRtbDogJz1iaW5kQ29tcGlsZWRIdG1sJ1xyXG4gICAgfSxcclxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtKSB7XHJcbiAgICAgIHZhciBpbWdzID0gW107XHJcbiAgICAgIHNjb3BlLiR3YXRjaCgncmF3SHRtbCcsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBuZXdFbGVtID0gJGNvbXBpbGUodmFsdWUpKHNjb3BlLiRwYXJlbnQpO1xyXG4gICAgICAgIGVsZW0uY29udGVudHMoKS5yZW1vdmUoKTtcclxuICAgICAgICBpbWdzID0gbmV3RWxlbS5maW5kKCdpbWcnKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICBpbWdzW2ldLmFkZENsYXNzID0gJ2Zsb2F0UmlnaHQnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZW0uYXBwZW5kKG5ld0VsZW0pO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59XSk7XHJcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXHJcbiAgICB9O1xyXG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUsICRtZFNpZGVuYXYpIHtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgc2NvcGU6IHt9LFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxyXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xyXG5cclxuICAgICAgICAgICAgc2NvcGUudG9nZ2xlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgJG1kU2lkZW5hdihcImxlZnRcIikudG9nZ2xlKClcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBidG4udG9nZ2xlQ2xhc3MoJ21kLWZvY3VzZWQnKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcclxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1BhcnNlcicsIHN0YXRlOiAncGFyc2VyJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1BhZ2VzJywgc3RhdGU6ICdwYWdlcycgfSxcclxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHNldFVzZXIoKTtcclxuXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxufSk7XHJcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2lkZWJhcicsIGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHNjb3BlOiB7fSxcclxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvc2lkZWJhci9zaWRlYmFyLmh0bWwnLFxyXG5cdH1cclxufSlcclxuIiwiYXBwLmRpcmVjdGl2ZSgnc3BlZWREaWFsJywgZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0c2NvcGU6IHt9LFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdodG1sL3NwZWVkLWRpYWwvc3BlZWQtZGlhbC5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlKSB7XHJcblx0XHRcdHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xyXG5cdFx0XHRzY29wZS5jb3VudCA9IDA7XHJcblx0XHRcdHNjb3BlLmhpZGRlbiA9IGZhbHNlO1xyXG5cdFx0XHRzY29wZS5ob3ZlciA9IGZhbHNlO1xyXG4gICAgICBzY29wZS5pdGVtcyA9IFt7XHJcblx0XHRcdFx0bmFtZTogXCJBZGQgVVJMXCIsXHJcblx0XHRcdFx0aWNvbjogXCIvaWNvbnMvaWNfYWRkX3doaXRlXzM2cHguc3ZnXCJcclxuXHRcdFx0fSwge1xyXG5cdFx0XHRcdG5hbWU6IFwiQWRkIENhdGVnb3J5XCIsXHJcblx0XHRcdFx0aWNvbjogXCIvaWNvbnMvaWNfcGxheWxpc3RfYWRkX3doaXRlXzM2cHguc3ZnXCJcclxuXHRcdFx0fV07XHJcblxyXG5cdFx0fVxyXG5cdH1cclxufSlcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
