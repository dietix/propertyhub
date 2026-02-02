import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { User, UserRole } from "../types";

interface AuthContextType {
  currentUser: SupabaseUser | null;
  session: Session | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrCreateUserData(user: SupabaseUser): Promise<User | null> {
    // Tenta buscar o usuário existente
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        role: data.role as UserRole,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } as User;
    }

    // Se não existe, cria o registro
    if (error?.code === "PGRST116") {
      const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Usuário";
      
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email!,
          display_name: displayName,
          role: "viewer",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating user record:", insertError);
        return null;
      }

      return {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.display_name,
        role: newUser.role as UserRole,
        createdAt: new Date(newUser.created_at),
        updatedAt: new Date(newUser.updated_at),
      } as User;
    }

    console.error("Error fetching user data:", error);
    return null;
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
  ) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setUserData(null);
  }

  function hasPermission(requiredRole: UserRole): boolean {
    if (!userData) return false;

    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      manager: 2,
      viewer: 1,
    };

    return roleHierarchy[userData.role] >= roleHierarchy[requiredRole];
  }

  useEffect(() => {
    // Busca sessão inicial

    supabase.auth.getSession().then(({ data: { session } }) => {
  console.log('aqui', session)

      setSession(session);
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        fetchOrCreateUserData(session.user).then((data) => {
          setUserData(data);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        const data = await fetchOrCreateUserData(session.user);
        setUserData(data);
      } else {
        setUserData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    session,
    userData,
    loading,
    login,
    register,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
