import home from './components/home.js';
import login from './components/login.js';
import register from './components/register.js';
import navbar from './components/navbar.js';
import dash from './components/dash.js';
import adminDash from './components/adminDash.js';
import adminQuiz from './components/adminQuiz.js'; 

const routes = [
    { path: '/', component: home },
    { path: '/login', component: login },
    { path: '/register', component: register },
    { path: '/dash', component: dash, meta: { requiresAuth: true, role: "user" } },
    { path: '/admin', component: adminDash, meta: { requiresAuth: true, role: "admin" } },
    { path: '/admin/quizzes',component: adminQuiz,meta:{requiresAuth:true ,role: "admin"}}
];

const router = new VueRouter({
    routes: routes
});


router.beforeEach((to, from, next) => {
    const token = localStorage.getItem("auth_token");
    const role = localStorage.getItem("role");

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!token) {
            console.log("Unauthorized! Redirecting to login.");
            return next('/login'); 
        }

        if (to.meta.role && to.meta.role !== role) {
            console.log("Access Denied! Redirecting to home.");
            return next('/'); 
        }
    }
    
    next(); 
});

const app = new Vue({
    el: "#app",
    router: router,
    template: `
    <div class="container">
        <navi></navi>
        <router-view></router-view>
    </div>
    `,
    components: {
        "navi": navbar,
    }
});

export default router;
