export default {
    template: `
    <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div class="container bg-white p-4 text-center" style="max-width: 400px;">
            <h2 class="mb-3"><i class="bi bi-person-circle"></i> Login</h2>

            <div class="d-flex flex-column align-items-center">
                <div>
                    <div class="mb-3 text-start w-100">
                        <label for="email" class="form-label">Registered Email ID:</label>
                        <input type="text" id="email" class="form-control" v-model="alldetails.email" required>
                    </div>

                    <div class="mb-3 text-start w-100">
                        <label for="password" class="form-label">Password:</label>
                        <input type="password" id="password" class="form-control" v-model="alldetails.password" required>
                    </div>
                    <button class="btn btn-primary" @click="loginfunc">Login</button>
                    
                    <div v-if="errorMessage" class="alert alert-danger mt-3">{{ errorMessage }}</div>
                </div>
            </div>
            <div class="d-flex justify-content-between mt-3 w-100">
                <router-link class="nav-link" to="/register">Not a user? Click here to register</router-link>
            </div>
        </div>
    </div>
    `,
    data: function () {
        return {
            alldetails: {
                email: "",
                password: ""
            },
            errorMessage: ""
        };
    },
    methods: {
        loginfunc: function () {
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.alldetails)
            })
            .then(response => response.json())
            .then(data => {
                console.log("Response received:", data);
                
                if (data["auth-token"]) {
                    localStorage.setItem("auth_token", data["auth-token"]);
                    localStorage.setItem("id", data.id);
                    localStorage.setItem("role", data.roles[0]);

                    if (data.roles.includes("admin")) {
                        this.$router.push('/admin');
                    } else {
                        this.$router.push('/dash');
                    }
                } else {
                    this.errorMessage = "User not found or incorrect credentials.";
                }
            })
            .catch(error => {
                console.error("Login error:", error);
                this.errorMessage = "An error occurred. Please try again later.";
            });
        }
    }
};
