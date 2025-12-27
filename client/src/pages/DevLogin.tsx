/**
 * Development Login Page
 *
 * A simple login page for development that allows selecting from demo users.
 * This page is only available in development mode.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Shield, ShoppingCart, BarChart3, Loader2 } from "lucide-react";

interface DevUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="h-5 w-5" />,
  producer: <User className="h-5 w-5" />,
  buyer: <ShoppingCart className="h-5 w-5" />,
  analyst: <BarChart3 className="h-5 w-5" />,
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  producer: "bg-green-100 text-green-800",
  buyer: "bg-blue-100 text-blue-800",
  analyst: "bg-orange-100 text-orange-800",
};

export default function DevLogin() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<DevUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available dev users
    fetch("/api/dev-auth/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load dev users");
        setLoading(false);
        console.error(err);
      });
  }, []);

  const handleLogin = async (userId: number) => {
    setLoggingIn(userId);
    setError(null);

    try {
      const res = await fetch("/api/dev-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to dashboard after successful login
        setLocation("/");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Login request failed");
      console.error(err);
    } finally {
      setLoggingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ABFI Development Login
          </h1>
          <p className="text-gray-600">
            Select a demo user to test the platform
          </p>
          <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-800 border-yellow-200">
            Development Mode Only
          </Badge>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {users.map(user => (
            <Card
              key={user.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-gray-300"
              onClick={() => !loggingIn && handleLogin(user.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${roleColors[user.role] || "bg-gray-100"}`}>
                      {roleIcons[user.role] || <User className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                  <Badge className={roleColors[user.role]}>
                    {user.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  disabled={loggingIn !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogin(user.id);
                  }}
                >
                  {loggingIn === user.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>Login as {user.name.split(" ")[0]}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This login page is for development testing only.
          </p>
          <p className="mt-1">
            In production, users authenticate via OAuth.
          </p>
        </div>
      </div>
    </div>
  );
}
