import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("loggedInUser");
      if (stored && stored !== "undefined" && stored !== "null") {
        return JSON.parse(stored);
      }
    } catch (_) {}
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Sync latest user profile with backend on mount
  useEffect(() => {
    if (user?.user_name) {
      fetch(`${API_BASE_URL}/api/users/${user.user_name}`)
        .then((res) => {
          if (!res.ok) throw new Error("User not found");
          return res.json();
        })
        .then((fresh) => {
          if (fresh && fresh.user_name) {
            setUser((prev) => {
              const updated = { ...(prev || {}), ...fresh };
              localStorage.setItem("loggedInUser", JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailOrUsername, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Invalid credentials");
    }

    setUser(data.user);
    localStorage.setItem("loggedInUser", JSON.stringify(data.user));
    return data.user;
  };

  const register = async ({ user_name, email, password, title, location, bio, skills }) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name,
        email,
        password,
        title: title || "Full-Stack Developer",
        location: location || "Bengaluru, India",
        bio: bio || "Passionate developer building collaborative tools.",
        skills: skills || [],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // Automatically log in after registration
    return await login(email, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("loggedInUser");
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...updatedFields };
      localStorage.setItem("loggedInUser", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
