export default {
    template: `
    <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div class="container bg-white p-4 rounded shadow text-center" style="max-width: 400px;">
            <h2 class="mb-3"><i class="bi bi-person-plus-fill"></i> Register</h2>

            <div class="d-flex flex-column align-items-center">
                <div class="mb-3 text-start w-100">
                    <label for="email" class="form-label">Email ID:</label>
                    <input type="email" id="email" class="form-control" v-model="alldetails.email" required>
                </div>
                <div class="mb-3 text-start w-100">
                    <label for="password" class="form-label">Password:</label>
                    <input type="password" id="password" class="form-control" v-model="alldetails.password" required>
                </div>
                <div class="mb-3 text-start w-100">
                    <label for="username" class="form-label">Username:</label>
                    <input type="text" id="username" class="form-control" v-model="alldetails.username" required>
                </div>
                <div class="mb-3 text-start w-100">
                    <label for="qualification" class="form-label">Qualification:</label>
                    <input type="text" id="qualification" class="form-control" v-model="alldetails.qualification" required>
                </div>

                <button class="btn btn-primary" @click="registerfunc">Register</button>
            </div>

            <div class="mt-3">
                <p class="mb-0">Already have an account? <router-link class="nav-link" to="/login">Login</router-link></p>
            </div>


            <div v-if="errorMessage" class="alert alert-danger mt-3">{{ errorMessage }}</div>
        </div>
    </div>
    `,
    data() {
        return {
            alldetails: {
                email: "",
                password: "",
                username: "",
                qualification: ""
            },
            errorMessage: ""
        };
    },
    methods: {
        registerfunc() {
            if (!this.alldetails.email || !this.alldetails.password || 
                !this.alldetails.username || !this.alldetails.qualification) {
                this.errorMessage = "All fields are required!";
                return;
            }
    
            fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.alldetails)
            })
            .then(response => response.json().then(data => 
                ({ status: response.status, body: data }))) 
            .then(({ status, body }) => {
                console.log("Response received:", body);

                if (status === 201) { 
                    alert("Registration successful! Please login.");
                    this.$router.push('/login');
                } else { 
                    this.errorMessage = body.message || "Registration failed!";
                }
            })
            .catch(error => {
                this.errorMessage = "An error occurred. Please try again.";
            });
        }
    }
};
