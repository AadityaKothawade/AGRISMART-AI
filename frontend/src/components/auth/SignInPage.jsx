// components/auth/SignInPage.jsx
import { SignIn } from "@clerk/clerk-react";
import "./Auth.css";

const SignInPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2 className="auth-title">Sign in to your account</h2>
          <p className="auth-subtitle">
            Or <a href="/sign-up" className="auth-link">create a new account</a>
          </p>
        </div>
        <SignIn 
          routing="path" 
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
        />
      </div>
    </div>
  );
};

export default SignInPage;