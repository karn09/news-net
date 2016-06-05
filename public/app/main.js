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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJwYWdlcy9wYWdlcy5qcyIsInBhcnNlci9wYXJzZXIuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYXJ0aWNsZURldGFpbC5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYXJ0aWNsZVZpZXcuanMiLCJjb21tb24vZmFjdG9yaWVzL3BhZ2VzLmZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL3BhcnNlci5mYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYXJ0aWNsZURldGFpbENhcmQvZGV0YWlsLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYmluZENvbXBpbGVkSHRtbC9iaW5kQ29tcGlsZWRIdG1sLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9zcGVlZC1kaWFsL3NwZWVkLWRpYWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0EsT0FBQSxHQUFBLEdBQUEsUUFBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEs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QUdBLGlCQUFBLFlBQUEsY0FIQTtBQUlBLGlCQUFBLFlBQUE7QUFKQSxTQUFBO0FBTUEsZUFBQTtBQUNBLDJCQUFBLHVCQUFBLFFBQUEsRUFBQTtBQUNBLDJCQUFBLFVBQUEsQ0FBQSxXQUFBLFNBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQTtBQUNBLHVCQUFBLEdBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQTtBQUNBO0FBSkEsU0FBQTtBQU1BLEtBYkE7O0FBZUEsUUFBQSxNQUFBLENBQUEsVUFBQSxhQUFBLEVBQUE7QUFDQSxzQkFBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FEQSxFQUVBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsbUJBQUEsVUFBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQTtBQUNBLFNBSkEsQ0FBQTtBQU1BLEtBUEE7O0FBU0EsUUFBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7QUFFQSxpQkFBQSxpQkFBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLGdCQUFBLE9BQUEsU0FBQSxJQUFBO0FBQ0Esb0JBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFBLEtBQUEsSUFBQTtBQUNBLHVCQUFBLFVBQUEsQ0FBQSxZQUFBLFlBQUE7QUFDQSxtQkFBQSxLQUFBLElBQUE7QUFDQTs7OztBQUlBLGFBQUEsZUFBQSxHQUFBLFlBQUE7QUFDQSxtQkFBQSxDQUFBLENBQUEsUUFBQSxJQUFBO0FBQ0EsU0FGQTs7QUFJQSxhQUFBLGVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7Ozs7Ozs7OztBQVVBLGdCQUFBLEtBQUEsZUFBQSxNQUFBLGVBQUEsSUFBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxJQUFBLENBQUE7QUFDQTs7Ozs7QUFLQSxtQkFBQSxNQUFBLEdBQUEsQ0FBQSxVQUFBLEVBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxJQUFBO0FBQ0Es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QUNBLHdCQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLE1BQUEsY0FBQSxFQUNBLEVBQUEsVUFBQSxFQUFBLElBQUEsQ0FBQSxHQUFBO0FBQ0EsaUJBTkEsTUFPQTtBQUNBLHNCQUFBLElBQUEsRUFBQSxHQUFBLENBQUEsV0FBQSxFQUFBLGdCQUFBO0FBQ0Esd0JBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsTUFBQSxvQkFBQSxFQUNBLEVBQUEsZ0JBQUEsRUFBQSxJQUFBLENBQUEsR0FBQTtBQUNBLHdCQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLE1BQUEsY0FBQSxFQUNBLEVBQUEsVUFBQSxFQUFBLElBQUEsQ0FBQSxHQUFBO0FBQ0E7QUFDQSxhQWZBO0FBaUJBO0FBdEJBLEtBQUE7QUF3QkEsQ0F6QkE7O0FDQUEsSUFBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0Esa0JBQUEsR0FEQTtBQUVBLGVBQUEsRUFGQTtBQUdBLHFCQUFBLGtEQUhBO0FBSUEsY0FBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBO0FBQ0Esa0JBQUEsTUFBQSxHQUFBLEtBQUE7QUFDQSxrQkFBQSxLQUFBLEdBQUEsT0FBQTtBQUNBO0FBUEEsS0FBQTtBQVNBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICduZ01hdGVyaWFsJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkbWRUaGVtaW5nUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcblxuICAgICRtZFRoZW1pbmdQcm92aWRlci50aGVtZSgnZGVmYXVsdCcpXG4gICAgICAgIC5wcmltYXJ5UGFsZXR0ZSgnYmx1ZS1ncmV5JylcbiAgICAgICAgLmFjY2VudFBhbGV0dGUoJ2JsdWUtZ3JleScpO1xuXG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlcycsIHtcbiAgICAgICAgdXJsOiAnL2FydGljbGVzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJ0aWNsZXMvYXJ0aWNsZXMuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlJywge1xuICAgICAgICB1cmw6ICcvYXJ0aWNsZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FydGljbGUtdmlldy9hcnRpY2xlLXZpZXcuaHRtbCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICBjdXJyZW50OiBmdW5jdGlvbihBcnRpY2xlVmlld0ZhY3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnRpY2xlVmlld0ZhY3RvcnkuZ2V0QXJ0aWNsZUJ5SWQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBcnRpY2xlVmlld0N0cmwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0FydGljbGVWaWV3Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgY3VycmVudCwgJGNvbXBpbGUpIHtcbiAgICAkc2NvcGUuY3VycmVudCA9IGN1cnJlbnQ7XG4gICAgJHNjb3BlLnRpdGxlID0gY3VycmVudC50aXRsZTtcbiAgICAkc2NvcGUuY29udGVudCA9IGN1cnJlbnQuY29udGVudDtcbn0pO1xuIiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvaG9tZS9ob21lLmh0bWwnXG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcil7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BhZ2VzJywge1xuXHQgICAgdXJsOiAnL3BhZ2VzJyxcblx0ICAgIHRlbXBsYXRlVXJsOiAnYXBwL3BhZ2VzL3BhZ2VzLmh0bWwnLCAvL1N0aWxsIG5lZWQgdG8gbWFrZVxuXHQgICAgY29udHJvbGxlcjogJ1BhZ2VzQ3RybCdcblx0fSk7XG5cbn0pXG5cbmFwcC5jb250cm9sbGVyKCdQYWdlc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFBhZ2VzRmFjdG9yeSl7XG5cblx0UGFnZXNGYWN0b3J5LmdldFNhdmVkKClcblx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdCRzY29wZS5wYWdlcyA9IHJlc3BvbnNlO1xuXHR9KVxuXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncGFyc2VyJywge1xuICAgICAgICB1cmw6ICcvcGFyc2VyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvcGFyc2VyL3BhcnNlci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1BhcnNlckN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignUGFyc2VyQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwgUGFyc2VyRmFjdG9yeSwgU2Vzc2lvbikge1xuXG4gICAgJHNjb3BlLnBhcnNlVXJsID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIC8vY29uc29sZS5sb2coXCJpbnNpZGUgcGFyc2VyQ3RybCBwYXJzZVVybDogc2Vzc2lvbiB1c2VyOiBcIiwgU2Vzc2lvbi51c2VyLl9pZCk7XG4gICAgICAgIFBhcnNlckZhY3RvcnkucGFyc2VVcmwoJHNjb3BlLnVybCwgU2Vzc2lvbi51c2VyLl9pZClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgJHNjb3BlLnBhcnNlZCA9IHJlc3BvbnNlO1xuICAgICAgICB9KVxuXG4gICAgfTtcblxufSk7XG5cblxuIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuICIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdhcnRpY2xlRGV0YWlsRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG4gIHZhciBkZXRhaWxPYmogPSB7fTtcblxuICBkZXRhaWxPYmouZmV0Y2hBbGxCeUNhdGVnb3J5ID0gZnVuY3Rpb24oY2F0ZWdvcnkpIHtcbiAgICAvLyByZXR1cm4gYWxsIHRpdGxlcyBhbmQgc3VtbWFyaWVzIGFzc29jaWF0ZWQgd2l0aCBjdXJyZW50IGNhdGVnb3J5XG4gIH07XG5cbiAgZGV0YWlsT2JqLmZldGNoT25lQnlJZCA9IGZ1bmN0aW9uKGlkKSB7XG5cbiAgfTtcblxuICBkZXRhaWxPYmouYWRkQXJ0aWNsZSA9IGZ1bmN0aW9uKGNhdGVnb3J5KSB7XG4gICAgLy8gYWRkIG9uZSBhcnRpY2xlIHRvIGNhdGVnb3J5XG4gIH07XG5cbiAgZGV0YWlsT2JqLnJlbW92ZUFydGljbGVCeUlEID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gcmVtb3ZlIG9uIGFydGljbGUgYnkgSURcbiAgfTtcblxuICBkZXRhaWxPYmouc2F2ZUFydGljbGVCeVVybCA9IGZ1bmN0aW9uKHVybCwgY2F0ZWdvcnkpIHtcbiAgICAvLyBkZWZhdWx0IHRvIGFsbCwgb3Igb3B0aW9uYWwgY2F0ZWdvcnlcbiAgfVxuXG4gIHJldHVybiBkZXRhaWxPYmo7XG59KVxuIiwiYXBwLmZhY3RvcnkoJ0FydGljbGVWaWV3RmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xuXHR2YXIgYXJ0aWNsZVZpZXdPYmogPSB7fTtcblxuXHRhcnRpY2xlVmlld09iai5nZXRBcnRpY2xlQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiB0ZW1wQXJ0aWNsZU9iajtcblx0fTtcblxuXHRhcnRpY2xlVmlld09iai5yZW1vdmVBcnRpY2xlQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuXG5cdH07XG5cbiAgYXJ0aWNsZVZpZXdPYmouYWRkQXJ0aWNsZUNhdGVnb3J5ID0gZnVuY3Rpb24gKGlkLCBjYXQpIHtcblxuICB9O1xuXG5cdHJldHVybiBhcnRpY2xlVmlld09iajtcbn0pXG5cblxudmFyIHRlbXBBcnRpY2xlT2JqID1cbiAge1xuXHRcdFwiX192XCI6IDAsXG5cdFx0XCJjb250ZW50XCI6IFwiPGRpdj48YXJ0aWNsZSBjbGFzcz1cXFwiY29udGVudCBsaW5rLXVuZGVybGluZSByZWxhdGl2ZSBib2R5LWNvcHlcXFwiPlxcblxcblxcdFxcdFxcdDxwPkluIDE5MzIsIHRoZSBEdXRjaCBhc3Ryb25vbWVyIEphbiBPb3J0IHRhbGxpZWQgdGhlIHN0YXJzIGluIHRoZSBNaWxreSBXYXkgYW5kIGZvdW5kIHRoYXQgdGhleSBjYW1lIHVwIHNob3J0LiBKdWRnaW5nIGJ5IHRoZSB3YXkgdGhlIHN0YXJzIGJvYiB1cCBhbmQgZG93biBsaWtlIGhvcnNlcyBvbiBhIGNhcm91c2VsIGFzIHRoZXkgZ28gYXJvdW5kIHRoZSBwbGFuZSBvZiB0aGUgZ2FsYXh5LCBPb3J0IGNhbGN1bGF0ZWQgdGhhdCB0aGVyZSBvdWdodCB0byBiZSB0d2ljZSBhcyBtdWNoIG1hdHRlciBncmF2aXRhdGlvbmFsbHkgcHJvcGVsbGluZyB0aGVtIGFzIGhlIGNvdWxkIHNlZS4gSGUgcG9zdHVsYXRlZCB0aGUgcHJlc2VuY2Ugb2YgaGlkZGVuICYjeDIwMUM7ZGFyayBtYXR0ZXImI3gyMDFEOyB0byBtYWtlIHVwIHRoZSBkaWZmZXJlbmNlIGFuZCBzdXJtaXNlZCB0aGF0IGl0IG11c3QgYmUgY29uY2VudHJhdGVkIGluIGEgZGlzayB0byBleHBsYWluIHRoZSBzdGFycyYjeDIwMTk7IG1vdGlvbnMuPC9wPlxcblxcblxcbjxwPkJ1dCBjcmVkaXQgZm9yIHRoZSBkaXNjb3Zlcnkgb2YgZGFyayBtYXR0ZXImI3gyMDE0O3RoZSBpbnZpc2libGUsIHVuaWRlbnRpZmllZCBzdHVmZiB0aGF0IGNvbXByaXNlcyBmaXZlLXNpeHRocyBvZiB0aGUgdW5pdmVyc2UmI3gyMDE5O3MgbWFzcyYjeDIwMTQ7dXN1YWxseSBnb2VzIHRvIHRoZSBTd2lzcy1BbWVyaWNhbiBhc3Ryb25vbWVyIEZyaXR6IFp3aWNreSwgd2hvIGluZmVycmVkIGl0cyBleGlzdGVuY2UgZnJvbSB0aGUgcmVsYXRpdmUgbW90aW9ucyBvZiBnYWxheGllcyBpbiAxOTMzLiBPb3J0IGlzIHBhc3NlZCBvdmVyIG9uIHRoZSBncm91bmRzIHRoYXQgaGUgd2FzIHRyYWlsaW5nIGEgZmFsc2UgY2x1ZS4gQnkgMjAwMCwgdXBkYXRlZCwgT29ydC1zdHlsZSBpbnZlbnRvcmllcyBvZiB0aGUgTWlsa3kgV2F5IGRldGVybWluZWQgdGhhdCBpdHMgJiN4MjAxQzttaXNzaW5nJiN4MjAxRDsgbWFzcyBjb25zaXN0cyBvZiBmYWludCBzdGFycywgZ2FzIGFuZCBkdXN0LCB3aXRoIG5vIG5lZWQgZm9yIGEgZGFyayBkaXNrLiBFaWdodHkgeWVhcnMgb2YgaGludHMgc3VnZ2VzdCB0aGF0IGRhcmsgbWF0dGVyLCB3aGF0ZXZlciBpdCBpcywgZm9ybXMgc3BoZXJpY2FsIGNsb3VkcyBjYWxsZWQgJiN4MjAxQztoYWxvcyYjeDIwMUQ7IGFyb3VuZCBnYWxheGllcy48L3A+XFxuPHA+T3Igc28gbW9zdCBkYXJrIG1hdHRlciBodW50ZXJzIGhhdmUgaXQuIFRob3VnaCBpdCBmZWxsIG91dCBvZiBmYXZvciwgdGhlIGRhcmsgZGlzayBpZGVhIG5ldmVyIGNvbXBsZXRlbHkgd2VudCBhd2F5LiBBbmQgcmVjZW50bHksIGl0IGhhcyBmb3VuZCBhIGhpZ2gtcHJvZmlsZSBjaGFtcGlvbiBpbiA8YSBocmVmPVxcXCJodHRwczovL3d3dy5waHlzaWNzLmhhcnZhcmQuZWR1L3Blb3BsZS9mYWNwYWdlcy9yYW5kYWxsXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+TGlzYSBSYW5kYWxsPC9hPiwgYSBwcm9mZXNzb3Igb2YgcGh5c2ljcyBhdCBIYXJ2YXJkIFVuaXZlcnNpdHksIHdobyBoYXMgcmVzY3VlZCB0aGUgZGlzayBmcm9tIHNjaWVudGlmaWMgb2JsaXZpb24gYW5kIGdpdmVuIGl0IGFuIGFjdGl2ZSByb2xlIG9uIHRoZSBnYWxhY3RpYyBzdGFnZS48L3A+XFxuPHA+U2luY2UgPGEgaHJlZj1cXFwiaHR0cDovL2FyeGl2Lm9yZy9wZGYvMTMwMy4xNTIxdjIucGRmXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cHJvcG9zaW5nIHRoZSBtb2RlbDwvYT4gaW4gMjAxMywgUmFuZGFsbCBhbmQgaGVyIGNvbGxhYm9yYXRvcnMgaGF2ZSBhcmd1ZWQgdGhhdCBhIGRhcmsgZGlzayBtaWdodCBleHBsYWluIGdhbW1hIHJheXMgY29taW5nIGZyb20gdGhlIGdhbGFjdGljIGNlbnRlciwgdGhlIDxhIGhyZWY9XFxcImh0dHA6Ly93d3cubmF0dXJlLmNvbS9uYXR1cmUvam91cm5hbC92NTExL243NTExL2Z1bGwvbmF0dXJlMTM0ODEuaHRtbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnBsYW5hciBkaXN0cmlidXRpb24gb2YgZHdhcmYgZ2FsYXhpZXM8L2E+IG9yYml0aW5nIHRoZSBBbmRyb21lZGEgZ2FsYXh5IGFuZCB0aGUgTWlsa3kgV2F5LCBhbmQgZXZlbiA8YSBocmVmPVxcXCJodHRwczovL3BoeXNpY3MuYXBzLm9yZy9mZWF0dXJlZC1hcnRpY2xlLXBkZi8xMC4xMTAzL1BoeXNSZXZMZXR0LjExMi4xNjEzMDFcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5wZXJpb2RpYyB1cHRpY2tzIG9mIGNvbWV0IGltcGFjdHM8L2E+IGFuZCBtYXNzIGV4dGluY3Rpb25zIG9uIEVhcnRoLCBkaXNjdXNzZWQgaW4gUmFuZGFsbCYjeDIwMTk7cyAyMDE1IHBvcHVsYXItc2NpZW5jZSBib29rLCA8ZW0+RGFyayBNYXR0ZXIgYW5kIHRoZSBEaW5vc2F1cnM8L2VtPi48L3A+XFxuPHA+QnV0IGFzdHJvcGh5c2ljaXN0cyB3aG8gZG8gaW52ZW50b3JpZXMgb2YgdGhlIE1pbGt5IFdheSBoYXZlIHByb3Rlc3RlZCwgYXJndWluZyB0aGF0IHRoZSBnYWxheHkmI3gyMDE5O3MgdG90YWwgbWFzcyBhbmQgdGhlIGJvYmJpbmcgbW90aW9ucyBvZiBpdHMgc3RhcnMgbWF0Y2ggdXAgdG9vIHdlbGwgdG8gbGVhdmUgcm9vbSBmb3IgYSBkYXJrIGRpc2suICYjeDIwMUM7SXQmI3gyMDE5O3MgbW9yZSBzdHJvbmdseSBjb25zdHJhaW5lZCB0aGFuIExpc2EgUmFuZGFsbCBwcmV0ZW5kcywmI3gyMDFEOyBzYWlkIDxhIGhyZWY9XFxcImh0dHA6Ly9hc3Ryby51dG9yb250by5jYS9+Ym92eS9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5KbyBCb3Z5PC9hPiwgYW4gYXN0cm9waHlzaWNpc3QgYXQgdGhlIFVuaXZlcnNpdHkgb2YgVG9yb250by48L3A+XFxuPHA+Tm93LCBSYW5kYWxsLCB3aG8gaGFzIGRldmlzZWQgaW5mbHVlbnRpYWwgaWRlYXMgYWJvdXQgc2V2ZXJhbCBvZiB0aGUgPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnLzIwMTUwODAzLXBoeXNpY3MtdGhlb3JpZXMtbWFwL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmJpZ2dlc3QgcXVlc3Rpb25zIGluIGZ1bmRhbWVudGFsIHBoeXNpY3M8L2E+LCBpcyBmaWdodGluZyBiYWNrLiBJbiA8YSBocmVmPVxcXCJodHRwOi8vYXJ4aXYub3JnL2Ficy8xNjA0LjAxNDA3XFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+YSBwYXBlcjwvYT4gcG9zdGVkIG9ubGluZSBsYXN0IHdlZWsgdGhhdCBoYXMgYmVlbiBhY2NlcHRlZCBmb3IgcHVibGljYXRpb24gaW4gPGVtPlRoZSBBc3Ryb3BoeXNpY2FsIEpvdXJuYWw8L2VtPiwgUmFuZGFsbCBhbmQgaGVyIHN0dWRlbnQsIEVyaWMgS3JhbWVyLCByZXBvcnQgYSBkaXNrLXNoYXBlZCBsb29waG9sZSBpbiB0aGUgTWlsa3kgV2F5IGFuYWx5c2lzOiAmI3gyMDFDO1RoZXJlIGlzIGFuIGltcG9ydGFudCBkZXRhaWwgdGhhdCBoYXMgc28gZmFyIGJlZW4gb3Zlcmxvb2tlZCwmI3gyMDFEOyB0aGV5IHdyaXRlLiAmI3gyMDFDO1RoZSBkaXNrIGNhbiBhY3R1YWxseSBtYWtlIHJvb20gZm9yIGl0c2VsZi4mI3gyMDFEOzwvcD5cXG48ZmlndXJlIGNsYXNzPVxcXCJ3cC1jYXB0aW9uIGxhbmRzY2FwZSBhbGlnbm5vbmUgZmFkZXIgcmVsYXRpdmVcXFwiPjxpbWcgY2xhc3M9XFxcInNpemUtdGV4dC1jb2x1bW4td2lkdGggd3AtaW1hZ2UtMjAyMjI1NVxcXCIgc3JjPVxcXCJodHRwczovL3d3dy53aXJlZC5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMTYvMDUvMDYxMDE0X3JhbmRhbGxfMTYyN18zMTA1NzVfOTA0NTE4LTYxNXg0MTAtNDgyeDMyMS5qcGdcXFwiIGFsdD1cXFwiMDYxMDE0X1JhbmRhbGxfMTYyNy5qcGdcXFwiIHdpZHRoPVxcXCI0ODJcXFwiPjxmaWdjYXB0aW9uIGNsYXNzPVxcXCJ3cC1jYXB0aW9uLXRleHQgbGluay11bmRlcmxpbmVcXFwiPkxpc2EgUmFuZGFsbCBvZiBIYXJ2YXJkIFVuaXZlcnNpdHkgaXMgYSBoaWdoLXByb2ZpbGUgc3VwcG9ydGVyIG9mIHRoZSBjb250cm92ZXJzaWFsIGRhcmsgZGlzayBpZGVhLjxzcGFuIGNsYXNzPVxcXCJjcmVkaXQgbGluay11bmRlcmxpbmUtc21cXFwiPlJvc2UgTGluY29sbi9IYXJ2YXJkIFVuaXZlcnNpdHk8L3NwYW4+PC9maWdjYXB0aW9uPjwvZmlndXJlPlxcbjxwPklmIHRoZXJlIGlzIGEgdGhpbiBkYXJrIGRpc2sgY291cnNpbmcgdGhyb3VnaCB0aGUgJiN4MjAxQzttaWRwbGFuZSYjeDIwMUQ7IG9mIHRoZSBnYWxheHksIFJhbmRhbGwgYW5kIEtyYW1lciBhcmd1ZSwgdGhlbiBpdCB3aWxsIGdyYXZpdGF0aW9uYWxseSBwaW5jaCBvdGhlciBtYXR0ZXIgaW53YXJkLCByZXN1bHRpbmcgaW4gYSBoaWdoZXIgZGVuc2l0eSBvZiBzdGFycywgZ2FzIGFuZCBkdXN0IGF0IHRoZSBtaWRwbGFuZSB0aGFuIGFib3ZlIGFuZCBiZWxvdy4gUmVzZWFyY2hlcnMgdHlwaWNhbGx5IGVzdGltYXRlIHRoZSB0b3RhbCB2aXNpYmxlIG1hc3Mgb2YgdGhlIE1pbGt5IFdheSBieSBleHRyYXBvbGF0aW5nIG91dHdhcmQgZnJvbSB0aGUgbWlkcGxhbmUgZGVuc2l0eTsgaWYgdGhlcmUmI3gyMDE5O3MgYSBwaW5jaGluZyBlZmZlY3QsIHRoZW4gdGhpcyBleHRyYXBvbGF0aW9uIGxlYWRzIHRvIGFuIG92ZXJlc3RpbWF0aW9uIG9mIHRoZSB2aXNpYmxlIG1hc3MsIG1ha2luZyBpdCBzZWVtIGFzIGlmIHRoZSBtYXNzIG1hdGNoZXMgdXAgdG8gdGhlIHN0YXJzJiN4MjAxOTsgbW90aW9ucy4gJiN4MjAxQztUaGF0JiN4MjAxOTtzIHRoZSByZWFzb24gd2h5IGEgbG90IG9mIHRoZXNlIHByZXZpb3VzIHN0dWRpZXMgZGlkIG5vdCBzZWUgZXZpZGVuY2UgZm9yIGEgZGFyayBkaXNrLCYjeDIwMUQ7IEtyYW1lciBzYWlkLiBIZSBhbmQgUmFuZGFsbCBmaW5kIHRoYXQgYSB0aGluIGRhcmsgZGlzayBpcyBwb3NzaWJsZSYjeDIwMTQ7YW5kIGluIG9uZSB3YXkgb2YgcmVkb2luZyB0aGUgYW5hbHlzaXMsIHNsaWdodGx5IGZhdm9yZWQgb3ZlciBubyBkYXJrIGRpc2suPC9wPlxcbjxwPiYjeDIwMUM7TGlzYSYjeDIwMTk7cyB3b3JrIGhhcyByZW9wZW5lZCB0aGUgY2FzZSwmI3gyMDFEOyBzYWlkIDxhIGhyZWY9XFxcImh0dHA6Ly9hc3Ryb25vbXkuc3dpbi5lZHUuYXUvc3RhZmYvY2ZseW5uLmh0bWxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5DaHJpcyBGbHlubjwvYT4gb2YgU3dpbmJ1cm5lIFVuaXZlcnNpdHkgb2YgVGVjaG5vbG9neSBpbiBNZWxib3VybmUsIEF1c3RyYWxpYSwgd2hvLCB3aXRoIEpvaGFuIEhvbG1iZXJnLCBjb25kdWN0ZWQgYSBzZXJpZXMgb2YgTWlsa3kgV2F5IGludmVudG9yaWVzIGluIHRoZSBlYXJseSBhdWdodHMgdGhhdCBzZWVtZWQgdG8gPGEgaHJlZj1cXFwiaHR0cDovL29ubGluZWxpYnJhcnkud2lsZXkuY29tL2RvaS8xMC4xMDQ2L2ouMTM2NS04NzExLjIwMDAuMDI5MDUueC9hYnN0cmFjdFxcXCI+cm9idXN0bHkgc3dlZXAgaXQgY2xlYW48L2E+IG9mIGEgZGFyayBkaXNrLjwvcD5cXG48cD5Cb3Z5IGRpc2FncmVlcy4gRXZlbiB0YWtpbmcgdGhlIHBpbmNoaW5nIGVmZmVjdCBpbnRvIGFjY291bnQsIGhlIGVzdGltYXRlcyB0aGF0IGF0IG1vc3QgMiBwZXJjZW50IG9mIHRoZSB0b3RhbCBhbW91bnQgb2YgZGFyayBtYXR0ZXIgY2FuIGxpZSBpbiBhIGRhcmsgZGlzaywgd2hpbGUgdGhlIHJlc3QgbXVzdCBmb3JtIGEgaGFsby4gJiN4MjAxQztJIHRoaW5rIG1vc3QgcGVvcGxlIHdhbnQgdG8gZmlndXJlIG91dCB3aGF0IDk4IHBlcmNlbnQgb2YgdGhlIGRhcmsgbWF0dGVyIGlzIGFib3V0LCBub3Qgd2hhdCAyIHBlcmNlbnQgb2YgaXQgaXMgYWJvdXQsJiN4MjAxRDsgaGUgc2FpZC48L3A+XFxuPHA+VGhlIGRlYmF0ZSYjeDIwMTQ7YW5kIHRoZSBmYXRlIG9mIHRoZSBkYXJrIGRpc2smI3gyMDE0O3dpbGwgcHJvYmFibHkgYmUgZGVjaWRlZCBzb29uLiBUaGUgRXVyb3BlYW4gU3BhY2UgQWdlbmN5JiN4MjAxOTtzIEdhaWEgc2F0ZWxsaXRlIGlzIGN1cnJlbnRseSBzdXJ2ZXlpbmcgdGhlIHBvc2l0aW9ucyBhbmQgdmVsb2NpdGllcyBvZiBvbmUgYmlsbGlvbiBzdGFycywgYW5kIGEgZGVmaW5pdGl2ZSBpbnZlbnRvcnkgb2YgdGhlIE1pbGt5IFdheSBjb3VsZCBiZSBjb21wbGV0ZWQgYXMgc29vbiBhcyBuZXh0IHN1bW1lci48L3A+XFxuPHA+VGhlIGRpc2NvdmVyeSBvZiBhIGRhcmsgZGlzaywgb2YgYW55IHNpemUsIHdvdWxkIGJlIGVub3Jtb3VzbHkgcmV2ZWFsaW5nLiBJZiBvbmUgZXhpc3RzLCBkYXJrIG1hdHRlciBpcyBmYXIgbW9yZSBjb21wbGV4IHRoYW4gcmVzZWFyY2hlcnMgaGF2ZSBsb25nIHRob3VnaHQuIE1hdHRlciBzZXR0bGVzIGludG8gYSBkaXNrIHNoYXBlIG9ubHkgaWYgaXQgaXMgYWJsZSB0byBzaGVkIGVuZXJneSwgYW5kIHRoZSBlYXNpZXN0IHdheSBmb3IgaXQgdG8gc2hlZCBzdWZmaWNpZW50IGVuZXJneSBpcyBpZiBpdCBmb3JtcyBhdG9tcy4gVGhlIGV4aXN0ZW5jZSBvZiBkYXJrIGF0b21zIHdvdWxkIG1lYW4gZGFyayBwcm90b25zIGFuZCBkYXJrIGVsZWN0cm9ucyB0aGF0IGFyZSBjaGFyZ2VkIGluIGEgc2ltaWxhciBzdHlsZSBhcyB2aXNpYmxlIHByb3RvbnMgYW5kIGVsZWN0cm9ucywgaW50ZXJhY3Rpbmcgd2l0aCBlYWNoIG90aGVyIHZpYSBhIGRhcmsgZm9yY2UgdGhhdCBpcyBjb252ZXllZCBieSBkYXJrIHBob3RvbnMuIEV2ZW4gaWYgOTggcGVyY2VudCBvZiBkYXJrIG1hdHRlciBpcyBpbmVydCwgYW5kIGZvcm1zIGhhbG9zLCB0aGUgZXhpc3RlbmNlIG9mIGV2ZW4gYSB0aGluIGRhcmsgZGlzayB3b3VsZCBpbXBseSBhIHJpY2ggJiN4MjAxQztkYXJrIHNlY3RvciYjeDIwMUQ7IG9mIHVua25vd24gcGFydGljbGVzIGFzIGRpdmVyc2UsIHBlcmhhcHMsIGFzIHRoZSB2aXNpYmxlIHVuaXZlcnNlLiAmI3gyMDFDO05vcm1hbCBtYXR0ZXIgaXMgcHJldHR5IGNvbXBsZXg7IHRoZXJlJiN4MjAxOTtzIHN0dWZmIHRoYXQgcGxheXMgYSByb2xlIGluIGF0b21zIGFuZCB0aGVyZSYjeDIwMTk7cyBzdHVmZiB0aGF0IGRvZXNuJiN4MjAxOTt0LCYjeDIwMUQ7IHNhaWQgPGEgaHJlZj1cXFwiaHR0cDovL3d3dy5waHlzaWNzLnVjaS5lZHUvfmJ1bGxvY2svXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+SmFtZXMgQnVsbG9jazwvYT4sIGFuIGFzdHJvcGh5c2ljaXN0IGF0IHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIElydmluZS4gJiN4MjAxQztTbyBpdCYjeDIwMTk7cyBub3QgY3JhenkgdG8gaW1hZ2luZSB0aGF0IHRoZSBvdGhlciBmaXZlLXNpeHRocyBbb2YgdGhlIG1hdHRlciBpbiB0aGUgdW5pdmVyc2VdIGlzIHByZXR0eSBjb21wbGV4LCBhbmQgdGhhdCB0aGVyZSYjeDIwMTk7cyBzb21lIHBpZWNlIG9mIHRoYXQgZGFyayBzZWN0b3IgdGhhdCB3aW5kcyB1cCBpbiBib3VuZCBhdG9tcy4mI3gyMDFEOzwvcD5cXG48cD5UaGUgbm90aW9uIHRoYXQgPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnLzIwMTUwODIwLXRoZS1jYXNlLWZvci1jb21wbGV4LWRhcmstbWF0dGVyL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmRhcmsgbWF0dGVyIG1pZ2h0IGJlIGNvbXBsZXg8L2E+IGhhcyBnYWluZWQgdHJhY3Rpb24gaW4gcmVjZW50IHllYXJzLCBhaWRlZCBieSBhc3Ryb3BoeXNpY2FsIGFub21hbGllcyB0aGF0IGRvIG5vdCBnZWwgd2l0aCB0aGUgbG9uZy1yZWlnbmluZyBwcm9maWxlIG9mIGRhcmsgbWF0dGVyIGFzIHBhc3NpdmUsIHNsdWdnaXNoICYjeDIwMUM7d2Vha2x5IGludGVyYWN0aW5nIG1hc3NpdmUgcGFydGljbGVzLiYjeDIwMUQ7IFRoZXNlIGFub21hbGllcywgcGx1cyB0aGUgZmFpbHVyZSBvZiAmI3gyMDFDO1dJTVBzJiN4MjAxRDsgdG8gc2hvdyB1cCBpbiBleGhhdXN0aXZlIGV4cGVyaW1lbnRhbCBzZWFyY2hlcyBhbGwgb3ZlciB0aGUgd29ybGQsIGhhdmUgd2Vha2VuZWQgdGhlIFdJTVAgcGFyYWRpZ20sIGFuZCB1c2hlcmVkIGluIGEgbmV3LCBmcmVlLWZvci1hbGwgZXJhLCBpbiB3aGljaCB0aGUgbmF0dXJlIG9mIHRoZSBkYXJrIGJlYXN0IGlzIGFueWJvZHkmI3gyMDE5O3MgZ3Vlc3MuPC9wPlxcbjxwPlRoZSBmaWVsZCBzdGFydGVkIG9wZW5pbmcgdXAgYXJvdW5kIDIwMDgsIHdoZW4gYW4gZXhwZXJpbWVudCBjYWxsZWQgUEFNRUxBIGRldGVjdGVkIGFuIGV4Y2VzcyBvZiBwb3NpdHJvbnMgb3ZlciBlbGVjdHJvbnMgY29taW5nIGZyb20gc3BhY2UmI3gyMDE0O2FuIGFzeW1tZXRyeSB0aGF0IGZ1ZWxlZCBpbnRlcmVzdCBpbiAmI3gyMDFDOzxhIGhyZWY9XFxcImh0dHA6Ly9hcnhpdi5vcmcvYWJzLzA5MDEuNDExN1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmFzeW1tZXRyaWMgZGFyayBtYXR0ZXI8L2E+LCYjeDIwMUQ7IGEgbm93LXBvcHVsYXIgbW9kZWwgcHJvcG9zZWQgYnkgPGEgaHJlZj1cXFwiaHR0cDovL3d3dy10aGVvcnkubGJsLmdvdi93b3JkcHJlc3MvP3BhZ2VfaWQ9Njg1MVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkthdGhyeW4gWnVyZWs8L2E+IGFuZCBjb2xsYWJvcmF0b3JzLiBBdCB0aGUgdGltZSwgdGhlcmUgd2VyZSBmZXcgaWRlYXMgb3RoZXIgdGhhbiBXSU1QcyBpbiBwbGF5LiAmI3gyMDFDO1RoZXJlIHdlcmUgbW9kZWwtYnVpbGRlcnMgbGlrZSBtZSB3aG8gcmVhbGl6ZWQgdGhhdCBkYXJrIG1hdHRlciB3YXMganVzdCBleHRyYW9yZGluYXJpbHkgdW5kZXJkZXZlbG9wZWQgaW4gdGhpcyBkaXJlY3Rpb24sJiN4MjAxRDsgc2FpZCBadXJlaywgbm93IG9mIExhd3JlbmNlIEJlcmtlbGV5IE5hdGlvbmFsIExhYm9yYXRvcnkgaW4gQ2FsaWZvcm5pYS4gJiN4MjAxQztTbyB3ZSBkb3ZlIGluLiYjeDIwMUQ7PC9wPlxcbjxmaWd1cmUgY2xhc3M9XFxcIndwLWNhcHRpb24gbGFuZHNjYXBlIGFsaWdubm9uZSBmYWRlciByZWxhdGl2ZVxcXCI+PGltZyBjbGFzcz1cXFwic2l6ZS10ZXh0LWNvbHVtbi13aWR0aCB3cC1pbWFnZS0yMDIyMjU5XFxcIiBzcmM9XFxcImh0dHBzOi8vd3d3LndpcmVkLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxNi8wNS8wMjRfUHJvZkJ1bGxvY2stNjE1eDUwMC00ODJ4MzkyLmpwZ1xcXCIgYWx0PVxcXCJKYW1lcyBCdWxsb2NrIG9mIHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIElydmluZSwgc2VlcyBkYXJrIG1hdHRlciBhcyBwb3RlbnRpYWxseSBjb21wbGV4IGFuZCBzZWxmLWludGVyYWN0aW5nLCBidXQgbm90IG5lY2Vzc2FyaWx5IGNvbmNlbnRyYXRlZCBpbiB0aGluIGRpc2tzLlxcXCIgd2lkdGg9XFxcIjQ4MlxcXCI+PGZpZ2NhcHRpb24gY2xhc3M9XFxcIndwLWNhcHRpb24tdGV4dCBsaW5rLXVuZGVybGluZVxcXCI+SmFtZXMgQnVsbG9jayBvZiB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBJcnZpbmUsIHNlZXMgZGFyayBtYXR0ZXIgYXMgcG90ZW50aWFsbHkgY29tcGxleCBhbmQgc2VsZi1pbnRlcmFjdGluZywgYnV0IG5vdCBuZWNlc3NhcmlseSBjb25jZW50cmF0ZWQgaW4gdGhpbiBkaXNrcy48c3BhbiBjbGFzcz1cXFwiY3JlZGl0IGxpbmstdW5kZXJsaW5lLXNtXFxcIj5Kb25hdGhhbiBBbGNvcm4gZm9yIFF1YW50YSBNYWdhemluZTwvc3Bhbj48L2ZpZ2NhcHRpb24+PC9maWd1cmU+XFxuPHA+QW5vdGhlciB0cmlnZ2VyIGhhcyBiZWVuIHRoZSBkZW5zaXR5IG9mIGR3YXJmIGdhbGF4aWVzLiBXaGVuIHJlc2VhcmNoZXJzIHRyeSB0byBzaW11bGF0ZSB0aGVpciBmb3JtYXRpb24sIGR3YXJmIGdhbGF4aWVzIHR5cGljYWxseSB0dXJuIG91dCB0b28gZGVuc2UgaW4gdGhlaXIgY2VudGVycywgdW5sZXNzIHJlc2VhcmNoZXJzIGFzc3VtZSB0aGF0IGRhcmsgbWF0dGVyIHBhcnRpY2xlcyBpbnRlcmFjdCB3aXRoIG9uZSBhbm90aGVyIHZpYSBkYXJrIGZvcmNlcy4gQWRkIHRvbyBtdWNoIGludGVyYWN0aXZpdHksIGhvd2V2ZXIsIGFuZCB5b3UgbXVjayB1cCBzaW11bGF0aW9ucyBvZiBzdHJ1Y3R1cmUgZm9ybWF0aW9uIGluIHRoZSBlYXJseSB1bml2ZXJzZS4gJiN4MjAxQztXaGF0IHdlJiN4MjAxOTtyZSB0cnlpbmcgdG8gZG8gaXMgZmlndXJlIG91dCB3aGF0IGlzIGFsbG93ZWQsJiN4MjAxRDsgc2FpZCBCdWxsb2NrLCB3aG8gYnVpbGRzIHN1Y2ggc2ltdWxhdGlvbnMuIE1vc3QgbW9kZWxlcnMgYWRkIHdlYWsgaW50ZXJhY3Rpb25zIHRoYXQgZG9uJiN4MjAxOTt0IGFmZmVjdCB0aGUgaGFsbyBzaGFwZSBvZiBkYXJrIG1hdHRlci4gQnV0ICYjeDIwMUM7cmVtYXJrYWJseSwmI3gyMDFEOyBCdWxsb2NrIHNhaWQsICYjeDIwMUM7dGhlcmUgaXMgYSBjbGFzcyBvZiBkYXJrIG1hdHRlciB0aGF0IGFsbG93cyBmb3IgZGlza3MuJiN4MjAxRDsgSW4gdGhhdCBjYXNlLCBvbmx5IGEgdGlueSBmcmFjdGlvbiBvZiBkYXJrIG1hdHRlciBwYXJ0aWNsZXMgaW50ZXJhY3QsIGJ1dCB0aGV5IGRvIHNvIHN0cm9uZ2x5IGVub3VnaCB0byBkaXNzaXBhdGUgZW5lcmd5JiN4MjAxNDthbmQgdGhlbiBmb3JtIGRpc2tzLjwvcD5cXG48cD5SYW5kYWxsIGFuZCBoZXIgY29sbGFib3JhdG9ycyBKaUppIEZhbiwgQW5kcmV5IEthdHogYW5kIE1hdHRoZXcgUmVlY2UgbWFkZSB0aGVpciB3YXkgdG8gdGhpcyBpZGVhIGluIDIwMTMgYnkgdGhlIHNhbWUgcGF0aCBhcyBPb3J0OiBUaGV5IHdlcmUgdHJ5aW5nIHRvIGV4cGxhaW4gYW4gYXBwYXJlbnQgTWlsa3kgV2F5IGFub21hbHkuIEtub3duIGFzIHRoZSAmI3gyMDFDO0Zlcm1pIGxpbmUsJiN4MjAxRDsgaXQgd2FzIGFuIGV4Y2VzcyBvZiBnYW1tYSByYXlzIG9mIGEgY2VydGFpbiBmcmVxdWVuY3kgY29taW5nIGZyb20gdGhlIGdhbGFjdGljIGNlbnRlci4gJiN4MjAxQztPcmRpbmFyeSBkYXJrIG1hdHRlciB3b3VsZG4mI3gyMDE5O3QgYW5uaWhpbGF0ZSBlbm91Z2gmI3gyMDFEOyB0byBwcm9kdWNlIHRoZSBGZXJtaSBsaW5lLCBSYW5kYWxsIHNhaWQsICYjeDIwMUM7c28gd2UgdGhvdWdodCwgd2hhdCBpZiBpdCB3YXMgbXVjaCBkZW5zZXI/JiN4MjAxRDsgVGhlIGRhcmsgZGlzayB3YXMgcmVib3JuLiBUaGUgRmVybWkgbGluZSB2YW5pc2hlZCBhcyBtb3JlIGRhdGEgYWNjdW11bGF0ZWQsIGJ1dCB0aGUgZGlzayBpZGVhIHNlZW1lZCB3b3J0aCBleHBsb3JpbmcgYW55d2F5LiBJbiAyMDE0LCBSYW5kYWxsIGFuZCBSZWVjZSBoeXBvdGhlc2l6ZWQgdGhhdCB0aGUgZGlzayBtaWdodCBhY2NvdW50IGZvciBwb3NzaWJsZSAzMC0gdG8gMzUtbWlsbGlvbi15ZWFyIGludGVydmFscyBiZXR3ZWVuIGVzY2FsYXRlZCBtZXRlb3IgYW5kIGNvbWV0IGFjdGl2aXR5LCBhIHN0YXRpc3RpY2FsbHkgd2VhayBzaWduYWwgdGhhdCBzb21lIHNjaWVudGlzdHMgaGF2ZSB0ZW50YXRpdmVseSB0aWVkIHRvIHBlcmlvZGljIG1hc3MgZXh0aW5jdGlvbnMuIEVhY2ggdGltZSB0aGUgc29sYXIgc3lzdGVtIGJvYnMgdXAgb3IgZG93biB0aHJvdWdoIHRoZSBkYXJrIGRpc2sgb24gdGhlIE1pbGt5IFdheSBjYXJvdXNlbCwgdGhleSBhcmd1ZWQsIHRoZSBkaXNrJiN4MjAxOTtzIGdyYXZpdGF0aW9uYWwgZWZmZWN0IG1pZ2h0IGRlc3RhYmlsaXplIHJvY2tzIGFuZCBjb21ldHMgaW4gdGhlIE9vcnQgY2xvdWQmI3gyMDE0O2Egc2NyYXB5YXJkIG9uIHRoZSBvdXRza2lydHMgb2YgdGhlIHNvbGFyIHN5c3RlbSBuYW1lZCBmb3IgSmFuIE9vcnQuIFRoZXNlIG9iamVjdHMgd291bGQgZ28gaHVydGxpbmcgdG93YXJkIHRoZSBpbm5lciBzb2xhciBzeXN0ZW0sIHNvbWUgc3RyaWtpbmcgRWFydGguPC9wPlxcbjxwPkJ1dCBSYW5kYWxsIGFuZCBoZXIgdGVhbSBkaWQgb25seSBhIGN1cnNvcnkmI3gyMDE0O2FuZCBpbmNvcnJlY3QmI3gyMDE0O2FuYWx5c2lzIG9mIGhvdyBtdWNoIHJvb20gdGhlcmUgaXMgZm9yIGEgZGFyayBkaXNrIGluIHRoZSBNaWxreSBXYXkmI3gyMDE5O3MgbWFzcyBidWRnZXQsIGp1ZGdpbmcgYnkgdGhlIG1vdGlvbnMgb2Ygc3RhcnMuICYjeDIwMUM7VGhleSBtYWRlIHNvbWUga2luZCBvZiBvdXRyYWdlb3VzIGNsYWltcywmI3gyMDFEOyBCb3Z5IHNhaWQuPC9wPlxcbjxwPlJhbmRhbGwsIHdobyBzdGFuZHMgb3V0IChhY2NvcmRpbmcgdG8gUmVlY2UpIGZvciAmI3gyMDFDO2hlciBwZXJzaXN0ZW5jZSwmI3gyMDFEOyBwdXQgS3JhbWVyIG9uIHRoZSBjYXNlLCBzZWVraW5nIHRvIGFkZHJlc3MgdGhlIGNyaXRpY3MgYW5kLCBzaGUgc2FpZCwgJiN4MjAxQzt0byBpcm9uIG91dCBhbGwgdGhlIHdyaW5rbGVzJiN4MjAxRDsgaW4gdGhlIGFuYWx5c2lzIGJlZm9yZSBHYWlhIGRhdGEgYmVjb21lcyBhdmFpbGFibGUuIEhlciBhbmQgS3JhbWVyJiN4MjAxOTtzIG5ldyBhbmFseXNpcyBzaG93cyB0aGF0IHRoZSBkYXJrIGRpc2ssIGlmIGl0IGV4aXN0cywgY2Fubm90IGJlIGFzIGRlbnNlIGFzIGhlciB0ZWFtIGluaXRpYWxseSB0aG91Z2h0IHBvc3NpYmxlLiBCdXQgdGhlcmUgaXMgaW5kZWVkIHdpZ2dsZSByb29tIGZvciBhIHRoaW4gZGFyayBkaXNrIHlldCwgZHVlIGJvdGggdG8gaXRzIHBpbmNoaW5nIGVmZmVjdCBhbmQgdG8gYWRkaXRpb25hbCB1bmNlcnRhaW50eSBjYXVzZWQgYnkgYSBuZXQgZHJpZnQgaW4gdGhlIE1pbGt5IFdheSBzdGFycyB0aGF0IGhhdmUgYmVlbiBtb25pdG9yZWQgdGh1cyBmYXIuPC9wPlxcblxcblxcblxcbjxwPk5vdyB0aGVyZSYjeDIwMTk7cyBhIG5ldyBwcm9ibGVtLCA8YSBocmVmPVxcXCJodHRwOi8vaW9wc2NpZW5jZS5pb3Aub3JnL2FydGljbGUvMTAuMTA4OC8wMDA0LTYzN1gvODE0LzEvMTNcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5yYWlzZWQ8L2E+IGluIDxlbT5UaGUgQXN0cm9waHlzaWNhbCBKb3VybmFsPC9lbT4gYnkgPGEgaHJlZj1cXFwiaHR0cDovL2FzdHJvLmJlcmtlbGV5LmVkdS9mYWN1bHR5LXByb2ZpbGUvY2hyaXMtbWNrZWVcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5DaHJpcyBNY0tlZTwvYT4gb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgQmVya2VsZXksIGFuZCBjb2xsYWJvcmF0b3JzLiBNY0tlZSBjb25jZWRlcyB0aGF0IGEgdGhpbiBkYXJrIGRpc2sgY2FuIHN0aWxsIGJlIHNxdWVlemVkIGludG8gdGhlIE1pbGt5IFdheSYjeDIwMTk7cyBtYXNzIGJ1ZGdldC4gQnV0IHRoZSBkaXNrIG1pZ2h0IGJlIHNvIHRoaW4gdGhhdCBpdCB3b3VsZCBjb2xsYXBzZS4gQ2l0aW5nIHJlc2VhcmNoIGZyb20gdGhlIDE5NjBzIGFuZCAmI3gyMDE5OzcwcywgTWNLZWUgYW5kIGNvbGxlYWd1ZXMgYXJndWUgdGhhdCBkaXNrcyBjYW5ub3QgYmUgc2lnbmlmaWNhbnRseSB0aGlubmVyIHRoYW4gdGhlIGRpc2sgb2YgdmlzaWJsZSBnYXMgaW4gdGhlIE1pbGt5IFdheSB3aXRob3V0IGZyYWdtZW50aW5nLiAmI3gyMDFDO0l0IGlzIHBvc3NpYmxlIHRoYXQgdGhlIGRhcmsgbWF0dGVyIHRoZXkgY29uc2lkZXIgaGFzIHNvbWUgcHJvcGVydHkgdGhhdCBpcyBkaWZmZXJlbnQgZnJvbSBvcmRpbmFyeSBtYXR0ZXIgYW5kIHByZXZlbnRzIHRoaXMgZnJvbSBoYXBwZW5pbmcsIGJ1dCBJIGRvbiYjeDIwMTk7dCBrbm93IHdoYXQgdGhhdCBjb3VsZCBiZSwmI3gyMDFEOyBNY0tlZSBzYWlkLjwvcD5cXG48cD5SYW5kYWxsIGhhcyBub3QgeWV0IHBhcnJpZWQgdGhpcyBsYXRlc3QgYXR0YWNrLCBjYWxsaW5nIGl0ICYjeDIwMUM7YSB0cmlja3kgaXNzdWUmI3gyMDFEOyB0aGF0IGlzICYjeDIwMUM7dW5kZXIgY29uc2lkZXJhdGlvbiBub3cuJiN4MjAxRDsgU2hlIGhhcyBhbHNvIHRha2VuIG9uIHRoZSBwb2ludCByYWlzZWQgYnkgQm92eSYjeDIwMTQ7dGhhdCBhIGRpc2sgb2YgY2hhcmdlZCBkYXJrIGF0b21zIGlzIGlycmVsZXZhbnQgbmV4dCB0byB0aGUgbmF0dXJlIG9mIDk4IHBlcmNlbnQgb2YgZGFyayBtYXR0ZXIuIFNoZSBpcyBub3cgaW52ZXN0aWdhdGluZyB0aGUgcG9zc2liaWxpdHkgdGhhdCBhbGwgZGFyayBtYXR0ZXIgbWlnaHQgYmUgY2hhcmdlZCB1bmRlciB0aGUgc2FtZSBkYXJrIGZvcmNlLCBidXQgYmVjYXVzZSBvZiBhIHN1cnBsdXMgb2YgZGFyayBwcm90b25zIG92ZXIgZGFyayBlbGVjdHJvbnMsIG9ubHkgYSB0aW55IGZyYWN0aW9uIGJlY29tZSBib3VuZCBpbiBhdG9tcyBhbmQgd2luZCB1cCBpbiBhIGRpc2suIEluIHRoYXQgY2FzZSwgdGhlIGRpc2sgYW5kIGhhbG8gd291bGQgYmUgbWFkZSBvZiB0aGUgc2FtZSBpbmdyZWRpZW50cywgJiN4MjAxQzt3aGljaCB3b3VsZCBiZSBtb3JlIGVjb25vbWljYWwsJiN4MjAxRDsgc2hlIHNhaWQuICYjeDIwMUM7V2UgdGhvdWdodCB0aGF0IHdvdWxkIGJlIHJ1bGVkIG91dCwgYnV0IGl0IHdhc24mI3gyMDE5O3QuJiN4MjAxRDs8L3A+XFxuPHA+VGhlIGRhcmsgZGlzayBzdXJ2aXZlcywgZm9yIG5vdyYjeDIwMTQ7YSBzeW1ib2wgb2YgYWxsIHRoYXQgaXNuJiN4MjAxOTt0IGtub3duIGFib3V0IHRoZSBkYXJrIHNpZGUgb2YgdGhlIHVuaXZlcnNlLiAmI3gyMDFDO0kgdGhpbmsgaXQmI3gyMDE5O3MgdmVyeSwgdmVyeSBoZWFsdGh5IGZvciB0aGUgZmllbGQgdGhhdCB5b3UgaGF2ZSBwZW9wbGUgdGhpbmtpbmcgYWJvdXQgYWxsIGtpbmRzIG9mIGRpZmZlcmVudCBpZGVhcywmI3gyMDFEOyBzYWlkIEJ1bGxvY2suICYjeDIwMUM7QmVjYXVzZSBpdCYjeDIwMTk7cyBxdWl0ZSB0cnVlIHRoYXQgd2UgZG9uJiN4MjAxOTt0IGtub3cgd2hhdCB0aGUgaGVjayB0aGF0IGRhcmsgbWF0dGVyIGlzLCBhbmQgeW91IG5lZWQgdG8gYmUgb3Blbi1taW5kZWQgYWJvdXQgaXQuJiN4MjAxRDs8L3A+XFxuPHA+PGVtPjxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZy8yMDE2MDQxMi1kZWJhdGUtaW50ZW5zaWZpZXMtb3Zlci1kYXJrLWRpc2stdGhlb3J5L1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPk9yaWdpbmFsIHN0b3J5PC9hPiByZXByaW50ZWQgd2l0aCBwZXJtaXNzaW9uIGZyb20gPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+UXVhbnRhIE1hZ2F6aW5lPC9hPiwgYW4gZWRpdG9yaWFsbHkgaW5kZXBlbmRlbnQgcHVibGljYXRpb24gb2YgdGhlIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnNpbW9uc2ZvdW5kYXRpb24ub3JnXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+U2ltb25zIEZvdW5kYXRpb248L2E+IHdob3NlIG1pc3Npb24gaXMgdG8gZW5oYW5jZSBwdWJsaWMgdW5kZXJzdGFuZGluZyBvZiBzY2llbmNlIGJ5IGNvdmVyaW5nIHJlc2VhcmNoIGRldmVsb3BtZW50cyBhbmQgdHJlbmRzIGluIG1hdGhlbWF0aWNzIGFuZCB0aGUgcGh5c2ljYWwgYW5kIGxpZmUgc2NpZW5jZXMuPC9lbT48L3A+XFxuXFxuXFx0XFx0XFx0PGEgY2xhc3M9XFxcInZpc3VhbGx5LWhpZGRlbiBza2lwLXRvLXRleHQtbGluayBmb2N1c2FibGUgYmctd2hpdGVcXFwiIGhyZWY9XFxcImh0dHA6Ly93d3cud2lyZWQuY29tLzIwMTYvMDYvZGViYXRlLWludGVuc2lmaWVzLWRhcmstZGlzay10aGVvcnkvI3N0YXJ0LW9mLWNvbnRlbnRcXFwiPkdvIEJhY2sgdG8gVG9wLiBTa2lwIFRvOiBTdGFydCBvZiBBcnRpY2xlLjwvYT5cXG5cXG5cXHRcXHRcXHRcXG5cXHRcXHQ8L2FydGljbGU+XFxuXFxuXFx0XFx0PC9kaXY+XCIsXG5cdFx0XCJkYXRlUHVibGlzaGVkXCI6IFwiMjAxNi0wNi0wNCAwMDowMDowMFwiLFxuXHRcdFwiZG9tYWluXCI6IFwid3d3LndpcmVkLmNvbVwiLFxuXHRcdFwiZXhjZXJwdFwiOiBcIkluIDE5MzIsIHRoZSBEdXRjaCBhc3Ryb25vbWVyIEphbiBPb3J0IHRhbGxpZWQgdGhlIHN0YXJzIGluIHRoZSBNaWxreSBXYXkgYW5kIGZvdW5kIHRoYXQgdGhleSBjYW1lIHVwIHNob3J0LiBKdWRnaW5nIGJ5IHRoZSB3YXkgdGhlIHN0YXJzIGJvYiB1cCBhbmQgZG93biBsaWtlIGhvcnNlcyBvbiBhIGNhcm91c2VsIGFzIHRoZXkgZ28gYXJvdW5kJmhlbGxpcDtcIixcblx0XHRcImxlYWRJbWFnZVVybFwiOiBcImh0dHBzOi8vd3d3LndpcmVkLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxNi8wNS8wNjEwMTRfcmFuZGFsbF8xNjI3XzMxMDU3NV85MDQ1MTgtNjE1eDQxMC00ODJ4MzIxLmpwZ1wiLFxuXHRcdFwidGl0bGVcIjogXCJBIERpc2sgb2YgRGFyayBNYXR0ZXIgTWlnaHQgUnVuIFRocm91Z2ggT3VyIEdhbGF4eVwiLFxuXHRcdFwidXJsXCI6IFwiaHR0cDovL3d3dy53aXJlZC5jb20vMjAxNi8wNi9kZWJhdGUtaW50ZW5zaWZpZXMtZGFyay1kaXNrLXRoZW9yeS9cIixcblx0XHRcIl9pZFwiOiBcIjU3NTJlZTU1MjJhZmIyZDQwYjg1ZjI2N1wiXG5cdH07XG4iLCJhcHAuZmFjdG9yeSgnUGFnZXNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApe1xuXHR2YXIgUGFnZXNGYWN0b3J5ID0ge31cblxuXHRQYWdlc0ZhY3RvcnkuZ2V0U2F2ZWQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhZ2VzXCIpXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBQYWdlc0ZhY3Rvcnk7XG59KSIsImFwcC5mYWN0b3J5KCdQYXJzZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApe1xuXG5cdHZhciBQYXJzZXJGYWN0b3J5ID0ge307XG5cblx0UGFyc2VyRmFjdG9yeS5wYXJzZVVybCA9IGZ1bmN0aW9uKHVybCwgdXNlcmlkKSB7XG5cblx0XHR2YXIgZW5jb2RlZCA9IGVuY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuXHRcdC8vY29uc29sZS5sb2coXCJlbmNvZGVkOiBcIiwgZW5jb2RlZCk7XG5cdFx0cmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFyc2VyL1wiICsgZW5jb2RlZClcblx0XHQudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuXHRcdFx0Ly9yZXR1cm4gcmVzdWx0LmRhdGFcblx0XHRcdC8vY29uc29sZS5sb2coXCJwYXJzZXIgcmVzdWx0OiBcIiwgcmVzdWx0LmRhdGEpO1xuICAgICAgICAgICAgcmVzdWx0LmRhdGEudXNlcmlkID0gdXNlcmlkO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1c2VyaWQ6IFwiLCB1c2VyaWQpO1xuXHRcdFx0cmV0dXJuICRodHRwLnBvc3QoXCIvYXBpL3BhZ2VzXCIsIHJlc3VsdC5kYXRhKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcInBvc3QgcmVzcG9uc2U6IFwiLCByZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KVxuXHRcdH0pO1xuXHR9O1xuXG5cdHJldHVybiBQYXJzZXJGYWN0b3J5O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FydGljbGVEZXRhaWwnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHNjb3BlOiB7fSxcbiAgICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9hcnRpY2xlRGV0YWlsQ2FyZC9kZXRhaWwuaHRtbCcsXG4gICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGUpIHtcblxuICAgIH1cblxuICB9XG59KVxuIiwiYXBwLmRpcmVjdGl2ZSgnYmluZENvbXBpbGVkSHRtbCcsIFsnJGNvbXBpbGUnLCBmdW5jdGlvbigkY29tcGlsZSkge1xuICByZXR1cm4ge1xuICAgIHRlbXBsYXRlOiAnPGRpdj48L2Rpdj4nLFxuICAgIHNjb3BlOiB7XG4gICAgICByYXdIdG1sOiAnPWJpbmRDb21waWxlZEh0bWwnXG4gICAgfSxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbSkge1xuICAgICAgdmFyIGltZ3MgPSBbXTtcbiAgICAgIHNjb3BlLiR3YXRjaCgncmF3SHRtbCcsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcbiAgICAgICAgdmFyIG5ld0VsZW0gPSAkY29tcGlsZSh2YWx1ZSkoc2NvcGUuJHBhcmVudCk7XG4gICAgICAgIGVsZW0uY29udGVudHMoKS5yZW1vdmUoKTtcbiAgICAgICAgaW1ncyA9IG5ld0VsZW0uZmluZCgnaW1nJyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgaW1nc1tpXS5hZGRDbGFzcyA9ICdmbG9hdFJpZ2h0J1xuICAgICAgICB9XG4gICAgICAgIGVsZW0uYXBwZW5kKG5ld0VsZW0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufV0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUsICRtZFNpZGVuYXYsICRtZElua1JpcHBsZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcblxuICAgICAgICAgICAgc2NvcGUudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJG1kU2lkZW5hdihcImxlZnRcIikudG9nZ2xlKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnUGFyc2VyJywgc3RhdGU6ICdwYXJzZXInIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1BhZ2VzJywgc3RhdGU6ICdwYWdlcycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3NpZGViYXInLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRzY29wZToge30sXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvc2lkZWJhci9zaWRlYmFyLmh0bWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XG5cdFx0ICAgICQoXCIubWVudS11cFwiKS5jbGljayhmdW5jdGlvbigpe1xuXHRcdCAgICBcdGlmKCQodGhpcykuY3NzKCd0cmFuc2Zvcm0nKVx0IT09ICdub25lJyl7XG5cdFx0ICAgIFx0XHQkKHRoaXMpLmNzcyhcInRyYW5zZm9ybVwiLCBcIlwiKTtcblx0XHQgICAgXHRcdGlmKCQodGhpcykuYXR0cignaWQnKSA9PT0gJ3N1YnNjcmlwdGlvbnMtaWNvbicpXG5cdFx0ICAgIFx0XHRcdCQoJyNzdWJzY3JpcHRpb25zJykuc2hvdyg0MDApO1xuXHRcdCAgICBcdFx0aWYoJCh0aGlzKS5hdHRyKCdpZCcpID09PSAnZm9sZGVycy1pY29uJylcblx0XHQgICAgXHRcdFx0JCgnI2ZvbGRlcnMnKS5zaG93KDQwMCk7XG5cdFx0ICAgIFx0fVxuXHRcdCAgICBcdGVsc2V7XG5cdFx0XHRcdFx0JCh0aGlzKS5jc3MoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoMTgwZGVnKVwiKTtcblx0XHQgICAgXHRcdGlmKCQodGhpcykuYXR0cignaWQnKSA9PT0gJ3N1YnNjcmlwdGlvbnMtaWNvbicpXG5cdFx0ICAgIFx0XHRcdCQoJyNzdWJzY3JpcHRpb25zJykuaGlkZSg0MDApO1xuXHRcdCAgICBcdFx0aWYoJCh0aGlzKS5hdHRyKCdpZCcpID09PSAnZm9sZGVycy1pY29uJylcblx0XHQgICAgXHRcdFx0JCgnI2ZvbGRlcnMnKS5oaWRlKDQwMCk7XHRcdFx0XHRcblx0XHQgICAgXHR9XG5cdFx0XHR9KTtcblxuXHRcdH1cblx0fVxufSlcbiIsImFwcC5kaXJlY3RpdmUoJ3NwZWVkRGlhbCcsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgc2NvcGU6IHt9LFxuICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL3NwZWVkLWRpYWwvc3BlZWQtZGlhbC5odG1sJyxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xuICAgICAgc2NvcGUuaXNPcGVuID0gZmFsc2U7XG4gICAgICBzY29wZS5oZWxsbyA9IFwid29ybGRcIlxuICAgIH1cbiAgfVxufSlcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
