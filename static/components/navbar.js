export default {
    template: `
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">Quiz</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                <div class="navbar-nav">
                    <router-link class="nav-link mx-2" to="/">Home</router-link>
                    <router-link class="nav-link mx-2" to="/login" v-if="!isLoggedIn">Login</router-link>
                    <router-link class="nav-link mx-2" to="/register" v-if="!isLoggedIn">Register</router-link>
                    
                    <!-- User Dashboard Link -->
                    <router-link class="nav-link mx-2" to="/dash" v-if="isUser">Dashboard</router-link>
                    
                    <!-- Admin Dashboard Link -->
                    <router-link class="nav-link mx-2" to="/admin" v-if="isAdmin">Admin Dashboard</router-link>
                    <router-link class="nav-link mx-2" to="/admin/quizzes" v-if="isAdmin">Quiz</router-link>


                    <button class="btn btn-sm btn-danger " @click="logout" v-if="isLoggedIn">Logout</button>
                </div>
            </div>
        </div>
    </nav>
    `,
    data() {
        return {
            isLoggedIn: false,
            isUser: false,
            isAdmin: false
        };
    },
    mounted() {
        window.addEventListener("storage", this.checkLoginStatus);
        this.checkLoginStatus();
    },
    beforeDestroy() {
        window.removeEventListener("storage", this.checkLoginStatus);
    },
    methods: {
        checkLoginStatus() {
            const token = localStorage.getItem("auth_token");
            const role = localStorage.getItem("role"); 

            if (!token || !role) {
                this.isLoggedIn = false;
                this.isUser = false;
                this.isAdmin = false;
                return;
            }

            this.isLoggedIn = true;
            this.isUser = role === "user";
            this.isAdmin = role === "admin";

        },
        logout() {
            fetch('/api/logout', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(() => {
                console.log("User logged out");
                localStorage.removeItem("auth_token");
                localStorage.removeItem("id");
                localStorage.removeItem("role");
                
                this.isLoggedIn = false;
                this.isUser = false;
                this.isAdmin = false;

                this.$router.push('/login');
            })
            .catch(error => console.error("Logout error:", error));
        }
    }
};
