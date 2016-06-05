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
    $stateProvider.state('mySubscriptions', {
        url: '/subscriptions',
        templateUrl: 'app/my-subscriptions/my-subscriptions.html',
        controller: 'mySubscriptionsCtrl'
    });
});

app.controller('mySubscriptionsCtrl', function ($scope) {

    $(".subscriptions-menu-up").click(function () {
        var id = '#' + $(this).attr('id').slice(0, -8);
        if ($(this).css('transform') !== 'none') {
            $(this).css("transform", "");
            $(id).show(400);
        } else {
            $(this).css("transform", "rotate(180deg)");
            $(id).hide(400);
        }
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJteS1zdWJzY3JpcHRpb25zL215LXN1YnNjcmlwdGlvbnMuanMiLCJwYWdlcy9wYWdlcy5qcyIsInBhcnNlci9wYXJzZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYXJ0aWNsZURldGFpbC5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYXJ0aWNsZVZpZXcuanMiLCJjb21tb24vZmFjdG9yaWVzL3BhZ2VzLmZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL3BhcnNlci5mYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYXJ0aWNsZURldGFpbENhcmQvZGV0YWlsLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYmluZENvbXBpbGVkSHRtbC9iaW5kQ29tcGlsZWRIdG1sLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zcGVlZC1kaWFsL3NwZWVkLWRpYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLENBQUEsQ0FB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QSxFQUFBLElBQUEsQ0FBQSxHQUFBO0FBQ0E7QUFDQSxhQWZBO0FBaUJBO0FBdEJBLEtBQUE7QUF3QkEsQ0F6QkE7O0FDQUEsSUFBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBLGtEQUhBO0FBSUEsY0FBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBO0FBQ0Esa0JBQUEsTUFBQSxHQUFBLEtBQUE7QUFDQSxrQkFBQSxLQUFBLEdBQUEsT0FBQTtBQUNBO0FBUEEsS0FBQTtBQVNBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICduZ01hdGVyaWFsJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkbWRUaGVtaW5nUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcblxuICAgICRtZFRoZW1pbmdQcm92aWRlci50aGVtZSgnZGVmYXVsdCcpXG4gICAgICAgIC5wcmltYXJ5UGFsZXR0ZSgnYmx1ZS1ncmV5JylcbiAgICAgICAgLmFjY2VudFBhbGV0dGUoJ2JsdWUtZ3JleScpO1xuXG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlcycsIHtcbiAgICAgICAgdXJsOiAnL2FydGljbGVzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJ0aWNsZXMvYXJ0aWNsZXMuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlJywge1xuICAgICAgICB1cmw6ICcvYXJ0aWNsZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FydGljbGUtdmlldy9hcnRpY2xlLXZpZXcuaHRtbCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICBjdXJyZW50OiBmdW5jdGlvbihBcnRpY2xlVmlld0ZhY3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnRpY2xlVmlld0ZhY3RvcnkuZ2V0QXJ0aWNsZUJ5SWQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBcnRpY2xlVmlld0N0cmwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0FydGljbGVWaWV3Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgY3VycmVudCwgJGNvbXBpbGUpIHtcbiAgICAkc2NvcGUuY3VycmVudCA9IGN1cnJlbnQ7XG4gICAgJHNjb3BlLnRpdGxlID0gY3VycmVudC50aXRsZTtcbiAgICAkc2NvcGUuY29udGVudCA9IGN1cnJlbnQuY29udGVudDtcbn0pO1xuIiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvaG9tZS9ob21lLmh0bWwnXG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ215U3Vic2NyaXB0aW9ucycsIHtcblx0XHR1cmw6ICcvc3Vic2NyaXB0aW9ucycsXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvbXktc3Vic2NyaXB0aW9ucy9teS1zdWJzY3JpcHRpb25zLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdteVN1YnNjcmlwdGlvbnNDdHJsJ1xuXHR9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignbXlTdWJzY3JpcHRpb25zQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSkge1xuXG5cdCQoXCIuc3Vic2NyaXB0aW9ucy1tZW51LXVwXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGlkID0gJyMnICsgJCh0aGlzKS5hdHRyKCdpZCcpLnNsaWNlKDAsLTgpO1xuXHRcdGlmKCQodGhpcykuY3NzKCd0cmFuc2Zvcm0nKVx0IT09ICdub25lJyl7XG5cdFx0XHQkKHRoaXMpLmNzcyhcInRyYW5zZm9ybVwiLCBcIlwiKTtcblx0XHRcdCQoaWQpLnNob3coNDAwKTtcblx0XHR9XG5cdFx0ZWxzZXtcblx0XHRcdCQodGhpcykuY3NzKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDE4MGRlZylcIik7XG5cdFx0XHQkKGlkKS5oaWRlKDQwMCk7XHRcdFx0XHRcblx0XHR9XG5cdH0pO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKXtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncGFnZXMnLCB7XG5cdCAgICB1cmw6ICcvcGFnZXMnLFxuXHQgICAgdGVtcGxhdGVVcmw6ICdhcHAvcGFnZXMvcGFnZXMuaHRtbCcsIC8vU3RpbGwgbmVlZCB0byBtYWtlXG5cdCAgICBjb250cm9sbGVyOiAnUGFnZXNDdHJsJ1xuXHR9KTtcblxufSlcblxuYXBwLmNvbnRyb2xsZXIoJ1BhZ2VzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgUGFnZXNGYWN0b3J5KXtcblxuXHRQYWdlc0ZhY3RvcnkuZ2V0U2F2ZWQoKVxuXHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0JHNjb3BlLnBhZ2VzID0gcmVzcG9uc2U7XG5cdH0pXG5cbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwYXJzZXInLCB7XG4gICAgICAgIHVybDogJy9wYXJzZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9wYXJzZXIvcGFyc2VyLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnUGFyc2VyQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdQYXJzZXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBQYXJzZXJGYWN0b3J5LCBTZXNzaW9uKSB7XG5cbiAgICAkc2NvcGUucGFyc2VVcmwgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgLy9jb25zb2xlLmxvZyhcImluc2lkZSBwYXJzZXJDdHJsIHBhcnNlVXJsOiBzZXNzaW9uIHVzZXI6IFwiLCBTZXNzaW9uLnVzZXIuX2lkKTtcbiAgICAgICAgUGFyc2VyRmFjdG9yeS5wYXJzZVVybCgkc2NvcGUudXJsLCBTZXNzaW9uLnVzZXIuX2lkKVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAkc2NvcGUucGFyc2VkID0gcmVzcG9uc2U7XG4gICAgICAgIH0pXG5cbiAgICB9O1xuXG59KTtcblxuXG4iLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4gIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ2FydGljbGVEZXRhaWxGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcbiAgdmFyIGRldGFpbE9iaiA9IHt9O1xuXG4gIGRldGFpbE9iai5mZXRjaEFsbEJ5Q2F0ZWdvcnkgPSBmdW5jdGlvbihjYXRlZ29yeSkge1xuICAgIC8vIHJldHVybiBhbGwgdGl0bGVzIGFuZCBzdW1tYXJpZXMgYXNzb2NpYXRlZCB3aXRoIGN1cnJlbnQgY2F0ZWdvcnlcbiAgfTtcblxuICBkZXRhaWxPYmouZmV0Y2hPbmVCeUlkID0gZnVuY3Rpb24oaWQpIHtcblxuICB9O1xuXG4gIGRldGFpbE9iai5hZGRBcnRpY2xlID0gZnVuY3Rpb24oY2F0ZWdvcnkpIHtcbiAgICAvLyBhZGQgb25lIGFydGljbGUgdG8gY2F0ZWdvcnlcbiAgfTtcblxuICBkZXRhaWxPYmoucmVtb3ZlQXJ0aWNsZUJ5SUQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyByZW1vdmUgb24gYXJ0aWNsZSBieSBJRFxuICB9O1xuXG4gIGRldGFpbE9iai5zYXZlQXJ0aWNsZUJ5VXJsID0gZnVuY3Rpb24odXJsLCBjYXRlZ29yeSkge1xuICAgIC8vIGRlZmF1bHQgdG8gYWxsLCBvciBvcHRpb25hbCBjYXRlZ29yeVxuICB9XG5cbiAgcmV0dXJuIGRldGFpbE9iajtcbn0pXG4iLCJhcHAuZmFjdG9yeSgnQXJ0aWNsZVZpZXdGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBhcnRpY2xlVmlld09iaiA9IHt9O1xuXG5cdGFydGljbGVWaWV3T2JqLmdldEFydGljbGVCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgcmV0dXJuIHRlbXBBcnRpY2xlT2JqO1xuXHR9O1xuXG5cdGFydGljbGVWaWV3T2JqLnJlbW92ZUFydGljbGVCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG5cblx0fTtcblxuICBhcnRpY2xlVmlld09iai5hZGRBcnRpY2xlQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoaWQsIGNhdCkge1xuXG4gIH07XG5cblx0cmV0dXJuIGFydGljbGVWaWV3T2JqO1xufSlcblxuXG52YXIgdGVtcEFydGljbGVPYmogPVxuICB7XG5cdFx0XCJfX3ZcIjogMCxcblx0XHRcImNvbnRlbnRcIjogXCI8ZGl2PjxhcnRpY2xlIGNsYXNzPVxcXCJjb250ZW50IGxpbmstdW5kZXJsaW5lIHJlbGF0aXZlIGJvZHktY29weVxcXCI+XFxuXFxuXFx0XFx0XFx0PHA+SW4gMTkzMiwgdGhlIER1dGNoIGFzdHJvbm9tZXIgSmFuIE9vcnQgdGFsbGllZCB0aGUgc3RhcnMgaW4gdGhlIE1pbGt5IFdheSBhbmQgZm91bmQgdGhhdCB0aGV5IGNhbWUgdXAgc2hvcnQuIEp1ZGdpbmcgYnkgdGhlIHdheSB0aGUgc3RhcnMgYm9iIHVwIGFuZCBkb3duIGxpa2UgaG9yc2VzIG9uIGEgY2Fyb3VzZWwgYXMgdGhleSBnbyBhcm91bmQgdGhlIHBsYW5lIG9mIHRoZSBnYWxheHksIE9vcnQgY2FsY3VsYXRlZCB0aGF0IHRoZXJlIG91Z2h0IHRvIGJlIHR3aWNlIGFzIG11Y2ggbWF0dGVyIGdyYXZpdGF0aW9uYWxseSBwcm9wZWxsaW5nIHRoZW0gYXMgaGUgY291bGQgc2VlLiBIZSBwb3N0dWxhdGVkIHRoZSBwcmVzZW5jZSBvZiBoaWRkZW4gJiN4MjAxQztkYXJrIG1hdHRlciYjeDIwMUQ7IHRvIG1ha2UgdXAgdGhlIGRpZmZlcmVuY2UgYW5kIHN1cm1pc2VkIHRoYXQgaXQgbXVzdCBiZSBjb25jZW50cmF0ZWQgaW4gYSBkaXNrIHRvIGV4cGxhaW4gdGhlIHN0YXJzJiN4MjAxOTsgbW90aW9ucy48L3A+XFxuXFxuXFxuPHA+QnV0IGNyZWRpdCBmb3IgdGhlIGRpc2NvdmVyeSBvZiBkYXJrIG1hdHRlciYjeDIwMTQ7dGhlIGludmlzaWJsZSwgdW5pZGVudGlmaWVkIHN0dWZmIHRoYXQgY29tcHJpc2VzIGZpdmUtc2l4dGhzIG9mIHRoZSB1bml2ZXJzZSYjeDIwMTk7cyBtYXNzJiN4MjAxNDt1c3VhbGx5IGdvZXMgdG8gdGhlIFN3aXNzLUFtZXJpY2FuIGFzdHJvbm9tZXIgRnJpdHogWndpY2t5LCB3aG8gaW5mZXJyZWQgaXRzIGV4aXN0ZW5jZSBmcm9tIHRoZSByZWxhdGl2ZSBtb3Rpb25zIG9mIGdhbGF4aWVzIGluIDE5MzMuIE9vcnQgaXMgcGFzc2VkIG92ZXIgb24gdGhlIGdyb3VuZHMgdGhhdCBoZSB3YXMgdHJhaWxpbmcgYSBmYWxzZSBjbHVlLiBCeSAyMDAwLCB1cGRhdGVkLCBPb3J0LXN0eWxlIGludmVudG9yaWVzIG9mIHRoZSBNaWxreSBXYXkgZGV0ZXJtaW5lZCB0aGF0IGl0cyAmI3gyMDFDO21pc3NpbmcmI3gyMDFEOyBtYXNzIGNvbnNpc3RzIG9mIGZhaW50IHN0YXJzLCBnYXMgYW5kIGR1c3QsIHdpdGggbm8gbmVlZCBmb3IgYSBkYXJrIGRpc2suIEVpZ2h0eSB5ZWFycyBvZiBoaW50cyBzdWdnZXN0IHRoYXQgZGFyayBtYXR0ZXIsIHdoYXRldmVyIGl0IGlzLCBmb3JtcyBzcGhlcmljYWwgY2xvdWRzIGNhbGxlZCAmI3gyMDFDO2hhbG9zJiN4MjAxRDsgYXJvdW5kIGdhbGF4aWVzLjwvcD5cXG48cD5PciBzbyBtb3N0IGRhcmsgbWF0dGVyIGh1bnRlcnMgaGF2ZSBpdC4gVGhvdWdoIGl0IGZlbGwgb3V0IG9mIGZhdm9yLCB0aGUgZGFyayBkaXNrIGlkZWEgbmV2ZXIgY29tcGxldGVseSB3ZW50IGF3YXkuIEFuZCByZWNlbnRseSwgaXQgaGFzIGZvdW5kIGEgaGlnaC1wcm9maWxlIGNoYW1waW9uIGluIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnBoeXNpY3MuaGFydmFyZC5lZHUvcGVvcGxlL2ZhY3BhZ2VzL3JhbmRhbGxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5MaXNhIFJhbmRhbGw8L2E+LCBhIHByb2Zlc3NvciBvZiBwaHlzaWNzIGF0IEhhcnZhcmQgVW5pdmVyc2l0eSwgd2hvIGhhcyByZXNjdWVkIHRoZSBkaXNrIGZyb20gc2NpZW50aWZpYyBvYmxpdmlvbiBhbmQgZ2l2ZW4gaXQgYW4gYWN0aXZlIHJvbGUgb24gdGhlIGdhbGFjdGljIHN0YWdlLjwvcD5cXG48cD5TaW5jZSA8YSBocmVmPVxcXCJodHRwOi8vYXJ4aXYub3JnL3BkZi8xMzAzLjE1MjF2Mi5wZGZcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5wcm9wb3NpbmcgdGhlIG1vZGVsPC9hPiBpbiAyMDEzLCBSYW5kYWxsIGFuZCBoZXIgY29sbGFib3JhdG9ycyBoYXZlIGFyZ3VlZCB0aGF0IGEgZGFyayBkaXNrIG1pZ2h0IGV4cGxhaW4gZ2FtbWEgcmF5cyBjb21pbmcgZnJvbSB0aGUgZ2FsYWN0aWMgY2VudGVyLCB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL3d3dy5uYXR1cmUuY29tL25hdHVyZS9qb3VybmFsL3Y1MTEvbjc1MTEvZnVsbC9uYXR1cmUxMzQ4MS5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cGxhbmFyIGRpc3RyaWJ1dGlvbiBvZiBkd2FyZiBnYWxheGllczwvYT4gb3JiaXRpbmcgdGhlIEFuZHJvbWVkYSBnYWxheHkgYW5kIHRoZSBNaWxreSBXYXksIGFuZCBldmVuIDxhIGhyZWY9XFxcImh0dHBzOi8vcGh5c2ljcy5hcHMub3JnL2ZlYXR1cmVkLWFydGljbGUtcGRmLzEwLjExMDMvUGh5c1JldkxldHQuMTEyLjE2MTMwMVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnBlcmlvZGljIHVwdGlja3Mgb2YgY29tZXQgaW1wYWN0czwvYT4gYW5kIG1hc3MgZXh0aW5jdGlvbnMgb24gRWFydGgsIGRpc2N1c3NlZCBpbiBSYW5kYWxsJiN4MjAxOTtzIDIwMTUgcG9wdWxhci1zY2llbmNlIGJvb2ssIDxlbT5EYXJrIE1hdHRlciBhbmQgdGhlIERpbm9zYXVyczwvZW0+LjwvcD5cXG48cD5CdXQgYXN0cm9waHlzaWNpc3RzIHdobyBkbyBpbnZlbnRvcmllcyBvZiB0aGUgTWlsa3kgV2F5IGhhdmUgcHJvdGVzdGVkLCBhcmd1aW5nIHRoYXQgdGhlIGdhbGF4eSYjeDIwMTk7cyB0b3RhbCBtYXNzIGFuZCB0aGUgYm9iYmluZyBtb3Rpb25zIG9mIGl0cyBzdGFycyBtYXRjaCB1cCB0b28gd2VsbCB0byBsZWF2ZSByb29tIGZvciBhIGRhcmsgZGlzay4gJiN4MjAxQztJdCYjeDIwMTk7cyBtb3JlIHN0cm9uZ2x5IGNvbnN0cmFpbmVkIHRoYW4gTGlzYSBSYW5kYWxsIHByZXRlbmRzLCYjeDIwMUQ7IHNhaWQgPGEgaHJlZj1cXFwiaHR0cDovL2FzdHJvLnV0b3JvbnRvLmNhL35ib3Z5L1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkpvIEJvdnk8L2E+LCBhbiBhc3Ryb3BoeXNpY2lzdCBhdCB0aGUgVW5pdmVyc2l0eSBvZiBUb3JvbnRvLjwvcD5cXG48cD5Ob3csIFJhbmRhbGwsIHdobyBoYXMgZGV2aXNlZCBpbmZsdWVudGlhbCBpZGVhcyBhYm91dCBzZXZlcmFsIG9mIHRoZSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNTA4MDMtcGh5c2ljcy10aGVvcmllcy1tYXAvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+YmlnZ2VzdCBxdWVzdGlvbnMgaW4gZnVuZGFtZW50YWwgcGh5c2ljczwvYT4sIGlzIGZpZ2h0aW5nIGJhY2suIEluIDxhIGhyZWY9XFxcImh0dHA6Ly9hcnhpdi5vcmcvYWJzLzE2MDQuMDE0MDdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5hIHBhcGVyPC9hPiBwb3N0ZWQgb25saW5lIGxhc3Qgd2VlayB0aGF0IGhhcyBiZWVuIGFjY2VwdGVkIGZvciBwdWJsaWNhdGlvbiBpbiA8ZW0+VGhlIEFzdHJvcGh5c2ljYWwgSm91cm5hbDwvZW0+LCBSYW5kYWxsIGFuZCBoZXIgc3R1ZGVudCwgRXJpYyBLcmFtZXIsIHJlcG9ydCBhIGRpc2stc2hhcGVkIGxvb3Bob2xlIGluIHRoZSBNaWxreSBXYXkgYW5hbHlzaXM6ICYjeDIwMUM7VGhlcmUgaXMgYW4gaW1wb3J0YW50IGRldGFpbCB0aGF0IGhhcyBzbyBmYXIgYmVlbiBvdmVybG9va2VkLCYjeDIwMUQ7IHRoZXkgd3JpdGUuICYjeDIwMUM7VGhlIGRpc2sgY2FuIGFjdHVhbGx5IG1ha2Ugcm9vbSBmb3IgaXRzZWxmLiYjeDIwMUQ7PC9wPlxcbjxmaWd1cmUgY2xhc3M9XFxcIndwLWNhcHRpb24gbGFuZHNjYXBlIGFsaWdubm9uZSBmYWRlciByZWxhdGl2ZVxcXCI+PGltZyBjbGFzcz1cXFwic2l6ZS10ZXh0LWNvbHVtbi13aWR0aCB3cC1pbWFnZS0yMDIyMjU1XFxcIiBzcmM9XFxcImh0dHBzOi8vd3d3LndpcmVkLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxNi8wNS8wNjEwMTRfcmFuZGFsbF8xNjI3XzMxMDU3NV85MDQ1MTgtNjE1eDQxMC00ODJ4MzIxLmpwZ1xcXCIgYWx0PVxcXCIwNjEwMTRfUmFuZGFsbF8xNjI3LmpwZ1xcXCIgd2lkdGg9XFxcIjQ4MlxcXCI+PGZpZ2NhcHRpb24gY2xhc3M9XFxcIndwLWNhcHRpb24tdGV4dCBsaW5rLXVuZGVybGluZVxcXCI+TGlzYSBSYW5kYWxsIG9mIEhhcnZhcmQgVW5pdmVyc2l0eSBpcyBhIGhpZ2gtcHJvZmlsZSBzdXBwb3J0ZXIgb2YgdGhlIGNvbnRyb3ZlcnNpYWwgZGFyayBkaXNrIGlkZWEuPHNwYW4gY2xhc3M9XFxcImNyZWRpdCBsaW5rLXVuZGVybGluZS1zbVxcXCI+Um9zZSBMaW5jb2xuL0hhcnZhcmQgVW5pdmVyc2l0eTwvc3Bhbj48L2ZpZ2NhcHRpb24+PC9maWd1cmU+XFxuPHA+SWYgdGhlcmUgaXMgYSB0aGluIGRhcmsgZGlzayBjb3Vyc2luZyB0aHJvdWdoIHRoZSAmI3gyMDFDO21pZHBsYW5lJiN4MjAxRDsgb2YgdGhlIGdhbGF4eSwgUmFuZGFsbCBhbmQgS3JhbWVyIGFyZ3VlLCB0aGVuIGl0IHdpbGwgZ3Jhdml0YXRpb25hbGx5IHBpbmNoIG90aGVyIG1hdHRlciBpbndhcmQsIHJlc3VsdGluZyBpbiBhIGhpZ2hlciBkZW5zaXR5IG9mIHN0YXJzLCBnYXMgYW5kIGR1c3QgYXQgdGhlIG1pZHBsYW5lIHRoYW4gYWJvdmUgYW5kIGJlbG93LiBSZXNlYXJjaGVycyB0eXBpY2FsbHkgZXN0aW1hdGUgdGhlIHRvdGFsIHZpc2libGUgbWFzcyBvZiB0aGUgTWlsa3kgV2F5IGJ5IGV4dHJhcG9sYXRpbmcgb3V0d2FyZCBmcm9tIHRoZSBtaWRwbGFuZSBkZW5zaXR5OyBpZiB0aGVyZSYjeDIwMTk7cyBhIHBpbmNoaW5nIGVmZmVjdCwgdGhlbiB0aGlzIGV4dHJhcG9sYXRpb24gbGVhZHMgdG8gYW4gb3ZlcmVzdGltYXRpb24gb2YgdGhlIHZpc2libGUgbWFzcywgbWFraW5nIGl0IHNlZW0gYXMgaWYgdGhlIG1hc3MgbWF0Y2hlcyB1cCB0byB0aGUgc3RhcnMmI3gyMDE5OyBtb3Rpb25zLiAmI3gyMDFDO1RoYXQmI3gyMDE5O3MgdGhlIHJlYXNvbiB3aHkgYSBsb3Qgb2YgdGhlc2UgcHJldmlvdXMgc3R1ZGllcyBkaWQgbm90IHNlZSBldmlkZW5jZSBmb3IgYSBkYXJrIGRpc2ssJiN4MjAxRDsgS3JhbWVyIHNhaWQuIEhlIGFuZCBSYW5kYWxsIGZpbmQgdGhhdCBhIHRoaW4gZGFyayBkaXNrIGlzIHBvc3NpYmxlJiN4MjAxNDthbmQgaW4gb25lIHdheSBvZiByZWRvaW5nIHRoZSBhbmFseXNpcywgc2xpZ2h0bHkgZmF2b3JlZCBvdmVyIG5vIGRhcmsgZGlzay48L3A+XFxuPHA+JiN4MjAxQztMaXNhJiN4MjAxOTtzIHdvcmsgaGFzIHJlb3BlbmVkIHRoZSBjYXNlLCYjeDIwMUQ7IHNhaWQgPGEgaHJlZj1cXFwiaHR0cDovL2FzdHJvbm9teS5zd2luLmVkdS5hdS9zdGFmZi9jZmx5bm4uaHRtbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkNocmlzIEZseW5uPC9hPiBvZiBTd2luYnVybmUgVW5pdmVyc2l0eSBvZiBUZWNobm9sb2d5IGluIE1lbGJvdXJuZSwgQXVzdHJhbGlhLCB3aG8sIHdpdGggSm9oYW4gSG9sbWJlcmcsIGNvbmR1Y3RlZCBhIHNlcmllcyBvZiBNaWxreSBXYXkgaW52ZW50b3JpZXMgaW4gdGhlIGVhcmx5IGF1Z2h0cyB0aGF0IHNlZW1lZCB0byA8YSBocmVmPVxcXCJodHRwOi8vb25saW5lbGlicmFyeS53aWxleS5jb20vZG9pLzEwLjEwNDYvai4xMzY1LTg3MTEuMjAwMC4wMjkwNS54L2Fic3RyYWN0XFxcIj5yb2J1c3RseSBzd2VlcCBpdCBjbGVhbjwvYT4gb2YgYSBkYXJrIGRpc2suPC9wPlxcbjxwPkJvdnkgZGlzYWdyZWVzLiBFdmVuIHRha2luZyB0aGUgcGluY2hpbmcgZWZmZWN0IGludG8gYWNjb3VudCwgaGUgZXN0aW1hdGVzIHRoYXQgYXQgbW9zdCAyIHBlcmNlbnQgb2YgdGhlIHRvdGFsIGFtb3VudCBvZiBkYXJrIG1hdHRlciBjYW4gbGllIGluIGEgZGFyayBkaXNrLCB3aGlsZSB0aGUgcmVzdCBtdXN0IGZvcm0gYSBoYWxvLiAmI3gyMDFDO0kgdGhpbmsgbW9zdCBwZW9wbGUgd2FudCB0byBmaWd1cmUgb3V0IHdoYXQgOTggcGVyY2VudCBvZiB0aGUgZGFyayBtYXR0ZXIgaXMgYWJvdXQsIG5vdCB3aGF0IDIgcGVyY2VudCBvZiBpdCBpcyBhYm91dCwmI3gyMDFEOyBoZSBzYWlkLjwvcD5cXG48cD5UaGUgZGViYXRlJiN4MjAxNDthbmQgdGhlIGZhdGUgb2YgdGhlIGRhcmsgZGlzayYjeDIwMTQ7d2lsbCBwcm9iYWJseSBiZSBkZWNpZGVkIHNvb24uIFRoZSBFdXJvcGVhbiBTcGFjZSBBZ2VuY3kmI3gyMDE5O3MgR2FpYSBzYXRlbGxpdGUgaXMgY3VycmVudGx5IHN1cnZleWluZyB0aGUgcG9zaXRpb25zIGFuZCB2ZWxvY2l0aWVzIG9mIG9uZSBiaWxsaW9uIHN0YXJzLCBhbmQgYSBkZWZpbml0aXZlIGludmVudG9yeSBvZiB0aGUgTWlsa3kgV2F5IGNvdWxkIGJlIGNvbXBsZXRlZCBhcyBzb29uIGFzIG5leHQgc3VtbWVyLjwvcD5cXG48cD5UaGUgZGlzY292ZXJ5IG9mIGEgZGFyayBkaXNrLCBvZiBhbnkgc2l6ZSwgd291bGQgYmUgZW5vcm1vdXNseSByZXZlYWxpbmcuIElmIG9uZSBleGlzdHMsIGRhcmsgbWF0dGVyIGlzIGZhciBtb3JlIGNvbXBsZXggdGhhbiByZXNlYXJjaGVycyBoYXZlIGxvbmcgdGhvdWdodC4gTWF0dGVyIHNldHRsZXMgaW50byBhIGRpc2sgc2hhcGUgb25seSBpZiBpdCBpcyBhYmxlIHRvIHNoZWQgZW5lcmd5LCBhbmQgdGhlIGVhc2llc3Qgd2F5IGZvciBpdCB0byBzaGVkIHN1ZmZpY2llbnQgZW5lcmd5IGlzIGlmIGl0IGZvcm1zIGF0b21zLiBUaGUgZXhpc3RlbmNlIG9mIGRhcmsgYXRvbXMgd291bGQgbWVhbiBkYXJrIHByb3RvbnMgYW5kIGRhcmsgZWxlY3Ryb25zIHRoYXQgYXJlIGNoYXJnZWQgaW4gYSBzaW1pbGFyIHN0eWxlIGFzIHZpc2libGUgcHJvdG9ucyBhbmQgZWxlY3Ryb25zLCBpbnRlcmFjdGluZyB3aXRoIGVhY2ggb3RoZXIgdmlhIGEgZGFyayBmb3JjZSB0aGF0IGlzIGNvbnZleWVkIGJ5IGRhcmsgcGhvdG9ucy4gRXZlbiBpZiA5OCBwZXJjZW50IG9mIGRhcmsgbWF0dGVyIGlzIGluZXJ0LCBhbmQgZm9ybXMgaGFsb3MsIHRoZSBleGlzdGVuY2Ugb2YgZXZlbiBhIHRoaW4gZGFyayBkaXNrIHdvdWxkIGltcGx5IGEgcmljaCAmI3gyMDFDO2Rhcmsgc2VjdG9yJiN4MjAxRDsgb2YgdW5rbm93biBwYXJ0aWNsZXMgYXMgZGl2ZXJzZSwgcGVyaGFwcywgYXMgdGhlIHZpc2libGUgdW5pdmVyc2UuICYjeDIwMUM7Tm9ybWFsIG1hdHRlciBpcyBwcmV0dHkgY29tcGxleDsgdGhlcmUmI3gyMDE5O3Mgc3R1ZmYgdGhhdCBwbGF5cyBhIHJvbGUgaW4gYXRvbXMgYW5kIHRoZXJlJiN4MjAxOTtzIHN0dWZmIHRoYXQgZG9lc24mI3gyMDE5O3QsJiN4MjAxRDsgc2FpZCA8YSBocmVmPVxcXCJodHRwOi8vd3d3LnBoeXNpY3MudWNpLmVkdS9+YnVsbG9jay9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5KYW1lcyBCdWxsb2NrPC9hPiwgYW4gYXN0cm9waHlzaWNpc3QgYXQgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLiAmI3gyMDFDO1NvIGl0JiN4MjAxOTtzIG5vdCBjcmF6eSB0byBpbWFnaW5lIHRoYXQgdGhlIG90aGVyIGZpdmUtc2l4dGhzIFtvZiB0aGUgbWF0dGVyIGluIHRoZSB1bml2ZXJzZV0gaXMgcHJldHR5IGNvbXBsZXgsIGFuZCB0aGF0IHRoZXJlJiN4MjAxOTtzIHNvbWUgcGllY2Ugb2YgdGhhdCBkYXJrIHNlY3RvciB0aGF0IHdpbmRzIHVwIGluIGJvdW5kIGF0b21zLiYjeDIwMUQ7PC9wPlxcbjxwPlRoZSBub3Rpb24gdGhhdCA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmcvMjAxNTA4MjAtdGhlLWNhc2UtZm9yLWNvbXBsZXgtZGFyay1tYXR0ZXIvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+ZGFyayBtYXR0ZXIgbWlnaHQgYmUgY29tcGxleDwvYT4gaGFzIGdhaW5lZCB0cmFjdGlvbiBpbiByZWNlbnQgeWVhcnMsIGFpZGVkIGJ5IGFzdHJvcGh5c2ljYWwgYW5vbWFsaWVzIHRoYXQgZG8gbm90IGdlbCB3aXRoIHRoZSBsb25nLXJlaWduaW5nIHByb2ZpbGUgb2YgZGFyayBtYXR0ZXIgYXMgcGFzc2l2ZSwgc2x1Z2dpc2ggJiN4MjAxQzt3ZWFrbHkgaW50ZXJhY3RpbmcgbWFzc2l2ZSBwYXJ0aWNsZXMuJiN4MjAxRDsgVGhlc2UgYW5vbWFsaWVzLCBwbHVzIHRoZSBmYWlsdXJlIG9mICYjeDIwMUM7V0lNUHMmI3gyMDFEOyB0byBzaG93IHVwIGluIGV4aGF1c3RpdmUgZXhwZXJpbWVudGFsIHNlYXJjaGVzIGFsbCBvdmVyIHRoZSB3b3JsZCwgaGF2ZSB3ZWFrZW5lZCB0aGUgV0lNUCBwYXJhZGlnbSwgYW5kIHVzaGVyZWQgaW4gYSBuZXcsIGZyZWUtZm9yLWFsbCBlcmEsIGluIHdoaWNoIHRoZSBuYXR1cmUgb2YgdGhlIGRhcmsgYmVhc3QgaXMgYW55Ym9keSYjeDIwMTk7cyBndWVzcy48L3A+XFxuPHA+VGhlIGZpZWxkIHN0YXJ0ZWQgb3BlbmluZyB1cCBhcm91bmQgMjAwOCwgd2hlbiBhbiBleHBlcmltZW50IGNhbGxlZCBQQU1FTEEgZGV0ZWN0ZWQgYW4gZXhjZXNzIG9mIHBvc2l0cm9ucyBvdmVyIGVsZWN0cm9ucyBjb21pbmcgZnJvbSBzcGFjZSYjeDIwMTQ7YW4gYXN5bW1ldHJ5IHRoYXQgZnVlbGVkIGludGVyZXN0IGluICYjeDIwMUM7PGEgaHJlZj1cXFwiaHR0cDovL2FyeGl2Lm9yZy9hYnMvMDkwMS40MTE3XFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+YXN5bW1ldHJpYyBkYXJrIG1hdHRlcjwvYT4sJiN4MjAxRDsgYSBub3ctcG9wdWxhciBtb2RlbCBwcm9wb3NlZCBieSA8YSBocmVmPVxcXCJodHRwOi8vd3d3LXRoZW9yeS5sYmwuZ292L3dvcmRwcmVzcy8/cGFnZV9pZD02ODUxXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+S2F0aHJ5biBadXJlazwvYT4gYW5kIGNvbGxhYm9yYXRvcnMuIEF0IHRoZSB0aW1lLCB0aGVyZSB3ZXJlIGZldyBpZGVhcyBvdGhlciB0aGFuIFdJTVBzIGluIHBsYXkuICYjeDIwMUM7VGhlcmUgd2VyZSBtb2RlbC1idWlsZGVycyBsaWtlIG1lIHdobyByZWFsaXplZCB0aGF0IGRhcmsgbWF0dGVyIHdhcyBqdXN0IGV4dHJhb3JkaW5hcmlseSB1bmRlcmRldmVsb3BlZCBpbiB0aGlzIGRpcmVjdGlvbiwmI3gyMDFEOyBzYWlkIFp1cmVrLCBub3cgb2YgTGF3cmVuY2UgQmVya2VsZXkgTmF0aW9uYWwgTGFib3JhdG9yeSBpbiBDYWxpZm9ybmlhLiAmI3gyMDFDO1NvIHdlIGRvdmUgaW4uJiN4MjAxRDs8L3A+XFxuPGZpZ3VyZSBjbGFzcz1cXFwid3AtY2FwdGlvbiBsYW5kc2NhcGUgYWxpZ25ub25lIGZhZGVyIHJlbGF0aXZlXFxcIj48aW1nIGNsYXNzPVxcXCJzaXplLXRleHQtY29sdW1uLXdpZHRoIHdwLWltYWdlLTIwMjIyNTlcXFwiIHNyYz1cXFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzAyNF9Qcm9mQnVsbG9jay02MTV4NTAwLTQ4MngzOTIuanBnXFxcIiBhbHQ9XFxcIkphbWVzIEJ1bGxvY2sgb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgSXJ2aW5lLCBzZWVzIGRhcmsgbWF0dGVyIGFzIHBvdGVudGlhbGx5IGNvbXBsZXggYW5kIHNlbGYtaW50ZXJhY3RpbmcsIGJ1dCBub3QgbmVjZXNzYXJpbHkgY29uY2VudHJhdGVkIGluIHRoaW4gZGlza3MuXFxcIiB3aWR0aD1cXFwiNDgyXFxcIj48ZmlnY2FwdGlvbiBjbGFzcz1cXFwid3AtY2FwdGlvbi10ZXh0IGxpbmstdW5kZXJsaW5lXFxcIj5KYW1lcyBCdWxsb2NrIG9mIHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIElydmluZSwgc2VlcyBkYXJrIG1hdHRlciBhcyBwb3RlbnRpYWxseSBjb21wbGV4IGFuZCBzZWxmLWludGVyYWN0aW5nLCBidXQgbm90IG5lY2Vzc2FyaWx5IGNvbmNlbnRyYXRlZCBpbiB0aGluIGRpc2tzLjxzcGFuIGNsYXNzPVxcXCJjcmVkaXQgbGluay11bmRlcmxpbmUtc21cXFwiPkpvbmF0aGFuIEFsY29ybiBmb3IgUXVhbnRhIE1hZ2F6aW5lPC9zcGFuPjwvZmlnY2FwdGlvbj48L2ZpZ3VyZT5cXG48cD5Bbm90aGVyIHRyaWdnZXIgaGFzIGJlZW4gdGhlIGRlbnNpdHkgb2YgZHdhcmYgZ2FsYXhpZXMuIFdoZW4gcmVzZWFyY2hlcnMgdHJ5IHRvIHNpbXVsYXRlIHRoZWlyIGZvcm1hdGlvbiwgZHdhcmYgZ2FsYXhpZXMgdHlwaWNhbGx5IHR1cm4gb3V0IHRvbyBkZW5zZSBpbiB0aGVpciBjZW50ZXJzLCB1bmxlc3MgcmVzZWFyY2hlcnMgYXNzdW1lIHRoYXQgZGFyayBtYXR0ZXIgcGFydGljbGVzIGludGVyYWN0IHdpdGggb25lIGFub3RoZXIgdmlhIGRhcmsgZm9yY2VzLiBBZGQgdG9vIG11Y2ggaW50ZXJhY3Rpdml0eSwgaG93ZXZlciwgYW5kIHlvdSBtdWNrIHVwIHNpbXVsYXRpb25zIG9mIHN0cnVjdHVyZSBmb3JtYXRpb24gaW4gdGhlIGVhcmx5IHVuaXZlcnNlLiAmI3gyMDFDO1doYXQgd2UmI3gyMDE5O3JlIHRyeWluZyB0byBkbyBpcyBmaWd1cmUgb3V0IHdoYXQgaXMgYWxsb3dlZCwmI3gyMDFEOyBzYWlkIEJ1bGxvY2ssIHdobyBidWlsZHMgc3VjaCBzaW11bGF0aW9ucy4gTW9zdCBtb2RlbGVycyBhZGQgd2VhayBpbnRlcmFjdGlvbnMgdGhhdCBkb24mI3gyMDE5O3QgYWZmZWN0IHRoZSBoYWxvIHNoYXBlIG9mIGRhcmsgbWF0dGVyLiBCdXQgJiN4MjAxQztyZW1hcmthYmx5LCYjeDIwMUQ7IEJ1bGxvY2sgc2FpZCwgJiN4MjAxQzt0aGVyZSBpcyBhIGNsYXNzIG9mIGRhcmsgbWF0dGVyIHRoYXQgYWxsb3dzIGZvciBkaXNrcy4mI3gyMDFEOyBJbiB0aGF0IGNhc2UsIG9ubHkgYSB0aW55IGZyYWN0aW9uIG9mIGRhcmsgbWF0dGVyIHBhcnRpY2xlcyBpbnRlcmFjdCwgYnV0IHRoZXkgZG8gc28gc3Ryb25nbHkgZW5vdWdoIHRvIGRpc3NpcGF0ZSBlbmVyZ3kmI3gyMDE0O2FuZCB0aGVuIGZvcm0gZGlza3MuPC9wPlxcbjxwPlJhbmRhbGwgYW5kIGhlciBjb2xsYWJvcmF0b3JzIEppSmkgRmFuLCBBbmRyZXkgS2F0eiBhbmQgTWF0dGhldyBSZWVjZSBtYWRlIHRoZWlyIHdheSB0byB0aGlzIGlkZWEgaW4gMjAxMyBieSB0aGUgc2FtZSBwYXRoIGFzIE9vcnQ6IFRoZXkgd2VyZSB0cnlpbmcgdG8gZXhwbGFpbiBhbiBhcHBhcmVudCBNaWxreSBXYXkgYW5vbWFseS4gS25vd24gYXMgdGhlICYjeDIwMUM7RmVybWkgbGluZSwmI3gyMDFEOyBpdCB3YXMgYW4gZXhjZXNzIG9mIGdhbW1hIHJheXMgb2YgYSBjZXJ0YWluIGZyZXF1ZW5jeSBjb21pbmcgZnJvbSB0aGUgZ2FsYWN0aWMgY2VudGVyLiAmI3gyMDFDO09yZGluYXJ5IGRhcmsgbWF0dGVyIHdvdWxkbiYjeDIwMTk7dCBhbm5paGlsYXRlIGVub3VnaCYjeDIwMUQ7IHRvIHByb2R1Y2UgdGhlIEZlcm1pIGxpbmUsIFJhbmRhbGwgc2FpZCwgJiN4MjAxQztzbyB3ZSB0aG91Z2h0LCB3aGF0IGlmIGl0IHdhcyBtdWNoIGRlbnNlcj8mI3gyMDFEOyBUaGUgZGFyayBkaXNrIHdhcyByZWJvcm4uIFRoZSBGZXJtaSBsaW5lIHZhbmlzaGVkIGFzIG1vcmUgZGF0YSBhY2N1bXVsYXRlZCwgYnV0IHRoZSBkaXNrIGlkZWEgc2VlbWVkIHdvcnRoIGV4cGxvcmluZyBhbnl3YXkuIEluIDIwMTQsIFJhbmRhbGwgYW5kIFJlZWNlIGh5cG90aGVzaXplZCB0aGF0IHRoZSBkaXNrIG1pZ2h0IGFjY291bnQgZm9yIHBvc3NpYmxlIDMwLSB0byAzNS1taWxsaW9uLXllYXIgaW50ZXJ2YWxzIGJldHdlZW4gZXNjYWxhdGVkIG1ldGVvciBhbmQgY29tZXQgYWN0aXZpdHksIGEgc3RhdGlzdGljYWxseSB3ZWFrIHNpZ25hbCB0aGF0IHNvbWUgc2NpZW50aXN0cyBoYXZlIHRlbnRhdGl2ZWx5IHRpZWQgdG8gcGVyaW9kaWMgbWFzcyBleHRpbmN0aW9ucy4gRWFjaCB0aW1lIHRoZSBzb2xhciBzeXN0ZW0gYm9icyB1cCBvciBkb3duIHRocm91Z2ggdGhlIGRhcmsgZGlzayBvbiB0aGUgTWlsa3kgV2F5IGNhcm91c2VsLCB0aGV5IGFyZ3VlZCwgdGhlIGRpc2smI3gyMDE5O3MgZ3Jhdml0YXRpb25hbCBlZmZlY3QgbWlnaHQgZGVzdGFiaWxpemUgcm9ja3MgYW5kIGNvbWV0cyBpbiB0aGUgT29ydCBjbG91ZCYjeDIwMTQ7YSBzY3JhcHlhcmQgb24gdGhlIG91dHNraXJ0cyBvZiB0aGUgc29sYXIgc3lzdGVtIG5hbWVkIGZvciBKYW4gT29ydC4gVGhlc2Ugb2JqZWN0cyB3b3VsZCBnbyBodXJ0bGluZyB0b3dhcmQgdGhlIGlubmVyIHNvbGFyIHN5c3RlbSwgc29tZSBzdHJpa2luZyBFYXJ0aC48L3A+XFxuPHA+QnV0IFJhbmRhbGwgYW5kIGhlciB0ZWFtIGRpZCBvbmx5IGEgY3Vyc29yeSYjeDIwMTQ7YW5kIGluY29ycmVjdCYjeDIwMTQ7YW5hbHlzaXMgb2YgaG93IG11Y2ggcm9vbSB0aGVyZSBpcyBmb3IgYSBkYXJrIGRpc2sgaW4gdGhlIE1pbGt5IFdheSYjeDIwMTk7cyBtYXNzIGJ1ZGdldCwganVkZ2luZyBieSB0aGUgbW90aW9ucyBvZiBzdGFycy4gJiN4MjAxQztUaGV5IG1hZGUgc29tZSBraW5kIG9mIG91dHJhZ2VvdXMgY2xhaW1zLCYjeDIwMUQ7IEJvdnkgc2FpZC48L3A+XFxuPHA+UmFuZGFsbCwgd2hvIHN0YW5kcyBvdXQgKGFjY29yZGluZyB0byBSZWVjZSkgZm9yICYjeDIwMUM7aGVyIHBlcnNpc3RlbmNlLCYjeDIwMUQ7IHB1dCBLcmFtZXIgb24gdGhlIGNhc2UsIHNlZWtpbmcgdG8gYWRkcmVzcyB0aGUgY3JpdGljcyBhbmQsIHNoZSBzYWlkLCAmI3gyMDFDO3RvIGlyb24gb3V0IGFsbCB0aGUgd3JpbmtsZXMmI3gyMDFEOyBpbiB0aGUgYW5hbHlzaXMgYmVmb3JlIEdhaWEgZGF0YSBiZWNvbWVzIGF2YWlsYWJsZS4gSGVyIGFuZCBLcmFtZXImI3gyMDE5O3MgbmV3IGFuYWx5c2lzIHNob3dzIHRoYXQgdGhlIGRhcmsgZGlzaywgaWYgaXQgZXhpc3RzLCBjYW5ub3QgYmUgYXMgZGVuc2UgYXMgaGVyIHRlYW0gaW5pdGlhbGx5IHRob3VnaHQgcG9zc2libGUuIEJ1dCB0aGVyZSBpcyBpbmRlZWQgd2lnZ2xlIHJvb20gZm9yIGEgdGhpbiBkYXJrIGRpc2sgeWV0LCBkdWUgYm90aCB0byBpdHMgcGluY2hpbmcgZWZmZWN0IGFuZCB0byBhZGRpdGlvbmFsIHVuY2VydGFpbnR5IGNhdXNlZCBieSBhIG5ldCBkcmlmdCBpbiB0aGUgTWlsa3kgV2F5IHN0YXJzIHRoYXQgaGF2ZSBiZWVuIG1vbml0b3JlZCB0aHVzIGZhci48L3A+XFxuXFxuXFxuXFxuPHA+Tm93IHRoZXJlJiN4MjAxOTtzIGEgbmV3IHByb2JsZW0sIDxhIGhyZWY9XFxcImh0dHA6Ly9pb3BzY2llbmNlLmlvcC5vcmcvYXJ0aWNsZS8xMC4xMDg4LzAwMDQtNjM3WC84MTQvMS8xM1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnJhaXNlZDwvYT4gaW4gPGVtPlRoZSBBc3Ryb3BoeXNpY2FsIEpvdXJuYWw8L2VtPiBieSA8YSBocmVmPVxcXCJodHRwOi8vYXN0cm8uYmVya2VsZXkuZWR1L2ZhY3VsdHktcHJvZmlsZS9jaHJpcy1tY2tlZVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkNocmlzIE1jS2VlPC9hPiBvZiB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBCZXJrZWxleSwgYW5kIGNvbGxhYm9yYXRvcnMuIE1jS2VlIGNvbmNlZGVzIHRoYXQgYSB0aGluIGRhcmsgZGlzayBjYW4gc3RpbGwgYmUgc3F1ZWV6ZWQgaW50byB0aGUgTWlsa3kgV2F5JiN4MjAxOTtzIG1hc3MgYnVkZ2V0LiBCdXQgdGhlIGRpc2sgbWlnaHQgYmUgc28gdGhpbiB0aGF0IGl0IHdvdWxkIGNvbGxhcHNlLiBDaXRpbmcgcmVzZWFyY2ggZnJvbSB0aGUgMTk2MHMgYW5kICYjeDIwMTk7NzBzLCBNY0tlZSBhbmQgY29sbGVhZ3VlcyBhcmd1ZSB0aGF0IGRpc2tzIGNhbm5vdCBiZSBzaWduaWZpY2FudGx5IHRoaW5uZXIgdGhhbiB0aGUgZGlzayBvZiB2aXNpYmxlIGdhcyBpbiB0aGUgTWlsa3kgV2F5IHdpdGhvdXQgZnJhZ21lbnRpbmcuICYjeDIwMUM7SXQgaXMgcG9zc2libGUgdGhhdCB0aGUgZGFyayBtYXR0ZXIgdGhleSBjb25zaWRlciBoYXMgc29tZSBwcm9wZXJ0eSB0aGF0IGlzIGRpZmZlcmVudCBmcm9tIG9yZGluYXJ5IG1hdHRlciBhbmQgcHJldmVudHMgdGhpcyBmcm9tIGhhcHBlbmluZywgYnV0IEkgZG9uJiN4MjAxOTt0IGtub3cgd2hhdCB0aGF0IGNvdWxkIGJlLCYjeDIwMUQ7IE1jS2VlIHNhaWQuPC9wPlxcbjxwPlJhbmRhbGwgaGFzIG5vdCB5ZXQgcGFycmllZCB0aGlzIGxhdGVzdCBhdHRhY2ssIGNhbGxpbmcgaXQgJiN4MjAxQzthIHRyaWNreSBpc3N1ZSYjeDIwMUQ7IHRoYXQgaXMgJiN4MjAxQzt1bmRlciBjb25zaWRlcmF0aW9uIG5vdy4mI3gyMDFEOyBTaGUgaGFzIGFsc28gdGFrZW4gb24gdGhlIHBvaW50IHJhaXNlZCBieSBCb3Z5JiN4MjAxNDt0aGF0IGEgZGlzayBvZiBjaGFyZ2VkIGRhcmsgYXRvbXMgaXMgaXJyZWxldmFudCBuZXh0IHRvIHRoZSBuYXR1cmUgb2YgOTggcGVyY2VudCBvZiBkYXJrIG1hdHRlci4gU2hlIGlzIG5vdyBpbnZlc3RpZ2F0aW5nIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGFsbCBkYXJrIG1hdHRlciBtaWdodCBiZSBjaGFyZ2VkIHVuZGVyIHRoZSBzYW1lIGRhcmsgZm9yY2UsIGJ1dCBiZWNhdXNlIG9mIGEgc3VycGx1cyBvZiBkYXJrIHByb3RvbnMgb3ZlciBkYXJrIGVsZWN0cm9ucywgb25seSBhIHRpbnkgZnJhY3Rpb24gYmVjb21lIGJvdW5kIGluIGF0b21zIGFuZCB3aW5kIHVwIGluIGEgZGlzay4gSW4gdGhhdCBjYXNlLCB0aGUgZGlzayBhbmQgaGFsbyB3b3VsZCBiZSBtYWRlIG9mIHRoZSBzYW1lIGluZ3JlZGllbnRzLCAmI3gyMDFDO3doaWNoIHdvdWxkIGJlIG1vcmUgZWNvbm9taWNhbCwmI3gyMDFEOyBzaGUgc2FpZC4gJiN4MjAxQztXZSB0aG91Z2h0IHRoYXQgd291bGQgYmUgcnVsZWQgb3V0LCBidXQgaXQgd2FzbiYjeDIwMTk7dC4mI3gyMDFEOzwvcD5cXG48cD5UaGUgZGFyayBkaXNrIHN1cnZpdmVzLCBmb3Igbm93JiN4MjAxNDthIHN5bWJvbCBvZiBhbGwgdGhhdCBpc24mI3gyMDE5O3Qga25vd24gYWJvdXQgdGhlIGRhcmsgc2lkZSBvZiB0aGUgdW5pdmVyc2UuICYjeDIwMUM7SSB0aGluayBpdCYjeDIwMTk7cyB2ZXJ5LCB2ZXJ5IGhlYWx0aHkgZm9yIHRoZSBmaWVsZCB0aGF0IHlvdSBoYXZlIHBlb3BsZSB0aGlua2luZyBhYm91dCBhbGwga2luZHMgb2YgZGlmZmVyZW50IGlkZWFzLCYjeDIwMUQ7IHNhaWQgQnVsbG9jay4gJiN4MjAxQztCZWNhdXNlIGl0JiN4MjAxOTtzIHF1aXRlIHRydWUgdGhhdCB3ZSBkb24mI3gyMDE5O3Qga25vdyB3aGF0IHRoZSBoZWNrIHRoYXQgZGFyayBtYXR0ZXIgaXMsIGFuZCB5b3UgbmVlZCB0byBiZSBvcGVuLW1pbmRlZCBhYm91dCBpdC4mI3gyMDFEOzwvcD5cXG48cD48ZW0+PGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnLzIwMTYwNDEyLWRlYmF0ZS1pbnRlbnNpZmllcy1vdmVyLWRhcmstZGlzay10aGVvcnkvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+T3JpZ2luYWwgc3Rvcnk8L2E+IHJlcHJpbnRlZCB3aXRoIHBlcm1pc3Npb24gZnJvbSA8YSBocmVmPVxcXCJodHRwczovL3d3dy5xdWFudGFtYWdhemluZS5vcmdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5RdWFudGEgTWFnYXppbmU8L2E+LCBhbiBlZGl0b3JpYWxseSBpbmRlcGVuZGVudCBwdWJsaWNhdGlvbiBvZiB0aGUgPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cuc2ltb25zZm91bmRhdGlvbi5vcmdcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5TaW1vbnMgRm91bmRhdGlvbjwvYT4gd2hvc2UgbWlzc2lvbiBpcyB0byBlbmhhbmNlIHB1YmxpYyB1bmRlcnN0YW5kaW5nIG9mIHNjaWVuY2UgYnkgY292ZXJpbmcgcmVzZWFyY2ggZGV2ZWxvcG1lbnRzIGFuZCB0cmVuZHMgaW4gbWF0aGVtYXRpY3MgYW5kIHRoZSBwaHlzaWNhbCBhbmQgbGlmZSBzY2llbmNlcy48L2VtPjwvcD5cXG5cXG5cXHRcXHRcXHQ8YSBjbGFzcz1cXFwidmlzdWFsbHktaGlkZGVuIHNraXAtdG8tdGV4dC1saW5rIGZvY3VzYWJsZSBiZy13aGl0ZVxcXCIgaHJlZj1cXFwiaHR0cDovL3d3dy53aXJlZC5jb20vMjAxNi8wNi9kZWJhdGUtaW50ZW5zaWZpZXMtZGFyay1kaXNrLXRoZW9yeS8jc3RhcnQtb2YtY29udGVudFxcXCI+R28gQmFjayB0byBUb3AuIFNraXAgVG86IFN0YXJ0IG9mIEFydGljbGUuPC9hPlxcblxcblxcdFxcdFxcdFxcblxcdFxcdDwvYXJ0aWNsZT5cXG5cXG5cXHRcXHQ8L2Rpdj5cIixcblx0XHRcImRhdGVQdWJsaXNoZWRcIjogXCIyMDE2LTA2LTA0IDAwOjAwOjAwXCIsXG5cdFx0XCJkb21haW5cIjogXCJ3d3cud2lyZWQuY29tXCIsXG5cdFx0XCJleGNlcnB0XCI6IFwiSW4gMTkzMiwgdGhlIER1dGNoIGFzdHJvbm9tZXIgSmFuIE9vcnQgdGFsbGllZCB0aGUgc3RhcnMgaW4gdGhlIE1pbGt5IFdheSBhbmQgZm91bmQgdGhhdCB0aGV5IGNhbWUgdXAgc2hvcnQuIEp1ZGdpbmcgYnkgdGhlIHdheSB0aGUgc3RhcnMgYm9iIHVwIGFuZCBkb3duIGxpa2UgaG9yc2VzIG9uIGEgY2Fyb3VzZWwgYXMgdGhleSBnbyBhcm91bmQmaGVsbGlwO1wiLFxuXHRcdFwibGVhZEltYWdlVXJsXCI6IFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzA2MTAxNF9yYW5kYWxsXzE2MjdfMzEwNTc1XzkwNDUxOC02MTV4NDEwLTQ4MngzMjEuanBnXCIsXG5cdFx0XCJ0aXRsZVwiOiBcIkEgRGlzayBvZiBEYXJrIE1hdHRlciBNaWdodCBSdW4gVGhyb3VnaCBPdXIgR2FsYXh5XCIsXG5cdFx0XCJ1cmxcIjogXCJodHRwOi8vd3d3LndpcmVkLmNvbS8yMDE2LzA2L2RlYmF0ZS1pbnRlbnNpZmllcy1kYXJrLWRpc2stdGhlb3J5L1wiLFxuXHRcdFwiX2lkXCI6IFwiNTc1MmVlNTUyMmFmYjJkNDBiODVmMjY3XCJcblx0fTtcbiIsImFwcC5mYWN0b3J5KCdQYWdlc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XG5cdHZhciBQYWdlc0ZhY3RvcnkgPSB7fVxuXG5cdFBhZ2VzRmFjdG9yeS5nZXRTYXZlZCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFnZXNcIilcblx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIFBhZ2VzRmFjdG9yeTtcbn0pIiwiYXBwLmZhY3RvcnkoJ1BhcnNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XG5cblx0dmFyIFBhcnNlckZhY3RvcnkgPSB7fTtcblxuXHRQYXJzZXJGYWN0b3J5LnBhcnNlVXJsID0gZnVuY3Rpb24odXJsLCB1c2VyaWQpIHtcblxuXHRcdHZhciBlbmNvZGVkID0gZW5jb2RlVVJJQ29tcG9uZW50KHVybCk7XG5cdFx0Ly9jb25zb2xlLmxvZyhcImVuY29kZWQ6IFwiLCBlbmNvZGVkKTtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KFwiL2FwaS9wYXJzZXIvXCIgKyBlbmNvZGVkKVxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG5cdFx0XHQvL3JldHVybiByZXN1bHQuZGF0YVxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcInBhcnNlciByZXN1bHQ6IFwiLCByZXN1bHQuZGF0YSk7XG4gICAgICAgICAgICByZXN1bHQuZGF0YS51c2VyaWQgPSB1c2VyaWQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVzZXJpZDogXCIsIHVzZXJpZCk7XG5cdFx0XHRyZXR1cm4gJGh0dHAucG9zdChcIi9hcGkvcGFnZXNcIiwgcmVzdWx0LmRhdGEpXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwicG9zdCByZXNwb25zZTogXCIsIHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH07XG5cblx0cmV0dXJuIFBhcnNlckZhY3Rvcnk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYXJ0aWNsZURldGFpbCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgc2NvcGU6IHt9LFxuICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL2FydGljbGVEZXRhaWxDYXJkL2RldGFpbC5odG1sJyxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xuXG4gICAgfVxuXG4gIH1cbn0pXG4iLCJhcHAuZGlyZWN0aXZlKCdiaW5kQ29tcGlsZWRIdG1sJywgWyckY29tcGlsZScsIGZ1bmN0aW9uKCRjb21waWxlKSB7XG4gIHJldHVybiB7XG4gICAgdGVtcGxhdGU6ICc8ZGl2PjwvZGl2PicsXG4gICAgc2NvcGU6IHtcbiAgICAgIHJhd0h0bWw6ICc9YmluZENvbXBpbGVkSHRtbCdcbiAgICB9LFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtKSB7XG4gICAgICB2YXIgaW1ncyA9IFtdO1xuICAgICAgc2NvcGUuJHdhdGNoKCdyYXdIdG1sJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB2YXIgbmV3RWxlbSA9ICRjb21waWxlKHZhbHVlKShzY29wZS4kcGFyZW50KTtcbiAgICAgICAgZWxlbS5jb250ZW50cygpLnJlbW92ZSgpO1xuICAgICAgICBpbWdzID0gbmV3RWxlbS5maW5kKCdpbWcnKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWdzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgICBpbWdzW2ldLmFkZENsYXNzID0gJ2Zsb2F0UmlnaHQnXG4gICAgICAgIH1cbiAgICAgICAgZWxlbS5hcHBlbmQobmV3RWxlbSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59XSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgJG1kU2lkZW5hdiwgJG1kSW5rUmlwcGxlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xuXG4gICAgICAgICAgICBzY29wZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkbWRTaWRlbmF2KFwibGVmdFwiKS50b2dnbGUoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQYXJzZXInLCBzdGF0ZTogJ3BhcnNlcicgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnUGFnZXMnLCBzdGF0ZTogJ3BhZ2VzJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2lkZWJhcicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHNjb3BlOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuaHRtbCcsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUpIHtcblx0XHQgICAgJChcIi5tZW51LXVwXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0ICAgIFx0aWYoJCh0aGlzKS5jc3MoJ3RyYW5zZm9ybScpXHQhPT0gJ25vbmUnKXtcblx0XHQgICAgXHRcdCQodGhpcykuY3NzKFwidHJhbnNmb3JtXCIsIFwiXCIpO1xuXHRcdCAgICBcdFx0aWYoJCh0aGlzKS5hdHRyKCdpZCcpID09PSAnc3Vic2NyaXB0aW9ucy1pY29uJylcblx0XHQgICAgXHRcdFx0JCgnI3N1YnNjcmlwdGlvbnMnKS5zaG93KDQwMCk7XG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdmb2xkZXJzLWljb24nKVxuXHRcdCAgICBcdFx0XHQkKCcjZm9sZGVycycpLnNob3coNDAwKTtcblx0XHQgICAgXHR9XG5cdFx0ICAgIFx0ZWxzZXtcblx0XHRcdFx0XHQkKHRoaXMpLmNzcyhcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgxODBkZWcpXCIpO1xuXHRcdCAgICBcdFx0aWYoJCh0aGlzKS5hdHRyKCdpZCcpID09PSAnc3Vic2NyaXB0aW9ucy1pY29uJylcblx0XHQgICAgXHRcdFx0JCgnI3N1YnNjcmlwdGlvbnMnKS5oaWRlKDQwMCk7XG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdmb2xkZXJzLWljb24nKVxuXHRcdCAgICBcdFx0XHQkKCcjZm9sZGVycycpLmhpZGUoNDAwKTtcdFx0XHRcdFxuXHRcdCAgICBcdH1cblx0XHRcdH0pO1xuXG5cdFx0fVxuXHR9XG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnc3BlZWREaWFsJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdFJyxcbiAgICBzY29wZToge30sXG4gICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvc3BlZWQtZGlhbC9zcGVlZC1kaWFsLmh0bWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlKSB7XG4gICAgICBzY29wZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgIHNjb3BlLmhlbGxvID0gXCJ3b3JsZFwiXG4gICAgfVxuICB9XG59KVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
