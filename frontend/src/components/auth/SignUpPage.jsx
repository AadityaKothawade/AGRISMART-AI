// components/auth/SignUpPage.jsx
import { SignUp } from "@clerk/clerk-react";
import "./Auth.css";

const SignUpPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">
            Or <a href="/sign-in" className="auth-link">sign in to existing account</a>
          </p>
        </div>
        <SignUp 
          routing="path" 
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
        />
      </div>
    </div>
  );
};

export default SignUpPage;