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

app.controller('dialogFormCtrl', function ($mdDialog) {
    // this.item = item;
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

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'app/common/directives/fullstack-logo/fullstack-logo.html'
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

app.directive('speedDial', function ($mdDialog) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: '/app/common/directives/speed-dial/speed-dial.html',
        link: function link(scope, element, attribute) {
            scope.isOpen = false;
            scope.count = 0;
            scope.hidden = false;
            scope.hover = false;
            scope.items = [{
                name: "Add URL",
                icon: "/icons/ic_add_white_36px.svg",
                direction: "top"
            }, {
                name: "Add Category",
                icon: "/icons/ic_playlist_add_white_36px.svg",
                direction: "top"
            }];

            scope.openDialog = function ($event, item) {
                $mdDialog.show({
                    clickOutSideToClose: true,
                    controller: 'dialogFormCtrl',
                    templateUrl: '/app/popup-dialog/popup-dialog.html',
                    targetEvent: $event
                });
            };
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJwYWdlcy9wYWdlcy5qcyIsInBhcnNlci9wYXJzZXIuanMiLCJwb3B1cC1kaWFsb2cvcG9wdXAtZGlhbG9nLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVEZXRhaWwuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVWaWV3LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9wYWdlcy5mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9wYXJzZXIuZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FydGljbGVEZXRhaWxDYXJkL2RldGFpbC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYmluZENvbXBpbGVkSHRtbC9iaW5kQ29tcGlsZWRIdG1sLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2lkZWJhci9zaWRlYmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc3BlZWQtZGlhbC9zcGVlZC1kaWFsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBLE9BQUEsR0FBQSxHQUFBLFFBQUEsTUFBQSxDQUFBLHVCQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEsc0JBQUEsU0FBQSxDQUFBLElBQUE7O0FBRUEsdUJBQUEsU0FBQSxDQUFBLEdBQUE7O0FBRUEsdUJBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsUUFBQSxDQUFBLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7O0FBWUEsSUFBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSwrQkFBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsZUFBQSxNQUFBLElBQUEsSUFBQSxNQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsS0FGQTs7OztBQU1BLGVBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNkJBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBO0FBQ0E7O0FBRUEsWUFBQSxZQUFBLGVBQUEsRUFBQSxFQUFBOzs7QUFHQTtBQUNBOzs7QUFHQSxjQUFBLGNBQUE7O0FBRUEsb0JBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7OztBQUlBLGdCQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxRQUFBLElBQUEsRUFBQSxRQUFBO0FBQ0EsYUFGQSxNQUVBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE9BQUE7QUFDQTtBQUNBLFNBVEE7QUFXQSxLQTVCQTtBQThCQSxDQXZDQTs7QUNmQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQSxhQUFBLFdBREE7QUFFQSxxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBOztBQU9BLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLGFBQUEsVUFEQTtBQUVBLHFCQUFBLG9DQUZBO0FBR0EsaUJBQUE7QUFDQSxxQkFBQSxpQkFBQSxrQkFBQSxFQUFBO0FBQ0EsdUJBQUEsbUJBQUEsY0FBQSxFQUFBO0FBQ0E7QUFIQSxTQUhBO0FBUUEsb0JBQUE7QUFSQSxLQUFBO0FBVUEsQ0FYQTs7QUFhQSxJQUFBLFVBQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLE9BQUEsR0FBQSxPQUFBO0FBQ0EsV0FBQSxLQUFBLEdBQUEsUUFBQSxLQUFBO0FBQ0EsV0FBQSxPQUFBLEdBQUEsUUFBQSxPQUFBO0FBQ0EsQ0FKQTs7QUNwQkEsQ0FBQSxZQUFBOztBQUVBOzs7O0FBR0EsUUFBQSxDQUFBLE9BQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsd0JBQUEsQ0FBQTs7QUFFQSxRQUFBLE1BQUEsUUFBQSxNQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsQ0FBQTs7QUFFQSxRQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFlBQUEsQ0FBQSxPQUFBLEVBQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHNCQUFBLENBQUE7QUFDQSxlQUFBLE9BQUEsRUFBQSxDQUFBLE9BQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLEtBSEE7Ozs7O0FBUUEsUUFBQSxRQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0Esc0JBQUEsb0JBREE7QUFFQSxxQkFBQSxtQkFGQTtBQUdBLHVCQUFBLHFCQUhBO0FBSUEsd0JBQUEsc0JBSkE7QUFLQSwwQkFBQSx3QkFMQTtBQU1BLHVCQUFBO0FBTkEsS0FBQTs7QUFTQSxRQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxZQUFBLGFBQUE7QUFDQSxpQkFBQSxZQUFBLGdCQURBO0FBRUEsaUJBQUEsWUFBQSxhQUZBO0FBR0EsaUJBQUEsWUFBQSxjQUhBO0FBSUEsaUJBQUEsWUFBQTtBQUpBLFNBQUE7QUFNQSxlQUFBO0FBQ0EsMkJBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsMkJBQUEsVUFBQSxDQUFBLFdBQUEsU0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBO0FBQ0EsdUJBQUEsR0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBO0FBQ0E7QUFKQSxTQUFBO0FBTUEsS0FiQTs7QUFlQSxRQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHNCQUFBLFlBQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxXQURBLEVBRUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxtQkFBQSxVQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsU0FKQSxDQUFBO0FBTUEsS0FQQTs7QUFTQSxRQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsT0FBQSxTQUFBLElBQUE7QUFDQSxvQkFBQSxNQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsdUJBQUEsVUFBQSxDQUFBLFlBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsSUFBQTtBQUNBOzs7O0FBSUEsYUFBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxRQUFBLElBQUE7QUFDQSxTQUZBOztBQUlBLGFBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsZ0JBQUEsS0FBQSxlQUFBLE1BQUEsZUFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLElBQUEsQ0FBQSxRQUFBLElBQUEsQ0FBQTtBQUNBOzs7OztBQUtBLG1CQUFBLE1BQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLElBQUE7QUFDQSxhQUZBLENBQUE7QUFJQSxTQXJCQTs7QUF1QkEsYUFBQSxLQUFBLEdBQUEsVUFBQSxX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O0FBSkEsaUJBQUE7QUFNQSxhQVBBO0FBU0E7QUE1QkEsS0FBQTtBQThCQSxDQS9CQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnbmdNYXRlcmlhbCddKTtcclxuXHJcbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcclxuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcclxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcclxuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxyXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcclxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxyXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cclxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXHJcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcclxuXHJcbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXHJcbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xyXG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxyXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xyXG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXHJcbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcclxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxyXG4gICAgICAgICAgICBpZiAodXNlcikge1xyXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSk7XHJcblxyXG59KTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlcycsIHtcclxuICAgICAgICB1cmw6ICcvYXJ0aWNsZXMnLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FydGljbGVzL2FydGljbGVzLmh0bWwnXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FydGljbGUnLCB7XHJcbiAgICAgICAgdXJsOiAnL2FydGljbGUnLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FydGljbGUtdmlldy9hcnRpY2xlLXZpZXcuaHRtbCcsXHJcbiAgICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgICAgY3VycmVudDogZnVuY3Rpb24oQXJ0aWNsZVZpZXdGYWN0b3J5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBBcnRpY2xlVmlld0ZhY3RvcnkuZ2V0QXJ0aWNsZUJ5SWQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBcnRpY2xlVmlld0N0cmwnXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5hcHAuY29udHJvbGxlcignQXJ0aWNsZVZpZXdDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBjdXJyZW50LCAkY29tcGlsZSkge1xyXG4gICRzY29wZS5jdXJyZW50ID0gY3VycmVudDtcclxuICAkc2NvcGUudGl0bGUgPSBjdXJyZW50LnRpdGxlO1xyXG4gICRzY29wZS5jb250ZW50ID0gY3VycmVudC5jb250ZW50O1xyXG59KTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxyXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xyXG5cclxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XHJcblxyXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xyXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcclxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXHJcbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xyXG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXHJcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXHJcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxyXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxyXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcclxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcclxuICAgIH0pO1xyXG5cclxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XHJcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XHJcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcclxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxyXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxyXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xyXG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xyXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcclxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XHJcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxyXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cclxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXHJcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cclxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxyXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXHJcblxyXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcclxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cclxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXHJcbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cclxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xyXG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xyXG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KTtcclxuXHJcbn0pKCk7XHJcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcclxuICAgICAgICB1cmw6ICcvJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9ob21lL2hvbWUuaHRtbCdcclxuICAgIH0pO1xyXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcclxuICAgICAgICB1cmw6ICcvbG9naW4nLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2xvZ2luL2xvZ2luLmh0bWwnLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgICAkc2NvcGUubG9naW4gPSB7fTtcclxuICAgICRzY29wZS5lcnJvciA9IG51bGw7XHJcblxyXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcclxuXHJcbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XHJcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcclxuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcclxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcclxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xyXG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG5cclxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XHJcblxyXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcclxuICAgIH07XHJcblxyXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKXtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BhZ2VzJywge1xyXG5cdCAgICB1cmw6ICcvcGFnZXMnLFxyXG5cdCAgICB0ZW1wbGF0ZVVybDogJ2FwcC9wYWdlcy9wYWdlcy5odG1sJywgLy9TdGlsbCBuZWVkIHRvIG1ha2VcclxuXHQgICAgY29udHJvbGxlcjogJ1BhZ2VzQ3RybCdcclxuXHR9KTtcclxuXHJcbn0pXHJcblxyXG5hcHAuY29udHJvbGxlcignUGFnZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBQYWdlc0ZhY3Rvcnkpe1xyXG5cclxuXHRQYWdlc0ZhY3RvcnkuZ2V0U2F2ZWQoKVxyXG5cdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHRcdCRzY29wZS5wYWdlcyA9IHJlc3BvbnNlO1xyXG5cdH0pXHJcblxyXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblxyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3BhcnNlcicsIHtcclxuICAgICAgICB1cmw6ICcvcGFyc2VyJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9wYXJzZXIvcGFyc2VyLmh0bWwnLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQYXJzZXJDdHJsJ1xyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdQYXJzZXJDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHN0YXRlLCBQYXJzZXJGYWN0b3J5LCBTZXNzaW9uKSB7XHJcblxyXG4gICAgJHNjb3BlLnBhcnNlVXJsID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiaW5zaWRlIHBhcnNlckN0cmwgcGFyc2VVcmw6IHNlc3Npb24gdXNlcjogXCIsIFNlc3Npb24udXNlci5faWQpO1xyXG4gICAgICAgIFBhcnNlckZhY3RvcnkucGFyc2VVcmwoJHNjb3BlLnVybCwgU2Vzc2lvbi51c2VyLl9pZClcclxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgJHNjb3BlLnBhcnNlZCA9IHJlc3BvbnNlO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfTtcclxuXHJcbn0pO1xyXG5cclxuXHJcbiIsImFwcC5jb250cm9sbGVyKCdkaWFsb2dGb3JtQ3RybCcsIGZ1bmN0aW9uKCRtZERpYWxvZykge1xyXG4gIC8vIHRoaXMuaXRlbSA9IGl0ZW07XHJcbn0pXHJcbiIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcclxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxyXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXHJcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xyXG4gICAgXTtcclxufSk7XHJcbiAiLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBncmVldGluZ3MgPSBbXHJcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxyXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxyXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXHJcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXHJcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcclxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXHJcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXHJcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXHJcbiAgICAgICAgJzpEJyxcclxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxyXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXHJcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXHJcbiAgICBdO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXHJcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KTtcclxuIiwiYXBwLmZhY3RvcnkoJ2FydGljbGVEZXRhaWxGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcclxuICB2YXIgZGV0YWlsT2JqID0ge307XHJcblxyXG4gIGRldGFpbE9iai5mZXRjaEFsbEJ5Q2F0ZWdvcnkgPSBmdW5jdGlvbihjYXRlZ29yeSkge1xyXG4gICAgLy8gcmV0dXJuIGFsbCB0aXRsZXMgYW5kIHN1bW1hcmllcyBhc3NvY2lhdGVkIHdpdGggY3VycmVudCBjYXRlZ29yeVxyXG4gIH07XHJcblxyXG4gIGRldGFpbE9iai5mZXRjaE9uZUJ5SWQgPSBmdW5jdGlvbihpZCkge1xyXG5cclxuICB9O1xyXG5cclxuICBkZXRhaWxPYmouYWRkQXJ0aWNsZSA9IGZ1bmN0aW9uKGNhdGVnb3J5KSB7XHJcbiAgICAvLyBhZGQgb25lIGFydGljbGUgdG8gY2F0ZWdvcnlcclxuICB9O1xyXG5cclxuICBkZXRhaWxPYmoucmVtb3ZlQXJ0aWNsZUJ5SUQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vIHJlbW92ZSBvbiBhcnRpY2xlIGJ5IElEXHJcbiAgfTtcclxuXHJcbiAgZGV0YWlsT2JqLnNhdmVBcnRpY2xlQnlVcmwgPSBmdW5jdGlvbih1cmwsIGNhdGVnb3J5KSB7XHJcbiAgICAvLyBkZWZhdWx0IHRvIGFsbCwgb3Igb3B0aW9uYWwgY2F0ZWdvcnlcclxuICB9XHJcblxyXG4gIHJldHVybiBkZXRhaWxPYmo7XHJcbn0pXHJcbiIsImFwcC5mYWN0b3J5KCdBcnRpY2xlVmlld0ZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHApIHtcclxuXHR2YXIgYXJ0aWNsZVZpZXdPYmogPSB7fTtcclxuXHJcblx0YXJ0aWNsZVZpZXdPYmouZ2V0QXJ0aWNsZUJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgIHJldHVybiB0ZW1wQXJ0aWNsZU9iajtcclxuXHR9O1xyXG5cclxuXHRhcnRpY2xlVmlld09iai5yZW1vdmVBcnRpY2xlQnlJZCA9IGZ1bmN0aW9uIChpZCkge1xyXG5cclxuXHR9O1xyXG5cclxuICBhcnRpY2xlVmlld09iai5hZGRBcnRpY2xlQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoaWQsIGNhdCkge1xyXG5cclxuICB9O1xyXG5cclxuXHRyZXR1cm4gYXJ0aWNsZVZpZXdPYmo7XHJcbn0pXHJcblxyXG5cclxudmFyIHRlbXBBcnRpY2xlT2JqID1cclxuICB7XHJcblx0XHRcIl9fdlwiOiAwLFxyXG5cdFx0XCJjb250ZW50XCI6IFwiPGRpdj48YXJ0aWNsZSBjbGFzcz1cXFwiY29udGVudCBsaW5rLXVuZGVybGluZSByZWxhdGl2ZSBib2R5LWNvcHlcXFwiPlxcblxcblxcdFxcdFxcdDxwPkluIDE5MzIsIHRoZSBEdXRjaCBhc3Ryb25vbWVyIEphbiBPb3J0IHRhbGxpZWQgdGhlIHN0YXJzIGluIHRoZSBNaWxreSBXYXkgYW5kIGZvdW5kIHRoYXQgdGhleSBjYW1lIHVwIHNob3J0LiBKdWRnaW5nIGJ5IHRoZSB3YXkgdGhlIHN0YXJzIGJvYiB1cCBhbmQgZG93biBsaWtlIGhvcnNlcyBvbiBhIGNhcm91c2VsIGFzIHRoZXkgZ28gYXJvdW5kIHRoZSBwbGFuZSBvZiB0aGUgZ2FsYXh5LCBPb3J0IGNhbGN1bGF0ZWQgdGhhdCB0aGVyZSBvdWdodCB0byBiZSB0d2ljZSBhcyBtdWNoIG1hdHRlciBncmF2aXRhdGlvbmFsbHkgcHJvcGVsbGluZyB0aGVtIGFzIGhlIGNvdWxkIHNlZS4gSGUgcG9zdHVsYXRlZCB0aGUgcHJlc2VuY2Ugb2YgaGlkZGVuICYjeDIwMUM7ZGFyayBtYXR0ZXImI3gyMDFEOyB0byBtYWtlIHVwIHRoZSBkaWZmZXJlbmNlIGFuZCBzdXJtaXNlZCB0aGF0IGl0IG11c3QgYmUgY29uY2VudHJhdGVkIGluIGEgZGlzayB0byBleHBsYWluIHRoZSBzdGFycyYjeDIwMTk7IG1vdGlvbnMuPC9wPlxcblxcblxcbjxwPkJ1dCBjcmVkaXQgZm9yIHRoZSBkaXNjb3Zlcnkgb2YgZGFyayBtYXR0ZXImI3gyMDE0O3RoZSBpbnZpc2libGUsIHVuaWRlbnRpZmllZCBzdHVmZiB0aGF0IGNvbXByaXNlcyBmaXZlLXNpeHRocyBvZiB0aGUgdW5pdmVyc2UmI3gyMDE5O3MgbWFzcyYjeDIwMTQ7dXN1YWxseSBnb2VzIHRvIHRoZSBTd2lzcy1BbWVyaWNhbiBhc3Ryb25vbWVyIEZyaXR6IFp3aWNreSwgd2hvIGluZmVycmVkIGl0cyBleGlzdGVuY2UgZnJvbSB0aGUgcmVsYXRpdmUgbW90aW9ucyBvZiBnYWxheGllcyBpbiAxOTMzLiBPb3J0IGlzIHBhc3NlZCBvdmVyIG9uIHRoZSBncm91bmRzIHRoYXQgaGUgd2FzIHRyYWlsaW5nIGEgZmFsc2UgY2x1ZS4gQnkgMjAwMCwgdXBkYXRlZCwgT29ydC1zdHlsZSBpbnZlbnRvcmllcyBvZiB0aGUgTWlsa3kgV2F5IGRldGVybWluZWQgdGhhdCBpdHMgJiN4MjAxQzttaXNzaW5nJiN4MjAxRDsgbWFzcyBjb25zaXN0cyBvZiBmYWludCBzdGFycywgZ2FzIGFuZCBkdXN0LCB3aXRoIG5vIG5lZWQgZm9yIGEgZGFyayBkaXNrLiBFaWdodHkgeWVhcnMgb2YgaGludHMgc3VnZ2VzdCB0aGF0IGRhcmsgbWF0dGVyLCB3aGF0ZXZlciBpdCBpcywgZm9ybXMgc3BoZXJpY2FsIGNsb3VkcyBjYWxsZWQgJiN4MjAxQztoYWxvcyYjeDIwMUQ7IGFyb3VuZCBnYWxheGllcy48L3A+XFxuPHA+T3Igc28gbW9zdCBkYXJrIG1hdHRlciBodW50ZXJzIGhhdmUgaXQuIFRob3VnaCBpdCBmZWxsIG91dCBvZiBmYXZvciwgdGhlIGRhcmsgZGlzayBpZGVhIG5ldmVyIGNvbXBsZXRlbHkgd2VudCBhd2F5LiBBbmQgcmVjZW50bHksIGl0IGhhcyBmb3VuZCBhIGhpZ2gtcHJvZmlsZSBjaGFtcGlvbiBpbiA8YSBocmVmPVxcXCJodHRwczovL3d3dy5waHlzaWNzLmhhcnZhcmQuZWR1L3Blb3BsZS9mYWNwYWdlcy9yYW5kYWxsXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+TGlzYSBSYW5kYWxsPC9hPiwgYSBwcm9mZXNzb3Igb2YgcGh5c2ljcyBhdCBIYXJ2YXJkIFVuaXZlcnNpdHksIHdobyBoYXMgcmVzY3VlZCB0aGUgZGlzayBmcm9tIHNjaWVudGlmaWMgb2JsaXZpb24gYW5kIGdpdmVuIGl0IGFuIGFjdGl2ZSByb2xlIG9uIHRoZSBnYWxhY3RpYyBzdGFnZS48L3A+XFxuPHA+U2luY2UgPGEgaHJlZj1cXFwiaHR0cDovL2FyeGl2Lm9yZy9wZGYvMTMwMy4xNTIxdjIucGRmXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+cHJvcG9zaW5nIHRoZSBtb2RlbDwvYT4gaW4gMjAxMywgUmFuZGFsbCBhbmQgaGVyIGNvbGxhYm9yYXRvcnMgaGF2ZSBhcmd1ZWQgdGhhdCBhIGRhcmsgZGlzayBtaWdodCBleHBsYWluIGdhbW1hIHJheXMgY29taW5nIGZyb20gdGhlIGdhbGFjdGljIGNlbnRlciwgdGhlIDxhIGhyZWY9XFxcImh0dHA6Ly93d3cubmF0dXJlLmNvbS9uYXR1cmUvam91cm5hbC92NTExL243NTExL2Z1bGwvbmF0dXJlMTM0ODEuaHRtbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPnBsYW5hciBkaXN0cmlidXRpb24gb2YgZHdhcmYgZ2FsYXhpZXM8L2E+IG9yYml0aW5nIHRoZSBBbmRyb21lZGEgZ2FsYXh5IGFuZCB0aGUgTWlsa3kgV2F5LCBhbmQgZXZlbiA8YSBocmVmPVxcXCJodHRwczovL3BoeXNpY3MuYXBzLm9yZy9mZWF0dXJlZC1hcnRpY2xlLXBkZi8xMC4xMTAzL1BoeXNSZXZMZXR0LjExMi4xNjEzMDFcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5wZXJpb2RpYyB1cHRpY2tzIG9mIGNvbWV0IGltcGFjdHM8L2E+IGFuZCBtYXNzIGV4dGluY3Rpb25zIG9uIEVhcnRoLCBkaXNjdXNzZWQgaW4gUmFuZGFsbCYjeDIwMTk7cyAyMDE1IHBvcHVsYXItc2NpZW5jZSBib29rLCA8ZW0+RGFyayBNYXR0ZXIgYW5kIHRoZSBEaW5vc2F1cnM8L2VtPi48L3A+XFxuPHA+QnV0IGFzdHJvcGh5c2ljaXN0cyB3aG8gZG8gaW52ZW50b3JpZXMgb2YgdGhlIE1pbGt5IFdheSBoYXZlIHByb3Rlc3RlZCwgYXJndWluZyB0aGF0IHRoZSBnYWxheHkmI3gyMDE5O3MgdG90YWwgbWFzcyBhbmQgdGhlIGJvYmJpbmcgbW90aW9ucyBvZiBpdHMgc3RhcnMgbWF0Y2ggdXAgdG9vIHdlbGwgdG8gbGVhdmUgcm9vbSBmb3IgYSBkYXJrIGRpc2suICYjeDIwMUM7SXQmI3gyMDE5O3MgbW9yZSBzdHJvbmdseSBjb25zdHJhaW5lZCB0aGFuIExpc2EgUmFuZGFsbCBwcmV0ZW5kcywmI3gyMDFEOyBzYWlkIDxhIGhyZWY9XFxcImh0dHA6Ly9hc3Ryby51dG9yb250by5jYS9+Ym92eS9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5KbyBCb3Z5PC9hPiwgYW4gYXN0cm9waHlzaWNpc3QgYXQgdGhlIFVuaXZlcnNpdHkgb2YgVG9yb250by48L3A+XFxuPHA+Tm93LCBSYW5kYWxsLCB3aG8gaGFzIGRldmlzZWQgaW5mbHVlbnRpYWwgaWRlYXMgYWJvdXQgc2V2ZXJhbCBvZiB0aGUgPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnLzIwMTUwODAzLXBoeXNpY3MtdGhlb3JpZXMtbWFwL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmJpZ2dlc3QgcXVlc3Rpb25zIGluIGZ1bmRhbWVudGFsIHBoeXNpY3M8L2E+LCBpcyBmaWdodGluZyBiYWNrLiBJbiA8YSBocmVmPVxcXCJodHRwOi8vYXJ4aXYub3JnL2Ficy8xNjA0LjAxNDA3XFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+YSBwYXBlcjwvYT4gcG9zdGVkIG9ubGluZSBsYXN0IHdlZWsgdGhhdCBoYXMgYmVlbiBhY2NlcHRlZCBmb3IgcHVibGljYXRpb24gaW4gPGVtPlRoZSBBc3Ryb3BoeXNpY2FsIEpvdXJuYWw8L2VtPiwgUmFuZGFsbCBhbmQgaGVyIHN0dWRlbnQsIEVyaWMgS3JhbWVyLCByZXBvcnQgYSBkaXNrLXNoYXBlZCBsb29waG9sZSBpbiB0aGUgTWlsa3kgV2F5IGFuYWx5c2lzOiAmI3gyMDFDO1RoZXJlIGlzIGFuIGltcG9ydGFudCBkZXRhaWwgdGhhdCBoYXMgc28gZmFyIGJlZW4gb3Zlcmxvb2tlZCwmI3gyMDFEOyB0aGV5IHdyaXRlLiAmI3gyMDFDO1RoZSBkaXNrIGNhbiBhY3R1YWxseSBtYWtlIHJvb20gZm9yIGl0c2VsZi4mI3gyMDFEOzwvcD5cXG48ZmlndXJlIGNsYXNzPVxcXCJ3cC1jYXB0aW9uIGxhbmRzY2FwZSBhbGlnbm5vbmUgZmFkZXIgcmVsYXRpdmVcXFwiPjxpbWcgY2xhc3M9XFxcInNpemUtdGV4dC1jb2x1bW4td2lkdGggd3AtaW1hZ2UtMjAyMjI1NVxcXCIgc3JjPVxcXCJodHRwczovL3d3dy53aXJlZC5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMTYvMDUvMDYxMDE0X3JhbmRhbGxfMTYyN18zMTA1NzVfOTA0NTE4LTYxNXg0MTAtNDgyeDMyMS5qcGdcXFwiIGFsdD1cXFwiMDYxMDE0X1JhbmRhbGxfMTYyNy5qcGdcXFwiIHdpZHRoPVxcXCI0ODJcXFwiPjxmaWdjYXB0aW9uIGNsYXNzPVxcXCJ3cC1jYXB0aW9uLXRleHQgbGluay11bmRlcmxpbmVcXFwiPkxpc2EgUmFuZGFsbCBvZiBIYXJ2YXJkIFVuaXZlcnNpdHkgaXMgYSBoaWdoLXByb2ZpbGUgc3VwcG9ydGVyIG9mIHRoZSBjb250cm92ZXJzaWFsIGRhcmsgZGlzayBpZGVhLjxzcGFuIGNsYXNzPVxcXCJjcmVkaXQgbGluay11bmRlcmxpbmUtc21cXFwiPlJvc2UgTGluY29sbi9IYXJ2YXJkIFVuaXZlcnNpdHk8L3NwYW4+PC9maWdjYXB0aW9uPjwvZmlndXJlPlxcbjxwPklmIHRoZXJlIGlzIGEgdGhpbiBkYXJrIGRpc2sgY291cnNpbmcgdGhyb3VnaCB0aGUgJiN4MjAxQzttaWRwbGFuZSYjeDIwMUQ7IG9mIHRoZSBnYWxheHksIFJhbmRhbGwgYW5kIEtyYW1lciBhcmd1ZSwgdGhlbiBpdCB3aWxsIGdyYXZpdGF0aW9uYWxseSBwaW5jaCBvdGhlciBtYXR0ZXIgaW53YXJkLCByZXN1bHRpbmcgaW4gYSBoaWdoZXIgZGVuc2l0eSBvZiBzdGFycywgZ2FzIGFuZCBkdXN0IGF0IHRoZSBtaWRwbGFuZSB0aGFuIGFib3ZlIGFuZCBiZWxvdy4gUmVzZWFyY2hlcnMgdHlwaWNhbGx5IGVzdGltYXRlIHRoZSB0b3RhbCB2aXNpYmxlIG1hc3Mgb2YgdGhlIE1pbGt5IFdheSBieSBleHRyYXBvbGF0aW5nIG91dHdhcmQgZnJvbSB0aGUgbWlkcGxhbmUgZGVuc2l0eTsgaWYgdGhlcmUmI3gyMDE5O3MgYSBwaW5jaGluZyBlZmZlY3QsIHRoZW4gdGhpcyBleHRyYXBvbGF0aW9uIGxlYWRzIHRvIGFuIG92ZXJlc3RpbWF0aW9uIG9mIHRoZSB2aXNpYmxlIG1hc3MsIG1ha2luZyBpdCBzZWVtIGFzIGlmIHRoZSBtYXNzIG1hdGNoZXMgdXAgdG8gdGhlIHN0YXJzJiN4MjAxOTsgbW90aW9ucy4gJiN4MjAxQztUaGF0JiN4MjAxOTtzIHRoZSByZWFzb24gd2h5IGEgbG90IG9mIHRoZXNlIHByZXZpb3VzIHN0dWRpZXMgZGlkIG5vdCBzZWUgZXZpZGVuY2UgZm9yIGEgZGFyayBkaXNrLCYjeDIwMUQ7IEtyYW1lciBzYWlkLiBIZSBhbmQgUmFuZGFsbCBmaW5kIHRoYXQgYSB0aGluIGRhcmsgZGlzayBpcyBwb3NzaWJsZSYjeDIwMTQ7YW5kIGluIG9uZSB3YXkgb2YgcmVkb2luZyB0aGUgYW5hbHlzaXMsIHNsaWdodGx5IGZhdm9yZWQgb3ZlciBubyBkYXJrIGRpc2suPC9wPlxcbjxwPiYjeDIwMUM7TGlzYSYjeDIwMTk7cyB3b3JrIGhhcyByZW9wZW5lZCB0aGUgY2FzZSwmI3gyMDFEOyBzYWlkIDxhIGhyZWY9XFxcImh0dHA6Ly9hc3Ryb25vbXkuc3dpbi5lZHUuYXUvc3RhZmYvY2ZseW5uLmh0bWxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5DaHJpcyBGbHlubjwvYT4gb2YgU3dpbmJ1cm5lIFVuaXZlcnNpdHkgb2YgVGVjaG5vbG9neSBpbiBNZWxib3VybmUsIEF1c3RyYWxpYSwgd2hvLCB3aXRoIEpvaGFuIEhvbG1iZXJnLCBjb25kdWN0ZWQgYSBzZXJpZXMgb2YgTWlsa3kgV2F5IGludmVudG9yaWVzIGluIHRoZSBlYXJseSBhdWdodHMgdGhhdCBzZWVtZWQgdG8gPGEgaHJlZj1cXFwiaHR0cDovL29ubGluZWxpYnJhcnkud2lsZXkuY29tL2RvaS8xMC4xMDQ2L2ouMTM2NS04NzExLjIwMDAuMDI5MDUueC9hYnN0cmFjdFxcXCI+cm9idXN0bHkgc3dlZXAgaXQgY2xlYW48L2E+IG9mIGEgZGFyayBkaXNrLjwvcD5cXG48cD5Cb3Z5IGRpc2FncmVlcy4gRXZlbiB0YWtpbmcgdGhlIHBpbmNoaW5nIGVmZmVjdCBpbnRvIGFjY291bnQsIGhlIGVzdGltYXRlcyB0aGF0IGF0IG1vc3QgMiBwZXJjZW50IG9mIHRoZSB0b3RhbCBhbW91bnQgb2YgZGFyayBtYXR0ZXIgY2FuIGxpZSBpbiBhIGRhcmsgZGlzaywgd2hpbGUgdGhlIHJlc3QgbXVzdCBmb3JtIGEgaGFsby4gJiN4MjAxQztJIHRoaW5rIG1vc3QgcGVvcGxlIHdhbnQgdG8gZmlndXJlIG91dCB3aGF0IDk4IHBlcmNlbnQgb2YgdGhlIGRhcmsgbWF0dGVyIGlzIGFib3V0LCBub3Qgd2hhdCAyIHBlcmNlbnQgb2YgaXQgaXMgYWJvdXQsJiN4MjAxRDsgaGUgc2FpZC48L3A+XFxuPHA+VGhlIGRlYmF0ZSYjeDIwMTQ7YW5kIHRoZSBmYXRlIG9mIHRoZSBkYXJrIGRpc2smI3gyMDE0O3dpbGwgcHJvYmFibHkgYmUgZGVjaWRlZCBzb29uLiBUaGUgRXVyb3BlYW4gU3BhY2UgQWdlbmN5JiN4MjAxOTtzIEdhaWEgc2F0ZWxsaXRlIGlzIGN1cnJlbnRseSBzdXJ2ZXlpbmcgdGhlIHBvc2l0aW9ucyBhbmQgdmVsb2NpdGllcyBvZiBvbmUgYmlsbGlvbiBzdGFycywgYW5kIGEgZGVmaW5pdGl2ZSBpbnZlbnRvcnkgb2YgdGhlIE1pbGt5IFdheSBjb3VsZCBiZSBjb21wbGV0ZWQgYXMgc29vbiBhcyBuZXh0IHN1bW1lci48L3A+XFxuPHA+VGhlIGRpc2NvdmVyeSBvZiBhIGRhcmsgZGlzaywgb2YgYW55IHNpemUsIHdvdWxkIGJlIGVub3Jtb3VzbHkgcmV2ZWFsaW5nLiBJZiBvbmUgZXhpc3RzLCBkYXJrIG1hdHRlciBpcyBmYXIgbW9yZSBjb21wbGV4IHRoYW4gcmVzZWFyY2hlcnMgaGF2ZSBsb25nIHRob3VnaHQuIE1hdHRlciBzZXR0bGVzIGludG8gYSBkaXNrIHNoYXBlIG9ubHkgaWYgaXQgaXMgYWJsZSB0byBzaGVkIGVuZXJneSwgYW5kIHRoZSBlYXNpZXN0IHdheSBmb3IgaXQgdG8gc2hlZCBzdWZmaWNpZW50IGVuZXJneSBpcyBpZiBpdCBmb3JtcyBhdG9tcy4gVGhlIGV4aXN0ZW5jZSBvZiBkYXJrIGF0b21zIHdvdWxkIG1lYW4gZGFyayBwcm90b25zIGFuZCBkYXJrIGVsZWN0cm9ucyB0aGF0IGFyZSBjaGFyZ2VkIGluIGEgc2ltaWxhciBzdHlsZSBhcyB2aXNpYmxlIHByb3RvbnMgYW5kIGVsZWN0cm9ucywgaW50ZXJhY3Rpbmcgd2l0aCBlYWNoIG90aGVyIHZpYSBhIGRhcmsgZm9yY2UgdGhhdCBpcyBjb252ZXllZCBieSBkYXJrIHBob3RvbnMuIEV2ZW4gaWYgOTggcGVyY2VudCBvZiBkYXJrIG1hdHRlciBpcyBpbmVydCwgYW5kIGZvcm1zIGhhbG9zLCB0aGUgZXhpc3RlbmNlIG9mIGV2ZW4gYSB0aGluIGRhcmsgZGlzayB3b3VsZCBpbXBseSBhIHJpY2ggJiN4MjAxQztkYXJrIHNlY3RvciYjeDIwMUQ7IG9mIHVua25vd24gcGFydGljbGVzIGFzIGRpdmVyc2UsIHBlcmhhcHMsIGFzIHRoZSB2aXNpYmxlIHVuaXZlcnNlLiAmI3gyMDFDO05vcm1hbCBtYXR0ZXIgaXMgcHJldHR5IGNvbXBsZXg7IHRoZXJlJiN4MjAxOTtzIHN0dWZmIHRoYXQgcGxheXMgYSByb2xlIGluIGF0b21zIGFuZCB0aGVyZSYjeDIwMTk7cyBzdHVmZiB0aGF0IGRvZXNuJiN4MjAxOTt0LCYjeDIwMUQ7IHNhaWQgPGEgaHJlZj1cXFwiaHR0cDovL3d3dy5waHlzaWNzLnVjaS5lZHUvfmJ1bGxvY2svXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+SmFtZXMgQnVsbG9jazwvYT4sIGFuIGFzdHJvcGh5c2ljaXN0IGF0IHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIElydmluZS4gJiN4MjAxQztTbyBpdCYjeDIwMTk7cyBub3QgY3JhenkgdG8gaW1hZ2luZSB0aGF0IHRoZSBvdGhlciBmaXZlLXNpeHRocyBbb2YgdGhlIG1hdHRlciBpbiB0aGUgdW5pdmVyc2VdIGlzIHByZXR0eSBjb21wbGV4LCBhbmQgdGhhdCB0aGVyZSYjeDIwMTk7cyBzb21lIHBpZWNlIG9mIHRoYXQgZGFyayBzZWN0b3IgdGhhdCB3aW5kcyB1cCBpbiBib3VuZCBhdG9tcy4mI3gyMDFEOzwvcD5cXG48cD5UaGUgbm90aW9uIHRoYXQgPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnLzIwMTUwODIwLXRoZS1jYXNlLWZvci1jb21wbGV4LWRhcmstbWF0dGVyL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmRhcmsgbWF0dGVyIG1pZ2h0IGJlIGNvbXBsZXg8L2E+IGhhcyBnYWluZWQgdHJhY3Rpb24gaW4gcmVjZW50IHllYXJzLCBhaWRlZCBieSBhc3Ryb3BoeXNpY2FsIGFub21hbGllcyB0aGF0IGRvIG5vdCBnZWwgd2l0aCB0aGUgbG9uZy1yZWlnbmluZyBwcm9maWxlIG9mIGRhcmsgbWF0dGVyIGFzIHBhc3NpdmUsIHNsdWdnaXNoICYjeDIwMUM7d2Vha2x5IGludGVyYWN0aW5nIG1hc3NpdmUgcGFydGljbGVzLiYjeDIwMUQ7IFRoZXNlIGFub21hbGllcywgcGx1cyB0aGUgZmFpbHVyZSBvZiAmI3gyMDFDO1dJTVBzJiN4MjAxRDsgdG8gc2hvdyB1cCBpbiBleGhhdXN0aXZlIGV4cGVyaW1lbnRhbCBzZWFyY2hlcyBhbGwgb3ZlciB0aGUgd29ybGQsIGhhdmUgd2Vha2VuZWQgdGhlIFdJTVAgcGFyYWRpZ20sIGFuZCB1c2hlcmVkIGluIGEgbmV3LCBmcmVlLWZvci1hbGwgZXJhLCBpbiB3aGljaCB0aGUgbmF0dXJlIG9mIHRoZSBkYXJrIGJlYXN0IGlzIGFueWJvZHkmI3gyMDE5O3MgZ3Vlc3MuPC9wPlxcbjxwPlRoZSBmaWVsZCBzdGFydGVkIG9wZW5pbmcgdXAgYXJvdW5kIDIwMDgsIHdoZW4gYW4gZXhwZXJpbWVudCBjYWxsZWQgUEFNRUxBIGRldGVjdGVkIGFuIGV4Y2VzcyBvZiBwb3NpdHJvbnMgb3ZlciBlbGVjdHJvbnMgY29taW5nIGZyb20gc3BhY2UmI3gyMDE0O2FuIGFzeW1tZXRyeSB0aGF0IGZ1ZWxlZCBpbnRlcmVzdCBpbiAmI3gyMDFDOzxhIGhyZWY9XFxcImh0dHA6Ly9hcnhpdi5vcmcvYWJzLzA5MDEuNDExN1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPmFzeW1tZXRyaWMgZGFyayBtYXR0ZXI8L2E+LCYjeDIwMUQ7IGEgbm93LXBvcHVsYXIgbW9kZWwgcHJvcG9zZWQgYnkgPGEgaHJlZj1cXFwiaHR0cDovL3d3dy10aGVvcnkubGJsLmdvdi93b3JkcHJlc3MvP3BhZ2VfaWQ9Njg1MVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkthdGhyeW4gWnVyZWs8L2E+IGFuZCBjb2xsYWJvcmF0b3JzLiBBdCB0aGUgdGltZSwgdGhlcmUgd2VyZSBmZXcgaWRlYXMgb3RoZXIgdGhhbiBXSU1QcyBpbiBwbGF5LiAmI3gyMDFDO1RoZXJlIHdlcmUgbW9kZWwtYnVpbGRlcnMgbGlrZSBtZSB3aG8gcmVhbGl6ZWQgdGhhdCBkYXJrIG1hdHRlciB3YXMganVzdCBleHRyYW9yZGluYXJpbHkgdW5kZXJkZXZlbG9wZWQgaW4gdGhpcyBkaXJlY3Rpb24sJiN4MjAxRDsgc2FpZCBadXJlaywgbm93IG9mIExhd3JlbmNlIEJlcmtlbGV5IE5hdGlvbmFsIExhYm9yYXRvcnkgaW4gQ2FsaWZvcm5pYS4gJiN4MjAxQztTbyB3ZSBkb3ZlIGluLiYjeDIwMUQ7PC9wPlxcbjxmaWd1cmUgY2xhc3M9XFxcIndwLWNhcHRpb24gbGFuZHNjYXBlIGFsaWdubm9uZSBmYWRlciByZWxhdGl2ZVxcXCI+PGltZyBjbGFzcz1cXFwic2l6ZS10ZXh0LWNvbHVtbi13aWR0aCB3cC1pbWFnZS0yMDIyMjU5XFxcIiBzcmM9XFxcImh0dHBzOi8vd3d3LndpcmVkLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxNi8wNS8wMjRfUHJvZkJ1bGxvY2stNjE1eDUwMC00ODJ4MzkyLmpwZ1xcXCIgYWx0PVxcXCJKYW1lcyBCdWxsb2NrIG9mIHRoZSBVbml2ZXJzaXR5IG9mIENhbGlmb3JuaWEsIElydmluZSwgc2VlcyBkYXJrIG1hdHRlciBhcyBwb3RlbnRpYWxseSBjb21wbGV4IGFuZCBzZWxmLWludGVyYWN0aW5nLCBidXQgbm90IG5lY2Vzc2FyaWx5IGNvbmNlbnRyYXRlZCBpbiB0aGluIGRpc2tzLlxcXCIgd2lkdGg9XFxcIjQ4MlxcXCI+PGZpZ2NhcHRpb24gY2xhc3M9XFxcIndwLWNhcHRpb24tdGV4dCBsaW5rLXVuZGVybGluZVxcXCI+SmFtZXMgQnVsbG9jayBvZiB0aGUgVW5pdmVyc2l0eSBvZiBDYWxpZm9ybmlhLCBJcnZpbmUsIHNlZXMgZGFyayBtYXR0ZXIgYXMgcG90ZW50aWFsbHkgY29tcGxleCBhbmQgc2VsZi1pbnRlcmFjdGluZywgYnV0IG5vdCBuZWNlc3NhcmlseSBjb25jZW50cmF0ZWQgaW4gdGhpbiBkaXNrcy48c3BhbiBjbGFzcz1cXFwiY3JlZGl0IGxpbmstdW5kZXJsaW5lLXNtXFxcIj5Kb25hdGhhbiBBbGNvcm4gZm9yIFF1YW50YSBNYWdhemluZTwvc3Bhbj48L2ZpZ2NhcHRpb24+PC9maWd1cmU+XFxuPHA+QW5vdGhlciB0cmlnZ2VyIGhhcyBiZWVuIHRoZSBkZW5zaXR5IG9mIGR3YXJmIGdhbGF4aWVzLiBXaGVuIHJlc2VhcmNoZXJzIHRyeSB0byBzaW11bGF0ZSB0aGVpciBmb3JtYXRpb24sIGR3YXJmIGdhbGF4aWVzIHR5cGljYWxseSB0dXJuIG91dCB0b28gZGVuc2UgaW4gdGhlaXIgY2VudGVycywgdW5sZXNzIHJlc2VhcmNoZXJzIGFzc3VtZSB0aGF0IGRhcmsgbWF0dGVyIHBhcnRpY2xlcyBpbnRlcmFjdCB3aXRoIG9uZSBhbm90aGVyIHZpYSBkYXJrIGZvcmNlcy4gQWRkIHRvbyBtdWNoIGludGVyYWN0aXZpdHksIGhvd2V2ZXIsIGFuZCB5b3UgbXVjayB1cCBzaW11bGF0aW9ucyBvZiBzdHJ1Y3R1cmUgZm9ybWF0aW9uIGluIHRoZSBlYXJseSB1bml2ZXJzZS4gJiN4MjAxQztXaGF0IHdlJiN4MjAxOTtyZSB0cnlpbmcgdG8gZG8gaXMgZmlndXJlIG91dCB3aGF0IGlzIGFsbG93ZWQsJiN4MjAxRDsgc2FpZCBCdWxsb2NrLCB3aG8gYnVpbGRzIHN1Y2ggc2ltdWxhdGlvbnMuIE1vc3QgbW9kZWxlcnMgYWRkIHdlYWsgaW50ZXJhY3Rpb25zIHRoYXQgZG9uJiN4MjAxOTt0IGFmZmVjdCB0aGUgaGFsbyBzaGFwZSBvZiBkYXJrIG1hdHRlci4gQnV0ICYjeDIwMUM7cmVtYXJrYWJseSwmI3gyMDFEOyBCdWxsb2NrIHNhaWQsICYjeDIwMUM7dGhlcmUgaXMgYSBjbGFzcyBvZiBkYXJrIG1hdHRlciB0aGF0IGFsbG93cyBmb3IgZGlza3MuJiN4MjAxRDsgSW4gdGhhdCBjYXNlLCBvbmx5IGEgdGlueSBmcmFjdGlvbiBvZiBkYXJrIG1hdHRlciBwYXJ0aWNsZXMgaW50ZXJhY3QsIGJ1dCB0aGV5IGRvIHNvIHN0cm9uZ2x5IGVub3VnaCB0byBkaXNzaXBhdGUgZW5lcmd5JiN4MjAxNDthbmQgdGhlbiBmb3JtIGRpc2tzLjwvcD5cXG48cD5SYW5kYWxsIGFuZCBoZXIgY29sbGFib3JhdG9ycyBKaUppIEZhbiwgQW5kcmV5IEthdHogYW5kIE1hdHRoZXcgUmVlY2UgbWFkZSB0aGVpciB3YXkgdG8gdGhpcyBpZGVhIGluIDIwMTMgYnkgdGhlIHNhbWUgcGF0aCBhcyBPb3J0OiBUaGV5IHdlcmUgdHJ5aW5nIHRvIGV4cGxhaW4gYW4gYXBwYXJlbnQgTWlsa3kgV2F5IGFub21hbHkuIEtub3duIGFzIHRoZSAmI3gyMDFDO0Zlcm1pIGxpbmUsJiN4MjAxRDsgaXQgd2FzIGFuIGV4Y2VzcyBvZiBnYW1tYSByYXlzIG9mIGEgY2VydGFpbiBmcmVxdWVuY3kgY29taW5nIGZyb20gdGhlIGdhbGFjdGljIGNlbnRlci4gJiN4MjAxQztPcmRpbmFyeSBkYXJrIG1hdHRlciB3b3VsZG4mI3gyMDE5O3QgYW5uaWhpbGF0ZSBlbm91Z2gmI3gyMDFEOyB0byBwcm9kdWNlIHRoZSBGZXJtaSBsaW5lLCBSYW5kYWxsIHNhaWQsICYjeDIwMUM7c28gd2UgdGhvdWdodCwgd2hhdCBpZiBpdCB3YXMgbXVjaCBkZW5zZXI/JiN4MjAxRDsgVGhlIGRhcmsgZGlzayB3YXMgcmVib3JuLiBUaGUgRmVybWkgbGluZSB2YW5pc2hlZCBhcyBtb3JlIGRhdGEgYWNjdW11bGF0ZWQsIGJ1dCB0aGUgZGlzayBpZGVhIHNlZW1lZCB3b3J0aCBleHBsb3JpbmcgYW55d2F5LiBJbiAyMDE0LCBSYW5kYWxsIGFuZCBSZWVjZSBoeXBvdGhlc2l6ZWQgdGhhdCB0aGUgZGlzayBtaWdodCBhY2NvdW50IGZvciBwb3NzaWJsZSAzMC0gdG8gMzUtbWlsbGlvbi15ZWFyIGludGVydmFscyBiZXR3ZWVuIGVzY2FsYXRlZCBtZXRlb3IgYW5kIGNvbWV0IGFjdGl2aXR5LCBhIHN0YXRpc3RpY2FsbHkgd2VhayBzaWduYWwgdGhhdCBzb21lIHNjaWVudGlzdHMgaGF2ZSB0ZW50YXRpdmVseSB0aWVkIHRvIHBlcmlvZGljIG1hc3MgZXh0aW5jdGlvbnMuIEVhY2ggdGltZSB0aGUgc29sYXIgc3lzdGVtIGJvYnMgdXAgb3IgZG93biB0aHJvdWdoIHRoZSBkYXJrIGRpc2sgb24gdGhlIE1pbGt5IFdheSBjYXJvdXNlbCwgdGhleSBhcmd1ZWQsIHRoZSBkaXNrJiN4MjAxOTtzIGdyYXZpdGF0aW9uYWwgZWZmZWN0IG1pZ2h0IGRlc3RhYmlsaXplIHJvY2tzIGFuZCBjb21ldHMgaW4gdGhlIE9vcnQgY2xvdWQmI3gyMDE0O2Egc2NyYXB5YXJkIG9uIHRoZSBvdXRza2lydHMgb2YgdGhlIHNvbGFyIHN5c3RlbSBuYW1lZCBmb3IgSmFuIE9vcnQuIFRoZXNlIG9iamVjdHMgd291bGQgZ28gaHVydGxpbmcgdG93YXJkIHRoZSBpbm5lciBzb2xhciBzeXN0ZW0sIHNvbWUgc3RyaWtpbmcgRWFydGguPC9wPlxcbjxwPkJ1dCBSYW5kYWxsIGFuZCBoZXIgdGVhbSBkaWQgb25seSBhIGN1cnNvcnkmI3gyMDE0O2FuZCBpbmNvcnJlY3QmI3gyMDE0O2FuYWx5c2lzIG9mIGhvdyBtdWNoIHJvb20gdGhlcmUgaXMgZm9yIGEgZGFyayBkaXNrIGluIHRoZSBNaWxreSBXYXkmI3gyMDE5O3MgbWFzcyBidWRnZXQsIGp1ZGdpbmcgYnkgdGhlIG1vdGlvbnMgb2Ygc3RhcnMuICYjeDIwMUM7VGhleSBtYWRlIHNvbWUga2luZCBvZiBvdXRyYWdlb3VzIGNsYWltcywmI3gyMDFEOyBCb3Z5IHNhaWQuPC9wPlxcbjxwPlJhbmRhbGwsIHdobyBzdGFuZHMgb3V0IChhY2NvcmRpbmcgdG8gUmVlY2UpIGZvciAmI3gyMDFDO2hlciBwZXJzaXN0ZW5jZSwmI3gyMDFEOyBwdXQgS3JhbWVyIG9uIHRoZSBjYXNlLCBzZWVraW5nIHRvIGFkZHJlc3MgdGhlIGNyaXRpY3MgYW5kLCBzaGUgc2FpZCwgJiN4MjAxQzt0byBpcm9uIG91dCBhbGwgdGhlIHdyaW5rbGVzJiN4MjAxRDsgaW4gdGhlIGFuYWx5c2lzIGJlZm9yZSBHYWlhIGRhdGEgYmVjb21lcyBhdmFpbGFibGUuIEhlciBhbmQgS3JhbWVyJiN4MjAxOTtzIG5ldyBhbmFseXNpcyBzaG93cyB0aGF0IHRoZSBkYXJrIGRpc2ssIGlmIGl0IGV4aXN0cywgY2Fubm90IGJlIGFzIGRlbnNlIGFzIGhlciB0ZWFtIGluaXRpYWxseSB0aG91Z2h0IHBvc3NpYmxlLiBCdXQgdGhlcmUgaXMgaW5kZWVkIHdpZ2dsZSByb29tIGZvciBhIHRoaW4gZGFyayBkaXNrIHlldCwgZHVlIGJvdGggdG8gaXRzIHBpbmNoaW5nIGVmZmVjdCBhbmQgdG8gYWRkaXRpb25hbCB1bmNlcnRhaW50eSBjYXVzZWQgYnkgYSBuZXQgZHJpZnQgaW4gdGhlIE1pbGt5IFdheSBzdGFycyB0aGF0IGhhdmUgYmVlbiBtb25pdG9yZWQgdGh1cyBmYXIuPC9wPlxcblxcblxcblxcbjxwPk5vdyB0aGVyZSYjeDIwMTk7cyBhIG5ldyBwcm9ibGVtLCA8YSBocmVmPVxcXCJodHRwOi8vaW9wc2NpZW5jZS5pb3Aub3JnL2FydGljbGUvMTAuMTA4OC8wMDA0LTYzN1gvODE0LzEvMTNcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5yYWlzZWQ8L2E+IGluIDxlbT5UaGUgQXN0cm9waHlzaWNhbCBKb3VybmFsPC9lbT4gYnkgPGEgaHJlZj1cXFwiaHR0cDovL2FzdHJvLmJlcmtlbGV5LmVkdS9mYWN1bHR5LXByb2ZpbGUvY2hyaXMtbWNrZWVcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5DaHJpcyBNY0tlZTwvYT4gb2YgdGhlIFVuaXZlcnNpdHkgb2YgQ2FsaWZvcm5pYSwgQmVya2VsZXksIGFuZCBjb2xsYWJvcmF0b3JzLiBNY0tlZSBjb25jZWRlcyB0aGF0IGEgdGhpbiBkYXJrIGRpc2sgY2FuIHN0aWxsIGJlIHNxdWVlemVkIGludG8gdGhlIE1pbGt5IFdheSYjeDIwMTk7cyBtYXNzIGJ1ZGdldC4gQnV0IHRoZSBkaXNrIG1pZ2h0IGJlIHNvIHRoaW4gdGhhdCBpdCB3b3VsZCBjb2xsYXBzZS4gQ2l0aW5nIHJlc2VhcmNoIGZyb20gdGhlIDE5NjBzIGFuZCAmI3gyMDE5OzcwcywgTWNLZWUgYW5kIGNvbGxlYWd1ZXMgYXJndWUgdGhhdCBkaXNrcyBjYW5ub3QgYmUgc2lnbmlmaWNhbnRseSB0aGlubmVyIHRoYW4gdGhlIGRpc2sgb2YgdmlzaWJsZSBnYXMgaW4gdGhlIE1pbGt5IFdheSB3aXRob3V0IGZyYWdtZW50aW5nLiAmI3gyMDFDO0l0IGlzIHBvc3NpYmxlIHRoYXQgdGhlIGRhcmsgbWF0dGVyIHRoZXkgY29uc2lkZXIgaGFzIHNvbWUgcHJvcGVydHkgdGhhdCBpcyBkaWZmZXJlbnQgZnJvbSBvcmRpbmFyeSBtYXR0ZXIgYW5kIHByZXZlbnRzIHRoaXMgZnJvbSBoYXBwZW5pbmcsIGJ1dCBJIGRvbiYjeDIwMTk7dCBrbm93IHdoYXQgdGhhdCBjb3VsZCBiZSwmI3gyMDFEOyBNY0tlZSBzYWlkLjwvcD5cXG48cD5SYW5kYWxsIGhhcyBub3QgeWV0IHBhcnJpZWQgdGhpcyBsYXRlc3QgYXR0YWNrLCBjYWxsaW5nIGl0ICYjeDIwMUM7YSB0cmlja3kgaXNzdWUmI3gyMDFEOyB0aGF0IGlzICYjeDIwMUM7dW5kZXIgY29uc2lkZXJhdGlvbiBub3cuJiN4MjAxRDsgU2hlIGhhcyBhbHNvIHRha2VuIG9uIHRoZSBwb2ludCByYWlzZWQgYnkgQm92eSYjeDIwMTQ7dGhhdCBhIGRpc2sgb2YgY2hhcmdlZCBkYXJrIGF0b21zIGlzIGlycmVsZXZhbnQgbmV4dCB0byB0aGUgbmF0dXJlIG9mIDk4IHBlcmNlbnQgb2YgZGFyayBtYXR0ZXIuIFNoZSBpcyBub3cgaW52ZXN0aWdhdGluZyB0aGUgcG9zc2liaWxpdHkgdGhhdCBhbGwgZGFyayBtYXR0ZXIgbWlnaHQgYmUgY2hhcmdlZCB1bmRlciB0aGUgc2FtZSBkYXJrIGZvcmNlLCBidXQgYmVjYXVzZSBvZiBhIHN1cnBsdXMgb2YgZGFyayBwcm90b25zIG92ZXIgZGFyayBlbGVjdHJvbnMsIG9ubHkgYSB0aW55IGZyYWN0aW9uIGJlY29tZSBib3VuZCBpbiBhdG9tcyBhbmQgd2luZCB1cCBpbiBhIGRpc2suIEluIHRoYXQgY2FzZSwgdGhlIGRpc2sgYW5kIGhhbG8gd291bGQgYmUgbWFkZSBvZiB0aGUgc2FtZSBpbmdyZWRpZW50cywgJiN4MjAxQzt3aGljaCB3b3VsZCBiZSBtb3JlIGVjb25vbWljYWwsJiN4MjAxRDsgc2hlIHNhaWQuICYjeDIwMUM7V2UgdGhvdWdodCB0aGF0IHdvdWxkIGJlIHJ1bGVkIG91dCwgYnV0IGl0IHdhc24mI3gyMDE5O3QuJiN4MjAxRDs8L3A+XFxuPHA+VGhlIGRhcmsgZGlzayBzdXJ2aXZlcywgZm9yIG5vdyYjeDIwMTQ7YSBzeW1ib2wgb2YgYWxsIHRoYXQgaXNuJiN4MjAxOTt0IGtub3duIGFib3V0IHRoZSBkYXJrIHNpZGUgb2YgdGhlIHVuaXZlcnNlLiAmI3gyMDFDO0kgdGhpbmsgaXQmI3gyMDE5O3MgdmVyeSwgdmVyeSBoZWFsdGh5IGZvciB0aGUgZmllbGQgdGhhdCB5b3UgaGF2ZSBwZW9wbGUgdGhpbmtpbmcgYWJvdXQgYWxsIGtpbmRzIG9mIGRpZmZlcmVudCBpZGVhcywmI3gyMDFEOyBzYWlkIEJ1bGxvY2suICYjeDIwMUM7QmVjYXVzZSBpdCYjeDIwMTk7cyBxdWl0ZSB0cnVlIHRoYXQgd2UgZG9uJiN4MjAxOTt0IGtub3cgd2hhdCB0aGUgaGVjayB0aGF0IGRhcmsgbWF0dGVyIGlzLCBhbmQgeW91IG5lZWQgdG8gYmUgb3Blbi1taW5kZWQgYWJvdXQgaXQuJiN4MjAxRDs8L3A+XFxuPHA+PGVtPjxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnF1YW50YW1hZ2F6aW5lLm9yZy8yMDE2MDQxMi1kZWJhdGUtaW50ZW5zaWZpZXMtb3Zlci1kYXJrLWRpc2stdGhlb3J5L1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPk9yaWdpbmFsIHN0b3J5PC9hPiByZXByaW50ZWQgd2l0aCBwZXJtaXNzaW9uIGZyb20gPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cucXVhbnRhbWFnYXppbmUub3JnXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+UXVhbnRhIE1hZ2F6aW5lPC9hPiwgYW4gZWRpdG9yaWFsbHkgaW5kZXBlbmRlbnQgcHVibGljYXRpb24gb2YgdGhlIDxhIGhyZWY9XFxcImh0dHBzOi8vd3d3LnNpbW9uc2ZvdW5kYXRpb24ub3JnXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+U2ltb25zIEZvdW5kYXRpb248L2E+IHdob3NlIG1pc3Npb24gaXMgdG8gZW5oYW5jZSBwdWJsaWMgdW5kZXJzdGFuZGluZyBvZiBzY2llbmNlIGJ5IGNvdmVyaW5nIHJlc2VhcmNoIGRldmVsb3BtZW50cyBhbmQgdHJlbmRzIGluIG1hdGhlbWF0aWNzIGFuZCB0aGUgcGh5c2ljYWwgYW5kIGxpZmUgc2NpZW5jZXMuPC9lbT48L3A+XFxuXFxuXFx0XFx0XFx0PGEgY2xhc3M9XFxcInZpc3VhbGx5LWhpZGRlbiBza2lwLXRvLXRleHQtbGluayBmb2N1c2FibGUgYmctd2hpdGVcXFwiIGhyZWY9XFxcImh0dHA6Ly93d3cud2lyZWQuY29tLzIwMTYvMDYvZGViYXRlLWludGVuc2lmaWVzLWRhcmstZGlzay10aGVvcnkvI3N0YXJ0LW9mLWNvbnRlbnRcXFwiPkdvIEJhY2sgdG8gVG9wLiBTa2lwIFRvOiBTdGFydCBvZiBBcnRpY2xlLjwvYT5cXG5cXG5cXHRcXHRcXHRcXG5cXHRcXHQ8L2FydGljbGU+XFxuXFxuXFx0XFx0PC9kaXY+XCIsXHJcblx0XHRcImRhdGVQdWJsaXNoZWRcIjogXCIyMDE2LTA2LTA0IDAwOjAwOjAwXCIsXHJcblx0XHRcImRvbWFpblwiOiBcInd3dy53aXJlZC5jb21cIixcclxuXHRcdFwiZXhjZXJwdFwiOiBcIkluIDE5MzIsIHRoZSBEdXRjaCBhc3Ryb25vbWVyIEphbiBPb3J0IHRhbGxpZWQgdGhlIHN0YXJzIGluIHRoZSBNaWxreSBXYXkgYW5kIGZvdW5kIHRoYXQgdGhleSBjYW1lIHVwIHNob3J0LiBKdWRnaW5nIGJ5IHRoZSB3YXkgdGhlIHN0YXJzIGJvYiB1cCBhbmQgZG93biBsaWtlIGhvcnNlcyBvbiBhIGNhcm91c2VsIGFzIHRoZXkgZ28gYXJvdW5kJmhlbGxpcDtcIixcclxuXHRcdFwibGVhZEltYWdlVXJsXCI6IFwiaHR0cHM6Ly93d3cud2lyZWQuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE2LzA1LzA2MTAxNF9yYW5kYWxsXzE2MjdfMzEwNTc1XzkwNDUxOC02MTV4NDEwLTQ4MngzMjEuanBnXCIsXHJcblx0XHRcInRpdGxlXCI6IFwiQSBEaXNrIG9mIERhcmsgTWF0dGVyIE1pZ2h0IFJ1biBUaHJvdWdoIE91ciBHYWxheHlcIixcclxuXHRcdFwidXJsXCI6IFwiaHR0cDovL3d3dy53aXJlZC5jb20vMjAxNi8wNi9kZWJhdGUtaW50ZW5zaWZpZXMtZGFyay1kaXNrLXRoZW9yeS9cIixcclxuXHRcdFwiX2lkXCI6IFwiNTc1MmVlNTUyMmFmYjJkNDBiODVmMjY3XCJcclxuXHR9O1xyXG4iLCJhcHAuZmFjdG9yeSgnUGFnZXNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApe1xyXG5cdHZhciBQYWdlc0ZhY3RvcnkgPSB7fVxyXG5cclxuXHRQYWdlc0ZhY3RvcnkuZ2V0U2F2ZWQgPSBmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFnZXNcIilcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIFBhZ2VzRmFjdG9yeTtcclxufSkiLCJhcHAuZmFjdG9yeSgnUGFyc2VyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKXtcclxuXHJcblx0dmFyIFBhcnNlckZhY3RvcnkgPSB7fTtcclxuXHJcblx0UGFyc2VyRmFjdG9yeS5wYXJzZVVybCA9IGZ1bmN0aW9uKHVybCwgdXNlcmlkKSB7XHJcblxyXG5cdFx0dmFyIGVuY29kZWQgPSBlbmNvZGVVUklDb21wb25lbnQodXJsKTtcclxuXHRcdC8vY29uc29sZS5sb2coXCJlbmNvZGVkOiBcIiwgZW5jb2RlZCk7XHJcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KFwiL2FwaS9wYXJzZXIvXCIgKyBlbmNvZGVkKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcclxuXHRcdFx0Ly9yZXR1cm4gcmVzdWx0LmRhdGFcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcInBhcnNlciByZXN1bHQ6IFwiLCByZXN1bHQuZGF0YSk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLnVzZXJpZCA9IHVzZXJpZDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1c2VyaWQ6IFwiLCB1c2VyaWQpO1xyXG5cdFx0XHRyZXR1cm4gJGh0dHAucG9zdChcIi9hcGkvcGFnZXNcIiwgcmVzdWx0LmRhdGEpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhcInBvc3QgcmVzcG9uc2U6IFwiLCByZXNwb25zZS5kYXRhKTtcclxuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHRcdFx0fSlcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHJldHVybiBQYXJzZXJGYWN0b3J5O1xyXG5cclxufSk7XHJcbiIsImFwcC5kaXJlY3RpdmUoJ2FydGljbGVEZXRhaWwnLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgIHNjb3BlOiB7fSxcclxuICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL2FydGljbGVEZXRhaWxDYXJkL2RldGFpbC5odG1sJyxcclxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICB9XHJcbn0pXHJcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcclxuICAgIH07XHJcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2JpbmRDb21waWxlZEh0bWwnLCBbJyRjb21waWxlJywgZnVuY3Rpb24oJGNvbXBpbGUpIHtcclxuICByZXR1cm4ge1xyXG4gICAgdGVtcGxhdGU6ICc8ZGl2PjwvZGl2PicsXHJcbiAgICBzY29wZToge1xyXG4gICAgICByYXdIdG1sOiAnPWJpbmRDb21waWxlZEh0bWwnXHJcbiAgICB9LFxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0pIHtcclxuICAgICAgdmFyIGltZ3MgPSBbXTtcclxuICAgICAgc2NvcGUuJHdhdGNoKCdyYXdIdG1sJywgZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIG5ld0VsZW0gPSAkY29tcGlsZSh2YWx1ZSkoc2NvcGUuJHBhcmVudCk7XHJcbiAgICAgICAgZWxlbS5jb250ZW50cygpLnJlbW92ZSgpO1xyXG4gICAgICAgIGltZ3MgPSBuZXdFbGVtLmZpbmQoJ2ltZycpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgIGltZ3NbaV0uYWRkQ2xhc3MgPSAnZmxvYXRSaWdodCdcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlbS5hcHBlbmQobmV3RWxlbSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn1dKTtcclxuIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlLCAkbWRTaWRlbmF2LCAkbWRJbmtSaXBwbGUpIHtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgc2NvcGU6IHt9LFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXHJcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XHJcblxyXG4gICAgICAgICAgICBzY29wZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICRtZFNpZGVuYXYoXCJsZWZ0XCIpLnRvZ2dsZSgpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXHJcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcclxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQYXJzZXInLCBzdGF0ZTogJ3BhcnNlcicgfSxcclxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdQYWdlcycsIHN0YXRlOiAncGFnZXMnIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBzZXRVc2VyKCk7XHJcblxyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbn0pO1xyXG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcclxuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2lkZWJhcicsIGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHNjb3BlOiB7fSxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL3NpZGViYXIvc2lkZWJhci5odG1sJyxcclxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XHJcblx0XHQgICAgJChcIi5tZW51LXVwXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XHJcblx0XHQgICAgXHRpZigkKHRoaXMpLmNzcygndHJhbnNmb3JtJylcdCE9PSAnbm9uZScpe1xyXG5cdFx0ICAgIFx0XHQkKHRoaXMpLmNzcyhcInRyYW5zZm9ybVwiLCBcIlwiKTtcclxuXHRcdCAgICBcdFx0aWYoJCh0aGlzKS5hdHRyKCdpZCcpID09PSAnc3Vic2NyaXB0aW9ucy1pY29uJylcclxuXHRcdCAgICBcdFx0XHQkKCcjc3Vic2NyaXB0aW9ucycpLnNob3coNDAwKTtcclxuXHRcdCAgICBcdFx0aWYoJCh0aGlzKS5hdHRyKCdpZCcpID09PSAnZm9sZGVycy1pY29uJylcclxuXHRcdCAgICBcdFx0XHQkKCcjZm9sZGVycycpLnNob3coNDAwKTtcclxuXHRcdCAgICBcdH1cclxuXHRcdCAgICBcdGVsc2V7XHJcblx0XHRcdFx0XHQkKHRoaXMpLmNzcyhcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgxODBkZWcpXCIpO1xyXG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdzdWJzY3JpcHRpb25zLWljb24nKVxyXG5cdFx0ICAgIFx0XHRcdCQoJyNzdWJzY3JpcHRpb25zJykuaGlkZSg0MDApO1xyXG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdmb2xkZXJzLWljb24nKVxyXG5cdFx0ICAgIFx0XHRcdCQoJyNmb2xkZXJzJykuaGlkZSg0MDApO1x0XHRcdFx0XHJcblx0XHQgICAgXHR9XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdH1cclxuXHR9XHJcbn0pXHJcbiIsImFwcC5kaXJlY3RpdmUoJ3NwZWVkRGlhbCcsIGZ1bmN0aW9uICgkbWREaWFsb2cpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHNjb3BlOiB7fSxcclxuXHRcdHRlbXBsYXRlVXJsOiAnL2FwcC9jb21tb24vZGlyZWN0aXZlcy9zcGVlZC1kaWFsL3NwZWVkLWRpYWwuaHRtbCcsXHJcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZSkge1xyXG5cdFx0XHRzY29wZS5pc09wZW4gPSBmYWxzZTtcclxuXHRcdFx0c2NvcGUuY291bnQgPSAwO1xyXG5cdFx0XHRzY29wZS5oaWRkZW4gPSBmYWxzZTtcclxuXHRcdFx0c2NvcGUuaG92ZXIgPSBmYWxzZTtcclxuICAgICAgc2NvcGUuaXRlbXMgPSBbe1xyXG5cdFx0XHRcdG5hbWU6IFwiQWRkIFVSTFwiLFxyXG5cdFx0XHRcdGljb246IFwiL2ljb25zL2ljX2FkZF93aGl0ZV8zNnB4LnN2Z1wiLFxyXG5cdFx0XHRcdGRpcmVjdGlvbjogXCJ0b3BcIlxyXG5cdFx0XHR9LCB7XHJcblx0XHRcdFx0bmFtZTogXCJBZGQgQ2F0ZWdvcnlcIixcclxuXHRcdFx0XHRpY29uOiBcIi9pY29ucy9pY19wbGF5bGlzdF9hZGRfd2hpdGVfMzZweC5zdmdcIixcclxuXHRcdFx0XHRkaXJlY3Rpb246IFwidG9wXCJcclxuXHRcdFx0fV07XHJcblxyXG5cdFx0XHRzY29wZS5vcGVuRGlhbG9nID0gZnVuY3Rpb24oJGV2ZW50LCBpdGVtKSB7XHJcblx0XHRcdFx0JG1kRGlhbG9nLnNob3coe1xyXG5cdFx0XHRcdFx0Y2xpY2tPdXRTaWRlVG9DbG9zZTogdHJ1ZSxcclxuXHRcdFx0XHRcdGNvbnRyb2xsZXI6ICdkaWFsb2dGb3JtQ3RybCcsXHJcblx0XHRcdFx0XHR0ZW1wbGF0ZVVybDogJy9hcHAvcG9wdXAtZGlhbG9nL3BvcHVwLWRpYWxvZy5odG1sJyxcclxuXHRcdFx0XHRcdHRhcmdldEV2ZW50OiAkZXZlbnRcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cdH1cclxufSlcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
